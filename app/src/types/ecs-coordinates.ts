/**
 * Pure ECS Coordinate System
 * 
 * Core coordinate types for the ECS dual-layer camera viewport architecture.
 * NO legacy compatibility - pure ECS implementation only.
 */

// ================================
// CORE COORDINATE TYPES
// ================================

/**
 * Pixeloid coordinate - fundamental unit of the ECS system.
 * Represents a position in the pixeloid grid at scale 1.
 */
export interface PixeloidCoordinate {
  readonly x: number
  readonly y: number
}

/**
 * Vertex coordinate - mesh system coordinates.
 * Used for pixel-perfect mesh alignment.
 */
export interface VertexCoordinate {
  readonly x: number
  readonly y: number
}

/**
 * Screen coordinate - actual pixel position on screen.
 * Used for mouse input and UI positioning.
 */
export interface ScreenCoordinate {
  readonly x: number
  readonly y: number
}

// ================================
// ECS VIEWPORT BOUNDS
// ================================

/**
 * ECS viewport bounds in pixeloid coordinates.
 * Used by data layer for viewport sampling.
 */
export interface ECSViewportBounds {
  readonly topLeft: PixeloidCoordinate
  readonly bottomRight: PixeloidCoordinate
  readonly width: number
  readonly height: number
}

/**
 * ECS bounding box for geometric objects.
 * Always in pixeloid coordinates at scale 1.
 */
export interface ECSBoundingBox {
  readonly minX: number
  readonly minY: number
  readonly maxX: number
  readonly maxY: number
  readonly width: number
  readonly height: number
}

// ================================
// COORDINATE VALIDATION
// ================================

/**
 * Validate pixeloid coordinate.
 */
export const isPixeloidCoordinate = (obj: any): obj is PixeloidCoordinate => {
  return obj &&
         typeof obj === 'object' &&
         typeof obj.x === 'number' &&
         typeof obj.y === 'number' &&
         !isNaN(obj.x) &&
         !isNaN(obj.y)
}

/**
 * Validate vertex coordinate.
 */
export const isVertexCoordinate = (obj: any): obj is VertexCoordinate => {
  return obj &&
         typeof obj === 'object' &&
         typeof obj.x === 'number' &&
         typeof obj.y === 'number' &&
         !isNaN(obj.x) &&
         !isNaN(obj.y)
}

/**
 * Validate screen coordinate.
 */
export const isScreenCoordinate = (obj: any): obj is ScreenCoordinate => {
  return obj &&
         typeof obj === 'object' &&
         typeof obj.x === 'number' &&
         typeof obj.y === 'number' &&
         !isNaN(obj.x) &&
         !isNaN(obj.y)
}

// ================================
// COORDINATE UTILITIES
// ================================

/**
 * Create a pixeloid coordinate.
 */
export const createPixeloidCoordinate = (x: number, y: number): PixeloidCoordinate => ({
  x,
  y
})

/**
 * Create a vertex coordinate.
 */
export const createVertexCoordinate = (x: number, y: number): VertexCoordinate => ({
  x,
  y
})

/**
 * Create a screen coordinate.
 */
export const createScreenCoordinate = (x: number, y: number): ScreenCoordinate => ({
  x,
  y
})

/**
 * Create ECS viewport bounds.
 */
export const createECSViewportBounds = (
  topLeft: PixeloidCoordinate,
  width: number,
  height: number
): ECSViewportBounds => ({
  topLeft,
  bottomRight: {
    x: topLeft.x + width,
    y: topLeft.y + height
  },
  width,
  height
})

/**
 * Create ECS bounding box.
 */
export const createECSBoundingBox = (
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
): ECSBoundingBox => ({
  minX,
  minY,
  maxX,
  maxY,
  width: maxX - minX,
  height: maxY - minY
})

// ================================
// COORDINATE CONVERSION UTILITIES
// ================================

/**
 * Convert pixeloid coordinate to screen coordinate.
 */
export const pixeloidToScreen = (
  pixeloid: PixeloidCoordinate,
  scale: number
): ScreenCoordinate => ({
  x: pixeloid.x * scale,
  y: pixeloid.y * scale
})

/**
 * Convert screen coordinate to pixeloid coordinate.
 */
export const screenToPixeloid = (
  screen: ScreenCoordinate,
  scale: number
): PixeloidCoordinate => ({
  x: screen.x / scale,
  y: screen.y / scale
})

/**
 * Convert pixeloid coordinate to vertex coordinate.
 */
export const pixeloidToVertex = (
  pixeloid: PixeloidCoordinate
): VertexCoordinate => ({
  x: pixeloid.x,
  y: pixeloid.y
})

/**
 * Convert vertex coordinate to pixeloid coordinate.
 */
export const vertexToPixeloid = (
  vertex: VertexCoordinate
): PixeloidCoordinate => ({
  x: vertex.x,
  y: vertex.y
})

// ================================
// ZOOM-AWARE TRANSFORMATIONS
// ================================

/**
 * Transform pixeloid coordinate for zoom level.
 */
export const transformPixeloidForZoom = (
  coord: PixeloidCoordinate,
  zoom: number
): PixeloidCoordinate => ({
  x: coord.x * zoom,
  y: coord.y * zoom
})

/**
 * Transform ECS viewport bounds for zoom level.
 */
export const transformBoundsForZoom = (
  bounds: ECSViewportBounds,
  zoom: number
): ECSViewportBounds => ({
  topLeft: transformPixeloidForZoom(bounds.topLeft, zoom),
  bottomRight: transformPixeloidForZoom(bounds.bottomRight, zoom),
  width: bounds.width * zoom,
  height: bounds.height * zoom
})

// ================================
// BOUNDARY VALIDATION
// ================================

/**
 * Check if coordinate is within bounds.
 */
export const isWithinBounds = (
  coord: PixeloidCoordinate,
  bounds: ECSViewportBounds
): boolean => {
  return coord.x >= bounds.topLeft.x &&
         coord.x <= bounds.bottomRight.x &&
         coord.y >= bounds.topLeft.y &&
         coord.y <= bounds.bottomRight.y
}

/**
 * Clamp coordinate to bounds.
 */
export const clampToBounds = (
  coord: PixeloidCoordinate,
  bounds: ECSViewportBounds
): PixeloidCoordinate => ({
  x: Math.max(bounds.topLeft.x, Math.min(bounds.bottomRight.x, coord.x)),
  y: Math.max(bounds.topLeft.y, Math.min(bounds.bottomRight.y, coord.y))
})

// ================================
// DISTANCE AND GEOMETRY UTILITIES
// ================================

/**
 * Calculate distance between two pixeloid coordinates.
 */
export const distance = (
  a: PixeloidCoordinate,
  b: PixeloidCoordinate
): number => {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Calculate Manhattan distance between two pixeloid coordinates.
 */
export const manhattanDistance = (
  a: PixeloidCoordinate,
  b: PixeloidCoordinate
): number => {
  return Math.abs(b.x - a.x) + Math.abs(b.y - a.y)
}

/**
 * Interpolate between two pixeloid coordinates.
 */
export const interpolate = (
  a: PixeloidCoordinate,
  b: PixeloidCoordinate,
  t: number
): PixeloidCoordinate => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t
})

// ================================
// ECS CONSTANTS
// ================================

/**
 * ECS coordinate system constants.
 */
export const ECS_COORDINATE_CONSTANTS = {
  ORIGIN: { x: 0, y: 0 } as const,
  DATA_LAYER_SCALE: 1 as const,
  PIXEL_PERFECT_TOLERANCE: 0.001 as const
} as const

// NO legacy coordinate types
// NO backward compatibility helpers
// NO mixed coordinate systems