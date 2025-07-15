# Phase 2 Store Architecture Analysis

## 🎯 **Current Store Architecture Issues**

### **Critical Problems Identified**
1. **Monolithic Structure**: 1400+ lines, everything mixed together
2. **Missing ECS Architecture**: No clear `dataLayer/mirrorLayer/meshSystem/filterPipeline` separation
3. **Mixed Concerns**: Data and logic intertwined
4. **Legacy Systems**: Multiple overlapping systems (meshRegistry + staticMesh)
5. **No Cross-System Coordination**: Systems don't know about each other

---

## 📊 **Current Store Structure Analysis**

### **Current Structure** (❌ **PROBLEMATIC**)
```typescript
export const gameStore = proxy<GameState>({
  // Basic game state
  isInitialized: false,
  isLoading: true,
  currentScene: 'menu',
  windowWidth: window.innerWidth,
  windowHeight: window.innerHeight,
  
  // ❌ Partial ECS implementation
  cameraViewport: {
    viewport_position: PixeloidCoordinate,
    geometry_sampling_position: PixeloidCoordinate,
    zoom_factor: 10,
    geometry_layer_bounds: {...},
    geometry_layer_scale: 1,
    is_panning: false,
    pan_start_position: PixeloidCoordinate
  },
  
  // ❌ Mixed systems without clear separation
  mouse: { screen_position, vertex_position, pixeloid_position },
  input: { keys: { w, a, s, d, space } },
  
  // ❌ Massive geometry section (300+ lines)
  geometry: {
    objects: [],
    drawing: { mode, activeDrawing, preview, settings },
    raycast: { activeRaycasts, settings },
    anchoring: { defaults, objectOverrides },
    layerVisibility: { background, geometry, selection, raycast, bbox, mirror, mouse },
    filterEffects: { pixelate },
    selection: { selectedObjectId, isEditPanelOpen },
    clipboard: { copiedObject },
    favorites: { favoriteObjectIds },
    scaleTracking: { minCreationScale, maxCreationScale, SCALE_SPAN_LIMIT }
  },
  
  // ❌ Separate texture registry (should be in mirrorLayer)
  textureRegistry: {
    objectTextures: {},
    stats: { totalTextures, lastCaptureTime }
  },
  
  // ❌ Separate mesh registry (should be unified)
  meshRegistry: {
    objectMeshes: {},
    meshSettings: { samplingMode, maxPixeloidsPerObject, enableDebugVisualization },
    stats: { totalMeshes, totalPixeloids, lastMeshUpdate }
  },
  
  // ❌ Separate static mesh (should be unified)
  staticMesh: {
    activeMesh: null,
    meshCache: Map(),
    coordinateMappings: Map(),
    config: { oversizePercent, cacheMaxLevels, autoSwitchThreshold },
    stats: { activeMeshLevel, totalCachedMeshes, totalCachedMappings, lastMeshSwitch, coordinateMappingUpdates }
  }
})
```

### **Issues with Current Structure**

| Issue | Description | Impact |
|-------|-------------|---------|
| **No `dataLayer`** | Geometry data scattered throughout | Cannot implement ECS data layer |
| **No `mirrorLayer`** | Camera + textures not unified | Cannot implement ECS mirror layer |
| **No `meshSystem`** | Split between meshRegistry + staticMesh | Cannot implement unified mesh system |
| **No `filterPipeline`** | No filter pipeline structure | Cannot implement filter effects |
| **Mixed Concerns** | Data and logic intertwined | Hard to maintain and debug |
| **Legacy Systems** | Multiple overlapping systems | Performance issues and confusion |
| **No Coordination** | Systems don't coordinate | WASD routing broken, zoom inconsistent |

---

## 🎯 **Phase 2 Target Architecture**

### **New ECS Store Structure** (✅ **TARGET**)
```typescript
export const gameStore = proxy<GameState>({
  // ✅ Core game state (minimal)
  isInitialized: false,
  isLoading: true,
  currentScene: 'menu',
  windowWidth: window.innerWidth,
  windowHeight: window.innerHeight,
  
  // ✅ ECS Data Layer (Geometry + Sampling)
  dataLayer: {
    // Geometry data (moved from geometry.objects)
    objects: GeometricObject[],
    
    // Drawing state (moved from geometry.drawing)
    drawing: {
      mode: DrawingMode,
      activeDrawing: ActiveDrawingState,
      preview: PreviewState | null,
      settings: DrawingSettings
    },
    
    // Selection state (moved from geometry.selection)
    selection: {
      selectedObjectId: string | null,
      isEditPanelOpen: boolean
    },
    
    // Sampling window (extracted from cameraViewport)
    samplingWindow: {
      position: PixeloidCoordinate,
      bounds: {
        width: number,
        height: number,
        minX: number,
        maxX: number,
        minY: number,
        maxY: number
      }
    },
    
    // Data layer state
    state: {
      isActive: boolean,
      needsUpdate: boolean,
      lastUpdate: number,
      objectCount: number,
      visibilityVersion: number
    },
    
    // Configuration
    config: {
      maxObjects: number,
      enableOptimizations: boolean,
      samplingMode: 'precise' | 'fast'
    }
  },
  
  // ✅ ECS Mirror Layer (Camera + Textures)
  mirrorLayer: {
    // Camera viewport (extracted from cameraViewport)
    cameraViewport: {
      position: PixeloidCoordinate,
      zoomLevel: ZoomLevel,
      bounds: ViewportBounds,
      isPanning: boolean,
      panStartPosition: PixeloidCoordinate
    },
    
    // Texture cache (moved from textureRegistry)
    textureCache: Map<string, MirrorTexture>,
    
    // Mirror layer state
    state: {
      isActive: boolean,
      needsUpdate: boolean,
      lastUpdate: number,
      textureCount: number,
      cacheVersion: number
    },
    
    // Configuration
    config: {
      maxTextures: number,
      enableCaching: boolean,
      cacheStrategy: 'lru' | 'lfu'
    }
  },
  
  // ✅ ECS Mesh System (Unified from meshRegistry + staticMesh)
  meshSystem: {
    // Active mesh data (from staticMesh.activeMesh)
    activeMesh: StaticMeshData | null,
    
    // Mesh cache (from staticMesh.meshCache)
    meshCache: Map<number, StaticMeshData>,
    
    // Coordinate mappings (from staticMesh.coordinateMappings)
    coordinateMappings: Map<number, PixeloidVertexMapping>,
    
    // Object meshes (from meshRegistry.objectMeshes)
    objectMeshes: Record<string, PixeloidMeshData>,
    
    // Mesh system state (unified)
    state: {
      isActive: boolean,
      currentLevel: MeshLevel,
      needsUpdate: boolean,
      lastMeshUpdate: number,
      version: number
    },
    
    // Configuration (unified)
    config: {
      oversizePercent: number,
      cacheMaxLevels: number,
      autoSwitchThreshold: number,
      enableGPUAcceleration: boolean,
      samplingMode: 'precise' | 'fast',
      maxPixeloidsPerObject: number
    }
  },
  
  // ✅ ECS Filter Pipeline (New system)
  filterPipeline: {
    // Filter stages
    stages: {
      preFilters: FilterStage[],
      viewport: FilterStage,
      postFilters: FilterStage[]
    },
    
    // Pipeline state
    state: {
      isActive: boolean,
      currentStage: FilterStage | null,
      isProcessing: boolean,
      lastExecution: number,
      executionCount: number,
      needsUpdate: boolean,
      pipelineVersion: number
    },
    
    // Configuration
    config: {
      enablePixelation: boolean,
      enableSelection: boolean,
      enableHighlight: boolean,
      enableBoundingBox: boolean
    }
  },
  
  // ✅ Cross-system coordination
  coordinationState: {
    currentZoomLevel: ZoomLevel,
    wasdTarget: 'dataLayer' | 'mirrorLayer',
    systemSyncVersion: number,
    lastCoordinationUpdate: number,
    needsSystemSync: boolean
  },
  
  // ✅ Shared input state
  mouse: {
    screen_position: { x: number, y: number },
    vertex_position: { x: number, y: number },
    pixeloid_position: PixeloidCoordinate
  },
  
  input: {
    keys: {
      w: boolean,
      a: boolean,
      s: boolean,
      d: boolean,
      space: boolean
    }
  },
  
  // ✅ Layer visibility (moved from geometry.layerVisibility)
  layerVisibility: {
    background: boolean,
    geometry: boolean,
    selection: boolean,
    raycast: boolean,
    bbox: boolean,
    mirror: boolean,
    mouse: boolean
  }
})
```

---

## 🔄 **Migration Strategy**

### **Phase 2A: Data Layer Extraction** (20 minutes)
- Extract geometry data from `geometry.objects` → `dataLayer.objects`
- Extract drawing state from `geometry.drawing` → `dataLayer.drawing`
- Extract selection state from `geometry.selection` → `dataLayer.selection`
- Extract sampling window from `cameraViewport` → `dataLayer.samplingWindow`
- Add `dataLayer.state` and `dataLayer.config`

### **Phase 2B: Mirror Layer Extraction** (20 minutes)
- Extract camera viewport from `cameraViewport` → `mirrorLayer.cameraViewport`
- Move texture cache from `textureRegistry` → `mirrorLayer.textureCache`
- Add `mirrorLayer.state` and `mirrorLayer.config`

### **Phase 2C: Mesh System Unification** (15 minutes)
- Unify `meshRegistry` + `staticMesh` → `meshSystem`
- Merge configurations and state
- Add unified `meshSystem.config`

### **Phase 2D: Filter Pipeline Creation** (15 minutes)
- Create new `filterPipeline` structure
- Move filter effects from `geometry.filterEffects` → `filterPipeline.config`
- Add pipeline stages and state

### **Phase 2E: Cross-System Coordination** (10 minutes)
- Add `coordinationState` for system coordination
- Move shared state to appropriate locations
- Add system synchronization logic

---

## 🎯 **Expected Benefits**

### **Architectural Benefits**
1. **Clear Separation**: Each ECS system has its own section
2. **Type Safety**: Full TypeScript support with new types
3. **Maintainability**: Smaller, focused sections
4. **Performance**: Better memory layout and caching
5. **Debugging**: Clear system boundaries

### **Functional Benefits**
1. **Dual-Layer System**: Proper data/mirror layer separation
2. **WASD Routing**: Correct zoom-dependent routing
3. **System Coordination**: Synchronized cross-system updates
4. **Filter Pipeline**: Proper rendering effect pipeline
5. **Unified Mesh**: Single mesh system instead of multiple

### **Development Benefits**
1. **Clear APIs**: Each system has defined interfaces
2. **Easier Testing**: Systems can be tested independently
3. **Better Documentation**: Self-documenting structure
4. **Future-Proof**: Easy to add new features
5. **Team Collaboration**: Clear ownership of sections

---

## 📋 **Implementation Checklist**

### **Phase 2A: Data Layer Extraction** ✅
- [ ] Extract `geometry.objects` → `dataLayer.objects`
- [ ] Extract `geometry.drawing` → `dataLayer.drawing`
- [ ] Extract `geometry.selection` → `dataLayer.selection`
- [ ] Extract sampling window → `dataLayer.samplingWindow`
- [ ] Add `dataLayer.state` and `dataLayer.config`
- [ ] Update all references to use new structure

### **Phase 2B: Mirror Layer Extraction** ✅
- [ ] Extract camera viewport → `mirrorLayer.cameraViewport`
- [ ] Move `textureRegistry` → `mirrorLayer.textureCache`
- [ ] Add `mirrorLayer.state` and `mirrorLayer.config`
- [ ] Update all references to use new structure

### **Phase 2C: Mesh System Unification** ✅
- [ ] Unify `meshRegistry` + `staticMesh` → `meshSystem`
- [ ] Merge configurations and state
- [ ] Add unified `meshSystem.config`
- [ ] Update all references to use new structure

### **Phase 2D: Filter Pipeline Creation** ✅
- [ ] Create new `filterPipeline` structure
- [ ] Move filter effects → `filterPipeline.config`
- [ ] Add pipeline stages and state
- [ ] Update all references to use new structure

### **Phase 2E: Cross-System Coordination** ✅
- [ ] Add `coordinationState` for system coordination
- [ ] Move shared state to appropriate locations
- [ ] Add system synchronization logic
- [ ] Update all references to use new structure

---

## 🔧 **Technical Implementation Details**

### **Data Migration Strategy**
1. **Incremental Migration**: Migrate one section at a time
2. **Backward Compatibility**: Keep old structure during migration
3. **Validation**: Ensure data integrity during migration
4. **Testing**: Test each migration step thoroughly

### **API Surface Changes**
1. **New Paths**: All access paths will change
2. **New Methods**: System-specific methods
3. **Deprecated Methods**: Mark old methods as deprecated
4. **Migration Guide**: Provide clear migration guide

### **Performance Considerations**
1. **Memory Layout**: Better memory locality
2. **Cache Efficiency**: Improved cache usage
3. **Bundle Size**: Potentially smaller bundle
4. **Runtime Performance**: Better runtime performance

---

## 🚀 **Phase 2 Success Criteria**

### **Functional Success**
- [ ] All ECS systems have separate sections
- [ ] Dual-layer system works correctly
- [ ] WASD routing works correctly
- [ ] Cross-system coordination works
- [ ] All existing functionality preserved

### **Technical Success**
- [ ] Clean TypeScript compilation
- [ ] All tests pass
- [ ] Performance maintained or improved
- [ ] Memory usage optimized
- [ ] Bundle size maintained

### **Architectural Success**
- [ ] Clear separation of concerns
- [ ] Type-safe system interfaces
- [ ] Maintainable codebase
- [ ] Future-proof architecture
- [ ] Self-documenting structure

---

## 📊 **Impact Assessment**

### **Before Phase 2**
- **Store Structure**: Monolithic (1400+ lines)
- **System Separation**: Mixed concerns
- **Type Safety**: Partial
- **Maintainability**: Poor
- **Performance**: Suboptimal

### **After Phase 2**
- **Store Structure**: Clean ECS sections
- **System Separation**: Clear boundaries
- **Type Safety**: Complete
- **Maintainability**: Excellent
- **Performance**: Optimized

**Phase 2 represents a fundamental architectural transformation** - from a monolithic store to a clean, well-separated ECS architecture that properly supports the dual-layer system.

This refactor is essential for the success of the remaining phases and the overall system architecture.
