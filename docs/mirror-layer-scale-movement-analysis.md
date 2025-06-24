# Mirror Layer Scale and Movement Issues - Complete Analysis

## Understanding the Coordinate Systems

### GeometryRenderer Flow (Every Frame)
1. Objects stored in **pixeloid coordinates** (world space)
2. Converts to **vertex coordinates**: `pixeloid - offset`
3. Converts to **screen coordinates**: `vertex * scale`
4. Renders at screen coordinates

### MirrorLayerRenderer Current Issues

## Bug 1: Scale/Zoom Not Updating Textures

**Root Cause**: 
- Textures are extracted at a specific scale but the cache doesn't track scale
- When zooming, the cached texture is at wrong resolution

**Evidence** (MirrorLayerRenderer lines 23-27):
```typescript
private textureCache: Map<string, {
  texture: RenderTexture
  version: number
  bounds: any  // No scale tracking!
}> = new Map()
```

## Bug 2: Movement Not Updating Sprite Position

**Root Cause**:
- `updateOrCreateSprite` uses **cached bounds** instead of **current bounds**
- The bounds are stored when texture is created and never updated

**Evidence** (MirrorLayerRenderer lines 220-231):
```typescript
// Position sprite in screen coordinates (same as GeometryRenderer now does)
const offset = gameStore.mesh.vertex_to_pixeloid_offset
const vertexPos = {
  x: cache.bounds.minX - offset.x,  // Using OLD cached bounds!
  y: cache.bounds.minY - offset.y   // Not current position!
}
```

**The Fix**: Should use `obj.metadata.bounds` (current position) not `cache.bounds` (old position)

## Why Version Tracking Doesn't Help

The version calculation (lines 243-258) does include position:
```typescript
if ('x' in obj) version += (obj as any).x * 10
if ('y' in obj) version += (obj as any).y * 10
```

But this causes texture re-extraction on movement, which is inefficient. We want to:
- Re-extract texture only on visual changes or scale changes
- Update sprite position without re-extracting texture

## Correct Implementation Strategy

### 1. Separate Concerns
- **Texture extraction**: Only when visual properties or scale change
- **Sprite positioning**: Every frame based on current object position

### 2. Enhanced Cache Structure
```typescript
private textureCache: Map<string, {
  texture: RenderTexture
  visualVersion: number  // Only visual properties
  scale: number         // Track scale for re-extraction
  // Remove bounds - always use current from obj.metadata
}> = new Map()
```

### 3. Split Version Calculation
```typescript
private getVisualVersion(obj: GeometricObject): number {
  // Only properties that affect appearance, NOT position
  let version = obj.createdAt
  if ('color' in obj) version += obj.color
  if ('strokeWidth' in obj) version += (obj as any).strokeWidth * 1000
  if ('fillColor' in obj) version += (obj as any).fillColor || 0
  if ('width' in obj) version += (obj as any).width * 100
  if ('height' in obj) version += (obj as any).height * 100
  if ('radius' in obj) version += (obj as any).radius * 100
  return version
}
```

### 4. Fix processObject
```typescript
private processObject(
  obj: GeometricObject,
  geometryRenderer: GeometryRenderer,
  pixeloidScale: number
): void {
  const visualVersion = this.getVisualVersion(obj)
  const cache = this.textureCache.get(obj.id)
  
  // Re-extract texture only if:
  // 1. No cache exists
  // 2. Visual properties changed
  // 3. Scale changed
  if (!cache || 
      cache.visualVersion !== visualVersion || 
      cache.scale !== pixeloidScale) {
    this.extractAndCacheTexture(obj, geometryRenderer, pixeloidScale)
  }
  
  // ALWAYS update sprite position (uses current bounds)
  this.updateOrCreateSprite(obj, pixeloidScale)
}
```

### 5. Fix updateOrCreateSprite
```typescript
private updateOrCreateSprite(obj: GeometricObject, pixeloidScale: number): void {
  const cache = this.textureCache.get(obj.id)
  if (!cache || !obj.metadata?.bounds) return

  // ... sprite creation code ...

  // Use CURRENT bounds from object, not cached bounds
  const currentBounds = obj.metadata.bounds
  const offset = gameStore.mesh.vertex_to_pixeloid_offset
  const vertexPos = {
    x: currentBounds.minX - offset.x,  // Current position!
    y: currentBounds.minY - offset.y
  }
  const screenPos = CoordinateCalculations.vertexToScreen(
    { __brand: 'vertex' as const, x: vertexPos.x, y: vertexPos.y },
    pixeloidScale
  )
  sprite.position.set(screenPos.x, screenPos.y)
}
```

## Summary

The fixes needed:
1. **Track scale in cache** to know when to re-extract
2. **Use current bounds** for sprite positioning, not cached
3. **Separate visual version** from position tracking
4. **Always update position**, only re-extract texture when needed

This achieves:
- ✅ Textures update on zoom (scale tracking)
- ✅ Sprites move with objects (current bounds)
- ✅ Efficient caching (no unnecessary re-extraction)
- ✅ Perfect mirror of geometry layer