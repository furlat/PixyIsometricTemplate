# Mirror Layer Solution - Multi-Pass Rendering Approach

## The Multi-Pass Rendering Pattern from docs/export.md

Looking at the multi-pass rendering example (lines 3010-3188), we can see the proper pattern:

```typescript
// Create render texture
const gridTexture = RenderTexture.create({ width: 200, height: 200 });

// Render container to texture
app.renderer.render({
  container: gridQuad,
  target: gridTexture,
});
```

## Our Implementation Using Multi-Pass Pattern

### 1. Create RenderTexture at Full Pixel Resolution

```typescript
// Calculate pixel-perfect dimensions
const textureWidth = Math.ceil((bounds.maxX - bounds.minX) * pixeloidScale);
const textureHeight = Math.ceil((bounds.maxY - bounds.minY) * pixeloidScale);

// Create render texture
const texture = RenderTexture.create({
  width: textureWidth,
  height: textureHeight,
  resolution: 1,
  scaleMode: 'nearest' // Pixel-perfect
});
```

### 2. Render Object Container to Texture

```typescript
// Get object container from GeometryRenderer
const objectContainer = geometryRenderer.getObjectContainer(obj.id);

// Calculate transform to capture just the bbox area
const transform = new Matrix()
  .scale(pixeloidScale, pixeloidScale)
  .translate(-bounds.minX * pixeloidScale, -bounds.minY * pixeloidScale);

// Render to texture WITHOUT modifying the container
this.renderer.render({
  container: objectContainer,
  target: texture,
  clear: true,
  transform: transform
});
```

### 3. Complete Solution

```typescript
private extractObjectTexture(
  objectId: string,
  geometryRenderer: GeometryRenderer,
  bounds: any,
  pixeloidScale: number
): RenderTexture | null {
  // Get the object container
  const objectContainer = geometryRenderer.getObjectContainer(objectId);
  if (!objectContainer) return null;

  // Calculate texture dimensions at full pixel resolution
  const textureWidth = Math.ceil((bounds.maxX - bounds.minX) * pixeloidScale);
  const textureHeight = Math.ceil((bounds.maxY - bounds.minY) * pixeloidScale);

  // Create render texture
  const texture = RenderTexture.create({
    width: textureWidth,
    height: textureHeight,
    resolution: 1,
    scaleMode: 'nearest'
  });

  // Convert bounds to vertex space
  const offset = gameStore.mesh.vertex_to_pixeloid_offset;
  const vertexBounds = {
    minX: bounds.minX - offset.x,
    minY: bounds.minY - offset.y
  };

  // Create transform to extract just the bbox area
  const transform = new Matrix()
    .scale(pixeloidScale, pixeloidScale)
    .translate(-vertexBounds.minX * pixeloidScale, -vertexBounds.minY * pixeloidScale);

  // Render to texture (safe - no modification of original)
  this.renderer.render({
    container: objectContainer,
    target: texture,
    clear: true,
    transform: transform
  });

  return texture;
}
```

## Key Advantages

1. **No Graphics Corruption**: We never modify the original container or graphics
2. **Exact Pixel Resolution**: Extracts at `pixeloidScale × bbox` dimensions
3. **Transform Control**: The transform matrix handles scaling and positioning
4. **Clean Extraction**: The `clear: true` ensures clean texture without artifacts

## Pattern from the Documentation

The multi-pass example shows:
- Creating RenderTexture with specific dimensions
- Using `renderer.render()` with container and target
- Applying transforms for positioning
- Chaining multiple passes together

This is exactly what we need for our mirror layer - extracting specific regions at full resolution without touching the original graphics.