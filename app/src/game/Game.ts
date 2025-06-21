import { Application, Container, extensions, CullerPlugin } from 'pixi.js';
import { updateGameStore } from '../store/gameStore';
import { LayeredInfiniteCanvas } from './LayeredInfiniteCanvas';
import { InputManager } from './InputManager';
import { StorePanel } from '../ui/StorePanel';
import { StoreExplorer } from '../ui/StoreExplorer';

// Register the CullerPlugin
extensions.add(CullerPlugin);

export class Game {
  private app: Application;
  private infiniteCanvas: LayeredInfiniteCanvas;
  private inputManager: InputManager;
  private storePanel: StorePanel;
  private storeExplorer: StoreExplorer;
  private initialized = false;

  constructor() {
    // Create the application instance (step 1 from docs)
    this.app = new Application();
    this.infiniteCanvas = new LayeredInfiniteCanvas(this.app); // Pass app for TextureRegistry
    this.inputManager = new InputManager();
    this.storePanel = new StorePanel();
    this.storeExplorer = new StoreExplorer();
  }

  async init(canvas: HTMLCanvasElement): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Initialize the application with options (step 2 from docs)
      await this.app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x404040, // Dark background for better contrast with grid
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        preference: 'webgl',
        autoStart: true, // TickerPlugin enabled
        sharedTicker: false,
        canvas: canvas, // Use the provided canvas element
        resizeTo: window, // Auto-resize to window
      });

      // Add infinite canvas to stage
      this.app.stage.addChild(this.infiniteCanvas.getContainer());

      // Initialize input manager
      this.inputManager.init(canvas, this.infiniteCanvas);

      // Set up the update loop
      this.app.ticker.add(this.update.bind(this));

      // Handle window resize for infinite canvas
      window.addEventListener('resize', this.handleResize.bind(this));

      // Set InfiniteCanvas reference in store for direct camera control
      updateGameStore.setInfiniteCanvasRef(this.infiniteCanvas);

      // Update store
      updateGameStore.setGameInitialized(true);
      this.initialized = true;

      console.log('Game initialized successfully with infinite canvas');
    } catch (error) {
      console.error('Failed to initialize game:', error);
      throw error;
    }
  }

  private handleResize(): void {
    if (!this.initialized) return;
    
    // Update canvas viewport size
    this.infiniteCanvas.updateViewportSize(window.innerWidth, window.innerHeight);
  }

  private update(ticker: any): void {
    if (!this.initialized) return;

    // Calculate delta time in seconds
    const deltaTime = ticker.deltaTime / 60; // Convert from frames to seconds (assuming 60 FPS base)

    // Update camera based on input
    this.infiniteCanvas.updateCamera(deltaTime);

    // Render the infinite canvas
    this.infiniteCanvas.render();
  }

  public destroy(): void {
    // Clean up store explorer
    this.storeExplorer.destroy();
    
    // Clean up store panel
    this.storePanel.destroy();
    
    // Clean up input manager
    this.inputManager.destroy();
    
    // Clean up infinite canvas
    this.infiniteCanvas.destroy();
    
    // Remove window resize listener
    window.removeEventListener('resize', this.handleResize.bind(this));
    
    // Destroy PixiJS application
    if (this.app) {
      this.app.destroy(true, { children: true, texture: true, textureSource: true });
    }
    
    this.initialized = false;
    updateGameStore.setGameInitialized(false);
  }

  // Getters for external access
  public get application(): Application {
    return this.app;
  }

  public get stage(): Container {
    return this.app.stage;
  }

  public get renderer() {
    return this.app.renderer;
  }

  public get ticker() {
    return this.app.ticker;
  }

  public get canvas() {
    return this.app.canvas;
  }

  public get isInitialized(): boolean {
    return this.initialized;
  }

  public get canvasSystem(): LayeredInfiniteCanvas {
    return this.infiniteCanvas;
  }

  public get storeExplorerPanel(): StoreExplorer {
    return this.storeExplorer;
  }
}