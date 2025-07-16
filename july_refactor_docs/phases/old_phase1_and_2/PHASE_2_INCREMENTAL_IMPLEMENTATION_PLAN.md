# Phase 2 Incremental Implementation Plan

## 🎯 **Implementation Strategy: Architect ↔ Code Validation Cycles**

**Goal**: Break down the Phase 2 store implementation into manageable sub-phases, each with architect → code → architect validation cycles, following the successful Phase 1 pattern.

**Context**: We have a validated architecture plan that is 95% compatible with original ECS requirements. Now we need to implement it incrementally with validation at each step.

---

## 📋 **Phase 2 Sub-Phase Breakdown**

### **Phase 2A: Data Layer Store Implementation**
**Duration**: 2-3 validation cycles  
**Architect Role**: Create detailed implementation plan for `dataLayer` structure  
**Code Role**: Implement the new `dataLayer` in gameStore.ts  
**Validation**: Verify data layer structure matches ECS requirements

**Focus Areas**:
- Replace geometry sampling logic from `cameraViewport.geometry_sampling_position`
- Implement `dataLayer.samplingWindow` structure
- Add data layer state management
- Create data layer configuration options

### **Phase 2B: Mirror Layer Store Implementation**
**Duration**: 2-3 validation cycles  
**Architect Role**: Create detailed implementation plan for `mirrorLayer` structure  
**Code Role**: Implement the new `mirrorLayer` in gameStore.ts  
**Validation**: Verify mirror layer structure supports camera viewport transforms

**Focus Areas**:
- Replace camera viewport logic from `cameraViewport.viewport_position`
- Implement `mirrorLayer.cameraViewport` structure
- Add texture cache management
- Create mirror layer state management

### **Phase 2C: Coordination State Implementation**
**Duration**: 2-3 validation cycles  
**Architect Role**: Create detailed implementation plan for `coordinationState`  
**Code Role**: Implement WASD routing and layer coordination logic  
**Validation**: Verify zoom-dependent WASD routing works correctly

**Focus Areas**:
- Implement `coordinationState.wasdTarget` logic
- Add automatic layer visibility control
- Create system synchronization logic
- Add zoom level coordination

### **Phase 2D: Store Integration Validation**
**Duration**: 2-3 validation cycles  
**Architect Role**: Validate complete store architecture integration  
**Code Role**: Test and refine integrated store structure  
**Validation**: Verify all pieces work together correctly

**Focus Areas**:
- Test complete store architecture
- Validate ECS principle compliance
- Test component integration
- Performance validation

---

## 🔄 **Validation Cycle Pattern**

### **Step 1: Architect Planning Phase**
- **Input**: Architecture requirements and current state
- **Output**: Detailed implementation plan for specific sub-phase
- **Deliverable**: Implementation plan document (e.g., `PHASE_2A_IMPLEMENTATION_PLAN.md`)

### **Step 2: Code Implementation Phase**
- **Input**: Detailed implementation plan from architect
- **Output**: Actual code implementation
- **Deliverable**: Updated `gameStore.ts` with new structure

### **Step 3: Architect Validation Phase**
- **Input**: Implemented code from code phase
- **Output**: Validation results and next steps
- **Deliverable**: Validation document (e.g., `PHASE_2A_VALIDATION.md`)

### **Step 4: Iterate or Proceed**
- **If validation passes**: Proceed to next sub-phase
- **If validation fails**: Return to code phase for fixes
- **If major issues**: Return to architect phase for plan revision

---

## 🎯 **Phase 2A: Data Layer Store Implementation**

### **Current State Analysis**
```typescript
// CURRENT (Confusing) - Mixed in cameraViewport
cameraViewport: {
  geometry_sampling_position: PixeloidCoordinate,  // DATA LAYER concern
  geometry_layer_bounds: BoundingBox,              // DATA LAYER concern
  geometry_layer_scale: 1,                         // DATA LAYER concern
  
  // Mixed with mirror layer concerns
  viewport_position: PixeloidCoordinate,           // MIRROR LAYER concern
  zoom_factor: number,                             // MIRROR LAYER concern
  is_panning: boolean,                             // MIRROR LAYER concern
}
```

### **Target State (Phase 2A)**
```typescript
// NEW (Crystal Clear) - Pure data layer
dataLayer: {
  objects: GeometricObject[],                      // ✅ Geometry storage
  drawing: DrawingState,                           // ✅ Drawing state
  selection: SelectionState,                       // ✅ Selection state
  
  samplingWindow: {
    position: PixeloidCoordinate,                  // ✅ Replaces geometry_sampling_position
    bounds: {
      width: number,                               // ✅ Calculated from window size
      height: number,
      minX: number,                                // ✅ Calculated bounds
      maxX: number,
      minY: number,
      maxY: number
    }
  },
  
  state: {
    isActive: boolean,                             // ✅ Layer visibility control
    needsUpdate: boolean,                          // ✅ Update tracking
    lastUpdate: number,
    objectCount: number,
    visibilityVersion: number
  },
  
  config: {
    maxObjects: number,                            // ✅ Performance limits
    enableOptimizations: boolean,
    samplingMode: 'precise' | 'fast'
  }
}
```

### **Phase 2A Implementation Tasks**
1. **Extract Data Layer Logic** - Move geometry sampling from `cameraViewport`
2. **Implement Sampling Window** - Create new `samplingWindow` structure
3. **Add Data Layer State** - Implement state management
4. **Add Data Layer Config** - Create configuration options
5. **Update Type Definitions** - Ensure type safety

### **Phase 2A Validation Criteria**
- ✅ Data layer structure matches validated architecture
- ✅ Sampling window properly replaces geometry_sampling_position
- ✅ State management supports layer visibility control
- ✅ Configuration options support performance tuning
- ✅ Type definitions are correct and complete

---

## 🎯 **Phase 2B: Mirror Layer Store Implementation**

### **Current State Analysis**
```typescript
// CURRENT (Confusing) - Mixed in cameraViewport
cameraViewport: {
  viewport_position: PixeloidCoordinate,           // MIRROR LAYER concern
  zoom_factor: number,                             // MIRROR LAYER concern
  is_panning: boolean,                             // MIRROR LAYER concern
  pan_start_position: PixeloidCoordinate,          // MIRROR LAYER concern
  
  // Mixed with data layer concerns
  geometry_sampling_position: PixeloidCoordinate,  // DATA LAYER concern
  geometry_layer_bounds: BoundingBox,              // DATA LAYER concern
}
```

### **Target State (Phase 2B)**
```typescript
// NEW (Crystal Clear) - Pure mirror layer
mirrorLayer: {
  cameraViewport: {
    position: PixeloidCoordinate,                  // ✅ Replaces viewport_position
    zoomLevel: ZoomLevel,                          // ✅ Replaces zoom_factor
    bounds: ViewportBounds,                        // ✅ Calculated viewport bounds
    isPanning: boolean,                            // ✅ Replaces is_panning
    panStartPosition: PixeloidCoordinate | null    // ✅ Replaces pan_start_position
  },
  
  textureCache: Map<string, MirrorTexture>,        // ✅ Texture caching
  
  state: {
    isActive: boolean,                             // ✅ Layer visibility control
    needsUpdate: boolean,                          // ✅ Update tracking
    lastUpdate: number,
    textureCount: number,
    cacheVersion: number
  },
  
  config: {
    maxTextures: number,                           // ✅ Memory management
    enableCaching: boolean,
    cacheStrategy: 'lru' | 'lfu'
  }
}
```

### **Phase 2B Implementation Tasks**
1. **Extract Mirror Layer Logic** - Move camera viewport from `cameraViewport`
2. **Implement Camera Viewport** - Create new `cameraViewport` structure
3. **Add Texture Cache** - Implement texture caching system
4. **Add Mirror Layer State** - Implement state management
5. **Add Mirror Layer Config** - Create configuration options

### **Phase 2B Validation Criteria**
- ✅ Mirror layer structure matches validated architecture
- ✅ Camera viewport properly replaces viewport_position/zoom_factor
- ✅ Texture cache supports data layer → mirror layer flow
- ✅ State management supports layer visibility control
- ✅ Configuration options support memory management

---

## 🎯 **Phase 2C: Coordination State Implementation**

### **Current State Analysis**
```typescript
// CURRENT (Missing) - No coordination between layers
// WASD always goes to same place regardless of zoom
// No automatic layer visibility control
// No system synchronization
```

### **Target State (Phase 2C)**
```typescript
// NEW (Coordinated) - Layer coordination logic
coordinationState: {
  currentZoomLevel: ZoomLevel,                     // ✅ Current zoom tracking
  wasdTarget: 'dataLayer' | 'mirrorLayer',        // ✅ Zoom-dependent WASD routing
  
  layerVisibility: {
    geometryVisible: boolean,                      // ✅ Auto-calculated
    mirrorVisible: boolean                         // ✅ Auto-calculated
  },
  
  systemSyncVersion: number,                       // ✅ Synchronization tracking
  lastCoordinationUpdate: number,
  needsSystemSync: boolean
}
```

### **Phase 2C Implementation Tasks**
1. **Implement Zoom Level Tracking** - Track current zoom level
2. **Add WASD Routing Logic** - Route WASD based on zoom
3. **Add Layer Visibility Control** - Automatic layer visibility
4. **Add System Synchronization** - Coordinate layer updates
5. **Create Update Methods** - Methods to update coordination state

### **Phase 2C Validation Criteria**
- ✅ Zoom level tracking works correctly
- ✅ WASD routing targets correct layer based on zoom
- ✅ Layer visibility automatically controlled by zoom
- ✅ System synchronization prevents conflicts
- ✅ Update methods maintain consistency

---

## 🎯 **Implementation Schedule**

### **Week 1: Phase 2A + 2B (Data and Mirror Layers)**
- **Mon-Tue**: Phase 2A (Data Layer) - Plan, implement, validate
- **Wed-Thu**: Phase 2B (Mirror Layer) - Plan, implement, validate
- **Fri**: Integration testing and adjustment

### **Week 2: Phase 2C + 2D (Coordination and Migration)**
- **Mon-Tue**: Phase 2C (Coordination State) - Plan, implement, validate
- **Wed-Thu**: Phase 2D (Migration Strategy) - Plan, implement, validate
- **Fri**: Integration testing and adjustment

### **Week 3: Phase 2E (Final Integration)**
- **Mon-Tue**: Phase 2E (Store Integration) - Plan, implement, validate
- **Wed-Thu**: Complete testing and documentation
- **Fri**: Final validation and Phase 3 preparation

---

## 🎯 **Success Criteria for Phase 2**

### **Technical Criteria**
- ✅ Clear data/mirror layer separation in store structure
- ✅ Automatic layer visibility control based on zoom
- ✅ WASD routing to correct layer based on zoom
- ✅ Texture cache properly references data layer
- ✅ All components can use new store structure
- ✅ Performance maintained or improved

### **Architectural Criteria**
- ✅ ECS principles maintained throughout
- ✅ No mixed responsibilities in store structure
- ✅ Crystal clear separation of concerns
- ✅ Consistent with validated architecture plan
- ✅ Ready for Phase 3 UI integration

### **Quality Criteria**
- ✅ Type safety maintained throughout
- ✅ No breaking changes to existing functionality
- ✅ Comprehensive validation at each step
- ✅ Documentation updated
- ✅ Migration path validated

---

## 🎯 **Ready for Phase 2A Implementation**

With this incremental implementation plan, we're ready to begin **Phase 2A: Data Layer Store Implementation** with the architect → code → architect validation cycle pattern.

**Next Steps**:
1. **Architect Mode**: Create detailed Phase 2A implementation plan
2. **Code Mode**: Implement data layer structure in gameStore.ts
3. **Architect Mode**: Validate data layer implementation
4. **Repeat**: Continue with Phase 2B, 2C, 2D, 2E

This approach ensures each step is properly validated before proceeding, maintaining the high quality and architectural integrity we've established.