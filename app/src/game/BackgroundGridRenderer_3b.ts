// app/src/game/BackgroundGridRenderer_3b.ts - Updated to be orchestrator
import { MeshSimple } from 'pixi.js'
import { MeshManager_3b } from './MeshManager_3b'
import { GridShaderRenderer_3b } from './GridShaderRenderer_3b'
import { MouseHighlightShader_3b } from './MouseHighlightShader_3b'
import { GeometryRenderer_3b } from './GeometryRenderer_3b'
import { gameStore_3b, gameStore_3b_methods } from '../store/gameStore_3b'
import { VertexCoordinate } from '../types/ecs-coordinates'

/**
 * BackgroundGridRenderer_3b - Orchestrator for mesh-first architecture
 *
 * Coordinates MeshManager_3b (mesh creation) and GridShaderRenderer_3b (visual rendering)
 * Handles mesh interaction events and routes to store and mouse highlight
 */
export class BackgroundGridRenderer_3b {
  private meshManager: MeshManager_3b
  private gridShaderRenderer: GridShaderRenderer_3b
  private mouseHighlightShader: MouseHighlightShader_3b | null = null
  private geometryRenderer: GeometryRenderer_3b | null = null
  
  constructor() {
    console.log('BackgroundGridRenderer_3b: Initializing with mesh-first architecture')
    
    // Create mesh manager (authoritative source)
    this.meshManager = new MeshManager_3b(gameStore_3b)
    
    // Create grid shader renderer (visual layer)
    this.gridShaderRenderer = new GridShaderRenderer_3b(this.meshManager)
    
    // Setup mesh interaction
    this.setupMeshInteraction()
    
    console.log('BackgroundGridRenderer_3b: Initialization complete')
  }
  
  /**
   * Setup mesh interaction for Phase 3B mouse events
   * Uses mesh-first architecture - mesh.getLocalPosition() is authoritative
   */
  private setupMeshInteraction(): void {
    const mesh = this.meshManager.getMesh()
    if (!mesh) {
      console.warn('BackgroundGridRenderer_3b: No mesh available for interaction')
      return
    }
    
    mesh.eventMode = 'static'
    mesh.interactiveChildren = false
    
    console.log('BackgroundGridRenderer_3b: Setting up mesh interaction')
    
    // ✅ SIMPLE DUAL IMMEDIATE UPDATES - GPU + Store
    mesh.on('globalpointermove', (event) => {
      // Get local position from mesh (authoritative)
      const localPos = event.getLocalPosition(mesh)
      
      // Convert to vertex coordinates directly
      const vertexCoord = {
        x: Math.floor(localPos.x),
        y: Math.floor(localPos.y)
      }
      
      // ✅ IMMEDIATE GPU UPDATE (visual feedback)
      if (this.mouseHighlightShader) {
        this.mouseHighlightShader.updateFromMesh(vertexCoord)
      }
      
      // ✅ IMMEDIATE STORE UPDATE (UI sync)
      gameStore_3b_methods.updateMouseVertex(vertexCoord.x, vertexCoord.y)
      
      // ✅ GEOMETRY INPUT HANDLING - Update drawing preview
      this.handleGeometryInput('move', vertexCoord, event)
    })
    
    // Mouse click handling
    mesh.on('pointerdown', (event) => {
      const localPos = event.getLocalPosition(mesh)
      const vertexCoord = this.meshManager.screenToVertex(localPos.x, localPos.y)
      
      console.log(`BackgroundGridRenderer_3b: Click at vertex (${vertexCoord.x}, ${vertexCoord.y})`)
      
      // Update mouse position in store with mesh coordinates
      gameStore_3b_methods.updateMousePosition(vertexCoord.x, vertexCoord.y)
      
      // ✅ GEOMETRY INPUT HANDLING - Start drawing
      this.handleGeometryInput('down', vertexCoord, event)
    })
    
    // Mouse up handling
    mesh.on('pointerup', (event) => {
      const localPos = event.getLocalPosition(mesh)
      const vertexCoord = this.meshManager.screenToVertex(localPos.x, localPos.y)
      
      console.log(`BackgroundGridRenderer_3b: Mouse up at vertex (${vertexCoord.x}, ${vertexCoord.y})`)
      
      // ✅ GEOMETRY INPUT HANDLING - Finish drawing
      this.handleGeometryInput('up', vertexCoord, event)
    })
    
    // Debug logging for mouse events
    mesh.on('globalpointermove', (event) => {
      if (Math.random() < 0.01) { // Log 1% of events to avoid spam
        const localPos = event.getLocalPosition(mesh)
        const vertexCoord = this.meshManager.screenToVertex(localPos.x, localPos.y)
        console.log('Mouse move event:', {
          global: { x: event.globalX, y: event.globalY },
          local: { x: localPos.x, y: localPos.y },
          vertex: vertexCoord
        })
      }
    })
    
    console.log('BackgroundGridRenderer_3b: Mesh interaction enabled')
  }
  
  /**
   * Render the grid - orchestrates mesh and shader rendering
   */
  public render(): void {
    // Render grid shader
    this.gridShaderRenderer.render()
  }
  
  /**
   * Get the mesh for adding to render layer
   */
  public getMesh(): MeshSimple | null {
    return this.meshManager.getMesh()
  }
  
  /**
   * Register mouse highlight shader for direct mesh updates
   */
  public registerMouseHighlightShader(mouseHighlightShader: MouseHighlightShader_3b): void {
    this.mouseHighlightShader = mouseHighlightShader
    console.log('BackgroundGridRenderer_3b: Mouse highlight shader registered for direct mesh updates')
  }
  
  /**
   * Get the mesh manager for external access
   */
  public getMeshManager(): MeshManager_3b {
    return this.meshManager
  }
  
  /**
   * Get the grid shader renderer for external access
   */
  public getGridShaderRenderer(): GridShaderRenderer_3b {
    return this.gridShaderRenderer
  }
  
  /**
   * Clean up resources
   */
  public destroy(): void {
    console.log('BackgroundGridRenderer_3b: Starting cleanup')
    
    this.meshManager.destroy()
    this.gridShaderRenderer.destroy()
    
    console.log('BackgroundGridRenderer_3b: Cleanup complete')
  }
  
  /**
   * Handle geometry input events for drawing - DELEGATES TO GEOMETRY RENDERER
   * BackgroundGridRenderer should only handle mouse capture, not drawing logic
   */
  private handleGeometryInput(eventType: 'down' | 'up' | 'move', vertexCoord: VertexCoordinate, event: any): void {
    // Convert vertex coordinates to pixeloid coordinates
    const pixeloidCoord = {
      x: vertexCoord.x + gameStore_3b.navigation.offset.x,
      y: vertexCoord.y + gameStore_3b.navigation.offset.y
    }
    
    // Delegate to geometry renderer (correct architectural location)
    if (this.geometryRenderer) {
      this.geometryRenderer.handleDrawingInput(eventType, pixeloidCoord, event)
    } else {
      console.warn('BackgroundGridRenderer_3b: No geometry renderer registered for drawing input')
    }
  }
  
  /**
   * Register geometry renderer for drawing input delegation
   */
  public registerGeometryRenderer(geometryRenderer: GeometryRenderer_3b): void {
    this.geometryRenderer = geometryRenderer
    console.log('BackgroundGridRenderer_3b: Geometry renderer registered for drawing input')
  }
}