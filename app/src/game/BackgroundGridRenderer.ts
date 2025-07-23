/**
 * BackgroundGridRenderer - Clean Mesh Event Orchestrator
 * 
 * CLEAN ARCHITECTURE: Uses NEW InputManager + gameStore
 * - Captures PIXI mesh events (authoritative coordinate source)
 * - Routes to 3 systems: mouse highlighting, store updates, input handling
 * - Uses NEW InputManager for clean input processing
 * - Uses NEW gameStore for unified state management
 */

import { MeshSimple } from 'pixi.js'
import { MeshManager_3b } from './MeshManager'
import { GridShaderRenderer_3b } from './GridShaderRenderer'
import { MouseHighlightShader_3b } from './MouseHighlightShader'
import { InputManager } from './InputManager'
import { gameStore, gameStore_methods } from '../store/game-store'
import { VertexCoordinate } from '../types/ecs-coordinates'

/**
 * BackgroundGridRenderer - Orchestrator for mesh-first architecture
 *
 * Coordinates MeshManager_3b (mesh creation) and GridShaderRenderer_3b (visual rendering)
 * Handles mesh interaction events and routes to store and mouse highlight
 */
export class BackgroundGridRenderer {
  private meshManager: MeshManager_3b
  private gridShaderRenderer: GridShaderRenderer_3b
  private mouseHighlightShader: MouseHighlightShader_3b | null = null
  private inputManager: InputManager | null = null
  
  constructor() {
    console.log('BackgroundGridRenderer: Initializing with clean architecture')
    
    // Create mesh manager (authoritative source) with NEW store
    this.meshManager = new MeshManager_3b(gameStore)
    
    // Create grid shader renderer (visual layer)
    this.gridShaderRenderer = new GridShaderRenderer_3b(this.meshManager)
    
    // Setup mesh interaction
    this.setupMeshInteraction()
    
    console.log('BackgroundGridRenderer: Clean initialization complete')
  }
  
  /**
   * Setup mesh interaction for clean mouse events
   * Uses mesh-first architecture - mesh.getLocalPosition() is authoritative
   */
  private setupMeshInteraction(): void {
    const mesh = this.meshManager.getMesh()
    if (!mesh) {
      console.warn('BackgroundGridRenderer: No mesh available for interaction')
      return
    }
    
    mesh.eventMode = 'static'
    mesh.interactiveChildren = false
    
    console.log('BackgroundGridRenderer: Setting up clean mesh interaction')
    
    // ✅ DUAL IMMEDIATE UPDATES - GPU + Store (using NEW store)
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
      
      // ✅ IMMEDIATE STORE UPDATE (UI sync) - NEW store methods
      gameStore_methods.updateMouseVertex(vertexCoord.x, vertexCoord.y)
      
      // ✅ INPUT HANDLING - Route to NEW InputManager
      this.handleGeometryInput('move', vertexCoord, event)
    })
    
    // Mouse click handling
    mesh.on('pointerdown', (event) => {
      const localPos = event.getLocalPosition(mesh)
      const vertexCoord = this.meshManager.screenToVertex(localPos.x, localPos.y)
      
      console.log(`BackgroundGridRenderer: Click at vertex (${vertexCoord.x}, ${vertexCoord.y})`)
      
      // Update mouse position in NEW store with mesh coordinates
      gameStore_methods.updateMousePosition(vertexCoord.x, vertexCoord.y)
      
      // ✅ INPUT HANDLING - Route to NEW InputManager
      this.handleGeometryInput('down', vertexCoord, event)
    })
    
    // Mouse up handling
    mesh.on('pointerup', (event) => {
      const localPos = event.getLocalPosition(mesh)
      const vertexCoord = this.meshManager.screenToVertex(localPos.x, localPos.y)
      
      console.log(`BackgroundGridRenderer: Mouse up at vertex (${vertexCoord.x}, ${vertexCoord.y})`)
      
      // ✅ INPUT HANDLING - Route to NEW InputManager
      this.handleGeometryInput('up', vertexCoord, event)
    })
    
    // Right-click handling
    mesh.on('rightclick', (event) => {
      const localPos = event.getLocalPosition(mesh)
      const vertexCoord = this.meshManager.screenToVertex(localPos.x, localPos.y)
      
      console.log(`BackgroundGridRenderer: Right-click at vertex (${vertexCoord.x}, ${vertexCoord.y})`)
      
      // Convert to pixeloid coordinates and handle as right-click
      const pixeloidCoord = {
        x: vertexCoord.x + gameStore.navigation.offset.x,
        y: vertexCoord.y + gameStore.navigation.offset.y
      }
      
      // Handle right-click through NEW InputManager
      if (this.inputManager) {
        // ✅ TYPE-SAFE: Using PIXI's FederatedMouseEvent (implements MouseEvent)
        this.inputManager.handleMouseDown(pixeloidCoord, event)
      }
    })
    
    // Debug logging for mouse events (reduced frequency)
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
    
    console.log('BackgroundGridRenderer: Clean mesh interaction enabled')
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
    console.log('BackgroundGridRenderer: Mouse highlight shader registered for direct mesh updates')
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
    console.log('BackgroundGridRenderer: Starting cleanup')
    
    this.meshManager.destroy()
    this.gridShaderRenderer.destroy()
    
    console.log('BackgroundGridRenderer: Cleanup complete')
  }
  
  /**
   * Handle geometry input events - ROUTES TO NEW INPUTMANAGER
   * Clean separation: BackgroundGridRenderer captures events, InputManager processes them
   */
  private handleGeometryInput(eventType: 'down' | 'up' | 'move', vertexCoord: VertexCoordinate, event: any): void {
    // Convert vertex coordinates to pixeloid coordinates
    const pixeloidCoord = {
      x: vertexCoord.x + gameStore.navigation.offset.x,
      y: vertexCoord.y + gameStore.navigation.offset.y
    }
    
    // ✅ CLEAN ARCHITECTURE: Route to NEW InputManager (proper separation)
    if (this.inputManager) {
      // Map event types to InputManager methods
      switch (eventType) {
        case 'down':
          this.inputManager.handleMouseDown(pixeloidCoord, event)
          break
        case 'up':
          this.inputManager.handleMouseUp(pixeloidCoord)
          break
        case 'move':
          this.inputManager.handleMouseMove(pixeloidCoord)
          break
      }
    } else {
      console.warn('BackgroundGridRenderer: No InputManager registered for input handling')
    }
  }
  
  /**
   * Register NEW InputManager for input handling delegation
   */
  public registerInputManager(inputManager: InputManager): void {
    this.inputManager = inputManager
    console.log('BackgroundGridRenderer: NEW InputManager registered for clean input handling')
  }
}