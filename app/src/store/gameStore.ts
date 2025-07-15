import { proxy } from 'valtio'
import type { GameState, GeometricObject, ObjectTextureData, GeometricPoint, GeometricLine, GeometricCircle, GeometricRectangle, GeometricDiamond, PixeloidMeshData, StaticMeshData, PixeloidVertexMapping, PixeloidCoordinate, VertexCoordinate, ScreenCoordinate, ViewportBounds } from '../types'
import { GeometryHelper } from '../game/GeometryHelper'
import { CoordinateCalculations } from '../game/CoordinateCalculations'
import type { InfiniteCanvas } from '../game/InfiniteCanvas'

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
  // ECS CAMERA VIEWPORT ARCHITECTURE
  // ================================
  
  cameraViewport: {
    // Mirror layer camera viewport position (for zoom 2+)
    viewport_position: createPixeloidCoordinate(0, 0),
    
    // Geometry layer sampling window position (for zoom 1)
    geometry_sampling_position: createPixeloidCoordinate(0, 0),
    
    // Integer zoom factors for pixel-perfect alignment
    zoom_factor: 10,  // Start at 10 to match current behavior
    
    // Fixed geometry layer bounds (expands as needed)
    geometry_layer_bounds: {
      width: 200,
      height: 200,
      minX: -100,
      maxX: 100,
      minY: -100,
      maxY: 100
    },
    
    // Geometry layer always renders at scale 1
    geometry_layer_scale: 1,
    
    // Camera movement state
    is_panning: false,
    pan_start_position: createPixeloidCoordinate(0, 0)
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
      mirror: false,     // Mirror layer for cached texture sprites (off by default)
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
    },
    // Scale tracking for OOM prevention
    scaleTracking: {
      minCreationScale: null,
      maxCreationScale: null,
      SCALE_SPAN_LIMIT: 12  // 12x maximum span between min and max creation scales
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

  // ECS Camera Viewport Methods
  setCameraViewportPosition: (position: PixeloidCoordinate) => {
    gameStore.cameraViewport.viewport_position = position
  },
  
  setGeometrySamplingPosition: (position: PixeloidCoordinate) => {
    gameStore.cameraViewport.geometry_sampling_position = position
  },
  
  setCameraViewportZoom: (zoomFactor: number) => {
    // Validate integer zoom factors
    const validZooms = [1, 2, 4, 8, 16, 32, 64, 128]
    const clampedZoom = validZooms.reduce((prev, curr) => 
      Math.abs(curr - zoomFactor) < Math.abs(prev - zoomFactor) ? curr : prev
    )
    gameStore.cameraViewport.zoom_factor = clampedZoom
  },
  
  // WASD movement router based on zoom
  updateMovementECS: (deltaX: number, deltaY: number) => {
    const zoomFactor = gameStore.cameraViewport.zoom_factor
    
    if (zoomFactor === 1) {
      // Zoom 1: Move geometry sampling window
      const currentPos = gameStore.cameraViewport.geometry_sampling_position
      updateGameStore.setGeometrySamplingPosition(
        createPixeloidCoordinate(currentPos.x + deltaX, currentPos.y + deltaY)
      )
    } else {
      // Zoom 2+: Move mirror viewport
      const currentPos = gameStore.cameraViewport.viewport_position
      updateGameStore.setCameraViewportPosition(
        createPixeloidCoordinate(currentPos.x + deltaX, currentPos.y + deltaY)
      )
    }
  },
  
  
  
  // ECS Mouse position update
  updateMousePositions: (screenPos: { x: number, y: number }) => {
    const scale = gameStore.cameraViewport.zoom_factor
    
    const vertexPos = CoordinateCalculations.screenToVertex(
      createScreenCoordinate(screenPos.x, screenPos.y),
      scale
    )
    
    // For ECS, pixeloid position depends on which layer we're sampling
    let pixeloidPos: PixeloidCoordinate
    if (scale === 1) {
      // Zoom 1: Use geometry sampling position as offset
      const offset = gameStore.cameraViewport.geometry_sampling_position
      pixeloidPos = CoordinateCalculations.vertexToPixeloid(vertexPos, offset)
    } else {
      // Zoom 2+: Use viewport position as offset
      const offset = gameStore.cameraViewport.viewport_position
      pixeloidPos = CoordinateCalculations.vertexToPixeloid(vertexPos, offset)
    }
    
    gameStore.mouse.screen_position = screenPos
    gameStore.mouse.vertex_position = { x: vertexPos.x, y: vertexPos.y }
    gameStore.mouse.pixeloid_position = pixeloidPos
  },
  
  // ECS Window resize
  updateWindowSize: (width: number, height: number) => {
    gameStore.windowWidth = width
    gameStore.windowHeight = height
  },

  // Input controls
  setKeyState: (key: keyof typeof gameStore.input.keys, pressed: boolean) => {
    gameStore.input.keys[key] = pressed
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
    
    // Ensure metadata exists
    if (!ensuredObject.metadata) {
      // Calculate metadata based on object type
      if ('anchorX' in ensuredObject && 'anchorY' in ensuredObject) {
        ensuredObject.metadata = GeometryHelper.calculateDiamondMetadata(ensuredObject as any)
      } else if ('centerX' in ensuredObject && 'centerY' in ensuredObject) {
        ensuredObject.metadata = GeometryHelper.calculateCircleMetadata(ensuredObject as any)
      } else if ('x' in ensuredObject && 'width' in ensuredObject) {
        ensuredObject.metadata = GeometryHelper.calculateRectangleMetadata(ensuredObject as any)
      } else if ('startX' in ensuredObject && 'endX' in ensuredObject) {
        ensuredObject.metadata = GeometryHelper.calculateLineMetadata(ensuredObject as any)
      } else if ('x' in ensuredObject && 'y' in ensuredObject) {
        ensuredObject.metadata = GeometryHelper.calculatePointMetadata(ensuredObject as any)
      }
    }
    
    // Initialize visibility cache if not present
    if (ensuredObject.metadata && !ensuredObject.metadata.visibilityCache) {
      const currentScale = gameStore.cameraViewport.zoom_factor
      const visibilityInfo = GeometryHelper.calculateVisibilityState(ensuredObject, currentScale)
      
      ensuredObject.metadata.visibilityCache = new Map()
      ensuredObject.metadata.visibilityCache.set(currentScale, {
        visibility: visibilityInfo.visibility,
        onScreenBounds: visibilityInfo.onScreenBounds
      })
    }
    
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

  // Helper to update min/max creation scales
  updateCreationScaleTracking: (newScale: number) => {
    const tracking = gameStore.geometry.scaleTracking
    
    if (tracking.minCreationScale === null || newScale < tracking.minCreationScale) {
      tracking.minCreationScale = newScale
    }
    
    if (tracking.maxCreationScale === null || newScale > tracking.maxCreationScale) {
      tracking.maxCreationScale = newScale
    }
    
    console.log(`Store: Updated scale tracking - min: ${tracking.minCreationScale}, max: ${tracking.maxCreationScale}`)
  },

  // Helper to recalculate min/max scales from all objects
  recalculateScaleTracking: () => {
    let min: number | null = null
    let max: number | null = null
    
    for (const obj of gameStore.geometry.objects) {
      if (obj.metadata?.createdAtScale) {
        if (min === null || obj.metadata.createdAtScale < min) {
          min = obj.metadata.createdAtScale
        }
        if (max === null || obj.metadata.createdAtScale > max) {
          max = obj.metadata.createdAtScale
        }
      }
    }
    
    gameStore.geometry.scaleTracking.minCreationScale = min
    gameStore.geometry.scaleTracking.maxCreationScale = max
    
    console.log(`Store: Recalculated scale tracking - min: ${min}, max: ${max}`)
  },

  /**
   * Check if zoom to a scale is allowed based on scale tracking.
   *
   * Simple 16x span limit: objects track their FIRST creation scale only.
   * - minAllowed = maxCreationScale / 16 (but >= 1)
   * - maxAllowed = minCreationScale * 16 (but <= 100)
   * - If no objects exist, allow full range 1-100
   */
  canZoomToScale: (targetScale: number): { allowed: boolean, reason?: string } => {
    const tracking = gameStore.geometry.scaleTracking
    
    // No objects yet, allow any scale 1-100
    if (tracking.minCreationScale === null || tracking.maxCreationScale === null) {
      return { allowed: true }
    }
    
    // Simple 16x span calculation
    const minAllowed = Math.max(1, tracking.maxCreationScale / tracking.SCALE_SPAN_LIMIT)
    const maxAllowed = Math.min(100, tracking.minCreationScale * tracking.SCALE_SPAN_LIMIT)
    
    if (targetScale < minAllowed) {
      return {
        allowed: false,
        reason: `Zoom out blocked. Objects exist at scale ${tracking.maxCreationScale}. Minimum allowed scale is ${minAllowed.toFixed(0)}.`
      }
    }
    
    if (targetScale > maxAllowed) {
      return {
        allowed: false,
        reason: `Zoom in blocked. Objects exist at scale ${tracking.minCreationScale}. Maximum allowed scale is ${maxAllowed.toFixed(0)}.`
      }
    }
    
    return { allowed: true }
  },

  // Factory methods for creating objects with proper metadata
  createPoint: (x: number, y: number) => {
    const currentScale = gameStore.cameraViewport.zoom_factor
    const metadata = GeometryHelper.calculatePointMetadata({ x, y })
    metadata.createdAtScale = currentScale
    
    const point: GeometricPoint = {
      id: updateGameStore.generateUniqueId('point'),
      x,
      y,
      color: gameStore.geometry.drawing.settings.defaultColor,
      strokeAlpha: gameStore.geometry.drawing.settings.strokeAlpha,
      isVisible: true,
      createdAt: Date.now(),
      metadata
    }
    
    // Initialize visibility cache
    const visibilityInfo = GeometryHelper.calculateVisibilityState(point, currentScale)
    
    point.metadata!.visibilityCache = new Map()
    point.metadata!.visibilityCache.set(currentScale, {
      visibility: visibilityInfo.visibility,
      onScreenBounds: visibilityInfo.onScreenBounds
    })
    
    gameStore.geometry.objects.push(point)
    
    // Update scale tracking
    updateGameStore.updateCreationScaleTracking(currentScale)
    
    return point
  },

  createLine: (startX: number, startY: number, endX: number, endY: number) => {
    const currentScale = gameStore.cameraViewport.zoom_factor
    const metadata = GeometryHelper.calculateLineMetadata({ startX, startY, endX, endY })
    metadata.createdAtScale = currentScale
    
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
      metadata
    }
    
    // Initialize visibility cache
    const visibilityInfo = GeometryHelper.calculateVisibilityState(line, currentScale)
    
    line.metadata!.visibilityCache = new Map()
    line.metadata!.visibilityCache.set(currentScale, {
      visibility: visibilityInfo.visibility,
      onScreenBounds: visibilityInfo.onScreenBounds
    })
    
    gameStore.geometry.objects.push(line)
    
    // Update scale tracking
    updateGameStore.updateCreationScaleTracking(currentScale)
    
    return line
  },

  createCircle: (centerX: number, centerY: number, radius: number) => {
    const currentScale = gameStore.cameraViewport.zoom_factor
    const metadata = GeometryHelper.calculateCircleMetadata({ centerX, centerY, radius })
    metadata.createdAtScale = currentScale
    
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
      metadata
    }
    
    // Initialize visibility cache
    const visibilityInfo = GeometryHelper.calculateVisibilityState(circle, currentScale)
    
    circle.metadata!.visibilityCache = new Map()
    circle.metadata!.visibilityCache.set(currentScale, {
      visibility: visibilityInfo.visibility,
      onScreenBounds: visibilityInfo.onScreenBounds
    })
    
    gameStore.geometry.objects.push(circle)
    
    // Update scale tracking
    updateGameStore.updateCreationScaleTracking(currentScale)
    
    return circle
  },

  createRectangle: (x: number, y: number, width: number, height: number) => {
    const currentScale = gameStore.cameraViewport.zoom_factor
    const metadata = GeometryHelper.calculateRectangleMetadata({ x, y, width, height })
    metadata.createdAtScale = currentScale
    
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
      metadata
    }
    
    // Initialize visibility cache
    const visibilityInfo = GeometryHelper.calculateVisibilityState(rectangle, currentScale)
    
    rectangle.metadata!.visibilityCache = new Map()
    rectangle.metadata!.visibilityCache.set(currentScale, {
      visibility: visibilityInfo.visibility,
      onScreenBounds: visibilityInfo.onScreenBounds
    })
    
    gameStore.geometry.objects.push(rectangle)
    
    // Update scale tracking
    updateGameStore.updateCreationScaleTracking(currentScale)
    
    return rectangle
  },

  createDiamond: (anchorX: number, anchorY: number, width: number, height: number) => {
    const currentScale = gameStore.cameraViewport.zoom_factor
    const metadata = GeometryHelper.calculateDiamondMetadata({ anchorX, anchorY, width, height })
    metadata.createdAtScale = currentScale
    
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
      metadata
    }
    
    // Initialize visibility cache
    const visibilityInfo = GeometryHelper.calculateVisibilityState(diamond, currentScale)
    
    diamond.metadata!.visibilityCache = new Map()
    diamond.metadata!.visibilityCache.set(currentScale, {
      visibility: visibilityInfo.visibility,
      onScreenBounds: visibilityInfo.onScreenBounds
    })
    
    gameStore.geometry.objects.push(diamond)
    
    // Update scale tracking
    updateGameStore.updateCreationScaleTracking(currentScale)
    
    return diamond
  },

  removeGeometricObject: (id: string) => {
    const index = gameStore.geometry.objects.findIndex(obj => obj.id === id)
    if (index !== -1) {
      gameStore.geometry.objects.splice(index, 1)
      // Remove textures when object is deleted
      updateGameStore.removeObjectTexture(id)
      // Recalculate scale tracking after deletion
      updateGameStore.recalculateScaleTracking()
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
        
        // Remove cached textures to force regeneration
        updateGameStore.removeObjectTexture(id)
        updateGameStore.removeRenderingTexture(id)
        console.log(`Store: Invalidated texture caches for object ${id} due to property changes`)
      }
    }
  },

  // Visibility calculation action
  updateObjectVisibility: (objectId: string, pixeloidScale: number) => {
    const object = gameStore.geometry.objects.find(obj => obj.id === objectId)
    if (!object || !object.metadata) return
    
    // Initialize visibility cache if needed
    if (!object.metadata.visibilityCache) {
      object.metadata.visibilityCache = new Map()
    }
    
    const visibilityInfo = GeometryHelper.calculateVisibilityState(object, pixeloidScale)
    
    // Store in scale-indexed cache
    object.metadata.visibilityCache.set(pixeloidScale, {
      visibility: visibilityInfo.visibility,
      onScreenBounds: visibilityInfo.onScreenBounds
    })
    
    // Clean up old scales (keep current ±1)
    cleanupVisibilityCache(object.metadata.visibilityCache, pixeloidScale)
  },

  // Batch update all objects' visibility
  updateAllObjectsVisibility: (pixeloidScale: number) => {
    for (const obj of gameStore.geometry.objects) {
      if (!obj.metadata) continue
      
      // Initialize visibility cache if needed
      if (!obj.metadata.visibilityCache) {
        obj.metadata.visibilityCache = new Map()
      }
      
      const visibilityInfo = GeometryHelper.calculateVisibilityState(obj, pixeloidScale)
      
      // Store in scale-indexed cache
      obj.metadata.visibilityCache.set(pixeloidScale, {
        visibility: visibilityInfo.visibility,
        onScreenBounds: visibilityInfo.onScreenBounds
      })
      
      // Clean up old scales (keep current ±1)
      cleanupVisibilityCache(obj.metadata.visibilityCache, pixeloidScale)
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

  setLayerVisibility: (layer: 'background' | 'geometry' | 'selection' | 'raycast' | 'bbox' | 'mirror' | 'mouse', visible: boolean) => {
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
    
    // Initialize visibility cache for pasted object
    if (newObject.metadata) {
      const currentScale = gameStore.camera.pixeloid_scale
      const visibilityInfo = GeometryHelper.calculateVisibilityState(newObject, currentScale)
      
      newObject.metadata.visibilityCache = new Map()
      newObject.metadata.visibilityCache.set(currentScale, {
        visibility: visibilityInfo.visibility,
        onScreenBounds: visibilityInfo.onScreenBounds
      })
    }

    // Use proper method that handles object setup (but we already initialized visibility cache)
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
  setInfiniteCanvasRef: (_canvas: InfiniteCanvas) => {
    // Reference no longer stored - method kept for compatibility
    console.log('Store: InfiniteCanvas reference method called (legacy compatibility)')
  },

  centerCameraOnObject: (objectId: string) => {
    const object = gameStore.geometry.objects.find(obj => obj.id === objectId)
    if (object && object.metadata) {
      const targetPos = createPixeloidCoordinate(object.metadata.center.x, object.metadata.center.y)
      const zoomFactor = gameStore.cameraViewport.zoom_factor
      
      // Use appropriate position based on zoom level
      if (zoomFactor === 1) {
        updateGameStore.setGeometrySamplingPosition(targetPos)
      } else {
        updateGameStore.setCameraViewportPosition(targetPos)
      }
      console.log(`Store: Centered camera on object ${objectId} at zoom ${zoomFactor}`)
    } else {
      console.warn(`Store: Cannot center on object ${objectId} - object not found or missing metadata`)
    }
  },

  centerViewportOnObject: (objectId: string) => {
    const object = gameStore.geometry.objects.find(obj => obj.id === objectId)
    if (object && object.metadata) {
      const zoomFactor = gameStore.cameraViewport.zoom_factor
      const screenCenterX = gameStore.windowWidth / 2 / zoomFactor
      const screenCenterY = gameStore.windowHeight / 2 / zoomFactor
      const targetPos = createPixeloidCoordinate(
        object.metadata.center.x - screenCenterX,
        object.metadata.center.y - screenCenterY
      )
      
      // Use appropriate position based on zoom level
      if (zoomFactor === 1) {
        updateGameStore.setGeometrySamplingPosition(targetPos)
      } else {
        updateGameStore.setCameraViewportPosition(targetPos)
      }
      console.log(`Store: Centered viewport on object ${objectId} at zoom ${zoomFactor}`)
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

  removeRenderingTexture: (objectId: string) => {
    // This method handles removal of rendering-specific textures
    // Currently delegates to removeObjectTexture, but could be expanded
    // for more complex texture management in the future
    updateGameStore.removeObjectTexture(objectId)
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
    return gameStore.staticMesh.coordinateMappings.get(gameStore.cameraViewport.zoom_factor) || null
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
    
    // Initialize visibility cache
    const currentScale = gameStore.cameraViewport.zoom_factor
    const visibilityInfo = GeometryHelper.calculateVisibilityState(point, currentScale)
    
    point.metadata!.visibilityCache = new Map()
    point.metadata!.visibilityCache.set(currentScale, {
      visibility: visibilityInfo.visibility,
      onScreenBounds: visibilityInfo.onScreenBounds
    })
    
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
    
    // Initialize visibility cache
    const currentScale = gameStore.cameraViewport.zoom_factor
    const visibilityInfo = GeometryHelper.calculateVisibilityState(line, currentScale)
    
    line.metadata!.visibilityCache = new Map()
    line.metadata!.visibilityCache.set(currentScale, {
      visibility: visibilityInfo.visibility,
      onScreenBounds: visibilityInfo.onScreenBounds
    })
    
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
    
    // Initialize visibility cache
    const currentScale = gameStore.cameraViewport.zoom_factor
    const visibilityInfo = GeometryHelper.calculateVisibilityState(circle, currentScale)
    
    circle.metadata!.visibilityCache = new Map()
    circle.metadata!.visibilityCache.set(currentScale, {
      visibility: visibilityInfo.visibility,
      onScreenBounds: visibilityInfo.onScreenBounds
    })
    
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
    
    // Initialize visibility cache
    const currentScale = gameStore.cameraViewport.zoom_factor
    const visibilityInfo = GeometryHelper.calculateVisibilityState(rectangle, currentScale)
    
    rectangle.metadata!.visibilityCache = new Map()
    rectangle.metadata!.visibilityCache.set(currentScale, {
      visibility: visibilityInfo.visibility,
      onScreenBounds: visibilityInfo.onScreenBounds
    })
    
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
    
    // Initialize visibility cache
    const currentScale = gameStore.cameraViewport.zoom_factor
    const visibilityInfo = GeometryHelper.calculateVisibilityState(diamond, currentScale)
    
    diamond.metadata!.visibilityCache = new Map()
    diamond.metadata!.visibilityCache.set(currentScale, {
      visibility: visibilityInfo.visibility,
      onScreenBounds: visibilityInfo.onScreenBounds
    })
    
    gameStore.geometry.objects.push(diamond)
    
    return diamond
  }
}

// Listen for window resize events
window.addEventListener('resize', () => {
  updateGameStore.updateWindowSize(window.innerWidth, window.innerHeight)
})

// Helper function for visibility cache cleanup with distance-based eviction
function cleanupVisibilityCache(cache: Map<number, any>, currentScale: number): void {
  // Use requestIdleCallback to avoid blocking rendering during cleanup
  requestIdleCallback(() => {
    // Distance-based eviction configuration
    const DISTANCE_THRESHOLD = 2   // Evict scales more than 2 away from current
    
    // Keep current scale and adjacent scales (±1)
    const adjacentScalesToKeep = new Set([
      currentScale,
      currentScale - 1,
      currentScale + 1
    ].filter(s => s >= 1 && s <= 100))
    
    // Get current zoom bounds to protect
    const tracking = gameStore.geometry.scaleTracking
    const zoomBounds = (tracking.minCreationScale !== null && tracking.maxCreationScale !== null) ? {
      minAllowed: Math.max(1, tracking.maxCreationScale / tracking.SCALE_SPAN_LIMIT),
      maxAllowed: Math.min(100, tracking.minCreationScale * tracking.SCALE_SPAN_LIMIT)
    } : null
    
    const scalesToDelete: number[] = []
    
    for (const [scale] of cache) {
      // Keep if in adjacent range
      if (adjacentScalesToKeep.has(scale)) continue
      
      // Keep zoom bounds (min/max allowed scales)
      if (zoomBounds && (scale === zoomBounds.minAllowed || scale === zoomBounds.maxAllowed)) continue
      
      // Evict if distance > threshold OR outside valid range
      const distance = Math.abs(scale - currentScale)
      if (distance > DISTANCE_THRESHOLD || scale < 1 || scale > 100) {
        scalesToDelete.push(scale)
      }
    }
    
    // Perform cleanup during idle time
    for (const scale of scalesToDelete) {
      cache.delete(scale)
    }
    
    if (scalesToDelete.length > 0) {
      console.log(`Store: Distance-based visibility cache cleanup removed scales [${scalesToDelete.join(', ')}] (distance > ${DISTANCE_THRESHOLD} from scale ${currentScale})`)
    }
  })
}

// ================================
// COORDINATE HELPER EXPORTS FOR OTHER FILES
// ================================

export { createPixeloidCoordinate, createVertexCoordinate, createScreenCoordinate }