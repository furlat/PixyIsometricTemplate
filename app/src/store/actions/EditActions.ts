/**
 * Edit Actions - Object Editing Operations (CORRECTED)
 *
 * Pure functions for editing existing objects in the store.
 * Uses REAL types from actual codebase.
 */

import type { GameStoreData, GeometricObject, PixeloidCoordinate } from '../../types'  // CORRECTED imports
import { GeometryHelper } from '../helpers/GeometryHelper'

// ✅ STRICT AUTHORITY: Coordinate validation utility
const isValidCoordinate = (coord: PixeloidCoordinate): boolean => {
  return (
    coord &&
    typeof coord.x === 'number' &&
    typeof coord.y === 'number' &&
    isFinite(coord.x) &&
    isFinite(coord.y)
  )
}

export const EditActions = {
  /**
   * Remove object from store (CORRECTED)
   */
  removeObject(store: GameStoreData, objectId: string): void {
    const index = store.objects.findIndex(obj => obj.id === objectId)
    if (index !== -1) {
      store.objects.splice(index, 1)
    }
    
    // Clear selection if this was the selected object
    if (store.selection.selectedId === objectId) {
      store.selection.selectedId = null
      store.selection.selectionBounds = null
    }
  },
  
  /**
   * Select object (CORRECTED)
   */
  selectObject(store: GameStoreData, objectId: string): void {
    const obj = store.objects.find(o => o.id === objectId)
    if (obj) {
      store.selection.selectedId = objectId
      store.selection.selectionBounds = obj.bounds
    }
  },
  
  /**
   * Clear selection (CORRECTED)
   */
  clearSelection(store: GameStoreData): void {
    store.selection.selectedId = null
    store.selection.selectionBounds = null
  },
  
  /**
   * Move object to new position (CORRECTED - unified for drag AND edit panel)
   */
  moveObject(store: GameStoreData, objectId: string, newVertices: PixeloidCoordinate[]): void {
    const objIndex = store.objects.findIndex(obj => obj.id === objectId)
    if (objIndex === -1) return
    
    const existingObject = store.objects[objIndex]
    
    // Calculate new bounds and properties using unified helper
    const newBounds = GeometryHelper.calculateBounds(newVertices)
    const newProperties = GeometryHelper.calculateProperties(existingObject.type, newVertices)
    
    // Update object with new data
    store.objects[objIndex] = {
      ...existingObject,
      vertices: newVertices,
      bounds: newBounds,
      properties: newProperties
    }
    
    // Update selection bounds if this is the selected object
    if (store.selection.selectedId === objectId) {
      store.selection.selectionBounds = newBounds
    }
  },
  
  /**
   * Resize object (CORRECTED - using GeometryHelper for consistency)
   */
  resizeObject(store: GameStoreData, objectId: string, newDimensions: any): void {
    const objIndex = store.objects.findIndex(obj => obj.id === objectId)
    if (objIndex === -1) return
    
    const existingObject = store.objects[objIndex]
    
    // Generate new vertices using unified helper
    const newVertices = GeometryHelper.generateVertices(existingObject.type, newDimensions)
    
    // Use moveObject for consistency (same calculation path)
    this.moveObject(store, objectId, newVertices)
  },
  
  /**
   * Update object style (CORRECTED - using StyleSettings)
   */
  updateObjectStyle(store: GameStoreData, objectId: string, styleUpdates: Partial<GeometricObject['style']>): void {
    const objIndex = store.objects.findIndex(obj => obj.id === objectId)
    if (objIndex === -1) return
    
    // Update style properties
    store.objects[objIndex] = {
      ...store.objects[objIndex],
      style: {
        ...store.objects[objIndex].style,
        ...styleUpdates
      }
    }
  },
  
  /**
   * Toggle object visibility (CORRECTED)
   */
  toggleObjectVisibility(store: GameStoreData, objectId: string): void {
    const objIndex = store.objects.findIndex(obj => obj.id === objectId)
    if (objIndex === -1) return
    
    store.objects[objIndex] = {
      ...store.objects[objIndex],
      isVisible: !store.objects[objIndex].isVisible
    }
  },
  
  /**
   * Clear all objects (CORRECTED)
   */
  clearAllObjects(store: GameStoreData): void {
    store.objects = []
    this.clearSelection(store)
  }
}

// ===================================================================
// NEW ACTIONS FOR _3b FILE INTEGRATION
// ===================================================================

// For BackgroundGridRenderer_3b dual updates
export const updateMouseVertex = (store: GameStoreData, x: number, y: number): void => {
  store.mouse.vertex = { x, y }
}

// For BackgroundGridRenderer_3b + InputManager_3b
export const updateMousePosition = (store: GameStoreData, x: number, y: number): void => {
  store.mouse.position = { x, y }
  store.mouse.world = {
    x: x + store.navigation.offset.x,
    y: y + store.navigation.offset.y
  }
}

// For InputManager_3b WASD navigation
export const updateNavigationOffset = (store: GameStoreData, deltaX: number, deltaY: number): void => {
  store.navigation.offset = {
    x: store.navigation.offset.x + deltaX,
    y: store.navigation.offset.y + deltaY
  }
}

export const resetNavigationOffset = (store: GameStoreData): void => {
  store.navigation.offset = { x: 0, y: 0 }
}

// For Phase3BCanvas replacement (CanvasManager)
export const updateMeshData = (_store: GameStoreData, vertices: Float32Array, cellSize: number, dimensions: { width: number, height: number }): void => {
  // Store mesh data for debugging/state tracking
  // Note: Actual mesh management happens in MeshManager_3b
  console.log(`Store: Mesh data updated - ${vertices.length} vertices, cellSize=${cellSize}`, dimensions)
  
  // Could add mesh metadata to store if needed for UI
  // For now, just log - the MeshManager_3b handles the actual mesh
}

// UI toggle actions for _3b files
export const toggleGrid = (store: GameStoreData): void => {
  store.ui.showGrid = !store.ui.showGrid
}

export const toggleMouse = (store: GameStoreData): void => {
  store.ui.showMouse = !store.ui.showMouse
}

export const toggleCheckboard = (store: GameStoreData): void => {
  store.ui.enableCheckboard = !store.ui.enableCheckboard
}

export const setMouseHighlightColor = (store: GameStoreData, color: number): void => {
  store.ui.mouse.highlightColor = color
}

export const setMouseHighlightIntensity = (store: GameStoreData, intensity: number): void => {
  store.ui.mouse.highlightIntensity = Math.max(0, Math.min(1, intensity))
}

// ===================================================================
// INPUTMANAGER_3B INTEGRATION EXTENSIONS (SURGICAL)
// ===================================================================

/**
 * Clipboard System - Copy/Paste functionality for InputManager_3b
 */
export const copyObject = (store: GameStoreData, objectId: string): void => {
  const object = store.objects.find(obj => obj.id === objectId)
  if (object) {
    // Deep clone object for clipboard
    store.clipboard.objectData = JSON.parse(JSON.stringify(object))
    store.clipboard.hasObject = true
    console.log(`Object ${objectId} copied to clipboard`)
  }
}

export const pasteObject = (store: GameStoreData, position: PixeloidCoordinate): string => {
  if (!store.clipboard.objectData) return ''
  
  // Create new object from clipboard data
  const clipboardObj = store.clipboard.objectData
  const newVertices = clipboardObj.vertices.map(vertex => ({
    x: vertex.x + (position.x - clipboardObj.vertices[0].x),
    y: vertex.y + (position.y - clipboardObj.vertices[0].y)
  }))
  
  const newObject: GeometricObject = {
    ...clipboardObj,
    id: `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // New unique ID
    vertices: newVertices,
    bounds: GeometryHelper.calculateBounds(newVertices), // Calculate bounds during creation
    createdAt: Date.now()
  }
  
  store.objects.push(newObject)
  console.log(`Object pasted at (${position.x}, ${position.y}) with ID ${newObject.id}`)
  return newObject.id
}

export const hasClipboardObject = (store: GameStoreData): boolean => {
  return store.clipboard.hasObject && store.clipboard.objectData !== null
}

/**
 * Drawing System Extensions - Enhanced drawing control for InputManager_3b
 */
export const cancelDrawing = (store: GameStoreData): void => {
  store.drawing.isDrawing = false
  store.drawing.startPoint = null
  store.drawing.currentPoint = null
  console.log('Drawing cancelled')
}

export const setDrawingModeEnhanced = (store: GameStoreData, mode: import('../../types').DrawingMode): void => {
  // Cancel any active drawing when changing modes
  if (store.drawing.isDrawing) {
    cancelDrawing(store)
  }
  
  store.drawing.mode = mode
  console.log(`Drawing mode set to: ${mode}`)
}

/**
 * Selection System Extensions - Enhanced selection for InputManager_3b
 */
export const clearSelectionEnhanced = (store: GameStoreData): void => {
  // Use existing clearSelection method
  EditActions.clearSelection(store)
  // Enhanced: close edit panel when clearing selection
  store.ui.isEditPanelOpen = false
  console.log('Selection cleared (enhanced - edit panel closed)')
}

/**
 * Dragging System - Drag operations for InputManager_3b
 */
export const cancelDragging = (store: GameStoreData): void => {
  store.dragging.isDragging = false
  store.dragging.draggedObjectId = null
  store.dragging.dragStartPosition = null
  store.dragging.currentDragPosition = null
  console.log('Dragging cancelled')
}

export const startDragging = (store: GameStoreData, objectId: string, position: PixeloidCoordinate): void => {
  // ✅ STRICT AUTHORITY: Validate coordinates before using
  if (!isValidCoordinate(position)) {
    throw new Error(`Invalid drag start position: ${JSON.stringify(position)}`)
  }
  
  // ✅ STRICT AUTHORITY: Validate object exists
  const objectExists = store.objects.some(obj => obj.id === objectId)
  if (!objectExists) {
    throw new Error(`Cannot start dragging - object ${objectId} not found`)
  }
  
  store.dragging.isDragging = true
  store.dragging.draggedObjectId = objectId
  store.dragging.dragStartPosition = position
  store.dragging.currentDragPosition = position
  console.log(`Started dragging object: ${objectId}`)
}

export const updateDragPosition = (store: GameStoreData, position: PixeloidCoordinate): void => {
  // ✅ STRICT AUTHORITY: Validate coordinates before using
  if (!isValidCoordinate(position)) {
    throw new Error(`Invalid drag position: ${JSON.stringify(position)}`)
  }
  
  if (store.dragging.isDragging) {
    store.dragging.currentDragPosition = position
  }
}