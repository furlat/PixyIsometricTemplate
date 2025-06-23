# Geometry Render 60fps - Remove All Dirty Flag Optimization Plan

## Current State Analysis

### LayeredInfiniteCanvas Dirty Flag System (BLOCKING RENDERS)

**Current Blocking Logic (lines 187-194):**
```typescript
// Check if geometry needs re-rendering (only on data changes or zoom)
if (this.geometryDirty || pixeloidScale !== this.lastPixeloidScale) {
  try {
    this.renderGeometryLayer(paddedCorners, pixeloidScale)
  } finally {
    this.geometryDirty = false  // ALWAYS RESET
  }
}
```

**Subscriptions Setting Dirty Flag:**
- Line 332: `gameStore.geometry.objects` → `this.geometryDirty = true` ✅ WORKS
- Line 338: `gameStore.geometry.drawing.activeDrawing` → `this.geometryDirty = true`
- Line 344: `gameStore.geometry.layerVisibility` → `this.geometryDirty = true` 
- Line 358: `gameStore.mesh.vertex_to_pixeloid_offset` → `this.geometryDirty = true` ❌ BROKEN

**Problem:** Line 358 subscription not firing during WASD → geometryDirty stays false → no renders

## Store Batching Issue Analysis

### setVertexToPixeloidOffset Guard (Potential WASD Blocker)

**Store Code (gameStore.ts lines 275-299):**
```typescript
setVertexToPixeloidOffset: (offset: PixeloidCoordinate) => {
  if (isUpdatingCoordinates) return // ⚠️ MAY BLOCK RAPID WASD UPDATES
  
  isUpdatingCoordinates = true
  try {
    gameStore.mesh.vertex_to_pixeloid_offset = offset // Should trigger subscription
    // ... derived calculations ...
  } finally {
    isUpdatingCoordinates = false
  }
}
```

**Potential Issue:** 60fps WASD calls getting blocked by guard → no store changes → no subscriptions fire

## Solution: Remove All Dirty Flag Optimization

### Phase 1: Remove geometryDirty System from LayeredInfiniteCanvas

**Files to Modify:** `app/src/game/LayeredInfiniteCanvas.ts`

**Changes Required:**

1. **Remove dirty flag declaration (line 63):**
```typescript
// DELETE: private geometryDirty = true
```

2. **Remove conditional render check (lines 187-194):**
```typescript
// REPLACE:
if (this.geometryDirty || pixeloidScale !== this.lastPixeloidScale) {
  try {
    this.renderGeometryLayer(paddedCorners, pixeloidScale)
  } finally {
    this.geometryDirty = false
  }
}

// WITH:
// Always render geometry every frame at 60fps
this.renderGeometryLayer(paddedCorners, pixeloidScale)
```

3. **Simplify subscription logic (lines 329-360):**
```typescript
// REMOVE all geometryDirty assignments from subscriptions
// KEEP subscriptions for texture capture and other side effects

private subscribeToStoreChanges(): void {
  // Keep for texture capture only
  subscribe(gameStore.geometry.objects, () => {
    this.markNewObjectsForTextureCapture()
  })

  // Keep for background rendering 
  subscribe(gameStore.camera, () => {
    if (gameStore.camera.pixeloid_scale !== this.lastPixeloidScale) {
      this.backgroundDirty = true
      this.lastPixeloidScale = gameStore.camera.pixeloid_scale
    }
  })

  // Keep for background/visibility
  subscribe(gameStore.geometry.layerVisibility, () => {
    this.backgroundDirty = true
  })

  // REMOVE offset subscription (no longer needed)
  // REMOVE activeDrawing subscription (no longer needed)
}
```

4. **Remove from forceRefresh method (line 449):**
```typescript
public forceRefresh(): void {
  this.backgroundDirty = true
  // DELETE: this.geometryDirty = true
}
```

### Phase 2: Verify Store Update Path

**Files to Check:** `app/src/store/gameStore.ts`

**Investigation Points:**
1. **Verify `isUpdatingCoordinates` guard timing** (line 276)
2. **Check if store value actually changes** during WASD
3. **Ensure coordinate mapping updates correctly**

**No Changes Required** - just verification that store updates work correctly at 60fps

### Phase 3: Coordinate Type Verification

**Files to Check:** 
- `app/src/types/index.ts`
- `app/src/game/CoordinateCalculations.ts` 
- `app/src/game/CoordinateHelper.ts`

**Verify:**
- No redundant coordinate types
- Branded types working correctly  
- No coordinate conversion conflicts

## Expected Result After Changes

### New Render Flow (60fps)
1. **Game.update()** → calls **LayeredInfiniteCanvas.render()** at 60fps
2. **LayeredInfiniteCanvas.render()** → ALWAYS calls **renderGeometryLayer()**
3. **renderGeometryLayer()** → calls **GeometryRenderer.render()** 
4. **GeometryRenderer.render()** → renders with current store values
5. **Geometry updates in real-time** during WASD movement

### Performance Considerations
- **Background layer** keeps dirty flag optimization (line 179)
- **Selection/mask/bbox layers** render every frame (already happening)
- **Geometry layer** now renders every frame (new behavior)
- **60fps geometry rendering** should be performant for reasonable object counts

### Benefits
- **Eliminates subscription timing issues**
- **Eliminates store coordination problems** 
- **Eliminates race conditions**
- **Guarantees geometry renders during WASD**
- **Simplifies codebase**

## Files to Modify

1. **`app/src/game/LayeredInfiniteCanvas.ts`** - Main changes
2. **Verification only:** `app/src/store/gameStore.ts`, coordinate files

## Testing Verification

After changes:
1. **WASD movement** → geometry renders in real-time ✅
2. **Object drawing** → still works correctly ✅  
3. **Performance** → acceptable at 60fps geometry renders ✅
4. **No infinite loops** → clean render every frame ✅