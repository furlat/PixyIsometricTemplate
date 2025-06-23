# SIMPLE ANCHOR OVERRIDE SOLUTION

## 🎯 **THE SIMPLEST APPROACH**

Extract current geometry's defining points → Recalculate with new anchor config → Update object

```typescript
private handleAnchorChange(objectId: string, newAnchor: PixeloidAnchorPoint): void {
  const selectedObject = gameStore.geometry.objects.find(obj => obj.id === objectId)
  
  // Step 1: Extract current geometry defining points
  const geometryPoints = this.extractGeometryPoints(selectedObject)
  
  // Step 2: Recalculate with new anchor config
  const newAnchorConfig = {
    firstPointAnchor: newAnchor,
    secondPointAnchor: newAnchor
  }
  
  const newVertices = GeometryVertexCalculator.calculateGeometryVertices(
    geometryPoints.firstPos,
    geometryPoints.secondPos,
    objectType,
    newAnchorConfig
  )
  
  // Step 3: Extract properties and update
  const newProperties = GeometryVertexCalculator.extractGeometryProperties(newVertices, objectType)
  updateGameStore.updateGeometricObject(objectId, newProperties)
  updateGameStore.setObjectAnchor(objectId, newAnchorConfig)
}
```

## 🔍 **EXTRACT GEOMETRY POINTS**

Simple extraction from stored coordinates:

```typescript
private extractGeometryPoints(obj: GeometricObject): {
  firstPos: PixeloidCoordinate,
  secondPos: PixeloidCoordinate
} {
  
  if ('x' in obj && 'width' in obj) {
    // Rectangle: use top-left + bottom-right
    return {
      firstPos: { __brand: 'pixeloid', x: obj.x, y: obj.y },
      secondPos: { __brand: 'pixeloid', x: obj.x + obj.width, y: obj.y + obj.height }
    }
  }
  
  if ('centerX' in obj && 'radius' in obj) {
    // Circle: use west + east points
    return {
      firstPos: { __brand: 'pixeloid', x: obj.centerX - obj.radius, y: obj.centerY },
      secondPos: { __brand: 'pixeloid', x: obj.centerX + obj.radius, y: obj.centerY }
    }
  }
  
  if ('anchorX' in obj) {
    // Diamond: use west + east vertices
    return {
      firstPos: { __brand: 'pixeloid', x: obj.anchorX, y: obj.anchorY },
      secondPos: { __brand: 'pixeloid', x: obj.anchorX + obj.width, y: obj.anchorY }
    }
  }
  
  if ('startX' in obj && 'endX' in obj) {
    // Line: use start + end
    return {
      firstPos: { __brand: 'pixeloid', x: obj.startX, y: obj.startY },
      secondPos: { __brand: 'pixeloid', x: obj.endX, y: obj.endY }
    }
  }
  
  if ('x' in obj && 'y' in obj) {
    // Point: same position for both
    return {
      firstPos: { __brand: 'pixeloid', x: obj.x, y: obj.y },
      secondPos: { __brand: 'pixeloid', x: obj.x, y: obj.y }
    }
  }
  
  // Fallback
  return {
    firstPos: { __brand: 'pixeloid', x: 0, y: 0 },
    secondPos: { __brand: 'pixeloid', x: 0, y: 0 }
  }
}
```

**That's it! No complex math, just reuse existing vertex calculation pipeline with different anchor settings.**