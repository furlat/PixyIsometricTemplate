import { Graphics, Container } from 'pixi.js'
import { gameStore } from '../store/gameStore'
import { GeometryHelper } from './GeometryHelper'
import { CoordinateHelper } from './CoordinateHelper'
import { subscribe } from 'valtio'
import type {
  ViewportCorners,
  GeometricObject,
  GeometricRectangle,
  GeometricCircle,
  GeometricLine,
  GeometricPoint,
  GeometricDiamond
} from '../types'

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
   * Simple render system - always renders when called by LayeredInfiniteCanvas
   * No memoization, no optimization - just reliable rendering every time
   */
  public render(corners: ViewportCorners, pixeloidScale: number): void {
    console.log('🎨 GeometryRenderer: Always rendering (no memoization)', {
      offset: { ...gameStore.mesh.vertex_to_pixeloid_offset },
      scale: pixeloidScale,
      objectCount: gameStore.geometry.objects.length,
      timestamp: Date.now()
    })

    // Get all objects from store
    const objects = gameStore.geometry.objects
    
    // Filter objects in viewport (use original pixeloid coordinates for culling)
    const visibleObjects = objects.filter(obj =>
      obj.isVisible && this.isObjectInViewport(obj, corners)
    )
    
    const currentObjectIds = new Set(visibleObjects.map(obj => obj.id))

    // Remove objects that are no longer visible or deleted
    for (const [objectId, graphics] of this.objectContainers) {
      if (!currentObjectIds.has(objectId)) {
        this.mainContainer.removeChild(graphics)
        graphics.destroy()
        this.objectContainers.delete(objectId)
        console.log(`GeometryRenderer: Removed object ${objectId} (no longer visible)`)
      }
    }

    // Update visible objects (convert to vertex coordinates for rendering)
    for (const obj of visibleObjects) {
      this.updateGeometricObjectWithCoordinateConversion(obj, pixeloidScale)
    }

    // Always render preview for active drawing (also with coordinate conversion)
    this.renderPreviewWithCoordinateConversion()
    
    console.log('✅ GeometryRenderer: Render completed - always renders every call')
  }

  /**
   * Update or create a single geometric object with coordinate conversion
   */
  private updateGeometricObjectWithCoordinateConversion(obj: GeometricObject, pixeloidScale: number): void {
    let graphics = this.objectContainers.get(obj.id)
    
    if (!graphics) {
      // Create new graphics for this object
      graphics = new Graphics()
      this.objectContainers.set(obj.id, graphics)
      this.mainContainer.addChild(graphics)
    }

    // Clear and re-render the object
    graphics.clear()
    
    // ✅ COORDINATE CONVERSION: Convert object from pixeloid to vertex coordinates
    const convertedObject = this.convertObjectToVertexCoordinates(obj)
    
    // Position graphics at (0,0) and draw object at vertex coordinates
    graphics.position.set(0, 0)
    this.renderGeometricObjectToGraphics(convertedObject, pixeloidScale, graphics)
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
      this.renderDiamondToGraphics(obj as GeometricDiamond, graphics)
    } else if ('width' in obj && 'height' in obj) {
      this.renderRectangleToGraphics(obj as GeometricRectangle, graphics)
    } else if ('radius' in obj) {
      this.renderCircleToGraphics(obj as GeometricCircle, graphics)
    } else if ('startX' in obj && 'endX' in obj) {
      this.renderLineToGraphics(obj as GeometricLine, graphics)
    } else if ('x' in obj && 'y' in obj && !('width' in obj)) {
      this.renderPointToGraphics(obj as GeometricPoint, pixeloidScale, graphics)
    }
  }

  /**
   * Render a rectangle shape to specific graphics
   */
  private renderRectangleToGraphics(rect: GeometricRectangle, graphics: Graphics): void {
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

    // Apply stroke (strokeWidth is multiplier over pixeloidScale)
    graphics.stroke({
      width: rect.strokeWidth || gameStore.geometry.drawing.settings.defaultStrokeWidth,
      color: rect.color,
      alpha: rect.strokeAlpha
    })
  }

  /**
   * Render a circle shape to specific graphics
   */
  private renderCircleToGraphics(circle: GeometricCircle, graphics: Graphics): void {
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

    // Apply stroke (strokeWidth is multiplier over pixeloidScale)
    graphics.stroke({
      width: circle.strokeWidth || gameStore.geometry.drawing.settings.defaultStrokeWidth,
      color: circle.color,
      alpha: circle.strokeAlpha
    })
  }

  /**
   * Render a line shape to specific graphics
   */
  private renderLineToGraphics(line: GeometricLine, graphics: Graphics): void {
    // Use raw pixeloid coordinates - camera transform handles scaling
    const startX = line.startX
    const startY = line.startY
    const endX = line.endX
    const endY = line.endY

    // Draw line
    graphics.moveTo(startX, startY)
    graphics.lineTo(endX, endY)

    // Apply stroke (strokeWidth is multiplier over pixeloidScale)
    graphics.stroke({
      width: line.strokeWidth || gameStore.geometry.drawing.settings.defaultStrokeWidth,
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
  private renderDiamondToGraphics(diamond: GeometricDiamond, graphics: Graphics): void {
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

    // Apply stroke (strokeWidth is multiplier over pixeloidScale)
    graphics.stroke({
      width: diamond.strokeWidth || gameStore.geometry.drawing.settings.defaultStrokeWidth,
      color: diamond.color,
      alpha: diamond.strokeAlpha
    })
  }

  /**
   * Render preview for active drawing operations
   */
  private renderPreview(): void {
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
          width: gameStore.geometry.drawing.settings.defaultStrokeWidth,
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
          width: gameStore.geometry.drawing.settings.defaultStrokeWidth,
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
          width: gameStore.geometry.drawing.settings.defaultStrokeWidth,
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
          width: gameStore.geometry.drawing.settings.defaultStrokeWidth,
          color: gameStore.geometry.drawing.settings.defaultColor,
          alpha: previewAlpha * gameStore.geometry.drawing.settings.strokeAlpha
        })
      }
    }
  }

  /**
   * Get the main container for adding to layer
   */
  public getContainer(): Container {
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
   * Render preview for active drawing operations with coordinate conversion
   */
  private renderPreviewWithCoordinateConversion(): void {
    this.previewGraphics.clear()
    
    const activeDrawing = gameStore.geometry.drawing.activeDrawing
    
    if (!activeDrawing.isDrawing || !activeDrawing.startPoint || !activeDrawing.currentPoint) {
      return
    }

    // ✅ COORDINATE CONVERSION: Convert preview coordinates using existing utilities
    const startPoint = CoordinateHelper.pixeloidToMeshVertex({
      __brand: 'pixeloid',
      x: activeDrawing.startPoint.x,
      y: activeDrawing.startPoint.y
    })
    const currentPoint = CoordinateHelper.pixeloidToMeshVertex({
      __brand: 'pixeloid',
      x: activeDrawing.currentPoint.x,
      y: activeDrawing.currentPoint.y
    })

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
          width: gameStore.geometry.drawing.settings.defaultStrokeWidth,
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
          width: gameStore.geometry.drawing.settings.defaultStrokeWidth,
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
          width: gameStore.geometry.drawing.settings.defaultStrokeWidth,
          color: gameStore.geometry.drawing.settings.defaultColor,
          alpha: previewAlpha * gameStore.geometry.drawing.settings.strokeAlpha
        })
      }
    } else if (activeDrawing.type === 'diamond') {
      // Convert vertex coordinates back to pixeloid for GeometryHelper
      const startPixeloid = CoordinateHelper.meshVertexToPixeloid({
        x: startPoint.x,
        y: startPoint.y
      })
      const currentPixeloid = CoordinateHelper.meshVertexToPixeloid({
        x: currentPoint.x,
        y: currentPoint.y
      })
      
      // Use centralized geometry calculations for preview
      const preview = GeometryHelper.calculateDiamondPreview(startPixeloid, currentPixeloid)
      
      if (preview.width >= 2) {
        const vertices = preview.vertices
        
        // Convert vertices to vertex coordinates for rendering using coordinate utilities
        const convertedVertices = {
          west: CoordinateHelper.pixeloidToMeshVertex(vertices.west),
          north: CoordinateHelper.pixeloidToMeshVertex(vertices.north),
          east: CoordinateHelper.pixeloidToMeshVertex(vertices.east),
          south: CoordinateHelper.pixeloidToMeshVertex(vertices.south)
        }
        
        // Draw diamond preview using converted vertices
        this.previewGraphics.moveTo(convertedVertices.west.x, convertedVertices.west.y)    // West
        this.previewGraphics.lineTo(convertedVertices.north.x, convertedVertices.north.y)  // North
        this.previewGraphics.lineTo(convertedVertices.east.x, convertedVertices.east.y)    // East
        this.previewGraphics.lineTo(convertedVertices.south.x, convertedVertices.south.y)  // South
        this.previewGraphics.lineTo(convertedVertices.west.x, convertedVertices.west.y)    // Back to West
        
        // Apply fill if enabled
        if (gameStore.geometry.drawing.settings.fillEnabled) {
          this.previewGraphics.fill({
            color: gameStore.geometry.drawing.settings.defaultFillColor,
            alpha: previewAlpha * gameStore.geometry.drawing.settings.fillAlpha
          })
        }
        
        this.previewGraphics.stroke({
          width: gameStore.geometry.drawing.settings.defaultStrokeWidth,
          color: gameStore.geometry.drawing.settings.defaultColor,
          alpha: previewAlpha * gameStore.geometry.drawing.settings.strokeAlpha
        })
      }
    }
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