import { Graphics } from 'pixi.js'
import { gameStore } from '../store/gameStore'
import type { ViewportCorners } from '../types'
import { CoordinateHelper } from './CoordinateHelper'

/**
 * Dedicated renderer for the background grid pattern
 * Extracted from InfiniteCanvas.renderGrid() to support multi-layer architecture
 */
export class BackgroundGridRenderer {
  private graphics: Graphics
  
  constructor() {
    this.graphics = new Graphics()
  }
  
  /**
   * Render the checkered grid pattern with origin marker
   * Extracted from InfiniteCanvas.renderGrid() - maintains exact same logic
   */
  public render(
    corners: ViewportCorners,
    pixeloidScale: number
  ): void {
    this.graphics.clear()
    
    // Get visible grid bounds with padding (exact same logic as original)
    const bounds = CoordinateHelper.calculateVisibleGridBounds(corners, 2)
    const { startX, endX, startY, endY } = bounds

    // Get mouse pixeloid position for highlighting (exact same logic as original)
    const mousePixeloidX = Math.floor(gameStore.mousePixeloidPosition.x)
    const mousePixeloidY = Math.floor(gameStore.mousePixeloidPosition.y)

    // Draw checkered pattern (exact same logic as original)
    for (let x = startX; x < endX; x++) {
      for (let y = startY; y < endY; y++) {
        // Check if this is the targeted pixeloid
        const isTargeted = (x === mousePixeloidX && y === mousePixeloidY)
        
        let color: number
        if (isTargeted) {
          // Highlight targeted pixeloid in bright green
          color = 0x00ff00
        } else {
          // Checkered pattern: alternate colors
          const isLight = (x + y) % 2 === 0
          color = isLight ? 0xf0f0f0 : 0xe0e0e0
        }
        
        // Draw pixeloid square using PixiJS v8 API
        this.graphics
          .rect(x, y, 1, 1)
          .fill(color)
      }
    }

    // Draw origin marker at (0,0) using PixiJS v8 API (exact same logic as original)
    this.graphics
      .setStrokeStyle({ width: 2 / pixeloidScale, color: 0xff0000, alpha: 1 })
      .moveTo(-0.5, 0)
      .lineTo(0.5, 0)
      .moveTo(0, -0.5)
      .lineTo(0, 0.5)
    
    // Draw grid lines for better visibility using PixiJS v8 API (exact same logic as original)
    this.graphics
      .setStrokeStyle({ width: 1 / pixeloidScale, color: 0xcccccc, alpha: 0.5 })
    
    // Vertical lines
    for (let x = startX; x <= endX; x++) {
      this.graphics.moveTo(x, startY).lineTo(x, endY)
    }
    
    // Horizontal lines
    for (let y = startY; y <= endY; y++) {
      this.graphics.moveTo(startX, y).lineTo(endX, y)
    }
  }
  
  /**
   * Get the graphics object for adding to render layer
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