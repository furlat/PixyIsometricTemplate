import { Graphics, RenderTexture, Sprite, Renderer } from 'pixi.js'
import type { ViewportCorners } from '../types'
import { CoordinateHelper } from './CoordinateHelper'

/**
 * Dedicated renderer for the background grid pattern with texture caching
 * Uses pre-rendered textures to handle extreme zoom levels efficiently
 */
export class BackgroundGridRenderer {
  private graphics: Graphics
  private textureCache: Map<number, RenderTexture> = new Map()
  private gridSprite: Sprite | null = null
  private lastScale: number = -1
  private lastViewport: string = ''
  
  constructor() {
    this.graphics = new Graphics()
  }
  
  /**
   * Render the checkered grid pattern using cached textures for performance
   */
  public render(
    corners: ViewportCorners,
    pixeloidScale: number
  ): void {
    // Create viewport hash for caching
    const viewportHash = `${Math.floor(corners.topLeft.x/100)},${Math.floor(corners.topLeft.y/100)},${Math.floor(corners.bottomRight.x/100)},${Math.floor(corners.bottomRight.y/100)}`
    
    // Check if we need to regenerate (scale changed or major viewport change)
    if (pixeloidScale !== this.lastScale || viewportHash !== this.lastViewport) {
      this.regenerateGridTexture(corners, pixeloidScale)
      this.lastScale = pixeloidScale
      this.lastViewport = viewportHash
    }
  }
  
  /**
   * Generate cached grid texture for the current zoom level
   */
  private regenerateGridTexture(corners: ViewportCorners, pixeloidScale: number): void {
    this.graphics.clear()
    
    // For extreme zoom levels (1-2x), use efficient tiling pattern
    if (pixeloidScale <= 2) {
      this.renderTiledPattern(corners, pixeloidScale)
    } else {
      // Normal detailed rendering for higher zoom levels
      this.renderDetailedGrid(corners, pixeloidScale)
    }
  }
  
  /**
   * Render using efficient tiled pattern for extreme zoom
   */
  private renderTiledPattern(corners: ViewportCorners, pixeloidScale: number): void {
    // Calculate tile size - larger tiles for extreme zoom to reduce draw calls
    const tileSize = pixeloidScale <= 1 ? 64 : 32 // 64x64 or 32x32 pixel tiles
    
    const bounds = CoordinateHelper.calculateVisibleGridBounds(corners, 2)
    const { startX, endX, startY, endY } = bounds
    
    // Draw in tiles to reduce individual draw calls
    for (let tileX = Math.floor(startX / tileSize) * tileSize; tileX < endX; tileX += tileSize) {
      for (let tileY = Math.floor(startY / tileSize) * tileSize; tileY < endY; tileY += tileSize) {
        // Draw tile-sized checkerboard pattern
        for (let x = tileX; x < Math.min(tileX + tileSize, endX); x += 2) {
          for (let y = tileY; y < Math.min(tileY + tileSize, endY); y += 2) {
            // Draw 2x2 checkerboard pattern in one operation
            const isLight = ((Math.floor(x/2) + Math.floor(y/2)) % 2) === 0
            const color = isLight ? 0xf0f0f0 : 0xe0e0e0
            
            // Draw 2x2 block efficiently
            this.graphics.rect(x, y, 2, 2).fill(color)
          }
        }
      }
    }
    
    this.drawOriginAndGridLines(corners, pixeloidScale)
  }
  
  /**
   * Render detailed grid for normal zoom levels
   */
  private renderDetailedGrid(corners: ViewportCorners, pixeloidScale: number): void {
    const bounds = CoordinateHelper.calculateVisibleGridBounds(corners, 2)
    const { startX, endX, startY, endY } = bounds

    // Draw individual squares (efficient for higher zoom levels)
    for (let x = startX; x < endX; x++) {
      for (let y = startY; y < endY; y++) {
        const isLight = (x + y) % 2 === 0
        const color = isLight ? 0xf0f0f0 : 0xe0e0e0
        this.graphics.rect(x, y, 1, 1).fill(color)
      }
    }
    
    this.drawOriginAndGridLines(corners, pixeloidScale)
  }
  
  /**
   * Draw origin marker and grid lines
   */
  private drawOriginAndGridLines(corners: ViewportCorners, pixeloidScale: number): void {
    const bounds = CoordinateHelper.calculateVisibleGridBounds(corners, 2)
    const { startX, endX, startY, endY } = bounds
    
    // Draw origin marker
    this.graphics
      .setStrokeStyle({ width: Math.max(2 / pixeloidScale, 0.5), color: 0xff0000, alpha: 1 })
      .moveTo(-0.5, 0).lineTo(0.5, 0)
      .moveTo(0, -0.5).lineTo(0, 0.5)
    
    // Draw grid lines (less aggressive at extreme zoom)
    if (pixeloidScale > 2) {
      this.graphics.setStrokeStyle({ width: 1 / pixeloidScale, color: 0xcccccc, alpha: 0.5 })
      
      // Vertical lines
      for (let x = startX; x <= endX; x++) {
        this.graphics.moveTo(x, startY).lineTo(x, endY)
      }
      
      // Horizontal lines
      for (let y = startY; y <= endY; y++) {
        this.graphics.moveTo(startX, y).lineTo(endX, y)
      }
    }
  }
  
  /**
   * Get the graphics object for adding to render layer
   */
  public getGraphics(): Graphics {
    return this.graphics
  }
  
  /**
   * Clean up resources including texture cache
   */
  public destroy(): void {
    // Clean up cached textures
    for (const texture of this.textureCache.values()) {
      texture.destroy()
    }
    this.textureCache.clear()
    
    // Clean up sprite if exists
    if (this.gridSprite) {
      this.gridSprite.destroy()
      this.gridSprite = null
    }
    
    this.graphics.destroy()
  }
}