# Phase 2 Implementation Plan: Store Architecture Refactor

## 🎯 **Phase 2 Overview**

**Objective**: Transform the monolithic 1400+ line `gameStore.ts` into a clean ECS architecture with proper `dataLayer/mirrorLayer/meshSystem/filterPipeline` separation.

**Total Estimated Time**: 80 minutes
**Complexity**: High (Major architectural refactor)
**Risk**: Medium (Extensive changes but well-typed)

---

## 📋 **Phase 2 Implementation Breakdown**

### **Phase 2A: Data Layer Extraction** ⏱️ **20 minutes**
**Goal**: Extract all geometry-related data into a proper ECS data layer

#### **Step 2A1: Create Data Layer Structure** (5 minutes)
```typescript
// Target: Clean data layer with proper separation
dataLayer: {
  objects: GeometricObject[],           // From geometry.objects
  drawing: DrawingState,                // From geometry.drawing
  selection: SelectionState,            // From geometry.selection
  samplingWindow: SamplingWindowState,  // From cameraViewport (partial)
  state: DataLayerState,                // New
  config: DataLayerConfig               // New
}
```

**Implementation Steps**:
1. Add `dataLayer` section to store structure
2. Move `geometry.objects` → `dataLayer.objects`
3. Restructure `geometry.drawing` → `dataLayer.drawing`
4. Move `geometry.selection` → `dataLayer.selection`
5. Extract sampling window from `cameraViewport`

#### **Step 2A2: Update Data Layer Methods** (10 minutes)
**Target Methods to Update**:
- `addGeometricObject()` → `dataLayer.objects.push()`
- `removeGeometricObject()` → `dataLayer.objects.splice()`
- `setDrawingMode()` → `dataLayer.drawing.mode`
- `setSelectedObject()` → `dataLayer.selection.selectedObjectId`
- All geometry factory methods (`createPoint`, `createLine`, etc.)

#### **Step 2A3: Add Data Layer State Management** (5 minutes)
```typescript
// New data layer state tracking
dataLayer: {
  state: {
    isActive: boolean,
    needsUpdate: boolean,
    lastUpdate: number,
    objectCount: number,
    visibilityVersion: number
  },
  config: {
    maxObjects: number,
    enableOptimizations: boolean,
    samplingMode: 'precise' | 'fast'
  }
}
```

### **Phase 2B: Mirror Layer Extraction** ⏱️ **20 minutes**
**Goal**: Extract camera viewport and texture management into ECS mirror layer

#### **Step 2B1: Create Mirror Layer Structure** (5 minutes)
```typescript
// Target: Clean mirror layer with camera + textures
mirrorLayer: {
  cameraViewport: CameraViewportState,    // From cameraViewport (partial)
  textureCache: Map<string, MirrorTexture>, // From textureRegistry
  state: MirrorLayerState,                 // New
  config: MirrorLayerConfig                // New
}
```

**Implementation Steps**:
1. Add `mirrorLayer` section to store structure
2. Move camera viewport from `cameraViewport` → `mirrorLayer.cameraViewport`
3. Move `textureRegistry` → `mirrorLayer.textureCache`
4. Add mirror layer state and config

#### **Step 2B2: Update Mirror Layer Methods** (10 minutes)
**Target Methods to Update**:
- `setCameraViewportPosition()` → `mirrorLayer.cameraViewport.position`
- `setCameraViewportZoom()` → `mirrorLayer.cameraViewport.zoomLevel`
- `setObjectTexture()` → `mirrorLayer.textureCache.set()`
- `removeObjectTexture()` → `mirrorLayer.textureCache.delete()`
- `clearTextureCache()` → `mirrorLayer.textureCache.clear()`

#### **Step 2B3: Add Mirror Layer State Management** (5 minutes)
```typescript
// New mirror layer state tracking
mirrorLayer: {
  state: {
    isActive: boolean,
    needsUpdate: boolean,
    lastUpdate: number,
    textureCount: number,
    cacheVersion: number
  },
  config: {
    maxTextures: number,
    enableCaching: boolean,
    cacheStrategy: 'lru' | 'lfu'
  }
}
```

### **Phase 2C: Mesh System Unification** ⏱️ **15 minutes**
**Goal**: Unify `meshRegistry` + `staticMesh` into single ECS mesh system

#### **Step 2C1: Create Unified Mesh System** (5 minutes)
```typescript
// Target: Unified mesh system
meshSystem: {
  activeMesh: StaticMeshData | null,                    // From staticMesh.activeMesh
  meshCache: Map<number, StaticMeshData>,              // From staticMesh.meshCache
  coordinateMappings: Map<number, PixeloidVertexMapping>, // From staticMesh.coordinateMappings
  objectMeshes: Record<string, PixeloidMeshData>,      // From meshRegistry.objectMeshes
  state: MeshSystemState,                              // Unified
  config: MeshSystemConfig                             // Unified
}
```

#### **Step 2C2: Merge Mesh System Methods** (8 minutes)
**Target Methods to Update**:
- `setActiveMesh()` → `meshSystem.activeMesh`
- `setMeshData()` → `meshSystem.objectMeshes`
- `setCoordinateMapping()` → `meshSystem.coordinateMappings`
- `cacheStaticMesh()` → `meshSystem.meshCache`
- All mesh-related state methods

#### **Step 2C3: Add Unified Mesh State** (2 minutes)
```typescript
// Unified mesh system state
meshSystem: {
  state: {
    isActive: boolean,
    currentLevel: MeshLevel,
    needsUpdate: boolean,
    lastMeshUpdate: number,
    version: number
  },
  config: {
    oversizePercent: number,
    cacheMaxLevels: number,
    autoSwitchThreshold: number,
    enableGPUAcceleration: boolean,
    samplingMode: 'precise' | 'fast',
    maxPixeloidsPerObject: number
  }
}
```

### **Phase 2D: Filter Pipeline Creation** ⏱️ **15 minutes**
**Goal**: Create new ECS filter pipeline system

#### **Step 2D1: Create Filter Pipeline Structure** (5 minutes)
```typescript
// Target: New filter pipeline system
filterPipeline: {
  stages: {
    preFilters: FilterStage[],
    viewport: FilterStage,
    postFilters: FilterStage[]
  },
  state: FilterPipelineState,
  config: FilterPipelineConfig
}
```

#### **Step 2D2: Migrate Filter Effects** (5 minutes)
**Implementation Steps**:
1. Move `geometry.filterEffects` → `filterPipeline.config`
2. Create filter stages structure
3. Add pipeline state tracking

#### **Step 2D3: Add Filter Pipeline Methods** (5 minutes)
**Target Methods to Add**:
- `setPixelateFilterEnabled()` → `filterPipeline.config.enablePixelation`
- `addFilterStage()` → `filterPipeline.stages.preFilters.push()`
- `removeFilterStage()` → `filterPipeline.stages.preFilters.splice()`
- Pipeline processing methods

### **Phase 2E: Cross-System Coordination** ⏱️ **10 minutes**
**Goal**: Add system coordination and clean up remaining state

#### **Step 2E1: Add Coordination State** (5 minutes)
```typescript
// Target: Cross-system coordination
coordinationState: {
  currentZoomLevel: ZoomLevel,
  wasdTarget: 'dataLayer' | 'mirrorLayer',
  systemSyncVersion: number,
  lastCoordinationUpdate: number,
  needsSystemSync: boolean
}
```

#### **Step 2E2: Update WASD Routing** (3 minutes)
**Implementation Steps**:
1. Update `updateMovementECS()` to use `coordinationState.wasdTarget`
2. Add zoom-dependent target switching
3. Ensure proper system coordination

#### **Step 2E3: Clean Up Remaining State** (2 minutes)
**Implementation Steps**:
1. Move `geometry.layerVisibility` → `layerVisibility`
2. Ensure all state is properly organized
3. Remove any unused legacy state

---

## 🔧 **Implementation Strategy**

### **Migration Approach**
1. **Incremental Migration**: Migrate one subsystem at a time
2. **Maintain Compatibility**: Keep old methods during transition
3. **Gradual Deprecation**: Mark old methods as deprecated
4. **Full Validation**: Test each migration step

### **Data Safety**
1. **Backup Current State**: Preserve current structure during migration
2. **Validation Checks**: Ensure data integrity at each step
3. **Rollback Plan**: Ability to revert if issues arise
4. **Testing**: Comprehensive testing of each migration

### **Performance Optimization**
1. **Memory Layout**: Optimize for better memory locality
2. **Access Patterns**: Group related data together
3. **Cache Efficiency**: Improve cache hit rates
4. **Bundle Size**: Maintain or reduce bundle size

---

## 📊 **Detailed Implementation Steps**

### **Step-by-Step Migration Guide**

#### **Phase 2A: Data Layer Extraction**
```typescript
// Step 1: Add data layer structure
dataLayer: {
  objects: gameStore.geometry.objects,
  drawing: {
    mode: gameStore.geometry.drawing.mode,
    activeDrawing: gameStore.geometry.drawing.activeDrawing,
    preview: gameStore.geometry.drawing.preview,
    settings: gameStore.geometry.drawing.settings
  },
  selection: {
    selectedObjectId: gameStore.geometry.selection.selectedObjectId,
    isEditPanelOpen: gameStore.geometry.selection.isEditPanelOpen
  },
  samplingWindow: {
    position: gameStore.cameraViewport.geometry_sampling_position,
    bounds: gameStore.cameraViewport.geometry_layer_bounds
  },
  state: {
    isActive: true,
    needsUpdate: false,
    lastUpdate: Date.now(),
    objectCount: gameStore.geometry.objects.length,
    visibilityVersion: 1
  },
  config: {
    maxObjects: 10000,
    enableOptimizations: true,
    samplingMode: 'precise'
  }
}

// Step 2: Update methods
setDrawingMode: (mode) => {
  gameStore.dataLayer.drawing.mode = mode
  gameStore.dataLayer.state.needsUpdate = true
}

addGeometricObject: (object) => {
  gameStore.dataLayer.objects.push(object)
  gameStore.dataLayer.state.objectCount++
  gameStore.dataLayer.state.needsUpdate = true
}
```

#### **Phase 2B: Mirror Layer Extraction**
```typescript
// Step 1: Add mirror layer structure
mirrorLayer: {
  cameraViewport: {
    position: gameStore.cameraViewport.viewport_position,
    zoomLevel: gameStore.cameraViewport.zoom_factor,
    bounds: calculateViewportBounds(),
    isPanning: gameStore.cameraViewport.is_panning,
    panStartPosition: gameStore.cameraViewport.pan_start_position
  },
  textureCache: new Map(Object.entries(gameStore.textureRegistry.objectTextures)),
  state: {
    isActive: true,
    needsUpdate: false,
    lastUpdate: Date.now(),
    textureCount: gameStore.textureRegistry.stats.totalTextures,
    cacheVersion: 1
  },
  config: {
    maxTextures: 1000,
    enableCaching: true,
    cacheStrategy: 'lru'
  }
}

// Step 2: Update methods
setCameraViewportPosition: (position) => {
  gameStore.mirrorLayer.cameraViewport.position = position
  gameStore.mirrorLayer.state.needsUpdate = true
}

setObjectTexture: (objectId, textureData) => {
  gameStore.mirrorLayer.textureCache.set(objectId, textureData)
  gameStore.mirrorLayer.state.textureCount++
  gameStore.mirrorLayer.state.needsUpdate = true
}
```

#### **Phase 2C: Mesh System Unification**
```typescript
// Step 1: Create unified mesh system
meshSystem: {
  activeMesh: gameStore.staticMesh.activeMesh,
  meshCache: gameStore.staticMesh.meshCache,
  coordinateMappings: gameStore.staticMesh.coordinateMappings,
  objectMeshes: gameStore.meshRegistry.objectMeshes,
  state: {
    isActive: true,
    currentLevel: gameStore.staticMesh.stats.activeMeshLevel,
    needsUpdate: false,
    lastMeshUpdate: Math.max(
      gameStore.staticMesh.stats.lastMeshSwitch,
      gameStore.meshRegistry.stats.lastMeshUpdate
    ),
    version: 1
  },
  config: {
    oversizePercent: gameStore.staticMesh.config.oversizePercent,
    cacheMaxLevels: gameStore.staticMesh.config.cacheMaxLevels,
    autoSwitchThreshold: gameStore.staticMesh.config.autoSwitchThreshold,
    enableGPUAcceleration: true,
    samplingMode: gameStore.meshRegistry.meshSettings.samplingMode,
    maxPixeloidsPerObject: gameStore.meshRegistry.meshSettings.maxPixeloidsPerObject
  }
}

// Step 2: Update methods
setActiveMesh: (meshData) => {
  gameStore.meshSystem.activeMesh = meshData
  gameStore.meshSystem.state.currentLevel = meshData.resolution.level
  gameStore.meshSystem.state.needsUpdate = true
}
```

#### **Phase 2D: Filter Pipeline Creation**
```typescript
// Step 1: Create filter pipeline
filterPipeline: {
  stages: {
    preFilters: [],
    viewport: {
      name: 'viewport',
      type: 'viewport',
      enabled: true,
      order: 0
    },
    postFilters: [
      {
        name: 'pixelation',
        type: 'pixelation',
        enabled: gameStore.geometry.filterEffects.pixelate,
        order: 1
      }
    ]
  },
  state: {
    isActive: true,
    currentStage: null,
    isProcessing: false,
    lastExecution: Date.now(),
    executionCount: 0,
    needsUpdate: false,
    pipelineVersion: 1
  },
  config: {
    enablePixelation: gameStore.geometry.filterEffects.pixelate,
    enableSelection: true,
    enableHighlight: true,
    enableBoundingBox: gameStore.geometry.layerVisibility.bbox
  }
}

// Step 2: Update methods
setPixelateFilterEnabled: (enabled) => {
  gameStore.filterPipeline.config.enablePixelation = enabled
  gameStore.filterPipeline.stages.postFilters[0].enabled = enabled
  gameStore.filterPipeline.state.needsUpdate = true
}
```

#### **Phase 2E: Cross-System Coordination**
```typescript
// Step 1: Add coordination state
coordinationState: {
  currentZoomLevel: gameStore.cameraViewport.zoom_factor,
  wasdTarget: gameStore.cameraViewport.zoom_factor === 1 ? 'dataLayer' : 'mirrorLayer',
  systemSyncVersion: 1,
  lastCoordinationUpdate: Date.now(),
  needsSystemSync: false
}

// Step 2: Update WASD routing
updateMovementECS: (deltaX, deltaY) => {
  const target = gameStore.coordinationState.wasdTarget
  
  if (target === 'dataLayer') {
    // Move data layer sampling window
    const currentPos = gameStore.dataLayer.samplingWindow.position
    gameStore.dataLayer.samplingWindow.position = {
      x: currentPos.x + deltaX,
      y: currentPos.y + deltaY
    }
  } else {
    // Move mirror layer camera viewport
    const currentPos = gameStore.mirrorLayer.cameraViewport.position
    gameStore.mirrorLayer.cameraViewport.position = {
      x: currentPos.x + deltaX,
      y: currentPos.y + deltaY
    }
  }
  
  gameStore.coordinationState.lastCoordinationUpdate = Date.now()
}
```

---

## 🎯 **Validation and Testing**

### **Migration Validation**
1. **Data Integrity**: Ensure all data is properly migrated
2. **Method Functionality**: All methods work with new structure
3. **Type Safety**: Full TypeScript compilation
4. **Performance**: No performance regression

### **Testing Strategy**
1. **Unit Tests**: Test each migrated method
2. **Integration Tests**: Test cross-system coordination
3. **E2E Tests**: Test complete user workflows
4. **Performance Tests**: Ensure no regression

### **Rollback Plan**
1. **Backup Strategy**: Keep old structure during migration
2. **Rollback Points**: Clear rollback points for each phase
3. **Quick Recovery**: Ability to quickly revert changes
4. **Data Recovery**: Ensure no data loss during rollback

---

## 🚀 **Success Criteria**

### **Phase 2A Success** ✅
- [ ] All geometry data moved to `dataLayer`
- [ ] All data layer methods work correctly
- [ ] Data layer state tracking functional
- [ ] No regression in geometry functionality

### **Phase 2B Success** ✅
- [ ] Camera viewport moved to `mirrorLayer`
- [ ] Texture cache moved to `mirrorLayer`
- [ ] Mirror layer state tracking functional
- [ ] No regression in camera/texture functionality

### **Phase 2C Success** ✅
- [ ] Mesh systems unified into `meshSystem`
- [ ] All mesh methods work correctly
- [ ] Unified mesh state tracking functional
- [ ] No regression in mesh functionality

### **Phase 2D Success** ✅
- [ ] Filter pipeline created and functional
- [ ] Filter effects migrated correctly
- [ ] Pipeline state tracking functional
- [ ] Filter functionality preserved

### **Phase 2E Success** ✅
- [ ] Cross-system coordination working
- [ ] WASD routing works correctly
- [ ] System synchronization functional
- [ ] All state properly organized

### **Overall Phase 2 Success** ✅
- [ ] Clean ECS architecture implemented
- [ ] All systems properly separated
- [ ] Type safety maintained
- [ ] Performance maintained or improved
- [ ] All functionality preserved

---

## 📋 **Implementation Timeline**

| Phase | Duration | Description | Deliverables |
|-------|----------|-------------|--------------|
| **2A** | 20 min | Data Layer Extraction | Clean data layer with all geometry data |
| **2B** | 20 min | Mirror Layer Extraction | Clean mirror layer with camera + textures |
| **2C** | 15 min | Mesh System Unification | Unified mesh system |
| **2D** | 15 min | Filter Pipeline Creation | New filter pipeline system |
| **2E** | 10 min | Cross-System Coordination | System coordination and cleanup |

**Total Time**: 80 minutes
**Complexity**: High
**Risk Level**: Medium

---

## 🔄 **Next Steps After Phase 2**

### **Phase 3: UI Integration**
- Create UI hooks for new store structure
- Update UI components to use new architecture
- Add debugging panels for each ECS system

### **Phase 4: Core Implementation**
- Implement actual ECS layer rendering
- Add proper system coordination
- Optimize performance with new architecture

### **Phase 5: Feature Implementation**
- Implement remaining features
- Add advanced capabilities
- Polish and optimize

**Phase 2 is the foundation** - without this architectural refactor, the remaining phases cannot be implemented correctly. This phase transforms the codebase from a monolithic structure to a clean, maintainable ECS architecture that supports the dual-layer system.
