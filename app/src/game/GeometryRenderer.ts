import { Graphics, Container } from 'pixi.js'
import { gameStore } from '../store/gameStore'
import { GeometryHelper } from './GeometryHelper'
import { CoordinateCalculations } from './CoordinateCalculations'
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
  
  // Filter containers as render groups for GPU optimization
  private normalContainer: Container = new Container({ isRenderGroup: true })
  private selectedContainer: Container = new Container({ isRenderGroup: true })
  
  // Individual object containers and graphics tracking
  private objectContainers: Map<string, Container> = new Map()
  private objectGraphics: Map<string, Graphics> = new Map()
  private previewGraphics: Graphics = new Graphics()
  
  
  constructor() {
    // Setup container hierarchy
    this.mainContainer.addChild(this.normalContainer)
    this.mainContainer.addChild(this.selectedContainer)
    this.mainContainer.addChild(this.previewGraphics)
    
    // Keep containers clean - no filters in GeometryRenderer (handled by dedicated filter renderers)
    this.selectedContainer.filters = null
    this.normalContainer.filters = null
    
    // Subscribe to selection changes only
    this.subscribeToSelection()
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
    
    // Filter objects using pre-computed visibility state
    const visibleObjects = objects.filter(obj =>
      obj.isVisible &&
      (!obj.metadata?.visibility || obj.metadata.visibility !== 'offscreen')  // Skip off-screen objects
    )
    
    const currentObjectIds = new Set(visibleObjects.map(obj => obj.id))

    // Remove objects that are no longer visible or deleted
    for (const [objectId, container] of this.objectContainers) {
      if (!currentObjectIds.has(objectId)) {
        // Clean up container and graphics
        container.removeFromParent()
        container.destroy()
        this.objectContainers.delete(objectId)
        this.objectGraphics.delete(objectId)
        console.log(`GeometryRenderer: Removed object ${objectId} (no longer visible)`)
      }
    }

    // Update visible objects (convert to vertex coordinates for rendering)
    for (const obj of visibleObjects) {
      this.updateGeometricObjectWithCoordinateConversion(obj, pixeloidScale)
    }

    // Always render preview for active drawing (also with coordinate conversion)
    this.renderPreviewWithCoordinateConversion(pixeloidScale)
    
    console.log('✅ GeometryRenderer: Render completed - always renders every call')
  }

  /**
   * Update or create a single geometric object with coordinate conversion
   */
  private updateGeometricObjectWithCoordinateConversion(obj: GeometricObject, pixeloidScale: number): void {
    let objectContainer = this.objectContainers.get(obj.id)
    let graphics = this.objectGraphics.get(obj.id)
    
    if (!objectContainer) {
      // Create new container + graphics for this object
      objectContainer = new Container()
      graphics = new Graphics()
      objectContainer.addChild(graphics)
      
      this.objectContainers.set(obj.id, objectContainer)
      this.objectGraphics.set(obj.id, graphics)
    }

    // Clear and re-render the graphics
    graphics!.clear()
    
    // ✅ COORDINATE CONVERSION: Convert object from pixeloid to vertex coordinates
    const convertedObject = this.convertObjectToVertexCoordinates(obj)
    
    // Position graphics at (0,0) and draw object at vertex coordinates
    graphics!.position.set(0, 0)
    this.renderGeometricObjectToGraphics(convertedObject, pixeloidScale, graphics!)
    
    // Assign to appropriate filter container based on selection
    this.assignObjectToFilterContainer(obj.id, objectContainer)
  }

  /**
   * Assign object container to appropriate filter group based on selection state
   */
  private assignObjectToFilterContainer(objectId: string, objectContainer: Container): void {
    const isSelected = gameStore.geometry.selection.selectedObjectId === objectId
    
    // Remove from current parent
    objectContainer.removeFromParent()
    
    // Assign to appropriate container
    if (isSelected) {
      this.selectedContainer.addChild(objectContainer)  // Selection handled by SelectionFilterRenderer
    } else {
      this.normalContainer.addChild(objectContainer)    // No filter
    }
  }



  /**
   * Subscribe to selection changes for container assignment
   */
  private subscribeToSelection(): void {
    subscribe(gameStore.geometry.selection, () => {
      this.updateSelectionFilterAssignment()
    })
  }

  /**
   * Update filter assignment when selection changes
   */
  private updateSelectionFilterAssignment(): void {
    // Reassign all objects to correct containers when selection changes
    for (const [objectId, container] of this.objectContainers) {
      this.assignObjectToFilterContainer(objectId, container)
    }
  }

  /**
   * Convert object from pixeloid coordinates to vertex coordinates using EXACT conversion (no rounding)
   * This prevents geometry anchoring drift during zoom operations
   */
  private convertObjectToVertexCoordinates(obj: GeometricObject): GeometricObject {
    const offset = gameStore.mesh.vertex_to_pixeloid_offset
    
    if ('anchorX' in obj && 'anchorY' in obj) {
      // Diamond object - use exact coordinate conversion
      return {
        ...obj,
        anchorX: obj.anchorX - offset.x,  // EXACT conversion, no rounding
        anchorY: obj.anchorY - offset.y
      }
    } else if ('x' in obj && 'width' in obj && 'height' in obj) {
      // Rectangle object - use exact coordinate conversion
      return {
        ...obj,
        x: obj.x - offset.x,  // EXACT conversion, no rounding
        y: obj.y - offset.y
      }
    } else if ('centerX' in obj && 'centerY' in obj) {
      // Circle object - use exact coordinate conversion
      return {
        ...obj,
        centerX: obj.centerX - offset.x,  // EXACT conversion, no rounding
        centerY: obj.centerY - offset.y
      }
    } else if ('startX' in obj && 'endX' in obj) {
      // Line object - convert both points using exact conversion
      return {
        ...obj,
        startX: obj.startX - offset.x,  // EXACT conversion, no rounding
        startY: obj.startY - offset.y,
        endX: obj.endX - offset.x,
        endY: obj.endY - offset.y
      }
    } else if ('x' in obj && 'y' in obj) {
      // Point object - use exact coordinate conversion
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
   * Check if object is within or near the viewport for culling
   */
 
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
    // Convert vertex coordinates to screen coordinates
    const topLeft = CoordinateCalculations.vertexToScreen(
      { __brand: 'vertex' as const, x: rect.x, y: rect.y },
      pixeloidScale
    )
    const x = topLeft.x
    const y = topLeft.y
    const width = rect.width * pixeloidScale
    const height = rect.height * pixeloidScale

    // Draw rectangle at screen coordinates
    graphics.rect(x, y, width, height)

    // Apply fill if specified
    if (rect.fillColor !== undefined) {
      graphics.fill({
        color: rect.fillColor,
        alpha: rect.fillAlpha ?? 0.5
      })
    }

    // Apply stroke (strokeWidth is in pixeloids, multiply by scale)
    graphics.stroke({
      width: (rect.strokeWidth || gameStore.geometry.drawing.settings.defaultStrokeWidth) * pixeloidScale,
      color: rect.color,
      alpha: rect.strokeAlpha
    })
  }

  /**
   * Render a circle shape to specific graphics
   */
  private renderCircleToGraphics(circle: GeometricCircle, pixeloidScale: number, graphics: Graphics): void {
    // Convert center vertex to screen coordinates
    const center = CoordinateCalculations.vertexToScreen(
      { __brand: 'vertex' as const, x: circle.centerX, y: circle.centerY },
      pixeloidScale
    )
    const centerX = center.x
    const centerY = center.y
    const radius = circle.radius * pixeloidScale

    // Draw circle at screen coordinates
    graphics.circle(centerX, centerY, radius)

    // Apply fill if specified
    if (circle.fillColor !== undefined) {
      graphics.fill({
        color: circle.fillColor,
        alpha: circle.fillAlpha ?? 0.5
      })
    }

    // Apply stroke (strokeWidth is in pixeloids, multiply by scale)
    graphics.stroke({
      width: (circle.strokeWidth || gameStore.geometry.drawing.settings.defaultStrokeWidth) * pixeloidScale,
      color: circle.color,
      alpha: circle.strokeAlpha
    })
  }

  /**
   * Render a line shape to specific graphics
   */
  private renderLineToGraphics(line: GeometricLine, pixeloidScale: number, graphics: Graphics): void {
    // Convert both endpoints to screen coordinates
    const start = CoordinateCalculations.vertexToScreen(
      { __brand: 'vertex' as const, x: line.startX, y: line.startY },
      pixeloidScale
    )
    const end = CoordinateCalculations.vertexToScreen(
      { __brand: 'vertex' as const, x: line.endX, y: line.endY },
      pixeloidScale
    )

    // Draw line at screen coordinates
    graphics.moveTo(start.x, start.y)
    graphics.lineTo(end.x, end.y)

    // Apply stroke (strokeWidth is in pixeloids, multiply by scale)
    graphics.stroke({
      width: (line.strokeWidth || gameStore.geometry.drawing.settings.defaultStrokeWidth) * pixeloidScale,
      color: line.color,
      alpha: line.strokeAlpha
    })
  }

  /**
   * Render a point shape to specific graphics
   */
  private renderPointToGraphics(point: GeometricPoint, pixeloidScale: number, graphics: Graphics): void {
    // Convert vertex position to screen coordinates
    const pos = CoordinateCalculations.vertexToScreen(
      { __brand: 'vertex' as const, x: point.x, y: point.y },
      pixeloidScale
    )
    
    // Draw point as small circle with fixed pixel size
    const pointRadius = 2  // Fixed pixel size, no scaling needed
    graphics.circle(pos.x, pos.y, pointRadius)
    graphics.fill({
      color: point.color,
      alpha: point.strokeAlpha
    })
  }

  /**
   * Render an isometric diamond shape to specific graphics
   */
  private renderDiamondToGraphics(diamond: GeometricDiamond, pixeloidScale: number, graphics: Graphics): void {
    // Use centralized geometry calculations (already in vertex coordinates)
    const vertices = GeometryHelper.calculateDiamondVertices(diamond)
    
    // Convert each vertex to screen coordinates
    const west = CoordinateCalculations.vertexToScreen(
      { __brand: 'vertex' as const, x: vertices.west.x, y: vertices.west.y },
      pixeloidScale
    )
    const north = CoordinateCalculations.vertexToScreen(
      { __brand: 'vertex' as const, x: vertices.north.x, y: vertices.north.y },
      pixeloidScale
    )
    const east = CoordinateCalculations.vertexToScreen(
      { __brand: 'vertex' as const, x: vertices.east.x, y: vertices.east.y },
      pixeloidScale
    )
    const south = CoordinateCalculations.vertexToScreen(
      { __brand: 'vertex' as const, x: vertices.south.x, y: vertices.south.y },
      pixeloidScale
    )
    
    // Draw diamond shape using screen coordinates
    graphics.moveTo(west.x, west.y)    // West
    graphics.lineTo(north.x, north.y)  // North
    graphics.lineTo(east.x, east.y)    // East
    graphics.lineTo(south.x, south.y)  // South
    graphics.lineTo(west.x, west.y)    // Back to West (close)

    // Apply fill if specified
    if (diamond.fillColor !== undefined) {
      graphics.fill({
        color: diamond.fillColor,
        alpha: diamond.fillAlpha ?? 0.5
      })
    }

    // Apply stroke (strokeWidth is in pixeloids, multiply by scale)
    graphics.stroke({
      width: (diamond.strokeWidth || gameStore.geometry.drawing.settings.defaultStrokeWidth) * pixeloidScale,
      color: diamond.color,
      alpha: diamond.strokeAlpha
    })
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
    return new Map(this.objectGraphics) // Return copy to prevent external modification
  }

  /**
   * Get specific object container for external texture capture
   * Used by filter renderers to capture geometry appearance as textures
   */
  public getObjectContainer(objectId: string): Container | undefined {
    return this.objectContainers.get(objectId)
  }

  /**
   * Get specific object graphics for direct texture capture
   * Returns the raw graphics content without container positioning
   */
  public getObjectGraphics(objectId: string): Graphics | undefined {
    return this.objectGraphics.get(objectId)
  }


  /**
   * Render preview for active drawing operations - NEW: uses unified preview system
   */
  private renderPreviewWithCoordinateConversion(pixeloidScale: number): void {
    this.previewGraphics.clear()
    
    const preview = gameStore.geometry.drawing.preview
    
    if (!preview) {
      return
    }

    // ✅ COORDINATE CONVERSION: Convert preview vertices from pixeloid to vertex
    const offset = gameStore.mesh.vertex_to_pixeloid_offset
    const vertexVertices = preview.vertices.map(vertex => ({
      x: vertex.x - offset.x,  // pixeloid to vertex
      y: vertex.y - offset.y
    }))

    // Then convert from vertex to screen coordinates
    const renderVertices = vertexVertices.map(vertex =>
      CoordinateCalculations.vertexToScreen(
        { __brand: 'vertex' as const, x: vertex.x, y: vertex.y },
        pixeloidScale
      )
    )

    const previewAlpha = 0.6

    // Render based on geometry type using screen coordinates
    switch (preview.type) {
      case 'point':
        if (renderVertices[0]) {
          this.previewGraphics.circle(renderVertices[0].x, renderVertices[0].y, 2)
          this.previewGraphics.fill({
            color: preview.style.color,
            alpha: previewAlpha * preview.style.strokeAlpha
          })
        }
        break
        
      case 'line':
        if (renderVertices[0] && renderVertices[1]) {
          this.previewGraphics.moveTo(renderVertices[0].x, renderVertices[0].y)
          this.previewGraphics.lineTo(renderVertices[1].x, renderVertices[1].y)
          this.previewGraphics.stroke({
            width: preview.style.strokeWidth * pixeloidScale,
            color: preview.style.color,
            alpha: previewAlpha * preview.style.strokeAlpha
          })
        }
        break
        
      case 'circle':
        if (renderVertices.length >= 3) {
          const [west, east, center] = renderVertices
          const radius = Math.abs(east.x - west.x) / 2
          if (radius > 0) {
            this.previewGraphics.circle(center.x, center.y, radius)
            
            // Apply fill if enabled
            if (preview.style.fillColor !== undefined) {
              this.previewGraphics.fill({
                color: preview.style.fillColor,
                alpha: previewAlpha * (preview.style.fillAlpha ?? 0.5)
              })
            }
            
            this.previewGraphics.stroke({
              width: preview.style.strokeWidth * pixeloidScale,
              color: preview.style.color,
              alpha: previewAlpha * preview.style.strokeAlpha
            })
          }
        }
        break
        
      case 'rectangle':
        if (renderVertices.length >= 4) {
          const [topLeft, topRight, , bottomLeft] = renderVertices
          const width = topRight.x - topLeft.x
          const height = bottomLeft.y - topLeft.y
          
          if (width >= 1 && height >= 1) {
            this.previewGraphics.rect(topLeft.x, topLeft.y, width, height)
            
            // Apply fill if enabled
            if (preview.style.fillColor !== undefined) {
              this.previewGraphics.fill({
                color: preview.style.fillColor,
                alpha: previewAlpha * (preview.style.fillAlpha ?? 0.5)
              })
            }
            
            this.previewGraphics.stroke({
              width: preview.style.strokeWidth * pixeloidScale,
              color: preview.style.color,
              alpha: previewAlpha * preview.style.strokeAlpha
            })
          }
        }
        break
        
      case 'diamond':
        if (renderVertices.length >= 4) {
          const [west, north, east, south] = renderVertices
          this.previewGraphics.moveTo(west.x, west.y)
          this.previewGraphics.lineTo(north.x, north.y)
          this.previewGraphics.lineTo(east.x, east.y)
          this.previewGraphics.lineTo(south.x, south.y)
          this.previewGraphics.lineTo(west.x, west.y) // Close path
          
          // Apply fill if enabled
          if (preview.style.fillColor !== undefined) {
            this.previewGraphics.fill({
              color: preview.style.fillColor,
              alpha: previewAlpha * (preview.style.fillAlpha ?? 0.5)
            })
          }
          
          this.previewGraphics.stroke({
            width: preview.style.strokeWidth * pixeloidScale,
            color: preview.style.color,
            alpha: previewAlpha * preview.style.strokeAlpha
          })
        }
        break
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