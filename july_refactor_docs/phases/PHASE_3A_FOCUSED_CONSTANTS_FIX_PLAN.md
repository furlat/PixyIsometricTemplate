# Phase 3A Focused Constants Fix Plan (Mouse + Store Priority)

## 🎯 **Focus Areas**

### **Primary Focus:**
1. **MeshManager cellSize** - Fix coordinate system root cause
2. **MouseHighlightShader** - All visual properties from store
3. **InputManager moveAmount** - Navigation from store
4. **Temporarily disable checkboard shader** - Store-controlled

### **Secondary (Later):**
- GridShaderRenderer checkboard shader improvements

## 🏪 **Minimal Store Extension**

```typescript
// Add to gameStore_3a.ts
export interface GameState3A {
  mesh: {
    cellSize: number              // ✅ Already exists
    vertexData: Float32Array | null
    dimensions: { width: number, height: number }
    needsUpdate: boolean
  }
  ui: {
    showGrid: boolean
    showMouse: boolean
    showStorePanel: boolean
    showLayerToggle: boolean
    enableCheckboard: boolean     // ✅ NEW - disable checkboard shader
    mouse: {                      // ✅ NEW - mouse highlight config
      highlightColor: number
      highlightIntensity: number
      strokeWidth: number
      fillAlpha: number
      animationSpeed: number
      pulseMin: number
      pulseMax: number
    }
  }
  navigation: {
    offset: PixeloidCoordinate
    isDragging: boolean
    moveAmount: number            // ✅ NEW - WASD movement amount
  }
}
```

### **Store Defaults**
```typescript
export const gameStore_3a = proxy<GameState3A>({
  // ... existing
  ui: {
    showGrid: true,
    showMouse: true,
    showStorePanel: false,
    showLayerToggle: false,
    enableCheckboard: false,      // ✅ DISABLED for now
    mouse: {
      highlightColor: 0xff0000,
      highlightIntensity: 0.8,
      strokeWidth: 2,
      fillAlpha: 0.3,
      animationSpeed: 4.0,
      pulseMin: 0.7,
      pulseMax: 0.3
    }
  },
  navigation: {
    offset: { x: 0, y: 0 },
    isDragging: false,
    moveAmount: 1
  }
})
```

## 🔧 **Focused Fix Implementation**

### **Fix 1: MeshManager_3a.ts (CRITICAL)**
```typescript
// CHANGE constructor
export class MeshManager_3a {
  private mesh: MeshSimple | null = null
  private vertices: Float32Array | null = null
  private indices: Uint32Array | null = null
  
- constructor() {
+ constructor(private store: typeof gameStore_3a) {
    this.generateMesh()
  }
  
+ private get cellSize(): number {
+   return this.store.mesh.cellSize
+ }
  
  private generateMesh(): void {
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
-   const gridWidth = Math.ceil(screenWidth / this.cellSize)
-   const gridHeight = Math.ceil(screenHeight / this.cellSize)
+   const cellSize = this.cellSize
+   const gridWidth = Math.ceil(screenWidth / cellSize)
+   const gridHeight = Math.ceil(screenHeight / cellSize)
    
    console.log(`Generating mesh: ${gridWidth}x${gridHeight} cells`)
    
    // ... rest of mesh generation using cellSize variable
  }
  
  // Fix coordinate conversion methods
  public screenToVertex(screenX: number, screenY: number): VertexCoordinate {
+   const cellSize = this.cellSize
-   const vertexX = Math.floor(screenX / this.cellSize)
-   const vertexY = Math.floor(screenY / this.cellSize)
+   const vertexX = Math.floor(screenX / cellSize)
+   const vertexY = Math.floor(screenY / cellSize)
    return { x: vertexX, y: vertexY }
  }
  
  public vertexToScreen(vertexX: number, vertexY: number): { x: number, y: number } {
+   const cellSize = this.cellSize
    return {
-     x: vertexX * this.cellSize,
-     y: vertexY * this.cellSize
+     x: vertexX * cellSize,
+     y: vertexY * cellSize
    }
  }
  
  public getCellSize(): number {
-   return this.cellSize
+   return this.store.mesh.cellSize
  }
}
```

### **Fix 2: BackgroundGridRenderer_3a.ts**
```typescript
// CHANGE constructor
export class BackgroundGridRenderer_3a {
  private meshManager: MeshManager_3a
  private gridShaderRenderer: GridShaderRenderer_3a
  
  constructor() {
    console.log('BackgroundGridRenderer_3a: Initializing with mesh-first architecture')
    
    // Create mesh manager (authoritative source)
-   this.meshManager = new MeshManager_3a()
+   this.meshManager = new MeshManager_3a(gameStore_3a)
    
    // Create grid shader renderer (visual layer)
    this.gridShaderRenderer = new GridShaderRenderer_3a(this.meshManager)
    
    // Setup mesh interaction
    this.setupMeshInteraction()
    
    console.log('BackgroundGridRenderer_3a: Initialization complete')
  }
}
```

### **Fix 3: GridShaderRenderer_3a.ts (DISABLE CHECKBOARD)**
```typescript
// CHANGE render method
export class GridShaderRenderer_3a {
  public render(): void {
+   // Check if checkboard is enabled in store
+   if (!gameStore_3a.ui.enableCheckboard) {
+     console.log('GridShaderRenderer_3a: Checkboard disabled in store')
+     return
+   }
+   
    const mesh = this.meshManager.getMesh()
    if (mesh && this.shader) {
      // Apply shader to mesh
      (mesh as any).shader = this.shader
      console.log('Grid shader applied to mesh')
    }
  }
}
```

### **Fix 4: MouseHighlightShader_3a.ts (STORE-DRIVEN)**
```typescript
// CHANGE highlight properties
export class MouseHighlightShader_3a {
  private graphics: Graphics
  
  // Animation state
  private startTime: number = Date.now()
  private isDirty: boolean = true

- // Highlight properties
- private highlightColor: number = 0xff0000  // Red color for visibility
- private highlightIntensity: number = 0.8
+ // Highlight properties from store
+ private get highlightColor(): number {
+   return gameStore_3a.ui.mouse.highlightColor
+ }
+ private get highlightIntensity(): number {
+   return gameStore_3a.ui.mouse.highlightIntensity
+ }

  // ... rest unchanged until render method

  public render(): void {
    if (!this.isDirty) return
    
    // Clear previous graphics
    this.graphics.clear()
    
    // Only render if mouse highlighting is enabled
    if (!gameStore_3a.ui.showMouse) {
      this.isDirty = false
      return
    }
    
    // ✅ USE MESH VERTEX COORDINATES (authoritative)
    const mouseVertex = gameStore_3a.mouse.vertex
    const cellSize = gameStore_3a.mesh.cellSize
    
    if (!mouseVertex || cellSize <= 0) {
      console.warn('MouseHighlightShader_3a: Invalid mesh data or mouse position')
      this.isDirty = false
      return
    }
    
    // Get current time for animation
    const currentTime = (Date.now() - this.startTime) / 1000.0
+   const mouseConfig = gameStore_3a.ui.mouse
+   const pulse = mouseConfig.pulseMin + mouseConfig.pulseMax * Math.sin(currentTime * mouseConfig.animationSpeed)
-   const pulse = 0.7 + 0.3 * Math.sin(currentTime * 4.0)
    
    // Calculate animated alpha
    const animatedAlpha = this.highlightIntensity * pulse
    
    // Convert vertex coordinates to screen coordinates for rendering
    const screenX = mouseVertex.x * cellSize
    const screenY = mouseVertex.y * cellSize
    
    console.log(`MouseHighlightShader_3a: Rendering at vertex (${mouseVertex.x}, ${mouseVertex.y}) -> screen (${screenX}, ${screenY})`)
    
    // Draw highlight rectangle at mesh vertex position
    this.graphics
      .rect(screenX, screenY, cellSize, cellSize)
      .stroke({ 
-       width: 2, 
+       width: gameStore_3a.ui.mouse.strokeWidth,
        color: this.highlightColor, 
        alpha: animatedAlpha 
      })
    
    // Add inner fill for better visibility
    this.graphics
      .rect(screenX + 1, screenY + 1, cellSize - 2, cellSize - 2)
      .fill({ 
        color: this.highlightColor, 
-       alpha: animatedAlpha * 0.3 
+       alpha: animatedAlpha * gameStore_3a.ui.mouse.fillAlpha
      })
    
    this.isDirty = false
  }

  // Update setter methods
  public setHighlightColor(color: number): void {
-   this.highlightColor = color
+   gameStore_3a.ui.mouse.highlightColor = color
    this.isDirty = true
    console.log('MouseHighlightShader_3a: Highlight color set to', color.toString(16))
  }

  public setHighlightIntensity(intensity: number): void {
-   this.highlightIntensity = Math.max(0, Math.min(1, intensity))
+   gameStore_3a.ui.mouse.highlightIntensity = Math.max(0, Math.min(1, intensity))
    this.isDirty = true
    console.log('MouseHighlightShader_3a: Highlight intensity set to', this.highlightIntensity)
  }
}
```

### **Fix 5: InputManager_3a.ts (STORE-DRIVEN MOVEMENT)**
```typescript
// CHANGE handleWASDMovement method
export class InputManager_3a {
  private handleWASDMovement(key: 'w' | 'a' | 's' | 'd'): void {
    // ✅ MESH-FIRST WASD MOVEMENT
-   const moveAmount = 1 // Move by 1 vertex unit
+   const moveAmount = gameStore_3a.navigation.moveAmount
    
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
}
```

## 📊 **Expected Results**

### **After Implementation:**
1. **Black background** (checkboard disabled) ✅
2. **Mouse highlight** works with store-controlled properties ✅
3. **Coordinate system** uses store-controlled `cellSize` ✅
4. **WASD movement** uses store-controlled `moveAmount` ✅

### **Store Panel Will Show:**
- `cellSize` from store (currently 20)
- Mouse highlight properties from store
- Navigation `moveAmount` from store
- `enableCheckboard: false` status

### **Testing Commands:**
```typescript
// Test different cell sizes
gameStore_3a.mesh.cellSize = 1   // Pixel perfect
gameStore_3a.mesh.cellSize = 10  // Balanced
gameStore_3a.mesh.cellSize = 20  // Current

// Test mouse highlight
gameStore_3a.ui.mouse.highlightColor = 0x00ff00  // Green
gameStore_3a.ui.mouse.strokeWidth = 4            // Thicker

// Test movement
gameStore_3a.navigation.moveAmount = 5           // Faster WASD

// Enable checkboard later
gameStore_3a.ui.enableCheckboard = true         // Re-enable when ready
```

## 🎯 **Implementation Priority**

1. **gameStore_3a.ts** - Add new properties
2. **MeshManager_3a.ts** - Fix cellSize (critical coordinate fix)
3. **BackgroundGridRenderer_3a.ts** - Pass store to MeshManager
4. **GridShaderRenderer_3a.ts** - Disable checkboard temporarily
5. **MouseHighlightShader_3a.ts** - Store-driven properties
6. **InputManager_3a.ts** - Store-driven movement

This focused approach will fix the coordinate system first, then improve the mouse highlight, while temporarily disabling the problematic checkboard shader.