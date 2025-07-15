/**
 * Pure ECS Types - Main Export
 * 
 * Clean export of all ECS types for the dual-layer camera viewport architecture.
 * This file provides the single entry point for all ECS type definitions.
 * 
 * ARCHITECTURE OVERVIEW:
 * - ECS Coordinates: Core coordinate system (pixeloid, vertex, screen)
 * - ECS Data Layer: Fixed-scale geometry storage with viewport sampling
 * - ECS Mirror Layer: Camera viewport transforms and texture display
 * - Mesh System: Pixel-perfect mesh alignment and GPU integration
 * - Filter Pipeline: Corrected pre-filters → viewport → post-filters
 * - Game Store: Central coordination of all ECS systems
 */

// ================================
// ECS COORDINATE SYSTEM
// ================================
export type {
  // Core coordinates
  PixeloidCoordinate,
  VertexCoordinate,
  ScreenCoordinate,
  
  // ECS viewport bounds
  ECSViewportBounds,
  ECSBoundingBox
} from './ecs-coordinates'

export {
  // Coordinate validation
  isPixeloidCoordinate,
  isVertexCoordinate,
  isScreenCoordinate,
  
  // Coordinate factories
  createPixeloidCoordinate,
  createVertexCoordinate,
  createScreenCoordinate,
  createECSViewportBounds,
  createECSBoundingBox,
  
  // Constants
  ECS_COORDINATE_CONSTANTS
} from './ecs-coordinates'

// ================================
// ECS DATA LAYER (Scale 1 Only)
// ================================
export type {
  // Geometric objects
  GeometricObject,
  CreateGeometricObjectParams,
  
  // Data layer interface
  ECSDataLayer,
  ECSDataLayerActions,
  
  // Sampling
  SamplingResult
} from './ecs-data-layer'

export {
  // Type guards
  isECSDataLayer,
  isGeometricObject,
  
  // Factory functions
  createECSDataLayer,
  createGeometricObject,
  
  // Utilities
  calculateObjectBounds
} from './ecs-data-layer'

// ================================
// ECS MIRROR LAYER (Camera Viewport)
// ================================
export type {
  // Zoom levels
  ZoomLevel,
  
  // Camera viewport
  CameraViewport,
  CameraMovement,
  
  // Texture cache
  MirrorTexture,
  TextureCacheConfig,
  
  // Zoom behavior
  ZoomBehavior,
  
  // Mirror layer interface
  ECSMirrorLayer,
  ECSMirrorLayerActions,
  
  // Viewport transforms
  ViewportTransform
} from './ecs-mirror-layer'

export {
  // Type guards
  isECSMirrorLayer,
  isZoomLevel,
  isMirrorTexture,
  
  // Factory functions
  createECSMirrorLayer,
  createMirrorTexture,
  updateZoomBehavior
} from './ecs-mirror-layer'

// ================================
// MESH SYSTEM (Pixel-Perfect Alignment)
// ================================
export type {
  // Mesh resolution
  MeshLevel,
  MeshResolution,
  
  // Mesh alignment
  MeshAlignment,
  AlignmentValidation,
  
  // Mesh data
  MeshVertexData,
  StaticMeshData,
  MeshGPUResources,
  
  // Mesh system interface
  MeshSystem,
  MeshSystemActions,
  
  // Coordinate mapping
  PixeloidVertexMapping
} from './mesh-system'

export {
  // Type guards
  isMeshSystem,
  isMeshLevel,
  isMeshResolution,
  isStaticMeshData,
  
  // Factory functions
  createMeshSystem,
  createMeshResolution,
  createStaticMeshData,
  createPixeloidVertexMapping,
  
  // Constants
  MESH_CONSTANTS
} from './mesh-system'

// ================================
// FILTER PIPELINE (Corrected Architecture)
// ================================
export type {
  // Filter stages
  FilterStage,
  FilterExecutionOrder,
  
  // Filter types
  PreFilterType,
  ViewportOperationType,
  PostFilterType,
  
  // Filter configurations
  FilterConfig,
  PreFilterConfig,
  ViewportConfig,
  PostFilterConfig,
  
  // Filter pipeline interface
  FilterPipeline,
  FilterPipelineActions,
  
  // Execution results
  FilterExecutionResult,
  
  // Shader types
  FilterShader,
  ShaderCompilationResult
} from './filter-pipeline'

export {
  // Type guards
  isFilterPipeline,
  isFilterStage,
  isPreFilterConfig,
  isPostFilterConfig,
  
  // Factory functions
  createFilterPipeline,
  createPreFilterConfig,
  createPostFilterConfig,
  
  // Constants
  FILTER_PIPELINE_CONSTANTS
} from './filter-pipeline'

// ================================
// GAME STORE (System Coordination)
// ================================
export type {
  // System status
  SystemStatus,
  GameSystemHealth,
  
  // WASD routing
  WASDRouting,
  
  // Layer synchronization
  LayerSynchronization,
  
  // Game store interface
  GameStore,
  GameStoreActions,
  
  // Store events
  GameStoreEvents
} from './game-store'

export {
  // Type guards
  isGameStore,
  isSystemStatus,
  isWASDRouting,
  
  // Factory functions
  createGameStore,
  createSystemStatus,
  updateWASDRouting,
  
  // Constants
  GAME_STORE_CONSTANTS
} from './game-store'

// ================================
// COMBINED TYPES
// ================================

// Import the types and functions we need directly from modules
import type { ECSDataLayer } from './ecs-data-layer'
import type { ECSMirrorLayer, ZoomLevel } from './ecs-mirror-layer'
import type { MeshSystem } from './mesh-system'
import type { FilterPipeline } from './filter-pipeline'
import type { GameStore, SystemStatus } from './game-store'
import type { PixeloidCoordinate } from './ecs-coordinates'

import {
  isECSDataLayer,
  createECSDataLayer
} from './ecs-data-layer'

import {
  isECSMirrorLayer,
  createECSMirrorLayer
} from './ecs-mirror-layer'

import {
  isMeshSystem,
  createMeshSystem
} from './mesh-system'

import {
  isFilterPipeline,
  createFilterPipeline
} from './filter-pipeline'

import {
  isGameStore,
  createGameStore
} from './game-store'

/**
 * Complete ECS system configuration.
 */
export interface CompleteECSSystem {
  dataLayer: ECSDataLayer
  mirrorLayer: ECSMirrorLayer
  meshSystem: MeshSystem
  filterPipeline: FilterPipeline
  gameStore: GameStore
}

/**
 * ECS system initialization parameters.
 */
export interface ECSInitParams {
  canvasWidth: number
  canvasHeight: number
  pixelRatio: number
  enableDebugMode: boolean
  enablePerformanceMonitoring: boolean
  enableGPUAcceleration: boolean
}

/**
 * ECS system status summary.
 */
export interface ECSSystemStatus {
  isInitialized: boolean
  isHealthy: boolean
  systemCount: number
  activeSystemCount: number
  errorCount: number
  warningCount: number
  lastUpdate: number
  
  systems: {
    dataLayer: boolean
    mirrorLayer: boolean
    meshSystem: boolean
    filterPipeline: boolean
    gameStore: boolean
  }
}

// ================================
// UTILITY TYPES
// ================================

/**
 * Extract action types from any ECS system.
 */
export type ExtractActions<T> = T extends { actions: infer A } ? A : never

/**
 * Extract state types from any ECS system.
 */
export type ExtractState<T> = T extends { state: infer S } ? S : never

/**
 * Extract config types from any ECS system.
 */
export type ExtractConfig<T> = T extends { config: infer C } ? C : never

/**
 * Extract debug types from any ECS system.
 */
export type ExtractDebug<T> = T extends { debug: infer D } ? D : never

// ================================
// TYPE VALIDATION
// ================================

/**
 * Validate complete ECS system configuration.
 */
export const validateCompleteECSSystem = (config: CompleteECSSystem): boolean => {
  return (
    isECSDataLayer(config.dataLayer) &&
    isECSMirrorLayer(config.mirrorLayer) &&
    isMeshSystem(config.meshSystem) &&
    isFilterPipeline(config.filterPipeline) &&
    isGameStore(config.gameStore)
  )
}

/**
 * Validate ECS system initialization parameters.
 */
export const validateECSInitParams = (params: ECSInitParams): boolean => {
  return (
    typeof params.canvasWidth === 'number' &&
    typeof params.canvasHeight === 'number' &&
    typeof params.pixelRatio === 'number' &&
    typeof params.enableDebugMode === 'boolean' &&
    typeof params.enablePerformanceMonitoring === 'boolean' &&
    typeof params.enableGPUAcceleration === 'boolean' &&
    params.canvasWidth > 0 &&
    params.canvasHeight > 0 &&
    params.pixelRatio > 0
  )
}

// ================================
// FACTORY FUNCTIONS
// ================================

/**
 * Create a complete ECS system configuration.
 */
export const createCompleteECSSystem = (_initParams?: ECSInitParams): CompleteECSSystem => {
  const dataLayer = createECSDataLayer()
  const mirrorLayer = createECSMirrorLayer()
  const meshSystem = createMeshSystem()
  const filterPipeline = createFilterPipeline()
  const gameStore = createGameStore()
  
  return {
    dataLayer,
    mirrorLayer,
    meshSystem,
    filterPipeline,
    gameStore
  }
}

/**
 * Create ECS system status summary.
 */
export const createECSSystemStatus = (config: CompleteECSSystem): ECSSystemStatus => {
  const systems = {
    dataLayer: isECSDataLayer(config.dataLayer),
    mirrorLayer: isECSMirrorLayer(config.mirrorLayer),
    meshSystem: isMeshSystem(config.meshSystem),
    filterPipeline: isFilterPipeline(config.filterPipeline),
    gameStore: isGameStore(config.gameStore)
  }
  
  const systemCount = Object.keys(systems).length
  const activeSystemCount = Object.values(systems).filter(Boolean).length
  const errorCount = 0 // TODO: Implement error counting
  const warningCount = 0 // TODO: Implement warning counting
  
  return {
    isInitialized: activeSystemCount === systemCount,
    isHealthy: activeSystemCount === systemCount && errorCount === 0,
    systemCount,
    activeSystemCount,
    errorCount,
    warningCount,
    lastUpdate: Date.now(),
    systems
  }
}

// ================================
// CONSTANTS
// ================================

/**
 * ECS system constants.
 */
export const ECS_SYSTEM_CONSTANTS = {
  VERSION: '1.0.0',
  ARCHITECTURE: 'Dual-Layer ECS Camera Viewport',
  
  SUPPORTED_ZOOM_LEVELS: [1, 2, 4, 8, 16, 32, 64, 128] as const,
  SUPPORTED_MESH_LEVELS: [1, 2, 4, 8, 16, 32, 64, 128] as const,
  
  SYSTEM_NAMES: {
    DATA_LAYER: 'ECS Data Layer',
    MIRROR_LAYER: 'ECS Mirror Layer',
    MESH_SYSTEM: 'Mesh System',
    FILTER_PIPELINE: 'Filter Pipeline',
    GAME_STORE: 'Game Store'
  } as const,
  
  WASD_ROUTING: {
    ZOOM_1_TARGET: 'data-layer',
    ZOOM_2_PLUS_TARGET: 'mirror-layer'
  } as const,
  
  FILTER_STAGES: {
    PRE_FILTER: 'pre-filter',
    VIEWPORT: 'viewport',
    POST_FILTER: 'post-filter'
  } as const
} as const

// ================================
// NAMESPACE EXPORTS FOR FINE-GRAINED IMPORTS
// ================================

// Re-export individual modules as namespaces for fine-grained imports
export * as ECSCoordinatesModule from './ecs-coordinates'
export * as ECSDataLayerModule from './ecs-data-layer'
export * as ECSMirrorLayerModule from './ecs-mirror-layer'
export * as MeshSystemModule from './mesh-system'
export * as FilterPipelineModule from './filter-pipeline'
export * as GameStoreModule from './game-store'

// ================================
// CROSS-SYSTEM INTEGRATION UTILITIES
// ================================

/**
 * Synchronize all ECS systems when zoom level changes.
 */
export const synchronizeECSSystemsOnZoomChange = (
  config: CompleteECSSystem,
  newZoomLevel: number,
  newPosition: { x: number; y: number }
): void => {
  // Import needed functions from game-store module
  const { coordinateSystemUpdate, syncMeshSystemWithLayers } = require('./game-store')
  
  // Update game store with new coordinates
  coordinateSystemUpdate(config.gameStore, newZoomLevel, newPosition)
  
  // Sync mesh system with layers
  syncMeshSystemWithLayers(config.gameStore)
  
  // Update filter pipeline for new zoom level
  const { updateFiltersForZoom } = require('./filter-pipeline')
  config.filterPipeline = updateFiltersForZoom(config.filterPipeline, newZoomLevel)
  
  // Update mirror layer zoom
  config.mirrorLayer.zoomLevel = newZoomLevel as ZoomLevel
  config.mirrorLayer.cameraViewport.position = newPosition
}

/**
 * Validate consistency across all ECS systems.
 */
export const validateECSSystemConsistency = (
  config: CompleteECSSystem
): {
  isConsistent: boolean
  inconsistencies: string[]
  recommendations: string[]
} => {
  const inconsistencies: string[] = []
  const recommendations: string[] = []
  
  // Check zoom level consistency
  const gameStoreZoom = config.gameStore.gameState.currentZoomLevel
  const mirrorLayerZoom = config.mirrorLayer.zoomLevel
  const wasdRoutingZoom = config.gameStore.wasdRouting.currentZoomLevel
  
  if (gameStoreZoom !== mirrorLayerZoom) {
    inconsistencies.push(`Game store zoom (${gameStoreZoom}) != mirror layer zoom (${mirrorLayerZoom})`)
    recommendations.push('Synchronize zoom levels using synchronizeECSSystemsOnZoomChange()')
  }
  
  if (gameStoreZoom !== wasdRoutingZoom) {
    inconsistencies.push(`Game store zoom (${gameStoreZoom}) != WASD routing zoom (${wasdRoutingZoom})`)
    recommendations.push('Update WASD routing zoom level')
  }
  
  // Check WASD routing consistency
  const expectedTarget = gameStoreZoom === 1 ? 'data-layer' : 'mirror-layer'
  const actualTarget = config.gameStore.wasdRouting.activeTarget
  
  if (actualTarget !== expectedTarget) {
    inconsistencies.push(`WASD routing target (${actualTarget}) != expected target (${expectedTarget})`)
    recommendations.push('Update WASD routing target based on zoom level')
  }
  
  // Check mesh system alignment
  const meshLevel = config.meshSystem.state.currentLevel
  const expectedMeshLevel = gameStoreZoom <= 1 ? 1 :
                           gameStoreZoom <= 2 ? 2 :
                           gameStoreZoom <= 4 ? 4 :
                           gameStoreZoom <= 8 ? 8 : 16
  
  if (meshLevel !== expectedMeshLevel) {
    inconsistencies.push(`Mesh level (${meshLevel}) != expected for zoom ${gameStoreZoom} (${expectedMeshLevel})`)
    recommendations.push('Sync mesh system with current zoom level')
  }
  
  // Check filter pipeline state
  const filterContext = config.filterPipeline.context
  if (filterContext.currentZoomLevel !== gameStoreZoom) {
    inconsistencies.push(`Filter pipeline zoom (${filterContext.currentZoomLevel}) != game store zoom (${gameStoreZoom})`)
    recommendations.push('Update filter pipeline zoom level')
  }
  
  return {
    isConsistent: inconsistencies.length === 0,
    inconsistencies,
    recommendations
  }
}

/**
 * Optimize performance across all ECS systems.
 */
export const optimizeECSSystemPerformance = (
  config: CompleteECSSystem
): {
  optimizationsApplied: string[]
  performanceGain: number
  newConfiguration: Partial<CompleteECSSystem>
} => {
  const optimizationsApplied: string[] = []
  const newConfiguration: Partial<CompleteECSSystem> = {}
  
  // Import performance functions
  const { optimizeSystemPerformance, measureSystemPerformance } = require('./game-store')
  
  // Measure current performance
  const beforePerformance = measureSystemPerformance(config.gameStore)
  
  // Optimize game store performance
  optimizeSystemPerformance(config.gameStore)
  optimizationsApplied.push('Game store performance optimized')
  
  // Optimize mesh system caching
  if (config.meshSystem.performance.cacheHitRate < 0.8) {
    config.meshSystem.config.enableCaching = true
    config.meshSystem.config.maxCachedLevels = 4
    optimizationsApplied.push('Mesh system caching enabled')
  }
  
  // Optimize filter pipeline
  if (config.filterPipeline.performance.pipelineEfficiency < 0.8) {
    config.filterPipeline.state.needsUpdate = true
    optimizationsApplied.push('Filter pipeline marked for update')
  }
  
  // Optimize mirror layer texture cache
  if (config.mirrorLayer.textureCache.size > 100) {
    config.mirrorLayer.textureCache.clear()
    optimizationsApplied.push('Mirror layer texture cache cleared')
  }
  
  // Measure performance after optimization
  const afterPerformance = measureSystemPerformance(config.gameStore)
  const performanceGain = afterPerformance.overall - beforePerformance.overall
  
  return {
    optimizationsApplied,
    performanceGain,
    newConfiguration
  }
}

// ================================
// ECS SYSTEM LIFECYCLE MANAGEMENT
// ================================

/**
 * Initialize complete ECS system.
 */
export const initializeECSSystem = async (
  config: CompleteECSSystem,
  initParams: ECSInitParams
): Promise<{
  success: boolean
  initializedSystems: string[]
  errors: string[]
  systemStatus: ECSSystemStatus
}> => {
  const initializedSystems: string[] = []
  const errors: string[] = []
  
  try {
    // Validate initialization parameters
    if (!validateECSInitParams(initParams)) {
      errors.push('Invalid initialization parameters')
      return {
        success: false,
        initializedSystems,
        errors,
        systemStatus: createECSSystemStatus(config)
      }
    }
    
    // Initialize data layer
    try {
      // Data layer initialization placeholder
      initializedSystems.push('Data Layer')
    } catch (error) {
      errors.push(`Data Layer initialization failed: ${error}`)
    }
    
    // Initialize mirror layer
    try {
      // Mirror layer initialization placeholder
      initializedSystems.push('Mirror Layer')
    } catch (error) {
      errors.push(`Mirror Layer initialization failed: ${error}`)
    }
    
    // Initialize mesh system
    try {
      config.meshSystem.state.isActive = true
      config.meshSystem.config.enableGPUAcceleration = initParams.enableGPUAcceleration
      initializedSystems.push('Mesh System')
    } catch (error) {
      errors.push(`Mesh System initialization failed: ${error}`)
    }
    
    // Initialize filter pipeline
    try {
      config.filterPipeline.state.isActive = true
      initializedSystems.push('Filter Pipeline')
    } catch (error) {
      errors.push(`Filter Pipeline initialization failed: ${error}`)
    }
    
    // Initialize game store
    try {
      config.gameStore.gameState.isInitialized = true
      config.gameStore.gameState.isLoading = false
      config.gameStore.gameState.canvas = {
        width: initParams.canvasWidth,
        height: initParams.canvasHeight,
        pixelRatio: initParams.pixelRatio,
        isFullscreen: false
      }
      config.gameStore.config.enableDebugMode = initParams.enableDebugMode
      config.gameStore.config.enablePerformanceMonitoring = initParams.enablePerformanceMonitoring
      initializedSystems.push('Game Store')
    } catch (error) {
      errors.push(`Game Store initialization failed: ${error}`)
    }
    
    // Update system health
    const systemStatus = createECSSystemStatus(config)
    
    return {
      success: errors.length === 0,
      initializedSystems,
      errors,
      systemStatus
    }
  } catch (error) {
    errors.push(`System initialization failed: ${error}`)
    return {
      success: false,
      initializedSystems,
      errors,
      systemStatus: createECSSystemStatus(config)
    }
  }
}

/**
 * Shutdown complete ECS system.
 */
export const shutdownECSSystem = async (
  config: CompleteECSSystem
): Promise<{
  success: boolean
  shutdownSystems: string[]
  errors: string[]
}> => {
  const shutdownSystems: string[] = []
  const errors: string[] = []
  
  try {
    // Shutdown game store
    try {
      config.gameStore.gameState.isInitialized = false
      config.gameStore.gameState.isLoading = false
      shutdownSystems.push('Game Store')
    } catch (error) {
      errors.push(`Game Store shutdown failed: ${error}`)
    }
    
    // Shutdown filter pipeline
    try {
      config.filterPipeline.state.isActive = false
      shutdownSystems.push('Filter Pipeline')
    } catch (error) {
      errors.push(`Filter Pipeline shutdown failed: ${error}`)
    }
    
    // Shutdown mesh system
    try {
      config.meshSystem.state.isActive = false
      shutdownSystems.push('Mesh System')
    } catch (error) {
      errors.push(`Mesh System shutdown failed: ${error}`)
    }
    
    // Shutdown mirror layer
    try {
      // Mirror layer shutdown placeholder
      shutdownSystems.push('Mirror Layer')
    } catch (error) {
      errors.push(`Mirror Layer shutdown failed: ${error}`)
    }
    
    // Shutdown data layer
    try {
      // Data layer shutdown placeholder
      shutdownSystems.push('Data Layer')
    } catch (error) {
      errors.push(`Data Layer shutdown failed: ${error}`)
    }
    
    return {
      success: errors.length === 0,
      shutdownSystems,
      errors
    }
  } catch (error) {
    errors.push(`System shutdown failed: ${error}`)
    return {
      success: false,
      shutdownSystems,
      errors
    }
  }
}

// ================================
// COMPREHENSIVE ERROR HANDLING
// ================================

/**
 * Handle ECS system errors with recovery strategies.
 */
export const handleECSSystemError = (
  config: CompleteECSSystem,
  systemName: keyof CompleteECSSystem,
  error: Error,
  context?: string
): {
  handled: boolean
  recoveryAction: string
  needsRestart: boolean
  errorDetails: {
    system: string
    error: string
    context?: string
    timestamp: number
    stackTrace?: string
  }
} => {
  const errorDetails = {
    system: systemName,
    error: error.message,
    context,
    timestamp: Date.now(),
    stackTrace: error.stack
  }
  
  let handled = false
  let recoveryAction = 'No recovery action available'
  let needsRestart = false
  
  try {
    // Handle different system errors
    switch (systemName) {
      case 'dataLayer':
        // Data layer errors are usually recoverable
        recoveryAction = 'Reset data layer sampling window'
        handled = true
        break
        
      case 'mirrorLayer':
        // Mirror layer errors may need texture cache reset
        config.mirrorLayer.textureCache.clear()
        recoveryAction = 'Clear mirror layer texture cache'
        handled = true
        break
        
      case 'meshSystem':
        // Mesh system errors may need cache rebuild
        config.meshSystem.state.needsUpdate = true
        recoveryAction = 'Rebuild mesh system cache'
        handled = true
        break
        
      case 'filterPipeline':
        // Filter pipeline errors may need pipeline reset
        config.filterPipeline.state.needsUpdate = true
        recoveryAction = 'Reset filter pipeline'
        handled = true
        break
        
      case 'gameStore':
        // Game store errors are critical
        config.gameStore.systemHealth.overall = 'error'
        recoveryAction = 'Full system restart required'
        needsRestart = true
        handled = true
        break
    }
    
    // Update system health
    const systemStatus = config.gameStore.systemHealth[systemName as keyof typeof config.gameStore.systemHealth] as SystemStatus
    if (systemStatus && typeof systemStatus === 'object') {
      systemStatus.errors.push(error.message)
      systemStatus.isHealthy = false
      systemStatus.lastUpdate = Date.now()
    }
    
  } catch (handlingError) {
    // Error while handling error
    recoveryAction = `Error handling failed: ${handlingError}`
    needsRestart = true
  }
  
  return {
    handled,
    recoveryAction,
    needsRestart,
    errorDetails
  }
}

// NO legacy types
// NO backward compatibility
// NO mixed architectures
// NO contaminated exports