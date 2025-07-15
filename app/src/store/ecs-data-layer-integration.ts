/**
 * ECS Data Layer Integration
 * 
 * Non-intrusive integration wrapper that provides a clean interface to the
 * ECS Data Layer Store without polluting gameStore.ts.
 * 
 * This follows the Phase 2A revised approach of composition over modification.
 */

import {
  ECSDataLayerStore,
  createECSDataLayerStore,
  ECSDataLayerStoreDebug
} from './ecs-data-layer-store'
import { 
  ECSDataLayer, 
  ECSDataLayerActions, 
  CreateGeometricObjectParams,
  GeometricObject,
  SamplingResult
} from '../types/ecs-data-layer'
import { 
  PixeloidCoordinate, 
  ECSViewportBounds, 
  ECSBoundingBox,
  createPixeloidCoordinate,
  createECSViewportBounds
} from '../types/ecs-coordinates'

/**
 * Integration interface for UI components.
 * Provides simplified, type-safe access to data layer functionality.
 */
export interface ECSDataLayerIntegrationInterface {
  // ================================
  // STATE ACCESS
  // ================================
  getCurrentState(): Readonly<ECSDataLayer>
  getStats(): ReturnType<ECSDataLayerStore['getStats']>
  getVisibleObjects(): GeometricObject[]
  getAllObjects(): GeometricObject[]
  isSamplingActive(): boolean
  getSamplingPosition(): PixeloidCoordinate
  
  // ================================
  // SAMPLING OPERATIONS (WASD at zoom 1)
  // ================================
  updateSamplingPosition(position: PixeloidCoordinate): void
  updateSamplingBounds(bounds: ECSViewportBounds): void
  moveSamplingWindow(deltaX: number, deltaY: number): void
  resampleVisibleObjects(): void
  
  // ================================
  // OBJECT OPERATIONS
  // ================================
  addObject(params: CreateGeometricObjectParams): string
  removeObject(objectId: string): void
  updateObject(objectId: string, updates: Partial<GeometricObject>): void
  clearAllObjects(): void
  getObject(objectId: string): GeometricObject | null
  
  // ================================
  // DATA BOUNDS OPERATIONS
  // ================================
  getDataBounds(): ECSBoundingBox
  expandDataBounds(newBounds: ECSBoundingBox): void
  optimizeDataBounds(): void
  
  // ================================
  // PERFORMANCE OPERATIONS
  // ================================
  optimize(): void
  validateIntegrity(): boolean
  
  // ================================
  // DEBUGGING
  // ================================
  logState(): void
  logSamplingInfo(): void
}

/**
 * ECS Data Layer Integration
 * 
 * Clean integration wrapper that provides a type-safe interface to the
 * ECS Data Layer Store without modifying gameStore.ts.
 */
export class ECSDataLayerIntegration implements ECSDataLayerIntegrationInterface {
  private dataStore: ECSDataLayerStore
  private actions: ECSDataLayerActions

  constructor() {
    this.dataStore = createECSDataLayerStore()
    this.actions = this.dataStore.getActions()
  }

  // ================================
  // STATE ACCESS
  // ================================

  /**
   * Get the current data layer state (immutable).
   */
  getCurrentState(): Readonly<ECSDataLayer> {
    return this.dataStore.getDataLayer()
  }

  /**
   * Get performance and debugging stats.
   */
  getStats(): ReturnType<ECSDataLayerStore['getStats']> {
    return this.dataStore.getStats()
  }

  /**
   * Get visible objects from current sampling.
   */
  getVisibleObjects(): GeometricObject[] {
    return this.getCurrentState().visibleObjects
  }

  /**
   * Get all objects in the data layer.
   */
  getAllObjects(): GeometricObject[] {
    return this.getCurrentState().allObjects
  }

  /**
   * Check if sampling is currently active.
   */
  isSamplingActive(): boolean {
    return this.getCurrentState().sampling.isActive
  }

  /**
   * Get the current sampling position.
   */
  getSamplingPosition(): PixeloidCoordinate {
    return this.getCurrentState().samplingWindow.position
  }

  // ================================
  // SAMPLING OPERATIONS (WASD at zoom 1)
  // ================================

  /**
   * Update sampling position (WASD movement at zoom 1).
   */
  updateSamplingPosition(position: PixeloidCoordinate): void {
    this.actions.updateSamplingPosition(position)
  }

  /**
   * Update sampling bounds (viewport size changes).
   */
  updateSamplingBounds(bounds: ECSViewportBounds): void {
    this.actions.updateSamplingBounds(bounds)
  }

  /**
   * Move sampling window by delta amounts.
   * This is the primary WASD movement method at zoom level 1.
   */
  moveSamplingWindow(deltaX: number, deltaY: number): void {
    const currentPos = this.getSamplingPosition()
    const newPos = createPixeloidCoordinate(
      currentPos.x + deltaX,
      currentPos.y + deltaY
    )
    this.actions.updateSamplingPosition(newPos)
  }

  /**
   * Trigger a resample of visible objects.
   */
  resampleVisibleObjects(): void {
    this.actions.resampleVisibleObjects()
  }

  // ================================
  // OBJECT OPERATIONS
  // ================================

  /**
   * Add a new geometric object to the data layer.
   */
  addObject(params: CreateGeometricObjectParams): string {
    return this.actions.addObject(params)
  }

  /**
   * Remove an object from the data layer.
   */
  removeObject(objectId: string): void {
    this.actions.removeObject(objectId)
  }

  /**
   * Update an existing object in the data layer.
   */
  updateObject(objectId: string, updates: Partial<GeometricObject>): void {
    this.actions.updateObject(objectId, updates)
  }

  /**
   * Clear all objects from the data layer.
   */
  clearAllObjects(): void {
    this.actions.clearAllObjects()
  }

  /**
   * Get a specific object by ID.
   */
  getObject(objectId: string): GeometricObject | null {
    return this.getAllObjects().find(obj => obj.id === objectId) || null
  }

  // ================================
  // DATA BOUNDS OPERATIONS
  // ================================

  /**
   * Get the current data bounds.
   */
  getDataBounds(): ECSBoundingBox {
    return this.getCurrentState().dataBounds
  }

  /**
   * Expand data bounds to include new bounds.
   */
  expandDataBounds(newBounds: ECSBoundingBox): void {
    this.actions.expandDataBounds(newBounds)
  }

  /**
   * Optimize data bounds by recalculating from all objects.
   */
  optimizeDataBounds(): void {
    this.actions.optimizeDataBounds()
  }

  // ================================
  // PERFORMANCE OPERATIONS
  // ================================

  /**
   * Optimize data layer performance.
   */
  optimize(): void {
    this.actions.optimizeDataLayer()
  }

  /**
   * Validate data layer integrity.
   */
  validateIntegrity(): boolean {
    return this.actions.validateDataIntegrity()
  }

  // ================================
  // DEBUGGING
  // ================================

  /**
   * Log current state for debugging.
   */
  logState(): void {
    ECSDataLayerStoreDebug.logState(this.dataStore)
  }

  /**
   * Log sampling information for debugging.
   */
  logSamplingInfo(): void {
    const state = this.getCurrentState()
    console.log('ECS Data Layer Sampling Info:', {
      samplingActive: state.sampling.isActive,
      samplingPosition: state.samplingWindow.position,
      samplingBounds: state.samplingWindow.bounds,
      visibleObjects: state.visibleObjects.length,
      totalObjects: state.allObjects.length,
      lastSampleTime: state.sampling.lastSampleTime,
      samplingVersion: state.sampling.samplingVersion
    })
  }
}

// ================================
// FACTORY FUNCTION
// ================================

/**
 * Create a new ECS Data Layer Integration instance.
 */
export const createECSDataLayerIntegration = (): ECSDataLayerIntegration => {
  return new ECSDataLayerIntegration()
}

// ================================
// SINGLETON INSTANCE
// ================================

/**
 * Singleton instance for global access.
 * Can be used throughout the application without creating multiple instances.
 */
export const dataLayerIntegration = createECSDataLayerIntegration()

// ================================
// UTILITY FUNCTIONS
// ================================

/**
 * Utility functions for common operations.
 */
export const ECSDataLayerIntegrationUtils = {
  /**
   * Check if data layer is ready for sampling operations.
   */
  isReadyForSampling: (integration: ECSDataLayerIntegration): boolean => {
    return integration.isSamplingActive() && integration.getAllObjects().length > 0
  },

  /**
   * Get formatted sampling info for debugging.
   */
  getSamplingInfo: (integration: ECSDataLayerIntegration) => {
    const state = integration.getCurrentState()
    return {
      position: state.samplingWindow.position,
      bounds: state.samplingWindow.bounds,
      isActive: state.sampling.isActive,
      visibleCount: state.visibleObjects.length,
      totalCount: state.allObjects.length,
      lastSampleTime: state.sampling.lastSampleTime,
      samplingVersion: state.sampling.samplingVersion,
      needsResample: state.sampling.needsResample
    }
  },

  /**
   * Get formatted object info for debugging.
   */
  getObjectInfo: (integration: ECSDataLayerIntegration) => {
    const state = integration.getCurrentState()
    const stats = integration.getStats()
    return {
      totalObjects: state.allObjects.length,
      visibleObjects: state.visibleObjects.length,
      dataBounds: state.dataBounds,
      objectCount: stats.objectCount,
      visibleObjectCount: stats.visibleObjectCount,
      scale: state.scale // Always 1 for ECS data layer
    }
  },

  /**
   * Get performance metrics for debugging.
   */
  getPerformanceMetrics: (integration: ECSDataLayerIntegration) => {
    const stats = integration.getStats()
    return {
      objectCount: stats.objectCount,
      visibleObjectCount: stats.visibleObjectCount,
      samplingActive: stats.samplingActive,
      lastSampleTime: stats.lastSampleTime,
      scale: stats.scale,
      dataBounds: stats.dataBounds
    }
  }
}