import {
  Container,
  Graphics
} from 'pixi.js'
import { PixelateFilter } from 'pixi-filters'
import { gameStore } from '../store/gameStore'
import type { ViewportCorners } from '../types'

/**
 * PixeloidMeshRenderer - Using working PixelateFilter + additional overlay
 *
 * OBJECTIVE: Use proven PixelateFilter + add black overlay where needed
 *
 * APPROACH:
 * 1. Keep using working PixelateFilter (no custom shaders)
 * 2. Add a simple black overlay mesh for pixeloids that contain geometry
 * 3. Much safer than breaking working filters
 */
export class PixeloidMeshRenderer {
  private container: Container = new Container()
  private pixelateFilter: PixelateFilter | null = null
  private currentTarget: Container | null = null
  private isFilterApplied = false
  private lastFilterSize = 0
  
  constructor() {
    this.container.label = 'PixeloidMaskLayer'
    this.createPixelateFilter()
  }

  /**
   * Main render method - applies/removes pixelate filter with state tracking
   */
  public render(
    pixeloidScale: number,
    cameraTransform?: Container
  ): void {
    // Clear previous content
    this.container.removeChildren()

    // Must have camera transform
    if (!cameraTransform) {
      console.warn('PixeloidMeshRenderer: No camera transform provided')
      return
    }

    const shouldApplyFilter = gameStore.geometry.layerVisibility.mask
    const filterSize = Math.round(pixeloidScale)
    const targetChanged = this.currentTarget !== cameraTransform
    const sizeChanged = this.lastFilterSize !== filterSize

    // Remove filter if it should not be applied or target changed
    if (this.isFilterApplied && (!shouldApplyFilter || targetChanged)) {
      this.removePixelateFilter()
    }

    // Apply filter if it should be applied and (not currently applied or size changed or target changed)
    if (shouldApplyFilter && (!this.isFilterApplied || targetChanged || sizeChanged)) {
      try {
        this.applyPixelateFilter(cameraTransform, pixeloidScale)
      } catch (error) {
        console.error('PixeloidMeshRenderer: Render failed:', error)
        this.removePixelateFilter()
      }
    }
  }

  /**
   * Create pixelate filter instance
   */
  private createPixelateFilter(): void {
    // Use the working PixelateFilter - no custom modifications
    this.pixelateFilter = new PixelateFilter([10, 10])
  }

  /**
   * Apply pixelate filter to camera transform for pixel-perfect alignment
   */
  private applyPixelateFilter(cameraTransform: Container, pixeloidScale: number): void {
    if (!this.pixelateFilter) {
      return
    }

    // Apply filter with pixeloidScale as the filter size for pixel-perfect alignment
    const filterSize = Math.round(pixeloidScale)
    this.pixelateFilter.size = [filterSize, filterSize]

    // Apply filter to camera transform (this is what gives pixel-perfect alignment)
    cameraTransform.filters = [this.pixelateFilter]
    
    // Update state tracking
    this.currentTarget = cameraTransform
    this.isFilterApplied = true
    this.lastFilterSize = filterSize
    
    console.log(`PixeloidMeshRenderer: Applied PixelateFilter with size [${filterSize}, ${filterSize}] to camera transform`)
  }

  /**
   * Remove pixelate filter from camera transform
   */
  private removePixelateFilter(): void {
    if (this.currentTarget) {
      // Clear filter from camera transform
      this.currentTarget.filters = null
    }
    
    // Update state tracking
    this.currentTarget = null
    this.isFilterApplied = false
    this.lastFilterSize = 0
    
    console.log('PixeloidMeshRenderer: Removed PixelateFilter from camera transform')
  }


  /**
   * Get container for layer system
   */
  public getContainer(): Container {
    return this.container
  }

  /**
   * Force filter update
   */
  public invalidate(): void {
    // No special invalidation needed for built-in filter
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.pixelateFilter) {
      this.pixelateFilter.destroy()
      this.pixelateFilter = null
    }
    
    this.container.destroy()
  }
}