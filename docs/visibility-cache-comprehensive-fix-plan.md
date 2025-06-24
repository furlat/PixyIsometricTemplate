# Visibility Cache Comprehensive Fix Plan

## Problem Summary

Objects created off-screen never initialize their visibility cache, leading to:
- Wrong visibility calculations when they come into view
- Incorrect bounds used for texture extraction
- Visual artifacts and misaligned sprites
- BoundingBoxRenderer showing full bounds instead of screen-clipped bounds

## Root Causes

1. **No visibility cache initialization** - Objects created without visibility cache
2. **Stale visibility state** - Objects starting off-screen don't update when coming into view
3. **Inconsistent renderer behavior** - BoundingBoxRenderer doesn't use visibility cache
4. **Wrong bounds cascade** - Incorrect visibility → wrong texture extraction → visual artifacts

## Fix Implementation

### 1. Initialize Visibility Cache on Object Creation

In `gameStore.ts`, update all factory methods (createPoint, createLine, etc.):

```typescript
// Add after metadata calculation
const currentScale = gameStore.camera.pixeloid_scale
const visibilityInfo = GeometryHelper.calculateVisibilityState(newObject, currentScale)

newObject.metadata.visibilityCache = new Map()
newObject.metadata.visibilityCache.set(currentScale, {
  visibility: visibilityInfo.visibility,
  onScreenBounds: visibilityInfo.onScreenBounds
})
```

### 2. Fix BoundingBoxRenderer to Use Visibility Cache

Update `BoundingBoxRenderer.ts`:

```typescript
private renderBoundingBoxRectangle(convertedObj: GeometricObject, pixeloidScale: number): void {
  if (!convertedObj.metadata) return

  // Get visibility data from cache
  const visibilityData = convertedObj.metadata.visibilityCache?.get(pixeloidScale)
  
  // Use screen-clipped bounds for partially visible objects
  const bounds = (visibilityData?.visibility === 'partially-onscreen' && visibilityData?.onScreenBounds)
    ? visibilityData.onScreenBounds
    : convertedObj.metadata.bounds
    
  // Remove double offset application - bounds are already in pixeloid space
  const vertexBounds = {
    minX: bounds.minX - gameStore.mesh.vertex_to_pixeloid_offset.x,
    maxX: bounds.maxX - gameStore.mesh.vertex_to_pixeloid_offset.x,
    minY: bounds.minY - gameStore.mesh.vertex_to_pixeloid_offset.y,
    maxY: bounds.maxY - gameStore.mesh.vertex_to_pixeloid_offset.y
  }
  
  // Convert to screen coordinates
  const screenPos = CoordinateCalculations.vertexToScreen(
    { __brand: 'vertex', x: vertexBounds.minX, y: vertexBounds.minY },
    pixeloidScale
  )
  const screenWidth = (vertexBounds.maxX - vertexBounds.minX) * pixeloidScale
  const screenHeight = (vertexBounds.maxY - vertexBounds.minY) * pixeloidScale
  
  // Draw bbox
  this.graphics
    .rect(screenPos.x, screenPos.y, screenWidth, screenHeight)
    .fill({ color: 0xff0000, alpha: 0.1 })
    .stroke({ width: 1, color: 0xff0000, alpha: 0.8 })
}
```

### 3. Ensure Visibility Updates on All Camera Changes

The store already updates visibility on:
- `setPixeloidScale` (zoom)
- `setVertexToPixeloidOffset` (pan)
- `updateWindowSize` (resize)

But we need to ensure it handles edge cases properly.

### 4. Add Visibility Cache Validation

Add a helper function to validate visibility cache consistency:

```typescript
function validateVisibilityCache(obj: GeometricObject, scale: number): boolean {
  const cache = obj.metadata?.visibilityCache?.get(scale)
  if (!cache) return false
  
  // Validate bounds are reasonable
  if (cache.onScreenBounds) {
    const { minX, maxX, minY, maxY } = cache.onScreenBounds
    if (minX > maxX || minY > maxY) return false
    if (!isFinite(minX) || !isFinite(maxX) || !isFinite(minY) || !isFinite(maxY)) return false
  }
  
  return true
}
```

### 5. Fix GeometryHelper.calculateVisibilityState

The current implementation might have coordinate conversion issues. Need to verify:
- Screen bounds calculation is correct
- Intersection calculation handles edge cases
- onScreenBounds conversion back to pixeloid is accurate

## Testing Strategy

1. **Create object off-screen** → Verify visibility cache initialized with 'offscreen'
2. **Zoom to bring into view** → Verify visibility updates to 'partially-onscreen'
3. **Check BoundingBoxRenderer** → Red box should match visible portion only
4. **Verify MirrorLayerRenderer** → Texture extracted with correct bounds
5. **Test edge cases** → Objects at screen edges, very large objects, tiny objects

## Expected Results

- BoundingBoxRenderer shows screen-clipped bounds (not full bounds)
- MirrorLayerRenderer extracts textures with correct dimensions
- No visual artifacts or misalignment
- Consistent behavior across all zoom levels

## Migration Notes

- Existing objects without visibility cache will calculate on-demand (backward compatible)
- Performance impact minimal (visibility calculation is fast)
- Memory usage increases slightly (cache per scale per object)