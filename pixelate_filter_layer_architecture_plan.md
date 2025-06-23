# 🎮 Pixelate Filter Layer Architecture Plan

## 🎯 **Target Architecture** (Same Pattern as Selection)

### **Layer Hierarchy:**
```
GeometryLayer
├── GeometryRenderer (objects)
├── SelectionLayer (child of geometry) ← OutlineFilter for red borders
└── PixelateLayer (child of geometry) ← NEW PixelateFilter for pixeloid effects
    ├── Gets object data from geometry parent
    ├── Gets bbox data from store/metadata
    └── Applies PixelateFilter at exact bbox positions
```

### **Single UI Control:**
- ✅ **Keep**: `toggle-filter-pixelate` button (🎮 Pixelate)
- 🎯 **Purpose**: Toggle pixeloid-perfect pixelation effect on objects

## 🧹 **Current State Analysis**

### **What Needs to be Extracted from GeometryRenderer:**
```typescript
// CURRENT: Scattered pixelate logic in GeometryRenderer
private pixelateFilter: PixelateFilter
private updatePixelateFilterState()
private updatePixelateFilterScale()
private getFiltersForObject() // bbox mesh filter assignment
private updateAllObjectFilters() // bbox mesh updates
private createBboxMeshForObject() // bbox mesh creation
```

### **Problem with Current System:**
- ❌ Pixelate logic mixed into GeometryRenderer
- ❌ Complex bbox mesh management inside renderer
- ❌ Filter state scattered across multiple methods
- ❌ Hard to maintain and debug

## 🏗️ **New Clean Architecture**

### **Create PixelateFilterRenderer.ts**
```typescript
export class PixelateFilterRenderer {
  private container: Container
  private pixelateFilter: PixelateFilter
  private bboxMeshes: Map<string, Graphics> = new Map()
  
  constructor() {
    this.container = new Container()
    this.pixelateFilter = new PixelateFilter([
      gameStore.camera.pixeloid_scale, 
      gameStore.camera.pixeloid_scale
    ])
  }
  
  public render(corners: ViewportCorners, pixeloidScale: number): void {
    // 1. Get all visible objects from store
    // 2. For each object, check if bbox data exists
    // 3. Create invisible bbox mesh at exact position
    // 4. Apply pixelate filter to bbox mesh
    // 5. Update filter scale for pixeloid-perfect alignment
  }
}
```

### **LayeredInfiniteCanvas Integration:**
```typescript
// Add new pixelate layer and renderer
private pixelateLayer: Container
private pixelateFilterRenderer: PixelateFilterRenderer

private renderPixelateLayer(corners: ViewportCorners, pixeloidScale: number): void {
  if (gameStore.geometry.filterEffects.pixelate) {
    this.pixelateFilterRenderer.render(corners, pixeloidScale)
    this.pixelateLayer.visible = true
  } else {
    this.pixelateLayer.visible = false
  }
}
```

## 🎮 **Data Flow Architecture**

### **Input Data Sources:**
1. **Geometry Objects**: From `gameStore.geometry.objects`
2. **Bbox Metadata**: From `object.metadata.bounds`
3. **Filter State**: From `gameStore.geometry.filterEffects.pixelate`
4. **Scale Settings**: From `gameStore.camera.pixeloid_scale`

### **Processing Pipeline:**
```
1. PixelateFilterRenderer.render() called
2. Get visible objects from geometry layer data
3. For each object:
   a. Check if object has bbox metadata
   b. Create invisible Graphics at bbox position
   c. Apply coordinate conversion (same as GeometryRenderer)
   d. Add to pixelate container
4. Apply PixelateFilter to entire container
5. Update filter scale for pixeloid-perfect alignment
```

### **Output:**
- Invisible bbox meshes with pixelate filter applied
- Pixeloid-perfect pixelation effect at exact object positions
- Clean separation from geometry rendering

## 🛠️ **Implementation Steps**

### **Step 1: Create PixelateFilterRenderer.ts**
- New file following SelectionFilterRenderer pattern
- Gets objects and bbox data from store
- Creates invisible bbox meshes
- Applies PixelateFilter with pixeloid-perfect scaling

### **Step 2: Add Pixelate Layer to LayeredInfiniteCanvas**
```typescript
private pixelateLayer: Container
private pixelateFilterRenderer: PixelateFilterRenderer

// Layer hierarchy (add after selection layer)
this.cameraTransform.addChild(this.pixelateLayer)

// Render call
this.renderPixelateLayer(corners, pixeloidScale)
```

### **Step 3: Clean GeometryRenderer**
- Remove all pixelate filter logic
- Remove bbox mesh creation/management
- Remove pixelate filter subscriptions
- Keep only core geometry rendering

### **Step 4: Wire UI Button**
- `toggle-filter-pixelate` already exists and works
- Just needs to toggle pixelate layer visibility
- No UI changes needed

## 💡 **Benefits of This Architecture**

### **Clean Separation:**
- ✅ **GeometryRenderer**: Only renders geometry objects
- ✅ **SelectionFilterRenderer**: Only handles selection highlights  
- ✅ **PixelateFilterRenderer**: Only handles pixelate effects

### **Data Access Pattern:**
- ✅ **Geometry Data**: All renderers get from parent geometry layer
- ✅ **Bbox Data**: Available in object metadata
- ✅ **Coordinate System**: Same conversion logic across all renderers

### **Performance:**
- ✅ **GPU Accelerated**: Proper PixelateFilter usage
- ✅ **Efficient**: Only creates bbox meshes when needed
- ✅ **Scalable**: Pixeloid-perfect scaling handled automatically

### **Maintainability:**
- ✅ **Single Responsibility**: Each renderer has one job
- ✅ **Independent**: Can toggle layers separately
- ✅ **Consistent**: Same architectural pattern throughout

## 🔄 **Coordinate System Integration**

### **Same Pattern as Selection:**
```typescript
// Get objects from geometry layer (parent)
const objects = gameStore.geometry.objects

// Apply same coordinate conversion as GeometryRenderer
private convertObjectToVertexCoordinates(obj: GeometricObject): GeometricObject {
  const offset = gameStore.mesh.vertex_to_pixeloid_offset
  // ... same logic as GeometryRenderer and SelectionFilterRenderer
}

// Create bbox mesh at converted coordinates
private createBboxMeshAtPosition(obj: GeometricObject): Graphics {
  const convertedObj = this.convertObjectToVertexCoordinates(obj)
  const bounds = obj.metadata.bounds
  // Create invisible graphics at exact position
  // Apply pixelate filter
}
```

## 🎯 **Expected User Experience**

### **Clean Workflow:**
1. User creates objects → objects appear in geometry layer
2. User clicks "🎮 Pixelate" → pixeloid-perfect pixelation appears at object positions
3. **GPU-accelerated effect** with perfect alignment to pixeloid grid
4. **Independent control**: Can toggle separately from selection highlights

### **Technical Result:**
- Clean, maintainable architecture
- Each filter system independent and focused
- Same data access pattern throughout
- GPU-optimized performance

This follows the **exact same successful pattern** we just implemented for selection highlights!