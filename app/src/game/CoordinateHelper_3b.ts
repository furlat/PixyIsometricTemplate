import type {
  PixeloidCoordinate,
  VertexCoordinate,
  ECSViewportBounds
} from '../types'
import { CoordinateCalculations } from './CoordinateCalculations_3b'
import { gameStore_3b, gameStore_3b_methods } from '../store/gameStore_3b'
import type { ECSDataLayer } from '../types/ecs-data-layer'
import type { DrawingMode, StyleSettings, PreviewObject } from '../types/geometry-drawing'
import type { GeometricObject } from '../types/ecs-data-layer'

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
  static calculateECSViewportBounds = CoordinateCalculations.calculateECSViewportBounds
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
    return gameStore_3b.navigation.offset
  }
  
  static getCurrentCellSize(): number {
    return gameStore_3b.mesh.cellSize
  }
  
  static getCurrentViewportBounds(): ECSViewportBounds {
    const offset = this.getCurrentOffset()
    const screenSize = { width: gameStore_3b.mesh.dimensions.width, height: gameStore_3b.mesh.dimensions.height }
    const cellSize = this.getCurrentCellSize()
    
    return {
      topLeft: offset,
      bottomRight: {
        x: offset.x + screenSize.width / cellSize,
        y: offset.y + screenSize.height / cellSize
      },
      width: screenSize.width / cellSize,
      height: screenSize.height / cellSize
    }
  }
  
  static getMousePixeloidPosition(): PixeloidCoordinate {
    return gameStore_3b.mouse.world  // World coordinates in pixeloid space
  }

  static getMouseVertexPosition(): VertexCoordinate {
    return gameStore_3b.mouse.vertex
  }

  static getMouseScreenPosition(): PixeloidCoordinate {
    return gameStore_3b.mouse.screen
  }

  static getCameraWorldPosition(): PixeloidCoordinate {
    return gameStore_3b.navigation.offset
  }

  static getCameraScreenCenter(): { x: number, y: number } {
    return {
      x: gameStore_3b.mesh.dimensions.width / 2,
      y: gameStore_3b.mesh.dimensions.height / 2
    }
  }

  // ================================
  // MESH AUTHORITY INTEGRATION
  // ================================

  /**
   * Get ECS data layer from store
   */
  static getECSDataLayer(): ECSDataLayer {
    return gameStore_3b.ecsDataLayer
  }

  /**
   * Get visible geometry objects
   */
  static getVisibleObjects(): GeometricObject[] {
    return gameStore_3b.ecsDataLayer.visibleObjects
  }

  /**
   * Get all geometry objects
   */
  static getAllObjects(): GeometricObject[] {
    return gameStore_3b.ecsDataLayer.allObjects
  }

  /**
   * Get current drawing mode
   */
  static getDrawingMode(): DrawingMode {
    return gameStore_3b.drawing.mode
  }

  /**
   * Get current drawing preview
   */
  static getDrawingPreview(): PreviewObject | null {
    return gameStore_3b.drawing.preview.object
  }

  /**
   * Get selected object ID
   */
  static getSelectedObjectId(): string | null {
    return gameStore_3b.selection.selectedObjectId
  }

  /**
   * Get current style settings
   */
  static getStyleSettings(): StyleSettings {
    return gameStore_3b.style
  }

  // ================================
  // LEGACY COMPATIBILITY (updated for mesh authority)
  // ================================

  /**
   * Legacy: Convert mesh vertex coordinates to pixeloid coordinates
   * @deprecated Use vertexToPixeloid with explicit offset parameter
   */
  static meshVertexToPixeloid(vertex: { x: number, y: number }): PixeloidCoordinate {
    const offset = this.getCurrentOffset()
    return this.vertexToPixeloid(
      { x: vertex.x, y: vertex.y },
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