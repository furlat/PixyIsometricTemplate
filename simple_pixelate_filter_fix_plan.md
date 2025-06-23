# 🎮 Simple Pixelate Filter Fix Plan

## 🎯 **User's Simple Solution**

Use bbox to define meshes that are children of the graphics layer and only apply the filter there, with a dedicated layer for visualization.

## 🔍 **Current Overcomplicated Approach**

```typescript
// Current: Applying filters to entire containers
this.normalContainer.filters = [this.pixelateFilter]      // ❌ Too broad
this.selectedContainer.filters = [this.pixelateFilter]    // ❌ Too broad
```

## ✅ **Simple Bbox-Based Solution**

### **Step 1: Use Existing Bbox System**
```typescript
// GeometryRenderer: Apply filters only to individual object containers
private updatePixelateFilterState(): void {
  const pixelateEnabled = gameStore.geometry.filterEffects.pixelate
  
  if (pixelateEnabled) {
    // Apply filter to individual object containers, not entire containers
    for (const [objectId, container] of this.objectContainers) {
      if (this.shouldApplyPixelateToObject(objectId)) {
        container.filters = this.getFiltersForObject(objectId)
      }
    }
  } else {
    // Remove filters from individual objects
    for (const [objectId, container] of this.objectContainers) {
      container.filters = this.getFiltersForObject(objectId, false)
    }
  }
}

private getFiltersForObject(objectId: string, includePixelate = true): Filter[] {
  const isSelected = gameStore.geometry.selection.selectedObjectId === objectId
  const pixelateEnabled = gameStore.geometry.filterEffects.pixelate && includePixelate
  const outlineEnabled = gameStore.geometry.filterEffects.outline
  
  const filters: Filter[] = []
  
  if (isSelected && outlineEnabled) filters.push(this.outlineFilter)
  if (pixelateEnabled) filters.push(this.pixelateFilter)
  
  return filters.length > 0 ? filters : null
}
```

### **Step 2: Remove Container-Level Filters**
```typescript
// Remove these problematic lines:
// this.normalContainer.filters = [this.pixelateFilter]     // ❌ Remove
// this.selectedContainer.filters = [...]                   // ❌ Remove

// Keep containers clean:
this.normalContainer.filters = null    // ✅ Clean
this.selectedContainer.filters = null  // ✅ Clean
```

### **Step 3: Use Bbox for Precise Targeting**
```typescript
private shouldApplyPixelateToObject(objectId: string): boolean {
  // Use existing bbox system to determine if object should be pixelated
  const object = gameStore.geometry.objects.find(obj => obj.id === objectId)
  if (!object || !object.metadata) return false
  
  // Could add bbox-based filtering logic here if needed
  return object.isVisible
}
```

## 🎪 **Implementation Changes**

### **Current Code Changes Needed:**

1. **GeometryRenderer.updatePixelateFilterState()**: 
   - Remove container-level filter application
   - Add object-level filter application

2. **GeometryRenderer.assignObjectToFilterContainer()**:
   - Simplify to just parent assignment
   - Remove filter logic (handled per-object now)

3. **Remove alignContainersToTrustedBounds()**:
   - Not needed with object-level filtering
   - Eliminates position corruption risk

## 🚀 **Benefits of Simple Approach**

- ✅ **Precise Targeting**: Filter only affects individual geometry objects
- ✅ **No Container Pollution**: Parent containers remain clean
- ✅ **Bbox Integration**: Uses existing object metadata system
- ✅ **Simple Logic**: Clear object-level filter assignment
- ✅ **No Position Corruption**: No container position manipulation

## 🔧 **Implementation Steps**

1. Modify `updatePixelateFilterState()` to use object-level filtering
2. Remove container-level filter assignments
3. Update `getFiltersForObject()` helper method
4. Test with single geometry object first
5. Verify no scene-wide effects

This approach treats each geometry object as an isolated entity for filtering, preventing any scene-wide effects.