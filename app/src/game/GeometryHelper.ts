/**
 * GeometryHelper provides centralized geometric calculations for all shapes
 * Similar to CoordinateHelper for coordinate transformations
 */

import type { GeometricDiamond, PixeloidCoordinate } from '../types'

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
      isVisible: true,
      createdAt: Date.now()
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
}