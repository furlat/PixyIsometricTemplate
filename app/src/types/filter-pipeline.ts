/**
 * Pure ECS Filter Pipeline
 * 
 * Corrected filter pipeline architecture for the ECS dual-layer system.
 * CRITICAL FIX: pre-filters → viewport → post-filters (NOT viewport → filters)
 * Core principle: Filters must be applied in the correct order for proper rendering.
 */

import { PixeloidCoordinate, ECSBoundingBox } from './ecs-coordinates'
import { ZoomLevel } from './ecs-mirror-layer'

// ================================
// FILTER STAGE TYPES
// ================================

/**
 * Filter pipeline stages - CORRECTED ARCHITECTURE.
 */
export type FilterStage = 'pre-filter' | 'viewport' | 'post-filter'

/**
 * Filter execution order - CRITICAL: Must be pre → viewport → post.
 */
export interface FilterExecutionOrder {
  readonly stage1: 'pre-filter'
  readonly stage2: 'viewport'
  readonly stage3: 'post-filter'
}

// ================================
// FILTER TYPES
// ================================

/**
 * Pre-filter types - Applied BEFORE viewport sampling.
 */
export type PreFilterType = 
  | 'color-adjustment'
  | 'brightness-contrast'
  | 'gamma-correction'
  | 'texture-preparation'
  | 'anti-aliasing'
  | 'blur-preprocessing'

/**
 * Viewport operation type - Applied AFTER pre-filters.
 */
export type ViewportOperationType = 
  | 'viewport-sampling'
  | 'camera-transform'
  | 'zoom-scaling'
  | 'pan-translation'
  | 'rotation-transform'

/**
 * Post-filter types - Applied AFTER viewport operation.
 */
export type PostFilterType = 
  | 'pixelate'
  | 'selection-highlight'
  | 'mouse-highlight'
  | 'grid-overlay'
  | 'ui-overlay'
  | 'final-composite'

// ================================
// FILTER CONFIGURATION
// ================================

/**
 * Generic filter configuration.
 */
export interface FilterConfig {
  readonly id: string
  readonly type: PreFilterType | PostFilterType
  readonly stage: FilterStage
  readonly enabled: boolean
  readonly priority: number
  readonly parameters: Record<string, any>
  readonly metadata: {
    readonly name: string
    readonly description: string
    readonly version: string
    readonly author: string
  }
}

/**
 * Pre-filter configuration.
 */
export interface PreFilterConfig extends FilterConfig {
  readonly type: PreFilterType
  readonly stage: 'pre-filter'
  readonly inputFormat: 'rgba' | 'rgb' | 'luminance'
  readonly outputFormat: 'rgba' | 'rgb' | 'luminance'
  readonly supportsGPU: boolean
}

/**
 * Viewport operation configuration.
 */
export interface ViewportConfig {
  readonly id: string
  readonly type: ViewportOperationType
  readonly stage: 'viewport'
  readonly enabled: boolean
  readonly priority: number
  readonly parameters: {
    readonly position: PixeloidCoordinate
    readonly scale: number
    readonly rotation: number
    readonly bounds: ECSBoundingBox
  }
  readonly metadata: {
    readonly name: string
    readonly description: string
    readonly version: string
  }
}

/**
 * Post-filter configuration.
 */
export interface PostFilterConfig extends FilterConfig {
  readonly type: PostFilterType
  readonly stage: 'post-filter'
  readonly inputFormat: 'rgba' | 'rgb' | 'luminance'
  readonly outputFormat: 'rgba' | 'rgb' | 'luminance'
  readonly supportsGPU: boolean
  readonly requiresDepthBuffer: boolean
}

// ================================
// FILTER PIPELINE INTERFACE
// ================================

/**
 * ECS Filter Pipeline - CORRECTED ARCHITECTURE.
 * 
 * CRITICAL FILTER PRINCIPLES:
 * - Stage 1: Pre-filters (texture preparation, color adjustment)
 * - Stage 2: Viewport operation (camera transform, zoom, pan)
 * - Stage 3: Post-filters (pixelate, selection, overlays)
 * - NO filters applied to viewport operation itself
 * - Filters are applied TO THE RESULT of viewport operation
 */
export interface FilterPipeline {
  // ================================
  // PIPELINE CONFIGURATION
  // ================================
  readonly executionOrder: FilterExecutionOrder
  
  // ================================
  // FILTER STAGES (CORRECTED ORDER)
  // ================================
  preFilters: PreFilterConfig[]
  viewportOperation: ViewportConfig
  postFilters: PostFilterConfig[]
  
  // ================================
  // PIPELINE STATE
  // ================================
  state: {
    isActive: boolean
    currentStage: FilterStage | null
    isProcessing: boolean
    lastExecution: number
    executionCount: number
    needsUpdate: boolean
    pipelineVersion: number
  }
  
  // ================================
  // EXECUTION CONTEXT
  // ================================
  context: {
    currentZoomLevel: ZoomLevel
    inputTexture: any | null // PIXI.Texture
    outputTexture: any | null // PIXI.Texture
    intermediateTextures: Map<string, any> // Stage textures
    renderTarget: any | null // PIXI.RenderTarget
    gpuContext: any | null // WebGL/WebGPU context
  }
  
  // ================================
  // PIPELINE RESOURCES
  // ================================
  resources: {
    shaderPrograms: Map<string, any>
    uniformBuffers: Map<string, any>
    textureUnits: Map<string, number>
    frameBuffers: Map<string, any>
    renderTargets: Map<string, any>
  }
  
  // ================================
  // PERFORMANCE METRICS
  // ================================
  performance: {
    totalExecutionTime: number
    preFilterTime: number
    viewportTime: number
    postFilterTime: number
    gpuUtilization: number
    memoryUsage: number
    pipelineEfficiency: number
  }
  
  // ================================
  // ERROR HANDLING
  // ================================
  errors: {
    lastError: string | null
    errorCount: number
    failedStage: FilterStage | null
    errorHistory: Array<{
      stage: FilterStage
      error: string
      timestamp: number
    }>
  }
  
  // ================================
  // DEBUG INFO
  // ================================
  debug: {
    showPipelineStages: boolean
    showFilterBounds: boolean
    showPerformanceMetrics: boolean
    logPipelineExecution: boolean
    enableStageBreakpoints: boolean
  }
}

// ================================
// FILTER PIPELINE ACTIONS
// ================================

/**
 * Filter pipeline actions - CORRECTED EXECUTION ORDER.
 */
export interface FilterPipelineActions {
  // ================================
  // PIPELINE EXECUTION (CORRECTED ORDER)
  // ================================
  executePipeline(inputTexture: any): Promise<any>
  executePreFilters(inputTexture: any): Promise<any>
  executeViewportOperation(inputTexture: any): Promise<any>
  executePostFilters(inputTexture: any): Promise<any>
  
  // ================================
  // FILTER MANAGEMENT
  // ================================
  addPreFilter(config: PreFilterConfig): void
  addPostFilter(config: PostFilterConfig): void
  removeFilter(filterId: string): void
  updateFilter(filterId: string, updates: Partial<FilterConfig>): void
  
  // ================================
  // VIEWPORT OPERATIONS
  // ================================
  updateViewportOperation(config: ViewportConfig): void
  
  // ================================
  // PIPELINE CONTROL
  // ================================
  startPipeline(): void
  stopPipeline(): void
  pausePipeline(): void
  resumePipeline(): void
  resetPipeline(): void
  
  // ================================
  // RESOURCE MANAGEMENT
  // ================================
  allocateResources(): void
  releaseResources(): void
  optimizeResources(): void
  
  // ================================
  // ERROR HANDLING
  // ================================
  handlePipelineError(stage: FilterStage, error: string): void
  clearErrors(): void
  
  // ================================
  // DEBUG OPERATIONS
  // ================================
  validatePipeline(): boolean
  exportPipelineState(): string
  importPipelineState(state: string): void
}

// ================================
// FILTER EXECUTION RESULT
// ================================

/**
 * Filter execution result.
 */
export interface FilterExecutionResult {
  success: boolean
  outputTexture: any | null
  executionTime: number
  stage: FilterStage
  metadata: {
    filtersApplied: string[]
    inputFormat: string
    outputFormat: string
    resolution: {
      width: number
      height: number
    }
  }
  performance: {
    gpuTime: number
    cpuTime: number
    memoryUsed: number
    cacheHits: number
    cacheMisses: number
  }
  errors: string[]
}

// ================================
// FILTER SHADER TYPES
// ================================

/**
 * Filter shader configuration.
 */
export interface FilterShader {
  readonly id: string
  readonly type: PreFilterType | PostFilterType
  readonly vertexShader: string
  readonly fragmentShader: string
  readonly uniforms: Record<string, any>
  readonly attributes: Record<string, any>
  readonly varyings: Record<string, any>
  readonly supportsInstancing: boolean
  readonly isCompiled: boolean
}

/**
 * Shader compilation result.
 */
export interface ShaderCompilationResult {
  success: boolean
  shader: any | null // WebGL shader
  errors: string[]
  warnings: string[]
  compilationTime: number
}

// ================================
// TYPE GUARDS
// ================================

/**
 * Type guard for filter pipeline.
 */
export const isFilterPipeline = (obj: any): obj is FilterPipeline => {
  return obj &&
         typeof obj === 'object' &&
         obj.executionOrder &&
         obj.executionOrder.stage1 === 'pre-filter' &&
         obj.executionOrder.stage2 === 'viewport' &&
         obj.executionOrder.stage3 === 'post-filter' &&
         Array.isArray(obj.preFilters) &&
         obj.viewportOperation &&
         Array.isArray(obj.postFilters)
}

/**
 * Type guard for filter stage.
 */
export const isFilterStage = (value: any): value is FilterStage => {
  return typeof value === 'string' &&
         ['pre-filter', 'viewport', 'post-filter'].includes(value)
}

/**
 * Type guard for pre-filter config.
 */
export const isPreFilterConfig = (obj: any): obj is PreFilterConfig => {
  return obj &&
         typeof obj === 'object' &&
         obj.stage === 'pre-filter' &&
         typeof obj.type === 'string' &&
         typeof obj.enabled === 'boolean' &&
         typeof obj.priority === 'number'
}

/**
 * Type guard for post-filter config.
 */
export const isPostFilterConfig = (obj: any): obj is PostFilterConfig => {
  return obj &&
         typeof obj === 'object' &&
         obj.stage === 'post-filter' &&
         typeof obj.type === 'string' &&
         typeof obj.enabled === 'boolean' &&
         typeof obj.priority === 'number'
}

// ================================
// FACTORY FUNCTIONS
// ================================

/**
 * Create a new filter pipeline with CORRECTED ARCHITECTURE.
 */
export const createFilterPipeline = (): FilterPipeline => ({
  executionOrder: {
    stage1: 'pre-filter',
    stage2: 'viewport',
    stage3: 'post-filter'
  },
  preFilters: [],
  viewportOperation: {
    id: 'viewport_transform',
    type: 'viewport-sampling',
    stage: 'viewport',
    enabled: true,
    priority: 0,
    parameters: {
      position: { x: 0, y: 0 },
      scale: 1,
      rotation: 0,
      bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 }
    },
    metadata: {
      name: 'Viewport Transform',
      description: 'Camera viewport transformation',
      version: '1.0.0'
    }
  },
  postFilters: [],
  state: {
    isActive: false,
    currentStage: null,
    isProcessing: false,
    lastExecution: 0,
    executionCount: 0,
    needsUpdate: false,
    pipelineVersion: 0
  },
  context: {
    currentZoomLevel: 1,
    inputTexture: null,
    outputTexture: null,
    intermediateTextures: new Map(),
    renderTarget: null,
    gpuContext: null
  },
  resources: {
    shaderPrograms: new Map(),
    uniformBuffers: new Map(),
    textureUnits: new Map(),
    frameBuffers: new Map(),
    renderTargets: new Map()
  },
  performance: {
    totalExecutionTime: 0,
    preFilterTime: 0,
    viewportTime: 0,
    postFilterTime: 0,
    gpuUtilization: 0,
    memoryUsage: 0,
    pipelineEfficiency: 0
  },
  errors: {
    lastError: null,
    errorCount: 0,
    failedStage: null,
    errorHistory: []
  },
  debug: {
    showPipelineStages: false,
    showFilterBounds: false,
    showPerformanceMetrics: false,
    logPipelineExecution: false,
    enableStageBreakpoints: false
  }
})

/**
 * Create a pre-filter configuration.
 */
export const createPreFilterConfig = (
  id: string,
  type: PreFilterType,
  parameters: Record<string, any>
): PreFilterConfig => ({
  id,
  type,
  stage: 'pre-filter',
  enabled: true,
  priority: 0,
  parameters,
  inputFormat: 'rgba',
  outputFormat: 'rgba',
  supportsGPU: true,
  metadata: {
    name: `Pre-filter: ${type}`,
    description: `Pre-filter for ${type}`,
    version: '1.0.0',
    author: 'ECS System'
  }
})

/**
 * Create a post-filter configuration.
 */
export const createPostFilterConfig = (
  id: string,
  type: PostFilterType,
  parameters: Record<string, any>
): PostFilterConfig => ({
  id,
  type,
  stage: 'post-filter',
  enabled: true,
  priority: 0,
  parameters,
  inputFormat: 'rgba',
  outputFormat: 'rgba',
  supportsGPU: true,
  requiresDepthBuffer: false,
  metadata: {
    name: `Post-filter: ${type}`,
    description: `Post-filter for ${type}`,
    version: '1.0.0',
    author: 'ECS System'
  }
})

// ================================
// FILTER PIPELINE CONSTANTS
// ================================

/**
 * Filter pipeline constants - CORRECTED ARCHITECTURE.
 */
export const FILTER_PIPELINE_CONSTANTS = {
  EXECUTION_ORDER: {
    STAGE1: 'pre-filter',
    STAGE2: 'viewport',
    STAGE3: 'post-filter'
  } as const,
  
  SUPPORTED_FORMATS: ['rgba', 'rgb', 'luminance'] as const,
  
  DEFAULT_PRIORITIES: {
    PRE_FILTER: 0,
    VIEWPORT: 1000,
    POST_FILTER: 2000
  } as const,
  
  PERFORMANCE_TARGETS: {
    MAX_EXECUTION_TIME: 16.67, // 60 FPS
    MAX_MEMORY_USAGE: 1024 * 1024 * 100, // 100MB
    MIN_EFFICIENCY: 0.8
  } as const
} as const

// ================================
// ECS LAYER INTEGRATION
// ================================

/**
 * Apply filter pipeline to data layer.
 */
export interface FilterDataLayerIntegration {
  applyToDataLayer(dataLayer: any): FilterExecutionResult // Will be properly typed when ECS layers are integrated
}

/**
 * Apply filter pipeline to mirror layer.
 */
export interface FilterMirrorLayerIntegration {
  applyToMirrorLayer(mirrorLayer: any): FilterExecutionResult // Will be properly typed when ECS layers are integrated
}

// ================================
// ZOOM-AWARE FILTERING
// ================================

/**
 * Update filters for zoom level.
 */
export const updateFiltersForZoom = (
  pipeline: FilterPipeline,
  zoomLevel: number
): FilterPipeline => {
  // Update filter parameters based on zoom level
  const updatedPreFilters = pipeline.preFilters.map(filter => ({
    ...filter,
    parameters: {
      ...filter.parameters,
      zoomLevel,
      scale: zoomLevel
    }
  }))
  
  const updatedPostFilters = pipeline.postFilters.map(filter => ({
    ...filter,
    parameters: {
      ...filter.parameters,
      zoomLevel,
      scale: zoomLevel
    }
  }))
  
  return {
    ...pipeline,
    preFilters: updatedPreFilters,
    postFilters: updatedPostFilters,
    context: {
      ...pipeline.context,
      currentZoomLevel: zoomLevel as ZoomLevel
    }
  }
}

/**
 * Get active filters for zoom level.
 */
export const getActiveFiltersForZoom = (
  pipeline: FilterPipeline,
  zoomLevel: number
): FilterConfig[] => {
  const allFilters = [...pipeline.preFilters, ...pipeline.postFilters]
  
  return allFilters.filter(filter => {
    // Filter logic based on zoom level
    const minZoom = filter.parameters.minZoom || 1
    const maxZoom = filter.parameters.maxZoom || 128
    
    return zoomLevel >= minZoom && zoomLevel <= maxZoom
  })
}

// NO legacy filter pipeline
// NO incorrect filter ordering
// NO backward compatibility
// NO mixed filter architectures