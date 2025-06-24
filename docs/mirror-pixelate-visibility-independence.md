# Mirror/Pixelate Layer Visibility Independence Issue

## Problem
When mirror layer visibility is turned off, the pixelate layer fails because:
1. MirrorLayerRenderer doesn't extract/cache textures when not visible
2. PixelateFilterRenderer depends on those cached textures
3. Result: No cached data = pixelate layer breaks

## Current Behavior (Broken)
```
Mirror OFF → No texture extraction → No cache → Pixelate fails
Mirror ON  → Texture extraction → Cache exists → Pixelate works
```

## Desired Behavior
```
Mirror OFF → Still extract textures → Cache exists → Pixelate works
Mirror ON  → Extract textures → Cache exists → Pixelate works
```

## Root Cause
In LayeredInfiniteCanvas:
```typescript
private renderMirrorLayer(corners: ViewportCorners, pixeloidScale: number): void {
  if (gameStore.geometry.layerVisibility.mirror) {
    this.mirrorLayerRenderer.render(corners, pixeloidScale, this.geometryRenderer)
    this.mirrorLayer.visible = true
  } else {
    this.mirrorLayer.visible = false
    // ❌ PROBLEM: Not calling render() means no texture caching!
  }
}
```

## Solution: Always Cache, Control Visibility Separately

### Option 1: Always Call Render (Recommended)
```typescript
private renderMirrorLayer(corners: ViewportCorners, pixeloidScale: number): void {
  // ALWAYS render to maintain texture cache
  this.mirrorLayerRenderer.render(corners, pixeloidScale, this.geometryRenderer)
  
  // Control visibility separately
  this.mirrorLayer.visible = gameStore.geometry.layerVisibility.mirror
}
```

### Option 2: Add Cache-Only Mode
Add a parameter to MirrorLayerRenderer.render():
```typescript
public render(
  corners: ViewportCorners,
  pixeloidScale: number,
  geometryRenderer?: GeometryRenderer,
  cacheOnly: boolean = false  // New parameter
): void {
  // Extract textures always
  // Only create/update sprites if !cacheOnly
}
```

## Implementation Plan

1. **Update LayeredInfiniteCanvas** - Always call mirror render
2. **Mirror visibility** - Control via container.visible only
3. **Test independence** - Mirror OFF, Pixelate ON should work

## Benefits
- Mirror layer acts as pure texture cache provider
- Filter layers work independently of mirror visibility
- Clean separation of concerns