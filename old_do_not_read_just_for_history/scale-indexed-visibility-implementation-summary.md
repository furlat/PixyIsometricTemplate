# Scale-Indexed Visibility Cache Implementation Summary

## Overview
This document summarizes the implementation of the scale-indexed visibility cache system to fix the OOM bug when drawing at pixel size 1 and zooming to 100x.

## Problem
When drawing objects at pixeloid scale 1 and then zooming to scale 100, the shader application area was calculated based on the original bounds without proper screen clipping, resulting in massive texture sizes (e.g., 10000x10000 pixels) that caused OOM errors.

## Solution Architecture

### 1. Scale-Indexed Visibility Cache
Added a visibility cache to object metadata that stores visibility state per zoom level:

```typescript
interface GeometricMetadata {
  // ... existing fields ...
  visibilityCache?: Map<number, {
    visibility: 'onscreen' | 'partially-onscreen' | 'offscreen';
    onScreenBounds?: BoundingBox;
  }>;
}
```

### 2. Visibility State Calculation
Created `GeometryHelper.calculateVisibilityState()` that:
- Determines if an object is onscreen, partially onscreen, or offscreen
- Calculates the screen-clipped bounds for partially visible objects
- Returns normalized bounds that prevent shader areas from exceeding screen dimensions

### 3. Automatic Cache Updates
Visibility cache is updated automatically when:
- **Zoom changes** (in `setPixeloidScale`)
- **Camera moves** (in `setVertexToPixeloidOffset`) 
- **Window resizes** (in `updateWindowSize`)
- **Objects are created** (all factory methods)
- **Objects are moved** (in `updateGeometricObject`)

### 4. Cache Cleanup
Old scale entries are cleaned up to prevent memory leaks:
- Keeps current scale ± 1 
- Removes all other cached entries

## Files Modified

### 1. `app/src/types/index.ts`
- Added `visibilityCache` to `GeometricMetadata` interface
- Added visibility state types

### 2. `app/src/game/GeometryHelper.ts`
- Added `calculateVisibilityState()` method
- Added screen bounds calculation and clipping logic
- Added `getObjectBoundsAtScale()` helper

### 3. `app/src/game/BoundingBoxRenderer.ts`
- Modified to use cached visibility state
- Renders clipped bounds for partially visible objects
- Shows full bounds for fully visible objects

### 4. `app/src/game/PixelateFilterRenderer.ts`
- Uses cached bounds from visibility state
- Respects screen-clipped bounds for filter areas

### 5. `app/src/game/MirrorLayerRenderer.ts`
- Uses visibility cache for texture extraction bounds
- Prevents extracting textures larger than screen

### 6. `app/src/store/gameStore.ts`
Modified all object creation and update methods:
- `createPoint`, `createLine`, `createCircle`, `createRectangle`, `createDiamond`
- `createPointWithAnchor`, `createLineWithAnchor`, `createCircleWithAnchor`, `createRectangleWithAnchor`, `createDiamondWithAnchor`
- `addGeometricObject`, `pasteObjectAtPosition`
- `updateGeometricObject`
- `setPixeloidScale`, `setVertexToPixeloidOffset`, `updateWindowSize`

## Key Implementation Details

### 1. Screen Clipping Algorithm
```typescript
// Calculate intersection of object bounds with screen
const clippedBounds = {
  minX: Math.max(bounds.minX, screenLeft),
  maxX: Math.min(bounds.maxX, screenRight),
  minY: Math.max(bounds.minY, screenTop),
  maxY: Math.min(bounds.maxY, screenBottom)
};
```

### 2. Cache Access Pattern
```typescript
// Get cached visibility for current scale
const cachedVisibility = obj.metadata?.visibilityCache?.get(pixeloidScale);
if (cachedVisibility?.visibility === 'partially-onscreen') {
  // Use clipped bounds
  const bounds = cachedVisibility.onScreenBounds;
}
```

### 3. Initialization Pattern
```typescript
// Initialize visibility cache on object creation
const visibilityInfo = GeometryHelper.calculateVisibilityState(obj, currentScale);
obj.metadata.visibilityCache = new Map();
obj.metadata.visibilityCache.set(currentScale, {
  visibility: visibilityInfo.visibility,
  onScreenBounds: visibilityInfo.onScreenBounds
});
```

## Benefits

1. **Memory Safety**: Shader areas and texture sizes are always constrained by screen dimensions
2. **Performance**: Visibility calculations are cached per scale, avoiding recalculation every frame
3. **Correctness**: Objects drawn offscreen at low zoom are properly handled when zoomed in
4. **Scalability**: System works correctly at any zoom level from 1x to 100x

## Testing Scenarios

1. **Draw at Scale 1, Zoom to 100**: Object bounds are clipped to screen, preventing OOM
2. **Draw Large Object**: Only visible portion is processed by shaders
3. **Pan Camera**: Visibility cache updates as objects move in/out of view
4. **Window Resize**: Cache invalidates and recalculates for new screen size

## Future Improvements

1. **Predictive Caching**: Pre-calculate visibility for adjacent scales during idle time
2. **Batch Updates**: Update multiple objects' visibility in a single pass
3. **Spatial Indexing**: Use quadtree for faster viewport culling of large object counts