import type { 
  ViewportCorners, 
  PixeloidCoordinate, 
  VertexCoordinate, 
  ScreenCoordinate, 
  ViewportBounds 
} from '../types'

/**
 * Pure coordinate calculation functions
 * NO STORE DEPENDENCIES - only pure mathematical conversions
 * All conversions use branded types to prevent coordinate mixing
 */
export class CoordinateCalculations {
  
  // ================================
  // CORE CONVERSION METHODS (PURE FUNCTIONS)
  // ================================
  
  /**
   * Screen ↔ Vertex (vertex (0,0) always at screen (0,0))
   */
  static screenToVertex(
    screen: ScreenCoordinate, 
    pixeloidScale: number
  ): VertexCoordinate {
    return {
      __brand: 'vertex',
      x: screen.x / pixeloidScale,
      y: screen.y / pixeloidScale
    }
  }
  
  static vertexToScreen(
    vertex: VertexCoordinate,
    pixeloidScale: number
  ): ScreenCoordinate {
    return {
      __brand: 'screen', 
      x: vertex.x * pixeloidScale,
      y: vertex.y * pixeloidScale
    }
  }
  
  /**
   * Vertex ↔ Pixeloid (offset is the key variable)
   */
  static vertexToPixeloid(
    vertex: VertexCoordinate,
    offset: PixeloidCoordinate
  ): PixeloidCoordinate {
    return {
      __brand: 'pixeloid',
      x: vertex.x + offset.x,
      y: vertex.y + offset.y
    }
  }
  
  static pixeloidToVertex(
    pixeloid: PixeloidCoordinate, 
    offset: PixeloidCoordinate
  ): VertexCoordinate {
    return {
      __brand: 'vertex',
      x: pixeloid.x - offset.x,
      y: pixeloid.y - offset.y
    }
  }
  
  /**
   * Screen ↔ Pixeloid (derived from above)
   */
  static screenToPixeloid(
    screen: ScreenCoordinate,
    pixeloidScale: number,
    offset: PixeloidCoordinate
  ): PixeloidCoordinate {
    const vertex = this.screenToVertex(screen, pixeloidScale)
    return this.vertexToPixeloid(vertex, offset)
  }
  
  static pixeloidToScreen(
    pixeloid: PixeloidCoordinate,
    pixeloidScale: number, 
    offset: PixeloidCoordinate
  ): ScreenCoordinate {
    const vertex = this.pixeloidToVertex(pixeloid, offset)
    return this.vertexToScreen(vertex, pixeloidScale)
  }
  
  // ================================
  // VIEWPORT CALCULATIONS (PURE)
  // ================================
  
  /**
   * Calculate complete viewport bounds (pure function)
   */
  static calculateViewportBounds(
    screenSize: { width: number, height: number },
    pixeloidScale: number,
    worldPosition: PixeloidCoordinate,
    offset: PixeloidCoordinate
  ): ViewportBounds {
    // Screen bounds
    const screenCenter: ScreenCoordinate = {
      __brand: 'screen',
      x: screenSize.width / 2,
      y: screenSize.height / 2
    }
    
    // Calculate world viewport corners
    const topLeftScreen: ScreenCoordinate = { __brand: 'screen', x: 0, y: 0 }
    const bottomRightScreen: ScreenCoordinate = { 
      __brand: 'screen', 
      x: screenSize.width, 
      y: screenSize.height 
    }
    
    const topLeftWorld = this.screenToPixeloid(topLeftScreen, pixeloidScale, offset)
    const bottomRightWorld = this.screenToPixeloid(bottomRightScreen, pixeloidScale, offset)
    
    // Calculate vertex bounds
    const topLeftVertex = this.screenToVertex(topLeftScreen, pixeloidScale)
    const bottomRightVertex = this.screenToVertex(bottomRightScreen, pixeloidScale)
    
    return {
      screen: {
        width: screenSize.width,
        height: screenSize.height,
        center: screenCenter
      },
      world: {
        top_left: topLeftWorld,
        bottom_right: bottomRightWorld,
        center: worldPosition
      },
      vertex: {
        top_left: topLeftVertex,
        bottom_right: bottomRightVertex,
        width: bottomRightVertex.x - topLeftVertex.x,
        height: bottomRightVertex.y - topLeftVertex.y
      }
    }
  }
  
  /**
   * Calculate viewport corners in pixeloid coordinates (pure function)
   */
  static calculateViewportCorners(
    cameraPosition: PixeloidCoordinate,
    viewportSize: { width: number; height: number },
    pixeloidScale: number
  ): ViewportCorners {
    const viewportWidth = viewportSize.width / pixeloidScale
    const viewportHeight = viewportSize.height / pixeloidScale
    
    return {
      topLeft: {
        __brand: 'pixeloid',
        x: cameraPosition.x,
        y: cameraPosition.y
      },
      topRight: {
        __brand: 'pixeloid',
        x: cameraPosition.x + viewportWidth,
        y: cameraPosition.y
      },
      bottomLeft: {
        __brand: 'pixeloid',
        x: cameraPosition.x,
        y: cameraPosition.y + viewportHeight
      },
      bottomRight: {
        __brand: 'pixeloid',
        x: cameraPosition.x + viewportWidth,
        y: cameraPosition.y + viewportHeight
      }
    }
  }

  /**
   * Calculate visible grid bounds for rendering optimization (pure function)
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
   * Calculate camera transform position for rendering (pure function)
   */
  static calculateCameraTransformPosition(
    cameraPosition: PixeloidCoordinate,
    viewportSize: { width: number; height: number },
    pixeloidScale: number
  ): PixeloidCoordinate {
    return {
      __brand: 'pixeloid',
      x: -cameraPosition.x * pixeloidScale,
      y: -cameraPosition.y * pixeloidScale
    }
  }

  /**
   * Calculate initial camera position (pure function)
   */
  static calculateInitialCameraPosition(
    viewportSize: { width: number; height: number },
    pixeloidScale: number
  ): PixeloidCoordinate {
    return {
      __brand: 'pixeloid',
      x: 0,
      y: 0
    }
  }

  /**
   * Snap pixeloid coordinates to integer alignment (pure function)
   */
  static snapPixeloidToVertexAlignment(pixeloid: PixeloidCoordinate): PixeloidCoordinate {
    return {
      __brand: 'pixeloid',
      x: Math.round(pixeloid.x),
      y: Math.round(pixeloid.y)
    }
  }

  /**
   * Get vertex-aligned pixeloid for input snapping (pure function)
   */
  static getVertexAlignedPixeloid(pixeloid: PixeloidCoordinate): PixeloidCoordinate {
    return this.snapPixeloidToVertexAlignment(pixeloid)
  }

  /**
   * Calculate movement delta in pixeloid units (pure function)
   */
  static calculatePixeloidMovement(
    deltaPixelsX: number,
    deltaPixelsY: number,
    pixeloidScale: number
  ): PixeloidCoordinate {
    return {
      __brand: 'pixeloid',
      x: deltaPixelsX / pixeloidScale,
      y: deltaPixelsY / pixeloidScale
    }
  }
}