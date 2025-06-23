import { Graphics, Container, Sprite, Texture, Renderer } from 'pixi.js'
import { gameStore, updateGameStore } from '../store/gameStore'
import { GeometryHelper } from './GeometryHelper'
import { GeometryRenderer } from './GeometryRenderer'
import type { ViewportCorners, GeometricObject, GeometricRectangle, GeometricCircle, GeometricLine, GeometricPoint, GeometricDiamond } from '../types'

/**
 * BboxTextureTestRenderer creates sprites that exactly match bounding box dimensions
 * Purpose: Perfect mirror of geometry layer - NO FILTERS, just bbox-sized sprites for overlap testing
 */
export class BboxTextureTestRenderer {
  private container: Container = new Container()
  private bboxSprites: Map<string, Sprite> = new Map()
  private renderer!: Renderer
  private geometryRenderer!: GeometryRenderer
  private initialized = false

  constructor() {
    // No filters needed - pure geometry mirror
    // No local texture management - using store
  }

  /**
   * Initialize with renderer and geometry renderer dependencies
   */
  public init(renderer: Renderer, geometryRenderer: GeometryRenderer): void {
    this.renderer = renderer
    this.geometryRenderer = geometryRenderer
    this.initialized = true
    console.log('BboxTextureTestRenderer: Initialized with dependencies')
  }

  /**
   * Render bbox-exact sprites for perfect overlap testing
   */
  public render(corners: ViewportCorners, pixeloidScale: number): void {
    if (!this.initialized) {
      console.warn('BboxTextureTestRenderer: Not initialized, skipping render')
      return
    }

    // Clear previous sprites
    this.container.removeChildren()
    this.clearOldSprites()

    // Get visible objects
    const visibleObjects = gameStore.geometry.objects.filter(obj => 
      obj.isVisible && obj.metadata && this.isObjectInViewport(obj, corners)
    )

    // Create bbox-exact sprites for each object
    for (const obj of visibleObjects) {
      const bboxSprite = this.createBboxTextureSprite(obj)
      if (bboxSprite) {
        this.container.addChild(bboxSprite)
      }
    }

    console.log(`BboxTextureTestRenderer: Created ${this.container.children.length} bbox sprites`)
  }

  /**
   * Create simple colored rectangle that exactly matches bounding box dimensions
   */
  private createBboxTextureSprite(obj: GeometricObject): Sprite | null {
    if (!obj.metadata) {
      console.warn(`BboxTextureTestRenderer: Object ${obj.id} missing metadata`)
      return null
    }

    // Get exact bbox dimensions
    const bounds = obj.metadata.bounds
    const width = bounds.maxX - bounds.minX
    const height = bounds.maxY - bounds.minY

    // Create simple colored rectangle graphics
    const graphics = new Graphics()
    graphics.rect(0, 0, width, height)
    graphics.fill({ color: 0xff0000, alpha: 0.3 }) // Semi-transparent red for testing

    // Create texture from graphics
    const texture = this.renderer.generateTexture(graphics)
    const sprite = new Sprite(texture)

    // Use vertex coordinates (same as GeometryRenderer)
    const offset = gameStore.mesh.vertex_to_pixeloid_offset
    const vertexX = bounds.minX - offset.x
    const vertexY = bounds.minY - offset.y
    sprite.position.set(vertexX, vertexY)

    // Store for cleanup
    this.bboxSprites.set(obj.id, sprite)

    console.log(`BboxTextureTestRenderer: Created bbox sprite for ${obj.id} at vertex (${vertexX}, ${vertexY}) size ${width}x${height}`)
    return sprite
  }

  /**
   * Clean up old sprites
   */
  private clearOldSprites(): void {
    for (const sprite of this.bboxSprites.values()) {
      sprite.destroy()
    }
    this.bboxSprites.clear()
  }

  /**
   * Check if object is within viewport (same as other renderers)
   */
  private isObjectInViewport(obj: GeometricObject, corners: ViewportCorners): boolean {
    const padding = 50
    const viewportLeft = corners.topLeft.x - padding
    const viewportRight = corners.bottomRight.x + padding
    const viewportTop = corners.topLeft.y - padding
    const viewportBottom = corners.bottomRight.y + padding

    if ('width' in obj && 'height' in obj) {
      const rect = obj as GeometricRectangle
      return !(
        rect.x + rect.width < viewportLeft ||
        rect.x > viewportRight ||
        rect.y + rect.height < viewportTop ||
        rect.y > viewportBottom
      )
    } else if ('radius' in obj) {
      const circle = obj as GeometricCircle
      return !(
        circle.centerX + circle.radius < viewportLeft ||
        circle.centerX - circle.radius > viewportRight ||
        circle.centerY + circle.radius < viewportTop ||
        circle.centerY - circle.radius > viewportBottom
      )
    } else if ('anchorX' in obj && 'anchorY' in obj) {
      const diamond = obj as unknown as GeometricDiamond
      const vertices = GeometryHelper.calculateDiamondVertices(diamond)
      const bounds = {
        left: Math.min(vertices.west.x, vertices.east.x, vertices.north.x, vertices.south.x),
        right: Math.max(vertices.west.x, vertices.east.x, vertices.north.x, vertices.south.x),
        top: Math.min(vertices.west.y, vertices.east.y, vertices.north.y, vertices.south.y),
        bottom: Math.max(vertices.west.y, vertices.east.y, vertices.north.y, vertices.south.y)
      }
      return !(
        bounds.right < viewportLeft ||
        bounds.left > viewportRight ||
        bounds.bottom < viewportTop ||
        bounds.top > viewportBottom
      )
    }

    return true
  }

  /**
   * Get container for layer
   */
  public getContainer(): Container {
    return this.container
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    // Clean up sprites (textures are managed by store)
    this.clearOldSprites()

    // Destroy container
    this.container.destroy()
  }
}