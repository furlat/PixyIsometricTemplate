/**
 * ECS Coordination Types
 * 
 * Types for coordinating between ECS Data Layer and Mirror Layer.
 * Manages zoom-dependent WASD routing, texture synchronization, and layer visibility.
 */

import { PixeloidCoordinate, ECSBoundingBox } from './ecs-coordinates'
import { ZoomLevel } from './ecs-mirror-layer'

// ================================
// WASD ROUTING TYPES
// ================================

/**
 * WASD movement directions.
 */
export type WASDDirection = 'up' | 'down' | 'left' | 'right'

/**
 * WASD movement target based on zoom level.
 */
export type WASDTarget = 'data-layer' | 'mirror-layer' | 'inactive'

/**
 * WASD movement entry for queue management.
 */
export interface WASDMovement {
  direction: WASDDirection
  timestamp: number
  targetLayer: WASDTarget
  processed: boolean
  coordinates?: PixeloidCoordinate
}

/**
 * WASD routing state.
 */
export interface WASDRoutingState {
  currentTarget: WASDTarget
  isRoutingActive: boolean
  lastMovementTime: number
  movementQueue: WASDMovement[]
  routingStats: {
    totalMovements: number
    dataLayerMovements: number
    mirrorLayerMovements: number
    averageResponseTime: number
  }
}

// ================================
// LAYER VISIBILITY TYPES
// ================================

/**
 * Layer fade states for smooth transitions.
 */
export type LayerFadeState = 'stable' | 'fading-in' | 'fading-out'

/**
 * Individual layer visibility configuration.
 */
export interface LayerVisibilityConfig {
  isVisible: boolean
  opacity: number
  fadeState: LayerFadeState
  fadeStartTime: number
  fadeDuration: number
}

/**
 * Layer visibility state for both layers.
 */
export interface LayerVisibilityState {
  dataLayer: LayerVisibilityConfig
  mirrorLayer: LayerVisibilityConfig
  transitionInProgress: boolean
  lastTransitionTime: number
}

/**
 * Visibility transition configuration.
 */
export interface VisibilityTransitionConfig {
  dataLayer: { visible: boolean; opacity: number }
  mirrorLayer: { visible: boolean; opacity: number }
  duration: number
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
}

// ================================
// TEXTURE SYNCHRONIZATION TYPES
// ================================

/**
 * Texture synchronization state.
 */
export interface TextureSynchronizationState {
  isActive: boolean
  lastSyncTime: number
  syncVersion: number
  pendingTextures: string[]
  failedTextures: string[]
  syncPerformance: {
    texturesPerSecond: number
    averageSyncTime: number
    totalTexturesSynced: number
    syncFailures: number
  }
  cacheCoordination: {
    sharedCacheSize: number
    duplicatesPrevented: number
    memoryOptimized: number
  }
}

/**
 * Texture sync operation result.
 */
export interface TextureSyncResult {
  success: boolean
  objectId: string
  syncTime: number
  textureSize: number
  error?: string
}

// ================================
// ZOOM TRANSITION TYPES
// ================================

/**
 * Zoom transition state.
 */
export interface ZoomTransitionState {
  isTransitioning: boolean
  startTime: number
  duration: number
  fromLevel: ZoomLevel
  toLevel: ZoomLevel
  progress: number
  easing: 'linear' | 'ease-in-out'
}

// ================================
// PERFORMANCE COORDINATION TYPES
// ================================

/**
 * Performance coordination state.
 */
export interface PerformanceCoordinationState {
  totalMemoryUsage: number
  aggregatedCacheSize: number
  totalObjectCount: number
  totalVisibleObjects: number
  frameRate: number
  lastOptimizationTime: number
  coordinationOverhead: number
  optimizationStats: {
    memorySaved: number
    cacheDuplicatesPrevented: number
    performanceGain: number
  }
}

// ================================
// MAIN COORDINATION STATE
// ================================

/**
 * Main ECS Coordination State.
 * Coordinates all aspects of the dual-layer ECS system.
 */
export interface ECSCoordinationState {
  // ================================
  // ZOOM LEVEL MANAGEMENT
  // ================================
  zoomLevel: ZoomLevel
  previousZoomLevel: ZoomLevel
  zoomTransition: ZoomTransitionState

  // ================================
  // WASD ROUTING STATE
  // ================================
  wasdRouting: WASDRoutingState

  // ================================
  // LAYER VISIBILITY STATE
  // ================================
  layerVisibility: LayerVisibilityState

  // ================================
  // TEXTURE SYNCHRONIZATION STATE
  // ================================
  textureSynchronization: TextureSynchronizationState

  // ================================
  // PERFORMANCE COORDINATION
  // ================================
  performance: PerformanceCoordinationState

  // ================================
  // COORDINATION METADATA
  // ================================
  metadata: {
    coordinationVersion: number
    lastUpdateTime: number
    isInitialized: boolean
    coordinationMode: 'active' | 'passive' | 'debugging'
    systemHealth: 'healthy' | 'degraded' | 'critical'
  }
}

// ================================
// UNIFIED SYSTEM STATS
// ================================

/**
 * Unified system statistics combining all layers.
 */
export interface UnifiedSystemStats {
  // System-wide metrics
  totalObjects: number
  totalVisibleObjects: number
  totalMemoryUsage: number
  systemFrameRate: number

  // Data layer stats
  dataLayer: {
    samplingActive: boolean
    objectCount: number
    visibleCount: number
    memoryUsage: number
    samplingPerformance: number
  }

  // Mirror layer stats
  mirrorLayer: {
    zoomLevel: ZoomLevel
    cacheSize: number
    cacheHitRate: number
    memoryUsage: number
    renderingPerformance: number
  }

  // Coordination stats
  coordination: {
    wasdTarget: WASDTarget
    layersVisible: string[]
    syncActive: boolean
    performanceOverhead: number
    coordinationHealth: 'healthy' | 'degraded' | 'critical'
  }
}

// ================================
// COORDINATION ACTIONS
// ================================

/**
 * ECS Coordination Actions interface.
 */
export interface ECSCoordinationActions {
  // ================================
  // WASD ROUTING ACTIONS
  // ================================
  moveUp(): void
  moveDown(): void
  moveLeft(): void
  moveRight(): void

  // ================================
  // ZOOM MANAGEMENT ACTIONS
  // ================================
  setZoomLevel(level: ZoomLevel): void
  
  // ================================
  // TEXTURE SYNCHRONIZATION ACTIONS
  // ================================
  syncTextures(): void
  syncSingleTexture(objectId: string): void
  invalidateTexture(objectId: string): void

  // ================================
  // LAYER VISIBILITY ACTIONS
  // ================================
  setLayerVisibility(layer: 'data' | 'mirror', visible: boolean): void
  setLayerOpacity(layer: 'data' | 'mirror', opacity: number): void

  // ================================
  // PERFORMANCE ACTIONS
  // ================================
  optimizeSystem(): void
  coordinatePerformance(): void
  validateSystemIntegrity(): boolean

  // ================================
  // DEBUGGING ACTIONS
  // ================================
  logCoordinationState(): void
  resetCoordinationState(): void
}

// ================================
// TYPE GUARDS
// ================================

/**
 * Type guard for WASD direction.
 */
export const isWASDDirection = (value: any): value is WASDDirection => {
  return typeof value === 'string' && 
         ['up', 'down', 'left', 'right'].includes(value)
}

/**
 * Type guard for WASD target.
 */
export const isWASDTarget = (value: any): value is WASDTarget => {
  return typeof value === 'string' && 
         ['data-layer', 'mirror-layer', 'inactive'].includes(value)
}

/**
 * Type guard for layer fade state.
 */
export const isLayerFadeState = (value: any): value is LayerFadeState => {
  return typeof value === 'string' && 
         ['stable', 'fading-in', 'fading-out'].includes(value)
}

/**
 * Type guard for ECS coordination state.
 */
export const isECSCoordinationState = (obj: any): obj is ECSCoordinationState => {
  return obj &&
         typeof obj === 'object' &&
         typeof obj.zoomLevel === 'number' &&
         typeof obj.previousZoomLevel === 'number' &&
         obj.zoomTransition &&
         obj.wasdRouting &&
         obj.layerVisibility &&
         obj.textureSynchronization &&
         obj.performance &&
         obj.metadata
}

// ================================
// FACTORY FUNCTIONS
// ================================

/**
 * Create initial ECS coordination state.
 */
export const createECSCoordinationState = (): ECSCoordinationState => ({
  zoomLevel: 1,
  previousZoomLevel: 1,
  zoomTransition: {
    isTransitioning: false,
    startTime: 0,
    duration: 300,
    fromLevel: 1,
    toLevel: 1,
    progress: 0,
    easing: 'ease-in-out'
  },
  wasdRouting: {
    currentTarget: 'data-layer',
    isRoutingActive: true,
    lastMovementTime: 0,
    movementQueue: [],
    routingStats: {
      totalMovements: 0,
      dataLayerMovements: 0,
      mirrorLayerMovements: 0,
      averageResponseTime: 0
    }
  },
  layerVisibility: {
    dataLayer: {
      isVisible: true,
      opacity: 1.0,
      fadeState: 'stable',
      fadeStartTime: 0,
      fadeDuration: 300
    },
    mirrorLayer: {
      isVisible: true,
      opacity: 1.0,
      fadeState: 'stable',
      fadeStartTime: 0,
      fadeDuration: 300
    },
    transitionInProgress: false,
    lastTransitionTime: 0
  },
  textureSynchronization: {
    isActive: true,
    lastSyncTime: 0,
    syncVersion: 1,
    pendingTextures: [],
    failedTextures: [],
    syncPerformance: {
      texturesPerSecond: 0,
      averageSyncTime: 0,
      totalTexturesSynced: 0,
      syncFailures: 0
    },
    cacheCoordination: {
      sharedCacheSize: 0,
      duplicatesPrevented: 0,
      memoryOptimized: 0
    }
  },
  performance: {
    totalMemoryUsage: 0,
    aggregatedCacheSize: 0,
    totalObjectCount: 0,
    totalVisibleObjects: 0,
    frameRate: 60,
    lastOptimizationTime: 0,
    coordinationOverhead: 0,
    optimizationStats: {
      memorySaved: 0,
      cacheDuplicatesPrevented: 0,
      performanceGain: 0
    }
  },
  metadata: {
    coordinationVersion: 1,
    lastUpdateTime: Date.now(),
    isInitialized: true,
    coordinationMode: 'active',
    systemHealth: 'healthy'
  }
})

/**
 * Create WASD movement entry.
 */
export const createWASDMovement = (
  direction: WASDDirection,
  targetLayer: WASDTarget,
  coordinates?: PixeloidCoordinate
): WASDMovement => ({
  direction,
  timestamp: Date.now(),
  targetLayer,
  processed: false,
  coordinates
})

/**
 * Create texture sync result.
 */
export const createTextureSyncResult = (
  objectId: string,
  success: boolean,
  syncTime: number,
  textureSize: number,
  error?: string
): TextureSyncResult => ({
  success,
  objectId,
  syncTime,
  textureSize,
  error
})

/**
 * Determine WASD target based on zoom level.
 */
export const determineWASDTarget = (zoomLevel: ZoomLevel): WASDTarget => {
  if (zoomLevel === 1) {
    return 'data-layer'
  } else if (zoomLevel > 1) {
    return 'mirror-layer'
  }
  return 'inactive'
}

/**
 * Determine layer visibility based on zoom level.
 */
export const determineLayerVisibility = (zoomLevel: ZoomLevel): VisibilityTransitionConfig => {
  if (zoomLevel === 1) {
    return {
      dataLayer: { visible: true, opacity: 1.0 },
      mirrorLayer: { visible: true, opacity: 1.0 },
      duration: 300,
      easing: 'ease-in-out'
    }
  } else {
    return {
      dataLayer: { visible: false, opacity: 0.0 },
      mirrorLayer: { visible: true, opacity: 1.0 },
      duration: 300,
      easing: 'ease-in-out'
    }
  }
}

// ================================
// VALIDATION UTILITIES
// ================================

/**
 * Validate coordination state integrity.
 */
export const validateCoordinationState = (state: ECSCoordinationState): boolean => {
  try {
    // Check zoom level consistency
    if (state.zoomLevel < 1 || state.zoomLevel > 128) {
      return false
    }

    // Check WASD routing consistency
    const expectedTarget = determineWASDTarget(state.zoomLevel)
    if (state.wasdRouting.currentTarget !== expectedTarget) {
      return false
    }

    // Check layer visibility consistency
    const expectedVisibility = determineLayerVisibility(state.zoomLevel)
    if (state.zoomLevel === 1) {
      if (!state.layerVisibility.dataLayer.isVisible || !state.layerVisibility.mirrorLayer.isVisible) {
        return false
      }
    } else {
      if (state.layerVisibility.dataLayer.isVisible || !state.layerVisibility.mirrorLayer.isVisible) {
        return false
      }
    }

    // Check system health
    if (state.metadata.systemHealth === 'critical') {
      return false
    }

    return true
  } catch (error) {
    console.error('Coordination state validation failed:', error)
    return false
  }
}