# CORRECT ANCHOR OVERRIDE APPROACH

## 🎯 **THE RIGHT WAY**

Instead of reimplementing coordinate calculations, **reuse the existing vertex calculation pipeline**:

1. **Reverse engineer** original click positions from stored object coordinates
2. **Recalculate vertices** using `GeometryVertexCalculator.calculateGeometryVertices()` with NEW anchor config
3. **Extract properties** using `GeometryVertexCalculator.extractGeometryProperties()` to get updated coordinates
4. **Update object** with new coordinates

## 🔧 **IMPLEMENTATION**

```typescript
// ObjectEditPanel anchor change handler
private handleAnchorChange(objectId: string, newAnchor: PixeloidAnchorPoint): void {
  const selectedObject = gameStore.geometry.objects.find(obj => obj.id === objectId)
  
  // Step 1: Reverse engineer original click positions
  const originalPositions = this.extractOriginalClickPositions(selectedObject)
  
  // Step 2: Get new anchor config
  const newAnchorConfig = {
    firstPointAnchor: newAnchor,
    secondPointAnchor: newAnchor
  }
  
  // Step 3: Recalculate vertices using EXISTING functions
  const newVertices = GeometryVertexCalculator.calculateGeometryVertices(
    originalPositions.firstPos,
    originalPositions.secondPos,
    objectType,
    newAnchorConfig
  )
  
  // Step 4: Extract properties using EXISTING functions
  const newProperties = GeometryVertexCalculator.extractGeometryProperties(
    newVertices,
    objectType
  )
  
  // Step 5: Update object + anchor override
  updateGameStore.updateGeometricObject(objectId, newProperties)
  updateGameStore.setObjectAnchor(objectId, newAnchorConfig)
}
```

## 🔍 **REVERSE ENGINEERING CLICK POSITIONS**

For each geometry type, figure out what `firstPos` and `secondPos` would have created the current coordinates:

```typescript
private extractOriginalClickPositions(obj: GeometricObject): {
  firstPos: PixeloidCoordinate,
  secondPos: PixeloidCoordinate
} {
  
  if ('x' in obj && 'width' in obj) {
    // Rectangle: first=top-left, second=bottom-right
    return {
      firstPos: { __brand: 'pixeloid', x: obj.x, y: obj.y },
      secondPos: { __brand: 'pixeloid', x: obj.x + obj.width, y: obj.y + obj.height }
    }
  }
  
  if ('centerX' in obj && 'radius' in obj) {
    // Circle: first=west, second=east  
    return {
      firstPos: { __brand: 'pixeloid', x: obj.centerX - obj.radius, y: obj.centerY },
      secondPos: { __brand: 'pixeloid', x: obj.centerX + obj.radius, y: obj.centerY }
    }
  }
  
  if ('anchorX' in obj) {
    // Diamond: first=west vertex, second=east vertex
    return {
      firstPos: { __brand: 'pixeloid', x: obj.anchorX, y: obj.anchorY },
      secondPos: { __brand: 'pixeloid', x: obj.anchorX + obj.width, y: obj.anchorY }
    }
  }
  
  // ... etc for other types
}
```

## ✅ **BENEFITS**

1. **Reuses existing logic** - no reimplementation
2. **Guarantees consistency** - same vertex calculations as creation
3. **Handles all geometry types** - leverages existing type-specific logic
4. **Much simpler** - no complex coordinate math
5. **Less error-prone** - uses proven, tested functions

**This approach treats anchor changes as "re-creating the object with different anchor settings" which is exactly what we want!**