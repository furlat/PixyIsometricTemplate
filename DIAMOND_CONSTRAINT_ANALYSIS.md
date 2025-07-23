# 🔍 **DIAMOND DRAWING CONSTRAINT ANALYSIS**

## ❌ **CURRENT WRONG IMPLEMENTATION**

**GeometryHelper.calculateDrawingProperties:**
```typescript
case 'diamond':
  const diamondCenter = {
    x: (startPoint.x + endPoint.x) / 2,  // ❌ WRONG - treating as corners
    y: (startPoint.y + endPoint.y) / 2   // ❌ WRONG - treating as corners  
  }
```

**UnifiedGeometryGenerator.generateDiamondFormData:**
```typescript
const centerX = (start.x + end.x) / 2     // ❌ WRONG - treating as corners
const centerY = (start.y + end.y) / 2     // ❌ WRONG - treating as corners
const width = Math.abs(end.x - start.x)   // ❌ WRONG - using both x coordinates
const height = Math.abs(end.y - start.y)  // ❌ WRONG - using both y coordinates
```

## ✅ **CORRECT DIAMOND CONSTRAINT**

**Drawing Flow:**
1. **Start Point** = West vertex (x₁, y₁) - FIXES both x and y
2. **Drag Point** = Only x₂ matters for East vertex position  
3. **East Vertex** = (x₂, y₁) - SAME Y as west vertex
4. **Width** = x₂ - x₁
5. **Height** = Calculated from width (isometric ratio?)

**Vertices:**
- West: (x₁, y₁) - from start point
- East: (x₂, y₁) - x from end point, y from start point  
- North: (center_x, y₁ - height/2)
- South: (center_x, y₁ + height/2)
- Center: ((x₁ + x₂)/2, y₁)

## 🔧 **FIXES NEEDED**

1. **GeometryHelper.calculateDrawingProperties** - Fix diamond case
2. **UnifiedGeometryGenerator.generateDiamondFormData** - Fix diamond case
3. Both should respect the vertex constraint properly