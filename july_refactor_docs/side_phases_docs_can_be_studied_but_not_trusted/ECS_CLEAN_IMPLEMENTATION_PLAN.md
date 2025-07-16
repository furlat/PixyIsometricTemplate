# ECS Camera Viewport Architecture - CLEAN Implementation Plan

## Implementation Strategy: CLEAN TRANSITION

**NO LEGACY COEXISTENCE** - Direct replacement of old system with new ECS architecture.

---

## Phase 1: Replace Store State (BREAKING CHANGES)

### 1.1 Remove Legacy Camera State
**Target**: `gameStore.ts` - Replace existing camera/mesh state

**REMOVE**:
```typescript
camera: {
  world_position: createPixeloidCoordinate(0, 0),
  screen_center: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
  pixeloid_scale: 10,
  viewport_bounds: createEmptyViewportBounds()
},

mesh: {
  vertex_to_pixeloid_offset: createPixeloidCoordinate(0, 0),
  active_resolution: 1,
  vertex_bounds: { width: 100, height: 100 },
  screen_to_vertex_scale: 10
}
```

**REPLACE WITH**:
```typescript
cameraViewport: {
  // Mirror layer camera viewport position (for zoom 2+)
  viewport_position: createPixeloidCoordinate(0, 0),
  
  // Geometry layer sampling window position (for zoom 1)
  geometry_sampling_position: createPixeloidCoordinate(0, 0),
  
  // Integer zoom factors for pixel-perfect alignment
  zoom_factor: 10,  // Start at 10 to match current behavior
  
  // Fixed geometry layer bounds (expands as needed)
  geometry_layer_bounds: {
    width: 200,
    height: 200,
    minX: -100,
    maxX: 100,
    minY: -100,
    maxY: 100
  },
  
  // Geometry layer always renders at scale 1
  geometry_layer_scale: 1,
  
  // Camera movement state
  is_panning: false,
  pan_start_position: createPixeloidCoordinate(0, 0)
}
```

### 1.2 Replace All updateGameStore Methods
**REMOVE ALL** legacy methods:
- `setCameraPosition()`
- `setPixeloidScale()`
- `setVertexToPixeloidOffset()`
- `updateViewportOffset()`

**REPLACE WITH**:
```typescript
// ECS Camera Viewport Methods
setCameraViewportPosition: (position: PixeloidCoordinate) => {
  gameStore.cameraViewport.viewport_position = position
},

setGeometrySamplingPosition: (position: PixeloidCoordinate) => {
  gameStore.cameraViewport.geometry_sampling_position = position
},

setCameraViewportZoom: (zoomFactor: number) => {
  // Validate integer zoom factors
  const validZooms = [1, 2, 4, 8, 16, 32, 64, 128]
  const clampedZoom = validZooms.find(z => z >= zoomFactor) || validZooms[validZooms.length - 1]
  gameStore.cameraViewport.zoom_factor = clampedZoom
},

// WASD movement router based on zoom
updateMovementECS: (deltaX: number, deltaY: number) => {
  const zoomFactor = gameStore.cameraViewport.zoom_factor
  
  if (zoomFactor === 1) {
    // Zoom 1: Move geometry sampling window
    const currentPos = gameStore.cameraViewport.geometry_sampling_position
    updateGameStore.setGeometrySamplingPosition(
      createPixeloidCoordinate(currentPos.x + deltaX, currentPos.y + deltaY)
    )
  } else {
    // Zoom 2+: Move mirror viewport
    const currentPos = gameStore.cameraViewport.viewport_position
    updateGameStore.setCameraViewportPosition(
      createPixeloidCoordinate(currentPos.x + deltaX, currentPos.y + deltaY)
    )
  }
}
```

---

## Phase 2: Update ALL References (BREAKING CHANGES)

### 2.1 Fix InfiniteCanvas.ts
**REPLACE** all legacy coordinate references:

```typescript
// OLD: this.localPixeloidScale = gameStore.camera.pixeloid_scale
// NEW: 
this.localPixeloidScale = gameStore.cameraViewport.zoom_factor

// OLD: updateGameStore.setPixeloidScale(this.localPixeloidScale)
// NEW:
updateGameStore.setCameraViewportZoom(this.localPixeloidScale)

// OLD: this.localCameraPosition.x = gameStore.camera.world_position.x
// NEW: 
this.localCameraPosition.x = gameStore.cameraViewport.viewport_position.x
```

### 2.2 Fix InputManager.ts
**REPLACE** WASD movement system:

```typescript
// OLD: updateGameStore.setVertexToPixeloidOffset(newOffset)
// NEW:
updateGameStore.updateMovementECS(deltaX, deltaY)

// OLD: const pixeloidScale = gameStore.camera.pixeloid_scale
// NEW:
const pixeloidScale = gameStore.cameraViewport.zoom_factor
```

### 2.3 Fix GeometryRenderer.ts  
**REPLACE** coordinate system entirely:

```typescript
// OLD: 
public render(pixeloidScale: number): void {
  const offset = gameStore.mesh.vertex_to_pixeloid_offset
  // Convert coordinates using offset
}

// NEW:
public render(): void {
  const samplingPos = gameStore.cameraViewport.geometry_sampling_position
  const zoomFactor = gameStore.cameraViewport.zoom_factor
  
  // ECS viewport sampling bounds
  const viewportBounds = {
    minX: samplingPos.x,
    maxX: samplingPos.x + (gameStore.windowWidth / zoomFactor),
    minY: samplingPos.y,
    maxY: samplingPos.y + (gameStore.windowHeight / zoomFactor)
  }
  
  // Sample objects within bounds
  const visibleObjects = gameStore.geometry.objects.filter(obj => 
    this.isObjectInViewportBounds(obj, viewportBounds)
  )
  
  // Render at fixed scale 1 (no coordinate conversion)
  for (const obj of visibleObjects) {
    this.renderObjectDirectly(obj)  // No coordinate conversion
  }
}
```

### 2.4 Fix LayeredInfiniteCanvas.ts
**REPLACE** layer setup and rendering calls:

```typescript
// OLD: mainContainer.addChild(this.geometryLayer)
// NEW: 
this.cameraTransform.addChild(this.geometryLayer)  // ECS Layer 1

// OLD: this.renderGeometryLayer(pixeloidScale)
// NEW:
this.renderGeometryLayer()  // No scale parameter

// OLD: Manual visibility only
// NEW: Zoom-based visibility
const zoomFactor = gameStore.cameraViewport.zoom_factor
this.geometryLayer.visible = (zoomFactor === 1) && gameStore.geometry.layerVisibility.geometry
this.mirrorLayer.visible = gameStore.geometry.layerVisibility.mirror
```

---

## Phase 3: Update Types (BREAKING CHANGES)

### 3.1 Remove Legacy Types from GameState
**TARGET**: `types/index.ts`

**REMOVE**:
```typescript
camera: {
  world_position: PixeloidCoordinate
  screen_center: { x: number, y: number }
  pixeloid_scale: number
  viewport_bounds: ViewportBounds
}

mesh: {
  vertex_to_pixeloid_offset: PixeloidCoordinate
  active_resolution: number
  vertex_bounds: { width: number, height: number }
  screen_to_vertex_scale: number
}
```

**REPLACE WITH**:
```typescript
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
  is_panning: boolean
  pan_start_position: PixeloidCoordinate
}
```

---

## Phase 4: Update All Remaining Files

### 4.1 Fix All Renderer References
**Search and replace in ALL files**:
- `gameStore.camera.pixeloid_scale` → `gameStore.cameraViewport.zoom_factor`
- `gameStore.mesh.vertex_to_pixeloid_offset` → Remove (no longer needed)
- `gameStore.camera.world_position` → `gameStore.cameraViewport.viewport_position`

### 4.2 Fix Mirror Layer Implementation
**Target**: `MirrorLayerRenderer.ts`

```typescript
// NEW: Zoom-dependent mirror behavior
public render(): void {
  const zoomFactor = gameStore.cameraViewport.zoom_factor
  
  if (zoomFactor === 1) {
    // Show complete geometry texture
    this.renderCompleteGeometry()
    this.container.scale.set(1)
    this.container.position.set(0, 0)
  } else {
    // Show camera viewport of geometry
    const viewportPos = gameStore.cameraViewport.viewport_position
    this.renderGeometryViewport(viewportPos, zoomFactor)
    this.container.scale.set(zoomFactor)
    this.container.position.set(-viewportPos.x * zoomFactor, -viewportPos.y * zoomFactor)
  }
}
```

---

## Phase 5: Implementation Execution Order

### Step 1: Store State (30 minutes)
1. Replace `camera` and `mesh` state with `cameraViewport`
2. Replace ALL updateGameStore methods
3. Fix immediate TypeScript errors

### Step 2: Core Rendering (1 hour)
1. Fix GeometryRenderer.ts - ECS viewport sampling
2. Fix LayeredInfiniteCanvas.ts - layer setup and visibility
3. Test geometry rendering works

### Step 3: Input System (45 minutes)  
1. Fix InputManager.ts - WASD routing
2. Fix InfiniteCanvas.ts - zoom system
3. Test WASD movement works

### Step 4: All References (45 minutes)
1. Search/replace ALL remaining legacy references
2. Fix TypeScript compilation errors
3. Update types/index.ts

### Step 5: Testing & Polish (30 minutes)
1. Test zoom 1 behavior (both layers visible, WASD moves geometry)
2. Test zoom 2+ behavior (only mirror visible, WASD moves viewport)
3. Verify layer switching works correctly

---

## Success Criteria

### Technical
- [ ] **No legacy state remains** - Clean cameraViewport only
- [ ] **ECS geometry layer** - Fixed scale 1, viewport sampling
- [ ] **Zoom-dependent WASD** - Routes to correct layer based on zoom
- [ ] **Automatic layer switching** - Geometry visible only at zoom 1

### Behavioral  
- [ ] **Zoom 1**: Both layers visible, WASD moves geometry sampling
- [ ] **Zoom 2+**: Only mirror visible, WASD moves viewport
- [ ] **Smooth transitions** - No jumps when switching zoom levels
- [ ] **Performance maintained** - O(1) memory, instant zoom

---

## Total Time: 3.5 hours

**No coexistence bullshit** - Clean replacement of old system with new ECS architecture.

Ready to execute?