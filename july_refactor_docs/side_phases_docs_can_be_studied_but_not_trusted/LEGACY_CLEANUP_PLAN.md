# Legacy Coordinate System Cleanup Plan

## Overview
The dual coordinate system (legacy + camera viewport) is causing conflicts and bugs. This plan outlines the complete removal of the legacy coordinate system, keeping only the camera viewport architecture.

## Current State Analysis

### Legacy Variables to Remove

#### gameStore.ts - Legacy State Objects:
```typescript
// REMOVE: Legacy camera object
camera: {
  world_position: PixeloidCoordinate,
  screen_center: { x: number, y: number },
  pixeloid_scale: number,                    // ← Main conflict with zoom_factor
  viewport_bounds: ViewportBounds
}

// REMOVE: Legacy mesh object  
mesh: {
  vertex_to_pixeloid_offset: PixeloidCoordinate,  // ← Conflicts with camera positioning
  active_resolution: number,
  vertex_bounds: { width: number, height: number },
  screen_to_vertex_scale: number             // ← Duplicates pixeloid_scale
}

// REMOVE: Legacy feature flags
FEATURE_FLAGS: {
  LEGACY_COORDINATE_SYSTEM: true,           // ← Remove entirely
  DEBUG_CAMERA_VIEWPORT: false             // ← Can stay for debugging
}
```

#### Legacy Store Methods to Remove:
```typescript
// Remove all legacy coordinate update methods:
- setCameraPosition()
- setPixeloidScale() 
- setVertexToPixeloidOffset()
- updateMousePosition()
- updateMousePixeloidPosition()
- updateMouseVertexPosition()
- setViewportOffset()
- updateViewportOffset()
- canZoomToScale()  // OOM prevention logic
```

### Files Requiring Major Changes

#### 1. InfiniteCanvas.ts
**REMOVE:**
- `handleLegacyZoom()` method
- `applyLegacyTransform()` method  
- `syncFromStore()` / `syncToStore()` legacy coordinate syncing
- `localCameraPosition` / `localPixeloidScale` variables
- All feature flag conditionals

**KEEP:**
- `handleCameraViewportZoom()` (rename to `handleZoom()`)
- `applyCameraViewportTransform()` (rename to `applyCameraTransform()`)
- Camera viewport rendering logic

#### 2. LayeredInfiniteCanvas.ts  
**REMOVE:**
- Legacy rendering branches in all `render*Layer()` methods
- `renderLegacyMirrorLayer()` method
- Legacy viewport bounds calculation
- Legacy store subscriptions

**KEEP:**
- Camera viewport rendering methods (rename to remove "CameraViewport" prefix)
- New layer architecture

#### 3. InputManager.ts
**REMOVE:**
- `updateLegacyMovement()` method
- Legacy WASD movement logic
- Legacy space key handling branch

**KEEP:**
- `updateCameraViewportMovement()` (rename to `updateMovement()`)
- Camera viewport input handling

#### 4. BackgroundGridRenderer.ts
**REMOVE:**
- Legacy coordinate conversion in `handleMeshPointerEvent()`
- `CoordinateHelper` usage

**KEEP:**
- Camera viewport coordinate conversion (direct vertex-to-pixeloid mapping)

#### 5. CoordinateHelper.ts
**STATUS:** May be entirely removable - analyze usage

### New Simplified State Structure

#### gameStore.ts - Clean Camera Viewport Only:
```typescript
export const gameStore = proxy<GameState>({
  // Core app state
  isInitialized: boolean,
  isLoading: boolean,
  currentScene: string,
  windowWidth: number,
  windowHeight: number,
  
  // SINGLE COORDINATE SYSTEM: Camera Viewport Only
  camera: {
    // Rename cameraViewport → camera for simplicity
    position: PixeloidCoordinate,              // viewport_position
    zoom: number,                              // zoom_factor (1,2,4,8,16,32,64,128)
    geometryBounds: {                          // geometry_layer_bounds
      width: number,
      height: number, 
      minX: number,
      maxX: number,
      minY: number,
      maxY: number
    },
    geometryOffset: PixeloidCoordinate,        // geometry_layer_offset
    viewportBounds: ViewportBounds,            // calculated bounds
    isPanning: boolean,                        // is_panning
    panStart: PixeloidCoordinate              // pan_start_position
  },
  
  // Mouse state (simplified)
  mouse: {
    screen: ScreenCoordinate,
    geometry: PixeloidCoordinate,              // Direct geometry layer coordinates
  },
  
  // Input state (unchanged)
  input: InputState,
  
  // Geometry system (unchanged)
  geometry: GeometryState,
  
  // Other systems (unchanged)
  textureRegistry: TextureRegistryState,
  meshRegistry: MeshRegistryState,
  staticMesh: StaticMeshState
})
```

## Cleanup Steps

### Phase 1: Remove Feature Flags and Dual Logic
1. Remove `USE_CAMERA_VIEWPORT_ARCHITECTURE` feature flag
2. Remove `LEGACY_COORDINATE_SYSTEM` feature flag  
3. Remove all `if (feature flag)` conditionals
4. Keep only camera viewport code paths

### Phase 2: Simplify State Structure
1. Rename `cameraViewport` → `camera`
2. Rename properties: `viewport_position` → `position`, `zoom_factor` → `zoom`
3. Remove entire legacy `camera` and `mesh` objects
4. Remove legacy mouse properties (`vertex_position`)

### Phase 3: Clean Store Methods
1. Remove all legacy store update methods
2. Rename camera viewport methods: `setCameraViewportPosition` → `setCameraPosition`
3. Simplify coordinate calculation methods
4. Remove OOM prevention logic (not needed with fixed scale 1 geometry)

### Phase 4: Simplify Rendering
1. Remove "CameraViewport" prefixes from method names
2. Remove legacy rendering branches
3. Remove `CoordinateHelper` if no longer used
4. Simplify mouse coordinate conversion

### Phase 5: Update Method Names
1. `handleCameraViewportZoom` → `handleZoom`
2. `applyCameraViewportTransform` → `applyCameraTransform`  
3. `renderCameraViewportMirrorLayer` → `renderMirrorLayer`
4. `updateCameraViewportMovement` → `updateMovement`

### Phase 6: Clean Imports and Dependencies
1. Remove unused `CoordinateHelper` imports
2. Remove unused coordinate conversion utilities
3. Remove legacy type definitions if unused
4. Update type imports to match new state structure

## Risk Assessment

### Low Risk:
- Removing feature flags (clean separation)
- Renaming methods and variables
- Removing unused store methods

### Medium Risk:  
- Changing state structure (may break UI components)
- Removing mouse coordinate properties
- Updating rendering logic

### High Risk:
- Removing `CoordinateHelper` entirely (need usage analysis)
- Changing core coordinate conversion logic
- Updating all file imports simultaneously

## Testing Strategy

### After Each Phase:
1. Build successfully  
2. App starts without errors
3. WASD movement works
4. Mouse wheel zoom works
5. Drawing shapes works
6. No console errors

### Integration Testing:
1. Extended WASD movement session
2. Zoom in/out multiple levels
3. Draw complex shapes at different zoom levels
4. Verify memory usage stays constant

## File Modification Order

1. **gameStore.ts** - Remove legacy state, rename camera viewport
2. **InputManager.ts** - Remove legacy movement logic
3. **InfiniteCanvas.ts** - Remove legacy zoom/transform logic  
4. **LayeredInfiniteCanvas.ts** - Remove legacy rendering branches
5. **BackgroundGridRenderer.ts** - Remove legacy coordinate conversion
6. **CoordinateHelper.ts** - Analyze and potentially remove
7. **All other files** - Update imports and references

## Expected Benefits

### Immediate:
- No more dual system conflicts
- Simpler debugging
- Cleaner code structure
- No feature flag conditionals

### Long-term:
- Easier maintenance
- No coordinate system drift
- O(1) memory usage guaranteed
- Pixel-perfect rendering always enabled

---

**Next Step:** Start with Phase 1 - Remove feature flags and dual logic branches.