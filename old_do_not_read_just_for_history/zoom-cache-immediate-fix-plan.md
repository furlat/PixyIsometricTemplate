# Zoom Cache Immediate Fix Implementation Plan

## Quick Fix Strategy

The immediate fix will:
1. Include scale in texture cache key to prevent stale textures
2. Force bounds recalculation before texture extraction
3. Handle scale differences in texture region calculations

## Implementation Steps

### Step 1: Modify Texture Cache Key (MirrorLayerRenderer.ts)

Change the texture cache to use compound keys:

```typescript
// Current cache structure
private textureCache: Map<string, {
  texture: RenderTexture
  visualVersion: number
  scale: number
}> = new Map()

// Change to compound key
private getCacheKey(objectId: string, scale: number): string {
  return `${objectId}_${scale}`
}
```

### Step 2: Update Cache Operations

```typescript
private processObject(
  obj: GeometricObject,
  geometryRenderer: GeometryRenderer,
  pixeloidScale: number
): void {
  const visualVersion = this.getVisualVersion(obj)
  const cacheKey = this.getCacheKey(obj.id, pixeloidScale)
  const cache = this.textureCache.get(cacheKey)
  
  // Simplified check - cache is now scale-specific
  const needsNewTexture = !cache || cache.visualVersion !== visualVersion
  
  if (needsNewTexture) {
    this.extractAndCacheTexture(obj, geometryRenderer, pixeloidScale)
  }
  
  this.updateOrCreateSprite(obj, pixeloidScale)
}
```

### Step 3: Fix Texture Region Calculation

The issue is that texture regions are calculated using bounds at different scales. We need to ensure consistency:

```typescript
private updateOrCreateSprite(obj: GeometricObject, pixeloidScale: number): void {
  const cacheKey = this.getCacheKey(obj.id, pixeloidScale)
  const cache = this.textureCache.get(cacheKey)
  if (!cache || !obj.metadata?.bounds) return

  const isPartial = obj.metadata.visibility === 'partially-onscreen' && obj.metadata.onScreenBounds
  
  let textureToUse: Texture | RenderTexture = cache.texture
  
  if (isPartial && obj.metadata.onScreenBounds) {
    // IMPORTANT: Ensure bounds are at the same scale as the texture
    const fullBounds = obj.metadata.bounds
    const visibleBounds = obj.metadata.onScreenBounds
    
    // If texture was created at this scale, bounds should match
    const offsetX = (visibleBounds.minX - fullBounds.minX) * pixeloidScale
    const offsetY = (visibleBounds.minY - fullBounds.minY) * pixeloidScale
    const width = (visibleBounds.maxX - visibleBounds.minX) * pixeloidScale
    const height = (visibleBounds.maxY - visibleBounds.minY) * pixeloidScale
    
    // Create texture region
    const frame = new Rectangle()
    frame.x = Math.max(0, offsetX) // Ensure non-negative
    frame.y = Math.max(0, offsetY)
    frame.width = Math.min(width, cache.texture.width - frame.x)
    frame.height = Math.min(height, cache.texture.height - frame.y)
    
    textureToUse = new Texture({
      source: cache.texture.source,
      frame: frame
    })
  }
  
  // Rest of sprite creation/update...
}
```

### Step 4: Clean Up Old Scale Caches

Add cache eviction for old scales to prevent memory bloat:

```typescript
private cleanupOldScaleCaches(currentScale: number): void {
  const scalesToKeep = new Set([
    currentScale,
    currentScale - 1,
    currentScale + 1
  ].filter(s => s >= 1 && s <= 100))
  
  for (const [key, cache] of this.textureCache) {
    const [_, scaleStr] = key.split('_')
    const scale = parseInt(scaleStr)
    if (!scalesToKeep.has(scale)) {
      cache.texture.destroy()
      this.textureCache.delete(key)
    }
  }
}
```

### Step 5: Update PixelateFilterRenderer

Apply the same changes to PixelateFilterRenderer:
1. Use scale-specific cache keys when accessing mirror renderer's cache
2. Ensure texture regions are calculated with consistent scale

## Alternative Approach: Single Texture with Dynamic Regions

Instead of caching textures per scale, we could:
1. Always extract texture at a reference scale (e.g., scale 10)
2. Calculate texture regions dynamically based on current scale
3. This requires more complex math but uses less memory

```typescript
// Example of scale-adjusted region calculation
const referenceScale = 10
const scaleRatio = pixeloidScale / referenceScale

const adjustedOffsetX = offsetX * scaleRatio
const adjustedOffsetY = offsetY * scaleRatio
const adjustedWidth = width * scaleRatio
const adjustedHeight = height * scaleRatio
```

## Testing Plan

1. **Basic Zoom Test**
   - Create large object (100x100 pixeloids)
   - Position so only 25% is visible
   - Zoom from 1x to 100x
   - Verify correct portion is displayed

2. **Pan While Zoomed**
   - At 50x zoom, pan object in/out of view
   - Verify texture regions update correctly

3. **Rapid Zoom**
   - Quickly zoom in/out
   - Check for visual artifacts or incorrect regions

4. **Memory Test**
   - Monitor texture cache size
   - Verify old scales are cleaned up

## Rollback Plan

If issues arise:
1. Remove scale from cache key
2. Force texture regeneration on every zoom (performance impact)
3. Disable texture regions for partially visible objects temporarily