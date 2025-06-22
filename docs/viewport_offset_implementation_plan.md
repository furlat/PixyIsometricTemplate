# Viewport Offset Implementation Plan

## Problem Analysis

The current implementation has several critical issues:

1. **No explicit viewport offset storage** - The coordinate mapping lacks the offset between vertex (0,0) and the current pixeloid viewport
2. **Inconsistent vertex-to-pixel alignment** - Screenshots show drift in grid alignment, breaking mesh event detection accuracy  
3. **Fabricated debug calculations** - StorePanel shows made-up calculations instead of real store data
4. **Mouse drawing using wrong coordinates** - Should use vertices directly, not pixeloids

## Solution: Explicit Viewport Offset Storage

### 1. Update PixeloidVertexMapping Type

Add explicit viewport offset and vertex bounds tracking:

```typescript
export interface PixeloidVertexMapping {
  meshToPixeloid: Map<string, PixeloidCoordinate>
  pixeloidToMesh: Map<string, MeshVertexCoordinate>
  currentResolution: MeshResolution
  viewportBounds: {
    minVertexX: number
    maxVertexX: number  
    minVertexY: number
    maxVertexY: number
  }
  
  // NEW: Explicit viewport offset tracking
  viewportOffset: PixeloidCoordinate  // Where vertex (0,0) maps to in current pixeloid viewport
  vertexBounds: {                     // Current viewport corners in vertex coordinates
    topLeft: MeshVertexCoordinate
    bottomRight: MeshVertexCoordinate
  }
}
```

### 2. Modify StaticMeshManager.updateCoordinateMapping()

Calculate and store the explicit viewport offset:

```typescript
private updateCoordinateMapping(resolution: MeshResolution): void {
  // ... existing code ...

  // Calculate viewport offset (where vertex 0,0 should be positioned)
  const pixeloidCorners = gameStore.camera.viewportCorners
  const level = resolution.level
  
  // Convert pixeloid corners to vertex coordinates
  const vertexTopLeftX = Math.floor(pixeloidCorners.topLeft.x / level)
  const vertexTopLeftY = Math.floor(pixeloidCorners.topLeft.y / level)
  const vertexBottomRightX = Math.floor(pixeloidCorners.bottomRight.x / level)
  const vertexBottomRightY = Math.floor(pixeloidCorners.bottomRight.y / level)
  
  // Calculate the viewport offset (pixeloid coordinate that corresponds to vertex 0,0)
  const viewportOffset = {
    x: pixeloidCorners.topLeft.x - (vertexTopLeftX * level),
    y: pixeloidCorners.topLeft.y - (vertexTopLeftY * level)
  }

  // Store vertex bounds of current viewport
  const vertexBounds = {
    topLeft: { x: vertexTopLeftX, y: vertexTopLeftY },
    bottomRight: { x: vertexBottomRightX, y: vertexBottomRightY }
  }

  const coordinateMapping: PixeloidVertexMapping = {
    // ... existing fields ...
    viewportOffset,
    vertexBounds
  }
}
```

### 3. Fix CoordinateHelper.meshVertexToPixeloid()

Replace complex mapping lookups with simple stored offset:

```typescript
static meshVertexToPixeloid(
  vertex: MeshVertexCoordinate,
  currentResolution?: MeshResolution
): PixeloidCoordinate {
  const coordinateMapping = gameStore.staticMesh.coordinateMapping
  
  if (!coordinateMapping) {
    // Fallback to basic scaling if no mapping
    const resolution = currentResolution || { level: 1 } as MeshResolution
    return {
      x: vertex.x * resolution.level,
      y: vertex.y * resolution.level
    }
  }

  const { level } = coordinateMapping.currentResolution
  const { viewportOffset } = coordinateMapping
  
  // Simple conversion: pixeloid = vertex * level + offset
  return {
    x: vertex.x * level + viewportOffset.x,
    y: vertex.y * level + viewportOffset.y
  }
}
```

### 4. Update StorePanel to Use Real Store Data

Remove fabricated calculations and use actual stored values:

```typescript
// Viewport corners in vertex coordinates (from stored vertexBounds)
const vertexBounds = coordinateMapping?.vertexBounds
if (vertexBounds) {
  updateElement(this.elements, 'viewport-corners-vertices',
    `TL:(${vertexBounds.topLeft.x},${vertexBounds.topLeft.y}) BR:(${vertexBounds.bottomRight.x},${vertexBounds.bottomRight.y})`,
    'text-green-400'
  )

  // Viewport offset (from stored viewportOffset)
  const viewportOffset = coordinateMapping.viewportOffset
  updateElement(this.elements, 'viewport-offset',
    `Offset:(${viewportOffset.x.toFixed(2)},${viewportOffset.y.toFixed(2)})`,
    'text-purple-400'
  )
}
```

### 5. Ensure Perfect Vertex-to-Pixel Alignment

The key is ensuring vertex (0,0) always maps to the same pixel position:

1. **Consistent offset calculation** - Store where vertex (0,0) should be positioned
2. **Mesh positioning** - Ensure mesh is positioned so vertices align with pixels consistently
3. **Camera movement constraints** - Consider snapping camera movement to vertex-aligned positions

### 6. Mouse Drawing Using Vertices

Update drawing system to use `gameStore.mouseVertexPosition` directly:

```typescript
// In drawing handlers, use vertex coordinates directly
const vertex = gameStore.mouseVertexPosition
// Draw at vertex position - no conversion needed since mesh events provide perfect coordinates
```

## Implementation Order

1. **Update types** (`app/src/types/index.ts`)
2. **Modify StaticMeshManager** (`app/src/game/StaticMeshManager.ts`)
3. **Fix CoordinateHelper** (`app/src/game/CoordinateHelper.ts`)  
4. **Update StorePanel** (`app/src/ui/StorePanel.ts`)
5. **Test alignment consistency** - Verify vertex (0,0) stays pixel-aligned across zoom/camera changes

## Expected Results

- **Perfect grid alignment** - Vertices consistently align with pixel positions
- **Accurate debug information** - StorePanel shows real store data, not fabricated calculations
- **Simplified coordinate conversion** - Simple `vertex * level + offset` formula
- **Consistent mesh event detection** - No drift in mouse detection accuracy