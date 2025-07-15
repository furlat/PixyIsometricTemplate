/**
 * Pure ECS Mirror Layer Store
 * 
 * Clean implementation following ECS principles:
 * - HAS camera viewport transforms (unlike data layer)
 * - COPIES textures from data layer (does NOT store geometry)
 * - WASD at zoom 1: INACTIVE, zoom 2+: moves camera viewport
 * - Texture cache with LRU/LFU eviction
 * - Pure ECS architecture with no legacy contamination
 */

import { 
  ECSMirrorLayer, 
  ECSMirrorLayerActions, 
  ZoomLevel,
  MirrorTexture,
  CameraViewport,
  CameraMovement,
  ZoomBehavior,
  ViewportTransform,
  createECSMirrorLayer,
  createMirrorTexture,
  updateZoomBehavior,
  isECSMirrorLayer,
  isZoomLevel,
  isMirrorTexture
} from '../types/ecs-mirror-layer'
import { 
  PixeloidCoordinate, 
  ECSBoundingBox,
  createPixeloidCoordinate,
  createECSBoundingBox
} from '../types/ecs-coordinates'

/**
 * Mirror layer statistics for debugging and monitoring.
 */
export interface MirrorLayerStats {
  zoomLevel: ZoomLevel
  cameraPosition: PixeloidCoordinate
  textureCacheSize: number
  cacheHitRate: number
  isWASDActive: boolean
  layerVisible: boolean
  lastUpdateTime: number
  memoryUsage: number
  texturesLoaded: number
  texturesEvicted: number
  renderTime: number
  batchQueueSize: number
}

/**
 * Pure ECS Mirror Layer Store
 * 
 * This is a clean, standalone implementation that follows pure ECS principles
 * for camera viewport transforms and texture display.
 */
export class ECSMirrorLayerStore {
  private mirrorLayer: ECSMirrorLayer
  private actions: ECSMirrorLayerActions

  constructor() {
    // Create pure ECS mirror layer
    this.mirrorLayer = createECSMirrorLayer()
    
    // Create actions that operate on the mirror layer
    this.actions = this.createActions()
  }

  // ================================
  // PUBLIC API
  // ================================

  /**
   * Get the current mirror layer state (immutable)
   */
  getMirrorLayer(): Readonly<ECSMirrorLayer> {
    return this.mirrorLayer
  }

  /**
   * Get the actions interface
   */
  getActions(): ECSMirrorLayerActions {
    return this.actions
  }

  /**
   * Get quick stats for debugging
   */
  getStats(): MirrorLayerStats {
    return {
      zoomLevel: this.mirrorLayer.zoomLevel,
      cameraPosition: this.mirrorLayer.cameraViewport.position,
      textureCacheSize: this.mirrorLayer.textureCache.size,
      cacheHitRate: this.mirrorLayer.performance.cacheHitRate,
      isWASDActive: this.mirrorLayer.zoomBehavior.wasdTarget === 'camera-viewport',
      layerVisible: this.mirrorLayer.display.isVisible,
      lastUpdateTime: this.mirrorLayer.display.lastUpdateTime,
      memoryUsage: this.mirrorLayer.performance.memoryUsage,
      texturesLoaded: this.mirrorLayer.performance.texturesLoaded,
      texturesEvicted: this.mirrorLayer.performance.texturesEvicted,
      renderTime: this.mirrorLayer.performance.renderTime,
      batchQueueSize: this.mirrorLayer.rendering.renderQueue.length
    }
  }

  // ================================
  // ACTIONS IMPLEMENTATION
  // ================================

  private createActions(): ECSMirrorLayerActions {
    return {
      // ================================
      // CAMERA VIEWPORT OPERATIONS (WASD at zoom 2+)
      // ================================
      updateCameraViewport: (position: PixeloidCoordinate) => {
        this.mirrorLayer.cameraViewport.position = position
        this.mirrorLayer.display.needsRedraw = true
        this.mirrorLayer.display.lastUpdateTime = Date.now()
        this.ensurePixelPerfectAlignment()
      },

      setCameraScale: (scale: number) => {
        this.mirrorLayer.cameraViewport.scale = scale
        this.mirrorLayer.display.needsRedraw = true
        this.ensurePixelPerfectAlignment()
      },

      setCameraRotation: (rotation: number) => {
        this.mirrorLayer.cameraViewport.rotation = rotation
        this.mirrorLayer.display.needsRedraw = true
      },

      // ================================
      // ZOOM OPERATIONS
      // ================================
      setZoomLevel: (level: ZoomLevel) => {
        if (!isZoomLevel(level)) {
          console.warn(`Invalid zoom level: ${level}`)
          return
        }

        const previousLevel = this.mirrorLayer.zoomLevel
        this.mirrorLayer.zoomLevel = level
        
        // Update zoom behavior rules
        this.mirrorLayer.zoomBehavior = updateZoomBehavior(level, this.mirrorLayer.zoomBehavior)
        
        // Handle zoom transition
        this.handleZoomTransition(previousLevel, level)
        
        // Update display
        this.mirrorLayer.display.needsRedraw = true
        this.mirrorLayer.display.lastUpdateTime = Date.now()
        this.mirrorLayer.display.layerVersion++
      },

      // ================================
      // CAMERA MOVEMENT OPERATIONS
      // ================================
      startPanning: (startPos: PixeloidCoordinate) => {
        this.mirrorLayer.camera.isPanning = true
        this.mirrorLayer.camera.panStart = startPos
        this.mirrorLayer.camera.velocity = createPixeloidCoordinate(0, 0)
      },

      updatePanning: (currentPos: PixeloidCoordinate) => {
        if (!this.mirrorLayer.camera.isPanning || !this.mirrorLayer.camera.panStart) {
          return
        }

        const deltaX = currentPos.x - this.mirrorLayer.camera.panStart.x
        const deltaY = currentPos.y - this.mirrorLayer.camera.panStart.y
        
        // Update camera position
        this.mirrorLayer.cameraViewport.position = createPixeloidCoordinate(
          this.mirrorLayer.cameraViewport.position.x + deltaX,
          this.mirrorLayer.cameraViewport.position.y + deltaY
        )
        
        // Update velocity for momentum
        this.mirrorLayer.camera.velocity = createPixeloidCoordinate(deltaX, deltaY)
        
        // Update pan start for next frame
        this.mirrorLayer.camera.panStart = currentPos
        
        // Apply smoothing if enabled
        if (this.mirrorLayer.camera.smoothing.enabled) {
          this.applyCameraSmoothing()
        }
        
        this.mirrorLayer.display.needsRedraw = true
        this.ensurePixelPerfectAlignment()
      },

      stopPanning: () => {
        this.mirrorLayer.camera.isPanning = false
        this.mirrorLayer.camera.panStart = null
        
        // Apply momentum if enabled
        if (this.mirrorLayer.camera.momentum.enabled) {
          this.applyMomentum()
        }
      },

      // ================================
      // TEXTURE CACHE OPERATIONS
      // ================================
      cacheTexture: (objectId: string, texture: any, bounds: ECSBoundingBox) => {
        // Check cache size limit
        if (this.mirrorLayer.textureCache.size >= this.mirrorLayer.config.cacheConfig.maxCacheSize) {
          this.performCacheEviction()
        }
        
        // Create mirror texture
        const mirrorTexture = createMirrorTexture(objectId, texture, bounds)
        
        // Cache the texture
        this.mirrorLayer.textureCache.set(objectId, mirrorTexture)
        
        // Update performance metrics
        this.mirrorLayer.performance.texturesLoaded++
        this.mirrorLayer.performance.textureCacheSize = this.mirrorLayer.textureCache.size
        this.updateCacheMetrics()
      },

      evictTexture: (objectId: string) => {
        if (this.mirrorLayer.textureCache.has(objectId)) {
          this.mirrorLayer.textureCache.delete(objectId)
          this.mirrorLayer.performance.texturesEvicted++
          this.mirrorLayer.performance.textureCacheSize = this.mirrorLayer.textureCache.size
          this.updateCacheMetrics()
        }
      },

      clearTextureCache: () => {
        const previousSize = this.mirrorLayer.textureCache.size
        this.mirrorLayer.textureCache.clear()
        this.mirrorLayer.performance.texturesEvicted += previousSize
        this.mirrorLayer.performance.textureCacheSize = 0
        this.updateCacheMetrics()
      },

      optimizeTextureCache: () => {
        this.cleanupInvalidTextures()
        this.performCacheEviction()
        this.updateCacheMetrics()
      },

      // ================================
      // DISPLAY OPERATIONS
      // ================================
      setVisibility: (visible: boolean) => {
        this.mirrorLayer.display.isVisible = visible
        this.mirrorLayer.display.needsRedraw = true
        this.mirrorLayer.display.lastUpdateTime = Date.now()
      },

      setOpacity: (opacity: number) => {
        this.mirrorLayer.display.opacity = Math.max(0, Math.min(1, opacity))
        this.mirrorLayer.display.needsRedraw = true
      },

      setBlendMode: (mode: ECSMirrorLayer['display']['blendMode']) => {
        this.mirrorLayer.display.blendMode = mode
        this.mirrorLayer.display.needsRedraw = true
      },

      // ================================
      // PERFORMANCE OPERATIONS
      // ================================
      optimizeMirrorLayer: () => {
        this.performOptimization()
      },

      validateMirrorIntegrity: (): boolean => {
        return this.validateIntegrity()
      }
    }
  }

  // ================================
  // INTERNAL CAMERA OPERATIONS
  // ================================

  private handleZoomTransition(fromLevel: ZoomLevel, toLevel: ZoomLevel): void {
    if (fromLevel === toLevel) return
    
    // Update viewport culling for new zoom level
    this.updateViewportCulling()
    
    // Animate zoom transition if enabled
    if (this.mirrorLayer.zoomBehavior.enableSmoothTransitions) {
      this.animateZoomTransition(fromLevel, toLevel)
    }
    
    // Update layer visibility
    this.updateLayerVisibility()
    
    // Update WASD target
    this.updateWASDTarget()
  }

  private animateZoomTransition(fromLevel: ZoomLevel, toLevel: ZoomLevel): void {
    // Smooth zoom transition implementation
    const duration = this.mirrorLayer.zoomBehavior.transitionDuration
    const startTime = Date.now()
    
    // This would be implemented with a proper animation system
    // For now, we just update the timestamp
    this.mirrorLayer.display.lastUpdateTime = startTime
    
    console.log(`Animating zoom transition from ${fromLevel} to ${toLevel} over ${duration}ms`)
  }

  private updateLayerVisibility(): void {
    const zoom = this.mirrorLayer.zoomLevel
    
    // Update visibility based on zoom behavior
    if (zoom === 1) {
      this.mirrorLayer.display.isVisible = true // Show complete geometry
    } else {
      this.mirrorLayer.display.isVisible = true // Show camera viewport
    }
  }

  private updateWASDTarget(): void {
    const zoom = this.mirrorLayer.zoomLevel
    
    // Update WASD target based on zoom level
    if (zoom === 1) {
      this.mirrorLayer.zoomBehavior.wasdTarget = 'inactive'
    } else {
      this.mirrorLayer.zoomBehavior.wasdTarget = 'camera-viewport'
    }
  }

  private applyCameraSmoothing(): void {
    const smoothing = this.mirrorLayer.camera.smoothing
    
    if (!smoothing.enabled) return
    
    // Apply smoothing to camera position
    const currentPos = this.mirrorLayer.cameraViewport.position
    const velocity = this.mirrorLayer.camera.velocity
    
    const smoothedX = currentPos.x + (velocity.x * smoothing.factor)
    const smoothedY = currentPos.y + (velocity.y * smoothing.factor)
    
    this.mirrorLayer.cameraViewport.position = createPixeloidCoordinate(smoothedX, smoothedY)
  }

  private applyMomentum(): void {
    const momentum = this.mirrorLayer.camera.momentum
    
    if (!momentum.enabled) return
    
    // Apply momentum decay to velocity
    const velocity = this.mirrorLayer.camera.velocity
    const decayedVelocity = createPixeloidCoordinate(
      velocity.x * momentum.decay,
      velocity.y * momentum.decay
    )
    
    this.mirrorLayer.camera.velocity = decayedVelocity
    
    // Stop momentum if velocity is negligible
    if (Math.abs(decayedVelocity.x) < 0.1 && Math.abs(decayedVelocity.y) < 0.1) {
      this.mirrorLayer.camera.velocity = createPixeloidCoordinate(0, 0)
    }
  }

  private ensurePixelPerfectAlignment(): void {
    if (!this.mirrorLayer.zoomBehavior.pixelPerfectAlignment) return
    
    // Ensure camera position is pixel-perfect
    const pos = this.mirrorLayer.cameraViewport.position
    this.mirrorLayer.cameraViewport.position = createPixeloidCoordinate(
      Math.round(pos.x),
      Math.round(pos.y)
    )
  }

  private updateViewportCulling(): void {
    if (!this.mirrorLayer.config.enableViewportCulling) return
    
    // Update viewport culling based on current camera position and zoom
    const viewport = this.mirrorLayer.cameraViewport
    const margin = this.mirrorLayer.config.cullingMargin
    
    // Calculate culling bounds
    const cullingBounds = createECSBoundingBox(
      viewport.position.x - margin,
      viewport.position.y - margin,
      viewport.position.x + viewport.bounds.width + margin,
      viewport.position.y + viewport.bounds.height + margin
    )
    
    // This would be used by the rendering system for culling
    console.log('Updated viewport culling bounds:', cullingBounds)
  }

  // ================================
  // TEXTURE CACHE MANAGEMENT
  // ================================

  private performCacheEviction(): void {
    const config = this.mirrorLayer.config.cacheConfig
    
    switch (config.evictionStrategy) {
      case 'lru':
        this.evictLRU()
        break
      case 'lfu':
        this.evictLFU()
        break
      case 'fifo':
        this.evictFIFO()
        break
    }
  }

  private evictLRU(): void {
    // Evict least recently used texture
    let oldestTime = Date.now()
    let oldestId = ''
    
    for (const [objectId, texture] of this.mirrorLayer.textureCache) {
      if (texture.timestamp < oldestTime) {
        oldestTime = texture.timestamp
        oldestId = objectId
      }
    }
    
    if (oldestId) {
      this.mirrorLayer.textureCache.delete(oldestId)
      this.mirrorLayer.performance.texturesEvicted++
    }
  }

  private evictLFU(): void {
    // Evict least frequently used texture
    // For now, just evict the oldest (LRU fallback)
    this.evictLRU()
  }

  private evictFIFO(): void {
    // Evict first in, first out
    const firstEntry = this.mirrorLayer.textureCache.entries().next()
    if (!firstEntry.done) {
      this.mirrorLayer.textureCache.delete(firstEntry.value[0])
      this.mirrorLayer.performance.texturesEvicted++
    }
  }

  private cleanupInvalidTextures(): void {
    const currentTime = Date.now()
    const maxAge = this.mirrorLayer.config.cacheConfig.maxTextureAge
    
    for (const [objectId, texture] of this.mirrorLayer.textureCache) {
      if (!texture.isValid || (currentTime - texture.timestamp) > maxAge) {
        this.mirrorLayer.textureCache.delete(objectId)
        this.mirrorLayer.performance.texturesEvicted++
      }
    }
  }

  private updateCacheMetrics(): void {
    const cacheSize = this.mirrorLayer.textureCache.size
    const maxSize = this.mirrorLayer.config.cacheConfig.maxCacheSize
    
    // Update performance metrics
    this.mirrorLayer.performance.textureCacheSize = cacheSize
    
    // Calculate cache hit rate (simplified)
    const totalLoaded = this.mirrorLayer.performance.texturesLoaded
    const totalEvicted = this.mirrorLayer.performance.texturesEvicted
    const effectiveHits = totalLoaded - totalEvicted
    
    this.mirrorLayer.performance.cacheHitRate = totalLoaded > 0 ? effectiveHits / totalLoaded : 0
    
    // Update memory usage estimate
    this.mirrorLayer.performance.memoryUsage = this.calculateMemoryUsage()
  }

  // ================================
  // PERFORMANCE & VALIDATION
  // ================================

  private performOptimization(): void {
    // Clean up invalid textures
    this.cleanupInvalidTextures()
    
    // Optimize texture cache
    if (this.mirrorLayer.config.cacheConfig.enableAutoEviction) {
      this.performCacheEviction()
    }
    
    // Update viewport culling
    this.updateViewportCulling()
    
    // Update performance metrics
    this.updateCacheMetrics()
    
    // Update render queue
    this.optimizeRenderQueue()
  }

  private optimizeRenderQueue(): void {
    const renderQueue = this.mirrorLayer.rendering.renderQueue
    const batchSize = this.mirrorLayer.rendering.batchSize
    
    // Limit render queue size
    if (renderQueue.length > batchSize * 2) {
      this.mirrorLayer.rendering.renderQueue = renderQueue.slice(0, batchSize)
    }
  }

  private calculateMemoryUsage(): number {
    // Rough estimate of memory usage
    const textureSize = 100 * 1024 // 100KB per texture estimate
    return this.mirrorLayer.textureCache.size * textureSize
  }

  private validateIntegrity(): boolean {
    try {
      // Check if mirror layer is valid
      if (!isECSMirrorLayer(this.mirrorLayer)) {
        return false
      }
      
      // Check if zoom level is valid
      if (!isZoomLevel(this.mirrorLayer.zoomLevel)) {
        return false
      }
      
      // Check if texture cache is valid
      for (const [objectId, texture] of this.mirrorLayer.textureCache) {
        if (!isMirrorTexture(texture)) {
          return false
        }
        if (texture.objectId !== objectId) {
          return false
        }
      }
      
      // Check zoom behavior consistency
      const zoom = this.mirrorLayer.zoomLevel
      const behavior = this.mirrorLayer.zoomBehavior
      
      if (zoom === 1) {
        if (behavior.wasdTarget !== 'inactive' || 
            !behavior.showCompleteGeometry || 
            behavior.showCameraViewport) {
          return false
        }
      } else {
        if (behavior.wasdTarget !== 'camera-viewport' || 
            behavior.showCompleteGeometry || 
            !behavior.showCameraViewport) {
          return false
        }
      }
      
      return true
    } catch (error) {
      console.error('Mirror layer integrity validation failed:', error)
      return false
    }
  }
}

// ================================
// STORE FACTORY
// ================================

/**
 * Create a new ECS Mirror Layer Store instance.
 */
export const createECSMirrorLayerStore = (): ECSMirrorLayerStore => {
  return new ECSMirrorLayerStore()
}

// ================================
// DEBUGGING UTILITIES
// ================================

/**
 * Debug utilities for ECS Mirror Layer Store.
 */
export const ECSMirrorLayerStoreDebug = {
  /**
   * Log store state for debugging.
   */
  logState: (store: ECSMirrorLayerStore) => {
    const mirrorLayer = store.getMirrorLayer()
    console.log('ECS Mirror Layer Store State:', {
      zoomLevel: mirrorLayer.zoomLevel,
      cameraPosition: mirrorLayer.cameraViewport.position,
      wasdTarget: mirrorLayer.zoomBehavior.wasdTarget,
      textureCacheSize: mirrorLayer.textureCache.size,
      layerVisible: mirrorLayer.display.isVisible,
      isPanning: mirrorLayer.camera.isPanning,
      needsRedraw: mirrorLayer.display.needsRedraw
    })
  },

  /**
   * Validate store integrity.
   */
  validate: (store: ECSMirrorLayerStore): boolean => {
    return store.getActions().validateMirrorIntegrity()
  },

  /**
   * Log texture cache contents.
   */
  logTextureCache: (store: ECSMirrorLayerStore) => {
    const mirrorLayer = store.getMirrorLayer()
    console.log('Texture Cache Contents:', {
      size: mirrorLayer.textureCache.size,
      textures: Array.from(mirrorLayer.textureCache.entries()).map(([id, texture]) => ({
        id,
        objectId: texture.objectId,
        timestamp: texture.timestamp,
        isValid: texture.isValid,
        bounds: texture.bounds
      }))
    })
  }
}