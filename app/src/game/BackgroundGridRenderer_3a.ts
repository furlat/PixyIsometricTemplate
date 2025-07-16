// app/src/game/BackgroundGridRenderer_3a.ts - Updated to be orchestrator
import { MeshSimple } from 'pixi.js'
import { MeshManager_3a } from './MeshManager_3a'
import { GridShaderRenderer_3a } from './GridShaderRenderer_3a'
import { gameStore_3a, gameStore_3a_methods } from '../store/gameStore_3a'

/**
 * BackgroundGridRenderer_3a - Orchestrator for mesh-first architecture
 * 
 * Coordinates MeshManager_3a (mesh creation) and GridShaderRenderer_3a (visual rendering)
 * Handles mesh interaction events and routes to store
 */
export class BackgroundGridRenderer_3a {
  private meshManager: MeshManager_3a
  private gridShaderRenderer: GridShaderRenderer_3a
  
  constructor() {
    console.log('BackgroundGridRenderer_3a: Initializing with mesh-first architecture')
    
    // Create mesh manager (authoritative source)
    this.meshManager = new MeshManager_3a(gameStore_3a)
    
    // Create grid shader renderer (visual layer)
    this.gridShaderRenderer = new GridShaderRenderer_3a(this.meshManager)
    
    // Setup mesh interaction
    this.setupMeshInteraction()
    
    console.log('BackgroundGridRenderer_3a: Initialization complete')
  }
  
  /**
   * Setup mesh interaction for Phase 3A mouse events
   * Uses mesh-first architecture - mesh.getLocalPosition() is authoritative
   */
  private setupMeshInteraction(): void {
    const mesh = this.meshManager.getMesh()
    if (!mesh) {
      console.warn('BackgroundGridRenderer_3a: No mesh available for interaction')
      return
    }
    
    mesh.eventMode = 'static'
    mesh.interactiveChildren = false
    
    console.log('BackgroundGridRenderer_3a: Setting up mesh interaction')
    
    // ✅ MESH-FIRST MOUSE EVENTS
    mesh.on('globalpointermove', (event) => {
      // Get local position from mesh (authoritative)
      const localPos = event.getLocalPosition(mesh)
      
      // Convert to vertex coordinates using mesh manager
      const vertexCoord = this.meshManager.screenToVertex(localPos.x, localPos.y)
      
      // ✅ USE MESH COORDINATES (no hardcoded division)
      gameStore_3a_methods.updateMousePosition(vertexCoord.x, vertexCoord.y)
    })
    
    // Mouse click handling
    mesh.on('pointerdown', (event) => {
      const localPos = event.getLocalPosition(mesh)
      const vertexCoord = this.meshManager.screenToVertex(localPos.x, localPos.y)
      
      console.log(`BackgroundGridRenderer_3a: Click at vertex (${vertexCoord.x}, ${vertexCoord.y})`)
      
      // Update mouse position in store with mesh coordinates
      gameStore_3a_methods.updateMousePosition(vertexCoord.x, vertexCoord.y)
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
    
    console.log('BackgroundGridRenderer_3a: Mesh interaction enabled')
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
   * Get the mesh manager for external access
   */
  public getMeshManager(): MeshManager_3a {
    return this.meshManager
  }
  
  /**
   * Get the grid shader renderer for external access
   */
  public getGridShaderRenderer(): GridShaderRenderer_3a {
    return this.gridShaderRenderer
  }
  
  /**
   * Clean up resources
   */
  public destroy(): void {
    console.log('BackgroundGridRenderer_3a: Starting cleanup')
    
    this.meshManager.destroy()
    this.gridShaderRenderer.destroy()
    
    console.log('BackgroundGridRenderer_3a: Cleanup complete')
  }
}