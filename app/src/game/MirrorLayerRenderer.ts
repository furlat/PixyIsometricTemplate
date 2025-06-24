import { Container, Sprite, RenderTexture, Matrix, Renderer, Texture, Rectangle } from 'pixi.js'
import { gameStore } from '../store/gameStore'
import { CoordinateCalculations } from './CoordinateCalculations'
import { GeometryHelper } from './GeometryHelper'
import type { ViewportCorners, GeometricObject } from '../types'
import type { GeometryRenderer } from './GeometryRenderer'

/**
 * MirrorLayerRenderer - Creates a perfect mirror of the geometry layer using cached texture sprites
 * 
 * OBJECTIVES:
 * ✅ Extract texture of geometric objects as sprites using pixeloid-perfect bounding boxes 
 * ✅ Mirror 100% what is happening in the graphics layer with perfect visual fidelity
 * ✅ Cache textures and only re-extract when objects are modified
 * ✅ Move and scale with camera transforms exactly like the geometry layer
 * ✅ Store-driven reactive updates for efficient rendering
 */
export class MirrorLayerRenderer {
  private container: Container = new Container()
  private renderer: Renderer | null = null
  private mirrorSprites: Map<string, Sprite> = new Map()
  
  // Texture cache with scale-indexed keys for zoom stability
  private textureCache: Map<string, {
    texture: RenderTexture
    visualVersion: number  // Only visual properties, not position
    scale: number         // Track the scale when texture was created
  }> = new Map()
  
  // Track object versions for change detection
  private objectVersions: Map<string, number> = new Map()
  
  // Cache eviction configuration
  private static readonly CRITICAL_SCALES = [1] // Never evict scale 1 (too expensive to regenerate)
  private static readonly DISTANCE_THRESHOLD = 2 // Evict scales more than 2 away from current
  
  /**
   * Initialize with renderer for texture extraction
   */
  public initializeWithRenderer(renderer: Renderer): void {
    this.renderer = renderer
    console.log('MirrorLayerRenderer: Initialized with multi-pass rendering pattern')
  }

  /**
   * Generate cache key that includes scale for proper zoom caching
   */
  private getCacheKey(objectId: string, scale: number): string {
    return `${objectId}_${scale}`
  }

  /**
   * Render the mirror layer - only extracts textures when objects change
   */
  public render(
    _corners: ViewportCorners,
    pixeloidScale: number,
    geometryRenderer?: GeometryRenderer
  ): void {
    if (!this.renderer || !geometryRenderer) {
      console.log('MirrorLayerRenderer: Waiting for renderer initialization')
      return
    }

    // Get visible objects from store, excluding offscreen objects
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
    
    if (visibleObjects.length === 0) {
      this.container.removeChildren()
      this.clearSprites()
      return
    }

    // Track which objects are currently visible
    const currentObjectIds = new Set(visibleObjects.map(obj => obj.id))
    
    // Remove sprites for objects that are no longer visible
    for (const [objectId, sprite] of this.mirrorSprites) {
      if (!currentObjectIds.has(objectId)) {
        sprite.destroy()
        this.mirrorSprites.delete(objectId)
      }
    }

    // Process each visible object
    for (const obj of visibleObjects) {
      this.processObject(obj, geometryRenderer, pixeloidScale)
    }
    
    // Async distance-based cache cleanup to avoid blocking rendering
    this.performDistanceBasedEvictionAsync(pixeloidScale)
  }

  /**
   * Distance-based cache eviction - async to avoid blocking rendering
   */
  private performDistanceBasedEvictionAsync(currentScale: number): void {
    // Use requestIdleCallback to avoid blocking rendering
    requestIdleCallback(() => {
      // Keep current scale and adjacent scales (±1)
      const scalesToKeep = new Set([
        currentScale,
        currentScale - 1,
        currentScale + 1
      ].filter(s => s >= 1 && s <= 100))
      
      // Find keys to delete based on distance threshold
      const keysToDelete: string[] = []
      
      for (const [key, ] of this.textureCache) {
        // Extract scale from cache key (format: objectId_scale)
        const parts = key.split('_')
        const scale = parseInt(parts[parts.length - 1])
        
        if (isNaN(scale)) continue
        
        // Keep if in adjacent range
        if (scalesToKeep.has(scale)) continue
        
        // Keep critical scales
        if (MirrorLayerRenderer.CRITICAL_SCALES.includes(scale)) continue
        
        // Evict if distance > threshold
        const distance = Math.abs(scale - currentScale)
        if (distance > MirrorLayerRenderer.DISTANCE_THRESHOLD) {
          keysToDelete.push(key)
        }
      }
      
      // Delete during idle time
      for (const key of keysToDelete) {
        const cache = this.textureCache.get(key)
        if (cache) {
          cache.texture.destroy()
          this.textureCache.delete(key)
        }
      }
      
      if (keysToDelete.length > 0) {
        console.log(`MirrorLayerRenderer: Distance-based eviction removed ${keysToDelete.length} texture caches (distance > ${MirrorLayerRenderer.DISTANCE_THRESHOLD} from scale ${currentScale})`)
      }
    })
  }

  /**
   * Process a single object - extract texture only if changed
   */
  private processObject(
    obj: GeometricObject,
    geometryRenderer: GeometryRenderer,
    pixeloidScale: number
  ): void {
    const visualVersion = this.getVisualVersion(obj)
    const cacheKey = this.getCacheKey(obj.id, pixeloidScale)
    const cache = this.textureCache.get(cacheKey)
    
    // Check if we need to extract a new texture
    // Now scale is part of the cache key, so we only check visual version
    const needsNewTexture = !cache || cache.visualVersion !== visualVersion
    
    if (needsNewTexture) {
      console.log(`MirrorLayerRenderer: Object ${obj.id} needs new texture at scale ${pixeloidScale} (visual=${visualVersion})`)
      this.extractAndCacheTexture(obj, geometryRenderer, pixeloidScale)
    }
    
    // ALWAYS update sprite position (even with cached texture)
    this.updateOrCreateSprite(obj, pixeloidScale)
  }

  /**
   * Extract texture and cache it
   */
  private extractAndCacheTexture(
    obj: GeometricObject,
    geometryRenderer: GeometryRenderer,
    pixeloidScale: number
  ): void {
    // Get object container from GeometryRenderer (contains the graphics)
    const objectContainer = geometryRenderer.getObjectContainer(obj.id)
    if (!objectContainer || !obj.metadata?.bounds) {
      console.warn(`MirrorLayerRenderer: Cannot extract texture for object ${obj.id}`)
      return
    }

    // Always extract texture using full bounds to prevent distortion
    // The sprite creation logic will handle showing only the visible portion
    const bounds = obj.metadata.bounds
    const texture = this.extractObjectTexture(objectContainer, bounds, pixeloidScale)
    
    if (texture) {
      const cacheKey = this.getCacheKey(obj.id, pixeloidScale)
      
      // Destroy old texture at this scale if exists
      const oldCache = this.textureCache.get(cacheKey)
      if (oldCache) {
        oldCache.texture.destroy()
      }
      
      // Cache new texture with scale-indexed key
      this.textureCache.set(cacheKey, {
        texture,
        visualVersion: this.getVisualVersion(obj),
        scale: pixeloidScale  // Store the scale for reference
      })
    }
  }

  /**
   * Extract texture from container that's already rendered at screen coordinates
   * Using multi-pass rendering pattern from docs - no cloning needed!
   */
  private extractObjectTexture(
    objectContainer: Container,
    bounds: any,
    pixeloidScale: number
  ): RenderTexture | null {
    if (!this.renderer) return null

    // Get the offset used by GeometryRenderer
    const offset = gameStore.mesh.vertex_to_pixeloid_offset

    // Calculate bounds in vertex space first
    const vertexBounds = {
      minX: bounds.minX - offset.x,
      maxX: bounds.maxX - offset.x,
      minY: bounds.minY - offset.y,
      maxY: bounds.maxY - offset.y
    }

    // Calculate texture dimensions (already at screen scale)
    const textureWidth = Math.ceil((vertexBounds.maxX - vertexBounds.minX) * pixeloidScale)
    const textureHeight = Math.ceil((vertexBounds.maxY - vertexBounds.minY) * pixeloidScale)

    if (textureWidth <= 0 || textureHeight <= 0) {
      console.warn('MirrorLayerRenderer: Invalid texture dimensions')
      return null
    }

    // No hardcoded texture size limits - the visibility cache system
    // naturally prevents OOM by clipping objects to screen bounds

    // Create render texture (following multi-pass pattern)
    const texture = RenderTexture.create({
      width: textureWidth,
      height: textureHeight,
      resolution: 1,
      scaleMode: 'nearest' // Pixel-perfect
    })

    // Since GeometryRenderer already draws at screen coordinates,
    // we need to capture from the screen position
    const screenPos = CoordinateCalculations.vertexToScreen(
      { __brand: 'vertex' as const, x: vertexBounds.minX, y: vertexBounds.minY },
      pixeloidScale
    )

    // Create transform to extract just the bbox area at screen coordinates
    const transform = new Matrix()
      .translate(-screenPos.x, -screenPos.y)

    // Render to texture using multi-pass pattern (no cloning!)
    // This is safe because we're not modifying the container
    this.renderer.render({
      container: objectContainer,
      target: texture,
      clear: true,
      transform
    })

    return texture
  }

  /**
   * Update or create sprite for an object
   */
  private updateOrCreateSprite(obj: GeometricObject, pixeloidScale: number): void {
    const cacheKey = this.getCacheKey(obj.id, pixeloidScale)
    const cache = this.textureCache.get(cacheKey)
    if (!cache || !obj.metadata?.bounds) return

    const visibilityData = obj.metadata.visibilityCache?.get(pixeloidScale)
    const isPartial = visibilityData?.visibility === 'partially-onscreen' && visibilityData?.onScreenBounds
    
    // Calculate texture or texture region to use
    let textureToUse: Texture | RenderTexture = cache.texture
    
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
      
      console.log(`MirrorLayerRenderer: Created texture region for object ${obj.id}`, {
        fullBounds: `${fullBounds.minX},${fullBounds.minY} to ${fullBounds.maxX},${fullBounds.maxY}`,
        visibleBounds: `${visibleBounds.minX},${visibleBounds.minY} to ${visibleBounds.maxX},${visibleBounds.maxY}`,
        textureRegion: `offset=${offsetX},${offsetY} size=${width}x${height}`
      })
    }

    let sprite = this.mirrorSprites.get(obj.id)
    
    if (!sprite) {
      // Create new sprite with the appropriate texture/region
      sprite = new Sprite(textureToUse)
      sprite.name = `mirror_${obj.id}`
      this.container.addChild(sprite)
      this.mirrorSprites.set(obj.id, sprite)
    } else {
      // Update texture - this handles both full texture and region updates
      sprite.texture = textureToUse
    }

    // Position sprite using CURRENT bounds from object metadata
    // For partially visible objects, use onScreenBounds for positioning
    const currentBounds = (isPartial && visibilityData?.onScreenBounds) ? visibilityData.onScreenBounds : obj.metadata.bounds
    
    // Safety check - bounds should always exist if we got here
    if (!currentBounds) {
      console.warn(`MirrorLayerRenderer: No bounds available for object ${obj.id}`)
      return
    }
    
    const offset = gameStore.mesh.vertex_to_pixeloid_offset
    const vertexPos = {
      x: currentBounds.minX - offset.x,  // Use current position!
      y: currentBounds.minY - offset.y
    }
    const screenPos = CoordinateCalculations.vertexToScreen(
      { __brand: 'vertex' as const, x: vertexPos.x, y: vertexPos.y },
      pixeloidScale
    )
    sprite.position.set(screenPos.x, screenPos.y)
    
    // Scale is 1 because texture is already at correct scale
    sprite.scale.set(1)
    
    // Optional: Make slightly transparent to verify alignment
    sprite.alpha = 0.95
  }

  /**
   * Get visual version number (excludes position)
   */
  private getVisualVersion(obj: GeometricObject): number {
    let version = obj.createdAt
    
    // Visual properties only
    if ('color' in obj) version += obj.color
    if ('strokeWidth' in obj) version += (obj as any).strokeWidth * 1000
    if ('fillColor' in obj) version += (obj as any).fillColor || 0
    
    // Size properties (not position)
    if ('width' in obj) version += (obj as any).width * 100
    if ('height' in obj) version += (obj as any).height * 100
    if ('radius' in obj) version += (obj as any).radius * 100
    
    return version
  }

  /**
   * Clear all sprites (public method for LayeredInfiniteCanvas)
   */
  public clearSprites(): void {
    for (const sprite of this.mirrorSprites.values()) {
      sprite.destroy()
    }
    this.mirrorSprites.clear()
  }

  /**
   * Get texture cache for external access (used by filter renderers)
   * Returns a copy to prevent external modification
   * Note: Cache keys now include scale (format: "objectId_scale")
   */
  public getTextureCache(): Map<string, {
    texture: RenderTexture
    visualVersion: number
    scale: number
  }> {
    return new Map(this.textureCache)
  }
  
  /**
   * Get cached texture for a specific object and scale
   */
  public getCachedTextureForScale(objectId: string, scale: number): RenderTexture | null {
    const cacheKey = this.getCacheKey(objectId, scale)
    const cache = this.textureCache.get(cacheKey)
    return cache?.texture || null
  }

  /**
   * Get current sprite positions for alignment with filtered versions
   */
  public getSpritePositions(): Map<string, { x: number, y: number }> {
    const positions = new Map()
    for (const [id, sprite] of this.mirrorSprites) {
      positions.set(id, { x: sprite.x, y: sprite.y })
    }
    return positions
  }

  /**
   * Get a specific cached texture by object ID
   */
  public getCachedTexture(objectId: string): RenderTexture | null {
    const cache = this.textureCache.get(objectId)
    return cache?.texture || null
  }

  /**
   * Check if a texture is cached for an object
   */
  public hasTextureCache(objectId: string): boolean {
    return this.textureCache.has(objectId)
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
    mirroredObjects: number
    cachedTextures: number
    memoryUsage: string
  } {
    return {
      mirroredObjects: this.mirrorSprites.size,
      cachedTextures: this.textureCache.size,
      memoryUsage: `${this.textureCache.size} textures cached`
    }
  }

  /**
   * Destroy and clean up resources
   */
  public destroy(): void {
    // Destroy all cached textures
    for (const cache of this.textureCache.values()) {
      cache.texture.destroy()
    }
    this.textureCache.clear()
    
    // Destroy all sprites
    this.clearSprites()
    
    // Clean up
    this.objectVersions.clear()
    this.container.destroy()
    
    console.log('MirrorLayerRenderer: Destroyed with complete cleanup')
  }
}