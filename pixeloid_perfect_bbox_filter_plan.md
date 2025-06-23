# 🎮 Pixeloid-Perfect Bbox Filter System Plan

## 📝 **User Feedback Analysis**

✅ **Good News**: UI is not affected (not children of geometry layer)  
✅ **Approach Approved**: Individual container filtering is correct  
⚠️ **Concerns Identified**:
- Container pixeloid-perfect alignment not guaranteed
- Need bbox → invisible mesh binding  
- Mouse drag movement inconsistency with store/bbox
- Need to follow "don't reinvent the wheel" approach

## 🎯 **Enhanced Solution: Store-Integrated Bbox Mesh System**

### **Current State**
```typescript
// GeometryRenderer: Each object has a container
objectContainer = new Container()
graphics = new Graphics() 
objectContainer.addChild(graphics)
// But container position might not be pixeloid-perfect aligned
```

### **New System: Bbox Mesh Integration**

#### **Step 1: Store-Level Bbox Mesh References**
```typescript
// In gameStore types/index.ts
interface GeometricObject {
  // ... existing properties
  bboxMesh?: {
    meshId: string           // Reference to invisible mesh in store
    bounds: Rectangle        // Pixeloid-perfect bounds
    lastUpdated: number      // For consistency tracking
  }
}
```

#### **Step 2: Invisible Mesh Creation & Store Integration**
```typescript
// GeometryRenderer: Create pixeloid-perfect bbox mesh for each object
private createBboxMeshForObject(obj: GeometricObject): void {
  // Use existing bbox calculation (don't reinvent)
  const bboxBounds = obj.metadata.bounds // Already exists
  
  // Create invisible mesh at pixeloid-perfect positions
  const bboxMesh = new Graphics()
  bboxMesh.rect(bboxBounds.minX, bboxBounds.minY, 
                bboxBounds.maxX - bboxBounds.minX, 
                bboxBounds.maxY - bboxBounds.minY)
  bboxMesh.fill({ color: 0x000000, alpha: 0 }) // Invisible
  
  // Store reference in object
  const meshId = `bbox_${obj.id}_${Date.now()}`
  
  // Update store with bbox mesh reference
  updateGameStore.updateGeometricObject(obj.id, {
    bboxMesh: {
      meshId: meshId,
      bounds: new Rectangle(bboxBounds.minX, bboxBounds.minY, 
                           bboxBounds.maxX - bboxBounds.minX, 
                           bboxBounds.maxY - bboxBounds.minY),
      lastUpdated: Date.now()
    }
  })
  
  // Apply filter to bbox mesh instead of graphics
  bboxMesh.filters = this.getFiltersForObject(obj.id)
  
  // Add both graphics and bbox mesh to container
  const objectContainer = this.objectContainers.get(obj.id)
  objectContainer.addChild(graphics)      // Visible geometry
  objectContainer.addChild(bboxMesh)      // Invisible filtered mesh
}
```

#### **Step 3: Consistent Mouse Drag Integration**
```typescript
// Use existing mouse drag system, ensure bbox follows
private onObjectDrag(objectId: string, newPosition: PixeloidCoordinate): void {
  // Update object position in store (existing system)
  updateGameStore.updateGeometricObject(objectId, {
    x: newPosition.x,  // or anchorX for diamonds
    y: newPosition.y   // or anchorY for diamonds
  })
  
  // Bbox will auto-update via metadata recalculation (existing system)
  // No need to manually update bbox - leverage existing store reactivity
}
```

#### **Step 4: Automatic Bbox Updates**
```typescript
// Subscribe to object changes, update bbox mesh when object moves
private subscribeToObjectChanges(): void {
  subscribe(gameStore.geometry.objects, () => {
    // For each changed object, update its bbox mesh
    for (const obj of gameStore.geometry.objects) {
      if (this.needsBboxUpdate(obj)) {
        this.updateBboxMeshForObject(obj)
      }
    }
  })
}

private needsBboxUpdate(obj: GeometricObject): boolean {
  // Check if object metadata is newer than bbox mesh
  return !obj.bboxMesh || 
         obj.metadata.lastUpdated > obj.bboxMesh.lastUpdated
}

private updateBboxMeshForObject(obj: GeometricObject): void {
  // Remove old bbox mesh
  const oldMesh = this.findBboxMesh(obj.bboxMesh?.meshId)
  if (oldMesh) oldMesh.destroy()
  
  // Create new bbox mesh with updated bounds
  this.createBboxMeshForObject(obj)
}
```

## 🔧 **Integration with Existing Systems**

### **Leverages Existing Code** (Don't Reinvent Wheel):
- ✅ `obj.metadata.bounds` - Already calculated
- ✅ `updateGameStore.updateGeometricObject()` - Already exists  
- ✅ Mouse drag system - Already works
- ✅ Store reactivity - Already implemented
- ✅ Coordinate conversion - Already working

### **New Minimal Additions**:
- Invisible bbox mesh creation
- Store reference linking  
- Filter application to mesh instead of graphics

## 🎪 **Benefits**

- **Pixeloid-Perfect**: Bbox mesh positioned at exact pixeloid boundaries
- **Store-Integrated**: Bbox references saved in store for consistency  
- **Auto-Updating**: Bbox follows object movement automatically
- **Leverages Existing**: Uses current metadata, drag, and store systems
- **Filter Isolation**: Each object's bbox mesh is independently filtered

## 🚀 **Implementation Order**

1. Add `bboxMesh` property to `GeometricObject` type
2. Create `createBboxMeshForObject()` method
3. Apply filters to bbox mesh instead of graphics
4. Add store integration for bbox references  
5. Subscribe to object changes for auto-updates
6. Test with single object + mouse drag

This approach creates a robust, store-integrated system where each geometry object has a pixeloid-perfect invisible bbox mesh that serves as the filter target, automatically updating when objects move via the existing store/drag systems.