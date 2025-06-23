import { Graphics, Container, Sprite, Texture, Renderer } from 'pixi.js'
import { PixelateFilter } from 'pixi-filters'
import { gameStore } from '../store/gameStore'
import { GeometryHelper } from './GeometryHelper'
import { GeometryRenderer } from './GeometryRenderer'
import type { ViewportCorners, GeometricObject, GeometricRectangle, GeometricCircle, GeometricLine, GeometricPoint, GeometricDiamond } from '../types'

/**
 * PixelateFilterRenderer handles pixeloid-perfect pixelate effects using GPU-accelerated PixelateFilter
 * Uses texture capture approach: captures geometry textures and applies pixelate filter to visible sprites
 * Creates actual visible pixelated overlays of geometry objects
 */
export class PixelateFilterRenderer {
  private container: Container = new Container()
  private pixelateFilter: PixelateFilter
  private objectSprites: Map<string, Sprite> = new Map()
  private objectTextures: Map<string, Texture> = new Map()
  private renderer!: Renderer
  private geometryRenderer!: GeometryRenderer
  private initialized = false

  constructor() {
    // Create GPU-accelerated pixelate filter with pixeloid-perfect configuration
    this.pixelateFilter = new PixelateFilter([
      gameStore.camera.pixeloid_scale,
      gameStore.camera.pixeloid_scale
    ])
    
    // Performance optimizations for pixelate filter
    this.pixelateFilter.padding = 0  // No extra padding needed for pixelation
    this.pixelateFilter.resolution = 1  // Full resolution for pixeloid-perfect quality
  }

  /**
   * Initialize with renderer and geometry renderer dependencies
   * Called after PIXI app is initialized
   */
  public init(renderer: Renderer, geometryRenderer: GeometryRenderer): void {
    this.renderer = renderer
    this.geometryRenderer = geometryRenderer
    this.initialized = true
    console.log('PixelateFilterRenderer: Initialized with renderer and geometry renderer')
  }

  /**
   * Render pixeloid-perfect pixelate effects using texture capture and sprites
   * Captures geometry textures and creates visible pixelated sprites
   */
  public render(corners: ViewportCorners, pixeloidScale: number): void {
    // Check if renderer has been initialized
    if (!this.initialized) {
      console.warn('PixelateFilterRenderer: Not initialized, skipping render')
      return
    }

    // Clear previous sprites
    this.container.removeChildren()
    this.clearOldSprites()

    // Check if pixelate filter is enabled
    if (!gameStore.geometry.filterEffects.pixelate) {
      return // Pixelate filter disabled
    }

    // Update pixelate filter scale for pixeloid-perfect alignment
    this.updatePixelateFilterScale(pixeloidScale)

    // Get visible objects (same data access as SelectionFilterRenderer)
    const visibleObjects = gameStore.geometry.objects.filter(obj => 
      obj.isVisible && this.isObjectInViewport(obj, corners)
    )

    // Create pixelated sprites for each visible object
    for (const obj of visibleObjects) {
      const pixelatedSprite = this.createPixelatedSprite(obj)
      if (pixelatedSprite) {
        this.container.addChild(pixelatedSprite)
      }
    }

    console.log(`PixelateFilterRenderer: Created ${this.container.children.length} pixelated sprites with visible effects`)
  }

  /**
   * Update pixelate filter scale for pixeloid-perfect alignment
   */
  private updatePixelateFilterScale(pixeloidScale: number): void {
    this.pixelateFilter.size = [pixeloidScale, pixeloidScale]
    console.log(`PixelateFilterRenderer: Updated filter size to ${pixeloidScale}x${pixeloidScale} for perfect pixeloid alignment`)
  }

  /**
   * Create pixelated sprite by capturing geometry texture and applying filter
   */
  private createPixelatedSprite(obj: GeometricObject): Sprite | null {
    if (!obj.metadata) {
      console.warn(`PixelateFilterRenderer: Object ${obj.id} missing metadata - skipping`)
      return null
    }

    // Get or create texture for this object
    let texture = this.objectTextures.get(obj.id)
    
    if (!texture) {
      const capturedTexture = this.captureGeometryTexture(obj)
      if (!capturedTexture) {
        console.warn(`PixelateFilterRenderer: Failed to capture texture for object ${obj.id}`)
        return null
      }
      
      texture = capturedTexture
      // Cache the texture for reuse (performance optimization)
      this.objectTextures.set(obj.id, texture)
    }

    // Create sprite with the captured geometry texture
    const sprite = new Sprite(texture)
    
    // Apply pixelate filter to the visible sprite
    sprite.filters = [this.pixelateFilter]
    
    // Position sprite directly at bbox bounds (no offset conversion - avoid double positioning)
    sprite.position.set(
      obj.metadata.bounds.minX,  // Direct pixeloid coordinates
      obj.metadata.bounds.minY   // Camera transform handles coordinate conversion
    )

    // Store sprite for cleanup
    this.objectSprites.set(obj.id, sprite)

    console.log(`PixelateFilterRenderer: Created pixelated sprite for object ${obj.id}`)
    return sprite
  }

  /**
   * Capture geometry texture from raw graphics with tight bounds
   * Uses graphics directly to avoid positioning and transparency issues
   */
  private captureGeometryTexture(obj: GeometricObject): Texture | null {
    // Get the raw graphics from GeometryRenderer (no container positioning)
    const graphics = this.geometryRenderer.getObjectGraphics(obj.id)
    if (!graphics) {
      console.warn(`PixelateFilterRenderer: No graphics found for object ${obj.id}`)
      return null
    }

    try {
      // Capture the graphics content (tight bounds handled by graphics.getLocalBounds() internally)
      const texture = this.renderer.generateTexture(graphics)
      console.log(`PixelateFilterRenderer: Captured texture for object ${obj.id} from graphics`)
      return texture
    } catch (error) {
      console.error(`PixelateFilterRenderer: Failed to generate texture for object ${obj.id}:`, error)
      return null
    }
  }

  /**
   * Clean up old sprites for performance
   */
  private clearOldSprites(): void {
    for (const sprite of this.objectSprites.values()) {
      sprite.destroy()
    }
    this.objectSprites.clear()
  }

  /**
   * Update texture cache - remove textures for deleted objects
   */
  private updateTextureCache(): void {
    const currentObjectIds = new Set(gameStore.geometry.objects.map(obj => obj.id))
    
    // Remove textures for deleted objects
    for (const [objectId, texture] of this.objectTextures) {
      if (!currentObjectIds.has(objectId)) {
        texture.destroy()
        this.objectTextures.delete(objectId)
        console.log(`PixelateFilterRenderer: Removed texture for deleted object ${objectId}`)
      }
    }
  }

  /**
   * Force texture refresh when geometry changes
   */
  public refreshObjectTexture(objectId: string): void {
    const oldTexture = this.objectTextures.get(objectId)
    if (oldTexture) {
      oldTexture.destroy()
      this.objectTextures.delete(objectId)
      console.log(`PixelateFilterRenderer: Refreshed texture for object ${objectId}`)
    }
    // New texture will be generated on next render
  }

  /**
   * Check if object is within viewport for culling (same logic as SelectionFilterRenderer)
   */
  private isObjectInViewport(obj: GeometricObject, corners: ViewportCorners): boolean {
    const padding = 50 // pixeloids
    const viewportLeft = corners.topLeft.x - padding
    const viewportRight = corners.bottomRight.x + padding
    const viewportTop = corners.topLeft.y - padding
    const viewportBottom = corners.bottomRight.y + padding

    // Check bounds based on object type (same logic as SelectionFilterRenderer)
    if ('anchorX' in obj && 'anchorY' in obj) {
      const diamond = obj as GeometricDiamond
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
    } else if ('width' in obj && 'height' in obj) {
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
    } else if ('startX' in obj && 'endX' in obj) {
      const line = obj as GeometricLine
      const minX = Math.min(line.startX, line.endX)
      const maxX = Math.max(line.startX, line.endX)
      const minY = Math.min(line.startY, line.endY)
      const maxY = Math.max(line.startY, line.endY)
      return !(
        maxX < viewportLeft ||
        minX > viewportRight ||
        maxY < viewportTop ||
        minY > viewportBottom
      )
    } else if ('x' in obj && 'y' in obj) {
      const point = obj as GeometricPoint
      return !(
        point.x < viewportLeft ||
        point.x > viewportRight ||
        point.y < viewportTop ||
        point.y > viewportBottom
      )
    }

    return true
  }

  /**
   * Get the container for adding to layer
   */
  public getContainer(): Container {
    return this.container
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    // Clean up texture cache
    this.updateTextureCache()
    
    // Destroy remaining textures
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