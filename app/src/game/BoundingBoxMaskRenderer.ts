import { Graphics } from 'pixi.js'
import { gameStore } from '../store/gameStore'
import type { ViewportCorners, GeometricObject } from '../types'

/**
 * BoundingBoxMaskRenderer creates pixeloid masks using object bounding boxes.
 * This is a GPU-accelerated approach that:
 * - Uses existing metadata.bounds (no hardcoded geometry)
 * - Works with arbitrary objects 
 * - Renders transparent overlay for collision analysis
 * - Can be extended with compute shaders for precise geometry filtering
 */
export class BoundingBoxMaskRenderer {
  private graphics: Graphics
  
  constructor() {
    this.graphics = new Graphics()
  }

  /**
   * Render pixeloid masks for enabled objects using their bounding boxes
   */
  public render(_corners: ViewportCorners, _pixeloidScale: number): void {
    this.graphics.clear()

    // Check if mask layer is visible
    if (!gameStore.geometry.layerVisibility.mask) {
      return
    }

    // Get mask settings from store
    const { enabledObjects, mode, visualSettings } = gameStore.geometry.mask

    // Get objects that should contribute to mask
    const objectsToRender = gameStore.geometry.objects.filter(obj => 
      enabledObjects.has(obj.id) && obj.isVisible && obj.metadata
    )

    if (objectsToRender.length === 0) return

    // Render each enabled object's bounding box as simple rectangle outline
    for (const obj of objectsToRender) {
      this.renderBoundingBoxRectangle(obj, visualSettings)
    }
  }

  /**
   * Render simple bounding box rectangle using existing metadata.bounds
   */
  private renderBoundingBoxRectangle(
    obj: GeometricObject,
    visualSettings: typeof gameStore.geometry.mask.visualSettings
  ): void {
    if (!obj.metadata) return

    const bounds = obj.metadata.bounds
    
    // Use exact bounds from metadata (same as StoreExplorer miniatures)
    const x = bounds.minX
    const y = bounds.minY
    const width = bounds.maxX - bounds.minX
    const height = bounds.maxY - bounds.minY

    // Draw simple bounding box rectangle
    this.graphics
      .rect(x, y, width, height)
      .fill({
        color: visualSettings.fillColor,
        alpha: visualSettings.fillAlpha
      })
      .stroke({
        width: visualSettings.strokeWidth,
        color: visualSettings.strokeColor,
        alpha: visualSettings.strokeAlpha
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
