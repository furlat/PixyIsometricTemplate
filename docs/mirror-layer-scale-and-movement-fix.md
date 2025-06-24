# Mirror Layer Scale and Movement Bug Fixes

## Bug 1: Zoom/Scale Cache Issue
**Problem**: The cache is not aware of pixeloid scale changes. When zooming, cached textures need to be re-extracted at the new scale.

### Root Cause
- Textures are cached at a specific pixeloid scale
- When zoom changes, the cached texture is at the wrong resolution
- The cache key doesn't include the scale, so it thinks the texture is still valid

### Solution
Add scale-aware caching:
```typescript
// In MirrorLayerRenderer
private textureCache: Map<string, {
  texture: RenderTexture
  version: number
  bounds: any
  scale: number  // ADD: Track the scale when texture was created
}> = new Map()

// In extractAndCacheTexture, add scale tracking:
this.textureCache.set(obj.id, {
  texture,
  version: this.getObjectVersion(obj),
  bounds,
  scale: pixeloidScale  // Store the scale
})

// In processObject, check scale too:
const cache = this.textureCache.get(obj.id)
if (cache && cache.scale === pixeloidScale && cache.version === currentVersion) {
  // Use cached texture
} else {
  // Re-extract at new scale
}
```

## Bug 2: Object Movement Not Updating Sprites
**Problem**: When dragging objects, the mirror sprites don't move - they stay at the original position.

### Root Cause
- The version calculation doesn't include position changes
- Moving an object doesn't trigger texture re-extraction or sprite repositioning

### Solution
1. **Fix version calculation** to include position:
```typescript
private getObjectVersion(obj: GeometricObject): number {
  let version = obj.createdAt
  
  // Add visual properties
  if ('color' in obj) version += obj.color
  if ('strokeWidth' in obj) version += (obj as any).strokeWidth * 1000
  if ('fillColor' in obj) version += (obj as any).fillColor || 0
  
  // ADD: Include position in version (multiply by prime numbers for uniqueness)
  if ('x' in obj) version += Math.round((obj as any).x) * 7
  if ('y' in obj) version += Math.round((obj as any).y) * 11
  if ('centerX' in obj) version += Math.round((obj as any).centerX) * 13
  if ('centerY' in obj) version += Math.round((obj as any).centerY) * 17
  if ('anchorX' in obj) version += Math.round((obj as any).anchorX) * 19
  if ('anchorY' in obj) version += Math.round((obj as any).anchorY) * 23
  
  // Size properties
  if ('width' in obj) version += (obj as any).width * 100
  if ('height' in obj) version += (obj as any).height * 100
  if ('radius' in obj) version += (obj as any).radius * 100
  
  return version
}
```

2. **Separate texture extraction from sprite positioning**:
```typescript
private processObject(
  obj: GeometricObject,
  geometryRenderer: GeometryRenderer,
  pixeloidScale: number
): void {
  const currentVersion = this.getObjectVersion(obj)
  const cachedVersion = this.objectVersions.get(obj.id) || 0
  const cache = this.textureCache.get(obj.id)
  
  // Check if we need new texture (visual changes or scale change)
  const needsNewTexture = !cache || 
                         cache.scale !== pixeloidScale ||
                         this.hasVisualChanges(obj, cachedVersion, currentVersion)
  
  if (needsNewTexture) {
    this.extractAndCacheTexture(obj, geometryRenderer, pixeloidScale)
  }
  
  // ALWAYS update sprite position (even if texture is cached)
  this.updateOrCreateSprite(obj, pixeloidScale)
  this.objectVersions.set(obj.id, currentVersion)
}

private hasVisualChanges(obj: GeometricObject, oldVersion: number, newVersion: number): boolean {
  // Check if only position changed (no need for new texture)
  // This is a simplified check - could be more sophisticated
  return true // For now, always re-extract on any change
}
```

## Full Implementation Plan

1. **Update MirrorLayerRenderer texture cache structure** to include scale
2. **Fix version calculation** to detect position changes
3. **Separate concerns**: texture extraction (expensive) vs sprite positioning (cheap)
4. **Add scale invalidation**: When scale changes, mark all textures as needing update
5. **Optimize**: Only re-extract textures when visual properties change, not position

## Quick Fix for Testing
For immediate testing, the simplest fix is to always update sprite position:

```typescript
// In MirrorLayerRenderer.processObject
// Always call updateOrCreateSprite regardless of version
this.updateOrCreateSprite(obj, pixeloidScale)
```

This ensures sprites always move, even if we're using cached textures.