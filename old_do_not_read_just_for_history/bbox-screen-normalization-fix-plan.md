# Bounding Box Screen Normalization Fix Plan

## Problem Analysis

From the screenshot and code review, the BoundingBoxRenderer has several issues:

1. **Not using scale-indexed visibility cache** - Still relying on basic viewport intersection check
2. **Using full bounds instead of screen-normalized bounds** - When objects are partially visible, showing full bounds instead of clipped bounds
3. **Coordinate conversion issues** - Double conversion leading to misalignment
4. **No reactive updates** - When objects move in/out of screen with WASD or zoom, bboxes don't update properly

The key issue is that when an object starts off-screen and then comes into view (especially during zoom), its bounding box shows the full object bounds rather than the properly clipped screen bounds.

## Solution Plan

### 1. Update BoundingBoxRenderer to use scale-indexed visibility cache

```typescript
// Instead of basic viewport check, use visibility cache
const visibleObjects = gameStore.geometry.objects.filter(obj => {
  if (!obj.isVisible || !obj.metadata) return false
  
  const visibilityData = obj.metadata.visibilityCache?.get(pixeloidScale)
  if (!visibilityData) {
    // Calculate and cache if not present
    const visibilityInfo = GeometryHelper.calculateVisibilityState(obj, pixeloidScale)
    obj.metadata.visibilityCache.set(pixeloidScale, visibilityInfo)
    return visibilityInfo.visibility !== 'offscreen'
  }
  
  return visibilityData.visibility !== 'offscreen'
})
```

### 2. Use onScreenBounds for partially visible objects

```typescript
// In renderBoundingBoxRectangle:
const visibilityData = obj.metadata.visibilityCache?.get(pixeloidScale)
const isPartiallyVisible = visibilityData?.visibility === 'partially-onscreen'

// Use screen-normalized bounds for partially visible objects
const boundsToRender = isPartiallyVisible && visibilityData.onScreenBounds
  ? visibilityData.onScreenBounds
  : obj.metadata.bounds
```

### 3. Fix coordinate conversion

- Remove double offset application
- Use the same coordinate system as GeometryRenderer
- Ensure bbox aligns perfectly with actual geometry

### 4. Ensure reactive updates

- Bbox renderer should automatically use the latest visibility state
- When objects move in/out of screen, the visibility cache is updated by the store
- Bbox renderer will pick up these changes on next render

## Implementation Steps

1. Import GeometryHelper for visibility calculations
2. Update the render method to use scale-indexed visibility cache
3. Modify renderBoundingBoxRectangle to use screen-normalized bounds
4. Remove redundant coordinate conversions
5. Test with objects starting off-screen and zooming in
6. Test with WASD movement bringing objects in/out of view

## Expected Outcome

- Bounding boxes should perfectly align with geometry at all zoom levels
- Partially visible objects should show clipped bounding boxes
- Objects that start off-screen should have correct bboxes when they come into view
- WASD movement should properly update bboxes as objects move in/out of screen