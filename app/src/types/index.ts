/**
 * Phase 3B Types - Core Exports Only (CORRECTED)
 * 
 * Clean export of only the types actually used in Phase 3B.
 * Uses REAL exports from actual files, not assumed ones.
 */

// ================================
// CORE COORDINATES (VERIFIED REAL EXPORTS)
// ================================
export type {
  PixeloidCoordinate,
  VertexCoordinate, 
  ScreenCoordinate,
  ECSViewportBounds,
  ECSBoundingBox
} from './ecs-coordinates'

export {
  createPixeloidCoordinate,
  createVertexCoordinate,
  createScreenCoordinate,
  createECSViewportBounds,
  createECSBoundingBox,
  ECS_COORDINATE_CONSTANTS
} from './ecs-coordinates'

// ================================
// GEOMETRY DRAWING (VERIFIED REAL EXPORTS)
// ================================
export type {
  DrawingMode,
  ObjectEditFormData,
  ObjectEditPreviewState,
  StyleSettings,  // NOT GeometryStyle - that doesn't exist
  PreviewObject,
  PreviewState,
  DrawingSettings,
  DrawingState,
  SelectionState
} from './geometry-drawing'

export {
  createDefaultDrawingSettings,
  createDefaultStyleSettings,
  createDefaultSelectionState,
  createDefaultObjectEditPreviewState,
  createDefaultGeometryPanelState,
  createDefaultPreviewState,
  isDrawingMode,
  isPreviewObject
} from './geometry-drawing'

// ================================
// ECS DATA LAYER (VERIFIED REAL EXPORTS)
// ================================
export type {
  GeometricObject,  // THIS is in ecs-data-layer, NOT geometry-drawing
  CreateGeometricObjectParams,  // THIS is in ecs-data-layer
  GeometryProperties,
  PointProperties,
  LineProperties,
  CircleProperties,
  RectangleProperties,
  DiamondProperties
} from './ecs-data-layer'

export {
  createGeometricObject,
  calculateObjectBounds,
  isGeometricObject
} from './ecs-data-layer'

// ================================
// BASIC MESH TYPES (VERIFIED REAL EXPORTS)
// ================================
export type {
  MeshLevel
} from './mesh-system'

export {
  createMeshSystem,  // NOT createMeshLevel - that doesn't exist
  createMeshResolution,
  isMeshLevel
} from './mesh-system'

// ================================
// GAME STORE TYPES (CORRECTED LOCATION)
// ================================
export type {
  CreateObjectParams,
  ObjectDimensions,
  PreviewUpdateData,
  GameStoreData
} from './game-store'

// ================================
// NO FUTURE PHASE EXPORTS
// ================================
// REMOVED: All future phase types and require() functions