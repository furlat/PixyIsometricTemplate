# Zoom Cache Synchronization Analysis

## Problem Statement

When zooming (changing pixeloid level), the mirror and pixelate layers have cache synchronization issues:
1. Texture cache is indexed only by object ID, not by scale
2. Bounds (including onScreenBounds) are recalculated in the store but not properly synchronized with texture extraction
3. Texture regions for partially visible objects become incorrect after zoom

## Current Implementation Analysis

### 1. Store Updates on Zoom (gameStore.ts)
```typescript
// Line 273-279: Updates visibility after zoom
for (const obj of gameStore.geometry.objects) {
  if (!obj.metadata) continue
  const visibilityInfo = GeometryHelper.calculateVisibilityState(obj, clampedScale)
  obj.metadata.visibility = visibilityInfo.visibility
  obj.metadata.onScreenBounds = visibilityInfo.onScreenBounds
}
```

### 2. MirrorLayerRenderer Texture Cache
```typescript
// Line 94-96: Checks if new texture needed
const needsNewTexture = !cache ||
                       cache.visualVersion !== visualVersion ||
                       cache.scale !== pixeloidScale
```

The cache stores the scale but doesn't properly handle:
- Scale-dependent bounds calculations
- Texture region updates for partial visibility at different scales

### 3. Texture Region Calculation
```typescript
// Lines 233-248: Texture region calculation
if (isPartial && obj.metadata.onScreenBounds) {
  const fullBounds = obj.metadata.bounds
  const visibleBounds = obj.metadata.onScreenBounds
  
  // Calculate offset within the texture (in screen pixels)
  const offsetX = (visibleBounds.minX - fullBounds.minX) * pixeloidScale
  const offsetY = (visibleBounds.minY - fullBounds.minY) * pixeloidScale
```

## Root Causes

1. **Scale-Dependent Bounds**: The `onScreenBounds` are calculated at a specific scale but used with textures created at different scales
2. **Texture Cache Key**: Using only object ID as cache key doesn't account for scale-dependent variations
3. **Async Updates**: Store updates bounds immediately but texture extraction happens later

## Solution Design

### Option 1: Scale-Indexed Texture Cache
- Change texture cache to use compound key: `${objectId}_${scale}`
- Pros: Simple, each scale has its own texture
- Cons: High memory usage at many zoom levels

### Option 2: Dynamic Texture Region Recalculation
- Keep single texture per object at highest encountered scale
- Recalculate texture regions dynamically based on current scale
- Pros: Memory efficient
- Cons: Complex region math

### Option 3: Scale-Aware Bounds Normalization (Recommended)
- Store bounds in pixeloid coordinates (scale-independent)
- Calculate screen bounds dynamically at render time
- Use scale parameter when creating texture regions
- Pros: Clean separation of concerns, scale-independent storage
- Cons: Requires refactoring bounds calculation

## Implementation Plan

### Phase 1: Immediate Fix
1. Add scale to texture cache key
2. Force texture recreation on scale change
3. Ensure bounds are recalculated before texture extraction

### Phase 2: Proper Solution
1. Refactor bounds storage to be scale-independent
2. Calculate screen-space bounds at render time
3. Implement proper texture region calculation that accounts for scale differences

### Code Changes Required

1. **MirrorLayerRenderer.ts**
   - Modify texture cache to include scale in key
   - Add bounds recalculation before texture extraction
   - Update texture region calculation to handle scale changes

2. **Store Updates**
   - Ensure visibility calculation happens before mirror layer render
   - Add scale change event/flag for cache invalidation

3. **GeometryHelper.ts**
   - Add scale-aware bounds calculation methods
   - Implement bounds normalization utilities

## Testing Scenarios

1. Zoom from 1x to 100x with large object partially visible
2. Pan while zoomed with partially visible objects
3. Rapid zoom in/out to test cache efficiency
4. Objects transitioning between visibility states during zoom