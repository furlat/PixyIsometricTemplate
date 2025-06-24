# Mirror Layer Visibility Issue Analysis

## Problem Statement
The mirror layer (BboxTextureTestRenderer) shows nothing when the geometry layer is turned off, defeating its purpose as an independent texture cache layer.

## Root Cause Analysis

### 1. Conditional Geometry Rendering
In `LayeredInfiniteCanvas.renderGeometryLayer()` (lines 264-288):
```typescript
private renderGeometryLayer(corners: ViewportCorners, pixeloidScale: number): void {
  if (gameStore.geometry.layerVisibility.geometry) {
    this.geometryRenderer.render(corners, pixeloidScale)
    // ... adds renderer container to geometry layer
  } else {
    // Clear layer if not visible
    this.geometryLayer.removeChildren()
  }
}
```

When geometry visibility is `false`:
- `geometryRenderer.render()` is NOT called
- The geometry layer children are removed
- No object containers exist in GeometryRenderer

### 2. Mirror Layer Dependency
In `BboxTextureTestRenderer.render()` (lines 44-68):
```typescript
public render(
  corners: ViewportCorners,
  pixeloidScale: number,
  geometryRenderer?: GeometryRenderer
): void {
  // ...
  for (const obj of visibleObjects) {
    this.extractAndCreateObjectSprite(obj, geometryRenderer, pixeloidScale)
  }
}
```

Then in `extractAndCreateObjectSprite()` (lines 85-144):
```typescript
private extractAndCreateObjectSprite(
  obj: GeometricObject,
  geometryRenderer: GeometryRenderer,
  pixeloidScale: number
): void {
  // Get object graphics from GeometryRenderer
  const objectGraphics = geometryRenderer.getObjectGraphics(obj.id)
  if (!objectGraphics) {
    console.warn(`BboxTextureTestRenderer: No graphics found for object ${obj.id}`)
    return
  }
  // ...
}
```

The mirror layer:
- Calls `geometryRenderer.getObjectGraphics(obj.id)`
- Gets `undefined` because GeometryRenderer never rendered
- Cannot extract textures from non-existent graphics
- Shows nothing

## Why This Design is Wrong

1. **Not Independent**: The mirror layer depends on active geometry rendering
2. **No Caching**: Textures are extracted every frame, not cached
3. **Defeats Purpose**: Cannot show cached sprites when geometry is hidden
4. **Performance**: Re-extracts textures unnecessarily

## Expected Behavior

The mirror layer should:
1. Cache extracted textures on first render
2. Show cached sprites regardless of geometry visibility
3. Only re-extract when objects change
4. Work independently from source layer visibility

## Impact

This issue makes it impossible to:
- Test filters independently from geometry
- Show cached sprites when geometry is hidden
- Verify texture extraction is working correctly
- Implement true multi-pass rendering

## Solution Requirements

1. GeometryRenderer should always maintain object containers
2. Layer visibility should only control the `visible` property
3. Mirror layer should use persistent texture cache
4. Texture extraction should happen once, not every frame