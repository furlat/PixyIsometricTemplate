/**
 * GeometryVertexCalculator - Dedicated vertex calculation for all geometry types
 * 
 * This module handles:
 * - Anchor point snapping within pixeloid squares
 * - Vertex calculation for each geometry type
 * - Pre-computation of all vertices at creation time
 * 
 * KEY PRINCIPLE: Calculate vertices once, store permanently, never recompute
 */

import type {
  PixeloidCoordinate,
  PixeloidVertex,
  PixeloidAnchorPoint,
  AnchorConfig,
  GeometryStyle
} from '../types'

export class GeometryVertexCalculator {
  
  /**
   * Snap a pixeloid coordinate to a specific anchor point within its pixeloid square
   * This is the core anchoring function that determines exact positioning
   */
  static snapToPixeloidAnchor(
    pixeloidPos: PixeloidCoordinate,
    anchorPoint: PixeloidAnchorPoint
  ): PixeloidVertex {
    const gridX = Math.floor(pixeloidPos.x)
    const gridY = Math.floor(pixeloidPos.y)
    
    switch (anchorPoint) {
      case 'top-left':     return { __brand: 'pixeloid', x: gridX,       y: gridY }
      case 'top-mid':      return { __brand: 'pixeloid', x: gridX + 0.5, y: gridY }
      case 'top-right':    return { __brand: 'pixeloid', x: gridX + 1,   y: gridY }
      case 'left-mid':     return { __brand: 'pixeloid', x: gridX,       y: gridY + 0.5 }
      case 'center':       return { __brand: 'pixeloid', x: gridX + 0.5, y: gridY + 0.5 }
      case 'right-mid':    return { __brand: 'pixeloid', x: gridX + 1,   y: gridY + 0.5 }
      case 'bottom-left':  return { __brand: 'pixeloid', x: gridX,       y: gridY + 1 }
      case 'bottom-mid':   return { __brand: 'pixeloid', x: gridX + 0.5, y: gridY + 1 }
      case 'bottom-right': return { __brand: 'pixeloid', x: gridX + 1,   y: gridY + 1 }
    }
  }

  /**
   * Calculate vertices for a point (single vertex)
   */
  static calculatePointVertices(
    clickPos: PixeloidCoordinate,
    anchorConfig: AnchorConfig
  ): PixeloidVertex[] {
    const anchoredVertex = this.snapToPixeloidAnchor(clickPos, anchorConfig.firstPointAnchor)
    return [anchoredVertex]
  }

  /**
   * Calculate vertices for a line (start and end vertices)
   */
  static calculateLineVertices(
    firstPos: PixeloidCoordinate,
    secondPos: PixeloidCoordinate,
    anchorConfig: AnchorConfig
  ): PixeloidVertex[] {
    const startVertex = this.snapToPixeloidAnchor(firstPos, anchorConfig.firstPointAnchor)
    // For lines, second point can be anywhere (no anchoring constraint)
    const endVertex: PixeloidVertex = { __brand: 'pixeloid', x: secondPos.x, y: secondPos.y }
    
    return [startVertex, endVertex]
  }

  /**
   * Calculate vertices for a circle (west vertex, east vertex, center)
   * CORRECTED: First click = west vertex, drag determines east vertex
   */
  static calculateCircleVertices(
    firstPos: PixeloidCoordinate,
    secondPos: PixeloidCoordinate,
    anchorConfig: AnchorConfig
  ): PixeloidVertex[] {
    // First click determines west vertex
    const westVertex = this.snapToPixeloidAnchor(firstPos, anchorConfig.firstPointAnchor)
    
    // Second position determines east vertex (can use anchor or be exact)
    const eastVertex = anchorConfig.secondPointAnchor 
      ? this.snapToPixeloidAnchor(secondPos, anchorConfig.secondPointAnchor)
      : { __brand: 'pixeloid', x: secondPos.x, y: secondPos.y } as PixeloidVertex
    
    // Calculate center as midpoint of west/east vertices
    const center: PixeloidVertex = {
      __brand: 'pixeloid',
      x: (westVertex.x + eastVertex.x) / 2,
      y: (westVertex.y + eastVertex.y) / 2
    }
    
    // Calculate radius from west/east distance
    const radius = Math.abs(eastVertex.x - westVertex.x) / 2
    
    // Store all vertices: [west, east, center] + radius info in metadata
    return [westVertex, eastVertex, center]
  }

  /**
   * Calculate vertices for a rectangle (4 corners)
   */
  static calculateRectangleVertices(
    firstPos: PixeloidCoordinate,
    secondPos: PixeloidCoordinate,
    anchorConfig: AnchorConfig
  ): PixeloidVertex[] {
    // First click determines one corner
    const firstCorner = this.snapToPixeloidAnchor(firstPos, anchorConfig.firstPointAnchor)
    
    // Second position determines opposite corner
    const oppositeCorner = anchorConfig.secondPointAnchor
      ? this.snapToPixeloidAnchor(secondPos, anchorConfig.secondPointAnchor)
      : { __brand: 'pixeloid', x: secondPos.x, y: secondPos.y } as PixeloidVertex
    
    // Calculate all 4 corners
    const minX = Math.min(firstCorner.x, oppositeCorner.x)
    const maxX = Math.max(firstCorner.x, oppositeCorner.x)
    const minY = Math.min(firstCorner.y, oppositeCorner.y)
    const maxY = Math.max(firstCorner.y, oppositeCorner.y)
    
    return [
      { __brand: 'pixeloid', x: minX, y: minY }, // top-left
      { __brand: 'pixeloid', x: maxX, y: minY }, // top-right
      { __brand: 'pixeloid', x: maxX, y: maxY }, // bottom-right
      { __brand: 'pixeloid', x: minX, y: maxY }  // bottom-left
    ]
  }

  /**
   * Calculate vertices for a diamond (4 cardinal vertices)
   * ISOMETRIC CONSTRAINT: height derived from width
   */
  static calculateDiamondVertices(
    firstPos: PixeloidCoordinate,
    secondPos: PixeloidCoordinate,
    anchorConfig: AnchorConfig
  ): PixeloidVertex[] {
    // First click determines one vertex (usually west)
    const firstVertex = this.snapToPixeloidAnchor(firstPos, anchorConfig.firstPointAnchor)
    
    // Calculate width from drag distance
    const width = Math.abs(secondPos.x - firstPos.x)
    
    // ISOMETRIC CONSTRAINT: height = width / 4
    const height = width / 4
    
    // Assume first vertex is west, calculate other cardinal points
    const westVertex = firstVertex
    const centerX = westVertex.x + width / 2
    const centerY = westVertex.y
    
    return [
      westVertex,                                                      // west
      { __brand: 'pixeloid', x: centerX, y: centerY - height },       // north
      { __brand: 'pixeloid', x: centerX + width / 2, y: centerY },    // east
      { __brand: 'pixeloid', x: centerX, y: centerY + height }        // south
    ]
  }

  /**
   * Get default anchor configuration for each geometry type
   */
  static getDefaultAnchorConfig(geometryType: string): AnchorConfig {
    switch (geometryType) {
      case 'point':
        return { firstPointAnchor: 'center' }
      case 'line':
        return { firstPointAnchor: 'center' }
      case 'circle':
        return { firstPointAnchor: 'center', secondPointAnchor: 'center' }
      case 'rectangle':
        return { firstPointAnchor: 'top-left', secondPointAnchor: 'center' }
      case 'diamond':
        return { firstPointAnchor: 'left-mid' } // West vertex
      default:
        return { firstPointAnchor: 'center' }
    }
  }

  /**
   * Calculate all vertices for any geometry type
   * This is the main entry point used by both preview and creation
   */
  static calculateGeometryVertices(
    firstPos: PixeloidCoordinate,
    secondPos: PixeloidCoordinate,
    geometryType: 'point' | 'line' | 'circle' | 'rectangle' | 'diamond',
    anchorConfig: AnchorConfig
  ): PixeloidVertex[] {
    switch (geometryType) {
      case 'point':
        return this.calculatePointVertices(firstPos, anchorConfig)
      case 'line':
        return this.calculateLineVertices(firstPos, secondPos, anchorConfig)
      case 'circle':
        return this.calculateCircleVertices(firstPos, secondPos, anchorConfig)
      case 'rectangle':
        return this.calculateRectangleVertices(firstPos, secondPos, anchorConfig)
      case 'diamond':
        return this.calculateDiamondVertices(firstPos, secondPos, anchorConfig)
      default:
        throw new Error(`Unknown geometry type: ${geometryType}`)
    }
  }

  /**
   * Extract useful properties from calculated vertices for legacy compatibility
   */
  static extractGeometryProperties(
    vertices: PixeloidVertex[],
    geometryType: string
  ): any {
    switch (geometryType) {
      case 'point':
        return { x: vertices[0].x, y: vertices[0].y }
      
      case 'line':
        return {
          startX: vertices[0].x,
          startY: vertices[0].y,
          endX: vertices[1].x,
          endY: vertices[1].y
        }
      
      case 'circle':
        const [west, east, center] = vertices
        const radius = Math.abs(east.x - west.x) / 2
        return {
          centerX: center.x,
          centerY: center.y,
          radius
        }
      
      case 'rectangle':
        const [topLeft, topRight, bottomRight, bottomLeft] = vertices
        return {
          x: topLeft.x,
          y: topLeft.y,
          width: topRight.x - topLeft.x,
          height: bottomLeft.y - topLeft.y
        }
      
      case 'diamond':
        const [westV, northV, eastV, southV] = vertices
        return {
          anchorX: westV.x,  // West vertex as anchor
          anchorY: westV.y,
          width: eastV.x - westV.x,
          height: (southV.y - northV.y) / 2
        }
      
      default:
        return {}
    }
  }
}