// app/src/game/MouseHighlightShader_3a.ts - Use mesh coordinates
import { Graphics } from 'pixi.js'
import { gameStore_3a } from '../store/gameStore_3a'
import { subscribe } from 'valtio'

/**
 * MouseHighlightShader_3a - Mesh-first mouse highlighter for Phase 3A
 * 
 * Renders simple highlight effects at mouse position using mesh vertex coordinates
 * Works with gameStore_3a for Phase 3A foundation
 */
export class MouseHighlightShader_3a {
  private graphics: Graphics
  
  // Animation state
  private startTime: number = Date.now()
  private isDirty: boolean = true
  
  // Highlight properties from store
  private get highlightColor(): number {
    return gameStore_3a.ui.mouse.highlightColor
  }
  private get highlightIntensity(): number {
    return gameStore_3a.ui.mouse.highlightIntensity
  }

  constructor() {
    // Create graphics for rendering highlight
    this.graphics = new Graphics()
    
    // Subscribe to mouse position changes
    this.setupMouseSubscription()
    
    console.log('MouseHighlightShader_3a: Initialized with mesh-first architecture')
  }

  /**
   * Subscribe to mouse position changes for real-time updates
   */
  private setupMouseSubscription(): void {
    subscribe(gameStore_3a.mouse, () => {
      this.isDirty = true
    })
  }

  /**
   * Render mouse highlight effects using mesh vertex coordinates
   */
  public render(): void {
    if (!this.isDirty) return
    
    // Clear previous graphics
    this.graphics.clear()
    
    // Only render if mouse highlighting is enabled
    if (!gameStore_3a.ui.showMouse) {
      this.isDirty = false
      return
    }
    
    // ✅ USE MESH VERTEX COORDINATES (authoritative)
    const mouseVertex = gameStore_3a.mouse.vertex
    const cellSize = gameStore_3a.mesh.cellSize
    
    if (!mouseVertex || cellSize <= 0) {
      console.warn('MouseHighlightShader_3a: Invalid mesh data or mouse position')
      this.isDirty = false
      return
    }
    
    // Get current time for animation
    const currentTime = (Date.now() - this.startTime) / 1000.0
    const mouseConfig = gameStore_3a.ui.mouse
    const pulse = mouseConfig.pulseMin + mouseConfig.pulseMax * Math.sin(currentTime * mouseConfig.animationSpeed)
    
    // Calculate animated alpha
    const animatedAlpha = this.highlightIntensity * pulse
    
    // Convert vertex coordinates to screen coordinates for rendering
    const screenX = mouseVertex.x * cellSize
    const screenY = mouseVertex.y * cellSize
    
    console.log(`MouseHighlightShader_3a: Rendering at vertex (${mouseVertex.x}, ${mouseVertex.y}) -> screen (${screenX}, ${screenY})`)
    
    // Draw highlight rectangle at mesh vertex position
    this.graphics
      .rect(screenX, screenY, cellSize, cellSize)
      .stroke({
        width: gameStore_3a.ui.mouse.strokeWidth,
        color: this.highlightColor,
        alpha: animatedAlpha
      })
    
    // Add inner fill for better visibility
    this.graphics
      .rect(screenX + 1, screenY + 1, cellSize - 2, cellSize - 2)
      .fill({
        color: this.highlightColor,
        alpha: animatedAlpha * gameStore_3a.ui.mouse.fillAlpha
      })
    
    this.isDirty = false
  }

  /**
   * Set highlight properties
   */
  public setHighlightColor(color: number): void {
    gameStore_3a.ui.mouse.highlightColor = color
    this.isDirty = true
    console.log('MouseHighlightShader_3a: Highlight color set to', color.toString(16))
  }

  public setHighlightIntensity(intensity: number): void {
    gameStore_3a.ui.mouse.highlightIntensity = Math.max(0, Math.min(1, intensity))
    this.isDirty = true
    console.log('MouseHighlightShader_3a: Highlight intensity set to', this.highlightIntensity)
  }

  /**
   * Get graphics for adding to stage
   */
  public getGraphics(): Graphics {
    return this.graphics
  }

  /**
   * Force a re-render on next frame
   */
  public markDirty(): void {
    this.isDirty = true
  }

  /**
   * Destroy shader and clean up resources
   */
  public destroy(): void {
    if (this.graphics) {
      this.graphics.destroy()
    }
    console.log('MouseHighlightShader_3a: Cleanup complete')
  }
}