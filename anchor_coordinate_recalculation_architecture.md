# ANCHOR COORDINATE RECALCULATION ARCHITECTURE

## 🎯 **THE REAL PROBLEM**

**Current System**:
- Objects store "baked-in" coordinates: `{x: 10, y: 15, width: 5, height: 3}`
- GeometryRenderer uses these coordinates directly (just applies offset conversion)
- Anchor overrides only affect future geometry creation

**The Gap**:
- Changing anchor override in ObjectEditPanel doesn't affect object's stored coordinates
- Object continues rendering with original coordinate system
- Visual appearance doesn't change despite anchor setting change

## 🔧 **SOLUTION ARCHITECTURE**

### **Phase 1: Coordinate Reverse Engineering**
When anchor override changes, we need to:

1. **Determine Current Visual Anchor** from stored coordinates
2. **Calculate New Coordinates** that place the same visual shape at the new anchor point
3. **Update Object's Stored Coordinates** to reflect new anchoring

### **Phase 2: Anchor Coordinate Calculations**

**For Rectangle**: `{x: 10, y: 15, width: 5, height: 3}`
```typescript
// Current: top-left anchored at (10, 15)
// Change to: center anchored → calculate new x,y so center is at (10, 15)

const currentAnchor = 'top-left'  // From object analysis
const newAnchor = 'center'        // From user selection
const anchorPoint = {x: 10, y: 15} // Current visual anchor location

// Calculate new coordinates
const newCoords = GeometryHelper.recalculateRectangleCoordinates(
  {x: 10, y: 15, width: 5, height: 3},
  currentAnchor,
  newAnchor,
  anchorPoint
)
// Result: {x: 7.5, y: 13.5, width: 5, height: 3} 
// Rectangle now appears center-anchored at (10, 15)
```

**For Circle**: `{centerX: 10, centerY: 15, radius: 3}`
```typescript
// Current: center anchored at (10, 15)  
// Change to: top-left anchored → calculate new center so top-left is at (10, 15)

const newCoords = GeometryHelper.recalculateCircleCoordinates(
  {centerX: 10, centerY: 15, radius: 3},
  'center',      // Current anchor
  'top-left',    // New anchor
  {x: 10, y: 15} // Anchor point location
)
// Result: {centerX: 13, centerY: 18, radius: 3}
// Circle now appears top-left anchored at (10, 15)
```

### **Phase 3: Anchor Point Extraction**

**Challenge**: Given stored coordinates, determine the current visual anchor point

```typescript
class GeometryHelper {
  static extractCurrentAnchorPoint(
    obj: GeometricObject, 
    currentAnchorType: PixeloidAnchorPoint
  ): PixeloidCoordinate {
    
    if ('x' in obj && 'width' in obj) {
      // Rectangle: calculate anchor point from current coordinates
      const rect = obj as GeometricRectangle
      switch (currentAnchorType) {
        case 'top-left': return {x: rect.x, y: rect.y}
        case 'center': return {x: rect.x + rect.width/2, y: rect.y + rect.height/2}
        case 'top-right': return {x: rect.x + rect.width, y: rect.y}
        // ... all 9 anchor points
      }
    }
    
    if ('centerX' in obj) {
      // Circle: calculate anchor point from center and radius
      const circle = obj as GeometricCircle
      switch (currentAnchorType) {
        case 'center': return {x: circle.centerX, y: circle.centerY}
        case 'top-left': return {x: circle.centerX - circle.radius, y: circle.centerY - circle.radius}
        // ... all 9 anchor points
      }
    }
  }
}
```

### **Phase 4: Coordinate Recalculation**

```typescript
class GeometryHelper {
  static recalculateObjectCoordinates(
    obj: GeometricObject,
    currentAnchor: PixeloidAnchorPoint,
    newAnchor: PixeloidAnchorPoint
  ): Partial<GeometricObject> {
    
    // Step 1: Extract current visual anchor point
    const anchorPoint = this.extractCurrentAnchorPoint(obj, currentAnchor)
    
    // Step 2: Calculate new coordinates for same visual anchor point
    if ('x' in obj && 'width' in obj) {
      return this.recalculateRectangleCoordinates(obj, currentAnchor, newAnchor, anchorPoint)
    }
    
    if ('centerX' in obj && 'radius' in obj) {
      return this.recalculateCircleCoordinates(obj, currentAnchor, newAnchor, anchorPoint)
    }
    
    // ... other geometry types
  }
  
  static recalculateRectangleCoordinates(
    rect: GeometricRectangle,
    currentAnchor: PixeloidAnchorPoint,
    newAnchor: PixeloidAnchorPoint,
    anchorPoint: PixeloidCoordinate
  ): {x: number, y: number} {
    
    // Calculate new top-left position based on where new anchor should be
    let newX: number, newY: number
    
    switch (newAnchor) {
      case 'top-left':
        newX = anchorPoint.x
        newY = anchorPoint.y
        break
      case 'center':
        newX = anchorPoint.x - rect.width / 2
        newY = anchorPoint.y - rect.height / 2
        break
      case 'top-right':
        newX = anchorPoint.x - rect.width
        newY = anchorPoint.y
        break
      // ... all 9 anchor points
    }
    
    return {x: newX, y: newY}
  }
}
```

## 🔄 **INTEGRATION FLOW**

### **ObjectEditPanel Integration**:
```typescript
// When user changes anchor override
const selectedObjectId = gameStore.geometry.selection.selectedObjectId
const selectedObject = gameStore.geometry.objects.find(obj => obj.id === selectedObjectId)

// Get current anchor (from override or default)
const currentAnchor = updateGameStore.getObjectAnchor(selectedObjectId) 
  ?? updateGameStore.getDefaultAnchor(objectType)

// Calculate new coordinates  
const newCoordinates = GeometryHelper.recalculateObjectCoordinates(
  selectedObject,
  currentAnchor.firstPointAnchor,  // Old anchor
  newAnchor                        // New anchor from UI
)

// Update object coordinates AND anchor override
updateGameStore.updateGeometricObject(selectedObjectId, newCoordinates)
updateGameStore.setObjectAnchor(selectedObjectId, {
  firstPointAnchor: newAnchor,
  secondPointAnchor: newAnchor
})
```

## ✅ **EXPECTED RESULT**

1. **User selects object** → ObjectEditPanel shows current anchor
2. **User changes anchor** → Object coordinates recalculated instantly  
3. **Visual appearance unchanged** → Same shape, same position, different anchor point
4. **Future edits** → Use new anchor point for positioning calculations

**The object maintains visual continuity while changing its internal coordinate anchoring system!**