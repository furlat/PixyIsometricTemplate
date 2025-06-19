// Centralized type definitions for the entire application

export interface PixeloidCoordinate {
  x: number
  y: number
}

export interface ViewportCorners {
  topLeft: PixeloidCoordinate
  topRight: PixeloidCoordinate
  bottomLeft: PixeloidCoordinate
  bottomRight: PixeloidCoordinate
}

export interface CameraState {
  // Camera position in pixeloid coordinates
  position: PixeloidCoordinate
  // Zoom level (pixeloid scale factor: 1 = 1 pixel per pixeloid, 10 = 10 pixels per pixeloid)
  pixeloidScale: number
  // Current viewport corners in pixeloid coordinates
  viewportCorners: ViewportCorners
}

export interface InputState {
  // WASD movement keys
  keys: {
    w: boolean
    a: boolean
    s: boolean
    d: boolean
    space: boolean
  }
}

export interface GameState {
  isInitialized: boolean
  isLoading: boolean
  currentScene: string
  windowWidth: number
  windowHeight: number
  mousePosition: {
    x: number
    y: number
  }
  // Mouse position in pixeloid coordinates
  mousePixeloidPosition: {
    x: number
    y: number
  }
  // Camera and canvas state
  camera: CameraState
  input: InputState
  // Geometry system state (Phase 1)
  geometry: GeometryState
}

// UI-related types
export interface UIElement {
  id: string
  element: HTMLElement
}

export interface StatusColors {
  active: string
  inactive: string
  system: string
  camera: string
  mouse: string
}

// Geometry-related types for Phase 1: Multi-Layer System
export interface GeometricPoint {
  id: string
  x: number
  y: number
  color: number
  isVisible: boolean
  createdAt: number
}

export interface GeometricLine {
  id: string
  startX: number
  startY: number
  endX: number
  endY: number
  color: number
  strokeWidth: number
  isVisible: boolean
  createdAt: number
}

export interface GeometricCircle {
  id: string
  centerX: number
  centerY: number
  radius: number
  color: number
  strokeWidth: number
  fillColor?: number
  isVisible: boolean
  createdAt: number
}

export interface GeometricRectangle {
  id: string
  x: number
  y: number
  width: number
  height: number
  color: number
  strokeWidth: number
  fillColor?: number
  isVisible: boolean
  createdAt: number
}

export type GeometricObject = GeometricPoint | GeometricLine | GeometricCircle | GeometricRectangle

export interface GeometryDrawingState {
  // Current drawing mode
  mode: 'none' | 'point' | 'line' | 'circle' | 'rectangle'
  // Active drawing operation (for multi-step operations like line drawing)
  activeDrawing: {
    type: GeometricObject['id'] | null
    startPoint: PixeloidCoordinate | null
    isDrawing: boolean
  }
  // Drawing settings
  settings: {
    defaultColor: number
    defaultStrokeWidth: number
    defaultFillColor: number
  }
}

export interface RaycastState {
  // Active raycast lines for visualization
  activeRaycasts: Array<{
    id: string
    startX: number
    startY: number
    endX: number
    endY: number
    color: number
    hitPoints: PixeloidCoordinate[]
    createdAt: number
  }>
  // Raycast settings
  settings: {
    maxDistance: number
    visualizationColor: number
    showSteps: boolean
    stepColor: number
  }
}

export interface GeometryState {
  // All geometric objects on the canvas
  objects: GeometricObject[]
  // Drawing state
  drawing: GeometryDrawingState
  // Raycast visualization state
  raycast: RaycastState
  // Layer visibility
  layerVisibility: {
    geometry: boolean
    raycast: boolean
    grid: boolean
  }
}