// app/src/store/gameStore_3b.ts - Fixed coordinate system with Phase 3B extensions
import { proxy } from 'valtio'
import { PixeloidCoordinate, VertexCoordinate, ECSBoundingBox } from '../types/ecs-coordinates'
import { GeometricObject, CreateGeometricObjectParams, ECSDataLayer, createECSDataLayer, GeometryProperties } from '../types/ecs-data-layer'
import { MeshLevel, MeshVertexData } from '../types/mesh-system'
import {
  DrawingMode,
  DrawingState,
  StyleSettings,
  SelectionState,
  GeometryPanelState,
  GeometryStats,
  ObjectEditPreviewState,
  ObjectEditFormData,
  createDefaultDrawingSettings,
  createDefaultStyleSettings,
  createDefaultSelectionState,
  createDefaultGeometryPanelState,
  createDefaultPreviewState,
  createDefaultObjectEditPreviewState,
  calculateGeometryStats
} from '../types/geometry-drawing'
import { dataLayerIntegration } from './ecs-data-layer-integration'
import { coordinateWASDMovement } from './ecs-coordination-functions'
import { GeometryHelper_3b } from '../game/GeometryHelper_3b'
import { GeometryPropertyCalculators } from '../game/GeometryPropertyCalculators'
import { GeometryVertexGenerators } from '../game/GeometryVertexGenerators'

// Debug constants
const VERBOSE_LOGGING = false // Set to true for detailed mouse tracking debugging

// Phase 3b Game State Interface - Updated with mesh-first architecture + geometry features
export interface GameState3b {
  phase: '3b'
  mouse: {
    screen: PixeloidCoordinate
    vertex: VertexCoordinate    // ✅ MESH VERTEX COORDINATES
    world: PixeloidCoordinate   // ✅ WORLD COORDINATES
  }
  navigation: {
    offset: PixeloidCoordinate
    isDragging: boolean
    moveAmount: number
  }
  geometry: {
    objects: GeometricObject[]
    selectedId: string | null
  }
  mesh: {
    vertexData: Float32Array | null
    cellSize: number
    dimensions: { width: number, height: number }
    needsUpdate: boolean
  }
  // ✅ NEW: ECS Data Layer Integration
  ecsDataLayer: ECSDataLayer
  
  // ✅ NEW: Drawing System
  drawing: DrawingState
  
  // ✅ NEW: Style System
  style: StyleSettings
  
  // ✅ NEW: Selection System
  selection: SelectionState
  
  // ✅ NEW: Per-object style overrides
  objectStyles: {
    [objectId: string]: {
      [key: string]: any
      color?: number
      strokeWidth?: number
      strokeAlpha?: number
      fillColor?: number
      fillAlpha?: number
      isVisible?: boolean
    }
  }
  
  // ✅ NEW: Clipboard functionality
  clipboard: {
    copiedObject: GeometricObject | null
    copiedAt: number
  }
  
  // ✅ NEW: Simplified dragging state - using offset-based approach
  dragging: {
    isDragging: boolean
    dragObjectId: string | null
    clickPosition: PixeloidCoordinate | null      // Where user clicked
    vertexOffsets: PixeloidCoordinate[]          // click_position -> each_vertex offsets
    lastClickTime: number
  }
  
  // ✅ NEW: Drag preview state - separate from drawing preview
  dragPreview: {
    isActive: boolean
    currentMousePosition: PixeloidCoordinate | null  // Current mouse position during drag
    previewVertices: PixeloidCoordinate[]            // Calculated preview vertices
  }
  
  // ✅ NEW: Object edit preview state - exactly like drag system
  editPreview: ObjectEditPreviewState
  
  // ✅ NEW: Interaction state machine
  interaction: {
    clickCount: number           // 0, 1, 2
    firstClickTime: number      // Timestamp of first click
    isHolding: boolean          // Is mouse still down
    dragThreshold: number       // Pixels moved to start drag
    doubleClickWindow: number   // Milliseconds for double-click
    lastMovePosition: PixeloidCoordinate | null
    hasMoved: boolean           // Has mouse moved since click
  }
  
  // ✅ EXTENDED: UI State with geometry features
  ui: {
    showGrid: boolean
    showMouse: boolean
    showStorePanel: boolean
    showLayerToggle: boolean
    enableCheckboard: boolean
    // ✅ NEW: Geometry UI features
    showGeometry: boolean
    showGeometryPanel: boolean
    geometryPanel: GeometryPanelState
    mouse: {
      highlightColor: number
      highlightIntensity: number
      strokeWidth: number
      fillAlpha: number
      animationSpeed: number
      pulseMin: number
      pulseMax: number
    }
  }
}

// Phase 3b store implementation with mesh-first architecture + geometry features
export const gameStore_3b = proxy<GameState3b>({
  phase: '3b',
  mouse: {
    screen: { x: 0, y: 0 },
    vertex: { x: 0, y: 0 },    // ✅ MESH VERTEX COORDINATES
    world: { x: 0, y: 0 }      // ✅ WORLD COORDINATES
  },
  navigation: {
    offset: { x: 0, y: 0 },
    isDragging: false,
    moveAmount: 1
  },
  geometry: {
    objects: [],
    selectedId: null
  },
  mesh: {
    vertexData: null,
    cellSize: 1,
    dimensions: { width: 0, height: 0 },
    needsUpdate: false
  },
  // ✅ NEW: ECS Data Layer Integration
  ecsDataLayer: createECSDataLayer(),
  
  // ✅ NEW: Drawing System
  drawing: {
    mode: 'none',
    preview: createDefaultPreviewState(),
    settings: createDefaultDrawingSettings(),
    isDrawing: false,
    startPoint: null,
    currentStroke: []
  },
  
  // ✅ NEW: Style System
  style: createDefaultStyleSettings(),
  
  // ✅ NEW: Selection System
  selection: createDefaultSelectionState(),
  
  // ✅ NEW: Per-object style overrides
  objectStyles: {},
  
  // ✅ NEW: Clipboard functionality
  clipboard: {
    copiedObject: null,
    copiedAt: 0
  },
  
  // ✅ NEW: Simplified dragging state - using offset-based approach
  dragging: {
    isDragging: false,
    dragObjectId: null,
    clickPosition: null,
    vertexOffsets: [],
    lastClickTime: 0
  },
  
  // ✅ NEW: Drag preview state - separate from drawing preview
  dragPreview: {
    isActive: false,
    currentMousePosition: null,
    previewVertices: []
  },
  
  // ✅ NEW: Object edit preview state - exactly like drag system
  editPreview: createDefaultObjectEditPreviewState(),
  
  // ✅ NEW: Interaction state machine
  interaction: {
    clickCount: 0,
    firstClickTime: 0,
    isHolding: false,
    dragThreshold: 3,  // 3 pixels to start dragging
    doubleClickWindow: 300,  // 300ms window
    lastMovePosition: null,
    hasMoved: false
  },
  
  // ✅ EXTENDED: UI State with geometry features
  ui: {
    showGrid: true,
    showMouse: true,
    showStorePanel: true,
    showLayerToggle: true,
    enableCheckboard: false,  // Start disabled, user can enable
    // ✅ NEW: Geometry UI features
    showGeometry: true,
    showGeometryPanel: false,
    geometryPanel: createDefaultGeometryPanelState(),
    mouse: {
      highlightColor: 0xff0000,
      highlightIntensity: 0.8,
      strokeWidth: 2,
      fillAlpha: 0.3,
      animationSpeed: 4.0,
      pulseMin: 0.7,
      pulseMax: 0.3
    }
  }
})

// Store methods with mesh-first coordinate system
export const gameStore_3b_methods = {
  // ✅ MESH-FIRST MOUSE POSITION UPDATE
  updateMousePosition: (vertexX: number, vertexY: number) => {
    if (VERBOSE_LOGGING) {
      console.log('gameStore_3b: Updating mouse position', { vertexX, vertexY })
    }
    
    // Store mesh vertex coordinates (authoritative)
    gameStore_3b.mouse.vertex = { x: vertexX, y: vertexY }
    
    // Calculate world coordinates (vertex + offset)
    gameStore_3b.mouse.world = {
      x: vertexX + gameStore_3b.navigation.offset.x,
      y: vertexY + gameStore_3b.navigation.offset.y
    }
    
    // Calculate screen coordinates (vertex * cellSize)
    gameStore_3b.mouse.screen = {
      x: vertexX * gameStore_3b.mesh.cellSize,
      y: vertexY * gameStore_3b.mesh.cellSize
    }
  },

  updateMouseVertex(x: number, y: number): void {
    gameStore_3b.mouse.vertex = { x, y }
    // No reactive triggers - just functional updates
  },

  // Navigation methods with mesh-first coordinates
  updateNavigation: (direction: 'w' | 'a' | 's' | 'd', deltaTime: number) => {
    // Use existing WASD coordination if available
    try {
      coordinateWASDMovement(direction, deltaTime)
    } catch (error) {
      console.warn('coordinateWASDMovement not available, using fallback')
    }
    
    // Update offset for UI display - using vertex units
    const moveDistance = Math.ceil(10 * deltaTime) // Ensure integer movement
    const currentOffset = gameStore_3b.navigation.offset
    let deltaX = 0
    let deltaY = 0
    
    switch (direction) {
      case 'w': deltaY = -moveDistance; break
      case 's': deltaY = moveDistance; break
      case 'a': deltaX = -moveDistance; break
      case 'd': deltaX = moveDistance; break
    }
    
    gameStore_3b.navigation.offset = {
      x: currentOffset.x + deltaX,
      y: currentOffset.y + deltaY
    }
    
    // Recalculate world coordinates
    gameStore_3b.mouse.world = {
      x: gameStore_3b.mouse.vertex.x + gameStore_3b.navigation.offset.x,
      y: gameStore_3b.mouse.vertex.y + gameStore_3b.navigation.offset.y
    }
  },

  // Simplified navigation offset update
  updateNavigationOffset: (deltaX: number, deltaY: number) => {
    console.log('gameStore_3b: Updating navigation offset', { deltaX, deltaY })
    
    gameStore_3b.navigation.offset = {
      x: gameStore_3b.navigation.offset.x + deltaX,
      y: gameStore_3b.navigation.offset.y + deltaY
    }
    
    // Recalculate world coordinates
    gameStore_3b.mouse.world = {
      x: gameStore_3b.mouse.vertex.x + gameStore_3b.navigation.offset.x,
      y: gameStore_3b.mouse.vertex.y + gameStore_3b.navigation.offset.y
    }
  },

  // Mesh system methods
  updateMeshData: (vertexData: Float32Array, cellSize: number, dimensions: { width: number, height: number }) => {
    console.log('gameStore_3b: Updating mesh data', { cellSize, dimensions })
    
    gameStore_3b.mesh.vertexData = vertexData
    gameStore_3b.mesh.cellSize = cellSize
    gameStore_3b.mesh.dimensions = dimensions
    gameStore_3b.mesh.needsUpdate = false
  },

  // Legacy mesh methods for compatibility
  initializeMesh: (level: MeshLevel) => {
    console.log('gameStore_3b: Initializing mesh (legacy)', { level })
    gameStore_3b.mesh.needsUpdate = true
  },

  updateMeshDataLegacy: (_vertexData: MeshVertexData) => {
    console.log('gameStore_3b: Updating mesh data (legacy)')
    gameStore_3b.mesh.needsUpdate = false
  },

  // UI methods for Phase 3b
  toggleGrid: () => {
    gameStore_3b.ui.showGrid = !gameStore_3b.ui.showGrid
    console.log('gameStore_3b: Grid visibility:', gameStore_3b.ui.showGrid)
  },

  toggleMouse: () => {
    gameStore_3b.ui.showMouse = !gameStore_3b.ui.showMouse
    console.log('gameStore_3b: Mouse visibility:', gameStore_3b.ui.showMouse)
  },

  toggleStorePanel: () => {
    gameStore_3b.ui.showStorePanel = !gameStore_3b.ui.showStorePanel
    console.log('gameStore_3b: Store panel visibility:', gameStore_3b.ui.showStorePanel)
  },

  toggleLayerToggle: () => {
    gameStore_3b.ui.showLayerToggle = !gameStore_3b.ui.showLayerToggle
    console.log('gameStore_3b: Layer toggle visibility:', gameStore_3b.ui.showLayerToggle)
  },

  // Geometry methods using existing data layer integration
  addGeometryObject: (params: CreateGeometricObjectParams) => {
    console.log('gameStore_3b: Adding geometry object', params)
    
    try {
      const objectId = dataLayerIntegration.addObject(params)
      // Update local geometry objects list
      const allObjects = dataLayerIntegration.getAllObjects()
      gameStore_3b.geometry.objects = allObjects
      return objectId
    } catch (error) {
      console.warn('dataLayerIntegration not available, using fallback')
      
      // Simple fallback for geometry objects
      const newObject = {
        id: `obj_${Date.now()}`,
        ...params
      } as GeometricObject
      
      gameStore_3b.geometry.objects.push(newObject)
      return newObject.id
    }
  },

  removeGeometryObject: (objectId: string) => {
    console.log('gameStore_3b: Removing geometry object', objectId)
    gameStore_3b.geometry.objects = gameStore_3b.geometry.objects.filter(obj => obj.id !== objectId)
  },

  selectGeometryObject: (id: string) => {
    console.log('gameStore_3b: Selecting geometry object', id)
    gameStore_3b.geometry.selectedId = id
  },

  clearSelection: () => {
    console.log('gameStore_3b: Clearing selection')
    gameStore_3b.geometry.selectedId = null
  },

  // Store-driven constants methods
  setMeshCellSize: (cellSize: number) => {
    console.log('gameStore_3b: Setting mesh cell size', cellSize)
    gameStore_3b.mesh.cellSize = cellSize
    gameStore_3b.mesh.needsUpdate = true
  },

  setNavigationMoveAmount: (moveAmount: number) => {
    console.log('gameStore_3b: Setting navigation move amount', moveAmount)
    gameStore_3b.navigation.moveAmount = moveAmount
  },

  toggleCheckboard: () => {
    gameStore_3b.ui.enableCheckboard = !gameStore_3b.ui.enableCheckboard
    console.log('gameStore_3b: Checkboard enabled:', gameStore_3b.ui.enableCheckboard)
  },

  updateMouseHighlightColor: (color: number) => {
    console.log('gameStore_3b: Setting mouse highlight color', color.toString(16))
    gameStore_3b.ui.mouse.highlightColor = color
  },

  updateMouseHighlightIntensity: (intensity: number) => {
    const clampedIntensity = Math.max(0, Math.min(1, intensity))
    console.log('gameStore_3b: Setting mouse highlight intensity', clampedIntensity)
    gameStore_3b.ui.mouse.highlightIntensity = clampedIntensity
  },

  // Reset navigation offset to center (0,0)
  resetNavigationOffset: () => {
    console.log('gameStore_3b: Resetting navigation offset to (0,0)')
    
    gameStore_3b.navigation.offset = { x: 0, y: 0 }
    
    // Recalculate world coordinates
    gameStore_3b.mouse.world = {
      x: gameStore_3b.mouse.vertex.x + 0,
      y: gameStore_3b.mouse.vertex.y + 0
    }
    
    console.log('Navigation offset reset to (0,0)')
  },

  // ================================
  // ✅ NEW: DRAWING SYSTEM METHODS
  // ================================

  // Set drawing mode
  setDrawingMode: (mode: DrawingMode) => {
    console.log('gameStore_3b: Setting drawing mode to', mode)
    gameStore_3b.drawing.mode = mode
    gameStore_3b.ui.geometryPanel.currentDrawingMode = mode
    
    // Cancel any active drawing
    if (gameStore_3b.drawing.isDrawing) {
      gameStore_3b_methods.cancelDrawing()
    }
  },

  // Start drawing operation
  startDrawing: (startPoint: PixeloidCoordinate) => {
    console.log('gameStore_3b: Starting drawing at', startPoint)
    
    gameStore_3b.drawing.isDrawing = true
    gameStore_3b.drawing.startPoint = startPoint
    gameStore_3b.drawing.currentStroke = [startPoint]
    gameStore_3b.drawing.preview.isActive = true
    gameStore_3b.drawing.preview.startPoint = startPoint
  },

  // Update drawing preview - USING GeometryHelper_3b for all modes
  updateDrawingPreview: (currentPoint: PixeloidCoordinate) => {
    if (!gameStore_3b.drawing.isDrawing || !gameStore_3b.drawing.startPoint) return
    
    gameStore_3b.drawing.preview.currentPoint = currentPoint
    
    // Use GeometryHelper_3b for all drawing modes
    const startPoint = gameStore_3b.drawing.startPoint
    const mode = gameStore_3b.drawing.mode
    
    const previewObject = GeometryHelper_3b.calculateDrawingPreview(mode, startPoint, currentPoint)
    
    if (previewObject) {
      gameStore_3b.drawing.preview.object = previewObject
      console.log('gameStore_3b: Updated drawing preview for', mode, previewObject)
    } else {
      console.warn('gameStore_3b: Could not calculate preview for mode', mode)
    }
  },

  // Finish drawing operation - USING GeometryHelper_3b for metadata
  finishDrawing: () => {
    console.log('gameStore_3b: Finishing drawing')
    
    if (!gameStore_3b.drawing.isDrawing || !gameStore_3b.drawing.preview.object) {
      gameStore_3b_methods.cancelDrawing()
      return null
    }
    
    const previewObj = gameStore_3b.drawing.preview.object
    const startPoint = gameStore_3b.drawing.startPoint!
    const currentPoint = gameStore_3b.drawing.preview.currentPoint!
    
    // Create metadata using GeometryHelper_3b based on drawing mode
    let metadata: any = null
    const mode = gameStore_3b.drawing.mode
    
    switch (mode) {
      case 'point':
        metadata = GeometryHelper_3b.calculatePointMetadata(startPoint)
        break
      case 'line':
        metadata = GeometryHelper_3b.calculateLineMetadata({
          startX: startPoint.x,
          startY: startPoint.y,
          endX: currentPoint.x,
          endY: currentPoint.y
        })
        break
      case 'circle':
        const radius = Math.sqrt(
          Math.pow(currentPoint.x - startPoint.x, 2) +
          Math.pow(currentPoint.y - startPoint.y, 2)
        )
        metadata = GeometryHelper_3b.calculateCircleMetadata({
          centerX: startPoint.x,
          centerY: startPoint.y,
          radius: radius
        })
        break
      case 'rectangle':
        const x = Math.min(startPoint.x, currentPoint.x)
        const y = Math.min(startPoint.y, currentPoint.y)
        const width = Math.abs(currentPoint.x - startPoint.x)
        const height = Math.abs(currentPoint.y - startPoint.y)
        metadata = GeometryHelper_3b.calculateRectangleMetadata({ x, y, width, height })
        break
      case 'diamond':
        const diamondProps = GeometryHelper_3b.calculateDiamondProperties(startPoint, currentPoint)
        metadata = GeometryHelper_3b.calculateDiamondMetadata(diamondProps)
        break
      default:
        metadata = { createdAt: Date.now() }
    }
    
    // Create the actual geometry object with style copied from defaults
    const geometryParams: CreateGeometricObjectParams = {
      type: previewObj.type,
      vertices: previewObj.vertices,
      style: {
        color: gameStore_3b.style.color,
        strokeWidth: gameStore_3b.style.strokeWidth,
        strokeAlpha: gameStore_3b.style.strokeAlpha,
        fillColor: gameStore_3b.style.fillEnabled ? gameStore_3b.style.fillColor : undefined,
        fillAlpha: gameStore_3b.style.fillAlpha
      }
    }
    
    const objectId = gameStore_3b_methods.addGeometryObject(geometryParams)
    
    // Clear drawing state
    gameStore_3b_methods.cancelDrawing()
    
    console.log('gameStore_3b: Created geometry object', objectId, 'with metadata', metadata)
    
    return objectId
  },

  // Cancel drawing operation
  cancelDrawing: () => {
    console.log('gameStore_3b: Canceling drawing')
    
    gameStore_3b.drawing.isDrawing = false
    gameStore_3b.drawing.startPoint = null
    gameStore_3b.drawing.currentStroke = []
    gameStore_3b.drawing.preview.isActive = false
    gameStore_3b.drawing.preview.object = null
    gameStore_3b.drawing.preview.startPoint = null
    gameStore_3b.drawing.preview.currentPoint = null
  },

  // ================================
  // ✅ NEW: STYLE SYSTEM METHODS
  // ================================

  // Set stroke color
  setStrokeColor: (color: number) => {
    console.log('gameStore_3b: Setting stroke color to', color.toString(16))
    gameStore_3b.style.color = color
  },

  // Set fill color
  setFillColor: (color: number) => {
    console.log('gameStore_3b: Setting fill color to', color.toString(16))
    gameStore_3b.style.fillColor = color
  },

  // Set stroke width
  setStrokeWidth: (width: number) => {
    console.log('gameStore_3b: Setting stroke width to', width)
    gameStore_3b.style.strokeWidth = Math.max(1, width)
  },

  // Toggle fill enabled
  setFillEnabled: (enabled: boolean) => {
    console.log('gameStore_3b: Setting fill enabled to', enabled)
    gameStore_3b.style.fillEnabled = enabled
  },

  // Set stroke alpha
  setStrokeAlpha: (alpha: number) => {
    console.log('gameStore_3b: Setting stroke alpha to', alpha)
    gameStore_3b.style.strokeAlpha = Math.max(0, Math.min(1, alpha))
  },

  // Set fill alpha
  setFillAlpha: (alpha: number) => {
    console.log('gameStore_3b: Setting fill alpha to', alpha)
    gameStore_3b.style.fillAlpha = Math.max(0, Math.min(1, alpha))
  },

  // ================================
  // ✅ NEW: PER-OBJECT STYLE SYSTEM
  // ================================
  
  // Get effective style (object override OR global default)
  getEffectiveStyle: (objectId: string, property: keyof StyleSettings) => {
    const objectOverride = gameStore_3b.objectStyles[objectId]?.[property]
    if (objectOverride !== undefined) return objectOverride
    
    const globalDefault = gameStore_3b.style[property]
    if (globalDefault !== undefined) return globalDefault
    
    // Hardcoded fallbacks
    const fallbacks = {
      color: 0x0066cc,
      strokeWidth: 2,
      strokeAlpha: 1.0,
      fillColor: 0x0066cc,
      fillAlpha: 0.3,
      defaultColor: 0x0066cc,
      defaultStrokeWidth: 2,
      defaultFillColor: 0x0066cc,
      fillEnabled: false,
      highlightColor: 0xff6600,
      selectionColor: 0xff0000
    }
    
    return fallbacks[property]
  },
  
  // Set per-object style override
  setObjectStyle: (objectId: string, property: string, value: any) => {
    if (!gameStore_3b.objectStyles[objectId]) {
      gameStore_3b.objectStyles[objectId] = {}
    }
    gameStore_3b.objectStyles[objectId][property] = value
    console.log(`Set ${property} to ${value} for object ${objectId}`)
  },
  
  // Clear per-object style override
  clearObjectStyle: (objectId: string, property: string) => {
    if (gameStore_3b.objectStyles[objectId]) {
      delete gameStore_3b.objectStyles[objectId][property]
      console.log(`Cleared ${property} for object ${objectId}`)
    }
  },
  
  // Get per-object style override
  getObjectStyle: (objectId: string, property: string) => {
    return gameStore_3b.objectStyles[objectId]?.[property]
  },
  
  // Reset object style to global defaults
  resetObjectStyleToDefault: (objectId: string) => {
    delete gameStore_3b.objectStyles[objectId]
    console.log(`Reset style to default for object ${objectId}`)
  },
  
  // ================================
  // ✅ NEW: FILL SYSTEM CONTROLS
  // ================================
  
  // Enable fill for specific object
  enableFillForObject: (objectId: string, color?: number, alpha?: number) => {
    const fillColor = color || gameStore_3b.style.fillColor
    const fillAlpha = alpha || gameStore_3b.style.fillAlpha
    
    gameStore_3b_methods.setObjectStyle(objectId, 'fillColor', fillColor)
    gameStore_3b_methods.setObjectStyle(objectId, 'fillAlpha', fillAlpha)
    console.log(`Enabled fill for object ${objectId}`)
  },
  
  // Remove fill from specific object
  removeFillFromObject: (objectId: string) => {
    gameStore_3b_methods.clearObjectStyle(objectId, 'fillColor')
    gameStore_3b_methods.clearObjectStyle(objectId, 'fillAlpha')
    console.log(`Removed fill from object ${objectId}`)
  },
  
  // Check if object has fill
  hasObjectFill: (objectId: string): boolean => {
    return gameStore_3b_methods.getObjectStyle(objectId, 'fillColor') !== undefined
  },

  // ================================
  // ✅ NEW: SELECTION SYSTEM METHODS
  // ================================

  // Select geometry object (enhanced)
  selectObject: (objectId: string) => {
    console.log('gameStore_3b: Selecting object', objectId)
    
    gameStore_3b.selection.selectedObjectId = objectId
    gameStore_3b.geometry.selectedId = objectId // Keep legacy support
    
    // Update selection bounds
    const obj = gameStore_3b.geometry.objects.find(o => o.id === objectId)
    if (obj) {
      gameStore_3b.selection.selectionBounds = obj.bounds
    }
  },

  // Clear selection (enhanced)
  clearSelectionEnhanced: () => {
    console.log('gameStore_3b: Clearing selection (enhanced)')
    
    gameStore_3b.selection.selectedObjectId = null
    gameStore_3b.geometry.selectedId = null // Keep legacy support
    gameStore_3b.selection.selectionBounds = null
    gameStore_3b.selection.selectedObjects = []
  },

  // Delete selected object
  deleteSelected: () => {
    if (gameStore_3b.selection.selectedObjectId) {
      console.log('gameStore_3b: Deleting selected object', gameStore_3b.selection.selectedObjectId)
      gameStore_3b_methods.removeGeometryObject(gameStore_3b.selection.selectedObjectId)
      gameStore_3b_methods.clearSelectionEnhanced()
    }
  },

  // ================================
  // ✅ NEW: ECS METHODS
  // ================================

  // Add geometry object (enhanced version)
  addGeometryObjectAdvanced: (type: GeometricObject['type'], vertices: PixeloidCoordinate[]) => {
    console.log('gameStore_3b: Adding geometry object (advanced)', type, vertices)
    
    const params: CreateGeometricObjectParams = {
      type,
      vertices,
      style: {
        color: gameStore_3b.style.color,
        strokeWidth: gameStore_3b.style.strokeWidth,
        strokeAlpha: gameStore_3b.style.strokeAlpha,
        fillColor: gameStore_3b.style.fillEnabled ? gameStore_3b.style.fillColor : undefined,
        fillAlpha: gameStore_3b.style.fillAlpha
      }
    }
    
    return gameStore_3b_methods.addGeometryObject(params)
  },

  // Clear all objects (enhanced)
  clearAllObjects: () => {
    console.log('gameStore_3b: Clearing all objects')
    
    // Clear local store
    gameStore_3b.geometry.objects = []
    gameStore_3b.ecsDataLayer.allObjects = []
    gameStore_3b.ecsDataLayer.visibleObjects = []
    gameStore_3b.objectStyles = {}  // Clear all per-object styles
    gameStore_3b_methods.clearSelectionEnhanced()
    
    // ✅ NEW: Clear dataLayerIntegration as well
    try {
      dataLayerIntegration.clearAllObjects()
      console.log('gameStore_3b: Cleared dataLayerIntegration objects')
    } catch (error) {
      console.warn('gameStore_3b: Failed to clear dataLayerIntegration:', error)
    }
  },
  
  // Legacy alias for compatibility
  clearAllGeometry: () => {
    gameStore_3b_methods.clearAllObjects()
  },

  // Get geometry statistics
  getGeometryStats: (): GeometryStats => {
    const stats = calculateGeometryStats(gameStore_3b.geometry.objects)
    
    // Update selected object count
    stats.selectedObjectCount = gameStore_3b.selection.selectedObjects.length
    
    return stats
  },

  // ================================
  // ✅ NEW: GEOMETRY PANEL METHODS
  // ================================

  // Toggle geometry panel
  toggleGeometryPanel: () => {
    const currentState = gameStore_3b.ui.geometryPanel.isOpen
    console.log('gameStore_3b: Toggling geometry panel from', currentState, 'to', !currentState)
    
    gameStore_3b.ui.geometryPanel.isOpen = !currentState
    gameStore_3b.ui.showGeometryPanel = !currentState
  },

  // Set geometry panel tab
  setGeometryPanelTab: (tab: 'draw' | 'style' | 'objects') => {
    console.log('gameStore_3b: Setting geometry panel tab to', tab)
    gameStore_3b.ui.geometryPanel.currentTab = tab
  },

  // Set current drawing mode (UI method)
  setCurrentDrawingMode: (mode: DrawingMode) => {
    console.log('gameStore_3b: Setting current drawing mode to', mode)
    gameStore_3b.ui.geometryPanel.currentDrawingMode = mode
    gameStore_3b.drawing.mode = mode
  },

  // Toggle geometry layer visibility
  toggleGeometry: () => {
    const currentState = gameStore_3b.ui.showGeometry
    console.log('gameStore_3b: Toggling geometry visibility from', currentState, 'to', !currentState)
    gameStore_3b.ui.showGeometry = !currentState
  },

  // ================================
  // ✅ NEW: CLIPBOARD SYSTEM METHODS
  // ================================

  // Copy object to clipboard
  copyObject: (objectId: string) => {
    const obj = gameStore_3b.geometry.objects.find(o => o.id === objectId)
    if (obj) {
      gameStore_3b.clipboard.copiedObject = { ...obj }
      gameStore_3b.clipboard.copiedAt = Date.now()
      console.log('gameStore_3b: Copied object', objectId, 'to clipboard')
    }
  },

  // Paste object from clipboard - ✅ FIXED: Center-based positioning
  pasteObject: (mousePosition?: PixeloidCoordinate) => {
    const copiedObj = gameStore_3b.clipboard.copiedObject
    if (!copiedObj) return null

    // Use current mouse position or default
    const pasteCenter = mousePosition || gameStore_3b.mouse.world

    // ✅ NEW: Calculate original object's center using existing method
    const originalCenter = gameStore_3b_methods.getShapeVisualAnchor(copiedObj)
    
    // ✅ NEW: Calculate offset from center to each vertex (like drag system)
    const centerToVertexOffsets = copiedObj.vertices.map(vertex => ({
      x: vertex.x - originalCenter.x,  // How far is this vertex from center?
      y: vertex.y - originalCenter.y
    }))
    
    // ✅ NEW: Reconstruct vertices with mouse position as new center
    const newVertices = centerToVertexOffsets.map(offset => ({
      x: pasteCenter.x + offset.x,  // mouse + offset = vertex
      y: pasteCenter.y + offset.y
    }))

    const params: CreateGeometricObjectParams = {
      type: copiedObj.type,
      vertices: newVertices,
      style: { ...copiedObj.style }
    }

    const newObjectId = gameStore_3b_methods.addGeometryObject(params)
    console.log('gameStore_3b: Pasted object with center at', pasteCenter, 'as', newObjectId)
    return newObjectId
  },

  // Check if clipboard has object
  hasClipboardObject: (): boolean => {
    return gameStore_3b.clipboard.copiedObject !== null
  },

  // ================================
  // ✅ NEW: SHAPE ANCHOR CALCULATION
  // ================================
  
  // Get the correct visual anchor for each shape type
  getShapeVisualAnchor: (obj: GeometricObject): PixeloidCoordinate => {
    switch (obj.type) {
      case 'point':
        return obj.vertices[0] || { x: 0, y: 0 }  // Point itself
        
      case 'line':
        return obj.vertices[0] || { x: 0, y: 0 }  // Start point
        
      case 'circle':
        // ✅ FIXED: Calculate actual center from circumference vertices
        if (obj.vertices.length < 3) return { x: 0, y: 0 }
        const sumX = obj.vertices.reduce((sum, v) => sum + v.x, 0)
        const sumY = obj.vertices.reduce((sum, v) => sum + v.y, 0)
        return {
          x: sumX / obj.vertices.length,
          y: sumY / obj.vertices.length
        }
        
      case 'rectangle':
        // ✅ FIXED: Use center for editing consistency
        if (obj.vertices.length < 4) return { x: 0, y: 0 }
        const rectVertices = obj.vertices
        return {
          x: (rectVertices[0].x + rectVertices[2].x) / 2,  // (top-left + bottom-right) / 2
          y: (rectVertices[0].y + rectVertices[2].y) / 2
        }
        
      case 'diamond':
        // ✅ FIXED: Use visual center, not vertices[0]
        if (obj.vertices.length < 4) return { x: 0, y: 0 }
        const diamondVertices = obj.vertices
        const centerX = (diamondVertices[0].x + diamondVertices[2].x) / 2  // west + east
        const centerY = (diamondVertices[1].y + diamondVertices[3].y) / 2  // north + south
        return { x: centerX, y: centerY }
        
      default:
        return obj.vertices[0] || { x: 0, y: 0 }
    }
  },
  
  // Get vertices for an object (helper method)
  getObjectVertices: (obj: GeometricObject): PixeloidCoordinate[] => {
    return obj.vertices || []
  },

  // ================================
  // ✅ NEW: DRAGGING SYSTEM METHODS
  // ================================

  // Start dragging object - NEW OFFSET-BASED APPROACH
  startDragging: (objectId: string, clickPosition: PixeloidCoordinate) => {
    const obj = gameStore_3b.geometry.objects.find(o => o.id === objectId)
    if (!obj) return false

    // ✅ NEW: Calculate offset from click position to each vertex
    const vertexOffsets = obj.vertices.map(vertex => ({
      x: vertex.x - clickPosition.x,  // How far is this vertex from click?
      y: vertex.y - clickPosition.y
    }))

    // Store minimal drag state
    gameStore_3b.dragging.isDragging = true
    gameStore_3b.dragging.dragObjectId = objectId
    gameStore_3b.dragging.clickPosition = clickPosition
    gameStore_3b.dragging.vertexOffsets = vertexOffsets

    console.log('gameStore_3b: Started dragging object', objectId, 'from', clickPosition, 'with offsets', vertexOffsets)
    return true
  },

  // Update dragging position - NEW PREVIEW-BASED APPROACH
  updateDragging: (currentMousePos: PixeloidCoordinate) => {
    if (!gameStore_3b.dragging.isDragging || !gameStore_3b.dragging.dragObjectId) return

    const { vertexOffsets } = gameStore_3b.dragging
    
    // ✅ NEW: Calculate preview vertices using offset inversion
    const previewVertices = vertexOffsets.map(offset => ({
      x: currentMousePos.x + offset.x,
      y: currentMousePos.y + offset.y
    }))
    
    // ✅ NEW: Update preview state (original object unchanged)
    gameStore_3b.dragPreview.isActive = true
    gameStore_3b.dragPreview.currentMousePosition = currentMousePos
    gameStore_3b.dragPreview.previewVertices = previewVertices
  },

  // Stop dragging - NEW FINAL COMMIT APPROACH
  stopDragging: (finalMousePos: PixeloidCoordinate) => {
    if (!gameStore_3b.dragging.isDragging || !gameStore_3b.dragging.dragObjectId) return

    const { vertexOffsets, dragObjectId } = gameStore_3b.dragging
    
    // ✅ NEW: Calculate final vertices using stored offsets
    const finalVertices = vertexOffsets.map(offset => ({
      x: finalMousePos.x + offset.x,
      y: finalMousePos.y + offset.y
    }))
    
    // ✅ NEW: NOW update the actual store object
    const objIndex = gameStore_3b.geometry.objects.findIndex(o => o.id === dragObjectId)
    if (objIndex !== -1) {
      gameStore_3b.geometry.objects[objIndex] = {
        ...gameStore_3b.geometry.objects[objIndex],
        vertices: finalVertices
      }
      console.log('gameStore_3b: Committed drag for object', dragObjectId, 'to', finalVertices)
    }
    
    // Clear drag state and preview
    gameStore_3b.dragging.isDragging = false
    gameStore_3b.dragging.dragObjectId = null
    gameStore_3b.dragging.clickPosition = null
    gameStore_3b.dragging.vertexOffsets = []
    
    gameStore_3b.dragPreview.isActive = false
    gameStore_3b.dragPreview.currentMousePosition = null
    gameStore_3b.dragPreview.previewVertices = []
  },

  // Cancel dragging - NEW SIMPLIFIED APPROACH
  cancelDragging: () => {
    if (!gameStore_3b.dragging.isDragging || !gameStore_3b.dragging.dragObjectId) return

    console.log('gameStore_3b: Cancelled dragging')
    
    // ✅ NEW: Just clear drag state and preview (original object unchanged)
    gameStore_3b.dragging.isDragging = false
    gameStore_3b.dragging.dragObjectId = null
    gameStore_3b.dragging.clickPosition = null
    gameStore_3b.dragging.vertexOffsets = []
    
    gameStore_3b.dragPreview.isActive = false
    gameStore_3b.dragPreview.currentMousePosition = null
    gameStore_3b.dragPreview.previewVertices = []
  },

  // Update last click time (for double-click detection)
  updateLastClickTime: () => {
    gameStore_3b.dragging.lastClickTime = Date.now()
  },

  // Check if double-click
  isDoubleClick: (): boolean => {
    const timeSinceLastClick = Date.now() - gameStore_3b.dragging.lastClickTime
    return timeSinceLastClick < 300 // 300ms double-click threshold
  },

  // ================================
  // ✅ NEW: INTERACTION STATE MACHINE
  // ================================

  // Handle mouse down event
  handleMouseDown: (position: PixeloidCoordinate) => {
    const now = Date.now()
    const interaction = gameStore_3b.interaction
    
    // Check if this is within double-click window
    if (interaction.clickCount === 1 && (now - interaction.firstClickTime) < interaction.doubleClickWindow) {
      // Second click within window
      interaction.clickCount = 2
      interaction.isHolding = true
      interaction.hasMoved = false
      interaction.lastMovePosition = position
      console.log('Interaction: Second click detected, holding=true')
    } else {
      // First click or timeout exceeded
      interaction.clickCount = 1
      interaction.firstClickTime = now
      interaction.isHolding = true
      interaction.hasMoved = false
      interaction.lastMovePosition = position
      console.log('Interaction: First click detected')
    }
  },

  // Handle mouse move event
  handleMouseMove: (position: PixeloidCoordinate) => {
    const interaction = gameStore_3b.interaction
    
    if (!interaction.isHolding || !interaction.lastMovePosition) return
    
    // Calculate distance moved
    const dx = position.x - interaction.lastMovePosition.x
    const dy = position.y - interaction.lastMovePosition.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    // Check if moved beyond threshold
    if (distance > interaction.dragThreshold) {
      interaction.hasMoved = true
      
      // Start dragging if conditions are met
      if (interaction.clickCount === 2) {
        // Double-click-and-hold = immediate drag
        console.log('Interaction: Double-click-and-hold drag detected')
        return 'double-click-drag'
      } else if (interaction.clickCount === 1 && gameStore_3b.selection.selectedObjectId) {
        // Single-click-hold on selected object = drag
        console.log('Interaction: Single-click-hold drag detected')
        return 'single-click-drag'
      }
    }
    
    return 'move'
  },

  // Handle mouse up event
  handleMouseUp: (position: PixeloidCoordinate) => {
    const interaction = gameStore_3b.interaction
    
    if (!interaction.isHolding) return 'none'
    
    interaction.isHolding = false
    
    // Determine action based on click count and movement
    if (interaction.clickCount === 2 && !interaction.hasMoved) {
      // Double-click-release = selection only
      console.log('Interaction: Double-click-release detected')
      return 'double-click-select'
    } else if (interaction.clickCount === 1 && !interaction.hasMoved) {
      // Single-click-release = selection
      console.log('Interaction: Single-click-release detected')
      return 'single-click-select'
    } else if (interaction.hasMoved) {
      // Mouse was moved = dragging finished
      console.log('Interaction: Drag finished')
      return 'drag-finish'
    }
    
    return 'none'
  },

  // Reset interaction state
  resetInteraction: () => {
    gameStore_3b.interaction.clickCount = 0
    gameStore_3b.interaction.firstClickTime = 0
    gameStore_3b.interaction.isHolding = false
    gameStore_3b.interaction.hasMoved = false
    gameStore_3b.interaction.lastMovePosition = null
    console.log('Interaction: State reset')
  },

  // ================================
  // ✅ NEW: PROPERTY-BASED OBJECT MANAGEMENT
  // ================================

  /**
   * Enhanced object creation with automatic property calculation
   */
  addGeometryObjectWithProperties: (params: CreateGeometricObjectParams) => {
    console.log('gameStore_3b: Adding geometry object with calculated properties', params)
    
    try {
      // Calculate properties immediately
      const properties = GeometryPropertyCalculators.calculateProperties(params.type, params.vertices)
      const bounds = calculateObjectBounds(params.vertices)
      
      const newObject: GeometricObject = {
        id: `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: params.type,
        vertices: params.vertices,
        isVisible: true,
        createdAt: Date.now(),
        style: params.style,
        bounds: bounds,
        properties: properties  // ✅ Store-maintained properties
      }
      
      gameStore_3b.geometry.objects.push(newObject)
      console.log('gameStore_3b: Created object with properties', newObject.id, properties)
      return newObject.id
      
    } catch (error) {
      console.error('Failed to create object with properties:', error)
      // Fallback to existing method
      return gameStore_3b_methods.addGeometryObject(params)
    }
  },

  /**
   * Enhanced object update - VERTEX AUTHORITY (properties preserved)
   */
  updateGeometryObjectVertices: (objectId: string, newVertices: PixeloidCoordinate[]) => {
    const objIndex = gameStore_3b.geometry.objects.findIndex(obj => obj.id === objectId)
    if (objIndex === -1) return false
    
    const obj = gameStore_3b.geometry.objects[objIndex]
    
    try {
      // ✅ VERTEX AUTHORITY: Only update vertices and bounds, preserve properties
      const newBounds = calculateObjectBounds(newVertices)
      
      // Update object with new vertices but PRESERVE original properties
      gameStore_3b.geometry.objects[objIndex] = {
        ...obj,
        vertices: newVertices,
        bounds: newBounds,
        properties: obj.properties  // ✅ PRESERVE ORIGINAL PROPERTIES
      }
      
      console.log('gameStore_3b: Updated object vertices (properties preserved)', objectId)
      return true
      
    } catch (error) {
      console.error('Failed to update object vertices:', error)
      return false
    }
  },

  /**
   * Update circle from center and radius properties - FIXED APPROACH
   */
  updateCircleFromProperties: (objectId: string, center: PixeloidCoordinate, radius: number) => {
    const obj = gameStore_3b.geometry.objects.find(o => o.id === objectId)
    if (!obj || obj.type !== 'circle') {
      console.warn('updateCircleFromProperties: Object not found or not a circle', objectId)
      return false
    }
    
    // Get current center and radius from properties
    const currentCenter = gameStore_3b_methods.getObjectCenter(objectId)
    const currentRadius = obj.properties?.type === 'circle' ? obj.properties.radius : undefined
    
    if (!currentCenter || currentRadius === undefined) {
      console.warn('updateCircleFromProperties: Could not get current properties')
      return false
    }
    
    // Check what changed
    const centerChanged = Math.abs(center.x - currentCenter.x) > 0.01 ||
                         Math.abs(center.y - currentCenter.y) > 0.01
    const radiusChanged = Math.abs(radius - currentRadius) > 0.01
    
    if (centerChanged && !radiusChanged) {
      // ✅ POSITION ONLY: Use movement-based approach
      console.log('Circle position changed, using movement approach')
      return gameStore_3b_methods.updateObjectPosition(objectId, center)
    } else {
      // ✅ SIZE CHANGE: Regenerate vertices (preserves properties)
      console.log('Circle size changed, regenerating vertices')
      try {
        const newVertices = GeometryVertexGenerators.generateCircleFromProperties(center, radius)
        
        if (!GeometryVertexGenerators.validateVertices(newVertices, 'circle')) {
          console.error('Generated invalid circle vertices')
          return false
        }
        
        return gameStore_3b_methods.updateGeometryObjectVertices(objectId, newVertices)
      } catch (error) {
        console.error('Failed to update circle from properties:', error)
        return false
      }
    }
  },

  /**
   * Update circle radius only (preserves position)
   */
  updateCircleRadius: (objectId: string, newRadius: number) => {
    const obj = gameStore_3b.geometry.objects.find(o => o.id === objectId)
    if (!obj || obj.type !== 'circle' || !obj.properties) return false
    
    const center = obj.properties.type === 'circle' ? obj.properties.center : null
    if (!center) return false
    
    const newVertices = GeometryVertexGenerators.generateCircleFromProperties(center, newRadius)
    
    return gameStore_3b_methods.updateGeometryObjectVertices(objectId, newVertices)
  },

  /**
   * Update rectangle size only (preserves position)
   */
  updateRectangleSize: (objectId: string, newWidth: number, newHeight: number) => {
    const obj = gameStore_3b.geometry.objects.find(o => o.id === objectId)
    if (!obj || obj.type !== 'rectangle' || !obj.properties) return false
    
    const center = obj.properties.type === 'rectangle' ? obj.properties.center : null
    if (!center) return false
    
    const newVertices = GeometryVertexGenerators.generateRectangleFromProperties(center, newWidth, newHeight)
    
    return gameStore_3b_methods.updateGeometryObjectVertices(objectId, newVertices)
  },

  /**
   * Update diamond size only (preserves position and isometric proportions)
   */
  updateDiamondSize: (objectId: string, newWidth: number, newHeight: number) => {
    const obj = gameStore_3b.geometry.objects.find(o => o.id === objectId)
    if (!obj || obj.type !== 'diamond' || !obj.properties) return false
    
    const center = obj.properties.type === 'diamond' ? obj.properties.center : null
    if (!center) return false
    
    const newVertices = GeometryVertexGenerators.generateDiamondFromProperties(center, newWidth, newHeight)
    
    return gameStore_3b_methods.updateGeometryObjectVertices(objectId, newVertices)
  },

  /**
   * Update rectangle from center and dimensions properties
   */
  updateRectangleFromProperties: (objectId: string, center: PixeloidCoordinate, width: number, height: number) => {
    const obj = gameStore_3b.geometry.objects.find(o => o.id === objectId)
    if (!obj || obj.type !== 'rectangle') {
      console.warn('updateRectangleFromProperties: Object not found or not a rectangle', objectId)
      return false
    }
    
    try {
      // Generate new vertices from properties
      const newVertices = GeometryVertexGenerators.generateRectangleFromProperties(center, width, height)
      
      // Validate vertices
      if (!GeometryVertexGenerators.validateVertices(newVertices, 'rectangle')) {
        console.error('Generated invalid rectangle vertices')
        return false
      }
      
      // Use the enhanced update method (which recalculates properties)
      return gameStore_3b_methods.updateGeometryObjectVertices(objectId, newVertices)
      
    } catch (error) {
      console.error('Failed to update rectangle from properties:', error)
      return false
    }
  },

  /**
   * Update line from start and end point properties
   */
  updateLineFromProperties: (objectId: string, startPoint: PixeloidCoordinate, endPoint: PixeloidCoordinate) => {
    const obj = gameStore_3b.geometry.objects.find(o => o.id === objectId)
    if (!obj || obj.type !== 'line') {
      console.warn('updateLineFromProperties: Object not found or not a line', objectId)
      return false
    }
    
    try {
      // Generate new vertices from properties
      const newVertices = GeometryVertexGenerators.generateLineFromProperties(startPoint, endPoint)
      
      // Validate vertices
      if (!GeometryVertexGenerators.validateVertices(newVertices, 'line')) {
        console.error('Generated invalid line vertices')
        return false
      }
      
      // Use the enhanced update method (which recalculates properties)
      return gameStore_3b_methods.updateGeometryObjectVertices(objectId, newVertices)
      
    } catch (error) {
      console.error('Failed to update line from properties:', error)
      return false
    }
  },

  /**
   * Update diamond from center and dimensions properties
   */
  updateDiamondFromProperties: (objectId: string, center: PixeloidCoordinate, width: number, height: number) => {
    const obj = gameStore_3b.geometry.objects.find(o => o.id === objectId)
    if (!obj || obj.type !== 'diamond') {
      console.warn('updateDiamondFromProperties: Object not found or not a diamond', objectId)
      return false
    }
    
    try {
      // Generate new vertices from properties
      const newVertices = GeometryVertexGenerators.generateDiamondFromProperties(center, width, height)
      
      // Validate vertices
      if (!GeometryVertexGenerators.validateVertices(newVertices, 'diamond')) {
        console.error('Generated invalid diamond vertices')
        return false
      }
      
      // Use the enhanced update method (which recalculates properties)
      return gameStore_3b_methods.updateGeometryObjectVertices(objectId, newVertices)
      
    } catch (error) {
      console.error('Failed to update diamond from properties:', error)
      return false
    }
  },

  /**
   * Movement-based position update (like drag system)
   * Preserves shape perfectly by moving vertices instead of regenerating
   */
  updateObjectPosition: (objectId: string, newCenter: PixeloidCoordinate) => {
    const obj = gameStore_3b.geometry.objects.find(o => o.id === objectId)
    if (!obj || !obj.properties) return false
    
    // Get current center from stored properties
    const currentCenter = gameStore_3b_methods.getObjectCenter(objectId)
    if (!currentCenter) return false
    
    // Calculate offset like drag system
    const offset = {
      x: newCenter.x - currentCenter.x,
      y: newCenter.y - currentCenter.y
    }
    
    // Move all vertices by offset (preserves shape perfectly)
    const newVertices = obj.vertices.map(vertex => ({
      x: vertex.x + offset.x,
      y: vertex.y + offset.y
    }))
    
    // Update vertices and recalculate properties from moved vertices
    const newProperties = GeometryPropertyCalculators.calculateProperties(obj.type, newVertices)
    const newBounds = calculateObjectBounds(newVertices)
    
    const objIndex = gameStore_3b.geometry.objects.findIndex(o => o.id === objectId)
    gameStore_3b.geometry.objects[objIndex] = {
      ...obj,
      vertices: newVertices,
      properties: newProperties,  // ✅ Recalculated from moved vertices
      bounds: newBounds
    }
    
    console.log('gameStore_3b: Moved object', objectId, 'by offset', offset)
    return true
  },

  /**
   * Direct property access (No More Calculations!)
   */
  getObjectProperties: (objectId: string): GeometryProperties | null => {
    const obj = gameStore_3b.geometry.objects.find(o => o.id === objectId)
    return obj?.properties || null
  },

  /**
   * Get object center from stored properties (type-safe)
   */
  getObjectCenter: (objectId: string): PixeloidCoordinate | null => {
    const properties = gameStore_3b_methods.getObjectProperties(objectId)
    if (!properties) return null
    
    switch (properties.type) {
      case 'point':
      case 'circle':
      case 'rectangle':
      case 'diamond':
        return properties.center
      case 'line':
        return properties.midpoint  // Lines use midpoint as center
      default:
        return null
    }
  },

  /**
   * Replace broken getShapeVisualAnchor with property-based version
   */
  getShapeVisualAnchorFixed: (obj: GeometricObject): PixeloidCoordinate => {
    // ✅ FIXED: Use stored properties instead of broken calculations
    const properties = obj.properties
    switch (properties.type) {
      case 'point':
      case 'circle':
      case 'rectangle':
      case 'diamond':
        return properties.center
      case 'line':
        return properties.midpoint  // Lines use midpoint as anchor
      default:
        // Fallback to first vertex
        return obj.vertices[0] || { x: 0, y: 0 }
    }
  },

  // ================================
  // ✅ NEW: OBJECT EDIT PREVIEW SYSTEM (like drag system)
  // ================================

  // Start object editing - create preview state
  startObjectEdit: (objectId: string) => {
    const obj = gameStore_3b.geometry.objects.find(o => o.id === objectId)
    if (!obj) {
      console.warn('startObjectEdit: Object not found', objectId)
      return false
    }

    // Store original for restoration
    gameStore_3b.editPreview.isActive = true
    gameStore_3b.editPreview.editingObjectId = objectId
    gameStore_3b.editPreview.originalObject = { ...obj } // Deep copy
    gameStore_3b.editPreview.previewData = {
      previewProperties: obj.properties,
      previewVertices: [...obj.vertices],
      previewStyle: { ...obj.style },
      previewBounds: { ...obj.bounds },
      isValid: true,
      hasChanges: false,
      lastUpdateTime: Date.now()
    }

    console.log('gameStore_3b: Started object edit for', objectId)
    return true
  },

  // Update edit preview from form data (NO store spam)
  updateEditPreview: (formData: ObjectEditFormData) => {
    if (!gameStore_3b.editPreview.isActive || !gameStore_3b.editPreview.previewData) {
      return false
    }

    try {
      // Generate preview vertices from form input (like creation)
      let previewVertices: PixeloidCoordinate[] = []
      let previewProperties: GeometryProperties | null = null

      // Use form data to generate vertices (VERTEX AUTHORITY - from properties)
      switch (formData.point?.centerX !== undefined ? 'point' :
              formData.line?.startX !== undefined ? 'line' :
              formData.circle?.centerX !== undefined ? 'circle' :
              formData.rectangle?.centerX !== undefined ? 'rectangle' :
              formData.diamond?.centerX !== undefined ? 'diamond' : 'unknown') {
        
        case 'point':
          const pointCenter = { x: formData.point!.centerX, y: formData.point!.centerY }
          previewVertices = GeometryVertexGenerators.generatePointFromProperties(pointCenter)
          // ✅ FIXED: Use VERTEX AUTHORITY - calculate properties from generated vertices
          previewProperties = GeometryPropertyCalculators.calculatePointProperties(previewVertices)
          break

        case 'line':
          const lineStart = { x: formData.line!.startX, y: formData.line!.startY }
          const lineEnd = { x: formData.line!.endX, y: formData.line!.endY }
          previewVertices = GeometryVertexGenerators.generateLineFromProperties(lineStart, lineEnd)
          // ✅ FIXED: Use VERTEX AUTHORITY - calculate properties from generated vertices
          previewProperties = GeometryPropertyCalculators.calculateLineProperties(previewVertices)
          break

        case 'circle':
          const circleCenter = { x: formData.circle!.centerX, y: formData.circle!.centerY }
          const circleRadius = formData.circle!.radius
          previewVertices = GeometryVertexGenerators.generateCircleFromProperties(circleCenter, circleRadius)
          // ✅ FIXED: Use VERTEX AUTHORITY - calculate properties from generated vertices
          previewProperties = GeometryPropertyCalculators.calculateCircleProperties(previewVertices)
          break

        case 'rectangle':
          const rectCenter = { x: formData.rectangle!.centerX, y: formData.rectangle!.centerY }
          const rectWidth = formData.rectangle!.width
          const rectHeight = formData.rectangle!.height
          previewVertices = GeometryVertexGenerators.generateRectangleFromProperties(rectCenter, rectWidth, rectHeight)
          // ✅ FIXED: Use VERTEX AUTHORITY - calculate properties from generated vertices
          previewProperties = GeometryPropertyCalculators.calculateRectangleProperties(previewVertices)
          break

        case 'diamond':
          const diamondCenter = { x: formData.diamond!.centerX, y: formData.diamond!.centerY }
          const diamondWidth = formData.diamond!.width
          const diamondHeight = formData.diamond!.height
          previewVertices = GeometryVertexGenerators.generateDiamondFromProperties(diamondCenter, diamondWidth, diamondHeight)
          // ✅ FIXED: Use VERTEX AUTHORITY - calculate properties from generated vertices
          previewProperties = GeometryPropertyCalculators.calculateDiamondProperties(previewVertices)
          break

        default:
          console.warn('updateEditPreview: Unknown form data type')
          return false
      }

      // Update preview state ONLY (original object unchanged)
      gameStore_3b.editPreview.previewData.previewVertices = previewVertices
      gameStore_3b.editPreview.previewData.previewProperties = previewProperties
      gameStore_3b.editPreview.previewData.previewBounds = calculateObjectBounds(previewVertices)
      gameStore_3b.editPreview.previewData.hasChanges = true
      gameStore_3b.editPreview.previewData.lastUpdateTime = Date.now()

      console.log('gameStore_3b: Updated edit preview (no store spam)')
      return true

    } catch (error) {
      console.error('Failed to update edit preview:', error)
      return false
    }
  },

  // Apply edit changes - single store commit (like drag system)
  applyObjectEdit: () => {
    if (!gameStore_3b.editPreview.isActive ||
        !gameStore_3b.editPreview.editingObjectId ||
        !gameStore_3b.editPreview.previewData) {
      return false
    }

    const { editingObjectId, previewData } = gameStore_3b.editPreview

    try {
      // SINGLE store update with preview data
      const success = gameStore_3b_methods.updateGeometryObjectVertices(
        editingObjectId,
        previewData.previewVertices
      )

      if (success) {
        // Clear edit preview state
        gameStore_3b_methods.clearObjectEdit()
        console.log('gameStore_3b: Applied object edit changes')
        return true
      }

      return false

    } catch (error) {
      console.error('Failed to apply object edit:', error)
      return false
    }
  },

  // Cancel edit changes - restore original (like drag system)
  cancelObjectEdit: () => {
    if (!gameStore_3b.editPreview.isActive) {
      return false
    }

    // Original already preserved, just clear preview
    gameStore_3b_methods.clearObjectEdit()
    console.log('gameStore_3b: Cancelled object edit')
    return true
  },

  // Clear edit preview state (like drag system)
  clearObjectEdit: () => {
    gameStore_3b.editPreview.isActive = false
    gameStore_3b.editPreview.editingObjectId = null
    gameStore_3b.editPreview.originalObject = null
    gameStore_3b.editPreview.previewData = null
    console.log('gameStore_3b: Cleared object edit state')
  },

  // Get object for rendering (preview or original)
  getObjectForRender: (objectId: string): GeometricObject | null => {
    // If editing this object, return preview version
    if (gameStore_3b.editPreview.isActive &&
        gameStore_3b.editPreview.editingObjectId === objectId &&
        gameStore_3b.editPreview.previewData) {
      
      const original = gameStore_3b.editPreview.originalObject!
      const preview = gameStore_3b.editPreview.previewData
      
      return {
        ...original,
        vertices: preview.previewVertices,
        properties: preview.previewProperties!,
        bounds: preview.previewBounds!
      }
    }

    // Return original object
    return gameStore_3b.geometry.objects.find(o => o.id === objectId) || null
  }
}

// ================================
// UTILITY FUNCTIONS (for factory compatibility)
// ================================

/**
 * Calculate object bounds from vertices (used by factory)
 */
function calculateObjectBounds(vertices: PixeloidCoordinate[]): ECSBoundingBox {
  if (vertices.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 }
  }
  
  const xs = vertices.map(v => v.x)
  const ys = vertices.map(v => v.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  }
}

// Export for Phase 3b implementation
export default gameStore_3b