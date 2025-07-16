# Pure ECS Types Rewrite Plan

## Critical Action Required: DELETE AND REWRITE

All existing type files in [`app/src/types/`](app/src/types/) must be **DELETED** and rewritten from scratch with **ZERO** legacy compatibility.

## Files to Delete Completely

1. [`app/src/types/index.ts`](app/src/types/index.ts) - CONTAMINATED
2. [`app/src/types/ecs-data-layer.ts`](app/src/types/ecs-data-layer.ts) - CONTAMINATED  
3. [`app/src/types/ecs-mirror-layer.ts`](app/src/types/ecs-mirror-layer.ts) - CONTAMINATED
4. [`app/src/types/mesh-system.ts`](app/src/types/mesh-system.ts) - CONTAMINATED
5. [`app/src/types/game-store.ts`](app/src/types/game-store.ts) - CONTAMINATED
6. [`app/src/types/filter-pipeline.ts`](app/src/types/filter-pipeline.ts) - CONTAMINATED
7. [`app/src/types/ecs-coordinates.ts`](app/src/types/ecs-coordinates.ts) - CONTAMINATED
8. [`app/src/types/validation.ts`](app/src/types/validation.ts) - CONTAMINATED

## Pure ECS Architecture Requirements

Based on [`CLAUDE.md`](CLAUDE.md):

### 1. Data Layer (Geometry Layer)
- **ALWAYS** `scale: 1` (literal type)
- **NEVER** has camera viewport transforms
- **ONLY** ECS viewport sampling
- **WASD at zoom 1**: Moves sampling window
- **WASD at zoom 2+**: INACTIVE (hidden layer)

### 2. Mirror Layer
- **HAS** camera viewport transforms
- **COPIES** textures from data layer
- **WASD at zoom 1**: INACTIVE (shows complete geometry)
- **WASD at zoom 2+**: Moves camera viewport

### 3. Mesh System
- **Pixel-perfect** alignment (vertex 0,0 → pixel 0,0)
- **Resolution levels**: 1|2|4|8|16|32|64|128
- **NO** legacy mesh compatibility

### 4. Filter Pipeline
- **Pre-filters** → viewport → **post-filters**
- **NO** mixed filter stages

## File 1: `ecs-coordinates.ts` - PURE COORDINATE SYSTEM

```typescript
/**
 * Pure ECS coordinate system - NO legacy compatibility
 */

// Core coordinate types
export interface PixeloidCoordinate {
  readonly x: number
  readonly y: number
}

export interface VertexCoordinate {
  readonly x: number
  readonly y: number
}

export interface ScreenCoordinate {
  readonly x: number
  readonly y: number
}

// NO legacy coordinate types
// NO backward compatibility helpers
// NO mixed coordinate systems
```

## File 2: `ecs-data-layer.ts` - PURE DATA LAYER

```typescript
/**
 * Pure ECS data layer - Fixed scale 1, viewport sampling only
 */

export interface ECSDataLayer {
  // ECS PRINCIPLE: Always scale 1 (literal type)
  readonly scale: 1
  
  // Sampling window (moves with WASD at zoom 1)
  samplingWindow: {
    position: PixeloidCoordinate
    bounds: {
      width: number
      height: number
    }
  }
  
  // Geometry storage at scale 1
  objects: GeometricObject[]
  
  // Sampling result
  visibleObjects: GeometricObject[]
  
  // NO camera viewport properties
  // NO scale property (other than literal 1)
  // NO legacy compatibility
}

export interface GeometricObject {
  readonly id: string
  readonly type: 'point' | 'line' | 'circle' | 'rectangle' | 'diamond'
  readonly vertices: PixeloidCoordinate[]
  readonly isVisible: boolean
  readonly style: {
    color: number
    strokeWidth: number
    fillColor?: number
  }
}

// NO legacy geometry types
// NO backward compatibility
```

## File 3: `ecs-mirror-layer.ts` - PURE MIRROR LAYER

```typescript
/**
 * Pure ECS mirror layer - Camera viewport transforms only
 */

export interface ECSMirrorLayer {
  // Camera viewport (moves with WASD at zoom 2+)
  cameraViewport: {
    position: PixeloidCoordinate
    scale: number  // CAN scale (unlike data layer)
    rotation: number
  }
  
  // Zoom level determines behavior
  zoomLevel: 1 | 2 | 4 | 8 | 16 | 32 | 64 | 128
  
  // Texture cache from data layer
  textureCache: Map<string, MirrorTexture>
  
  // Layer visibility rules
  visibility: {
    showAtZoom1: boolean    // Shows complete geometry
    showAtZoom2Plus: boolean // Shows camera viewport
  }
  
  // NO direct geometry storage
  // NO sampling window
  // NO legacy compatibility
}

export interface MirrorTexture {
  readonly id: string
  readonly texture: any // PIXI.Texture
  readonly sourceDataLayer: string
  readonly bounds: {
    width: number
    height: number
  }
  readonly version: number
  
  // NO scale property (ECS principle)
}

// NO legacy mirror types
// NO backward compatibility
```

## File 4: `mesh-system.ts` - PURE MESH SYSTEM

```typescript
/**
 * Pure mesh system - Pixel-perfect alignment only
 */

export type MeshLevel = 1 | 2 | 4 | 8 | 16 | 32 | 64 | 128

export interface MeshSystem {
  // Current mesh resolution
  currentLevel: MeshLevel
  
  // Pixel-perfect alignment state
  alignment: {
    vertex00ToPixel00: boolean  // MUST be true
    lastValidation: number
    isValid: boolean
  }
  
  // Mesh data
  vertices: VertexCoordinate[]
  indices: number[]
  
  // Resolution cache
  resolutionCache: Map<MeshLevel, MeshData>
  
  // NO legacy mesh compatibility
  // NO backward compatibility helpers
}

export interface MeshData {
  level: MeshLevel
  vertices: Float32Array
  indices: Uint16Array
  isPixelPerfect: boolean
  
  // NO legacy mesh properties
}

export interface StaticMeshData {
  resolution: MeshLevel
  vertices: Float32Array
  indices: Uint16Array
  bounds: {
    minX: number
    minY: number
    maxX: number
    maxY: number
  }
  isValid: boolean
}

// NO legacy mesh types
// NO backward compatibility
```

## File 5: `filter-pipeline.ts` - PURE FILTER PIPELINE

```typescript
/**
 * Pure filter pipeline - Pre/post staging only
 */

export interface FilterPipeline {
  // Pre-filters (applied before viewport)
  preFilters: PreFilter[]
  
  // Post-filters (applied after viewport)
  postFilters: PostFilter[]
  
  // Execution order is FIXED
  executionOrder: 'pre-viewport-post'
  
  // NO mixed filter stages
  // NO legacy filter compatibility
}

export interface PreFilter {
  type: 'background' | 'world-space' | 'object-effect'
  enabled: boolean
  order: number
}

export interface PostFilter {
  type: 'screen-effect' | 'ui-overlay' | 'final-effect'
  enabled: boolean
  order: number
}

// NO legacy filter types
// NO mixed filter stages
```

## File 6: `game-store.ts` - PURE GAME STORE

```typescript
/**
 * Pure game store - ECS components only
 */

export interface GameStore {
  // ECS COMPONENTS ONLY
  dataLayer: ECSDataLayer
  mirrorLayer: ECSMirrorLayer
  meshSystem: MeshSystem
  filterPipeline: FilterPipeline
  
  // System state
  system: {
    initialized: boolean
    currentZoom: 1 | 2 | 4 | 8 | 16 | 32 | 64 | 128
    activeLayer: 'data' | 'mirror'
    wasdTarget: 'data-sampling' | 'mirror-viewport'
  }
  
  // NO legacy systems
  // NO backward compatibility
  // NO gradual migration support
}

export interface GameStoreActions {
  // Data layer actions
  updateDataSampling(position: PixeloidCoordinate): void
  
  // Mirror layer actions
  updateCameraViewport(position: PixeloidCoordinate): void
  
  // Mesh system actions
  setMeshLevel(level: MeshLevel): void
  
  // Filter pipeline actions
  enablePreFilter(type: string): void
  enablePostFilter(type: string): void
  
  // System actions
  setZoomLevel(level: 1 | 2 | 4 | 8 | 16 | 32 | 64 | 128): void
  
  // NO legacy actions
  // NO backward compatibility
}

// NO legacy store types
// NO migration helpers
```

## File 7: `index.ts` - PURE EXPORTS

```typescript
/**
 * Pure ECS type exports - NO legacy compatibility
 */

// ECS coordinate system
export type { PixeloidCoordinate, VertexCoordinate, ScreenCoordinate } from './ecs-coordinates'

// ECS data layer
export type { ECSDataLayer, GeometricObject } from './ecs-data-layer'

// ECS mirror layer
export type { ECSMirrorLayer, MirrorTexture } from './ecs-mirror-layer'

// Mesh system
export type { MeshSystem, MeshLevel, StaticMeshData } from './mesh-system'

// Filter pipeline
export type { FilterPipeline, PreFilter, PostFilter } from './filter-pipeline'

// Game store
export type { GameStore, GameStoreActions } from './game-store'

// ECS constants
export const ECS_DATA_LAYER_SCALE = 1 as const
export const VALID_ZOOM_LEVELS = [1, 2, 4, 8, 16, 32, 64, 128] as const
export const VALID_MESH_LEVELS = [1, 2, 4, 8, 16, 32, 64, 128] as const

// NO legacy type exports
// NO backward compatibility helpers
// NO gradual migration support
```

## Implementation Rules

### 1. **NO Legacy Compatibility**
- Zero legacy type imports
- Zero backward compatibility helpers
- Zero gradual migration support
- Let legacy code break completely

### 2. **Pure ECS Principles**
- Data layer: Always scale 1
- Mirror layer: Camera viewport transforms
- Mesh system: Pixel-perfect alignment
- Filter pipeline: Pre/post staging only

### 3. **Type Safety**
- NO `any` types
- NO `null as any` casts
- NO optional safety compromises
- Strict TypeScript enforcement

### 4. **Architectural Integrity**
- Data layer ≠ Mirror layer
- Sampling window ≠ Camera viewport
- Pre-filters ≠ Post-filters
- ECS components ≠ Legacy systems

## Success Criteria

After rewriting:
- ✅ Zero legacy type references
- ✅ Zero `any` types in ECS components
- ✅ Data layer locked to scale 1
- ✅ Mirror layer has camera transforms
- ✅ Mesh system enforces pixel-perfect alignment
- ✅ Filter pipeline has proper staging
- ✅ WASD routing based on zoom level
- ✅ OOM prevention through fixed-scale geometry

## Expected Breakage

Legacy code will break completely:
- [`app/src/game/StaticMeshManager.ts`](app/src/game/StaticMeshManager.ts) - WILL BREAK
- [`app/src/store/gameStore.ts`](app/src/store/gameStore.ts) - WILL BREAK
- All UI components - WILL BREAK
- All input handlers - WILL BREAK

**This is expected and correct.** Legacy code must be rewritten to use the new ECS architecture.

## Next Steps

1. **DELETE** all existing type files
2. **REWRITE** from scratch using this plan
3. **IGNORE** TypeScript errors in legacy code
4. **VALIDATE** pure ECS architecture
5. **REWRITE** legacy code to use new types

The new architecture is the solution. Legacy code is the problem to be solved.