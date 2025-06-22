import { Point } from 'pixi.js'
import type { ViewportCorners, PixeloidCoordinate, MeshVertexCoordinate, MeshResolution } from '../types'
import { gameStore } from '../store/gameStore'

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

  /**
   * REMOVED: Manual screen-to-mesh conversion
   * Now using ONLY the mesh event system with event.getLocalPosition(mesh)
   * This provides vertex coordinates directly without manual conversion
   */

  /**
   * Convert mesh vertex coordinates to pixeloid coordinates (Layer 2: Mesh → Pixeloid)
   * Uses the coordinate mapping from the static mesh system
   */
  static meshVertexToPixeloid(
    vertex: MeshVertexCoordinate,
    currentResolution?: MeshResolution
  ): PixeloidCoordinate {
    const coordinateMapping = gameStore.staticMesh.coordinateMapping
    
    if (!coordinateMapping) {
      // Fallback conversion using resolution level
      const resolution = currentResolution || { level: 1 } as MeshResolution
      return {
        x: vertex.x * resolution.level,
        y: vertex.y * resolution.level
      }
    }

    // Use direct mapping from mesh vertex to pixeloid
    const meshKey = `${vertex.x},${vertex.y}`
    const pixeloidCoord = coordinateMapping.meshToPixeloid.get(meshKey)
    
    if (pixeloidCoord) {
      return pixeloidCoord
    }

    // Fallback calculation if not in mapping
    const { level } = coordinateMapping.currentResolution
    return {
      x: vertex.x * level,
      y: vertex.y * level
    }
  }

  /**
   * Convert pixeloid coordinates to mesh vertex coordinates (Layer 2: Pixeloid → Mesh)
   * Uses the coordinate mapping from the static mesh system
   */
  static pixeloidToMeshVertex(
    pixeloid: PixeloidCoordinate,
    currentResolution?: MeshResolution
  ): MeshVertexCoordinate {
    const coordinateMapping = gameStore.staticMesh.coordinateMapping
    
    if (!coordinateMapping) {
      // Fallback conversion using resolution level
      const resolution = currentResolution || { level: 1 } as MeshResolution
      return {
        x: Math.round(pixeloid.x / resolution.level),
        y: Math.round(pixeloid.y / resolution.level)
      }
    }

    // Use direct mapping from pixeloid to mesh vertex
    const pixeloidKey = `${pixeloid.x},${pixeloid.y}`
    const meshVertex = coordinateMapping.pixeloidToMesh.get(pixeloidKey)
    
    if (meshVertex) {
      return meshVertex
    }

    // Fallback calculation if not in mapping
    const { level } = coordinateMapping.currentResolution
    return {
      x: Math.round(pixeloid.x / level),
      y: Math.round(pixeloid.y / level)
    }
  }

  /**
   * Snap pixeloid coordinates to mesh vertex alignment
   * Ensures coordinates align with mesh vertices for transform coherence
   */
  static snapPixeloidToVertexAlignment(pixeloid: PixeloidCoordinate): PixeloidCoordinate {
    const coordinateMapping = gameStore.staticMesh.coordinateMapping
    
    if (!coordinateMapping) {
      // Fallback to basic integer snapping
      return {
        x: Math.round(pixeloid.x),
        y: Math.round(pixeloid.y)
      }
    }

    // Convert to mesh vertex and back to get vertex-aligned pixeloid
    const meshVertex = this.pixeloidToMeshVertex(pixeloid)
    return this.meshVertexToPixeloid(meshVertex)
  }

  /**
   * Calculate vertex-aligned movement delta
   * Ensures WASD movement aligns with mesh vertices
   */
  static calculateVertexAlignedMovement(
    deltaX: number,
    deltaY: number,
    currentResolution?: MeshResolution
  ): PixeloidCoordinate {
    const coordinateMapping = gameStore.staticMesh.coordinateMapping
    const resolution = coordinateMapping?.currentResolution || currentResolution
    
    if (!resolution) {
      // Fallback to basic movement
      return { x: deltaX, y: deltaY }
    }

    // Snap movement to mesh vertex grid
    const { level } = resolution
    
    return {
      x: Math.round(deltaX / level) * level,
      y: Math.round(deltaY / level) * level
    }
  }

  /**
   * REMOVED: Manual screen-to-pixeloid conversion via mesh
   * Now using ONLY the mesh event system with direct vertex coordinates from events
   */

  /**
   * Get vertex-aligned pixeloid for input snapping
   * Ensures input coordinates align with mesh vertices
   */
  static getVertexAlignedPixeloid(pixeloid: PixeloidCoordinate): PixeloidCoordinate {
    return this.snapPixeloidToVertexAlignment(pixeloid)
  }
}