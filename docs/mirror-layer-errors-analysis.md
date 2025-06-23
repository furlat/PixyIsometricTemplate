# Mirror Layer Error Analysis

## Current Issues

### 1. Scale Mismatch Issue (UPDATED UNDERSTANDING)
**Problem**: The extracted textures appear pixelated/upscaled incorrectly
- We want to extract at FULL PIXEL resolution (pixeloidScale × bbox size)
- A 10x10 pixeloid bbox at scale 10 should produce a 100x100 pixel texture
- The sprite should display at its natural pixel resolution

**Current Bug**:
- Textures are being extracted at the wrong resolution
- The transform matrix is not correctly set up for pixel-perfect extraction

### 2. Graphics Context Corruption
**Error**: `Cannot read properties of null (reading 'clear')`
```
Uncaught TypeError: Cannot read properties of null (reading 'clear')
    at _GraphicsContext2.clear (chunk-IEIK755H.js?v=1b686805:8259:22)
    at _Graphics._callContextMethod (chunk-IEIK755H.js?v=1b686805:10122:25)
    at _Graphics.clear (chunk-IEIK755H.js?v=1b686805:10554:17)
    at GeometryRenderer.updateGeometricObjectWithCoordinateConversion (GeometryRenderer.ts:110:15)
```

**Root Cause**:
- The `clone()` method on Graphics objects doesn't properly clone the internal context
- When we clone and manipulate the graphics, it corrupts the original graphics object
- This causes GeometryRenderer to crash when it tries to clear the graphics
- **This breaks ALL functionality** - camera movement, scale changes, etc.

### 3. Layer Toggle Not Working
**Problem**: Once the mirror layer is enabled, it cannot be disabled
- The container is not being properly cleared when the layer is disabled
- Sprites remain in memory and visible even when layer visibility is false

## Correct Understanding

### What We Want
1. **Pixeloid-perfect bounding boxes**: Use object bounds in pixeloid coordinates
2. **Full pixel resolution textures**: Extract all pixels within the bbox
3. **Pixel-perfect display**: Show sprites at their natural pixel resolution

### Example at Scale 10
- Object bbox: `{minX: 20, minY: 30, maxX: 30, maxY: 40}` (in pixeloids)
- Texture size: 100×100 pixels (10 pixeloids × 10 pixels/pixeloid)
- Sprite position: At pixeloid coordinates (20, 30) in the scene
- Sprite scale: 1:1 (displays 100×100 pixels)

## Root Cause Analysis

### Current Implementation Problems
1. **Wrong texture dimensions**: Not multiplying bbox size by pixeloidScale
2. **Wrong transform**: Not extracting at the correct pixel resolution
3. **Graphics interference**: Cloning corrupts the original graphics

### Missing Features
1. **Scale-aware caching**: Need to cache textures per scale level
2. **Eviction policy**: Memory management for texture cache
3. **Scale change handling**: Re-extract textures when scale changes

## Proposed Solutions

### Solution 1: Correct Texture Extraction
```typescript
// Calculate texture size at current pixel resolution
const textureWidth = Math.ceil((bounds.maxX - bounds.minX) * pixeloidScale);
const textureHeight = Math.ceil((bounds.maxY - bounds.minY) * pixeloidScale);

// Extract at full pixel resolution
const transform = new Matrix()
  .scale(pixeloidScale, pixeloidScale)
  .translate(-vertexBounds.minX * pixeloidScale, -vertexBounds.minY * pixeloidScale);
```

### Solution 2: Avoid Graphics Cloning
Instead of cloning graphics, we need to:
1. Create a render texture from the object container
2. Or use a different extraction method that doesn't interfere with the original
3. Ensure GeometryRenderer's graphics remain untouched

### Solution 3: Scale-Aware Texture Cache
```typescript
interface TextureCache {
  textures: Map<number, Map<string, RenderTexture>>; // scale -> objectId -> texture
  maxScaleLevels: number; // e.g., keep last 3 scale levels
  
  getTexture(objectId: string, scale: number): RenderTexture | null;
  setTexture(objectId: string, scale: number, texture: RenderTexture): void;
  evictOldestScale(): void;
}
```

### Solution 4: Fix Layer Management
```typescript
// Always clear container first
this.mirrorLayer.removeChildren();

if (gameStore.geometry.layerVisibility.mirror) {
  // Only add if visible
  this.mirrorLayerRenderer.render(corners, pixeloidScale, this.geometryRenderer);
  this.mirrorLayer.addChild(this.mirrorLayerRenderer.getContainer());
}

// Set visibility
this.mirrorLayer.visible = gameStore.geometry.layerVisibility.mirror;
```

## Implementation Strategy

### Phase 1: Fix Critical Bugs
1. Stop using `clone()` on graphics
2. Fix the container clearing issue
3. Ensure no interference with GeometryRenderer

### Phase 2: Correct Texture Extraction
1. Extract at full pixel resolution
2. Position sprites at pixeloid coordinates
3. Display at natural pixel size

### Phase 3: Add Scale Caching
1. Implement scale-aware texture cache
2. Re-extract on scale changes
3. Add eviction policy for memory management

## Expected Result
- Sprites show full pixel detail within pixeloid bounds
- No graphics corruption or crashes
- Camera movement and scale changes work normally
- Textures are cached per scale level
- Layer can be toggled on/off cleanly

## Key Insight
The mirror layer should capture the EXACT pixel appearance of the geometry layer, using pixeloid-perfect bounding boxes to define what to capture, but extracting at full pixel resolution for perfect visual fidelity.