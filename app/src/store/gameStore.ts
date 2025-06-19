import { proxy } from 'valtio'
import type { GameState, ViewportCorners, GeometricObject } from '../types'

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
    pixeloidScale: 10, // Start with 10 pixels per pixeloid
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
  },
  // Geometry system state (Phase 1: Multi-Layer System)
  geometry: {
    objects: [],
    drawing: {
      mode: 'none',
      activeDrawing: {
        type: null,
        startPoint: null,
        currentPoint: null,
        isDrawing: false
      },
      settings: {
        defaultColor: 0x0066cc,
        defaultStrokeWidth: 2,
        defaultFillColor: 0x99ccff
      }
    },
    raycast: {
      activeRaycasts: [],
      settings: {
        maxDistance: 100,
        visualizationColor: 0xff6600,
        showSteps: true,
        stepColor: 0xffaa66
      }
    },
    layerVisibility: {
      geometry: true,
      raycast: true,
      grid: true
    },
    selection: {
      selectedObjectId: null,
      isEditPanelOpen: false
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
    // Clamp scale between reasonable values (minimum 2 pixeloids)
    gameStore.camera.pixeloidScale = Math.max(2, Math.min(100, scale))
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
  },

  // Geometry controls (Phase 1: Multi-Layer System)
  setDrawingMode: (mode: 'none' | 'point' | 'line' | 'circle' | 'rectangle' | 'diamond') => {
    gameStore.geometry.drawing.mode = mode
    // Clear active drawing when switching modes
    gameStore.geometry.drawing.activeDrawing.type = null
    gameStore.geometry.drawing.activeDrawing.startPoint = null
    gameStore.geometry.drawing.activeDrawing.currentPoint = null
    gameStore.geometry.drawing.activeDrawing.isDrawing = false
  },

  addGeometricObject: (object: GeometricObject) => {
    gameStore.geometry.objects.push(object)
  },

  removeGeometricObject: (id: string) => {
    const index = gameStore.geometry.objects.findIndex(obj => obj.id === id)
    if (index !== -1) {
      gameStore.geometry.objects.splice(index, 1)
    }
  },

  clearAllGeometricObjects: () => {
    gameStore.geometry.objects.length = 0
  },

  updateGeometricObjectVisibility: (id: string, isVisible: boolean) => {
    const object = gameStore.geometry.objects.find(obj => obj.id === id)
    if (object) {
      object.isVisible = isVisible
    }
  },

  setLayerVisibility: (layer: 'geometry' | 'raycast' | 'grid', visible: boolean) => {
    gameStore.geometry.layerVisibility[layer] = visible
  },

  setDrawingSettings: (settings: Partial<typeof gameStore.geometry.drawing.settings>) => {
    Object.assign(gameStore.geometry.drawing.settings, settings)
  },

  setRaycastSettings: (settings: Partial<typeof gameStore.geometry.raycast.settings>) => {
    Object.assign(gameStore.geometry.raycast.settings, settings)
  },

  // Selection controls
  setSelectedObject: (objectId: string | null) => {
    gameStore.geometry.selection.selectedObjectId = objectId
  },

  setEditPanelOpen: (open: boolean) => {
    gameStore.geometry.selection.isEditPanelOpen = open
  },

  clearSelection: () => {
    gameStore.geometry.selection.selectedObjectId = null
    gameStore.geometry.selection.isEditPanelOpen = false
  }
}

// Listen for window resize events
window.addEventListener('resize', () => {
  updateGameStore.updateWindowSize(window.innerWidth, window.innerHeight)
})