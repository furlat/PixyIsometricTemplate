/**
 * Preview System - Unified Preview for All Operations (CORRECTED)
 *
 * This is the key module that fixes the circle bug by using the
 * SAME methods for preview as actual operations.
 * Uses REAL types from actual codebase.
 */

import type { GameStoreData, PreviewUpdateData, GeometricObject, ObjectEditFormData, PixeloidCoordinate } from '../../types'  // CORRECTED imports
import { GeometryHelper } from '../helpers/GeometryHelper'

export const PreviewSystem = {
  /**
   * Start preview operation (CORRECTED)
   */
  startPreview(store: GameStoreData, _operation: 'create' | 'move' | 'resize', originalObjectId?: string): void {
    if (originalObjectId) {
      // Editing existing object - create copy for preview
      const originalObject = store.objects.find(obj => obj.id === originalObjectId)
      if (originalObject) {
        // CORRECTED: Use real ObjectEditPreviewState structure
        store.preview = {
          isActive: true,
          editingObjectId: originalObjectId,
          originalObject: { ...originalObject },
          previewData: {
            previewProperties: originalObject.properties,
            previewVertices: [...originalObject.vertices],
            previewStyle: { ...originalObject.style },
            previewBounds: { ...originalObject.bounds },
            isValid: true,
            hasChanges: false,
            lastUpdateTime: Date.now()
          },
          shouldShowPreview: true,
          previewOpacity: 0.8
        }
      }
    } else {
      // Creating new object - will be populated by updatePreview
      store.preview = {
        isActive: true,
        editingObjectId: null,
        originalObject: null,
        previewData: null,
        shouldShowPreview: true,
        previewOpacity: 0.8
      }
    }
  },
  
  /**
   * Update preview - USES SAME METHODS AS ACTUAL OPERATIONS (CORRECTED)
   * This is the key fix for the circle bug!
   */
  updatePreview(store: GameStoreData, data: PreviewUpdateData): void {
    if (!store.preview.isActive) return
    
    switch (data.operation) {
      case 'create':
        if (data.formData) {
          // Create preview object using SAME geometry helper as actual operations
          const vertices = this.generateVerticesFromFormData(data.formData)
          const properties = this.generatePropertiesFromFormData(data.formData)
          
          // ✅ STRICT AUTHORITY: Complete form data required - NO FALLBACKS
          if (!data.formData.style.strokeColor) {
            throw new Error('Preview requires complete style - missing strokeColor')
          }
          if (data.formData.style.strokeWidth === undefined) {
            throw new Error('Preview requires complete style - missing strokeWidth')
          }
          if (data.formData.style.strokeAlpha === undefined) {
            throw new Error('Preview requires complete style - missing strokeAlpha')
          }
          
          store.preview.previewData = {
            previewProperties: properties,
            previewVertices: vertices,
            previewStyle: {
              color: parseInt(data.formData.style.strokeColor.replace('#', ''), 16),
              strokeWidth: data.formData.style.strokeWidth,
              strokeAlpha: data.formData.style.strokeAlpha,
              fillColor: data.formData.style.fillColor ? parseInt(data.formData.style.fillColor.replace('#', ''), 16) : undefined,
              fillAlpha: data.formData.style.fillAlpha
            },
            previewBounds: GeometryHelper.calculateBounds(vertices),
            isValid: true,
            hasChanges: true,
            lastUpdateTime: Date.now()
          }
        }
        break
        
      case 'move':
        if (store.preview.previewData) {
          if (data.vertices) {
            // Direct vertex update
            store.preview.previewData.previewVertices = data.vertices
            store.preview.previewData.previewBounds = GeometryHelper.calculateBounds(data.vertices)
          } else if (data.formData) {
            // ✅ CIRCLE BUG FIX: Use form data directly (no reverse engineering)
            const vertices = this.generateVerticesFromFormData(data.formData)
            const properties = this.generatePropertiesFromFormData(data.formData)
            
            store.preview.previewData.previewVertices = vertices
            store.preview.previewData.previewBounds = GeometryHelper.calculateBounds(vertices)
            store.preview.previewData.previewProperties = properties
            store.preview.previewData.hasChanges = true
            store.preview.previewData.lastUpdateTime = Date.now()
          }
        }
        break
        
      case 'resize':
        if (store.preview.previewData && data.dimensions) {
          if (!store.preview.originalObject?.type) {
            throw new Error('PreviewSystem: originalObject type missing - preview corrupted')
          }
          
          // Use SAME geometry generation as actual operations
          const vertices = GeometryHelper.generateVertices(
            store.preview.originalObject.type,
            data.dimensions
          )
          store.preview.previewData.previewVertices = vertices
          store.preview.previewData.previewBounds = GeometryHelper.calculateBounds(vertices)
          store.preview.previewData.hasChanges = true
          store.preview.previewData.lastUpdateTime = Date.now()
        }
        break
    }
  },
  
  /**
   * Commit preview to actual store (CORRECTED)
   */
  commitPreview(store: GameStoreData): void {
    if (!store.preview.isActive || !store.preview.previewData) return
    
    if (store.preview.editingObjectId) {
      // Update existing object with preview data
      const objIndex = store.objects.findIndex(obj => obj.id === store.preview.editingObjectId)
      if (objIndex !== -1) {
        store.objects[objIndex] = {
          ...store.objects[objIndex],
          vertices: store.preview.previewData.previewVertices,
          bounds: store.preview.previewData.previewBounds!,
          properties: store.preview.previewData.previewProperties!,
          style: {
            ...store.objects[objIndex].style,
            ...store.preview.previewData.previewStyle
          }
        }
      }
    } else {
      // Add new object (CORRECTED: use GeometricObject structure)
      const newObject: GeometricObject = {
        id: `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: store.preview.previewData.previewProperties?.type as GeometricObject['type'] || 'point',
        vertices: store.preview.previewData.previewVertices,
        bounds: store.preview.previewData.previewBounds!,
        style: {
          // ✅ STRICT AUTHORITY: Complete preview style required - NO FALLBACKS
          color: (() => {
            if (store.preview.previewData.previewStyle.color === undefined) {
              throw new Error('Commit preview requires complete style - missing color')
            }
            return store.preview.previewData.previewStyle.color
          })(),
          strokeWidth: (() => {
            if (store.preview.previewData.previewStyle.strokeWidth === undefined) {
              throw new Error('Commit preview requires complete style - missing strokeWidth')
            }
            return store.preview.previewData.previewStyle.strokeWidth
          })(),
          strokeAlpha: (() => {
            if (store.preview.previewData.previewStyle.strokeAlpha === undefined) {
              throw new Error('Commit preview requires complete style - missing strokeAlpha')
            }
            return store.preview.previewData.previewStyle.strokeAlpha
          })(),
          fillColor: store.preview.previewData.previewStyle.fillColor,
          fillAlpha: store.preview.previewData.previewStyle.fillAlpha
        },
        isVisible: true,
        createdAt: Date.now(),
        properties: store.preview.previewData.previewProperties!
      }
      store.objects.push(newObject)
    }
    
    this.clearPreview(store)
  },
  
  /**
   * Cancel preview (CORRECTED)
   */
  cancelPreview(store: GameStoreData): void {
    this.clearPreview(store)
  },
  
  /**
   * Clear preview state (CORRECTED)
   */
  clearPreview(store: GameStoreData): void {
    store.preview = {
      isActive: false,
      editingObjectId: null,
      originalObject: null,
      previewData: null,
      shouldShowPreview: true,
      previewOpacity: 0.8
    }
  },
  
  // ==========================================
  // FORM DATA HELPERS (Circle Bug Fix - CORRECTED)
  // ==========================================
  
  /**
   * Generate vertices from form data (FORWARD CALCULATION ONLY)
   */
  generateVerticesFromFormData(formData: ObjectEditFormData): PixeloidCoordinate[] {
    if (formData.circle) {
      return GeometryHelper.generateVertices('circle', {
        center: { x: formData.circle.centerX, y: formData.circle.centerY },
        radius: formData.circle.radius
      })
    }
    
    if (formData.rectangle) {
      return GeometryHelper.generateVertices('rectangle', {
        center: { x: formData.rectangle.centerX, y: formData.rectangle.centerY },
        width: formData.rectangle.width,
        height: formData.rectangle.height
      })
    }
    
    if (formData.line) {
      return GeometryHelper.generateVertices('line', {
        startPoint: { x: formData.line.startX, y: formData.line.startY },
        endPoint: { x: formData.line.endX, y: formData.line.endY }
      })
    }
    
    if (formData.point) {
      return GeometryHelper.generateVertices('point', {
        center: { x: formData.point.centerX, y: formData.point.centerY }
      })
    }
    
    if (formData.diamond) {
      return GeometryHelper.generateVertices('diamond', {
        center: { x: formData.diamond.centerX, y: formData.diamond.centerY },
        width: formData.diamond.width,
        height: formData.diamond.height
      })
    }
    
    return []
  },
  
  /**
   * Generate properties from form data (DIRECT FROM FORM - NO CALCULATION)
   * ✅ CIRCLE BUG FIX: This method ensures radius from form stays exactly the same
   */
  generatePropertiesFromFormData(formData: ObjectEditFormData): any {
    if (formData.circle) {
      // ✅ CIRCLE BUG FIX: Use form data directly
      const radius = formData.circle.radius
      return {
        type: 'circle',
        center: { x: formData.circle.centerX, y: formData.circle.centerY },
        radius: radius,  // ✅ Direct from form - NO REVERSE ENGINEERING
        diameter: radius * 2,
        circumference: 2 * Math.PI * radius,
        area: Math.PI * radius * radius
      }
    }
    
    if (formData.rectangle) {
      return {
        type: 'rectangle',
        center: { x: formData.rectangle.centerX, y: formData.rectangle.centerY },
        topLeft: { 
          x: formData.rectangle.centerX - formData.rectangle.width / 2, 
          y: formData.rectangle.centerY - formData.rectangle.height / 2 
        },
        bottomRight: { 
          x: formData.rectangle.centerX + formData.rectangle.width / 2, 
          y: formData.rectangle.centerY + formData.rectangle.height / 2 
        },
        width: formData.rectangle.width,
        height: formData.rectangle.height,
        area: formData.rectangle.width * formData.rectangle.height,
        perimeter: 2 * (formData.rectangle.width + formData.rectangle.height)
      }
    }
    
    if (formData.point) {
      return {
        type: 'point',
        center: { x: formData.point.centerX, y: formData.point.centerY }
      }
    }
    
    if (formData.line) {
      const start = { x: formData.line.startX, y: formData.line.startY }
      const end = { x: formData.line.endX, y: formData.line.endY }
      const dx = end.x - start.x
      const dy = end.y - start.y
      return {
        type: 'line',
        startPoint: start,
        endPoint: end,
        midpoint: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
        length: Math.sqrt(dx * dx + dy * dy),
        angle: Math.atan2(dy, dx)
      }
    }
    
    if (formData.diamond) {
      return {
        type: 'diamond',
        center: { x: formData.diamond.centerX, y: formData.diamond.centerY },
        west: { x: formData.diamond.centerX - formData.diamond.width / 2, y: formData.diamond.centerY },
        north: { x: formData.diamond.centerX, y: formData.diamond.centerY - formData.diamond.height / 2 },
        east: { x: formData.diamond.centerX + formData.diamond.width / 2, y: formData.diamond.centerY },
        south: { x: formData.diamond.centerX, y: formData.diamond.centerY + formData.diamond.height / 2 },
        width: formData.diamond.width,
        height: formData.diamond.height,
        area: (formData.diamond.width * formData.diamond.height) / 2,
        perimeter: 2 * Math.sqrt((formData.diamond.width/2) * (formData.diamond.width/2) + (formData.diamond.height/2) * (formData.diamond.height/2))
      }
    }
    
    return { type: 'unknown' }
  }
}