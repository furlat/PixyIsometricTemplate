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