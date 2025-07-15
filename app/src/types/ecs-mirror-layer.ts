/**
 * Pure ECS Mirror Layer
 * 
 * ECS mirror layer types for camera viewport transforms and texture display.
 * Displays pre-rendered textures from data layer with camera transformations.
 * Core principle: Mirror layer = Camera viewport transforms, NOT data storage.
 */

import { PixeloidCoordinate, ECSBoundingBox } from './ecs-coordinates'

// ================================
// ZOOM LEVEL TYPES
// ================================

/**
 * Valid zoom levels for pixel-perfect rendering.
 * Only integer powers of 2 for perfect pixel alignment.
 */
export type ZoomLevel = 1 | 2 | 4 | 8 | 16 | 32 | 64 | 128

// ================================
// CAMERA VIEWPORT TYPES
// ================================

/**
 * Camera viewport state - transforms applied to mirror layer.
 */
export interface CameraViewport {
  position: PixeloidCoordinate
  scale: number // CAN scale (unlike data layer)
  rotation: number
  bounds: {
    width: number
    height: number
  }
}

/**
 * Camera movement state.
 */
export interface CameraMovement {
  isPanning: boolean
  panStart: PixeloidCoordinate | null
  velocity: PixeloidCoordinate
  smoothing: {
    enabled: boolean
    factor: number
  }
  momentum: {
    enabled: boolean
    decay: number
  }
}

// ================================
// TEXTURE CACHE TYPES
// ================================

/**
 * Mirror texture entry - cached from data layer.
 * NO scale property (ECS principle: textures are scale-independent).
 */
export interface MirrorTexture {
  readonly id: string
  readonly objectId: string
  readonly texture: any // PIXI.Texture - avoiding import
  readonly bounds: ECSBoundingBox
  readonly timestamp: number
  readonly version: number
  readonly isValid: boolean
  // NO scale property - ECS principle
}

/**
 * Texture cache configuration.
 */
export interface TextureCacheConfig {
  maxCacheSize: number
  maxTextureAge: number
  enableAutoEviction: boolean
  evictionStrategy: 'lru' | 'lfu' | 'fifo'
}

// ================================
// ZOOM BEHAVIOR TYPES
// ================================

/**
 * Zoom behavior configuration.
 * Determines layer visibility and WASD routing.
 */
export interface ZoomBehavior {
  currentLevel: ZoomLevel
  
  // ECS layer visibility rules
  showCompleteGeometry: boolean  // true at zoom 1
  showCameraViewport: boolean    // true at zoom 2+
  
  // WASD routing rules
  wasdTarget: 'inactive' | 'camera-viewport' // inactive at zoom 1, camera-viewport at zoom 2+
  
  // Transition configuration
  transitionDuration: number
  enableSmoothTransitions: boolean
  pixelPerfectAlignment: boolean
}

// ================================
// ECS MIRROR LAYER INTERFACE
// ================================

/**
 * ECS Mirror Layer - Camera viewport transforms and texture display.
 * 
 * CRITICAL ECS PRINCIPLES:
 * - HAS camera viewport transforms (unlike data layer)
 * - COPIES textures from data layer (does NOT store geometry)
 * - WASD at zoom 1: INACTIVE (shows complete geometry)
 * - WASD at zoom 2+: moves camera viewport
 * - NO direct geometry storage
 * - NO sampling window (that's data layer)
 */
export interface ECSMirrorLayer {
  // ================================
  // CAMERA VIEWPORT (moves with WASD at zoom 2+)
  // ================================
  cameraViewport: CameraViewport
  
  // ================================
  // ZOOM LEVEL (determines behavior)
  // ================================
  zoomLevel: ZoomLevel
  
  // ================================
  // CAMERA MOVEMENT STATE
  // ================================
  camera: CameraMovement
  
  // ================================
  // TEXTURE CACHE (from data layer)
  // ================================
  textureCache: Map<string, MirrorTexture>
  
  // ================================
  // ZOOM BEHAVIOR CONFIGURATION
  // ================================
  zoomBehavior: ZoomBehavior
  
  // ================================
  // DISPLAY STATE
  // ================================
  display: {
    isVisible: boolean
    opacity: number
    blendMode: 'normal' | 'multiply' | 'screen' | 'overlay'
    lastUpdateTime: number
    needsRedraw: boolean
    layerVersion: number
  }
  
  // ================================
  // CONFIGURATION
  // ================================
  config: {
    enableTextureCache: boolean
    cacheConfig: TextureCacheConfig
    enableViewportCulling: boolean
    cullingMargin: number
    maxViewportSize: number
  }
  
  // ================================
  // RENDERING STATE
  // ================================
  rendering: {
    isRendering: boolean
    lastRenderTime: number
    renderQueue: string[] // Object IDs to render
    batchSize: number
    enableBatchRendering: boolean
  }
  
  // ================================
  // PERFORMANCE METRICS
  // ================================
  performance: {
    cacheHitRate: number
    textureCacheSize: number
    renderTime: number
    lastUpdateTime: number
    memoryUsage: number
    texturesLoaded: number
    texturesEvicted: number
  }
  
  // ================================
  // DEBUG INFO
  // ================================
  debug: {
    showCameraViewport: boolean
    showTextureBounds: boolean
    showPerformanceMetrics: boolean
    logCacheOperations: boolean
  }
}

// ================================
// ECS MIRROR LAYER ACTIONS
// ================================

/**
 * Mirror layer actions - Camera viewport operations.
 */
export interface ECSMirrorLayerActions {
  // ================================
  // CAMERA VIEWPORT OPERATIONS (WASD at zoom 2+)
  // ================================
  updateCameraViewport(position: PixeloidCoordinate): void
  setCameraScale(scale: number): void
  setCameraRotation(rotation: number): void
  
  // ================================
  // ZOOM OPERATIONS
  // ================================
  setZoomLevel(level: ZoomLevel): void
  
  // ================================
  // CAMERA MOVEMENT OPERATIONS
  // ================================
  startPanning(startPos: PixeloidCoordinate): void
  updatePanning(currentPos: PixeloidCoordinate): void
  stopPanning(): void
  
  // ================================
  // TEXTURE CACHE OPERATIONS
  // ================================
  cacheTexture(objectId: string, texture: any, bounds: ECSBoundingBox): void
  evictTexture(objectId: string): void
  clearTextureCache(): void
  optimizeTextureCache(): void
  
  // ================================
  // DISPLAY OPERATIONS
  // ================================
  setVisibility(visible: boolean): void
  setOpacity(opacity: number): void
  setBlendMode(mode: ECSMirrorLayer['display']['blendMode']): void
  
  // ================================
  // PERFORMANCE OPERATIONS
  // ================================
  optimizeMirrorLayer(): void
  validateMirrorIntegrity(): boolean
}

// ================================
// VIEWPORT TRANSFORM TYPES
// ================================

/**
 * Viewport transformation result.
 */
export interface ViewportTransform {
  originalPosition: PixeloidCoordinate
  transformedPosition: PixeloidCoordinate
  scale: number
  rotation: number
  isVisible: boolean
  metadata: {
    zoomLevel: ZoomLevel
    cameraPosition: PixeloidCoordinate
    transformTime: number
  }
}

// ================================
// TYPE GUARDS
// ================================

/**
 * Type guard for ECS mirror layer.
 */
export const isECSMirrorLayer = (obj: any): obj is ECSMirrorLayer => {
  return obj &&
         typeof obj === 'object' &&
         obj.cameraViewport &&
         typeof obj.zoomLevel === 'number' &&
         obj.camera &&
         obj.textureCache instanceof Map &&
         obj.zoomBehavior &&
         obj.display
}

/**
 * Type guard for zoom level.
 */
export const isZoomLevel = (value: any): value is ZoomLevel => {
  return typeof value === 'number' &&
         [1, 2, 4, 8, 16, 32, 64, 128].includes(value)
}

/**
 * Type guard for mirror texture.
 */
export const isMirrorTexture = (obj: any): obj is MirrorTexture => {
  return obj &&
         typeof obj === 'object' &&
         typeof obj.id === 'string' &&
         typeof obj.objectId === 'string' &&
         obj.texture &&
         obj.bounds &&
         typeof obj.timestamp === 'number' &&
         typeof obj.version === 'number' &&
         typeof obj.isValid === 'boolean'
}

// ================================
// FACTORY FUNCTIONS
// ================================

/**
 * Create a new ECS mirror layer with pure ECS configuration.
 */
export const createECSMirrorLayer = (): ECSMirrorLayer => ({
  cameraViewport: {
    position: { x: 0, y: 0 },
    scale: 1,
    rotation: 0,
    bounds: {
      width: 800,
      height: 600
    }
  },
  zoomLevel: 1,
  camera: {
    isPanning: false,
    panStart: null,
    velocity: { x: 0, y: 0 },
    smoothing: {
      enabled: true,
      factor: 0.1
    },
    momentum: {
      enabled: true,
      decay: 0.95
    }
  },
  textureCache: new Map(),
  zoomBehavior: {
    currentLevel: 1,
    showCompleteGeometry: true,  // At zoom 1
    showCameraViewport: false,   // At zoom 2+
    wasdTarget: 'inactive',      // At zoom 1
    transitionDuration: 300,
    enableSmoothTransitions: true,
    pixelPerfectAlignment: true
  },
  display: {
    isVisible: true,
    opacity: 1.0,
    blendMode: 'normal',
    lastUpdateTime: 0,
    needsRedraw: false,
    layerVersion: 0
  },
  config: {
    enableTextureCache: true,
    cacheConfig: {
      maxCacheSize: 100,
      maxTextureAge: 30000,
      enableAutoEviction: true,
      evictionStrategy: 'lru'
    },
    enableViewportCulling: true,
    cullingMargin: 50,
    maxViewportSize: 4096
  },
  rendering: {
    isRendering: false,
    lastRenderTime: 0,
    renderQueue: [],
    batchSize: 10,
    enableBatchRendering: true
  },
  performance: {
    cacheHitRate: 0,
    textureCacheSize: 0,
    renderTime: 0,
    lastUpdateTime: 0,
    memoryUsage: 0,
    texturesLoaded: 0,
    texturesEvicted: 0
  },
  debug: {
    showCameraViewport: false,
    showTextureBounds: false,
    showPerformanceMetrics: false,
    logCacheOperations: false
  }
})

/**
 * Create a mirror texture entry.
 */
export const createMirrorTexture = (
  objectId: string,
  texture: any,
  bounds: ECSBoundingBox,
  version: number = 1
): MirrorTexture => ({
  id: `tex_${objectId}_${Date.now()}`,
  objectId,
  texture,
  bounds,
  timestamp: Date.now(),
  version,
  isValid: true
})

/**
 * Update zoom behavior based on zoom level.
 */
export const updateZoomBehavior = (
  zoomLevel: ZoomLevel,
  zoomBehavior: ZoomBehavior
): ZoomBehavior => ({
  ...zoomBehavior,
  currentLevel: zoomLevel,
  showCompleteGeometry: zoomLevel === 1,
  showCameraViewport: zoomLevel > 1,
  wasdTarget: zoomLevel === 1 ? 'inactive' : 'camera-viewport'
})

// NO direct geometry storage
// NO sampling window (that's data layer)
// NO backward compatibility
// NO legacy mirror types