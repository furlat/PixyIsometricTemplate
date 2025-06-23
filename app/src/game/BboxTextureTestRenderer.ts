import { Graphics, Container, Sprite, Texture, Renderer } from 'pixi.js'
import { gameStore } from '../store/gameStore'
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
  private objectTextures: Map<string, Texture> = new Map()
  private renderer!: Renderer
  private geometryRenderer!: GeometryRenderer
  private initialized = false

  constructor() {
    // No filters needed - pure geometry mirror
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
   * Create sprite that exactly matches bounding box dimensions
   */
  private createBboxTextureSprite(obj: GeometricObject): Sprite | null {
    if (!obj.metadata) {
      console.warn(`BboxTextureTestRenderer: Object ${obj.id} missing metadata`)
      return null
    }

    // 1. Get exact bbox dimensions
    const bounds = obj.metadata.bounds
    const width = bounds.maxX - bounds.minX
    const height = bounds.maxY - bounds.minY

    // 2. Capture texture from geometry
    let texture = this.objectTextures.get(obj.id)
    if (!texture) {
      const capturedTexture = this.captureGeometryTexture(obj)
      if (!capturedTexture) {
        console.warn(`BboxTextureTestRenderer: Failed to capture texture for object ${obj.id}`)
        return null
      }
      texture = capturedTexture
      this.objectTextures.set(obj.id, texture)
    }

    // 3. Create sprite with captured texture
    const sprite = new Sprite(texture)

    // 4. Set sprite to EXACT bbox dimensions (this is the key!)
    sprite.width = width
    sprite.height = height

    // 5. Position sprite at bbox origin (exact overlap)
    sprite.position.set(bounds.minX, bounds.minY)

    // 6. NO FILTERS - pure geometry mirror for perfect overlap testing

    // Store for cleanup
    this.bboxSprites.set(obj.id, sprite)

    console.log(`BboxTextureTestRenderer: Created bbox sprite for ${obj.id} at (${bounds.minX}, ${bounds.minY}) size ${width}x${height}`)
    return sprite
  }

  /**
   * Capture geometry texture (same method as PixelateFilterRenderer)
   */
  private captureGeometryTexture(obj: GeometricObject): Texture | null {
    const graphics = this.geometryRenderer.getObjectGraphics(obj.id)
    if (!graphics) {
      console.warn(`BboxTextureTestRenderer: No graphics found for object ${obj.id}`)
      return null
    }

    try {
      const texture = this.renderer.generateTexture(graphics)
      console.log(`BboxTextureTestRenderer: Captured texture for object ${obj.id}`)
      return texture
    } catch (error) {
      console.error(`BboxTextureTestRenderer: Failed to generate texture for object ${obj.id}:`, error)
      return null
    }
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
    // Clean up textures
    for (const texture of this.objectTextures.values()) {
      texture.destroy()
    }
    this.objectTextures.clear()

    // Clean up sprites
    this.clearOldSprites()

    // Destroy container
    this.container.destroy()
  }
}