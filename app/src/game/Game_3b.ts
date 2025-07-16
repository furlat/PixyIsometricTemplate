import { Application } from 'pixi.js'
import { Phase3ACanvas } from './Phase3ACanvas'
import { InputManager_3a } from './InputManager_3a'
import { gameStore_3a, gameStore_3a_methods } from '../store/gameStore_3a'

/**
 * Game_3a - Simplified Game class for Phase 3A
 * 
 * This replaces the complex Game.ts with a minimal implementation
 * that focuses on the core foundation: mesh + grid + mouse layers.
 */
export class Game_3a {
  private app: Application
  private phase3aCanvas: Phase3ACanvas
  private inputManager: InputManager_3a
  private isInitialized = false
  private lastTime = 0
  
  constructor() {
    this.app = new Application()
    this.phase3aCanvas = new Phase3ACanvas(this.app)
    this.inputManager = new InputManager_3a()
  }
  
  /**
   * Initialize the Phase 3A game
   */
  public async init(canvas: HTMLCanvasElement): Promise<void> {
    try {
      // Initialize PIXI application
      await this.app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x404040,
        canvas: canvas,
        antialias: true
      })
      
      // Initialize Phase 3A canvas
      this.phase3aCanvas.initialize()
      
      // Initialize input manager
      await this.setupInputManager(canvas)
      
      // Setup event listeners
      this.setupEventListeners()
      
      // Start render loop
      this.startRenderLoop()
      
      this.isInitialized = true
      console.log('Game_3a: Initialization complete')
      
    } catch (error) {
      console.error('Game_3a: Initialization failed:', error)
      throw error
    }
  }
  
  /**
   * Setup input manager for Phase 3A
   */
  private async setupInputManager(canvas: HTMLCanvasElement): Promise<void> {
    try {
      // For Phase 3A, we'll handle input directly without the complex InputManager
      // This is part of the simplification process
      
      // Setup mouse event handlers
      this.setupMouseHandlers()
      
      // Setup keyboard event handlers
      this.setupKeyboardHandlers()
      
      console.log('Game_3a: Input manager initialized (simplified)')
    } catch (error) {
      console.warn('Game_3a: Input manager setup failed:', error)
    }
  }
  
  /**
   * Setup mouse event handlers for Phase 3A
   */
  private setupMouseHandlers(): void {
    const canvas = this.app.canvas
    
    // Mouse move handler
    canvas.addEventListener('mousemove', (event) => {
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      
      gameStore_3a_methods.updateMousePosition(x, y)
    })
    
    // Mouse click handler for Phase 3A
    canvas.addEventListener('click', (event) => {
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      
      // Update mouse position
      gameStore_3a_methods.updateMousePosition(x, y)
      
      // Log click for debugging
      console.log('Game_3a: Click at', { x, y, world: gameStore_3a.mouse.world })
    })
  }
  
  /**
   * Setup keyboard event handlers for Phase 3A
   */
  private setupKeyboardHandlers(): void {
    let keysPressed = new Set<string>()
    
    // Keydown handler
    document.addEventListener('keydown', (event) => {
      keysPressed.add(event.key.toLowerCase())
      
      // Handle WASD navigation
      if (['w', 'a', 's', 'd'].includes(event.key.toLowerCase())) {
        event.preventDefault()
      }
    })
    
    // Keyup handler
    document.addEventListener('keyup', (event) => {
      keysPressed.delete(event.key.toLowerCase())
    })
    
    // Process movement in render loop
    this.processMovement = (deltaTime: number) => {
      keysPressed.forEach(key => {
        if (['w', 'a', 's', 'd'].includes(key)) {
          gameStore_3a_methods.updateNavigation(key as 'w' | 'a' | 's' | 'd', deltaTime)
        }
      })
    }
  }
  
  /**
   * Process movement - will be overridden by setupKeyboardHandlers
   */
  private processMovement: (deltaTime: number) => void = () => {}
  
  /**
   * Setup event listeners for Phase 3A
   */
  private setupEventListeners(): void {
    // Window resize handler
    window.addEventListener('resize', () => {
      this.handleResize()
    })
    
    // Store changes handler
    // In a real implementation, you'd subscribe to store changes here
    // For Phase 3A, we'll handle this in the render loop
  }
  
  /**
   * Handle window resize for Phase 3A
   */
  private handleResize(): void {
    const width = window.innerWidth
    const height = window.innerHeight
    
    this.app.renderer.resize(width, height)
    this.phase3aCanvas.onResize(width, height)
  }
  
  /**
   * Start the render loop for Phase 3A
   */
  private startRenderLoop(): void {
    this.app.ticker.add((ticker) => {
      this.render(ticker.deltaTime)
    })
    
    console.log('Game_3a: Render loop started')
  }
  
  /**
   * Main render method for Phase 3A
   */
  private render(deltaTime: number): void {
    if (!this.isInitialized) return
    
    try {
      // Process movement input
      this.processMovement(deltaTime)
      
      // Update input manager
      const inputManager = this.phase3aCanvas.getInputManager()
      inputManager.updateMovement(deltaTime)
      
      // Render Phase 3A canvas
      this.phase3aCanvas.render()
      
    } catch (error) {
      console.warn('Game_3a: Render error:', error)
    }
  }
  
  /**
   * Get debug information for Phase 3A
   */
  public getDebugInfo(): any {
    return {
      game: {
        initialized: this.isInitialized,
        fps: this.app.ticker.FPS,
        deltaTime: this.app.ticker.deltaTime
      },
      canvas: this.phase3aCanvas.getDebugInfo(),
      store: {
        mouse: gameStore_3a.mouse,
        navigation: gameStore_3a.navigation,
        ui: gameStore_3a.ui
      }
    }
  }
  
  /**
   * Clean up resources
   */
  public destroy(): void {
    this.app.destroy()
    this.phase3aCanvas.destroy()
    this.inputManager.destroy?.()
    
    console.log('Game_3a: Resources cleaned up')
  }
  
  /**
   * Get the PIXI application instance
   */
  public getApp(): Application {
    return this.app
  }
  
  /**
   * Get the Phase 3A canvas instance
   */
  public getCanvas(): Phase3ACanvas {
    return this.phase3aCanvas
  }
}