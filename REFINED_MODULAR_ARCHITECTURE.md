# Refined Modular Architecture

## 🎯 **OBJECTIVE**
Single store module with clear entry points that dispatch to modular submodules for maintainability and ease of use.

---

## 🏗️ **ARCHITECTURE OVERVIEW**

### **Single Entry Point + Modular Dispatch**
```
UI Components
     ↓
geometryStore (SINGLE ENTRY POINT)
     ↓ dispatches to ↓
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│  CreateActions  │  EditActions    │ GeometryHelper  │ PreviewSystem   │
│  (submodule)    │  (submodule)    │  (submodule)    │  (submodule)    │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

---

## 📦 **FILE STRUCTURE**

### **Main Store File: `geometryStore.ts`**
```typescript
// Single entry point with all CRUD operations
// Imports and dispatches to submodules
import { CreateActions } from './actions/CreateActions'
import { EditActions } from './actions/EditActions'  
import { GeometryHelper } from './helpers/GeometryHelper'
import { PreviewSystem } from './systems/PreviewSystem'

// Pure data storage
interface GeometryStoreData {
  objects: GeometricObject[]
  selection: { selectedId: string | null, selectionBounds: ECSBoundingBox | null }
  preview: { isActive: boolean, previewObject: GeometricObject | null, originalObjectId: string | null }
  ui: { showGeometry: boolean, showGeometryPanel: boolean }
}

export const geometryStore = proxy<GeometryStoreData>({
  objects: [],
  selection: { selectedId: null, selectionBounds: null },
  preview: { isActive: false, previewObject: null, originalObjectId: null },
  ui: { showGeometry: true, showGeometryPanel: false }
})

// SINGLE ENTRY POINT for all operations
export const geometryStore_methods = {
  // ==========================================
  // CREATION OPERATIONS (dispatch to CreateActions)
  // ==========================================
  createObject(params: CreateObjectParams): string {
    return CreateActions.createObject(geometryStore, params)
  },
  
  finishDrawing(mode: DrawingMode, startPoint: PixeloidCoordinate, endPoint: PixeloidCoordinate): string {
    return CreateActions.finishDrawing(geometryStore, mode, startPoint, endPoint)
  },
  
  // ==========================================
  // EDIT OPERATIONS (dispatch to EditActions)
  // ==========================================
  removeObject(objectId: string): void {
    EditActions.removeObject(geometryStore, objectId)
  },
  
  selectObject(objectId: string): void {
    EditActions.selectObject(geometryStore, objectId)
  },
  
  clearSelection(): void {
    EditActions.clearSelection(geometryStore)
  },
  
  // UNIFIED MOVEMENT (drag OR edit panel)
  moveObject(objectId: string, newVertices: PixeloidCoordinate[]): void {
    EditActions.moveObject(geometryStore, objectId, newVertices)
  },
  
  // UNIFIED RESIZING 
  resizeObject(objectId: string, newDimensions: ObjectDimensions): void {
    EditActions.resizeObject(geometryStore, objectId, newDimensions)
  },
  
  // ==========================================
  // PREVIEW OPERATIONS (dispatch to PreviewSystem)
  // ==========================================
  startPreview(operation: 'create' | 'move' | 'resize', originalObjectId?: string): void {
    PreviewSystem.startPreview(geometryStore, operation, originalObjectId)
  },
  
  updatePreview(data: PreviewUpdateData): void {
    PreviewSystem.updatePreview(geometryStore, data)
  },
  
  commitPreview(): void {
    PreviewSystem.commitPreview(geometryStore)
  },
  
  cancelPreview(): void {
    PreviewSystem.cancelPreview(geometryStore)
  },
  
  // ==========================================
  // UTILITY OPERATIONS  
  // ==========================================
  clearAllObjects(): void {
    EditActions.clearAllObjects(geometryStore)
  },
  
  getObjectById(objectId: string): GeometricObject | null {
    return geometryStore.objects.find(obj => obj.id === objectId) || null
  },
  
  getSelectedObject(): GeometricObject | null {
    return geometryStore.selection.selectedId 
      ? this.getObjectById(geometryStore.selection.selectedId)
      : null
  }
}
```

### **Submodule 1: `actions/CreateActions.ts`**
```typescript
// Object creation operations
import { GeometryHelper } from '../helpers/GeometryHelper'

export const CreateActions = {
  createObject(store: GeometryStoreData, params: CreateObjectParams): string {
    // Generate vertices using unified helper
    const vertices = GeometryHelper.generateVertices(params.type, params.properties)
    
    // Create object with consistent bounds calculation
    const newObject: GeometricObject = {
      id: `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: params.type,
      vertices: vertices,
      bounds: GeometryHelper.calculateBounds(vertices),
      style: params.style,
      isVisible: true,
      createdAt: Date.now()
    }
    
    // Add to store
    store.objects.push(newObject)
    return newObject.id
  },
  
  finishDrawing(store: GeometryStoreData, mode: DrawingMode, startPoint: PixeloidCoordinate, endPoint: PixeloidCoordinate): string {
    // Calculate drawing properties
    const properties = GeometryHelper.calculateDrawingProperties(mode, startPoint, endPoint)
    
    // Create object using standard creation path
    return this.createObject(store, {
      type: mode,
      properties: properties,
      style: getCurrentStyle() // Get from current style settings
    })
  }
}
```

### **Submodule 2: `actions/EditActions.ts`**
```typescript
// Object editing operations  
import { GeometryHelper } from '../helpers/GeometryHelper'

export const EditActions = {
  removeObject(store: GeometryStoreData, objectId: string): void {
    store.objects = store.objects.filter(obj => obj.id !== objectId)
    
    // Clear selection if deleted object was selected
    if (store.selection.selectedId === objectId) {
      this.clearSelection(store)
    }
  },
  
  selectObject(store: GeometryStoreData, objectId: string): void {
    const obj = store.objects.find(o => o.id === objectId)
    if (obj) {
      store.selection.selectedId = objectId
      store.selection.selectionBounds = obj.bounds
    }
  },
  
  clearSelection(store: GeometryStoreData): void {
    store.selection.selectedId = null
    store.selection.selectionBounds = null
  },
  
  // UNIFIED MOVEMENT (handles both drag and edit panel)
  moveObject(store: GeometryStoreData, objectId: string, newVertices: PixeloidCoordinate[]): void {
    const objIndex = store.objects.findIndex(obj => obj.id === objectId)
    if (objIndex === -1) return
    
    // Update vertices and recalculate bounds using unified helper
    store.objects[objIndex] = {
      ...store.objects[objIndex],
      vertices: newVertices,
      bounds: GeometryHelper.calculateBounds(newVertices)
    }
    
    // Update selection bounds if this object is selected
    if (store.selection.selectedId === objectId) {
      store.selection.selectionBounds = store.objects[objIndex].bounds
    }
  },
  
  // UNIFIED RESIZING
  resizeObject(store: GeometryStoreData, objectId: string, newDimensions: ObjectDimensions): void {
    const obj = store.objects.find(o => o.id === objectId)
    if (!obj) return
    
    // Generate new vertices from dimensions using unified helper
    const newVertices = GeometryHelper.generateVertices(obj.type, newDimensions)
    
    // Use unified movement operation
    this.moveObject(store, objectId, newVertices)
  },
  
  clearAllObjects(store: GeometryStoreData): void {
    store.objects = []
    this.clearSelection(store)
  }
}
```

### **Submodule 3: `helpers/GeometryHelper.ts`**
```typescript
// SINGLE geometry helper for ALL shapes
export class GeometryHelper {
  // ==========================================
  // VERTEX GENERATION (Forward calculation only)
  // ==========================================
  static generateVertices(type: ShapeType, properties: ShapeProperties): PixeloidCoordinate[] {
    switch (type) {
      case 'circle':
        return this.generateCircleVertices(properties.center, properties.radius)
      case 'rectangle':
        return this.generateRectangleVertices(properties.center, properties.width, properties.height)
      case 'line':
        return this.generateLineVertices(properties.startPoint, properties.endPoint)
      case 'diamond':
        return this.generateDiamondVertices(properties.center, properties.width, properties.height)
      case 'point':
        return [properties.center]
      default:
        throw new Error(`Unknown shape type: ${type}`)
    }
  }
  
  // ==========================================
  // VERTEX OPERATIONS (Fine-grained control)
  // ==========================================
  static moveVertices(vertices: PixeloidCoordinate[], offset: PixeloidCoordinate): PixeloidCoordinate[] {
    return vertices.map(vertex => ({
      x: vertex.x + offset.x,
      y: vertex.y + offset.y
    }))
  }
  
  static validateVertices(vertices: PixeloidCoordinate[], type: ShapeType): boolean {
    const expectedVertexCount = this.getExpectedVertexCount(type)
    return vertices.length === expectedVertexCount && vertices.every(v => 
      typeof v.x === 'number' && typeof v.y === 'number'
    )
  }
  
  // ==========================================
  // BOUNDS CALCULATION (Consistent everywhere)
  // ==========================================
  static calculateBounds(vertices: PixeloidCoordinate[]): ECSBoundingBox {
    if (vertices.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 }
    }
    
    const xs = vertices.map(v => v.x)
    const ys = vertices.map(v => v.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    
    return {
      minX, minY, maxX, maxY,
      width: maxX - minX,
      height: maxY - minY
    }
  }
  
  // ==========================================
  // DRAWING CALCULATIONS
  // ==========================================
  static calculateDrawingProperties(mode: DrawingMode, startPoint: PixeloidCoordinate, endPoint: PixeloidCoordinate): ShapeProperties {
    switch (mode) {
      case 'circle':
        const center = {
          x: (startPoint.x + endPoint.x) / 2,
          y: (startPoint.y + endPoint.y) / 2
        }
        const radius = Math.sqrt(
          Math.pow(endPoint.x - startPoint.x, 2) + 
          Math.pow(endPoint.y - startPoint.y, 2)
        ) / 2
        return { center, radius }
        
      case 'rectangle':
        const rectCenter = {
          x: (startPoint.x + endPoint.x) / 2,
          y: (startPoint.y + endPoint.y) / 2
        }
        return {
          center: rectCenter,
          width: Math.abs(endPoint.x - startPoint.x),
          height: Math.abs(endPoint.y - startPoint.y)
        }
        
      case 'line':
        return { startPoint, endPoint }
        
      default:
        throw new Error(`Drawing properties not implemented for ${mode}`)
    }
  }
  
  // ==========================================
  // PRIVATE SHAPE-SPECIFIC IMPLEMENTATIONS
  // ==========================================
  private static generateCircleVertices(center: PixeloidCoordinate, radius: number): PixeloidCoordinate[] {
    // Generate circle vertices for rendering (approximation)
    const segments = 32
    const vertices: PixeloidCoordinate[] = []
    
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * 2 * Math.PI
      vertices.push({
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius
      })
    }
    
    return vertices
  }
  
  private static generateRectangleVertices(center: PixeloidCoordinate, width: number, height: number): PixeloidCoordinate[] {
    const halfWidth = width / 2
    const halfHeight = height / 2
    
    return [
      { x: center.x - halfWidth, y: center.y - halfHeight }, // top-left
      { x: center.x + halfWidth, y: center.y - halfHeight }, // top-right
      { x: center.x + halfWidth, y: center.y + halfHeight }, // bottom-right
      { x: center.x - halfWidth, y: center.y + halfHeight }  // bottom-left
    ]
  }
  
  private static generateLineVertices(startPoint: PixeloidCoordinate, endPoint: PixeloidCoordinate): PixeloidCoordinate[] {
    return [startPoint, endPoint]
  }
  
  private static getExpectedVertexCount(type: ShapeType): number {
    switch (type) {
      case 'point': return 1
      case 'line': return 2
      case 'rectangle': return 4
      case 'diamond': return 4
      case 'circle': return 32 // Approximation segments
      default: return 0
    }
  }
}
```

### **Submodule 4: `systems/PreviewSystem.ts`**
```typescript
// Preview system using same methods + temporary data
import { GeometryHelper } from '../helpers/GeometryHelper'

export const PreviewSystem = {
  startPreview(store: GeometryStoreData, operation: 'create' | 'move' | 'resize', originalObjectId?: string): void {
    let previewObject: GeometricObject | null = null
    
    if (originalObjectId) {
      // Editing existing object - create copy for preview
      const originalObject = store.objects.find(obj => obj.id === originalObjectId)
      if (originalObject) {
        previewObject = { ...originalObject } // Shallow copy for preview
      }
    } else {
      // Creating new object - will be populated by updatePreview
      previewObject = null
    }
    
    store.preview = {
      isActive: true,
      previewObject,
      originalObjectId: originalObjectId || null
    }
  },
  
  updatePreview(store: GeometryStoreData, data: PreviewUpdateData): void {
    if (!store.preview.isActive) return
    
    switch (data.operation) {
      case 'create':
        // Create preview object using SAME geometry helper
        const vertices = GeometryHelper.generateVertices(data.type!, data.properties!)
        store.preview.previewObject = {
          id: 'preview',
          type: data.type!,
          vertices: vertices,
          bounds: GeometryHelper.calculateBounds(vertices),
          style: data.style!,
          isVisible: true,
          createdAt: Date.now()
        }
        break
        
      case 'move':
        if (store.preview.previewObject && data.newVertices) {
          // Use SAME movement logic as actual operations
          store.preview.previewObject.vertices = data.newVertices
          store.preview.previewObject.bounds = GeometryHelper.calculateBounds(data.newVertices)
        }
        break
        
      case 'resize':
        if (store.preview.previewObject && data.newDimensions) {
          // Use SAME geometry generation as actual operations
          const newVertices = GeometryHelper.generateVertices(
            store.preview.previewObject.type, 
            data.newDimensions
          )
          store.preview.previewObject.vertices = newVertices
          store.preview.previewObject.bounds = GeometryHelper.calculateBounds(newVertices)
        }
        break
    }
  },
  
  commitPreview(store: GeometryStoreData): void {
    if (!store.preview.isActive || !store.preview.previewObject) return
    
    if (store.preview.originalObjectId) {
      // Update existing object with preview data
      const objIndex = store.objects.findIndex(obj => obj.id === store.preview.originalObjectId)
      if (objIndex !== -1) {
        store.objects[objIndex] = {
          ...store.objects[objIndex],
          vertices: store.preview.previewObject.vertices,
          bounds: store.preview.previewObject.bounds
        }
      }
    } else {
      // Add new object
      const newObject = {
        ...store.preview.previewObject,
        id: `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
      store.objects.push(newObject)
    }
    
    this.clearPreview(store)
  },
  
  cancelPreview(store: GeometryStoreData): void {
    this.clearPreview(store)
  },
  
  private clearPreview(store: GeometryStoreData): void {
    store.preview = {
      isActive: false,
      previewObject: null,
      originalObjectId: null
    }
  }
}
```

---

## 🎯 **USAGE EXAMPLES**

### **Creating Objects (Drawing System)**
```typescript
// Drawing system integration
const handleDrawingFinish = (mode: DrawingMode, startPoint: PixeloidCoordinate, endPoint: PixeloidCoordinate) => {
  // Single entry point
  const objectId = geometryStore_methods.finishDrawing(mode, startPoint, endPoint)
  console.log('Created object:', objectId)
}
```

### **Moving Objects (Drag AND Edit Panel)**
```typescript
// Drag system
const handleDragMovement = (objectId: string, mousePos: PixeloidCoordinate, clickOffset: PixeloidCoordinate) => {
  const obj = geometryStore_methods.getObjectById(objectId)
  if (!obj) return
  
  // Calculate new vertices based on mouse position
  const offset = { x: mousePos.x - clickOffset.x, y: mousePos.y - clickOffset.y }
  const newVertices = GeometryHelper.moveVertices(obj.vertices, offset)
  
  // Single entry point for movement
  geometryStore_methods.moveObject(objectId, newVertices)
}

// Edit panel (SAME method)
const handleEditPanelMovement = (objectId: string, newCenter: PixeloidCoordinate, radius: number) => {
  // Generate new vertices from form data (forward calculation)
  const newVertices = GeometryHelper.generateVertices('circle', { center: newCenter, radius })
  
  // Same movement method as drag system
  geometryStore_methods.moveObject(objectId, newVertices)
}
```

### **Preview System**
```typescript
// Start preview for editing
geometryStore_methods.startPreview('move', objectId)

// Update preview as user types in edit panel
geometryStore_methods.updatePreview({
  operation: 'move',
  newVertices: newCalculatedVertices
})

// Commit when user clicks apply
geometryStore_methods.commitPreview()
```

---

## 🎯 **BENEFITS OF THIS ARCHITECTURE**

### **Single Entry Point**
- ✅ All CRUD operations through `geometryStore_methods`
- ✅ Easy to use from UI components
- ✅ Clear API surface
- ✅ No confusion about which method to call

### **Modular Under the Hood**
- ✅ `CreateActions` handles object creation
- ✅ `EditActions` handles modifications
- ✅ `GeometryHelper` handles all shape calculations
- ✅ `PreviewSystem` handles temporary states

### **Code Organization**
- ✅ Store can be bigger but stays organized
- ✅ Submodules keep related functionality together
- ✅ Clear separation of concerns
- ✅ Easy to test each submodule independently

### **Circle Bug Solution**
- ✅ Forward calculation only (no reverse engineering)
- ✅ Same geometry methods for preview and actual operations
- ✅ Form data used directly in preview system
- ✅ Consistent vertex generation across all operations

---

## 🔗 **FILE INTEGRATION**
- **Main**: `geometryStore.ts` (~200 lines) - Entry point + dispatch
- **Actions**: `actions/CreateActions.ts` (~100 lines) + `actions/EditActions.ts` (~100 lines)
- **Helpers**: `helpers/GeometryHelper.ts` (~200 lines) - Single geometry helper
- **Systems**: `systems/PreviewSystem.ts` (~100 lines) - Unified preview

**Total**: ~700 lines (down from 2977 lines = 76% reduction)

---

**This gives you the single entry point you wanted while keeping the codebase modular and maintainable!**