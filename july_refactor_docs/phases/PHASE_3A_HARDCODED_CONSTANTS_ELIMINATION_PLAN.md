# Phase 3A Hardcoded Constants Elimination Plan

## 🔍 **Hardcoded Constants Audit**

### **MeshManager_3a.ts**
```typescript
// ❌ HARDCODED
private cellSize: number = 20 // Fixed cell size for Phase 3A

// ✅ SHOULD BE
private get cellSize(): number {
  return this.store.mesh.cellSize
}
```

### **MouseHighlightShader_3a.ts**
```typescript
// ❌ HARDCODED
private highlightColor: number = 0xff0000  // Red color for visibility
private highlightIntensity: number = 0.8
const pulse = 0.7 + 0.3 * Math.sin(currentTime * 4.0)
width: 2, 
animatedAlpha * 0.3

// ✅ SHOULD BE
private get highlightColor(): number {
  return this.store.ui.mouse.highlightColor
}
private get highlightIntensity(): number {
  return this.store.ui.mouse.highlightIntensity
}
```

### **InputManager_3a.ts**
```typescript
// ❌ HARDCODED
const moveAmount = 1 // Move by 1 vertex unit

// ✅ SHOULD BE
const moveAmount = this.store.navigation.moveAmount
```

### **GridShaderRenderer_3a.ts**
```typescript
// ❌ HARDCODED (in fragment shader)
vec3 lightColor = vec3(0.941, 0.941, 0.941); // #f0f0f0
vec3 darkColor = vec3(0.878, 0.878, 0.878);  // #e0e0e0

// ✅ SHOULD BE
uniform vec3 uLightColor;
uniform vec3 uDarkColor;
```

## 🏪 **Required Store Structure**

### **Extend gameStore_3a.ts**
```typescript
export interface GameState3A {
  phase: '3A'
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
    mouse: {                      // ✅ NEW
      highlightColor: number
      highlightIntensity: number
      strokeWidth: number
      fillAlpha: number
      animationSpeed: number
      pulseMin: number
      pulseMax: number
    }
    grid: {                       // ✅ NEW
      lightColor: [number, number, number]
      darkColor: [number, number, number]
    }
  }
  navigation: {
    offset: PixeloidCoordinate
    isDragging: boolean
    moveAmount: number            // ✅ NEW
  }
  // ... rest unchanged
}
```

### **Default Store Values**
```typescript
export const gameStore_3a = proxy<GameState3A>({
  phase: '3A',
  mesh: {
    cellSize: 20,                 // ✅ Store-controlled
    vertexData: null,
    dimensions: { width: 0, height: 0 },
    needsUpdate: false
  },
  ui: {
    showGrid: true,
    showMouse: true,
    showStorePanel: false,
    showLayerToggle: false,
    mouse: {                      // ✅ NEW
      highlightColor: 0xff0000,
      highlightIntensity: 0.8,
      strokeWidth: 2,
      fillAlpha: 0.3,
      animationSpeed: 4.0,
      pulseMin: 0.7,
      pulseMax: 0.3
    },
    grid: {                       // ✅ NEW
      lightColor: [0.941, 0.941, 0.941],
      darkColor: [0.878, 0.878, 0.878]
    }
  },
  navigation: {
    offset: { x: 0, y: 0 },
    isDragging: false,
    moveAmount: 1                 // ✅ NEW
  }
  // ... rest unchanged
})
```

## 🔧 **Precise Fix Plan**

### **Fix 1: MeshManager_3a.ts**
```typescript
// CHANGE line 9
- private cellSize: number = 20 // Fixed cell size for Phase 3A
+ constructor(private store: typeof gameStore_3a) {

// CHANGE line 15
- private generateMesh(): void {
+ private get cellSize(): number {
+   return this.store.mesh.cellSize
+ }
+ 
+ private generateMesh(): void {

// CHANGE line 18
- const gridWidth = Math.ceil(screenWidth / this.cellSize)
- const gridHeight = Math.ceil(screenHeight / this.cellSize)
+ const cellSize = this.cellSize
+ const gridWidth = Math.ceil(screenWidth / cellSize)
+ const gridHeight = Math.ceil(screenHeight / cellSize)

// CHANGE line 29-30
- const screenX = x * this.cellSize
- const screenY = y * this.cellSize
+ const screenX = x * cellSize
+ const screenY = y * cellSize

// CHANGE line 34-37
- screenX + this.cellSize, screenY,
- screenX + this.cellSize, screenY + this.cellSize,
- screenX, screenY + this.cellSize
+ screenX + cellSize, screenY,
+ screenX + cellSize, screenY + cellSize,
+ screenX, screenY + cellSize

// CHANGE line 78-81
- const vertexX = Math.floor(screenX / this.cellSize)
- const vertexY = Math.floor(screenY / this.cellSize)
+ const cellSize = this.cellSize
+ const vertexX = Math.floor(screenX / cellSize)
+ const vertexY = Math.floor(screenY / cellSize)

// CHANGE line 86-89
- x: vertexX * this.cellSize,
- y: vertexY * this.cellSize
+ x: vertexX * cellSize,
+ y: vertexY * cellSize

// CHANGE line 94
- return this.cellSize
+ return this.store.mesh.cellSize

// CHANGE line 99-104
- const screenWidth = window.innerWidth
- const screenHeight = window.innerHeight
- return {
-   width: Math.ceil(screenWidth / this.cellSize),
-   height: Math.ceil(screenHeight / this.cellSize)
- }
+ const screenWidth = window.innerWidth
+ const screenHeight = window.innerHeight
+ const cellSize = this.cellSize
+ return {
+   width: Math.ceil(screenWidth / cellSize),
+   height: Math.ceil(screenHeight / cellSize)
+ }
```

### **Fix 2: BackgroundGridRenderer_3a.ts**
```typescript
// CHANGE line 21
- this.meshManager = new MeshManager_3a()
+ this.meshManager = new MeshManager_3a(gameStore_3a)

// CHANGE line 54
- const vertexCoord = this.meshManager.screenToVertex(localPos.x, localPos.y)
+ const vertexCoord = this.meshManager.screenToVertex(localPos.x, localPos.y)
```

### **Fix 3: MouseHighlightShader_3a.ts**
```typescript
// CHANGE line 16-17
- private highlightColor: number = 0xff0000  // Red color for visibility
- private highlightIntensity: number = 0.8
+ private get highlightColor(): number {
+   return gameStore_3a.ui.mouse.highlightColor
+ }
+ private get highlightIntensity(): number {
+   return gameStore_3a.ui.mouse.highlightIntensity
+ }

// CHANGE line 68-69
- const pulse = 0.7 + 0.3 * Math.sin(currentTime * 4.0)
+ const mouseConfig = gameStore_3a.ui.mouse
+ const pulse = mouseConfig.pulseMin + mouseConfig.pulseMax * Math.sin(currentTime * mouseConfig.animationSpeed)

// CHANGE line 84
- width: 2,
+ width: gameStore_3a.ui.mouse.strokeWidth,

// CHANGE line 94
- alpha: animatedAlpha * 0.3
+ alpha: animatedAlpha * gameStore_3a.ui.mouse.fillAlpha

// CHANGE line 104
- this.highlightColor = color
+ gameStore_3a.ui.mouse.highlightColor = color

// CHANGE line 110
- this.highlightIntensity = Math.max(0, Math.min(1, intensity))
+ gameStore_3a.ui.mouse.highlightIntensity = Math.max(0, Math.min(1, intensity))
```

### **Fix 4: InputManager_3a.ts**
```typescript
// CHANGE line 59
- const moveAmount = 1 // Move by 1 vertex unit
+ const moveAmount = gameStore_3a.navigation.moveAmount
```

### **Fix 5: GridShaderRenderer_3a.ts**
```typescript
// CHANGE line 56-65
this.shader = Shader.from({
  gl: {
    vertex: vertexShader,
    fragment: fragmentShader
  },
  resources: {
-   uCellSize: this.meshManager.getCellSize()
+   uCellSize: this.meshManager.getCellSize(),
+   uLightColor: gameStore_3a.ui.grid.lightColor,
+   uDarkColor: gameStore_3a.ui.grid.darkColor
  }
})

// CHANGE fragment shader (line 40-55)
- vec3 lightColor = vec3(0.941, 0.941, 0.941); // #f0f0f0
- vec3 darkColor = vec3(0.878, 0.878, 0.878);  // #e0e0e0
+ uniform vec3 uLightColor;
+ uniform vec3 uDarkColor;
...
- vec3 color = mix(lightColor, darkColor, checker);
+ vec3 color = mix(uLightColor, uDarkColor, checker);
```

### **Fix 6: Phase3ACanvas.ts**
```typescript
// CHANGE line 39
- this.backgroundGridRenderer = new BackgroundGridRenderer_3a()
+ this.backgroundGridRenderer = new BackgroundGridRenderer_3a()
// No change needed - BackgroundGridRenderer will handle store access
```

## 🎯 **Implementation Order**

1. **Extend gameStore_3a.ts** with new UI and navigation properties
2. **Fix MeshManager_3a.ts** to accept store and use cellSize from store
3. **Fix BackgroundGridRenderer_3a.ts** to pass store to MeshManager
4. **Fix MouseHighlightShader_3a.ts** to use store for all visual properties
5. **Fix InputManager_3a.ts** to use store for movement amount
6. **Fix GridShaderRenderer_3a.ts** to use store for colors

## ✅ **Result**

After fixes, **NO** hardcoded constants remain:
- `cellSize` → `store.mesh.cellSize`
- `highlightColor` → `store.ui.mouse.highlightColor`
- `highlightIntensity` → `store.ui.mouse.highlightIntensity`
- `moveAmount` → `store.navigation.moveAmount`
- `strokeWidth` → `store.ui.mouse.strokeWidth`
- `fillAlpha` → `store.ui.mouse.fillAlpha`
- `lightColor/darkColor` → `store.ui.grid.lightColor/darkColor`

All constants are now store-controlled and can be modified at runtime through the store.