import { proxy } from 'valtio'
import type { GameState, ViewportCorners, GeometricObject, ObjectTextureData, GeometricPoint, GeometricLine, GeometricCircle, GeometricRectangle, GeometricDiamond, PixeloidMeshData, StaticMeshData, PixeloidVertexMapping, MeshResolution, PixeloidCoordinate, VertexCoordinate, ScreenCoordinate, ViewportBounds } from '../types'
import { GeometryHelper } from '../game/GeometryHelper'
import { CoordinateCalculations } from '../game/CoordinateCalculations'
import type { InfiniteCanvas } from '../game/InfiniteCanvas'

// Global reference to InfiniteCanvas for direct camera control
let infiniteCanvasRef: InfiniteCanvas | null = null

// ================================
// INFINITE LOOP PREVENTION
// ================================
let isUpdatingCoordinates = false // Prevent cascading updates

// Coordinate helper functions to create properly branded coordinates
const createPixeloidCoordinate = (x: number, y: number): PixeloidCoordinate => ({ __brand: 'pixeloid', x, y })
const createVertexCoordinate = (x: number, y: number): VertexCoordinate => ({ __brand: 'vertex', x, y })
const createScreenCoordinate = (x: number, y: number): ScreenCoordinate => ({ __brand: 'screen', x, y })

// Initialize empty viewport bounds
const createEmptyViewportBounds = (): ViewportBounds => ({
  screen: {
    width: window.innerWidth,
    height: window.innerHeight,
    center: createScreenCoordinate(window.innerWidth / 2, window.innerHeight / 2)
  },
  world: {
    top_left: createPixeloidCoordinate(0, 0),
    bottom_right: createPixeloidCoordinate(100, 100),
    center: createPixeloidCoordinate(50, 50)
  },
  vertex: {
    top_left: createVertexCoordinate(0, 0),
    bottom_right: createVertexCoordinate(10, 10),
    width: 10,
    height: 10
  }
})

// Create the game store using Valtio
export const gameStore = proxy<GameState>({
  isInitialized: false,
  isLoading: true,
  currentScene: 'menu',
  windowWidth: window.innerWidth,
  windowHeight: window.innerHeight,
  
  // ================================
  // CLEAN COORDINATE STATE
  // ================================
  
  camera: {
    world_position: createPixeloidCoordinate(0, 0),
    screen_center: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
    pixeloid_scale: 10,
    viewport_bounds: createEmptyViewportBounds()
  },
  
  mesh: {
    vertex_to_pixeloid_offset: createPixeloidCoordinate(0, 0),
    active_resolution: 1,
    vertex_bounds: {
      width: 100,
      height: 100
    },
    screen_to_vertex_scale: 10
  },
  
  mouse: {
    screen_position: { x: 0, y: 0 },
    vertex_position: { x: 0, y: 0 },
    pixeloid_position: createPixeloidCoordinate(0, 0)
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
        firstPixeloidPos: null,
        currentPixeloidPos: null,
        anchorConfig: null,
        isDrawing: false
      },
      preview: null,
      settings: {
        defaultColor: 0x0066cc,
        defaultStrokeWidth: 1,
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
    // Enhanced anchor configuration for UI control
    anchoring: {
      // Global defaults for new geometry creation
      defaults: {
        point: 'center',       // Points at pixeloid centers
        line: 'top-left',      // Lines use top-left anchoring
        circle: 'top-left',    // Circles use top-left anchoring
        rectangle: 'top-left', // Rectangles use top-left anchoring
        diamond: 'top-left'    // Diamonds use top-left anchoring
      },
      // Per-object anchor overrides (objectId -> anchorConfig)
      objectOverrides: new Map(),
      enablePreComputedAnchors: true  // Enable zoom-stable anchoring
    },
    layerVisibility: {
      background: true,  // Grid and background elements
      geometry: true,    // Geometric shapes and objects
      selection: true,   // Selection highlights
      raycast: true,     // Raycast lines and debug visuals
      bbox: false,       // Bounding box overlay for comparison (off by default)
      mouse: true        // Mouse visualization
    },
    filterEffects: {
      pixelate: false  // Pixeloid-perfect pixelation disabled by default
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
    }
  },
  // Texture registry for StoreExplorer previews (ISOLATED from main rendering)
  textureRegistry: {
    objectTextures: {},
    stats: {
      totalTextures: 0,
      lastCaptureTime: 0
    }
  },
  // Mesh registry for pixeloid mesh system
  meshRegistry: {
    objectMeshes: {},
    meshSettings: {
      samplingMode: 'precise', // Use precise 5-point sampling by default
      maxPixeloidsPerObject: 10000, // Reasonable limit for performance
      enableDebugVisualization: false
    },
    stats: {
      totalMeshes: 0,
      totalPixeloids: 0,
      lastMeshUpdate: 0
    }
  },
  // Static mesh system for transform coherence
  staticMesh: {
    activeMesh: null,
    meshCache: new Map(),
    coordinateMappings: new Map(),
    config: {
      oversizePercent: 20, // Always 20% oversized viewports
      cacheMaxLevels: 7, // Maximum cached mesh levels (1,2,4,8,16,32,64)
      autoSwitchThreshold: 0.5 // Switch when scale changes by 50%
    },
    stats: {
      activeMeshLevel: 1,
      totalCachedMeshes: 0,
      totalCachedMappings: 0,
      lastMeshSwitch: 0,
      coordinateMappingUpdates: 0
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
  
  setLoading: (loading: boolean) => {
    gameStore.isLoading = loading
  },

  // ================================
  // ATOMIC COORDINATE UPDATES (Infinite Loop Prevention)
  // ================================

  // ATOMIC CAMERA UPDATE - Updates all related values in one action
  setCameraPosition: (worldPos: PixeloidCoordinate) => {
    if (isUpdatingCoordinates) return // Prevent infinite loops
    
    isUpdatingCoordinates = true
    try {
      // Update primary value
      gameStore.camera.world_position = worldPos
      
      // Batch update all derived values in one transaction
      const scale = gameStore.camera.pixeloid_scale
      const offset = gameStore.mesh.vertex_to_pixeloid_offset
      const screenSize = { width: gameStore.windowWidth, height: gameStore.windowHeight }
      
      // Recalculate derived values using pure functions (no store dependencies)
      const updatedBounds = CoordinateCalculations.calculateViewportBounds(
        screenSize, scale, worldPos, offset
      )
      const updatedScreenCenter = CoordinateCalculations.pixeloidToScreen(
        worldPos, scale, offset
      )
      
      // Apply all updates atomically
      gameStore.camera.screen_center = { x: updatedScreenCenter.x, y: updatedScreenCenter.y }
      gameStore.camera.viewport_bounds = updatedBounds
      gameStore.mesh.screen_to_vertex_scale = scale
      
    } finally {
      isUpdatingCoordinates = false
    }
  },
  
  // ATOMIC SCALE UPDATE - Updates all scale-dependent values
  setPixeloidScale: (scale: number) => {
    if (isUpdatingCoordinates) return // Prevent infinite loops
    
    // Clamp scale between reasonable values (minimum 1 pixeloid - full zoom out unlocked)
    const clampedScale = Math.max(1, Math.min(100, scale))
    
    isUpdatingCoordinates = true
    try {
      // Update primary value
      gameStore.camera.pixeloid_scale = clampedScale
      
      // Batch update all derived values
      const worldPos = gameStore.camera.world_position
      const offset = gameStore.mesh.vertex_to_pixeloid_offset
      const screenSize = { width: gameStore.windowWidth, height: gameStore.windowHeight }
      
      // Recalculate everything that depends on scale
      const updatedBounds = CoordinateCalculations.calculateViewportBounds(
        screenSize, clampedScale, worldPos, offset
      )
      const updatedScreenCenter = CoordinateCalculations.pixeloidToScreen(
        worldPos, clampedScale, offset
      )
      
      // Apply atomically
      gameStore.camera.screen_center = { x: updatedScreenCenter.x, y: updatedScreenCenter.y }
      gameStore.camera.viewport_bounds = updatedBounds
      gameStore.mesh.screen_to_vertex_scale = clampedScale
      
    } finally {
      isUpdatingCoordinates = false
    }
  },
  
  // ATOMIC OFFSET UPDATE - Updates all offset-dependent values
  setVertexToPixeloidOffset: (offset: PixeloidCoordinate) => {
    if (isUpdatingCoordinates) return // Prevent infinite loops
    
    isUpdatingCoordinates = true
    try {
      // Update primary value
      gameStore.mesh.vertex_to_pixeloid_offset = offset
      
      // Batch update all derived values
      const worldPos = gameStore.camera.world_position
      const scale = gameStore.camera.pixeloid_scale
      const screenSize = { width: gameStore.windowWidth, height: gameStore.windowHeight }
      
      // Recalculate everything that depends on offset
      const updatedBounds = CoordinateCalculations.calculateViewportBounds(
        screenSize, scale, worldPos, offset
      )
      
      // Apply atomically
      gameStore.camera.viewport_bounds = updatedBounds
      
    } finally {
      isUpdatingCoordinates = false
    }
  },
  
  // ATOMIC MOUSE UPDATE - Updates all mouse coordinate systems
  updateMousePositions: (screenPos: { x: number, y: number }) => {
    if (isUpdatingCoordinates) return // Prevent infinite loops
    
    // This is safe because it only updates mouse state, no cascading effects
    const scale = gameStore.camera.pixeloid_scale
    const offset = gameStore.mesh.vertex_to_pixeloid_offset
    
    const vertexPos = CoordinateCalculations.screenToVertex(
      createScreenCoordinate(screenPos.x, screenPos.y),
      scale
    )
    const pixeloidPos = CoordinateCalculations.screenToPixeloid(
      createScreenCoordinate(screenPos.x, screenPos.y),
      scale,
      offset
    )
    
    // Update all mouse positions atomically
    gameStore.mouse.screen_position = screenPos
    gameStore.mouse.vertex_position = { x: vertexPos.x, y: vertexPos.y }
    gameStore.mouse.pixeloid_position = { __brand: 'pixeloid', x: pixeloidPos.x, y: pixeloidPos.y }
  },
  
  // WINDOW RESIZE - Recalculates viewport bounds
  updateWindowSize: (width: number, height: number) => {
    if (isUpdatingCoordinates) return // Prevent infinite loops
    
    isUpdatingCoordinates = true
    try {
      // Update window size
      gameStore.windowWidth = width
      gameStore.windowHeight = height
      
      // Recalculate viewport bounds with new screen size
      const worldPos = gameStore.camera.world_position
      const scale = gameStore.camera.pixeloid_scale
      const offset = gameStore.mesh.vertex_to_pixeloid_offset
      
      const updatedBounds = CoordinateCalculations.calculateViewportBounds(
        { width, height }, scale, worldPos, offset
      )
      
      gameStore.camera.viewport_bounds = updatedBounds
      
    } finally {
      isUpdatingCoordinates = false
    }
  },

  // Input controls
  setKeyState: (key: keyof typeof gameStore.input.keys, pressed: boolean) => {
    gameStore.input.keys[key] = pressed
  },

  // Legacy compatibility methods (will be removed after migration)
  updateMousePosition: (x: number, y: number) => {
    updateGameStore.updateMousePositions({ x, y })
  },

  updateMousePixeloidPosition: (pixeloidX: number, pixeloidY: number) => {
    // Delegate to the new system
    gameStore.mouse.pixeloid_position = createPixeloidCoordinate(pixeloidX, pixeloidY)
  },

  updateMouseVertexPosition: (vertexX: number, vertexY: number) => {
    // Delegate to the new system
    gameStore.mouse.vertex_position = { x: vertexX, y: vertexY }
  },

  // Legacy methods for backward compatibility during migration
  setViewportOffset: (x: number, y: number) => {
    updateGameStore.setVertexToPixeloidOffset(createPixeloidCoordinate(x, y))
  },

  updateViewportOffset: (deltaX: number, deltaY: number) => {
    const currentOffset = gameStore.mesh.vertex_to_pixeloid_offset
    updateGameStore.setVertexToPixeloidOffset(
      createPixeloidCoordinate(currentOffset.x + deltaX, currentOffset.y + deltaY)
    )
  },

  // Geometry controls (Phase 1: Multi-Layer System)
  setDrawingMode: (mode: 'none' | 'point' | 'line' | 'circle' | 'rectangle' | 'diamond') => {
    gameStore.geometry.drawing.mode = mode
    // Clear active drawing when switching modes
    gameStore.geometry.drawing.activeDrawing.type = null
    gameStore.geometry.drawing.activeDrawing.firstPixeloidPos = null
    gameStore.geometry.drawing.activeDrawing.currentPixeloidPos = null
    gameStore.geometry.drawing.activeDrawing.anchorConfig = null
    gameStore.geometry.drawing.activeDrawing.isDrawing = false
    gameStore.geometry.drawing.preview = null
  },

  addGeometricObject: (object: GeometricObject) => {
    // Check for duplicate IDs and generate new one if needed
    const ensuredObject = updateGameStore.ensureUniqueId(object)
    gameStore.geometry.objects.push(ensuredObject)
    
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

  setLayerVisibility: (layer: 'background' | 'geometry' | 'selection' | 'raycast' | 'bbox' | 'mouse', visible: boolean) => {
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

    // Use proper method that handles object setup
    updateGameStore.addGeometricObject(newObject)
    
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
      // Set camera position to center on object
      updateGameStore.setCameraPosition(createPixeloidCoordinate(object.metadata.center.x, object.metadata.center.y))
      console.log(`Store: Centered camera on object ${objectId} at position (${object.metadata.center.x.toFixed(1)}, ${object.metadata.center.y.toFixed(1)})`)
    } else {
      console.warn(`Store: Cannot center on object ${objectId} - object not found or missing metadata`)
    }
  },

  centerViewportOnObject: (objectId: string) => {
    const object = gameStore.geometry.objects.find(obj => obj.id === objectId)
    if (object && object.metadata) {
      // Calculate offset to center object at screen center (compatible with WASD movement)
      const screenCenterX = gameStore.windowWidth / 2 / gameStore.camera.pixeloid_scale
      const screenCenterY = gameStore.windowHeight / 2 / gameStore.camera.pixeloid_scale
      const targetOffset = createPixeloidCoordinate(
        object.metadata.center.x - screenCenterX,
        object.metadata.center.y - screenCenterY
      )
      updateGameStore.setVertexToPixeloidOffset(targetOffset)
      console.log(`Store: Centered viewport on object ${objectId} with offset (${targetOffset.x.toFixed(1)}, ${targetOffset.y.toFixed(1)})`)
    } else {
      console.warn(`Store: Cannot center viewport on object ${objectId} - object not found or missing metadata`)
    }
  },

  setPixelateFilterEnabled: (enabled: boolean) => {
    gameStore.geometry.filterEffects.pixelate = enabled
    console.log(`Store: Pixeloid-perfect pixelate filter ${enabled ? 'enabled' : 'disabled'}`)
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

  // Mesh Registry actions (for pixeloid mesh system)
  setMeshData: (objectId: string, meshData: PixeloidMeshData) => {
    gameStore.meshRegistry.objectMeshes[objectId] = meshData
    gameStore.meshRegistry.stats.totalMeshes = Object.keys(gameStore.meshRegistry.objectMeshes).length
    gameStore.meshRegistry.stats.totalPixeloids = Object.values(gameStore.meshRegistry.objectMeshes)
      .reduce((total, mesh) => total + mesh.pixeloidCount, 0)
    gameStore.meshRegistry.stats.lastMeshUpdate = Date.now()
  },

  removeMeshData: (objectId: string) => {
    delete gameStore.meshRegistry.objectMeshes[objectId]
    gameStore.meshRegistry.stats.totalMeshes = Object.keys(gameStore.meshRegistry.objectMeshes).length
    gameStore.meshRegistry.stats.totalPixeloids = Object.values(gameStore.meshRegistry.objectMeshes)
      .reduce((total, mesh) => total + mesh.pixeloidCount, 0)
  },

  clearAllMeshData: () => {
    gameStore.meshRegistry.objectMeshes = {}
    gameStore.meshRegistry.stats.totalMeshes = 0
    gameStore.meshRegistry.stats.totalPixeloids = 0
  },

  getMeshData: (objectId: string): PixeloidMeshData | undefined => {
    return gameStore.meshRegistry.objectMeshes[objectId]
  },

  hasMeshData: (objectId: string): boolean => {
    return gameStore.meshRegistry.objectMeshes[objectId] !== undefined
  },

  updateMeshSettings: (settings: Partial<typeof gameStore.meshRegistry.meshSettings>) => {
    Object.assign(gameStore.meshRegistry.meshSettings, settings)
  },

  // Mark mesh as invalid (needs regeneration)
  invalidateMesh: (objectId: string) => {
    const meshData = gameStore.meshRegistry.objectMeshes[objectId]
    if (meshData) {
      meshData.isValid = false
    }
  },

  // Mark all meshes as invalid
  invalidateAllMeshes: () => {
    for (const meshData of Object.values(gameStore.meshRegistry.objectMeshes)) {
      meshData.isValid = false
    }
  },

  // Static mesh system actions
  setActiveMesh: (meshData: StaticMeshData) => {
    gameStore.staticMesh.activeMesh = meshData
    gameStore.staticMesh.stats.activeMeshLevel = meshData.resolution.level
    gameStore.staticMesh.stats.lastMeshSwitch = Date.now()
  },

  setCoordinateMapping: (pixeloidScale: number, mapping: PixeloidVertexMapping) => {
    gameStore.staticMesh.coordinateMappings.set(pixeloidScale, mapping)
    gameStore.staticMesh.stats.totalCachedMappings = gameStore.staticMesh.coordinateMappings.size
    gameStore.staticMesh.stats.coordinateMappingUpdates++
  },

  cacheStaticMesh: (level: number, meshData: StaticMeshData) => {
    gameStore.staticMesh.meshCache.set(level, meshData)
    gameStore.staticMesh.stats.totalCachedMeshes = gameStore.staticMesh.meshCache.size
  },

  clearStaticMeshCache: () => {
    gameStore.staticMesh.meshCache.clear()
    gameStore.staticMesh.coordinateMappings.clear()
    gameStore.staticMesh.activeMesh = null
    gameStore.staticMesh.stats.totalCachedMeshes = 0
    gameStore.staticMesh.stats.totalCachedMappings = 0
    gameStore.staticMesh.stats.activeMeshLevel = 1
  },

  updateStaticMeshConfig: (config: Partial<typeof gameStore.staticMesh.config>) => {
    Object.assign(gameStore.staticMesh.config, config)
  },

  getStaticMeshStats: () => {
    return gameStore.staticMesh.stats
  },

  getCurrentCoordinateMapping: (): PixeloidVertexMapping | null => {
    return gameStore.staticMesh.coordinateMappings.get(gameStore.camera.pixeloid_scale) || null
  },

  getCoordinateMappingForScale: (pixeloidScale: number): PixeloidVertexMapping | null => {
    return gameStore.staticMesh.coordinateMappings.get(pixeloidScale) || null
  },

  // ================================
  // UNIFIED ANCHORING SYSTEM
  // ================================

  // Enhanced anchor configuration actions
  getDefaultAnchor: (geometryType: 'point' | 'line' | 'circle' | 'rectangle' | 'diamond') => {
    return gameStore.geometry.anchoring.defaults[geometryType]
  },

  setDefaultAnchor: (geometryType: 'point' | 'line' | 'circle' | 'rectangle' | 'diamond', anchorPoint: any) => {
    gameStore.geometry.anchoring.defaults[geometryType] = anchorPoint
    console.log(`Store: Set default anchor for ${geometryType} to ${anchorPoint}`)
  },

  getObjectAnchor: (objectId: string): any => {
    return gameStore.geometry.anchoring.objectOverrides.get(objectId) || null
  },

  setObjectAnchor: (objectId: string, anchorConfig: any) => {
    gameStore.geometry.anchoring.objectOverrides.set(objectId, anchorConfig)
    console.log(`Store: Set object anchor for ${objectId}:`, anchorConfig)
  },

  clearObjectAnchor: (objectId: string) => {
    gameStore.geometry.anchoring.objectOverrides.delete(objectId)
    console.log(`Store: Cleared object anchor for ${objectId}`)
  },

  // Legacy compatibility methods
  getAnchorConfig: (geometryType: 'point' | 'line' | 'circle' | 'rectangle' | 'diamond') => {
    return updateGameStore.getDefaultAnchor(geometryType)
  },

  setAnchorConfig: (geometryType: 'point' | 'line' | 'circle' | 'rectangle' | 'diamond', snapPoint: any) => {
    updateGameStore.setDefaultAnchor(geometryType, snapPoint)
  },

  // Factory methods with unified anchoring
  createPointWithAnchor: (clickPos: PixeloidCoordinate) => {
    const snapPoint = updateGameStore.getAnchorConfig('point')
    const anchoredPos = GeometryHelper.snapToPixeloidAnchor(clickPos, snapPoint)
    
    const point: GeometricPoint = {
      id: updateGameStore.generateUniqueId('point'),
      x: anchoredPos.x,
      y: anchoredPos.y,
      color: gameStore.geometry.drawing.settings.defaultColor,
      strokeAlpha: gameStore.geometry.drawing.settings.strokeAlpha,
      isVisible: true,
      createdAt: Date.now(),
      metadata: GeometryHelper.calculatePointMetadata({ x: anchoredPos.x, y: anchoredPos.y })
    }
    gameStore.geometry.objects.push(point)
    
    return point
  },

  createLineWithAnchor: (clickPos: PixeloidCoordinate, dragPos: PixeloidCoordinate) => {
    const snapPoint = updateGameStore.getAnchorConfig('line')
    const anchoredStart = GeometryHelper.snapToPixeloidAnchor(clickPos, snapPoint)
    
    const line: GeometricLine = {
      id: updateGameStore.generateUniqueId('line'),
      startX: anchoredStart.x,
      startY: anchoredStart.y,
      endX: dragPos.x,  // End point can be anywhere
      endY: dragPos.y,
      color: gameStore.geometry.drawing.settings.defaultColor,
      strokeWidth: gameStore.geometry.drawing.settings.defaultStrokeWidth,
      strokeAlpha: gameStore.geometry.drawing.settings.strokeAlpha,
      isVisible: true,
      createdAt: Date.now(),
      metadata: GeometryHelper.calculateLineMetadata({
        startX: anchoredStart.x, startY: anchoredStart.y,
        endX: dragPos.x, endY: dragPos.y
      })
    }
    gameStore.geometry.objects.push(line)
    
    return line
  },

  createCircleWithAnchor: (clickPos: PixeloidCoordinate, dragPos: PixeloidCoordinate) => {
    const snapPoint = updateGameStore.getAnchorConfig('circle')
    const anchoredStart = GeometryHelper.snapToPixeloidAnchor(clickPos, snapPoint)
    
    // ISOMETRIC CONSTRAINT: Circle radius derived from width only
    const width = Math.abs(dragPos.x - anchoredStart.x)
    const radius = width / 2
    
    const circle: GeometricCircle = {
      id: updateGameStore.generateUniqueId('circle'),
      centerX: anchoredStart.x + radius,  // Calculate center from anchor
      centerY: anchoredStart.y + radius,
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
      metadata: GeometryHelper.calculateCircleMetadata({
        centerX: anchoredStart.x + radius,
        centerY: anchoredStart.y + radius,
        radius
      })
    }
    gameStore.geometry.objects.push(circle)
    
    return circle
  },

  createRectangleWithAnchor: (clickPos: PixeloidCoordinate, dragPos: PixeloidCoordinate) => {
    const snapPoint = updateGameStore.getAnchorConfig('rectangle')
    const anchoredStart = GeometryHelper.snapToPixeloidAnchor(clickPos, snapPoint)
    
    const width = Math.abs(dragPos.x - anchoredStart.x)
    const height = Math.abs(dragPos.y - anchoredStart.y)
    
    const rectangle: GeometricRectangle = {
      id: updateGameStore.generateUniqueId('rect'),
      x: anchoredStart.x,  // Top-left corner
      y: anchoredStart.y,
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
      metadata: GeometryHelper.calculateRectangleMetadata({
        x: anchoredStart.x, y: anchoredStart.y, width, height
      })
    }
    gameStore.geometry.objects.push(rectangle)
    
    return rectangle
  },

  createDiamondWithAnchor: (clickPos: PixeloidCoordinate, dragPos: PixeloidCoordinate) => {
    const snapPoint = updateGameStore.getAnchorConfig('diamond')
    const anchoredStart = GeometryHelper.snapToPixeloidAnchor(clickPos, snapPoint)
    
    // ISOMETRIC CONSTRAINT: Diamond height derived from width
    const width = Math.abs(dragPos.x - anchoredStart.x)
    const height = width / 4  // Fixed ratio for isometric diamonds
    
    // Calculate west vertex from top-left anchor
    const westX = anchoredStart.x
    const westY = anchoredStart.y + height  // Center Y
    
    const diamond: GeometricDiamond = {
      id: updateGameStore.generateUniqueId('diamond'),
      anchorX: westX,
      anchorY: westY,
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
      metadata: GeometryHelper.calculateDiamondMetadata({
        anchorX: westX, anchorY: westY, width, height
      })
    }
    gameStore.geometry.objects.push(diamond)
    
    return diamond
  }
}

// Listen for window resize events
window.addEventListener('resize', () => {
  updateGameStore.updateWindowSize(window.innerWidth, window.innerHeight)
})

// ================================
// COORDINATE HELPER EXPORTS FOR OTHER FILES
// ================================

export { createPixeloidCoordinate, createVertexCoordinate, createScreenCoordinate }