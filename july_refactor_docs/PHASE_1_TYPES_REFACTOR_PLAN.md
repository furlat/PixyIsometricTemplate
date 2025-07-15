# Phase 1: Types System Refactoring - Detailed Implementation Plan

## Overview
**Duration**: 2 weeks  
**Goal**: Create clean, ECS-compliant type definitions that eliminate architectural confusion and support proper data/mirror layer separation

## Current Problem Analysis

### Critical Issues in Current Types System
1. **Mixed Responsibilities**: `cameraViewport` state mixes data layer and mirror layer concerns
2. **Scale-Indexed Caching Types**: Contradicts ECS fixed-scale principle
3. **Missing ECS Boundaries**: No clear data/mirror layer type separation
4. **Mesh System Integration**: Missing pixel-perfect alignment types
5. **Filter Pipeline Types**: No proper pre/post filter stage definitions

### Files to Refactor
- `app/src/types/index.ts` - Main types file (needs complete restructuring)
- Create new modular type files for better organization

## Implementation Steps

### Step 1: Create Core ECS Type Foundation (Days 1-2)

#### 1.1 Create Base Coordinate System Types
**File**: `app/src/types/ecs-coordinates.ts` (NEW)

```typescript
// Core ECS coordinate system - clean separation
export interface PixeloidCoordinate {
  readonly x: number  // Geometry storage coordinates
  readonly y: number
}

export interface VertexCoordinate {
  readonly x: number  // Mesh/shader coordinates  
  readonly y: number
}

export interface ScreenCoordinate {
  readonly x: number  // Canvas pixel coordinates
  readonly y: number
}

// ECS bounding box (always in pixeloid space)
export interface ECSBoundingBox {
  readonly minX: number
  readonly minY: number
  readonly maxX: number
  readonly maxY: number
  readonly width: number
  readonly height: number
}

// ECS viewport bounds for sampling
export interface ECSViewportBounds {
  readonly topLeft: PixeloidCoordinate
  readonly bottomRight: PixeloidCoordinate
  readonly width: number
  readonly height: number
}

// Coordinate conversion utilities
export interface CoordinateConverter {
  pixeloidToVertex(coord: PixeloidCoordinate): VertexCoordinate
  vertexToPixeloid(coord: VertexCoordinate): PixeloidCoordinate
  screenToPixeloid(coord: ScreenCoordinate): PixeloidCoordinate
  pixeloidToScreen(coord: PixeloidCoordinate): ScreenCoordinate
}
```

#### 1.2 Create Data Layer Types
**File**: `app/src/types/ecs-data-layer.ts` (NEW)

```typescript
import { PixeloidCoordinate, ECSViewportBounds, ECSBoundingBox } from './ecs-coordinates'
import { GeometricObject } from './geometry'

// Data Layer - ECS sampling at fixed scale 1
export interface ECSDataLayer {
  // Core ECS principle: Always scale 1 (literal type)
  readonly scale: 1
  
  // Sampling window position in pixeloid space
  samplingPosition: PixeloidCoordinate
  
  // Sampling bounds (calculated from window size / zoom)
  samplingBounds: ECSViewportBounds
  
  // Data storage bounds (geometry limits)
  dataBounds: ECSBoundingBox
  
  // Objects visible in current sampling window
  visibleObjects: GeometricObject[]
  
  // Sampling state
  samplingState: {
    isActive: boolean
    lastSampleTime: number
    objectsInWindow: number
    needsResample: boolean
  }
  
  // Performance metrics
  performance: {
    lastRenderTime: number
    avgRenderTime: number
    objectsRendered: number
    samplingOverhead: number
  }
}

// Data layer actions (for store)
export interface ECSDataLayerActions {
  updateSamplingPosition(position: PixeloidCoordinate): void
  updateSamplingBounds(bounds: ECSViewportBounds): void
  expandDataBounds(newBounds: ECSBoundingBox): void
  resampleVisibleObjects(): void
  clearSamplingCache(): void
}
```

#### 1.3 Create Mirror Layer Types
**File**: `app/src/types/ecs-mirror-layer.ts` (NEW)

```typescript
import { PixeloidCoordinate, ECSBoundingBox } from './ecs-coordinates'
import { Texture } from 'pixi.js'

// Mirror Layer - Display with camera transforms
export interface ECSMirrorLayer {
  // Camera viewport position (for zoom 2+)
  viewportPosition: PixeloidCoordinate
  
  // Current zoom level (integer factors only)
  zoomFactor: 1 | 2 | 4 | 8 | 16 | 32 | 64 | 128
  
  // Camera movement state
  camera: {
    isPanning: boolean
    panStartPosition: PixeloidCoordinate | null
    panVelocity: PixeloidCoordinate
    smoothingEnabled: boolean
  }
  
  // Texture cache (single texture per object - ECS principle)
  textureCache: Map<string, ECSTextureEntry>
  
  // Zoom behavior configuration
  zoomBehavior: {
    currentLevel: number
    showCompleteGeometry: boolean  // true at zoom 1
    showCameraViewport: boolean    // true at zoom 2+
    transitionDuration: number
  }
  
  // Display state
  display: {
    isVisible: boolean
    opacity: number
    blendMode: string
    lastUpdateTime: number
  }
  
  // Performance metrics
  performance: {
    cacheHitRate: number
    textureCacheSize: number
    lastUpdateTime: number
    renderTime: number
  }
}

// Texture cache entry (ECS-compliant)
export interface ECSTextureEntry {
  texture: Texture
  timestamp: number
  bounds: ECSBoundingBox
  visualVersion: number
  // NO scale property - ECS principle
}

// Mirror layer actions (for store)
export interface ECSMirrorLayerActions {
  updateViewportPosition(position: PixeloidCoordinate): void
  setZoomFactor(zoom: ECSMirrorLayer['zoomFactor']): void
  startPanning(startPos: PixeloidCoordinate): void
  updatePanning(currentPos: PixeloidCoordinate): void
  stopPanning(): void
  clearTextureCache(): void
  evictStaleTextures(): void
}
```

### Step 2: Create Supporting System Types (Days 3-4)

#### 2.1 Create Mesh System Types
**File**: `app/src/types/mesh-system.ts` (NEW)

```typescript
import { VertexCoordinate } from './ecs-coordinates'

// Mesh resolution configuration
export interface MeshResolution {
  level: number
  vertexSpacing: number
  gridSize: { width: number; height: number }
  pixelPerfectAlignment: boolean
}

// Mesh system for pixel-perfect alignment
export interface MeshSystem {
  // Current mesh configuration
  resolution: MeshResolution
  
  // Pixel-perfect alignment state
  alignment: {
    vertex00Position: VertexCoordinate  // Must be exactly (0,0)
    pixelPerfectOffset: VertexCoordinate
    isAligned: boolean
    lastAlignmentCheck: number
  }
  
  // Mesh data
  vertices: VertexCoordinate[]
  vertexBuffer: Float32Array
  indexBuffer: Uint16Array
  
  // GPU integration
  gpu: {
    vertexBuffer: GPUBuffer | null
    indexBuffer: GPUBuffer | null
    isReady: boolean
    lastUpdate: number
    bindingGroup: GPUBindGroup | null
  }
  
  // Mesh state
  state: {
    isActive: boolean
    needsUpdate: boolean
    lastMeshUpdate: number
    version: number
  }
  
  // Performance metrics
  performance: {
    vertexCount: number
    indexCount: number
    bufferSize: number
    uploadTime: number
    lastMeshGenTime: number
  }
}

// Mesh system actions (for store)
export interface MeshSystemActions {
  updateResolution(resolution: MeshResolution): void
  regenerateMesh(): void
  updateVertexBuffer(): void
  validateAlignment(): boolean
  optimizeMesh(): void
  clearGPUResources(): void
}
```

#### 2.2 Create Filter Pipeline Types
**File**: `app/src/types/filter-pipeline.ts` (NEW)

```typescript
// Filter stages - defines application order
export type FilterStage = 
  | 'pre-geometry'    // Before geometry rendering
  | 'post-geometry'   // After geometry, before camera
  | 'pre-camera'      // Before camera transform
  | 'post-camera'     // After camera transform
  | 'screen-effects'  // Final screen processing

// Filter pipeline configuration
export interface FilterPipeline {
  // Pre-filters (applied before camera transform)
  preFilters: {
    selection: SelectionFilterConfig | null
    outlining: OutlineFilterConfig | null
    colorAdjustment: ColorFilterConfig | null
  }
  
  // Post-filters (applied after camera transform)
  postFilters: {
    pixelation: PixelationFilterConfig | null
    screenBlur: BlurFilterConfig | null
    screenNoise: NoiseFilterConfig | null
    uiOverlays: UIOverlayFilterConfig[]
  }
  
  // Pipeline execution state
  execution: {
    currentStage: FilterStage
    isProcessing: boolean
    stageProgress: number
    lastStageTime: number
  }
  
  // Filter configuration
  configuration: {
    enabled: boolean
    quality: 'low' | 'medium' | 'high'
    maxFiltersPerStage: number
    bufferPoolSize: number
  }
  
  // Performance metrics
  performance: {
    preFilterTime: number
    postFilterTime: number
    totalPipelineTime: number
    filtersApplied: number
    bufferAllocations: number
  }
}

// Individual filter configurations
export interface SelectionFilterConfig {
  enabled: boolean
  outlineColor: number
  outlineWidth: number
  glowIntensity: number
}

export interface PixelationFilterConfig {
  enabled: boolean
  pixelSize: number
  preserveAspectRatio: boolean
  smoothing: boolean
}

// Filter pipeline actions (for store)
export interface FilterPipelineActions {
  enableFilter(stage: FilterStage, filterType: string): void
  disableFilter(stage: FilterStage, filterType: string): void
  updateFilterConfig(stage: FilterStage, config: any): void
  clearFilterStage(stage: FilterStage): void
  resetPipeline(): void
  optimizePipeline(): void
}
```

### Step 3: Create Unified Store Interface (Days 5-6)

#### 3.1 Create Main Store Interface
**File**: `app/src/types/game-store.ts` (NEW)

```typescript
import { ECSDataLayer, ECSDataLayerActions } from './ecs-data-layer'
import { ECSMirrorLayer, ECSMirrorLayerActions } from './ecs-mirror-layer'
import { MeshSystem, MeshSystemActions } from './mesh-system'
import { FilterPipeline, FilterPipelineActions } from './filter-pipeline'
import { MouseState, InputState, UIState, GeometryState, WindowState } from './legacy-types'

// Main game store interface - ECS compliant
export interface GameStore {
  // Core ECS layers (new architecture)
  dataLayer: ECSDataLayer
  mirrorLayer: ECSMirrorLayer
  
  // Supporting systems (new architecture)
  meshSystem: MeshSystem
  filterPipeline: FilterPipeline
  
  // Existing systems (to be gradually migrated)
  mouse: MouseState
  input: InputState
  ui: UIState
  geometry: GeometryState
  window: WindowState
  
  // System state
  system: {
    isInitialized: boolean
    currentMode: 'loading' | 'ready' | 'error'
    lastUpdateTime: number
    frameCount: number
  }
  
  // Performance monitoring
  performance: {
    fps: number
    memoryUsage: number
    renderTime: number
    updateTime: number
    lastMeasurement: number
  }
  
  // Debug information
  debug: {
    layerVisibility: Record<string, boolean>
    showPerformanceMetrics: boolean
    showBoundingBoxes: boolean
    showMeshGrid: boolean
    enableConsoleLogging: boolean
  }
}

// Store actions interface - ECS compliant
export interface GameStoreActions extends 
  ECSDataLayerActions,
  ECSMirrorLayerActions,
  MeshSystemActions,
  FilterPipelineActions {
  
  // System actions
  initializeSystem(): void
  shutdownSystem(): void
  resetSystem(): void
  updateSystem(deltaTime: number): void
  
  // Debug actions
  toggleLayerVisibility(layerName: string): void
  togglePerformanceMetrics(): void
  captureSystemSnapshot(): any
  exportSystemState(): string
  importSystemState(state: string): void
}
```

#### 3.2 Create Type Validation System
**File**: `app/src/types/validation.ts` (NEW)

```typescript
import { GameStore } from './game-store'
import { ECSDataLayer } from './ecs-data-layer'
import { ECSMirrorLayer } from './ecs-mirror-layer'

// Type validation utilities
export interface TypeValidator {
  validateDataLayer(layer: ECSDataLayer): ValidationResult
  validateMirrorLayer(layer: ECSMirrorLayer): ValidationResult
  validateCoordinates(coord: any): ValidationResult
  validateStore(store: GameStore): ValidationResult
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  expectedType: string
  actualType: string
}

export interface ValidationWarning {
  field: string
  message: string
  suggestion: string
}

// Runtime type checking
export const createTypeValidator = (): TypeValidator => {
  return {
    validateDataLayer: (layer: ECSDataLayer): ValidationResult => {
      const errors: ValidationError[] = []
      
      // Validate core ECS principle
      if (layer.scale !== 1) {
        errors.push({
          field: 'scale',
          message: 'Data layer scale must always be 1 (ECS principle)',
          expectedType: '1',
          actualType: String(layer.scale)
        })
      }
      
      // Validate sampling position
      if (!layer.samplingPosition || typeof layer.samplingPosition.x !== 'number') {
        errors.push({
          field: 'samplingPosition',
          message: 'Sampling position must be valid PixeloidCoordinate',
          expectedType: 'PixeloidCoordinate',
          actualType: typeof layer.samplingPosition
        })
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings: []
      }
    },
    
    // Additional validators...
    validateMirrorLayer: (layer: ECSMirrorLayer): ValidationResult => {
      // Implementation...
      return { isValid: true, errors: [], warnings: [] }
    },
    
    validateCoordinates: (coord: any): ValidationResult => {
      // Implementation...
      return { isValid: true, errors: [], warnings: [] }
    },
    
    validateStore: (store: GameStore): ValidationResult => {
      // Implementation...
      return { isValid: true, errors: [], warnings: [] }
    }
  }
}
```

### Step 4: Update Legacy Types (Days 7-8)

#### 4.1 Refactor Main Types File
**File**: `app/src/types/index.ts` (REFACTOR)

```typescript
// Re-export all ECS types for convenience
export * from './ecs-coordinates'
export * from './ecs-data-layer'
export * from './ecs-mirror-layer'
export * from './mesh-system'
export * from './filter-pipeline'
export * from './game-store'
export * from './validation'

// Legacy types (to be gradually removed)
export * from './legacy-types'

// Utility types
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequireField<T, K extends keyof T> = T & Required<Pick<T, K>>

// Type guards
export const isPixeloidCoordinate = (obj: any): obj is PixeloidCoordinate => {
  return obj && typeof obj.x === 'number' && typeof obj.y === 'number'
}

export const isECSDataLayer = (obj: any): obj is ECSDataLayer => {
  return obj && obj.scale === 1 && isPixeloidCoordinate(obj.samplingPosition)
}
```

#### 4.2 Create Legacy Types Container
**File**: `app/src/types/legacy-types.ts` (NEW)

```typescript
// Legacy types to be gradually migrated
// These will be removed in future phases

export interface MouseState {
  position: { x: number; y: number }
  pixeloidPosition: { x: number; y: number }
  vertexPosition: { x: number; y: number }
  isPressed: boolean
  dragStart: { x: number; y: number } | null
}

export interface InputState {
  keys: Record<string, boolean>
  lastKeyTime: number
  modifiers: {
    shift: boolean
    ctrl: boolean
    alt: boolean
  }
}

export interface UIState {
  activePanel: string | null
  isDrawing: boolean
  selectedTool: string
  toolSettings: Record<string, any>
}

export interface GeometryState {
  objects: GeometricObject[]
  selectedObjectId: string | null
  clipboard: any
  drawingMode: string
}

export interface WindowState {
  width: number
  height: number
  pixelRatio: number
  isResizing: boolean
}

// Keep existing GeometricObject for now
export interface GeometricObject {
  id: string
  type: string
  geometry: any
  style: any
  metadata: any
  visibilityCache: Map<number, any>
}
```

## Success Criteria

### Phase 1 Completion Checklist
- [ ] All new ECS type files created and properly structured
- [ ] Clear separation between data layer and mirror layer types
- [ ] ECS principle enforced at type level (scale: 1 literal type)
- [ ] Mesh system types support pixel-perfect alignment
- [ ] Filter pipeline types support proper pre/post staging
- [ ] Type validation system catches architectural violations
- [ ] Legacy types properly isolated for gradual migration
- [ ] All types properly exported and accessible
- [ ] TypeScript compilation passes without errors
- [ ] Type documentation is complete and clear

### Testing Requirements
- [ ] Unit tests for type validation functions
- [ ] Integration tests for store type compliance
- [ ] Performance tests for type checking overhead
- [ ] Documentation examples work correctly

### Next Phase Preparation
- [ ] Store refactoring plan based on new types
- [ ] Migration strategy for existing components
- [ ] Performance impact analysis
- [ ] Documentation updates

## File Structure After Phase 1

```
app/src/types/
├── index.ts                 # Main exports
├── ecs-coordinates.ts       # Core coordinate system
├── ecs-data-layer.ts       # Data layer types
├── ecs-mirror-layer.ts     # Mirror layer types  
├── mesh-system.ts          # Mesh system types
├── filter-pipeline.ts      # Filter pipeline types
├── game-store.ts           # Unified store interface
├── validation.ts           # Type validation
└── legacy-types.ts         # Legacy types container
```

## Implementation Notes

1. **Incremental Approach**: New types can coexist with old ones during transition
2. **Type Safety**: Use literal types and readonly modifiers to enforce ECS principles
3. **Performance**: Types should have minimal runtime overhead
4. **Documentation**: Each type should have comprehensive JSDoc comments
5. **Testing**: Create comprehensive test suite for type validation

This phase creates the foundation for all subsequent refactoring work. The types system must be rock-solid before proceeding to store and rendering system changes.