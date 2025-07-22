/**
 * Game Store Types
 * 
 * Types specific to the unified game store architecture.
 */

import type { PixeloidCoordinate, StyleSettings, ObjectEditFormData } from './index'

// ================================
// STORE ACTION PARAMETER TYPES
// ================================

/**
 * Parameters for creating a new object
 */
export interface CreateObjectParams {
  type: string
  vertices?: PixeloidCoordinate[]
  style?: Partial<StyleSettings>
  properties?: any  // Will use GeometryProperties when needed
}

/**
 * Dimensions for resizing objects
 */
export interface ObjectDimensions {
  width?: number
  height?: number
  radius?: number
  center?: PixeloidCoordinate
  [key: string]: any
}

/**
 * Preview update data for unified preview system
 */
export interface PreviewUpdateData {
  operation: 'create' | 'move' | 'resize'
  formData?: ObjectEditFormData
  vertices?: PixeloidCoordinate[]
  dimensions?: ObjectDimensions
}

// ================================
// STORE STATE INTERFACE
// ================================

/**
 * Main game store data structure
 */
export interface GameStoreData {
  // Single source of truth for objects
  objects: import('./ecs-data-layer').GeometricObject[]
  
  // Selection state
  selection: {
    selectedId: string | null
    selectionBounds: import('./ecs-coordinates').ECSBoundingBox | null
  }
  
  // Preview state (unified preview system)
  preview: import('./geometry-drawing').ObjectEditPreviewState
  
  // Drawing state
  drawing: {
    mode: import('./geometry-drawing').DrawingMode
    isDrawing: boolean
    startPoint: PixeloidCoordinate | null
    currentPoint: PixeloidCoordinate | null
  }
  
  // Default style settings
  defaultStyle: StyleSettings
  
  // UI state
  ui: {
    showGeometry: boolean
    showGeometryPanel: boolean
    showStorePanel: boolean
    isEditPanelOpen: boolean
  }
  
  // Mouse tracking
  mouse: {
    position: PixeloidCoordinate
    isOverObject: boolean
    hoveredObjectId: string | null
  }
  
  // Navigation
  navigation: {
    offset: PixeloidCoordinate
    isDragging: boolean
  }
}