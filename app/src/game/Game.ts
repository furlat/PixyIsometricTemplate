import { Application } from 'pixi.js'
import { Phase3BCanvas } from './Canvas'
import { InputManager } from './InputManager'          
import { gameStore } from '../store/game-store'

/**
 * Game - Clean orchestrator class with proper dependency injection
 *
 * Responsibilities:
 * - Create and manage PIXI Application
 * - Create InputManager and pass to components (dependency injection)
 * - Create Phase3BCanvas with proper dependencies
 * - Handle window events (resize)
 * - Orchestrate render loop
 * 
 * REMOVED:
 * - Duplicate input handling (InputManager handles this)
 * - Direct store manipulation (InputManager handles this)
 * - Complex initialization logic (simplified)
 */
export class Game {
  private app: Application
  private inputManager: InputManager      // ✅ Game creates and owns
  private phase3bCanvas: Phase3BCanvas
  private isInitialized = false
  
  constructor() {
    this.app = new Application()
    
    // ✅ Game creates InputManager (single instance, no duplicates)
    this.inputManager = new InputManager()
    
    // ✅ Pass InputManager to Phase3BCanvas (dependency injection)
    this.phase3bCanvas = new Phase3BCanvas(this.app, this.inputManager)
  }
  
  /**
   * Initialize the game with clean dependency flow
   */
  public async init(canvas: HTMLCanvasElement): Promise<void> {
    try {
      // ✅ Initialize PIXI application
      await this.app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x404040,
        canvas: canvas,
        antialias: true
      })
      
      // ✅ Initialize InputManager (no arguments needed)
      this.inputManager.initialize()
      
      // ✅ Initialize Phase3BCanvas (already has InputManager)
      this.phase3bCanvas.initialize()
      
      // ✅ Setup event listeners (resize only - no input duplication)
      this.setupEventListeners()
      
      // ✅ Start render loop
      this.startRenderLoop()
      
      this.isInitialized = true
      console.log('Game: Initialization complete')
      console.log('✅ Clean Architecture:')
      console.log('   Game → creates InputManager → passes to Phase3BCanvas')
      console.log('   BackgroundGridRenderer_3b → uses InputManager → updates store')
      console.log('   No duplicate input handling!')
      
    } catch (error) {
      console.error('Game: Initialization failed:', error)
      throw error
    }
  }
  
  /**
   * Setup event listeners (window events only - no input duplication)
   */
  private setupEventListeners(): void {
    // ✅ Window resize handler (Game responsibility)
    window.addEventListener('resize', () => {
      this.handleResize()
    })
    
    // ✅ NO mouse/keyboard handlers - InputManager handles all input
    console.log('Game: Window event listeners setup (resize only)')
  }
  
  /**
   * Handle window resize
   */
  private handleResize(): void {
    const width = window.innerWidth
    const height = window.innerHeight
    
    this.app.renderer.resize(width, height)
    this.phase3bCanvas.onResize(width, height)
    
    console.log('Game: Window resized to', { width, height })
  }
  
  /**
   * Start the render loop
   */
  private startRenderLoop(): void {
    this.app.ticker.add((ticker) => {
      this.render(ticker.deltaTime)
    })
    
    console.log('Game: Render loop started')
  }
  
  /**
   * Main render method - clean and simple
   */
  private render(_deltaTime: number): void {
    if (!this.isInitialized) return
    
    try {
      // ✅ InputManager handles its own updates (no manual calls needed)
      // ✅ Just render the canvas - clean separation
      this.phase3bCanvas.render()
      
    } catch (error) {
      console.warn('Game: Render error:', error)
    }
  }
  
  /**
   * Get debug information using NEW store
   */
  public getDebugInfo(): any {
    return {
      game: {
        initialized: this.isInitialized,
        fps: this.app.ticker.FPS,
        deltaTime: this.app.ticker.deltaTime
      },
      canvas: this.phase3bCanvas.getDebugInfo(),
      inputManager: this.inputManager.getDebugInfo?.(),
      store: {
        mouse: gameStore.mouse,        // ✅ NEW unified store
        navigation: gameStore.navigation,  // ✅ NEW unified store
        ui: gameStore.ui,              // ✅ NEW unified store
        drawing: gameStore.drawing     // ✅ NEW unified store
      }
    }
  }
  
  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.inputManager) {
      this.inputManager.destroy?.()
    }
    
    if (this.phase3bCanvas) {
      this.phase3bCanvas.destroy()
    }
    
    if (this.app) {
      this.app.destroy()
    }
    
    console.log('Game: Resources cleaned up')
  }
  
  /**
   * Get the PIXI application instance
   */
  public getApp(): Application {
    return this.app
  }
  
  /**
   * Get the Phase3BCanvas instance
   */
  public getCanvas(): Phase3BCanvas {
    return this.phase3bCanvas
  }
  
  /**
   * Get the InputManager instance
   */
  public getInputManager(): InputManager {
    return this.inputManager
  }
}