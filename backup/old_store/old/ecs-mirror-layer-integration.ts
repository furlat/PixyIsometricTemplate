/**
 * ECS Mirror Layer Integration
 * 
 * Non-intrusive integration wrapper that provides a clean interface to the
 * ECS Mirror Layer Store without polluting gameStore.ts.
 * 
 * This follows the Phase 2B revised approach of composition over modification.
 */

import { 
  ECSMirrorLayerStore, 
  MirrorLayerStats, 
  createECSMirrorLayerStore,
  ECSMirrorLayerStoreDebug
} from './ecs-mirror-layer-store'
import { 
  ECSMirrorLayer, 
  ECSMirrorLayerActions, 
  ZoomLevel,
  CameraViewport,
  MirrorTexture,
  isZoomLevel
} from '../types/ecs-mirror-layer'
import { 
  PixeloidCoordinate, 
  ECSBoundingBox,
  createPixeloidCoordinate
} from '../types/ecs-coordinates'

/**
 * Integration interface for UI components.
 * Provides simplified, type-safe access to mirror layer functionality.
 */
export interface ECSMirrorLayerIntegrationInterface {
  // ================================
  // STATE ACCESS
  // ================================
  getCurrentState(): Readonly<ECSMirrorLayer>
  getStats(): MirrorLayerStats
  isWASDActive(): boolean
  getCurrentZoomLevel(): ZoomLevel
  getCameraPosition(): PixeloidCoordinate
  
  // ================================
  // CAMERA OPERATIONS
  // ================================
  moveCamera(position: PixeloidCoordinate): void
  panCamera(deltaX: number, deltaY: number): void
  setCameraScale(scale: number): void
  setCameraRotation(rotation: number): void
  
  // ================================
  // ZOOM OPERATIONS
  // ================================
  setZoomLevel(level: ZoomLevel): void
  getZoomBehavior(): ECSMirrorLayer['zoomBehavior']
  
  // ================================
  // TEXTURE OPERATIONS
  // ================================
  cacheTexture(objectId: string, texture: any, bounds: ECSBoundingBox): void
  getCachedTexture(objectId: string): MirrorTexture | null
  getTextureCacheSize(): number
  clearTextureCache(): void
  
  // ================================
  // PANNING OPERATIONS
  // ================================
  startPanning(startPos: PixeloidCoordinate): void
  updatePanning(currentPos: PixeloidCoordinate): void
  stopPanning(): void
  
  // ================================
  // DISPLAY OPERATIONS
  // ================================
  setVisibility(visible: boolean): void
  setOpacity(opacity: number): void
  isVisible(): boolean
  
  // ================================
  // PERFORMANCE OPERATIONS
  // ================================
  optimize(): void
  validateIntegrity(): boolean
  
  // ================================
  // DEBUGGING
  // ================================
  logState(): void
  logTextureCache(): void
}

/**
 * ECS Mirror Layer Integration
 * 
 * Clean integration wrapper that provides a type-safe interface to the
 * ECS Mirror Layer Store without modifying gameStore.ts.
 */
export class ECSMirrorLayerIntegration implements ECSMirrorLayerIntegrationInterface {
  private mirrorStore: ECSMirrorLayerStore
  private actions: ECSMirrorLayerActions

  constructor() {
    this.mirrorStore = createECSMirrorLayerStore()
    this.actions = this.mirrorStore.getActions()
  }

  // ================================
  // STATE ACCESS
  // ================================

  /**
   * Get the current mirror layer state (immutable).
   */
  getCurrentState(): Readonly<ECSMirrorLayer> {
    return this.mirrorStore.getMirrorLayer()
  }

  /**
   * Get performance and debugging stats.
   */
  getStats(): MirrorLayerStats {
    return this.mirrorStore.getStats()
  }

  /**
   * Check if WASD is currently active for camera movement.
   */
  isWASDActive(): boolean {
    const state = this.getCurrentState()
    return state.zoomBehavior.wasdTarget === 'camera-viewport'
  }

  /**
   * Get the current zoom level.
   */
  getCurrentZoomLevel(): ZoomLevel {
    return this.getCurrentState().zoomLevel
  }

  /**
   * Get the current camera position.
   */
  getCameraPosition(): PixeloidCoordinate {
    return this.getCurrentState().cameraViewport.position
  }

  // ================================
  // CAMERA OPERATIONS
  // ================================

  /**
   * Move camera to specific position.
   * Only works when WASD is active (zoom level 2+).
   */
  moveCamera(position: PixeloidCoordinate): void {
    if (!this.isWASDActive()) {
      console.warn('Camera movement not active at zoom level 1')
      return
    }
    this.actions.updateCameraViewport(position)
  }

  /**
   * Pan camera by delta amounts.
   * Only works when WASD is active (zoom level 2+).
   */
  panCamera(deltaX: number, deltaY: number): void {
    if (!this.isWASDActive()) {
      console.warn('Camera panning not active at zoom level 1')
      return
    }
    
    const currentPos = this.getCameraPosition()
    const newPos = createPixeloidCoordinate(
      currentPos.x + deltaX,
      currentPos.y + deltaY
    )
    this.actions.updateCameraViewport(newPos)
  }

  /**
   * Set camera scale.
   */
  setCameraScale(scale: number): void {
    this.actions.setCameraScale(scale)
  }

  /**
   * Set camera rotation.
   */
  setCameraRotation(rotation: number): void {
    this.actions.setCameraRotation(rotation)
  }

  // ================================
  // ZOOM OPERATIONS
  // ================================

  /**
   * Set zoom level with validation.
   */
  setZoomLevel(level: ZoomLevel): void {
    if (!isZoomLevel(level)) {
      console.error(`Invalid zoom level: ${level}`)
      return
    }
    this.actions.setZoomLevel(level)
  }

  /**
   * Get zoom behavior configuration.
   */
  getZoomBehavior(): ECSMirrorLayer['zoomBehavior'] {
    return this.getCurrentState().zoomBehavior
  }

  // ================================
  // TEXTURE OPERATIONS
  // ================================

  /**
   * Cache a texture for an object.
   */
  cacheTexture(objectId: string, texture: any, bounds: ECSBoundingBox): void {
    this.actions.cacheTexture(objectId, texture, bounds)
  }

  /**
   * Get cached texture for an object.
   */
  getCachedTexture(objectId: string): MirrorTexture | null {
    const textureCache = this.getCurrentState().textureCache
    return textureCache.get(objectId) || null
  }

  /**
   * Get texture cache size.
   */
  getTextureCacheSize(): number {
    return this.getCurrentState().textureCache.size
  }

  /**
   * Clear all cached textures.
   */
  clearTextureCache(): void {
    this.actions.clearTextureCache()
  }

  // ================================
  // PANNING OPERATIONS
  // ================================

  /**
   * Start panning operation.
   */
  startPanning(startPos: PixeloidCoordinate): void {
    this.actions.startPanning(startPos)
  }

  /**
   * Update panning with current position.
   */
  updatePanning(currentPos: PixeloidCoordinate): void {
    this.actions.updatePanning(currentPos)
  }

  /**
   * Stop panning operation.
   */
  stopPanning(): void {
    this.actions.stopPanning()
  }

  // ================================
  // DISPLAY OPERATIONS
  // ================================

  /**
   * Set layer visibility.
   */
  setVisibility(visible: boolean): void {
    this.actions.setVisibility(visible)
  }

  /**
   * Set layer opacity.
   */
  setOpacity(opacity: number): void {
    this.actions.setOpacity(opacity)
  }

  /**
   * Check if layer is visible.
   */
  isVisible(): boolean {
    return this.getCurrentState().display.isVisible
  }

  // ================================
  // PERFORMANCE OPERATIONS
  // ================================

  /**
   * Optimize mirror layer performance.
   */
  optimize(): void {
    this.actions.optimizeMirrorLayer()
  }

  /**
   * Validate mirror layer integrity.
   */
  validateIntegrity(): boolean {
    return this.actions.validateMirrorIntegrity()
  }

  // ================================
  // DEBUGGING
  // ================================

  /**
   * Log current state for debugging.
   */
  logState(): void {
    ECSMirrorLayerStoreDebug.logState(this.mirrorStore)
  }

  /**
   * Log texture cache contents for debugging.
   */
  logTextureCache(): void {
    ECSMirrorLayerStoreDebug.logTextureCache(this.mirrorStore)
  }
}

// ================================
// FACTORY FUNCTION
// ================================

/**
 * Create a new ECS Mirror Layer Integration instance.
 */
export const createECSMirrorLayerIntegration = (): ECSMirrorLayerIntegration => {
  return new ECSMirrorLayerIntegration()
}

// ================================
// SINGLETON INSTANCE
// ================================

/**
 * Singleton instance for global access.
 * Can be used throughout the application without creating multiple instances.
 */
export const mirrorLayerIntegration = createECSMirrorLayerIntegration()

// ================================
// UTILITY FUNCTIONS
// ================================

/**
 * Utility functions for common operations.
 */
export const ECSMirrorLayerIntegrationUtils = {
  /**
   * Check if mirror layer is ready for camera operations.
   */
  isReadyForCameraOperations: (integration: ECSMirrorLayerIntegration): boolean => {
    return integration.isWASDActive() && integration.isVisible()
  },

  /**
   * Get formatted camera info for debugging.
   */
  getCameraInfo: (integration: ECSMirrorLayerIntegration) => {
    const state = integration.getCurrentState()
    return {
      position: state.cameraViewport.position,
      scale: state.cameraViewport.scale,
      rotation: state.cameraViewport.rotation,
      bounds: state.cameraViewport.bounds,
      zoomLevel: state.zoomLevel,
      wasdActive: integration.isWASDActive(),
      isPanning: state.camera.isPanning
    }
  },

  /**
   * Get formatted texture cache info for debugging.
   */
  getTextureCacheInfo: (integration: ECSMirrorLayerIntegration) => {
    const state = integration.getCurrentState()
    const stats = integration.getStats()
    return {
      size: state.textureCache.size,
      maxSize: state.config.cacheConfig.maxCacheSize,
      hitRate: stats.cacheHitRate,
      memoryUsage: stats.memoryUsage,
      texturesLoaded: stats.texturesLoaded,
      texturesEvicted: stats.texturesEvicted
    }
  }
}