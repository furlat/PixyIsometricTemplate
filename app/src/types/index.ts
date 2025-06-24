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
  
  // Track the scale at which this object was created
  createdAtScale: number
  
  // Scale-indexed visibility cache to prevent race conditions
  visibilityCache?: Map<number, {
    visibility: 'fully-onscreen' | 'partially-onscreen' | 'offscreen'
    onScreenBounds?: {
      minX: number
      maxX: number
      minY: number
      maxY: number
      // Texture region info for partial rendering
      textureOffsetX: number  // Pixels to skip in texture X
      textureOffsetY: number  // Pixels to skip in texture Y
    }
  }>
}

// Bbox mesh reference for pixeloid-perfect filtering
export interface BboxMeshReference {
  meshId: string           // Unique identifier for the bbox mesh
  bounds: {                // Pixeloid-perfect bounds
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
  lastUpdated: number      // Timestamp for consistency tracking
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
  bboxMesh?: BboxMeshReference
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
  bboxMesh?: BboxMeshReference
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
  bboxMesh?: BboxMeshReference
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
  bboxMesh?: BboxMeshReference
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
  bboxMesh?: BboxMeshReference
}

// ================================
// NEW STABLE GEOMETRY ARCHITECTURE
// ================================

// Pixeloid vertex (stored coordinates - resolution independent)
export interface PixeloidVertex {
  readonly __brand: 'pixeloid'
  x: number
  y: number
}

// Mesh vertex (rendering coordinates - derived from pixeloid)
export interface MeshVertex {
  readonly __brand: 'vertex'
  x: number
  y: number
}

// Anchor point within pixeloid square
export type PixeloidAnchorPoint =
  | 'top-left' | 'top-mid' | 'top-right'
  | 'left-mid' | 'center' | 'right-mid'
  | 'bottom-left' | 'bottom-mid' | 'bottom-right'

// Anchor configuration for object creation
export interface AnchorConfig {
  firstPointAnchor: PixeloidAnchorPoint
  secondPointAnchor?: PixeloidAnchorPoint
}

// Geometry style properties (separated from coordinates)
export interface GeometryStyle {
  color: number
  strokeWidth: number
  strokeAlpha: number
  fillColor?: number
  fillAlpha?: number
}

// NEW: Stable geometric object with pre-computed vertices
export interface GeometricObjectStable {
  // Identity
  id: string
  type: 'point' | 'line' | 'circle' | 'rectangle' | 'diamond'
  isVisible: boolean
  createdAt: number
  
  // THE KEY: Pre-computed vertices in pixeloid space (NEVER recomputed)
  pixeloidVertices: PixeloidVertex[]
  
  // Anchor configuration used at creation
  anchorConfig: AnchorConfig
  
  // Style properties (no coordinates here!)
  style: GeometryStyle
  
  // Metadata for UI/selection (derived from vertices)
  metadata: GeometricMetadata
}

// Preview state for drawing
export interface DrawingPreview {
  // Pre-computed vertices in pixeloid space (same as final objects)
  vertices: PixeloidVertex[]
  
  // Geometry type for rendering
  type: 'point' | 'line' | 'circle' | 'rectangle' | 'diamond'
  
  // Style properties for preview rendering
  style: GeometryStyle
  
  // Indicates this is temporary preview data
  isPreview: true
}

// Legacy types (for backward compatibility during migration)
export type GeometricObject = GeometricPoint | GeometricLine | GeometricCircle | GeometricRectangle | GeometricDiamond

// Anchor point configuration for unified pixeloid anchoring (DEPRECATED - use PixeloidAnchorPoint)
export type AnchorSnapPoint = PixeloidAnchorPoint

export interface GeometryDrawingState {
  // Current drawing mode
  mode: 'none' | 'point' | 'line' | 'circle' | 'rectangle' | 'diamond'
  // Active drawing operation (NEW: stores exact user input)
  activeDrawing: {
    type: 'point' | 'line' | 'circle' | 'rectangle' | 'diamond' | null
    // EXACT user input coordinates (never modified)
    firstPixeloidPos: PixeloidCoordinate | null
    currentPixeloidPos: PixeloidCoordinate | null
    // Anchor configuration for this drawing operation
    anchorConfig: AnchorConfig | null
    isDrawing: boolean
  }
  // Current preview state (using new architecture)
  preview: DrawingPreview | null
  // Drawing settings (now matches GeometryStyle)
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
  // Enhanced anchor configuration for UI control
  anchoring: {
    // Global defaults for new geometry creation
    defaults: {
      point: PixeloidAnchorPoint
      line: PixeloidAnchorPoint
      circle: PixeloidAnchorPoint
      rectangle: PixeloidAnchorPoint
      diamond: PixeloidAnchorPoint
    }
    // Per-object anchor overrides (objectId -> anchorConfig)
    objectOverrides: Map<string, AnchorConfig>
    // Enable/disable pre-computed anchors (for zoom stability)
    enablePreComputedAnchors: boolean
  }
  // Layer visibility
  layerVisibility: {
    background: boolean  // Grid and background elements (backgroundLayer)
    geometry: boolean    // Geometric shapes and objects (geometryLayer)
    selection: boolean   // Selection highlights (selectionLayer)
    raycast: boolean     // Raycast lines and debug visuals (raycastLayer)
    bbox: boolean        // Bounding box overlay for comparison (bboxLayer)
    mirror: boolean      // Mirror layer for cached texture sprites
    mouse: boolean       // Mouse visualization (mouseLayer)
  }
  // Filter effects state
  filterEffects: {
    pixelate: boolean    // Pixeloid-perfect pixelation filter enabled
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
  // Scale tracking for OOM prevention
  scaleTracking: {
    minCreationScale: number | null
    maxCreationScale: number | null
    SCALE_SPAN_LIMIT: number  // 16x maximum span between min and max creation scales
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
