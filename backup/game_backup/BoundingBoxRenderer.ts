import { Graphics } from 'pixi.js'
import { gameStore } from '../store/gameStore'
import { CoordinateCalculations } from './CoordinateCalculations'
import { CoordinateHelper } from './CoordinateHelper'
import type { ViewportCorners, GeometricObject } from '../types'

/**
 * BoundingBoxRenderer displays simple bounding box rectangles for objects.
 * This is a simple visualization tool that:
 * - Shows object bounding boxes as transparent rectangles
 * - Used for comparison with PixeloidMeshRenderer
 * - Uses same coordinate conversion as GeometryRenderer for consistency
 * - Includes viewport culling for performance
 * - Controlled by the 'bbox' layer visibility setting
 * - Completely isolated from filter effects
 */
export class BoundingBoxRenderer {
  private graphics: Graphics
  
  constructor() {
    this.graphics = new Graphics()
  }

  /**
   * Render simple bounding box rectangles for enabled objects with proper coordinate conversion
   */
  public render(corners: ViewportCorners, pixeloidScale: number): void {
    this.graphics.clear()

    // Check if bbox layer is visible
    if (!gameStore.geometry.layerVisibility.bbox) {
      return
    }

    // Get objects that should show bounding boxes AND are in viewport
    const objectsToRender = gameStore.geometry.objects.filter(obj =>
      obj.isVisible &&
      obj.metadata &&
      this.isObjectInViewport(obj, corners)
    )

    if (objectsToRender.length === 0) return

    // Use same coordinate conversion as GeometryRenderer for consistency
    for (const obj of objectsToRender) {
      const convertedObject = this.convertObjectToVertexCoordinates(obj)
      this.renderBoundingBoxRectangle(convertedObject, pixeloidScale)
    }
  }

  /**
   * Convert object coordinates to vertex space using EXACT conversion (same as GeometryRenderer)
   * This ensures perfect alignment between bbox rectangles and geometry objects
   */
  private convertObjectToVertexCoordinates(obj: GeometricObject): GeometricObject {
    const offset = CoordinateHelper.getCurrentOffset()
    
    // Convert object coordinates to vertex space using EXACT conversion (no rounding)
    if ('centerX' in obj && 'centerY' in obj) {
      // Circle
      return {
        ...obj,
        centerX: obj.centerX - offset.x,  // EXACT conversion, no rounding
        centerY: obj.centerY - offset.y
      } as GeometricObject
    } else if ('x' in obj && 'width' in obj) {
      // Rectangle
      return {
        ...obj,
        x: obj.x - offset.x,  // EXACT conversion, no rounding
        y: obj.y - offset.y
      } as GeometricObject
    } else if ('startX' in obj && 'endX' in obj) {
      // Line
      return {
        ...obj,
        startX: obj.startX - offset.x,  // EXACT conversion, no rounding
        startY: obj.startY - offset.y,
        endX: obj.endX - offset.x,
        endY: obj.endY - offset.y
      } as GeometricObject
    } else if ('anchorX' in obj && 'anchorY' in obj) {
      // Diamond
      return {
        ...obj,
        anchorX: obj.anchorX - offset.x,  // EXACT conversion, no rounding
        anchorY: obj.anchorY - offset.y
      } as GeometricObject
    } else if ('x' in obj && 'y' in obj) {
      // Point
      return {
        ...obj,
        x: obj.x - offset.x,  // EXACT conversion, no rounding
        y: obj.y - offset.y
      } as GeometricObject
    }
    
    return obj
  }

  /**
   * Check if object bounds intersect with viewport (same logic as GeometryRenderer)
   */
  private isObjectInViewport(obj: GeometricObject, corners: ViewportCorners): boolean {
    if (!obj.metadata) return false
    
    const bounds = obj.metadata.bounds
    
    // Check if object bounds intersect with viewport
    return !(
      bounds.maxX < corners.topLeft.x ||     // Object is left of viewport
      bounds.minX > corners.bottomRight.x || // Object is right of viewport
      bounds.maxY < corners.topLeft.y ||     // Object is above viewport
      bounds.minY > corners.bottomRight.y    // Object is below viewport
    )
  }

  /**
   * Render bounding box rectangle using centralized metadata bounds (NO MORE DUPLICATION)
   */
  private renderBoundingBoxRectangle(convertedObj: GeometricObject, pixeloidScale: number): void {
    if (!convertedObj.metadata) return

    // Check visibility cache for the current scale
    let boundsToRender = convertedObj.metadata.bounds
    let isPartiallyVisible = false
    
    if (convertedObj.metadata.visibilityCache) {
      const cachedVisibility = convertedObj.metadata.visibilityCache.get(pixeloidScale)
      
      if (cachedVisibility) {
        // If object is partially visible, use the on-screen bounds
        if (cachedVisibility.visibility === 'partially-onscreen' && cachedVisibility.onScreenBounds) {
          boundsToRender = cachedVisibility.onScreenBounds
          isPartiallyVisible = true
        }
        // If offscreen, skip rendering entirely (shouldn't happen due to viewport culling)
        else if (cachedVisibility.visibility === 'offscreen') {
          return
        }
        // If fully visible, use the full bounds (default behavior)
      }
    }
    
    // Apply coordinate conversion to bounds
    const offset = CoordinateHelper.getCurrentOffset()
    
    const vertexX = boundsToRender.minX - offset.x
    const vertexY = boundsToRender.minY - offset.y
    const width = boundsToRender.maxX - boundsToRender.minX
    const height = boundsToRender.maxY - boundsToRender.minY

    // Convert vertex coordinates to screen coordinates
    const screenPos = CoordinateCalculations.vertexToScreen(
      { __brand: 'vertex' as const, x: vertexX, y: vertexY },
      pixeloidScale
    )
    const screenWidth = width * pixeloidScale
    const screenHeight = height * pixeloidScale

    // Draw bounding box with fixed 1 pixel stroke width (no scaling)
    const strokeWidth = 1
    
    // Use different styling for partial visibility
    const fillAlpha = isPartiallyVisible ? 0.2 : 0.1
    const strokeAlpha = isPartiallyVisible ? 1.0 : 0.8
    const strokeColor = isPartiallyVisible ? 0xff8800 : 0xff0000 // Orange for partial, red for full

    this.graphics
      .rect(screenPos.x, screenPos.y, screenWidth, screenHeight)
      .fill({
        color: 0xff0000,  // Red fill for easy distinction
        alpha: fillAlpha
      })
      .stroke({
        width: strokeWidth,
        color: strokeColor,
        alpha: strokeAlpha
      })
  }

  // ✅ REMOVED: calculateConvertedBounds() method
  // This was the source of dangerous computation duplication
  // Diamond calculations were WRONG (assumed anchorX = centerX)
  // Now we always use obj.metadata.bounds (centralized, correct calculation from GeometryHelper)

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