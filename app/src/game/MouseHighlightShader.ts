import { Graphics } from 'pixi.js'
import { gameStore } from '../store/gameStore'
import { subscribe } from 'valtio'

/**
 * Mesh-based mouse highlighter that renders highlight effects on mesh vertices
 * Uses vertex positions for efficient mouse interaction detection
 */
export class MouseHighlightShader {
  private graphics: Graphics
  
  // Highlight properties
  private highlightRadius: number = 6.0
  private highlightColor: number = 0x00ff00
  private highlightIntensity: number = 0.6
  
  // Animation state
  private startTime: number = Date.now()
  private currentMouseVertex: { x: number, y: number } = { x: 0, y: 0 }
  private isDirty: boolean = true

  constructor() {
    // Create graphics for rendering highlight
    this.graphics = new Graphics()
    
    // Subscribe to mouse position changes
    this.setupMouseSubscription()
    
    // Subscribe to mesh changes
    this.setupMeshSubscription()
    
    console.log('MouseHighlightShader: Initialized mesh-based mouse highlighting')
  }

  /**
   * Subscribe to mouse vertex position changes for real-time updates
   */
  private setupMouseSubscription(): void {
    subscribe(gameStore.mouse.vertex_position, () => {
      this.updateMousePosition()
      this.isDirty = true
    })
  }

  /**
   * Subscribe to static mesh changes to update geometry
   */
  private setupMeshSubscription(): void {
    subscribe(gameStore.staticMesh, () => {
      if (gameStore.staticMesh.activeMesh) {
        this.isDirty = true
      }
    })
  }

  /**
   * Update mouse position using store's vertex coordinates directly
   */
  private updateMousePosition(): void {
    // Use vertex coordinates directly from store - no conversion needed!
    this.currentMouseVertex.x = gameStore.mouse.vertex_position.x
    this.currentMouseVertex.y = gameStore.mouse.vertex_position.y
  }

  /**
   * Render mouse highlight effects on mesh
   */
  public render(): void {
    if (!this.isDirty) return
    
    const activeMesh = gameStore.staticMesh.activeMesh
    if (!activeMesh) {
      console.log('MouseHighlightShader: No active mesh available')
      return
    }
    
    // Clear previous graphics
    this.graphics.clear()
    
    // Get current time for animation
    const currentTime = (Date.now() - this.startTime) / 1000.0
    const pulse = 0.8 + 0.2 * Math.sin(currentTime * 3.0)
    
    // Calculate animated alpha
    const animatedAlpha = this.highlightIntensity * pulse
    
    console.log(`MouseHighlightShader: Rendering at mouse vertex (${this.currentMouseVertex.x.toFixed(2)}, ${this.currentMouseVertex.y.toFixed(2)}) with ${activeMesh.vertices.length / 2} vertices`)
    
    // Get mesh vertices and render highlights
    this.renderVertexHighlights(activeMesh.vertices, animatedAlpha)
    
    this.isDirty = false
  }

  /**
   * Render highlight for the grid square containing the mouse
   */
  private renderVertexHighlights(vertices: Float32Array, alpha: number): void {
    const mouseX = this.currentMouseVertex.x
    const mouseY = this.currentMouseVertex.y
    
    // Mouse vertex coordinates are 1:1 aligned with grid coordinates
    const gridX = Math.floor(mouseX)
    const gridY = Math.floor(mouseY)
    
    console.log(`MouseHighlightShader: Mouse at (${mouseX}, ${mouseY}), highlighting grid square at (${gridX}, ${gridY})`)
    
    // Draw 1x1 grid square at mouse position
    this.graphics
      .rect(gridX, gridY, 1, 1)
      .fill({ color: this.highlightColor, alpha: alpha })
  }

  /**
   * Set highlight properties
   */
  public setHighlightRadius(radius: number): void {
    this.highlightRadius = radius
    this.isDirty = true
  }

  public setHighlightColor(color: number): void {
    this.highlightColor = color
    this.isDirty = true
  }

  public setHighlightIntensity(intensity: number): void {
    this.highlightIntensity = intensity
    this.isDirty = true
  }

  /**
   * Get graphics for adding to stage
   */
  public getGraphics(): Graphics {
    return this.graphics
  }

  /**
   * Destroy shader and clean up resources
   */
  public destroy(): void {
    this.graphics.destroy()
    console.log('MouseHighlightShader: Destroyed shader resources')
  }
}