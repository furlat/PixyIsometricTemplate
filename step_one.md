# Step One: Multi-Layer System & Geometry Foundation

## 🎯 Overview

This document outlines the implementation plan for **Phase 1** of the PixyIsometric Template enhancement, introducing a multi-layer rendering system with geometric shape support and advanced debugging capabilities.

## 📋 Implementation Goals

- **a)** Introduce PixiJS RenderLayer-based multi-layer system  
- **b)** Create geometry panel with drawing tools and shape management
- **c)** Add geometric objects debug page with canvas navigation
- **d)** Extend store and types for geometry support
- **e)** Implement Bresenham line algorithm for pixeloid raycasting

---

## 🏗️ A) Multi-Layer System Architecture

### Current State Analysis
- [`InfiniteCanvas.ts`](app/src/game/InfiniteCanvas.ts:1) currently renders directly to a single `Graphics` object
- All visual elements (grid, highlights, UI) are drawn in the same rendering layer
- No separation of concerns between background, interactive content, and overlays

### Target Architecture

```typescript
// New: LayeredInfiniteCanvas extends existing InfiniteCanvas
class LayeredInfiniteCanvas extends InfiniteCanvas {
  private backgroundLayer: RenderLayer      // Grid background (existing grid)
  private geometryLayer: RenderLayer        // User-drawn shapes
  private raycastLayer: RenderLayer         // Raycast visualizations  
  private uiOverlayLayer: RenderLayer       // Debug visualizations
  
  constructor() {
    super()
    this.initializeLayers()
  }
  
  private initializeLayers(): void {
    // Create PixiJS RenderLayers in rendering order (bottom to top)
    this.backgroundLayer = new RenderLayer()
    this.geometryLayer = new RenderLayer() 
    this.raycastLayer = new RenderLayer()
    this.uiOverlayLayer = new RenderLayer()
    
    // Add to container in correct Z-order
    this.container.addChild(this.backgroundLayer)
    this.container.addChild(this.geometryLayer)
    this.container.addChild(this.raycastLayer)
    this.container.addChild(this.uiOverlayLayer)
  }
}
```

### Implementation Steps

1. **Extract Grid Rendering** (`InfiniteCanvas.renderGrid()` → `BackgroundGridRenderer`)
   - Move current grid logic to dedicated `BackgroundGridRenderer` class
   - Render to `backgroundLayer` instead of direct graphics
   - Maintain existing pixeloid coordinate system and viewport culling

2. **Create Layer Management System**
   - `LayerManager` class to coordinate between layers  
   - Each layer gets its own `Graphics` instance and update cycle
   - Coordinate transforms applied consistently across all layers

3. **Refactor Main Game Class**
   - Update [`Game.ts`](app/src/game/Game.ts:1) to use `LayeredInfiniteCanvas`
   - Maintain existing API compatibility
   - No changes needed to [`InputManager`](app/src/game/InputManager.ts:1) or [`CoordinateHelper`](app/src/game/CoordinateHelper.ts:1)

### Layer Responsibilities

| Layer | Purpose | Content | Rendering Priority |
|-------|---------|---------|-------------------|
| `backgroundLayer` | Static grid | Current checkered pattern, origin marker | 1 (Bottom) |
| `geometryLayer` | Interactive shapes | User-drawn rectangles, circles, polygons | 2 |
| `raycastLayer` | Line visualization | Bresenham rays, intersection points | 3 |
| `uiOverlayLayer` | Debug overlays | Selection highlights, coordinate display | 4 (Top) |

---

## 🎨 B) Geometry Panel & Store Integration

### New Store Architecture

Extend existing [`gameStore`](app/src/store/gameStore.ts:1) pattern with new geometry state:

```typescript
// Add to existing types/index.ts
export interface GeometricShape {
  id: string
  type: 'RECTANGLE' | 'CIRCLE' | 'POLYGON' | 'RAY'
  vertices: PixeloidCoordinate[]
  boundingBox: {
    topLeft: PixeloidCoordinate
    bottomRight: PixeloidCoordinate
  }
  style: {
    fillColor: number
    strokeColor: number
    strokeWidth: number
    alpha: number
  }
  metadata: {
    createdAt: number
    isSelected: boolean
    isHovered: boolean
  }
}

export interface RaycastResult {
  id: string
  startPoint: PixeloidCoordinate
  endPoint: PixeloidCoordinate
  rayPixeloids: PixeloidCoordinate[]
  intersections: Array<{
    point: PixeloidCoordinate
    shapeId: string
    distance: number
  }>
}

export type GeometryMode = 'SELECTION' | 'RECTANGLE' | 'CIRCLE' | 'POLYGON' | 'RAYCAST'

export interface GeometryState {
  mode: GeometryMode
  shapes: Map<string, GeometricShape>
  activeRay: RaycastResult | null
  selectedShapeIds: Set<string>
  hoveredShapeId: string | null
  isVisible: boolean
  
  // Drawing state
  activeDrawing: {
    isDrawing: boolean
    startPoint: PixeloidCoordinate | null
    currentPoints: PixeloidCoordinate[]
  }
}
```

### Store Updates

```typescript
// Extend existing gameStore.ts
export const geometryStore = proxy<GeometryState>({
  mode: 'SELECTION',
  shapes: new Map(),
  activeRay: null,
  selectedShapeIds: new Set(),
  hoveredShapeId: null,
  isVisible: true,
  activeDrawing: {
    isDrawing: false,
    startPoint: null,
    currentPoints: []
  }
})

// Following existing updateGameStore pattern
export const updateGeometryStore = {
  setMode: (mode: GeometryMode) => {
    geometryStore.mode = mode
  },
  
  addShape: (shape: GeometricShape) => {
    geometryStore.shapes.set(shape.id, shape)
  },
  
  removeShape: (shapeId: string) => {
    geometryStore.shapes.delete(shapeId)
    geometryStore.selectedShapeIds.delete(shapeId)
  },
  
  selectShape: (shapeId: string) => {
    geometryStore.selectedShapeIds.clear()
    geometryStore.selectedShapeIds.add(shapeId)
  },
  
  toggleShapeSelection: (shapeId: string) => {
    if (geometryStore.selectedShapeIds.has(shapeId)) {
      geometryStore.selectedShapeIds.delete(shapeId)
    } else {
      geometryStore.selectedShapeIds.add(shapeId)
    }
  },
  
  setHoveredShape: (shapeId: string | null) => {
    geometryStore.hoveredShapeId = shapeId
  },
  
  updateActiveRay: (rayResult: RaycastResult) => {
    geometryStore.activeRay = rayResult
  },
  
  startDrawing: (startPoint: PixeloidCoordinate) => {
    geometryStore.activeDrawing.isDrawing = true
    geometryStore.activeDrawing.startPoint = startPoint
    geometryStore.activeDrawing.currentPoints = [startPoint]
  },
  
  addDrawingPoint: (point: PixeloidCoordinate) => {
    geometryStore.activeDrawing.currentPoints.push(point)
  },
  
  finishDrawing: () => {
    geometryStore.activeDrawing.isDrawing = false
    geometryStore.activeDrawing.startPoint = null
    geometryStore.activeDrawing.currentPoints = []
  },
  
  centerCameraOnShape: (shapeId: string) => {
    const shape = geometryStore.shapes.get(shapeId)
    if (shape) {
      // Calculate shape center
      const centerX = (shape.boundingBox.topLeft.x + shape.boundingBox.bottomRight.x) / 2
      const centerY = (shape.boundingBox.topLeft.y + shape.boundingBox.bottomRight.y) / 2
      
      // Use existing camera positioning from gameStore
      updateGameStore.setCameraPosition(centerX, centerY)
    }
  }
}
```

### Geometry Panel UI Component

Following existing [`StorePanel`](app/src/ui/StorePanel.ts:1) pattern:

```typescript
// New: src/ui/GeometryPanel.ts
export class GeometryPanel {
  private elements: Map<string, HTMLElement> = new Map()
  private isVisible: boolean = false
  
  constructor() {
    this.initializeElements()
    this.setupReactivity()
    this.setupEventHandlers()
  }
  
  private setupReactivity(): void {
    subscribe(geometryStore, () => {
      this.updateValues()
    })
  }
  
  private setupEventHandlers(): void {
    // Mode selection buttons
    document.getElementById('geometry-mode-selection')?.addEventListener('click', () => {
      updateGeometryStore.setMode('SELECTION')
    })
    
    document.getElementById('geometry-mode-rectangle')?.addEventListener('click', () => {
      updateGeometryStore.setMode('RECTANGLE')
    })
    
    document.getElementById('geometry-mode-circle')?.addEventListener('click', () => {
      updateGeometryStore.setMode('CIRCLE')
    })
    
    document.getElementById('geometry-mode-polygon')?.addEventListener('click', () => {
      updateGeometryStore.setMode('POLYGON')
    })
    
    document.getElementById('geometry-mode-raycast')?.addEventListener('click', () => {
      updateGeometryStore.setMode('RAYCAST')
    })
  }
  
  public toggle(): void {
    this.isVisible = !this.isVisible
    const panelElement = document.getElementById('geometry-panel')
    if (panelElement) {
      panelElement.style.display = this.isVisible ? 'block' : 'none'
    }
  }
  
  public getVisible(): boolean {
    return this.isVisible
  }
}
```

---

## 🎯 C) Geometric Objects Debug Page

### Store Panel Extension

Add new tab/page to existing [`StorePanel`](app/src/ui/StorePanel.ts:1) for geometry debugging:

```typescript
// Extend StorePanel.ts with geometry section
export class StorePanel {
  private currentPage: 'system' | 'geometry' = 'system'
  
  private updateValues(): void {
    if (this.currentPage === 'system') {
      this.updateSystemValues()
    } else if (this.currentPage === 'geometry') {
      this.updateGeometryValues()
    }
  }
  
  private updateGeometryValues(): void {
    if (!this.isVisible) return
    
    // Current mode
    updateElement(this.elements, 'geometry-current-mode', 
      geometryStore.mode, 'text-primary')
    
    // Shape count
    updateElement(this.elements, 'geometry-shape-count', 
      geometryStore.shapes.size.toString(), 'text-info')
    
    // Selected shapes
    updateElement(this.elements, 'geometry-selected-count', 
      geometryStore.selectedShapeIds.size.toString(), 'text-success')
    
    // Active ray info
    if (geometryStore.activeRay) {
      updateElement(this.elements, 'geometry-ray-length', 
        geometryStore.activeRay.rayPixeloids.length.toString(), 'text-warning')
      
      updateElement(this.elements, 'geometry-ray-intersections', 
        geometryStore.activeRay.intersections.length.toString(), 'text-accent')
    }
    
    // Render shapes list
    this.renderShapesList()
  }
  
  private renderShapesList(): void {
    const container = document.getElementById('geometry-shapes-list')
    if (!container) return
    
    container.innerHTML = ''
    
    geometryStore.shapes.forEach((shape, shapeId) => {
      const shapeElement = document.createElement('div')
      shapeElement.className = `
        geometry-shape-item p-2 mb-1 rounded cursor-pointer border
        ${geometryStore.selectedShapeIds.has(shapeId) ? 'border-primary bg-primary/10' : 'border-base-300'}
        ${geometryStore.hoveredShapeId === shapeId ? 'bg-accent/10' : ''}
        hover:bg-base-200 transition-colors
      `
      
      shapeElement.innerHTML = `
        <div class="flex justify-between items-center">
          <div>
            <span class="text-sm font-mono text-primary">${shape.type}</span>
            <span class="text-xs text-base-content/70 ml-2">${shapeId.slice(0, 8)}</span>
          </div>
          <div class="text-xs text-base-content/50">
            ${formatCoordinates(
              (shape.boundingBox.topLeft.x + shape.boundingBox.bottomRight.x) / 2,
              (shape.boundingBox.topLeft.y + shape.boundingBox.bottomRight.y) / 2,
              1
            )}
          </div>
        </div>
      `
      
      // Click to center camera on shape
      shapeElement.addEventListener('click', () => {
        updateGeometryStore.centerCameraOnShape(shapeId)
        updateGeometryStore.selectShape(shapeId)
      })
      
      // Hover effects
      shapeElement.addEventListener('mouseenter', () => {
        updateGeometryStore.setHoveredShape(shapeId)
      })
      
      shapeElement.addEventListener('mouseleave', () => {
        updateGeometryStore.setHoveredShape(null)
      })
      
      container.appendChild(shapeElement)
    })
  }
  
  public switchToGeometryPage(): void {
    this.currentPage = 'geometry'
    this.updatePageVisibility()
    this.updateValues()
  }
  
  public switchToSystemPage(): void {
    this.currentPage = 'system'
    this.updatePageVisibility()
    this.updateValues()
  }
  
  private updatePageVisibility(): void {
    const systemPage = document.getElementById('store-panel-system')
    const geometryPage = document.getElementById('store-panel-geometry')
    
    if (systemPage && geometryPage) {
      systemPage.style.display = this.currentPage === 'system' ? 'block' : 'none'
      geometryPage.style.display = this.currentPage === 'geometry' ? 'block' : 'none'
    }
  }
}
```

### HTML Template Updates

Add geometry debug page to existing [`index.html`](app/index.html:1):

```html
<!-- Add to store panel inside existing structure -->
<div id="store-panel" class="store-panel">
  <!-- Existing tabs -->
  <div class="store-panel-tabs">
    <button id="tab-system" class="tab-button active">System</button>
    <button id="tab-geometry" class="tab-button">Geometry</button>
  </div>
  
  <!-- Existing system page -->
  <div id="store-panel-system" class="store-panel-page">
    <!-- Current system debugging content -->
  </div>
  
  <!-- New geometry page -->
  <div id="store-panel-geometry" class="store-panel-page" style="display: none;">
    <div class="section">
      <h3>Geometry State</h3>
      <div class="data-row">
        <span class="label">Current Mode:</span>
        <span id="geometry-current-mode" class="value">—</span>
      </div>
      <div class="data-row">
        <span class="label">Total Shapes:</span>
        <span id="geometry-shape-count" class="value">—</span>
      </div>
      <div class="data-row">
        <span class="label">Selected:</span>
        <span id="geometry-selected-count" class="value">—</span>
      </div>
    </div>
    
    <div class="section">
      <h3>Active Ray</h3>
      <div class="data-row">
        <span class="label">Ray Length:</span>
        <span id="geometry-ray-length" class="value">—</span>
      </div>
      <div class="data-row">
        <span class="label">Intersections:</span>
        <span id="geometry-ray-intersections" class="value">—</span>
      </div>
    </div>
    
    <div class="section">
      <h3>Shapes List</h3>
      <div id="geometry-shapes-list" class="shapes-list max-h-64 overflow-y-auto">
        <!-- Dynamic shape list populated by JavaScript -->
      </div>
    </div>
  </div>
</div>
```

---

## 📊 D) Store and Types Updates

### Type System Extensions

Add to existing [`types/index.ts`](app/src/types/index.ts:1):

```typescript
// Extend existing types with geometry support
export interface GameState {
  // ... existing properties
  geometry: GeometryState  // Add geometry state
}

// New geometry-specific types
export interface GeometricShape {
  id: string
  type: 'RECTANGLE' | 'CIRCLE' | 'POLYGON' | 'RAY'
  vertices: PixeloidCoordinate[]
  boundingBox: {
    topLeft: PixeloidCoordinate
    bottomRight: PixeloidCoordinate
  }
  style: ShapeStyle
  metadata: ShapeMetadata
}

export interface ShapeStyle {
  fillColor: number
  strokeColor: number
  strokeWidth: number
  alpha: number
}

export interface ShapeMetadata {
  createdAt: number
  isSelected: boolean
  isHovered: boolean
  name?: string
}

export interface RaycastResult {
  id: string
  startPoint: PixeloidCoordinate
  endPoint: PixeloidCoordinate
  rayPixeloids: PixeloidCoordinate[]
  intersections: RayIntersection[]
}

export interface RayIntersection {
  point: PixeloidCoordinate
  shapeId: string
  distance: number
  normal?: PixeloidCoordinate  // Surface normal at intersection
}

export type GeometryMode = 'SELECTION' | 'RECTANGLE' | 'CIRCLE' | 'POLYGON' | 'RAYCAST'

export interface GeometryState {
  mode: GeometryMode
  shapes: Map<string, GeometricShape>
  activeRay: RaycastResult | null
  selectedShapeIds: Set<string>
  hoveredShapeId: string | null
  isVisible: boolean
  
  activeDrawing: {
    isDrawing: boolean
    startPoint: PixeloidCoordinate | null
    currentPoints: PixeloidCoordinate[]
  }
  
  settings: {
    defaultShapeStyle: ShapeStyle
    raycastMaxDistance: number
    snapToGrid: boolean
    gridSnapSize: number
  }
}

// Shape factory types
export interface ShapeFactory {
  createRectangle(topLeft: PixeloidCoordinate, bottomRight: PixeloidCoordinate): GeometricShape
  createCircle(center: PixeloidCoordinate, radius: number): GeometricShape
  createPolygon(vertices: PixeloidCoordinate[]): GeometricShape
  createRay(start: PixeloidCoordinate, end: PixeloidCoordinate): GeometricShape
}
```

### Extended Game Store

```typescript
// Update existing gameStore to include geometry
export const gameStore = proxy<GameState>({
  // ... existing properties
  geometry: {
    mode: 'SELECTION',
    shapes: new Map(),
    activeRay: null,
    selectedShapeIds: new Set(),
    hoveredShapeId: null,
    isVisible: true,
    activeDrawing: {
      isDrawing: false,
      startPoint: null,
      currentPoints: []
    },
    settings: {
      defaultShapeStyle: {
        fillColor: 0x3b82f6,      // Blue
        strokeColor: 0x1e40af,    // Dark blue
        strokeWidth: 2,
        alpha: 0.7
      },
      raycastMaxDistance: 100,
      snapToGrid: false,
      gridSnapSize: 1
    }
  }
})
```

---

## ⚡ E) Bresenham Line Algorithm Implementation

### Core Algorithm for Pixeloid Space

```typescript
// New: src/game/BresenhamRaycast.ts
export class BresenhamRaycast {
  /**
   * Generate all pixeloid coordinates along a line using Bresenham's algorithm
   * Optimized for integer pixeloid coordinates - no floating point arithmetic
   */
  static castRay(
    start: PixeloidCoordinate, 
    end: PixeloidCoordinate
  ): PixeloidCoordinate[] {
    const rayPoints: PixeloidCoordinate[] = []
    
    // Convert to integer coordinates for Bresenham
    let x0 = Math.floor(start.x)
    let y0 = Math.floor(start.y)
    const x1 = Math.floor(end.x)
    const y1 = Math.floor(end.y)
    
    const dx = Math.abs(x1 - x0)
    const dy = Math.abs(y1 - y0)
    const sx = x0 < x1 ? 1 : -1
    const sy = y0 < y1 ? 1 : -1
    let err = dx - dy
    
    while (true) {
      // Add current point to ray
      rayPoints.push({ x: x0, y: y0 })
      
      // Check if we've reached the end point
      if (x0 === x1 && y0 === y1) break
      
      // Calculate error and step
      const e2 = 2 * err
      
      if (e2 > -dy) {
        err -= dy
        x0 += sx
      }
      
      if (e2 < dx) {
        err += dx
        y0 += sy
      }
    }
    
    return rayPoints
  }
  
  /**
   * Cast ray with maximum distance limit
   */
  static castRayWithLimit(
    start: PixeloidCoordinate,
    direction: PixeloidCoordinate,
    maxDistance: number
  ): PixeloidCoordinate[] {
    // Calculate end point based on direction and max distance
    const magnitude = Math.sqrt(direction.x * direction.x + direction.y * direction.y)
    const normalizedDir = {
      x: direction.x / magnitude,
      y: direction.y / magnitude
    }
    
    const end: PixeloidCoordinate = {
      x: start.x + normalizedDir.x * maxDistance,
      y: start.y + normalizedDir.y * maxDistance
    }
    
    return this.castRay(start, end)
  }
  
  /**
   * Cast ray from screen coordinates using existing coordinate system
   */
  static castRayFromScreen(
    screenStart: { x: number, y: number },
    screenEnd: { x: number, y: number },
    camera: CameraState,
    viewportSize: { width: number, height: number }
  ): RaycastResult {
    // Use existing CoordinateHelper for screen-to-pixeloid conversion
    const pixeloidStart = CoordinateHelper.screenToPixeloid(
      screenStart.x, screenStart.y,
      camera.position, viewportSize, camera.pixeloidScale
    )
    
    const pixeloidEnd = CoordinateHelper.screenToPixeloid(
      screenEnd.x, screenEnd.y,
      camera.position, viewportSize, camera.pixeloidScale
    )
    
    const rayPixeloids = this.castRay(
      { x: pixeloidStart.x, y: pixeloidStart.y },
      { x: pixeloidEnd.x, y: pixeloidEnd.y }
    )
    
    return {
      id: `ray_${Date.now()}`,
      startPoint: { x: pixeloidStart.x, y: pixeloidStart.y },
      endPoint: { x: pixeloidEnd.x, y: pixeloidEnd.y },
      rayPixeloids,
      intersections: []  // Will be populated by collision detection
    }
  }
}
```

### Integration with Existing Input System

```typescript
// Extend existing InputManager.ts to handle raycast mode
export class InputManager {
  // ... existing methods
  
  private handleMouseClick(event: MouseEvent): void {
    if (!this.canvas || !this.infiniteCanvas) return
    
    const rect = this.canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    // Existing mouse position update
    updateGameStore.updateMousePosition(x, y)
    
    const pixeloidPos = this.infiniteCanvas.screenToPixeloid(x, y)
    updateGameStore.updateMousePixeloidPosition(pixeloidPos.x, pixeloidPos.y)
    
    // Handle geometry mode interactions
    this.handleGeometryModeClick(pixeloidPos, { x, y })
  }
  
  private handleGeometryModeClick(
    pixeloidPos: Point, 
    screenPos: { x: number, y: number }
  ): void {
    const mode = geometryStore.mode
    
    switch (mode) {
      case 'RAYCAST':
        this.handleRaycastClick(pixeloidPos, screenPos)
        break
      case 'RECTANGLE':
        this.handleRectangleClick(pixeloidPos)
        break
      case 'SELECTION':
        this.handleSelectionClick(pixeloidPos)
        break
      // ... other modes
    }
  }
  
  private handleRaycastClick(
    pixeloidPos: Point, 
    screenPos: { x: number, y: number }
  ): void {
    if (!geometryStore.activeDrawing.isDrawing) {
      // Start raycast
      updateGeometryStore.startDrawing({ x: pixeloidPos.x, y: pixeloidPos.y })
    } else {
      // Finish raycast
      const startPoint = geometryStore.activeDrawing.startPoint!
      const endPoint = { x: pixeloidPos.x, y: pixeloidPos.y }
      
      const rayResult = BresenhamRaycast.castRay(startPoint, endPoint)
      
      const raycastResult: RaycastResult = {
        id: `ray_${Date.now()}`,
        startPoint,
        endPoint,
        rayPixeloids: rayResult,
        intersections: this.findRayIntersections(rayResult)
      }
      
      updateGeometryStore.updateActiveRay(raycastResult)
      updateGeometryStore.finishDrawing()
    }
  }
  
  private findRayIntersections(rayPixeloids: PixeloidCoordinate[]): RayIntersection[] {
    const intersections: RayIntersection[] = []
    
    // Check each ray point against all shapes
    rayPixeloids.forEach((point, index) => {
      geometryStore.shapes.forEach((shape, shapeId) => {
        if (this.pointInShape(point, shape)) {
          intersections.push({
            point,
            shapeId,
            distance: index,  // Distance along ray
            normal: this.calculateSurfaceNormal(point, shape)
          })
        }
      })
    })
    
    return intersections
  }
  
  private pointInShape(point: PixeloidCoordinate, shape: GeometricShape): boolean {
    // Basic bounding box check first
    if (point.x < shape.boundingBox.topLeft.x || 
        point.x > shape.boundingBox.bottomRight.x ||
        point.y < shape.boundingBox.topLeft.y || 
        point.y > shape.boundingBox.bottomRight.y) {
      return false
    }
    
    // Shape-specific collision detection
    switch (shape.type) {
      case 'RECTANGLE':
        return true  // Already checked with bounding box
      case 'CIRCLE':
        return this.pointInCircle(point, shape)
      case 'POLYGON':
        return this.pointInPolygon(point, shape)
      default:
        return false
    }
  }
}
```

---

## ✅ CURRENT IMPLEMENTATION STATUS

### ✅ COMPLETED (Foundation Architecture):

**1. Multi-Layer System Foundation**
- ✅ [`BackgroundGridRenderer.ts`](app/src/game/BackgroundGridRenderer.ts:1) - Extracted grid rendering from InfiniteCanvas
- ✅ [`LayeredInfiniteCanvas.ts`](app/src/game/LayeredInfiniteCanvas.ts:1) - Extends InfiniteCanvas with 4 PixiJS Container layers
- ✅ [`Game.ts`](app/src/game/Game.ts:1) - Updated to use LayeredInfiniteCanvas
- ✅ [`InfiniteCanvas.ts`](app/src/game/InfiniteCanvas.ts:198) - Made members protected for proper inheritance

**2. Store & Types Integration**
- ✅ [`types/index.ts`](app/src/types/index.ts:69) - Complete geometry types (GeometricPoint, GeometricLine, etc.)
- ✅ [`gameStore.ts`](app/src/store/gameStore.ts:38) - Full geometry state with Valtio reactivity
- ✅ [`StorePanel.ts`](app/src/ui/StorePanel.ts:142) - Geometry debug information integrated

**3. GeometryPanel UI Component**
- ✅ [`GeometryPanel.ts`](app/src/ui/GeometryPanel.ts:1) - Complete UI component with reactive updates
- ✅ [`index.html`](app/index.html:203) - Full HTML interface with drawing modes, layer toggles, settings
- ✅ [`UIControlBar.ts`](app/src/ui/UIControlBar.ts:35) - Geometry button + panel management
- ✅ [`main.ts`](app/src/main.ts:20) - GeometryPanel initialization and connection

### ❌ MISSING CRITICAL FUNCTIONALITY:

**1. Layer Visibility Control - UI EXISTS BUT NON-FUNCTIONAL**
- ❌ **Problem**: Buttons exist but [`LayeredInfiniteCanvas.ts:74-75`](app/src/game/LayeredInfiniteCanvas.ts:74) shows TODO
- ❌ **Issue**: Store updates but layers don't actually hide/show
- ❌ **Missing**: Logic to set `layer.visible = false` based on store state

**2. Drawing Functionality - COMPLETELY MISSING**
- ❌ **Problem**: GeometryPanel is only a UI stub - no actual drawing capability
- ❌ **Issue**: Mouse clicks don't create shapes (no InputManager integration)
- ❌ **Missing**: Connection between mode selection and mouse input handling

**3. Shape Rendering - GEOMETRY LAYER EMPTY**
- ❌ **Problem**: Container exists but renders nothing
- ❌ **Issue**: Store can hold geometric objects but they don't appear on screen
- ❌ **Missing**: Shape rendering logic in geometry layer

**4. Bresenham Raycast - INTENTIONALLY SKIPPED**
- ⚠️ **Status**: Not implemented per user request

## 🎯 NEXT STEPS TO COMPLETE DRAWING FUNCTIONALITY:

### 🔥 PRIORITY 1: Layer Visibility Implementation
**File**: [`LayeredInfiniteCanvas.ts`](app/src/game/LayeredInfiniteCanvas.ts:74)
```typescript
// Replace TODO with actual layer visibility logic
public render(): void {
  super.render()
  
  // Apply layer visibility from store state
  this.backgroundLayer.visible = gameStore.geometry.layerVisibility.grid
  this.geometryLayer.visible = gameStore.geometry.layerVisibility.geometry
  this.raycastLayer.visible = gameStore.geometry.layerVisibility.raycast
  
  // Render background grid
  if (this.backgroundLayer.visible) {
    this.backgroundGridRenderer.render(corners, pixeloidScale)
    this.backgroundLayer.removeChildren()
    this.backgroundLayer.addChild(this.backgroundGridRenderer.getGraphics())
  }
  
  // Render geometry shapes
  if (this.geometryLayer.visible) {
    this.renderGeometryLayer()
  }
}
```

### 🔥 PRIORITY 2: Mouse Input for Drawing
**File**: [`InputManager.ts`](app/src/game/InputManager.ts:1) - Extend existing mouse handling
```typescript
private handleMouseClick(event: MouseEvent): void {
  // Existing mouse position update...
  
  // NEW: Handle geometry mode interactions
  if (gameStore.geometry.drawing.mode !== 'none') {
    this.handleGeometryModeClick(pixeloidPos)
  }
}

private handleGeometryModeClick(pixeloidPos: Point): void {
  const mode = gameStore.geometry.drawing.mode
  
  switch (mode) {
    case 'rectangle':
      this.handleRectangleClick(pixeloidPos)
      break
    case 'circle':
      this.handleCircleClick(pixeloidPos)
      break
    case 'point':
      this.handlePointClick(pixeloidPos)
      break
    case 'line':
      this.handleLineClick(pixeloidPos)
      break
  }
}
```

### 🔥 PRIORITY 3: Shape Creation & Rendering
**Files**: Create [`ShapeFactory.ts`](app/src/game/ShapeFactory.ts) and [`GeometryRenderer.ts`](app/src/game/GeometryRenderer.ts)
```typescript
// ShapeFactory.ts - Create geometric objects
export class ShapeFactory {
  static createRectangle(start: PixeloidCoordinate, end: PixeloidCoordinate): GeometricRectangle {
    return {
      id: `rect_${Date.now()}`,
      x: Math.min(start.x, end.x),
      y: Math.min(start.y, end.y),
      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y),
      color: gameStore.geometry.drawing.settings.defaultColor,
      strokeWidth: gameStore.geometry.drawing.settings.defaultStrokeWidth,
      isVisible: true,
      createdAt: Date.now()
    }
  }
}

// GeometryRenderer.ts - Render shapes to PixiJS Graphics
export class GeometryRenderer {
  private graphics: Graphics = new Graphics()
  
  render(objects: GeometricObject[]): Graphics {
    this.graphics.clear()
    
    for (const obj of objects) {
      if (!obj.isVisible) continue
      
      switch (obj.type) {
        case 'rectangle':
          this.renderRectangle(obj)
          break
        case 'circle':
          this.renderCircle(obj)
          break
        case 'point':
          this.renderPoint(obj)
          break
        case 'line':
          this.renderLine(obj)
          break
      }
    }
    
    return this.graphics
  }
}
```

### 🔥 PRIORITY 4: Integration in LayeredInfiniteCanvas
```typescript
// Add to LayeredInfiniteCanvas.ts
private geometryRenderer: GeometryRenderer

private renderGeometryLayer(): void {
  const geometryObjects = Array.from(gameStore.geometry.objects)
  const renderedGraphics = this.geometryRenderer.render(geometryObjects)
  
  this.geometryLayer.removeChildren()
  this.geometryLayer.addChild(renderedGraphics)
}
```

## 📋 IMPLEMENTATION CHECKLIST:

### Phase 1: Core Functionality (Immediate)
- [ ] **Layer Visibility Logic** - Make toggles actually work
- [ ] **Mouse Input Handling** - Connect clicks to shape creation
- [ ] **Shape Factory** - Create geometric objects from coordinates
- [ ] **Geometry Renderer** - Render shapes to PixiJS Graphics
- [ ] **Integration** - Connect all pieces in LayeredInfiniteCanvas

### Phase 2: Enhanced Features (Follow-up)
- [ ] **Shape Selection** - Click existing shapes to select them
- [ ] **Shape Editing** - Drag corners to resize shapes
- [ ] **Shape Deletion** - Delete selected shapes
- [ ] **Multi-shape Operations** - Select multiple shapes

### Phase 3: Advanced Features (Future)
- [ ] **Bresenham Raycast** - If requested later
- [ ] **Complex Polygons** - Multi-point drawing
- [ ] **Shape Persistence** - Save/load geometric objects
- [ ] **Performance Optimization** - Spatial indexing for many shapes

---

## 🎯 Success Criteria

1. **Multi-Layer System**: Four distinct render layers working with existing coordinate system
2. **Geometry Support**: Create, select, and manage basic shapes (rectangles, rays)
3. **Debug Navigation**: Click geometric objects in debug panel to center camera
4. **Bresenham Integration**: Pixel-perfect ray traversal in pixeloid space
5. **Store Integration**: Reactive geometry state following existing patterns
6. **Performance**: No degradation of existing infinite canvas performance
7. **API Compatibility**: All existing functionality preserved

This implementation provides the foundation for advanced geometric interactions while maintaining the architectural integrity of the existing PixyIsometric Template.
---

## 🖱️ UX/INPUT HANDLING DESIGN FOR DRAWING

### 🎯 Core UX Principles

**1. Single-Action Drawing (No Multi-Click for Basic Shapes)**
- **Rectangles**: Click and drag to define opposite corners
- **Circles**: Click and drag from center to edge (radius)
- **Lines**: Click and drag from start to end point
- **Points**: Single click to place
- **Polygons**: ONLY shape requiring multiple clicks (sequential vertex placement)

**2. Visual Feedback During Drawing**
- **Preview shape** renders in real-time during drag operations
- **Snap indicators** show grid alignment
- **Dimension display** shows current size/coordinates
- **Constraint indicators** show when proportions are locked

**3. Shape Regulation & Constraints**
- **Grid snapping** with toggle control
- **Proportional constraints** (hold Shift for squares from rectangles)
- **Minimum size limits** prevent degenerate shapes
- **Maximum canvas bounds** prevent drawing outside visible area

### 📐 Drawing Mode Behaviors

#### Rectangle Mode (`mode: 'rectangle'`)
```typescript
// UX Flow: Click + Drag
onMouseDown(pixeloidPos) {
  startCorner = pixeloidPos
  showPreviewRectangle = true
}

onMouseMove(pixeloidPos) {
  if (showPreviewRectangle) {
    currentCorner = applyConstraints(pixeloidPos, startCorner)
    renderPreviewRectangle(startCorner, currentCorner)
    displayDimensions(calculateSize(startCorner, currentCorner))
  }
}

onMouseUp(pixeloidPos) {
  if (isValidRectangle(startCorner, currentCorner)) {
    createRectangle(startCorner, currentCorner)
  }
  clearPreview()
}

// Constraints & Regulation
function applyConstraints(current, start) {
  let result = current
  
  // Grid snapping
  if (gameStore.geometry.settings.snapToGrid) {
    result = snapToGrid(result, gameStore.geometry.settings.gridSnapSize)
  }
  
  // Square constraint (Shift key held)
  if (isShiftPressed) {
    result = makeSquare(start, result)
  }
  
  // Minimum size
  result = enforceMinimumSize(start, result, MIN_RECTANGLE_SIZE)
  
  return result
}
```

#### Circle Mode (`mode: 'circle'`)
```typescript
// UX Flow: Click + Drag (center to radius)
onMouseDown(pixeloidPos) {
  centerPoint = pixeloidPos
  showPreviewCircle = true
}

onMouseMove(pixeloidPos) {
  if (showPreviewCircle) {
    radius = calculateRadius(centerPoint, pixeloidPos)
    radius = applyCircleConstraints(radius)
    renderPreviewCircle(centerPoint, radius)
    displayRadius(radius)
  }
}

onMouseUp(pixeloidPos) {
  if (radius >= MIN_CIRCLE_RADIUS) {
    createCircle(centerPoint, radius)
  }
  clearPreview()
}

// Circle-specific constraints
function applyCircleConstraints(radius) {
  // Snap radius to grid intervals
  if (gameStore.geometry.settings.snapToGrid) {
    radius = Math.round(radius / gameStore.geometry.settings.gridSnapSize) * gameStore.geometry.settings.gridSnapSize
  }
  
  // Enforce minimum/maximum radius
  radius = Math.max(radius, MIN_CIRCLE_RADIUS)
  radius = Math.min(radius, MAX_CIRCLE_RADIUS)
  
  return radius
}
```

#### Line Mode (`mode: 'line'`)
```typescript
// UX Flow: Click + Drag (start to end)
onMouseDown(pixeloidPos) {
  startPoint = pixeloidPos
  showPreviewLine = true
}

onMouseMove(pixeloidPos) {
  if (showPreviewLine) {
    endPoint = applyLineConstraints(pixeloidPos, startPoint)
    renderPreviewLine(startPoint, endPoint)
    displayLength(calculateDistance(startPoint, endPoint))
    displayAngle(calculateAngle(startPoint, endPoint))
  }
}

// Line-specific constraints
function applyLineConstraints(end, start) {
  let result = end
  
  // Angle snapping (Shift for 45-degree increments)
  if (isShiftPressed) {
    result = snapToAngle(start, result, [0, 45, 90, 135, 180, 225, 270, 315])
  }
  
  // Grid snapping
  if (gameStore.geometry.settings.snapToGrid) {
    result = snapToGrid(result, gameStore.geometry.settings.gridSnapSize)
  }
  
  return result
}
```

#### Point Mode (`mode: 'point'`)
```typescript
// UX Flow: Single Click
onMouseDown(pixeloidPos) {
  point = applyPointConstraints(pixeloidPos)
  createPoint(point)
}

function applyPointConstraints(pos) {
  if (gameStore.geometry.settings.snapToGrid) {
    return snapToGrid(pos, gameStore.geometry.settings.gridSnapSize)
  }
  return pos
}
```

#### Polygon Mode (`mode: 'polygon'`) - MULTI-CLICK EXCEPTION
```typescript
// UX Flow: Sequential clicks to build polygon
onMouseDown(pixeloidPos) {
  if (!activePolygon.isDrawing) {
    // Start new polygon
    activePolygon.vertices = [pixeloidPos]
    activePolygon.isDrawing = true
    showPolygonPreview = true
  } else {
    // Add vertex to existing polygon
    activePolygon.vertices.push(pixeloidPos)
  }
  
  renderPolygonPreview(activePolygon.vertices)
}

onMouseMove(pixeloidPos) {
  if (activePolygon.isDrawing && showPolygonPreview) {
    previewVertices = [...activePolygon.vertices, pixeloidPos]
    renderPolygonPreview(previewVertices)
  }
}

onDoubleClick() {
  // Finish polygon
  if (activePolygon.vertices.length >= 3) {
    createPolygon(activePolygon.vertices)
  }
  clearPolygonDrawing()
}

onEscapeKey() {
  // Cancel polygon drawing
  clearPolygonDrawing()
}
```

### 🎛️ Shape Manipulation (Post-Creation)

#### Selection System
```typescript
// Visual selection indicators
function renderSelectionHandles(shape: GeometricShape) {
  switch (shape.type) {
    case 'rectangle':
      // 8 handles: 4 corners + 4 edge midpoints
      renderCornerHandles(shape.boundingBox)
      renderEdgeHandles(shape.boundingBox)
      break
      
    case 'circle':
      // 4 cardinal direction handles + center
      renderRadiusHandles(shape.center, shape.radius)
      renderCenterHandle(shape.center)
      break
      
    case 'line':
      // 2 endpoint handles
      renderEndpointHandles(shape.start, shape.end)
      break
      
    case 'point':
      // Single position handle
      renderPositionHandle(shape.position)
      break
  }
}
```

#### Movement Actions
```typescript
// Drag entire shape
onShapeDrag(shape: GeometricShape, deltaX: number, deltaY: number) {
  const newShape = translateShape(shape, deltaX, deltaY)
  
  // Apply movement constraints
  if (gameStore.geometry.settings.snapToGrid) {
    newShape = snapShapeToGrid(newShape)
  }
  
  // Bounds checking
  if (isWithinCanvas(newShape)) {
    updateGeometryStore.updateShape(shape.id, newShape)
  }
}
```

#### Resize Actions
```typescript
// Drag selection handles
onHandleDrag(shape: GeometricShape, handleType: HandleType, newPosition: PixeloidCoordinate) {
  switch (shape.type) {
    case 'rectangle':
      if (handleType === 'corner') {
        shape = resizeRectangleByCorner(shape, newPosition)
      } else if (handleType === 'edge') {
        shape = resizeRectangleByEdge(shape, newPosition)
      }
      break
      
    case 'circle':
      if (handleType === 'radius') {
        shape = resizeCircleByRadius(shape, newPosition)
      } else if (handleType === 'center') {
        shape = moveCircleCenter(shape, newPosition)
      }
      break
      
    case 'line':
      shape = moveLineEndpoint(shape, handleType, newPosition)
      break
  }
  
  // Apply resize constraints
  shape = enforceShapeConstraints(shape)
  updateGeometryStore.updateShape(shape.id, shape)
}
```

### ⌨️ Keyboard Shortcuts & Modifiers

```typescript
// Drawing constraints
const MODIFIER_KEYS = {
  SHIFT: 'proportional-constraint',     // Square from rectangle, snap angles
  CTRL: 'precision-mode',               // Disable snapping temporarily
  ALT: 'center-origin',                 // Draw from center instead of corner
  SPACE: 'pan-mode'                     // Temporarily switch to pan mode
}

// Shape operations
const SHORTCUTS = {
  DELETE: 'delete-selected-shapes',
  ESCAPE: 'cancel-current-operation',
  ENTER: 'confirm-current-operation',
  TAB: 'cycle-through-shapes',
  'CTRL+A': 'select-all-shapes',
  'CTRL+D': 'duplicate-selected-shapes',
  'CTRL+Z': 'undo-last-action',
  'CTRL+Y': 'redo-last-action'
}
```

### 📏 Shape Regulation Parameters

```typescript
// Add to GeometryState settings
export interface GeometrySettings {
  // Snapping
  snapToGrid: boolean
  gridSnapSize: number                  // Pixeloids
  snapToAngles: boolean
  angleSnapIncrement: number            // Degrees
  
  // Size constraints
  minRectangleSize: { width: number, height: number }
  maxRectangleSize: { width: number, height: number }
  minCircleRadius: number
  maxCircleRadius: number
  minLineLength: number
  maxLineLength: number
  
  // Drawing behavior
  previewOpacity: number                // 0.0 - 1.0
  previewColor: number                  // Hex color
  selectionColor: number                // Hex color
  handleSize: number                    // Pixeloids
  
  // Performance
  maxShapesPerLayer: number
  enableRealTimePreview: boolean
  
  // Validation
  preventShapeOverlap: boolean
  preventCanvasBounds: boolean
}
```

### 🔄 State Machine for Drawing

```typescript
type DrawingState = 
  | 'idle'                              // No active drawing
  | 'drawing-preview'                   // Drag in progress, showing preview
  | 'shape-selected'                    // Existing shape selected
  | 'handle-dragging'                   // Resizing/moving selected shape
  | 'multi-selection'                   // Multiple shapes selected
  | 'polygon-building'                  // Special state for polygon multi-click

interface DrawingContext {
  state: DrawingState
  activeShape: GeometricShape | null
  selectedShapes: Set<string>
  previewData: any
  dragStartPosition: PixeloidCoordinate | null
  activeHandle: HandleType | null
}

// State transitions
function handleDrawingInput(context: DrawingContext, event: InputEvent) {
  switch (context.state) {
    case 'idle':
      if (event.type === 'mousedown') {
        if (event.target === 'empty-space') {
          return startDrawing(context, event)
        } else if (event.target === 'existing-shape') {
          return selectShape(context, event)
        }
      }
      break
      
    case 'drawing-preview':
      if (event.type === 'mousemove') {
        return updatePreview(context, event)
      } else if (event.type === 'mouseup') {
        return finishDrawing(context, event)
      }
      break
      
    // ... other states
  }
}
```

### 🎨 Visual Feedback System

```typescript
// Preview rendering during drawing
function renderDrawingPreview(context: DrawingContext) {
  if (context.state === 'drawing-preview') {
    const previewGraphics = new Graphics()
    previewGraphics.alpha = gameStore.geometry.settings.previewOpacity
    
    switch (gameStore.geometry.drawing.mode) {
      case 'rectangle':
        previewGraphics.rect(...)
        previewGraphics.stroke({ 
          width: 2, 
          color: gameStore.geometry.settings.previewColor,
          style: 'dashed'
        })
        break
        
      case 'circle':
        previewGraphics.circle(...)
        previewGraphics.stroke({ 
          width: 2, 
          color: gameStore.geometry.settings.previewColor,
          style: 'dashed'
        })
        break
    }
    
    // Add dimension labels
    renderDimensionLabels(previewGraphics, context.previewData)
  }
}

// Snap indicators
function renderSnapIndicators(snapPoint: PixeloidCoordinate) {
  const indicator = new Graphics()
  indicator.circle(snapPoint.x, snapPoint.y, 4)
  indicator.fill(0x00ff00)  // Green snap indicator
  
  // Show snap distance
  const label = new Text(`(${snapPoint.x}, ${snapPoint.y})`, {
    fontSize: 12,
    fill: 0x00ff00
  })
  label.position.set(snapPoint.x + 10, snapPoint.y - 10)
  
  return { indicator, label }
}
```

This UX design ensures:
1. **Single-action drawing** for all basic shapes (rectangles, circles, lines, points)
2. **Multi-click reserved** only for polygons
3. **Rich visual feedback** during all operations
4. **Flexible constraints** and regulation systems
5. **Intuitive manipulation** of existing shapes
6. **Keyboard shortcuts** for power users
7. **Clear state management** for complex interactions