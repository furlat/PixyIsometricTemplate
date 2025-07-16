# Phase 3A: Implementation Plan - ECS Dual-Layer Architecture

## 🎯 **Phase 3A Objective**

Implement the foundation layers (0-1) of the ECS dual-layer architecture with proper dependencies for future phases.

### **Primary Goals**
1. **Mesh Data System** - Central vertex provider for all layers
2. **Checkboard Layer** - Static background using mesh data
3. **Data Layer** - ECS geometry at scale 1 using mesh coordinates
4. **Mouse System** - Interaction layer using mesh data
5. **Setup infrastructure** for Phase 4+ dependencies

---

## 📊 **Architecture Implementation**

### **Layer Architecture with Dependencies**
```
┌─────────────────────────────────────────────────────────────────┐
│                  Phase 3A Implementation                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│          ┌─────────────────────────────────────────┐            │
│          │     StaticMeshManager (Foundation)     │            │
│          │    (provides vertices to all layers)   │            │
│          └─────────────────────────────────────────┘            │
│                              │                                  │
│          ┌───────────────────┼───────────────────┐             │
│          │                   │                   │             │
│          ▼                   ▼                   ▼             │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐          │
│   │   Layer 0   │   │   Layer 1   │   │   Layer 2   │          │
│   │CheckboardRdr│   │DataLayerRdr │   │MirrorLayerRdr│          │
│   │(IMPLEMENT)  │   │(IMPLEMENT)  │   │(SETUP ONLY) │          │
│   └─────────────┘   └─────────────┘   │ texture     │          │
│                              │        │ extraction  │          │
│                              │        │ from data ◄─┼──────────┤
│                              └────────┼─────────────┘          │
│                                       └─────────────┘          │
│                                                                 │
│                    ┌─────────────────────────────────────────┐ │
│                    │        MouseSystem (Top)               │ │
│                    │       (IMPLEMENT)                      │ │
│                    └─────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ **Implementation Steps**

### **Week 1: Foundation Setup**

#### **Day 1-2: Enhanced StaticMeshManager**
```typescript
// app/src/game/StaticMeshManager.ts
export class StaticMeshManager {
  private vertexData: Float32Array
  private cellSize: number = 20
  private meshBounds: BoundingBox
  
  constructor() {
    this.generateMeshData()
  }
  
  // Phase 3A: Core vertex provision
  public getVertices(): Float32Array {
    return this.vertexData
  }
  
  public getVerticesInBounds(bounds: BoundingBox): Float32Array {
    return this.filterVerticesByBounds(bounds)
  }
  
  public getCoordinateAt(x: number, y: number): { x: number, y: number } {
    return {
      x: Math.floor(x / this.cellSize) * this.cellSize,
      y: Math.floor(y / this.cellSize) * this.cellSize
    }
  }
  
  // Phase 4: Ready for texture extraction
  public getTextureRegion(bounds: BoundingBox): Float32Array {
    return this.getVerticesInBounds(bounds)
  }
}
```

#### **Day 3-4: MeshIntegrationLayer Coordinator**
```typescript
// app/src/game/MeshIntegrationLayer.ts
export class MeshIntegrationLayer {
  private meshManager: StaticMeshManager
  private layerRenderers: Map<string, LayerRenderer> = new Map()
  private layerDependencies: Map<string, string[]> = new Map()
  
  constructor() {
    this.meshManager = new StaticMeshManager()
    this.setupDependencies()
  }
  
  private setupDependencies(): void {
    this.layerDependencies.set('checkboard', []) // No dependencies
    this.layerDependencies.set('data', []) // No dependencies
    this.layerDependencies.set('mirror', ['data']) // Depends on data
    this.layerDependencies.set('zoom', ['mirror']) // Depends on mirror
    this.layerDependencies.set('filter', ['data', 'zoom']) // Depends on data + zoom
  }
  
  // Phase 3A: Register basic layers
  public registerLayer(name: string, renderer: LayerRenderer): void {
    renderer.setMeshManager(this.meshManager)
    this.layerRenderers.set(name, renderer)
  }
  
  // Phase 4: Register mirror layer with data dependency
  public registerMirrorLayer(renderer: MirrorLayerRenderer): void {
    renderer.setMeshManager(this.meshManager)
    const dataLayer = this.layerRenderers.get('data') as DataLayerRenderer
    if (dataLayer) {
      renderer.setDataLayer(dataLayer) // Set dependency
    }
    this.layerRenderers.set('mirror', renderer)
  }
  
  public getMeshManager(): StaticMeshManager {
    return this.meshManager
  }
}
```

#### **Day 5: Base LayerRenderer Interface**
```typescript
// app/src/game/LayerRenderer.ts
export interface LayerRenderer {
  setMeshManager(meshManager: StaticMeshManager): void
  render(): void
  getContainer(): Container
}
```

### **Week 2: Checkboard Layer Implementation**

#### **Day 1-3: CheckboardRenderer**
```typescript
// app/src/game/CheckboardRenderer.ts
export class CheckboardRenderer implements LayerRenderer {
  private container: Container
  private meshManager: StaticMeshManager
  private cachedSprite: Sprite | null = null
  
  constructor() {
    this.container = new Container()
  }
  
  public setMeshManager(meshManager: StaticMeshManager): void {
    this.meshManager = meshManager
    this.generateCheckboard()
  }
  
  private generateCheckboard(): void {
    // Use mesh vertices for pixel-perfect checkboard
    const vertices = this.meshManager.getVertices()
    const graphics = new Graphics()
    
    // Generate checkboard pattern using mesh data
    for (let i = 0; i < vertices.length; i += 8) {
      const x = vertices[i]
      const y = vertices[i + 1]
      
      const cellX = Math.floor(x / 20)
      const cellY = Math.floor(y / 20)
      const isLight = (cellX + cellY) % 2 === 0
      
      graphics.rect(x, y, 20, 20)
      graphics.fill(isLight ? 0xf0f0f0 : 0xe0e0e0)
    }
    
    // Cache as sprite for performance
    const texture = app.renderer.generateTexture(graphics)
    this.cachedSprite = new Sprite(texture)
    this.container.addChild(this.cachedSprite)
  }
  
  public render(): void {
    // Phase 3A: Simple visibility toggle
    const ecsState = dataLayerIntegration.getCurrentState()
    this.container.visible = ecsState.config.enableCheckboard
  }
  
  public getContainer(): Container {
    return this.container
  }
}
```

### **Week 3: Data Layer Implementation**

#### **Day 1-4: DataLayerRenderer**
```typescript
// app/src/game/DataLayerRenderer.ts
export class DataLayerRenderer implements LayerRenderer {
  private container: Container
  private meshManager: StaticMeshManager
  private objectContainers: Map<string, Container> = new Map()
  
  constructor() {
    this.container = new Container()
  }
  
  public setMeshManager(meshManager: StaticMeshManager): void {
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
  
  private renderGeometryObject(graphics: Graphics, obj: GeometryObject, x: number, y: number): void {
    graphics.clear()
    
    switch (obj.type) {
      case 'circle':
        graphics.circle(x, y, obj.radius || 10)
        graphics.fill(obj.color || 0x00ff00)
        break
      case 'rectangle':
        graphics.rect(x, y, obj.width || 20, obj.height || 20)
        graphics.fill(obj.color || 0x0000ff)
        break
    }
  }
  
  public getContainer(): Container {
    return this.container
  }
  
  // Phase 4: Ready for texture extraction
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

#### **Day 1-3: MouseSystem**
```typescript
// app/src/game/MouseSystem.ts
export class MouseSystem implements LayerRenderer {
  private container: Container
  private meshManager: StaticMeshManager
  private currentHighlight: Graphics | null = null
  
  constructor() {
    this.container = new Container()
    this.setupEventListeners()
  }
  
  public setMeshManager(meshManager: StaticMeshManager): void {
    this.meshManager = meshManager
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
    // Phase 3A: Simple visibility toggle
    const ecsState = dataLayerIntegration.getCurrentState()
    this.container.visible = ecsState.config.enableMouseHighlight
  }
  
  public getContainer(): Container {
    return this.container
  }
}
```

#### **Day 4-5: Main Game App**
```typescript
// app/src/game/Game.ts
export class Game {
  private app: Application
  private meshIntegrationLayer: MeshIntegrationLayer
  private checkboardRenderer: CheckboardRenderer
  private dataLayerRenderer: DataLayerRenderer
  private mouseSystem: MouseSystem
  
  constructor() {
    this.app = new Application({
      width: 1200,
      height: 800,
      backgroundColor: 0x1099bb,
    })
    
    this.setupLayers()
    this.startRenderLoop()
  }
  
  private setupLayers(): void {
    // Initialize mesh integration layer
    this.meshIntegrationLayer = new MeshIntegrationLayer()
    
    // Create renderers
    this.checkboardRenderer = new CheckboardRenderer()
    this.dataLayerRenderer = new DataLayerRenderer()
    this.mouseSystem = new MouseSystem()
    
    // Register layers with mesh manager
    this.meshIntegrationLayer.registerLayer('checkboard', this.checkboardRenderer)
    this.meshIntegrationLayer.registerLayer('data', this.dataLayerRenderer)
    this.meshIntegrationLayer.registerLayer('mouse', this.mouseSystem)
    
    // Add to stage in correct order
    this.app.stage.addChild(this.checkboardRenderer.getContainer())
    this.app.stage.addChild(this.dataLayerRenderer.getContainer())
    this.app.stage.addChild(this.mouseSystem.getContainer())
  }
  
  private startRenderLoop(): void {
    const renderLoop = () => {
      // Phase 3A: Render all current layers
      this.checkboardRenderer.render()
      this.dataLayerRenderer.render()
      this.mouseSystem.render()
      
      requestAnimationFrame(renderLoop)
    }
    
    renderLoop()
  }
  
  public getApp(): Application {
    return this.app
  }
  
  // Phase 4: Ready for mirror layer addition
  public addMirrorLayer(mirrorRenderer: MirrorLayerRenderer): void {
    this.meshIntegrationLayer.registerMirrorLayer(mirrorRenderer)
    this.app.stage.addChild(mirrorRenderer.getContainer())
  }
}
```

---

## 🎯 **Phase 3A Success Criteria**

### **Technical Requirements**
- ✅ **Mesh Data System**: StaticMeshManager provides vertices to all layers
- ✅ **Checkboard Layer**: Static background using mesh data
- ✅ **Data Layer**: ECS geometry rendering with mesh alignment
- ✅ **Mouse System**: Interaction layer with mesh coordinates
- ✅ **Performance**: 60fps at scale 1
- ✅ **Integration**: MeshIntegrationLayer coordinates all components

### **Future-Proof Requirements**
- ✅ **Dependency Infrastructure**: Ready for Phase 4 mirror layer dependencies
- ✅ **Extensible Design**: No breaking changes required for future phases
- ✅ **ECS Compliance**: Fixed scale 1 data layer maintained
- ✅ **Clean Interfaces**: LayerRenderer interface for all layers

---

## 🚀 **Integration Test Plan**

### **Week 5: Testing and Validation**

#### **Day 1-2: Unit Tests**
- StaticMeshManager vertex generation
- LayerRenderer interface compliance
- Mouse coordinate conversion accuracy
- ECS data layer integration

#### **Day 3-4: Integration Tests**
- MeshIntegrationLayer coordination
- Layer rendering order validation
- Performance benchmarks (60fps requirement)
- Memory usage monitoring

#### **Day 5: Phase 4 Readiness**
- Mirror layer dependency setup validation
- Texture extraction interface testing
- Architecture dependency verification

---

## 📋 **Deliverables**

### **Phase 3A Complete Files**
- `app/src/game/StaticMeshManager.ts` - Enhanced mesh system
- `app/src/game/MeshIntegrationLayer.ts` - Coordination layer
- `app/src/game/LayerRenderer.ts` - Base interface
- `app/src/game/CheckboardRenderer.ts` - Layer 0 implementation
- `app/src/game/DataLayerRenderer.ts` - Layer 1 implementation
- `app/src/game/MouseSystem.ts` - Mouse interaction layer
- `app/src/game/Game.ts` - Main application
- `app/src/game/index.ts` - Updated exports

### **Phase 4 Ready Infrastructure**
- Dependency injection system in MeshIntegrationLayer
- DataLayerRenderer texture extraction methods
- LayerRenderer interface for consistent layer management
- ECS integration maintained for future phases

---

This implementation plan ensures Phase 3A creates a solid foundation with proper dependencies for future phases while maintaining the ECS dual-layer architecture principles.