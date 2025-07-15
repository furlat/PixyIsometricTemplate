/**
 * Pure Mesh System
 * 
 * Mesh system types for pixel-perfect alignment in the ECS dual-layer architecture.
 * Provides the foundation for rendering geometry with perfect vertex-to-pixel alignment.
 * Core principle: vertex (0,0) must map exactly to pixel (0,0) at all zoom levels.
 */

import { VertexCoordinate, PixeloidCoordinate } from './ecs-coordinates'

// ================================
// MESH RESOLUTION TYPES
// ================================

/**
 * Valid mesh resolution levels.
 * Only powers of 2 for perfect pixel alignment.
 */
export type MeshLevel = 1 | 2 | 4 | 8 | 16 | 32 | 64 | 128

/**
 * Mesh resolution configuration.
 */
export interface MeshResolution {
  level: MeshLevel
  vertexSpacing: number
  gridSize: {
    width: number
    height: number
  }
  isPixelPerfect: boolean
}

// ================================
// MESH ALIGNMENT TYPES
// ================================

/**
 * Pixel-perfect alignment state.
 * CRITICAL: vertex (0,0) must map exactly to pixel (0,0).
 */
export interface MeshAlignment {
  vertex00Position: VertexCoordinate // Must be exactly (0,0)
  pixelPerfectOffset: VertexCoordinate
  isAligned: boolean
  lastValidation: number
  tolerance: number
}

/**
 * Alignment validation result.
 */
export interface AlignmentValidation {
  isValid: boolean
  deviationX: number
  deviationY: number
  tolerance: number
  recommendedCorrection: VertexCoordinate | null
}

// ================================
// MESH DATA TYPES
// ================================

/**
 * Mesh vertex data for GPU rendering.
 */
export interface MeshVertexData {
  vertices: VertexCoordinate[]
  vertexBuffer: Float32Array
  indexBuffer: Uint16Array
  vertexCount: number
  indexCount: number
  bufferSize: number
  isValid: boolean
}

/**
 * Static mesh data for ECS integration.
 */
export interface StaticMeshData {
  resolution: MeshLevel
  vertices: Float32Array
  indices: Uint16Array
  bounds: {
    minX: number
    minY: number
    maxX: number
    maxY: number
  }
  isPixelPerfect: boolean
  version: number
}

/**
 * GPU mesh resources.
 */
export interface MeshGPUResources {
  vertexBuffer: GPUBuffer | null
  indexBuffer: GPUBuffer | null
  bindingGroup: GPUBindGroup | null
  isReady: boolean
  lastUpdate: number
  needsUpdate: boolean
}

// ================================
// MESH SYSTEM INTERFACE
// ================================

/**
 * Mesh System - Pixel-perfect mesh alignment and GPU integration.
 * 
 * CRITICAL MESH PRINCIPLES:
 * - vertex (0,0) maps exactly to pixel (0,0)
 * - Only integer mesh levels (powers of 2)
 * - Pixel-perfect alignment at all zoom levels
 * - GPU-accelerated rendering
 */
export interface MeshSystem {
  // ================================
  // CURRENT MESH CONFIGURATION
  // ================================
  currentResolution: MeshResolution
  
  // ================================
  // PIXEL-PERFECT ALIGNMENT STATE
  // ================================
  alignment: MeshAlignment
  
  // ================================
  // MESH DATA
  // ================================
  vertexData: MeshVertexData
  staticMeshData: StaticMeshData
  
  // ================================
  // GPU INTEGRATION
  // ================================
  gpu: MeshGPUResources
  
  // ================================
  // MESH STATE
  // ================================
  state: {
    isActive: boolean
    currentLevel: MeshLevel
    needsUpdate: boolean
    lastMeshUpdate: number
    version: number
  }
  
  // ================================
  // MESH CACHE (different resolution levels)
  // ================================
  meshCache: Map<MeshLevel, MeshVertexData>
  
  // ================================
  // GENERATION STATE
  // ================================
  generation: {
    isGenerating: boolean
    currentLevel: MeshLevel
    progress: number
    estimatedCompletion: number
    lastGeneration: number
  }
  
  // ================================
  // CONFIGURATION
  // ================================
  config: {
    enableCaching: boolean
    maxCachedLevels: number
    autoUpdateAlignment: boolean
    alignmentCheckInterval: number
    enableGPUAcceleration: boolean
    pixelPerfectTolerance: number
  }
  
  // ================================
  // PERFORMANCE METRICS
  // ================================
  performance: {
    vertexCount: number
    indexCount: number
    bufferSize: number
    uploadTime: number
    lastGenTime: number
    memoryUsage: number
    cacheHitRate: number
  }
  
  // ================================
  // DEBUG INFO
  // ================================
  debug: {
    showMeshGrid: boolean
    showAlignmentInfo: boolean
    validateAlignment: boolean
    logMeshOperations: boolean
  }
}

// ================================
// MESH SYSTEM ACTIONS
// ================================

/**
 * Mesh system actions - Resolution and alignment operations.
 */
export interface MeshSystemActions {
  // ================================
  // RESOLUTION OPERATIONS
  // ================================
  setMeshLevel(level: MeshLevel): void
  updateResolution(resolution: MeshResolution): void
  optimizeResolution(): void
  
  // ================================
  // MESH OPERATIONS
  // ================================
  regenerateMesh(): void
  updateVertexBuffer(): void
  validateMesh(): boolean
  
  // ================================
  // ALIGNMENT OPERATIONS
  // ================================
  validateAlignment(): AlignmentValidation
  correctAlignment(): void
  resetAlignment(): void
  
  // ================================
  // GPU OPERATIONS
  // ================================
  uploadToGPU(): void
  clearGPUResources(): void
  updateGPUBuffers(): void
  
  // ================================
  // CACHE OPERATIONS
  // ================================
  cacheMeshLevel(level: MeshLevel): void
  evictCachedMesh(level: MeshLevel): void
  clearMeshCache(): void
  optimizeMeshCache(): void
  
  // ================================
  // PERFORMANCE OPERATIONS
  // ================================
  measurePerformance(): void
  optimizeMesh(): void
  compactBuffers(): void
  
  // ================================
  // DEBUG OPERATIONS
  // ================================
  exportMeshState(): string
  validateMeshIntegrity(): boolean
}

// ================================
// COORDINATE MAPPING TYPES
// ================================

/**
 * Pixeloid to vertex coordinate mapping.
 */
export interface PixeloidVertexMapping {
  pixeloidToVertex: Map<string, VertexCoordinate>
  vertexToPixeloid: Map<string, PixeloidCoordinate>
  currentResolution: MeshResolution
  mappingVersion: number
  lastUpdate: number
  viewportBounds: {
    pixeloid: {
      minX: number
      maxX: number
      minY: number
      maxY: number
    }
    vertex: {
      minX: number
      maxX: number
      minY: number
      maxY: number
    }
  }
  viewportOffset: PixeloidCoordinate
  performance: {
    conversionTime: number
    cacheHitRate: number
    totalConversions: number
    failedConversions: number
  }
}

// ================================
// TYPE GUARDS
// ================================

/**
 * Type guard for mesh system.
 */
export const isMeshSystem = (obj: any): obj is MeshSystem => {
  return obj &&
         typeof obj === 'object' &&
         obj.currentResolution &&
         obj.alignment &&
         obj.vertexData &&
         obj.staticMeshData &&
         obj.gpu &&
         obj.state &&
         obj.meshCache instanceof Map
}

/**
 * Type guard for mesh level.
 */
export const isMeshLevel = (value: any): value is MeshLevel => {
  return typeof value === 'number' &&
         [1, 2, 4, 8, 16, 32, 64, 128].includes(value)
}

/**
 * Type guard for mesh resolution.
 */
export const isMeshResolution = (obj: any): obj is MeshResolution => {
  return obj &&
         typeof obj === 'object' &&
         isMeshLevel(obj.level) &&
         typeof obj.vertexSpacing === 'number' &&
         obj.gridSize &&
         typeof obj.isPixelPerfect === 'boolean'
}

/**
 * Type guard for static mesh data.
 */
export const isStaticMeshData = (obj: any): obj is StaticMeshData => {
  return obj &&
         typeof obj === 'object' &&
         isMeshLevel(obj.resolution) &&
         obj.vertices instanceof Float32Array &&
         obj.indices instanceof Uint16Array &&
         obj.bounds &&
         typeof obj.isPixelPerfect === 'boolean' &&
         typeof obj.version === 'number'
}

// ================================
// FACTORY FUNCTIONS
// ================================

/**
 * Create a new mesh system with pure ECS configuration.
 */
export const createMeshSystem = (): MeshSystem => ({
  currentResolution: {
    level: 1,
    vertexSpacing: 1.0,
    gridSize: { width: 100, height: 100 },
    isPixelPerfect: true
  },
  alignment: {
    vertex00Position: { x: 0, y: 0 },
    pixelPerfectOffset: { x: 0, y: 0 },
    isAligned: true,
    lastValidation: 0,
    tolerance: 0.001
  },
  vertexData: {
    vertices: [],
    vertexBuffer: new Float32Array(0),
    indexBuffer: new Uint16Array(0),
    vertexCount: 0,
    indexCount: 0,
    bufferSize: 0,
    isValid: false
  },
  staticMeshData: {
    resolution: 1,
    vertices: new Float32Array(0),
    indices: new Uint16Array(0),
    bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    isPixelPerfect: true,
    version: 0
  },
  gpu: {
    vertexBuffer: null,
    indexBuffer: null,
    bindingGroup: null,
    isReady: false,
    lastUpdate: 0,
    needsUpdate: false
  },
  state: {
    isActive: false,
    currentLevel: 1,
    needsUpdate: true,
    lastMeshUpdate: 0,
    version: 0
  },
  meshCache: new Map(),
  generation: {
    isGenerating: false,
    currentLevel: 1,
    progress: 0,
    estimatedCompletion: 0,
    lastGeneration: 0
  },
  config: {
    enableCaching: true,
    maxCachedLevels: 8,
    autoUpdateAlignment: true,
    alignmentCheckInterval: 1000,
    enableGPUAcceleration: true,
    pixelPerfectTolerance: 0.001
  },
  performance: {
    vertexCount: 0,
    indexCount: 0,
    bufferSize: 0,
    uploadTime: 0,
    lastGenTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0
  },
  debug: {
    showMeshGrid: false,
    showAlignmentInfo: false,
    validateAlignment: true,
    logMeshOperations: false
  }
})

/**
 * Create a mesh resolution configuration.
 */
export const createMeshResolution = (
  level: MeshLevel,
  vertexSpacing: number,
  gridWidth: number,
  gridHeight: number
): MeshResolution => ({
  level,
  vertexSpacing,
  gridSize: { width: gridWidth, height: gridHeight },
  isPixelPerfect: true
})

/**
 * Create static mesh data.
 */
export const createStaticMeshData = (
  resolution: MeshLevel,
  vertices: Float32Array,
  indices: Uint16Array,
  bounds: StaticMeshData['bounds']
): StaticMeshData => ({
  resolution,
  vertices,
  indices,
  bounds,
  isPixelPerfect: true,
  version: Date.now()
})

/**
 * Create pixeloid-vertex mapping.
 */
export const createPixeloidVertexMapping = (
  resolution: MeshResolution
): PixeloidVertexMapping => ({
  pixeloidToVertex: new Map(),
  vertexToPixeloid: new Map(),
  currentResolution: resolution,
  mappingVersion: 0,
  lastUpdate: 0,
  viewportBounds: {
    pixeloid: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
    vertex: { minX: 0, maxX: 0, minY: 0, maxY: 0 }
  },
  viewportOffset: { x: 0, y: 0 },
  performance: {
    conversionTime: 0,
    cacheHitRate: 0,
    totalConversions: 0,
    failedConversions: 0
  }
})

// ================================
// MESH CONSTANTS
// ================================

/**
 * Mesh system constants.
 */
export const MESH_CONSTANTS = {
  VALID_LEVELS: [1, 2, 4, 8, 16, 32, 64, 128] as const,
  PIXEL_PERFECT_TOLERANCE: 0.001,
  VERTEX_00_POSITION: { x: 0, y: 0 } as const,
  DEFAULT_VERTEX_SPACING: 1.0,
  MAX_CACHE_LEVELS: 8
} as const

// ================================
// COORDINATE SYSTEM INTEGRATION
// ================================

/**
 * Convert pixeloid coordinate to mesh vertex coordinate.
 */
export const pixeloidToMeshVertex = (
  pixeloid: PixeloidCoordinate,
  level: MeshLevel
): VertexCoordinate => ({
  x: pixeloid.x / level,
  y: pixeloid.y / level
})

/**
 * Convert mesh vertex coordinate to pixeloid coordinate.
 */
export const meshVertexToPixeloid = (
  vertex: VertexCoordinate,
  level: MeshLevel
): PixeloidCoordinate => ({
  x: vertex.x * level,
  y: vertex.y * level
})

// ================================
// ZOOM LEVEL SYNCHRONIZATION
// ================================

/**
 * Sync mesh level with zoom level.
 */
export const syncMeshLevelWithZoom = (zoomLevel: number): MeshLevel => {
  const validLevels: MeshLevel[] = [1, 2, 4, 8, 16, 32, 64, 128]
  
  // Find the closest valid mesh level
  let closestLevel: MeshLevel = 1
  let minDiff = Math.abs(zoomLevel - 1)
  
  for (const level of validLevels) {
    const diff = Math.abs(zoomLevel - level)
    if (diff < minDiff) {
      minDiff = diff
      closestLevel = level
    }
  }
  
  return closestLevel
}

/**
 * Validate mesh level alignment with zoom level.
 */
export const validateMeshZoomAlignment = (
  meshLevel: MeshLevel,
  zoomLevel: number
): boolean => {
  const recommendedLevel = syncMeshLevelWithZoom(zoomLevel)
  return meshLevel === recommendedLevel
}

// ================================
// ECS LAYER INTEGRATION INTERFACES
// ================================

/**
 * Update mesh for data layer interface.
 */
export interface MeshDataLayerUpdate {
  updateMeshForDataLayer(dataLayer: any): void // Will be properly typed when ECS layers are integrated
}

/**
 * Update mesh for mirror layer interface.
 */
export interface MeshMirrorLayerUpdate {
  updateMeshForMirrorLayer(mirrorLayer: any): void // Will be properly typed when ECS layers are integrated
}

// NO legacy mesh compatibility
// NO backward compatibility helpers
// NO mixed mesh systems