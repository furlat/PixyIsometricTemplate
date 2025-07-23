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

// ================================
// GEOMETRY PROPERTIES SYSTEM
// ================================

/**
 * Union type for all possible shape properties (store authority)
 */
export type GeometryProperties =
  | PointProperties
  | LineProperties
  | CircleProperties
  | RectangleProperties
  | DiamondProperties

/**
 * Point properties (store maintained)
 */
export interface PointProperties {
  readonly type: 'point'
  readonly center: PixeloidCoordinate
}

/**
 * Line properties (store maintained)
 */
export interface LineProperties {
  readonly type: 'line'
  readonly startPoint: PixeloidCoordinate
  readonly endPoint: PixeloidCoordinate
  readonly midpoint: PixeloidCoordinate
  readonly length: number
  readonly angle: number  // In radians
}

/**
 * Circle properties (store maintained)
 */
export interface CircleProperties {
  readonly type: 'circle'
  readonly center: PixeloidCoordinate
  readonly radius: number
  readonly diameter: number
  readonly circumference: number
  readonly area: number
}

/**
 * Rectangle properties (store maintained)
 */
export interface RectangleProperties {
  readonly type: 'rectangle'
  readonly center: PixeloidCoordinate
  readonly topLeft: PixeloidCoordinate
  readonly bottomRight: PixeloidCoordinate
  readonly width: number
  readonly height: number
  readonly area: number
  readonly perimeter: number
}

/**
 * Diamond properties (store maintained)
 */
export interface DiamondProperties {
  readonly type: 'diamond'
  readonly center: PixeloidCoordinate
  readonly west: PixeloidCoordinate
  readonly north: PixeloidCoordinate
  readonly east: PixeloidCoordinate
  readonly south: PixeloidCoordinate
  readonly width: number
  readonly height: number
  readonly area: number
  readonly perimeter: number
}

/**
 * Core geometric object interface - always stored at scale 1.
 * ✅ ENHANCED: Now includes calculated properties (store authority)
 */
export interface GeometricObject {
  readonly id: string
  readonly type: 'point' | 'line' | 'circle' | 'rectangle' | 'diamond'
  readonly vertices: PixeloidCoordinate[]  // Raw vertex data
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
  
  // ✅ NEW: Shape-specific calculated properties (store authority)
  readonly properties: GeometryProperties
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
 * Create a geometric object with calculated properties.
 * ✅ ENHANCED: Now includes automatic property calculation
 */
export const createGeometricObject = (
  params: CreateGeometricObjectParams
): GeometricObject => {
  const bounds = calculateObjectBounds(params.vertices)
  
  // ✅ FIXED: Direct property calculation (no circular dependency)
  let properties: GeometryProperties
  
  // ✅ STRICT AUTHORITY: NO FALLBACKS - vertices MUST be valid
  switch (params.type) {
    case 'point':
      if (!params.vertices[0]) {
        throw new Error('Point geometry requires center vertex - missing vertices[0]')
      }
      properties = { type: 'point', center: params.vertices[0] }
      break
    case 'line':
      if (!params.vertices[0]) {
        throw new Error('Line geometry requires start vertex - missing vertices[0]')
      }
      if (!params.vertices[1]) {
        throw new Error('Line geometry requires end vertex - missing vertices[1]')
      }
      const start = params.vertices[0]
      const end = params.vertices[1]
      const dx = end.x - start.x
      const dy = end.y - start.y
      properties = {
        type: 'line',
        startPoint: start,
        endPoint: end,
        midpoint: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
        length: Math.sqrt(dx * dx + dy * dy),
        angle: Math.atan2(dy, dx)
      }
      break
    case 'circle':
      if (!params.vertices[0]) {
        throw new Error('Circle geometry requires center vertex - missing vertices[0]')
      }
      if (!params.vertices[1]) {
        throw new Error('Circle geometry requires radius point vertex - missing vertices[1]')
      }
      const center = params.vertices[0]
      const radiusPoint = params.vertices[1]
      const radius = Math.sqrt(Math.pow(radiusPoint.x - center.x, 2) + Math.pow(radiusPoint.y - center.y, 2))
      properties = {
        type: 'circle',
        center,
        radius,
        diameter: radius * 2,
        circumference: 2 * Math.PI * radius,
        area: Math.PI * radius * radius
      }
      break
    case 'rectangle':
      if (!params.vertices[0]) {
        throw new Error('Rectangle geometry requires first corner vertex - missing vertices[0]')
      }
      if (!params.vertices[1]) {
        throw new Error('Rectangle geometry requires opposite corner vertex - missing vertices[1]')
      }
      const v1 = params.vertices[0]
      const v2 = params.vertices[1]
      const topLeft = { x: Math.min(v1.x, v2.x), y: Math.min(v1.y, v2.y) }
      const bottomRight = { x: Math.max(v1.x, v2.x), y: Math.max(v1.y, v2.y) }
      const width = bottomRight.x - topLeft.x
      const height = bottomRight.y - topLeft.y
      properties = {
        type: 'rectangle',
        center: { x: topLeft.x + width / 2, y: topLeft.y + height / 2 },
        topLeft,
        bottomRight,
        width,
        height,
        area: width * height,
        perimeter: 2 * (width + height)
      }
      break
    case 'diamond':
      if (!params.vertices[0]) {
        throw new Error('Diamond geometry requires west vertex - missing vertices[0]')
      }
      if (!params.vertices[1]) {
        throw new Error('Diamond geometry requires north vertex - missing vertices[1]')
      }
      if (!params.vertices[2]) {
        throw new Error('Diamond geometry requires east vertex - missing vertices[2]')
      }
      if (!params.vertices[3]) {
        throw new Error('Diamond geometry requires south vertex - missing vertices[3]')
      }
      const west = params.vertices[0]
      const north = params.vertices[1]
      const east = params.vertices[2]
      const south = params.vertices[3]
      const diamondWidth = east.x - west.x
      const diamondHeight = south.y - north.y
      properties = {
        type: 'diamond',
        center: { x: (west.x + east.x) / 2, y: (north.y + south.y) / 2 },
        west, north, east, south,
        width: diamondWidth,
        height: diamondHeight,
        area: (diamondWidth * diamondHeight) / 2,
        perimeter: 2 * Math.sqrt((diamondWidth/2) * (diamondWidth/2) + (diamondHeight/2) * (diamondHeight/2))
      }
      break
    default:
      throw new Error(`Unknown geometry type: ${params.type}`)
  }
  
  return {
    id: generateObjectId(),
    type: params.type,
    vertices: params.vertices,
    isVisible: true,
    createdAt: Date.now(),
    style: params.style,
    bounds,
    properties  // ✅ NEW: Include calculated properties
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