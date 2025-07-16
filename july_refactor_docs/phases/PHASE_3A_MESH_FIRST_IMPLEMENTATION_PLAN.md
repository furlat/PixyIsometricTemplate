# Phase 3A Mesh-First Implementation Plan

## 🎯 **Objective**
Transform the current Phase 3A implementation from its current state to a proper mesh-first architecture with complete module separation and all missing methods implemented.

## 📋 **Current State Analysis**

### **Current Problems Identified**
1. **BackgroundGridRenderer_3a.ts**: Mixing mesh creation + grid rendering (violates separation)
2. **gameStore_3a.ts**: Using hardcoded `/20` division instead of mesh coordinates
3. **Mouse Events**: Using screen coordinates instead of mesh.getLocalPosition()
4. **Missing Methods**: Many methods referenced but not implemented
5. **Incomplete Integration**: Store doesn't properly receive mesh vertex data

### **Current Files to Fix**
- `app/src/game/BackgroundGridRenderer_3a.ts` - Split into modules
- `app/src/store/gameStore_3a.ts` - Fix coordinate system
- `app/src/game/MouseHighlightShader_3a.ts` - Use mesh coordinates
- `app/src/game/InputManager_3a.ts` - Fix coordinate handling
- `app/src/game/Phase3ACanvas.ts` - Update to use new modules

## 🔧 **Implementation Plan**

### **Phase 1: Create Mesh-First Foundation (Day 1)**

#### **Step 1.1: Create MeshManager_3a.ts (NEW FILE)**
```typescript
// app/src/game/MeshManager_3a.ts
import { MeshSimple, Texture } from 'pixi.js'
import { VertexCoordinate } from '../types/ecs-coordinates'

export class MeshManager_3a {
  private mesh: MeshSimple | null = null
  private vertices: Float32Array | null = null
  private indices: Uint32Array | null = null
  private cellSize: number = 20 // Fixed cell size for Phase 3A
  
  constructor() {
    this.generateMesh()
  }
  
  private generateMesh(): void {
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    const gridWidth = Math.ceil(screenWidth / this.cellSize)
    const gridHeight = Math.ceil(screenHeight / this.cellSize)
    
    console.log(`Generating mesh: ${gridWidth}x${gridHeight} cells`)
    
    const vertices: number[] = []
    const indices: number[] = []
    
    let vertexIndex = 0
    for (let x = 0; x < gridWidth; x++) {
      for (let y = 0; y < gridHeight; y++) {
        const screenX = x * this.cellSize
        const screenY = y * this.cellSize
        
        // Create quad vertices for each cell
        vertices.push(
          screenX, screenY,                              // top-left
          screenX + this.cellSize, screenY,              // top-right
          screenX + this.cellSize, screenY + this.cellSize, // bottom-right
          screenX, screenY + this.cellSize               // bottom-left
        )
        
        // Create triangle indices for the quad
        const base = vertexIndex * 4
        indices.push(
          base + 0, base + 1, base + 2,  // First triangle
          base + 0, base + 2, base + 3   // Second triangle
        )
        
        vertexIndex++
      }
    }
    
    this.vertices = new Float32Array(vertices)
    this.indices = new Uint32Array(indices)
    
    console.log(`Mesh generated: ${this.vertices.length / 2} vertices, ${this.indices.length / 3} triangles`)
    
    // Create PIXI mesh
    this.mesh = new MeshSimple({
      texture: Texture.WHITE,
      vertices: this.vertices,
      indices: this.indices
    })
  }
  
  // Authoritative mesh access
  public getMesh(): MeshSimple | null {
    return this.mesh
  }
  
  public getVertices(): Float32Array | null {
    return this.vertices
  }
  
  public getIndices(): Uint32Array | null {
    return this.indices
  }
  
  // Convert screen coordinates to mesh vertex coordinates
  public screenToVertex(screenX: number, screenY: number): VertexCoordinate {
    const vertexX = Math.floor(screenX / this.cellSize)
    const vertexY = Math.floor(screenY / this.cellSize)
    return { x: vertexX, y: vertexY }
  }
  
  // Convert mesh vertex coordinates to screen coordinates
  public vertexToScreen(vertexX: number, vertexY: number): { x: number, y: number } {
    return {
      x: vertexX * this.cellSize,
      y: vertexY * this.cellSize
    }
  }
  
  // Get mesh cell size
  public getCellSize(): number {
    return this.cellSize
  }
  
  // Get mesh dimensions
  public getMeshDimensions(): { width: number, height: number } {
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    return {
      width: Math.ceil(screenWidth / this.cellSize),
      height: Math.ceil(screenHeight / this.cellSize)
    }
  }
  
  // Cleanup
  public destroy(): void {
    if (this.mesh) {
      this.mesh.destroy()
      this.mesh = null
    }
    this.vertices = null
    this.indices = null
  }
}
```

#### **Step 1.2: Create GridShaderRenderer_3a.ts (NEW FILE)**
```typescript
// app/src/game/GridShaderRenderer_3a.ts
import { Shader, MeshSimple } from 'pixi.js'
import { MeshManager_3a } from './MeshManager_3a'

export class GridShaderRenderer_3a {
  private shader: Shader | null = null
  private meshManager: MeshManager_3a
  
  constructor(meshManager: MeshManager_3a) {
    this.meshManager = meshManager
    this.createCheckboardShader()
  }
  
  private createCheckboardShader(): void {
    const vertexShader = `
      attribute vec2 aPosition;
      attribute vec2 aUV;
      varying vec2 vUV;
      varying vec2 vPosition;
      
      uniform mat3 uProjectionMatrix;
      uniform mat3 uWorldTransformMatrix;
      uniform mat3 uTransformMatrix;
      
      void main() {
        mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
        gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
        vUV = aUV;
        vPosition = aPosition;
      }
    `
    
    const fragmentShader = `
      precision mediump float;
      varying vec2 vUV;
      varying vec2 vPosition;
      
      uniform float uCellSize;
      
      void main() {
        // Calculate grid cell coordinates
        vec2 cellCoord = floor(vPosition / uCellSize);
        
        // Calculate checkerboard pattern
        float checker = mod(cellCoord.x + cellCoord.y, 2.0);
        
        // Light and dark colors
        vec3 lightColor = vec3(0.941, 0.941, 0.941); // #f0f0f0
        vec3 darkColor = vec3(0.878, 0.878, 0.878);  // #e0e0e0
        
        // Mix colors based on checker pattern
        vec3 color = mix(lightColor, darkColor, checker);
        
        gl_FragColor = vec4(color, 1.0);
      }
    `
    
    this.shader = Shader.from({
      gl: {
        vertex: vertexShader,
        fragment: fragmentShader
      },
      resources: {
        uCellSize: this.meshManager.getCellSize()
      }
    })
    
    console.log('Grid shader created with cell size:', this.meshManager.getCellSize())
  }
  
  public render(): void {
    const mesh = this.meshManager.getMesh()
    if (mesh && this.shader) {
      // Apply shader to mesh
      (mesh as any).shader = this.shader
      console.log('Grid shader applied to mesh')
    }
  }
  
  public getMesh(): MeshSimple | null {
    return this.meshManager.getMesh()
  }
  
  public destroy(): void {
    if (this.shader) {
      this.shader.destroy()
      this.shader = null
    }
  }
}
```

#### **Step 1.3: Update BackgroundGridRenderer_3a.ts (ORCHESTRATOR)**
```typescript
// app/src/game/BackgroundGridRenderer_3a.ts - Updated to be orchestrator
import { MeshSimple } from 'pixi.js'
import { MeshManager_3a } from './MeshManager_3a'
import { GridShaderRenderer_3a } from './GridShaderRenderer_3a'
import { gameStore_3a_methods } from '../store/gameStore_3a'

export class BackgroundGridRenderer_3a {
  private meshManager: MeshManager_3a
  private gridShaderRenderer: GridShaderRenderer_3a
  
  constructor() {
    console.log('BackgroundGridRenderer_3a: Initializing with mesh-first architecture')
    
    // Create mesh manager (authoritative source)
    this.meshManager = new MeshManager_3a()
    
    // Create grid shader renderer (visual layer)
    this.gridShaderRenderer = new GridShaderRenderer_3a(this.meshManager)
    
    // Setup mesh interaction
    this.setupMeshInteraction()
    
    console.log('BackgroundGridRenderer_3a: Initialization complete')
  }
  
  private setupMeshInteraction(): void {
    const mesh = this.meshManager.getMesh()
    if (!mesh) {
      console.warn('BackgroundGridRenderer_3a: No mesh available for interaction')
      return
    }
    
    mesh.eventMode = 'static'
    mesh.interactiveChildren = false
    
    console.log('BackgroundGridRenderer_3a: Setting up mesh interaction')
    
    // ✅ MESH-FIRST MOUSE EVENTS
    mesh.on('globalpointermove', (event) => {
      // Get local position from mesh (authoritative)
      const localPos = event.getLocalPosition(mesh)
      
      // Convert to vertex coordinates using mesh manager
      const vertexCoord = this.meshManager.screenToVertex(localPos.x, localPos.y)
      
      // ✅ USE MESH COORDINATES (no hardcoded division)
      gameStore_3a_methods.updateMousePosition(vertexCoord.x, vertexCoord.y)
    })
    
    mesh.on('globalpointermove', (event) => {
      console.log('Mouse move event:', {
        global: { x: event.globalX, y: event.globalY },
        local: event.getLocalPosition(mesh),
        vertex: this.meshManager.screenToVertex(event.getLocalPosition(mesh).x, event.getLocalPosition(mesh).y)
      })
    })
  }
  
  public render(): void {
    // Render grid shader
    this.gridShaderRenderer.render()
  }
  
  public getMesh(): MeshSimple | null {
    return this.meshManager.getMesh()
  }
  
  public getMeshManager(): MeshManager_3a {
    return this.meshManager
  }
  
  public destroy(): void {
    this.meshManager.destroy()
    this.gridShaderRenderer.destroy()
  }
}
```

### **Phase 2: Fix Store Coordinate System (Day 2)**

#### **Step 2.1: Update gameStore_3a.ts (REMOVE /20 DIVISION)**
```typescript
// app/src/store/gameStore_3a.ts - Fixed coordinate system
import { proxy } from 'valtio'
import { PixeloidCoordinate, VertexCoordinate } from '../types/ecs-coordinates'

interface GameState_3a {
  phase: string
  mouse: {
    screen: PixeloidCoordinate
    vertex: VertexCoordinate    // ✅ MESH VERTEX COORDINATES
    world: PixeloidCoordinate   // ✅ WORLD COORDINATES
  }
  navigation: {
    offset: PixeloidCoordinate
    isDragging: boolean
  }
  geometry: {
    objects: any[]
    selectedId: string | null
  }
  mesh: {
    vertexData: Float32Array | null
    cellSize: number
    dimensions: { width: number, height: number }
    needsUpdate: boolean
  }
}

export const gameStore_3a = proxy<GameState_3a>({
  phase: '3A',
  mouse: {
    screen: { x: 0, y: 0 },
    vertex: { x: 0, y: 0 },    // ✅ MESH VERTEX COORDINATES
    world: { x: 0, y: 0 }      // ✅ WORLD COORDINATES
  },
  navigation: {
    offset: { x: 0, y: 0 },
    isDragging: false
  },
  geometry: {
    objects: [],
    selectedId: null
  },
  mesh: {
    vertexData: null,
    cellSize: 20,
    dimensions: { width: 0, height: 0 },
    needsUpdate: false
  }
})

// Store methods with mesh-first coordinate system
export const gameStore_3a_methods = {
  // ✅ MESH-FIRST MOUSE POSITION UPDATE
  updateMousePosition(vertexX: number, vertexY: number): void {
    console.log('gameStore_3a: Updating mouse position', { vertexX, vertexY })
    
    // Store mesh vertex coordinates (authoritative)
    gameStore_3a.mouse.vertex.x = vertexX
    gameStore_3a.mouse.vertex.y = vertexY
    
    // Calculate world coordinates (vertex + offset)
    gameStore_3a.mouse.world.x = vertexX + gameStore_3a.navigation.offset.x
    gameStore_3a.mouse.world.y = vertexY + gameStore_3a.navigation.offset.y
    
    // Calculate screen coordinates (vertex * cellSize)
    gameStore_3a.mouse.screen.x = vertexX * gameStore_3a.mesh.cellSize
    gameStore_3a.mouse.screen.y = vertexY * gameStore_3a.mesh.cellSize
  },
  
  // Navigation methods
  updateNavigationOffset(deltaX: number, deltaY: number): void {
    console.log('gameStore_3a: Updating navigation offset', { deltaX, deltaY })
    
    gameStore_3a.navigation.offset.x += deltaX
    gameStore_3a.navigation.offset.y += deltaY
    
    // Recalculate world coordinates
    gameStore_3a.mouse.world.x = gameStore_3a.mouse.vertex.x + gameStore_3a.navigation.offset.x
    gameStore_3a.mouse.world.y = gameStore_3a.mouse.vertex.y + gameStore_3a.navigation.offset.y
  },
  
  // Mesh system methods
  updateMeshData(vertexData: Float32Array, cellSize: number, dimensions: { width: number, height: number }): void {
    console.log('gameStore_3a: Updating mesh data', { cellSize, dimensions })
    
    gameStore_3a.mesh.vertexData = vertexData
    gameStore_3a.mesh.cellSize = cellSize
    gameStore_3a.mesh.dimensions = dimensions
    gameStore_3a.mesh.needsUpdate = false
  },
  
  // Geometry methods
  addGeometryObject(object: any): void {
    console.log('gameStore_3a: Adding geometry object', object)
    gameStore_3a.geometry.objects.push(object)
  },
  
  removeGeometryObject(objectId: string): void {
    console.log('gameStore_3a: Removing geometry object', objectId)
    gameStore_3a.geometry.objects = gameStore_3a.geometry.objects.filter(obj => obj.id !== objectId)
  },
  
  selectGeometryObject(objectId: string | null): void {
    console.log('gameStore_3a: Selecting geometry object', objectId)
    gameStore_3a.geometry.selectedId = objectId
  }
}
```

#### **Step 2.2: Update MouseHighlightShader_3a.ts (USE MESH COORDINATES)**
```typescript
// app/src/game/MouseHighlightShader_3a.ts - Use mesh coordinates
import { Graphics } from 'pixi.js'
import { gameStore_3a } from '../store/gameStore_3a'

export class MouseHighlightShader_3a {
  private graphics: Graphics
  
  constructor() {
    this.graphics = new Graphics()
    console.log('MouseHighlightShader_3a: Initialized')
  }
  
  public render(): void {
    // Clear previous highlight
    this.graphics.clear()
    
    // ✅ USE MESH VERTEX COORDINATES (authoritative)
    const mouseVertex = gameStore_3a.mouse.vertex
    const cellSize = gameStore_3a.mesh.cellSize
    
    if (mouseVertex && cellSize > 0) {
      // Convert vertex coordinates to screen coordinates for rendering
      const screenX = mouseVertex.x * cellSize
      const screenY = mouseVertex.y * cellSize
      
      // Draw highlight rectangle
      this.graphics.rect(screenX, screenY, cellSize, cellSize)
      this.graphics.stroke({ width: 2, color: 0xff0000 })
      
      console.log('MouseHighlightShader_3a: Rendered highlight at', { 
        vertex: mouseVertex, 
        screen: { x: screenX, y: screenY },
        cellSize 
      })
    }
  }
  
  public getGraphics(): Graphics {
    return this.graphics
  }
  
  public destroy(): void {
    if (this.graphics) {
      this.graphics.destroy()
    }
  }
}
```

### **Phase 3: Update Canvas Integration (Day 3)**

#### **Step 3.1: Update Phase3ACanvas.ts (MESH-FIRST INTEGRATION)**
```typescript
// app/src/game/Phase3ACanvas.ts - Updated with mesh-first modules
import { Application, Container } from 'pixi.js'
import { BackgroundGridRenderer_3a } from './BackgroundGridRenderer_3a'
import { MouseHighlightShader_3a } from './MouseHighlightShader_3a'
import { gameStore_3a_methods } from '../store/gameStore_3a'

export class Phase3ACanvas {
  private app: Application
  private backgroundGridRenderer: BackgroundGridRenderer_3a
  private mouseHighlightShader: MouseHighlightShader_3a
  
  // 2-layer system
  private gridLayer: Container
  private mouseLayer: Container
  
  constructor(app: Application) {
    this.app = app
    console.log('Phase3ACanvas: Initializing with mesh-first architecture')
    
    // Initialize renderers with mesh-first architecture
    this.backgroundGridRenderer = new BackgroundGridRenderer_3a()
    this.mouseHighlightShader = new MouseHighlightShader_3a()
    
    // Setup layers
    this.setupLayers()
    
    // Initialize mesh data in store
    this.initializeMeshData()
    
    console.log('Phase3ACanvas: Initialization complete')
  }
  
  private setupLayers(): void {
    // Create layer containers
    this.gridLayer = new Container()
    this.mouseLayer = new Container()
    
    // Add layers to stage in correct order
    this.app.stage.addChild(this.gridLayer)
    this.app.stage.addChild(this.mouseLayer)
    
    console.log('Phase3ACanvas: Layers setup complete')
  }
  
  private initializeMeshData(): void {
    const meshManager = this.backgroundGridRenderer.getMeshManager()
    const vertices = meshManager.getVertices()
    const cellSize = meshManager.getCellSize()
    const dimensions = meshManager.getMeshDimensions()
    
    if (vertices) {
      gameStore_3a_methods.updateMeshData(vertices, cellSize, dimensions)
      console.log('Phase3ACanvas: Mesh data initialized in store', { cellSize, dimensions })
    }
  }
  
  public render(): void {
    // Render grid layer
    this.backgroundGridRenderer.render()
    const gridMesh = this.backgroundGridRenderer.getMesh()
    if (gridMesh) {
      this.gridLayer.removeChildren()
      this.gridLayer.addChild(gridMesh)
    }
    
    // Render mouse layer
    this.mouseHighlightShader.render()
    const mouseGraphics = this.mouseHighlightShader.getGraphics()
    if (mouseGraphics) {
      this.mouseLayer.removeChildren()
      this.mouseLayer.addChild(mouseGraphics)
    }
  }
  
  public destroy(): void {
    this.backgroundGridRenderer.destroy()
    this.mouseHighlightShader.destroy()
    
    // Clean up layers
    this.gridLayer.removeChildren()
    this.mouseLayer.removeChildren()
    
    console.log('Phase3ACanvas: Cleanup complete')
  }
}
```

#### **Step 3.2: Update Game_3a.ts (MAIN INTEGRATION)**
```typescript
// app/src/game/Game_3a.ts - Updated main integration
import { Application } from 'pixi.js'
import { Phase3ACanvas } from './Phase3ACanvas'
import { InputManager_3a } from './InputManager_3a'

export class Game_3a {
  private app: Application
  private phase3aCanvas: Phase3ACanvas | null = null
  private inputManager: InputManager_3a | null = null
  
  constructor() {
    this.app = new Application()
    console.log('Game_3a: Initializing')
  }
  
  public async init(canvas: HTMLCanvasElement): Promise<void> {
    console.log('Game_3a: Starting initialization')
    
    // Initialize PIXI application
    await this.app.init({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x404040,
      canvas: canvas
    })
    
    console.log('Game_3a: PIXI initialized')
    
    // Initialize Phase 3A canvas with mesh-first architecture
    this.phase3aCanvas = new Phase3ACanvas(this.app)
    
    // Initialize input manager
    this.inputManager = new InputManager_3a()
    this.inputManager.init(canvas)
    
    // Start render loop
    this.app.ticker.add(this.render.bind(this))
    
    console.log('Game_3a: Initialization complete')
  }
  
  private render(): void {
    if (this.phase3aCanvas) {
      this.phase3aCanvas.render()
    }
  }
  
  public destroy(): void {
    if (this.phase3aCanvas) {
      this.phase3aCanvas.destroy()
    }
    
    if (this.inputManager) {
      this.inputManager.destroy()
    }
    
    this.app.destroy()
    
    console.log('Game_3a: Cleanup complete')
  }
}
```

### **Phase 4: Update Input Management (Day 4)**

#### **Step 4.1: Update InputManager_3a.ts (MESH-FIRST WASD)**
```typescript
// app/src/game/InputManager_3a.ts - Updated with mesh-first WASD
import { gameStore_3a_methods } from '../store/gameStore_3a'

export class InputManager_3a {
  private keyStates: Map<string, boolean> = new Map()
  private canvas: HTMLCanvasElement | null = null
  
  constructor() {
    console.log('InputManager_3a: Initialized with mesh-first architecture')
  }
  
  public init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas
    this.setupKeyboardEvents()
    console.log('InputManager_3a: Event listeners setup')
  }
  
  private setupKeyboardEvents(): void {
    document.addEventListener('keydown', (event) => {
      this.keyStates.set(event.key.toLowerCase(), true)
      this.handleKeyDown(event.key.toLowerCase())
    })
    
    document.addEventListener('keyup', (event) => {
      this.keyStates.set(event.key.toLowerCase(), false)
    })
  }
  
  private handleKeyDown(key: string): void {
    // ✅ MESH-FIRST WASD MOVEMENT
    const moveAmount = 1 // Move by 1 vertex unit
    
    switch (key) {
      case 'w':
        gameStore_3a_methods.updateNavigationOffset(0, -moveAmount)
        console.log('InputManager_3a: Move up (W)')
        break
      case 's':
        gameStore_3a_methods.updateNavigationOffset(0, moveAmount)
        console.log('InputManager_3a: Move down (S)')
        break
      case 'a':
        gameStore_3a_methods.updateNavigationOffset(-moveAmount, 0)
        console.log('InputManager_3a: Move left (A)')
        break
      case 'd':
        gameStore_3a_methods.updateNavigationOffset(moveAmount, 0)
        console.log('InputManager_3a: Move right (D)')
        break
    }
  }
  
  public destroy(): void {
    this.keyStates.clear()
    // Remove event listeners would go here
    console.log('InputManager_3a: Cleanup complete')
  }
}
```

### **Phase 5: Update UI Integration (Day 5)**

#### **Step 5.1: Update StorePanel_3a.ts (MESH DATA DISPLAY)**
```typescript
// app/src/ui/StorePanel_3a.ts - Updated to show mesh data
import { subscribe } from 'valtio'
import { gameStore_3a } from '../store/gameStore_3a'

export class StorePanel_3a {
  private panel: HTMLElement | null = null
  
  constructor() {
    this.createPanel()
    this.subscribeToStore()
    console.log('StorePanel_3a: Initialized with mesh-first data')
  }
  
  private createPanel(): void {
    this.panel = document.createElement('div')
    this.panel.id = 'store-panel-3a'
    this.panel.className = 'store-panel'
    
    this.panel.innerHTML = `
      <div class="store-section">
        <h3>Phase 3A - Mesh-First Architecture</h3>
        
        <div class="store-group">
          <h4>Mesh System</h4>
          <div class="store-item">
            <span>Cell Size:</span>
            <span id="mesh-cell-size">--</span>
          </div>
          <div class="store-item">
            <span>Dimensions:</span>
            <span id="mesh-dimensions">--</span>
          </div>
          <div class="store-item">
            <span>Vertex Count:</span>
            <span id="mesh-vertex-count">--</span>
          </div>
        </div>
        
        <div class="store-group">
          <h4>Mouse Position</h4>
          <div class="store-item">
            <span>Vertex:</span>
            <span id="mouse-vertex">--</span>
          </div>
          <div class="store-item">
            <span>Screen:</span>
            <span id="mouse-screen">--</span>
          </div>
          <div class="store-item">
            <span>World:</span>
            <span id="mouse-world">--</span>
          </div>
        </div>
        
        <div class="store-group">
          <h4>Navigation</h4>
          <div class="store-item">
            <span>Offset:</span>
            <span id="navigation-offset">--</span>
          </div>
          <div class="store-item">
            <span>Dragging:</span>
            <span id="navigation-dragging">--</span>
          </div>
        </div>
      </div>
    `
    
    // Add to body
    document.body.appendChild(this.panel)
  }
  
  private subscribeToStore(): void {
    // Subscribe to mesh data changes
    subscribe(gameStore_3a.mesh, () => {
      this.updateMeshData()
    })
    
    // Subscribe to mouse position changes
    subscribe(gameStore_3a.mouse, () => {
      this.updateMousePosition()
    })
    
    // Subscribe to navigation changes
    subscribe(gameStore_3a.navigation, () => {
      this.updateNavigationData()
    })
  }
  
  private updateMeshData(): void {
    const mesh = gameStore_3a.mesh
    
    const cellSizeEl = document.getElementById('mesh-cell-size')
    const dimensionsEl = document.getElementById('mesh-dimensions')
    const vertexCountEl = document.getElementById('mesh-vertex-count')
    
    if (cellSizeEl) cellSizeEl.textContent = mesh.cellSize.toString()
    if (dimensionsEl) dimensionsEl.textContent = `${mesh.dimensions.width}x${mesh.dimensions.height}`
    if (vertexCountEl) vertexCountEl.textContent = mesh.vertexData ? (mesh.vertexData.length / 2).toString() : '0'
  }
  
  private updateMousePosition(): void {
    const mouse = gameStore_3a.mouse
    
    const vertexEl = document.getElementById('mouse-vertex')
    const screenEl = document.getElementById('mouse-screen')
    const worldEl = document.getElementById('mouse-world')
    
    if (vertexEl) vertexEl.textContent = `${mouse.vertex.x}, ${mouse.vertex.y}`
    if (screenEl) screenEl.textContent = `${mouse.screen.x}, ${mouse.screen.y}`
    if (worldEl) worldEl.textContent = `${mouse.world.x}, ${mouse.world.y}`
  }
  
  private updateNavigationData(): void {
    const navigation = gameStore_3a.navigation
    
    const offsetEl = document.getElementById('navigation-offset')
    const draggingEl = document.getElementById('navigation-dragging')
    
    if (offsetEl) offsetEl.textContent = `${navigation.offset.x}, ${navigation.offset.y}`
    if (draggingEl) draggingEl.textContent = navigation.isDragging ? 'Yes' : 'No'
  }
  
  public destroy(): void {
    if (this.panel) {
      document.body.removeChild(this.panel)
    }
  }
}
```

## 🧪 **Testing Plan**

### **Day 6: Integration Testing**

#### **Test 1: Mesh Generation**
- Verify mesh is created with correct dimensions
- Check vertex count matches expected grid size
- Validate mesh is interactive

#### **Test 2: Mouse Coordinate Flow**
- Test mouse movement updates vertex coordinates
- Verify screen coordinates are calculated correctly
- Check world coordinates include navigation offset

#### **Test 3: WASD Navigation**
- Test WASD keys update navigation offset
- Verify world coordinates update with navigation
- Check UI shows correct offset values

#### **Test 4: UI Integration**
- Verify store panel shows mesh data
- Check real-time updates of mouse position
- Validate navigation data display

#### **Test 5: Module Separation**
- Verify MeshManager_3a is authoritative source
- Check GridShaderRenderer_3a only handles visuals
- Validate BackgroundGridRenderer_3a orchestrates correctly

## 🎯 **Success Criteria**

### **Architecture Validation**
- ✅ **Mesh-First**: All coordinates derive from mesh vertices
- ✅ **Module Separation**: Clear interfaces between mesh creation and rendering
- ✅ **No Hardcoded Values**: No `/20` division or other made-up formulas
- ✅ **Event Flow**: Mouse events use mesh.getLocalPosition()
- ✅ **Store Integration**: Store receives mesh vertex coordinates

### **Functionality Validation**
- ✅ **Grid Rendering**: Checkboard pattern displays correctly
- ✅ **Mouse Highlighting**: Red square follows mouse precisely
- ✅ **WASD Navigation**: Movement updates world coordinates
- ✅ **UI Updates**: Real-time display of all coordinate data
- ✅ **Performance**: 60fps maintained with mesh-first architecture

### **Code Quality Validation**
- ✅ **Single Responsibility**: Each module has clear purpose
- ✅ **Clear Interfaces**: Well-defined method signatures
- ✅ **Proper Cleanup**: All resources destroyed correctly
- ✅ **Logging**: Comprehensive console output for debugging
- ✅ **Type Safety**: Proper TypeScript usage throughout

## 📋 **Implementation Checklist**

### **Day 1: Mesh Foundation**
- [ ] Create MeshManager_3a.ts with mesh generation
- [ ] Create GridShaderRenderer_3a.ts with checkboard shader
- [ ] Update BackgroundGridRenderer_3a.ts to orchestrator
- [ ] Test mesh generation and shader application

### **Day 2: Store Integration**
- [ ] Update gameStore_3a.ts to remove /20 division
- [ ] Add mesh-first coordinate methods
- [ ] Update MouseHighlightShader_3a.ts to use vertex coordinates
- [ ] Test store coordinate updates

### **Day 3: Canvas Integration**
- [ ] Update Phase3ACanvas.ts with new modules
- [ ] Update Game_3a.ts with mesh-first initialization
- [ ] Test complete rendering pipeline

### **Day 4: Input Management**
- [ ] Update InputManager_3a.ts with mesh-first WASD
- [ ] Test navigation offset updates
- [ ] Verify coordinate flow works correctly

### **Day 5: UI Integration**
- [ ] Update StorePanel_3a.ts to show mesh data
- [ ] Test real-time UI updates
- [ ] Verify all coordinate systems display correctly

### **Day 6: Testing & Validation**
- [ ] Run all integration tests
- [ ] Validate architecture compliance
- [ ] Performance testing
- [ ] Bug fixes and optimization

This plan provides a step-by-step approach to transform the current implementation into a proper mesh-first architecture with complete module separation and all missing methods implemented.