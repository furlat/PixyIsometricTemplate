import { Graphics } from 'pixi.js'
import { gameStore } from '../store/gameStore'
import { GeometryHelper } from './GeometryHelper'
import type { ViewportCorners, GeometricObject, GeometricRectangle, GeometricCircle, GeometricLine, GeometricPoint, GeometricDiamond } from '../types'

/**
 * GeometryRenderer handles rendering of user-drawn geometric shapes
 * Following the BackgroundGridRenderer pattern for layer separation
 */
export class GeometryRenderer {
  private graphics: Graphics = new Graphics()

  /**
   * Render all geometric objects from the store
   */
  public render(_corners: ViewportCorners, pixeloidScale: number): void {
    this.graphics.clear()

    // Get all geometric objects from store
    const objects = gameStore.geometry.objects

    // Only render visible objects
    const visibleObjects = objects.filter(obj => obj.isVisible)

    // Render each object based on its type
    for (const obj of visibleObjects) {
      this.renderGeometricObject(obj, pixeloidScale)
      
      // Render selection highlight if this object is selected
      if (obj.id === gameStore.geometry.selection.selectedObjectId) {
        this.renderSelectionHighlight(obj, pixeloidScale)
      }
    }

    // Render preview for active drawing
    this.renderPreview(pixeloidScale)
  }

  /**
   * Render a single geometric object based on its type
   */
  private renderGeometricObject(obj: GeometricObject, pixeloidScale: number): void {
    // Type narrowing based on object properties
    if ('anchorX' in obj && 'anchorY' in obj) {
      this.renderDiamond(obj as GeometricDiamond, pixeloidScale)
    } else if ('width' in obj && 'height' in obj) {
      this.renderRectangle(obj as GeometricRectangle, pixeloidScale)
    } else if ('radius' in obj) {
      this.renderCircle(obj as GeometricCircle, pixeloidScale)
    } else if ('startX' in obj && 'endX' in obj) {
      this.renderLine(obj as GeometricLine, pixeloidScale)
    } else if ('x' in obj && 'y' in obj && !('width' in obj)) {
      this.renderPoint(obj as GeometricPoint, pixeloidScale)
    }
  }

  /**
   * Render a rectangle shape
   */
  private renderRectangle(rect: GeometricRectangle, pixeloidScale: number): void {
    // Use raw pixeloid coordinates - camera transform handles scaling
    // (same pattern as BackgroundGridRenderer)
    const x = rect.x
    const y = rect.y
    const width = rect.width
    const height = rect.height

    // Draw rectangle
    this.graphics.rect(x, y, width, height)

    // Apply fill if specified
    if (rect.fillColor !== undefined) {
      this.graphics.fill(rect.fillColor)
    }

    // Apply stroke (scale stroke width by pixeloidScale for consistent thickness)
    this.graphics.stroke({
      width: rect.strokeWidth / pixeloidScale,
      color: rect.color
    })
  }

  /**
   * Render a circle shape
   */
  private renderCircle(circle: GeometricCircle, pixeloidScale: number): void {
    // Use raw pixeloid coordinates - camera transform handles scaling
    const centerX = circle.centerX
    const centerY = circle.centerY
    const radius = circle.radius

    // Draw circle
    this.graphics.circle(centerX, centerY, radius)

    // Apply fill if specified
    if (circle.fillColor !== undefined) {
      this.graphics.fill(circle.fillColor)
    }

    // Apply stroke (scale stroke width by pixeloidScale for consistent thickness)
    this.graphics.stroke({
      width: circle.strokeWidth / pixeloidScale,
      color: circle.color
    })
  }

  /**
   * Render a line shape
   */
  private renderLine(line: GeometricLine, pixeloidScale: number): void {
    // Use raw pixeloid coordinates - camera transform handles scaling
    const startX = line.startX
    const startY = line.startY
    const endX = line.endX
    const endY = line.endY

    // Draw line
    this.graphics.moveTo(startX, startY)
    this.graphics.lineTo(endX, endY)

    // Apply stroke (scale stroke width by pixeloidScale for consistent thickness)
    this.graphics.stroke({
      width: line.strokeWidth / pixeloidScale,
      color: line.color
    })
  }

  /**
   * Render a point shape
   */
  private renderPoint(point: GeometricPoint, pixeloidScale: number): void {
    // Use raw pixeloid coordinates - camera transform handles scaling
    const x = point.x
    const y = point.y

    // Draw point as small circle (scale radius by pixeloidScale for consistent size)
    const pointRadius = 2 / pixeloidScale
    this.graphics.circle(x, y, pointRadius)
    this.graphics.fill(point.color)
  }

  /**
   * Render an isometric diamond shape with proper proportions
   */
  private renderDiamond(diamond: GeometricDiamond, pixeloidScale: number): void {
    // Use centralized geometry calculations
    const vertices = GeometryHelper.calculateDiamondVertices(diamond)
    
    // Draw diamond shape using calculated vertices
    this.graphics.moveTo(vertices.west.x, vertices.west.y)    // West
    this.graphics.lineTo(vertices.north.x, vertices.north.y)  // North
    this.graphics.lineTo(vertices.east.x, vertices.east.y)    // East
    this.graphics.lineTo(vertices.south.x, vertices.south.y)  // South
    this.graphics.lineTo(vertices.west.x, vertices.west.y)    // Back to West (close)

    // Apply fill if specified
    if (diamond.fillColor !== undefined) {
      this.graphics.fill(diamond.fillColor)
    }

    // Apply stroke (scale stroke width by pixeloidScale for consistent thickness)
    this.graphics.stroke({
      width: diamond.strokeWidth / pixeloidScale,
      color: diamond.color
    })
  }

  /**
   * Render preview for active drawing operations
   */
  private renderPreview(pixeloidScale: number): void {
    const activeDrawing = gameStore.geometry.drawing.activeDrawing
    
    if (!activeDrawing.isDrawing || !activeDrawing.startPoint || !activeDrawing.currentPoint) {
      return
    }

    const startPoint = activeDrawing.startPoint
    const currentPoint = activeDrawing.currentPoint
    const previewAlpha = 0.6

    if (activeDrawing.type === 'rectangle') {
      // Calculate preview rectangle properties
      const minX = Math.min(startPoint.x, currentPoint.x)
      const minY = Math.min(startPoint.y, currentPoint.y)
      const maxX = Math.max(startPoint.x, currentPoint.x)
      const maxY = Math.max(startPoint.y, currentPoint.y)
      
      const width = maxX - minX
      const height = maxY - minY
      
      // Only render preview if it has some size
      if (width >= 1 && height >= 1) {
        this.graphics.rect(minX, minY, width, height)
        this.graphics.stroke({
          width: gameStore.geometry.drawing.settings.defaultStrokeWidth / pixeloidScale,
          color: gameStore.geometry.drawing.settings.defaultColor,
          alpha: previewAlpha
        })
      }
    } else if (activeDrawing.type === 'line') {
      // Calculate distance for minimum line length
      const distance = Math.sqrt(Math.pow(currentPoint.x - startPoint.x, 2) + Math.pow(currentPoint.y - startPoint.y, 2))
      
      if (distance >= 1) {
        this.graphics.moveTo(startPoint.x, startPoint.y)
        this.graphics.lineTo(currentPoint.x, currentPoint.y)
        this.graphics.stroke({
          width: gameStore.geometry.drawing.settings.defaultStrokeWidth / pixeloidScale,
          color: gameStore.geometry.drawing.settings.defaultColor,
          alpha: previewAlpha
        })
      }
    } else if (activeDrawing.type === 'circle') {
      // Calculate radius
      const radius = Math.sqrt(Math.pow(currentPoint.x - startPoint.x, 2) + Math.pow(currentPoint.y - startPoint.y, 2))
      
      if (radius >= 1) {
        this.graphics.circle(startPoint.x, startPoint.y, radius)
        this.graphics.stroke({
          width: gameStore.geometry.drawing.settings.defaultStrokeWidth / pixeloidScale,
          color: gameStore.geometry.drawing.settings.defaultColor,
          alpha: previewAlpha
        })
      }
    } else if (activeDrawing.type === 'diamond') {
      // Use centralized geometry calculations for preview
      const preview = GeometryHelper.calculateDiamondPreview(startPoint, currentPoint)
      
      if (preview.width >= 2) {
        const vertices = preview.vertices
        
        // Draw diamond preview using calculated vertices
        this.graphics.moveTo(vertices.west.x, vertices.west.y)    // West
        this.graphics.lineTo(vertices.north.x, vertices.north.y)  // North
        this.graphics.lineTo(vertices.east.x, vertices.east.y)    // East
        this.graphics.lineTo(vertices.south.x, vertices.south.y)  // South
        this.graphics.lineTo(vertices.west.x, vertices.west.y)    // Back to West
        this.graphics.stroke({
          width: gameStore.geometry.drawing.settings.defaultStrokeWidth / pixeloidScale,
          color: gameStore.geometry.drawing.settings.defaultColor,
          alpha: previewAlpha
        })
      }
    }
  }

  /**
   * Render selection highlight around selected object
   */
  private renderSelectionHighlight(obj: GeometricObject, pixeloidScale: number): void {
    // For now, only handle diamond selection highlight
    if ('anchorX' in obj && 'anchorY' in obj) {
      const diamond = obj as GeometricDiamond
      const vertices = GeometryHelper.calculateDiamondVertices(diamond)
      
      // Draw selection outline with thicker stroke and different color
      this.graphics.moveTo(vertices.west.x, vertices.west.y)
      this.graphics.lineTo(vertices.north.x, vertices.north.y)
      this.graphics.lineTo(vertices.east.x, vertices.east.y)
      this.graphics.lineTo(vertices.south.x, vertices.south.y)
      this.graphics.lineTo(vertices.west.x, vertices.west.y)
      this.graphics.stroke({
        width: (diamond.strokeWidth + 2) / pixeloidScale,
        color: 0xff6600, // Orange selection color
        alpha: 0.8
      })
    }
    
    // TODO: Add selection highlights for other shapes
  }

  /**
   * Get the graphics object for adding to container
   */
  public getGraphics(): Graphics {
    return this.graphics
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.graphics.destroy()
  }
}