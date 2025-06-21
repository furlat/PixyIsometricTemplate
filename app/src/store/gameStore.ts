import { proxy } from 'valtio'
import type { GameState, ViewportCorners, GeometricObject, ObjectTextureData, GeometricPoint, GeometricLine, GeometricCircle, GeometricRectangle, GeometricDiamond } from '../types'
import { GeometryHelper } from '../game/GeometryHelper'
import type { InfiniteCanvas } from '../game/InfiniteCanvas'

// Global reference to InfiniteCanvas for direct camera control
let infiniteCanvasRef: InfiniteCanvas | null = null

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
        defaultFillColor: 0x99ccff,
        fillEnabled: false,
        fillAlpha: 0.5,
        strokeAlpha: 1.0
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
      background: true,  // Grid and background elements
      geometry: true,    // Geometric shapes and objects
      selection: true,   // Selection highlights
      raycast: true,     // Raycast lines and debug visuals
      mask: false,       // Pixeloid mask layer for collision/spatial analysis (off by default)
      mouse: true        // Mouse visualization
    },
    selection: {
      selectedObjectId: null,
      isEditPanelOpen: false
    },
    clipboard: {
      copiedObject: null
    },
    favorites: {
      favoriteObjectIds: []
    },
    // Mask layer state for GPU-based spatial analysis
    mask: {
      enabledObjects: new Set<string>(), // Objects contributing to mask
      mode: 'boundingBox' as 'boundingBox' | 'precise', // boundingBox = use metadata bounds, precise = use shape geometry
      visualSettings: {
        fillColor: 0x000000,     // Black mask
        fillAlpha: 0.3,          // Semi-transparent overlay
        strokeColor: 0xff0000,   // Red outline for debugging
        strokeAlpha: 0.5,        // Semi-transparent outline
        strokeWidth: 0.1         // Thin outline
      }
    }
  },
  // Texture registry for StoreExplorer previews (ISOLATED from main rendering)
  textureRegistry: {
    objectTextures: {},
    stats: {
      totalTextures: 0,
      lastCaptureTime: 0
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
    // Clamp scale between reasonable values (minimum 1 pixeloid - full zoom out unlocked)
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
    // Check for duplicate IDs and generate new one if needed
    const ensuredObject = updateGameStore.ensureUniqueId(object)
    gameStore.geometry.objects.push(ensuredObject)
    
    // Auto-enable new objects in mask layer for immediate visibility
    gameStore.geometry.mask.enabledObjects.add(ensuredObject.id)
  },

  // Ensure unique ID for objects (handles copying and duplicate prevention)
  ensureUniqueId: <T extends GeometricObject>(object: T): T => {
    const existingIds = new Set(gameStore.geometry.objects.map(obj => obj.id))
    
    if (!existingIds.has(object.id)) {
      return object // ID is unique, return as-is
    }
    
    // Generate new unique ID for duplicate
    let newId: string
    let counter = 1
    const baseId = object.id.replace(/_copy\d*$/, '') // Remove existing copy suffix
    
    do {
      newId = `${baseId}_copy${counter}`
      counter++
    } while (existingIds.has(newId))
    
    console.log(`Store: Duplicate ID detected for ${object.id}, assigning new ID: ${newId}`)
    return { ...object, id: newId }
  },

  // Generate truly unique ID for objects
  generateUniqueId: (prefix: string): string => {
    const existingIds = new Set(gameStore.geometry.objects.map(obj => obj.id))
    let id: string
    let counter = 0
    
    do {
      const timestamp = Date.now()
      const randomSuffix = Math.random().toString(36).substr(2, 5)
      id = counter === 0 ? `${prefix}_${timestamp}_${randomSuffix}` : `${prefix}_${timestamp}_${randomSuffix}_${counter}`
      counter++
    } while (existingIds.has(id))
    
    return id
  },

  // Factory methods for creating objects with proper metadata
  createPoint: (x: number, y: number) => {
    const point: GeometricPoint = {
      id: updateGameStore.generateUniqueId('point'),
      x,
      y,
      color: gameStore.geometry.drawing.settings.defaultColor,
      strokeAlpha: gameStore.geometry.drawing.settings.strokeAlpha,
      isVisible: true,
      createdAt: Date.now(),
      metadata: GeometryHelper.calculatePointMetadata({ x, y })
    }
    gameStore.geometry.objects.push(point)
    // Auto-enable in mask layer
    gameStore.geometry.mask.enabledObjects.add(point.id)
    return point
  },

  createLine: (startX: number, startY: number, endX: number, endY: number) => {
    const line: GeometricLine = {
      id: updateGameStore.generateUniqueId('line'),
      startX,
      startY,
      endX,
      endY,
      color: gameStore.geometry.drawing.settings.defaultColor,
      strokeWidth: gameStore.geometry.drawing.settings.defaultStrokeWidth,
      strokeAlpha: gameStore.geometry.drawing.settings.strokeAlpha,
      isVisible: true,
      createdAt: Date.now(),
      metadata: GeometryHelper.calculateLineMetadata({ startX, startY, endX, endY })
    }
    gameStore.geometry.objects.push(line)
    // Auto-enable in mask layer
    gameStore.geometry.mask.enabledObjects.add(line.id)
    return line
  },

  createCircle: (centerX: number, centerY: number, radius: number) => {
    const circle: GeometricCircle = {
      id: updateGameStore.generateUniqueId('circle'),
      centerX,
      centerY,
      radius,
      color: gameStore.geometry.drawing.settings.defaultColor,
      strokeWidth: gameStore.geometry.drawing.settings.defaultStrokeWidth,
      strokeAlpha: gameStore.geometry.drawing.settings.strokeAlpha,
      ...(gameStore.geometry.drawing.settings.fillEnabled && {
        fillColor: gameStore.geometry.drawing.settings.defaultFillColor,
        fillAlpha: gameStore.geometry.drawing.settings.fillAlpha
      }),
      isVisible: true,
      createdAt: Date.now(),
      metadata: GeometryHelper.calculateCircleMetadata({ centerX, centerY, radius })
    }
    gameStore.geometry.objects.push(circle)
    // Auto-enable in mask layer
    gameStore.geometry.mask.enabledObjects.add(circle.id)
    return circle
  },

  createRectangle: (x: number, y: number, width: number, height: number) => {
    const rectangle: GeometricRectangle = {
      id: updateGameStore.generateUniqueId('rect'),
      x,
      y,
      width,
      height,
      color: gameStore.geometry.drawing.settings.defaultColor,
      strokeWidth: gameStore.geometry.drawing.settings.defaultStrokeWidth,
      strokeAlpha: gameStore.geometry.drawing.settings.strokeAlpha,
      ...(gameStore.geometry.drawing.settings.fillEnabled && {
        fillColor: gameStore.geometry.drawing.settings.defaultFillColor,
        fillAlpha: gameStore.geometry.drawing.settings.fillAlpha
      }),
      isVisible: true,
      createdAt: Date.now(),
      metadata: GeometryHelper.calculateRectangleMetadata({ x, y, width, height })
    }
    gameStore.geometry.objects.push(rectangle)
    // Auto-enable in mask layer
    gameStore.geometry.mask.enabledObjects.add(rectangle.id)
    return rectangle
  },

  createDiamond: (anchorX: number, anchorY: number, width: number, height: number) => {
    const diamond: GeometricDiamond = {
      id: updateGameStore.generateUniqueId('diamond'),
      anchorX,
      anchorY,
      width,
      height,
      color: gameStore.geometry.drawing.settings.defaultColor,
      strokeWidth: gameStore.geometry.drawing.settings.defaultStrokeWidth,
      strokeAlpha: gameStore.geometry.drawing.settings.strokeAlpha,
      ...(gameStore.geometry.drawing.settings.fillEnabled && {
        fillColor: gameStore.geometry.drawing.settings.defaultFillColor,
        fillAlpha: gameStore.geometry.drawing.settings.fillAlpha
      }),
      isVisible: true,
      createdAt: Date.now(),
      metadata: GeometryHelper.calculateDiamondMetadata({ anchorX, anchorY, width, height })
    }
    gameStore.geometry.objects.push(diamond)
    // Auto-enable in mask layer
    gameStore.geometry.mask.enabledObjects.add(diamond.id)
    return diamond
  },

  removeGeometricObject: (id: string) => {
    const index = gameStore.geometry.objects.findIndex(obj => obj.id === id)
    if (index !== -1) {
      gameStore.geometry.objects.splice(index, 1)
      // Remove texture when object is deleted
      updateGameStore.removeObjectTexture(id)
    }
  },

  updateGeometricObject: (id: string, updates: Partial<GeometricObject>) => {
    const object = gameStore.geometry.objects.find(obj => obj.id === id)
    if (object) {
      // Apply updates
      Object.assign(object, updates)
      
      // Recalculate metadata if geometry properties changed
      if ('x' in updates || 'y' in updates || 'width' in updates || 'height' in updates ||
          'centerX' in updates || 'centerY' in updates || 'radius' in updates ||
          'startX' in updates || 'startY' in updates || 'endX' in updates || 'endY' in updates ||
          'anchorX' in updates || 'anchorY' in updates) {
        
        if ('anchorX' in object && 'anchorY' in object) {
          object.metadata = GeometryHelper.calculateDiamondMetadata(object as any)
        } else if ('centerX' in object && 'centerY' in object) {
          object.metadata = GeometryHelper.calculateCircleMetadata(object as any)
        } else if ('x' in object && 'width' in object) {
          object.metadata = GeometryHelper.calculateRectangleMetadata(object as any)
        } else if ('startX' in object && 'endX' in object) {
          object.metadata = GeometryHelper.calculateLineMetadata(object as any)
        } else if ('x' in object && 'y' in object) {
          object.metadata = GeometryHelper.calculatePointMetadata(object as any)
        }
      }
      
      // Invalidate texture cache when visual properties change
      if ('color' in updates || 'strokeWidth' in updates || 'fillColor' in updates ||
          'x' in updates || 'y' in updates || 'width' in updates || 'height' in updates ||
          'centerX' in updates || 'centerY' in updates || 'radius' in updates ||
          'startX' in updates || 'startY' in updates || 'endX' in updates || 'endY' in updates ||
          'anchorX' in updates || 'anchorY' in updates) {
        
        // Remove cached texture to force regeneration
        updateGameStore.removeObjectTexture(id)
        console.log(`Store: Invalidated texture cache for object ${id} due to property changes`)
      }
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

  setLayerVisibility: (layer: 'background' | 'geometry' | 'selection' | 'raycast' | 'mask' | 'mouse', visible: boolean) => {
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
    
    // Automatically set drawing mode to 'none' when selecting an object
    // This prevents accidental object creation when clicking while something is selected
    if (objectId !== null) {
      updateGameStore.setDrawingMode('none')
      console.log(`Store: Set drawing mode to 'none' due to object selection: ${objectId}`)
    }
  },

  setEditPanelOpen: (open: boolean) => {
    gameStore.geometry.selection.isEditPanelOpen = open
  },

  clearSelection: () => {
    gameStore.geometry.selection.selectedObjectId = null
    gameStore.geometry.selection.isEditPanelOpen = false
  },

  // Clipboard operations
  copySelectedObject: () => {
    const selectedObjectId = gameStore.geometry.selection.selectedObjectId
    if (!selectedObjectId) {
      console.warn('Store: No object selected to copy')
      return false
    }

    const selectedObject = gameStore.geometry.objects.find(obj => obj.id === selectedObjectId)
    if (!selectedObject) {
      console.warn(`Store: Selected object ${selectedObjectId} not found`)
      return false
    }

    // Create a deep copy of the object
    gameStore.geometry.clipboard.copiedObject = { ...selectedObject }
    console.log(`Store: Copied object ${selectedObjectId} to clipboard`)
    return true
  },

  pasteObjectAtPosition: (pixeloidX: number, pixeloidY: number) => {
    if (!gameStore.geometry.clipboard.copiedObject) {
      console.warn('Store: No object in clipboard to paste')
      return null
    }

    const copiedObject = gameStore.geometry.clipboard.copiedObject
    
    // Create new object with unique ID and position it at the specified location
    const newObject = updateGameStore.ensureUniqueId({ ...copiedObject })
    
    // Position the new object based on its type
    if ('anchorX' in newObject && 'anchorY' in newObject) {
      // Diamond - position anchor at mouse
      newObject.anchorX = pixeloidX
      newObject.anchorY = pixeloidY
    } else if ('centerX' in newObject && 'centerY' in newObject) {
      // Circle - position center at mouse
      newObject.centerX = pixeloidX
      newObject.centerY = pixeloidY
    } else if ('x' in newObject && 'width' in newObject) {
      // Rectangle - position top-left at mouse
      newObject.x = pixeloidX
      newObject.y = pixeloidY
    } else if ('startX' in newObject && 'endX' in newObject) {
      // Line - calculate offset and move both points
      const line = newObject as GeometricLine
      const originalLine = copiedObject as GeometricLine
      const originalCenterX = (originalLine.startX + originalLine.endX) / 2
      const originalCenterY = (originalLine.startY + originalLine.endY) / 2
      const offsetX = pixeloidX - originalCenterX
      const offsetY = pixeloidY - originalCenterY
      
      line.startX = originalLine.startX + offsetX
      line.startY = originalLine.startY + offsetY
      line.endX = originalLine.endX + offsetX
      line.endY = originalLine.endY + offsetY
    } else if ('x' in newObject && 'y' in newObject) {
      // Point - position at mouse
      newObject.x = pixeloidX
      newObject.y = pixeloidY
    }

    // Update metadata and creation time
    newObject.createdAt = Date.now()
    
    // Recalculate metadata based on new position
    if ('anchorX' in newObject) {
      newObject.metadata = GeometryHelper.calculateDiamondMetadata(newObject as any)
    } else if ('centerX' in newObject) {
      newObject.metadata = GeometryHelper.calculateCircleMetadata(newObject as any)
    } else if ('x' in newObject && 'width' in newObject) {
      newObject.metadata = GeometryHelper.calculateRectangleMetadata(newObject as any)
    } else if ('startX' in newObject) {
      newObject.metadata = GeometryHelper.calculateLineMetadata(newObject as any)
    } else if ('x' in newObject && 'y' in newObject) {
      newObject.metadata = GeometryHelper.calculatePointMetadata(newObject as any)
    }

    // Add to objects array
    gameStore.geometry.objects.push(newObject)
    
    // Select the new object
    updateGameStore.setSelectedObject(newObject.id)
    
    console.log(`Store: Pasted object as ${newObject.id} at (${pixeloidX.toFixed(1)}, ${pixeloidY.toFixed(1)})`)
    return newObject
  },

  clearClipboard: () => {
    gameStore.geometry.clipboard.copiedObject = null
    console.log('Store: Cleared clipboard')
  },

  // Favorites operations
  addToFavorites: (objectId: string) => {
    if (!gameStore.geometry.favorites.favoriteObjectIds.includes(objectId)) {
      gameStore.geometry.favorites.favoriteObjectIds.push(objectId)
      console.log(`Store: Added object ${objectId} to favorites`)
      return true
    }
    return false
  },

  removeFromFavorites: (objectId: string) => {
    const index = gameStore.geometry.favorites.favoriteObjectIds.indexOf(objectId)
    if (index !== -1) {
      gameStore.geometry.favorites.favoriteObjectIds.splice(index, 1)
      console.log(`Store: Removed object ${objectId} from favorites`)
      return true
    }
    return false
  },

  toggleFavorite: (objectId: string) => {
    if (gameStore.geometry.favorites.favoriteObjectIds.includes(objectId)) {
      return updateGameStore.removeFromFavorites(objectId)
    } else {
      return updateGameStore.addToFavorites(objectId)
    }
  },

  isFavorite: (objectId: string): boolean => {
    return gameStore.geometry.favorites.favoriteObjectIds.includes(objectId)
  },

  // Set reference to InfiniteCanvas for direct camera control
  setInfiniteCanvasRef: (canvas: InfiniteCanvas) => {
    infiniteCanvasRef = canvas
    console.log('Store: InfiniteCanvas reference set for direct camera control')
  },

  centerCameraOnObject: (objectId: string) => {
    const object = gameStore.geometry.objects.find(obj => obj.id === objectId)
    if (object && object.metadata) {
      if (infiniteCanvasRef) {
        // Use direct camera movement to avoid store update loops
        infiniteCanvasRef.moveCameraToPosition(object.metadata.center.x, object.metadata.center.y)
        console.log(`Store: Centered camera on object ${objectId} at (${object.metadata.center.x.toFixed(1)}, ${object.metadata.center.y.toFixed(1)}) via direct movement`)
      } else {
        // Fallback to store update if no canvas reference
        updateGameStore.setCameraPosition(object.metadata.center.x, object.metadata.center.y)
        console.warn(`Store: Used fallback camera positioning for object ${objectId} - no InfiniteCanvas reference`)
      }
    } else {
      console.warn(`Store: Cannot center on object ${objectId} - object not found or missing metadata`)
    }
  },

  // Texture Registry actions (WRITE-ONLY from rendering perspective)
  setObjectTexture: (objectId: string, textureData: ObjectTextureData) => {
    gameStore.textureRegistry.objectTextures[objectId] = textureData
    gameStore.textureRegistry.stats.totalTextures = Object.keys(gameStore.textureRegistry.objectTextures).length
    gameStore.textureRegistry.stats.lastCaptureTime = Date.now()
  },

  removeObjectTexture: (objectId: string) => {
    delete gameStore.textureRegistry.objectTextures[objectId]
    gameStore.textureRegistry.stats.totalTextures = Object.keys(gameStore.textureRegistry.objectTextures).length
  },

  clearTextureCache: () => {
    gameStore.textureRegistry.objectTextures = {}
    gameStore.textureRegistry.stats.totalTextures = 0
  },

  getObjectTexture: (objectId: string): ObjectTextureData | undefined => {
    return gameStore.textureRegistry.objectTextures[objectId]
  },

  hasObjectTexture: (objectId: string): boolean => {
    return gameStore.textureRegistry.objectTextures[objectId] !== undefined
  },

  // Mask layer controls
  enableObjectInMask: (objectId: string) => {
    gameStore.geometry.mask.enabledObjects.add(objectId)
  },

  disableObjectInMask: (objectId: string) => {
    gameStore.geometry.mask.enabledObjects.delete(objectId)
  },

  toggleObjectInMask: (objectId: string) => {
    if (gameStore.geometry.mask.enabledObjects.has(objectId)) {
      gameStore.geometry.mask.enabledObjects.delete(objectId)
    } else {
      gameStore.geometry.mask.enabledObjects.add(objectId)
    }
  },

  enableAllObjectsInMask: () => {
    gameStore.geometry.objects.forEach(obj => {
      gameStore.geometry.mask.enabledObjects.add(obj.id)
    })
    console.log(`Store: Enabled ${gameStore.geometry.objects.length} objects in mask layer`)
  },

  disableAllObjectsInMask: () => {
    gameStore.geometry.mask.enabledObjects.clear()
  },

  setMaskMode: (mode: 'boundingBox' | 'precise') => {
    gameStore.geometry.mask.mode = mode
  },

  updateMaskVisualSettings: (settings: Partial<typeof gameStore.geometry.mask.visualSettings>) => {
    Object.assign(gameStore.geometry.mask.visualSettings, settings)
  }
}

// Listen for window resize events
window.addEventListener('resize', () => {
  updateGameStore.updateWindowSize(window.innerWidth, window.innerHeight)
})