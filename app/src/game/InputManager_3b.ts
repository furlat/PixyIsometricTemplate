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
      
      // ✅ NEW: Handle selection shortcuts
      this.handleSelectionShortcuts(event)
      
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
   * ✅ NEW: Handle selection keyboard shortcuts
   */
  private handleSelectionShortcuts(event: KeyboardEvent): void {
    const key = event.key.toLowerCase()
    
    // Delete key - delete selected object
    if (key === 'delete' || key === 'backspace') {
      if (gameStore_3b.selection.selectedObjectId) {
        event.preventDefault()
        gameStore_3b_methods.deleteSelected()
        console.log('InputManager_3b: Deleted selected object')
      }
    }
    
    // ✅ NEW: E key - open object edit panel
    if (key === 'e') {
      console.log('🔍 InputManager_3b: E key pressed!')
      console.log('🔍 Selected object ID:', gameStore_3b.selection.selectedObjectId)
      console.log('🔍 Selection state:', JSON.stringify(gameStore_3b.selection, null, 2))
      
      if (gameStore_3b.selection.selectedObjectId) {
        event.preventDefault()
        console.log('✅ InputManager_3b: Opening edit panel for selected object (E)')
        console.log('✅ Store selection state:', gameStore_3b.selection)
        
        // Set edit panel open flag
        gameStore_3b.selection.isEditPanelOpen = true
        console.log('✅ InputManager_3b: Edit panel flag set to true')
        // Note: The UIControlBar_3b automatically handles showing/hiding the edit panel
        // based on selection state, so we don't need to do anything else here
      } else {
        console.log('❌ InputManager_3b: No object selected - E key ignored')
      }
    }
    
    // ✅ UPDATED: Ctrl+C - copy selected object (standard shortcut)
    if (key === 'c' && (event.ctrlKey || event.metaKey)) {
      if (gameStore_3b.selection.selectedObjectId) {
        event.preventDefault()
        gameStore_3b_methods.copyObject(gameStore_3b.selection.selectedObjectId)
        console.log('InputManager_3b: Copied selected object (Ctrl+C)')
      }
    }
    
    // ✅ UPDATED: Ctrl+V - paste copied object (standard shortcut with center-based positioning)
    if (key === 'v' && (event.ctrlKey || event.metaKey)) {
      if (gameStore_3b_methods.hasClipboardObject()) {
        event.preventDefault()
        // ✅ FIXED: Use mouse position as center (our new pasteObject method handles this)
        const mousePos = gameStore_3b.mouse.world
        const newObjectId = gameStore_3b_methods.pasteObject(mousePos)
        if (newObjectId) {
          gameStore_3b_methods.selectObject(newObjectId)
          console.log('InputManager_3b: Pasted object with center at', mousePos, '(Ctrl+V)')
        }
      }
    }
    
    // ✅ KEPT: Simple C/V keys for quick access (optional)
    if (key === 'c' && !event.ctrlKey && !event.metaKey) {
      if (gameStore_3b.selection.selectedObjectId) {
        event.preventDefault()
        gameStore_3b_methods.copyObject(gameStore_3b.selection.selectedObjectId)
        console.log('InputManager_3b: Copied selected object (C)')
      }
    }
    
    if (key === 'v' && !event.ctrlKey && !event.metaKey) {
      if (gameStore_3b_methods.hasClipboardObject()) {
        event.preventDefault()
        const mousePos = gameStore_3b.mouse.world
        const newObjectId = gameStore_3b_methods.pasteObject(mousePos)
        if (newObjectId) {
          gameStore_3b_methods.selectObject(newObjectId)
          console.log('InputManager_3b: Pasted object with center at', mousePos, '(V)')
        }
      }
    }
    
    // Escape - clear selection and cancel drawing
    if (key === 'escape') {
      event.preventDefault()
      
      // Clear selection
      gameStore_3b_methods.clearSelectionEnhanced()
      
      // Cancel any active drawing
      if (gameStore_3b.drawing.isDrawing) {
        gameStore_3b_methods.cancelDrawing()
      }
      
      // ✅ NEW: Reset drawing mode to 'none'
      if (gameStore_3b.drawing.mode !== 'none') {
        gameStore_3b_methods.setDrawingMode('none')
        console.log('InputManager_3b: Reset drawing mode to none')
      }
      
      // Cancel any dragging
      if (gameStore_3b.dragging.isDragging) {
        gameStore_3b_methods.cancelDragging()
      }
      
      console.log('InputManager_3b: Cleared selection and cancelled all actions')
    }
    
    // Ctrl+A - select all objects (placeholder for future multi-select)
    if (key === 'a' && event.ctrlKey) {
      event.preventDefault()
      console.log('InputManager_3b: Select all (not implemented yet)')
      // TODO: Implement multi-select when needed
    }
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