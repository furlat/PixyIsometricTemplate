# Phase 3A: UI Cleanup Plan - Keep Only Core Foundation UI

## 🎯 **Objective**

Clean up the UI to focus only on Phase 3A core foundation:
- **StaticMeshManager** → **Grid Layer** 
- **Mouse Highlight**
- **WASD Navigation** (offset setting)
- **UI displaying location**

Keep only essential UI components and remove complex geometry/workspace features.

---

## 📊 **Current UI Structure Analysis**

### **What We Have (from app/index.html)**
- **UI Control Bar** (top center) - Controls for panels
- **Store Panel** (top right) - Detailed store debugging
- **Geometry Panel** (top left) - Geometry drawing tools
- **Object Edit Panel** (center) - Object editing
- **Workspace Panel** (bottom left) - Workspace management
- **Layer Toggle Bar** (bottom right) - Layer visibility controls

### **What We Need for Phase 3A**
- **UI Control Bar** - ✅ Keep (simplified)
- **Store Panel** - ✅ Keep (simplified for core foundation)
- **Layer Toggle Bar** - ✅ Keep (simplified for grid + mouse)
- **Geometry Panel** - ❌ Remove (not needed for Phase 3A)
- **Object Edit Panel** - ❌ Remove (not needed for Phase 3A)
- **Workspace Panel** - ❌ Remove (not needed for Phase 3A)

---

## 🧹 **UI Cleanup Strategy**

### **Files to Keep & Modify**
```
app/src/ui/
├── UIControlBar.ts          ✅ Keep - simplify buttons
├── LayerToggleBar.ts        ✅ Keep - grid + mouse only
├── StorePanel.ts            ✅ Keep - core foundation data only
└── index.ts                 ✅ Keep - update exports
```

### **Files to Remove/Backup**
```
app/src/ui/
├── ECSDataLayerPanel.ts     ❌ Remove - too complex for Phase 3A
├── ECSMirrorLayerPanel.ts   ❌ Remove - too complex for Phase 3A
├── GeometryPanel.ts         ❌ Remove - no geometry in Phase 3A
├── ObjectEditPanel.ts       ❌ Remove - no object editing in Phase 3A
├── StoreExplorer.ts         ❌ Remove - too complex for Phase 3A
├── Workspace.ts             ❌ Remove - no workspace in Phase 3A
└── handlers/                ❌ Remove - complex handlers not needed
```

---

## 🔧 **Phase 3A UI Implementation**

### **1. Simplified app/index.html**
```html
<!doctype html>
<html lang="en" data-theme="dark">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pixy Phase 3A - Core Foundation</title>
    <link rel="stylesheet" href="/src/styles/main.css" />
  </head>
  <body>
    <canvas id="gameCanvas"></canvas>
    
    <!-- UI Control Bar (Simplified) -->
    <div id="ui-control-bar" class="fixed top-4 left-1/2 transform -translate-x-1/2 bg-base-100/95 backdrop-blur-md border border-base-300 rounded-full shadow-lg z-50 px-4 py-2">
      <div class="flex items-center gap-3">
        <span class="text-sm font-semibold text-primary">Phase 3A Core</span>
        <div class="divider divider-horizontal mx-0"></div>
        <button id="toggle-layers" class="btn btn-sm btn-outline rounded-full">
          <span class="button-text">Layers</span>
        </button>
        <button id="toggle-store-panel" class="btn btn-sm btn-primary rounded-full">
          <span class="button-text">Store</span>
        </button>
      </div>
    </div>
    
    <!-- Store Panel (Core Foundation Only) -->
    <div id="store-panel" class="fixed top-4 right-4 w-80 max-h-[calc(100vh-5rem)] bg-base-100/95 backdrop-blur-md border border-base-300 rounded-xl shadow-2xl z-50 overflow-hidden">
      <!-- Header -->
      <div class="bg-base-200/50 border-b border-base-300 p-4 flex justify-between items-center">
        <h2 class="text-lg font-bold text-primary flex items-center gap-2">
          <span class="text-info">🔧</span>
          Phase 3A Foundation
        </h2>
        <button class="btn btn-sm btn-ghost btn-circle hover:bg-error hover:text-white transition-colors" id="close-store-panel">
          <span class="text-lg">✕</span>
        </button>
      </div>
      
      <!-- Core Foundation Content -->
      <div class="max-h-[calc(100vh-11rem)] overflow-y-auto custom-scrollbar p-2">
        
        <!-- Static Mesh Status -->
        <div class="card bg-base-200/30 shadow-sm mb-3">
          <div class="card-body p-3">
            <h3 class="card-title text-sm text-info flex items-center gap-2">
              <span class="text-xs">▸</span>
              Static Mesh Foundation
            </h3>
            <div class="space-y-2">
              <div class="flex justify-between items-center text-xs">
                <span class="text-base-content/70">Mesh Scale:</span>
                <span id="mesh-scale" class="font-bold font-mono text-primary">1</span>
              </div>
              <div class="flex justify-between items-center text-xs">
                <span class="text-base-content/70">Mesh Ready:</span>
                <span id="mesh-ready" class="font-bold font-mono status-active">true</span>
              </div>
              <div class="flex justify-between items-center text-xs">
                <span class="text-base-content/70">Vertices Count:</span>
                <span id="vertices-count" class="font-bold font-mono text-info">0</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Mouse Position -->
        <div class="card bg-base-200/30 shadow-sm mb-3">
          <div class="card-body p-3">
            <h3 class="card-title text-sm text-accent flex items-center gap-2">
              <span class="text-xs">▸</span>
              Mouse Position
            </h3>
            <div class="space-y-2">
              <div class="flex justify-between items-center text-xs">
                <span class="text-base-content/70">Screen:</span>
                <span id="mouse-screen" class="font-bold font-mono status-mouse">0, 0</span>
              </div>
              <div class="flex justify-between items-center text-xs">
                <span class="text-base-content/70">Vertex:</span>
                <span id="mouse-vertex" class="font-bold font-mono status-mouse">0, 0</span>
              </div>
              <div class="flex justify-between items-center text-xs">
                <span class="text-base-content/70">Pixeloid:</span>
                <span id="mouse-pixeloid" class="font-bold font-mono status-mouse">0.00, 0.00</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation (WASD) -->
        <div class="card bg-base-200/30 shadow-sm mb-3">
          <div class="card-body p-3">
            <h3 class="card-title text-sm text-warning flex items-center gap-2">
              <span class="text-xs">▸</span>
              Navigation (WASD)
            </h3>
            <div class="space-y-2">
              <div class="flex justify-between items-center text-xs">
                <span class="text-base-content/70">Current Offset:</span>
                <span id="current-offset" class="font-bold font-mono text-warning">0, 0</span>
              </div>
              <div class="grid grid-cols-4 gap-1 mt-2">
                <div class="flex flex-col items-center text-xs">
                  <kbd class="kbd kbd-xs bg-base-300 mb-1">W</kbd>
                  <span id="key-w-status" class="font-bold font-mono status-inactive text-xs">OFF</span>
                </div>
                <div class="flex flex-col items-center text-xs">
                  <kbd class="kbd kbd-xs bg-base-300 mb-1">A</kbd>
                  <span id="key-a-status" class="font-bold font-mono status-inactive text-xs">OFF</span>
                </div>
                <div class="flex flex-col items-center text-xs">
                  <kbd class="kbd kbd-xs bg-base-300 mb-1">S</kbd>
                  <span id="key-s-status" class="font-bold font-mono status-inactive text-xs">OFF</span>
                </div>
                <div class="flex flex-col items-center text-xs">
                  <kbd class="kbd kbd-xs bg-base-300 mb-1">D</kbd>
                  <span id="key-d-status" class="font-bold font-mono status-inactive text-xs">OFF</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Layer Status -->
        <div class="card bg-base-200/30 shadow-sm mb-3">
          <div class="card-body p-3">
            <h3 class="card-title text-sm text-success flex items-center gap-2">
              <span class="text-xs">▸</span>
              Layer Status
            </h3>
            <div class="space-y-2">
              <div class="flex justify-between items-center text-xs">
                <span class="text-base-content/70">Grid Layer:</span>
                <span id="grid-layer-status" class="font-bold font-mono status-active">ON</span>
              </div>
              <div class="flex justify-between items-center text-xs">
                <span class="text-base-content/70">Mouse Layer:</span>
                <span id="mouse-layer-status" class="font-bold font-mono status-active">ON</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Performance -->
        <div class="card bg-base-200/30 shadow-sm mb-3">
          <div class="card-body p-3">
            <h3 class="card-title text-sm text-secondary flex items-center gap-2">
              <span class="text-xs">▸</span>
              Performance
            </h3>
            <div class="space-y-2">
              <div class="flex justify-between items-center text-xs">
                <span class="text-base-content/70">FPS:</span>
                <span id="current-fps" class="font-bold font-mono text-success">60</span>
              </div>
              <div class="flex justify-between items-center text-xs">
                <span class="text-base-content/70">Render Time:</span>
                <span id="render-time" class="font-bold font-mono text-info">0ms</span>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>

    <!-- Layer Toggle Bar (Simplified) -->
    <div id="layer-toggle-bar" class="fixed bottom-4 right-4 bg-base-100/95 backdrop-blur-md border border-base-300 rounded-full shadow-lg z-50 px-4 py-2">
      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold text-accent">Layers</span>
        <div class="divider divider-horizontal mx-0"></div>
        <button id="toggle-layer-grid" class="btn btn-sm btn-success rounded-full">
          <span class="button-text">Grid</span>
        </button>
        <button id="toggle-layer-mouse" class="btn btn-sm btn-accent rounded-full">
          <span class="button-text">Mouse</span>
        </button>
      </div>
    </div>

    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

### **2. Simplified StorePanel.ts**
```typescript
// Focus only on Phase 3A core foundation data
export class StorePanel {
  private panelElement: HTMLElement | null = null

  constructor() {
    this.initializePanel()
    this.subscribeToStore()
  }

  private initializePanel(): void {
    this.panelElement = document.getElementById('store-panel')
    this.setupEventListeners()
  }

  private subscribeToStore(): void {
    // Subscribe only to Phase 3A relevant data
    subscribe(gameStore.staticMesh, () => this.updateMeshStatus())
    subscribe(gameStore.mouse, () => this.updateMousePosition())
    subscribe(gameStore.input.keys, () => this.updateNavigationStatus())
    subscribe(gameStore.cameraViewport.geometry_sampling_position, () => this.updateOffset())
  }

  private updateMeshStatus(): void {
    const meshScale = document.getElementById('mesh-scale')
    const meshReady = document.getElementById('mesh-ready')
    const verticesCount = document.getElementById('vertices-count')
    
    if (meshScale) meshScale.textContent = '1'
    if (meshReady) meshReady.textContent = gameStore.staticMesh.activeMesh ? 'true' : 'false'
    if (verticesCount) verticesCount.textContent = gameStore.staticMesh.activeMesh?.vertices.length.toString() || '0'
  }

  private updateMousePosition(): void {
    const mouseScreen = document.getElementById('mouse-screen')
    const mouseVertex = document.getElementById('mouse-vertex')
    const mousePixeloid = document.getElementById('mouse-pixeloid')
    
    if (mouseScreen) mouseScreen.textContent = `${gameStore.mouse.screen_position.x}, ${gameStore.mouse.screen_position.y}`
    if (mouseVertex) mouseVertex.textContent = `${gameStore.mouse.vertex_position.x}, ${gameStore.mouse.vertex_position.y}`
    if (mousePixeloid) mousePixeloid.textContent = `${gameStore.mouse.pixeloid_position.x.toFixed(2)}, ${gameStore.mouse.pixeloid_position.y.toFixed(2)}`
  }

  private updateNavigationStatus(): void {
    const currentOffset = document.getElementById('current-offset')
    const keys = gameStore.input.keys
    
    if (currentOffset) {
      const offset = gameStore.cameraViewport.geometry_sampling_position
      currentOffset.textContent = `${offset.x.toFixed(1)}, ${offset.y.toFixed(1)}`
    }
    
    // Update key statuses
    this.updateKeyStatus('w', keys.w)
    this.updateKeyStatus('a', keys.a)
    this.updateKeyStatus('s', keys.s)
    this.updateKeyStatus('d', keys.d)
  }

  private updateKeyStatus(key: string, pressed: boolean): void {
    const element = document.getElementById(`key-${key}-status`)
    if (element) {
      element.textContent = pressed ? 'ON' : 'OFF'
      element.className = pressed ? 'font-bold font-mono status-active text-xs' : 'font-bold font-mono status-inactive text-xs'
    }
  }
}
```

### **3. Simplified LayerToggleBar.ts**
```typescript
// Focus only on grid + mouse layers
export class LayerToggleBar {
  private barElement: HTMLElement | null = null

  constructor() {
    this.initializeBar()
    this.setupEventListeners()
  }

  private initializeBar(): void {
    this.barElement = document.getElementById('layer-toggle-bar')
  }

  private setupEventListeners(): void {
    // Grid layer toggle
    const gridButton = document.getElementById('toggle-layer-grid')
    if (gridButton) {
      gridButton.addEventListener('click', () => {
        updateGameStore.toggleLayerVisibility('background')
        this.updateButtonState('grid', gameStore.geometry.layerVisibility.background)
      })
    }

    // Mouse layer toggle
    const mouseButton = document.getElementById('toggle-layer-mouse')
    if (mouseButton) {
      mouseButton.addEventListener('click', () => {
        updateGameStore.toggleLayerVisibility('mouse')
        this.updateButtonState('mouse', gameStore.geometry.layerVisibility.mouse)
      })
    }
  }

  private updateButtonState(layer: string, visible: boolean): void {
    const button = document.getElementById(`toggle-layer-${layer}`)
    if (button) {
      button.className = visible 
        ? 'btn btn-sm btn-success rounded-full' 
        : 'btn btn-sm btn-outline rounded-full'
    }
  }
}
```

### **4. Simplified UIControlBar.ts**
```typescript
// Focus only on essential controls
export class UIControlBar {
  private barElement: HTMLElement | null = null

  constructor() {
    this.initializeBar()
    this.setupEventListeners()
  }

  private initializeBar(): void {
    this.barElement = document.getElementById('ui-control-bar')
  }

  private setupEventListeners(): void {
    // Store panel toggle
    const storeButton = document.getElementById('toggle-store-panel')
    if (storeButton) {
      storeButton.addEventListener('click', () => {
        this.togglePanel('store-panel')
      })
    }

    // Layer toggle
    const layersButton = document.getElementById('toggle-layers')
    if (layersButton) {
      layersButton.addEventListener('click', () => {
        this.togglePanel('layer-toggle-bar')
      })
    }
  }

  private togglePanel(panelId: string): void {
    const panel = document.getElementById(panelId)
    if (panel) {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none'
    }
  }
}
```

---

## 📋 **Implementation Steps**

### **Day 1: Backup and Remove**
1. Create `.backup` copies of complex UI files
2. Remove/comment out complex panels from HTML
3. Update imports in main.ts

### **Day 2: Simplify Store Panel**
1. Update HTML structure for simplified store panel
2. Rewrite StorePanel.ts for Phase 3A core data only
3. Test store panel updates

### **Day 3: Simplify Layer Controls**
1. Update LayerToggleBar.ts for grid + mouse only
2. Update UIControlBar.ts for essential controls only
3. Test layer visibility controls

### **Day 4: Integration Testing**
1. Test all UI components together
2. Verify store data updates correctly
3. Check layer toggle functionality
4. Validate navigation display

### **Day 5: Polish and Optimize**
1. Clean up CSS/styling
2. Optimize performance
3. Add missing functionality
4. Final validation

---

## 🎯 **Success Criteria**

### **Phase 3A UI Complete When:**
- ✅ **Simplified HTML**: Only essential panels remain
- ✅ **Core Store Panel**: Shows mesh, mouse, navigation, layers
- ✅ **Layer Toggle**: Grid + Mouse layer controls work
- ✅ **Real-time Updates**: All data updates in real-time
- ✅ **Clean UI**: No complex/unused elements
- ✅ **Performance**: Fast and responsive

### **Files Status:**
- ✅ **Keep**: UIControlBar.ts, LayerToggleBar.ts, StorePanel.ts, index.ts
- ✅ **Remove**: All other UI files (backup first)
- ✅ **Update**: HTML simplified for Phase 3A

This approach creates a clean, focused UI that reveals the core Phase 3A foundation architecture without distractions.