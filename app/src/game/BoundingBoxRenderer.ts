import { Graphics } from 'pixi.js'
import { gameStore } from '../store/gameStore'
import type { ViewportCorners, GeometricObject } from '../types'

/**
 * BoundingBoxRenderer displays simple bounding box rectangles for objects.
 * This is a simple visualization tool that:
 * - Shows object bounding boxes as transparent rectangles
 * - Used for comparison with PixeloidMeshRenderer
 * - No GPU acceleration, just simple rectangle drawing
 * - Controlled by the 'bbox' layer visibility setting
 */
export class BoundingBoxRenderer {
  private graphics: Graphics
  
  constructor() {
    this.graphics = new Graphics()
  }

  /**
   * Render simple bounding box rectangles for enabled objects
   */
  public render(_corners: ViewportCorners, _pixeloidScale: number): void {
    this.graphics.clear()

    // Check if bbox layer is visible
    if (!gameStore.geometry.layerVisibility.bbox) {
      return
    }

    // Get objects that should show bounding boxes
    const objectsToRender = gameStore.geometry.objects.filter(obj => 
      gameStore.geometry.mask.enabledObjects.has(obj.id) && 
      obj.isVisible && 
      obj.metadata
    )

    if (objectsToRender.length === 0) return

    // Render each object's bounding box as simple rectangle outline
    for (const obj of objectsToRender) {
      this.renderBoundingBoxRectangle(obj)
    }
  }

  /**
   * Render simple bounding box rectangle using existing metadata.bounds
   */
  private renderBoundingBoxRectangle(obj: GeometricObject): void {
    if (!obj.metadata) return

    const bounds = obj.metadata.bounds
    
    // Use exact bounds from metadata (same as StoreExplorer miniatures)
    const x = bounds.minX
    const y = bounds.minY
    const width = bounds.maxX - bounds.minX
    const height = bounds.maxY - bounds.minY

    // Draw simple bounding box rectangle with fixed styling for comparison
    this.graphics
      .rect(x, y, width, height)
      .fill({
        color: 0xff0000,  // Red fill for easy distinction
        alpha: 0.1        // Very transparent
      })
      .stroke({
        width: 0.2,
        color: 0xff0000,  // Red outline
        alpha: 0.8        // More visible outline
      })
  }

  /**
   * Get the graphics object for rendering
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