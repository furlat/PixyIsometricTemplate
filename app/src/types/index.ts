// Centralized type definitions for the entire application

// ================================
// COORDINATE TYPE SAFETY (branded types prevent mixing)
// ================================

export interface ScreenCoordinate {
  readonly __brand: 'screen'
  x: number
  y: number
}

export interface VertexCoordinate {
  readonly __brand: 'vertex'
  x: number
  y: number
}

export interface PixeloidCoordinate {
  readonly __brand: 'pixeloid'
  x: number
  y: number
}

// Legacy alias for backward compatibility during migration
export interface MeshVertexCoordinate extends VertexCoordinate {}

export interface MeshResolution {
  level: number // 1, 2, 4, 8, 16, 32, 64, 128
  pixeloidScale: number // Corresponding pixeloid scale
  oversizePercent: number // Always 20%
  meshBounds: {
    vertexWidth: number
    vertexHeight: number
  }
}

export interface StaticMeshData {
  resolution: MeshResolution
  vertices: Float32Array
  indices: Uint16Array
  createdAt: number
  isValid: boolean
}

export interface PixeloidVertexMapping {
  meshToPixeloid: Map<string, PixeloidCoordinate> // "x,y" vertex -> pixeloid
  pixeloidToMesh: Map<string, MeshVertexCoordinate> // "x,y" pixeloid -> vertex
  currentResolution: MeshResolution
  viewportBounds: {
    minVertexX: number
    maxVertexX: number
    minVertexY: number
    maxVertexY: number
  }
  // Explicit viewport offset tracking for perfect vertex-to-pixel alignment
  viewportOffset: PixeloidCoordinate  // Where vertex (0,0) maps to in current pixeloid viewport
  vertexBounds: {                     // Current viewport corners in vertex coordinates
    topLeft: MeshVertexCoordinate
    bottomRight: MeshVertexCoordinate
  }
}

export interface StaticMeshState {
  // Current active mesh for rendering
  activeMesh: StaticMeshData | null
  // Cached mesh levels for different resolutions
  meshCache: Map<number, StaticMeshData> // level -> mesh data
  // Coordinate mappings indexed by pixeloid scale for efficient zoom switching
  coordinateMappings: Map<number, PixeloidVertexMapping> // pixeloidScale -> mapping
  // Mesh configuration
  config: {
    oversizePercent: number // Always 20%
    cacheMaxLevels: number // Maximum cached mesh levels
    autoSwitchThreshold: number // Pixeloid scale threshold for mesh switching
  }
  // Performance stats
  stats: {
    activeMeshLevel: number
    totalCachedMeshes: number
    totalCachedMappings: number
    lastMeshSwitch: number
    coordinateMappingUpdates: number
  }
}

export interface ViewportCorners {
  topLeft: PixeloidCoordinate
  topRight: PixeloidCoordinate
  bottomLeft: PixeloidCoordinate
  bottomRight: PixeloidCoordinate
}

// ================================
// COMPREHENSIVE VIEWPORT BOUNDS
// ================================

export interface ViewportBounds {
  screen: {
    width: number
    height: number
    center: ScreenCoordinate
  }
  world: {
    top_left: PixeloidCoordinate
    bottom_right: PixeloidCoordinate
    center: PixeloidCoordinate
  }
  vertex: {
    top_left: VertexCoordinate
    bottom_right: VertexCoordinate
    width: number
    height: number
  }
}

export interface CameraState {
  // Camera position in pixeloid coordinates
  position: PixeloidCoordinate
  // Zoom level (pixeloid scale factor: 1 = 1 pixel per pixeloid, 10 = 10 pixels per pixeloid)
  pixeloidScale: number
  // Current viewport corners in pixeloid coordinates
  viewportCorners: ViewportCorners
}

export interface InputState {
  // WASD movement keys
  keys: {
    w: boolean
    a: boolean
    s: boolean
    d: boolean
    space: boolean
  }
}

export interface GameState {
  isInitialized: boolean
  isLoading: boolean
  currentScene: string
  windowWidth: number
  windowHeight: number
  
  // ================================
  // CLEAN COORDINATE STATE
  // ================================
  
  camera: {
    // World position (where we're looking in pixeloid space)
    world_position: PixeloidCoordinate     // Camera center in world coordinates
    
    // Screen position (derived but stored for efficiency)
    screen_center: { x: number, y: number }  // Camera center in screen coordinates
    
    // Scale
    pixeloid_scale: number                 // Zoom level (screen pixels per pixeloid)
    
    // Derived viewport bounds (stored for efficiency, no recomputation)
    viewport_bounds: ViewportBounds
  }
  
  mesh: {
    // The key conversion variable: pixeloid = vertex + offset
    vertex_to_pixeloid_offset: PixeloidCoordinate
    
    // Current mesh info (stored for efficiency)
    active_resolution: number             // Current mesh resolution level
    vertex_bounds: {                      // Current mesh size
      width: number
      height: number
    }
    
    // Derived info (stored to avoid recomputation)
    screen_to_vertex_scale: number        // Always equals pixeloid_scale
  }
  
  // Mouse positions (all coordinate systems, stored for efficiency)
  mouse: {
    screen_position: { x: number, y: number }
    vertex_position: { x: number, y: number }
    pixeloid_position: PixeloidCoordinate
  }
  
  input: InputState
  // Geometry system state (Phase 1)
  geometry: GeometryState
  // Texture registry for StoreExplorer (ISOLATED from main rendering)
  textureRegistry: TextureRegistryState
  // Mesh registry for pixeloid mesh system
  meshRegistry: MeshRegistryState
  // Static mesh system for transform coherence
  staticMesh: StaticMeshState
}

// UI-related types
export interface UIElement {
  id: string
  element: HTMLElement
}

export interface StatusColors {
  active: string
  inactive: string
  system: string
  camera: string
  mouse: string
}

// Geometry-related types for Phase 1: Multi-Layer System

// Metadata interface for geometric objects (for preview centering and bounds calculation)
export interface GeometricMetadata {
  center: PixeloidCoordinate
  bounds: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
}

export interface GeometricPoint {
  id: string
  x: number
  y: number
  color: number
  strokeAlpha: number
  isVisible: boolean
  createdAt: number
  metadata: GeometricMetadata
}

export interface GeometricLine {
  id: string
  startX: number
  startY: number
  endX: number
  endY: number
  color: number
  strokeWidth: number
  strokeAlpha: number
  isVisible: boolean
  createdAt: number
  metadata: GeometricMetadata
}

export interface GeometricCircle {
  id: string
  centerX: number
  centerY: number
  radius: number
  color: number
  strokeWidth: number
  fillColor?: number
  fillAlpha?: number
  strokeAlpha: number
  isVisible: boolean
  createdAt: number
  metadata: GeometricMetadata
}

export interface GeometricRectangle {
  id: string
  x: number
  y: number
  width: number
  height: number
  color: number
  strokeWidth: number
  fillColor?: number
  fillAlpha?: number
  strokeAlpha: number
  isVisible: boolean
  createdAt: number
  metadata: GeometricMetadata
}

export interface GeometricDiamond {
  id: string
  // West corner anchor point
  anchorX: number
  anchorY: number
  // Width determines the horizontal size
  width: number
  // Height is computed as width/2 (integer/approximate)
  height: number
  color: number
  strokeWidth: number
  fillColor?: number
  fillAlpha?: number
  strokeAlpha: number
  isVisible: boolean
  createdAt: number
  metadata: GeometricMetadata
}

export type GeometricObject = GeometricPoint | GeometricLine | GeometricCircle | GeometricRectangle | GeometricDiamond

export interface GeometryDrawingState {
  // Current drawing mode
  mode: 'none' | 'point' | 'line' | 'circle' | 'rectangle' | 'diamond'
  // Active drawing operation (for multi-step operations like line drawing)
  activeDrawing: {
    type: GeometricObject['id'] | null
    startPoint: PixeloidCoordinate | null
    currentPoint: PixeloidCoordinate | null
    isDrawing: boolean
  }
  // Drawing settings
  settings: {
    defaultColor: number
    defaultStrokeWidth: number
    defaultFillColor: number
    fillEnabled: boolean
    fillAlpha: number
    strokeAlpha: number
  }
}

export interface RaycastState {
  // Active raycast lines for visualization
  activeRaycasts: Array<{
    id: string
    startX: number
    startY: number
    endX: number
    endY: number
    color: number
    hitPoints: PixeloidCoordinate[]
    createdAt: number
  }>
  // Raycast settings
  settings: {
    maxDistance: number
    visualizationColor: number
    showSteps: boolean
    stepColor: number
  }
}

export interface GeometryState {
  // All geometric objects on the canvas
  objects: GeometricObject[]
  // Drawing state
  drawing: GeometryDrawingState
  // Raycast visualization state
  raycast: RaycastState
  // Layer visibility
  layerVisibility: {
    background: boolean  // Grid and background elements (backgroundLayer)
    geometry: boolean    // Geometric shapes and objects (geometryLayer)
    selection: boolean   // Selection highlights (selectionLayer)
    raycast: boolean     // Raycast lines and debug visuals (raycastLayer)
    mask: boolean        // Pixeloid mask layer for collision/spatial analysis (maskLayer)
    bbox: boolean        // Bounding box overlay for comparison (bboxLayer)
    mouse: boolean       // Mouse visualization (mouseLayer)
  }
  // Selection state
  selection: {
    selectedObjectId: string | null
    isEditPanelOpen: boolean
  }
  // Clipboard state for copy/paste
  clipboard: {
    copiedObject: GeometricObject | null
  }
  // Favorites system
  favorites: {
    favoriteObjectIds: string[]
  }
  // Mask layer state for GPU-based spatial analysis
  mask: {
    enabledObjects: Set<string>    // Objects contributing to mask
    mode: 'boundingBox' | 'precise'  // boundingBox = use metadata bounds, precise = use shape geometry
    visualSettings: {
      fillColor: number      // Mask fill color
      fillAlpha: number      // Mask fill transparency
      strokeColor: number    // Outline color for debugging
      strokeAlpha: number    // Outline transparency
      strokeWidth: number    // Outline thickness
    }
  }
}

// Texture Registry types for StoreExplorer previews (ISOLATED from main rendering)
export interface ObjectTextureData {
  objectId: string
  base64Preview: string
  capturedAt: number
  isValid: boolean
}

export interface TextureRegistryState {
  // Object texture cache for previews - using plain object instead of Map for Valtio compatibility
  objectTextures: Record<string, ObjectTextureData>
  // Statistics
  stats: {
    totalTextures: number
    lastCaptureTime: number
  }
}

// Mesh-related types for pixeloid mesh rendering
export interface PixeloidMeshData {
  objectId: string
  pixeloidBounds: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
  pixeloidCount: number
  occupiedPixeloids: Set<string> // "x,y" coordinates as strings
  meshCreatedAt: number
  isValid: boolean
}

export interface MeshRegistryState {
  // Track mesh data per object - using plain object for Valtio compatibility
  objectMeshes: Record<string, PixeloidMeshData>
  // Settings for mesh generation
  meshSettings: {
    samplingMode: 'fast' | 'precise' // fast = center only, precise = 5-point sampling
    maxPixeloidsPerObject: number // Performance limit
    enableDebugVisualization: boolean
  }
  // Statistics
  stats: {
    totalMeshes: number
    totalPixeloids: number
    lastMeshUpdate: number
  }
}