import { Graphics, Container } from 'pixi.js'
import { gameStore_3b, gameStore_3b_methods } from '../store/gameStore_3b'
import { GeometryHelper_3b } from './GeometryHelper_3b'
import { subscribe } from 'valtio'
import type {
  GeometricObject
} from '../types/ecs-data-layer'
import type { PixeloidCoordinate } from '../types/ecs-coordinates'

/**
 * GeometryRenderer_3b handles rendering of user-drawn geometric shapes for Phase 3B
 * Based on the proven patterns from GeometryRenderer.ts
 * Uses individual containers for each object for better performance and batching
 */
export class GeometryRenderer_3b {
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
   * Simple render system - always renders when called by Phase3BCanvas
   * No memoization, no optimization - just reliable rendering every time
   */
  public render(): void {
    // For Phase 3B, we use fixed zoom factor 1 and no ECS sampling yet
    const zoomFactor = 1
    const samplingPos = gameStore_3b.navigation.offset
    
    console.log('🎨 GeometryRenderer_3b: Rendering', {
      samplingPos: { ...samplingPos },
      zoomFactor: zoomFactor,
      objectCount: gameStore_3b.geometry.objects.length,
      timestamp: Date.now()
    })

    // Get all objects from store
    const objects = gameStore_3b.geometry.objects
    
    // For Phase 3B, render all objects (no viewport culling yet)
    const visibleObjects = objects.filter(obj => obj.isVisible !== false)
    
    const currentObjectIds = new Set(visibleObjects.map(obj => obj.id))

    // Remove objects that are no longer visible or deleted
    for (const [objectId, container] of this.objectContainers) {
      if (!currentObjectIds.has(objectId)) {
        // Clean up container and graphics
        container.removeFromParent()
        container.destroy()
        this.objectContainers.delete(objectId)
        this.objectGraphics.delete(objectId)
        console.log(`GeometryRenderer_3b: Removed object ${objectId} (no longer visible)`)
      }
    }

    // Render objects at fixed scale 1 (Phase 3B foundation)
    for (const obj of visibleObjects) {
      this.renderObjectDirectly(obj)
    }

    // Always render preview for active drawing
    this.renderPreviewDirectly()
    
    console.log('✅ GeometryRenderer_3b: Render completed - always renders every call')
  }

  /**
   * Assign object container to appropriate filter group based on selection state
   */
  private assignObjectToFilterContainer(objectId: string, objectContainer: Container): void {
    const isSelected = gameStore_3b.geometry.selectedId === objectId
    
    // Remove from current parent
    objectContainer.removeFromParent()
    
    // Assign to appropriate container
    if (isSelected) {
      this.selectedContainer.addChild(objectContainer)  // Selection handled by future filter renderers
    } else {
      this.normalContainer.addChild(objectContainer)    // No filter
    }
  }

  /**
   * Subscribe to selection changes for container assignment
   */
  private subscribeToSelection(): void {
    subscribe(gameStore_3b.geometry, () => {
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
   * Handle drawing input events - MOVED FROM BackgroundGridRenderer_3b
   * This is the correct architectural location for drawing logic
   */
  public handleDrawingInput(eventType: 'down' | 'up' | 'move', pixeloidCoord: PixeloidCoordinate, event: any): void {
    const drawingMode = gameStore_3b.drawing.mode
    
    if (drawingMode === 'none') return
    
    if (eventType === 'down' && drawingMode === 'point') {
      // Create point immediately
      console.log('GeometryRenderer_3b: Creating point at', pixeloidCoord)
      gameStore_3b_methods.startDrawing(pixeloidCoord)
      gameStore_3b_methods.finishDrawing()
    } else if (eventType === 'down' && drawingMode !== 'point') {
      // Start multi-step drawing
      console.log('GeometryRenderer_3b: Starting', drawingMode, 'at', pixeloidCoord)
      gameStore_3b_methods.startDrawing(pixeloidCoord)
    } else if (eventType === 'move' && gameStore_3b.drawing.isDrawing) {
      // Update preview
      gameStore_3b_methods.updateDrawingPreview(pixeloidCoord)
    } else if (eventType === 'up' && gameStore_3b.drawing.isDrawing) {
      // Finish drawing
      console.log('GeometryRenderer_3b: Finishing', drawingMode, 'at', pixeloidCoord)
      gameStore_3b_methods.finishDrawing()
    }
  }
  
  /**
   * Render object directly at fixed scale 1 (Phase 3B foundation)
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
    
    // Render at fixed scale 1 with Phase 3B navigation offset
    const samplingPos = gameStore_3b.navigation.offset
    this.renderGeometricObjectToGraphics3B(obj, graphics!, samplingPos)
    
    this.assignObjectToFilterContainer(obj.id, objectContainer)
  }

  /**
   * Render a single geometric object to specific graphics context for Phase 3B
   */
  private renderGeometricObjectToGraphics3B(obj: GeometricObject, graphics: Graphics, samplingPos: any): void {
    const zoomFactor = 1  // Fixed for Phase 3B
    
    // Apply style settings
    const style = obj.style || gameStore_3b.style
    
    // Type-based rendering
    switch (obj.type) {
      case 'point':
        this.renderPoint3B(obj, graphics, samplingPos, zoomFactor, style)
        break
      case 'line':
        this.renderLine3B(obj, graphics, samplingPos, zoomFactor, style)
        break
      case 'circle':
        this.renderCircle3B(obj, graphics, samplingPos, zoomFactor, style)
        break
      case 'rectangle':
        this.renderRectangle3B(obj, graphics, samplingPos, zoomFactor, style)
        break
      case 'diamond':
        this.renderDiamond3B(obj, graphics, samplingPos, zoomFactor, style)
        break
    }
  }

  /**
   * Render a point shape for Phase 3B
   */
  private renderPoint3B(obj: GeometricObject, graphics: Graphics, samplingPos: any, zoomFactor: number, style: any): void {
    if (!obj.vertices || obj.vertices.length === 0) return
    
    const vertex = obj.vertices[0]
    const x = (vertex.x - samplingPos.x) * zoomFactor
    const y = (vertex.y - samplingPos.y) * zoomFactor
    
    const pointRadius = 2 * zoomFactor
    graphics.circle(x, y, pointRadius)
    graphics.fill({
      color: style.color,
      alpha: style.strokeAlpha
    })
  }

  /**
   * Render a line shape for Phase 3B
   */
  private renderLine3B(obj: GeometricObject, graphics: Graphics, samplingPos: any, zoomFactor: number, style: any): void {
    if (!obj.vertices || obj.vertices.length < 2) return
    
    const startVertex = obj.vertices[0]
    const endVertex = obj.vertices[1]
    
    const startX = (startVertex.x - samplingPos.x) * zoomFactor
    const startY = (startVertex.y - samplingPos.y) * zoomFactor
    const endX = (endVertex.x - samplingPos.x) * zoomFactor
    const endY = (endVertex.y - samplingPos.y) * zoomFactor

    graphics.moveTo(startX, startY)
    graphics.lineTo(endX, endY)

    graphics.stroke({
      width: style.strokeWidth * zoomFactor,
      color: style.color,
      alpha: style.strokeAlpha
    })
  }

  /**
   * Render a circle shape for Phase 3B
   */
  private renderCircle3B(obj: GeometricObject, graphics: Graphics, samplingPos: any, zoomFactor: number, style: any): void {
    if (!obj.vertices || obj.vertices.length < 2) return
    
    const centerVertex = obj.vertices[0]
    const radiusVertex = obj.vertices[1]
    
    const centerX = (centerVertex.x - samplingPos.x) * zoomFactor
    const centerY = (centerVertex.y - samplingPos.y) * zoomFactor
    const radius = Math.sqrt(
      Math.pow(radiusVertex.x - centerVertex.x, 2) + 
      Math.pow(radiusVertex.y - centerVertex.y, 2)
    ) * zoomFactor

    graphics.circle(centerX, centerY, radius)

    if (style.fillColor !== undefined) {
      graphics.fill({
        color: style.fillColor,
        alpha: style.fillAlpha
      })
    }

    graphics.stroke({
      width: style.strokeWidth * zoomFactor,
      color: style.color,
      alpha: style.strokeAlpha
    })
  }

  /**
   * Render a rectangle shape for Phase 3B
   */
  private renderRectangle3B(obj: GeometricObject, graphics: Graphics, samplingPos: any, zoomFactor: number, style: any): void {
    if (!obj.vertices || obj.vertices.length < 2) return
    
    const startVertex = obj.vertices[0]
    const endVertex = obj.vertices[1]
    
    const x = (Math.min(startVertex.x, endVertex.x) - samplingPos.x) * zoomFactor
    const y = (Math.min(startVertex.y, endVertex.y) - samplingPos.y) * zoomFactor
    const width = Math.abs(endVertex.x - startVertex.x) * zoomFactor
    const height = Math.abs(endVertex.y - startVertex.y) * zoomFactor

    graphics.rect(x, y, width, height)

    if (style.fillColor !== undefined) {
      graphics.fill({
        color: style.fillColor,
        alpha: style.fillAlpha
      })
    }

    graphics.stroke({
      width: style.strokeWidth * zoomFactor,
      color: style.color,
      alpha: style.strokeAlpha
    })
  }

  /**
   * Render a diamond shape for Phase 3B
   */
  private renderDiamond3B(obj: GeometricObject, graphics: Graphics, samplingPos: any, zoomFactor: number, style: any): void {
    if (!obj.vertices || obj.vertices.length < 4) return
    
    // Diamond vertices should be in order: west, north, east, south
    const vertices = obj.vertices.map(vertex => ({
      x: (vertex.x - samplingPos.x) * zoomFactor,
      y: (vertex.y - samplingPos.y) * zoomFactor
    }))
    
    graphics.moveTo(vertices[0].x, vertices[0].y)  // west
    graphics.lineTo(vertices[1].x, vertices[1].y)  // north
    graphics.lineTo(vertices[2].x, vertices[2].y)  // east
    graphics.lineTo(vertices[3].x, vertices[3].y)  // south
    graphics.lineTo(vertices[0].x, vertices[0].y)  // back to west

    if (style.fillColor !== undefined) {
      graphics.fill({
        color: style.fillColor,
        alpha: style.fillAlpha
      })
    }

    graphics.stroke({
      width: style.strokeWidth * zoomFactor,
      color: style.color,
      alpha: style.strokeAlpha
    })
  }

  /**
   * Render preview for active drawing operations for Phase 3B
   */
  private renderPreviewDirectly(): void {
    this.previewGraphics.clear()
    
    const preview = gameStore_3b.drawing.preview.object
    if (!preview) return

    const samplingPos = gameStore_3b.navigation.offset
    const zoomFactor = 1  // Fixed for Phase 3B
    
    // Convert preview vertices to screen coordinates
    const renderVertices = preview.vertices.map(vertex => {
      const relativeX = (vertex.x - samplingPos.x) * zoomFactor
      const relativeY = (vertex.y - samplingPos.y) * zoomFactor
      return { x: relativeX, y: relativeY }
    })

    const previewAlpha = 0.6
    const style = preview.style

    // Render based on geometry type
    switch (preview.type) {
      case 'point':
        if (renderVertices[0]) {
          this.previewGraphics.circle(renderVertices[0].x, renderVertices[0].y, 2)
          this.previewGraphics.fill({
            color: style.color,
            alpha: previewAlpha * style.strokeAlpha
          })
        }
        break
        
      case 'line':
        if (renderVertices[0] && renderVertices[1]) {
          this.previewGraphics.moveTo(renderVertices[0].x, renderVertices[0].y)
          this.previewGraphics.lineTo(renderVertices[1].x, renderVertices[1].y)
          this.previewGraphics.stroke({
            width: style.strokeWidth * zoomFactor,
            color: style.color,
            alpha: previewAlpha * style.strokeAlpha
          })
        }
        break
        
      case 'circle':
        if (renderVertices[0] && renderVertices[1]) {
          const centerX = renderVertices[0].x
          const centerY = renderVertices[0].y
          const radius = Math.sqrt(
            Math.pow(renderVertices[1].x - centerX, 2) + 
            Math.pow(renderVertices[1].y - centerY, 2)
          )
          
          if (radius > 0) {
            this.previewGraphics.circle(centerX, centerY, radius)
            
            if (style.fillColor !== undefined) {
              this.previewGraphics.fill({
                color: style.fillColor,
                alpha: previewAlpha * (style.fillAlpha ?? 0.5)
              })
            }
            
            this.previewGraphics.stroke({
              width: style.strokeWidth * zoomFactor,
              color: style.color,
              alpha: previewAlpha * style.strokeAlpha
            })
          }
        }
        break
        
      case 'rectangle':
        if (renderVertices.length >= 2) {
          const x = Math.min(renderVertices[0].x, renderVertices[1].x)
          const y = Math.min(renderVertices[0].y, renderVertices[1].y)
          const width = Math.abs(renderVertices[1].x - renderVertices[0].x)
          const height = Math.abs(renderVertices[1].y - renderVertices[0].y)
          
          if (width >= 1 && height >= 1) {
            this.previewGraphics.rect(x, y, width, height)
            
            if (style.fillColor !== undefined) {
              this.previewGraphics.fill({
                color: style.fillColor,
                alpha: previewAlpha * (style.fillAlpha ?? 0.5)
              })
            }
            
            this.previewGraphics.stroke({
              width: style.strokeWidth * zoomFactor,
              color: style.color,
              alpha: previewAlpha * style.strokeAlpha
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
          
          if (style.fillColor !== undefined) {
            this.previewGraphics.fill({
              color: style.fillColor,
              alpha: previewAlpha * (style.fillAlpha ?? 0.5)
            })
          }
          
          this.previewGraphics.stroke({
            width: style.strokeWidth * zoomFactor,
            color: style.color,
            alpha: previewAlpha * style.strokeAlpha
          })
        }
        break
    }
  }

  /**
   * Get the main container for adding to layer
   */
  public getContainer(): Container {
    return this.mainContainer
  }

  /**
   * Get specific object container for external access
   */
  public getObjectContainer(objectId: string): Container | undefined {
    return this.objectContainers.get(objectId)
  }

  /**
   * Get specific object graphics for direct access
   */
  public getObjectGraphics(objectId: string): Graphics | undefined {
    return this.objectGraphics.get(objectId)
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
    this.objectGraphics.clear()
    
    // Destroy preview graphics
    this.previewGraphics.destroy()
    
    // Destroy main container
    this.mainContainer.destroy()
  }
}