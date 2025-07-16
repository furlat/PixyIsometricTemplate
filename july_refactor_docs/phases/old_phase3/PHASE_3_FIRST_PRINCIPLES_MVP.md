# Phase 3: First Principles MVP - No Existing Code Trust

## 🚨 **Critical Insight: Don't Trust Existing Code**

The existing code in `app/src/game/` appears to have ECS-like patterns, but this is **exactly the problem** - it's likely a **failed ECS implementation** that looks correct but has fundamental architectural issues. This is why we started the refactor in the first place.

## 🎯 **First Principles MVP Approach**

### **Core Principle: Build Fresh, Use ECS System**
- **Don't rely on existing game code** - it's likely broken
- **Use our new ECS system** as the source of truth
- **Build minimal working system** from scratch
- **Backup existing files** but don't trust their logic

---

## 📋 **What We Actually Need to Build**

### **MVP Components (Built from ECS System)**
1. **Geometry Layer with ECS WASD**
   - New geometry rendering that uses ECS data layer
   - WASD movement that updates ECS sampling position
   - Fixed scale 1 rendering (true ECS principle)

2. **Static Checkered Grid**
   - Independent grid rendering (separate from ECS)
   - Pixel-perfect alignment
   - No ECS integration (purely visual)

3. **Mouse Highlight System**
   - Mouse position tracking with ECS coordinates
   - Highlight rendering at correct ECS position
   - Real-time coordinate conversion

4. **Store UI Panel**
   - Display live ECS data layer state
   - Show sampling position updates
   - Performance monitoring

### **What We Will NOT Use**
- ❌ Existing `LayeredInfiniteCanvas` logic (likely broken)
- ❌ Existing `InputManager` WASD routing (likely broken)
- ❌ Existing `GeometryRenderer` (likely broken)
- ❌ Existing zoom/layer switching (likely broken)
- ❌ Existing coordinate systems (likely broken)

---

## 🔧 **Implementation Strategy: .backup and Rebuild**

### **File Strategy**
For each file we need to change:
1. **Copy to .backup** (preserve original)
2. **Analyze what it should do** (not what it does)
3. **Build new version** using ECS system
4. **Test incrementally** at each step

### **Prioritization**
- **Simple files first** (UI, basic rendering)
- **Complex files later** (full layer system)
- **Integration last** (connecting everything)

---

## 📊 **Phase 3 Implementation Plan**

### **Week 1: Core ECS Integration**

#### **3.1.1: Create New Geometry Renderer**
**File**: `app/src/game/GeometryRenderer.ts.backup` + new implementation

**Approach**: Build from scratch using ECS data layer

```typescript
// NEW GeometryRenderer.ts - Built from ECS principles
import { dataLayerIntegration } from '../store/ecs-data-layer-integration'

export class GeometryRenderer {
  private container: Container

  constructor() {
    this.container = new Container()
  }

  // NEW: Use ECS data layer as source of truth
  public render(): void {
    // Get data from ECS system (not gameStore)
    const ecsData = dataLayerIntegration.getCurrentState()
    const visibleObjects = ecsData.visibleObjects
    const samplingPosition = ecsData.samplingWindow.position
    
    // Clear previous render
    this.container.removeChildren()
    
    // Render objects with ECS sampling offset
    visibleObjects.forEach(obj => {
      this.renderObject(obj, samplingPosition)
    })
  }

  private renderObject(obj: GeometryObject, samplingPos: PixeloidCoordinate): void {
    // Fixed scale 1 rendering (true ECS principle)
    const graphics = new Graphics()
    
    // Apply ECS sampling position offset
    const renderX = obj.x - samplingPos.x
    const renderY = obj.y - samplingPos.y
    
    // Render based on object type
    switch (obj.type) {
      case 'circle':
        graphics.circle(renderX, renderY, obj.radius)
        break
      case 'rectangle':
        graphics.rect(renderX, renderY, obj.width, obj.height)
        break
      // ... other types
    }
    
    this.container.addChild(graphics)
  }
}
```

**Key Differences from Existing Code**:
- Uses ECS data layer as source of truth
- Fixed scale 1 rendering (no zoom handling)
- Applies ECS sampling position offset
- No legacy gameStore dependencies

#### **3.1.2: Create New Input Manager**
**File**: `app/src/game/InputManager.ts.backup` + new implementation

**Approach**: Build from scratch with ECS WASD routing

```typescript
// NEW InputManager.ts - Built from ECS principles
import { coordinateWASDMovement } from '../store/ecs-coordination-functions'

export class InputManager {
  private canvas: HTMLCanvasElement
  private keyStates = {
    w: false, a: false, s: false, d: false
  }

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    document.addEventListener('keydown', (e) => {
      this.handleKeyDown(e)
    })
    document.addEventListener('keyup', (e) => {
      this.handleKeyUp(e)
    })
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const key = e.key.toLowerCase()
    if (key in this.keyStates) {
      this.keyStates[key] = true
      e.preventDefault()
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    const key = e.key.toLowerCase()
    if (key in this.keyStates) {
      this.keyStates[key] = false
      e.preventDefault()
    }
  }

  // NEW: Update movement using ECS coordination
  public updateMovement(deltaTime: number): void {
    const moveSpeed = 50 // pixels per second
    let deltaX = 0
    let deltaY = 0

    if (this.keyStates.w) deltaY -= moveSpeed * deltaTime
    if (this.keyStates.s) deltaY += moveSpeed * deltaTime
    if (this.keyStates.a) deltaX -= moveSpeed * deltaTime
    if (this.keyStates.d) deltaX += moveSpeed * deltaTime

    // Route through ECS coordination (not gameStore)
    if (deltaX !== 0 || deltaY !== 0) {
      coordinateWASDMovement('data_layer', deltaX, deltaY)
    }
  }
}
```

**Key Differences from Existing Code**:
- Uses ECS coordination functions
- No zoom-dependent routing (MVP only has data layer)
- No legacy gameStore dependencies
- Simpler, focused implementation

#### **3.1.3: Create Minimal Canvas System**
**File**: `app/src/game/MinimalCanvas.ts` (NEW)

**Approach**: Build minimal rendering system from scratch

```typescript
// NEW MinimalCanvas.ts - Minimal ECS-based rendering
import { Application, Container } from 'pixi.js'
import { GeometryRenderer } from './GeometryRenderer'
import { GridRenderer } from './GridRenderer'
import { MouseHighlightRenderer } from './MouseHighlightRenderer'

export class MinimalCanvas {
  private app: Application
  private container: Container
  private geometryRenderer: GeometryRenderer
  private gridRenderer: GridRenderer
  private mouseRenderer: MouseHighlightRenderer

  constructor(app: Application) {
    this.app = app
    this.container = new Container()
    this.geometryRenderer = new GeometryRenderer()
    this.gridRenderer = new GridRenderer()
    this.mouseRenderer = new MouseHighlightRenderer()
    
    this.setupLayers()
  }

  private setupLayers(): void {
    // Grid layer (background)
    this.container.addChild(this.gridRenderer.getContainer())
    
    // Geometry layer (ECS data layer - no camera transform)
    this.container.addChild(this.geometryRenderer.getContainer())
    
    // Mouse layer (highlight)
    this.container.addChild(this.mouseRenderer.getContainer())
  }

  public render(): void {
    // Render each layer
    this.gridRenderer.render()
    this.geometryRenderer.render()
    this.mouseRenderer.render()
  }

  public getContainer(): Container {
    return this.container
  }
}
```

**Key Differences from Existing Code**:
- Minimal layer system (only what we need)
- No camera transforms (fixed scale 1)
- No complex layer switching
- Clean separation of concerns

### **Week 2: Grid and Mouse Systems**

#### **3.2.1: Create Independent Grid Renderer**
**File**: `app/src/game/GridRenderer.ts` (NEW)

**Approach**: Build grid system independent of ECS

```typescript
// NEW GridRenderer.ts - Independent grid rendering
export class GridRenderer {
  private container: Container
  private gridGraphics: Graphics

  constructor() {
    this.container = new Container()
    this.gridGraphics = new Graphics()
    this.container.addChild(this.gridGraphics)
  }

  public render(): void {
    this.gridGraphics.clear()
    
    // Simple checkered grid pattern
    const gridSize = 20
    const viewportWidth = 800
    const viewportHeight = 600
    
    for (let x = 0; x < viewportWidth; x += gridSize) {
      for (let y = 0; y < viewportHeight; y += gridSize) {
        const isLight = (Math.floor(x / gridSize) + Math.floor(y / gridSize)) % 2 === 0
        this.gridGraphics.rect(x, y, gridSize, gridSize)
        this.gridGraphics.fill(isLight ? 0xf0f0f0 : 0xe0e0e0)
      }
    }
  }

  public getContainer(): Container {
    return this.container
  }
}
```

#### **3.2.2: Create ECS Mouse Highlight**
**File**: `app/src/game/MouseHighlightRenderer.ts` (NEW)

**Approach**: Build mouse system using ECS coordinates

```typescript
// NEW MouseHighlightRenderer.ts - ECS-based mouse highlighting
import { dataLayerIntegration } from '../store/ecs-data-layer-integration'

export class MouseHighlightRenderer {
  private container: Container
  private highlightGraphics: Graphics

  constructor() {
    this.container = new Container()
    this.highlightGraphics = new Graphics()
    this.container.addChild(this.highlightGraphics)
    
    this.setupMouseTracking()
  }

  private setupMouseTracking(): void {
    document.addEventListener('mousemove', (e) => {
      this.updateMousePosition(e.clientX, e.clientY)
    })
  }

  private updateMousePosition(screenX: number, screenY: number): void {
    // Convert screen coordinates to ECS coordinates
    const ecsData = dataLayerIntegration.getCurrentState()
    const samplingPos = ecsData.samplingWindow.position
    
    const ecsX = screenX + samplingPos.x
    const ecsY = screenY + samplingPos.y
    
    // Update highlight position
    this.render(ecsX, ecsY)
  }

  public render(ecsX?: number, ecsY?: number): void {
    this.highlightGraphics.clear()
    
    if (ecsX !== undefined && ecsY !== undefined) {
      // Convert ECS coordinates back to screen coordinates
      const ecsData = dataLayerIntegration.getCurrentState()
      const samplingPos = ecsData.samplingWindow.position
      
      const screenX = ecsX - samplingPos.x
      const screenY = ecsY - samplingPos.y
      
      // Draw highlight
      this.highlightGraphics.rect(screenX, screenY, 20, 20)
      this.highlightGraphics.stroke({ width: 2, color: 0xff0000 })
    }
  }

  public getContainer(): Container {
    return this.container
  }
}
```

### **Week 3: UI Integration**

#### **3.3.1: Create ECS Store Panel**
**File**: `app/src/ui/ECSStorePanel.ts` (NEW)

**Approach**: Build UI that shows live ECS data

```typescript
// NEW ECSStorePanel.ts - Live ECS data display
import { dataLayerIntegration } from '../store/ecs-data-layer-integration'

export class ECSStorePanel {
  private panelElement: HTMLElement

  constructor() {
    this.panelElement = this.createPanelElement()
    this.startLiveUpdates()
  }

  private createPanelElement(): HTMLElement {
    const panel = document.createElement('div')
    panel.className = 'ecs-store-panel'
    panel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 10px;
      border-radius: 5px;
      font-family: monospace;
      font-size: 12px;
      z-index: 1000;
    `
    document.body.appendChild(panel)
    return panel
  }

  private startLiveUpdates(): void {
    setInterval(() => {
      this.updateDisplay()
    }, 100) // Update 10 times per second
  }

  private updateDisplay(): void {
    const ecsData = dataLayerIntegration.getCurrentState()
    
    this.panelElement.innerHTML = `
      <div><strong>ECS Data Layer</strong></div>
      <div>Scale: ${ecsData.scale}</div>
      <div>Sampling Position: ${ecsData.samplingWindow.position.x}, ${ecsData.samplingWindow.position.y}</div>
      <div>Objects Count: ${ecsData.allObjects.length}</div>
      <div>Visible Objects: ${ecsData.visibleObjects.length}</div>
      <div>Sampling Active: ${ecsData.sampling.isActive}</div>
      <div>Last Sample: ${ecsData.sampling.lastSampleTime}</div>
    `
  }
}
```

### **Week 4: Integration and Testing**

#### **3.4.1: Create Main Application**
**File**: `app/src/main.ts` (REPLACE)

**Approach**: Build new main application that uses our MVP system

```typescript
// NEW main.ts - MVP application
import { Application } from 'pixi.js'
import { MinimalCanvas } from './game/MinimalCanvas'
import { InputManager } from './game/InputManager'
import { ECSStorePanel } from './ui/ECSStorePanel'

async function init() {
  // Create PIXI application
  const app = new Application()
  await app.init({
    width: 800,
    height: 600,
    backgroundColor: 0x404040
  })

  // Add to DOM
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement
  canvas.replaceWith(app.canvas)

  // Create MVP system
  const minimalCanvas = new MinimalCanvas(app)
  const inputManager = new InputManager(app.canvas)
  const ecsPanel = new ECSStorePanel()

  // Add to stage
  app.stage.addChild(minimalCanvas.getContainer())

  // Game loop
  app.ticker.add((ticker) => {
    const deltaTime = ticker.deltaTime / 60
    inputManager.updateMovement(deltaTime)
    minimalCanvas.render()
  })

  console.log('MVP ECS System initialized')
}

// Start application
init().catch(console.error)
```

---

## 🧪 **Testing Strategy**

### **Incremental Testing**
1. **Week 1**: Test geometry rendering and WASD movement
2. **Week 2**: Test grid and mouse highlighting
3. **Week 3**: Test UI data display
4. **Week 4**: Test complete integrated system

### **Success Criteria**
- **Geometry renders** from ECS data layer
- **WASD movement** updates ECS sampling position
- **Grid renders** independently
- **Mouse highlight** uses ECS coordinates
- **UI displays** live ECS data
- **System runs** at 60fps

### **Validation Method**
- **Visual comparison** with original behavior
- **Performance monitoring** (no degradation)
- **ECS compliance** (fixed scale 1, proper sampling)
- **UI data accuracy** (matches ECS state)

---

## 🚫 **What We're NOT Doing**

### **Avoided Complexity**
- ❌ **Zoom behavior** (Phase 4)
- ❌ **Mirror layer** (Phase 4)
- ❌ **Layer switching** (Phase 4)
- ❌ **Complex filtering** (Phase 4)
- ❌ **Texture caching** (Phase 4)
- ❌ **Multi-layer coordination** (Phase 4)

### **Avoided Legacy Code**
- ❌ **Existing LayeredInfiniteCanvas** (likely broken)
- ❌ **Existing InputManager** (likely broken)
- ❌ **Existing coordinate systems** (likely broken)
- ❌ **Existing store integration** (likely broken)

---

## 🎯 **Why This Approach Will Work**

### **First Principles Benefits**
- **Clean implementation** using proven ECS system
- **No legacy baggage** from failed refactor attempts
- **Incremental validation** at each step
- **Clear success criteria** for each week

### **Risk Mitigation**
- **Backup files** for safety
- **Minimal scope** to avoid complexity
- **ECS system proven** in previous phases
- **Incremental approach** allows early problem detection

### **Foundation for Future**
- **Clean architecture** ready for expansion
- **Proven patterns** for future phases
- **ECS system validated** with real usage
- **Performance baseline** established

---

**This first principles approach builds a minimal but complete ECS system without relying on potentially broken existing code. It provides a solid foundation for future phases while validating that our ECS architecture works in practice.**