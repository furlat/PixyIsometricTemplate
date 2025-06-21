import { Graphics, Container } from 'pixi.js'
import { gameStore } from '../store/gameStore'
import { GeometryHelper } from './GeometryHelper'
import type { ViewportCorners, GeometricObject, GeometricRectangle, GeometricCircle, GeometricLine, GeometricPoint, GeometricDiamond } from '../types'

/**
 * GeometryRenderer handles rendering of user-drawn geometric shapes
 * Uses individual containers for each object for better performance and batching
 */
export class GeometryRenderer {
  private mainContainer: Container = new Container()
  private objectContainers: Map<string, Graphics> = new Map()
  private previewGraphics: Graphics = new Graphics()

  constructor() {
    // Setup main container structure
    this.mainContainer.addChild(this.previewGraphics)
  }

  /**
   * Render geometric objects with smart object management and viewport culling
   */
  public render(corners: ViewportCorners, pixeloidScale: number): void {
    // Get all geometric objects from store
    const objects = gameStore.geometry.objects

    // Only render visible objects that are within or near the viewport
    const visibleObjects = objects.filter(obj => obj.isVisible && this.isObjectInViewport(obj, corners))
    const currentObjectIds = new Set(visibleObjects.map(obj => obj.id))

    // Remove objects that are no longer visible or deleted
    for (const [objectId, graphics] of this.objectContainers) {
      if (!currentObjectIds.has(objectId)) {
        this.mainContainer.removeChild(graphics)
        graphics.destroy()
        this.objectContainers.delete(objectId)
      }
    }

    // Update visible objects
    for (const obj of visibleObjects) {
      this.updateGeometricObject(obj, pixeloidScale)
    }

    // Note: currentObjectIds tracking is handled by the objectContainers Map

    // Always render preview for active drawing
    this.renderPreview(pixeloidScale)
  }

  /**
   * Update or create a single geometric object
   */
  private updateGeometricObject(obj: GeometricObject, pixeloidScale: number): void {
    let graphics = this.objectContainers.get(obj.id)
    
    if (!graphics) {
      // Create new graphics for this object
      graphics = new Graphics()
      this.objectContainers.set(obj.id, graphics)
      this.mainContainer.addChild(graphics)
    }

    // Clear and re-render the object
    graphics.clear()
    this.renderGeometricObjectToGraphics(obj, pixeloidScale, graphics)
  }

  /**
   * Check if object is within or near the viewport for culling
   */
  private isObjectInViewport(obj: GeometricObject, corners: ViewportCorners): boolean {
    // Add padding to viewport for objects that might partially be visible
    const padding = 50 // pixeloids
    const viewportLeft = corners.topLeft.x - padding
    const viewportRight = corners.bottomRight.x + padding
    const viewportTop = corners.topLeft.y - padding
    const viewportBottom = corners.bottomRight.y + padding

    // Check bounds based on object type
    if ('anchorX' in obj && 'anchorY' in obj) {
      // Diamond object - use GeometryHelper to get vertices and calculate bounds
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
      // Rectangle object
      const rect = obj as GeometricRectangle
      return !(
        rect.x + rect.width < viewportLeft ||
        rect.x > viewportRight ||
        rect.y + rect.height < viewportTop ||
        rect.y > viewportBottom
      )
    } else if ('radius' in obj) {
      // Circle object
      const circle = obj as GeometricCircle
      return !(
        circle.centerX + circle.radius < viewportLeft ||
        circle.centerX - circle.radius > viewportRight ||
        circle.centerY + circle.radius < viewportTop ||
        circle.centerY - circle.radius > viewportBottom
      )
    } else if ('startX' in obj && 'endX' in obj) {
      // Line object
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
      // Point object
      const point = obj as GeometricPoint
      return !(
        point.x < viewportLeft ||
        point.x > viewportRight ||
        point.y < viewportTop ||
        point.y > viewportBottom
      )
    }

    // Default to visible if we can't determine bounds
    return true
  }

  /**
   * Render a single geometric object to specific graphics context
   */
  private renderGeometricObjectToGraphics(obj: GeometricObject, pixeloidScale: number, graphics: Graphics): void {
    // Type narrowing based on object properties
    if ('anchorX' in obj && 'anchorY' in obj) {
      this.renderDiamondToGraphics(obj as GeometricDiamond, pixeloidScale, graphics)
    } else if ('width' in obj && 'height' in obj) {
      this.renderRectangleToGraphics(obj as GeometricRectangle, pixeloidScale, graphics)
    } else if ('radius' in obj) {
      this.renderCircleToGraphics(obj as GeometricCircle, pixeloidScale, graphics)
    } else if ('startX' in obj && 'endX' in obj) {
      this.renderLineToGraphics(obj as GeometricLine, pixeloidScale, graphics)
    } else if ('x' in obj && 'y' in obj && !('width' in obj)) {
      this.renderPointToGraphics(obj as GeometricPoint, pixeloidScale, graphics)
    }
  }

  /**
   * Render a rectangle shape to specific graphics
   */
  private renderRectangleToGraphics(rect: GeometricRectangle, pixeloidScale: number, graphics: Graphics): void {
    // Use raw pixeloid coordinates - camera transform handles scaling
    const x = rect.x
    const y = rect.y
    const width = rect.width
    const height = rect.height

    // Draw rectangle
    graphics.rect(x, y, width, height)

    // Apply fill if specified
    if (rect.fillColor !== undefined) {
      graphics.fill({
        color: rect.fillColor,
        alpha: rect.fillAlpha ?? 0.5
      })
    }

    // Apply stroke (scale stroke width by pixeloidScale for consistent thickness)
    graphics.stroke({
      width: rect.strokeWidth / pixeloidScale,
      color: rect.color,
      alpha: rect.strokeAlpha
    })
  }

  /**
   * Render a circle shape to specific graphics
   */
  private renderCircleToGraphics(circle: GeometricCircle, pixeloidScale: number, graphics: Graphics): void {
    // Use raw pixeloid coordinates - camera transform handles scaling
    const centerX = circle.centerX
    const centerY = circle.centerY
    const radius = circle.radius

    // Draw circle
    graphics.circle(centerX, centerY, radius)

    // Apply fill if specified
    if (circle.fillColor !== undefined) {
      graphics.fill({
        color: circle.fillColor,
        alpha: circle.fillAlpha ?? 0.5
      })
    }

    // Apply stroke (scale stroke width by pixeloidScale for consistent thickness)
    graphics.stroke({
      width: circle.strokeWidth / pixeloidScale,
      color: circle.color,
      alpha: circle.strokeAlpha
    })
  }

  /**
   * Render a line shape to specific graphics
   */
  private renderLineToGraphics(line: GeometricLine, pixeloidScale: number, graphics: Graphics): void {
    // Use raw pixeloid coordinates - camera transform handles scaling
    const startX = line.startX
    const startY = line.startY
    const endX = line.endX
    const endY = line.endY

    // Draw line
    graphics.moveTo(startX, startY)
    graphics.lineTo(endX, endY)

    // Apply stroke (scale stroke width by pixeloidScale for consistent thickness)
    graphics.stroke({
      width: line.strokeWidth / pixeloidScale,
      color: line.color,
      alpha: line.strokeAlpha
    })
  }

  /**
   * Render a point shape to specific graphics
   */
  private renderPointToGraphics(point: GeometricPoint, pixeloidScale: number, graphics: Graphics): void {
    // Use raw pixeloid coordinates - camera transform handles scaling
    const x = point.x
    const y = point.y

    // Draw point as small circle (scale radius by pixeloidScale for consistent size)
    const pointRadius = 2 / pixeloidScale
    graphics.circle(x, y, pointRadius)
    graphics.fill({
      color: point.color,
      alpha: point.strokeAlpha
    })
  }

  /**
   * Render an isometric diamond shape to specific graphics
   */
  private renderDiamondToGraphics(diamond: GeometricDiamond, pixeloidScale: number, graphics: Graphics): void {
    // Use centralized geometry calculations
    const vertices = GeometryHelper.calculateDiamondVertices(diamond)
    
    // Draw diamond shape using calculated vertices
    graphics.moveTo(vertices.west.x, vertices.west.y)    // West
    graphics.lineTo(vertices.north.x, vertices.north.y)  // North
    graphics.lineTo(vertices.east.x, vertices.east.y)    // East
    graphics.lineTo(vertices.south.x, vertices.south.y)  // South
    graphics.lineTo(vertices.west.x, vertices.west.y)    // Back to West (close)

    // Apply fill if specified
    if (diamond.fillColor !== undefined) {
      graphics.fill({
        color: diamond.fillColor,
        alpha: diamond.fillAlpha ?? 0.5
      })
    }

    // Apply stroke (scale stroke width by pixeloidScale for consistent thickness)
    graphics.stroke({
      width: diamond.strokeWidth / pixeloidScale,
      color: diamond.color,
      alpha: diamond.strokeAlpha
    })
  }

  /**
   * Render preview for active drawing operations
   */
  private renderPreview(pixeloidScale: number): void {
    this.previewGraphics.clear()
    
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
        this.previewGraphics.rect(minX, minY, width, height)
        
        // Apply fill if enabled
        if (gameStore.geometry.drawing.settings.fillEnabled) {
          this.previewGraphics.fill({
            color: gameStore.geometry.drawing.settings.defaultFillColor,
            alpha: previewAlpha * gameStore.geometry.drawing.settings.fillAlpha
          })
        }
        
        this.previewGraphics.stroke({
          width: gameStore.geometry.drawing.settings.defaultStrokeWidth / pixeloidScale,
          color: gameStore.geometry.drawing.settings.defaultColor,
          alpha: previewAlpha * gameStore.geometry.drawing.settings.strokeAlpha
        })
      }
    } else if (activeDrawing.type === 'line') {
      // Calculate distance for minimum line length
      const distance = Math.sqrt(Math.pow(currentPoint.x - startPoint.x, 2) + Math.pow(currentPoint.y - startPoint.y, 2))
      
      if (distance >= 1) {
        this.previewGraphics.moveTo(startPoint.x, startPoint.y)
        this.previewGraphics.lineTo(currentPoint.x, currentPoint.y)
        this.previewGraphics.stroke({
          width: gameStore.geometry.drawing.settings.defaultStrokeWidth / pixeloidScale,
          color: gameStore.geometry.drawing.settings.defaultColor,
          alpha: previewAlpha * gameStore.geometry.drawing.settings.strokeAlpha
        })
      }
    } else if (activeDrawing.type === 'circle') {
      // Calculate radius
      const radius = Math.sqrt(Math.pow(currentPoint.x - startPoint.x, 2) + Math.pow(currentPoint.y - startPoint.y, 2))
      
      if (radius >= 1) {
        this.previewGraphics.circle(startPoint.x, startPoint.y, radius)
        
        // Apply fill if enabled
        if (gameStore.geometry.drawing.settings.fillEnabled) {
          this.previewGraphics.fill({
            color: gameStore.geometry.drawing.settings.defaultFillColor,
            alpha: previewAlpha * gameStore.geometry.drawing.settings.fillAlpha
          })
        }
        
        this.previewGraphics.stroke({
          width: gameStore.geometry.drawing.settings.defaultStrokeWidth / pixeloidScale,
          color: gameStore.geometry.drawing.settings.defaultColor,
          alpha: previewAlpha * gameStore.geometry.drawing.settings.strokeAlpha
        })
      }
    } else if (activeDrawing.type === 'diamond') {
      // Use centralized geometry calculations for preview
      const preview = GeometryHelper.calculateDiamondPreview(startPoint, currentPoint)
      
      if (preview.width >= 2) {
        const vertices = preview.vertices
        
        // Draw diamond preview using calculated vertices
        this.previewGraphics.moveTo(vertices.west.x, vertices.west.y)    // West
        this.previewGraphics.lineTo(vertices.north.x, vertices.north.y)  // North
        this.previewGraphics.lineTo(vertices.east.x, vertices.east.y)    // East
        this.previewGraphics.lineTo(vertices.south.x, vertices.south.y)  // South
        this.previewGraphics.lineTo(vertices.west.x, vertices.west.y)    // Back to West
        
        // Apply fill if enabled
        if (gameStore.geometry.drawing.settings.fillEnabled) {
          this.previewGraphics.fill({
            color: gameStore.geometry.drawing.settings.defaultFillColor,
            alpha: previewAlpha * gameStore.geometry.drawing.settings.fillAlpha
          })
        }
        
        this.previewGraphics.stroke({
          width: gameStore.geometry.drawing.settings.defaultStrokeWidth / pixeloidScale,
          color: gameStore.geometry.drawing.settings.defaultColor,
          alpha: previewAlpha * gameStore.geometry.drawing.settings.strokeAlpha
        })
      }
    }
  }


  /**
   * Get the main container for adding to layer
   */
  public getGraphics(): Container {
    return this.mainContainer
  }

  /**
   * Get object containers for texture capture (READ-ONLY access for TextureRegistry)
   * This provides access to individual object Graphics for post-render texture capture
   */
  public getObjectContainers(): Map<string, Graphics> {
    return new Map(this.objectContainers) // Return copy to prevent external modification
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    // Destroy all object graphics
    for (const graphics of this.objectContainers.values()) {
      graphics.destroy()
    }
    this.objectContainers.clear()
    
    // Destroy preview graphics
    this.previewGraphics.destroy()
    
    // Destroy main container
    this.mainContainer.destroy()
  }
}