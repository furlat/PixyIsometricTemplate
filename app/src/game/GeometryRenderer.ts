import { Graphics, Container } from 'pixi.js'
import { gameStore } from '../store/gameStore'
import { GeometryHelper } from './GeometryHelper'
import { CoordinateCalculations } from './CoordinateCalculations'
import { subscribe } from 'valtio'
import type {
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
  public render(): void {  // Remove pixeloidScale parameter
    const zoomFactor = gameStore.cameraViewport.zoom_factor
    const samplingPos = gameStore.cameraViewport.geometry_sampling_position
    
    console.log('🎨 GeometryRenderer: ECS viewport sampling', {
      samplingPos: { ...samplingPos },
      zoomFactor: zoomFactor,
      objectCount: gameStore.geometry.objects.length,
      timestamp: Date.now()
    })

    // Get all objects from store
    const objects = gameStore.geometry.objects
    
    // ECS viewport sampling: only render objects within sampling bounds
    const viewportBounds = {
      minX: samplingPos.x,
      maxX: samplingPos.x + (gameStore.windowWidth / zoomFactor),
      minY: samplingPos.y,
      maxY: samplingPos.y + (gameStore.windowHeight / zoomFactor)
    }
    
    const visibleObjects = objects.filter(obj => {
      if (!obj.isVisible || !obj.metadata) return false
      return this.isObjectInViewportBounds(obj, viewportBounds)
    })
    
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

    // Render objects at fixed scale 1 (ECS data sampling)
    for (const obj of visibleObjects) {
      this.renderObjectDirectly(obj)
    }

    // Always render preview for active drawing
    this.renderPreviewDirectly()
    
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
   * Check if object is within ECS viewport bounds for culling
   */
  private isObjectInViewportBounds(obj: GeometricObject, viewportBounds: any): boolean {
    if (!obj.metadata) return false
    
    const objBounds = obj.metadata.bounds
    return !(objBounds.maxX < viewportBounds.minX || 
            objBounds.minX > viewportBounds.maxX ||
            objBounds.maxY < viewportBounds.minY ||
            objBounds.minY > viewportBounds.maxY)
  }
  
  /**
   * Render object directly at fixed scale 1 (no coordinate conversion)
   */
  private renderObjectDirectly(obj: GeometricObject): void {
    let objectContainer = this.objectContainers.get(obj.id)
    let graphics = this.objectGraphics.get(obj.id)
    
    if (!objectContainer) {
      objectContainer = new Container()
      graphics = new Graphics()
      objectContainer.addChild(graphics)
      
      this.objectContainers.set(obj.id, objectContainer)
      this.objectGraphics.set(obj.id, graphics)
    }

    graphics!.clear()
    graphics!.position.set(0, 0)
    
    // Render at fixed scale 1 with ECS sampling position offset
    const samplingPos = gameStore.cameraViewport.geometry_sampling_position
    this.renderGeometricObjectToGraphicsECS(obj, graphics!, samplingPos)
    
    this.assignObjectToFilterContainer(obj.id, objectContainer)
  }

  /**
   * Check if object is within or near the viewport for culling
   */
 
  /**
   * Render a single geometric object to specific graphics context for ECS
   */
  private renderGeometricObjectToGraphicsECS(obj: GeometricObject, graphics: Graphics, samplingPos: any): void {
    const zoomFactor = gameStore.cameraViewport.zoom_factor
    
    // Type narrowing and direct rendering at scale 1
    if ('anchorX' in obj && 'anchorY' in obj) {
      this.renderDiamondECS(obj as GeometricDiamond, graphics, samplingPos, zoomFactor)
    } else if ('width' in obj && 'height' in obj) {
      this.renderRectangleECS(obj as GeometricRectangle, graphics, samplingPos, zoomFactor)
    } else if ('radius' in obj) {
      this.renderCircleECS(obj as GeometricCircle, graphics, samplingPos, zoomFactor)
    } else if ('startX' in obj && 'endX' in obj) {
      this.renderLineECS(obj as GeometricLine, graphics, samplingPos, zoomFactor)
    } else if ('x' in obj && 'y' in obj && !('width' in obj)) {
      this.renderPointECS(obj as GeometricPoint, graphics, samplingPos, zoomFactor)
    }
  }

  /**
   * Render a rectangle shape for ECS at fixed scale 1
   */
  private renderRectangleECS(rect: GeometricRectangle, graphics: Graphics, samplingPos: any, zoomFactor: number): void {
    const x = (rect.x - samplingPos.x) * zoomFactor
    const y = (rect.y - samplingPos.y) * zoomFactor
    const width = rect.width * zoomFactor
    const height = rect.height * zoomFactor

    graphics.rect(x, y, width, height)

    if (rect.fillColor !== undefined) {
      graphics.fill({
        color: rect.fillColor,
        alpha: rect.fillAlpha ?? 0.5
      })
    }

    graphics.stroke({
      width: (rect.strokeWidth || gameStore.geometry.drawing.settings.defaultStrokeWidth) * zoomFactor,
      color: rect.color,
      alpha: rect.strokeAlpha
    })
  }

  /**
   * Render a circle shape for ECS at fixed scale 1
   */
  private renderCircleECS(circle: GeometricCircle, graphics: Graphics, samplingPos: any, zoomFactor: number): void {
    const centerX = (circle.centerX - samplingPos.x) * zoomFactor
    const centerY = (circle.centerY - samplingPos.y) * zoomFactor
    const radius = circle.radius * zoomFactor

    graphics.circle(centerX, centerY, radius)

    if (circle.fillColor !== undefined) {
      graphics.fill({
        color: circle.fillColor,
        alpha: circle.fillAlpha ?? 0.5
      })
    }

    graphics.stroke({
      width: (circle.strokeWidth || gameStore.geometry.drawing.settings.defaultStrokeWidth) * zoomFactor,
      color: circle.color,
      alpha: circle.strokeAlpha
    })
  }

  /**
   * Render a line shape for ECS at fixed scale 1
   */
  private renderLineECS(line: GeometricLine, graphics: Graphics, samplingPos: any, zoomFactor: number): void {
    const startX = (line.startX - samplingPos.x) * zoomFactor
    const startY = (line.startY - samplingPos.y) * zoomFactor
    const endX = (line.endX - samplingPos.x) * zoomFactor
    const endY = (line.endY - samplingPos.y) * zoomFactor

    graphics.moveTo(startX, startY)
    graphics.lineTo(endX, endY)

    graphics.stroke({
      width: (line.strokeWidth || gameStore.geometry.drawing.settings.defaultStrokeWidth) * zoomFactor,
      color: line.color,
      alpha: line.strokeAlpha
    })
  }

  /**
   * Render a point shape for ECS at fixed scale 1
   */
  private renderPointECS(point: GeometricPoint, graphics: Graphics, samplingPos: any, zoomFactor: number): void {
    const x = (point.x - samplingPos.x) * zoomFactor
    const y = (point.y - samplingPos.y) * zoomFactor
    
    const pointRadius = 2 * zoomFactor
    graphics.circle(x, y, pointRadius)
    graphics.fill({
      color: point.color,
      alpha: point.strokeAlpha
    })
  }

  /**
   * Render an isometric diamond shape for ECS at fixed scale 1
   */
  private renderDiamondECS(diamond: GeometricDiamond, graphics: Graphics, samplingPos: any, zoomFactor: number): void {
    const vertices = GeometryHelper.calculateDiamondVertices(diamond)
    
    const west = {
      x: (vertices.west.x - samplingPos.x) * zoomFactor,
      y: (vertices.west.y - samplingPos.y) * zoomFactor
    }
    const north = {
      x: (vertices.north.x - samplingPos.x) * zoomFactor,
      y: (vertices.north.y - samplingPos.y) * zoomFactor
    }
    const east = {
      x: (vertices.east.x - samplingPos.x) * zoomFactor,
      y: (vertices.east.y - samplingPos.y) * zoomFactor
    }
    const south = {
      x: (vertices.south.x - samplingPos.x) * zoomFactor,
      y: (vertices.south.y - samplingPos.y) * zoomFactor
    }
    
    graphics.moveTo(west.x, west.y)
    graphics.lineTo(north.x, north.y)
    graphics.lineTo(east.x, east.y)
    graphics.lineTo(south.x, south.y)
    graphics.lineTo(west.x, west.y)

    if (diamond.fillColor !== undefined) {
      graphics.fill({
        color: diamond.fillColor,
        alpha: diamond.fillAlpha ?? 0.5
      })
    }

    graphics.stroke({
      width: (diamond.strokeWidth || gameStore.geometry.drawing.settings.defaultStrokeWidth) * zoomFactor,
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
   * Render preview for active drawing operations using ECS
   */
  private renderPreviewDirectly(): void {
    this.previewGraphics.clear()
    
    const preview = gameStore.geometry.drawing.preview
    if (!preview) return

    const samplingPos = gameStore.cameraViewport.geometry_sampling_position
    const zoomFactor = gameStore.cameraViewport.zoom_factor
    
    // Convert preview vertices to screen coordinates for ECS
    const renderVertices = preview.vertices.map(vertex => {
      const relativeX = (vertex.x - samplingPos.x) * zoomFactor
      const relativeY = (vertex.y - samplingPos.y) * zoomFactor
      return { x: relativeX, y: relativeY }
    })

    const previewAlpha = 0.6

    // Render based on geometry type
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
            width: preview.style.strokeWidth * zoomFactor,
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
            
            if (preview.style.fillColor !== undefined) {
              this.previewGraphics.fill({
                color: preview.style.fillColor,
                alpha: previewAlpha * (preview.style.fillAlpha ?? 0.5)
              })
            }
            
            this.previewGraphics.stroke({
              width: preview.style.strokeWidth * zoomFactor,
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
            
            if (preview.style.fillColor !== undefined) {
              this.previewGraphics.fill({
                color: preview.style.fillColor,
                alpha: previewAlpha * (preview.style.fillAlpha ?? 0.5)
              })
            }
            
            this.previewGraphics.stroke({
              width: preview.style.strokeWidth * zoomFactor,
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
          this.previewGraphics.lineTo(west.x, west.y)
          
          if (preview.style.fillColor !== undefined) {
            this.previewGraphics.fill({
              color: preview.style.fillColor,
              alpha: previewAlpha * (preview.style.fillAlpha ?? 0.5)
            })
          }
          
          this.previewGraphics.stroke({
            width: preview.style.strokeWidth * zoomFactor,
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