# ECS Camera Viewport Architecture - Implementation Plan

## Current State Analysis

Based on the codebase study, the current system has:
- **Clean coordinate system separation** (screen → vertex → pixeloid)
- **Multi-layer rendering** (7 layers with proper hierarchy)
- **WASD movement via vertex_to_pixeloid_offset** (smooth + integer snapping)
- **Zoom system with mouse-centering** (batched, pixeloid-locked)
- **Atomic store updates** preventing coordinate system races

## Target ECS Architecture

### Core Concept
Implement a **dual-layer ECS system** where:
1. **Geometry Layer (Layer 1)** = ECS data sampling at fixed scale 1
2. **Mirror Layer (Layer 2+)** = Camera viewport display with zoom transforms

### Key Behaviors
- **Zoom 1**: WASD moves geometry sampling window, mirror shows complete geometry
- **Zoom 2+**: WASD moves mirror viewport, geometry layer hidden
- **Layer switching**: Automatic show/hide based on zoom level

---

## Implementation Plan

### Phase 1: Add ECS Camera Viewport State

#### 1.1 Store State Addition
**Target**: `gameStore.ts` - Add new state without breaking existing system

```typescript
// ADD to gameStore after existing camera state
cameraViewport: {
  // Mirror layer camera viewport position (for zoom 2+)
  viewport_position: createPixeloidCoordinate(0, 0),
  
  // Geometry layer sampling window position (for zoom 1)
  geometry_sampling_position: createPixeloidCoordinate(0, 0),
  
  // Integer zoom factors for pixel-perfect alignment
  zoom_factor: 1,  // 1, 2, 4, 8, 16, 32, 64, 128
  
  // Fixed geometry layer bounds (expands as needed)
  geometry_layer_bounds: {
    width: 200,   // Initial geometry layer size in pixeloids
    height: 200,
    minX: -100,   // World coordinate bounds
    maxX: 100,
    minY: -100,
    maxY: 100
  },
  
  // Geometry layer always renders at scale 1
  geometry_layer_scale: 1,
}
```

#### 1.2 Update Store Methods
**Target**: `updateGameStore` object - Add new methods for ECS control

```typescript
// ADD new methods to updateGameStore
setCameraViewportPosition: (position: PixeloidCoordinate) => {
  gameStore.cameraViewport.viewport_position = position
},

setGeometrySamplingPosition: (position: PixeloidCoordinate) => {
  gameStore.cameraViewport.geometry_sampling_position = position
},

setCameraViewportZoom: (zoomFactor: number) => {
  gameStore.cameraViewport.zoom_factor = zoomFactor
},

// Sync both positions for zoom level 1
setSyncedPositions: (position: PixeloidCoordinate) => {
  gameStore.cameraViewport.viewport_position = position
  gameStore.cameraViewport.geometry_sampling_position = position
}
```

**Duration**: 1 hour  
**Risk**: Low - Additive only, no breaking changes

---

### Phase 2: Implement ECS Geometry Layer

#### 2.1 Update GeometryRenderer for ECS Sampling
**Target**: `GeometryRenderer.ts:52` - Change geometry rendering to use ECS viewport sampling

**Current**:
```typescript
public render(pixeloidScale: number): void {
  // Uses vertex_to_pixeloid_offset for positioning
  const objects = gameStore.geometry.objects
  // Renders all objects with coordinate conversion
}
```

**New ECS Version**:
```typescript
public render(): void {  // Remove pixeloidScale parameter
  // ECS viewport sampling at fixed scale 1
  const samplingPos = gameStore.cameraViewport.geometry_sampling_position
  const zoomFactor = gameStore.cameraViewport.zoom_factor
  
  // Calculate sampling window bounds
  const viewportBounds = {
    minX: samplingPos.x,
    maxX: samplingPos.x + (gameStore.windowWidth / zoomFactor),
    minY: samplingPos.y,
    maxY: samplingPos.y + (gameStore.windowHeight / zoomFactor)
  }
  
  // ECS data sampling: only render objects within bounds
  const visibleObjects = gameStore.geometry.objects.filter(obj => 
    obj.metadata && this.isObjectInBounds(obj.metadata.bounds, viewportBounds)
  )
  
  // Render at fixed scale 1 (no coordinate conversion)
  for (const obj of visibleObjects) {
    this.renderObjectAtScale1(obj)
  }
}
```

#### 2.2 Fix LayeredInfiniteCanvas Geometry Layer Setup
**Target**: `LayeredInfiniteCanvas.ts:133-135` - Ensure geometry layer under cameraTransform

**Current**:
```typescript
// All other layers go directly to container (no scaling)
const mainContainer = this.getContainer()
mainContainer.addChild(this.geometryLayer)  // ❌ Wrong - at screen coordinates
```

**Fix**:
```typescript
// ECS Layer 1 goes under camera transform (fixed scale 1, position-only)
this.cameraTransform.addChild(this.geometryLayer)  // ✅ Correct - ECS data sampling
```

#### 2.3 Update GeometryRenderer Call
**Target**: `LayeredInfiniteCanvas.ts:281` - Remove pixeloidScale parameter

**Current**:
```typescript
this.geometryRenderer.render(pixeloidScale)
```

**New**:
```typescript
this.geometryRenderer.render()  // ECS: No scale parameter needed
```

**Duration**: 2 hours  
**Risk**: Medium - Core rendering changes, needs thorough testing

---

### Phase 3: Implement Zoom-Dependent WASD Movement

#### 3.1 Update InputManager Movement Logic
**Target**: `InputManager.ts:623-682` - Add zoom-dependent WASD routing

**Current**:
```typescript
public updateMovement(deltaTime: number): void {
  // Always updates vertex_to_pixeloid_offset
  if (deltaX !== 0 || deltaY !== 0) {
    updateGameStore.setVertexToPixeloidOffset(newOffset)
  }
}
```

**New ECS Version**:
```typescript
public updateMovement(deltaTime: number): void {
  // Calculate movement deltas (same as before)
  let deltaX = 0, deltaY = 0
  if (keys.w) deltaY -= baseDistance
  if (keys.s) deltaY += baseDistance
  if (keys.a) deltaX -= baseDistance
  if (keys.d) deltaX += baseDistance

  if (deltaX !== 0 || deltaY !== 0) {
    const zoomFactor = gameStore.cameraViewport.zoom_factor
    
    if (zoomFactor === 1) {
      // Zoom level 1: Move ONLY geometry sampling window
      const currentPos = gameStore.cameraViewport.geometry_sampling_position
      const newPos = createPixeloidCoordinate(
        currentPos.x + deltaX,
        currentPos.y + deltaY
      )
      updateGameStore.setGeometrySamplingPosition(newPos)
      // Mirror shows complete geometry (no movement)
      
    } else {
      // Zoom level 2+: Move ONLY mirror viewport
      const currentPos = gameStore.cameraViewport.viewport_position
      const newPos = createPixeloidCoordinate(
        currentPos.x + deltaX,
        currentPos.y + deltaY
      )
      updateGameStore.setCameraViewportPosition(newPos)
      // Geometry layer hidden anyway
    }
  }
  
  // Keep integer snapping on key release (same as before)
}
```

#### 3.2 Update Zoom System
**Target**: `InfiniteCanvas.ts:142-183` - Update zoom to use new cameraViewport

**Current**:
```typescript
updateGameStore.setPixeloidScale(this.localPixeloidScale)
```

**New**:
```typescript
updateGameStore.setCameraViewportZoom(this.localPixeloidScale)
```

**Duration**: 2 hours  
**Risk**: Medium - Core input system changes

---

### Phase 4: Implement Automatic Layer Visibility

#### 4.1 Add Zoom-Based Layer Switching
**Target**: `LayeredInfiniteCanvas.ts:288, 344` - Auto show/hide based on zoom

**Current**:
```typescript
// Manual visibility only
this.geometryLayer.visible = gameStore.geometry.layerVisibility.geometry
this.mirrorLayer.visible = gameStore.geometry.layerVisibility.mirror
```

**New**:
```typescript
// Automatic zoom-based + manual override
const zoomFactor = gameStore.cameraViewport.zoom_factor
const autoShowGeometry = (zoomFactor === 1)
const autoShowMirror = true  // Mirror always available

this.geometryLayer.visible = autoShowGeometry && gameStore.geometry.layerVisibility.geometry
this.mirrorLayer.visible = autoShowMirror && gameStore.geometry.layerVisibility.mirror
```

#### 4.2 Update Mirror Layer for Camera Viewport
**Target**: `LayeredInfiniteCanvas.ts:331-349` - Mirror layer uses camera viewport

**Current**:
```typescript
this.mirrorLayerRenderer.render(corners, pixeloidScale, this.geometryRenderer)
```

**New**:
```typescript
const zoomFactor = gameStore.cameraViewport.zoom_factor
if (zoomFactor === 1) {
  // Show complete geometry mirror
  this.mirrorLayerRenderer.renderComplete(this.geometryRenderer)
} else {
  // Show camera viewport of geometry
  this.mirrorLayerRenderer.renderViewport(
    gameStore.cameraViewport.viewport_position,
    zoomFactor,
    this.geometryRenderer
  )
}
```

**Duration**: 2 hours  
**Risk**: Medium - Layer coordination logic

---

### Phase 5: Update Types and Cleanup

#### 5.1 Add cameraViewport to GameState Interface
**Target**: `types/index.ts` - Add new types

```typescript
// ADD to GameState interface
cameraViewport: {
  viewport_position: PixeloidCoordinate
  geometry_sampling_position: PixeloidCoordinate
  zoom_factor: number
  geometry_layer_bounds: {
    width: number
    height: number
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
  geometry_layer_scale: number
}
```

#### 5.2 Legacy System Transition Plan
Keep existing `camera` and `mesh` state during transition:
- **Phase 1-4**: Both systems coexist
- **Phase 5**: Gradually migrate legacy references
- **Phase 6**: Remove legacy state (future)

**Duration**: 1 hour  
**Risk**: Low - Type additions only

---

## Testing Strategy

### Phase-by-Phase Testing

#### Phase 1 Testing
- [ ] Store state added without errors
- [ ] New methods callable without breaking existing functionality
- [ ] Current WASD/zoom still works

#### Phase 2 Testing  
- [ ] Geometry layer renders at fixed scale 1
- [ ] ECS viewport sampling works (objects appear/disappear correctly)
- [ ] Layer positioning correct (under cameraTransform)

#### Phase 3 Testing
- [ ] **Zoom 1**: WASD moves only geometry sampling (mirror static)
- [ ] **Zoom 2+**: WASD moves only mirror viewport (geometry hidden)
- [ ] Smooth movement + integer snapping preserved

#### Phase 4 Testing
- [ ] **Zoom 1**: Both layers visible (live geometry + complete mirror)
- [ ] **Zoom 2+**: Only mirror layer visible (camera viewport)
- [ ] Manual layer toggles still work as overrides

#### Phase 5 Testing
- [ ] TypeScript compilation clean
- [ ] No runtime errors
- [ ] All existing functionality preserved

---

## Risk Mitigation

### High-Risk Areas
1. **GeometryRenderer changes** - Core rendering system
2. **InputManager WASD routing** - Fundamental input behavior
3. **Layer visibility coordination** - Complex state management

### Mitigation Strategies
1. **Incremental implementation** - Each phase independently testable
2. **Coexistence approach** - Keep legacy system during transition
3. **Feature flags** - Add `USE_ECS_ARCHITECTURE` flag for rollback
4. **Comprehensive testing** - Test each phase before proceeding

### Rollback Plan
- Each phase can be reverted independently
- Legacy system remains functional throughout
- Feature flag allows instant disable

---

## Success Criteria

### Technical Success
- [ ] **O(1) memory footprint** - Geometry renders at fixed scale 1
- [ ] **Instant zoom** - Camera transforms vs texture regeneration
- [ ] **Dual-layer behavior** - Correct WASD routing by zoom level
- [ ] **Smooth transitions** - No visual artifacts when switching zoom levels

### User Experience Success  
- [ ] **Zoom 1 feels natural** - Live geometry + complete mirror visible
- [ ] **Zoom 2+ feels natural** - Camera viewport navigation of pre-rendered content
- [ ] **WASD behavior intuitive** - Moves appropriate layer for zoom level
- [ ] **Performance maintained** - No regression in rendering speed

### Code Quality Success
- [ ] **Clean architecture** - Clear separation of ECS vs display layers
- [ ] **Type safety** - Proper TypeScript integration
- [ ] **Maintainable** - Easy to understand and extend
- [ ] **Well documented** - Clear comments explaining ECS behavior

---

## Total Implementation Time: 8-10 hours

**Phase 1**: 1 hour (Store state)  
**Phase 2**: 2 hours (ECS geometry layer)  
**Phase 3**: 2 hours (WASD routing)  
**Phase 4**: 2 hours (Layer visibility)  
**Phase 5**: 1 hour (Types & cleanup)  
**Testing**: 2 hours (Comprehensive validation)

This plan transforms the existing solid architecture into the ECS Camera Viewport system while preserving all current functionality and performance characteristics.