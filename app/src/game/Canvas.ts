// app/src/game/Phase3BCanvas.ts - Updated with mesh-first modules
import { Application, Container } from 'pixi.js'
import { BackgroundGridRenderer } from './BackgroundGridRenderer'
import { MouseHighlightShader } from './MouseHighlightShader'
import { InputManager } from './InputManager'
import { GeometryRenderer } from './GeometryRenderer'
import { gameStore, gameStore_methods } from '../store/game-store'

/**
 * Phase3BCanvas - Mesh-first 3-layer canvas for Phase 3B foundation
 *
 * This replaces LayeredInfiniteCanvas.ts with a minimal implementation
 * that focuses on the core foundation: mesh + grid + geometry + mouse layers.
 */
export class Phase3BCanvas {
  private app: Application
  private backgroundGridRenderer: BackgroundGridRenderer
  private mouseHighlightShader: MouseHighlightShader
  private inputManager: InputManager
  private geometryRenderer: GeometryRenderer
  
  // 3-layer system
  private gridLayer: Container
  private geometryLayer: Container
  private mouseLayer: Container
  
  constructor(app: Application, inputManager: InputManager) {
    if (!inputManager) {
      throw new Error('Phase3BCanvas requires InputManager - no fallback allowed')
    }
    
    this.app = app
    console.log('Phase3BCanvas: Initializing with mesh-first architecture')
    
    // Initialize layer containers
    this.gridLayer = new Container()
    this.geometryLayer = new Container()
    this.mouseLayer = new Container()
    
    // Initialize renderers with mesh-first architecture
    this.backgroundGridRenderer = new BackgroundGridRenderer()
    this.mouseHighlightShader = new MouseHighlightShader(this.backgroundGridRenderer.getMeshManager())
    
    // ✅ SINGLE INSTANCE ONLY - NO FALLBACKS
    this.inputManager = inputManager
    this.geometryRenderer = new GeometryRenderer()
    
    // Setup layers
    this.setupLayers()
    
    // ✅ ADD MOUSE SPRITE ONCE - NEVER REMOVE
    this.setupOneTimeMouseIntegration()
    
    // Register mouse highlight shader for direct mesh updates
    this.backgroundGridRenderer.registerMouseHighlightShader(this.mouseHighlightShader)
    
    // Register input manager with background grid for input handling
    this.backgroundGridRenderer.registerInputManager(this.inputManager)
    
    // Initialize mesh data in store
    this.initializeMeshData()
    
    console.log('Phase3BCanvas: Initialization complete')
  }
  
  /**
   * Set up the 3-layer architecture for Phase 3B
   */
  private setupLayers(): void {
    // Create layer containers
    this.gridLayer = new Container()
    this.geometryLayer = new Container()
    this.mouseLayer = new Container()
    
    // Add layers to stage in correct order
    this.app.stage.addChild(this.gridLayer)
    this.app.stage.addChild(this.geometryLayer)
    this.app.stage.addChild(this.mouseLayer)
    
    console.log('Phase3BCanvas: 3-layer system setup complete')
  }
  
  /**
   * ✅ Setup one-time mouse integration - add sprite once, never remove
   */
  private setupOneTimeMouseIntegration(): void {
    // ✅ Add mouse sprite ONCE, never remove
    const mouseSprite = this.mouseHighlightShader.getSprite()
    this.mouseLayer.addChild(mouseSprite)
    console.log('Phase3BCanvas: Mouse sprite added once - never to be removed')
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
      gameStore_methods.updateMeshData(vertices, cellSize, dimensions)
      console.log('Phase3BCanvas: Mesh data initialized in store', { cellSize, dimensions })
    }
  }
  
  /**
   * Initialize the Phase 3B system
   */
  public initialize(): void {
    // Initialize input manager for Phase 3B
    this.inputManager.initialize()
    
    console.log('Phase3BCanvas: Phase 3B system initialized')
  }
  
  /**
   * Main render method for Phase 3B - ✅ FUNCTIONAL GAME LOOP
   */
  public render(): void {
    // ✅ Functional store reading (no reactive subscriptions)
    const showGrid = gameStore.ui.showGrid
    const showGeometry = gameStore.ui.showGeometry
    const showMouse = gameStore.ui.showMouse
    
    // Clear layers that need updating
    this.gridLayer.removeChildren()
    this.geometryLayer.removeChildren()
    
    // Render grid layer if visible
    if (showGrid) {
      this.renderGridLayer()
    }
    
    // Render geometry layer if visible
    if (showGeometry) {
      this.renderGeometryLayer()
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
      console.warn('Phase3BCanvas: Grid rendering error:', error)
    }
  }
  
  /**
   * Render the geometry layer using GeometryRenderer
   */
  private renderGeometryLayer(): void {
    try {
      // ✅ GEOMETRY RENDERING - Render all geometry objects
      this.geometryRenderer.render()
      
      // Get the geometry container from the renderer
      const geometryContainer = this.geometryRenderer.getContainer()
      if (geometryContainer) {
        this.geometryLayer.addChild(geometryContainer)
      }
    } catch (error) {
      console.warn('Phase3BCanvas: Geometry rendering error:', error)
    }
  }
  
  /**
   * Get the input manager for external access
   */
  public getInputManager(): InputManager {
    return this.inputManager
  }
  
  /**
   * Get the grid renderer for external access
   */
  public getGridRenderer(): BackgroundGridRenderer {
    return this.backgroundGridRenderer
  }
  
  /**
   * Get the mouse shader for external access
   */
  public getMouseShader(): MouseHighlightShader {
    return this.mouseHighlightShader
  }
  
  /**
   * Get the geometry renderer for external access
   */
  public getGeometryRenderer(): GeometryRenderer {
    return this.geometryRenderer
  }
  
  /**
   * Handle window resize for Phase 3B
   */
  public onResize(width: number, height: number): void {
    // Simple resize handling - re-render with new dimensions
    // Note: In future phases, this might require mesh regeneration
    this.render()
    console.log('Phase3BCanvas: Resize handled', { width, height })
  }
  
  /**
   * Clean up resources
   */
  public destroy(): void {
    console.log('Phase3BCanvas: Starting cleanup')
    
    // Clean up layers
    this.gridLayer.removeChildren()
    this.geometryLayer.removeChildren()
    this.mouseLayer.removeChildren()
    this.gridLayer.destroy()
    this.geometryLayer.destroy()
    this.mouseLayer.destroy()
    
    // Clean up renderers
    this.backgroundGridRenderer.destroy()
    this.geometryRenderer.destroy()
    this.mouseHighlightShader.destroy()
    
    // Clean up input manager
    if (this.inputManager.destroy) {
      this.inputManager.destroy()
    }
    
    console.log('Phase3BCanvas: Cleanup complete')
  }
  
  /**
   * Get debug information for Phase 3B
   */
  public getDebugInfo(): any {
    return {
      layers: {
        gridLayer: {
          visible: this.gridLayer.visible,
          children: this.gridLayer.children.length
        },
        geometryLayer: {
          visible: this.geometryLayer.visible,
          children: this.geometryLayer.children.length
        },
        mouseLayer: {
          visible: this.mouseLayer.visible,
          children: this.mouseLayer.children.length
        }
      },
      mesh: {
        initialized: gameStore.mesh.cellSize !== null,
        cellSize: gameStore.mesh.cellSize,
        // dimensions: gameStore.mesh.dimensions,  // May not exist in new store
        scale: 1 // Always scale 1 for Phase 3B
      },
      mouse: {
        vertex: gameStore.mouse.vertex,
        position: gameStore.mouse.position,
        world: gameStore.mouse.world
      },
      navigation: {
        offset: gameStore.navigation.offset,
        isDragging: gameStore.navigation.isDragging
      },
      ui: {
        showGrid: gameStore.ui.showGrid,
        showGeometry: gameStore.ui.showGeometry,
        showMouse: gameStore.ui.showMouse
      }
    }
  }
}