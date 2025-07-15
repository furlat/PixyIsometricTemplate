import { Container, Sprite, Rectangle, Texture } from 'pixi.js'
import { PixelateFilter } from 'pixi-filters'
import { gameStore } from '../store/gameStore'
import { CoordinateCalculations } from './CoordinateCalculations'
import { CoordinateHelper } from './CoordinateHelper'
import { GeometryHelper } from './GeometryHelper'
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
    
    // Get visible objects from store for positioning, excluding offscreen objects
    const visibleObjects = gameStore.geometry.objects.filter(obj => {
      if (!obj.isVisible || !obj.metadata) return false
      
      // Get visibility from scale-indexed cache
      const visibilityData = obj.metadata.visibilityCache?.get(pixeloidScale)
      
      if (!visibilityData) {
        // Calculate and cache if not present
        if (!obj.metadata.visibilityCache) {
          obj.metadata.visibilityCache = new Map()
        }
        
        const visibilityInfo = GeometryHelper.calculateVisibilityState(obj, pixeloidScale)
        obj.metadata.visibilityCache.set(pixeloidScale, {
          visibility: visibilityInfo.visibility,
          onScreenBounds: visibilityInfo.onScreenBounds
        })
        
        return visibilityInfo.visibility !== 'offscreen'
      }
      
      return visibilityData.visibility !== 'offscreen'
    })
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
      // Cache key now includes scale (format: "objectId_scale")
      const cacheKey = `${obj.id}_${pixeloidScale}`
      const cache = textureCache.get(cacheKey)
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
      
      // Set filterArea to prevent pixel bleeding AND OOM
      const bounds = obj.metadata.bounds
      const rawWidth = (bounds.maxX - bounds.minX) * pixeloidScale
      const rawHeight = (bounds.maxY - bounds.minY) * pixeloidScale

      // 🚨 CONSTRAIN INDIVIDUAL FILTER AREAS to screen bounds to prevent GPU OOM
      const safeWidth = Math.min(rawWidth, gameStore.windowWidth)
      const safeHeight = Math.min(rawHeight, gameStore.windowHeight)
      spriteContainer.filterArea = new Rectangle(0, 0, safeWidth, safeHeight)

      // Debug logging when we constrain large filter areas
      if (rawWidth > gameStore.windowWidth || rawHeight > gameStore.windowHeight) {
        console.warn(`PixelateFilter OOM Prevention: Constrained filterArea from ${rawWidth}x${rawHeight} to ${safeWidth}x${safeHeight}`)
      }
      
      // Calculate texture or texture region to use
      let textureToUse: Texture | any = cache.texture
      
      // Check if we need to create a texture region for partially visible objects
      const visibilityData = obj.metadata.visibilityCache?.get(pixeloidScale)
      const isPartial = visibilityData?.visibility === 'partially-onscreen' && visibilityData?.onScreenBounds
      
      if (isPartial && visibilityData?.onScreenBounds) {
        const fullBounds = obj.metadata.bounds
        const visibleBounds = visibilityData.onScreenBounds
        
        // Calculate offset within the texture (in screen pixels)
        const offsetX = (visibleBounds.minX - fullBounds.minX) * pixeloidScale
        const offsetY = (visibleBounds.minY - fullBounds.minY) * pixeloidScale
        const width = (visibleBounds.maxX - visibleBounds.minX) * pixeloidScale
        const height = (visibleBounds.maxY - visibleBounds.minY) * pixeloidScale
        
        // Create texture region for the visible portion
        const frame = new Rectangle()
        frame.x = offsetX
        frame.y = offsetY
        frame.width = width
        frame.height = height
        
        textureToUse = new Texture({
          source: cache.texture.source,
          frame: frame
        })
        
        console.log(`PixelateFilterRenderer: Created texture region for object ${obj.id}`, {
          fullBounds: `${fullBounds.minX},${fullBounds.minY} to ${fullBounds.maxX},${fullBounds.maxY}`,
          visibleBounds: `${visibleBounds.minX},${visibleBounds.minY} to ${visibleBounds.maxX},${visibleBounds.maxY}`,
          textureRegion: `offset=${offsetX},${offsetY} size=${width}x${height}`
        })
      }
      
      // Get or create sprite
      let sprite = this.pixelateSprites.get(obj.id)
      
      if (!sprite) {
        // Create new sprite with the appropriate texture/region
        sprite = new Sprite(textureToUse)
        sprite.name = `pixelated_${obj.id}`
        spriteContainer.addChild(sprite)
        this.pixelateSprites.set(obj.id, sprite)
      } else {
        // Update texture - this handles both full texture and region updates
        sprite.texture = textureToUse
        // Ensure sprite is in correct container
        if (sprite.parent !== spriteContainer) {
          sprite.parent?.removeChild(sprite)
          spriteContainer.addChild(sprite)
        }
      }
      
      // EXACT SAME POSITIONING AS MIRROR LAYER
      // Step 1: Get bounds from object metadata (pixeloid coordinates)
      // For partially visible objects, use onScreenBounds for positioning
      const currentBounds = (isPartial && visibilityData?.onScreenBounds) ? visibilityData.onScreenBounds : obj.metadata.bounds
      
      // Safety check - bounds should always exist if we got here
      if (!currentBounds) {
        console.warn(`PixelateFilterRenderer: No bounds available for object ${obj.id}`)
        continue
      }
      
      const offset = CoordinateHelper.getCurrentOffset()
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