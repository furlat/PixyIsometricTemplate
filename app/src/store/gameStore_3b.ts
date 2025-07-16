// app/src/store/gameStore_3b.ts - Fixed coordinate system with Phase 3B extensions
import { proxy } from 'valtio'
import { PixeloidCoordinate, VertexCoordinate } from '../types/ecs-coordinates'
import { GeometricObject, CreateGeometricObjectParams, ECSDataLayer, createECSDataLayer } from '../types/ecs-data-layer'
import { MeshLevel, MeshVertexData } from '../types/mesh-system'
import {
  DrawingMode,
  DrawingState,
  StyleSettings,
  SelectionState,
  GeometryPanelState,
  GeometryStats,
  createDefaultDrawingSettings,
  createDefaultStyleSettings,
  createDefaultSelectionState,
  createDefaultGeometryPanelState,
  createDefaultPreviewState,
  createDefaultAnchorConfiguration,
  calculateGeometryStats
} from '../types/geometry-drawing'
import { dataLayerIntegration } from './ecs-data-layer-integration'
import { coordinateWASDMovement } from './ecs-coordination-functions'
import { GeometryHelper_3b } from '../game/GeometryHelper_3b'

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
    anchors: createDefaultAnchorConfiguration(),
    isDrawing: false,
    startPoint: null,
    currentStroke: []
  },
  
  // ✅ NEW: Style System
  style: createDefaultStyleSettings(),
  
  // ✅ NEW: Selection System
  selection: createDefaultSelectionState(),
  
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
    console.log('gameStore_3b: Updating mouse position', { vertexX, vertexY })
    
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

  updateMeshDataLegacy: (vertexData: MeshVertexData) => {
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
    
    // Create the actual geometry object
    const geometryParams: CreateGeometricObjectParams = {
      type: previewObj.type,
      vertices: previewObj.vertices,
      style: previewObj.style
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
    gameStore_3b.style.defaultColor = color
  },

  // Set fill color
  setFillColor: (color: number) => {
    console.log('gameStore_3b: Setting fill color to', color.toString(16))
    gameStore_3b.style.defaultFillColor = color
  },

  // Set stroke width
  setStrokeWidth: (width: number) => {
    console.log('gameStore_3b: Setting stroke width to', width)
    gameStore_3b.style.defaultStrokeWidth = Math.max(1, width)
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
      style: gameStore_3b.style
    }
    
    return gameStore_3b_methods.addGeometryObject(params)
  },

  // Clear all geometry
  clearAllGeometry: () => {
    console.log('gameStore_3b: Clearing all geometry')
    
    gameStore_3b.geometry.objects = []
    gameStore_3b.ecsDataLayer.allObjects = []
    gameStore_3b.ecsDataLayer.visibleObjects = []
    gameStore_3b_methods.clearSelectionEnhanced()
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
  }
}

// Export for Phase 3b implementation
export default gameStore_3b