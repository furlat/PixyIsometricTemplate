import { Container, Sprite, RenderTexture, Matrix, Renderer } from 'pixi.js'
import { gameStore } from '../store/gameStore'
import { CoordinateCalculations } from './CoordinateCalculations'
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
  
  // Texture cache with scale tracking
  private textureCache: Map<string, {
    texture: RenderTexture
    visualVersion: number  // Only visual properties, not position
    scale: number         // Track the scale when texture was created
  }> = new Map()
  
  // Track object versions for change detection
  private objectVersions: Map<string, number> = new Map()
  
  /**
   * Initialize with renderer for texture extraction
   */
  public initializeWithRenderer(renderer: Renderer): void {
    this.renderer = renderer
    console.log('MirrorLayerRenderer: Initialized with multi-pass rendering pattern')
  }

  /**
   * Render the mirror layer - only extracts textures when objects change
   */
  public render(
    corners: ViewportCorners,
    pixeloidScale: number,
    geometryRenderer?: GeometryRenderer
  ): void {
    if (!this.renderer || !geometryRenderer) {
      console.log('MirrorLayerRenderer: Waiting for renderer initialization')
      return
    }

    // Get visible objects from store
    const visibleObjects = gameStore.geometry.objects.filter(obj => obj.isVisible)
    
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
    const cache = this.textureCache.get(obj.id)
    
    // Check if we need to extract a new texture
    const needsNewTexture = !cache ||
                           cache.visualVersion !== visualVersion ||
                           cache.scale !== pixeloidScale
    
    if (needsNewTexture) {
      console.log(`MirrorLayerRenderer: Object ${obj.id} needs new texture (visual=${visualVersion}, scale=${pixeloidScale})`)
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

    // Extract texture in the same coordinate space as GeometryRenderer
    const bounds = obj.metadata.bounds
    const texture = this.extractObjectTexture(objectContainer, bounds, pixeloidScale)
    
    if (texture) {
      // Destroy old texture if exists
      const oldCache = this.textureCache.get(obj.id)
      if (oldCache) {
        oldCache.texture.destroy()
      }
      
      // Cache new texture with scale tracking
      this.textureCache.set(obj.id, {
        texture,
        visualVersion: this.getVisualVersion(obj),
        scale: pixeloidScale  // Store the scale
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
    const cache = this.textureCache.get(obj.id)
    if (!cache || !obj.metadata?.bounds) return

    let sprite = this.mirrorSprites.get(obj.id)
    
    if (!sprite) {
      // Create new sprite
      sprite = new Sprite(cache.texture)
      sprite.name = `mirror_${obj.id}`
      this.container.addChild(sprite)
      this.mirrorSprites.set(obj.id, sprite)
    } else {
      // Update texture if changed
      if (sprite.texture !== cache.texture) {
        sprite.texture = cache.texture
      }
    }

    // Position sprite using CURRENT bounds from object metadata
    const currentBounds = obj.metadata.bounds
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
   * Get full version including position (kept for compatibility)
   */
  private getFullObjectVersion(obj: GeometricObject): number {
    // For now, use a combination of properties that affect rendering
    // In the future, this should be a proper version number from the store
    let version = obj.createdAt
    
    // Add visual properties to version calculation
    if ('color' in obj) version += obj.color
    if ('strokeWidth' in obj) version += (obj as any).strokeWidth * 1000
    if ('fillColor' in obj) version += (obj as any).fillColor || 0
    if ('x' in obj) version += (obj as any).x * 10
    if ('y' in obj) version += (obj as any).y * 10
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