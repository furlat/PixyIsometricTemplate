# Static Mesh Architecture Plan

## Problem Statement

The current PixiJS isometric game engine experiences **transform coherence issues** where "things lose coherence due to the transforms." This manifests as:

- Floating-point coordinate drift during camera movement
- Misalignment between visual grid and game coordinates  
- Inconsistent coordinate transformations across different zoom levels
- Performance issues from dynamic coordinate calculations each frame

## Solution: Static Mesh Architecture

Establish **mesh vertices as the single source of truth** for all coordinate systems, eliminating transform drift through GPU-optimized static meshes.

## Core Coordinate Hierarchy

```
Layer 1 (GPU Ground Truth):    Screen Pixels ↔ Mesh Vertices 
Layer 2 (ECS Backend):         Mesh Vertices ↔ Pixeloids (via Store)
Layer 3 (Game Logic):          Game Objects in Pixeloid space
```

### Key Principles

1. **Mesh Vertices = Ground Truth**: Static GPU mesh vertices are the authoritative coordinate system
2. **Bidirectional Mapping**: Store maintains mesh vertex ↔ pixeloid relationships
3. **Resolution Levels**: Pre-computed meshes for zoom levels (1, 2, 4, 8, 16, 32, 64, 128)
4. **20% Oversized Viewports**: Seamless transitions between mesh resolutions
5. **Vertex-Aligned Movement**: WASD and input snap to mesh vertex coordinates

## Implementation Architecture

### Static Mesh Types

```typescript
interface MeshVertexCoordinate {
  x: number  // Mesh vertex position
  y: number
}

interface MeshResolution {
  level: number              // 1, 2, 4, 8, 16, 32, 64, 128
  pixeloidScale: number     // Corresponding scale
  oversizePercent: number   // Always 20%
  meshBounds: {
    vertexWidth: number
    vertexHeight: number
  }
}

interface StaticMeshData {
  resolution: MeshResolution
  vertices: Float32Array    // GPU vertex data
  indices: Uint16Array      // GPU index data
  createdAt: number
  isValid: boolean
}

interface PixeloidVertexMapping {
  meshToPixeloid: Map<string, PixeloidCoordinate>    // "x,y" vertex -> pixeloid
  pixeloidToMesh: Map<string, MeshVertexCoordinate>  // "x,y" pixeloid -> vertex
  currentResolution: MeshResolution
  viewportBounds: {
    minVertexX: number
    maxVertexX: number
    minVertexY: number
    maxVertexY: number
  }
}
```

### Coordinate Conversion Pipeline

**Input Processing**: `Screen Pixels → Mesh Vertices → Pixeloids → Game Logic`

```typescript
// Core conversion functions
screenPixelToMeshVertex(screenX, screenY, canvasWidth, canvasHeight): MeshVertexCoordinate
meshVertexToPixeloid(vertex: MeshVertexCoordinate): PixeloidCoordinate  
pixeloidToMeshVertex(pixeloid: PixeloidCoordinate): MeshVertexCoordinate

// Compound conversions
screenPixelToPixeloid(screenX, screenY): PixeloidCoordinate
snapPixeloidToVertexAlignment(pixeloid): PixeloidCoordinate
calculateVertexAlignedMovement(deltaX, deltaY): PixeloidCoordinate
```

### Static Mesh Manager

```typescript
class StaticMeshManager {
  // Mesh generation and caching
  createMeshResolution(pixeloidScale: number): MeshResolution
  createStaticMesh(resolution: MeshResolution): StaticMeshData
  setActiveMesh(pixeloidScale: number): void
  
  // Coordinate mapping
  updateCoordinateMapping(): void
  getCoordinateMapping(): PixeloidVertexMapping
  
  // Movement and navigation
  handleCameraMovement(deltaX: number, deltaY: number): void
  handleZoomChange(newPixeloidScale: number): void
  
  // Performance and debugging
  clearMeshCache(): void
  getPerformanceStats(): object
  isReady(): boolean
}
```

## Grid Rendering Integration

### Mesh-Vertex-Aligned Grid

```typescript
// BackgroundGridRenderer updates
renderWithStaticMesh(pixeloidScale: number): void {
  const activeMesh = staticMeshManager.getActiveMesh()
  const mapping = staticMeshManager.getCoordinateMapping()
  
  // Create grid quads positioned exactly at mesh vertices
  this.generateStaticMeshGrid(activeMesh, mapping)
}

createVertexAlignedGridMesh(startX, endX, startY, endY, meshLevel): void {
  // Grid squares aligned to mesh vertex coordinates
  const scale = 1 / meshLevel
  for (let meshX = startX; meshX < endX; meshX++) {
    for (let meshY = startY; meshY < endY; meshY++) {
      // Convert mesh vertex to pixeloid coordinates for rendering
      const pixeloidX = meshX * scale
      const pixeloidY = meshY * scale
      // Create quad at exact mesh vertex positions
    }
  }
}
```

## Input System Integration

### Vertex-Aligned Input Processing

```typescript
// InputManager updates
convertScreenToPixeloidViaMesh(screenX, screenY): PixeloidCoordinate {
  // Layer 1: Screen → Mesh Vertex (natural GPU relationship)
  const vertex = GeometryHelper.screenPixelToMeshVertex(screenX, screenY, canvas.width, canvas.height)
  
  // Layer 2: Mesh Vertex → Pixeloid (via Store mapping)
  return GeometryHelper.meshVertexToPixeloid(vertex)
}

getVertexAlignedPixeloid(pixeloid: PixeloidCoordinate): PixeloidCoordinate {
  // Snap input to mesh vertex alignment for precision
  return GeometryHelper.snapPixeloidToVertexAlignment(pixeloid) || pixeloid
}
```

### WASD Movement Alignment

```typescript
// Store integration for vertex-aligned movement
moveWithMeshAlignment(deltaX: number, deltaY: number): void {
  const mapping = gameStore.staticMesh.coordinateMapping
  
  // Calculate target in mesh vertex space
  const targetVertexX = gameStore.camera.position.x * mapping.currentResolution.level + deltaX * mapping.currentResolution.level
  const targetVertexY = gameStore.camera.position.y * mapping.currentResolution.level + deltaY * mapping.currentResolution.level
  
  // Snap to nearest vertex
  const snappedVertexX = Math.round(targetVertexX)
  const snappedVertexY = Math.round(targetVertexY)
  
  // Convert back to vertex-aligned pixeloid coordinates
  const alignedPixeloidX = snappedVertexX / mapping.currentResolution.level
  const alignedPixeloidY = snappedVertexY / mapping.currentResolution.level
  
  // Move camera to vertex-aligned position
  infiniteCanvasRef.moveCameraToPosition(alignedPixeloidX, alignedPixeloidY)
}
```

## Implementation Phases

### Phase 1: Core Foundation
- [ ] Add static mesh types to `app/src/types/index.ts`
- [ ] Add static mesh state to `app/src/store/gameStore.ts`
- [ ] Add coordinate conversion functions to store

### Phase 2: Coordinate System
- [ ] Update `app/src/game/GeometryHelper.ts` with mesh conversion methods
- [ ] Implement screen→mesh→pixeloid conversion pipeline
- [ ] Add vertex alignment functions

### Phase 3: Mesh Manager
- [ ] Create `app/src/game/StaticMeshManager.ts`
- [ ] Implement mesh generation and caching
- [ ] Handle resolution switching and coordinate mapping

### Phase 4: Grid Integration
- [ ] Update `app/src/game/BackgroundGridRenderer.ts`
- [ ] Implement mesh-vertex-aligned grid rendering
- [ ] Add fallback to legacy rendering

### Phase 5: Input Integration
- [ ] Update `app/src/game/InputManager.ts`
- [ ] Implement vertex-aligned input processing
- [ ] Add WASD mesh alignment

### Phase 6: Canvas Integration
- [ ] Update `app/src/game/LayeredInfiniteCanvas.ts`
- [ ] Initialize static mesh system
- [ ] Handle zoom-based mesh switching

## Performance Benefits

- **Transform Coherence**: Eliminates floating-point coordinate drift
- **GPU Optimization**: Direct mesh vertex rendering
- **Efficient Caching**: Pre-computed mesh resolutions
- **Vertex Precision**: Perfect alignment between grid and coordinates
- **Seamless Transitions**: 20% oversized viewports for smooth zoom changes

## Testing Strategy

```typescript
class StaticMeshIntegrationTest {
  static testInitialization(): boolean
  static testCoordinateConversion(): boolean  
  static testMeshResolutionSwitching(): boolean
  static testVertexAlignment(): boolean
  static runAllTests(): boolean
}
```

## Expected Outcome

**Before**: Coordinate drift, misaligned transforms, floating-point precision issues
**After**: Pixel-perfect alignment, coherent transforms, GPU-optimized rendering with mesh vertices as single source of truth

The static mesh architecture provides a solid foundation for transform coherence while maintaining high performance through GPU-optimized rendering.