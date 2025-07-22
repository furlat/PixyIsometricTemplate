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
    currentPoint: null
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
    isEditPanelOpen: false
  },
  
  mouse: {
    position: { x: 0, y: 0 },
    isOverObject: false,
    hoveredObjectId: null
  },
  
  navigation: {
    offset: { x: 0, y: 0 },
    isDragging: false
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
  
  updateMousePosition(position: PixeloidCoordinate): void {
    gameStore.mouse.position = position
  },
  
  updateNavigationOffset(deltaX: number, deltaY: number): void {
    gameStore.navigation.offset = {
      x: gameStore.navigation.offset.x + deltaX,
      y: gameStore.navigation.offset.y + deltaY
    }
  },
  
  resetNavigationOffset(): void {
    gameStore.navigation.offset = { x: 0, y: 0 }
  }
}

// ================================
// NO LOCAL TYPE DEFINITIONS (MOVED TO TYPES DIRECTORY)
// ================================
// All types now imported from '../types' for proper separation