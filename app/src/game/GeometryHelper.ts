/**
 * GeometryHelper provides centralized geometric calculations for all shapes
 * Similar to CoordinateHelper for coordinate transformations
 */

import type {
  GeometricDiamond,
  GeometricCircle,
  GeometricRectangle,
  GeometricLine,
  GeometricPoint,
  GeometricObject,
  PixeloidCoordinate,
  GeometricMetadata,
} from '../types'

export class GeometryHelper {
  /**
   * Calculate diamond vertices from diamond properties
   */
  static calculateDiamondVertices(diamond: GeometricDiamond): {
    west: PixeloidCoordinate
    north: PixeloidCoordinate
    east: PixeloidCoordinate
    south: PixeloidCoordinate
  } {
    const { anchorX, anchorY, width, height } = diamond

    // Calculate center position (all widths are forced to be even)
    const centerX = anchorX + width / 2

    // Calculate diamond vertices - ALL vertices snap to pixeloid centers
    return {
      west: { x: anchorX, y: anchorY },
      north: { 
        x: centerX, 
        y: Math.floor(anchorY - height) + 0.5  // Snap to pixeloid center
      },
      east: { x: anchorX + width, y: anchorY },
      south: { 
        x: centerX, 
        y: Math.floor(anchorY + height) + 0.5  // Snap to pixeloid center
      }
    }
  }

  /**
   * Calculate diamond properties from anchor point and width
   */
  static calculateDiamondProperties(
    anchorPoint: PixeloidCoordinate, 
    dragPoint: PixeloidCoordinate
  ): {
    anchorX: number
    anchorY: number
    width: number
    height: number
  } {
    // Calculate width from horizontal drag distance
    let width = Math.abs(dragPoint.x - anchorPoint.x)
    
    // Force odd widths to even - snap down to prevent tiling issues
    if (width % 2 === 1) {
      width = width - 1  // 401 becomes 400, etc.
    }
    
    // Height calculation for perfect tiling (even widths only)
    const totalHeight = (width - 1) / 2
    const height = totalHeight / 2  // Center to north/south distance

    return {
      anchorX: anchorPoint.x,
      anchorY: anchorPoint.y,
      width,
      height
    }
  }

  /**
   * Calculate diamond preview properties during drawing
   */
  static calculateDiamondPreview(
    startPoint: PixeloidCoordinate,
    currentPoint: PixeloidCoordinate
  ): {
    anchorX: number
    anchorY: number
    width: number
    height: number
    vertices: {
      west: PixeloidCoordinate
      north: PixeloidCoordinate
      east: PixeloidCoordinate
      south: PixeloidCoordinate
    }
  } {
    const properties = this.calculateDiamondProperties(startPoint, currentPoint)
    
    // Create temporary diamond object for vertex calculation
    const tempDiamond: GeometricDiamond = {
      id: 'preview',
      anchorX: properties.anchorX,
      anchorY: properties.anchorY,
      width: properties.width,
      height: properties.height,
      color: 0x0066cc,
      strokeWidth: 2,
      strokeAlpha: 1.0,
      isVisible: true,
      createdAt: Date.now(),
      metadata: this.calculateDiamondMetadata(properties)
    }

    const vertices = this.calculateDiamondVertices(tempDiamond)

    return {
      ...properties,
      vertices
    }
  }

  /**
   * Snap coordinate to pixeloid center
   */
  static snapToPixeloidCenter(coordinate: number): number {
    return Math.floor(coordinate) + 0.5
  }

  /**
   * Snap point to pixeloid center
   */
  static snapPointToPixeloidCenter(point: PixeloidCoordinate): PixeloidCoordinate {
    return {
      x: this.snapToPixeloidCenter(point.x),
      y: this.snapToPixeloidCenter(point.y)
    }
  }

  /**
   * Check if a point is inside a diamond (for selection)
   */
  static isPointInsideDiamond(
    point: PixeloidCoordinate, 
    diamond: GeometricDiamond
  ): boolean {
    const vertices = this.calculateDiamondVertices(diamond)
    
    // Use point-in-polygon algorithm for diamond shape
    // Since diamond is convex, we can use a simpler approach
    return this.isPointInConvexQuadrilateral(
      point,
      vertices.west,
      vertices.north,
      vertices.east,
      vertices.south
    )
  }

  /**
   * Point-in-convex-quadrilateral test
   */
  private static isPointInConvexQuadrilateral(
    point: PixeloidCoordinate,
    v1: PixeloidCoordinate,
    v2: PixeloidCoordinate,
    v3: PixeloidCoordinate,
    v4: PixeloidCoordinate
  ): boolean {
    // Check if point is on the same side of each edge
    const cross1 = this.crossProduct(v1, v2, point)
    const cross2 = this.crossProduct(v2, v3, point)
    const cross3 = this.crossProduct(v3, v4, point)
    const cross4 = this.crossProduct(v4, v1, point)

    // All cross products should have the same sign (or be zero)
    const hasPos = cross1 > 0 || cross2 > 0 || cross3 > 0 || cross4 > 0
    const hasNeg = cross1 < 0 || cross2 < 0 || cross3 < 0 || cross4 < 0

    return !(hasPos && hasNeg)
  }

  /**
   * Calculate cross product for point-in-polygon test
   */
  private static crossProduct(
    a: PixeloidCoordinate, 
    b: PixeloidCoordinate, 
    p: PixeloidCoordinate
  ): number {
    return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x)
  }

  /**
   * Calculate metadata for a geometric point
   */
  static calculatePointMetadata(point: { x: number; y: number }): GeometricMetadata {
    return {
      center: { x: point.x, y: point.y },
      bounds: {
        minX: point.x,
        maxX: point.x,
        minY: point.y,
        maxY: point.y
      }
    }
  }

  /**
   * Calculate metadata for a geometric line
   */
  static calculateLineMetadata(line: { startX: number; startY: number; endX: number; endY: number }): GeometricMetadata {
    const centerX = (line.startX + line.endX) / 2
    const centerY = (line.startY + line.endY) / 2
    
    return {
      center: { x: centerX, y: centerY },
      bounds: {
        minX: Math.min(line.startX, line.endX),
        maxX: Math.max(line.startX, line.endX),
        minY: Math.min(line.startY, line.endY),
        maxY: Math.max(line.startY, line.endY)
      }
    }
  }

  /**
   * Calculate metadata for a geometric circle
   */
  static calculateCircleMetadata(circle: { centerX: number; centerY: number; radius: number }): GeometricMetadata {
    return {
      center: { x: circle.centerX, y: circle.centerY },
      bounds: {
        minX: circle.centerX - circle.radius,
        maxX: circle.centerX + circle.radius,
        minY: circle.centerY - circle.radius,
        maxY: circle.centerY + circle.radius
      }
    }
  }

  /**
   * Calculate metadata for a geometric rectangle
   */
  static calculateRectangleMetadata(rectangle: { x: number; y: number; width: number; height: number }): GeometricMetadata {
    const centerX = rectangle.x + rectangle.width / 2
    const centerY = rectangle.y + rectangle.height / 2
    
    return {
      center: { x: centerX, y: centerY },
      bounds: {
        minX: rectangle.x,
        maxX: rectangle.x + rectangle.width,
        minY: rectangle.y,
        maxY: rectangle.y + rectangle.height
      }
    }
  }

  /**
   * Calculate metadata for a geometric diamond
   */
  static calculateDiamondMetadata(diamond: { anchorX: number; anchorY: number; width: number; height: number }): GeometricMetadata {
    const centerX = diamond.anchorX + diamond.width / 2
    const centerY = diamond.anchorY
    
    return {
      center: { x: centerX, y: centerY },
      bounds: {
        minX: diamond.anchorX,
        maxX: diamond.anchorX + diamond.width,
        minY: diamond.anchorY - diamond.height,
        maxY: diamond.anchorY + diamond.height
      }
    }
  }

  /**
   * Mesh-related helper methods for pixeloid intersection testing
   */

  /**
   * Check if a pixeloid intersects with an object using multi-point sampling
   */
  static pixeloidIntersectsObject(
    pixeloidX: number, 
    pixeloidY: number, 
    obj: GeometricObject,
    samplingMode: 'fast' | 'precise' = 'precise'
  ): boolean {
    // Fast mode: only check center point
    if (samplingMode === 'fast') {
      const centerPoint = { x: pixeloidX + 0.5, y: pixeloidY + 0.5 }
      return this.isPointInsideObject(centerPoint, obj)
    }

    // Precise mode: 5-point sampling within the pixeloid
    const samples = [
      { x: pixeloidX + 0.25, y: pixeloidY + 0.25 }, // Top-left
      { x: pixeloidX + 0.75, y: pixeloidY + 0.25 }, // Top-right
      { x: pixeloidX + 0.25, y: pixeloidY + 0.75 }, // Bottom-left
      { x: pixeloidX + 0.75, y: pixeloidY + 0.75 }, // Bottom-right
      { x: pixeloidX + 0.5, y: pixeloidY + 0.5 }     // Center
    ]
    
    // If any sample point is inside the object, the pixeloid intersects
    for (const sample of samples) {
      if (this.isPointInsideObject(sample, obj)) {
        return true
      }
    }
    
    return false
  }

  /**
   * Generic point-in-object test for all geometric shapes
   */
  static isPointInsideObject(
    point: PixeloidCoordinate, 
    obj: GeometricObject
  ): boolean {
    if ('anchorX' in obj && 'anchorY' in obj) {
      // Diamond
      return this.isPointInsideDiamond(point, obj as GeometricDiamond)
    } else if ('centerX' in obj && 'centerY' in obj && 'radius' in obj) {
      // Circle
      const circle = obj as GeometricCircle
      const dx = point.x - circle.centerX
      const dy = point.y - circle.centerY
      return (dx * dx + dy * dy) <= (circle.radius * circle.radius)
    } else if ('x' in obj && 'y' in obj && 'width' in obj && 'height' in obj) {
      // Rectangle
      const rect = obj as GeometricRectangle
      return point.x >= rect.x && point.x <= rect.x + rect.width &&
             point.y >= rect.y && point.y <= rect.y + rect.height
    } else if ('startX' in obj && 'endX' in obj) {
      // Line - check with tolerance
      return this.isPointNearLine(point, obj as GeometricLine, 0.5)
    } else if ('x' in obj && 'y' in obj) {
      // Point
      const pointObj = obj as GeometricPoint
      return Math.floor(pointObj.x) === Math.floor(point.x) && 
             Math.floor(pointObj.y) === Math.floor(point.y)
    }
    
    return false
  }

  /**
   * Check if a point is near a line within tolerance
   */
  static isPointNearLine(
    point: PixeloidCoordinate, 
    line: GeometricLine, 
    tolerance: number
  ): boolean {
    const { startX, startY, endX, endY } = line
    
    // Calculate the distance from point to line segment
    const A = point.x - startX
    const B = point.y - startY
    const C = endX - startX
    const D = endY - startY
    
    const dot = A * C + B * D
    const lenSq = C * C + D * D
    
    if (lenSq === 0) {
      // Line is a point
      const dx = point.x - startX
      const dy = point.y - startY
      return Math.sqrt(dx * dx + dy * dy) <= tolerance
    }
    
    let param = dot / lenSq
    
    let xx, yy
    if (param < 0) {
      xx = startX
      yy = startY
    } else if (param > 1) {
      xx = endX
      yy = endY
    } else {
      xx = startX + param * C
      yy = startY + param * D
    }
    
    const dx = point.x - xx
    const dy = point.y - yy
    return Math.sqrt(dx * dx + dy * dy) <= tolerance
  }

  /**
   * Calculate pixeloid-aligned bounds for an object
   */
  static calculatePixeloidBounds(obj: GeometricObject): {
    minX: number
    maxX: number
    minY: number
    maxY: number
  } {
    const bounds = obj.metadata!.bounds
    
    return {
      minX: Math.floor(bounds.minX),
      maxX: Math.ceil(bounds.maxX),
      minY: Math.floor(bounds.minY),
      maxY: Math.ceil(bounds.maxY)
    }
  }

  /**
   * Get all pixeloids that intersect with an object
   */
  static getObjectPixeloids(
    obj: GeometricObject,
    samplingMode: 'fast' | 'precise' = 'precise'
  ): Set<string> {
    const occupiedPixeloids = new Set<string>()
    const bounds = this.calculatePixeloidBounds(obj)
    
    const width = bounds.maxX - bounds.minX
    const height = bounds.maxY - bounds.minY
    
    // Safety check for extremely large objects
    if (width * height > 50000) {
      console.warn(`GeometryHelper: Object ${obj.id} is very large (${width}x${height} pixeloids), using fast sampling`)
      samplingMode = 'fast'
    }
    
    // Test each pixeloid in the bounding box
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const worldX = bounds.minX + px
        const worldY = bounds.minY + py
        
        if (this.pixeloidIntersectsObject(worldX, worldY, obj, samplingMode)) {
          occupiedPixeloids.add(`${worldX},${worldY}`)
        }
      }
    }
    
    return occupiedPixeloids
  }

  /**
   * Calculate mesh statistics for an object
   */
  static calculateMeshStats(obj: GeometricObject): {
    estimatedPixeloids: number
    boundingBoxSize: { width: number, height: number }
    complexity: 'low' | 'medium' | 'high'
  } {
    const bounds = this.calculatePixeloidBounds(obj)
    const width = bounds.maxX - bounds.minX
    const height = bounds.maxY - bounds.minY
    const boundingBoxPixeloids = width * height
    
    // Estimate actual pixeloids based on shape type
    let estimatedPixeloids: number
    let complexity: 'low' | 'medium' | 'high'
    
    if ('radius' in obj) {
      // Circle - approximately π * r²
      const circle = obj as GeometricCircle
      estimatedPixeloids = Math.floor(Math.PI * circle.radius * circle.radius)
      complexity = 'medium'
    } else if ('anchorX' in obj && 'anchorY' in obj) {
      // Diamond - approximately 50% of bounding box
      estimatedPixeloids = Math.floor(boundingBoxPixeloids * 0.5)
      complexity = 'medium'
    } else if ('width' in obj && 'height' in obj) {
      // Rectangle - full bounding box
      estimatedPixeloids = boundingBoxPixeloids
      complexity = 'low'
    } else if ('startX' in obj && 'endX' in obj) {
      // Line - approximate based on length
      const line = obj as GeometricLine
      const length = Math.sqrt(
        Math.pow(line.endX - line.startX, 2) + 
        Math.pow(line.endY - line.startY, 2)
      )
      estimatedPixeloids = Math.ceil(length)
      complexity = 'low'
    } else {
      // Point - always 1
      estimatedPixeloids = 1
      complexity = 'low'
    }
    
    // Adjust complexity based on size
    if (estimatedPixeloids > 5000) complexity = 'high'
    else if (estimatedPixeloids > 1000) complexity = 'medium'
    
    return {
      estimatedPixeloids,
      boundingBoxSize: { width, height },
      complexity
    }
  }
}