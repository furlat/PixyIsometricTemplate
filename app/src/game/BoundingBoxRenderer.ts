import { Graphics } from 'pixi.js'
import { gameStore } from '../store/gameStore'
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
      gameStore.geometry.mask.enabledObjects.has(obj.id) &&
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
    const offset = gameStore.mesh.vertex_to_pixeloid_offset
    
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
   * Render bounding box rectangle using converted coordinates for perfect alignment
   */
  private renderBoundingBoxRectangle(convertedObj: GeometricObject, pixeloidScale: number): void {
    if (!convertedObj.metadata) return

    // Calculate bounds from converted object coordinates
    const bounds = this.calculateConvertedBounds(convertedObj)
    
    const x = bounds.minX
    const y = bounds.minY
    const width = bounds.maxX - bounds.minX
    const height = bounds.maxY - bounds.minY

    // Draw bounding box with scale-appropriate stroke width for visibility at all zoom levels
    const strokeWidth = Math.max(0.1, 2 / pixeloidScale)

    this.graphics
      .rect(x, y, width, height)
      .fill({
        color: 0xff0000,  // Red fill for easy distinction
        alpha: 0.1        // Very transparent
      })
      .stroke({
        width: strokeWidth,
        color: 0xff0000,  // Red outline
        alpha: 0.8        // More visible outline
      })
  }

  /**
   * Calculate bounds from converted coordinates for accurate bbox rendering
   */
  private calculateConvertedBounds(obj: GeometricObject): { minX: number, maxX: number, minY: number, maxY: number } {
    if ('centerX' in obj && 'centerY' in obj) {
      // Circle
      const circle = obj as any
      return {
        minX: circle.centerX - circle.radius,
        maxX: circle.centerX + circle.radius,
        minY: circle.centerY - circle.radius,
        maxY: circle.centerY + circle.radius
      }
    } else if ('x' in obj && 'width' in obj) {
      // Rectangle
      const rect = obj as any
      return {
        minX: rect.x,
        maxX: rect.x + rect.width,
        minY: rect.y,
        maxY: rect.y + rect.height
      }
    } else if ('startX' in obj && 'endX' in obj) {
      // Line
      const line = obj as any
      return {
        minX: Math.min(line.startX, line.endX),
        maxX: Math.max(line.startX, line.endX),
        minY: Math.min(line.startY, line.endY),
        maxY: Math.max(line.startY, line.endY)
      }
    } else if ('anchorX' in obj && 'anchorY' in obj) {
      // Diamond
      const diamond = obj as any
      const halfWidth = diamond.width / 2
      const halfHeight = diamond.height / 2
      return {
        minX: diamond.anchorX - halfWidth,
        maxX: diamond.anchorX + halfWidth,
        minY: diamond.anchorY - halfHeight,
        maxY: diamond.anchorY + halfHeight
      }
    } else if ('x' in obj && 'y' in obj) {
      // Point (small bounds for visibility)
      const point = obj as any
      const pointSize = 2 // Minimum visible size
      return {
        minX: point.x - pointSize,
        maxX: point.x + pointSize,
        minY: point.y - pointSize,
        maxY: point.y + pointSize
      }
    }
    
    // Fallback to metadata bounds if available (all object types should have been covered above)
    const fallbackBounds = (obj as any).metadata?.bounds
    return fallbackBounds || { minX: 0, maxX: 0, minY: 0, maxY: 0 }
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