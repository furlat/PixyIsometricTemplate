# Geometry Stroke Width and Selection Fix Plan

## Issue 1: Stroke Width Scaling

Since we moved geometry out of camera transform, strokes are no longer scaled automatically. We need to multiply stroke width by pixeloidScale to maintain pixeloid-based sizing.

### Fix in GeometryRenderer:

For all stroke calls, change from:
```typescript
width: rect.strokeWidth || gameStore.geometry.drawing.settings.defaultStrokeWidth
```

To:
```typescript
width: (rect.strokeWidth || gameStore.geometry.drawing.settings.defaultStrokeWidth) * pixeloidScale
```

This makes stroke width scale with zoom:
- strokeWidth 1 = 1 pixel at scale 1
- strokeWidth 1 = 10 pixels at scale 10

## Issue 2: Selection Highlight Not Working

The SelectionFilterRenderer is still drawing at vertex coordinates while the geometry is now at screen coordinates. They need to match.

### Fix in SelectionFilterRenderer:

1. Import `CoordinateCalculations`
2. Update all render methods to accept `pixeloidScale` parameter
3. Convert vertex coordinates to screen coordinates just like GeometryRenderer
4. Update stroke widths to scale with zoom

### Specific Changes:

1. `createGraphicsForObject()` - Pass pixeloidScale to all render methods
2. `renderRectangleToGraphics()` - Convert to screen coords and multiply stroke by scale
3. `renderCircleToGraphics()` - Convert to screen coords and multiply stroke by scale  
4. `renderLineToGraphics()` - Convert to screen coords and multiply stroke by scale
5. `renderPointToGraphics()` - Already has pixeloidScale, but fix to use constant radius
6. `renderDiamondToGraphics()` - Convert to screen coords and multiply stroke by scale

## Issue 3: BoundingBox Layer Not Working

The BoundingBoxRenderer is also still drawing at vertex coordinates while geometry is at screen coordinates.

### Fix in BoundingBoxRenderer:

1. Import `CoordinateCalculations`
2. Update `renderBoundingBoxRectangle()` to convert vertex to screen coordinates
3. Fix stroke width to scale properly

### Specific Changes:

1. After calculating x, y, width, height from bounds, convert to screen:
```typescript
const screenPos = CoordinateCalculations.vertexToScreen(
  { __brand: 'vertex' as const, x, y },
  pixeloidScale
)
const screenWidth = width * pixeloidScale
const screenHeight = height * pixeloidScale
```

2. Update stroke width calculation:
```typescript
const strokeWidth = 2 * pixeloidScale  // 2 pixeloids thick
```

## Summary

All three issues stem from moving geometry out of camera transform:
- Strokes need to be multiplied by pixeloidScale (maintain pixeloid-based sizing)
- Selection needs to draw at same coordinate system as geometry (screen coords)
- BoundingBox needs to draw at same coordinate system as geometry (screen coords)

The key insight: strokeWidth is in PIXELOID units, not screen pixels!