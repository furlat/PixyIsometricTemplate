# 🔍 **DRAG & DROP MOVEMENT INVESTIGATION**

## 🎯 **EXPECTED BEHAVIOR**

1. **Click on selected object** → Save click location + vertex offsets
2. **Mouse moves** → Calculate new position from click offset
3. **Preview mode** → Show object at new location, hide original
4. **Mouse up** → Commit final position to store

## 🚨 **CURRENT PROBLEM**

✅ **Selection works** (object gets selected)
❌ **Drag movement doesn't work** (object doesn't follow mouse)

## 🔍 **ROOT CAUSE IDENTIFIED**

### ❌ **MISSING DRAG INITIATION**
- **InputManager.handleMouseDown()** only handles:
  - ✅ Selection of objects (`selectObject()`)
  - ✅ Drawing mode detection
  - ❌ **MISSING**: Drag initiation for already selected objects

### ✅ **EXISTING SYSTEMS ARE CORRECT**
- **EditActions.ts** has proper drag functions: `startDragging()`, `updateDragPosition()`
- **PreviewSystem.ts** handles move operations correctly
- **DragDetector** in InputManager detects movement properly

## 🎯 **THE FIX NEEDED**

**In InputManager.handleMouseDown()** when in selection mode:
```typescript
if (hitObjectId) {
  if (hitObjectId === gameStore.selection.selectedId) {
    // ✅ Already selected → START DRAG instead of re-select
    gameStore_methods.startDragging(hitObjectId, coord)
    // ✅ Start preview for move operation
    gameStore_methods.startPreview('move', hitObjectId)
  } else {
    // ✅ Different object → Select it
    gameStore_methods.selectObject(hitObjectId)
  }
}
```

## 🔧 **ADDITIONAL FIXES NEEDED**

1. **Connect drag updates to preview** in `handleMouseMove()`
2. **Connect drag completion to preview commit** in `handleMouseUp()`
3. **Calculate vertex offsets** for proper object positioning

## 🎯 **KEY FILES TO MODIFY**

- `InputManager.ts` - Add drag initiation logic
- Possibly `EditActions.ts` - Ensure proper preview integration

## 🚨 **DETAILED ANALYSIS**

### **Current InputManager.handleSelectionMode()** 
```typescript
if (hitObjectId) {
  if (clickType === 'single-click') {
    gameStore_methods.selectObject(hitObjectId)  // ❌ ALWAYS RE-SELECTS
  }
}
```

### **Required Fix**
```typescript
if (hitObjectId) {
  if (hitObjectId === gameStore.selection.selectedId) {
    // Already selected - start dragging
    gameStore_methods.startDragging(hitObjectId, coord)
    gameStore_methods.startPreview('move', hitObjectId)
  } else {
    // Different object - select it
    gameStore_methods.selectObject(hitObjectId)
  }
}
```

### **Required Preview Updates in handleMouseMove()**
```typescript
// Add after existing drag handling
if (gameStore.dragging.isDragging && gameStore.preview.isActive) {
  // Calculate vertex offset and update preview
  const offset = this.calculateDragOffset(coord)
  const newVertices = this.applyOffsetToVertices(offset)
  gameStore_methods.updatePreview({ 
    operation: 'move', 
    vertices: newVertices 
  })
}
```

### **Required Commit in handleMouseUp()**
```typescript
if (gameStore.dragging.isDragging && gameStore.preview.isActive) {
  // Commit the drag movement
  gameStore_methods.commitPreview()
  gameStore_methods.cancelDragging()
}