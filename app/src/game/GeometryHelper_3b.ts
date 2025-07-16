/**
 * GeometryHelper_3b - Phase 3B Simplified Geometry Helper
 * Focuses on essential functionality for Phase 3B geometry drawing
 * Mesh authority compliant with store integration
 */

import type {
  PixeloidCoordinate,
  VertexCoordinate,
  GeometricObject,
  ECSBoundingBox
} from '../types'
import { gameStore_3b, gameStore_3b_methods } from '../store/gameStore_3b'
import { CoordinateHelper } from './CoordinateHelper_3b'
import type { DrawingMode, StyleSettings, PreviewObject, AnchorPoint } from '../types/geometry-drawing'
import type { ECSDataLayer } from '../types/ecs-data-layer'

export class GeometryHelper_3b {

  // ================================
  // CORE COORDINATE FUNCTIONS (MESH AUTHORITY)
  // ================================

  /**
   * Snap to pixeloid anchor point (mesh authority)
   */
  static snapToPixeloidAnchor(
    clickPosition: PixeloidCoordinate,
    snapPoint: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'center'
  ): PixeloidCoordinate {
    const gridX = Math.floor(clickPosition.x)
    const gridY = Math.floor(clickPosition.y)
    
    switch (snapPoint) {
      case 'topLeft': return { x: gridX, y: gridY }
      case 'topRight': return { x: gridX + 1, y: gridY }
      case 'bottomLeft': return { x: gridX, y: gridY + 1 }
      case 'bottomRight': return { x: gridX + 1, y: gridY + 1 }
      case 'center': return { x: gridX + 0.5, y: gridY + 0.5 }
      default: return { x: gridX + 0.5, y: gridY + 0.5 }
    }
  }

  /**
   * Snap coordinate to pixeloid center (mesh authority)
   */
  static snapToPixeloidCenter(coordinate: number): number {
    return Math.floor(coordinate) + 0.5
  }

  /**
   * Snap point to pixeloid center (mesh authority)
   */
  static snapPointToPixeloidCenter(point: PixeloidCoordinate): PixeloidCoordinate {
    return {
      x: this.snapToPixeloidCenter(point.x),
      y: this.snapToPixeloidCenter(point.y)
    }
  }

  /**
   * Calculate pixeloid anchor points for mouse interaction
   */
  static calculatePixeloidAnchorPoints(pixeloidX: number, pixeloidY: number): {
    topLeft: PixeloidCoordinate
    topRight: PixeloidCoordinate
    bottomLeft: PixeloidCoordinate
    bottomRight: PixeloidCoordinate
    topMid: PixeloidCoordinate
    rightMid: PixeloidCoordinate
    bottomMid: PixeloidCoordinate
    leftMid: PixeloidCoordinate
    center: PixeloidCoordinate
  } {
    const gridX = Math.floor(pixeloidX)
    const gridY = Math.floor(pixeloidY)
    
    return {
      topLeft: { x: gridX, y: gridY },
      topRight: { x: gridX + 1, y: gridY },
      bottomLeft: { x: gridX, y: gridY + 1 },
      bottomRight: { x: gridX + 1, y: gridY + 1 },
      topMid: { x: gridX + 0.5, y: gridY },
      rightMid: { x: gridX + 1, y: gridY + 0.5 },
      bottomMid: { x: gridX + 0.5, y: gridY + 1 },
      leftMid: { x: gridX, y: gridY + 0.5 },
      center: { x: gridX + 0.5, y: gridY + 0.5 }
    }
  }

  // ================================
  // DRAWING CALCULATIONS (MESH AUTHORITY)
  // ================================

  /**
   * Calculate line preview for drawing
   */
  static calculateLinePreview(
    startPoint: PixeloidCoordinate,
    currentPoint: PixeloidCoordinate
  ): PreviewObject {
    const style = gameStore_3b.style
    const vertices = [startPoint, currentPoint]
    
    return {
      type: 'line',
      vertices: vertices,
      style: style,
      isValid: true,
      bounds: this.calculateBoundsFromVertices(vertices)
    }
  }

  /**
   * Calculate rectangle preview for drawing
   */
  static calculateRectanglePreview(
    startPoint: PixeloidCoordinate,
    currentPoint: PixeloidCoordinate
  ): PreviewObject {
    const style = gameStore_3b.style
    const vertices = [
      startPoint,
      { x: currentPoint.x, y: startPoint.y },
      currentPoint,
      { x: startPoint.x, y: currentPoint.y }
    ]
    
    return {
      type: 'rectangle',
      vertices: vertices,
      style: style,
      isValid: true,
      bounds: this.calculateBoundsFromVertices(vertices)
    }
  }

  /**
   * Calculate circle preview for drawing
   */
  static calculateCirclePreview(
    startPoint: PixeloidCoordinate,
    currentPoint: PixeloidCoordinate
  ): PreviewObject {
    const style = gameStore_3b.style
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
  }

  /**
   * Calculate drawing preview based on current mode
   */
  static calculateDrawingPreview(
    mode: DrawingMode,
    startPoint: PixeloidCoordinate,
    currentPoint: PixeloidCoordinate
  ): PreviewObject | null {
    switch (mode) {
      case 'line':
        return this.calculateLinePreview(startPoint, currentPoint)
      case 'rectangle':
        return this.calculateRectanglePreview(startPoint, currentPoint)
      case 'circle':
        return this.calculateCirclePreview(startPoint, currentPoint)
      default:
        return null
    }
  }

  // ================================
  // BOUNDING BOX CALCULATIONS (MESH AUTHORITY)
  // ================================

  /**
   * Calculate ECS bounding box from vertices
   */
  static calculateBoundsFromVertices(vertices: PixeloidCoordinate[]): ECSBoundingBox {
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
   * Calculate pixeloid-aligned bounds
   */
  static calculatePixeloidAlignedBounds(bounds: ECSBoundingBox): ECSBoundingBox {
    const minX = Math.floor(bounds.minX)
    const maxX = Math.ceil(bounds.maxX)
    const minY = Math.floor(bounds.minY)
    const maxY = Math.ceil(bounds.maxY)
    
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    }
  }

  // ================================
  // GEOMETRY OBJECT UTILITIES (MESH AUTHORITY)
  // ================================

  /**
   * Check if point is inside basic rectangle
   */
  static isPointInRectangle(
    point: PixeloidCoordinate,
    bounds: ECSBoundingBox
  ): boolean {
    return point.x >= bounds.minX && point.x <= bounds.maxX &&
           point.y >= bounds.minY && point.y <= bounds.maxY
  }

  /**
   * Check if point is inside basic circle
   */
  static isPointInCircle(
    point: PixeloidCoordinate,
    center: PixeloidCoordinate,
    radius: number
  ): boolean {
    const dx = point.x - center.x
    const dy = point.y - center.y
    return (dx * dx + dy * dy) <= (radius * radius)
  }

  /**
   * Check if point is near line within tolerance
   */
  static isPointNearLine(
    point: PixeloidCoordinate,
    startPoint: PixeloidCoordinate,
    endPoint: PixeloidCoordinate,
    tolerance: number = 0.5
  ): boolean {
    const A = point.x - startPoint.x
    const B = point.y - startPoint.y
    const C = endPoint.x - startPoint.x
    const D = endPoint.y - startPoint.y
    
    const dot = A * C + B * D
    const lenSq = C * C + D * D
    
    if (lenSq === 0) {
      const dx = point.x - startPoint.x
      const dy = point.y - startPoint.y
      return Math.sqrt(dx * dx + dy * dy) <= tolerance
    }
    
    let param = dot / lenSq
    
    let xx, yy
    if (param < 0) {
      xx = startPoint.x
      yy = startPoint.y
    } else if (param > 1) {
      xx = endPoint.x
      yy = endPoint.y
    } else {
      xx = startPoint.x + param * C
      yy = startPoint.y + param * D
    }
    
    const dx = point.x - xx
    const dy = point.y - yy
    return Math.sqrt(dx * dx + dy * dy) <= tolerance
  }

  // ================================
  // STORE INTEGRATION (MESH AUTHORITY)
  // ================================

  /**
   * Get current drawing mode from store
   */
  static getCurrentDrawingMode(): DrawingMode {
    return gameStore_3b.drawing.mode
  }

  /**
   * Get current style settings from store
   */
  static getCurrentStyleSettings(): StyleSettings {
    return gameStore_3b.style
  }

  /**
   * Get current drawing preview from store
   */
  static getCurrentDrawingPreview(): PreviewObject | null {
    return gameStore_3b.drawing.preview.object
  }

  /**
   * Update drawing preview in store
   */
  static updateDrawingPreview(preview: PreviewObject | null): void {
    gameStore_3b.drawing.preview.object = preview
    gameStore_3b.drawing.preview.isActive = preview !== null
  }

  /**
   * Get mesh cell size (mesh authority)
   */
  static getMeshCellSize(): number {
    return gameStore_3b.mesh.cellSize
  }

  /**
   * Get mesh dimensions (mesh authority)
   */
  static getMeshDimensions(): { width: number, height: number } {
    return gameStore_3b.mesh.dimensions
  }

  /**
   * Get current navigation offset (mesh authority)
   */
  static getCurrentOffset(): PixeloidCoordinate {
    return gameStore_3b.navigation.offset
  }

  // ================================
  // VISIBILITY CALCULATIONS (MESH AUTHORITY)
  // ================================

  /**
   * Calculate if bounds are visible in current viewport
   */
  static calculateVisibility(bounds: ECSBoundingBox): {
    visibility: 'fully-visible' | 'partially-visible' | 'not-visible'
    screenBounds?: ECSBoundingBox
  } {
    const cellSize = this.getMeshCellSize()
    const dimensions = this.getMeshDimensions()
    const offset = this.getCurrentOffset()
    
    // Convert to screen coordinates
    const screenBounds = {
      minX: (bounds.minX - offset.x) * cellSize,
      minY: (bounds.minY - offset.y) * cellSize,
      maxX: (bounds.maxX - offset.x) * cellSize,
      maxY: (bounds.maxY - offset.y) * cellSize,
      width: bounds.width * cellSize,
      height: bounds.height * cellSize
    }
    
    // Check if completely outside screen
    if (screenBounds.maxX < 0 || screenBounds.minX > dimensions.width ||
        screenBounds.maxY < 0 || screenBounds.minY > dimensions.height) {
      return { visibility: 'not-visible' }
    }
    
    // Check if fully inside screen
    if (screenBounds.minX >= 0 && screenBounds.maxX <= dimensions.width &&
        screenBounds.minY >= 0 && screenBounds.maxY <= dimensions.height) {
      return { visibility: 'fully-visible', screenBounds }
    }
    
    // Partially visible
    return { visibility: 'partially-visible', screenBounds }
  }

  // ================================
  // MESH VALIDATION (MESH AUTHORITY)
  // ================================

  /**
   * Validate that coordinates are mesh-aligned
   */
  static validateMeshAlignment(coord: PixeloidCoordinate): boolean {
    const cellSize = this.getMeshCellSize()
    const screenCoord = CoordinateHelper.pixeloidToScreen(coord, this.getCurrentOffset())
    
    // Check if coordinates align with mesh cells
    const alignedX = Math.round(screenCoord.x / cellSize) * cellSize
    const alignedY = Math.round(screenCoord.y / cellSize) * cellSize
    
    return Math.abs(screenCoord.x - alignedX) < 0.1 && 
           Math.abs(screenCoord.y - alignedY) < 0.1
  }

  /**
   * Align coordinates to mesh
   */
  static alignToMesh(coord: PixeloidCoordinate): PixeloidCoordinate {
    const cellSize = this.getMeshCellSize()
    const offset = this.getCurrentOffset()
    
    // Convert to screen, align, convert back
    const screenCoord = CoordinateHelper.pixeloidToScreen(coord, offset)
    const alignedScreenCoord = {
      x: Math.round(screenCoord.x / cellSize) * cellSize,
      y: Math.round(screenCoord.y / cellSize) * cellSize
    }
    
    return CoordinateHelper.screenToPixeloid(alignedScreenCoord, offset)
  }

  // ================================
  // PERFORMANCE UTILITIES
  // ================================

  /**
   * Calculate complexity score for geometry
   */
  static calculateComplexity(bounds: ECSBoundingBox): 'low' | 'medium' | 'high' {
    const area = bounds.width * bounds.height
    
    if (area > 10000) return 'high'
    if (area > 1000) return 'medium'
    return 'low'
  }

  /**
   * Get performance-optimized sampling mode
   */
  static getOptimalSamplingMode(complexity: 'low' | 'medium' | 'high'): 'fast' | 'precise' {
    return complexity === 'high' ? 'fast' : 'precise'
  }
}