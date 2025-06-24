# Pixeloid-Perfect Bounding Box Plan (Revised)

## Updated Understanding
- Lines are defined by their endpoints only - thickness doesn't affect bbox
- If you want a thick line, that's a different shape (rectangle)
- This keeps the geometric definition pure

## Fixes Required

### 1. Point Bbox Fix ✅ NEEDED
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

### 2. Line Bbox ✅ KEEP AS-IS
Lines are correctly defined by their endpoints only:
```typescript
// Current implementation is CORRECT - no changes needed
bounds: {
  minX: Math.min(line.startX, line.endX),
  maxX: Math.max(line.startX, line.endX),
  minY: Math.min(line.startY, line.endY),
  maxY: Math.max(line.startY, line.endY)
}
```

### 3. Circle Bbox Fix ✅ NEEDED
Make circles pixeloid-perfect like diamonds:
```typescript
static calculateCircleMetadata(circle: { 
  centerX: number; 
  centerY: number; 
  radius: number;
}): GeometricMetadata {
  return {
    center: { __brand: 'pixeloid', x: circle.centerX, y: circle.centerY },
    bounds: {
      minX: Math.floor(circle.centerX - circle.radius),
      maxX: Math.ceil(circle.centerX + circle.radius),
      minY: Math.floor(circle.centerY - circle.radius),
      maxY: Math.ceil(circle.centerY + circle.radius)
    }
  }
}
```

### 4. Rectangle Bbox ✅ KEEP AS-IS
Already correct - uses exact x, y, width, height

### 5. Diamond Bbox ✅ KEEP AS-IS
Already pixeloid-perfect with Math.floor/ceil

## Summary of Changes
1. **Points**: Fix to have 1x1 pixeloid bbox
2. **Lines**: No change - correct as-is
3. **Circles**: Add Math.floor/ceil for pixeloid alignment
4. **Rectangles**: No change - correct as-is
5. **Diamonds**: No change - already pixeloid-perfect

## Then Fix Pixelate Filter
Use individual containers with filterArea to prevent pixel bleeding