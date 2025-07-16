# Phase 3: Complete Roadmap - Foundation for Future Phases

## 🎯 **Phase 3 Complete Objective**

### **Primary Goal: Stable 3-Layer System at Scale 1**
Build a robust foundation that supports all future phases without requiring changes:

1. **Mesh Data System** - Vertex provider for all layers
2. **Checkboard Layer** - Static background using mesh data
3. **Data Layer** - ECS geometry rendering using mesh coordinates
4. **Mouse System** - Interaction layer using mesh data

**Critical**: All at pixeloid scale = 1 (no zoom/camera complexity)

## 🚨 **PHASE 3A IMPLEMENTATION RESULTS (ACTUAL)**

### **✅ PHASE 3A COMPLETED SUCCESSFULLY**
After intensive implementation and debugging, Phase 3A is **COMPLETE** with these key achievements:

#### **Critical Lessons Learned**
1. **Store Subscription Loops**: Full store subscriptions cause infinite re-render loops - **MUST use precise slice subscriptions**
2. **Mesh Authority**: Mesh coordinates are truly authoritative - all coordinate calculations derive from mesh
3. **Shader Debugging**: New shader approach failed, old working shader approach succeeded
4. **Toggle Logic**: Shaders must be **removed** when disabled, not just not applied
5. **Dual Updates**: GPU and Store updates must happen simultaneously for smooth performance
6. **Hardcoded Constants**: Root cause of coordinate system issues - eliminated completely
7. **UI State Management**: Precise Valtio subscriptions prevent unnecessary re-renders

#### **Actual Implementation**
- ✅ **MeshManager_3a.ts** - Store-driven mesh generation with proper coordinate system
- ✅ **GridShaderRenderer_3a.ts** - Working checkboard shader (fixed from broken to working)
- ✅ **BackgroundGridRenderer_3a.ts** - Mesh-based background with interaction
- ✅ **gameStore_3a.ts** - Store-driven coordinate system with mesh authority
- ✅ **Mouse highlighting system** - Dual immediate updates (GPU + Store)
- ✅ **UI integration** - LayerToggleBar_3a, StorePanel_3a, UIControlBar_3a
- ✅ **Input management** - InputManager_3a with mesh-first WASD
- ✅ **Store subscriptions** - Fixed Valtio subscription loops with precise slices
- ✅ **Coordinate system** - Eliminated all hardcoded divisions

#### **Architecture Validation**
- ✅ **Mesh-first principles** - All coordinates derive from mesh
- ✅ **Store-driven system** - No hardcoded constants
- ✅ **Working checkboard shader** - Visible pattern with toggle
- ✅ **Smooth mouse highlighting** - No lag, perfect alignment
- ✅ **UI controls functional** - All toggles and panels working

### **Store Evolution Strategy**
Building on the excellent ECS architecture (6,538 lines) we've developed together:
- **Phase 3A**: `gameStore_3a.ts` - Foundation (mesh + grid + mouse + basic data layer)
- **Phase 4**: `gameStore_4.ts` - Add mirror layer integration
- **Phase 5**: `gameStore_5.ts` - Add zoom layer integration
- **Phase 6**: `gameStore_6.ts` - Add filter pipeline integration

Each phase creates a new store file that builds upon the previous, leveraging existing ECS components through selective imports. This ensures architecture consistency while allowing progressive complexity introduction.

### **Future-Proof Architecture Requirements**
- **Phase 4**: Mirror layer with texture extraction from data layer
- **Phase 5**: Zoomed layers with camera transforms on mirror layer
- **Phase 6**: Selection and pixelate filters (pre-filters on data, post-filters on zoom)

---

## 📊 **Complete System Architecture with Correct Linkages**

### **Mesh-First Layer Architecture with Proper Dependencies**
```
┌─────────────────────────────────────────────────────────────────┐
│                 Mesh-First Layer Architecture                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│          ┌─────────────────────────────────────────┐            │
│          │    MeshManager (Foundation)             │            │
│          │  (authoritative vertex source)         │            │
│          │  - separate from rendering              │            │
│          │  - provides to all layers               │            │
│          └─────────────────────────────────────────┘            │
│                              │                                  │
│          ┌───────────────────┼───────────────────┐             │
│          │                   │                   │             │
│          ▼                   ▼                   ▼             │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐          │
│   │   Layer 0   │   │   Layer 1   │   │   Layer 2   │          │
│   │GridShader   │   │ Data Layer  │   │ Mirror Layer│          │
│   │(visual grid │   │ (ECS geom   │   │ (Phase 4)   │          │
│   │uses mesh)   │   │ at scale 1) │   │ ◄─────────┐ │          │
│   └─────────────┘   └─────────────┘   │           │ │          │
│                              │        │  texture  │ │          │
│                              │        │extraction │ │          │
│                              └────────┼───────────┘ │          │
│                                       └─────────────┘          │
│                                              │                  │
│                                              ▼                  │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐          │
│   │   Layer 3   │   │   Layer 4   │   │   Layer 4   │          │
│   │ Zoom Layers │   │Pre-Filters  │   │Post-Filters │          │
│   │ (Phase 5)   │   │(Phase 6)    │   │(Phase 6)    │          │
│   │ ◄─────────┐ │   │ ◄─────────┐ │   │ ◄─────────┐ │          │
│   │  camera   │ │   │  applied  │ │   │  applied  │ │          │
│   │transforms │ │   │to data    │ │   │to zoom    │ │          │
│   └───────────┼─┘   └───────────┼─┘   └───────────┼─┘          │
│               │                 │                 │            │
│               └─────────────────┼─────────────────┘            │
│                                 │                              │
│                                 ▼                              │
│                    ┌─────────────────────────────────────────┐ │
│                    │     Mouse System (Top)                 │ │
│                    │   (uses mesh coordinates)              │ │
│                    │   - mesh.getLocalPosition()            │ │
│                    └─────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### **Correct Data Flow Pipeline**
```
┌─────────────────────────────────────────────────────────────────┐
│                    Correct Data Flow                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Layer 1 (Data) → Layer 2 (Mirror) → Layer 3 (Zoom) → Layer 4 (Filters) │
│       │               │                  │                │    │
│       │               │                  │                │    │
│   ECS Scale 1    Texture Cache    Camera Transform   Pre/Post  │
│   Fixed Geom.   (from Data)       (on Mirror)        Filters   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### **Phase 3A Actual Implementation Status**
```
┌─────────────────────────────────────────────────────────────────┐
│                    Phase 3A COMPLETED                           │
├─────────────────────────────────────────────────────────────────┤
│ ✅ Mesh Data System (MeshManager_3a.ts) - Store-driven         │
│ ✅ Layer 0: Checkboard Layer (GridShaderRenderer_3a.ts) - WORKING│
│ ✅ Mouse System (GPU + Store dual updates) - SMOOTH            │
│ ✅ UI Integration (LayerToggleBar_3a, StorePanel_3a) - WORKING  │
│ ✅ Store Architecture (gameStore_3a.ts) - No hardcoded values  │
│ ✅ Input Management (InputManager_3a.ts) - Mesh-first WASD     │
│ ✅ Coordinate System - Mesh authority, no divisions            │
│                                                                 │
│ 🔧 Layer 1: Data Layer (Phase 3B - geometry drawing on mesh)   │
│ 🔧 Layer 2: Mirror Layer (Phase 4 - texture extraction)       │
│ 🔧 Layer 3: Zoom Layers (Phase 5 - camera transforms)         │
│ 🔧 Layer 4: Filter Layers (Phase 6 - pre/post filters)        │
└─────────────────────────────────────────────────────────────────┘
```

## 🚨 **PHASE 3B IMPLEMENTATION RESULTS (ACTUAL)**

### **✅ PHASE 3B SIGNIFICANTLY COMPLETED**
After extensive implementation work, Phase 3B has achieved **major progress** with comprehensive geometry drawing system:

#### **Phase 3B Accomplishments**
- ✅ **Complete 3A → 3B Migration** - All _3b files created and integrated
- ✅ **GeometryRenderer_3b.ts** - Core geometry rendering system with individual containers
- ✅ **Complete Drawing System** - All 6 drawing modes (point, line, rectangle, circle, diamond, polygon)
- ✅ **Style Architecture** - Per-object style overrides with global defaults
- ✅ **GeometryPanel_3b.ts** - Complete geometry panel UI with all controls
- ✅ **LayerToggleBar_3b.ts** - Working layer toggles with proper Valtio subscriptions
- ✅ **StorePanel_3b.ts** - Working store panel with reactive updates
- ✅ **Phase3BCanvas.ts** - 3-layer rendering system (grid, geometry, mouse)
- ✅ **BackgroundGridRenderer_3b.ts** - Grid with geometry input handling
- ✅ **Complete UI Integration** - All HTML elements and JavaScript handlers
- ✅ **gameStore_3b.ts** - Extended store with geometry, drawing, style, and preview systems
- ✅ **Helper Files** - GeometryHelper_3b.ts, CoordinateHelper_3b.ts with mesh integration
- ✅ **Types System** - Complete geometry-drawing.ts types for all drawing modes
- ✅ **Input Handling** - Complete drawing workflow with preview and finalization
- ✅ **Clear All Objects Fix** - Fixed critical bug with dataLayerIntegration sync
- ✅ **TypeScript Cleanup** - All compilation errors resolved

#### **Phase 3B Architecture Validation**
- ✅ **Mesh-first geometry drawing** - All drawing respects mesh coordinates
- ✅ **Working 6 drawing modes** - Point, line, rectangle, circle, diamond, polygon
- ✅ **Style system functional** - Global defaults with per-object overrides
- ✅ **Reactive UI components** - All panels and controls working smoothly
- ✅ **Store integration** - Complete geometry store integration with ECS data layer
- ✅ **Performance optimized** - Individual containers, proper subscriptions, no loops

#### **Phase 3B Critical Gaps (TODO)**
- ❌ **Store Explorer UI** - Advanced store browsing interface missing
- ❌ **Workspace Functionality** - Multi-workspace management not implemented
- ❌ **Selection Logic** - Object selection, drag and drop, copy, delete missing
- ❌ **ObjectEditPanel_3b.ts** - Object editing interface not created

### **Phase 3B vs 3A Comparison**
**Phase 3A (Foundation)**: Mesh + Grid + Mouse + Basic UI
**Phase 3B (Drawing System)**: Phase 3A + Complete Geometry Drawing + Style System + Advanced UI

### **Phase 3B Implementation Status**
```
┌─────────────────────────────────────────────────────────────────┐
│                    Phase 3B MAJOR PROGRESS                     │
├─────────────────────────────────────────────────────────────────┤
│ ✅ Mesh Data System (inherited from 3A) - WORKING              │
│ ✅ Layer 0: Grid Layer (BackgroundGridRenderer_3b.ts) - WORKING │
│ ✅ Layer 1: Geometry Layer (GeometryRenderer_3b.ts) - COMPLETE  │
│ ✅ Layer 2: Mouse Layer (inherited from 3A) - WORKING           │
│ ✅ Drawing System (6 modes) - COMPLETE                         │
│ ✅ Style System (per-object overrides) - COMPLETE              │
│ ✅ UI Integration (all panels) - COMPLETE                      │
│ ✅ Store Architecture (extended) - COMPLETE                    │
│                                                                 │
│ ❌ Store Explorer UI - TODO                                    │
│ ❌ Workspace Functionality - TODO                              │
│ ❌ Selection Logic - TODO                                      │
│ ❌ ObjectEditPanel_3b.ts - TODO                               │
│                                                                 │
│ 🔧 Layer 2: Mirror Layer (Phase 4 - texture extraction)       │
│ 🔧 Layer 3: Zoom Layers (Phase 5 - camera transforms)         │
│ 🔧 Layer 4: Filter Layers (Phase 6 - pre/post filters)        │
└─────────────────────────────────────────────────────────────────┘
```

### **Phase 3B Store Evolution**
Building on Phase 3A foundation:
- **Phase 3A**: `gameStore_3a.ts` - Foundation (mesh + grid + mouse)
- **Phase 3B**: `gameStore_3b.ts` - Drawing System (geometry + styles + preview)
- **Phase 4**: `gameStore_4.ts` - Add mirror layer integration
- **Phase 5**: `gameStore_5.ts` - Add zoom layer integration
- **Phase 6**: `gameStore_6.ts` - Add filter pipeline integration

---

### **🚨 CRITICAL LESSONS LEARNED**

#### **1. Store Subscription Architecture - CRITICAL**
```typescript
// ❌ WRONG - Causes infinite loops
subscribe(gameStore_3a, () => {
  // This triggers on ANY store change, causing re-render loops
})

// ✅ CORRECT - Precise slice subscriptions
subscribe(gameStore_3a.ui.enableCheckboard, () => {
  // Only triggers when this specific value changes
})
```

#### **2. Mesh Authority Principle - FUNDAMENTAL**
```typescript
// ✅ CORRECT - Mesh is authoritative
const mesh = meshManager.getMesh()
const localPos = event.getLocalPosition(mesh)
const vertexX = Math.floor(localPos.x)  // Direct from mesh
const vertexY = Math.floor(localPos.y)  // Direct from mesh

// ❌ WRONG - Calculations ignore mesh
const vertexX = Math.floor(screenX / 20)  // Hardcoded division
```

#### **3. Shader Implementation - PROVEN APPROACH**
```typescript
// ✅ WORKING - Old shader approach
vec2 gridCoord = floor(vPosition);  // Direct grid coordinates
float checker = mod(gridCoord.x + gridCoord.y, 2.0);

// ❌ FAILED - New shader approach
vec2 cellCoord = floor(vPosition / uCellSize);  // Division causes issues
```

#### **4. Toggle Logic - MUST REMOVE SHADERS**
```typescript
// ✅ CORRECT - Remove shader when disabled
if (enabled) {
  (mesh as any).shader = this.shader
} else {
  (mesh as any).shader = null  // CRITICAL: Remove shader
}

// ❌ WRONG - Shader stays applied
if (enabled) {
  (mesh as any).shader = this.shader
} else {
  return  // Shader never removed
}
```

#### **5. Dual Updates Architecture - PERFORMANCE**
```typescript
// ✅ WORKING - Dual immediate updates
// GPU update
mouseHighlightShader.updatePosition(vertexX, vertexY)
// Store update
gameStore_3a.mouse.vertex = { x: vertexX, y: vertexY }

// Both happen simultaneously - no lag
```

#### **6. Hardcoded Constants - ROOT CAUSE**
```typescript
// ❌ ROOT CAUSE OF ISSUES
const CELL_SIZE = 20  // Hardcoded constant
const vertexX = Math.floor(screenX / CELL_SIZE)

// ✅ SOLUTION - Store-driven
const cellSize = gameStore_3a.mesh.cellSize
const vertexX = Math.floor(screenX / cellSize)
```

#### **7. UI State Management - VALTIO PRECISION**
```typescript
// ✅ CORRECT - Precise subscriptions prevent loops
const LayerToggleBar_3a = () => {
  const showLayerToggle = useSnapshot(gameStore_3a.ui.showLayerToggle)
  const enableCheckboard = useSnapshot(gameStore_3a.ui.enableCheckboard)
  
  // Each subscription is precise - no cascading updates
}
```

---

## 🏗️ **Future-Proof Design Principles**

### **1. Mesh-First Architecture**
All components must respect mesh as the authoritative source:

```typescript
// Example: Mesh Manager designed for all phases (Phase 3A specific)
export class MeshManager_3a {
  // Phase 3A: Provides authoritative vertices
  public getVertices(): Float32Array { ... }
  public getVertexAt(x: number, y: number): VertexCoordinate { ... }
  
  // Phase 4: Ready for texture extraction
  public getTextureRegion(bounds: BoundingBox): Float32Array { ... }
  
  // Phase 5: Ready for zoom coordination
  public getZoomVertices(scale: number): Float32Array { ... }
  
  // Phase 6: Ready for filter coordination
  public getFilterRegion(filterType: FilterType): Float32Array { ... }
}
```

### **2. Module Separation with Correct Dependencies**
Each module has a single responsibility but maintains mesh-first coordination:

```typescript
// Grid Shader - Phase 3 (Uses mesh data)
export class GridShaderRenderer_3a {
  constructor(private meshManager: MeshManager_3a) {}
  // Pure visual rendering using mesh vertices
}

// Data Layer - Phase 3 (Uses mesh coordinates)
export class DataLayerRenderer {
  constructor(private meshManager: MeshManager_3a) {}
  // Uses mesh coordinates for ECS geometry
}

// Mirror Layer - Phase 4 (Depends on Data Layer + Mesh)
export class MirrorLayerRenderer {
  constructor(
    private meshManager: MeshManager_3a,
    private dataLayer: DataLayerRenderer
  ) {}
  // Extracts textures from data layer using mesh coordinates
  private extractFromDataLayer(): Texture[] {
    return this.dataLayer.getObjectTextures() // ← Dependency
  }
}

// Zoom Layer - Phase 5 (Depends on Mirror Layer)
export class ZoomLayerRenderer {
  constructor(private meshManager: StaticMeshManager, private mirrorLayer: MirrorLayerRenderer) {}
  // Applies camera transforms to mirror layer
  private applyZoomToMirror(): void {
    const mirrorTextures = this.mirrorLayer.getTextures() // ← Dependency
    this.renderWithZoom(mirrorTextures)
  }
}

// Filter Layer - Phase 6 (Depends on both Data and Zoom layers)
export class FilterLayerRenderer {
  constructor(
    private meshManager: StaticMeshManager,
    private dataLayer: DataLayerRenderer,
    private zoomLayer: ZoomLayerRenderer
  ) {}
  
  // Pre-filters applied to data layer
  private applyPreFilters(): void {
    const dataTextures = this.dataLayer.getTextures() // ← Dependency
    this.applyFiltersToData(dataTextures)
  }
  
  // Post-filters applied to zoom layer
  private applyPostFilters(): void {
    const zoomTextures = this.zoomLayer.getTextures() // ← Dependency
    this.applyFiltersToZoom(zoomTextures)
  }
}
```

### **3. Store Architecture Extensibility**
ECS store designed to expand without breaking existing functionality:

```typescript
// Phase 3: Basic ECS data layer
export const dataLayerStore = {
  scale: 1,
  samplingWindow: { ... },
  visibleObjects: [],
  // Ready for Phase 4 expansion
}

// Phase 4: Mirror layer addition (depends on data layer)
export const mirrorLayerStore = {
  textureCache: new Map(),
  extractionBounds: { ... },
  sourceDataLayer: 'dataLayer', // ← Dependency reference
  // Independent operation after setup
}

// Phase 5: Zoom layer addition (depends on mirror layer)
export const zoomLayerStore = {
  zoomFactor: 1,
  cameraTransforms: { ... },
  sourceMirrorLayer: 'mirrorLayer', // ← Dependency reference
  // Independent operation after setup
}
```

---

## 🔧 **Phase 3 Implementation Plan**

### **Week 1: Mesh-First Foundation with Module Separation**

#### **1.1: Create MeshManager_3a.ts (Authoritative Mesh Creation)**
```typescript
// app/src/game/MeshManager_3a.ts
export class MeshManager_3a {
  private mesh: MeshSimple | null = null
  private vertices: Float32Array | null = null
  private indices: Uint32Array | null = null
  
  constructor() {
    this.generateMesh(1) // Phase 3A: Fixed scale 1
  }
  
  private generateMesh(scale: number): void {
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    const gridWidth = Math.ceil(screenWidth / scale)
    const gridHeight = Math.ceil(screenHeight / scale)
    
    // Create vertex arrays - THIS IS THE AUTHORITATIVE SOURCE
    const vertices: number[] = []
    const indices: number[] = []
    
    let vertexIndex = 0
    for (let x = 0; x < gridWidth; x++) {
      for (let y = 0; y < gridHeight; y++) {
        // Create quad vertices
        vertices.push(x, y, x + 1, y, x + 1, y + 1, x, y + 1)
        
        // Create triangle indices
        const base = vertexIndex * 4
        indices.push(base + 0, base + 1, base + 2, base + 0, base + 2, base + 3)
        
        vertexIndex++
      }
    }
    
    this.vertices = new Float32Array(vertices)
    this.indices = new Uint32Array(indices)
    
    // Create mesh object
    this.mesh = new MeshSimple({
      texture: Texture.WHITE,
      vertices: this.vertices,
      indices: this.indices
    })
  }
  
  // Authoritative vertex access
  public getMesh(): MeshSimple | null { return this.mesh }
  public getVertices(): Float32Array | null { return this.vertices }
  public getVertexAt(x: number, y: number): VertexCoordinate {
    return { x: Math.floor(x), y: Math.floor(y) }
  }
  
  // Phase 4+: Ready for texture extraction
  public getTextureRegion(bounds: BoundingBox): Float32Array {
    // Will provide vertices for texture extraction
    return this.getVerticesInBounds(bounds)
  }
}
```

#### **1.2: Create GridShaderRenderer_3a.ts (Pure Visual Rendering)**
```typescript
// app/src/game/GridShaderRenderer_3a.ts
export class GridShaderRenderer_3a {
  private shader: Shader | null = null
  private mesh: MeshSimple | null = null
  
  constructor(private meshManager: MeshManager_3a) {
    this.createCheckboardShader()
  }
  
  private createCheckboardShader(): void {
    this.shader = Shader.from({
      gl: {
        fragment: `
          precision mediump float;
          varying vec2 vGridPos;
          
          void main() {
            vec2 gridCoord = floor(vGridPos);
            float checker = mod(gridCoord.x + gridCoord.y, 2.0);
            
            vec3 lightColor = vec3(0.941, 0.941, 0.941);
            vec3 darkColor = vec3(0.878, 0.878, 0.878);
            
            vec3 color = mix(lightColor, darkColor, checker);
            gl_FragColor = vec4(color, 1.0);
          }
        `
      }
    })
  }
  
  public render(): void {
    // Get mesh from mesh manager (authoritative source)
    this.mesh = this.meshManager.getMesh()
    
    if (this.mesh && this.shader) {
      // Apply checkboard shader to mesh
      (this.mesh as any).shader = this.shader
    }
  }
  
  public getMesh(): MeshSimple | null { return this.mesh }
}
```

#### **1.3: Create BackgroundGridRenderer_3a.ts (Orchestrator)**
```typescript
// app/src/game/BackgroundGridRenderer_3a.ts
export class BackgroundGridRenderer_3a {
  private meshManager: MeshManager_3a
  private gridShaderRenderer: GridShaderRenderer_3a
  
  constructor() {
    this.meshManager = new MeshManager_3a()
    this.gridShaderRenderer = new GridShaderRenderer_3a(this.meshManager)
    this.setupMeshInteraction()
  }
  
  private setupMeshInteraction(): void {
    const mesh = this.meshManager.getMesh()
    if (!mesh) return
    
    mesh.eventMode = 'static'
    mesh.interactiveChildren = false
    
    // ✅ MESH-FIRST MOUSE EVENTS
    mesh.on('globalpointermove', (event) => {
      const localPos = event.getLocalPosition(mesh)
      const meshVertexX = Math.floor(localPos.x)
      const meshVertexY = Math.floor(localPos.y)
      
      // ✅ USE MESH COORDINATES (authoritative)
      gameStore_3a_methods.updateMousePosition(meshVertexX, meshVertexY)
    })
  }
  
  public render(): void {
    this.gridShaderRenderer.render()
  }
  
  public getMesh(): MeshSimple | null {
    return this.meshManager.getMesh()
  }
}
```

### **Week 2: Mouse System with Mesh-First Coordinates**

#### **2.1: Create MouseHighlightShader_3a.ts (Mesh-First)**
```typescript
// app/src/game/MouseHighlightShader_3a.ts
export class MouseHighlightShader_3a {
  private graphics: Graphics
  
  constructor() {
    this.graphics = new Graphics()
  }
  
  public render(): void {
    // Get mouse position from mesh coordinates (authoritative)
    const mouseVertex = gameStore_3a.mouse.vertex
    
    this.graphics.clear()
    
    if (mouseVertex) {
      // Use mesh vertex coordinates directly
      this.graphics.rect(mouseVertex.x, mouseVertex.y, 1, 1)
      this.graphics.stroke({ width: 2, color: 0xff0000 })
    }
  }
  
  public getGraphics(): Graphics { return this.graphics }
}
```

### **Week 3: Data Layer Implementation**

#### **3.1: Create DataLayerRenderer**
```typescript
// app/src/game/DataLayerRenderer.ts
export class DataLayerRenderer {
  private container: Container
  private meshManager: StaticMeshManager
  private objectContainers: Map<string, Container> = new Map()
  
  constructor(meshManager: StaticMeshManager) {
    this.container = new Container()
    this.meshManager = meshManager
  }
  
  public render(): void {
    // Get ECS data
    const ecsState = dataLayerIntegration.getCurrentState()
    const visibleObjects = ecsState.visibleObjects
    const samplingPosition = ecsState.samplingWindow.position
    
    // Clear previous render
    this.container.removeChildren()
    this.objectContainers.clear()
    
    // Render objects using mesh coordinates
    visibleObjects.forEach(obj => {
      const objectContainer = this.createObjectContainer(obj, samplingPosition)
      this.container.addChild(objectContainer)
      this.objectContainers.set(obj.id, objectContainer)
    })
    
    // Layer visibility from ECS
    this.container.visible = ecsState.config.enableRendering
  }
  
  private createObjectContainer(obj: GeometryObject, samplingPos: PixeloidCoordinate): Container {
    const container = new Container()
    const graphics = new Graphics()
    
    // Use mesh coordinates for pixel-perfect alignment
    const meshCoord = this.meshManager.getCoordinateAt(
      obj.x - samplingPos.x,
      obj.y - samplingPos.y
    )
    
    // Render object aligned to mesh
    this.renderGeometryObject(graphics, obj, meshCoord.x, meshCoord.y)
    container.addChild(graphics)
    
    return container
  }
  
  public getContainer(): Container {
    return this.container
  }
  
  // Phase 4+: Ready for texture extraction
  public getObjectContainer(objectId: string): Container | null {
    return this.objectContainers.get(objectId) || null
  }
  
  public getObjectTextures(): Texture[] {
    // Future: Will provide textures for mirror layer
    return Array.from(this.objectContainers.values()).map(container => {
      return app.renderer.generateTexture(container)
    })
  }
}
```

### **Week 4: Mouse System Implementation**

#### **4.1: Create MouseSystem**
```typescript
// app/src/game/MouseSystem.ts
export class MouseSystem {
  private container: Container
  private meshManager: StaticMeshManager
  private currentHighlight: Graphics | null = null
  
  constructor(meshManager: StaticMeshManager) {
    this.container = new Container()
    this.meshManager = meshManager
    this.setupEventListeners()
  }
  
  private setupEventListeners(): void {
    document.addEventListener('mousemove', (e) => {
      this.handleMouseMove(e.clientX, e.clientY)
    })
    
    document.addEventListener('click', (e) => {
      this.handleMouseClick(e.clientX, e.clientY)
    })
  }
  
  private handleMouseMove(screenX: number, screenY: number): void {
    // Get ECS sampling position
    const ecsState = dataLayerIntegration.getCurrentState()
    const samplingPosition = ecsState.samplingWindow.position
    
    // Convert to mesh coordinates
    const meshCoord = this.meshManager.getCoordinateAt(
      screenX + samplingPosition.x,
      screenY + samplingPosition.y
    )
    
    // Update highlight
    this.updateHighlight(meshCoord.x, meshCoord.y)
  }
  
  private handleMouseClick(screenX: number, screenY: number): void {
    // Get mesh coordinates for object creation
    const ecsState = dataLayerIntegration.getCurrentState()
    const samplingPosition = ecsState.samplingWindow.position
    
    const meshCoord = this.meshManager.getCoordinateAt(
      screenX + samplingPosition.x,
      screenY + samplingPosition.y
    )
    
    // Create object at mesh-aligned position
    const pixeloidCoord = {
      x: meshCoord.x + samplingPosition.x,
      y: meshCoord.y + samplingPosition.y
    }
    
    // Route to ECS data layer
    dataLayerIntegration.createObject({
      type: 'circle',
      x: pixeloidCoord.x,
      y: pixeloidCoord.y,
      radius: 10,
      color: 0x00ff00
    })
  }
  
  private updateHighlight(meshX: number, meshY: number): void {
    // Remove previous highlight
    if (this.currentHighlight) {
      this.container.removeChild(this.currentHighlight)
    }
    
    // Create new highlight at mesh coordinates
    this.currentHighlight = new Graphics()
    this.currentHighlight.rect(meshX, meshY, 20, 20)
    this.currentHighlight.stroke({ width: 2, color: 0xff0000 })
    
    this.container.addChild(this.currentHighlight)
  }
  
  public render(): void {
    // Phase 3: Simple visibility toggle
    this.container.visible = gameStore.ui.layerToggles.mouseHighlight
  }
  
  public getContainer(): Container {
    return this.container
  }
}
```

---

## 🚀 **Integration and Main App**

### **Main Application Setup**
```typescript
// app/src/game/Game.ts
export class Game {
  private app: Application
  private meshIntegrationLayer: MeshIntegrationLayer
  private checkboardRenderer: CheckboardRenderer
  private dataLayerRenderer: DataLayerRenderer
  private mouseSystem: MouseSystem
  
  constructor() {
    this.app = new Application()
    this.setupLayers()
  }
  
  private setupLayers(): void {
    // Initialize mesh integration layer
    this.meshIntegrationLayer = new MeshIntegrationLayer()
    
    // Create renderers with mesh manager
    const meshManager = this.meshIntegrationLayer.getMeshManager()
    this.checkboardRenderer = new CheckboardRenderer(meshManager)
    this.dataLayerRenderer = new DataLayerRenderer(meshManager)
    this.mouseSystem = new MouseSystem(meshManager)
    
    // Register layers
    this.meshIntegrationLayer.registerLayer('checkboard', this.checkboardRenderer)
    this.meshIntegrationLayer.registerLayer('data', this.dataLayerRenderer)
    this.meshIntegrationLayer.registerLayer('mouse', this.mouseSystem)
    
    // Add to stage
    this.app.stage.addChild(this.checkboardRenderer.getContainer())
    this.app.stage.addChild(this.dataLayerRenderer.getContainer())
    this.app.stage.addChild(this.mouseSystem.getContainer())
  }
  
  public render(): void {
    // Phase 3: Render all current layers
    this.checkboardRenderer.render()
    this.dataLayerRenderer.render()
    this.mouseSystem.render()
  }
  
  // Phase 4+: Ready for additional layers with dependencies
  public addMirrorLayer(mirrorRenderer: MirrorLayerRenderer): void {
    this.meshIntegrationLayer.registerMirrorLayer(mirrorRenderer)
    this.app.stage.addChild(mirrorRenderer.getContainer())
  }
  
  public addZoomLayer(zoomRenderer: ZoomLayerRenderer): void {
    this.meshIntegrationLayer.registerZoomLayer(zoomRenderer)
    this.app.stage.addChild(zoomRenderer.getContainer())
  }
  
  public addFilterLayer(filterRenderer: FilterLayerRenderer): void {
    this.meshIntegrationLayer.registerFilterLayer(filterRenderer)
    this.app.stage.addChild(filterRenderer.getContainer())
  }
}
```

---

## 🎯 **Phase 3 Success Criteria**

### **Technical Requirements**
- ✅ **Mesh-First Architecture**: MeshManager_3a.ts is authoritative source of all coordinates
- ✅ **Module Separation**: Clear separation between mesh creation and visual rendering
- ✅ **Grid Layer**: Static background using mesh data through GridShaderRenderer_3a
- ✅ **Data Layer**: ECS geometry rendering with mesh alignment
- ✅ **Mouse System**: Interaction layer using mesh.getLocalPosition() (authoritative)
- ✅ **Coordinate Flow**: Mesh → Vertex → World → Screen (no made-up formulas)
- ✅ **Performance**: 60fps at all times with proper module separation
- ✅ **UI Integration**: Layer toggles and store panel working with mesh data

### **Future-Proof Requirements**
- ✅ **Extensible Architecture**: Ready for Phases 4-6 with mesh-first principles
- ✅ **No Breaking Changes**: Future phases add with correct dependencies + mesh coordination
- ✅ **Clean Interfaces**: Clear separation of concerns with mesh authority
- ✅ **Mesh Foundation**: Solid foundation for all future layers with proper module separation
- ✅ **Coordinate System**: No hardcoded values, all coordinates derive from mesh
- ✅ **Event Handling**: All mouse events use mesh coordinates, not screen coordinates

---

## 🔮 **Future Phase Integration with Correct Dependencies**

### **Phase 4: Mirror Layer (Depends on Data Layer)**
```typescript
// Phase 4 will add this with proper dependency
export class MirrorLayerRenderer {
  constructor(
    private meshManager: StaticMeshManager,
    private dataLayer: DataLayerRenderer // ← Correct dependency
  ) {}
  
  public render(): void {
    // Extract textures from data layer
    const dataTextures = this.dataLayer.getObjectTextures() // ← Use dependency
    
    // Render mirror layer using mesh coordinates
    this.renderMirrorLayer(dataTextures)
  }
}
```

### **Phase 5: Zoom Layers (Depends on Mirror Layer)**
```typescript
// Phase 5 will add this with proper dependency
export class ZoomLayerRenderer {
  constructor(
    private meshManager: StaticMeshManager,
    private mirrorLayer: MirrorLayerRenderer // ← Correct dependency
  ) {}
  
  public render(): void {
    // Apply camera transforms to mirror layer
    const mirrorTextures = this.mirrorLayer.getTextures() // ← Use dependency
    
    // Render with zoom using mesh coordinates
    this.renderWithZoom(mirrorTextures)
  }
}
```

### **Phase 6: Filter Layers (Depends on Data and Zoom Layers)**
```typescript
// Phase 6 will add this with proper dependencies
export class FilterLayerRenderer {
  constructor(
    private meshManager: StaticMeshManager,
    private dataLayer: DataLayerRenderer,  // ← For pre-filters
    private zoomLayer: ZoomLayerRenderer   // ← For post-filters
  ) {}
  
  public render(): void {
    // Apply pre-filters to data layer
    const dataTextures = this.dataLayer.getTextures() // ← Use dependency
    const preFilteredTextures = this.applyPreFilters(dataTextures)
    
    // Apply post-filters to zoom layer
    const zoomTextures = this.zoomLayer.getTextures() // ← Use dependency
    const postFilteredTextures = this.applyPostFilters(zoomTextures)
    
    // Render final filtered result
    this.renderFilteredResult(preFilteredTextures, postFilteredTextures)
  }
}
```

---

## 📋 **Implementation Timeline**

### **Month 1: Phase 3 (Foundation)**
- Week 1: Mesh Data System
- Week 2: Checkboard Layer
- Week 3: Data Layer
- Week 4: Mouse System + Integration

### **Month 2: Phase 4 (Mirror Layer)**
- Week 1-2: Texture extraction from data layer
- Week 3-4: Mirror layer rendering with correct dependencies

### **Month 3: Phase 5 (Zoom Layers)**
- Week 1-2: Camera transform system dependent on mirror layer
- Week 3-4: Zoom layer rendering

### **Future: Phase 6 (Filter Layers)**
- Pre-filters applied to data layer
- Post-filters applied to zoom layer
- Correct filter pipeline implementation

---

## 📦 **Phase 3A Store Implementation**

### **gameStore_3a.ts Creation**
Create Phase 3A store with selective imports from existing ECS architecture:

```typescript
// Phase 3A selective imports
import { PixeloidCoordinate, VertexCoordinate } from './types/ecs-coordinates'
import { GeometricObject, CreateGeometricObjectParams } from './types/ecs-data-layer'
import { MeshLevel, MeshVertexData } from './types/mesh-system'
import { dataLayerIntegration } from './store/ecs-data-layer-integration'
import { coordinateWASDMovement } from './store/ecs-coordination-functions'

// Phase 3A store implementation
export const gameStore_3a = proxy<GameState3A>({
  phase: '3A',
  mouse: { screen: createPixeloidCoordinate(0, 0), world: createVertexCoordinate(0, 0) },
  navigation: { offset: createPixeloidCoordinate(0, 0), isDragging: false },
  geometry: { objects: [], selectedId: null },
  mesh: { vertexData: null, level: 1, needsUpdate: false }
})
```

### **Selective Import Strategy**
- **Reuse**: 864 lines of existing excellent ECS code
- **New**: 100 lines of Phase 3A integration code
- **Result**: 90% reuse ratio - builds on existing architecture

### **Integration with Existing Game Files**
Phase 3A store integrates with current game components:
- **BackgroundGridRenderer**: Uses mesh system for checkboard pattern
- **MouseHighlightShader**: Uses coordinate system for highlighting
- **InputManager**: Uses WASD movement functions
- **StaticMeshManager**: Uses mesh level configuration

### **Future Phase Evolution**
- **Phase 4**: Import mirror layer components → `gameStore_4.ts`
- **Phase 5**: Import zoom layer components → `gameStore_5.ts`
- **Phase 6**: Import filter pipeline components → `gameStore_6.ts`

This progressive approach ensures each phase builds upon the previous while maintaining architecture consistency.

---

**This roadmap ensures Phase 3 creates a solid foundation that supports all future phases with correct dependencies. Each phase builds on the previous one following the proper data flow: Data → Mirror → Zoom → Filters.**