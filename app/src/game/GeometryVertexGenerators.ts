/**
 * GeometryVertexGenerators - Property-to-vertex conversion functions
 * 
 * Store authority architecture: These functions generate vertices from properties
 * Used when updating objects based on edited properties in the UI
 */

import type { PixeloidCoordinate } from '../types/ecs-coordinates'

export class GeometryVertexGenerators {
  
  // ================================
  // CIRCLE VERTEX GENERATION
  // ================================
  static generateCircleVertices(center: PixeloidCoordinate, radius: number, segments: number = 8): PixeloidCoordinate[] {
    const vertices: PixeloidCoordinate[] = []
    
    for (let i = 0; i < segments; i++) {
      const angle = (i * Math.PI * 2) / segments
      vertices.push({
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius
      })
    }
    
    return vertices
  }
  
  // ================================
  // RECTANGLE VERTEX GENERATION
  // ================================
  static generateRectangleVertices(center: PixeloidCoordinate, width: number, height: number): PixeloidCoordinate[] {
    const halfWidth = width / 2
    const halfHeight = height / 2
    
    return [
      { x: center.x - halfWidth, y: center.y - halfHeight },  // top-left
      { x: center.x + halfWidth, y: center.y - halfHeight },  // top-right
      { x: center.x + halfWidth, y: center.y + halfHeight },  // bottom-right
      { x: center.x - halfWidth, y: center.y + halfHeight }   // bottom-left
    ]
  }
  
  // ================================
  // RECTANGLE FROM CORNERS (Alternative)
  // ================================
  static generateRectangleVerticesFromCorners(topLeft: PixeloidCoordinate, bottomRight: PixeloidCoordinate): PixeloidCoordinate[] {
    return [
      topLeft,                                               // top-left
      { x: bottomRight.x, y: topLeft.y },                   // top-right
      bottomRight,                                          // bottom-right
      { x: topLeft.x, y: bottomRight.y }                    // bottom-left
    ]
  }
  
  // ================================
  // DIAMOND VERTEX GENERATION
  // ================================
  static generateDiamondVertices(center: PixeloidCoordinate, width: number, height: number): PixeloidCoordinate[] {
    const halfWidth = width / 2
    const halfHeight = height / 2
    
    return [
      { x: center.x - halfWidth, y: center.y },              // west
      { x: center.x, y: center.y - halfHeight },             // north  
      { x: center.x + halfWidth, y: center.y },              // east
      { x: center.x, y: center.y + halfHeight }              // south
    ]
  }
  
  // ================================
  // LINE VERTEX GENERATION
  // ================================
  static generateLineVertices(startPoint: PixeloidCoordinate, endPoint: PixeloidCoordinate): PixeloidCoordinate[] {
    return [startPoint, endPoint]
  }
  
  // ================================
  // LINE FROM MIDPOINT AND LENGTH (Alternative)
  // ================================
  static generateLineVerticesFromMidpoint(midpoint: PixeloidCoordinate, length: number, angle: number): PixeloidCoordinate[] {
    const halfLength = length / 2
    const dx = Math.cos(angle) * halfLength
    const dy = Math.sin(angle) * halfLength
    
    return [
      { x: midpoint.x - dx, y: midpoint.y - dy },  // start point
      { x: midpoint.x + dx, y: midpoint.y + dy }   // end point
    ]
  }
  
  // ================================
  // POINT VERTEX GENERATION
  // ================================
  static generatePointVertices(center: PixeloidCoordinate): PixeloidCoordinate[] {
    return [center]
  }
  
  // ================================
  // UNIVERSAL GENERATORS BY TYPE
  // ================================
  
  /**
   * Generate circle vertices from center and radius
   */
  static generateCircleFromProperties(center: PixeloidCoordinate, radius: number): PixeloidCoordinate[] {
    return this.generateCircleVertices(center, radius)
  }
  
  /**
   * Generate rectangle vertices from center and dimensions
   */
  static generateRectangleFromProperties(center: PixeloidCoordinate, width: number, height: number): PixeloidCoordinate[] {
    return this.generateRectangleVertices(center, width, height)
  }
  
  /**
   * Generate diamond vertices from center and dimensions
   */
  static generateDiamondFromProperties(center: PixeloidCoordinate, width: number, height: number): PixeloidCoordinate[] {
    return this.generateDiamondVertices(center, width, height)
  }
  
  /**
   * Generate line vertices from start and end points
   */
  static generateLineFromProperties(startPoint: PixeloidCoordinate, endPoint: PixeloidCoordinate): PixeloidCoordinate[] {
    return this.generateLineVertices(startPoint, endPoint)
  }
  
  /**
   * Generate point vertices from center
   */
  static generatePointFromProperties(center: PixeloidCoordinate): PixeloidCoordinate[] {
    return this.generatePointVertices(center)
  }
  
  // ================================
  // VALIDATION HELPERS
  // ================================
  
  /**
   * Validate that generated vertices are reasonable
   */
  static validateVertices(vertices: PixeloidCoordinate[], type: string): boolean {
    if (!Array.isArray(vertices) || vertices.length === 0) {
      console.warn(`Invalid vertices for ${type}: empty or not array`)
      return false
    }
    
    // Check that all vertices have valid x,y coordinates
    for (const vertex of vertices) {
      if (typeof vertex.x !== 'number' || typeof vertex.y !== 'number') {
        console.warn(`Invalid vertex for ${type}: missing x or y coordinate`, vertex)
        return false
      }
      
      if (!isFinite(vertex.x) || !isFinite(vertex.y)) {
        console.warn(`Invalid vertex for ${type}: non-finite coordinates`, vertex)
        return false
      }
    }
    
    // Type-specific validation
    switch (type) {
      case 'point':
        if (vertices.length !== 1) {
          console.warn(`Invalid point: should have 1 vertex, got ${vertices.length}`)
          return false
        }
        break
      case 'line':
        if (vertices.length !== 2) {
          console.warn(`Invalid line: should have 2 vertices, got ${vertices.length}`)
          return false
        }
        break
      case 'rectangle':
        if (vertices.length !== 4) {
          console.warn(`Invalid rectangle: should have 4 vertices, got ${vertices.length}`)
          return false
        }
        break
      case 'diamond':
        if (vertices.length !== 4) {
          console.warn(`Invalid diamond: should have 4 vertices, got ${vertices.length}`)
          return false
        }
        break
      case 'circle':
        if (vertices.length < 3) {
          console.warn(`Invalid circle: should have at least 3 vertices, got ${vertices.length}`)
          return false
        }
        break
    }
    
    return true
  }
}