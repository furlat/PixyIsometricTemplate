/**
 * Create Actions - Object Creation Operations (CORRECTED)
 *
 * Pure functions for creating new objects in the store.
 * Uses REAL types from actual codebase.
 */

import type { GameStoreData, CreateObjectParams, DrawingMode, PixeloidCoordinate, GeometricObject } from '../../types'  // CORRECTED imports
import { GeometryHelper } from '../helpers/GeometryHelper'

export const CreateActions = {
  /**
   * Create a new object from parameters (CORRECTED)
   */
  createObject(store: GameStoreData, params: CreateObjectParams): string {
    // Generate vertices using unified helper
    const vertices = params.vertices || GeometryHelper.generateVertices(params.type, params.properties)
    
    // CORRECTED: Use real GeometricObject structure from ecs-data-layer
    const newObject: GeometricObject = {
      id: `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: params.type as GeometricObject['type'],  // CORRECTED type casting
      vertices: vertices,
      bounds: GeometryHelper.calculateBounds(vertices),
      style: {
        color: params.style?.color || store.defaultStyle.color,
        strokeWidth: params.style?.strokeWidth || store.defaultStyle.strokeWidth,
        strokeAlpha: params.style?.strokeAlpha || store.defaultStyle.strokeAlpha,
        fillColor: params.style?.fillColor,
        fillAlpha: params.style?.fillAlpha
      },
      isVisible: true,
      createdAt: Date.now(),
      properties: params.properties || GeometryHelper.calculateProperties(params.type, vertices)
    }
    
    // Add to store
    store.objects.push(newObject)
    return newObject.id
  },
  
  /**
   * Finish drawing and create object (CORRECTED)
   */
  finishDrawing(store: GameStoreData, mode: DrawingMode, startPoint: PixeloidCoordinate, endPoint: PixeloidCoordinate): string {
    // Calculate drawing properties using unified helper
    const properties = GeometryHelper.calculateDrawingProperties(mode, startPoint, endPoint)
    
    // Create object using standard creation path
    return this.createObject(store, {
      type: mode,
      properties: properties,
      style: store.defaultStyle
    })
  }
}