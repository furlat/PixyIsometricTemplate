# Mirror Layer Fix Implementation

## Changes Required in MirrorLayerRenderer

### 1. Update Cache Structure (lines 23-27)
```typescript
// Texture cache with scale tracking
private textureCache: Map<string, {
  texture: RenderTexture
  visualVersion: number  // Only visual properties, not position
  scale: number         // Track the scale when texture was created
}> = new Map()
```

### 2. Add Visual Version Method (new method)
```typescript
/**
 * Get visual version number (excludes position)
 */
private getVisualVersion(obj: GeometricObject): number {
  let version = obj.createdAt
  
  // Visual properties only
  if ('color' in obj) version += obj.color
  if ('strokeWidth' in obj) version += (obj as any).strokeWidth * 1000
  if ('fillColor' in obj) version += (obj as any).fillColor || 0
  
  // Size properties (not position)
  if ('width' in obj) version += (obj as any).width * 100
  if ('height' in obj) version += (obj as any).height * 100
  if ('radius' in obj) version += (obj as any).radius * 100
  
  return version
}
```

### 3. Update processObject Method (lines 82-100)
```typescript
private processObject(
  obj: GeometricObject,
  geometryRenderer: GeometryRenderer,
  pixeloidScale: number
): void {
  const visualVersion = this.getVisualVersion(obj)
  const cache = this.textureCache.get(obj.id)
  
  // Check if we need to extract a new texture
  const needsNewTexture = !cache || 
                         cache.visualVersion !== visualVersion || 
                         cache.scale !== pixeloidScale
  
  if (needsNewTexture) {
    console.log(`MirrorLayerRenderer: Object ${obj.id} needs new texture (visual change or scale change)`)
    this.extractAndCacheTexture(obj, geometryRenderer, pixeloidScale)
  }
  
  // ALWAYS update sprite position (even with cached texture)
  this.updateOrCreateSprite(obj, pixeloidScale)
}
```

### 4. Update extractAndCacheTexture Method (lines 128-134)
```typescript
// Cache new texture with scale tracking
this.textureCache.set(obj.id, {
  texture,
  visualVersion: this.getVisualVersion(obj),
  scale: pixeloidScale  // Store the scale
})
```

### 5. Fix updateOrCreateSprite Method (lines 220-231)
```typescript
// Position sprite using CURRENT bounds from object metadata
const currentBounds = obj.metadata.bounds
const offset = gameStore.mesh.vertex_to_pixeloid_offset
const vertexPos = {
  x: currentBounds.minX - offset.x,  // Use current position!
  y: currentBounds.minY - offset.y
}
const screenPos = CoordinateCalculations.vertexToScreen(
  { __brand: 'vertex' as const, x: vertexPos.x, y: vertexPos.y },
  pixeloidScale
)
sprite.position.set(screenPos.x, screenPos.y)
```

### 6. Keep Original getObjectVersion (rename for clarity)
```typescript
/**
 * Get full version including position (kept for compatibility)
 */
private getFullObjectVersion(obj: GeometricObject): number {
  // ... existing implementation ...
}
```

## Complete Fixed processObject Flow

```typescript
private processObject(
  obj: GeometricObject,
  geometryRenderer: GeometryRenderer,
  pixeloidScale: number
): void {
  const visualVersion = this.getVisualVersion(obj)
  const cache = this.textureCache.get(obj.id)
  
  // Check if we need to extract a new texture
  const needsNewTexture = !cache || 
                         cache.visualVersion !== visualVersion || 
                         cache.scale !== pixeloidScale
  
  if (needsNewTexture) {
    console.log(`MirrorLayerRenderer: Object ${obj.id} needs new texture (visual=${visualVersion}, scale=${pixeloidScale})`)
    this.extractAndCacheTexture(obj, geometryRenderer, pixeloidScale)
  }
  
  // ALWAYS update sprite position (uses current object bounds)
  this.updateOrCreateSprite(obj, pixeloidScale)
}
```

## Testing Plan

1. **Test Scale Changes**:
   - Draw a circle
   - Zoom in/out
   - Verify mirror layer updates texture at new scale

2. **Test Movement**:
   - Draw a circle
   - Drag it around
   - Verify mirror layer sprite moves WITHOUT re-extracting texture

3. **Test Visual Changes**:
   - Draw a circle
   - Change its color or size
   - Verify mirror layer re-extracts texture

4. **Test Performance**:
   - Create many objects
   - Move them all
   - Verify smooth performance (no texture re-extraction spam)

## Success Metrics

- ✅ Zoom causes texture re-extraction at new scale
- ✅ Movement updates sprite position without texture re-extraction
- ✅ Visual property changes trigger texture re-extraction
- ✅ Performance remains smooth with many moving objects
- ✅ Mirror layer perfectly matches geometry layer at all times