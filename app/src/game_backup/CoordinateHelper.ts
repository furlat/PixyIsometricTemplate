import type {
  PixeloidCoordinate,
  ViewportBounds
} from '../types'
import { CoordinateCalculations } from './CoordinateCalculations'
import { gameStore } from '../store/gameStore'

/**
 * Unified coordinate computation helper
 * DELEGATES to pure calculation functions + provides store getters
 * All conversions use branded types to prevent coordinate mixing
 */
export class CoordinateHelper {
  
  // ================================
  // PURE CALCULATION DELEGATES (to avoid duplication)
  // ================================
  
  static screenToVertex = CoordinateCalculations.screenToVertex
  static vertexToScreen = CoordinateCalculations.vertexToScreen
  static vertexToPixeloid = CoordinateCalculations.vertexToPixeloid
  static pixeloidToVertex = CoordinateCalculations.pixeloidToVertex
  static screenToPixeloid = CoordinateCalculations.screenToPixeloid
  static pixeloidToScreen = CoordinateCalculations.pixeloidToScreen
  static calculateViewportBounds = CoordinateCalculations.calculateViewportBounds
  static calculateViewportCorners = CoordinateCalculations.calculateViewportCorners
  static calculateVisibleGridBounds = CoordinateCalculations.calculateVisibleGridBounds
  static calculateCameraTransformPosition = CoordinateCalculations.calculateCameraTransformPosition
  static calculateInitialCameraPosition = CoordinateCalculations.calculateInitialCameraPosition
  static snapPixeloidToVertexAlignment = CoordinateCalculations.snapPixeloidToVertexAlignment
  static getVertexAlignedPixeloid = CoordinateCalculations.getVertexAlignedPixeloid
  static calculatePixeloidMovement = CoordinateCalculations.calculatePixeloidMovement
  
  // ================================
  // SAFE STORE GETTERS (read-only, no side effects)
  // ================================
  
  static getCurrentOffset(): PixeloidCoordinate {
    const zoomFactor = gameStore.cameraViewport.zoom_factor
    if (zoomFactor === 1) {
      return gameStore.cameraViewport.geometry_sampling_position
    } else {
      return gameStore.cameraViewport.viewport_position
    }
  }
  
  static getCurrentPixeloidScale(): number {
    return gameStore.cameraViewport.zoom_factor
  }
  
  static getCurrentViewportBounds(): ViewportBounds {
    // For ECS, calculate viewport bounds dynamically
    const zoomFactor = gameStore.cameraViewport.zoom_factor
    const offset = this.getCurrentOffset()
    const screenSize = { width: gameStore.windowWidth, height: gameStore.windowHeight }
    
    return CoordinateCalculations.calculateViewportBounds(
      screenSize, zoomFactor, offset, offset
    )
  }
  
  static getMousePixeloidPosition(): PixeloidCoordinate {
    return gameStore.mouse.pixeloid_position
  }

  static getMouseVertexPosition(): { x: number, y: number } {
    return gameStore.mouse.vertex_position
  }

  static getMouseScreenPosition(): { x: number, y: number } {
    return gameStore.mouse.screen_position
  }

  static getCameraWorldPosition(): PixeloidCoordinate {
    const zoomFactor = gameStore.cameraViewport.zoom_factor
    if (zoomFactor === 1) {
      return gameStore.cameraViewport.geometry_sampling_position
    } else {
      return gameStore.cameraViewport.viewport_position
    }
  }

  static getCameraScreenCenter(): { x: number, y: number } {
    return { x: gameStore.windowWidth / 2, y: gameStore.windowHeight / 2 }
  }

  // ================================
  // LEGACY COMPATIBILITY (will be removed after migration)
  // ================================

  /**
   * Legacy: Convert mesh vertex coordinates to pixeloid coordinates
   * @deprecated Use vertexToPixeloid with explicit offset parameter
   */
  static meshVertexToPixeloid(vertex: { x: number, y: number }): PixeloidCoordinate {
    const offset = this.getCurrentOffset()
    return this.vertexToPixeloid(
      { __brand: 'vertex', x: vertex.x, y: vertex.y },
      offset
    )
  }

  /**
   * Legacy: Convert pixeloid coordinates to mesh vertex coordinates
   * @deprecated Use pixeloidToVertex with explicit offset parameter
   */
  static pixeloidToMeshVertex(pixeloid: PixeloidCoordinate): { x: number, y: number } {
    const offset = this.getCurrentOffset()
    const vertex = this.pixeloidToVertex(pixeloid, offset)
    return { x: Math.round(vertex.x), y: Math.round(vertex.y) }
  }

}