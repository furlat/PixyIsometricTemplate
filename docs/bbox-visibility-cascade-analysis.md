# BBox Visibility Cascade Analysis

## The Problem Chain

### 1. BoundingBoxRenderer doesn't use visibility cache
```typescript
// Current (WRONG):
const bounds = convertedObj.metadata.bounds  // Always full bounds

// Should be:
const visibilityData = obj.metadata.visibilityCache?.get(pixeloidScale)
const bounds = (visibilityData?.visibility === 'partially-onscreen' && visibilityData?.onScreenBounds)
  ? visibilityData.onScreenBounds  // Use clipped bounds
  : obj.metadata.bounds             // Full bounds only if fully visible
```

### 2. Double offset application
BoundingBoxRenderer applies offset twice:
- In `convertObjectToVertexCoordinates()`
- Again in `renderBoundingBoxRectangle()`

This causes misalignment between the bbox and actual geometry.

### 3. The cascade to MirrorLayerRenderer

When bbox is wrong, it indicates:
- Visibility calculation might be incorrect
- Screen bounds normalization might be faulty
- Old and new systems are conflicting

MirrorLayerRenderer tries to use the visibility cache, but if the underlying visibility calculation is wrong, it will:
- Extract textures with wrong dimensions
- Create aliased/incorrect rendering
- Potentially cause performance issues with oversized textures

## The Fix

1. Make BoundingBoxRenderer use visibility cache
2. Remove double offset application
3. Ensure all renderers use the same visibility/bounds system