# 🧹 Complete Bbox Test Layer Cleanup Plan

## 🚨 **COMPLETE CLEANUP: Remove ALL Texture Capture System**

### **❌ REMOVE: GeometryRenderer Texture Capture**

#### **GeometryRenderer.ts:**
```typescript
// ❌ REMOVE Line 136:
this.captureAndStoreTexture(obj.id, objectContainer)

// ❌ REMOVE entire method (lines ~600-650):
private captureAndStoreTexture(objectId: string, objectContainer: Container): void {
  // Remove entire method
}

// ❌ REMOVE renderer and app properties (lines ~32-34):
private renderer!: Renderer
private app: any = null
private initialized = false

// ❌ REMOVE init method parameters and app storage:
public init(renderer: Renderer, app?: any): void {
  // Change back to: public init(renderer: Renderer): void
  // Remove app storage
}
```

### **❌ REMOVE: Store Texture System**

#### **types/index.ts:**
```typescript
// ❌ REMOVE these interfaces:
export interface RenderingTextureData {
  // Remove entire interface
}

export interface RenderingTextureRegistryState {
  // Remove entire interface
}

// ❌ REMOVE from GameState:
renderingTextures: RenderingTextureRegistryState
```

#### **gameStore.ts:**
```typescript
// ❌ REMOVE from state:
renderingTextures: {
  objectTextures: {},
  stats: {
    totalTextures: 0,
    lastCaptureTime: 0
  }
}

// ❌ REMOVE these methods:
setRenderingTexture()
getRenderingTexture()
removeRenderingTexture()
clearRenderingTextures()
hasRenderingTexture()

// ❌ REMOVE texture cleanup from deleteGeometricObject():
updateGameStore.removeRenderingTexture(objectId)
```

### **❌ REMOVE: BboxTextureTestRenderer Store Dependencies**

#### **BboxTextureTestRenderer.ts:**
```typescript
// ❌ REMOVE store import:
import { updateGameStore } from '../store/gameStore'

// ❌ REMOVE store-based texture retrieval:
const textureData = updateGameStore.getRenderingTexture(obj.id)

// ❌ SIMPLIFY to basic sprite creation without textures
```

### **❌ REMOVE: LayeredInfiniteCanvas Dependencies**

#### **LayeredInfiniteCanvas.ts:**
```typescript
// ❌ REMOVE app parameter from init:
this.geometryRenderer.init(this.app.renderer, this.app)
// Change to: this.geometryRenderer.init(this.app.renderer)
```

## ✅ **KEEP: Minimal Layer Infrastructure**

### **✅ KEEP: UI Layer (Ready for Future)**
- **LayerToggleBar.ts**: "BBox Test" toggle button ✅
- **Layer visibility**: `gameStore.geometry.layerVisibility.bboxTest` ✅
- **Event handling**: Click handlers ✅

### **✅ KEEP: Layer Container System**
- **LayeredInfiniteCanvas.ts**: `bboxTestLayer` container ✅
- **Render method**: `renderBboxTestLayer()` (simplified) ✅
- **Layer hierarchy**: Proper z-order in scene ✅

### **✅ KEEP: Basic Renderer Shell**
- **BboxTextureTestRenderer.ts**: Basic class structure ✅
- **Container management**: Sprite container ready ✅
- **Coordinate system**: Vertex space calculations ✅

## 🎯 **CLEAN RESULT**

### **✅ After Cleanup:**
- **No PIXI.js errors** - All texture capture removed
- **Working application** - Stable rendering pipeline
- **Functional UI** - Toggle button works (shows empty layer)
- **Clean architecture** - Ready for future texture solution

### **❌ Removed Completely:**
- **Texture capture** - All generation methods
- **Store texture system** - All related state and methods
- **Texture dependencies** - All imports and usage

### **🔧 Ready for Future Work:**
- **Layer infrastructure** - Container and rendering ready
- **UI integration** - Toggle and visibility system
- **Coordinate system** - Vertex space calculations
- **Basic renderer** - Shell ready for implementation

## 📋 **POST-CLEANUP STATUS**
```
✅ UI Toggle:           100% Working
✅ Layer Container:     100% Working  
✅ Coordinate System:   100% Working
✅ Basic Infrastructure: 100% Working
❌ Texture System:      100% Removed
❌ Store Integration:   100% Removed
❌ PIXI.js Corruption:  100% Eliminated
```

**Result: Clean, working bbox test layer infrastructure ready for future texture implementation that doesn't corrupt PIXI.js.**