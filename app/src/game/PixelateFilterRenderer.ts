import { Container, Sprite, Rectangle } from 'pixi.js'
import { PixelateFilter } from 'pixi-filters'
import { gameStore } from '../store/gameStore'
import { CoordinateCalculations } from './CoordinateCalculations'
import type { ViewportCorners } from '../types'
import type { MirrorLayerRenderer } from './MirrorLayerRenderer'

/**
 * PixelateFilterRenderer - Applies pixeloid-perfect pixelation to mirror layer textures
 *
 * ARCHITECTURE:
 * - Reads textures from MirrorLayerRenderer's cache
 * - Creates individual containers per sprite to prevent bleeding
 * - Each container has its own filterArea to constrain pixel sampling
 * - Shares ONE PixelateFilter instance for performance
 *
 * COORDINATE FLOW:
 * 1. Object bounds (pixeloid) → subtract offset → vertex coordinates
 * 2. Vertex coordinates → multiply by scale → screen coordinates
 */
export class PixelateFilterRenderer {
  private container: Container = new Container()
  private pixelateFilter: PixelateFilter
  private objectContainers: Map<string, Container> = new Map()
  private pixelateSprites: Map<string, Sprite> = new Map()
  
  constructor() {
    // Create ONE shared filter instance for performance
    this.pixelateFilter = new PixelateFilter(10)
    
    console.log('PixelateFilterRenderer: Initialized with individual containers per sprite')
  }

  /**
   * Render pixelated sprites with individual containers to prevent bleeding
   */
  public render(
    _corners: ViewportCorners,
    pixeloidScale: number,
    mirrorRenderer?: MirrorLayerRenderer
  ): void {
    if (!mirrorRenderer) {
      console.warn('PixelateFilterRenderer: No mirror renderer provided')
      return
    }

    // Update pixel size to match pixeloid scale
    this.pixelateFilter.size = pixeloidScale
    
    // Get texture cache from mirror renderer
    const textureCache = mirrorRenderer.getTextureCache()
    
    // Get visible objects from store for positioning
    const visibleObjects = gameStore.geometry.objects.filter(obj => obj.isVisible)
    const visibleObjectIds = new Set(visibleObjects.map(obj => obj.id))
    
    // Remove containers for objects no longer visible
    for (const [objectId, container] of this.objectContainers) {
      if (!visibleObjectIds.has(objectId)) {
        container.destroy()
        this.objectContainers.delete(objectId)
        this.pixelateSprites.delete(objectId)
      }
    }
    
    // Process each visible object that has a cached texture
    for (const obj of visibleObjects) {
      const cache = textureCache.get(obj.id)
      if (!cache || !obj.metadata?.bounds) continue
      
      // Get or create individual container for this object
      let spriteContainer = this.objectContainers.get(obj.id)
      
      if (!spriteContainer) {
        // Create new container with filter
        spriteContainer = new Container()
        spriteContainer.filters = [this.pixelateFilter]
        this.container.addChild(spriteContainer)
        this.objectContainers.set(obj.id, spriteContainer)
      }
      
      // Set filterArea to prevent pixel bleeding
      const bounds = obj.metadata.bounds
      const width = (bounds.maxX - bounds.minX) * pixeloidScale
      const height = (bounds.maxY - bounds.minY) * pixeloidScale
      spriteContainer.filterArea = new Rectangle(0, 0, width, height)
      
      // Get or create sprite
      let sprite = this.pixelateSprites.get(obj.id)
      
      if (!sprite) {
        // Create new sprite from cached texture
        sprite = new Sprite(cache.texture)
        sprite.name = `pixelated_${obj.id}`
        spriteContainer.addChild(sprite)
        this.pixelateSprites.set(obj.id, sprite)
      } else {
        // Update texture if changed
        if (sprite.texture !== cache.texture) {
          sprite.texture = cache.texture
        }
        // Ensure sprite is in correct container
        if (sprite.parent !== spriteContainer) {
          sprite.parent?.removeChild(sprite)
          spriteContainer.addChild(sprite)
        }
      }
      
      // EXACT SAME POSITIONING AS MIRROR LAYER
      // Step 1: Get bounds from object metadata (pixeloid coordinates)
      const currentBounds = obj.metadata.bounds
      
      // Step 2: Convert to vertex coordinates by subtracting offset
      const offset = gameStore.mesh.vertex_to_pixeloid_offset
      const vertexPos = {
        x: currentBounds.minX - offset.x,
        y: currentBounds.minY - offset.y
      }
      
      // Step 3: Convert vertex to screen coordinates
      const screenPos = CoordinateCalculations.vertexToScreen(
        { __brand: 'vertex' as const, x: vertexPos.x, y: vertexPos.y },
        pixeloidScale
      )
      
      // Step 4: Position the CONTAINER (not the sprite)
      spriteContainer.position.set(screenPos.x, screenPos.y)
      
      // Sprite at origin within container
      sprite.position.set(0, 0)
      sprite.scale.set(1)
    }
  }

  /**
   * Get container for adding to scene
   */
  public getContainer(): Container {
    return this.container
  }

  /**
   * Get statistics for monitoring
   */
  public getStats(): {
    pixelatedSprites: number
  } {
    return {
      pixelatedSprites: this.pixelateSprites.size
    }
  }

  /**
   * Destroy and clean up resources
   */
  public destroy(): void {
    // Destroy all sprites
    for (const sprite of this.pixelateSprites.values()) {
      sprite.destroy()
    }
    this.pixelateSprites.clear()
    
    // Destroy all object containers
    for (const container of this.objectContainers.values()) {
      container.destroy()
    }
    this.objectContainers.clear()
    
    // Destroy filter
    this.pixelateFilter.destroy()
    
    // Destroy main container
    this.container.destroy()
    
    console.log('PixelateFilterRenderer: Destroyed')
  }
}