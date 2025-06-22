# Coordinate Pipeline Fix Plan

## Problem Understanding

**Correct Coordinate Flow**:
- **Vertices**: Screen-space mesh coordinates (limited to viewport)
- **Level**: `pixeloidScale` - determines pixels per vertex/pixeloid  
- **Pixeloids**: Infinite game world coordinates (ECS state)

**Mapping Flow**:
- **Rendering**: Pixeloids → Vertices → Pixels
- **Input**: Pixels → Vertices → Pixeloids
- **Mesh Events**: Direct vertex detection (already working)

## Critical Problems Identified

### **Problem 1: Wrong Viewport Offset Calculation** (CRITICAL)

**Location**: [`StaticMeshManager.ts:216-229`](app/src/game/StaticMeshManager.ts:216)

**Current (WRONG)**:
```typescript
// Complex fabricated calculation
const viewportOffset: PixeloidCoordinate = {
  x: pixeloidCorners.topLeft.x - (vertexTopLeftX * level),
  y: pixeloidCorners.topLeft.y - (vertexTopLeftY * level)
}
```

**Should Be (SIMPLE)**:
```typescript
// Viewport offset IS the camera position
const viewportOffset: PixeloidCoordinate = gameStore.camera.position
```

**Logic**: Since pixel (0,0) = vertex (0,0), and vertex (0,0) should map to camera position in pixeloid space, the offset IS the camera position.

### **Problem 2: Correct Formula, Wrong Input** (CRITICAL)

**Location**: [`CoordinateHelper.ts:149-153`](app/src/game/CoordinateHelper.ts:149)

**Current**:
```typescript
// Formula is CORRECT, but using wrong viewportOffset from StaticMeshManager
return {
  x: vertex.x * level + viewportOffset.x,
  y: vertex.y * level + viewportOffset.y
}
```

**Fix**: Use camera position directly as offset, not fabricated viewport offset.

### **Problem 3: Type Duplication** (MEDIUM)

**Location**: [`gameStore.ts`](app/src/store/gameStore.ts:31)

**Issue**: Duplicate scaling values:
- `camera.pixeloidScale` 
- `staticMesh.currentScale`

These should be the same value (level = pixeloidScale).

### **Problem 4: Fabricated Debug Data** (HIGH)

**Location**: [`StorePanel.ts:209-250`](app/src/ui/StorePanel.ts:209)

**Issue**: Shows complex calculations instead of real store values.

**Should Show**:
- Viewport offset = camera position
- Vertex bounds = calculated from camera position and viewport size
- Real coordinate mapping data, not fabricated calculations

### **Problem 5: Mouse Drawing Wrong Coordinates** (MEDIUM)

**Issue**: Mouse drawing should use `gameStore.mouseVertexPosition` directly from mesh events, not convert from pixeloids.

**Enhancement**: Implement vertex-based shader for mouse highlighting (similar to grid shader but only for selected vertices).

## Simple Fix Plan

### **Step 1: Fix StaticMeshManager.updateCoordinateMapping()**

```typescript
private updateCoordinateMapping(resolution: MeshResolution): void {
  const { vertexWidth, vertexHeight } = resolution.meshBounds
  const level = resolution.level
  
  // SIMPLE: Viewport offset IS camera position
  const viewportOffset: PixeloidCoordinate = gameStore.camera.position
  
  // Calculate vertex bounds from camera and viewport size
  const cameraX = gameStore.camera.position.x
  const cameraY = gameStore.camera.position.y
  const viewportPixelWidth = gameStore.windowWidth
  const viewportPixelHeight = gameStore.windowHeight
  
  // Convert viewport size to pixeloid space
  const viewportPixeloidWidth = viewportPixelWidth / level
  const viewportPixeloidHeight = viewportPixelHeight / level
  
  // Calculate pixeloid viewport bounds
  const pixeloidLeft = cameraX - (viewportPixeloidWidth / 2)
  const pixeloidTop = cameraY - (viewportPixeloidHeight / 2)
  const pixeloidRight = cameraX + (viewportPixeloidWidth / 2)
  const pixeloidBottom = cameraY + (viewportPixeloidHeight / 2)
  
  // Convert to vertex coordinates
  const vertexBounds = {
    topLeft: { 
      x: Math.floor(pixeloidLeft / level), 
      y: Math.floor(pixeloidTop / level) 
    },
    bottomRight: { 
      x: Math.floor(pixeloidRight / level),
      y: Math.floor(pixeloidBottom / level)
    }
  }
  
  // ... rest of mapping generation using simple formulas
  
  const coordinateMapping: PixeloidVertexMapping = {
    meshToPixeloid,
    pixeloidToMesh,
    currentResolution: resolution,
    viewportBounds,
    viewportOffset,  // Camera position
    vertexBounds     // Calculated from camera + viewport
  }
}
```

### **Step 2: Verify CoordinateHelper (Already Correct)**

The conversion formula in [`CoordinateHelper.meshVertexToPixeloid()`](app/src/game/CoordinateHelper.ts:149) is already correct:

```typescript
// This formula is RIGHT, just needs camera position as offset
return {
  x: vertex.x * level + viewportOffset.x,  // viewportOffset = camera.position
  y: vertex.y * level + viewportOffset.y
}
```

### **Step 3: Fix StorePanel Debug Display**

```typescript
// Show REAL data, not fabricated calculations
if (coordinateMapping) {
  const { viewportOffset, vertexBounds } = coordinateMapping
  
  // Viewport offset = camera position (simple!)
  updateElement(this.elements, 'viewport-offset',
    `Camera:(${viewportOffset.x.toFixed(2)},${viewportOffset.y.toFixed(2)})`,
    'text-purple-400'
  )
  
  // Vertex bounds = calculated from camera
  updateElement(this.elements, 'viewport-corners-vertices',
    `TL:(${vertexBounds.topLeft.x},${vertexBounds.topLeft.y}) BR:(${vertexBounds.bottomRight.x},${vertexBounds.bottomRight.y})`,
    'text-green-400'
  )
}
```

### **Step 4: Fix Type Duplication**

Ensure `staticMesh.currentScale` always matches `camera.pixeloidScale`:

```typescript
// In setPixeloidScale():
gameStore.camera.pixeloidScale = scale
gameStore.staticMesh.currentScale = scale  // Keep in sync
```

### **Step 5: Mouse Drawing Enhancement**

Use `gameStore.mouseVertexPosition` directly from mesh events:

```typescript
// In drawing handlers, use vertex coordinates directly
const vertex = gameStore.mouseVertexPosition
// Draw at vertex position - no conversion needed since mesh events provide perfect coordinates

// TODO: Implement vertex-based shader for mouse highlighting
// Similar to grid shader but only highlighting selected vertices
```

## Implementation Order

1. **Fix StaticMeshManager.updateCoordinateMapping()** (CRITICAL)
2. **Verify CoordinateHelper uses camera position** (CRITICAL) 
3. **Fix StorePanel debug display** (HIGH)
4. **Sync type duplication** (MEDIUM)
5. **Test perfect alignment** (CRITICAL)
6. **Enhance mouse drawing with vertex shader** (MEDIUM)

## Expected Results

- **Pixel (0,0)** = **Vertex (0,0)** = **Pixeloid (camera.position)** ✓
- **Any conversion**: `pixeloid = vertex * level + camera.position` ✓
- **Perfect alignment** across all zoom levels ✓
- **Real debug data** showing actual coordinate relationships ✓
- **Vertex-based mouse drawing** with shader highlighting ✓
- **No more coordinate drift** or detection errors ✓

## Core Truth

The viewport offset should simply be the camera position. The current complex calculation abandoned this simple truth and created a fabricated offset that doesn't represent the actual coordinate relationship.

**Simple Formula**: `pixeloid = vertex * level + camera.position`

That's it. Everything else follows from this simple relationship.