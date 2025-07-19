/**
 * Geometry Drawing System Types
 * 
 * Types for Phase 3B drawing system including modes, preview, and anchor systems.
 */

import { PixeloidCoordinate, ECSBoundingBox } from './ecs-coordinates'
import { GeometricObject, GeometryProperties } from './ecs-data-layer'

// ================================
// DRAWING MODES
// ================================

/**
 * Drawing mode types for Phase 3B
 */
export type DrawingMode = 'none' | 'point' | 'line' | 'circle' | 'rectangle' | 'diamond'

// ================================
// PREVIEW SYSTEM
// ================================

/**
 * Preview object for real-time drawing feedback
 */
export interface PreviewObject {
  type: GeometricObject['type']
  vertices: PixeloidCoordinate[]
  style: GeometricObject['style']
  isValid: boolean
  bounds: ECSBoundingBox
}

/**
 * Preview state for drawing operations
 */
export interface PreviewState {
  object: PreviewObject | null
  isActive: boolean
  startPoint: PixeloidCoordinate | null
  currentPoint: PixeloidCoordinate | null
  opacity: number
}

// ================================
// DRAWING SETTINGS
// ================================

/**
 * Drawing configuration settings
 */
export interface DrawingSettings {
  snapToGrid: boolean
  showPreview: boolean
  previewOpacity: number
  minDistance: number
  maxDistance: number
}

// ================================
// DRAWING STATE
// ================================

/**
 * Complete drawing system state
 */
export interface DrawingState {
  mode: DrawingMode
  preview: PreviewState
  settings: DrawingSettings
  isDrawing: boolean
  startPoint: PixeloidCoordinate | null
  currentStroke: PixeloidCoordinate[]
}

// ================================
// STYLE SYSTEM
// ================================

/**
 * Style configuration for geometry objects
 * CURRENT DRAWING STYLE - store authority pattern
 */
export interface StyleSettings {
  color: number
  strokeWidth: number
  fillColor: number
  fillEnabled: boolean
  strokeAlpha: number
  fillAlpha: number
  highlightColor: number
  selectionColor: number
}

// ================================
// SELECTION SYSTEM
// ================================

/**
 * Object selection state
 */
export interface SelectionState {
  selectedObjectId: string | null
  highlightEnabled: boolean
  selectionBounds: ECSBoundingBox | null
  multiSelectEnabled: boolean
  selectedObjects: string[]
  isEditPanelOpen: boolean
}

// ================================
// OBJECT EDIT PREVIEW SYSTEM (like drag system)
// ================================

/**
 * Object edit form data - UI input values (NOT stored properties)
 */
export interface ObjectEditFormData {
  // Common properties
  isVisible: boolean
  
  // Type-specific form inputs (user typing)
  point?: {
    centerX: number
    centerY: number
  }
  
  line?: {
    startX: number
    startY: number
    endX: number
    endY: number
  }
  
  circle?: {
    centerX: number
    centerY: number
    radius: number
  }
  
  rectangle?: {
    centerX: number
    centerY: number
    width: number
    height: number
  }
  
  diamond?: {
    centerX: number
    centerY: number
    width: number
    height: number
  }
  
  // Style form inputs
  style: {
    strokeColor: string  // hex color for UI
    strokeWidth: number
    strokeAlpha: number
    fillColor?: string   // hex color for UI
    fillAlpha?: number
    hasFill: boolean
  }
}

/**
 * Temporary preview data for object editing - SEPARATE from renderer data
 */
export interface ObjectEditPreviewData {
  // Shape-specific preview properties (calculated from form input)
  previewProperties: GeometryProperties | null
  previewVertices: PixeloidCoordinate[]
  previewStyle: Partial<StyleSettings>
  previewBounds: ECSBoundingBox | null
  
  // UI state
  isValid: boolean
  hasChanges: boolean
  lastUpdateTime: number
}

/**
 * Object edit preview state - EXACTLY like drag system
 */
export interface ObjectEditPreviewState {
  isActive: boolean
  editingObjectId: string | null
  originalObject: GeometricObject | null  // For cancel restoration
  previewData: ObjectEditPreviewData | null
  
  // Preview rendering info (separate from actual renderer)
  shouldShowPreview: boolean
  previewOpacity: number
}

// ================================
// GEOMETRY PANEL STATE
// ================================

/**
 * Geometry panel UI state
 */
export interface GeometryPanelState {
  isOpen: boolean
  currentTab: 'draw' | 'style' | 'objects'
  currentDrawingMode: DrawingMode
  showObjectList: boolean
  showStyleControls: boolean
  showDrawingTools: boolean
}

// ================================
// GEOMETRY STATISTICS
// ================================

/**
 * Geometry statistics for debugging and UI
 */
export interface GeometryStats {
  objectCount: number
  visibleObjectCount: number
  selectedObjectCount: number
  objectsByType: Record<GeometricObject['type'], number>
  totalVertices: number
  memoryUsage: number
}

// ================================
// FACTORY FUNCTIONS
// ================================

/**
 * Create default drawing settings
 */
export const createDefaultDrawingSettings = (): DrawingSettings => ({
  snapToGrid: true,
  showPreview: true,
  previewOpacity: 0.7,
  minDistance: 1,
  maxDistance: 1000
})

/**
 * Create default style settings
 */
export const createDefaultStyleSettings = (): StyleSettings => ({
  color: 0x0066cc,
  strokeWidth: 2,
  fillColor: 0x0066cc,
  fillEnabled: false,
  strokeAlpha: 1.0,
  fillAlpha: 0.3,
  highlightColor: 0xff6600,
  selectionColor: 0xff0000
})

/**
 * Create default selection state
 */
export const createDefaultSelectionState = (): SelectionState => ({
  selectedObjectId: null,
  highlightEnabled: true,
  selectionBounds: null,
  multiSelectEnabled: false,
  selectedObjects: [],
  isEditPanelOpen: false
})

/**
 * Create default object edit preview state
 */
export const createDefaultObjectEditPreviewState = (): ObjectEditPreviewState => ({
  isActive: false,
  editingObjectId: null,
  originalObject: null,
  previewData: null,
  shouldShowPreview: true,
  previewOpacity: 0.8
})

/**
 * Create default geometry panel state
 */
export const createDefaultGeometryPanelState = (): GeometryPanelState => ({
  isOpen: false,
  currentTab: 'draw',
  currentDrawingMode: 'none',
  showObjectList: true,
  showStyleControls: true,
  showDrawingTools: true
})

/**
 * Create default preview state
 */
export const createDefaultPreviewState = (): PreviewState => ({
  object: null,
  isActive: false,
  startPoint: null,
  currentPoint: null,
  opacity: 0.7
})


// ================================
// TYPE GUARDS
// ================================

/**
 * Type guard for drawing mode
 */
export const isDrawingMode = (mode: string): mode is DrawingMode => {
  return ['none', 'point', 'line', 'circle', 'rectangle', 'diamond'].includes(mode)
}

/**
 * Type guard for preview object
 */
export const isPreviewObject = (obj: any): obj is PreviewObject => {
  return obj &&
         typeof obj === 'object' &&
         typeof obj.type === 'string' &&
         Array.isArray(obj.vertices) &&
         typeof obj.isValid === 'boolean' &&
         obj.style &&
         obj.bounds
}


// ================================
// UTILITY FUNCTIONS
// ================================

/**
 * Calculate geometry statistics
 */
export const calculateGeometryStats = (objects: GeometricObject[]): GeometryStats => {
  const objectsByType: Record<GeometricObject['type'], number> = {
    point: 0,
    line: 0,
    circle: 0,
    rectangle: 0,
    diamond: 0
  }

  let totalVertices = 0
  let visibleCount = 0

  objects.forEach(obj => {
    objectsByType[obj.type]++
    totalVertices += obj.vertices.length
    if (obj.isVisible) {
      visibleCount++
    }
  })

  return {
    objectCount: objects.length,
    visibleObjectCount: visibleCount,
    selectedObjectCount: 0, // Will be calculated based on selection state
    objectsByType,
    totalVertices,
    memoryUsage: objects.length * 1024 // Rough estimate
  }
}

/**
 * Validate drawing settings
 */
export const validateDrawingSettings = (settings: DrawingSettings): boolean => {
  return settings.previewOpacity >= 0 && settings.previewOpacity <= 1 &&
         settings.minDistance >= 0 &&
         settings.maxDistance > settings.minDistance
}

/**
 * Validate style settings
 */
export const validateStyleSettings = (settings: StyleSettings): boolean => {
  return settings.strokeWidth > 0 &&
         settings.strokeAlpha >= 0 && settings.strokeAlpha <= 1 &&
         settings.fillAlpha >= 0 && settings.fillAlpha <= 1
}