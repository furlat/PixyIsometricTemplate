# Phase 3B ObjectEditPanel Implementation Guide

## 🎯 **Current Status**

The provided `ObjectEditPanel_3b.ts` is actually the **813-line backup version** that needs to be ported to Phase 3B architecture. Here's the exact implementation guide to convert it.

## 🔄 **Required Changes**

### **1. Update Imports (Lines 1-4)**

```typescript
// ❌ OLD (Lines 1-4)
import { subscribe } from 'valtio'
import { gameStore, updateGameStore } from '../store/gameStore'
import { GeometryVertexCalculator } from '../game/GeometryVertexCalculator'
import type { GeometricObject, GeometricDiamond, GeometricRectangle, GeometricCircle, GeometricLine, GeometricPoint, PixeloidAnchorPoint, PixeloidCoordinate } from '../types'

// ✅ NEW (Phase 3B)
import { subscribe } from 'valtio'
import { gameStore_3b, gameStore_3b_methods } from '../store/gameStore_3b'
import type { GeometryObject } from '../types/geometry-drawing'
```

### **2. Update Class Name and Dependencies (Lines 6-16)**

```typescript
// ❌ OLD
export class ObjectEditPanel {
  private elements: Map<string, HTMLElement> = new Map()
  private originalAnchorOverride: any = null // Remove anchor system

// ✅ NEW
export class ObjectEditPanel_3b {
  // Remove elements Map (not needed)
  // Remove originalAnchorOverride (complex anchor system removed)
```

### **3. Update Store Subscriptions (Lines 18-22)**

```typescript
// ❌ OLD
subscribe(gameStore.geometry.selection, () => {
  this.updateVisibility()
})

// ✅ NEW
subscribe(gameStore_3b.selection, () => {
  this.updateVisibility()
})
```

### **4. Update Visibility Logic (Lines 24-37)**

```typescript
// ❌ OLD
const shouldBeVisible = gameStore.geometry.selection.isEditPanelOpen

// ✅ NEW  
const shouldBeVisible = gameStore_3b.selection.isEditPanelOpen
```

### **5. Update Object Loading (Lines 39-54)**

```typescript
// ❌ OLD
const selectedObjectId = gameStore.geometry.selection.selectedObjectId
const selectedObject = gameStore.geometry.objects.find(obj => obj.id === selectedObjectId)
this.originalAnchorOverride = updateGameStore.getObjectAnchor(selectedObjectId)

// ✅ NEW
const selectedObjectId = gameStore_3b.selection.selectedObjectId
const selectedObject = gameStore_3b.geometry.objects.find(obj => obj.id === selectedObjectId)
// Remove anchor override logic
```

### **6. Simplify Object Type Detection (Lines 98-105)**

```typescript
// ❌ OLD (Complex legacy type detection)
private getObjectType(obj: GeometricObject): string {
  if ('anchorX' in obj) return 'Diamond'
  if ('width' in obj && 'height' in obj) return 'Rectangle'
  if ('centerX' in obj && 'radius' in obj) return 'Circle'
  if ('startX' in obj && 'endX' in obj) return 'Line'
  if ('x' in obj && 'y' in obj) return 'Point'
  return 'Object'
}

// ✅ NEW (Simple Phase 3B)
private getObjectType(obj: GeometryObject): string {
  return obj.type.charAt(0).toUpperCase() + obj.type.slice(1)
}
```

### **7. Remove Complex Anchor System (Lines 116-117, 326-380)**

```typescript
// ❌ REMOVE ENTIRELY (Lines 116-117)
// Anchor Configuration
html += this.generateAnchorControls(obj)

// ❌ REMOVE ENTIRE METHOD (Lines 326-380)
private generateAnchorControls(obj: GeometricObject): string {
  // Remove this entire complex method
}
```

### **8. Simplify Property Generation (Lines 113-321)**

```typescript
// ❌ OLD (Complex legacy object property detection)
// Type-specific properties
if ('anchorX' in obj && 'anchorY' in obj) {
  // Diamond
} else if ('width' in obj && 'height' in obj) {
  // Rectangle
} // ... etc

// ✅ NEW (Simple Phase 3B using obj.type)
switch (obj.type) {
  case 'point':
    return this.generatePointForm(obj)
  case 'line':
    return this.generateLineForm(obj)
  case 'circle':
    return this.generateCircleForm(obj)
  case 'rectangle':
    return this.generateRectangleForm(obj)
  case 'diamond':
    return this.generateDiamondForm(obj)
  default:
    return ''
}
```

### **9. Update Style Properties (Lines 163-194)**

```typescript
// ❌ OLD
if (this.objectSupportsFill(obj)) {
  const fillObj = obj as GeometricCircle | GeometricRectangle | GeometricDiamond
  if (fillObj.fillColor !== undefined) {

// ✅ NEW (Use Phase 3B style system)
const style = obj.style || gameStore_3b.styles.defaultStyle
if (this.objectSupportsFill(obj.type)) {
  if (style.fillColor !== undefined) {
```

### **10. Update Store Method Calls**

```typescript
// ❌ OLD
updateGameStore.updateGeometricObject(selectedObjectId, {
updateGameStore.setEditPanelOpen(false)

// ✅ NEW
gameStore_3b_methods.updateGeometryObject(selectedObjectId, {
gameStore_3b_methods.closeEditPanel()
```

### **11. Remove Complex Anchor Handling (Lines 447-470, 684-722)**

```typescript
// ❌ REMOVE ENTIRELY
// Handle anchor point changes
const anchorSelect = this.panel.querySelector('#edit-anchor-point')
// ... remove entire anchor handling logic

// ❌ REMOVE ENTIRE METHOD (Lines 684-722)
private handleAnchorChange(objectId: string, newAnchor: PixeloidAnchorPoint): void {
  // Remove this complex anchor recalculation
}

// ❌ REMOVE ENTIRE METHOD (Lines 724-782)  
private extractGeometryPoints(obj: GeometricObject): {
  // Remove complex geometry point extraction
}
```

### **12. Simplify Property Updates (Lines 485-653)**

```typescript
// ❌ OLD (Complex property building with legacy types)
const updates: Partial<GeometricObject> = {}
// Complex type checking and updates

// ✅ NEW (Simple property updates using Phase 3B system)
const updates: Partial<GeometryObject> = {}

// Position updates using our helper methods
const currentBounds = gameStore_3b_methods.getObjectBounds(this.originalObject)
const currentCenter = gameStore_3b_methods.getShapeVisualAnchor(this.originalObject)

// Simple center + size → vertices conversion
if (centerChanged || sizeChanged) {
  updates.vertices = this.calculateNewVertices(newCenter, newSize, obj.type)
}
```

### **13. Update Fill/Style Management**

```typescript
// ❌ OLD
fillColor: gameStore.geometry.drawing.settings.defaultFillColor,
fillAlpha: gameStore.geometry.drawing.settings.fillAlpha

// ✅ NEW  
fillColor: gameStore_3b.drawing.settings.defaultFillColor,
fillAlpha: gameStore_3b.drawing.settings.fillAlpha
```

### **14. Simplify Cancel/Restore Logic (Lines 784-808)**

```typescript
// ❌ OLD
// Restore original anchor override state
if (this.originalAnchorOverride) {
  updateGameStore.setObjectAnchor(selectedObjectId, this.originalAnchorOverride)
} else {
  updateGameStore.clearObjectAnchor(selectedObjectId)
}

// ✅ NEW (Simple restore)
if (this.originalObject && selectedObjectId) {
  gameStore_3b_methods.updateGeometryObject(selectedObjectId, this.originalObject)
}
```

## 🏗️ **New Simple Form Generation Methods**

Instead of the complex legacy approach, create simple form generators:

```typescript
private generatePointForm(obj: GeometryObject): string {
  const center = gameStore_3b_methods.getShapeVisualAnchor(obj)
  return `
    <div class="flex justify-between items-center text-xs">
      <span>Center X:</span>
      <input id="edit-center-x" type="number" value="${center.x}" />
    </div>
    <div class="flex justify-between items-center text-xs">
      <span>Center Y:</span>
      <input id="edit-center-y" type="number" value="${center.y}" />
    </div>
  `
}

private generateCircleForm(obj: GeometryObject): string {
  const center = gameStore_3b_methods.getShapeVisualAnchor(obj)
  const bounds = gameStore_3b_methods.getObjectBounds(obj)
  const radius = Math.round(bounds.width / 2)
  
  return `
    <div class="flex justify-between items-center text-xs">
      <span>Center X:</span>
      <input id="edit-center-x" type="number" value="${center.x}" />
    </div>
    <div class="flex justify-between items-center text-xs">
      <span>Center Y:</span>
      <input id="edit-center-y" type="number" value="${center.y}" />
    </div>
    <div class="flex justify-between items-center text-xs">
      <span>Radius:</span>
      <input id="edit-radius" type="number" value="${radius}" />
    </div>
  `
}

// Similar methods for rectangle, diamond, line...
```

## 🎨 **Simple Vertex Calculation**

Replace complex GeometryVertexCalculator with simple math:

```typescript
private calculateNewVertices(center: PixeloidCoordinate, size: any, type: string): { x: number, y: number }[] {
  switch (type) {
    case 'point':
      return [{ x: center.x, y: center.y }]
      
    case 'circle':
      // Generate 8-point circle
      const vertices: { x: number, y: number }[] = []
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI * 2) / 8
        vertices.push({
          x: center.x + Math.cos(angle) * size.radius,
          y: center.y + Math.sin(angle) * size.radius
        })
      }
      return vertices
      
    case 'rectangle':
      const halfW = size.width / 2
      const halfH = size.height / 2
      return [
        { x: center.x - halfW, y: center.y - halfH }, // top-left
        { x: center.x + halfW, y: center.y - halfH }, // top-right  
        { x: center.x + halfW, y: center.y + halfH }, // bottom-right
        { x: center.x - halfW, y: center.y + halfH }  // bottom-left
      ]
      
    // Similar for diamond, line...
  }
}
```

## 📝 **Implementation Checklist**

### **Phase 1: Basic Port (30 minutes)**
- [ ] Update imports to Phase 3B
- [ ] Update class name to ObjectEditPanel_3b  
- [ ] Update store subscriptions
- [ ] Remove anchor system references
- [ ] Update basic store method calls

### **Phase 2: Simplify Forms (45 minutes)**
- [ ] Replace complex object type detection
- [ ] Create simple form generation methods
- [ ] Remove complex property building
- [ ] Add simple vertex calculation

### **Phase 3: Style Integration (30 minutes)**  
- [ ] Update style property handling
- [ ] Integrate with Phase 3B style system
- [ ] Update fill/stroke management

### **Phase 4: Testing (15 minutes)**
- [ ] Test with each object type
- [ ] Verify live preview works
- [ ] Test apply/cancel functionality

## 🎯 **Result**

**Before**: 813 lines with complex calculations
**After**: ~300 lines with simple Phase 3B integration

The ported version will be:
- ✅ Fully integrated with Phase 3B store
- ✅ Using simple center + size editing
- ✅ No complex vertex calculations
- ✅ Clean, maintainable code
- ✅ All essential functionality preserved

This approach maintains all the core editing functionality while eliminating the complexity that's not needed for Phase 3B's precise pixel architecture.