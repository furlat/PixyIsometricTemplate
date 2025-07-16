# Phase 3A: Core Foundation Plan - Mesh + Grid + Mouse + Navigation

## 🎯 **Ultra-Focused Objective**

Start with the absolute core to reveal the basic structure:
1. **StaticMeshManager** → **Grid Layer** (checkboard)
2. **Mouse Highlight Layer** (independent of grid)
3. **WASD Navigation** (offset setting)
4. **UI** displaying the location

Skip geometry for now. Focus on two independent layers both working from the same static mesh.

---

## 📊 **Core Foundation Architecture**

### **Foundation Structure**
```
┌─────────────────────────────────────────────────────────────────┐
│                 Phase 3A: Core Foundation                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│              ┌─────────────────────────────────────┐            │
│              │     StaticMeshManager (1 pixel)    │            │
│              │       provides vertex data         │            │
│              └─────────────────────────────────────┘            │
│                              │                                  │
│                    ┌─────────┴─────────┐                       │
│                    │                   │                       │
│                    ▼                   ▼                       │
│          ┌─────────────────┐   ┌─────────────────┐             │
│          │   Grid Layer    │   │ Mouse Highlight │             │
│          │   (checkboard)  │   │     Layer       │             │
│          │  - independent  │   │  - independent  │             │
│          │  - uses mesh    │   │  - uses mesh    │             │
│          └─────────────────┘   └─────────────────┘             │
│                                                                 │
│              ┌─────────────────────────────────────┐            │
│              │     WASD Navigation System          │            │
│              │    (offset setting in store)       │            │
│              └─────────────────────────────────────┘            │
│                                                                 │
│              ┌─────────────────────────────────────┐            │
│              │      UI Location Display           │            │
│              │   (shows current position)         │            │
│              └─────────────────────────────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 **What We Already Have (Perfect Match)**

### **1. StaticMeshManager - Already Perfect**
```typescript
// CURRENT: Perfect for 1 pixel mesh
export class StaticMeshManager {
  public initialize(initialPixeloidScale: number): void {
    this.setActiveMesh(initialPixeloidScale) // We'll use 1
  }
  
  public getActiveMesh(): StaticMeshData | null {
    return gameStore.staticMesh.activeMesh
  }
  
  public getCoordinateMapping(): PixeloidVertexMapping | null {
    return updateGameStore.getCurrentCoordinateMapping()
  }
}
```

### **2. BackgroundGridRenderer - Already Perfect**
```typescript
// CURRENT: Perfect for checkboard using mesh
export class BackgroundGridRenderer {
  private tryUseStaticMesh(): boolean {
    const staticMeshData = gameStore.staticMesh.activeMesh
    if (!staticMeshData) return false
    
    // ✅ Uses mesh vertices for checkboard
    this.createStaticMeshGrid(staticMeshData, ...)
    return true
  }
  
  // ✅ Perfect mesh interaction for mouse events
  private setupMeshInteraction(): void {
    this.mesh.on('globalpointermove', (event) => {
      const localPos = event.getLocalPosition(this.mesh)
      const vertexX = Math.floor(localPos.x)
      const vertexY = Math.floor(localPos.y)
      
      gameStore.mouse.vertex_position.x = vertexX
      gameStore.mouse.vertex_position.y = vertexY
    })
  }
}
```

### **3. MouseHighlightShader - Already Perfect**
```typescript
// CURRENT: Perfect for mouse highlighting
export class MouseHighlightShader {
  public render(): void {
    const mousePos = gameStore.mouse.vertex_position
    
    // ✅ Renders highlight at mouse position
    this.graphics.clear()
    this.graphics.rect(mousePos.x, mousePos.y, 20, 20)
    this.graphics.stroke({ width: 2, color: 0xff0000 })
  }
}
```

### **4. InputManager - Already Perfect**
```typescript
// CURRENT: Perfect for WASD navigation
export class InputManager {
  public updateMovement(deltaTime: number): void {
    const keys = gameStore.input.keys
    let deltaX = 0, deltaY = 0
    
    if (keys.w) deltaY -= baseDistance
    if (keys.s) deltaY += baseDistance
    if (keys.a) deltaX -= baseDistance
    if (keys.d) deltaX += baseDistance
    
    // ✅ Updates offset in store
    updateGameStore.updateMovementECS(deltaX, deltaY)
  }
}
```

### **5. Store System - Already Perfect**
```typescript
// CURRENT: Perfect for position tracking
export const gameStore = {
  mouse: {
    vertex_position: { x: 0, y: 0 },
    pixeloid_position: { x: 0, y: 0 }
  },
  cameraViewport: {
    geometry_sampling_position: { x: 0, y: 0 }
  },
  input: {
    keys: { w: false, a: false, s: false, d: false }
  }
}
```

---

## 🎯 **Phase 3A Core Implementation**

### **Step 1: Initialize Foundation (Day 1)**
```typescript
// In Game.ts - Ultra-simple initialization
export class Game {
  private staticMeshManager: StaticMeshManager
  private backgroundGridRenderer: BackgroundGridRenderer
  private mouseHighlightShader: MouseHighlightShader
  private inputManager: InputManager
  
  async init(): Promise<void> {
    // 1. Initialize mesh at 1 pixel
    this.staticMeshManager = new StaticMeshManager()
    this.staticMeshManager.initialize(1) // Single pixel mesh
    
    // 2. Initialize grid using mesh
    this.backgroundGridRenderer = new BackgroundGridRenderer()
    
    // 3. Initialize mouse highlight using mesh
    this.mouseHighlightShader = new MouseHighlightShader()
    
    // 4. Initialize input for WASD
    this.inputManager = new InputManager()
    this.inputManager.init(canvas, this)
    
    // 5. Add layers to stage
    this.app.stage.addChild(this.backgroundGridRenderer.getMesh())
    this.app.stage.addChild(this.mouseHighlightShader.getGraphics())
    
    // 6. Start render loop
    this.app.ticker.add(this.render.bind(this))
  }
  
  private render(): void {
    // Render grid (uses mesh)
    this.backgroundGridRenderer.render(
      this.getSimpleCorners(), 
      1 // Always 1 pixel
    )
    
    // Render mouse highlight (uses mesh mouse position)
    this.mouseHighlightShader.render()
  }
}
```

### **Step 2: Verify Two Independent Layers (Day 2)**
```typescript
// Test that both layers work independently
// 1. Grid layer renders checkboard from mesh
// 2. Mouse layer renders highlight from mesh mouse position
// 3. Both update independently
// 4. Both use same mesh foundation
```

### **Step 3: WASD Navigation (Day 3)**
```typescript
// Verify WASD updates store offset
// 1. Press W -> offset.y decreases
// 2. Press S -> offset.y increases
// 3. Press A -> offset.x decreases
// 4. Press D -> offset.x increases
// 5. Grid and mouse move together with offset
```

### **Step 4: UI Location Display (Day 4)**
```typescript
// Add simple UI showing current position
// 1. Display current offset from store
// 2. Display mouse position (vertex + pixeloid)
// 3. Update in real-time
// 4. Simple HTML overlay or PIXI text
```

---

## 🎮 **Key Components**

### **1. StaticMeshManager (Foundation)**
- **Purpose**: Provides 1-pixel mesh as foundation
- **Output**: Vertex data for both layers
- **Status**: Already implemented, just needs initialization at scale 1

### **2. Grid Layer (Layer 0)**
- **Purpose**: Checkboard background using mesh
- **Input**: Mesh vertices
- **Output**: Visual checkboard pattern
- **Status**: Already implemented (BackgroundGridRenderer)

### **3. Mouse Highlight Layer (Layer 1)**
- **Purpose**: Red square following mouse
- **Input**: Mouse position from mesh interaction
- **Output**: Visual highlight square
- **Status**: Already implemented (MouseHighlightShader)

### **4. WASD Navigation**
- **Purpose**: Move viewport offset
- **Input**: Keyboard events
- **Output**: Store offset updates
- **Status**: Already implemented (InputManager)

### **5. UI Location Display**
- **Purpose**: Show current position
- **Input**: Store state
- **Output**: Position text/numbers
- **Status**: Needs simple implementation

---

## 📋 **Implementation Timeline**

### **Day 1: Foundation Setup**
- Initialize StaticMeshManager at 1 pixel
- Setup Grid Layer using mesh
- Setup Mouse Highlight Layer using mesh
- Verify both layers render

### **Day 2: Independence Verification**
- Test grid renders independently
- Test mouse highlight renders independently
- Verify both use same mesh foundation
- Check performance (should be 60fps)

### **Day 3: WASD Navigation**
- Test WASD updates store offset
- Verify grid and mouse move together
- Test smooth movement
- Add snap-to-grid on key release

### **Day 4: UI Location Display**
- Add simple UI showing offset
- Add mouse position display
- Real-time updates
- Clean visual presentation

### **Day 5: Integration Testing**
- Test full system together
- Performance validation
- Architecture verification
- Prepare for geometry addition

---

## 🎯 **Success Criteria**

### **Phase 3A Core Complete When:**
- ✅ **Static Mesh**: 1-pixel mesh initialized and working
- ✅ **Grid Layer**: Checkboard renders using mesh data
- ✅ **Mouse Layer**: Highlight follows mouse using mesh interaction
- ✅ **Independence**: Both layers work independently
- ✅ **WASD**: Navigation updates store offset
- ✅ **UI**: Location display shows current position
- ✅ **Performance**: 60fps maintained
- ✅ **Foundation**: Ready for geometry layer addition

### **Architecture Validation:**
- ✅ **Mesh Foundation**: Single source of truth for both layers
- ✅ **Layer Independence**: Grid and mouse operate independently
- ✅ **Store Integration**: WASD updates store, UI reads store
- ✅ **Scalability**: Easy to add more layers later

---

## 🚀 **Why This Approach Works**

### **1. Reveals Structure**
- Shows how mesh provides foundation for multiple layers
- Demonstrates layer independence
- Proves store integration works

### **2. Minimal Complexity**
- Only 4 components to focus on
- No geometry complexity
- 1-pixel mesh keeps it simple

### **3. Existing Code Ready**
- StaticMeshManager already works
- BackgroundGridRenderer already uses mesh
- MouseHighlightShader already works
- InputManager already handles WASD

### **4. Clear Next Steps**
- Add geometry as Layer 2
- Add more layers as needed
- Scale up mesh when ready

---

## 📊 **Final Assessment**

**Current System**: **95% ready for Phase 3A Core**
**Required Work**: **5% - mostly initialization and UI**
**Timeline**: **5 days to complete Phase 3A Core**
**Risk**: **Very low - leveraging existing code**

This approach focuses on the absolute essentials to establish the mesh-based foundation and prove the architecture works with two independent layers.