/**
 * GeometryPropertyCalculators - Pure geometry property calculation functions
 * 
 * Store authority architecture: These functions calculate properties from vertices
 * which are then stored in the GeometricObject.properties field
 */

import type { PixeloidCoordinate } from '../types/ecs-coordinates'
import type {
  GeometryProperties,
  PointProperties,
  LineProperties,
  CircleProperties,
  RectangleProperties,
  DiamondProperties
} from '../types/ecs-data-layer'

export class GeometryPropertyCalculators {
  
  // ================================
  // POINT CALCULATIONS
  // ================================
  static calculatePointProperties(vertices: PixeloidCoordinate[]): PointProperties {
    if (vertices.length === 0) {
      throw new Error('Point requires at least 1 vertex')
    }
    
    return {
      type: 'point',
      center: vertices[0]
    }
  }
  
  // ================================
  // LINE CALCULATIONS  
  // ================================
  static calculateLineProperties(vertices: PixeloidCoordinate[]): LineProperties {
    if (vertices.length < 2) {
      throw new Error('Line requires at least 2 vertices')
    }
    
    const start = vertices[0]
    const end = vertices[1]
    const dx = end.x - start.x
    const dy = end.y - start.y
    
    return {
      type: 'line',
      startPoint: start,
      endPoint: end,
      midpoint: {
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2
      },
      length: Math.sqrt(dx * dx + dy * dy),
      angle: Math.atan2(dy, dx)
    }
  }
  
  // ================================
  // CIRCLE CALCULATIONS (Fixed!)
  // ================================
  static calculateCircleProperties(vertices: PixeloidCoordinate[]): CircleProperties {
    if (vertices.length < 2) {
      throw new Error('Circle requires at least 2 vertices')
    }
    
    // Handle both representations:
    // - 2 vertices: [center, radiusPoint]  
    // - 8+ vertices: circumference points
    
    let center: PixeloidCoordinate
    let radius: number
    
    if (vertices.length === 2) {
      // Creation format: [center, radiusPoint]
      center = vertices[0]
      const radiusPoint = vertices[1]
      radius = Math.sqrt(
        Math.pow(radiusPoint.x - center.x, 2) + 
        Math.pow(radiusPoint.y - center.y, 2)
      )
    } else {
      // Circumference format: Use geometric center calculation
      // For circle: center is equidistant from all circumference points
      
      // Use first three points to calculate true center (circumcenter)
      const p1 = vertices[0]
      const p2 = vertices[Math.floor(vertices.length / 4)]      // 90° apart
      const p3 = vertices[Math.floor(vertices.length / 2)]      // 180° apart
      
      // Calculate circumcenter from three points
      const ax = p1.x, ay = p1.y
      const bx = p2.x, by = p2.y
      const cx = p3.x, cy = p3.y
      
      const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by))
      
      if (Math.abs(d) < 0.001) {
        // Fallback to centroid if points are nearly collinear
        const sumX = vertices.reduce((sum, v) => sum + v.x, 0)
        const sumY = vertices.reduce((sum, v) => sum + v.y, 0)
        center = { x: sumX / vertices.length, y: sumY / vertices.length }
      } else {
        const ux = ((ax*ax + ay*ay) * (by - cy) + (bx*bx + by*by) * (cy - ay) + (cx*cx + cy*cy) * (ay - by)) / d
        const uy = ((ax*ax + ay*ay) * (cx - bx) + (bx*bx + by*by) * (ax - cx) + (cx*cx + cy*cy) * (bx - ax)) / d
        center = { x: ux, y: uy }
      }
      
      // Calculate radius from true center to any circumference point
      radius = Math.sqrt(
        Math.pow(vertices[0].x - center.x, 2) +
        Math.pow(vertices[0].y - center.y, 2)
      )
    }
    
    return {
      type: 'circle',
      center: center,
      radius: radius,
      diameter: radius * 2,
      circumference: 2 * Math.PI * radius,
      area: Math.PI * radius * radius
    }
  }
  
  // ================================
  // RECTANGLE CALCULATIONS (Fixed!)
  // ================================
  static calculateRectangleProperties(vertices: PixeloidCoordinate[]): RectangleProperties {
    if (vertices.length < 2) {
      throw new Error('Rectangle requires at least 2 vertices')
    }
    
    // Handle both representations:
    // - 2 vertices: [corner1, corner2] (diagonal)
    // - 4 vertices: [topLeft, topRight, bottomRight, bottomLeft]
    
    let topLeft: PixeloidCoordinate
    let bottomRight: PixeloidCoordinate
    
    if (vertices.length === 2) {
      // Creation format: diagonal corners
      const v1 = vertices[0]
      const v2 = vertices[1]
      topLeft = {
        x: Math.min(v1.x, v2.x),
        y: Math.min(v1.y, v2.y)
      }
      bottomRight = {
        x: Math.max(v1.x, v2.x),
        y: Math.max(v1.y, v2.y)
      }
    } else {
      // 4-vertex format: find min/max
      const xs = vertices.map(v => v.x)
      const ys = vertices.map(v => v.y)
      topLeft = {
        x: Math.min(...xs),
        y: Math.min(...ys)
      }
      bottomRight = {
        x: Math.max(...xs),
        y: Math.max(...ys)
      }
    }
    
    const width = bottomRight.x - topLeft.x
    const height = bottomRight.y - topLeft.y
    
    return {
      type: 'rectangle',
      center: {
        x: topLeft.x + width / 2,
        y: topLeft.y + height / 2
      },
      topLeft: topLeft,
      bottomRight: bottomRight,
      width: width,
      height: height,
      area: width * height,
      perimeter: 2 * (width + height)
    }
  }
  
  // ================================
  // DIAMOND CALCULATIONS  
  // ================================
  static calculateDiamondProperties(vertices: PixeloidCoordinate[]): DiamondProperties {
    if (vertices.length < 4) {
      throw new Error('Diamond requires at least 4 vertices')
    }
    
    // Diamond vertices: [west, north, east, south]
    const west = vertices[0]
    const north = vertices[1]
    const east = vertices[2]
    const south = vertices[3]
    
    const centerX = (west.x + east.x) / 2
    const centerY = (north.y + south.y) / 2
    const width = east.x - west.x
    const height = south.y - north.y
    
    return {
      type: 'diamond',
      center: { x: centerX, y: centerY },
      west: west,
      north: north,
      east: east,
      south: south,
      width: width,
      height: height,
      area: (width * height) / 2,  // Diamond area formula
      perimeter: 2 * Math.sqrt((width/2) * (width/2) + (height/2) * (height/2))
    }
  }
  
  // ================================
  // UNIVERSAL CALCULATOR
  // ================================
  static calculateProperties(
    type: 'point' | 'line' | 'circle' | 'rectangle' | 'diamond', 
    vertices: PixeloidCoordinate[]
  ): GeometryProperties {
    switch (type) {
      case 'point':
        return this.calculatePointProperties(vertices)
      case 'line':
        return this.calculateLineProperties(vertices)
      case 'circle':
        return this.calculateCircleProperties(vertices)
      case 'rectangle':
        return this.calculateRectangleProperties(vertices)
      case 'diamond':
        return this.calculateDiamondProperties(vertices)
      default:
        throw new Error(`Unknown geometry type: ${type}`)
    }
  }
}