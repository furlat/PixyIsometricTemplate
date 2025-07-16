# Phase 3: Mesh Data Architecture - Proper Layer Dependencies

## 🎯 **Understanding the Mesh Data Layer**

### **Key Insight: Mesh as Data Provider**
The mesh system is **not a visual layer** - it's a **data provider** that other layers depend on for:
- **Vertex coordinates** for rendering
- **Coordinate system** for the entire application
- **Pixel-perfect alignment** data
- **Mouse interaction** boundaries

### **Layer Dependencies (From PixiJS RenderLayer Pattern)**
```
Mesh Data System (Data Provider)
├── Provides vertices to → Checkboard Renderer
├── Provides vertices to → Data Layer (ECS geometry)
├── Provides vertices to → Mirror Layer (future)
└── Provides coordinates to → Mouse System
```

---

## 📊 **Correct MVP Architecture**

### **1. Mesh Data System (Foundation)**
```typescript
// StaticMeshManager.ts - Enhanced as data provider
export class StaticMeshManager {
  private vertexData: Float32Array
  private meshBounds: { width: number, height: number }
  private pixeloidScale: number = 1
  
  constructor() {
    this.generateMeshData()
  }
  
  private generateMeshData(): void {
    // Generate vertex data that other layers can use
    const vertices: number[] = []
    
    // Generate mesh covering viewport + buffer
    for (let x = -2000; x < 2000; x += 20) {
      for (let y = -2000; y < 2000; y += 20) {
        // Each cell has 4 vertices (top-left, top-right, bottom-right, bottom-left)
        vertices.push(
          x, y,           // top-left
          x + 20, y,      // top-right
          x + 20, y + 20, // bottom-right
          x, y + 20       // bottom-left
        )
      }
    }
    
    this.vertexData = new Float32Array(vertices)
    this.meshBounds = { width: 4000, height: 4000 }
  }
  
  // DATA PROVIDER METHODS
  public getVertices(): Float32Array {
    return this.vertexData
  }
  
  public getVerticesInBounds(bounds: { minX: number, maxX: number, minY: number, maxY: number }): Float32Array {
    // Return only vertices within bounds for efficient rendering
    const filteredVertices: number[] = []
    
    for (let i = 0; i < this.vertexData.length; i += 8) { // 8 values per cell (4 vertices * 2 coordinates)
      const x = this.vertexData[i]
      const y = this.vertexData[i + 1]
      
      if (x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY) {
        // Include this cell's vertices
        for (let j = 0; j < 8; j++) {
          filteredVertices.push(this.vertexData[i + j])
        }
      }
    }
    
    return new Float32Array(filteredVertices)
  }
  
  public getCoordinateAt(screenX: number, screenY: number): { x: number, y: number } {
    // Convert screen coordinates to mesh coordinates
    return {
      x: Math.floor(screenX / 20) * 20,
      y: Math.floor(screenY / 20) * 20
    }
  }
  
  public getMeshBounds(): { width: number, height: number } {
    return this.meshBounds
  }
}
```

### **2. Checkboard Renderer (Uses Mesh Data)**
```typescript
// CheckboardRenderer.ts - Uses mesh vertices for rendering
export class CheckboardRenderer {
  private container: Container
  private meshManager: StaticMeshManager
  private cachedSprite: Sprite | null = null
  
  constructor(meshManager: StaticMeshManager) {
    this.container = new Container()
    this.meshManager = meshManager
  }
  
  public render(viewportBounds: { minX: number, maxX: number, minY: number, maxY: number }): void {
    // Use mesh vertices for checkboard pattern
    const vertices = this.meshManager.getVerticesInBounds(viewportBounds)
    
    if (!this.cachedSprite) {
      this.generateCheckboardFromMesh(vertices)
    }
    
    // Toggle visibility
    this.container.visible = gameStore.ui.layerToggles.checkboard
  }
  
  private generateCheckboardFromMesh(vertices: Float32Array): void {
    const graphics = new Graphics()
    
    // Use mesh vertices to create checkboard pattern
    for (let i = 0; i < vertices.length; i += 8) { // 8 values per cell
      const x = vertices[i]
      const y = vertices[i + 1]
      
      // Determine color based on position
      const cellX = Math.floor(x / 20)
      const cellY = Math.floor(y / 20)
      const isLight = (cellX + cellY) % 2 === 0
      const color = isLight ? 0xf0f0f0 : 0xe0e0e0
      
      // Draw rectangle using mesh vertex data
      graphics.rect(x, y, 20, 20)
      graphics.fill(color)
    }
    
    // Cache as sprite for performance
    const texture = app.renderer.generateTexture(graphics)
    this.cachedSprite = new Sprite(texture)
    this.container.addChild(this.cachedSprite)
  }
  
  public getContainer(): Container {
    return this.container
  }
}
```

### **3. Data Layer Renderer (Uses Mesh Data)**
```typescript
// DataLayerRenderer.ts - Uses mesh coordinates for ECS rendering
export class DataLayerRenderer {
  private container: Container
  private meshManager: StaticMeshManager
  
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
    
    // Render objects using mesh coordinate system
    visibleObjects.forEach(obj => {
      const meshCoord = this.meshManager.getCoordinateAt(
        obj.x - samplingPosition.x,
        obj.y - samplingPosition.y
      )
      
      const graphics = new Graphics()
      this.renderGeometryObject(graphics, obj, meshCoord.x, meshCoord.y)
      this.container.addChild(graphics)
    })
    
    // Layer visibility from ECS config
    this.container.visible = ecsState.config.enableRendering
  }
  
  private renderGeometryObject(graphics: Graphics, obj: GeometryObject, x: number, y: number): void {
    // Render object aligned to mesh coordinates
    switch (obj.type) {
      case 'circle':
        graphics.circle(x, y, obj.radius)
        graphics.fill(obj.color)
        break
      case 'rectangle':
        graphics.rect(x, y, obj.width, obj.height)
        graphics.fill(obj.color)
        break
      // ... other shapes
    }
  }
  
  public getContainer(): Container {
    return this.container
  }
}
```

### **4. Mouse System (Uses Mesh Data)**
```typescript
// MouseSystem.ts - Uses mesh for interactions
export class MouseSystem {
  private meshManager: StaticMeshManager
  private highlightContainer: Container
  private currentHighlight: Graphics | null = null
  
  constructor(meshManager: StaticMeshManager) {
    this.meshManager = meshManager
    this.highlightContainer = new Container()
    this.setupMouseTracking()
  }
  
  private setupMouseTracking(): void {
    document.addEventListener('mousemove', (e) => {
      this.handleMouseMove(e.clientX, e.clientY)
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
  
  private updateHighlight(meshX: number, meshY: number): void {
    // Remove previous highlight
    if (this.currentHighlight) {
      this.highlightContainer.removeChild(this.currentHighlight)
    }
    
    // Create new highlight at mesh coordinates
    this.currentHighlight = new Graphics()
    this.currentHighlight.rect(meshX, meshY, 20, 20)
    this.currentHighlight.stroke({ width: 2, color: 0xff0000 })
    
    this.highlightContainer.addChild(this.currentHighlight)
  }
  
  public render(): void {
    // Toggle visibility
    this.highlightContainer.visible = gameStore.ui.layerToggles.mouseHighlight
  }
  
  public getContainer(): Container {
    return this.highlightContainer
  }
}
```

### **5. Main Canvas System (Layer Assembly)**
```typescript
// LayeredCanvas.ts - Assembles all layers using mesh data
export class LayeredCanvas {
  private container: Container
  private meshManager: StaticMeshManager
  private checkboardRenderer: CheckboardRenderer
  private dataLayerRenderer: DataLayerRenderer
  private mouseSystem: MouseSystem
  
  constructor(app: Application) {
    this.container = new Container()
    
    // Initialize mesh manager (data provider)
    this.meshManager = new StaticMeshManager()
    
    // Initialize renderers that depend on mesh data
    this.checkboardRenderer = new CheckboardRenderer(this.meshManager)
    this.dataLayerRenderer = new DataLayerRenderer(this.meshManager)
    this.mouseSystem = new MouseSystem(this.meshManager)
    
    this.setupLayers()
  }
  
  private setupLayers(): void {
    // Add layers in correct order (using PixiJS RenderLayer pattern)
    this.container.addChild(this.checkboardRenderer.getContainer())  // Background
    this.container.addChild(this.dataLayerRenderer.getContainer())   // Data layer
    this.container.addChild(this.mouseSystem.getContainer())         // Mouse highlight
  }
  
  public render(): void {
    // Calculate viewport bounds from ECS
    const ecsState = dataLayerIntegration.getCurrentState()
    const samplingPosition = ecsState.samplingWindow.position
    const viewportBounds = {
      minX: samplingPosition.x - 400,
      maxX: samplingPosition.x + 400,
      minY: samplingPosition.y - 300,
      maxY: samplingPosition.y + 300
    }
    
    // Render all layers (they use mesh data internally)
    this.checkboardRenderer.render(viewportBounds)
    this.dataLayerRenderer.render()
    this.mouseSystem.render()
  }
  
  public getContainer(): Container {
    return this.container
  }
}
```

---

## 🔧 **Key Architecture Benefits**

### **1. Single Source of Truth**
- **Mesh manager** provides coordinate system for entire application
- **All layers** use same vertex data for consistency
- **Pixel-perfect alignment** guaranteed across all layers

### **2. Efficient Data Reuse**
- **Vertex data** generated once, used by multiple layers
- **Coordinate calculations** centralized in mesh manager
- **Performance optimized** through data recycling

### **3. Clean Dependencies**
- **Mesh manager** has no dependencies (pure data provider)
- **Renderers** depend on mesh manager only
- **Layers** can be developed independently
- **Testing** easier with clear dependency chain

### **4. Proper PixiJS Integration**
- **RenderLayer pattern** followed for layer ordering
- **Container hierarchy** respects PixiJS best practices
- **Performance optimized** through proper layer management

---

## 🎯 **Implementation Order**

### **Week 1: Mesh Data System**
1. Enhance `StaticMeshManager` as data provider
2. Add vertex data generation and filtering
3. Add coordinate conversion methods
4. Test mesh data generation

### **Week 2: Checkboard Integration**
1. Create `CheckboardRenderer` that uses mesh data
2. Connect to mesh manager for vertices
3. Implement cached sprite generation
4. Test checkboard rendering with mesh data

### **Week 3: Data Layer Integration**
1. Create `DataLayerRenderer` that uses mesh coordinates
2. Connect to ECS data layer and mesh manager
3. Implement object rendering with mesh alignment
4. Test geometry rendering with mesh coordinates

### **Week 4: Mouse System Integration**
1. Create `MouseSystem` that uses mesh coordinates
2. Connect to mesh manager for coordinate conversion
3. Implement mouse highlight with mesh alignment
4. Test complete system integration

---

**This architecture properly separates the mesh data layer as a foundation that other layers depend on for coordinate and vertex data, following PixiJS RenderLayer patterns for proper layer management.**