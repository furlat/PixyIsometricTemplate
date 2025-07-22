/**
 * Edit Actions - Object Editing Operations (CORRECTED)
 *
 * Pure functions for editing existing objects in the store.
 * Uses REAL types from actual codebase.
 */

import type { GameStoreData, GeometricObject, PixeloidCoordinate } from '../../types'  // CORRECTED imports
import { GeometryHelper } from '../helpers/GeometryHelper'

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