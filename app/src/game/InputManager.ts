import { updateGameStore, gameStore } from '../store/gameStore'
import type { InfiniteCanvas } from './InfiniteCanvas'
import type { GeometricRectangle, GeometricPoint, GeometricLine, GeometricCircle, GeometricDiamond } from '../types'

export class InputManager {
  private canvas: HTMLCanvasElement | null = null
  private infiniteCanvas: InfiniteCanvas | null = null
  
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
   * Handle mouse movement
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
    
    // Handle preview during drawing
    this.handleGeometryMouseMove(pixeloidPos)
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
   * Handle mouse up - finish drawing
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
    
    // Handle geometry drawing
    this.handleGeometryMouseUp(pixeloidPos)
  }

  /**
   * Handle geometry drawing on mouse down
   */
  private handleGeometryMouseDown(pixeloidPos: { x: number, y: number }): void {
    const mode = gameStore.geometry.drawing.mode
    
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
      pixelPerfectPos = {
        x: Math.floor(pixeloidPos.x) + 0.5,
        y: Math.floor(pixeloidPos.y) + 0.5
      }
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
        endPoint = {
          x: Math.floor(pixeloidPos.x) + 0.5,
          y: Math.floor(pixeloidPos.y) + 0.5
        }
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
    const point: GeometricPoint = {
      id: `point_${Date.now()}`,
      x: pixeloidPos.x,
      y: pixeloidPos.y,
      color: gameStore.geometry.drawing.settings.defaultColor,
      isVisible: true,
      createdAt: Date.now()
    }
    
    // Add to store
    updateGameStore.addGeometricObject(point)
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
        pixelPerfectPos = {
          x: Math.floor(pixeloidPos.x) + 0.5,
          y: Math.floor(pixeloidPos.y) + 0.5
        }
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
   * Handle mouse wheel for zooming
   */
  private handleWheel(event: WheelEvent): void {
    if (!this.infiniteCanvas) return
    
    event.preventDefault()
    
    // Handle zoom
    this.infiniteCanvas.handleZoom(event.deltaY)
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
      const rectangle: GeometricRectangle = {
        id: `rect_${Date.now()}`,
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        color: gameStore.geometry.drawing.settings.defaultColor,
        strokeWidth: gameStore.geometry.drawing.settings.defaultStrokeWidth,
        isVisible: true,
        createdAt: Date.now()
      }
      
      // Add to store
      updateGameStore.addGeometricObject(rectangle)
    }
  }

  /**
   * Create a line from start and end points
   */
  private createLine(startPoint: { x: number, y: number }, endPoint: { x: number, y: number }): void {
    // Only create line if it has some length (minimum 1 pixeloid distance)
    const distance = Math.sqrt(Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2))
    if (distance >= 1) {
      const line: GeometricLine = {
        id: `line_${Date.now()}`,
        startX: startPoint.x,
        startY: startPoint.y,
        endX: endPoint.x,
        endY: endPoint.y,
        color: gameStore.geometry.drawing.settings.defaultColor,
        strokeWidth: gameStore.geometry.drawing.settings.defaultStrokeWidth,
        isVisible: true,
        createdAt: Date.now()
      }
      
      // Add to store
      updateGameStore.addGeometricObject(line)
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
      const circle: GeometricCircle = {
        id: `circle_${Date.now()}`,
        centerX: centerPoint.x,
        centerY: centerPoint.y,
        radius: Math.round(radius), // Make radius pixel perfect
        color: gameStore.geometry.drawing.settings.defaultColor,
        strokeWidth: gameStore.geometry.drawing.settings.defaultStrokeWidth,
        isVisible: true,
        createdAt: Date.now()
      }
      
      // Add to store
      updateGameStore.addGeometricObject(circle)
    }
  }

  /**
   * Create an isometric diamond from anchor point and width
   */
  private createDiamond(anchorPoint: { x: number, y: number }, dragPoint: { x: number, y: number }): void {
    // Calculate width from horizontal drag distance
    let width = Math.abs(dragPoint.x - anchorPoint.x)
    
    // Force odd widths to even - snap down to prevent tiling issues
    if (width % 2 === 1) {
      width = width - 1  // 401 becomes 400, etc.
    }
    
    // Height calculation for perfect tiling (even widths only)
    const totalHeight = (width - 1) / 2
    const height = totalHeight / 2  // Center to north/south distance
    
    // Only create diamond if it has some size (minimum 2 pixeloids width)
    if (width >= 2) {
      // Use the original click position as the anchor (west vertex)
      const anchorX = anchorPoint.x
      const anchorY = anchorPoint.y
      
      const diamond: GeometricDiamond = {
        id: `diamond_${Date.now()}`,
        anchorX: anchorX, // West vertex at original click position
        anchorY: anchorY, // Y stays at original click position
        width: width,
        height: height,
        color: gameStore.geometry.drawing.settings.defaultColor,
        strokeWidth: gameStore.geometry.drawing.settings.defaultStrokeWidth,
        isVisible: true,
        createdAt: Date.now()
      }
      
      // Add to store
      updateGameStore.addGeometricObject(diamond)
    }
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