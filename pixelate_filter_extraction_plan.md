# 🎮 Pixelate Filter Extraction Plan

## 🔍 **Current State Analysis**

### **What's Currently in GeometryRenderer (32 matches found):**

**Core Pixelate Infrastructure:**
- `private pixelateFilter: PixelateFilter` (line 36)
- `private objectBboxMeshes: Map<string, Graphics>` (line 32)
- Pixelate filter initialization (lines 45-49)

**Filter State Management:**
- `updatePixelateFilterState()` (lines 196-214)
- `updatePixelateFilterScale()` (lines 219-223)
- `getFiltersForObject()` (lines 342-351)
- `updateAllObjectFilters()` (lines 358-364)

**Bbox Mesh Lifecycle:**
- `createBboxMeshForObject()` (lines 289-337)
- `updateBboxMeshForObject()` (lines 274-284)
- `updateBboxMeshPosition()` (lines 369-387)
- `needsBboxUpdate()` (lines 257-269)

**Subscriptions & Cleanup:**
- `subscribeToObjectChanges()` (lines 241-282)
- Filter change subscriptions (lines 177-184)
- Bbox mesh cleanup (lines 87-88, 814-816)

## 🧹 **Extraction Strategy**

### **Phase 1: Create PixelateFilterRenderer**
Extract ALL bbox mesh and pixelate filter logic into a dedicated renderer:

```typescript
export class PixelateFilterRenderer {
  private container: Container
  private pixelateFilter: PixelateFilter
  private objectBboxMeshes: Map<string, Graphics> = new Map()
  
  // Move ALL the bbox mesh methods from GeometryRenderer:
  private createBboxMeshForObject()
  private updateBboxMeshForObject() 
  private updateBboxMeshPosition()
  private needsBboxUpdate()
  private updatePixelateFilterState()
  private updatePixelateFilterScale()
  private getFiltersForObject()
  private updateAllObjectFilters()
  private subscribeToObjectChanges()
}
```

### **Phase 2: Simplify GeometryRenderer**
Remove ALL pixelate and bbox mesh code:

**Remove These Properties:**
- `private pixelateFilter`
- `private objectBboxMeshes`

**Remove These Methods:**
- `updatePixelateFilterState()`
- `updatePixelateFilterScale()`
- `createBboxMeshForObject()`
- `updateBboxMeshForObject()`
- `updateBboxMeshPosition()`
- `needsBboxUpdate()`
- `getFiltersForObject()`
- `updateAllObjectFilters()`
- `subscribeToObjectChanges()`

**Remove These Calls:**
- Pixelate filter initialization
- Bbox mesh creation in `updateGeometricObjectWithCoordinateConversion`
- Bbox mesh cleanup in render loop
- Pixelate subscriptions in `subscribeToFilterChanges`

### **Phase 3: Add Pixelate Layer to LayeredInfiniteCanvas**

```typescript
private pixelateLayer: Container
private pixelateFilterRenderer: PixelateFilterRenderer

// Add to layer hierarchy
this.cameraTransform.addChild(this.pixelateLayer) // After selection layer

// Add render call
this.renderPixelateLayer(corners, pixeloidScale)
```

## 📊 **Complexity Reduction**

### **Before (Current GeometryRenderer):**
- **Lines**: ~850 lines
- **Responsibilities**: Geometry rendering + Bbox mesh management + Pixelate filtering
- **Complexity**: High (mixed concerns)
- **Maintainability**: Low (everything coupled)

### **After (Clean Architecture):**
- **GeometryRenderer**: ~650 lines (geometry rendering only)
- **PixelateFilterRenderer**: ~200 lines (pixelate filtering only)
- **Responsibilities**: Clean separation
- **Complexity**: Low (single responsibility)
- **Maintainability**: High (independent systems)

## 🎯 **Data Flow Architecture**

### **Current (Problematic):**
```
GeometryRenderer
├── Renders geometry objects
├── Creates bbox meshes for each object
├── Applies pixelate filters to bbox meshes
├── Manages bbox mesh lifecycle
├── Handles coordinate conversion for everything
└── Mixed responsibilities = complex maintenance
```

### **Target (Clean):**
```
GeometryLayer
├── GeometryRenderer (objects only)
├── SelectionFilterRenderer (selection highlights)
└── PixelateFilterRenderer (pixelate effects)
    ├── Gets object data from geometry parent
    ├── Creates own bbox meshes
    ├── Applies own pixelate filter
    ├── Handles own coordinate conversion
    └── Independent lifecycle management
```

## 🛠️ **Implementation Steps**

### **Step 1: Create PixelateFilterRenderer Skeleton**
```typescript
// app/src/game/PixelateFilterRenderer.ts
export class PixelateFilterRenderer {
  private container: Container = new Container()
  private pixelateFilter: PixelateFilter
  private objectBboxMeshes: Map<string, Graphics> = new Map()
  
  constructor() {
    this.pixelateFilter = new PixelateFilter([
      gameStore.camera.pixeloid_scale, 
      gameStore.camera.pixeloid_scale
    ])
  }
  
  public render(corners: ViewportCorners, pixeloidScale: number): void {
    // Main render method - gets objects and creates bbox meshes
  }
  
  public getContainer(): Container {
    return this.container
  }
  
  public destroy(): void {
    // Cleanup
  }
}
```

### **Step 2: Move Bbox Mesh Logic**
Copy all bbox mesh methods from GeometryRenderer to PixelateFilterRenderer:
- Same coordinate conversion logic
- Same bbox mesh creation
- Same filter application
- Same subscription handling

### **Step 3: Integrate into LayeredInfiniteCanvas**
- Add pixelate layer and renderer
- Add render call
- Update layer hierarchy

### **Step 4: Clean GeometryRenderer**
- Remove all pixelate and bbox mesh code
- Simplify to pure geometry rendering
- Remove complex subscriptions

### **Step 5: Test Integration**
- Verify pixelate filter still works
- Check coordinate alignment
- Test performance

## 💡 **Key Benefits**

### **Separation of Concerns:**
- ✅ **GeometryRenderer**: Pure geometry rendering
- ✅ **PixelateFilterRenderer**: Pure pixelate effects
- ✅ **SelectionFilterRenderer**: Pure selection highlights

### **Maintainability:**
- ✅ **Independent**: Each system can be modified separately
- ✅ **Focused**: Each file has single responsibility
- ✅ **Debuggable**: Clear boundaries for troubleshooting

### **Performance:**
- ✅ **Optimized**: Each renderer optimized for its purpose
- ✅ **Cacheable**: Independent caching strategies
- ✅ **Scalable**: Can optimize each system separately

This is a **major refactoring** but will result in much cleaner, more maintainable architecture following the successful pattern we just established with selection!