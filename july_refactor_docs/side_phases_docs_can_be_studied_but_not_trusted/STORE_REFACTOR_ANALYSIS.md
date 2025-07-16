# Store and Types Refactor Analysis - Clear Data/Mirror Separation

## Current Problems Identified

### 1. Naming Confusion in `cameraViewport`
```typescript
cameraViewport: {
  viewport_position: PixeloidCoordinate(0, 0),           // Mirror layer
  geometry_sampling_position: PixeloidCoordinate(0, 0),  // Data layer
  zoom_factor: 10,                                       // Mirror layer
  geometry_layer_bounds: { ... },                       // Data layer
  geometry_layer_scale: 1,                              // Data layer (always 1)
  is_panning: boolean,                                   // Mirror layer
  pan_start_position: PixeloidCoordinate(0, 0)          // Mirror layer
}
```

**Problem**: Mixed responsibilities in single object - confusing which belongs to which layer.

### 2. Duplicate Position Variables
- `viewport_position` vs `geometry_sampling_position`
- Both are pixeloid coordinates but serve different purposes
- Not clear which one to use when

### 3. Unclear Layer Ownership
- `geometry_layer_*` prefixes suggest data layer
- But mixed with mirror layer properties
- Hard to understand the ECS separation

## Proposed Refactored Store Structure

### Clear Layer Separation
```typescript
// BEFORE (Current - Confusing)
cameraViewport: {
  viewport_position: PixeloidCoordinate,
  geometry_sampling_position: PixeloidCoordinate,
  zoom_factor: number,
  geometry_layer_bounds: { ... },
  geometry_layer_scale: 1,
  is_panning: boolean,
  pan_start_position: PixeloidCoordinate
}

// AFTER (Proposed - Clear)
dataLayer: {
  // ECS sampling window (what gets rendered from geometry)
  sampling_position: PixeloidCoordinate,
  
  // Fixed data bounds (expands as objects are added)
  bounds: {
    width: number,
    height: number,
    minX: number,
    maxX: number,
    minY: number,
    maxY: number
  },
  
  // Always 1 - this is the key ECS insight
  scale: 1
},

mirrorLayer: {
  // Camera viewport position (for zoom 2+)
  viewport_position: PixeloidCoordinate,
  
  // Current zoom factor
  zoom_factor: number,
  
  // Camera movement state
  is_panning: boolean,
  pan_start_position: PixeloidCoordinate
}
```

### Movement Method Refactoring
```typescript
// BEFORE (Current)
updateMovementECS: (deltaX: number, deltaY: number) => {
  const zoomFactor = gameStore.cameraViewport.zoom_factor
  
  if (zoomFactor === 1) {
    // Move geometry sampling window
    const currentPos = gameStore.cameraViewport.geometry_sampling_position
    updateGameStore.setGeometrySamplingPosition(...)
  } else {
    // Move mirror viewport  
    const currentPos = gameStore.cameraViewport.viewport_position
    updateGameStore.setCameraViewportPosition(...)
  }
}

// AFTER (Proposed - Clear)
updateMovementECS: (deltaX: number, deltaY: number) => {
  const zoomFactor = gameStore.mirrorLayer.zoom_factor
  
  if (zoomFactor === 1) {
    // Move data layer sampling window
    const currentPos = gameStore.dataLayer.sampling_position
    updateGameStore.setDataLayerSamplingPosition(...)
  } else {
    // Move mirror layer viewport
    const currentPos = gameStore.mirrorLayer.viewport_position
    updateGameStore.setMirrorLayerViewportPosition(...)
  }
}
```

## Types Refactoring

### 1. Remove Duplicate/Legacy Types
```typescript
// REMOVE - Legacy camera state
export interface CameraState {
  position: PixeloidCoordinate
  pixeloidScale: number
  viewportCorners: ViewportCorners
}

// REMOVE - Confusing mixed viewport
export interface GameState {
  cameraViewport: { ... }
}
```

### 2. Add Clear Layer Types
```typescript
// NEW - Clear data layer type
export interface DataLayerState {
  // ECS sampling window position
  sampling_position: PixeloidCoordinate
  
  // Fixed data bounds (expands as needed)
  bounds: {
    width: number
    height: number
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
  
  // Always 1 - core ECS principle
  scale: 1
}

// NEW - Clear mirror layer type
export interface MirrorLayerState {
  // Camera viewport position
  viewport_position: PixeloidCoordinate
  
  // Current zoom factor
  zoom_factor: number
  
  // Camera movement state
  is_panning: boolean
  pan_start_position: PixeloidCoordinate
}

// UPDATED - Clear game state
export interface GameState {
  isInitialized: boolean
  isLoading: boolean
  currentScene: string
  windowWidth: number
  windowHeight: number
  
  // CLEAR LAYER SEPARATION
  dataLayer: DataLayerState
  mirrorLayer: MirrorLayerState
  
  // Rest remains the same
  mouse: { ... }
  input: InputState
  geometry: GeometryState
  textureRegistry: TextureRegistryState
  meshRegistry: MeshRegistryState
  staticMesh: StaticMeshState
}
```

## Method Renaming for Clarity

### Current (Confusing)
```typescript
setCameraViewportPosition: (position: PixeloidCoordinate) => void
setGeometrySamplingPosition: (position: PixeloidCoordinate) => void
setCameraViewportZoom: (zoomFactor: number) => void
```

### Proposed (Clear)
```typescript
// Data layer methods
setDataLayerSamplingPosition: (position: PixeloidCoordinate) => void
expandDataLayerBounds: (newBounds: DataLayerBounds) => void

// Mirror layer methods  
setMirrorLayerViewportPosition: (position: PixeloidCoordinate) => void
setMirrorLayerZoom: (zoomFactor: number) => void
setMirrorLayerPanning: (isPanning: boolean, startPos?: PixeloidCoordinate) => void
```

## Mouse Position Handling

### Current (Confusing Logic)
```typescript
updateMousePositions: (screenPos: { x: number, y: number }) => {
  const scale = gameStore.cameraViewport.zoom_factor
  
  let pixeloidPos: PixeloidCoordinate
  if (scale === 1) {
    // Use geometry sampling position as offset
    const offset = gameStore.cameraViewport.geometry_sampling_position
    pixeloidPos = CoordinateCalculations.vertexToPixeloid(vertexPos, offset)
  } else {
    // Use viewport position as offset
    const offset = gameStore.cameraViewport.viewport_position
    pixeloidPos = CoordinateCalculations.vertexToPixeloid(vertexPos, offset)
  }
}
```

### Proposed (Clear Logic)
```typescript
updateMousePositions: (screenPos: { x: number, y: number }) => {
  const zoomFactor = gameStore.mirrorLayer.zoom_factor
  
  let pixeloidPos: PixeloidCoordinate
  if (zoomFactor === 1) {
    // Use data layer sampling position as offset
    const offset = gameStore.dataLayer.sampling_position
    pixeloidPos = CoordinateCalculations.vertexToPixeloid(vertexPos, offset)
  } else {
    // Use mirror layer viewport position as offset
    const offset = gameStore.mirrorLayer.viewport_position
    pixeloidPos = CoordinateCalculations.vertexToPixeloid(vertexPos, offset)
  }
}
```

## What to Keep vs Remove

### ✅ KEEP (Essential)
- `dataLayer.sampling_position` - ECS sampling window
- `dataLayer.bounds` - Fixed data layer bounds
- `dataLayer.scale` - Always 1 (core ECS principle)
- `mirrorLayer.viewport_position` - Camera viewport for zoom 2+
- `mirrorLayer.zoom_factor` - Current zoom level
- `mirrorLayer.is_panning` - Camera movement state

### ❌ REMOVE (Confusing/Duplicate)
- `geometry_sampling_position` - Rename to `dataLayer.sampling_position`
- `viewport_position` - Move to `mirrorLayer.viewport_position`
- `geometry_layer_bounds` - Rename to `dataLayer.bounds`
- `geometry_layer_scale` - Rename to `dataLayer.scale`
- `setCameraViewportPosition` - Confusing name
- `setGeometrySamplingPosition` - Confusing name

### 🔄 RENAME (Better Clarity)
- `cameraViewport` → `dataLayer` + `mirrorLayer`
- `geometry_sampling_position` → `sampling_position`
- `viewport_position` → `viewport_position` (but in mirrorLayer)
- `geometry_layer_bounds` → `bounds` (but in dataLayer)

## Benefits of This Refactor

1. **No More Confusion**: Clear separation between data and mirror layers
2. **Easier Debugging**: Can easily see which layer a property belongs to
3. **Better ECS Understanding**: Makes the dual-layer architecture obvious
4. **Clearer Movement Logic**: No more confusing position variable names
5. **Maintainability**: Future developers will understand the architecture immediately

## Implementation Priority

1. **High Priority**: Rename `cameraViewport` to `dataLayer` + `mirrorLayer`
2. **Medium Priority**: Update all method names for clarity
3. **Low Priority**: Clean up legacy types and interfaces

This refactoring will make the ECS dual-layer architecture crystal clear and eliminate all naming confusion.