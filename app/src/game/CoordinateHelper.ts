import { Point } from 'pixi.js'
import type { ViewportCorners, PixeloidCoordinate } from '../types'

/**
 * Centralized coordinate computation helper
 * Handles all conversions between screen, pixeloid, and viewport coordinates
 */
export class CoordinateHelper {
  /**
   * Calculate viewport corners in pixeloid coordinates
   */
  static calculateViewportCorners(
    cameraPosition: PixeloidCoordinate,
    viewportSize: { width: number; height: number },
    pixeloidScale: number
  ): ViewportCorners {
    const halfWidth = (viewportSize.width / pixeloidScale) / 2
    const halfHeight = (viewportSize.height / pixeloidScale) / 2
    
    return {
      topLeft: {
        x: cameraPosition.x - halfWidth,
        y: cameraPosition.y - halfHeight
      },
      topRight: {
        x: cameraPosition.x + halfWidth,
        y: cameraPosition.y - halfHeight
      },
      bottomLeft: {
        x: cameraPosition.x - halfWidth,
        y: cameraPosition.y + halfHeight
      },
      bottomRight: {
        x: cameraPosition.x + halfWidth,
        y: cameraPosition.y + halfHeight
      }
    }
  }

  /**
   * Convert screen coordinates to pixeloid coordinates
   */
  static screenToPixeloid(
    screenX: number,
    screenY: number,
    cameraPosition: PixeloidCoordinate,
    viewportSize: { width: number; height: number },
    pixeloidScale: number
  ): Point {
    const worldX = (screenX - viewportSize.width / 2) / pixeloidScale + cameraPosition.x
    const worldY = (screenY - viewportSize.height / 2) / pixeloidScale + cameraPosition.y
    
    return new Point(worldX, worldY)
  }

  /**
   * Convert pixeloid coordinates to screen coordinates
   */
  static pixeloidToScreen(
    pixeloidX: number,
    pixeloidY: number,
    cameraPosition: PixeloidCoordinate,
    viewportSize: { width: number; height: number },
    pixeloidScale: number
  ): Point {
    const screenX = (pixeloidX - cameraPosition.x) * pixeloidScale + viewportSize.width / 2
    const screenY = (pixeloidY - cameraPosition.y) * pixeloidScale + viewportSize.height / 2
    
    return new Point(screenX, screenY)
  }

  /**
   * Calculate initial camera position to place (0,0) at top-left at given zoom level
   */
  static calculateInitialCameraPosition(
    viewportSize: { width: number; height: number },
    pixeloidScale: number
  ): PixeloidCoordinate {
    return {
      x: viewportSize.width / (2 * pixeloidScale),
      y: viewportSize.height / (2 * pixeloidScale)
    }
  }

  /**
   * Calculate camera transform position for rendering
   */
  static calculateCameraTransformPosition(
    cameraPosition: PixeloidCoordinate,
    viewportSize: { width: number; height: number },
    pixeloidScale: number
  ): PixeloidCoordinate {
    return {
      x: viewportSize.width / 2 - cameraPosition.x * pixeloidScale,
      y: viewportSize.height / 2 - cameraPosition.y * pixeloidScale
    }
  }

  /**
   * Calculate visible grid bounds for rendering optimization
   */
  static calculateVisibleGridBounds(
    corners: ViewportCorners,
    padding: number = 2
  ): {
    startX: number
    endX: number
    startY: number
    endY: number
  } {
    return {
      startX: Math.floor(corners.topLeft.x) - padding,
      endX: Math.ceil(corners.topRight.x) + padding,
      startY: Math.floor(corners.topLeft.y) - padding,
      endY: Math.ceil(corners.bottomLeft.y) + padding
    }
  }
}