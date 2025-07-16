# OOM Analysis & Camera Viewport Architecture Refactor Plan

## Executive Summary

The pixeloid-based geometry rendering system suffers from **exponential texture memory growth** causing browser crashes. The solution is a **fundamental architectural shift** to a camera viewport system where geometry renders at fixed scale 1 and zoom/pan becomes camera transforms, eliminating O(scale²) memory growth entirely.

## Critical Problem Statement & Architectural Solution

**Root Cause**: Uncapped linear scaling of texture dimensions with pixeloid scale
**Current Impact**: Browser OOM crashes when large objects viewed at high zoom  
**Current Risk**: Single 500×500 pixeloid object at scale 50 = 2.5GB texture memory

**Proposed Solution**: **Camera Viewport Architecture**
- **Geometry Layer**: Always renders at scale 1 (fixed memory footprint)
- **Mirror Layer**: Camera viewport with transforms (instant zoom/pan)
- **WASD Movement**: At zoom 1 moves geometry sampling; at zoom 2+ moves mirror viewport
- **Memory Profile**: O(1) instead of O(scale²)

---

## 1. Current vs Proposed Architecture

### 1.1 Current Pipeline (OOM Problem)

```
User Creates Geometry → Store in Pixeloid Coordinates → Zoom/Pan Events → 
Scale Change → Visibility Culling → Texture Extraction (O(scale²)) → GPU Texture Cache → 
Mirror Layer Rendering → Display
```

**Problem**: Each scale change triggers texture re-generation at new dimensions

### 1.2 Proposed Camera Viewport Pipeline 

```
User Creates Geometry → Store in Pixeloid Coordinates → Render at Scale 1 (Fixed) → 
Camera Movement (Zoom/Pan) → Viewport Extraction → Mirror Layer Transform → Display
```

**Solution**: Geometry renders once at scale 1, camera transforms provide zoom/pan

### 1.3 Critical Code Paths

#### **Step 1: Geometry Creation** 
**Location**: `app/src/store/gameStore.ts:411-470`
```typescript
// Objects stored in pixeloid coordinates with creation scale tracking
const newObject: GeometricObject = {
  id: generateUniqueId(),
  // ... geometry properties in pixeloid units
}

// Scale tracking for zoom limiting
tracking.minCreationScale = Math.min(tracking.minCreationScale, currentScale)
tracking.maxCreationScale = Math.max(tracking.maxCreationScale, currentScale)
```

#### **Step 2: Scale Change & Zoom Limiting**
**Location**: `app/src/store/gameStore.ts:250-311`
```typescript
// Scale span limiting (12x maximum)
const minAllowed = Math.max(1, tracking.maxCreationScale / tracking.SCALE_SPAN_LIMIT) // Line 603
const maxAllowed = Math.min(100, tracking.minCreationScale * tracking.SCALE_SPAN_LIMIT) // Line 604

// SCALE_SPAN_LIMIT = 12 (Line 151)
// BUT: types/index.ts:165 suggests 16x - INCONSISTENCY ISSUE
```

#### **Step 3: Visibility Culling**
**Location**: `app/src/game/GeometryHelper.ts:517-578`
```typescript
static calculateVisibilityState(obj: GeometricObject, pixeloidScale: number): {
  visibility: 'fully-onscreen' | 'partially-onscreen' | 'offscreen'
  onScreenBounds?: BoundingBox
}

// Scale-indexed visibility cache per object
object.visibilityCache.set(pixeloidScale, {
  visibility: calculatedVisibility,
  onScreenBounds: onScreenPortion
})
```

**Partial Culling Mechanisms**:
- **Offscreen culling**: Objects completely outside viewport skipped
- **Partial bounds**: Only visible portion calculated for texture regions
- **Scale-specific caching**: Visibility cached per zoom level
- **❌ NO TEXTURE SIZE LIMITS**: Visible objects can still create massive textures

#### **Step 4: Texture Extraction & Caching** 
**Location**: `app/src/game/MirrorLayerRenderer.ts:186-309`
```typescript
// CRITICAL OOM TRIGGER - Lines 269-270
const textureWidth = Math.ceil((vertexBounds.maxX - vertexBounds.minX) * pixeloidScale)
const textureHeight = Math.ceil((vertexBounds.maxY - vertexBounds.minY) * pixeloidScale)

// Texture creation - NO SIZE LIMITS
const texture = RenderTexture.create({
  width: textureWidth,    // Can be 10,000+ pixels
  height: textureHeight,  // Can be 10,000+ pixels
  resolution: 1,
  scaleMode: 'nearest'
})
```

**Cache Key Strategy**:
```typescript
// Scale-indexed caching - Lines 160-163
private getCacheKey(objectId: string, scale: number): string {
  return `${objectId}_${scale}`
}

// Visual version tracking for cache invalidation
const needsNewTexture = !cache || cache.visualVersion !== visualVersion
```

#### **Step 5: Cache Eviction & Memory Management**
**Location**: `app/src/game/MirrorLayerRenderer.ts:134-181`
```typescript
// Distance-based eviction (async cleanup)
private performDistanceBasedEvictionAsync(currentScale: number): void {
  const scalesToKeep = new Set([
    currentScale,
    currentScale - 1, 
    currentScale + 1
  ])
  
  // Evict scales >2 distance away
  // PROBLEM: Only prevents accumulation, not single-frame OOM
}
```

---

## 2. Memory Footprint Calculations

### 2.1 Texture Memory Formula
```
Memory per texture = width × height × 4 bytes (RGBA)
For scale S and object dimensions (W×H pixeloids):
Memory = (W × S) × (H × S) × 4 = W × H × S² × 4 bytes
```

### 2.2 OOM Scenarios

#### **Scenario A: Small Objects Mass Zoom**
- **Setup**: 1000 objects (2×2 pixeloids) created at scale 1
- **Action**: Zoom to scale 12 (max allowed by span limit)
- **Calculation**: `1000 × (2×12)² × 4 = 1000 × 576 × 4 = 2.3MB`
- **Result**: ✅ **SAFE**

#### **Scenario B: Large Object High Zoom**
- **Setup**: Single rectangle (500×500 pixeloids) at scale 1
- **Action**: Zoom to scale 12  
- **Calculation**: `1 × (500×12)² × 4 = 1 × 36,000,000 = 144MB`
- **Result**: ⚠️ **RISKY** - Single object uses significant memory

#### **Scenario C: Scale Span Bypass (Bug)**
- **Setup**: Bug allows scale 1→100 zoom (bypassing 12x limit)
- **Object**: Medium rectangle (50×50 pixeloids)
- **Calculation**: `1 × (50×100)² × 4 = 100MB per object`
- **With 50 objects**: `50 × 100MB = 5GB`
- **Result**: 💥 **GUARANTEED OOM**

### 2.3 Browser OOM Thresholds
- **Mobile browsers**: 512MB-1GB GPU memory limit
- **Desktop browsers**: 1GB-4GB GPU memory limit  
- **Safe budget**: 512MB total texture memory
- **Critical threshold**: Single texture >100MB very risky

---

## 3. Current Safeguards Analysis

### 3.1 Existing Protections ✅

#### **Scale Span Limiting**
```typescript
// gameStore.ts:151, 603-604
SCALE_SPAN_LIMIT: 12  // Limits zoom range to 12x span
```
- **Protection**: Prevents extreme scale jumps
- **Gap**: Still allows large textures within span

#### **Visibility Culling**
```typescript  
// GeometryHelper.ts:517-578
calculateVisibilityState() // Only renders visible objects
```
- **Protection**: Skips offscreen objects
- **Gap**: On-screen objects can still be massive

#### **Distance-Based Cache Eviction**
```typescript
// MirrorLayerRenderer.ts:134-181  
performDistanceBasedEvictionAsync() // Cleans old scale caches
```
- **Protection**: Prevents cache accumulation
- **Gap**: Doesn't prevent single-frame OOM

#### **Filter Area Limiting** 
```typescript
// PixelateFilterRenderer.ts:101-107
const safeWidth = Math.min(rawWidth, gameStore.windowWidth)
const safeHeight = Math.min(rawHeight, gameStore.windowHeight)
```
- **Protection**: Limits filter processing area
- **Gap**: Only affects filters, not core texture creation

### 3.2 Missing Critical Safeguards ❌

#### **No Texture Dimension Caps**
```typescript
// MirrorLayerRenderer.ts:277-278 - INCORRECT COMMENT
// "No hardcoded texture size limits - the visibility cache system  
// naturally prevents OOM by clipping objects to screen bounds"
```
**Reality**: Visibility clipping ≠ texture size limiting

#### **No Memory Budget Tracking**
- No total GPU memory usage monitoring
- No progressive quality reduction under memory pressure
- No texture streaming/LOD system

#### **No Texture Resolution Limiting**
- Could cap at screen resolution (e.g., 4096×4096)
- Could use lower-resolution textures for extreme scales
- Could implement texture pooling

#### **Scale Span Inconsistency**
```typescript
// types/index.ts:165: Comments suggest 16x span
// gameStore.ts:151: Actual implementation uses 12x
```

---

## 4. Detailed Code Location Reference

### 4.1 Core Pipeline Files

| Component | File | Key Lines | Purpose |
|-----------|------|-----------|---------|
| **Geometry Storage** | `store/gameStore.ts` | 411-470 | Object creation & scale tracking |
| **Scale Management** | `store/gameStore.ts` | 250-311, 594-621 | Zoom limits & span enforcement |
| **Visibility Culling** | `game/GeometryHelper.ts` | 517-578 | Viewport-based object filtering |
| **Texture Extraction** | `game/MirrorLayerRenderer.ts` | 186-309 | **OOM TRIGGER** - Texture creation |
| **Cache Management** | `game/MirrorLayerRenderer.ts` | 134-181 | Scale-based cache eviction |
| **Alternative Extraction** | `game/TextureExtractionRenderer.ts` | 75-110 | Secondary texture creation path |

### 4.2 Critical OOM Code Snippets

#### **Primary OOM Trigger**
**File**: `app/src/game/MirrorLayerRenderer.ts`
```typescript
// Lines 269-270 - UNCAPPED TEXTURE DIMENSIONS
const textureWidth = Math.ceil((vertexBounds.maxX - vertexBounds.minX) * pixeloidScale)
const textureHeight = Math.ceil((vertexBounds.maxY - vertexBounds.minY) * pixeloidScale)

// Lines 283-287 - TEXTURE CREATION WITHOUT LIMITS
const texture = RenderTexture.create({
  width: textureWidth,
  height: textureHeight, 
  resolution: 1,
  scaleMode: 'nearest'
})
```

#### **Secondary OOM Path**
**File**: `app/src/game/TextureExtractionRenderer.ts`
```typescript
// Lines 80-81 - SAME ISSUE
const textureWidth = Math.ceil((bounds.maxX - bounds.minX) * pixeloidScale)
const textureHeight = Math.ceil((bounds.maxY - bounds.minY) * pixeloidScale)
```

#### **Scale Limiting Logic**
**File**: `app/src/store/gameStore.ts`
```typescript
// Lines 603-604 - SPAN ENFORCEMENT
const minAllowed = Math.max(1, tracking.maxCreationScale / tracking.SCALE_SPAN_LIMIT)
const maxAllowed = Math.min(100, tracking.minCreationScale * tracking.SCALE_SPAN_LIMIT)

// Line 151 - ACTUAL LIMIT VALUE
SCALE_SPAN_LIMIT: 12
```

---

## 5. Camera Viewport Architecture Implementation Plan

### 5.1 Core Architecture Changes (Priority 1) 🚨

#### **A. Store State Restructuring**
**Target File**: `store/gameStore.ts:49-63`

**REMOVE Current State**:
```typescript
// DELETE: Lines 52, 57-63 - conflicting coordinate systems
pixeloid_scale: 1,  // DELETE
mesh: {
  vertex_to_pixeloid_offset: createPixeloidCoordinate(0, 0),  // DELETE
  screen_to_vertex_scale: 10                                   // DELETE
}
```

**ADD Camera Viewport State**:
```typescript
camera: {
  viewport_position: createPixeloidCoordinate(0, 0),     // Camera viewport position in pixeloids
  viewport_bounds_pixeloids: { width: 200, height: 200 }, // Fixed geometry layer size
  zoom_factor: 1,                                        // Integer zoom: 1,2,4,8,16,32,64,128
  geometry_layer_scale: 1,                               // Always 1 - geometry never scales
  geometry_layer_offset: createPixeloidCoordinate(0, 0)  // For geometry expansion beyond bounds
}
```

#### **B. Coordinate System Overhaul** 
**Target File**: `game/CoordinateCalculations.ts:47-89`

**REPLACE Offset-Based Conversions**:
```typescript
// NEW: Direct geometry-to-camera mapping (pixeloid = vertex in geometry layer)
static cameraViewportToGeometry(cameraPos: PixeloidCoordinate): PixeloidCoordinate {
  return cameraPos;  // 1:1 mapping in geometry layer
}

// NEW: Camera boundary checking for WASD movement
static checkCameraBounds(
  newCameraPos: PixeloidCoordinate,
  geometryBounds: { width: number, height: number },
  viewportSize: { width: number, height: number },
  zoomFactor: number
): { x: number, y: number, boundaryHit: boolean, expandGeometry: boolean } {
  const maxX = geometryBounds.width - (viewportSize.width / zoomFactor);
  const maxY = geometryBounds.height - (viewportSize.height / zoomFactor);
  
  return {
    x: Math.max(0, Math.min(maxX, newCameraPos.x)),
    y: Math.max(0, Math.min(maxY, newCameraPos.y)),
    boundaryHit: newCameraPos.x < 0 || newCameraPos.x > maxX || newCameraPos.y < 0 || newCameraPos.y > maxY,
    expandGeometry: newCameraPos.x < -50 || newCameraPos.x > maxX + 50 || newCameraPos.y < -50 || newCameraPos.y > maxY + 50
  };
}
```

### 5.2 Rendering Pipeline Changes (Priority 2) 🔧

#### **A. Geometry Layer Fixed Scale**
**Target File**: `game/GeometryRenderer.ts:185-229, 256-408`

**REMOVE Scale-Based Coordinate Conversion**:
```typescript
// REPLACE lines 185-229: Remove convertToVertexCoordinates()
private renderGeometryAtFixedScale(obj: GeometricObject): GeometricObject {
  return obj;  // No conversion - geometry layer is 1:1 pixeloid mapping
}

// REPLACE lines 256-408: Fixed scale rendering
private renderGeometricObjectToGraphics(obj: GeometricObject, graphics: Graphics): void {
  const FIXED_SCALE = 1;  // Geometry layer ALWAYS scale 1
  // Apply FIXED_SCALE to all shape rendering methods
}
```

#### **B. Mirror Layer as Camera Viewport**
**Target File**: `game/MirrorLayerRenderer.ts:268-393`

**ADD Viewport-Based Rendering**:
```typescript
// NEW: Camera viewport extraction and scaling
private renderCameraViewport(
  cameraPos: PixeloidCoordinate, 
  zoomFactor: number,
  geometryContainer: Container
): void {
  // 1. Calculate viewport bounds in pixeloid space
  const viewportBounds = this.calculateViewportBounds(cameraPos, zoomFactor);
  
  // 2. Extract visible geometry within viewport
  const visibleObjects = this.filterObjectsInViewport(viewportBounds);
  
  // 3. Apply camera transform (position + zoom) to mirror layer
  this.container.position.set(-cameraPos.x * zoomFactor, -cameraPos.y * zoomFactor);
  this.container.scale.set(zoomFactor);
}
```

### 5.3 Input & Camera System Changes (Priority 3) 🏗️

#### **A. WASD Camera Movement**
**Target File**: `game/InputManager.ts:622-681`

**REPLACE Movement Logic**:
```typescript
public updateMovement(deltaTime: number): void {
  const moveSpeed = 50; // pixeloids per second
  const deltaX = this.calculateMovementDelta('horizontal', deltaTime, moveSpeed);
  const deltaY = this.calculateMovementDelta('vertical', deltaTime, moveSpeed);
  
  if (deltaX !== 0 || deltaY !== 0) {
    const currentPos = gameStore.camera.viewport_position;
    const newPos = createPixeloidCoordinate(currentPos.x + deltaX, currentPos.y + deltaY);
    
    const boundaryCheck = CoordinateCalculations.checkCameraBounds(newPos, ...);
    
    if (boundaryCheck.expandGeometry) {
      // Beyond geometry bounds: expand geometry layer
      updateGameStore.expandGeometryLayer(newPos);
    } else if (boundaryCheck.boundaryHit) {
      // At geometry edge: normal camera movement with clamping
      updateGameStore.setCameraViewportPosition(createPixeloidCoordinate(boundaryCheck.x, boundaryCheck.y));
    } else {
      // Within bounds: pure camera movement (fast)
      updateGameStore.setCameraViewportPosition(newPos);
    }
  }
}
```

#### **B. Integer Zoom System**
**Target File**: `game/InfiniteCanvas.ts:149-193`

**REPLACE Continuous Zoom**:
```typescript
private applyBatchedZoom(): void {
  const zoomLevels = [1, 2, 4, 8, 16, 32, 64, 128];  // Integer factors only
  const currentIndex = zoomLevels.indexOf(gameStore.camera.zoom_factor);
  const zoomDirection = this.pendingZoomDelta > 0 ? 1 : -1;
  const newIndex = Math.max(0, Math.min(zoomLevels.length - 1, currentIndex + zoomDirection));
  
  if (newIndex !== currentIndex) {
    updateGameStore.setZoomFactor(zoomLevels[newIndex]);
    this.applyMouseCenteredZoom();  // Keep mouse point stable during zoom
  }
}
```

### 5.4 Layer Architecture Integration (Priority 4) 🔧

#### **A. Separate Layer Scaling**  
**Target File**: `game/LayeredInfiniteCanvas.ts:134-158`

**REPLACE Layer Setup**:
```typescript
private setupLayers(): void {
  // Geometry layer: NEVER scales, always 1:1 with pixeloids
  this.cameraTransform.addChild(this.backgroundLayer);
  this.cameraTransform.addChild(this.geometryLayer);
  this.geometryLayer.scale.set(1, 1);  // FIXED at scale 1
  
  // Mirror layer: Scales with zoom, shows camera viewport  
  const mainContainer = this.getContainer();
  mainContainer.addChild(this.mirrorLayer);
  
  // Configure camera viewport scaling
  this.mirrorLayer.scale.set(gameStore.camera.zoom_factor);
}
```

### 5.5 PixiJS Filter Pipeline Integration

#### **Pre-Camera Filters** (Geometry Resolution - Scale 1)
Applied to fixed-scale geometry layer before camera viewport:

```typescript
// Geometry layer filters (native resolution)
geometryLayer.filters = [
  new OutlineFilter(),        // Selection highlights at geometry resolution
  new ColorMatrixFilter(),    // Color adjustments on source geometry
  // These maintain pixeloid-perfect precision
];

// Optimize with viewport-based filterArea
geometryLayer.filterArea = new Rectangle(
  cameraViewportBounds.x, cameraViewportBounds.y,
  cameraViewportBounds.width, cameraViewportBounds.height
);
```

#### **Post-Camera Filters** (Screen Resolution - After Zoom)
Applied to camera viewport output after scaling transformation:

```typescript
// Screen effects layer (post-camera zoom)
screenEffectsContainer.filters = [
  new PixelateFilter(),       // MUST be screen resolution for proper pixelation
  new BlurFilter(),           // Screen-space blur effects
  new NoiseFilter(),          // Screen-space grain/noise
];
```

#### **Filter Performance Strategy**
Following PixiJS best practices from filter docs:

- **Single container approach**: "One filter on container with many objects >> many filters on many objects"
- **FilterArea optimization**: Limit processing to viewport bounds to prevent GPU OOM
- **Shared filter instances**: Reuse filter objects across similar objects
- **Conditional application**: `container.filters = enabled ? [filter] : null`

#### **Dual-Stage Filter Architecture**
```typescript
// Stage 1: Pre-camera rendering pipeline
geometryContainer.filters = [preScalingFilters];

// Stage 2: Camera viewport transformation
cameraContainer.scale.set(zoomFactor);
cameraContainer.position.set(-cameraX * zoomFactor, -cameraY * zoomFactor);

// Stage 3: Post-camera effects pipeline  
viewportContainer.filters = [postScalingFilters];
```

### 5.6 Memory & Performance Benefits

#### **Eliminated OOM Scenarios**:
- **Before**: 500×500 pixeloid object at scale 50 = 2.5GB texture
- **After**: 500×500 pixeloid object always = 1MB texture (fixed scale 1)

#### **Performance Improvements**:
- **Instant Zoom**: Camera transform vs texture re-generation
- **Smooth WASD**: Camera offset vs coordinate recalculation  
- **Fixed Memory**: O(1) geometry footprint vs O(scale²) growth
- **Better Quality**: Native resolution geometry vs scaled artifacts
- **Flexible Filter Pipeline**: Pre/post camera shader staging for optimal effect placement

---

## 6. Store, Types & UI Architecture Analysis

### 6.1 Current Architecture Strengths

The existing store/types/UI architecture is **excellently designed** for camera viewport integration:

#### **Store Architecture (`store/gameStore.ts`)**
- ✅ **Atomic coordinate updates**: Prevents infinite loops with `setCameraPosition()`, `setPixeloidScale()`
- ✅ **Clean drawing flow**: `UI → activeDrawing → preview → geometry.objects[]`
- ✅ **Viewport-aware navigation**: `centerViewportOnObject()` already exists
- ✅ **Copy/paste system**: Deep object cloning with smart repositioning

#### **Type System (`types/index.ts`)**
- ✅ **Branded coordinate types**: `ScreenCoordinate`, `VertexCoordinate`, `PixeloidCoordinate`
- ✅ **Type-safe transformations**: Prevents coordinate mixing errors
- ✅ **Viewport bounds**: Comprehensive viewport state tracking

#### **UI Components (`ui/` directory)**
- ✅ **Drawing tools**: Mode management and anchor configuration
- ✅ **Live editing**: Property changes with immediate preview updates
- ✅ **Object management**: Selection, copy/paste, favorites with texture previews

### 6.2 Camera Viewport Action Architecture

#### **Dual-Layer Drawing System**
**Current Flow:**
```
UI Input → activeDrawing → preview → geometry.objects[]
```

**Proposed Camera Viewport Flow:**
```
UI Input → screenPreview → viewportPreview → baseLayer
```

**Implementation:**
```typescript
// Enhanced drawing state
drawing: {
  screenPreview: DrawingPreview | null,    // NEW: Immediate screen feedback
  viewportPreview: DrawingPreview | null,  // NEW: Viewport coordinates
  activeDrawing: ActiveDrawing             // EXISTING: Current drawing state
}

// New actions for dual-layer system
setScreenPreview: (preview: DrawingPreview) => {
  gameStore.drawing.screenPreview = preview
  // Render immediately to screen layer for responsiveness
},

commitDrawingToBaseLayer: (drawing: DrawingPreview) => {
  const baseLayerObject = convertPreviewToGeometry(drawing)
  gameStore.geometry.objects.push(baseLayerObject)
  gameStore.drawing.screenPreview = null
  gameStore.drawing.viewportPreview = null
}
```

#### **Selection Proxy System**
**Enhanced Selection State:**
```typescript
selection: {
  selectedObjectId: string | null,          // EXISTING: Selected object ID
  screenHighlight: SelectionHighlight | null,  // NEW: Screen-space highlight
  baseObjectRef: GeometricObject | null        // NEW: Reference to base layer
}

// Proxy selection to screen layer
setSelectedObject: (objectId: string | null) => {
  const baseObject = findObjectInBaseLayer(objectId)
  gameStore.selection.selectedObjectId = objectId
  gameStore.selection.baseObjectRef = baseObject
  gameStore.selection.screenHighlight = createScreenHighlight(baseObject)
}
```

#### **Camera-Aware Navigation**
```typescript
// Enhanced navigation for camera viewport
centerCameraViewportOnObject: (objectId: string) => {
  const baseObject = gameStore.geometry.objects.find(obj => obj.id === objectId)
  const targetCameraPos = calculateOptimalCameraPosition(baseObject)
  
  // Update camera viewport position
  gameStore.camera.viewport_position = targetCameraPos
  
  // Ensure object visibility - expand geometry layer if needed
  if (!isObjectInViewport(baseObject, targetCameraPos)) {
    expandGeometryLayerBounds(baseObject.metadata.bounds)
  }
}
```

### 6.3 UI Component Adaptations

#### **GeometryPanel Changes**
**Dual Preview System:**
```typescript
// Enhanced drawing with immediate screen feedback
private handleMouseMove(event: MouseEvent) {
  if (gameStore.drawing.activeDrawing.isDrawing) {
    // 1. Update screen preview (immediate feedback)
    const screenPreview = generateScreenPreview(mousePos)
    updateGameStore.setScreenPreview(screenPreview)
    
    // 2. Update viewport preview (viewport coordinates)
    const viewportPreview = generateViewportPreview(mousePos)
    updateGameStore.setViewportPreview(viewportPreview)
  }
}

// Commit to base layer on completion
private handleMouseUp(event: MouseEvent) {
  if (gameStore.drawing.viewportPreview) {
    updateGameStore.commitDrawingToBaseLayer(gameStore.drawing.viewportPreview)
  }
}
```

#### **ObjectEditPanel Changes**
**Live Editing with Base Layer Updates:**
```typescript
private handlePropertyChange(property: string, value: any) {
  const baseObject = gameStore.selection.baseObjectRef
  if (baseObject) {
    // 1. Update base layer object (source of truth)
    updateBaseLayerObject(baseObject.id, property, value)
    
    // 2. Update screen highlight immediately
    const updatedHighlight = createScreenHighlight(baseObject)
    updateGameStore.setSelectionScreenHighlight(updatedHighlight)
  }
}
```

#### **Workspace Changes**
**Copy/Paste with Camera Viewport Awareness:**
```typescript
private handlePasteAtPosition(pixeloidX: number, pixeloidY: number) {
  const pastedObject = gameStore.clipboard.content
  
  // 1. Create in base layer (source of truth)
  const baseLayerObject = createBaseLayerObject(pastedObject, pixeloidX, pixeloidY)
  updateGameStore.addGeometryObject(baseLayerObject)
  
  // 2. Ensure visibility in camera viewport
  updateGameStore.ensureObjectVisible(baseLayerObject.id)
  
  // 3. Select the pasted object (creates screen highlight)
  updateGameStore.setSelectedObject(baseLayerObject.id)
}
```

### 6.4 Responsive Preview Strategy

#### **Three-Layer Rendering Strategy**
**Screen Layer** (Maximum Responsiveness):
```typescript
const ScreenPreviewRenderer = {
  render: (preview: DrawingPreview) => {
    // Render directly to screen coordinates
    // No base layer coordination needed
    // Instant visual feedback for user
  }
}
```

**Viewport Layer** (Coordinated Preview):
```typescript
const ViewportPreviewRenderer = {
  render: (preview: DrawingPreview) => {
    // Render in viewport coordinates
    // Coordinate with base layer bounds
    // Prepare for base layer commit
  }
}
```

**Base Layer** (Permanent Storage):
```typescript
const BaseLayerManager = {
  commit: (preview: DrawingPreview) => {
    // Convert to pixeloid coordinates
    // Store in geometry.objects[] at scale 1
    // Update visibility caches
    // Trigger base layer re-render
  }
}
```

### 6.5 Functional Preservation Matrix

| **Functionality** | **Current Flow** | **Camera Viewport Flow** | **Preservation Strategy** |
|-------------------|------------------|---------------------------|----------------------------|
| **Drawing** | UI → preview → commit | UI → screenPreview → viewportPreview → baseLayer | Dual preview system |
| **Selection** | Object ID → highlight | Object ID → baseRef → screenHighlight | Proxy reference system |
| **Copy/Paste** | Object → clipboard → position | BaseLayer → clipboard → baseLayer + viewport | Enhanced positioning |
| **Navigation** | centerViewportOnObject() | centerCameraViewportOnObject() | Camera-aware enhancement |
| **Live Editing** | Property → preview → object | Property → baseLayer → screenHighlight | Immediate feedback loop |

### 6.6 Performance Optimizations

#### **Viewport-Aware Preview Generation**
```typescript
// Only generate expensive previews for viewport-visible objects
const shouldGeneratePreview = (previewBounds: Bounds, viewportBounds: ViewportBounds): boolean => {
  return boundsIntersect(previewBounds, viewportBounds.world)
}

// Scale-aware tool sizing
const getSnapTolerance = (currentScale: number): number => {
  return Math.max(0.1, 1.0 / currentScale) // Minimum 0.1 pixeloid snap
}
```

#### **Smart Object Management**
```typescript
// Viewport-based object filtering for performance
const getVisibleObjectsForUI = (): GeometricObject[] => {
  const viewport = gameStore.camera.viewport_bounds.world
  return gameStore.geometry.objects.filter(obj => 
    boundsIntersect(obj.metadata.bounds, viewport)
  )
}
```

---

## 7. Detailed Intervention Points & Implementation Matrix

### 7.1 Surgical Intervention Plan

| **Component** | **File Path** | **Lines** | **Current Issue** | **Required Change** | **Risk** |
|---------------|---------------|-----------|-------------------|---------------------|----------|
| **Store State** | `store/gameStore.ts` | 49-63 | Mixed coordinate systems | Replace with camera viewport state | 🔴 HIGH |
| **Coordinate System** | `game/CoordinateCalculations.ts` | 47-89 | Offset-based conversions | Direct pixeloid=vertex mapping | 🔴 HIGH |
| **Geometry Renderer** | `game/GeometryRenderer.ts` | 185-229, 256-408 | Scale-based rendering | Fixed scale 1 rendering | 🟡 MEDIUM |
| **Mirror Layer** | `game/MirrorLayerRenderer.ts` | 268-393 | Texture caching system | Camera viewport system | 🟡 MEDIUM |
| **Input Movement** | `game/InputManager.ts` | 622-681 | Offset-based WASD | Camera position WASD | 🟡 MEDIUM |
| **Zoom System** | `game/InfiniteCanvas.ts` | 149-193 | Continuous scaling | Integer zoom factors | 🟡 MEDIUM |
| **Layer Setup** | `game/LayeredInfiniteCanvas.ts` | 134-158 | Unified layer scaling | Separate geometry/mirror scaling | 🟢 LOW |

### 7.2 Implementation Priority Matrix

| **Phase** | **Component** | **Impact** | **Effort** | **Dependencies** | **Duration** |
|-----------|---------------|------------|------------|------------------|--------------|
| **Phase 1** | Store State Restructuring | 🔴 Critical | 🟡 2 days | None | Day 1-2 |
| **Phase 1** | Coordinate System Overhaul | 🔴 Critical | 🟡 2 days | Store changes | Day 3-4 |
| **Phase 2** | Geometry Fixed Scale | 🔴 High | 🟡 1 day | Coordinates | Day 5 |
| **Phase 2** | Mirror Viewport System | 🔴 High | 🟡 2 days | Geometry changes | Day 6-7 |
| **Phase 3** | Input Camera Movement | 🟡 Medium | 🟢 1 day | Store + coordinates | Day 8 |
| **Phase 3** | Integer Zoom System | 🟡 Medium | 🟢 1 day | Camera movement | Day 9 |
| **Phase 4** | Layer Architecture | 🟢 Low | 🟢 1 day | All renderers | Day 10 |

---

## 8. Testing Strategy

### 8.1 OOM Reproduction Tests
```typescript
// Test Case 1: Large object zoom
createRectangle(500, 500, pixeloids); // Large object
zoomToScale(12); // Should trigger warning but not crash

// Test Case 2: Mass object creation  
for(let i = 0; i < 1000; i++) {
  createRectangle(10, 10, pixeloids);
}
zoomToScale(8); // Should hit memory budget limits

// Test Case 3: Progressive zoom
createRectangle(100, 100, pixeloids);
for(let scale = 1; scale <= 12; scale++) {
  zoomToScale(scale);
  measureMemoryUsage();
}
```

### 8.2 Performance Regression Tests
- Ensure fixes don't break rendering quality
- Verify cache eviction still works correctly  
- Test smooth zooming performance
- Validate texture quality at various scales

---

## 9. Camera Viewport Architecture Deployment Plan

### Phase 1: Foundation Architecture (Days 1-4) 🏗️
**Goal**: Establish camera viewport foundation without breaking existing functionality

1. **Day 1-2**: Store State Restructuring
   - ✅ Add camera viewport state to gameStore.ts
   - ✅ Maintain backward compatibility with feature flags
   - ✅ Add migration utilities for existing coordinate systems
   
2. **Day 3-4**: Coordinate System Overhaul  
   - ✅ Implement pixeloid=vertex mapping in geometry layer
   - ✅ Add camera boundary checking functions
   - ✅ Test coordinate conversions thoroughly

### Phase 2: Rendering System Transformation (Days 5-7) 🎨
**Goal**: Transform geometry and mirror layers to camera viewport architecture

3. **Day 5**: Geometry Layer Fixed Scale
   - ✅ Remove scale-based coordinate conversion
   - ✅ Fix geometry rendering at scale 1
   - ✅ Verify pixel-perfect alignment

4. **Day 6-7**: Mirror Layer Camera Viewport
   - ✅ Implement viewport extraction from geometry layer
   - ✅ Add camera transform logic to mirror layer
   - ✅ Test zoom/pan without texture regeneration

### Phase 3: Input & Interaction (Days 8-9) ⌨️
**Goal**: Seamless user interaction with camera viewport system

5. **Day 8**: WASD Camera Movement
   - ✅ Replace offset-based movement with camera positioning
   - ✅ Add geometry expansion detection and handling
   - ✅ Test smooth movement within and beyond bounds

6. **Day 9**: Integer Zoom System
   - ✅ Replace continuous zoom with integer factors
   - ✅ Implement mouse-centered zoom stability
   - ✅ Test instant zoom performance vs current system

### Phase 4: Integration & Optimization (Day 10) 🔧
**Goal**: Complete system integration and performance validation

7. **Day 10**: Layer Architecture Integration
   - ✅ Separate geometry and mirror layer scaling
   - ✅ Integrate all components into unified render loop
   - ✅ Performance testing and memory usage validation

### Rollback Strategy 🛡️
- **Feature Flag**: `USE_CAMERA_VIEWPORT_ARCHITECTURE = false` to revert
- **Parallel Systems**: Keep old rendering system active during transition  
- **Component-Level Rollback**: Each phase can be independently reverted
- **Performance Monitoring**: Real-time memory and FPS tracking during deployment

---

## 10. CRITICAL UPDATE: Current Implementation Status & ECS Layer Architecture Discovery

### 10.1 Implementation Status Analysis (2025-07-13)

**Current State**: **Phase 1 Partially Complete** - Store restructuring done but **fundamental architectural misunderstanding** discovered.

#### **✅ Completed:**
- Camera viewport state added to gameStore.ts (lines 56-85)
- New `cameraViewport` state structure implemented
- Camera movement system partially working (InputManager.ts:640-698)

#### **❌ Critical Issues Found:**

**1. Mixed Coordinate Systems Causing Tiny Rendering Bug**
```typescript
// ❌ WRONG: InputManager.ts:209 - Using legacy scale
const pixeloidScale = gameStore.camera.pixeloid_scale  // = 10

// ✅ CORRECT: Should use new camera viewport
const pixeloidScale = gameStore.cameraViewport.zoom_factor  // = 1
```

**Scale Conflict**: Legacy `pixeloid_scale: 10` vs New `zoom_factor: 1` = **10x scale inversion** = miniscule rendering

**2. Fundamental Layer Architecture Misunderstanding**

The original plan treated **Layer 1 as a display layer** that receives zoom transforms. **This is wrong**.

### 10.2 ECS Layer Architecture - The Correct Understanding

#### **Layer 1 (Geometry Layer) - ECS Data Sampling Layer**
```typescript
// Layer 1 should be ECS-style viewport sampling
class GeometryLayer {
  // ✅ FIXED SCALE 1 - never receives zoom transforms
  scale: 1,
  
  // ✅ ECS-style viewport sampling window
  viewportBounds: {
    pixeloidX: cameraPosition.x,
    pixeloidY: cameraPosition.y,
    width: screenWidth / zoomFactor,
    height: screenHeight / zoomFactor
  },
  
  // ✅ Data sampling from storage based on viewport
  renderVisibleObjects(): void {
    const objectsInViewport = storage.getObjectsInBounds(this.viewportBounds)
    objectsInViewport.forEach(obj => this.renderAtScale1(obj))
  },
  
  // ✅ WASD at zoom 1 moves the sampling window, not the layer
  onWASDMovement(deltaX: number, deltaY: number): void {
    if (zoomFactor === 1) {
      this.viewportBounds.pixeloidX += deltaX
      this.viewportBounds.pixeloidY += deltaY
      this.resampleData()  // Fetch new data from storage
    }
    // At zoom 2+, geometry layer doesn't move (it's hidden)
  }
}
```

#### **Layer 2+ (Mirror Layers) - Display Zoom Layers**
```typescript
// Mirror layers take complete geometry from Layer 1 and apply viewport/zoom
class MirrorLayer {
  // ✅ Takes complete geometry texture from Layer 1
  sourceTexture: GeometryLayer.getCompleteTexture(),
  
  // ✅ Camera viewport transforms (only at zoom 2+)
  scale: zoomFactor,
  position: zoomFactor === 1 ? (0,0) : (-cameraPos.x * zoomFactor, -cameraPos.y * zoomFactor),
  
  // ✅ At zoom 1: shows complete geometry; at zoom 2+: shows camera viewport
  render(): void {
    if (zoomFactor === 1) {
      this.displayCompleteTexture(this.sourceTexture)  // Full mirror
    } else {
      this.displayTexture(this.sourceTexture, this.scale, this.position)  // Viewport
    }
  }
}
```

### 10.3 The Core Problem: Layer 1 Transform Confusion

**Current Broken Flow:**
```
Storage → Layer 1 (gets transforms) → Layer 2+ (also gets transforms)
                   ↑ WRONG - Layer 1 should NOT get display transforms
```

**Correct ECS Flow:**
```
Storage → Layer 1 (ECS viewport sampling, scale 1) → Layer 2+ (display transforms)
                   ↑ CORRECT - Layer 1 is data sampling layer
```

### 10.4 Immediate Critical Fixes Required

#### **Fix 1: Remove Layer 1 Transform Application**
**File**: `game/LayeredInfiniteCanvas.ts`
```typescript
// ❌ WRONG: Applying transforms to geometry layer
this.geometryLayer.scale.set(pixeloidScale)
this.geometryLayer.position.set(offset.x, offset.y)

// ✅ CORRECT: Geometry layer always fixed
this.geometryLayer.scale.set(1, 1)  // FIXED SCALE
this.geometryLayer.position.set(0, 0)  // FIXED POSITION
```

#### **Fix 2: Fix InputManager Scale Reference**
**File**: `game/InputManager.ts:209`
```typescript
// ❌ WRONG: Using legacy scale
const pixeloidScale = gameStore.camera.pixeloid_scale

// ✅ CORRECT: Use camera viewport zoom
const pixeloidScale = gameStore.cameraViewport.zoom_factor
```

#### **Fix 3: Implement ECS Viewport Sampling in Layer 1**
**File**: `game/GeometryRenderer.ts`
```typescript
// ✅ NEW: ECS-style viewport sampling
public render(): void {
  const viewport = gameStore.cameraViewport.viewport_position
  const viewportSize = {
    width: gameStore.windowWidth / gameStore.cameraViewport.zoom_factor,
    height: gameStore.windowHeight / gameStore.cameraViewport.zoom_factor
  }
  
  // Sample only objects within viewport bounds
  const visibleObjects = this.sampleObjectsInViewport(viewport, viewportSize)
  
  // Render at fixed scale 1
  visibleObjects.forEach(obj => this.renderAtFixedScale(obj))
}
```

### 10.5 Updated Implementation Strategy

#### **Phase 0: Critical Bug Fix (Immediate)**
1. **Fix InputManager scale reference** (InputManager.ts:209)
2. **Remove geometry layer transforms** (LayeredInfiniteCanvas.ts)
3. **Implement ECS viewport sampling** (GeometryRenderer.ts)

#### **Phase 1: ECS Layer Architecture** 
1. **Geometry Layer**: Pure ECS data sampling at scale 1
2. **Mirror Layers**: Display-only zoom transforms
3. **WASD Movement**: Viewport sampling window movement

#### **Phase 2: Coordinate System Cleanup**
1. **Remove legacy camera state** (eliminate `camera.pixeloid_scale`)
2. **Implement direct pixeloid=vertex mapping**
3. **Update all coordinate calculations**

### 10.6 Root Cause Analysis Summary

**The miniscule rendering bug** is caused by:
1. **Dual scale systems**: `camera.pixeloid_scale: 10` vs `cameraViewport.zoom_factor: 1`
2. **Layer 1 transform confusion**: Treating data sampling layer as display layer
3. **Coordinate system mixing**: Using wrong scale references in calculations

**The solution** requires:
1. **Immediate scale reference fix**
2. **ECS layer architecture understanding**
3. **Separation of data sampling from display transforms**

---

## 11. Conclusion & Strategic Impact

### 11.1 Architectural Transformation Summary

The **Camera Viewport Architecture** represents a paradigm shift from scale-based rendering to camera-based viewing, fundamentally solving the OOM crisis while providing superior performance and user experience.

**Problem Eliminated**: O(scale²) memory growth → O(1) fixed memory footprint  
**Performance Gained**: Instant zoom/pan through camera transforms vs expensive texture regeneration  
**Quality Improved**: Native resolution geometry vs scaling artifacts  

### 11.2 ECS Layer Architecture Benefits

The **corrected ECS understanding** provides:
- **Layer 1**: Pure data sampling layer (ECS-style viewport window)
- **Layer 2+**: Pure display layers (zoom transforms only)
- **WASD Movement**: Viewport sampling window movement (not layer transforms)
- **Memory Efficiency**: O(1) geometry footprint with O(1) viewport sampling

### 11.3 Implementation Confidence

**Immediate Action Required**: 
- **Phase 0**: Critical bug fixes to resolve miniscule rendering
- **ECS Architecture**: Proper separation of data sampling vs display
- **Scale Reference Fix**: Single source of truth for zoom factor

**Technical Feasibility**:
- Leverages existing PixiJS container transform system
- Builds on established coordinate calculation infrastructure  
- Maintains pixel-perfect precision through integer-only zoom factors
- **ECS Pattern**: Standard game engine architecture pattern

### 11.4 Strategic Benefits

**Immediate** (Post-Implementation):
- ✅ **Zero OOM crashes** regardless of object size or zoom level
- ✅ **Instant zoom performance** through camera transforms
- ✅ **Smooth WASD movement** with predictable boundary behavior

**Long-term** (Future Expansions):
- 🚀 **Infinite world support** without memory constraints
- 🚀 **Multi-layer composition** for complex scene management  
- 🚀 **Advanced camera effects** (rotation, perspective, effects)

---

---

**Document Status**: ✅ Complete Camera Viewport Analysis & Implementation Plan + Critical Update  
**Last Updated**: 2025-07-13  
**Architecture**: ECS Camera Viewport System with Data Sampling Layer 1  
**Coverage**: Complete analysis from OOM problem to ECS layer architecture + Current bug analysis  
**Next Step**: Phase 0 - Critical Bug Fixes (InputManager scale + Layer 1 ECS)