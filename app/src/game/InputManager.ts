import { updateGameStore, gameStore } from '../store/gameStore'
import { GeometryHelper } from './GeometryHelper'
import type { InfiniteCanvas } from './InfiniteCanvas'
import type { GeometricRectangle, GeometricPoint, GeometricLine, GeometricCircle, GeometricDiamond } from '../types'

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
  private mouseMoveHandler: (event: MouseEvent) => void = () => {}
  private mouseDownHandler: (event: MouseEvent) => void = () => {}
  private mouseUpHandler: (event: MouseEvent) => void = () => {}
  private wheelHandler: (event: WheelEvent) => void = () => {}
  private contextMenuHandler: (event: Event) => void = () => {}

  /**
   * Initialize input management
   */
  public init(canvas: HTMLCanvasElement, infiniteCanvas: InfiniteCanvas): void {
    this.canvas = canvas
    this.infiniteCanvas = infiniteCanvas
    this.setupEventListeners()
  }

  /**
   * Setup all input event listeners
   */
  private setupEventListeners(): void {
    if (!this.canvas) return

    // Bind handlers
    this.keydownHandler = this.handleKeyDown.bind(this)
    this.keyupHandler = this.handleKeyUp.bind(this)
    this.mouseMoveHandler = this.handleMouseMove.bind(this)
    this.mouseDownHandler = this.handleMouseDown.bind(this)
    this.mouseUpHandler = this.handleMouseUp.bind(this)
    this.wheelHandler = this.handleWheel.bind(this)
    this.contextMenuHandler = (e) => e.preventDefault()

    // Add listeners
    document.addEventListener('keydown', this.keydownHandler)
    document.addEventListener('keyup', this.keyupHandler)
    this.canvas.addEventListener('mousemove', this.mouseMoveHandler)
    this.canvas.addEventListener('mousedown', this.mouseDownHandler)
    this.canvas.addEventListener('mouseup', this.mouseUpHandler)
    this.canvas.addEventListener('wheel', this.wheelHandler)
    this.canvas.addEventListener('contextmenu', this.contextMenuHandler)
    
    // Focus canvas to receive keyboard events
    this.canvas.tabIndex = 0
    this.canvas.focus()
  }

  /**
   * Handle keyboard key press
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
      case 'backspace':
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
          const mousePos = gameStore.mousePixeloidPosition
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
   * Handle mouse movement (restored full functionality for mouse layer)
   */
  private handleMouseMove(event: MouseEvent): void {
    if (!this.canvas || !this.infiniteCanvas) return

    const rect = this.canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    // Update screen mouse position in store
    updateGameStore.updateMousePosition(x, y)
    
    // Convert to pixeloid coordinates
    const pixeloidPos = this.infiniteCanvas.screenToPixeloid(x, y)
    updateGameStore.updateMousePixeloidPosition(pixeloidPos.x, pixeloidPos.y)
    
    // Handle preview during drawing or object dragging
    if (this.isDragging) {
      this.handleObjectDragging(pixeloidPos)
    } else {
      this.handleGeometryMouseMove(pixeloidPos)
    }
  }

  /**
   * Handle mouse down - start drawing
   */
  private handleMouseDown(event: MouseEvent): void {
    if (!this.canvas || !this.infiniteCanvas) return

    // Only handle left mouse button
    if (event.button !== 0) return

    const rect = this.canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    // Convert to pixeloid coordinates (reuse existing logic)
    const pixeloidPos = this.infiniteCanvas.screenToPixeloid(x, y)
    
    // Handle geometry drawing
    this.handleGeometryMouseDown(pixeloidPos)
  }

  /**
   * Handle mouse up - finish drawing or stop dragging
   */
  private handleMouseUp(event: MouseEvent): void {
    if (!this.canvas || !this.infiniteCanvas) return

    // Only handle left mouse button
    if (event.button !== 0) return

    const rect = this.canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    // Convert to pixeloid coordinates (reuse existing logic)
    const pixeloidPos = this.infiniteCanvas.screenToPixeloid(x, y)
    
    // Stop object dragging if active
    if (this.isDragging) {
      this.stopObjectDragging()
      return
    }
    
    // Handle geometry drawing
    this.handleGeometryMouseUp(pixeloidPos)
  }

  /**
   * Handle geometry drawing on mouse down
   */
  private handleGeometryMouseDown(pixeloidPos: { x: number, y: number }): void {
    const mode = gameStore.geometry.drawing.mode
    
    // If not in drawing mode, check for object selection
    if (mode === 'none') {
      this.handleObjectSelection(pixeloidPos)
      return
    }
    
    // Different coordinate snapping for different shapes
    let pixelPerfectPos: { x: number, y: number }
    
    if (mode === 'rectangle') {
      // Rectangles: corner positioning (back to original)
      pixelPerfectPos = {
        x: Math.round(pixeloidPos.x),
        y: Math.round(pixeloidPos.y)
      }
      gameStore.geometry.drawing.activeDrawing.type = 'rectangle'
      gameStore.geometry.drawing.activeDrawing.startPoint = pixelPerfectPos
      gameStore.geometry.drawing.activeDrawing.isDrawing = true
    } else if (mode === 'point') {
      // Points: center of pixeloid
      pixelPerfectPos = {
        x: Math.floor(pixeloidPos.x) + 0.5,
        y: Math.floor(pixeloidPos.y) + 0.5
      }
      this.createPoint(pixelPerfectPos)
    } else if (mode === 'line') {
      // Lines: center of pixeloid
      pixelPerfectPos = {
        x: Math.floor(pixeloidPos.x) + 0.5,
        y: Math.floor(pixeloidPos.y) + 0.5
      }
      gameStore.geometry.drawing.activeDrawing.type = 'line'
      gameStore.geometry.drawing.activeDrawing.startPoint = pixelPerfectPos
      gameStore.geometry.drawing.activeDrawing.isDrawing = true
    } else if (mode === 'circle') {
      // Circles: center of pixeloid
      pixelPerfectPos = {
        x: Math.floor(pixeloidPos.x) + 0.5,
        y: Math.floor(pixeloidPos.y) + 0.5
      }
      gameStore.geometry.drawing.activeDrawing.type = 'circle'
      gameStore.geometry.drawing.activeDrawing.startPoint = pixelPerfectPos
      gameStore.geometry.drawing.activeDrawing.isDrawing = true
    } else if (mode === 'diamond') {
      // Diamonds: snap to pixeloid centers (0.5, 1.5, 2.5, etc.)
      pixelPerfectPos = GeometryHelper.snapPointToPixeloidCenter(pixeloidPos)
      gameStore.geometry.drawing.activeDrawing.type = 'diamond'
      gameStore.geometry.drawing.activeDrawing.startPoint = pixelPerfectPos
      gameStore.geometry.drawing.activeDrawing.isDrawing = true
    }
  }

  /**
   * Handle geometry drawing on mouse up
   */
  private handleGeometryMouseUp(pixeloidPos: { x: number, y: number }): void {
    const activeDrawing = gameStore.geometry.drawing.activeDrawing
    
    if (activeDrawing.isDrawing && activeDrawing.startPoint) {
      const startPoint = activeDrawing.startPoint
      let endPoint: { x: number, y: number }
      
      // Use the same coordinate snapping logic as mouse move
      if (activeDrawing.type === 'rectangle') {
        // Rectangles: corner positioning
        endPoint = {
          x: Math.round(pixeloidPos.x),
          y: Math.round(pixeloidPos.y)
        }
        this.createRectangle(startPoint, endPoint)
      } else if (activeDrawing.type === 'line') {
        // Lines: center of pixeloid
        endPoint = {
          x: Math.floor(pixeloidPos.x) + 0.5,
          y: Math.floor(pixeloidPos.y) + 0.5
        }
        this.createLine(startPoint, endPoint)
      } else if (activeDrawing.type === 'circle') {
        // Circles: external midpoint of target pixeloid
        const centerX = Math.floor(pixeloidPos.x) + 0.5
        const centerY = Math.floor(pixeloidPos.y) + 0.5
        
        // Calculate direction from start to current
        const deltaX = centerX - startPoint.x
        const deltaY = centerY - startPoint.y
        
        // Find the external edge point
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Horizontal edge
          endPoint = {
            x: deltaX > 0 ? Math.ceil(pixeloidPos.x) : Math.floor(pixeloidPos.x),
            y: centerY
          }
        } else {
          // Vertical edge
          endPoint = {
            x: centerX,
            y: deltaY > 0 ? Math.ceil(pixeloidPos.y) : Math.floor(pixeloidPos.y)
          }
        }
        this.createCircle(startPoint, endPoint)
      } else if (activeDrawing.type === 'diamond') {
        // Diamonds: snap to pixeloid centers for perfect alignment
        endPoint = GeometryHelper.snapPointToPixeloidCenter(pixeloidPos)
        this.createDiamond(startPoint, endPoint)
      }
      
      // Clear active drawing
      gameStore.geometry.drawing.activeDrawing.type = null
      gameStore.geometry.drawing.activeDrawing.startPoint = null
      gameStore.geometry.drawing.activeDrawing.currentPoint = null
      gameStore.geometry.drawing.activeDrawing.isDrawing = false
    }
  }

  /**
   * Create a point immediately (no dragging needed)
   */
  private createPoint(pixeloidPos: { x: number, y: number }): void {
    updateGameStore.createPoint(pixeloidPos.x, pixeloidPos.y)
  }

  /**
   * Handle geometry drawing during mouse move (for preview)
   */
  private handleGeometryMouseMove(pixeloidPos: { x: number, y: number }): void {
    const activeDrawing = gameStore.geometry.drawing.activeDrawing
    
    if (activeDrawing.isDrawing && activeDrawing.startPoint) {
      // Different coordinate snapping for different shapes
      let pixelPerfectPos: { x: number, y: number }
      
      if (activeDrawing.type === 'rectangle') {
        // Rectangles: corner positioning
        pixelPerfectPos = {
          x: Math.round(pixeloidPos.x),
          y: Math.round(pixeloidPos.y)
        }
      } else if (activeDrawing.type === 'line') {
        // Lines: center of pixeloid
        pixelPerfectPos = {
          x: Math.floor(pixeloidPos.x) + 0.5,
          y: Math.floor(pixeloidPos.y) + 0.5
        }
      } else if (activeDrawing.type === 'circle') {
        // Circles: external midpoint of target pixeloid
        // Calculate which edge is closest to the center
        const centerX = Math.floor(pixeloidPos.x) + 0.5
        const centerY = Math.floor(pixeloidPos.y) + 0.5
        const startPoint = activeDrawing.startPoint
        
        // Calculate direction from start to current
        const deltaX = centerX - startPoint.x
        const deltaY = centerY - startPoint.y
        
        // Find the external edge point
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Horizontal edge
          pixelPerfectPos = {
            x: deltaX > 0 ? Math.ceil(pixeloidPos.x) : Math.floor(pixeloidPos.x),
            y: centerY
          }
        } else {
          // Vertical edge
          pixelPerfectPos = {
            x: centerX,
            y: deltaY > 0 ? Math.ceil(pixeloidPos.y) : Math.floor(pixeloidPos.y)
          }
        }
      } else if (activeDrawing.type === 'diamond') {
        // Diamonds: snap to pixeloid centers for perfect alignment
        pixelPerfectPos = GeometryHelper.snapPointToPixeloidCenter(pixeloidPos)
      } else {
        // Default: center of pixeloid
        pixelPerfectPos = {
          x: Math.floor(pixeloidPos.x) + 0.5,
          y: Math.floor(pixeloidPos.y) + 0.5
        }
      }
      
      // Update current point for preview
      gameStore.geometry.drawing.activeDrawing.currentPoint = pixelPerfectPos
    }
  }

  /**
   * Handle mouse wheel for zooming with mouse position for center-zoom
   */
  private handleWheel(event: WheelEvent): void {
    if (!this.canvas || !this.infiniteCanvas) return
    
    event.preventDefault()
    
    // Get mouse position relative to canvas
    const rect = this.canvas.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top
    
    // Handle zoom with mouse position for zoom-to-center functionality
    this.infiniteCanvas.handleZoom(event.deltaY, mouseX, mouseY)
  }

  /**
   * Create a rectangle from start and end points
   */
  private createRectangle(startPoint: { x: number, y: number }, endPoint: { x: number, y: number }): void {
    // Calculate rectangle properties
    const minX = Math.min(startPoint.x, endPoint.x)
    const minY = Math.min(startPoint.y, endPoint.y)
    const maxX = Math.max(startPoint.x, endPoint.x)
    const maxY = Math.max(startPoint.y, endPoint.y)
    
    // Only create rectangle if it has some size (minimum 1 pixeloid)
    if (Math.abs(maxX - minX) >= 1 && Math.abs(maxY - minY) >= 1) {
      updateGameStore.createRectangle(minX, minY, maxX - minX, maxY - minY)
    }
  }

  /**
   * Create a line from start and end points
   */
  private createLine(startPoint: { x: number, y: number }, endPoint: { x: number, y: number }): void {
    // Only create line if it has some length (minimum 1 pixeloid distance)
    const distance = Math.sqrt(Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2))
    if (distance >= 1) {
      updateGameStore.createLine(startPoint.x, startPoint.y, endPoint.x, endPoint.y)
    }
  }

  /**
   * Create a circle from center and edge points
   */
  private createCircle(centerPoint: { x: number, y: number }, edgePoint: { x: number, y: number }): void {
    // Calculate radius
    const radius = Math.sqrt(Math.pow(edgePoint.x - centerPoint.x, 2) + Math.pow(edgePoint.y - centerPoint.y, 2))
    
    // Only create circle if it has some size (minimum 1 pixeloid radius)
    if (radius >= 1) {
      updateGameStore.createCircle(centerPoint.x, centerPoint.y, Math.round(radius))
    }
  }

  /**
   * Create an isometric diamond from anchor point and width
   */
  private createDiamond(anchorPoint: { x: number, y: number }, dragPoint: { x: number, y: number }): void {
    // Use centralized geometry calculations
    const properties = GeometryHelper.calculateDiamondProperties(anchorPoint, dragPoint)
    
    // Only create diamond if it has some size (minimum 2 pixeloids width)
    if (properties.width >= 2) {
      updateGameStore.createDiamond(properties.anchorX, properties.anchorY, properties.width, properties.height)
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
        return GeometryHelper.isPointInsideDiamond(pixeloidPos, obj as any)
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
   * Handle object dragging during mouse move
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

    // Apply offset to object based on type
    if ('anchorX' in obj && 'anchorY' in obj) {
      const diamond = obj as GeometricDiamond
      diamond.anchorX = this.dragObjectOriginalPosition.x + deltaX
      diamond.anchorY = this.dragObjectOriginalPosition.y + deltaY
    } else if ('centerX' in obj && 'centerY' in obj) {
      const circle = obj as GeometricCircle
      circle.centerX = this.dragObjectOriginalPosition.x + deltaX
      circle.centerY = this.dragObjectOriginalPosition.y + deltaY
    } else if ('x' in obj && 'y' in obj && 'width' in obj && 'height' in obj) {
      const rect = obj as GeometricRectangle
      rect.x = this.dragObjectOriginalPosition.x + deltaX
      rect.y = this.dragObjectOriginalPosition.y + deltaY
    } else if ('startX' in obj && 'startY' in obj && 'endX' in obj && 'endY' in obj) {
      const line = obj as GeometricLine
      if (this.dragObjectOriginalEnd) {
        line.startX = this.dragObjectOriginalPosition.x + deltaX
        line.startY = this.dragObjectOriginalPosition.y + deltaY
        line.endX = this.dragObjectOriginalEnd.x + deltaX
        line.endY = this.dragObjectOriginalEnd.y + deltaY
      }
    } else if ('x' in obj && 'y' in obj) {
      const point = obj as GeometricPoint
      point.x = this.dragObjectOriginalPosition.x + deltaX
      point.y = this.dragObjectOriginalPosition.y + deltaY
    }
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
   * Clean up event listeners
   */
  public destroy(): void {
    // Remove all event listeners
    document.removeEventListener('keydown', this.keydownHandler)
    document.removeEventListener('keyup', this.keyupHandler)
    
    if (this.canvas) {
      this.canvas.removeEventListener('mousemove', this.mouseMoveHandler)
      this.canvas.removeEventListener('mousedown', this.mouseDownHandler)
      this.canvas.removeEventListener('mouseup', this.mouseUpHandler)
      this.canvas.removeEventListener('wheel', this.wheelHandler)
      this.canvas.removeEventListener('contextmenu', this.contextMenuHandler)
    }
    
    this.canvas = null
    this.infiniteCanvas = null
  }
}