# Mirror Layer Solution

## The Correct Approach: Using `renderer.generateTexture()`

Based on the PixiJS documentation (docs/export.md), the safe way to extract textures is:

```typescript
// From docs/export.md line 290 and 2202
const texture = renderer.generateTexture(container);
```

## Implementation Plan

### 1. Fix Graphics Corruption
Instead of cloning graphics (which corrupts them), use `generateTexture`:

```typescript
// In MirrorLayerRenderer
private extractObjectTexture(
  objectContainer: Container,
  bounds: any,
  pixeloidScale: number
): RenderTexture | null {
  // Use generateTexture - this is the safe way!
  const texture = this.renderer.generateTexture(objectContainer);
  
  // The texture now contains the full object at its current rendered state
  return texture;
}
```

### 2. Extract at Full Pixel Resolution
To get pixeloid-perfect bounding boxes with full pixel resolution:

```typescript
// Calculate texture region to extract
const pixelBounds = {
  x: bounds.minX * pixeloidScale,
  y: bounds.minY * pixeloidScale,
  width: (bounds.maxX - bounds.minX) * pixeloidScale,
  height: (bounds.maxY - bounds.minY) * pixeloidScale
};

// Extract specific region using generateTexture with frame
const texture = this.renderer.generateTexture(objectContainer, {
  frame: new Rectangle(
    pixelBounds.x,
    pixelBounds.y,
    pixelBounds.width,
    pixelBounds.height
  ),
  resolution: 1,
  scaleMode: 'nearest'
});
```

### 3. Fix Layer Toggle
Clear the container properly:

```typescript
// In LayeredInfiniteCanvas
private renderMirrorLayer(corners: ViewportCorners, pixeloidScale: number): void {
  // Clear existing sprites first
  this.mirrorLayerRenderer.clearSprites();
  
  if (gameStore.geometry.layerVisibility.mirror) {
    this.mirrorLayerRenderer.render(corners, pixeloidScale, this.geometryRenderer);
    // Container is automatically populated by renderer
  }
}
```

## Key Benefits
1. **No Graphics Corruption**: `generateTexture` doesn't modify the original
2. **Full Pixel Resolution**: Extracts at the exact pixel resolution needed
3. **Clean API**: Uses official PixiJS texture generation method
4. **Memory Safe**: Can be cached and destroyed properly

## Example Usage
```typescript
// Get container from GeometryRenderer
const objectContainer = geometryRenderer.getObjectContainer(obj.id);

// Generate texture safely
const texture = renderer.generateTexture(objectContainer);

// Create sprite from texture
const sprite = new Sprite(texture);
sprite.position.set(bounds.minX, bounds.minY);

// Add to mirror layer
this.container.addChild(sprite);
```

This follows the exact pattern shown in the PixiJS documentation and avoids all the issues we were experiencing.