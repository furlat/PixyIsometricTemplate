import { proxy } from 'valtio'

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

// Create the game store using Valtio
export const gameStore = proxy<GameState>({
  isInitialized: false,
  isLoading: true,
  currentScene: 'menu',
  windowWidth: window.innerWidth,
  windowHeight: window.innerHeight,
  mousePosition: {
    x: 0,
    y: 0
  },
  mousePixeloidPosition: {
    x: 0,
    y: 0
  },
  camera: {
    position: { x: 0, y: 0 },
    pixeloidScale: 10, // Start with 10 pixels per pixeloid (minimum)
    viewportCorners: {
      topLeft: { x: 0, y: 0 },
      topRight: { x: 0, y: 0 },
      bottomLeft: { x: 0, y: 0 },
      bottomRight: { x: 0, y: 0 }
    }
  },
  input: {
    keys: {
      w: false,
      a: false,
      s: false,
      d: false,
      space: false
    }
  }
})

// Helper functions to update the store
export const updateGameStore = {
  setGameInitialized: (initialized: boolean) => {
    gameStore.isInitialized = initialized
    if (initialized) {
      gameStore.isLoading = false
    }
  },
  
  setCurrentScene: (scene: string) => {
    gameStore.currentScene = scene
  },
  
  updateWindowSize: (width: number, height: number) => {
    gameStore.windowWidth = width
    gameStore.windowHeight = height
  },
  
  setLoading: (loading: boolean) => {
    gameStore.isLoading = loading
  },

  // Camera controls
  setCameraPosition: (x: number, y: number) => {
    gameStore.camera.position.x = x
    gameStore.camera.position.y = y
  },

  setPixeloidScale: (scale: number) => {
    // Clamp scale between reasonable values
    gameStore.camera.pixeloidScale = Math.max(1, Math.min(100, scale))
  },

  updateViewportCorners: (corners: ViewportCorners) => {
    gameStore.camera.viewportCorners = corners
  },

  // Input controls
  setKeyState: (key: keyof typeof gameStore.input.keys, pressed: boolean) => {
    gameStore.input.keys[key] = pressed
  },

  // Mouse position (called from input events, not during rendering)
  updateMousePosition: (x: number, y: number) => {
    gameStore.mousePosition.x = x
    gameStore.mousePosition.y = y
  },

  // Mouse position in pixeloid coordinates
  updateMousePixeloidPosition: (pixeloidX: number, pixeloidY: number) => {
    gameStore.mousePixeloidPosition.x = pixeloidX
    gameStore.mousePixeloidPosition.y = pixeloidY
  }
}

// Listen for window resize events
window.addEventListener('resize', () => {
  updateGameStore.updateWindowSize(window.innerWidth, window.innerHeight)
})