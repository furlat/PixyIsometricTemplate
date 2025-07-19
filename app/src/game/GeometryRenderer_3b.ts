import { Graphics, Container } from 'pixi.js'
import { gameStore_3b, gameStore_3b_methods } from '../store/gameStore_3b'
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
  
  // Performance statistics
  private renderStats = {
    renderCount: 0,
    lastStatsTime: Date.now(),
    totalRenderTime: 0,
    objectsRendered: 0,
    lastObjectCount: 0
  }
  
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
    const startTime = Date.now()
    
    // For Phase 3B, we use fixed zoom factor 1 and no ECS sampling yet
    const zoomFactor = 1
    const samplingPos = gameStore_3b.navigation.offset

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
      }
    }

    // Render objects at fixed scale 1 (Phase 3B foundation)
    for (const obj of visibleObjects) {
      // ✅ NEW: Use store method to get object for rendering (drag OR edit preview)
      const renderObj = gameStore_3b_methods.getObjectForRender(obj.id) || obj
      this.renderObjectDirectly(renderObj)
    }

    // Always render preview for active drawing
    this.renderPreviewDirectly()
    
    // Update statistics
    this.updateRenderStats(startTime, visibleObjects.length)
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
   * ✅ EXTENDED: Now handles selection when drawing mode is 'none'
   */
  public handleDrawingInput(eventType: 'down' | 'up' | 'move', pixeloidCoord: PixeloidCoordinate, event: any): void {
    const drawingMode = gameStore_3b.drawing.mode
    
    // ✅ NEW: Use state machine for all interactions
    if (drawingMode === 'none') {
      this.handleSelectionInput(eventType, pixeloidCoord, event)
      return
    }
    
    // ✅ NEW: Check for interactions even during drawing mode
    if (eventType === 'down') {
      const clickedObjectId = this.getObjectAtPosition(pixeloidCoord)
      
      if (clickedObjectId) {
        // Use state machine to handle clicks
        const action = gameStore_3b_methods.handleMouseDown(pixeloidCoord)
        
        // Check if this should exit drawing mode
        if (gameStore_3b.interaction.clickCount === 2) {
          // Double-click exits drawing mode and selects object
          console.log('GeometryRenderer_3b: Double-click on object', clickedObjectId, '- exiting drawing mode')
          
          gameStore_3b_methods.setDrawingMode('none')
          if (gameStore_3b.drawing.isDrawing) {
            gameStore_3b_methods.cancelDrawing()
          }
          gameStore_3b_methods.selectObject(clickedObjectId)
          return
        }
      } else {
        // Click on empty space - continue with drawing
        gameStore_3b_methods.handleMouseDown(pixeloidCoord)
      }
    }
    
    // Continue with normal drawing logic
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
    
    // Handle mouse up
    if (eventType === 'up') {
      gameStore_3b_methods.handleMouseUp(pixeloidCoord)
    }
  }
  
  /**
   * ✅ NEW: Handle selection input events using state machine
   */
  private handleSelectionInput(eventType: 'down' | 'up' | 'move', pixeloidCoord: PixeloidCoordinate, event: any): void {
    if (eventType === 'down') {
      // Use state machine for mouse down
      gameStore_3b_methods.handleMouseDown(pixeloidCoord)
      
      // Check if we're clicking on an object
      const clickedObjectId = this.getObjectAtPosition(pixeloidCoord)
      
      if (clickedObjectId) {
        // Store the clicked object for potential actions
        gameStore_3b_methods.selectObject(clickedObjectId)
        console.log('GeometryRenderer_3b: Object clicked', clickedObjectId)
      } else {
        // Click on empty space: Clear selection
        console.log('GeometryRenderer_3b: Clicked empty space, clearing selection')
        gameStore_3b_methods.clearSelectionEnhanced()
      }
      
    } else if (eventType === 'move') {
      // Use state machine for mouse move
      const action = gameStore_3b_methods.handleMouseMove(pixeloidCoord)
      
      if (action === 'double-click-drag' || action === 'single-click-drag') {
        // Start dragging if not already dragging
        const selectedObjectId = gameStore_3b.selection.selectedObjectId
        if (selectedObjectId && !gameStore_3b.dragging.isDragging) {
          // ✅ FIXED: Use original click position, not current mouse position
          const originalClickPosition = gameStore_3b.interaction.lastMovePosition
          if (originalClickPosition) {
            console.log('GeometryRenderer_3b: Starting drag for', selectedObjectId, 'from original click at', originalClickPosition)
            gameStore_3b_methods.startDragging(selectedObjectId, originalClickPosition)
          }
        }
      }
      
      // Update dragging if active
      if (gameStore_3b.dragging.isDragging) {
        gameStore_3b_methods.updateDragging(pixeloidCoord)
      }
      
    } else if (eventType === 'up') {
      // Use state machine for mouse up
      const action = gameStore_3b_methods.handleMouseUp(pixeloidCoord)
      
      // Stop dragging if active
      if (gameStore_3b.dragging.isDragging) {
        gameStore_3b_methods.stopDragging(pixeloidCoord)
        console.log('GeometryRenderer_3b: Stopped dragging at', pixeloidCoord)
      }
      
      // Handle specific actions
      if (action === 'double-click-select') {
        // Double-click-release: Open edit panel (placeholder)
        const selectedObjectId = gameStore_3b.selection.selectedObjectId
        if (selectedObjectId) {
          console.log('GeometryRenderer_3b: Double-click-release on object', selectedObjectId)
          // TODO: Open ObjectEditPanel when implemented
        }
      }
    }
    
    // Handle right-click for context menu
    if (event && event.button === 2) {
      event.preventDefault()
      const clickedObjectId = this.getObjectAtPosition(pixeloidCoord)
      if (clickedObjectId) {
        console.log('GeometryRenderer_3b: Right-click on object', clickedObjectId, '- opening edit panel')
        gameStore_3b_methods.selectObject(clickedObjectId)
        // TODO: Open ObjectEditPanel when implemented
      }
    }
  }
  
  /**
   * ✅ NEW: Get object at specific position using hit testing
   */
  private getObjectAtPosition(pixeloidCoord: PixeloidCoordinate): string | null {
    // Test objects from top to bottom (last drawn first)
    for (let i = gameStore_3b.geometry.objects.length - 1; i >= 0; i--) {
      const obj = gameStore_3b.geometry.objects[i]
      if (obj.isVisible !== false && this.hitTestObject(obj, pixeloidCoord)) {
        return obj.id
      }
    }
    return null
  }
  
  /**
   * ✅ NEW: Hit test object using modular approach for each shape type
   */
  private hitTestObject(obj: GeometricObject, pixeloidPos: PixeloidCoordinate): boolean {
    switch (obj.type) {
      case 'point':
        return this.isPointInsidePoint(pixeloidPos, obj.vertices[0])
        
      case 'line':
        return this.isPointInsideLine(pixeloidPos, obj.vertices[0], obj.vertices[1], obj.style.strokeWidth)
        
      case 'circle':
        return this.isPointInsideCircle(pixeloidPos, obj.vertices[0], obj.vertices[1])
        
      case 'rectangle':
        return this.isPointInsideRectangle(pixeloidPos, obj.vertices[0], obj.vertices[1])
               
      case 'diamond':
        return this.isPointInsideDiamond(pixeloidPos, obj.vertices)
        
      default:
        return false
    }
  }

  /**
   * ✅ NEW: Individual hit testing methods for each shape type
   */
  private isPointInsidePoint(clickPos: PixeloidCoordinate, pointPos: PixeloidCoordinate): boolean {
    const dx = Math.abs(clickPos.x - pointPos.x)
    const dy = Math.abs(clickPos.y - pointPos.y)
    return dx <= 2 && dy <= 2 // 4x4 pixeloid selection area
  }

  private isPointInsideLine(clickPos: PixeloidCoordinate, startPos: PixeloidCoordinate, endPos: PixeloidCoordinate, strokeWidth: number): boolean {
    const tolerance = Math.max(strokeWidth * 0.5, 2)
    return this.isPointNearLine(clickPos, startPos, endPos, tolerance)
  }

  private isPointInsideCircle(clickPos: PixeloidCoordinate, centerPos: PixeloidCoordinate, radiusPos: PixeloidCoordinate): boolean {
    const radius = Math.sqrt(
      Math.pow(radiusPos.x - centerPos.x, 2) +
      Math.pow(radiusPos.y - centerPos.y, 2)
    )
    const distance = Math.sqrt(
      Math.pow(clickPos.x - centerPos.x, 2) +
      Math.pow(clickPos.y - centerPos.y, 2)
    )
    return distance <= radius
  }

  private isPointInsideRectangle(clickPos: PixeloidCoordinate, vertex1: PixeloidCoordinate, vertex2: PixeloidCoordinate): boolean {
    // ✅ FIXED: Direction-independent rectangle hit testing
    const minX = Math.min(vertex1.x, vertex2.x)
    const maxX = Math.max(vertex1.x, vertex2.x)
    const minY = Math.min(vertex1.y, vertex2.y)
    const maxY = Math.max(vertex1.y, vertex2.y)
    
    return clickPos.x >= minX && clickPos.x <= maxX &&
           clickPos.y >= minY && clickPos.y <= maxY
  }

  private isPointInsideDiamond(clickPos: PixeloidCoordinate, vertices: PixeloidCoordinate[]): boolean {
    // ✅ IMPROVED: Better diamond hit testing using point-in-polygon algorithm
    if (vertices.length < 4) return false
    
    // Use point-in-polygon algorithm for accurate diamond hit testing
    let inside = false
    let j = vertices.length - 1
    
    for (let i = 0; i < vertices.length; i++) {
      const xi = vertices[i].x
      const yi = vertices[i].y
      const xj = vertices[j].x
      const yj = vertices[j].y
      
      if (((yi > clickPos.y) !== (yj > clickPos.y)) &&
          (clickPos.x < (xj - xi) * (clickPos.y - yi) / (yj - yi) + xi)) {
        inside = !inside
      }
      j = i
    }
    
    return inside
  }

  /**
   * ✅ NEW: Helper method for line hit testing
   */
  private isPointNearLine(point: PixeloidCoordinate, start: PixeloidCoordinate, end: PixeloidCoordinate, tolerance: number): boolean {
    const A = point.x - start.x
    const B = point.y - start.y
    const C = end.x - start.x
    const D = end.y - start.y
    
    const dot = A * C + B * D
    const lenSq = C * C + D * D
    
    if (lenSq === 0) {
      const dx = point.x - start.x
      const dy = point.y - start.y
      return Math.sqrt(dx * dx + dy * dy) <= tolerance
    }
    
    let param = dot / lenSq
    
    let xx, yy
    if (param < 0) {
      xx = start.x
      yy = start.y
    } else if (param > 1) {
      xx = end.x
      yy = end.y
    } else {
      xx = start.x + param * C
      yy = start.y + param * D
    }
    
    const dx = point.x - xx
    const dy = point.y - yy
    return Math.sqrt(dx * dx + dy * dy) <= tolerance
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
    
    // Use obj.style directly - no fallbacks
    const style = obj.style
    
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

    const previewAlpha = gameStore_3b.drawing.settings.previewOpacity
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
          
          if (width >= 0 && height >= 0) {  // Allow 0 width/height for preview
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
   * Update render statistics and log every 15 seconds
   */
  private updateRenderStats(startTime: number, objectCount: number): void {
    const renderTime = Date.now() - startTime
    
    this.renderStats.renderCount++
    this.renderStats.totalRenderTime += renderTime
    this.renderStats.objectsRendered += objectCount
    this.renderStats.lastObjectCount = objectCount
    
    // Log statistics every 15 seconds
    const now = Date.now()
    if (now - this.renderStats.lastStatsTime >= 15000) {
      const avgRenderTime = this.renderStats.totalRenderTime / this.renderStats.renderCount
      const renderRate = this.renderStats.renderCount / 15 // renders per second
      
      console.log('📊 GeometryRenderer_3b Stats (15s):', {
        renders: this.renderStats.renderCount,
        avgRenderTime: avgRenderTime.toFixed(2) + 'ms',
        renderRate: renderRate.toFixed(1) + '/s',
        objects: this.renderStats.lastObjectCount,
        totalObjects: this.renderStats.objectsRendered
      })
      
      // Reset stats
      this.renderStats.renderCount = 0
      this.renderStats.totalRenderTime = 0
      this.renderStats.objectsRendered = 0
      this.renderStats.lastStatsTime = now
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