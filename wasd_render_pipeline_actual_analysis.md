# WASD Render Pipeline - Actual Code Analysis

## Real Subscription Setup (LayeredInfiniteCanvas.ts lines 329-360)

**WORKING Subscription (confirmed by user):**
```typescript
// Lines 331-334
subscribe(gameStore.geometry.objects, () => {
  this.geometryDirty = true
  this.markNewObjectsForTextureCapture()
})
```
- ✅ **This fires when drawing new objects**
- ✅ **Triggers geometry renders correctly**

**NOT WORKING Subscription (the problem):**
```typescript
// Lines 357-359  
subscribe(gameStore.mesh.vertex_to_pixeloid_offset, () => {
  this.geometryDirty = true
})
```
- ❌ **This should fire during WASD movement but doesn't**
- ❌ **Results in no geometry renders during movement**

## Actual Store Update Path (gameStore.ts lines 275-299)

**WASD Movement → InputManager.updateMovement() → updateGameStore.setVertexToPixeloidOffset():**

```typescript
setVertexToPixeloidOffset: (offset: PixeloidCoordinate) => {
  if (isUpdatingCoordinates) return // ⚠️ POTENTIAL BLOCKER
  
  isUpdatingCoordinates = true
  try {
    gameStore.mesh.vertex_to_pixeloid_offset = offset // Should trigger subscription
    // ... derived updates ...
  } finally {
    isUpdatingCoordinates = false
  }
}
```

## Three Possible Root Causes

### Cause 1: `isUpdatingCoordinates` Guard Blocking Rapid Updates
- WASD calls `setVertexToPixeloidOffset()` at 60fps
- Guard prevents concurrent updates
- If timing is wrong, legitimate WASD updates get blocked
- Blocked updates = no store change = no subscription fire

### Cause 2: Valtio Subscription Not Detecting Changes
- Store value updates but Valtio doesn't detect the change
- Possible object reference issues
- Nested property subscription problems
- Proxy detection failing

### Cause 3: Store Value Not Actually Changing
- Something prevents the actual assignment
- Value comparison causing no-op updates
- Coordinate object comparison issues

## Actual Render Flow Analysis

**Current Working Flow (Drawing New Objects):**
1. Object created → `gameStore.geometry.objects.push(object)`
2. Objects subscription fires → `this.geometryDirty = true`  
3. Game.render() → LayeredInfiniteCanvas.render()
4. Line 187: `if (this.geometryDirty)` → true
5. Line 189: `this.renderGeometryLayer()` called
6. Line 247: `this.geometryRenderer.render()` called
7. Geometry renders correctly

**Broken Flow (WASD Movement):**
1. WASD → InputManager.updateMovement() → setVertexToPixeloidOffset()
2. **BREAK POINT**: Offset subscription doesn't fire
3. `this.geometryDirty` stays false
4. Game.render() → LayeredInfiniteCanvas.render()
5. Line 187: `if (this.geometryDirty)` → false
6. Line 189: `this.renderGeometryLayer()` NOT called
7. No geometry render

## Missing Data Points

**Need to verify:**
1. **Store Update Success**: Does `setVertexToPixeloidOffset()` actually complete or early return?
2. **Store Value Change**: Does `gameStore.mesh.vertex_to_pixeloid_offset` actually change?
3. **Subscription Registration**: Is the offset subscription properly registered?
4. **Subscription Firing**: Does the offset subscription callback execute at all?
5. **Dirty Flag Timing**: When does `geometryDirty` get set to false vs true?

## Key Difference: Objects vs Offset

**Objects Subscription (Works):**
- Single discrete updates
- No guard blocking
- Clear value changes
- Array mutations easily detected by Valtio

**Offset Subscription (Broken):**
- Rapid 60fps updates  
- Guard potentially blocking
- Object property changes
- May not be detected by Valtio proxy

## Next Investigation Steps

**Step 1**: Verify if `setVertexToPixeloidOffset()` early returns during WASD
**Step 2**: Check if `gameStore.mesh.vertex_to_pixeloid_offset` value actually changes
**Step 3**: Confirm offset subscription callback executes
**Step 4**: Trace timing of `geometryDirty` flag changes

This will identify the exact break point without assumptions.