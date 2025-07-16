# Phase 3B Store Extension Plan

## 📊 **Current State Assessment**

### **✅ EXCELLENT: Clean Import Structure**
- No gameStore_3a imports in any 3B files
- gameStore_3b.ts is properly implemented with Phase 3B structure
- All UI components use gameStore_3b references
- Only 1 minor comment needs updating

### **✅ GOOD: Existing Store Features**
Current gameStore_3b.ts includes:
- Mesh-first coordinate system (vertex, screen, world)
- Basic geometry object support
- Navigation system with WASD
- UI controls (grid, mouse, store panel)
- ECS type imports ready

### **❌ MISSING: Phase 3B Geometry Features**
Based on the documentation analysis, we need to add:
- **Drawing System** (modes, preview, settings)
- **Style System** (stroke/fill controls) 
- **ECS Data Layer Integration** (complete sampling system)
- **Geometry Panel UI State**
- **Advanced Geometry Operations**

---

## 🎯 **Extension Strategy**

### **STEP 1: Extend gameStore_3b Interface**

**Current Structure:**
```typescript
interface GameState3b {
  phase: '3b'
  mouse: { screen, vertex, world }
  navigation: { offset, isDragging, moveAmount }
  geometry: { objects, selectedId }  // ✅ Basic
  mesh: { vertexData, cellSize, dimensions, needsUpdate }
  ui: { showGrid, showMouse, showStorePanel, showLayerToggle, ... }
}
```

**Required Extensions:**
```typescript
interface GameState3b {
  // ... existing properties

  // ADD: ECS Data Layer Integration
  ecsDataLayer: ECSDataLayer,
  
  // ADD: Drawing System
  drawing: {
    mode: 'none' | 'point' | 'line' | 'circle' | 'rectangle' | 'diamond',
    preview: PreviewObject | null,
    settings: DrawingSettings,
    isDrawing: boolean,
    startPoint: PixeloidCoordinate | null
  },
  
  // ADD: Style System
  style: {
    defaultColor: number,
    defaultStrokeWidth: number,
    defaultFillColor: number,
    fillEnabled: boolean,
    strokeAlpha: number,
    fillAlpha: number
  },
  
  // ADD: Selection System
  selection: {
    selectedObjectId: string | null,
    highlightEnabled: boolean,
    selectionBounds: ECSBoundingBox | null
  },
  
  // EXTEND: UI State
  ui: {
    // ... existing ui properties
    showGeometry: boolean,
    showGeometryPanel: boolean,
    geometryPanel: {
      isOpen: boolean,
      currentTab: 'draw' | 'style' | 'objects',
      currentDrawingMode: 'none' | 'point' | 'line' | 'circle' | 'rectangle' | 'diamond'
    }
  }
}
```

### **STEP 2: Create Missing Types**

**Missing Types Needed:**
```typescript
// 1. Preview System
interface PreviewObject {
  type: GeometricObject['type']
  vertices: PixeloidCoordinate[]
  style: GeometricObject['style']
  isValid: boolean
}

// 2. Drawing Settings
interface DrawingSettings {
  snapToGrid: boolean
  showPreview: boolean
  enableAnchors: boolean
  previewOpacity: number
}

// 3. Anchor System
interface AnchorPoint {
  position: PixeloidCoordinate
  type: 'corner' | 'midpoint' | 'center'
  isActive: boolean
}
```

### **STEP 3: Add Store Methods**

**Required Methods for gameStore_3b_methods:**
```typescript
// Drawing Methods
setDrawingMode: (mode: 'none' | 'point' | 'line' | 'circle' | 'rectangle' | 'diamond') => void,
startDrawing: (startPoint: PixeloidCoordinate) => void,
updateDrawingPreview: (currentPoint: PixeloidCoordinate) => void,
finishDrawing: () => void,
cancelDrawing: () => void,

// Style Methods
setStrokeColor: (color: number) => void,
setFillColor: (color: number) => void,
setStrokeWidth: (width: number) => void,
setFillEnabled: (enabled: boolean) => void,
setStrokeAlpha: (alpha: number) => void,
setFillAlpha: (alpha: number) => void,

// Selection Methods
selectObject: (objectId: string) => void,
clearSelection: () => void,
deleteSelected: () => void,

// ECS Methods
addGeometryObject: (type: GeometricObject['type']) => string,
removeGeometryObject: (objectId: string) => void,
clearAllGeometry: () => void,
getGeometryStats: () => GeometryStats,

// Geometry Panel Methods
toggleGeometryPanel: () => void,
setGeometryPanelTab: (tab: 'draw' | 'style' | 'objects') => void,
setCurrentDrawingMode: (mode: GeometricObject['type']) => void
```

---

## 🚀 **Implementation Priority**

### **Phase 1: Essential Extensions (High Priority)**
1. **Add ECS Data Layer integration** (use existing ECS types)
2. **Add basic drawing system** (modes, preview)
3. **Add style system** (stroke/fill controls)
4. **Add geometry panel UI state**

### **Phase 2: Advanced Features (Medium Priority)**
1. **Add anchor system** for precise positioning
2. **Add advanced selection features**
3. **Add geometry manipulation tools**
4. **Add geometry statistics and debug info**

### **Phase 3: Polish & Optimization (Low Priority)**
1. **Add drawing shortcuts**
2. **Add geometry copy/paste**
3. **Add geometry grouping**
4. **Add geometry snapping**

---

## 📋 **Implementation Checklist**

### **✅ Prerequisites (Complete)**
- [x] Import audit completed (no issues found)
- [x] gameStore_3b.ts properly structured
- [x] ECS types available and ready
- [x] Basic geometry support working

### **🔧 Next Steps (Ready to implement)**
- [ ] Create missing types (PreviewObject, DrawingSettings, AnchorPoint)
- [ ] Extend gameStore_3b interface with new features
- [ ] Add store methods for geometry operations
- [ ] Test extended store works with existing 3B system
- [ ] Update helper files to use extended store
- [ ] Create GeometryRenderer_3b using extended store
- [ ] Create GeometryPanel_3b using extended store

---

## 🎯 **Success Criteria**

### **When Phase 3B Store Extension is Complete:**
- ✅ All missing types created and documented
- ✅ gameStore_3b extended with geometry features
- ✅ Store methods support all 5 geometry types
- ✅ Drawing system with preview functionality
- ✅ Style system with stroke/fill controls
- ✅ Selection system with highlighting
- ✅ Geometry panel UI state management
- ✅ ECS data layer integration working
- ✅ All existing 3B functionality preserved
- ✅ No TypeScript compilation errors

### **Ready for Next Phase:**
- ✅ GeometryRenderer_3b implementation
- ✅ GeometryPanel_3b implementation
- ✅ Helper files integration
- ✅ Complete Phase 3B geometry layer functionality

The store extension will provide the foundation for implementing the complete Phase 3B geometry system with all 5 geometry types, drawing controls, and ECS integration.