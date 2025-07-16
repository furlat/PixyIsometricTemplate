# Coordinate Conversion Fix Plan

## Root Cause Analysis

The bug is in `GeometryHelper.calculateVisibilityState()` where screen coordinates are incorrectly converted back to pixeloid coordinates. The current code:

```typescript
const onScreenBounds = {
  minX: Math.floor(intersection.left / pixeloidScale) + offset.x,
  maxX: Math.ceil(intersection.right / pixeloidScale) + offset.x,
  minY: Math.floor(intersection.top / pixeloidScale) + offset.y,
  maxY: Math.ceil(intersection.bottom / pixeloidScale) + offset.y,
```

This is wrong because it's dividing screen coordinates by scale and then adding offset, but screen coordinates need to be converted to vertex coordinates first, THEN offset added.

## Correct Conversion Flow

1. **Pixeloid → Vertex**: pixeloid - offset
2. **Vertex → Screen**: vertex * scale
3. **Screen → Vertex**: screen / scale
4. **Vertex → Pixeloid**: vertex + offset

The current code skips the vertex coordinate system in the reverse conversion.

## The Fix

The onScreenBounds calculation should be:

```typescript
// Convert screen intersection to vertex coordinates first
const vertexBounds = {
  minX: intersection.left / pixeloidScale,
  maxX: intersection.right / pixeloidScale,
  minY: intersection.top / pixeloidScale,
  maxY: intersection.bottom / pixeloidScale
}

// Then convert vertex to pixeloid with proper rounding
const onScreenBounds = {
  minX: Math.floor(vertexBounds.minX + offset.x),
  maxX: Math.ceil(vertexBounds.maxX + offset.x),
  minY: Math.floor(vertexBounds.minY + offset.y),
  maxY: Math.ceil(vertexBounds.maxY + offset.y)
}
```

But wait! This is still wrong. The offset should NOT be added here because the bounds are already in pixeloid space. The issue is in the initial conversion to screen coordinates.

## Actual Fix

The problem is earlier in the function. The screen bounds calculation should properly account for the coordinate system:

```typescript
// Object bounds are already in pixeloid coordinates
// To get screen bounds, we need: (pixeloid - offset) * scale
const vertexBounds = {
  minX: bounds.minX - offset.x,
  maxX: bounds.maxX - offset.x,
  minY: bounds.minY - offset.y,
  maxY: bounds.maxY - offset.y
}

const screenBounds = {
  left: vertexBounds.minX * pixeloidScale,
  top: vertexBounds.minY * pixeloidScale,
  right: vertexBounds.maxX * pixeloidScale,
  bottom: vertexBounds.maxY * pixeloidScale
}

// After intersection, convert back properly
const screenIntersection = {
  left: Math.max(0, screenBounds.left),
  top: Math.max(0, screenBounds.top),
  right: Math.min(screenWidth, screenBounds.right),
  bottom: Math.min(screenHeight, screenBounds.bottom)
}

// Convert screen intersection back to pixeloid
const onScreenBounds = {
  minX: Math.floor(screenIntersection.left / pixeloidScale + offset.x),
  maxX: Math.ceil(screenIntersection.right / pixeloidScale + offset.x),
  minY: Math.floor(screenIntersection.top / pixeloidScale + offset.y),
  maxY: Math.ceil(screenIntersection.bottom / pixeloidScale + offset.y)
}
```

## Impact

This fix will:
1. Correct the onScreenBounds calculation
2. Make BoundingBoxRenderer show accurate bounds
3. Fix MirrorLayerRenderer texture extraction
4. Eliminate the OOM bug when zooming from 1x to 100x
5. Fix the aliased/incorrect rendering