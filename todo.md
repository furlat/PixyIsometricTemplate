# PixyIsometric Template - System Development Roadmap

## 1. Raycast System & Layer-Based Rendering Architecture

### PROBLEM: Current single-layer rendering limitation
**Current State**: The `InfiniteCanvas.ts` renders only a checkered grid background directly to PixiJS Graphics. Everything is drawn in a single layer, making it impossible to separate concerns (background vs interactive objects vs UI).

**Why We Need This**:
- Separate visual concerns (grid background, user drawings, isometric assets, debug UI)
- Enable ray-based interaction for game mechanics (line of sight, collision detection)
- Allow independent optimization/culling per layer
- Support different rendering styles per layer type

### 1.1 Multi-Layer Rendering Pipeline Integration

**Using PixiJS RenderLayer for layer management** (following [PixiJS RenderLayer example](https://pixijs.com/8.x/examples/render-layers)):

```typescript
// Current: InfiniteCanvas directly manages one Graphics object
this.gridGraphics.clear()
this.gridGraphics.rect(x, y, 1, 1).fill(color)

// New: InfiniteCanvas becomes a layer manager using PixiJS RenderLayer
class LayeredInfiniteCanvas extends InfiniteCanvas {
  private backgroundLayer: RenderLayer       // Grid background
  private geometryLayer: RenderLayer         // User-drawn shapes
  private isometricGridLayer: RenderLayer    // Diamond grid visualization
  private assetLayer: RenderLayer            // Isometric game assets
  private uiOverlayLayer: RenderLayer        // Debug visualizations
  
  constructor() {
    super()
    // Create PixiJS RenderLayers for proper layering
    this.backgroundLayer = new RenderLayer()
    this.geometryLayer = new RenderLayer()
    this.isometricGridLayer = new RenderLayer()
    this.assetLayer = new RenderLayer()
    this.uiOverlayLayer = new RenderLayer()
    
    // Add layers to stage in correct order (bottom to top)
    this.stage.addChild(this.backgroundLayer)
    this.stage.addChild(this.geometryLayer)
    this.stage.addChild(this.isometricGridLayer)
    this.stage.addChild(this.assetLayer)
    this.stage.addChild(this.uiOverlayLayer)
  }
  
  render() {
    // Layers render automatically in order
    // Individual layer content managed by respective systems
  }
}
```

**What each layer does** (bottom to top rendering order):
- **BackgroundLayer**: Current checkered grid (moves from InfiniteCanvas.renderGrid)
- **GeometryLayer**: User-drawn rectangles, polygons, custom shapes
- **IsometricGridLayer**: Diamond grid visualization, grid lines, coordinate helpers
- **AssetLayer**: Isometric assets positioned on diamond grid
- **UIOverlayLayer**: Raycast visualizations, selection highlights, debug info

**Integration with existing systems**:
- Uses current `CoordinateHelper` for all coordinate transformations
- Leverages existing `camera.viewportCorners` from gameStore for culling
- Maintains current pixeloid coordinate system throughout
- Each layer uses same `cameraTransform` positioning as current system

### 1.2 Bresenham Line Algorithm for Pixeloid Raycasting

**Problem**: Need fast, pixel-perfect line traversal for game mechanics (line of sight, collision detection, path finding).

**Why Bresenham specifically**:
- Integer-only arithmetic (perfect for pixeloid grid)
- Guarantees single-pixel-wide lines without gaps
- Extremely fast - no floating point calculations
- Naturally fits our integer pixeloid coordinate system

**Integration with current coordinate system**:
```typescript
// Leverages existing CoordinateHelper transformations
class RaycastEngine {
  castRay(screenStart: Point, screenEnd: Point): RaycastResult {
    // Use existing coordinate transformation
    const pixeloidStart = CoordinateHelper.screenToPixeloid(
      screenStart.x, screenStart.y,
      this.camera.position, this.viewportSize, this.camera.pixeloidScale
    )
    const pixeloidEnd = CoordinateHelper.screenToPixeloid(
      screenEnd.x, screenEnd.y,
      this.camera.position, this.viewportSize, this.camera.pixeloidScale
    )
    
    // Bresenham line algorithm
    const rayPixeloids = this.bresenhamLine(pixeloidStart, pixeloidEnd)
    
    // Check intersections using spatial index
    const intersections = this.findIntersections(rayPixeloids)
    return new RaycastResult(rayPixeloids, intersections)
  }
  
  private bresenhamLine(start: PixeloidCoordinate, end: PixeloidCoordinate): PixeloidCoordinate[] {
    // Classic Bresenham algorithm - integer arithmetic only
    const dx = Math.abs(end.x - start.x)
    const dy = Math.abs(end.y - start.y)
    // ... implementation ensures each pixeloid is visited exactly once
  }
}
```

**How it connects to current mouse tracking**:
- Uses existing `gameStore.mousePixeloidPosition` as ray target
- Ray source set by left-click, stored in new geometry store section
- Updates happen in real-time using current mouse update mechanism

### 1.3 Geometry UI Component Integration

**Integration with current UI system**:
```typescript
// Extends current UIControlBar pattern
class GeometryPanel {
  // Follows same pattern as StorePanel.toggle()
  public toggle(): void { /* ... */ }
  public getVisible(): boolean { /* ... */ }
}

// Added to existing UIControlBar.ts
uiControlBar.registerGeometryPanel(geometryPanel)

// HTML follows same pattern as store panel button
<button id="toggle-geometry-panel" class="btn btn-sm btn-primary rounded-full">
  <span class="button-text">Geometry</span>
</button>
```

**How modes interact with existing input**:
- **RAYCAST_MODE**: Left click sets ray source, uses existing mouse tracking for target
- **RECTANGLE_MODE**: Click-drag using existing mouse position tracking
- **POLYGON_MODE**: Sequential clicks using existing click handling

**Store integration**:
```typescript
// Extends existing gameStore pattern
export const geometryStore = proxy({
  mode: 'RAYCAST', // Current drawing mode
  activeRay: null,  // Current raycast result
  shapes: new Map(), // Drawn geometric shapes
  selectedShape: null
})

// Follows existing updateGameStore pattern
export const updateGeometryStore = {
  setMode: (mode: GeometryMode) => { geometryStore.mode = mode },
  setActiveRay: (ray: RaycastResult) => { geometryStore.activeRay = ray }
}
```

## 2. Geometric Shape System & Spatial Indexing

### PROBLEM: Need fast object lookup for ray intersection
**Current State**: Mouse highlighting uses brute-force grid iteration in `InfiniteCanvas.renderGrid()`. No way to store or query custom objects.

**Why We Need This**:
- Store user-drawn shapes persistently
- Fast intersection testing for raycasts (can't check every pixel)
- Enable selection, editing, deletion of drawn objects
- Support complex game objects (buildings, walls, etc.)

### 2.1 Shape Storage & Management

**Integration with existing coordinate system**:
```typescript
// All shapes use existing PixeloidCoordinate type
interface GeometricShape {
  id: string
  type: 'RECTANGLE' | 'CIRCLE' | 'POLYGON'
  vertices: PixeloidCoordinate[]  // Uses existing coordinate type
  boundingBox: {
    topLeft: PixeloidCoordinate,
    bottomRight: PixeloidCoordinate
  }
}

// Stored in extended gameStore
geometryStore.shapes = new Map<string, GeometricShape>()
```

**How it fits with current rendering** (following [PixiJS Graphics examples](https://pixijs.com/8.x/examples/graphics)):
- Shapes rendered using PixiJS Graphics API: `graphics.rect()`, `graphics.circle()`, `graphics.poly()`
- Uses same `cameraTransform` and viewport culling as existing system
- Leverages existing coordinate transformation helpers

```typescript
// Shape rendering using PixiJS Graphics API
class GeometryRenderer {
  private graphics: Graphics = new Graphics()
  
  renderRectangle(shape: RectangleShape) {
    this.graphics.rect(
      shape.topLeft.x,
      shape.topLeft.y,
      shape.width,
      shape.height
    )
    this.graphics.fill(shape.color)
    this.graphics.stroke({ width: 2, color: shape.borderColor })
  }
  
  renderCircle(shape: CircleShape) {
    this.graphics.circle(shape.center.x, shape.center.y, shape.radius)
    this.graphics.fill(shape.color)
    this.graphics.stroke({ width: 2, color: shape.borderColor })
  }
  
  renderPolygon(shape: PolygonShape) {
    // Convert PixeloidCoordinates to flat array for PixiJS
    const path = shape.vertices.flatMap(v => [v.x, v.y])
    this.graphics.poly(path)
    this.graphics.fill(shape.color)
    this.graphics.stroke({ width: 2, color: shape.borderColor })
  }
}
```

### 2.2 Hybrid Collision: GPU Bounding Boxes + Spatial Indexing

**Problem**: Need fast collision detection for game interactions but also pixel-perfect precision when needed.

**Hybrid Solution**:
1. **GPU-Optimized PixiJS Collision**: Fast bounding box collision using PixiJS sprites/containers
2. **Spatial Index + O(1) Lookup**: Each bounding box contains object key for instant data retrieval
3. **CPU Raycast System**: Pixel-perfect collision for precise interactions

**Why this hybrid approach**:
- PixiJS bounding box collision runs on GPU - extremely fast for general collision
- Each collision proxy contains object ID for O(1) storage lookup
- Spatial indexing maintained for coordinate-based queries
- Bresenham raycast provides pixel-perfect accuracy when needed

#### 2.2.1 PixiJS AABB Collision with Shape Storage

**Simple PixiJS collision approach** (following [PixiJS collision example](https://pixijs.com/8.x/examples/collision-detection)):

```typescript
class HybridCollisionManager {
  // Shape storage for O(1) lookup by ID
  private shapes: Map<string, GeometricShape> = new Map()
  // PixiJS sprites for each shape (for GPU collision)
  private shapeSprites: Map<string, Sprite> = new Map()
  // Spatial index for coordinate queries
  private spatialIndex: Map<string, Set<string>> = new Map()
  
  addShape(shape: GeometricShape) {
    // Store shape data
    this.shapes.set(shape.id, shape)
    this.indexShapeCoordinates(shape)
    
    // Create PixiJS sprite for collision detection
    const sprite = new Sprite(Texture.WHITE)
    sprite.position.set(shape.boundingBox.topLeft.x, shape.boundingBox.topLeft.y)
    sprite.width = shape.boundingBox.width
    sprite.height = shape.boundingBox.height
    sprite.tint = shape.color
    
    // Embed shape ID directly in sprite for O(1 lookup
    sprite.shapeId = shape.id  // Custom property for instant retrieval
    
    this.shapeSprites.set(shape.id, sprite)
    this.geometryLayer.addChild(sprite)
  }
  
  // Simple AABB collision test (from PixiJS example)
  testForAABB(sprite1: Sprite, sprite2: Sprite): boolean {
    const bounds1 = sprite1.getBounds()
    const bounds2 = sprite2.getBounds()
    
    return (
      bounds1.x < bounds2.x + bounds2.width &&
      bounds1.x + bounds1.width > bounds2.x &&
      bounds1.y < bounds2.y + bounds2.height &&
      bounds1.y + bounds1.height > bounds2.y
    )
  }
  
  // Find shape at point using collision detection
  getShapeAtPoint(x: number, y: number): GeometricShape | null {
    // Create temporary point sprite for collision test
    const testPoint = new Sprite(Texture.WHITE)
    testPoint.position.set(x, y)
    testPoint.width = 1
    testPoint.height = 1
    
    // Test collision against all shape sprites
    for (const [shapeId, sprite] of this.shapeSprites) {
      if (this.testForAABB(testPoint, sprite)) {
        // O(1) lookup using embedded ID
        return this.shapes.get(sprite.shapeId) || null
      }
    }
    
    return null
  }
  
  // Spatial index for raycast coordinate queries
  getShapesAtPixeloid(coord: PixeloidCoordinate): Set<string> {
    const key = `${coord.x},${coord.y}`
    return this.spatialIndex.get(key) || new Set()
  }
}
```

#### 2.2.2 Integration with Raycast System

**When to use each collision method**:
```typescript
class CollisionCoordinator {
  // Fast GPU collision for general interactions
  handleMouseClick(screenX: number, screenY: number) {
    const hitShape = this.hybridCollision.getShapeAtScreenPoint(screenX, screenY)
    if (hitShape) {
      // Instant response using GPU collision
      this.selectShape(hitShape)
    }
  }
  
  // Pixel-perfect raycast for precise line-of-sight
  castPrecisionRay(start: PixeloidCoordinate, end: PixeloidCoordinate) {
    const rayPixeloids = this.bresenhamLine(start, end)
    const intersections = []
    
    for (const pixeloid of rayPixeloids) {
      // Use spatial index for coordinate queries
      const shapeIds = this.hybridCollision.getShapesAtPixeloid(pixeloid)
      for (const shapeId of shapeIds) {
        // O(1) lookup using stored shape ID
        const shape = this.hybridCollision.shapes.get(shapeId)
        if (shape && this.pixelPerfectIntersection(pixeloid, shape)) {
          intersections.push({ pixeloid, shape })
        }
      }
    }
    
    return intersections
  }
}
```

#### 2.2.3 Performance Benefits

**GPU Collision Advantages**:
- Hardware-accelerated bounding box tests
- Automatic viewport culling by PixiJS
- No CPU overhead for general mouse interactions
- Built-in event system integration

**Storage Lookup Optimization**:
- O(1) retrieval using shape ID from collision proxy
- No iteration through collision results
- Instant access to full shape data when GPU returns hit
- Maintains spatial indexing for coordinate-based queries

**Hybrid Usage Pattern**:
- **Mouse clicks/hovers**: GPU bounding box collision
- **Line-of-sight/pathfinding**: CPU raycast with spatial index
- **Shape selection**: GPU collision → O(1) storage lookup
- **Precise interactions**: Raycast → spatial index → O(1) storage lookup

### 2.3 Shape Creation & Validation

**Integration with current input system**:
```typescript
// Uses existing InputManager pattern
class GeometryInputHandler {
  handleMouseClick(event: MouseEvent) {
    // Uses existing screen-to-pixeloid conversion
    const pixeloidPos = CoordinateHelper.screenToPixeloid(
      event.clientX, event.clientY,
      this.camera.position, this.viewportSize, this.camera.pixeloidScale
    )
    
    switch (geometryStore.mode) {
      case 'RECTANGLE':
        if (!this.startCorner) {
          this.startCorner = pixeloidPos
        } else {
          const rectangle = this.createRectangle(this.startCorner, pixeloidPos)
          updateGeometryStore.addShape(rectangle)
          this.startCorner = null
        }
        break
    }
  }
}
```

**Shape validation for clean geometry**:
- **Rectangle validation**: Ensure min/max coordinates, non-zero area
- **Polygon validation**: Check for self-intersections using line segment intersection tests
- **Vertex ordering**: Ensure consistent clockwise/counterclockwise ordering for polygon algorithms

## 3. Isometric Diamond Grid System with Z-Layers

### PROBLEM: Need precise asset positioning for isometric games
**Current State**: Only pixeloid grid exists. No way to position isometric assets with proper depth, walkability, or game logic.

**Why Diamond Grid specifically**:
- Isometric assets naturally align to diamond patterns
- Your asset metadata already contains diamond positioning data
- Allows proper depth sorting (z-layers)
- Supports game mechanics (walkability, line of sight, collision)

### 3.1 Diamond Grid Architecture Based on Asset Analysis

**What the asset metadata tells us**:
Looking at `Stairs_L_01_analysis_w.json`, each asset defines:
- **Primary diamonds**: Main positioning anchors with north/south/east/west vertices
- **Sub-diamonds**: Quadrant subdivisions (north, south, east, west) for fine detail
- **Z-offsets**: Height information for proper depth sorting
- **Edge properties**: Walkability and line-of-sight data for game mechanics
- **Extra diamonds**: Multi-diamond assets (stairs spanning multiple positions)

**Integration with existing coordinate system**:
```typescript
// Diamond coordinates mapped to pixeloid space
interface DiamondCoordinate {
  x: number  // Diamond grid x
  y: number  // Diamond grid y
  z: number  // Z-layer
}

class DiamondGrid {
  // Converts diamond coords to pixeloid using existing CoordinateHelper
  diamondToPixeloid(diamondCoord: DiamondCoordinate): PixeloidCoordinate {
    // Diamond grid uses isometric projection
    const pixeloidX = (diamondCoord.x - diamondCoord.y) * DIAMOND_WIDTH_HALF
    const pixeloidY = (diamondCoord.x + diamondCoord.y) * DIAMOND_HEIGHT_HALF
    return { x: pixeloidX, y: pixeloidY }
  }
  
  // Uses existing viewport culling from InfiniteCanvas
  getVisibleDiamonds(camera: CameraState): DiamondCoordinate[] {
    const corners = camera.viewportCorners
    // Convert pixeloid viewport to diamond coordinate range
    const diamondBounds = this.pixeloidToDiamondBounds(corners)
    return this.getDiamondsInBounds(diamondBounds)
  }
}
```

### 3.2 Z-Layer Management Integration

**Problem**: Isometric games need proper depth sorting and layer management.

**Integration with separated grid and asset layers**:
```typescript
// Isometric Grid Layer - handles diamond grid visualization
class IsometricGridLayer {
  private gridGraphics: Graphics = new Graphics()
  
  render(cameraTransform: Container, viewportSize: Size) {
    this.gridGraphics.clear()
    
    // Render diamond grid lines and coordinate helpers
    const visibleDiamonds = this.diamondGrid.getVisibleDiamonds(this.camera)
    for (const diamond of visibleDiamonds) {
      this.renderDiamondGridCell(diamond)
    }
    
    // Render grid coordinate labels, diamond outlines
    this.renderGridHelpers(visibleDiamonds)
  }
  
  private renderDiamondGridCell(diamond: DiamondCoordinate) {
    const pixeloidPos = this.diamondGrid.diamondToPixeloid(diamond)
    // Draw diamond outline using Graphics API
    this.gridGraphics.moveTo(pixeloidPos.x, pixeloidPos.y - DIAMOND_HEIGHT_HALF)
    this.gridGraphics.lineTo(pixeloidPos.x + DIAMOND_WIDTH_HALF, pixeloidPos.y)
    this.gridGraphics.lineTo(pixeloidPos.x, pixeloidPos.y + DIAMOND_HEIGHT_HALF)
    this.gridGraphics.lineTo(pixeloidPos.x - DIAMOND_WIDTH_HALF, pixeloidPos.y)
    this.gridGraphics.lineTo(pixeloidPos.x, pixeloidPos.y - DIAMOND_HEIGHT_HALF)
    this.gridGraphics.stroke({ width: 1, color: 0x444444, alpha: 0.3 })
  }
}

// Asset Layer - handles actual isometric game assets
class AssetLayer {
  render(cameraTransform: Container, viewportSize: Size) {
    // Use existing camera transform
    this.container.transform = cameraTransform
    
    // Get placed assets in visible area
    const visibleAssets = this.getVisibleAssets(this.camera)
    
    // Render by Z-order for proper depth sorting
    const sortedAssets = this.getSortedAssetsByDepth(visibleAssets)
    for (const asset of sortedAssets) {
      this.renderAsset(asset)
    }
  }
}
```

**Store integration**:
```typescript
// Extends existing gameStore pattern
export const diamondStore = proxy({
  currentZLayer: 0,
  visibleLayers: new Set([0, 1, 2]),
  placedAssets: new Map<string, AssetPlacement>(),
  selectedDiamond: null
})

export const updateDiamondStore = {
  setCurrentZLayer: (z: number) => { diamondStore.currentZLayer = z },
  addVisibleLayer: (z: number) => { diamondStore.visibleLayers.add(z) }
}
```

### 3.3 Asset Positioning Using Metadata

**How asset analysis data integrates**:
The `diamond_info` in your asset files provides:
- **Vertex positions**: Exact pixeloid coordinates for diamond corners
- **Sub-diamond data**: Detailed collision/walkability per quadrant
- **Z-offset information**: Proper height layering
- **Edge properties**: Game mechanic data (blocks_movement, blocks_line_of_sight, z_portal)

**Implementation integration**:
```typescript
class AssetPositioningSystem {
  positionAsset(assetId: string, diamondCoord: DiamondCoordinate) {
    // Load asset metadata (your existing JSON files)
    const metadata = await fetch(`/assets/analysis_data/${assetId}_analysis.json`)
    const analysis = await metadata.json()
    
    // Convert diamond coordinate to pixeloid using existing helpers
    const pixeloidPosition = this.diamondGrid.diamondToPixeloid(diamondCoord)
    
    // Create PixiJS sprite at calculated position
    const sprite = new Sprite(assetTexture)
    sprite.position.set(pixeloidPosition.x, pixeloidPosition.y)
    
    // Store placement data for game mechanics
    const placement = {
      assetId,
      diamondCoord,
      pixeloidPosition,
      walkabilityData: analysis.diamond_info.sub_diamonds,
      zOffset: analysis.diamond_info.diamonds_z_offset
    }
    
    updateDiamondStore.addAssetPlacement(placement)
  }
}
```

### 3.4 Performance Optimization Integration

**Viewport culling using existing system**:
```typescript
// Leverages existing InfiniteCanvas viewport calculation
class DiamondGridOptimizer {
  cullDiamondsOutsideViewport(): Set<DiamondCoordinate> {
    // Use existing viewport corners from gameStore
    const corners = gameStore.camera.viewportCorners
    
    // Convert to diamond coordinate bounds
    const diamondBounds = this.pixeloidToDiamondBounds(corners)
    
    // Only process diamonds in visible area
    const visibleDiamonds = new Set<DiamondCoordinate>()
    for (let x = diamondBounds.minX; x <= diamondBounds.maxX; x++) {
      for (let y = diamondBounds.minY; y <= diamondBounds.maxY; y++) {
        for (const z of diamondStore.visibleLayers) {
          visibleDiamonds.add({ x, y, z })
        }
      }
    }
    
    return visibleDiamonds
  }
}
```

## 4. System Integration with Current Architecture

### 4.1 Game Engine Integration

**How it fits with current Game.ts**:
```typescript
// Extends existing Game class
export class Game {
  private infiniteCanvas: LayeredInfiniteCanvas  // Upgraded from InfiniteCanvas
  private raycastEngine: RaycastEngine          // New system
  private geometryManager: GeometryManager      // New system
  private diamondGrid: DiamondGridManager       // New system
  
  async init(canvas: HTMLCanvasElement) {
    // Existing initialization...
    await super.init(canvas)
    
    // Initialize new systems
    this.raycastEngine = new RaycastEngine()
    this.geometryManager = new GeometryManager()
    this.diamondGrid = new DiamondGridManager()
    
    // Connect systems
    this.geometryManager.setRaycastEngine(this.raycastEngine)
    this.diamondGrid.setViewportProvider(() => gameStore.camera.viewportCorners)
  }
  
  private update(ticker: any) {
    // Existing camera update...
    this.infiniteCanvas.updateCamera(deltaTime)
    
    // New system updates
    this.raycastEngine.updateActiveRays()
    this.geometryManager.updateShapes()
    this.diamondGrid.updateVisibleAssets()
    
    // Existing rendering...
    this.infiniteCanvas.render()
  }
}
```

### 4.2 Store Integration Strategy

**Extending existing gameStore pattern**:
```typescript
// New store sections following existing patterns
import { proxy } from 'valtio'
import type { GeometricShape, RaycastResult, AssetPlacement } from '../types'

export const geometryStore = proxy({
  // Drawing state
  mode: 'RAYCAST' as GeometryMode,
  shapes: new Map<string, GeometricShape>(),
  selectedShapeId: null as string | null,
  
  // Raycast state
  raycastSource: null as PixeloidCoordinate | null,
  activeRay: null as RaycastResult | null,
  
  // UI state
  isVisible: true
})

export const diamondStore = proxy({
  // Layer management
  currentZLayer: 0,
  visibleLayers: new Set([0]),
  
  // Asset placement
  placedAssets: new Map<string, AssetPlacement>(),
  selectedAsset: null as string | null,
  
  // UI state
  isVisible: true
})

// Update functions following existing pattern
export const updateGeometryStore = {
  setMode: (mode: GeometryMode) => { geometryStore.mode = mode },
  addShape: (shape: GeometricShape) => {
    geometryStore.shapes.set(shape.id, shape)
  },
  setRaycastSource: (coord: PixeloidCoordinate) => {
    geometryStore.raycastSource = coord
  }
}

export const updateDiamondStore = {
  setCurrentZLayer: (z: number) => { diamondStore.currentZLayer = z },
  addAssetPlacement: (placement: AssetPlacement) => {
    diamondStore.placedAssets.set(placement.id, placement)
  }
}
```

### 4.3 UI Integration with Existing System

**Following current UIControlBar pattern**:
```typescript
// Extends existing UIControlBar.ts
class UIControlBar {
  private geometryPanel: GeometryPanel
  private diamondPanel: DiamondPanel
  
  constructor() {
    // Existing initialization...
    this.geometryPanel = new GeometryPanel()
    this.diamondPanel = new DiamondPanel()
  }
  
  registerGeometryPanel(panel: GeometryPanel) {
    this.geometryPanel = panel
    this.updateGeometryButton()
  }
  
  registerDiamondPanel(panel: DiamondPanel) {
    this.diamondPanel = panel
    this.updateDiamondButton()
  }
}
```

**HTML following existing button pattern**:
```html
<!-- Extends existing control bar -->
<div id="ui-control-bar" class="...">
  <div class="flex items-center gap-3">
    <!-- Existing store button -->
    <button id="toggle-store-panel" class="btn btn-sm btn-primary rounded-full">
      <span class="button-text">Store</span>
    </button>
    
    <!-- New geometry button -->
    <button id="toggle-geometry-panel" class="btn btn-sm btn-secondary rounded-full">
      <span class="button-text">Geometry</span>
    </button>
    
    <!-- New diamond button -->
    <button id="toggle-diamond-panel" class="btn btn-sm btn-accent rounded-full">
      <span class="button-text">Assets</span>
    </button>
  </div>
</div>
```

## 🎲 3D Dice Integration System

### Overview
Integration of 3D dice rolling mechanics using Three.js alongside our PixiJS 2D isometric template. This system will provide realistic 3D dice physics while maintaining seamless integration with the existing 2D game interface.

### Core Integration: dice-box-threejs
**Library**: [dice-box-threejs](https://github.com/3d-dice/dice-box-threejs)
- **Purpose**: Provides realistic 3D dice physics and rendering
- **Integration Challenge**: Requires mixing Three.js 3D rendering with our existing PixiJS 2D system
- **Solution**: Use PixiJS/Three.js dual-renderer approach

### Technical Architecture

#### Dual Renderer Setup
Following the [PixiJS + Three.js mixing guide](https://pixijs.com/8.x/guides/third-party/mixing-three-and-pixi):

```javascript
// PixiJS renderer creates WebGL context (renders FIRST - background layer)
const pixiRenderer = new PIXI.WebGLRenderer();
await pixiRenderer.init({
  antialias: true,
  stencil: true, // Required for masks
  width: WIDTH,
  height: HEIGHT
});
document.body.appendChild(pixiRenderer.view);

// Three.js renderer shares PixiJS context (renders SECOND - overlay on top)
const threeRenderer = new THREE.WebGLRenderer({
  context: pixiRenderer.gl, // Share PixiJS WebGL context
  antialias: true
});
threeRenderer.setSize(WIDTH, HEIGHT);
threeRenderer.setClearColor(0x000000, 0); // Transparent background
```

#### Rendering Order (PixiJS BELOW, Three.js ABOVE)
1. **PixiJS Layer (Background)**: Existing isometric game interface, UI panels, grid
2. **Three.js Layer (Overlay)**: 3D dice physics and rendering ON TOP (only during dice roll)

#### Integration with Current Systems

##### With InfiniteCanvas.ts
- **No Modification**: `InfiniteCanvas` continues as primary 2D renderer (background layer)
- **Coordination**: Three.js overlay appears only during dice roll animations
- **Viewport**: Three.js camera positioned to not obstruct critical UI elements

##### With gameStore.ts
- **New State**: Add `diceRolling`, `diceResults`, `diceAnimationActive` to game store
- **Integration**: Dice results trigger existing game logic through Valtio reactivity
- **Consistency**: Follow existing `updateGameStore` patterns for dice state updates

##### With CoordinateHelper.ts
- **3D to 2D Mapping**: Convert 3D dice final positions to pixeloid coordinates
- **Camera Sync**: Ensure Three.js camera transforms align with PixiJS viewport
- **Interaction**: Map 2D mouse interactions to 3D dice trigger zones

### Implementation Phases

#### Phase 1: Basic Three.js Integration
1. **Setup**: Initialize dual renderer system following PixiJS guide
2. **Context Sharing**: Establish shared WebGL context between renderers
3. **Render Loop**: Implement state management with `resetState()` calls
4. **Verification**: Ensure existing PixiJS interface renders correctly over Three.js background

#### Phase 2: dice-box-threejs Integration
1. **Library Setup**: Install and configure dice-box-threejs package
2. **Dice Scene**: Create Three.js scene dedicated to dice physics
3. **Physics Setup**: Configure realistic dice rolling physics engine
4. **Basic Rolling**: Implement simple dice roll with results capture

#### Phase 3: Game Logic Integration
1. **State Binding**: Connect dice results to existing Valtio game store
2. **Trigger Points**: Add dice roll buttons to existing UIControlBar
3. **Animation Coordination**: Prevent game interactions during dice animation
4. **Result Processing**: Parse dice results into game-meaningful data

#### Phase 4: Advanced Features
1. **Multiple Dice Types**: Support d4, d6, d8, d10, d12, d20 from dice-box
2. **Custom Dice**: Integrate custom textures matching game theme
3. **Sound Integration**: Add dice rolling sound effects coordination
4. **Performance Optimization**: Efficient resource management between renderers

### Technical Considerations

#### Performance Management
- **Shared Context**: Single WebGL context prevents context switching overhead
- **Render Culling**: Only render dice when rolling animation active
- **Memory**: Separate resource management for 3D dice vs 2D assets
- **Frame Rate**: Coordinate render loops to maintain 60fps across both systems

#### Integration Challenges
- **Camera Synchronization**: Three.js perspective camera vs PixiJS orthographic projection
- **Coordinate Mapping**: 3D world space to 2D pixeloid coordinate conversion
- **Event Handling**: Route mouse/touch events appropriately between renderers
- **State Management**: Maintain single source of truth in Valtio store

#### Compatibility Notes
- **WebGL Context**: Ensure stencil buffer enabled for PixiJS masks
- **Dimension Sync**: Keep both renderers at identical resolution
- **Clear Management**: Prevent PixiJS from clearing Three.js rendered content
- **Resource Isolation**: PixiJS textures cannot be directly used as Three.js textures

### Example Integration Structure

```javascript
// Enhanced game loop with dual rendering (PixiJS BELOW, Three.js ABOVE)
function renderLoop() {
  // Render PixiJS FIRST (background layer)
  pixiRenderer.resetState();
  pixiRenderer.render({ container: stage }); // Existing PixiJS game interface
  
  // Render Three.js SECOND (overlay on top - only during rolls)
  if (gameStore.diceAnimationActive) {
    threeRenderer.resetState();
    threeRenderer.render(diceScene, diceCamera); // 3D dice rendering ABOVE UI
  }
  
  requestAnimationFrame(renderLoop);
}

// Dice roll integration with game store
async function rollDice(diceType, quantity) {
  gameStore.diceAnimationActive = true;
  const results = await diceBox.roll(`${quantity}${diceType}`);
  gameStore.diceResults = results;
  gameStore.diceAnimationActive = false;
  // Trigger existing game logic with dice results
}
```

### Benefits
- **Enhanced Gameplay**: Realistic 3D dice physics adds tactile game feel
- **Visual Appeal**: 3D dice rolling provides satisfying visual feedback
- **Flexibility**: Can toggle between 2D dice display and 3D rolling mode
- **Scalability**: Foundation for additional 3D game elements if desired
- **Performance**: Shared WebGL context maintains efficient rendering pipeline

This integration expands the template into a hybrid 2D/3D system while maintaining all existing functionality and architectural patterns.

---

## Implementation Priority & Integration Steps

### Phase 1: Layer System Foundation
1. **Extract current grid rendering** from `InfiniteCanvas.renderGrid()` into `BackgroundGridLayer`
2. **Create base `RenderLayer` interface** that all layers implement
3. **Modify `InfiniteCanvas.render()`** to iterate through layers instead of direct rendering
4. **Verify existing functionality unchanged** - grid should look identical

### Phase 2: Basic Raycast Engine
1. **Implement Bresenham line algorithm** using existing `PixeloidCoordinate` type
2. **Add raycast state to gameStore** following existing store patterns
3. **Create `GeometryPanel`** following `StorePanel` pattern
4. **Integrate with existing mouse tracking** from `InputManager`
5. **Add ray visualization** to new `UIOverlayLayer`

### Phase 3: Shape System Foundation
1. **Create basic rectangle shapes** using existing coordinate system
2. **Implement spatial index** for fast shape lookup
3. **Add shape storage to geometryStore** following existing patterns
4. **Create `GeometryLayer`** for shape rendering
5. **Integrate shape-ray intersection** with raycast engine

### Phase 4: Diamond Grid Base
1. **Analyze asset metadata structure** to understand diamond positioning
2. **Create diamond coordinate system** with conversion to existing pixeloids
3. **Implement basic diamond grid rendering** in new `DiamondAssetLayer`
4. **Add diamond state to store** following existing patterns
5. **Create `DiamondPanel`** for layer management

### Phase 5: Asset Positioning
1. **Load asset analysis JSON** files using existing asset loading patterns
2. **Implement asset placement** using diamond metadata
3. **Add Z-layer sorting** for proper isometric depth
4. **Integrate with existing viewport culling** system
5. **Connect walkability data** to navigation systems

### Phase 6: Advanced Features
1. **Complex polygon creation** with vertex validation
2. **Multi-diamond asset support** (stairs, large buildings)
3. **Line-of-sight integration** with raycast system
4. **Performance optimization** with LOD systems
5. **Save/load functionality** for created content

## Technical Integration Notes

### Coordinate System Compatibility
- **All new systems use existing `PixeloidCoordinate` type**
- **Diamond coordinates convert to pixeloids using `CoordinateHelper` patterns**
- **Ray algorithms work in pixeloid space to maintain precision**
- **No changes to existing camera or viewport logic**

### Performance Considerations
- **Spatial indexing prevents O(n) search performance degradation**
- **Layer system allows selective rendering/updates**
- **Viewport culling reuses existing `viewportCorners` calculation**
- **Asset LOD system prevents overload with many placed objects**

### Memory Management
- **Sparse data structures only store occupied grid cells**
- **Shape spatial index only creates entries for occupied pixeloids**
- **Diamond grid only instantiates diamonds with placed assets**
- **Layer dirty flags prevent unnecessary re-rendering**

### Future Extensibility
- **Plugin architecture for custom shape types**
- **Asset metadata format standardized for new isometric assets**
- **Layer system supports future layer types (particles, effects, etc.)**
- **Raycast system supports future game mechanics (AI, pathfinding, etc.)**
## 📚 Additional Resources

- PixiJS v8 Documentation: https://pixijs.com/8.x/
- PixiJS + Three.js Integration Guide: https://pixijs.com/8.x/guides/third-party/mixing-three-and-pixi
- dice-box-threejs Library: https://github.com/3d-dice/dice-box-threejs
- Valtio State Management: https://github.com/pmndrs/valtio
- Bresenham Line Algorithm: https://en.wikipedia.org/wiki/Bresenham%27s_line_algorithm
- Isometric Game Development: https://www.redblobgames.com/grids/hexagons/
- Spatial Data Structures: https://en.wikipedia.org/wiki/Spatial_database