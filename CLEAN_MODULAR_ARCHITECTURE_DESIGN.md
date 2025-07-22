# Clean Modular Architecture Design

## 🎯 **OBJECTIVE**
Design a clean, modular architecture separating storage from actions, with unified geometry operations and preview system.

---

## 🏗️ **CORE ARCHITECTURAL PRINCIPLES**

### **1. Separation of Concerns**
- **Storage**: Pure data containers
- **Actions**: Pure functions that operate on data
- **Geometry**: Single unified helper for all shapes
- **Preview**: Same methods + temporary data flag

### **2. Object Operations (ONLY 5 needed)**
- **a) Creation** - Add new object to store
- **b) Removal** - Remove object from store  
- **c) Selection** - Mark object as selected
- **d) Movement** - Update vertex positions (drag OR edit panel)
- **e) Resizing** - Change object dimensions

### **3. Unified Preview System**
- Same methods used for actual operations AND preview
- Temporary data object created from real object
- Preview flag determines render source
- Preview committed to store when user confirms

### **4. Single Geometry Helper**
- One helper for ALL shapes (no disseminated methods)
- Consistent coordinate conversion everywhere
- Vertex-based operations for fine-grained control

---

## 📦 **MODULAR STRUCTURE**

### **Module 1: Storage (Data Only)**
```typescript
// Pure data storage - NO METHODS
interface GeometryStore {
  objects: GeometricObject[]
  selection: {
    selectedId: string | null
    selectionBounds: ECSBoundingBox | null
  }
  preview: {
    isActive: boolean
    previewObject: GeometricObject | null
    originalObjectId: string | null
  }
}

export const geometryStore = proxy<GeometryStore>({
  objects: [],
  selection: { selectedId: null, selectionBounds: null },
  preview: { isActive: false, previewObject: null, originalObjectId: null }
})
```

### **Module 2: Actions (Pure Functions)**
```typescript
// Pure functions that operate on store data
export const GeometryActions = {
  // a) Creation
  createObject(store: GeometryStore, params: CreateObjectParams): string
  
  // b) Removal  
  removeObject(store: GeometryStore, objectId: string): void
  
  // c) Selection
  selectObject(store: GeometryStore, objectId: string): void
  clearSelection(store: GeometryStore): void
  
  // d) Movement (unified for drag AND edit panel)
  moveObject(store: GeometryStore, objectId: string, newVertices: PixeloidCoordinate[]): void
  
  // e) Resizing
  resizeObject(store: GeometryStore, objectId: string, newDimensions: ObjectDimensions): void
}
```

### **Module 3: Single Geometry Helper**
```typescript
// ONE helper for ALL geometry operations
export class UnifiedGeometryHelper {
  // Coordinate conversion (same method everywhere)
  static convertCoordinates(coord: PixeloidCoordinate, targetType: 'screen' | 'vertex'): Coordinate
  
  // Vertex operations (fine-grained positioning)
  static generateVertices(type: ShapeType, properties: ShapeProperties): PixeloidCoordinate[]
  static moveVertices(vertices: PixeloidCoordinate[], offset: PixeloidCoordinate): PixeloidCoordinate[]
  static validateVertices(vertices: PixeloidCoordinate[], type: ShapeType): boolean
  
  // Properties calculation (forward only - NO reverse engineering)
  static calculateProperties(type: ShapeType, vertices: PixeloidCoordinate[]): ShapeProperties
  
  // Bounds calculation
  static calculateBounds(vertices: PixeloidCoordinate[]): ECSBoundingBox
  
  // Preview operations (same methods + flag)
  static createPreviewObject(originalObject: GeometricObject, isPreview: true): GeometricObject
}
```

### **Module 4: Preview System (Unified)**
```typescript
// Unified preview using same methods + temporary data
export const PreviewSystem = {
  // Start preview (for creation, movement, resizing)
  startPreview(store: GeometryStore, operation: 'create' | 'move' | 'resize', originalObjectId?: string): void {
    const originalObject = originalObjectId ? store.objects.find(o => o.id === originalObjectId) : null
    const previewObject = UnifiedGeometryHelper.createPreviewObject(originalObject, true)
    
    store.preview = {
      isActive: true,
      previewObject,
      originalObjectId: originalObjectId || null
    }
  }
  
  // Update preview (uses same geometry methods)
  updatePreview(store: GeometryStore, newData: PreviewUpdateData): void {
    if (!store.preview.isActive || !store.preview.previewObject) return
    
    // Use SAME methods as actual operations
    switch (newData.operation) {
      case 'move':
        store.preview.previewObject.vertices = UnifiedGeometryHelper.moveVertices(
          store.preview.previewObject.vertices, 
          newData.offset
        )
        break
      case 'resize':
        store.preview.previewObject.vertices = UnifiedGeometryHelper.generateVertices(
          store.preview.previewObject.type,
          newData.newDimensions
        )
        break
    }
    
    // Recalculate bounds using same method
    store.preview.previewObject.bounds = UnifiedGeometryHelper.calculateBounds(
      store.preview.previewObject.vertices
    )
  }
  
  // Commit preview (apply to actual store)
  commitPreview(store: GeometryStore): void {
    if (!store.preview.isActive || !store.preview.previewObject) return
    
    if (store.preview.originalObjectId) {
      // Update existing object
      GeometryActions.moveObject(store, store.preview.originalObjectId, store.preview.previewObject.vertices)
    } else {
      // Create new object
      GeometryActions.createObject(store, {
        type: store.preview.previewObject.type,
        vertices: store.preview.previewObject.vertices,
        style: store.preview.previewObject.style
      })
    }
    
    this.clearPreview(store)
  }
  
  // Cancel preview
  cancelPreview(store: GeometryStore): void {
    this.clearPreview(store)
  }
  
  private clearPreview(store: GeometryStore): void {
    store.preview = {
      isActive: false,
      previewObject: null,
      originalObjectId: null
    }
  }
}
```

---

## 🎮 **OBJECT OPERATIONS DESIGN**

### **Operation A: Creation**
```typescript
// Drawing system integration
const handleDrawingFinish = (startPoint: PixeloidCoordinate, endPoint: PixeloidCoordinate, mode: DrawingMode) => {
  // 1. Start preview
  PreviewSystem.startPreview(geometryStore, 'create')
  
  // 2. Generate vertices using unified helper
  const vertices = UnifiedGeometryHelper.generateVertices(mode, { startPoint, endPoint })
  
  // 3. Update preview
  PreviewSystem.updatePreview(geometryStore, {
    operation: 'create',
    vertices
  })
  
  // 4. User sees preview, clicks confirm
  // 5. Commit to store
  PreviewSystem.commitPreview(geometryStore)
}
```

### **Operation D: Movement (Unified Drag + Edit Panel)**
```typescript
// Movement via drag and drop
const handleDragMovement = (objectId: string, mousePos: PixeloidCoordinate, clickOffset: PixeloidCoordinate) => {
  // 1. Start preview
  PreviewSystem.startPreview(geometryStore, 'move', objectId)
  
  // 2. Calculate new vertices (respecting click position)
  const offset = {
    x: mousePos.x - clickOffset.x,
    y: mousePos.y - clickOffset.y
  }
  
  // 3. Update preview using unified helper
  PreviewSystem.updatePreview(geometryStore, {
    operation: 'move',
    offset
  })
  
  // 4. On mouse release, commit
  PreviewSystem.commitPreview(geometryStore)
}

// Movement via edit panel (SAME SYSTEM)
const handleEditPanelMovement = (objectId: string, newVertices: PixeloidCoordinate[]) => {
  // 1. Start preview
  PreviewSystem.startPreview(geometryStore, 'move', objectId)
  
  // 2. Update preview with explicit vertices
  PreviewSystem.updatePreview(geometryStore, {
    operation: 'move',
    vertices: newVertices  // Fine-grained N-vertex control
  })
  
  // 3. User sees preview in edit panel
  // 4. On apply, commit
  PreviewSystem.commitPreview(geometryStore)
}
```

### **Operation E: Resizing**
```typescript
// Resizing via edit panel
const handleResizing = (objectId: string, newDimensions: ObjectDimensions) => {
  // 1. Start preview
  PreviewSystem.startPreview(geometryStore, 'resize', objectId)
  
  // 2. Generate new vertices using unified helper
  const newVertices = UnifiedGeometryHelper.generateVertices(
    object.type,
    newDimensions
  )
  
  // 3. Update preview
  PreviewSystem.updatePreview(geometryStore, {
    operation: 'resize',
    vertices: newVertices
  })
  
  // 4. User sees preview, clicks apply
  // 5. Commit to store
  PreviewSystem.commitPreview(geometryStore)
}
```

---

## 🔧 **COORDINATE CONVERSION (Unified)**

### **Single Method for All Conversions**
```typescript
// ONE method used everywhere
export const CoordinateConverter = {
  // Unified conversion method
  convert(
    coord: PixeloidCoordinate | ScreenCoordinate | VertexCoordinate, 
    from: 'pixeloid' | 'screen' | 'vertex',
    to: 'pixeloid' | 'screen' | 'vertex',
    context: ConversionContext
  ): PixeloidCoordinate | ScreenCoordinate | VertexCoordinate {
    // Single implementation used by:
    // - Drawing system
    // - Drag system  
    // - Edit panel
    // - Preview system
    // - Rendering system
  }
}

// Usage everywhere
const screenCoord = CoordinateConverter.convert(pixeloidCoord, 'pixeloid', 'screen', context)
const vertexCoord = CoordinateConverter.convert(mousePos, 'screen', 'vertex', context)
```

---

## 🎯 **CIRCLE BUG SOLUTION**

### **With Unified Architecture**
```typescript
// Edit panel circle movement
const handleCircleEdit = (objectId: string, newCenter: PixeloidCoordinate, newRadius: number) => {
  // 1. Start preview
  PreviewSystem.startPreview(geometryStore, 'move', objectId)
  
  // 2. Generate new vertices using FORWARD calculation (no reverse engineering)
  const newVertices = UnifiedGeometryHelper.generateVertices('circle', {
    center: newCenter,
    radius: newRadius  // Use form data directly - NO CALCULATION
  })
  
  // 3. Update preview
  PreviewSystem.updatePreview(geometryStore, {
    operation: 'move',
    vertices: newVertices
  })
  
  // 4. Commit preserves exact form values
  PreviewSystem.commitPreview(geometryStore)
}

// Result: Radius stays exactly as entered, no reverse engineering
```

---

## 📊 **ARCHITECTURE COMPARISON**

### **Before (Fragmented)**
```
4 Stores → 3 Object Arrays → 15+ Methods → 2977 Lines of Code
Multiple Geometry Helpers → Coordinate Conversion Chaos → Preview Duplication
```

### **After (Modular)**
```
1 Store → 1 Object Array → 5 Operations → ~500 Lines of Code
1 Geometry Helper → 1 Coordinate Converter → 1 Preview System
```

**Code Reduction**: 83% reduction (2977 → 500 lines)
**File Reduction**: 7 files → 4 modules
**Method Reduction**: 15+ → 5 operations

---

## 🎯 **IMPLEMENTATION BENEFITS**

### **For Circle Bug**
- ✅ No reverse engineering (forward calculation only)
- ✅ Form data used directly (no property recalculation)
- ✅ Preview uses same methods as actual operations
- ✅ Single source of truth for calculations

### **For Preview System**
- ✅ Creation, movement, resizing all use same preview pattern
- ✅ Temporary data object prevents store contamination
- ✅ User sees exact result before committing
- ✅ Cancel/commit clearly separated

### **For Code Maintenance**
- ✅ Single geometry helper (no method hunting)
- ✅ Consistent coordinate conversion everywhere
- ✅ Clear separation of storage vs operations
- ✅ 83% less code to maintain

### **For Fine-Grained Control**
- ✅ N-vertex positioning support
- ✅ Drag respects mouse click position
- ✅ Edit panel supports explicit vertex editing
- ✅ All through same unified system

---

## 🔗 **LINKS TO OTHER DOCUMENTS**
- **Main Tracker**: [ARCHITECTURE_CLEANUP_TASK_TRACKER.md](./ARCHITECTURE_CLEANUP_TASK_TRACKER.md)
- **Store Analysis**: [STORE_UNIFICATION_ANALYSIS.md](./STORE_UNIFICATION_ANALYSIS.md)

---

**Last Updated**: 2025-07-22 17:33 UTC  
**Status**: Clean Architecture Designed
**Next Step**: Implementation Planning