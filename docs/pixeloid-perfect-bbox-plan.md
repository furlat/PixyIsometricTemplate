# Pixeloid-Perfect Bounding Box Plan

## Current Issues

### 1. Points Have Zero-Size Bbox
```typescript
// Current (WRONG)
bounds: {
  minX: point.x,
  maxX: point.x,  // Same as minX = 0 width!
  minY: point.y,
  maxY: point.y   // Same as minY = 0 height!
}
```

### 2. Lines Don't Account for Thickness
```typescript
// Current
bounds: {
  minX: Math.min(line.startX, line.endX),
  maxX: Math.max(line.startX, line.endX),
  // No consideration for strokeWidth
}
```

### 3. Circles Not Pixeloid-Perfect
```typescript
// Current
bounds: {
  minX: circle.centerX - circle.radius,  // Could be fractional
  maxX: circle.centerX + circle.radius,  // Could be fractional
}
```

### 4. Diamonds Are Correct ✅
```typescript
// Already pixeloid-perfect
bounds: {
  minX: diamond.anchorX,
  maxX: diamond.anchorX + diamond.width,
  minY: Math.floor(diamond.anchorY - diamond.height), // ✅
  maxY: Math.ceil(diamond.anchorY + diamond.height)   // ✅
}
```

## Fixes Required

### 1. Point Bbox Fix
Points should occupy at least 1 pixeloid:
```typescript
static calculatePointMetadata(point: { x: number; y: number }): GeometricMetadata {
  // Ensure point occupies the pixeloid it's in
  const pixeloidX = Math.floor(point.x)
  const pixeloidY = Math.floor(point.y)
  
  return {
    center: { __brand: 'pixeloid', x: point.x, y: point.y },
    bounds: {
      minX: pixeloidX,
      maxX: pixeloidX + 1,  // Full pixeloid width
      minY: pixeloidY,
      maxY: pixeloidY + 1   // Full pixeloid height
    }
  }
}
```

### 2. Line Bbox Fix
Lines need to account for stroke width:
```typescript
static calculateLineMetadata(line: { 
  startX: number; 
  startY: number; 
  endX: number; 
  endY: number;
  strokeWidth?: number;
}): GeometricMetadata {
  const strokeRadius = (line.strokeWidth || 1) / 2
  
  return {
    center: { __brand: 'pixeloid', x: centerX, y: centerY },
    bounds: {
      minX: Math.floor(Math.min(line.startX, line.endX) - strokeRadius),
      maxX: Math.ceil(Math.max(line.startX, line.endX) + strokeRadius),
      minY: Math.floor(Math.min(line.startY, line.endY) - strokeRadius),
      maxY: Math.ceil(Math.max(line.startY, line.endY) + strokeRadius)
    }
  }
}
```

### 3. Circle Bbox Fix
Make circles pixeloid-perfect like diamonds:
```typescript
static calculateCircleMetadata(circle: { 
  centerX: number; 
  centerY: number; 
  radius: number;
  strokeWidth?: number;
}): GeometricMetadata {
  // Include stroke in radius
  const totalRadius = circle.radius + (circle.strokeWidth || 1) / 2
  
  return {
    center: { __brand: 'pixeloid', x: circle.centerX, y: circle.centerY },
    bounds: {
      minX: Math.floor(circle.centerX - totalRadius),
      maxX: Math.ceil(circle.centerX + totalRadius),
      minY: Math.floor(circle.centerY - totalRadius),
      maxY: Math.ceil(circle.centerY + totalRadius)
    }
  }
}
```

## Benefits
1. ✅ All objects will have visible bboxes
2. ✅ Mirror layer can extract textures for all shapes
3. ✅ Pixelate filter works on all shapes
4. ✅ Consistent pixeloid-perfect alignment
5. ✅ Proper stroke width consideration

## Implementation Order
1. Fix GeometryHelper methods
2. Update type definitions if needed (add strokeWidth to metadata params)
3. Test with mirror layer enabled
4. Verify pixelate filter works on all shapes