import { Graphics, Container } from 'pixi.js'
import { gameStore } from '../store/gameStore'
import { GeometryHelper } from './GeometryHelper'
import { CoordinateHelper } from './CoordinateHelper'
import type { ViewportCorners, GeometricObject, GeometricRectangle, GeometricCircle, GeometricLine, GeometricPoint, GeometricDiamond } from '../types'

/**
 * SelectionHighlightRenderer handles rendering of selection highlights for selected objects
 * Operates independently and reactively based on store state
 */
export class SelectionHighlightRenderer {
  private container: Container = new Container()
  private selectionGraphics: Graphics = new Graphics()

  constructor() {
    this.container.addChild(this.selectionGraphics)
  }

  /**
   * Render selection highlight based on current store state
   * Updates every frame when there's a selected object to follow object movement
   */
  public render(corners: ViewportCorners, pixeloidScale: number): void {
    const selectedId = gameStore.geometry.selection.selectedObjectId

    // Always clear and re-render to follow object movement
    this.selectionGraphics.clear()

    if (!selectedId) {
      return // No selection
    }

    // Find the selected object
    const selectedObject = gameStore.geometry.objects.find(obj => obj.id === selectedId)
    if (!selectedObject || !selectedObject.isVisible) {
      return
    }

    // Check if object is in viewport (with some padding)
    if (!this.isObjectInViewport(selectedObject, corners)) {
      return
    }

    // Convert object coordinates and render selection highlight
    this.renderSelectionHighlight(selectedObject, pixeloidScale)
  }

  /**
   * Check if object is within viewport for culling
   */
  private isObjectInViewport(obj: GeometricObject, corners: ViewportCorners): boolean {
    const padding = 50 // pixeloids
    const viewportLeft = corners.topLeft.x - padding
    const viewportRight = corners.bottomRight.x + padding
    const viewportTop = corners.topLeft.y - padding
    const viewportBottom = corners.bottomRight.y + padding

    // Check bounds based on object type (same logic as GeometryRenderer)
    if ('anchorX' in obj && 'anchorY' in obj) {
      const diamond = obj as GeometricDiamond
      const vertices = GeometryHelper.calculateDiamondVertices(diamond)
      const bounds = {
        left: Math.min(vertices.west.x, vertices.east.x, vertices.north.x, vertices.south.x),
        right: Math.max(vertices.west.x, vertices.east.x, vertices.north.x, vertices.south.x),
        top: Math.min(vertices.west.y, vertices.east.y, vertices.north.y, vertices.south.y),
        bottom: Math.max(vertices.west.y, vertices.east.y, vertices.north.y, vertices.south.y)
      }
      return !(
        bounds.right < viewportLeft ||
        bounds.left > viewportRight ||
        bounds.bottom < viewportTop ||
        bounds.top > viewportBottom
      )
    } else if ('width' in obj && 'height' in obj) {
      const rect = obj as GeometricRectangle
      return !(
        rect.x + rect.width < viewportLeft ||
        rect.x > viewportRight ||
        rect.y + rect.height < viewportTop ||
        rect.y > viewportBottom
      )
    } else if ('radius' in obj) {
      const circle = obj as GeometricCircle
      return !(
        circle.centerX + circle.radius < viewportLeft ||
        circle.centerX - circle.radius > viewportRight ||
        circle.centerY + circle.radius < viewportTop ||
        circle.centerY - circle.radius > viewportBottom
      )
    } else if ('startX' in obj && 'endX' in obj) {
      const line = obj as GeometricLine
      const minX = Math.min(line.startX, line.endX)
      const maxX = Math.max(line.startX, line.endX)
      const minY = Math.min(line.startY, line.endY)
      const maxY = Math.max(line.startY, line.endY)
      return !(
        maxX < viewportLeft ||
        minX > viewportRight ||
        maxY < viewportTop ||
        minY > viewportBottom
      )
    } else if ('x' in obj && 'y' in obj) {
      const point = obj as GeometricPoint
      return !(
        point.x < viewportLeft ||
        point.x > viewportRight ||
        point.y < viewportTop ||
        point.y > viewportBottom
      )
    }

    return true
  }

  /**
   * Convert object from pixeloid coordinates to vertex coordinates using existing utilities
   */
  private convertObjectToVertexCoordinates(obj: GeometricObject): GeometricObject {
    if ('anchorX' in obj && 'anchorY' in obj) {
      // Diamond object - use existing coordinate utility
      const vertexCoord = CoordinateHelper.pixeloidToMeshVertex({
        __brand: 'pixeloid',
        x: obj.anchorX,
        y: obj.anchorY
      })
      return {
        ...obj,
        anchorX: vertexCoord.x,
        anchorY: vertexCoord.y
      }
    } else if ('x' in obj && 'width' in obj && 'height' in obj) {
      // Rectangle object - use existing coordinate utility
      const vertexCoord = CoordinateHelper.pixeloidToMeshVertex({
        __brand: 'pixeloid',
        x: obj.x,
        y: obj.y
      })
      return {
        ...obj,
        x: vertexCoord.x,
        y: vertexCoord.y
      }
    } else if ('centerX' in obj && 'centerY' in obj) {
      // Circle object - use existing coordinate utility
      const vertexCoord = CoordinateHelper.pixeloidToMeshVertex({
        __brand: 'pixeloid',
        x: obj.centerX,
        y: obj.centerY
      })
      return {
        ...obj,
        centerX: vertexCoord.x,
        centerY: vertexCoord.y
      }
    } else if ('startX' in obj && 'endX' in obj) {
      // Line object - convert both points using existing coordinate utility
      const startVertexCoord = CoordinateHelper.pixeloidToMeshVertex({
        __brand: 'pixeloid',
        x: obj.startX,
        y: obj.startY
      })
      const endVertexCoord = CoordinateHelper.pixeloidToMeshVertex({
        __brand: 'pixeloid',
        x: obj.endX,
        y: obj.endY
      })
      return {
        ...obj,
        startX: startVertexCoord.x,
        startY: startVertexCoord.y,
        endX: endVertexCoord.x,
        endY: endVertexCoord.y
      }
    } else if ('x' in obj && 'y' in obj) {
      // Point object - use existing coordinate utility
      const vertexCoord = CoordinateHelper.pixeloidToMeshVertex({
        __brand: 'pixeloid',
        x: obj.x,
        y: obj.y
      })
      return {
        ...obj,
        x: vertexCoord.x,
        y: vertexCoord.y
      }
    }
    
    // Fallback - return original object
    return obj
  }

  /**
   * Render selection highlight for a specific object
   */
  private renderSelectionHighlight(obj: GeometricObject, pixeloidScale: number): void {
    // Convert object from pixeloid to vertex coordinates
    const convertedObject = this.convertObjectToVertexCoordinates(obj)
    
    const selectionColor = obj.color // Use the object's actual color for highlighting
    const selectionAlpha = 0.8 // More opaque to better show the object's color
    const extraThickness = 4 // Extra thickness for selection highlight
    const pulseEffect = 1 + 0.2 * Math.sin(Date.now() * 0.005) // Subtle pulse animation

    if ('anchorX' in convertedObject && 'anchorY' in convertedObject) {
      // Diamond selection highlight (using converted coordinates)
      const diamond = convertedObject as GeometricDiamond
      const vertices = GeometryHelper.calculateDiamondVertices(diamond)
      
      this.selectionGraphics.moveTo(vertices.west.x, vertices.west.y)
      this.selectionGraphics.lineTo(vertices.north.x, vertices.north.y)
      this.selectionGraphics.lineTo(vertices.east.x, vertices.east.y)
      this.selectionGraphics.lineTo(vertices.south.x, vertices.south.y)
      this.selectionGraphics.lineTo(vertices.west.x, vertices.west.y)
      this.selectionGraphics.stroke({
        width: (diamond.strokeWidth + extraThickness) * pulseEffect / pixeloidScale,
        color: selectionColor,
        alpha: selectionAlpha
      })
    } else if ('width' in convertedObject && 'height' in convertedObject) {
      // Rectangle selection highlight (using converted coordinates)
      const rect = convertedObject as GeometricRectangle
      this.selectionGraphics.rect(rect.x, rect.y, rect.width, rect.height)
      this.selectionGraphics.stroke({
        width: (rect.strokeWidth + extraThickness) * pulseEffect / pixeloidScale,
        color: selectionColor,
        alpha: selectionAlpha
      })
    } else if ('radius' in convertedObject) {
      // Circle selection highlight (using converted coordinates)
      const circle = convertedObject as GeometricCircle
      this.selectionGraphics.circle(circle.centerX, circle.centerY, circle.radius)
      this.selectionGraphics.stroke({
        width: (circle.strokeWidth + extraThickness) * pulseEffect / pixeloidScale,
        color: selectionColor,
        alpha: selectionAlpha
      })
    } else if ('startX' in convertedObject && 'endX' in convertedObject) {
      // Line selection highlight (using converted coordinates)
      const line = convertedObject as GeometricLine
      this.selectionGraphics.moveTo(line.startX, line.startY)
      this.selectionGraphics.lineTo(line.endX, line.endY)
      this.selectionGraphics.stroke({
        width: (line.strokeWidth + extraThickness) * pulseEffect / pixeloidScale,
        color: selectionColor,
        alpha: selectionAlpha
      })
    } else if ('x' in convertedObject && 'y' in convertedObject && !('width' in convertedObject)) {
      // Point selection highlight - draw a larger circle around the point (using converted coordinates)
      const point = convertedObject as GeometricPoint
      const highlightRadius = (6 + extraThickness) * pulseEffect / pixeloidScale
      this.selectionGraphics.circle(point.x, point.y, highlightRadius)
      this.selectionGraphics.stroke({
        width: 2 / pixeloidScale,
        color: selectionColor,
        alpha: selectionAlpha
      })
    }
  }

  /**
   * Force refresh selection highlight (call when selection changes)
   */
  public forceRefresh(): void {
    // Force clear graphics - next render will redraw
    this.selectionGraphics.clear()
  }

  /**
   * Get the container for adding to layer
   */
  public getGraphics(): Container {
    return this.container
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.selectionGraphics.destroy()
    this.container.destroy()
  }
}