import { updateGameStore, gameStore, createPixeloidCoordinate } from '../store/gameStore'
import { GeometryHelper } from './GeometryHelper'
import { GeometryVertexCalculator } from './GeometryVertexCalculator'
import { CoordinateHelper } from './CoordinateHelper'
import type { InfiniteCanvas } from './InfiniteCanvas'
import type { GeometricRectangle, GeometricPoint, GeometricLine, GeometricCircle, GeometricDiamond, PixeloidCoordinate } from '../types'

export class InputManager {
  private canvas: HTMLCanvasElement | null = null
  private infiniteCanvas: InfiniteCanvas | null = null
  
  // Double-click detection
  private lastClickTime: number = 0
  private doubleClickThreshold: number = 300 // ms
  
  // Object dragging state
  private isDragging: boolean = false
  private dragStartPosition: { x: number, y: number } | null = null
  private dragObjectId: string | null = null
  private dragObjectOriginalPosition: { x: number, y: number } | null = null
  private dragObjectOriginalEnd: { x: number, y: number } | null = null
  
  // Store bound handlers for cleanup
  private keydownHandler: (event: KeyboardEvent) => void = () => {}
  private keyupHandler: (event: KeyboardEvent) => void = () => {}
  private contextMenuHandler: (event: Event) => void = () => {}
  
  // Track last key states for pixeloid-perfect movement
  private lastKeys = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false
  }

  /**
   * Initialize input management - MESH EVENT SYSTEM ONLY
   */
  public init(canvas: HTMLCanvasElement, infiniteCanvas: InfiniteCanvas): void {
    this.canvas = canvas
    this.infiniteCanvas = infiniteCanvas
    this.setupEventListeners()
    
    // Set global reference for BackgroundGridRenderer to access
    ;(globalThis as any).inputManager = this
    
    console.log('InputManager: Initialized with MESH EVENT SYSTEM ONLY')
  }

  /**
   * Setup ONLY keyboard and context menu event listeners
   * All mouse/pointer events are handled by the mesh in BackgroundGridRenderer
   */
  private setupEventListeners(): void {
    if (!this.canvas) return

    // Bind handlers - NO MOUSE EVENTS
    this.keydownHandler = this.handleKeyDown.bind(this)
    this.keyupHandler = this.handleKeyUp.bind(this)
    this.contextMenuHandler = (e) => e.preventDefault()

    // Add ONLY keyboard and context menu listeners
    document.addEventListener('keydown', this.keydownHandler)
    document.addEventListener('keyup', this.keyupHandler)
    this.canvas.addEventListener('contextmenu', this.contextMenuHandler)
    
    // Focus canvas to receive keyboard events
    this.canvas.tabIndex = 0
    this.canvas.focus()
    
    console.log('InputManager: Setup keyboard events only - mouse events handled by mesh')
  }

  /**
   * Handle keyboard key press
   * ✅ CLEANED: WASD movement now handled by InfiniteCanvas offset system
   */
  private handleKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase()
    
    switch (key) {
      case 'w':
        updateGameStore.setKeyState('w', true)
        event.preventDefault()
        break
      case 'a':
        updateGameStore.setKeyState('a', true)
        event.preventDefault()
        break
      case 's':
        updateGameStore.setKeyState('s', true)
        event.preventDefault()
        break
      case 'd':
        updateGameStore.setKeyState('d', true)
        event.preventDefault()
        break
      case ' ':
        updateGameStore.setKeyState('space', true)
        event.preventDefault()
        break
      case 'delete':
        // Delete selected object
        if (gameStore.geometry.selection.selectedObjectId) {
          updateGameStore.removeGeometricObject(gameStore.geometry.selection.selectedObjectId)
          updateGameStore.clearSelection()
          event.preventDefault()
        }
        break
      case 'c':
        // Copy selected object
        if (gameStore.geometry.selection.selectedObjectId) {
          const success = updateGameStore.copySelectedObject()
          if (success) {
            console.log('InputManager: Copied selected object')
          }
          event.preventDefault()
        }
        break
      case 'v':
        // Paste object at mouse position
        if (gameStore.geometry.clipboard.copiedObject) {
          const mousePos = gameStore.mouse.pixeloid_position
          const newObject = updateGameStore.pasteObjectAtPosition(mousePos.x, mousePos.y)
          if (newObject) {
            console.log(`InputManager: Pasted object at (${mousePos.x.toFixed(1)}, ${mousePos.y.toFixed(1)})`)
          }
          event.preventDefault()
        }
        break
    }
  }

  /**
   * Handle keyboard key release
   * ✅ CLEANED: WASD movement now handled by InfiniteCanvas offset system
   */
  private handleKeyUp(event: KeyboardEvent): void {
    const key = event.key.toLowerCase()
    
    switch (key) {
      case 'w':
        updateGameStore.setKeyState('w', false)
        break
      case 'a':
        updateGameStore.setKeyState('a', false)
        break
      case 's':
        updateGameStore.setKeyState('s', false)
        break
      case 'd':
        updateGameStore.setKeyState('d', false)
        break
      case ' ':
        updateGameStore.setKeyState('space', false)
        break
    }
  }

  /**
   * Handle mesh events from BackgroundGridRenderer - REPLACES ALL MOUSE EVENT HANDLING
   */
  public handleMeshEvent(
    eventType: 'move' | 'down' | 'up',
    vertexX: number,
    vertexY: number,
    pixeloidPos: { x: number, y: number },
    originalEvent: any
  ): void {
    console.log(`InputManager: Mesh event ${eventType} at Vertex(${vertexX}, ${vertexY}) → Pixeloid(${pixeloidPos.x.toFixed(2)}, ${pixeloidPos.y.toFixed(2)})`)
    
    if (eventType === 'move') {
      // Handle preview during drawing or object dragging
      if (this.isDragging) {
        this.handleObjectDragging(pixeloidPos)
      } else {
        this.handleGeometryMouseMove(pixeloidPos)
      }
    } else if (eventType === 'down') {
      // Only handle left mouse button
      if (originalEvent.button !== 0) return
      this.handleGeometryMouseDown(pixeloidPos)
    } else if (eventType === 'up') {
      // Only handle left mouse button
      if (originalEvent.button !== 0) return
      
      // Stop object dragging if active
      if (this.isDragging) {
        this.stopObjectDragging()
        return
      }
      
      // Handle geometry drawing
      this.handleGeometryMouseUp(pixeloidPos)
    }
  }

  /**
   * Handle mesh wheel events from BackgroundGridRenderer
   */
  public handleMeshWheelEvent(vertexX: number, vertexY: number, wheelEvent: any): void {
    if (!this.infiniteCanvas) return
    
    wheelEvent.preventDefault()
    
    // Use the vertex coordinates for zoom-to-center functionality
    // Convert back to screen coordinates for the InfiniteCanvas zoom method
    const activeMesh = gameStore.staticMesh.activeMesh
    if (!activeMesh) return
    
    const { level } = activeMesh.resolution
    const screenX = vertexX * level
    const screenY = vertexY * level
    
    // Handle zoom with vertex position for zoom-to-center functionality
    this.infiniteCanvas.handleZoom(wheelEvent.deltaY, screenX, screenY)
    
    console.log(`InputManager: Mesh wheel event at Vertex(${vertexX}, ${vertexY}) → Screen(${screenX}, ${screenY})`)
  }

  /**
   * Handle geometry drawing on mouse down - NEW: preserve exact user input
   */
  private handleGeometryMouseDown(pixeloidPos: { x: number, y: number }): void {
    const mode = gameStore.geometry.drawing.mode
    
    // If not in drawing mode, check for object selection
    if (mode === 'none') {
      this.handleObjectSelection(pixeloidPos)
      return
    }
    
    // EXACT user input preservation - NO MODIFICATION
    const firstPixeloidPos = createPixeloidCoordinate(pixeloidPos.x, pixeloidPos.y)
    
    // Get anchor configuration from store (supports per-object overrides)
    const anchorConfig = GeometryVertexCalculator.getAnchorConfig(mode)
    
    if (mode === 'point') {
      // Points: create immediately using new vertex calculation
      this.createPointWithVertices(firstPixeloidPos, anchorConfig)
    } else {
      // Multi-step shapes: store exact input for drag completion
      gameStore.geometry.drawing.activeDrawing.type = mode
      gameStore.geometry.drawing.activeDrawing.firstPixeloidPos = firstPixeloidPos
      gameStore.geometry.drawing.activeDrawing.anchorConfig = anchorConfig
      gameStore.geometry.drawing.activeDrawing.isDrawing = true
    }
  }

  /**
   * Handle geometry drawing on mouse up - NEW: use vertex calculation
   */
  private handleGeometryMouseUp(pixeloidPos: { x: number, y: number }): void {
    const activeDrawing = gameStore.geometry.drawing.activeDrawing
    
    if (activeDrawing.isDrawing && activeDrawing.firstPixeloidPos && activeDrawing.anchorConfig && activeDrawing.type) {
      // EXACT user input preservation - NO MODIFICATION
      const secondPixeloidPos = createPixeloidCoordinate(pixeloidPos.x, pixeloidPos.y)
      
      // Use vertex calculation for all geometry types
      this.createGeometryWithVertices(
        activeDrawing.firstPixeloidPos,
        secondPixeloidPos,
        activeDrawing.type,
        activeDrawing.anchorConfig
      )
      
      // Clear active drawing
      this.clearActiveDrawing()
    }
  }

  /**
   * Create a point immediately using new vertex calculation
   */
  private createPointWithVertices(pixeloidPos: PixeloidCoordinate, anchorConfig: any): void {
    // Calculate vertices and create through store
    const vertices = GeometryVertexCalculator.calculateGeometryVertices(
      pixeloidPos,
      pixeloidPos, // Same position for point
      'point',
      anchorConfig
    )
    
    // Extract legacy properties for compatibility
    const properties = GeometryVertexCalculator.extractGeometryProperties(vertices, 'point')
    updateGameStore.createPoint(properties.x, properties.y)
  }

  /**
   * Create any geometry type using vertex calculation
   */
  private createGeometryWithVertices(
    firstPos: PixeloidCoordinate,
    secondPos: PixeloidCoordinate,
    geometryType: 'point' | 'line' | 'circle' | 'rectangle' | 'diamond',
    anchorConfig: any
  ): void {
    // Calculate vertices using new system
    const vertices = GeometryVertexCalculator.calculateGeometryVertices(
      firstPos,
      secondPos,
      geometryType,
      anchorConfig
    )
    
    // Extract legacy properties for compatibility with existing store methods
    const properties = GeometryVertexCalculator.extractGeometryProperties(vertices, geometryType)
    
    // Create using existing store methods (will be updated later)
    switch (geometryType) {
      case 'line':
        updateGameStore.createLine(properties.startX, properties.startY, properties.endX, properties.endY)
        break
      case 'circle':
        updateGameStore.createCircle(properties.centerX, properties.centerY, properties.radius)
        break
      case 'rectangle':
        updateGameStore.createRectangle(properties.x, properties.y, properties.width, properties.height)
        break
      case 'diamond':
        updateGameStore.createDiamond(properties.anchorX, properties.anchorY, properties.width, properties.height)
        break
    }
  }

  /**
   * Clear active drawing state
   */
  private clearActiveDrawing(): void {
    gameStore.geometry.drawing.activeDrawing.type = null
    gameStore.geometry.drawing.activeDrawing.firstPixeloidPos = null
    gameStore.geometry.drawing.activeDrawing.currentPixeloidPos = null
    gameStore.geometry.drawing.activeDrawing.anchorConfig = null
    gameStore.geometry.drawing.activeDrawing.isDrawing = false
    gameStore.geometry.drawing.preview = null
  }

  /**
   * Handle geometry drawing during mouse move - NEW: unified preview/creation logic
   */
  private handleGeometryMouseMove(pixeloidPos: { x: number, y: number }): void {
    const activeDrawing = gameStore.geometry.drawing.activeDrawing
    
    if (activeDrawing.isDrawing && activeDrawing.firstPixeloidPos && activeDrawing.anchorConfig && activeDrawing.type) {
      // EXACT user input preservation - NO MODIFICATION
      const currentPixeloidPos = createPixeloidCoordinate(pixeloidPos.x, pixeloidPos.y)
      
      // Update current position for tracking
      gameStore.geometry.drawing.activeDrawing.currentPixeloidPos = currentPixeloidPos
      
      // Use SAME vertex calculation as final creation for preview
      const previewVertices = GeometryVertexCalculator.calculateGeometryVertices(
        activeDrawing.firstPixeloidPos,
        currentPixeloidPos,
        activeDrawing.type,
        activeDrawing.anchorConfig
      )
      
      // Create preview state using new architecture
      gameStore.geometry.drawing.preview = {
        vertices: previewVertices,
        type: activeDrawing.type,
        style: {
          color: gameStore.geometry.drawing.settings.defaultColor,
          strokeWidth: gameStore.geometry.drawing.settings.defaultStrokeWidth,
          strokeAlpha: gameStore.geometry.drawing.settings.strokeAlpha,
          ...(gameStore.geometry.drawing.settings.fillEnabled && {
            fillColor: gameStore.geometry.drawing.settings.defaultFillColor,
            fillAlpha: gameStore.geometry.drawing.settings.fillAlpha
          })
        },
        isPreview: true
      }
    }
  }


  /**
   * Create a rectangle from start and end points using unified anchoring
   */
  private createRectangle(startPoint: { x: number, y: number }, endPoint: { x: number, y: number }): void {
    // Calculate rectangle size
    const width = Math.abs(endPoint.x - startPoint.x)
    const height = Math.abs(endPoint.y - startPoint.y)
    
    // Only create rectangle if it has some size (minimum 1 pixeloid)
    if (width >= 1 && height >= 1) {
      updateGameStore.createRectangleWithAnchor(
        createPixeloidCoordinate(startPoint.x, startPoint.y),
        createPixeloidCoordinate(endPoint.x, endPoint.y)
      )
    }
  }

  /**
   * Create a line from start and end points using unified anchoring
   */
  private createLine(startPoint: { x: number, y: number }, endPoint: { x: number, y: number }): void {
    // Only create line if it has some length (minimum 1 pixeloid distance)
    const distance = Math.sqrt(Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2))
    if (distance >= 1) {
      updateGameStore.createLineWithAnchor(
        createPixeloidCoordinate(startPoint.x, startPoint.y),
        createPixeloidCoordinate(endPoint.x, endPoint.y)
      )
    }
  }

  /**
   * Create a circle using unified anchoring (ISOMETRIC: radius from width)
   */
  private createCircle(startPoint: { x: number, y: number }, dragPoint: { x: number, y: number }): void {
    // Calculate width for isometric circle
    const width = Math.abs(dragPoint.x - startPoint.x)
    
    // Only create circle if it has some size (minimum 1 pixeloid width)
    if (width >= 1) {
      updateGameStore.createCircleWithAnchor(
        createPixeloidCoordinate(startPoint.x, startPoint.y),
        createPixeloidCoordinate(dragPoint.x, dragPoint.y)
      )
    }
  }

  /**
   * Create an isometric diamond using unified anchoring (ISOMETRIC: height from width)
   */
  private createDiamond(startPoint: { x: number, y: number }, dragPoint: { x: number, y: number }): void {
    // Calculate width for isometric diamond
    const width = Math.abs(dragPoint.x - startPoint.x)
    
    // Only create diamond if it has some size (any width > 0)
    if (width > 0) {
      updateGameStore.createDiamondWithAnchor(
        createPixeloidCoordinate(startPoint.x, startPoint.y),
        createPixeloidCoordinate(dragPoint.x, dragPoint.y)
      )
    }
  }

  /**
   * Handle object selection when clicking in none mode
   */
  private handleObjectSelection(pixeloidPos: { x: number, y: number }): void {
    const currentTime = Date.now()
    const isDoubleClick = currentTime - this.lastClickTime < this.doubleClickThreshold
    this.lastClickTime = currentTime

    // Find the topmost object at the click position
    const clickedObjects = gameStore.geometry.objects.filter(obj => {
      if (!obj.isVisible) return false
      
      // Check based on object type
      if ('anchorX' in obj && 'anchorY' in obj) {
        // Diamond
        return GeometryHelper.isPointInsideDiamond(createPixeloidCoordinate(pixeloidPos.x, pixeloidPos.y), obj as any)
      } else if ('width' in obj && 'height' in obj) {
        // Rectangle
        const rect = obj as GeometricRectangle
        return pixeloidPos.x >= rect.x && pixeloidPos.x <= rect.x + rect.width &&
               pixeloidPos.y >= rect.y && pixeloidPos.y <= rect.y + rect.height
      } else if ('centerX' in obj && 'centerY' in obj && 'radius' in obj) {
        // Circle
        const circle = obj as GeometricCircle
        const dx = pixeloidPos.x - circle.centerX
        const dy = pixeloidPos.y - circle.centerY
        return (dx * dx + dy * dy) <= (circle.radius * circle.radius)
      } else if ('startX' in obj && 'startY' in obj && 'endX' in obj && 'endY' in obj) {
        // Line - check if point is near the line (within stroke width tolerance)
        const line = obj as GeometricLine
        const tolerance = Math.max(line.strokeWidth * 0.5, 2) // Minimum 2 pixeloid tolerance
        return this.isPointNearLine(pixeloidPos, line, tolerance)
      } else if ('x' in obj && 'y' in obj && !('width' in obj)) {
        // Point
        const point = obj as GeometricPoint
        const dx = Math.abs(pixeloidPos.x - point.x)
        const dy = Math.abs(pixeloidPos.y - point.y)
        return dx <= 2 && dy <= 2 // 4x4 pixeloid selection area
      }
      
      return false
    })
    
    if (clickedObjects.length > 0) {
      // Select the last (topmost) object
      const selectedObject = clickedObjects[clickedObjects.length - 1]
      const wasAlreadySelected = gameStore.geometry.selection.selectedObjectId === selectedObject.id
      
      updateGameStore.setSelectedObject(selectedObject.id)
      
      // If double-clicking on already selected object, open edit panel
      if (isDoubleClick && wasAlreadySelected) {
        updateGameStore.setEditPanelOpen(true)
      } else if (wasAlreadySelected) {
        // Start dragging if clicking on already selected object
        this.startObjectDragging(selectedObject.id, pixeloidPos)
      }
    } else {
      // Clear selection if clicking on empty space
      updateGameStore.clearSelection()
    }
  }

  /**
   * Start dragging an object
   */
  private startObjectDragging(objectId: string, startPos: { x: number, y: number }): void {
    const obj = gameStore.geometry.objects.find(o => o.id === objectId)
    if (!obj) return

    this.isDragging = true
    this.dragObjectId = objectId
    this.dragStartPosition = { ...startPos }

    // Store original position based on object type
    if ('anchorX' in obj && 'anchorY' in obj) {
      const diamond = obj as GeometricDiamond
      this.dragObjectOriginalPosition = { x: diamond.anchorX, y: diamond.anchorY }
    } else if ('centerX' in obj && 'centerY' in obj) {
      const circle = obj as GeometricCircle
      this.dragObjectOriginalPosition = { x: circle.centerX, y: circle.centerY }
    } else if ('x' in obj && 'y' in obj && 'width' in obj && 'height' in obj) {
      const rect = obj as GeometricRectangle
      this.dragObjectOriginalPosition = { x: rect.x, y: rect.y }
    } else if ('startX' in obj && 'startY' in obj && 'endX' in obj && 'endY' in obj) {
      const line = obj as GeometricLine
      this.dragObjectOriginalPosition = { x: line.startX, y: line.startY }
      this.dragObjectOriginalEnd = { x: line.endX, y: line.endY }
    } else if ('x' in obj && 'y' in obj) {
      const point = obj as GeometricPoint
      this.dragObjectOriginalPosition = { x: point.x, y: point.y }
    }

    console.log(`Started dragging object ${objectId}`)
  }

  /**
   * Handle object dragging during mouse move - FIXED: Use store updates for bbox mesh reactivity
   */
  private handleObjectDragging(pixeloidPos: { x: number, y: number }): void {
    if (!this.isDragging || !this.dragObjectId || !this.dragStartPosition || !this.dragObjectOriginalPosition) {
      return
    }

    const obj = gameStore.geometry.objects.find(o => o.id === this.dragObjectId)
    if (!obj) {
      this.stopObjectDragging()
      return
    }

    // Calculate drag offset
    const deltaX = pixeloidPos.x - this.dragStartPosition.x
    const deltaY = pixeloidPos.y - this.dragStartPosition.y

    // Calculate new position with snapping to pixeloid centers
    const rawNewX = this.dragObjectOriginalPosition.x + deltaX
    const rawNewY = this.dragObjectOriginalPosition.y + deltaY
    
    // Snap to pixeloid anchor points (top-left)
    const anchorPoints = GeometryHelper.calculatePixeloidAnchorPoints(rawNewX, rawNewY)
    const snappedPos = anchorPoints.topLeft

    // ✅ FIXED: Use store updates instead of direct modification to trigger bbox mesh reactivity
    if ('anchorX' in obj && 'anchorY' in obj) {
      // Diamond object
      updateGameStore.updateGeometricObject(this.dragObjectId, {
        anchorX: snappedPos.x,
        anchorY: snappedPos.y
      })
    } else if ('centerX' in obj && 'centerY' in obj) {
      // Circle object
      updateGameStore.updateGeometricObject(this.dragObjectId, {
        centerX: snappedPos.x,
        centerY: snappedPos.y
      })
    } else if ('x' in obj && 'y' in obj && 'width' in obj && 'height' in obj) {
      // Rectangle object
      updateGameStore.updateGeometricObject(this.dragObjectId, {
        x: snappedPos.x,
        y: snappedPos.y
      })
    } else if ('startX' in obj && 'startY' in obj && 'endX' in obj && 'endY' in obj) {
      // Line object - move both endpoints
      if (this.dragObjectOriginalEnd) {
        const deltaSnappedX = snappedPos.x - this.dragObjectOriginalPosition.x
        const deltaSnappedY = snappedPos.y - this.dragObjectOriginalPosition.y
        updateGameStore.updateGeometricObject(this.dragObjectId, {
          startX: this.dragObjectOriginalPosition.x + deltaSnappedX,
          startY: this.dragObjectOriginalPosition.y + deltaSnappedY,
          endX: this.dragObjectOriginalEnd.x + deltaSnappedX,
          endY: this.dragObjectOriginalEnd.y + deltaSnappedY
        })
      }
    } else if ('x' in obj && 'y' in obj) {
      // Point object
      updateGameStore.updateGeometricObject(this.dragObjectId, {
        x: snappedPos.x,
        y: snappedPos.y
      })
    }
    
    console.log(`🎯 InputManager: Updated object ${this.dragObjectId} via store, triggering bbox mesh reactivity`)
  }

  /**
   * Stop object dragging
   */
  private stopObjectDragging(): void {
    if (this.isDragging && this.dragObjectId) {
      console.log(`Stopped dragging object ${this.dragObjectId}`)
    }

    this.isDragging = false
    this.dragObjectId = null
    this.dragStartPosition = null
    this.dragObjectOriginalPosition = null
    this.dragObjectOriginalEnd = null
  }

  /**
   * Check if a point is near a line within tolerance
   */
  private isPointNearLine(point: { x: number, y: number }, line: GeometricLine, tolerance: number): boolean {
    const { startX, startY, endX, endY } = line
    
    // Calculate the distance from point to line segment
    const A = point.x - startX
    const B = point.y - startY
    const C = endX - startX
    const D = endY - startY
    
    const dot = A * C + B * D
    const lenSq = C * C + D * D
    
    if (lenSq === 0) {
      // Line is a point
      const dx = point.x - startX
      const dy = point.y - startY
      return Math.sqrt(dx * dx + dy * dy) <= tolerance
    }
    
    let param = dot / lenSq
    
    let xx, yy
    if (param < 0) {
      xx = startX
      yy = startY
    } else if (param > 1) {
      xx = endX
      yy = endY
    } else {
      xx = startX + param * C
      yy = startY + param * D
    }
    
    const dx = point.x - xx
    const dy = point.y - yy
    return Math.sqrt(dx * dx + dy * dy) <= tolerance
  }

  /**
   * Clean up event listeners - MESH EVENT SYSTEM ONLY
   */
  public destroy(): void {
    // Remove keyboard and context menu event listeners only
    document.removeEventListener('keydown', this.keydownHandler)
    document.removeEventListener('keyup', this.keyupHandler)
    
    if (this.canvas) {
      this.canvas.removeEventListener('contextmenu', this.contextMenuHandler)
    }
    
    // Clear global reference
    ;(globalThis as any).inputManager = null
    
    this.canvas = null
    this.infiniteCanvas = null
    
    console.log('InputManager: Destroyed - mesh handles all mouse events')
  }

  /**
   * Update movement based on current key states - called from game loop
   * ✅ HYBRID: Smooth movement while held, snap to integer on release
   */
  public updateMovement(deltaTime: number): void {
    const keys = gameStore.input.keys
    const moveSpeed = 50 // pixeloids per second
    const baseDistance = moveSpeed * deltaTime
    
    // Calculate movement deltas for all pressed keys
    let deltaX = 0
    let deltaY = 0
    
    if (keys.w) deltaY -= baseDistance  // Move up = decrease offset Y
    if (keys.s) deltaY += baseDistance  // Move down = increase offset Y
    if (keys.a) deltaX -= baseDistance  // Move left = decrease offset X
    if (keys.d) deltaX += baseDistance  // Move right = increase offset X

    // Apply smooth movement if any keys are pressed
    if (deltaX !== 0 || deltaY !== 0) {
      const currentOffset = gameStore.mesh.vertex_to_pixeloid_offset
      const newOffset = createPixeloidCoordinate(
        currentOffset.x + deltaX,
        currentOffset.y + deltaY
      )
      
      console.log(`🎮 InputManager.updateMovement: About to update offset`, {
        currentOffset: { ...currentOffset },
        delta: { x: deltaX, y: deltaY },
        newOffset: { ...newOffset },
        keysPressed: { w: keys.w, a: keys.a, s: keys.s, d: keys.d },
        timestamp: Date.now()
      })
      
      updateGameStore.setVertexToPixeloidOffset(newOffset)
      
      console.log(`✅ InputManager.updateMovement: Offset update completed`)
    }
    
    // ✅ SNAP TO INTEGER: Check for key releases and snap to perfect pixeloid alignment
    const anyKeyReleased = (
      (this.lastKeys.w && !keys.w) ||
      (this.lastKeys.s && !keys.s) ||
      (this.lastKeys.a && !keys.a) ||
      (this.lastKeys.d && !keys.d)
    )
    
    const noMovementKeys = !keys.w && !keys.s && !keys.a && !keys.d
    
    if (anyKeyReleased && noMovementKeys) {
      // Snap to nearest integer pixeloid for perfect alignment
      const currentOffset = gameStore.mesh.vertex_to_pixeloid_offset
      const snappedOffset = createPixeloidCoordinate(
        Math.round(currentOffset.x),
        Math.round(currentOffset.y)
      )
      
      updateGameStore.setVertexToPixeloidOffset(snappedOffset)
      console.log(`WASD: Snapped to integer alignment (${snappedOffset.x}, ${snappedOffset.y})`)
    }

    // Update last key states for next frame
    this.lastKeys = { ...keys }

    // Handle space key for recentering
    if (keys.space) {
      const selectedObjectId = gameStore.geometry.selection.selectedObjectId
      
      if (selectedObjectId) {
        // Center selected object at screen center
        const selectedObject = gameStore.geometry.objects.find(obj => obj.id === selectedObjectId)
        if (selectedObject && selectedObject.metadata) {
          const screenCenterX = gameStore.windowWidth / 2 / gameStore.camera.pixeloid_scale
          const screenCenterY = gameStore.windowHeight / 2 / gameStore.camera.pixeloid_scale
          const targetOffset = createPixeloidCoordinate(
            selectedObject.metadata.center.x - screenCenterX,
            selectedObject.metadata.center.y - screenCenterY
          )
          updateGameStore.setVertexToPixeloidOffset(targetOffset)
          console.log(`InputManager: Centered object ${selectedObjectId} at screen center, offset: (${targetOffset.x.toFixed(1)}, ${targetOffset.y.toFixed(1)})`)
        }
      } else {
        // Reset offset to (0,0) - pixeloid (0,0) appears at screen (0,0)
        updateGameStore.setVertexToPixeloidOffset(createPixeloidCoordinate(0, 0))
        console.log(`InputManager: Reset offset to (0,0) - pixeloid (0,0) now at screen (0,0)`)
      }
      
      // Reset space key to prevent continuous recentering
      updateGameStore.setKeyState('space', false)
    }
  }
}