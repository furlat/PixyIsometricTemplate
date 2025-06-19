import { updateGameStore } from '../store/gameStore'
import type { InfiniteCanvas } from './InfiniteCanvas'

export class InputManager {
  private canvas: HTMLCanvasElement | null = null
  private infiniteCanvas: InfiniteCanvas | null = null
  
  // Store bound handlers for cleanup
  private keydownHandler: (event: KeyboardEvent) => void = () => {}
  private keyupHandler: (event: KeyboardEvent) => void = () => {}
  private mouseMoveHandler: (event: MouseEvent) => void = () => {}
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
    this.wheelHandler = this.handleWheel.bind(this)
    this.contextMenuHandler = (e) => e.preventDefault()

    // Add listeners
    document.addEventListener('keydown', this.keydownHandler)
    document.addEventListener('keyup', this.keyupHandler)
    this.canvas.addEventListener('mousemove', this.mouseMoveHandler)
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
   * Clean up event listeners
   */
  public destroy(): void {
    // Remove all event listeners
    document.removeEventListener('keydown', this.keydownHandler)
    document.removeEventListener('keyup', this.keyupHandler)
    
    if (this.canvas) {
      this.canvas.removeEventListener('mousemove', this.mouseMoveHandler)
      this.canvas.removeEventListener('wheel', this.wheelHandler)
      this.canvas.removeEventListener('contextmenu', this.contextMenuHandler)
    }
    
    this.canvas = null
    this.infiniteCanvas = null
  }
}