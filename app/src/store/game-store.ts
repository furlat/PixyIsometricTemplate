/**
 * Game Store - Clean Modular Architecture (CORRECTED)
 *
 * Single entry point with modular dispatch to action submodules.
 * Uses REAL types from actual codebase.
 */

import { proxy } from 'valtio'
import type {
  GeometricObject,
  StyleSettings,
  DrawingMode,
  PixeloidCoordinate,
  GameStoreData,
  CreateObjectParams,
  ObjectDimensions,
  PreviewUpdateData
} from '../types'  // All types from proper location

// Import action modules
import { CreateActions } from './actions/CreateActions'
import { EditActions } from './actions/EditActions'
import { PreviewSystem } from './systems/PreviewSystem'

// Import new actions for _3b integration
import {
  updateMouseVertex,
  updateMousePosition,
  updateNavigationOffset,
  resetNavigationOffset,
  updateMeshData,
  toggleGrid,
  toggleMouse,
  toggleCheckboard,
  setMouseHighlightColor,
  setMouseHighlightIntensity,
  copyObject,
  pasteObject,
  hasClipboardObject,
  cancelDrawing,
  clearSelectionEnhanced,
  cancelDragging,
  startDragging,
  updateDragPosition
} from './actions/EditActions'

// ================================
// STORE INSTANCE (CORRECTED DEFAULTS)
// ================================

export const gameStore = proxy<GameStoreData>({
  objects: [],
  
  selection: {
    selectedId: null,
    selectionBounds: null
  },
  
  preview: {
    isActive: false,
    editingObjectId: null,  // CORRECTED: based on real ObjectEditPreviewState
    originalObject: null,
    previewData: null,
    shouldShowPreview: true,
    previewOpacity: 0.8
  },
  
  drawing: {
    mode: 'none',
    isDrawing: false,
    startPoint: null,
    currentPoint: null,
    settings: {
      previewOpacity: 0.7
    }
  },
  
  // CORRECTED: Use real StyleSettings defaults
  defaultStyle: {
    color: 0x0066cc,
    strokeWidth: 2,
    fillColor: 0x0066cc,
    fillEnabled: false,
    strokeAlpha: 1.0,
    fillAlpha: 0.3,
    highlightColor: 0xff6600,
    selectionColor: 0xff0000
  },
  
  ui: {
    showGeometry: true,
    showGeometryPanel: false,
    showStorePanel: false,
    isEditPanelOpen: false,
    
    // ✅ ADD DEFAULT VALUES FOR _3b FILES
    showGrid: true,
    showMouse: true,
    enableCheckboard: false,     // Start disabled - user can toggle
    showLayerToggle: false,      // Start hidden
    mouse: {
      highlightColor: 0xff0000,  // Red default
      highlightIntensity: 0.7    // 70% intensity
    }
  },
  
  mouse: {
    position: { x: 0, y: 0 },
    isOverObject: false,
    hoveredObjectId: null,
    
    // ✅ ADD DEFAULT VALUES FOR _3b FILES
    vertex: { x: 0, y: 0 },
    world: { x: 0, y: 0 }
  },
  
  navigation: {
    offset: { x: 0, y: 0 },
    isDragging: false,
    moveAmount: 5  // ✅ FASTER: Increased from 1 to 5 for smooth 60 FPS movement
  },
  
  mesh: {
    cellSize: 1,   // ✅ FIXED: Scale 1 for proper coordinate system
    vertexData: null,
    dimensions: null,
    needsUpdate: false
  },
  
  // Clipboard system defaults
  clipboard: {
    objectData: null,
    hasObject: false
  },
  
  // Dragging system defaults
  dragging: {
    isDragging: false,
    draggedObjectId: null,
    dragStartPosition: null,
    currentDragPosition: null,
    vertexOffsets: []
  },
  
  // Style system extensions
  objectStyles: {},
  
  // Drag preview system
  dragPreview: {
    isActive: false,
    currentMousePosition: null,
    previewVertices: []
  }
})

// ================================
// SINGLE ENTRY POINT METHODS (CORRECTED TYPES)
// ================================

export const gameStore_methods = {
  // ==========================================
  // CREATION OPERATIONS (dispatch to CreateActions - placeholder)
  // ==========================================
  
  createObject(params: CreateObjectParams): string {
    return CreateActions.createObject(gameStore, params)
  },
  
  finishDrawing(mode: DrawingMode, startPoint: PixeloidCoordinate, endPoint: PixeloidCoordinate): string {
    return CreateActions.finishDrawing(gameStore, mode, startPoint, endPoint)
  },
  
  // ==========================================
  // EDIT OPERATIONS (dispatch to EditActions - placeholder)
  // ==========================================
  
  removeObject(objectId: string): void {
    EditActions.removeObject(gameStore, objectId)
  },
  
  selectObject(objectId: string): void {
    EditActions.selectObject(gameStore, objectId)
  },
  
  clearSelection(): void {
    EditActions.clearSelection(gameStore)
  },
  
  // UNIFIED MOVEMENT (drag OR edit panel)
  moveObject(objectId: string, newVertices: PixeloidCoordinate[]): void {
    EditActions.moveObject(gameStore, objectId, newVertices)
  },
  
  // UNIFIED RESIZING
  resizeObject(objectId: string, newDimensions: ObjectDimensions): void {
    EditActions.resizeObject(gameStore, objectId, newDimensions)
  },
  
  // ==========================================
  // PREVIEW OPERATIONS (dispatch to PreviewSystem - placeholder)
  // ==========================================
  
  startPreview(operation: 'create' | 'move' | 'resize', originalObjectId?: string): void {
    PreviewSystem.startPreview(gameStore, operation, originalObjectId)
  },
  
  updatePreview(data: PreviewUpdateData): void {
    PreviewSystem.updatePreview(gameStore, data)
  },
  
  commitPreview(): void {
    PreviewSystem.commitPreview(gameStore)
  },
  
  cancelPreview(): void {
    PreviewSystem.cancelPreview(gameStore)
  },
  
  // ==========================================
  // STYLE OPERATIONS (CORRECTED TYPE)
  // ==========================================
  
  setDefaultStyle(style: Partial<StyleSettings>): void {  // CORRECTED: StyleSettings
    Object.assign(gameStore.defaultStyle, style)
  },
  
  resetDefaultStyle(): void {
    // CORRECTED: Use real StyleSettings structure
    gameStore.defaultStyle = {
      color: 0x0066cc,
      strokeWidth: 2,
      fillColor: 0x0066cc,
      fillEnabled: false,
      strokeAlpha: 1.0,
      fillAlpha: 0.3,
      highlightColor: 0xff6600,
      selectionColor: 0xff0000
    }
  },
  
  // ==========================================
  // DRAWING OPERATIONS
  // ==========================================
  
  setDrawingMode(mode: DrawingMode): void {
    gameStore.drawing.mode = mode
    if (mode === 'none') {
      gameStore.drawing.isDrawing = false
      gameStore.drawing.startPoint = null
      gameStore.drawing.currentPoint = null
    }
  },
  
  startDrawing(point: PixeloidCoordinate): void {
    if (gameStore.drawing.mode === 'none') return
    
    gameStore.drawing.isDrawing = true
    gameStore.drawing.startPoint = point
    gameStore.drawing.currentPoint = point
  },
  
  updateDrawing(point: PixeloidCoordinate): void {
    if (!gameStore.drawing.isDrawing) return
    gameStore.drawing.currentPoint = point
  },
  
  // ==========================================
  // UTILITY OPERATIONS
  // ==========================================
  
  clearAllObjects(): void {
    EditActions.clearAllObjects(gameStore)
  },
  
  getObjectById(objectId: string): GeometricObject | null {
    return gameStore.objects.find(obj => obj.id === objectId) || null
  },
  
  getSelectedObject(): GeometricObject | null {
    return gameStore.selection.selectedId 
      ? this.getObjectById(gameStore.selection.selectedId)
      : null
  },
  
  // ==========================================
  // MOUSE & NAVIGATION
  // ==========================================
  
  // ===================================================================
  // MOUSE & NAVIGATION (UPDATED FOR _3b FILE INTEGRATION)
  // ===================================================================
  
  // Mouse tracking for _3b files
  updateMouseVertex(x: number, y: number): void {
    updateMouseVertex(gameStore, x, y)
  },
  
  updateMousePosition(x: number, y: number): void {
    updateMousePosition(gameStore, x, y)
  },
  
  // Navigation for _3b files
  updateNavigationOffset(deltaX: number, deltaY: number): void {
    updateNavigationOffset(gameStore, deltaX, deltaY)
  },
  
  resetNavigationOffset(): void {
    resetNavigationOffset(gameStore)
  },
  
  // Mesh data for _3b files
  updateMeshData(vertices: Float32Array, cellSize: number, dimensions: { width: number, height: number }): void {
    updateMeshData(gameStore, vertices, cellSize, dimensions)
  },
  
  // UI toggles for _3b files
  toggleGrid(): void {
    toggleGrid(gameStore)
  },
  
  toggleMouse(): void {
    toggleMouse(gameStore)
  },
  
  toggleCheckboard(): void {
    toggleCheckboard(gameStore)
  },
  
  setMouseHighlightColor(color: number): void {
    setMouseHighlightColor(gameStore, color)
  },
  
  setMouseHighlightIntensity(intensity: number): void {
    setMouseHighlightIntensity(gameStore, intensity)
  },
  
  // ===================================================================
  // INPUTMANAGER_3B INTEGRATION METHODS (SURGICAL EXTENSION)
  // ===================================================================
  
  // Clipboard system
  copyObject(objectId: string): void {
    copyObject(gameStore, objectId)
  },
  
  pasteObject(position: PixeloidCoordinate): string {
    return pasteObject(gameStore, position)
  },
  
  hasClipboardObject(): boolean {
    return hasClipboardObject(gameStore)
  },
  
  // Drawing system extensions (enhanced setDrawingMode)
  cancelDrawing(): void {
    cancelDrawing(gameStore)
  },
  
  // Note: We override the existing setDrawingMode with enhanced version
  // setDrawingMode(mode: DrawingMode): void {
  //   setDrawingModeEnhanced(gameStore, mode)
  // },
  
  // Selection system extensions
  clearSelectionEnhanced(): void {
    clearSelectionEnhanced(gameStore)
  },
  
  deleteSelected(): void {
    if (gameStore.selection.selectedId) {
      EditActions.removeObject(gameStore, gameStore.selection.selectedId)
    }
  },
  
  // Dragging system
  cancelDragging(): void {
    cancelDragging(gameStore)
  },
  
  startDragging(objectId: string, position: PixeloidCoordinate): void {
    startDragging(gameStore, objectId, position)
  },
  
  updateDragPosition(position: PixeloidCoordinate): void {
    updateDragPosition(gameStore, position)
  },

  // ===================================================================
  // UI PANEL TOGGLE METHODS (FOR _3b UI COMPONENTS)
  // ===================================================================

  // Panel toggle methods (missing from unified store)
  toggleStorePanel(): void {
    gameStore.ui.showStorePanel = !gameStore.ui.showStorePanel
  },

  toggleGeometryPanel(): void {
    gameStore.ui.showGeometryPanel = !gameStore.ui.showGeometryPanel
  },

  toggleLayerToggle(): void {
    gameStore.ui.showLayerToggle = !gameStore.ui.showLayerToggle
  },

  toggleGeometry(): void {
    gameStore.ui.showGeometry = !gameStore.ui.showGeometry
  },

  // ===================================================================
  // STYLE SHORTCUT METHODS (FOR GEOMETRYPANEL_3B)
  // ===================================================================

  // Style shortcut methods (use existing setDefaultStyle under the hood)
  setStrokeColor(color: number): void {
    this.setDefaultStyle({ color })
  },

  setStrokeWidth(width: number): void {
    this.setDefaultStyle({ strokeWidth: width })
  },

  setFillColor(color: number): void {
    this.setDefaultStyle({ fillColor: color })
  },

  setFillEnabled(enabled: boolean): void {
    this.setDefaultStyle({ fillEnabled: enabled })
  },

  setFillAlpha(alpha: number): void {
    this.setDefaultStyle({ fillAlpha: alpha })
  },

  setStrokeAlpha(alpha: number): void {
    this.setDefaultStyle({ strokeAlpha: alpha })
  },

  // ===================================================================
  // MOUSE/MESH EXTENDED METHODS (FOR STOREPANEL_3B)
  // ===================================================================

  // Mouse screen position update (alias for mouse.position)
  updateMouseScreen(x: number, y: number): void {
    // Use existing mouse position update logic
    gameStore.mouse.position = { x, y }
  }

  // Note: updateMeshData already exists above, no need to duplicate
}

// ================================
// NO LOCAL TYPE DEFINITIONS (MOVED TO TYPES DIRECTORY)
// ================================
// All types now imported from '../types' for proper separation