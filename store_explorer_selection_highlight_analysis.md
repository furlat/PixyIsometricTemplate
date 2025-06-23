# Store Explorer & Selection Highlight Analysis

## Current State Investigation

### 1. Store Explorer Double-Click Navigation

**Current Implementation (StoreExplorer.ts line 502-505):**
```typescript
private navigateToObject(objectId: string): void {
  updateGameStore.centerCameraOnObject(objectId)
}
```

**Store Method (gameStore.ts lines 773-782):**
```typescript
centerCameraOnObject: (objectId: string) => {
  const object = gameStore.geometry.objects.find(obj => obj.id === objectId)
  if (object && object.metadata) {
    // Set camera position to center on object
    updateGameStore.setCameraPosition(createPixeloidCoordinate(object.metadata.center.x, object.metadata.center.y))
  }
}
```

**❌ Problem:** Updates camera position, but WASD movement is controlled by `vertex_to_pixeloid_offset`, not camera position!

### 2. Selection Highlight WASD Movement

**Current Implementation (SelectionHighlightRenderer.ts):**
- ✅ **Renders every frame** (line 22) - called by LayeredInfiniteCanvas 
- ✅ **Always clears and redraws** (line 25) - `this.selectionGraphics.clear()`
- ✅ **Reads current store state** (line 33) - finds selected object fresh each frame
- ❌ **Missing coordinate conversion** - uses object coordinates directly

**Coordinate Conversion Issue:**
- **GeometryRenderer**: Converts `pixeloid → vertex` coordinates before rendering
- **SelectionHighlightRenderer**: Uses object coordinates directly (still in pixeloid space)
- **Result**: Selection highlights don't move with WASD offset changes

### 3. Selection Layer Setup

**LayeredInfiniteCanvas (line 197):**
```typescript
// Render selection highlights (reactive, always updates based on store state)
this.renderSelectionLayer(paddedCorners, pixeloidScale)
```

**renderSelectionLayer (lines 272-281):**
```typescript
if (gameStore.geometry.layerVisibility.selection) {
  this.selectionHighlightRenderer.render(corners, pixeloidScale)
  this.selectionLayer.visible = true
}
```

✅ **Good**: Selection renderer called every frame, should update during WASD movement

## Required Fixes

### Fix 1: Store Explorer Double-Click Navigation

**Problem:** `centerCameraOnObject()` updates wrong coordinate system

**Solution:** Create new method that updates offset to center object in viewport

```typescript
// New method in gameStore.ts
centerViewportOnObject: (objectId: string) => {
  const object = gameStore.geometry.objects.find(obj => obj.id === objectId)
  if (object && object.metadata) {
    // Calculate offset to center object at screen center
    const screenCenterX = gameStore.windowWidth / 2 / gameStore.camera.pixeloid_scale
    const screenCenterY = gameStore.windowHeight / 2 / gameStore.camera.pixeloid_scale
    const targetOffset = createPixeloidCoordinate(
      object.metadata.center.x - screenCenterX,
      object.metadata.center.y - screenCenterY
    )
    updateGameStore.setVertexToPixeloidOffset(targetOffset)
  }
}
```

**Update StoreExplorer:**
```typescript
private navigateToObject(objectId: string): void {
  updateGameStore.centerViewportOnObject(objectId)
}
```

### Fix 2: Selection Highlight Coordinate Conversion

**Problem:** SelectionHighlightRenderer doesn't convert coordinates

**Solution:** Add same coordinate conversion as GeometryRenderer

```typescript
// Add to SelectionHighlightRenderer.ts
private convertObjectToVertexCoordinates(obj: GeometricObject): GeometricObject {
  // Same conversion logic as GeometryRenderer
  // Convert from pixeloid coordinates to vertex coordinates using CoordinateHelper
}

private renderSelectionHighlight(obj: GeometricObject, pixeloidScale: number): void {
  // Convert object coordinates before rendering
  const convertedObject = this.convertObjectToVertexCoordinates(obj)
  
  // Then render using converted coordinates
  // ... existing rendering logic with convertedObject instead of obj
}
```

## Implementation Plan

### Phase 1: Fix Store Explorer Double-Click

1. **Add new method to gameStore.ts** - `centerViewportOnObject()`
2. **Update StoreExplorer.ts** - use new method instead of `centerCameraOnObject()`
3. **Test**: Double-click should center object using offset changes

### Phase 2: Fix Selection Highlight Coordinate Conversion

1. **Add coordinate conversion to SelectionHighlightRenderer.ts**
2. **Copy conversion logic from GeometryRenderer.ts** 
3. **Convert object before rendering highlight**
4. **Test**: Selection highlights should move with WASD

### Phase 3: Verify Store Explorer State

1. **Check object position display** - ensure it shows correct pixeloid coordinates
2. **Verify texture preview system** - ensure it works with new rendering
3. **Test navigation and selection interaction**

## Expected Results

**After fixes:**
- ✅ **Double-click navigation** → Centers object using offset changes → Works with WASD
- ✅ **Selection highlights** → Move with objects during WASD movement → Stay aligned
- ✅ **Store explorer** → Shows accurate object positions → Fully functional

**Key Insight:** Both issues stem from coordinate system mismatches - Store Explorer uses old camera centering, Selection Highlight missing coordinate conversion that GeometryRenderer has.