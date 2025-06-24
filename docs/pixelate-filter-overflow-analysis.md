# Pixelate Filter Overflow Analysis

## Problem
Pixelated pixels are being drawn OUTSIDE the bounding boxes, which should not be possible. The red boxes show the expected bounds, but blue pixelated pixels extend beyond them.

## Potential Causes

### 1. PixelateFilter Behavior
The PixelateFilter might be extending the rendered area beyond the original sprite bounds due to how it samples pixels.

### 2. Texture Extraction Bounds
When MirrorLayerRenderer extracts textures, it might be including extra pixels or the bounds calculation might be off.

### 3. Filter Padding
Filters in PixiJS often add padding to ensure edge pixels are processed correctly.

## Code Flow Analysis

### MirrorLayerRenderer Texture Extraction
```typescript
// Calculate bounds in vertex space
const vertexBounds = {
  minX: bounds.minX - offset.x,
  maxX: bounds.maxX - offset.x,
  minY: bounds.minY - offset.y,
  maxY: bounds.maxY - offset.y
}

// Calculate texture dimensions
const textureWidth = Math.ceil((vertexBounds.maxX - vertexBounds.minX) * pixeloidScale)
const textureHeight = Math.ceil((vertexBounds.maxY - vertexBounds.minY) * pixeloidScale)
```

### Potential Issues
1. **Math.ceil()** - Could be adding extra pixels
2. **Transform matrix** - Might not be precisely aligned
3. **PixelateFilter size** - When size = pixeloidScale, it might sample beyond bounds

## Root Cause Hypothesis

The PixelateFilter works by sampling pixels in chunks. When the filter size equals the pixeloid scale, it might be:
1. Sampling from neighboring pixels
2. Extending the effective render area
3. Not respecting the exact sprite bounds

## Solution Options

### Option 1: Add Mask to Sprites
Apply a mask to each pixelated sprite to clip it to exact bounds:
```typescript
const mask = new Graphics()
mask.rect(0, 0, textureWidth, textureHeight)
mask.fill(0xffffff)
sprite.mask = mask
```

### Option 2: Adjust Texture Extraction
Extract slightly smaller area to account for filter overflow:
```typescript
const padding = 1 // pixel padding to account for filter
const textureWidth = Math.floor((vertexBounds.maxX - vertexBounds.minX) * pixeloidScale) - padding
```

### Option 3: Use Container Bounds
Apply the filter to containers that have explicit bounds set:
```typescript
container.filterArea = new Rectangle(0, 0, exactWidth, exactHeight)
```

## Investigation Needed

1. Check if we're using store bbox data correctly
2. Verify texture extraction dimensions
3. Test if PixelateFilter respects filterArea