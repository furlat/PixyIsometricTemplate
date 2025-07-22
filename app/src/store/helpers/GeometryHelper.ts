/**
 * Unified Geometry Helper - Single Helper for ALL Shapes (CORRECTED)
 * 
 * This is the key module that fixes the circle bug by providing
 * consistent forward-only calculations for all geometry operations.
 * Uses REAL types from actual codebase.
 */

import type { PixeloidCoordinate, ECSBoundingBox, DrawingMode, GeometryProperties } from '../../types'

export class GeometryHelper {
  // ==========================================
  // VERTEX GENERATION (Forward calculation only)
  // ==========================================
  
  /**
   * Generate vertices from properties (FORWARD ONLY - No reverse engineering)
   */
  static generateVertices(type: string, properties: any): PixeloidCoordinate[] {
    switch (type) {
      case 'circle':
        return this.generateCircleVertices(properties.center, properties.radius)
      case 'rectangle':
        return this.generateRectangleVertices(properties.center, properties.width, properties.height)
      case 'line':
        return this.generateLineVertices(properties.startPoint, properties.endPoint)
      case 'diamond':
        return this.generateDiamondVertices(properties.center, properties.width, properties.height)
      case 'point':
        return [properties.center]
      default:
        throw new Error(`Unknown shape type: ${type}`)
    }
  }
  
  /**
   * Move vertices by offset (fine-grained control)
   */
  static moveVertices(vertices: PixeloidCoordinate[], offset: PixeloidCoordinate): PixeloidCoordinate[] {
    return vertices.map(vertex => ({
      x: vertex.x + offset.x,
      y: vertex.y + offset.y
    }))
  }
  
  // ==========================================
  // BOUNDS CALCULATION (Consistent everywhere)
  // ==========================================
  
  static calculateBounds(vertices: PixeloidCoordinate[]): ECSBoundingBox {
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
      minX, minY, maxX, maxY,
      width: maxX - minX,
      height: maxY - minY
    }
  }
  
  // ==========================================
  // DRAWING CALCULATIONS (For drawing system)
  // ==========================================
  
  static calculateDrawingProperties(mode: DrawingMode, startPoint: PixeloidCoordinate, endPoint: PixeloidCoordinate): any {
    switch (mode) {
      case 'circle':
        const center = {
          x: (startPoint.x + endPoint.x) / 2,
          y: (startPoint.y + endPoint.y) / 2
        }
        const radius = Math.sqrt(
          Math.pow(endPoint.x - startPoint.x, 2) + 
          Math.pow(endPoint.y - startPoint.y, 2)
        ) / 2
        return { center, radius }
        
      case 'rectangle':
        const rectCenter = {
          x: (startPoint.x + endPoint.x) / 2,
          y: (startPoint.y + endPoint.y) / 2
        }
        return {
          center: rectCenter,
          width: Math.abs(endPoint.x - startPoint.x),
          height: Math.abs(endPoint.y - startPoint.y)
        }
        
      case 'line':
        return { startPoint, endPoint }
        
      default:
        throw new Error(`Drawing properties not implemented for ${mode}`)
    }
  }
  
  // ==========================================
  // PROPERTIES CALCULATION (CORRECTED - return GeometryProperties)
  // ==========================================
  
  static calculateProperties(type: string, vertices: PixeloidCoordinate[]): GeometryProperties {
    const bounds = this.calculateBounds(vertices)
    
    switch (type) {
      case 'circle':
        return {
          type: 'circle',
          center: { x: bounds.minX + bounds.width / 2, y: bounds.minY + bounds.height / 2 },
          radius: bounds.width / 2,
          diameter: bounds.width,
          circumference: Math.PI * bounds.width,
          area: Math.PI * Math.pow(bounds.width / 2, 2)
        }
      
      case 'rectangle':
        return {
          type: 'rectangle',
          center: { x: bounds.minX + bounds.width / 2, y: bounds.minY + bounds.height / 2 },
          topLeft: { x: bounds.minX, y: bounds.minY },
          bottomRight: { x: bounds.maxX, y: bounds.maxY },
          width: bounds.width,
          height: bounds.height,
          area: bounds.width * bounds.height,
          perimeter: 2 * (bounds.width + bounds.height)
        }
        
      case 'point':
        const center = vertices[0] || { x: 0, y: 0 }
        return {
          type: 'point',
          center: center
        }
        
      case 'line':
        const start = vertices[0] || { x: 0, y: 0 }
        const end = vertices[1] || { x: 0, y: 0 }
        const dx = end.x - start.x
        const dy = end.y - start.y
        return {
          type: 'line',
          startPoint: start,
          endPoint: end,
          midpoint: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
          length: Math.sqrt(dx * dx + dy * dy),
          angle: Math.atan2(dy, dx)
        }
        
      case 'diamond':
        const west = vertices[0] || { x: -1, y: 0 }
        const north = vertices[1] || { x: 0, y: -1 }
        const east = vertices[2] || { x: 1, y: 0 }
        const south = vertices[3] || { x: 0, y: 1 }
        const diamondCenter = { x: (west.x + east.x) / 2, y: (north.y + south.y) / 2 }
        const diamondWidth = east.x - west.x
        const diamondHeight = south.y - north.y
        return {
          type: 'diamond',
          center: diamondCenter,
          west, north, east, south,
          width: diamondWidth,
          height: diamondHeight,
          area: (diamondWidth * diamondHeight) / 2,
          perimeter: 2 * Math.sqrt((diamondWidth/2) * (diamondWidth/2) + (diamondHeight/2) * (diamondHeight/2))
        }
        
      default:
        throw new Error(`Properties calculation not implemented for ${type}`)
    }
  }
  
  // ==========================================
  // PRIVATE SHAPE-SPECIFIC IMPLEMENTATIONS
  // ==========================================
  
  private static generateCircleVertices(center: PixeloidCoordinate, radius: number): PixeloidCoordinate[] {
    const segments = 32
    const vertices: PixeloidCoordinate[] = []
    
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * 2 * Math.PI
      vertices.push({
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius
      })
    }
    
    return vertices
  }
  
  private static generateRectangleVertices(center: PixeloidCoordinate, width: number, height: number): PixeloidCoordinate[] {
    const halfWidth = width / 2
    const halfHeight = height / 2
    
    return [
      { x: center.x - halfWidth, y: center.y - halfHeight }, // top-left
      { x: center.x + halfWidth, y: center.y - halfHeight }, // top-right
      { x: center.x + halfWidth, y: center.y + halfHeight }, // bottom-right
      { x: center.x - halfWidth, y: center.y + halfHeight }  // bottom-left
    ]
  }
  
  private static generateLineVertices(startPoint: PixeloidCoordinate, endPoint: PixeloidCoordinate): PixeloidCoordinate[] {
    return [startPoint, endPoint]
  }
  
  private static generateDiamondVertices(center: PixeloidCoordinate, width: number, height: number): PixeloidCoordinate[] {
    const halfWidth = width / 2
    const halfHeight = height / 2
    
    return [
      { x: center.x, y: center.y - halfHeight },      // top
      { x: center.x + halfWidth, y: center.y },       // right
      { x: center.x, y: center.y + halfHeight },      // bottom
      { x: center.x - halfWidth, y: center.y }        // left
    ]
  }
}