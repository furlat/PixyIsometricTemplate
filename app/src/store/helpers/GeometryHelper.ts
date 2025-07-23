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
        
      case 'diamond':
        // DIAMOND CONSTRAINT: startPoint = west vertex, endPoint = drag for width
        // Width from drag, Height = width/2 (isometric), Y stays same as west vertex
        const width = Math.abs(endPoint.x - startPoint.x)
        const height = width / 2  // Isometric constraint: height = width/2
        const diamondCenter = {
          x: startPoint.x + (width / 2),  // West vertex X + half width
          y: startPoint.y                 // Same Y as west vertex
        }
        return {
          center: diamondCenter,
          width: width,
          height: height
        }
        
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
        if (!vertices[0]) {
          throw new Error('Point properties calculation requires center vertex - missing vertices[0]')
        }
        const center = vertices[0]
        return {
          type: 'point',
          center: center
        }
        
      case 'line':
        if (!vertices[0]) {
          throw new Error('Line properties calculation requires start vertex - missing vertices[0]')
        }
        if (!vertices[1]) {
          throw new Error('Line properties calculation requires end vertex - missing vertices[1]')
        }
        const start = vertices[0]
        const end = vertices[1]
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
        if (!vertices[0]) {
          throw new Error('Diamond properties calculation requires west vertex - missing vertices[0]')
        }
        if (!vertices[1]) {
          throw new Error('Diamond properties calculation requires north vertex - missing vertices[1]')
        }
        if (!vertices[2]) {
          throw new Error('Diamond properties calculation requires east vertex - missing vertices[2]')
        }
        if (!vertices[3]) {
          throw new Error('Diamond properties calculation requires south vertex - missing vertices[3]')
        }
        const west = vertices[0]
        const north = vertices[1]
        const east = vertices[2]
        const south = vertices[3]
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
    // ✅ FIXED: Store only 2 vertices - center + radiusPoint
    // Renderer expects [center, radiusPoint] to calculate radius distance
    const radiusPoint = {
      x: center.x + radius,
      y: center.y
    }
    
    return [center, radiusPoint]
  }
  
  private static generateRectangleVertices(center: PixeloidCoordinate, width: number, height: number): PixeloidCoordinate[] {
    const halfWidth = width / 2
    const halfHeight = height / 2
    
    // ✅ FIXED: Store only 2 vertices - opposite corners
    // Renderer expects [corner1, corner2] to calculate min/max/width/height
    return [
      { x: center.x - halfWidth, y: center.y - halfHeight }, // top-left
      { x: center.x + halfWidth, y: center.y + halfHeight }  // bottom-right
    ]
  }
  
  private static generateLineVertices(startPoint: PixeloidCoordinate, endPoint: PixeloidCoordinate): PixeloidCoordinate[] {
    return [startPoint, endPoint]
  }
  
  private static generateDiamondVertices(center: PixeloidCoordinate, width: number, height: number): PixeloidCoordinate[] {
    const halfWidth = width / 2
    const halfHeight = height / 2
    
    // ✅ FIXED: Correct vertex order [west, north, east, south]
    // Properties calculation expects this order (lines 178-181)
    return [
      { x: center.x - halfWidth, y: center.y },       // west (left)
      { x: center.x, y: center.y - halfHeight },      // north (top)
      { x: center.x + halfWidth, y: center.y },       // east (right)
      { x: center.x, y: center.y + halfHeight }       // south (bottom)
    ]
  }
}