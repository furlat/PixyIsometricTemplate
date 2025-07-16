// app/src/game/MouseHighlightShader_3b.ts - GPU-accelerated sprite highlighting
import { Sprite, Texture, ColorMatrixFilter } from 'pixi.js'
import { gameStore_3b } from '../store/gameStore_3b'
import { MeshManager_3b } from './MeshManager_3b'
import { VertexCoordinate } from '../types/ecs-coordinates'

/**
 * MouseHighlightShader_3b - GPU-accelerated mouse highlighter for Phase 3B
 *
 * Uses Sprite + ColorMatrixFilter for responsive, GPU-accelerated highlighting
 * No animations - static highlighting for maximum performance
 */
export class MouseHighlightShader_3b {
  private highlightSprite: Sprite
  private colorMatrixFilter: ColorMatrixFilter
  private meshManager: MeshManager_3b

  constructor(meshManager: MeshManager_3b) {
    this.meshManager = meshManager
    
    // Create simple white sprite for highlighting
    this.highlightSprite = new Sprite(Texture.WHITE)
    
    // Set highlight color via tint (from store)
    this.highlightSprite.tint = gameStore_3b.ui.mouse.highlightColor
    
    // Create color matrix filter for visual enhancement
    this.colorMatrixFilter = new ColorMatrixFilter()
    this.colorMatrixFilter.brightness(1.3, false)  // Static brightness boost
    this.colorMatrixFilter.contrast(1.1, false)    // Static contrast boost
    
    // Apply filter to sprite
    this.highlightSprite.filters = [this.colorMatrixFilter]
    
    // Initially hidden
    this.highlightSprite.visible = false
    
    console.log('MouseHighlightShader_3b: Initialized with Sprite + ColorMatrixFilter')
  }

  /**
   * ✅ Update mouse highlight directly from mesh coordinates - IMMEDIATE POSITIONING
   */
  public updateFromMesh(vertexCoord: VertexCoordinate): void {
    // ✅ Direct positioning - no delays, no animation frames
    const cellSize = this.meshManager.getCellSize()
    
    // Position sprite at mesh cell immediately
    this.highlightSprite.x = vertexCoord.x * cellSize
    this.highlightSprite.y = vertexCoord.y * cellSize
    this.highlightSprite.width = cellSize
    this.highlightSprite.height = cellSize
    this.highlightSprite.visible = true
    
    console.log('MouseHighlightShader_3b: Direct positioning at', vertexCoord)
  }

  /**
   * Set highlight properties
   */
  public setHighlightColor(color: number): void {
    gameStore_3b.ui.mouse.highlightColor = color
    this.highlightSprite.tint = color
    console.log('MouseHighlightShader_3b: Highlight color set to', color.toString(16))
  }

  public setHighlightIntensity(intensity: number): void {
    gameStore_3b.ui.mouse.highlightIntensity = Math.max(0, Math.min(1, intensity))
    // Update filter brightness based on intensity
    this.colorMatrixFilter.brightness(1 + intensity * 0.5, false)
    console.log('MouseHighlightShader_3b: Highlight intensity set to', intensity)
  }

  /**
   * Get sprite for adding to stage
   */
  public getSprite(): Sprite {
    return this.highlightSprite
  }

  /**
   * Destroy shader and clean up resources
   */
  public destroy(): void {
    if (this.highlightSprite) {
      this.highlightSprite.destroy()
    }
    
    console.log('MouseHighlightShader_3b: Cleanup complete')
  }
}