# Mirror Layer Zoom Texture Extraction Fix

## Problem
Objects display correctly when moving off-screen with WASD, but show rectangular artifacts when they're off-screen during zoom changes. This is because texture extraction uses clipped bounds when creating textures at new zoom levels.

## Root Cause Analysis

### Why WASD Movement Works
- Scale remains constant
- Texture was extracted when object was fully visible
- Texture region logic correctly clips the existing full texture

### Why Zoom Changes Fail
- Scale changes require new texture extraction
- If object is partially off-screen during zoom, `extractAndCacheTexture` passes clipped bounds
- This causes the entire object geometry to be squashed into the smaller texture

## Solution

In `MirrorLayerRenderer.extractAndCacheTexture()`, always use full object bounds for texture extraction:

```typescript
// WRONG - Current implementation
const bounds = (visibilityData?.visibility === 'partially-onscreen' && visibilityData?.onScreenBounds)
  ? visibilityData.onScreenBounds  // This causes distortion!
  : obj.metadata.bounds

// CORRECT - Always use full bounds
const bounds = obj.metadata.bounds  // Always extract full object
```

The texture region logic in `updateOrCreateSprite()` already handles clipping correctly - it just needs a proper full texture to work with.

## Implementation

Change line 192-195 in `MirrorLayerRenderer.ts`:

```typescript
// Always use full bounds for texture extraction to prevent distortion
const bounds = obj.metadata.bounds
const texture = this.extractObjectTexture(objectContainer, bounds, pixeloidScale)
```

This ensures:
1. Textures always contain the full object geometry
2. Texture regions correctly show only visible portions
3. No distortion occurs when objects are partially off-screen during zoom