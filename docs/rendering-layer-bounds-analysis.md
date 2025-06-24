# Rendering Layer Bounds Analysis

## Current State

### MirrorLayerRenderer (✅ CORRECT)
- Uses scale-indexed visibility cache
- Properly uses screen-normalized bounds for partially visible objects
- Has texture size limits (4096x4096, max 8192x8192 pixels) to prevent OOM
- Correctly positions sprites based on visibility state

### BoundingBoxRenderer (❌ INCORRECT)
- NOT using scale-indexed visibility cache
- Shows full object bounds instead of screen-normalized bounds
- Creates visual mismatch with actual rendered content
- Misleading for debugging since it doesn't represent what's actually being rendered

## The Real Issue

The OOM protection is actually working correctly in the rendering layers:
- MirrorLayerRenderer clips textures to screen bounds
- PixelateFilterRenderer also uses screen bounds
- Texture extraction is limited to safe sizes

The problem is that BoundingBoxRenderer shows incorrect bounds, making it appear that large off-screen areas are being rendered when they're not.

## Impact Analysis

1. **Visual Debugging**: The bbox layer is misleading, showing bounds that don't match actual rendering
2. **Performance**: No actual performance impact - rendering is correctly optimized
3. **Developer Experience**: Confusing when debugging since bbox doesn't match reality

## Solution

Update BoundingBoxRenderer to:
1. Use scale-indexed visibility cache like other renderers
2. Show screen-normalized bounds for partially visible objects
3. Match exactly what MirrorLayerRenderer is actually rendering

This will make the bbox layer an accurate debugging tool that shows the real bounds being used for texture extraction and rendering.