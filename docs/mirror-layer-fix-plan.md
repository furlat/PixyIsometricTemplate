# Mirror Layer Fix Plan - Final Understanding

## How the System Actually Works

1. **ECS Store**: Objects in pixeloid coordinates (e.g., 50, 50)
2. **GeometryRenderer**: 
   - Converts to vertex coords (pixeloid - offset)
   - Draws at vertex size (e.g., 10x10)
3. **Camera Transform**: Scales EVERYTHING by pixeloidScale (e.g., ×10)
4. **Result**: 10×10 vertex → 100×100 screen pixels ✓

## The Mirror Layer Problem

In `extractObjectTexture()`, we're doing:
```typescript
const textureWidth = Math.ceil((bounds.maxX - bounds.minX) * pixeloidScale)  // WRONG!
```

We're extracting at SCREEN size, but the texture goes under camera transform which scales AGAIN.

## The Simple Fix

Extract at VERTEX size (no multiplication), let camera do ALL scaling:

```typescript
// In extractObjectTexture()
const textureWidth = Math.ceil(vertexBounds.maxX - vertexBounds.minX)   // No * pixeloidScale
const textureHeight = Math.ceil(vertexBounds.maxY - vertexBounds.minY)  // No * pixeloidScale

// And in the transform:
const transform = new Matrix()
  .translate(-vertexBounds.minX, -vertexBounds.minY)  // No scaling!
```

## Why This Works

- GeometryRenderer: Draws 10×10 at vertex, camera scales to 100×100 screen
- MirrorLayer: Extracts 10×10 at vertex, camera scales to 100×100 screen
- Both match perfectly!

The camera transform is doing its job correctly - we just need to extract at the same resolution that GeometryRenderer draws at.