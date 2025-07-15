/**
 * ECS System Validator - Phase 2E Implementation
 * 
 * Final system validation and testing for the complete ECS architecture.
 * Validates all components work together correctly.
 */

import { dataLayerIntegration } from './ecs-data-layer-integration'
import { mirrorLayerIntegration } from './ecs-mirror-layer-integration'
import { 
  coordinateWASDMovement,
  coordinateZoomChange,
  coordinateTextureSynchronization,
  getUnifiedSystemStats,
  getCoordinationState,
  getDataLayerState,
  getMirrorLayerState,
  initializeCoordinationSystem
} from './ecs-coordination-functions'

// ================================
// VALIDATION TYPES
// ================================

export interface ValidationResult {
  passed: boolean
  message: string
  details?: any
}

export interface SystemValidationReport {
  overall: ValidationResult
  dataLayer: ValidationResult
  mirrorLayer: ValidationResult
  coordination: ValidationResult
  integration: ValidationResult
  performance: ValidationResult
  timestamp: number
}

// ================================
// SYSTEM VALIDATOR
// ================================

export class ECSSystemValidator {
  private validationHistory: SystemValidationReport[] = []
  
  // ================================
  // MAIN VALIDATION METHODS
  // ================================
  
  /**
   * Validate the complete ECS system.
   */
  async validateCompleteSystem(): Promise<SystemValidationReport> {
    console.log('🔍 Starting complete ECS system validation...')
    
    const report: SystemValidationReport = {
      overall: { passed: false, message: 'Validation in progress' },
      dataLayer: await this.validateDataLayer(),
      mirrorLayer: await this.validateMirrorLayer(),
      coordination: await this.validateCoordination(),
      integration: await this.validateIntegration(),
      performance: await this.validatePerformance(),
      timestamp: Date.now()
    }
    
    // Determine overall validation result
    const allPassed = [
      report.dataLayer.passed,
      report.mirrorLayer.passed,
      report.coordination.passed,
      report.integration.passed,
      report.performance.passed
    ].every(Boolean)
    
    report.overall = {
      passed: allPassed,
      message: allPassed 
        ? '✅ Complete ECS system validation passed' 
        : '❌ Complete ECS system validation failed',
      details: {
        dataLayer: report.dataLayer.passed,
        mirrorLayer: report.mirrorLayer.passed,
        coordination: report.coordination.passed,
        integration: report.integration.passed,
        performance: report.performance.passed
      }
    }
    
    // Add to history
    this.validationHistory.push(report)
    
    console.log('📊 System validation complete:', report.overall.message)
    return report
  }
  
  // ================================
  // DATA LAYER VALIDATION
  // ================================
  
  private async validateDataLayer(): Promise<ValidationResult> {
    try {
      console.log('🔍 Validating data layer...')
      
      // Test data layer integration
      const dataState = getDataLayerState()
      
      // Validate data layer structure
      const structureValid = this.validateDataLayerStructure(dataState)
      if (!structureValid.passed) return structureValid
      
      // Test sampling functionality
      const samplingValid = await this.validateDataLayerSampling()
      if (!samplingValid.passed) return samplingValid
      
      // Test object management
      const objectsValid = this.validateDataLayerObjects(dataState)
      if (!objectsValid.passed) return objectsValid
      
      return {
        passed: true,
        message: '✅ Data layer validation passed',
        details: {
          structure: structureValid.passed,
          sampling: samplingValid.passed,
          objects: objectsValid.passed
        }
      }
    } catch (error) {
      return {
        passed: false,
        message: '❌ Data layer validation failed',
        details: { error: error instanceof Error ? error.message : String(error) }
      }
    }
  }
  
  private validateDataLayerStructure(state: any): ValidationResult {
    const required = ['sampling', 'allObjects', 'visibleObjects', 'samplingWindow']
    const missing = required.filter(prop => !(prop in state))
    
    if (missing.length > 0) {
      return {
        passed: false,
        message: `Data layer missing required properties: ${missing.join(', ')}`
      }
    }
    
    return { passed: true, message: 'Data layer structure valid' }
  }
  
  private async validateDataLayerSampling(): Promise<ValidationResult> {
    try {
      // Test sampling window movement
      const initialState = getDataLayerState()
      const initialWindow = initialState.samplingWindow
      
      // Move sampling window
      dataLayerIntegration.moveSamplingWindow(10, 10)
      
      // Check if window moved
      const newState = getDataLayerState()
      const newWindow = newState.samplingWindow
      
      const windowMoved = (
        newWindow.position.x !== initialWindow.position.x ||
        newWindow.position.y !== initialWindow.position.y
      )
      
      return {
        passed: windowMoved,
        message: windowMoved 
          ? 'Data layer sampling window movement works'
          : 'Data layer sampling window movement failed'
      }
    } catch (error) {
      return {
        passed: false,
        message: 'Data layer sampling validation failed',
        details: { error: error instanceof Error ? error.message : String(error) }
      }
    }
  }
  
  private validateDataLayerObjects(state: any): ValidationResult {
    const hasObjects = Array.isArray(state.allObjects)
    const hasVisibleObjects = Array.isArray(state.visibleObjects)
    const hasValidCounts = state.allObjects.length >= 0 && state.visibleObjects.length >= 0
    
    if (!hasObjects || !hasVisibleObjects || !hasValidCounts) {
      return {
        passed: false,
        message: 'Data layer object structure invalid',
        details: { hasObjects, hasVisibleObjects, hasValidCounts }
      }
    }
    
    return { passed: true, message: 'Data layer objects valid' }
  }
  
  // ================================
  // MIRROR LAYER VALIDATION
  // ================================
  
  private async validateMirrorLayer(): Promise<ValidationResult> {
    try {
      console.log('🔍 Validating mirror layer...')
      
      // Test mirror layer integration
      const mirrorState = getMirrorLayerState()
      
      // Validate mirror layer structure
      const structureValid = this.validateMirrorLayerStructure(mirrorState)
      if (!structureValid.passed) return structureValid
      
      // Test zoom functionality
      const zoomValid = await this.validateMirrorLayerZoom()
      if (!zoomValid.passed) return zoomValid
      
      // Test camera functionality
      const cameraValid = await this.validateMirrorLayerCamera()
      if (!cameraValid.passed) return cameraValid
      
      // Test texture cache
      const cacheValid = this.validateMirrorLayerCache(mirrorState)
      if (!cacheValid.passed) return cacheValid
      
      return {
        passed: true,
        message: '✅ Mirror layer validation passed',
        details: {
          structure: structureValid.passed,
          zoom: zoomValid.passed,
          camera: cameraValid.passed,
          cache: cacheValid.passed
        }
      }
    } catch (error) {
      return {
        passed: false,
        message: '❌ Mirror layer validation failed',
        details: { error: error instanceof Error ? error.message : String(error) }
      }
    }
  }
  
  private validateMirrorLayerStructure(state: any): ValidationResult {
    const required = ['textureCache', 'cameraViewport', 'zoomLevel', 'display']
    const missing = required.filter(prop => !(prop in state))
    
    if (missing.length > 0) {
      return {
        passed: false,
        message: `Mirror layer missing required properties: ${missing.join(', ')}`
      }
    }
    
    return { passed: true, message: 'Mirror layer structure valid' }
  }
  
  private async validateMirrorLayerZoom(): Promise<ValidationResult> {
    try {
      // Test zoom level changes
      const initialZoom = mirrorLayerIntegration.getCurrentZoomLevel()
      
      // Change zoom level
      mirrorLayerIntegration.setZoomLevel(4 as any)
      
      // Check if zoom changed
      const newZoom = mirrorLayerIntegration.getCurrentZoomLevel()
      
      const zoomChanged = newZoom !== initialZoom
      
      return {
        passed: zoomChanged,
        message: zoomChanged 
          ? 'Mirror layer zoom functionality works'
          : 'Mirror layer zoom functionality failed'
      }
    } catch (error) {
      return {
        passed: false,
        message: 'Mirror layer zoom validation failed',
        details: { error: error instanceof Error ? error.message : String(error) }
      }
    }
  }
  
  private async validateMirrorLayerCamera(): Promise<ValidationResult> {
    try {
      // Test camera panning
      const initialState = getMirrorLayerState()
      const initialViewport = initialState.cameraViewport
      
      // Pan camera
      mirrorLayerIntegration.panCamera(10, 10)
      
      // Check if camera moved
      const newState = getMirrorLayerState()
      const newViewport = newState.cameraViewport
      
      const cameraMoved = (
        newViewport.position.x !== initialViewport.position.x ||
        newViewport.position.y !== initialViewport.position.y
      )
      
      return {
        passed: cameraMoved,
        message: cameraMoved 
          ? 'Mirror layer camera panning works'
          : 'Mirror layer camera panning failed'
      }
    } catch (error) {
      return {
        passed: false,
        message: 'Mirror layer camera validation failed',
        details: { error: error instanceof Error ? error.message : String(error) }
      }
    }
  }
  
  private validateMirrorLayerCache(state: any): ValidationResult {
    const hasCache = state.textureCache && typeof state.textureCache === 'object'
    const hasCacheSize = typeof state.textureCache.size === 'number'
    
    if (!hasCache || !hasCacheSize) {
      return {
        passed: false,
        message: 'Mirror layer texture cache invalid',
        details: { hasCache, hasCacheSize }
      }
    }
    
    return { passed: true, message: 'Mirror layer texture cache valid' }
  }
  
  // ================================
  // COORDINATION VALIDATION
  // ================================
  
  private async validateCoordination(): Promise<ValidationResult> {
    try {
      console.log('🔍 Validating coordination...')
      
      // Test coordination state
      const coordinationState = getCoordinationState()
      
      // Validate coordination structure
      const structureValid = this.validateCoordinationStructure(coordinationState)
      if (!structureValid.passed) return structureValid
      
      // Test WASD routing
      const wasdValid = await this.validateWASDRouting()
      if (!wasdValid.passed) return wasdValid
      
      // Test zoom coordination
      const zoomValid = await this.validateZoomCoordination()
      if (!zoomValid.passed) return zoomValid
      
      return {
        passed: true,
        message: '✅ Coordination validation passed',
        details: {
          structure: structureValid.passed,
          wasd: wasdValid.passed,
          zoom: zoomValid.passed
        }
      }
    } catch (error) {
      return {
        passed: false,
        message: '❌ Coordination validation failed',
        details: { error: error instanceof Error ? error.message : String(error) }
      }
    }
  }
  
  private validateCoordinationStructure(state: any): ValidationResult {
    const required = ['wasdRouting', 'zoomLevel', 'layerVisibility', 'metadata']
    const missing = required.filter(prop => !(prop in state))
    
    if (missing.length > 0) {
      return {
        passed: false,
        message: `Coordination missing required properties: ${missing.join(', ')}`
      }
    }
    
    return { passed: true, message: 'Coordination structure valid' }
  }
  
  private async validateWASDRouting(): Promise<ValidationResult> {
    try {
      // Test WASD routing at zoom level 1
      coordinateZoomChange(1)
      coordinateWASDMovement('w', 1.0)
      
      const state1 = getCoordinationState()
      const target1 = state1.wasdRouting.currentTarget
      
      // Test WASD routing at zoom level 2
      coordinateZoomChange(2)
      coordinateWASDMovement('w', 1.0)
      
      const state2 = getCoordinationState()
      const target2 = state2.wasdRouting.currentTarget
      
      const routingWorks = target1 === 'data-layer' && target2 === 'mirror-layer'
      
      return {
        passed: routingWorks,
        message: routingWorks 
          ? 'WASD routing works correctly'
          : 'WASD routing failed',
        details: { target1, target2 }
      }
    } catch (error) {
      return {
        passed: false,
        message: 'WASD routing validation failed',
        details: { error: error instanceof Error ? error.message : String(error) }
      }
    }
  }
  
  private async validateZoomCoordination(): Promise<ValidationResult> {
    try {
      // Test zoom coordination
      const initialZoom = getCoordinationState().zoomLevel
      
      coordinateZoomChange(8)
      
      const newZoom = getCoordinationState().zoomLevel
      
      const zoomChanged = newZoom !== initialZoom
      
      return {
        passed: zoomChanged,
        message: zoomChanged 
          ? 'Zoom coordination works'
          : 'Zoom coordination failed'
      }
    } catch (error) {
      return {
        passed: false,
        message: 'Zoom coordination validation failed',
        details: { error: error instanceof Error ? error.message : String(error) }
      }
    }
  }
  
  // ================================
  // INTEGRATION VALIDATION
  // ================================
  
  private async validateIntegration(): Promise<ValidationResult> {
    try {
      console.log('🔍 Validating integration...')
      
      // Test end-to-end integration
      const e2eValid = await this.validateEndToEndIntegration()
      if (!e2eValid.passed) return e2eValid
      
      // Test unified stats
      const statsValid = this.validateUnifiedStats()
      if (!statsValid.passed) return statsValid
      
      return {
        passed: true,
        message: '✅ Integration validation passed',
        details: {
          endToEnd: e2eValid.passed,
          unifiedStats: statsValid.passed
        }
      }
    } catch (error) {
      return {
        passed: false,
        message: '❌ Integration validation failed',
        details: { error: error instanceof Error ? error.message : String(error) }
      }
    }
  }
  
  private async validateEndToEndIntegration(): Promise<ValidationResult> {
    try {
      // Initialize system
      initializeCoordinationSystem()
      
      // Test complete workflow
      coordinateZoomChange(1)
      coordinateWASDMovement('w', 1.0)
      coordinateTextureSynchronization()
      
      coordinateZoomChange(4)
      coordinateWASDMovement('d', 1.0)
      
      const finalStats = getUnifiedSystemStats()
      
      const integrationWorks = !!(
        finalStats.dataLayer &&
        finalStats.mirrorLayer &&
        finalStats.coordination
      )
      
      return {
        passed: integrationWorks,
        message: integrationWorks
          ? 'End-to-end integration works'
          : 'End-to-end integration failed'
      }
    } catch (error) {
      return {
        passed: false,
        message: 'End-to-end integration validation failed',
        details: { error: error instanceof Error ? error.message : String(error) }
      }
    }
  }
  
  private validateUnifiedStats(): ValidationResult {
    try {
      const stats = getUnifiedSystemStats()
      
      const hasRequiredStats = !!(
        stats.dataLayer &&
        stats.mirrorLayer &&
        stats.coordination &&
        stats.system
      )
      
      return {
        passed: hasRequiredStats,
        message: hasRequiredStats 
          ? 'Unified stats generation works'
          : 'Unified stats generation failed'
      }
    } catch (error) {
      return {
        passed: false,
        message: 'Unified stats validation failed',
        details: { error: error instanceof Error ? error.message : String(error) }
      }
    }
  }
  
  // ================================
  // PERFORMANCE VALIDATION
  // ================================
  
  private async validatePerformance(): Promise<ValidationResult> {
    try {
      console.log('🔍 Validating performance...')
      
      // Test coordination overhead
      const overheadValid = await this.validateCoordinationOverhead()
      if (!overheadValid.passed) return overheadValid
      
      // Test response times
      const responseValid = await this.validateResponseTimes()
      if (!responseValid.passed) return responseValid
      
      return {
        passed: true,
        message: '✅ Performance validation passed',
        details: {
          overhead: overheadValid.passed,
          responseTimes: responseValid.passed
        }
      }
    } catch (error) {
      return {
        passed: false,
        message: '❌ Performance validation failed',
        details: { error: error instanceof Error ? error.message : String(error) }
      }
    }
  }
  
  private async validateCoordinationOverhead(): Promise<ValidationResult> {
    try {
      // Measure coordination overhead
      const startTime = performance.now()
      
      // Perform coordinated operations
      coordinateZoomChange(2)
      coordinateWASDMovement('w', 1.0)
      coordinateTextureSynchronization()
      
      const endTime = performance.now()
      const overhead = endTime - startTime
      
      // Overhead should be under 50ms
      const acceptable = overhead < 50
      
      return {
        passed: acceptable,
        message: acceptable 
          ? `Coordination overhead acceptable: ${overhead.toFixed(2)}ms`
          : `Coordination overhead too high: ${overhead.toFixed(2)}ms`,
        details: { overhead }
      }
    } catch (error) {
      return {
        passed: false,
        message: 'Coordination overhead validation failed',
        details: { error: error instanceof Error ? error.message : String(error) }
      }
    }
  }
  
  private async validateResponseTimes(): Promise<ValidationResult> {
    try {
      // Test WASD response time
      const wasdStart = performance.now()
      coordinateWASDMovement('w', 1.0)
      const wasdTime = performance.now() - wasdStart
      
      // Test zoom response time
      const zoomStart = performance.now()
      coordinateZoomChange(4)
      const zoomTime = performance.now() - zoomStart
      
      // Test stats response time
      const statsStart = performance.now()
      getUnifiedSystemStats()
      const statsTime = performance.now() - statsStart
      
      // All should be under 10ms
      const acceptable = wasdTime < 10 && zoomTime < 10 && statsTime < 10
      
      return {
        passed: acceptable,
        message: acceptable 
          ? 'Response times acceptable'
          : 'Response times too high',
        details: { wasdTime, zoomTime, statsTime }
      }
    } catch (error) {
      return {
        passed: false,
        message: 'Response times validation failed',
        details: { error: error instanceof Error ? error.message : String(error) }
      }
    }
  }
  
  // ================================
  // UTILITY METHODS
  // ================================
  
  /**
   * Get validation history.
   */
  getValidationHistory(): SystemValidationReport[] {
    return [...this.validationHistory]
  }
  
  /**
   * Get latest validation report.
   */
  getLatestValidationReport(): SystemValidationReport | null {
    return this.validationHistory.length > 0 
      ? this.validationHistory[this.validationHistory.length - 1]
      : null
  }
  
  /**
   * Clear validation history.
   */
  clearValidationHistory(): void {
    this.validationHistory = []
  }
  
  /**
   * Get system health status.
   */
  getSystemHealthStatus(): 'healthy' | 'degraded' | 'critical' | 'unknown' {
    const latest = this.getLatestValidationReport()
    if (!latest) return 'unknown'
    
    return latest.overall.passed ? 'healthy' : 'degraded'
  }
}

// ================================
// SINGLETON INSTANCE
// ================================

export const systemValidator = new ECSSystemValidator()

// ================================
// CONVENIENCE FUNCTIONS
// ================================

/**
 * Quick system validation.
 */
export const validateECSSystem = () => systemValidator.validateCompleteSystem()

/**
 * Get system health.
 */
export const getSystemHealth = () => systemValidator.getSystemHealthStatus()

/**
 * Get validation history.
 */
export const getValidationHistory = () => systemValidator.getValidationHistory()