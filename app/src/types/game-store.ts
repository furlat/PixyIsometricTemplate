/**
 * Game Store Types
 * 
 * Types specific to the unified game store architecture.
 */

import type { PixeloidCoordinate, VertexCoordinate, StyleSettings, ObjectEditFormData } from './index'

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
    settings: {                    // ← For GeometryPanel
      previewOpacity: number
    }
  }
  
  // Default style settings
  defaultStyle: StyleSettings
  
  // UI state
  ui: {
    showGeometry: boolean
    showGeometryPanel: boolean
    showStorePanel: boolean
    isEditPanelOpen: boolean
    
    // ✅ ADD THESE FOR _3b FILES
    showGrid: boolean              // ← For CanvasManager (replaces Phase3BCanvas)
    showMouse: boolean             // ← For CanvasManager mouse layer visibility
    enableCheckboard: boolean      // ← For GridShaderRenderer
    showLayerToggle: boolean       // ← For LayerToggleBar
    mouse: {                       // ← For MouseHighlightShader
      highlightColor: number
      highlightIntensity: number
    }
  }
  
  // Mouse tracking
  mouse: {
    position: PixeloidCoordinate
    isOverObject: boolean
    hoveredObjectId: string | null
    
    // ✅ ADD THESE FOR _3b FILES
    vertex: VertexCoordinate       // ← For BackgroundGridRenderer_3b dual updates
    world: PixeloidCoordinate      // ← For InputManager_3b paste positioning
  }
  
  // Navigation
  navigation: {
    offset: PixeloidCoordinate
    isDragging: boolean
    moveAmount: number             // ← For StorePanel display
  }
  
  // Clipboard system (for InputManager_3b copy/paste)
  clipboard: {
    objectData: import('./ecs-data-layer').GeometricObject | null
    hasObject: boolean
  }
  
  // Dragging system (for InputManager_3b drag operations)
  dragging: {
    isDragging: boolean
    draggedObjectId: string | null
    dragStartPosition: PixeloidCoordinate | null
    currentDragPosition: PixeloidCoordinate | null
    vertexOffsets: PixeloidCoordinate[]  // ← For StorePanel display
  }
  
  // Mesh configuration
  mesh: {
    cellSize: number
    vertexData: Float32Array | null          // ← For StorePanel display
    dimensions: { width: number, height: number } | null  // ← For StorePanel display
    needsUpdate: boolean                     // ← For StorePanel display
  }
  
  // Style system extensions
  objectStyles: Record<string, Partial<StyleSettings>>  // ← For GeometryPanel per-object styles
  
  // Drag preview system
  dragPreview: {                           // ← For StorePanel display
    isActive: boolean
    currentMousePosition: PixeloidCoordinate | null
    previewVertices: PixeloidCoordinate[]
  }
}