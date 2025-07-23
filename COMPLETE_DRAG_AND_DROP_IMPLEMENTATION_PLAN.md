# 🎯 **COMPLETE DRAG & DROP IMPLEMENTATION PLAN**

## 🏗️ **ARCHITECTURAL OVERVIEW**

### **Data Flow Authority**
```
Vertex Mesh Event → InputManager → Store (final position only) → Renderer
                      ↓
                   Preview System (intermediate visuals)
```

### **State Management Strategy**
- **Store**: Only final committed positions (no intermediate updates)
- **Preview**: All intermediate visual updates
- **Drag State**: Temporary calculation data (offsets, start position)

## 🧮 **MOMENTUM ACCUMULATION PREVENTION**

### ❌ **WRONG APPROACH (Accumulative)**
```typescript
// DON'T DO THIS - causes drift
newPosition = oldPosition + mouseDelta  // ❌ Accumulates errors
```

### ✅ **CORRECT APPROACH (Absolute)**
```typescript
// DO THIS - always calculate from fixed reference
newPosition = originalVertices + (currentMouse - dragStartMouse)  // ✅ No accumulation
```

## 📊 **DRAG STATE STRUCTURE**

```typescript
// In store.dragging (already exists, needs extension)
dragging: {
  isDragging: boolean
  draggedObjectId: string | null
  dragStartPosition: PixeloidCoordinate | null     // ✅ Mouse position when drag started
  currentDragPosition: PixeloidCoordinate | null   // ✅ Current mouse position
  vertexOffsets: PixeloidCoordinate[]              // ✅ Offset from drag start to each vertex
  originalVertices: PixeloidCoordinate[]           // ✅ NEW: Original vertices for absolute calculation
}
```

## 🔧 **IMPLEMENTATION PHASES**

### **PHASE 1: Drag Initiation (handleMouseDown)**

```typescript
// In InputManager.handleSelectionMode()
if (hitObjectId) {
  if (hitObjectId === gameStore.selection.selectedId) {
    // ✅ Already selected → START DRAG
    this.initiateDragOperation(hitObjectId, coord)
  } else {
    // ✅ Different object → SELECT IT
    gameStore_methods.selectObject(hitObjectId)
  }
}

// NEW METHOD: initiateDragOperation()
private initiateDragOperation(objectId: string, clickPosition: PixeloidCoordinate): void {
  const object = gameStore_methods.getObjectById(objectId)
  if (!object) return
  
  // ✅ Calculate static offsets ONCE (no accumulation possible)
  const vertexOffsets = object.vertices.map(vertex => ({
    x: vertex.x - clickPosition.x,
    y: vertex.y - clickPosition.y
  }))
  
  // ✅ Store original vertices for absolute calculation
  const originalVertices = [...object.vertices]
  
  // ✅ Start drag state
  gameStore_methods.startDragging(objectId, clickPosition)
  
  // ✅ Store calculation data (extend existing startDragging)
  gameStore.dragging.vertexOffsets = vertexOffsets
  gameStore.dragging.originalVertices = originalVertices
  
  // ✅ Start preview for visual feedback
  gameStore_methods.startPreview('move', objectId)
}
```

### **PHASE 2: Drag Update (handleMouseMove)**

```typescript
// In InputManager.handleMouseMove() - ADD THIS
if (gameStore.dragging.isDragging && gameStore.preview.isActive) {
  this.updateDragOperation(coord)
}

// NEW METHOD: updateDragOperation()
private updateDragOperation(currentMousePosition: PixeloidCoordinate): void {
  const { dragStartPosition, vertexOffsets, originalVertices } = gameStore.dragging
  
  if (!dragStartPosition || !vertexOffsets || !originalVertices) return
  
  // ✅ ABSOLUTE CALCULATION - NO ACCUMULATION
  // Calculate mouse delta from start
  const mouseDelta = {
    x: currentMousePosition.x - dragStartPosition.x,
    y: currentMousePosition.y - dragStartPosition.y
  }
  
  // ✅ Apply delta to ORIGINAL vertices (not current preview)
  const newVertices = originalVertices.map(originalVertex => ({
    x: originalVertex.x + mouseDelta.x,
    y: originalVertex.y + mouseDelta.y
  }))
  
  // ✅ Update preview ONLY (not main store)
  gameStore_methods.updatePreview({
    operation: 'move',
    vertices: newVertices
  })
  
  // ✅ Update drag state for UI tracking
  gameStore.dragging.currentDragPosition = currentMousePosition
}
```

### **PHASE 3: Drag Completion (handleMouseUp)**

```typescript
// In InputManager.handleMouseUp() - ADD THIS
if (gameStore.dragging.isDragging && gameStore.preview.isActive) {
  this.completeDragOperation()
}

// NEW METHOD: completeDragOperation()
private completeDragOperation(): void {
  // ✅ Commit preview to store (final position only)
  gameStore_methods.commitPreview()
  
  // ✅ Clear drag state
  gameStore_methods.cancelDragging()
}
```

### **PHASE 4: Drag Cancellation (ESC Key)**

```typescript
// In KeyboardHandler.handleEscape() - ADD PRIORITY
if (gameStore.dragging.isDragging) {
  gameStore_methods.cancelPreview()  // ✅ Restore original
  gameStore_methods.cancelDragging() // ✅ Clear drag state
  return // STOP HERE
}
```

## 🔍 **STORE INTEGRATION DETAILS**

### **EditActions.ts Extensions**

```typescript
// EXTEND existing startDragging() method
export const startDragging = (store: GameStoreData, objectId: string, position: PixeloidCoordinate): void => {
  // ✅ Existing validation
  if (!isValidCoordinate(position)) {
    throw new Error(`Invalid drag start position: ${JSON.stringify(position)}`)
  }
  
  const objectExists = store.objects.some(obj => obj.id === objectId)
  if (!objectExists) {
    throw new Error(`Cannot start dragging - object ${objectId} not found`)
  }
  
  // ✅ Set drag state
  store.dragging.isDragging = true
  store.dragging.draggedObjectId = objectId
  store.dragging.dragStartPosition = position
  store.dragging.currentDragPosition = position
  
  // ✅ NEW: Initialize calculation arrays
  store.dragging.vertexOffsets = []      // Will be set by InputManager
  store.dragging.originalVertices = []   // Will be set by InputManager
}

// EXTEND existing cancelDragging() method
export const cancelDragging = (store: GameStoreData): void => {
  store.dragging.isDragging = false
  store.dragging.draggedObjectId = null
  store.dragging.dragStartPosition = null
  store.dragging.currentDragPosition = null
  
  // ✅ NEW: Clear calculation arrays
  store.dragging.vertexOffsets = []
  store.dragging.originalVertices = []
}
```

### **Store Type Extensions (if needed)**

```typescript
// In types/game-store.ts - extend DraggingState
interface DraggingState {
  isDragging: boolean
  draggedObjectId: string | null
  dragStartPosition: PixeloidCoordinate | null
  currentDragPosition: PixeloidCoordinate | null
  vertexOffsets: PixeloidCoordinate[]        // ✅ NEW
  originalVertices: PixeloidCoordinate[]     // ✅ NEW
}
```

## 🎮 **BEHAVIOR SPECIFICATION**

### **Expected User Experience**
1. **Select object** → Object highlights with selection bounds
2. **Click and hold on selected object** → Drag mode activates
3. **Move mouse** → Object follows smoothly, original disappears
4. **Release mouse** → Object commits to new position
5. **ESC during drag** → Object returns to original position

### **Edge Cases Handled**
- **Double-click during drag** → Cancels drag, selects object
- **Click outside during drag** → Completes drag at current position
- **Invalid coordinates** → Validation prevents drag start
- **Object deleted during drag** → Automatic drag cancellation

## 🧪 **TESTING CHECKPOINTS**

1. **✅ No momentum accumulation** - Drag object, release, click again → should start from exact position
2. **✅ Smooth preview** - Object follows mouse precisely during drag
3. **✅ Clean cancellation** - ESC returns object to exact original position
4. **✅ Store authority** - Final position only committed to store
5. **✅ Selection persistence** - Object remains selected after drag
6. **✅ Multiple objects** - Can select and drag different objects sequentially

## 🔧 **IMPLEMENTATION ORDER**

1. **Extend store types** (DraggingState)
2. **Extend EditActions** (startDragging, cancelDragging)
3. **Add InputManager methods** (initiateDragOperation, updateDragOperation, completeDragOperation)
4. **Update handleMouseDown** (detect already selected objects)
5. **Update handleMouseMove** (call updateDragOperation)
6. **Update handleMouseUp** (call completeDragOperation)
7. **Update handleEscape** (add drag cancellation priority)
8. **Test all edge cases** and verify no accumulation issues

## 🎯 **SUCCESS CRITERIA**

- ✅ Objects can be dragged smoothly
- ✅ No position drift or accumulation
- ✅ Clean store integration (only final positions)
- ✅ Proper preview system usage
- ✅ ESC cancellation works
- ✅ Multiple drag operations work correctly
- ✅ Selection remains intact after drag