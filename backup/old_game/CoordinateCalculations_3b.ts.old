import type {
  PixeloidCoordinate,
  VertexCoordinate,
  ScreenCoordinate,
  ECSViewportBounds,
  ECSBoundingBox
} from '../types'
import { gameStore_3b } from '../store/gameStore_3b'
import type { DrawingMode, PreviewObject } from '../types/geometry-drawing'

/**
 * Pure coordinate calculation functions
 * NO STORE DEPENDENCIES - only pure mathematical conversions
 * All conversions use branded types to prevent coordinate mixing
 */
export class CoordinateCalculations {
  
  // ================================
  // CORE CONVERSION METHODS (PURE FUNCTIONS)
  // ================================
  
  /**
   * Screen ↔ Vertex (mesh authority - no hardcoded scale)
   */
  static screenToVertex(screen: ScreenCoordinate): VertexCoordinate {
    const cellSize = gameStore_3b.mesh.cellSize
    return {
      x: screen.x / cellSize,
      y: screen.y / cellSize
    }
  }
  
  static vertexToScreen(vertex: VertexCoordinate): ScreenCoordinate {
    const cellSize = gameStore_3b.mesh.cellSize
    return {
      x: vertex.x * cellSize,
      y: vertex.y * cellSize
    }
  }
  
  /**
   * Vertex ↔ Pixeloid (offset is the key variable)
   */
  static vertexToPixeloid(
    vertex: VertexCoordinate,
    offset: PixeloidCoordinate
  ): PixeloidCoordinate {
    return {
      x: vertex.x + offset.x,
      y: vertex.y + offset.y
    }
  }
  
  static pixeloidToVertex(
    pixeloid: PixeloidCoordinate,
    offset: PixeloidCoordinate
  ): VertexCoordinate {
    return {
      x: pixeloid.x - offset.x,
      y: pixeloid.y - offset.y
    }
  }
  
  /**
   * Screen ↔ Pixeloid (mesh authority - no hardcoded scale)
   */
  static screenToPixeloid(
    screen: ScreenCoordinate,
    offset: PixeloidCoordinate
  ): PixeloidCoordinate {
    const vertex = this.screenToVertex(screen)
    return this.vertexToPixeloid(vertex, offset)
  }
  
  static pixeloidToScreen(
    pixeloid: PixeloidCoordinate,
    offset: PixeloidCoordinate
  ): ScreenCoordinate {
    const vertex = this.pixeloidToVertex(pixeloid, offset)
    return this.vertexToScreen(vertex)
  }
  
  // ================================
  // VIEWPORT CALCULATIONS (MESH AUTHORITY)
  // ================================
  
  /**
   * Calculate ECS viewport bounds (mesh authority - no hardcoded scale)
   */
  static calculateECSViewportBounds(
    screenSize: { width: number, height: number },
    offset: PixeloidCoordinate
  ): ECSViewportBounds {
    const cellSize = gameStore_3b.mesh.cellSize
    
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
  
  /**
   * Calculate visible grid bounds for rendering optimization (mesh authority)
   */
  static calculateVisibleGridBounds(
    bounds: ECSViewportBounds,
    padding: number = 2
  ): {
    startX: number
    endX: number
    startY: number
    endY: number
  } {
    return {
      startX: Math.floor(bounds.topLeft.x) - padding,
      endX: Math.ceil(bounds.bottomRight.x) + padding,
      startY: Math.floor(bounds.topLeft.y) - padding,
      endY: Math.ceil(bounds.bottomRight.y) + padding
    }
  }

  /**
   * Calculate camera transform position for rendering (mesh authority)
   */
  static calculateCameraTransformPosition(
    cameraPosition: PixeloidCoordinate
  ): PixeloidCoordinate {
    const cellSize = gameStore_3b.mesh.cellSize
    return {
      x: -cameraPosition.x * cellSize,
      y: -cameraPosition.y * cellSize
    }
  }

  /**
   * Calculate initial camera position (pure function)
   */
  static calculateInitialCameraPosition(): PixeloidCoordinate {
    return {
      x: 0,
      y: 0
    }
  }

  /**
   * Snap pixeloid coordinates to integer alignment (pure function)
   */
  static snapPixeloidToVertexAlignment(pixeloid: PixeloidCoordinate): PixeloidCoordinate {
    return {
      x: Math.round(pixeloid.x),
      y: Math.round(pixeloid.y)
    }
  }

  /**
   * Get vertex-aligned pixeloid for input snapping (pure function)
   */
  static getVertexAlignedPixeloid(pixeloid: PixeloidCoordinate): PixeloidCoordinate {
    return this.snapPixeloidToVertexAlignment(pixeloid)
  }

  /**
   * Calculate movement delta in pixeloid units (mesh authority)
   */
  static calculatePixeloidMovement(
    deltaPixelsX: number,
    deltaPixelsY: number
  ): PixeloidCoordinate {
    const cellSize = gameStore_3b.mesh.cellSize
    return {
      x: deltaPixelsX / cellSize,
      y: deltaPixelsY / cellSize
    }
  }

  // ================================
  // ECS CALCULATION FUNCTIONS
  // ================================

  /**
   * Calculate ECS bounding box from vertices
   */
  static calculateECSBounds(vertices: PixeloidCoordinate[]): ECSBoundingBox {
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
   * Calculate drawing preview for geometry
   */
  static calculateDrawingPreview(
    mode: DrawingMode,
    startPoint: PixeloidCoordinate,
    currentPoint: PixeloidCoordinate
  ): PreviewObject | null {
    const style = gameStore_3b.style
    
    switch (mode) {
      case 'line':
        return {
          type: 'line',
          vertices: [startPoint, currentPoint],
          style: style,
          isValid: true,
          bounds: this.calculateECSBounds([startPoint, currentPoint])
        }
      case 'rectangle':
        const rectVertices = [
          startPoint,
          { x: currentPoint.x, y: startPoint.y },
          currentPoint,
          { x: startPoint.x, y: currentPoint.y }
        ]
        return {
          type: 'rectangle',
          vertices: rectVertices,
          style: style,
          isValid: true,
          bounds: this.calculateECSBounds(rectVertices)
        }
      case 'circle':
        const radius = Math.sqrt(
          Math.pow(currentPoint.x - startPoint.x, 2) +
          Math.pow(currentPoint.y - startPoint.y, 2)
        )
        return {
          type: 'circle',
          vertices: [startPoint, currentPoint],
          style: style,
          isValid: radius > 0,
          bounds: {
            minX: startPoint.x - radius,
            minY: startPoint.y - radius,
            maxX: startPoint.x + radius,
            maxY: startPoint.y + radius,
            width: radius * 2,
            height: radius * 2
          }
        }
      default:
        return null
    }
  }
}