// app/src/game/Phase3ACanvas.ts - Updated with mesh-first modules
import { Application, Container } from 'pixi.js'
import { BackgroundGridRenderer_3a } from './BackgroundGridRenderer_3a'
import { MouseHighlightShader_3a } from './MouseHighlightShader_3a'
import { InputManager_3a } from './InputManager_3a'
import { gameStore_3a, gameStore_3a_methods } from '../store/gameStore_3a'
import { PixeloidCoordinate } from '../types/ecs-coordinates'

// Simple interface for viewport corners
interface ViewportCorners {
  topLeft: PixeloidCoordinate
  topRight: PixeloidCoordinate
  bottomLeft: PixeloidCoordinate
  bottomRight: PixeloidCoordinate
}

/**
 * Phase3ACanvas - Mesh-first 2-layer canvas for Phase 3A foundation
 * 
 * This replaces LayeredInfiniteCanvas.ts with a minimal implementation
 * that focuses on the core foundation: mesh + grid + mouse layers.
 */
export class Phase3ACanvas {
  private app: Application
  private backgroundGridRenderer: BackgroundGridRenderer_3a
  private mouseHighlightShader: MouseHighlightShader_3a
  private inputManager: InputManager_3a
  
  // 2-layer system
  private gridLayer: Container
  private mouseLayer: Container
  
  constructor(app: Application) {
    this.app = app
    console.log('Phase3ACanvas: Initializing with mesh-first architecture')
    
    // Initialize layer containers
    this.gridLayer = new Container()
    this.mouseLayer = new Container()
    
    // Initialize renderers with mesh-first architecture
    this.backgroundGridRenderer = new BackgroundGridRenderer_3a()
    this.mouseHighlightShader = new MouseHighlightShader_3a(this.backgroundGridRenderer.getMeshManager())
    this.inputManager = new InputManager_3a()
    
    // Setup layers
    this.setupLayers()
    
    // ✅ ADD MOUSE SPRITE ONCE - NEVER REMOVE
    this.setupOneTimeMouseIntegration()
    
    // Register mouse highlight shader for direct mesh updates
    this.backgroundGridRenderer.registerMouseHighlightShader(this.mouseHighlightShader)
    
    // Initialize mesh data in store
    this.initializeMeshData()
    
    console.log('Phase3ACanvas: Initialization complete')
  }
  
  /**
   * Set up the 2-layer architecture for Phase 3A
   */
  private setupLayers(): void {
    // Create layer containers
    this.gridLayer = new Container()
    this.mouseLayer = new Container()
    
    // Add layers to stage in correct order
    this.app.stage.addChild(this.gridLayer)
    this.app.stage.addChild(this.mouseLayer)
    
    console.log('Phase3ACanvas: Layers setup complete')
  }
  
  /**
   * ✅ Setup one-time mouse integration - add sprite once, never remove
   */
  private setupOneTimeMouseIntegration(): void {
    // ✅ Add mouse sprite ONCE, never remove
    const mouseSprite = this.mouseHighlightShader.getSprite()
    this.mouseLayer.addChild(mouseSprite)
    console.log('Phase3ACanvas: Mouse sprite added once - never to be removed')
  }
  
  /**
   * Initialize mesh data in the store
   */
  private initializeMeshData(): void {
    const meshManager = this.backgroundGridRenderer.getMeshManager()
    const vertices = meshManager.getVertices()
    const cellSize = meshManager.getCellSize()
    const dimensions = meshManager.getMeshDimensions()
    
    if (vertices) {
      gameStore_3a_methods.updateMeshData(vertices, cellSize, dimensions)
      console.log('Phase3ACanvas: Mesh data initialized in store', { cellSize, dimensions })
    }
  }
  
  /**
   * Initialize the Phase 3A system
   */
  public initialize(): void {
    // Initialize input manager for Phase 3A
    this.inputManager.initialize()
    
    console.log('Phase3ACanvas: Phase 3A system initialized')
  }
  
  /**
   * Main render method for Phase 3A - ✅ FUNCTIONAL GAME LOOP
   */
  public render(): void {
    // ✅ Functional store reading (no reactive subscriptions)
    const showGrid = gameStore_3a.ui.showGrid
    const showMouse = gameStore_3a.ui.showMouse
    
    // Only clear grid layer
    this.gridLayer.removeChildren()
    
    // Render grid layer if visible
    if (showGrid) {
      this.renderGridLayer()
    }
    
    // ✅ Mouse layer is NEVER cleared - just visibility
    this.mouseLayer.visible = showMouse
  }
  
  /**
   * Render the grid layer using mesh-first system
   */
  private renderGridLayer(): void {
    try {
      // ✅ MESH-FIRST RENDERING - No parameters needed
      this.backgroundGridRenderer.render()
      
      // Get the mesh from the renderer
      const gridMesh = this.backgroundGridRenderer.getMesh()
      if (gridMesh) {
        this.gridLayer.addChild(gridMesh)
      }
    } catch (error) {
      console.warn('Phase3ACanvas: Grid rendering error:', error)
    }
  }
  
  
  /**
   * Get simple screen-based viewport corners for Phase 3A
   */
  private getSimpleCorners(): ViewportCorners {
    const width = this.app.screen.width
    const height = this.app.screen.height
    
    return {
      topLeft: { x: 0, y: 0 },
      topRight: { x: width, y: 0 },
      bottomLeft: { x: 0, y: height },
      bottomRight: { x: width, y: height }
    }
  }
  
  /**
   * Get the input manager for external access
   */
  public getInputManager(): InputManager_3a {
    return this.inputManager
  }
  
  /**
   * Get the grid renderer for external access
   */
  public getGridRenderer(): BackgroundGridRenderer_3a {
    return this.backgroundGridRenderer
  }
  
  /**
   * Get the mouse shader for external access
   */
  public getMouseShader(): MouseHighlightShader_3a {
    return this.mouseHighlightShader
  }
  
  /**
   * Handle window resize for Phase 3A
   */
  public onResize(width: number, height: number): void {
    // Simple resize handling - re-render with new dimensions
    // Note: In future phases, this might require mesh regeneration
    this.render()
    console.log('Phase3ACanvas: Resize handled', { width, height })
  }
  
  /**
   * Clean up resources
   */
  public destroy(): void {
    console.log('Phase3ACanvas: Starting cleanup')
    
    // Clean up layers
    this.gridLayer.removeChildren()
    this.mouseLayer.removeChildren()
    this.gridLayer.destroy()
    this.mouseLayer.destroy()
    
    // Clean up renderers
    this.backgroundGridRenderer.destroy()
    this.mouseHighlightShader.destroy()
    
    // Clean up input manager
    if (this.inputManager.destroy) {
      this.inputManager.destroy()
    }
    
    console.log('Phase3ACanvas: Cleanup complete')
  }
  
  /**
   * Get debug information for Phase 3A
   */
  public getDebugInfo(): any {
    return {
      layers: {
        gridLayer: {
          visible: this.gridLayer.visible,
          children: this.gridLayer.children.length
        },
        mouseLayer: {
          visible: this.mouseLayer.visible,
          children: this.mouseLayer.children.length
        }
      },
      mesh: {
        initialized: gameStore_3a.mesh.vertexData !== null,
        cellSize: gameStore_3a.mesh.cellSize,
        dimensions: gameStore_3a.mesh.dimensions,
        scale: 1 // Always scale 1 for Phase 3A
      },
      mouse: {
        vertex: gameStore_3a.mouse.vertex,
        screen: gameStore_3a.mouse.screen,
        world: gameStore_3a.mouse.world
      },
      navigation: {
        offset: gameStore_3a.navigation.offset,
        isDragging: gameStore_3a.navigation.isDragging
      },
      ui: {
        showGrid: gameStore_3a.ui.showGrid,
        showMouse: gameStore_3a.ui.showMouse
      }
    }
  }
}