import { Graphics, Container } from 'pixi.js'
import { OutlineFilter } from 'pixi-filters'
import { gameStore } from '../store/gameStore'
import { GeometryHelper } from './GeometryHelper'
import type { ViewportCorners, GeometricObject, GeometricRectangle, GeometricCircle, GeometricLine, GeometricPoint, GeometricDiamond } from '../types'

/**
 * SelectionFilterRenderer handles selection highlighting using GPU-accelerated OutlineFilter
 * Clean architecture: gets selected objects from geometry layer and applies red outline filter
 */
export class SelectionFilterRenderer {
  private container: Container = new Container()
  private outlineFilter: OutlineFilter

  constructor() {
    // Create GPU-accelerated outline filter for red borders
    this.outlineFilter = new OutlineFilter({
      thickness: 3,
      color: 0xff4444,  // Bright red for visibility
      quality: 0.1      // Performance optimization
    })
  }

  /**
   * Render selection highlights using OutlineFilter
   * Gets selected objects from store and applies GPU-accelerated red outline
   */
  public render(corners: ViewportCorners, pixeloidScale: number): void {
    const selectedId = gameStore.geometry.selection.selectedObjectId

    // Clear previous selection graphics
    this.container.removeChildren()
    this.container.filters = null

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

    // Create graphics for the selected object with coordinate conversion
    const graphics = this.createGraphicsForObject(selectedObject, pixeloidScale)
    if (graphics) {
      this.container.addChild(graphics)
      
      // Apply OutlineFilter to the entire container for GPU-accelerated red borders
      this.container.filters = [this.outlineFilter]
      
      console.log(`SelectionFilterRenderer: Applied outline filter to object ${selectedId}`)
    }
  }

  /**
   * Create graphics for a selected object with coordinate conversion
   */
  private createGraphicsForObject(obj: GeometricObject, pixeloidScale: number): Graphics | null {
    // Convert object from pixeloid coordinates to vertex coordinates using SAME logic as GeometryRenderer
    const convertedObject = this.convertObjectToVertexCoordinates(obj)
    
    const graphics = new Graphics()
    
    // Render the object graphics (will be filtered by OutlineFilter)
    if ('anchorX' in convertedObject && 'anchorY' in convertedObject) {
      this.renderDiamondToGraphics(convertedObject as GeometricDiamond, graphics)
    } else if ('width' in convertedObject && 'height' in convertedObject) {
      this.renderRectangleToGraphics(convertedObject as GeometricRectangle, graphics)
    } else if ('radius' in convertedObject) {
      this.renderCircleToGraphics(convertedObject as GeometricCircle, graphics)
    } else if ('startX' in convertedObject && 'endX' in convertedObject) {
      this.renderLineToGraphics(convertedObject as GeometricLine, graphics)
    } else if ('x' in convertedObject && 'y' in convertedObject && !('width' in convertedObject)) {
      this.renderPointToGraphics(convertedObject as GeometricPoint, pixeloidScale, graphics)
    } else {
      return null
    }

    return graphics
  }

  /**
   * Convert object from pixeloid coordinates to vertex coordinates using SAME logic as GeometryRenderer
   */
  private convertObjectToVertexCoordinates(obj: GeometricObject): GeometricObject {
    const offset = gameStore.mesh.vertex_to_pixeloid_offset
    
    if ('anchorX' in obj && 'anchorY' in obj) {
      // Diamond object - use EXACT same conversion as GeometryRenderer
      return {
        ...obj,
        anchorX: obj.anchorX - offset.x,  // EXACT conversion, no rounding
        anchorY: obj.anchorY - offset.y
      }
    } else if ('x' in obj && 'width' in obj && 'height' in obj) {
      // Rectangle object - use EXACT same conversion as GeometryRenderer
      return {
        ...obj,
        x: obj.x - offset.x,  // EXACT conversion, no rounding
        y: obj.y - offset.y
      }
    } else if ('centerX' in obj && 'centerY' in obj) {
      // Circle object - use EXACT same conversion as GeometryRenderer
      return {
        ...obj,
        centerX: obj.centerX - offset.x,  // EXACT conversion, no rounding
        centerY: obj.centerY - offset.y
      }
    } else if ('startX' in obj && 'endX' in obj) {
      // Line object - convert both points using EXACT same conversion as GeometryRenderer
      return {
        ...obj,
        startX: obj.startX - offset.x,  // EXACT conversion, no rounding
        startY: obj.startY - offset.y,
        endX: obj.endX - offset.x,
        endY: obj.endY - offset.y
      }
    } else if ('x' in obj && 'y' in obj) {
      // Point object - use EXACT same conversion as GeometryRenderer
      return {
        ...obj,
        x: obj.x - offset.x,  // EXACT conversion, no rounding
        y: obj.y - offset.y
      }
    }
    
    // Fallback - return original object
    return obj
  }

  /**
   * Check if object is within viewport for culling (same logic as GeometryRenderer)
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
   * Render rectangle shape to graphics (same logic as GeometryRenderer)
   */
  private renderRectangleToGraphics(rect: GeometricRectangle, graphics: Graphics): void {
    graphics.rect(rect.x, rect.y, rect.width, rect.height)
    
    if (rect.fillColor !== undefined) {
      graphics.fill({
        color: rect.fillColor,
        alpha: rect.fillAlpha ?? 0.5
      })
    }

    graphics.stroke({
      width: rect.strokeWidth || gameStore.geometry.drawing.settings.defaultStrokeWidth,
      color: rect.color,
      alpha: rect.strokeAlpha
    })
  }

  /**
   * Render circle shape to graphics (same logic as GeometryRenderer)
   */
  private renderCircleToGraphics(circle: GeometricCircle, graphics: Graphics): void {
    graphics.circle(circle.centerX, circle.centerY, circle.radius)
    
    if (circle.fillColor !== undefined) {
      graphics.fill({
        color: circle.fillColor,
        alpha: circle.fillAlpha ?? 0.5
      })
    }

    graphics.stroke({
      width: circle.strokeWidth || gameStore.geometry.drawing.settings.defaultStrokeWidth,
      color: circle.color,
      alpha: circle.strokeAlpha
    })
  }

  /**
   * Render line shape to graphics (same logic as GeometryRenderer)
   */
  private renderLineToGraphics(line: GeometricLine, graphics: Graphics): void {
    graphics.moveTo(line.startX, line.startY)
    graphics.lineTo(line.endX, line.endY)

    graphics.stroke({
      width: line.strokeWidth || gameStore.geometry.drawing.settings.defaultStrokeWidth,
      color: line.color,
      alpha: line.strokeAlpha
    })
  }

  /**
   * Render point shape to graphics (same logic as GeometryRenderer)
   */
  private renderPointToGraphics(point: GeometricPoint, pixeloidScale: number, graphics: Graphics): void {
    const pointRadius = 2 / pixeloidScale
    graphics.circle(point.x, point.y, pointRadius)
    graphics.fill({
      color: point.color,
      alpha: point.strokeAlpha
    })
  }

  /**
   * Render diamond shape to graphics (same logic as GeometryRenderer)
   */
  private renderDiamondToGraphics(diamond: GeometricDiamond, graphics: Graphics): void {
    const vertices = GeometryHelper.calculateDiamondVertices(diamond)
    
    graphics.moveTo(vertices.west.x, vertices.west.y)    // West
    graphics.lineTo(vertices.north.x, vertices.north.y)  // North
    graphics.lineTo(vertices.east.x, vertices.east.y)    // East
    graphics.lineTo(vertices.south.x, vertices.south.y)  // South
    graphics.lineTo(vertices.west.x, vertices.west.y)    // Back to West (close)

    if (diamond.fillColor !== undefined) {
      graphics.fill({
        color: diamond.fillColor,
        alpha: diamond.fillAlpha ?? 0.5
      })
    }

    graphics.stroke({
      width: diamond.strokeWidth || gameStore.geometry.drawing.settings.defaultStrokeWidth,
      color: diamond.color,
      alpha: diamond.strokeAlpha
    })
  }

  /**
   * Get the container for adding to layer
   */
  public getContainer(): Container {
    return this.container
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.container.destroy()
  }
}