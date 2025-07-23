import { Application } from 'pixi.js'
import { Phase3BCanvas } from './Phase3BCanvas'
import { InputManager_3b } from './InputManager_3b'
import { gameStore_3b, gameStore_3b_methods } from '../store/gameStore_3b'

/**
 * Game_3b - Simplified Game class for Phase 3B
 *
 * This replaces the complex Game.ts with a minimal implementation
 * that focuses on the core foundation: mesh + grid + mouse layers.
 */
export class Game_3b {
  private app: Application
  private phase3bCanvas: Phase3BCanvas
  private inputManager: InputManager_3b
  private isInitialized = false
  private lastTime = 0
  
  constructor() {
    this.app = new Application()
    this.phase3bCanvas = new Phase3BCanvas(this.app)
    this.inputManager = new InputManager_3b()
  }
  
  /**
   * Initialize the Phase 3B game
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
      
      // Initialize Phase 3B canvas
      this.phase3bCanvas.initialize()
      
      // Initialize input manager
      await this.setupInputManager(canvas)
      
      // Setup event listeners
      this.setupEventListeners()
      
      // Start render loop
      this.startRenderLoop()
      
      this.isInitialized = true
      console.log('Game_3b: Initialization complete')
      
    } catch (error) {
      console.error('Game_3b: Initialization failed:', error)
      throw error
    }
  }
  
  /**
   * Setup input manager for Phase 3B
   */
  private async setupInputManager(canvas: HTMLCanvasElement): Promise<void> {
    try {
      // For Phase 3B, we'll handle input directly without the complex InputManager
        // This is part of the simplification process
        
        // Setup mouse event handlers
        this.setupMouseHandlers()
        
        // Setup keyboard event handlers
        this.setupKeyboardHandlers()
        
        console.log('Game_3b: Input manager initialized (simplified)')
      } catch (error) {
        console.warn('Game_3b: Input manager setup failed:', error)
      }
    }
    
    /**
     * Setup mouse event handlers for Phase 3B
     */
  private setupMouseHandlers(): void {
    const canvas = this.app.canvas
    
    // Mouse move handler
    canvas.addEventListener('mousemove', (event) => {
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      
      gameStore_3b_methods.updateMousePosition(x, y)
    })
    
    // Mouse click handler for Phase 3B
    canvas.addEventListener('click', (event) => {
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      
      // Update mouse position
      gameStore_3b_methods.updateMousePosition(x, y)
      
      // Log click for debugging
      console.log('Game_3b: Click at', { x, y, world: gameStore_3b.mouse.world })
    })
  }
  
  /**
   * Setup keyboard event handlers for Phase 3B
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
          gameStore_3b_methods.updateNavigation(key as 'w' | 'a' | 's' | 'd', deltaTime)
        }
      })
    }
  }
  
  /**
   * Process movement - will be overridden by setupKeyboardHandlers
   */
  private processMovement: (deltaTime: number) => void = () => {}
  
  /**
   * Setup event listeners for Phase 3B
   */
  private setupEventListeners(): void {
    // Window resize handler
    window.addEventListener('resize', () => {
      this.handleResize()
    })
    
    // Store changes handler
    // In a real implementation, you'd subscribe to store changes here
    // For Phase 3B, we'll handle this in the render loop
  }
  
  /**
   * Handle window resize for Phase 3B
   */
  private handleResize(): void {
    const width = window.innerWidth
    const height = window.innerHeight
    
    this.app.renderer.resize(width, height)
    this.phase3bCanvas.onResize(width, height)
  }
  
  /**
   * Start the render loop for Phase 3B
   */
  private startRenderLoop(): void {
    this.app.ticker.add((ticker) => {
      this.render(ticker.deltaTime)
    })
    
    console.log('Game_3b: Render loop started')
  }
  
  /**
   * Main render method for Phase 3B
   */
  private render(deltaTime: number): void {
    if (!this.isInitialized) return
    
    try {
      // Process movement input
      this.processMovement(deltaTime)
      
      // Update input manager
      const inputManager = this.phase3bCanvas.getInputManager()
      inputManager.updateMovement(deltaTime)
      
      // Render Phase 3B canvas
      this.phase3bCanvas.render()
      
    } catch (error) {
      console.warn('Game_3b: Render error:', error)
    }
  }
  
  /**
   * Get debug information for Phase 3B
   */
  public getDebugInfo(): any {
    return {
      game: {
        initialized: this.isInitialized,
        fps: this.app.ticker.FPS,
        deltaTime: this.app.ticker.deltaTime
      },
      canvas: this.phase3bCanvas.getDebugInfo(),
      store: {
        mouse: gameStore_3b.mouse,
        navigation: gameStore_3b.navigation,
        ui: gameStore_3b.ui
      }
    }
  }
  
  /**
   * Clean up resources
   */
  public destroy(): void {
    this.app.destroy()
    this.phase3bCanvas.destroy()
    this.inputManager.destroy?.()
    
    console.log('Game_3b: Resources cleaned up')
  }
  
  /**
   * Get the PIXI application instance
   */
  public getApp(): Application {
    return this.app
  }
  
  /**
   * Get the Phase 3B canvas instance
   */
  public getCanvas(): Phase3BCanvas {
    return this.phase3bCanvas
  }
}