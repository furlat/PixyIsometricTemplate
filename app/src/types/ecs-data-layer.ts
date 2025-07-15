/**
 * Pure ECS Data Layer
 * 
 * ECS data layer types for fixed-scale geometry storage and viewport sampling.
 * Always operates at scale 1 with NO camera viewport transforms.
 * Core principle: Data layer = ECS viewport sampling, NOT camera viewport.
 */

import { PixeloidCoordinate, ECSViewportBounds, ECSBoundingBox } from './ecs-coordinates'

// ================================
// GEOMETRIC OBJECT TYPES
// ================================

/**
 * Core geometric object interface - always stored at scale 1.
 */
export interface GeometricObject {
  readonly id: string
  readonly type: 'point' | 'line' | 'circle' | 'rectangle' | 'diamond'
  readonly vertices: PixeloidCoordinate[]
  readonly isVisible: boolean
  readonly createdAt: number
  readonly style: {
    readonly color: number
    readonly strokeWidth: number
    readonly strokeAlpha: number
    readonly fillColor?: number
    readonly fillAlpha?: number
  }
  readonly bounds: ECSBoundingBox
}

/**
 * Object creation parameters.
 */
export interface CreateGeometricObjectParams {
  readonly type: GeometricObject['type']
  readonly vertices: PixeloidCoordinate[]
  readonly style: GeometricObject['style']
}

// ================================
// ECS DATA LAYER INTERFACE
// ================================

/**
 * ECS Data Layer - Core geometry storage at fixed scale 1.
 * 
 * CRITICAL ECS PRINCIPLES:
 * - ALWAYS scale 1 (literal type prevents violations)
 * - NO camera viewport transforms
 * - ONLY ECS viewport sampling
 * - WASD at zoom 1: moves sampling window
 * - WASD at zoom 2+: layer is INACTIVE (hidden)
 */
export interface ECSDataLayer {
  // ================================
  // ECS CORE PRINCIPLE: Always scale 1
  // ================================
  readonly scale: 1
  
  // ================================
  // SAMPLING WINDOW (moves with WASD at zoom 1)
  // ================================
  samplingWindow: {
    position: PixeloidCoordinate
    bounds: ECSViewportBounds
  }
  
  // ================================
  // GEOMETRY STORAGE (scale 1 only)
  // ================================
  allObjects: GeometricObject[]
  visibleObjects: GeometricObject[] // Objects within sampling window
  
  // ================================
  // DATA BOUNDS (expands as geometry is added)
  // ================================
  dataBounds: ECSBoundingBox
  
  // ================================
  // SAMPLING STATE
  // ================================
  sampling: {
    isActive: boolean
    lastSampleTime: number
    samplingVersion: number
    needsResample: boolean
  }
  
  // ================================
  // CONFIGURATION
  // ================================
  config: {
    enableSampling: boolean
    samplingBuffer: number // Extra pixeloids around viewport
    maxVisibleObjects: number
    enableFrustumCulling: boolean
  }
  
  // ================================
  // PERFORMANCE METRICS
  // ================================
  performance: {
    lastRenderTime: number
    objectsRendered: number
    samplingTime: number
    memoryUsage: number
  }
  
  // ================================
  // DEBUG INFO
  // ================================
  debug: {
    showSamplingBounds: boolean
    showDataBounds: boolean
    logSamplingOps: boolean
  }
}

// ================================
// ECS DATA LAYER ACTIONS
// ================================

/**
 * Data layer actions - ECS viewport sampling operations.
 */
export interface ECSDataLayerActions {
  // ================================
  // SAMPLING OPERATIONS (WASD at zoom 1)
  // ================================
  updateSamplingPosition(position: PixeloidCoordinate): void
  updateSamplingBounds(bounds: ECSViewportBounds): void
  resampleVisibleObjects(): void
  
  // ================================
  // OBJECT OPERATIONS
  // ================================
  addObject(params: CreateGeometricObjectParams): string
  removeObject(objectId: string): void
  updateObject(objectId: string, updates: Partial<GeometricObject>): void
  clearAllObjects(): void
  
  // ================================
  // DATA BOUNDS OPERATIONS
  // ================================
  expandDataBounds(newBounds: ECSBoundingBox): void
  optimizeDataBounds(): void
  
  // ================================
  // PERFORMANCE OPERATIONS
  // ================================
  optimizeDataLayer(): void
  validateDataIntegrity(): boolean
}

// ================================
// SAMPLING RESULT
// ================================

/**
 * Result of viewport sampling operation.
 */
export interface SamplingResult {
  objects: GeometricObject[]
  metadata: {
    samplingTime: number
    objectsFound: number
    objectsChecked: number
    samplingBounds: ECSViewportBounds
  }
  performance: {
    samplingDuration: number
    cacheHits: number
    cacheMisses: number
  }
}

// ================================
// TYPE GUARDS
// ================================

/**
 * Type guard for ECS data layer.
 */
export const isECSDataLayer = (obj: any): obj is ECSDataLayer => {
  return obj &&
         typeof obj === 'object' &&
         obj.scale === 1 && // CRITICAL: Must be scale 1
         obj.samplingWindow &&
         Array.isArray(obj.allObjects) &&
         Array.isArray(obj.visibleObjects)
}

/**
 * Type guard for geometric object.
 */
export const isGeometricObject = (obj: any): obj is GeometricObject => {
  return obj &&
         typeof obj === 'object' &&
         typeof obj.id === 'string' &&
         typeof obj.type === 'string' &&
         Array.isArray(obj.vertices) &&
         typeof obj.isVisible === 'boolean' &&
         obj.style &&
         obj.bounds
}

// ================================
// FACTORY FUNCTIONS
// ================================

/**
 * Create a new ECS data layer with pure ECS configuration.
 */
export const createECSDataLayer = (): ECSDataLayer => ({
  scale: 1, // ECS principle: always scale 1
  samplingWindow: {
    position: { x: 0, y: 0 },
    bounds: {
      topLeft: { x: 0, y: 0 },
      bottomRight: { x: 100, y: 100 },
      width: 100,
      height: 100
    }
  },
  allObjects: [],
  visibleObjects: [],
  dataBounds: {
    minX: 0,
    minY: 0,
    maxX: 0,
    maxY: 0,
    width: 0,
    height: 0
  },
  sampling: {
    isActive: true,
    lastSampleTime: 0,
    samplingVersion: 0,
    needsResample: true
  },
  config: {
    enableSampling: true,
    samplingBuffer: 10,
    maxVisibleObjects: 1000,
    enableFrustumCulling: true
  },
  performance: {
    lastRenderTime: 0,
    objectsRendered: 0,
    samplingTime: 0,
    memoryUsage: 0
  },
  debug: {
    showSamplingBounds: false,
    showDataBounds: false,
    logSamplingOps: false
  }
})

/**
 * Create a geometric object.
 */
export const createGeometricObject = (
  params: CreateGeometricObjectParams
): GeometricObject => {
  const bounds = calculateObjectBounds(params.vertices)
  
  return {
    id: generateObjectId(),
    type: params.type,
    vertices: params.vertices,
    isVisible: true,
    createdAt: Date.now(),
    style: params.style,
    bounds
  }
}

// ================================
// UTILITY FUNCTIONS
// ================================

/**
 * Calculate bounding box for vertices.
 */
export const calculateObjectBounds = (vertices: PixeloidCoordinate[]): ECSBoundingBox => {
  if (vertices.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 }
  }
  
  const xs = vertices.map(v => v.x)
  const ys = vertices.map(v => v.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  }
}

/**
 * Generate unique object ID.
 */
const generateObjectId = (): string => {
  return `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// NO legacy geometry types
// NO camera viewport properties
// NO backward compatibility
// NO scale properties other than literal 1