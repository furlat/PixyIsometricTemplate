// app/src/game/InputManager_3b.ts - Updated with mesh-first WASD
import { gameStore_3b, gameStore_3b_methods } from '../store/gameStore_3b'

/**
 * InputManager_3b - Mesh-first input handler for Phase 3B
 *
 * Handles WASD navigation using mesh vertex coordinates
 * Works with gameStore_3b for Phase 3B foundation
 */
export class InputManager_3b {
  private keysPressed: Set<string> = new Set()
  private isInitialized: boolean = false
  
  constructor() {
    console.log('InputManager_3b: Initialized with mesh-first architecture')
  }

  /**
   * Initialize input handling
   */
  public initialize(): void {
    if (this.isInitialized) return
    
    this.setupKeyboardEventHandlers()
    this.isInitialized = true
    
    console.log('InputManager_3b: Event handlers initialized')
  }

  /**
   * Setup keyboard event handlers
   */
  private setupKeyboardEventHandlers(): void {
    // Keydown handler
    document.addEventListener('keydown', (event) => {
      const key = event.key.toLowerCase()
      
      // Handle WASD navigation immediately on keydown
      if (['w', 'a', 's', 'd'].includes(key)) {
        event.preventDefault()
        this.handleWASDMovement(key as 'w' | 'a' | 's' | 'd')
      }
      
      // Handle spacebar centering
      if (key === ' ') {
        event.preventDefault()
        this.handleSpacebarCentering()
      }
      
      this.keysPressed.add(key)
    })
    
    // Keyup handler
    document.addEventListener('keyup', (event) => {
      const key = event.key.toLowerCase()
      this.keysPressed.delete(key)
    })
  }

  /**
   * Handle WASD movement using mesh-first coordinates
   */
  private handleWASDMovement(key: 'w' | 'a' | 's' | 'd'): void {
    // ✅ MESH-FIRST WASD MOVEMENT
    const moveAmount = gameStore_3b.navigation.moveAmount
    
    switch (key) {
      case 'w':
        gameStore_3b_methods.updateNavigationOffset(0, -moveAmount)
        console.log('InputManager_3b: Move up (W)')
        break
      case 's':
        gameStore_3b_methods.updateNavigationOffset(0, moveAmount)
        console.log('InputManager_3b: Move down (S)')
        break
      case 'a':
        gameStore_3b_methods.updateNavigationOffset(-moveAmount, 0)
        console.log('InputManager_3b: Move left (A)')
        break
      case 'd':
        gameStore_3b_methods.updateNavigationOffset(moveAmount, 0)
        console.log('InputManager_3b: Move right (D)')
        break
    }
  }

  /**
   * Handle spacebar centering action
   */
  private handleSpacebarCentering(): void {
    gameStore_3b_methods.resetNavigationOffset()
    console.log('InputManager_3b: Centered navigation offset (Space)')
  }

  /**
   * Process movement input - called from render loop (legacy compatibility)
   */
  public updateMovement(deltaTime: number): void {
    if (!this.isInitialized) return
    
    // For Phase 3B, we handle movement on keydown immediately
    // This method is kept for compatibility but doesn't need to do anything
    // since we handle movement in handleWASDMovement
  }

  /**
   * Check if a key is currently pressed
   */
  public isKeyPressed(key: string): boolean {
    return this.keysPressed.has(key.toLowerCase())
  }

  /**
   * Get all currently pressed keys
   */
  public getPressedKeys(): string[] {
    return Array.from(this.keysPressed)
  }

  /**
   * Handle mesh-based events (for compatibility with BackgroundGridRenderer_3b)
   */
  public handleMeshEvent(eventType: 'move' | 'down' | 'up', vertexX: number, vertexY: number): void {
    // For Phase 3B, we handle mouse events through the grid renderer
    // This method provides compatibility if needed
    console.log(`InputManager_3b: Mesh event ${eventType} at vertex (${vertexX}, ${vertexY})`)
    
    // You could add additional mesh-based input handling here if needed
    // For example, click-to-move functionality
  }

  /**
   * Handle wheel events (for future zoom functionality)
   */
  public handleMeshWheelEvent(vertexX: number, vertexY: number, event: any): void {
    // For Phase 3B, we don't implement zoom yet
    // This method provides compatibility for future expansion
    console.log(`InputManager_3b: Wheel event at vertex (${vertexX}, ${vertexY})`, event.deltaY)
  }

  /**
   * Get debug information
   */
  public getDebugInfo(): any {
    return {
      initialized: this.isInitialized,
      keysPressed: Array.from(this.keysPressed),
      navigationOffset: gameStore_3b.navigation.offset,
      isDragging: gameStore_3b.navigation.isDragging,
      meshData: {
        cellSize: gameStore_3b.mesh.cellSize,
        dimensions: gameStore_3b.mesh.dimensions,
        vertexCount: gameStore_3b.mesh.vertexData ? gameStore_3b.mesh.vertexData.length / 2 : 0
      }
    }
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    // Remove event listeners if needed
    // For Phase 3B, we keep it simple
    this.keysPressed.clear()
    this.isInitialized = false
    
    console.log('InputManager_3b: Cleanup complete')
  }
}