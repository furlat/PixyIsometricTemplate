/**
 * Pure ECS Data Layer Store
 * 
 * Clean implementation following ECS principles:
 * - Always scale 1 (literal type enforcement)
 * - ECS viewport sampling (NOT camera viewport)
 * - Fixed-scale geometry storage
 * - No integration concerns - pure ECS architecture
 */

import { 
  ECSDataLayer, 
  ECSDataLayerActions, 
  CreateGeometricObjectParams, 
  GeometricObject,
  SamplingResult,
  createECSDataLayer,
  createGeometricObject,
  calculateObjectBounds,
  isGeometricObject
} from '../types/ecs-data-layer'
import { 
  PixeloidCoordinate, 
  ECSViewportBounds, 
  ECSBoundingBox,
  isWithinBounds,
  createECSViewportBounds,
  createECSBoundingBox
} from '../types/ecs-coordinates'

/**
 * Pure ECS Data Layer Store
 * 
 * This is a clean, standalone implementation that follows pure ECS principles
 * without any integration concerns or backwards compatibility.
 */
export class ECSDataLayerStore {
  private dataLayer: ECSDataLayer
  private actions: ECSDataLayerActions

  constructor() {
    // Create pure ECS data layer
    this.dataLayer = createECSDataLayer()
    
    // Create actions that operate on the data layer
    this.actions = this.createActions()
  }

  // ================================
  // PUBLIC API
  // ================================

  /**
   * Get the current data layer state (immutable)
   */
  getDataLayer(): Readonly<ECSDataLayer> {
    return this.dataLayer
  }

  /**
   * Get the actions interface
   */
  getActions(): ECSDataLayerActions {
    return this.actions
  }

  /**
   * Get quick stats for debugging
   */
  getStats() {
    return {
      objectCount: this.dataLayer.allObjects.length,
      visibleObjectCount: this.dataLayer.visibleObjects.length,
      samplingActive: this.dataLayer.sampling.isActive,
      lastSampleTime: this.dataLayer.sampling.lastSampleTime,
      scale: this.dataLayer.scale, // Always 1 (ECS principle)
      dataBounds: this.dataLayer.dataBounds
    }
  }

  // ================================
  // ACTIONS IMPLEMENTATION
  // ================================

  private createActions(): ECSDataLayerActions {
    return {
      // ================================
      // SAMPLING OPERATIONS (WASD at zoom 1)
      // ================================
      updateSamplingPosition: (position: PixeloidCoordinate) => {
        this.dataLayer.samplingWindow.position = position
        this.dataLayer.sampling.needsResample = true
        this.resampleIfNeeded()
      },

      updateSamplingBounds: (bounds: ECSViewportBounds) => {
        this.dataLayer.samplingWindow.bounds = bounds
        this.dataLayer.sampling.needsResample = true
        this.resampleIfNeeded()
      },

      resampleVisibleObjects: () => {
        this.performSampling()
      },

      // ================================
      // OBJECT OPERATIONS
      // ================================
      addObject: (params: CreateGeometricObjectParams): string => {
        const object = createGeometricObject(params)
        this.dataLayer.allObjects.push(object)
        this.expandDataBoundsForObject(object)
        this.dataLayer.sampling.needsResample = true
        this.resampleIfNeeded()
        return object.id
      },

      removeObject: (objectId: string) => {
        const index = this.dataLayer.allObjects.findIndex(obj => obj.id === objectId)
        if (index >= 0) {
          this.dataLayer.allObjects.splice(index, 1)
          this.dataLayer.sampling.needsResample = true
          this.resampleIfNeeded()
        }
      },

      updateObject: (objectId: string, updates: Partial<GeometricObject>) => {
        const object = this.dataLayer.allObjects.find(obj => obj.id === objectId)
        if (object) {
          // Create new object with updates (immutable pattern)
          const updatedObject = { ...object, ...updates }
          if (updates.vertices) {
            // Recalculate bounds if vertices changed
            const newBounds = calculateObjectBounds(updates.vertices)
            Object.assign(updatedObject, { bounds: newBounds })
          }
          
          // Replace in array
          const index = this.dataLayer.allObjects.findIndex(obj => obj.id === objectId)
          this.dataLayer.allObjects[index] = updatedObject
          this.dataLayer.sampling.needsResample = true
          this.resampleIfNeeded()
        }
      },

      clearAllObjects: () => {
        this.dataLayer.allObjects = []
        this.dataLayer.visibleObjects = []
        this.dataLayer.dataBounds = {
          minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0
        }
        this.dataLayer.sampling.needsResample = false
      },

      // ================================
      // DATA BOUNDS OPERATIONS
      // ================================
      expandDataBounds: (newBounds: ECSBoundingBox) => {
        this.dataLayer.dataBounds = this.mergeDataBounds(this.dataLayer.dataBounds, newBounds)
      },

      optimizeDataBounds: () => {
        this.recalculateDataBounds()
      },

      // ================================
      // PERFORMANCE OPERATIONS
      // ================================
      optimizeDataLayer: () => {
        this.performOptimization()
      },

      validateDataIntegrity: (): boolean => {
        return this.validateIntegrity()
      }
    }
  }

  // ================================
  // INTERNAL SAMPLING OPERATIONS
  // ================================

  private resampleIfNeeded(): void {
    if (this.dataLayer.sampling.needsResample && this.dataLayer.sampling.isActive) {
      this.performSampling()
    }
  }

  private performSampling(): void {
    const startTime = performance.now()
    
    const samplingResult = this.sampleObjects()
    
    // Update visible objects
    this.dataLayer.visibleObjects = samplingResult.objects
    
    // Update sampling state
    this.dataLayer.sampling.needsResample = false
    this.dataLayer.sampling.lastSampleTime = Date.now()
    this.dataLayer.sampling.samplingVersion++
    
    // Update performance metrics
    this.dataLayer.performance.samplingTime = performance.now() - startTime
    this.dataLayer.performance.objectsRendered = samplingResult.objects.length
    this.dataLayer.performance.lastRenderTime = Date.now()
  }

  private sampleObjects(): SamplingResult {
    const startTime = performance.now()
    const bounds = this.dataLayer.samplingWindow.bounds
    const buffer = this.dataLayer.config.samplingBuffer
    
    // Expand bounds by buffer
    const expandedBounds = createECSViewportBounds(
      {
        x: bounds.topLeft.x - buffer,
        y: bounds.topLeft.y - buffer
      },
      bounds.width + (buffer * 2),
      bounds.height + (buffer * 2)
    )
    
    // Sample objects within expanded bounds
    const sampledObjects: GeometricObject[] = []
    let objectsChecked = 0
    
    for (const object of this.dataLayer.allObjects) {
      objectsChecked++
      
      if (!object.isVisible) continue
      
      // Check if object intersects with sampling bounds
      if (this.objectIntersectsBounds(object, expandedBounds)) {
        sampledObjects.push(object)
      }
      
      // Respect max visible objects limit
      if (sampledObjects.length >= this.dataLayer.config.maxVisibleObjects) {
        break
      }
    }
    
    const samplingDuration = performance.now() - startTime
    
    return {
      objects: sampledObjects,
      metadata: {
        samplingTime: Date.now(),
        objectsFound: sampledObjects.length,
        objectsChecked,
        samplingBounds: expandedBounds
      },
      performance: {
        samplingDuration,
        cacheHits: 0, // Not implemented yet
        cacheMisses: 0 // Not implemented yet
      }
    }
  }

  private objectIntersectsBounds(object: GeometricObject, bounds: ECSViewportBounds): boolean {
    const objBounds = object.bounds
    
    // Basic AABB intersection test
    return !(objBounds.maxX < bounds.topLeft.x || 
             objBounds.minX > bounds.bottomRight.x ||
             objBounds.maxY < bounds.topLeft.y || 
             objBounds.minY > bounds.bottomRight.y)
  }

  // ================================
  // DATA BOUNDS MANAGEMENT
  // ================================

  private expandDataBoundsForObject(object: GeometricObject): void {
    const objectBounds = object.bounds
    const currentBounds = this.dataLayer.dataBounds
    
    const newBounds = createECSBoundingBox(
      Math.min(currentBounds.minX, objectBounds.minX),
      Math.min(currentBounds.minY, objectBounds.minY),
      Math.max(currentBounds.maxX, objectBounds.maxX),
      Math.max(currentBounds.maxY, objectBounds.maxY)
    )
    
    this.dataLayer.dataBounds = newBounds
  }

  private mergeDataBounds(bounds1: ECSBoundingBox, bounds2: ECSBoundingBox): ECSBoundingBox {
    return createECSBoundingBox(
      Math.min(bounds1.minX, bounds2.minX),
      Math.min(bounds1.minY, bounds2.minY),
      Math.max(bounds1.maxX, bounds2.maxX),
      Math.max(bounds1.maxY, bounds2.maxY)
    )
  }

  private recalculateDataBounds(): void {
    if (this.dataLayer.allObjects.length === 0) {
      this.dataLayer.dataBounds = {
        minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0
      }
      return
    }
    
    const firstObject = this.dataLayer.allObjects[0]
    let minX = firstObject.bounds.minX
    let minY = firstObject.bounds.minY
    let maxX = firstObject.bounds.maxX
    let maxY = firstObject.bounds.maxY
    
    for (let i = 1; i < this.dataLayer.allObjects.length; i++) {
      const bounds = this.dataLayer.allObjects[i].bounds
      minX = Math.min(minX, bounds.minX)
      minY = Math.min(minY, bounds.minY)
      maxX = Math.max(maxX, bounds.maxX)
      maxY = Math.max(maxY, bounds.maxY)
    }
    
    this.dataLayer.dataBounds = createECSBoundingBox(minX, minY, maxX, maxY)
  }

  // ================================
  // PERFORMANCE & VALIDATION
  // ================================

  private performOptimization(): void {
    // Remove invisible objects from visible array
    this.dataLayer.visibleObjects = this.dataLayer.visibleObjects.filter(obj => obj.isVisible)
    
    // Recalculate data bounds
    this.recalculateDataBounds()
    
    // Update performance metrics
    this.dataLayer.performance.memoryUsage = this.calculateMemoryUsage()
  }

  private calculateMemoryUsage(): number {
    // Rough estimate of memory usage
    const objectSize = 200 // bytes per object estimate
    return this.dataLayer.allObjects.length * objectSize
  }

  private validateIntegrity(): boolean {
    try {
      // Check if all objects have valid properties
      for (const object of this.dataLayer.allObjects) {
        if (!isGeometricObject(object)) {
          return false
        }
      }
      
      // Check if visible objects are subset of all objects
      const allIds = new Set(this.dataLayer.allObjects.map(obj => obj.id))
      for (const visibleObj of this.dataLayer.visibleObjects) {
        if (!allIds.has(visibleObj.id)) {
          return false
        }
      }
      
      // Check if scale is always 1 (ECS principle)
      if (this.dataLayer.scale !== 1) {
        return false
      }
      
      return true
    } catch (error) {
      console.error('Data integrity validation failed:', error)
      return false
    }
  }
}

// ================================
// STORE FACTORY
// ================================

/**
 * Create a new ECS Data Layer Store instance.
 */
export const createECSDataLayerStore = (): ECSDataLayerStore => {
  return new ECSDataLayerStore()
}

// ================================
// DEBUGGING UTILITIES
// ================================

/**
 * Debug utilities for ECS Data Layer Store.
 */
export const ECSDataLayerStoreDebug = {
  /**
   * Log store state for debugging.
   */
  logState: (store: ECSDataLayerStore) => {
    const dataLayer = store.getDataLayer()
    console.log('ECS Data Layer Store State:', {
      scale: dataLayer.scale,
      objectCount: dataLayer.allObjects.length,
      visibleCount: dataLayer.visibleObjects.length,
      samplingActive: dataLayer.sampling.isActive,
      dataBounds: dataLayer.dataBounds,
      samplingWindow: dataLayer.samplingWindow
    })
  },

  /**
   * Validate store integrity.
   */
  validate: (store: ECSDataLayerStore): boolean => {
    return store.getActions().validateDataIntegrity()
  }
}