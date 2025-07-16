# Phase 3A Store Extension Validation Plan

## 🔍 **Current Store Analysis**

### **Current GameState3A Interface (EXISTS)**
```typescript
export interface GameState3A {
  phase: '3A'
  mouse: {
    screen: PixeloidCoordinate     // ✅ EXISTS
    vertex: VertexCoordinate       // ✅ EXISTS
    world: PixeloidCoordinate      // ✅ EXISTS
  }
  navigation: {
    offset: PixeloidCoordinate     // ✅ EXISTS
    isDragging: boolean            // ✅ EXISTS
    // ❌ MISSING: moveAmount: number
  }
  geometry: {
    objects: GeometricObject[]     // ✅ EXISTS
    selectedId: string | null      // ✅ EXISTS
  }
  mesh: {
    vertexData: Float32Array | null // ✅ EXISTS
    cellSize: number               // ✅ EXISTS (currently 20)
    dimensions: { width: number, height: number } // ✅ EXISTS
    needsUpdate: boolean           // ✅ EXISTS
  }
  ui: {
    showGrid: boolean              // ✅ EXISTS
    showMouse: boolean             // ✅ EXISTS
    showStorePanel: boolean        // ✅ EXISTS
    showLayerToggle: boolean       // ✅ EXISTS
    // ❌ MISSING: enableCheckboard: boolean
    // ❌ MISSING: mouse: { ... }
  }
}
```

### **Current Store Proxy (EXISTS)**
```typescript
export const gameStore_3a = proxy<GameState3A>({
  // ... existing properties work
  mesh: {
    cellSize: 20,                  // ✅ EXISTS - this is what we need to make store-driven
    // ... other properties exist
  }
})
```

## 🚨 **Missing Properties Analysis**

### **1. Missing from GameState3A Interface**
```typescript
// ADD to navigation
navigation: {
  offset: PixeloidCoordinate      // ✅ EXISTS
  isDragging: boolean             // ✅ EXISTS
  moveAmount: number              // ❌ MISSING - needed for WASD
}

// ADD to ui
ui: {
  showGrid: boolean               // ✅ EXISTS
  showMouse: boolean              // ✅ EXISTS
  showStorePanel: boolean         // ✅ EXISTS
  showLayerToggle: boolean        // ✅ EXISTS
  enableCheckboard: boolean       // ❌ MISSING - needed to disable shader
  mouse: {                        // ❌ MISSING - needed for mouse highlight
    highlightColor: number
    highlightIntensity: number
    strokeWidth: number
    fillAlpha: number
    animationSpeed: number
    pulseMin: number
    pulseMax: number
  }
}
```

### **2. Missing from gameStore_3a Proxy**
```typescript
// ADD to proxy defaults
navigation: {
  offset: { x: 0, y: 0 },         // ✅ EXISTS
  isDragging: false,              // ✅ EXISTS
  moveAmount: 1                   // ❌ MISSING - add default value
}

ui: {
  showGrid: true,                 // ✅ EXISTS
  showMouse: true,                // ✅ EXISTS
  showStorePanel: false,          // ✅ EXISTS
  showLayerToggle: false,         // ✅ EXISTS
  enableCheckboard: false,        // ❌ MISSING - disabled by default
  mouse: {                        // ❌ MISSING - add default values
    highlightColor: 0xff0000,
    highlightIntensity: 0.8,
    strokeWidth: 2,
    fillAlpha: 0.3,
    animationSpeed: 4.0,
    pulseMin: 0.7,
    pulseMax: 0.3
  }
}
```

### **3. Missing from gameStore_3a_methods**
```typescript
// ADD new methods
setMeshCellSize: (cellSize: number) => {
  gameStore_3a.mesh.cellSize = cellSize
  gameStore_3a.mesh.needsUpdate = true
},

setNavigationMoveAmount: (moveAmount: number) => {
  gameStore_3a.navigation.moveAmount = moveAmount
},

toggleCheckboard: () => {
  gameStore_3a.ui.enableCheckboard = !gameStore_3a.ui.enableCheckboard
},

updateMouseHighlightColor: (color: number) => {
  gameStore_3a.ui.mouse.highlightColor = color
},

updateMouseHighlightIntensity: (intensity: number) => {
  gameStore_3a.ui.mouse.highlightIntensity = Math.max(0, Math.min(1, intensity))
}
```

## 🔧 **Precise Extension Plan**

### **Step 1: Extend GameState3A Interface**
```typescript
// MODIFY app/src/store/gameStore_3a.ts lines 10-37
export interface GameState3A {
  phase: '3A'
  mouse: {
    screen: PixeloidCoordinate
    vertex: VertexCoordinate
    world: PixeloidCoordinate
  }
  navigation: {
    offset: PixeloidCoordinate
    isDragging: boolean
+   moveAmount: number              // ✅ ADD
  }
  geometry: {
    objects: GeometricObject[]
    selectedId: string | null
  }
  mesh: {
    vertexData: Float32Array | null
    cellSize: number
    dimensions: { width: number, height: number }
    needsUpdate: boolean
  }
  ui: {
    showGrid: boolean
    showMouse: boolean
    showStorePanel: boolean
    showLayerToggle: boolean
+   enableCheckboard: boolean       // ✅ ADD
+   mouse: {                        // ✅ ADD
+     highlightColor: number
+     highlightIntensity: number
+     strokeWidth: number
+     fillAlpha: number
+     animationSpeed: number
+     pulseMin: number
+     pulseMax: number
+   }
  }
}
```

### **Step 2: Extend gameStore_3a Proxy**
```typescript
// MODIFY app/src/store/gameStore_3a.ts lines 40-67
export const gameStore_3a = proxy<GameState3A>({
  phase: '3A',
  mouse: {
    screen: { x: 0, y: 0 },
    vertex: { x: 0, y: 0 },
    world: { x: 0, y: 0 }
  },
  navigation: {
    offset: { x: 0, y: 0 },
    isDragging: false,
+   moveAmount: 1                   // ✅ ADD
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
  },
  ui: {
    showGrid: true,
    showMouse: true,
    showStorePanel: false,
    showLayerToggle: false,
+   enableCheckboard: false,        // ✅ ADD - disabled by default
+   mouse: {                        // ✅ ADD
+     highlightColor: 0xff0000,
+     highlightIntensity: 0.8,
+     strokeWidth: 2,
+     fillAlpha: 0.3,
+     animationSpeed: 4.0,
+     pulseMin: 0.7,
+     pulseMax: 0.3
+   }
  }
})
```

### **Step 3: Extend gameStore_3a_methods**
```typescript
// ADD to app/src/store/gameStore_3a.ts after line 180
// New methods for store-driven constants
setMeshCellSize: (cellSize: number) => {
  console.log('gameStore_3a: Setting mesh cell size', cellSize)
  gameStore_3a.mesh.cellSize = cellSize
  gameStore_3a.mesh.needsUpdate = true
},

setNavigationMoveAmount: (moveAmount: number) => {
  console.log('gameStore_3a: Setting navigation move amount', moveAmount)
  gameStore_3a.navigation.moveAmount = moveAmount
},

toggleCheckboard: () => {
  gameStore_3a.ui.enableCheckboard = !gameStore_3a.ui.enableCheckboard
  console.log('gameStore_3a: Checkboard enabled:', gameStore_3a.ui.enableCheckboard)
},

updateMouseHighlightColor: (color: number) => {
  console.log('gameStore_3a: Setting mouse highlight color', color.toString(16))
  gameStore_3a.ui.mouse.highlightColor = color
},

updateMouseHighlightIntensity: (intensity: number) => {
  const clampedIntensity = Math.max(0, Math.min(1, intensity))
  console.log('gameStore_3a: Setting mouse highlight intensity', clampedIntensity)
  gameStore_3a.ui.mouse.highlightIntensity = clampedIntensity
}
```

## ✅ **Types Validation**

### **Required Types (ALL EXIST)**
- `PixeloidCoordinate` ✅ (from `ecs-coordinates.ts`)
- `VertexCoordinate` ✅ (from `ecs-coordinates.ts`)
- `GeometricObject` ✅ (from `ecs-data-layer.ts`)
- `CreateGeometricObjectParams` ✅ (from `ecs-data-layer.ts`)
- `MeshLevel` ✅ (from `mesh-system.ts`)
- `MeshVertexData` ✅ (from `mesh-system.ts`)

### **New Types Needed**
- `number` (primitive) ✅
- `boolean` (primitive) ✅
- Object literals ✅

**NO new types need to be created** - all required types already exist.

## 🎯 **Implementation Order**

1. **Extend GameState3A interface** (3 new properties)
2. **Extend gameStore_3a proxy** (3 new property groups with defaults)
3. **Extend gameStore_3a_methods** (5 new methods)
4. **Update components** to use new store properties

## 📋 **Validation Checklist**

### **Interface Extensions:**
- [ ] `navigation.moveAmount: number`
- [ ] `ui.enableCheckboard: boolean`
- [ ] `ui.mouse: { ... }` (7 properties)

### **Proxy Extensions:**
- [ ] `moveAmount: 1` default value
- [ ] `enableCheckboard: false` default value  
- [ ] `mouse: { ... }` default values (7 properties)

### **Method Extensions:**
- [ ] `setMeshCellSize(cellSize: number)`
- [ ] `setNavigationMoveAmount(moveAmount: number)`
- [ ] `toggleCheckboard()`
- [ ] `updateMouseHighlightColor(color: number)`
- [ ] `updateMouseHighlightIntensity(intensity: number)`

### **TypeScript Compilation:**
- [ ] No TypeScript errors after extensions
- [ ] All imports still work
- [ ] No breaking changes to existing code

This plan ensures we have all the required store properties before implementing the hardcoded constants fixes.