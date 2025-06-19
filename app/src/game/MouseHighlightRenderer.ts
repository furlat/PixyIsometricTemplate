import { Graphics } from 'pixi.js'
import { gameStore } from '../store/gameStore'
import { subscribe } from 'valtio'

/**
 * Lightweight renderer for mouse highlighting
 * Subscribes ONLY to mouse position for fast updates
 * This is intentionally separate from background grid for performance
 */
export class MouseHighlightRenderer {
  private graphics: Graphics = new Graphics()
  private isDirty: boolean = true

  constructor() {
    // Subscribe ONLY to mouse position changes (not the entire store)
    subscribe(gameStore.mousePixeloidPosition, () => {
      this.isDirty = true
    })
  }

  /**
   * Render mouse highlight in pixeloid coordinates (will be transformed by camera)
   */
  public render(): void {
    // Only update if mouse position actually changed
    if (!this.isDirty) return
    
    this.graphics.clear()

    // Get current mouse position in pixeloid coordinates
    const mouseX = Math.floor(gameStore.mousePixeloidPosition.x)
    const mouseY = Math.floor(gameStore.mousePixeloidPosition.y)
    
    // Draw mouse highlight square directly in pixeloid coordinates
    // The camera transform will handle the scaling and positioning automatically
    this.graphics
      .rect(mouseX, mouseY, 1, 1)
      .fill({ color: 0x00ff00, alpha: 0.6 })

    this.isDirty = false
  }

  /**
   * Force refresh on next render
   */
  public markDirty(): void {
    this.isDirty = true
  }

  /**
   * Get graphics for adding to layer
   */
  public getGraphics(): Graphics {
    return this.graphics
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.graphics.destroy()
  }
}