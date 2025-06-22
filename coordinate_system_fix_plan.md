# Coordinate System Fix Plan

## Problem Summary
The codebase has conflicting interpretations of coordinate systems, particularly around `viewport_offset` which is used both as camera position and as coordinate mapping offset.

## Root Cause Analysis

### Current Conflicting Usage:
1. **InfiniteCanvas.ts**: `viewport_offset` = camera position (top-left corner of viewport)
2. **CoordinateHelper.ts**: `viewport_offset` = mapping offset for coordinate conversion
3. **StaticMeshManager.ts**: `viewport_offset` = mesh vertex to pixeloid mapping offset

### The Fundamental Issue:
```typescript
// InfiniteCanvas.ts line 56 - treats as camera position
this.localCameraPosition.x = gameStore.viewport_offset.x

// CoordinateHelper.ts line 140 - treats as coordinate offset  
x: vertex.x + gameStore.viewport_offset.x

// These are conceptually different!
```

## Proposed Solution: Semantic Clarity

### 1. Rename and Separate Concepts

**Replace `viewport_offset` with two clear concepts:**

```typescript
// In gameStore.ts
camera_position: PixeloidCoordinate  // Where the camera is looking (top-left)
mesh_vertex_origin: PixeloidCoordinate  // Where mesh vertex (0,0) maps in pixeloid space
```

### 2. Update All Coordinate Conversions

**New clear conversion formulas:**
```typescript
// Screen to Pixeloid
pixeloid = screen / scale + camera_position

// Mesh Vertex to Pixeloid  
pixeloid = vertex + mesh_vertex_origin

// Pixeloid to Mesh Vertex
vertex = pixeloid - mesh_vertex_origin
```

### 3. Implementation Steps

#### Step 1: Update Store Interface
```typescript
// gameStore.ts - REMOVE viewport_offset, ADD:
camera_position: PixeloidCoordinate    // Camera position in world
mesh_vertex_origin: PixeloidCoordinate // Where vertex (0,0) maps to
```

#### Step 2: Update CoordinateHelper
```typescript
// CoordinateHelper.ts - Update all methods to use clear semantics
static meshVertexToPixeloid(vertex, meshVertexOrigin) {
  return {
    x: vertex.x + meshVertexOrigin.x,
    y: vertex.y + meshVertexOrigin.y
  }
}
```

#### Step 3: Update InfiniteCanvas
```typescript
// InfiniteCanvas.ts - Use camera_position directly
private syncFromStore(): void {
  this.localCameraPosition.x = gameStore.camera_position.x
  this.localCameraPosition.y = gameStore.camera_position.y
}
```

#### Step 4: Simplify StaticMeshManager
```typescript
// StaticMeshManager.ts - Remove complex caching, use simple formula
updateCoordinateMapping(meshVertexOrigin) {
  // Simple mapping without complex caching
  // pixeloid = vertex + meshVertexOrigin
}
```

## Benefits of This Approach

1. **Clear Semantics**: No ambiguity about what coordinates mean
2. **Single Source of Truth**: Each conversion has one implementation
3. **Reduced Complexity**: Removes over-engineered caching
4. **Better Debugging**: Clear variable names make issues obvious
5. **Type Safety**: Different coordinate types can't be mixed

## Migration Strategy

### Phase 1: Add New Fields (Non-Breaking)
- Add `camera_position` and `mesh_vertex_origin` to store
- Keep `viewport_offset` temporarily
- Update new code to use new fields

### Phase 2: Update Core Systems
- Update CoordinateHelper to use new semantics
- Update InfiniteCanvas camera handling
- Test coordinate conversions thoroughly

### Phase 3: Remove Old System
- Remove `viewport_offset` from store
- Remove complex StaticMeshManager caching
- Update all remaining references

## Key Files to Modify

1. **gameStore.ts** - Update coordinate storage
2. **CoordinateHelper.ts** - Simplify conversion methods
3. **InfiniteCanvas.ts** - Use camera_position directly
4. **StaticMeshManager.ts** - Simplify or remove entirely
5. **BackgroundGridRenderer.ts** - Update coordinate usage
6. **InputManager.ts** - Update coordinate handling

## Risk Mitigation

- **Backward Compatibility**: Keep old methods temporarily
- **Incremental Migration**: Change one system at a time
- **Testing**: Test each coordinate conversion thoroughly
- **Documentation**: Document new coordinate semantics clearly

## Success Criteria

- [ ] All coordinate conversions use consistent semantics
- [ ] No duplicate coordinate conversion methods
- [ ] Camera movement works correctly
- [ ] Mesh vertex detection works correctly
- [ ] Input handling remains robust
- [ ] Code is easier to understand and debug

Would you like me to proceed with creating the specific code changes for any of these phases?