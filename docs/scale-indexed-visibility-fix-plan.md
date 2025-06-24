# Scale-Indexed Visibility Fix Plan

## Problem Analysis

### Current Issue
When objects move partially out of bounds during zoom operations, there's a visible aliasing effect. This happens because:

1. **Scale-Dependent Data Without Indexing**: The `onScreenBounds` and `visibility` properties in object metadata are calculated based on the current scale but stored without any scale tracking.

2. **Stale Data Usage**: When zoom level changes, the renderers (MirrorLayerRenderer and PixelateFilterRenderer) read these stale bounds that were calculated at a different scale, causing misalignment.

3. **Race Conditions**: The visibility data can be updated by zoom operations while renderers are reading it, leading to inconsistent state.

### Current Data Flow
```
User zooms → gameStore.setPixeloidScale() → Updates all objects' visibility
                                          ↓
                                    Stores in obj.metadata.visibility/onScreenBounds
                                          ↓
MirrorLayerRenderer reads stale data  ←  Race condition  → PixelateFilterRenderer reads stale data
                                          ↓
                                    Texture regions miscalculated
                                          ↓
                                    Visible aliasing effect
```

### Root Cause
The visibility calculations in `GeometryHelper.calculateVisibilityState()` use the current `pixeloidScale` to determine screen intersection bounds, but these scale-dependent results are stored directly in the object metadata without any scale indexing. This is inconsistent with how we handle textures (which are now scale-indexed after the previous fix).

## Solution: Scale-Indexed Visibility Cache

### Design Principles
1. **Consistency**: Use the same scale-indexing pattern as the texture cache fix
2. **Safety**: Prevent race conditions by ensuring each scale has its own visibility data
3. **Performance**: Cache visibility calculations per scale to avoid redundant computations
4. **Memory Management**: Clean up old scale caches to prevent memory bloat

### Implementation Plan

#### 1. Update Type Definitions (`app/src/types/index.ts`)

Add new visibility cache structure to GeometricMetadata:

```typescript
export interface GeometricMetadata {
  center: PixeloidCoordinate
  bounds: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
  // Remove these scale-dependent properties:
  // visibility?: 'fully-onscreen' | 'partially-onscreen' | 'offscreen'
  // onScreenBounds?: any
  
  // Add scale-indexed visibility cache:
  visibilityCache?: Map<number, {
    visibility: 'fully-onscreen' | 'partially-onscreen' | 'offscreen'
    onScreenBounds?: {
      minX: number
      maxX: number
      minY: number
      maxY: number
      textureOffsetX: number
      textureOffsetY: number
    }
  }>
}
```

#### 2. Update GeometryHelper (`app/src/game/GeometryHelper.ts`)

Modify metadata calculation functions to initialize the visibility cache:

```typescript
// In calculatePointMetadata, calculateLineMetadata, etc.
static calculatePointMetadata(point: { x: number; y: number }): GeometricMetadata {
  // ... existing code ...
  return {
    center: { __brand: 'pixeloid', x: point.x, y: point.y },
    bounds: {
      minX: pixeloidX,
      maxX: pixeloidX + 1,
      minY: pixeloidY,
      maxY: pixeloidY + 1
    },
    visibilityCache: new Map() // Initialize empty cache
  }
}
```

Keep `calculateVisibilityState` as a pure function (no changes needed).

#### 3. Update Game Store (`app/src/store/gameStore.ts`)

Modify visibility update logic to use scale-indexed cache:

```typescript
// In setPixeloidScale (around line 274)
// Update visibility for all objects after zoom
for (const obj of gameStore.geometry.objects) {
  if (!obj.metadata) continue
  
  // Initialize visibility cache if needed
  if (!obj.metadata.visibilityCache) {
    obj.metadata.visibilityCache = new Map()
  }
  
  const visibilityInfo = GeometryHelper.calculateVisibilityState(obj, clampedScale)
  
  // Store in scale-indexed cache
  obj.metadata.visibilityCache.set(clampedScale, {
    visibility: visibilityInfo.visibility,
    onScreenBounds: visibilityInfo.onScreenBounds
  })
  
  // Clean up old scales (keep current ±1)
  cleanupVisibilityCache(obj.metadata.visibilityCache, clampedScale)
}

// Add helper function for cache cleanup
function cleanupVisibilityCache(cache: Map<number, any>, currentScale: number): void {
  const scalesToKeep = new Set([currentScale, currentScale - 1, currentScale + 1])
  
  for (const [scale] of cache) {
    if (!scalesToKeep.has(scale) && scale >= 1 && scale <= 100) {
      cache.delete(scale)
    }
  }
}
```

Apply the same pattern to `setVertexToPixeloidOffset` (around line 308).

#### 4. Update MirrorLayerRenderer (`app/src/game/MirrorLayerRenderer.ts`)

Update visibility filtering to use scale-indexed cache:

```typescript
// In render method (around line 54)
const visibleObjects = gameStore.geometry.objects.filter(obj => {
  if (!obj.isVisible || !obj.metadata) return false
  
  // Get visibility from scale-indexed cache
  const visibilityData = obj.metadata.visibilityCache?.get(pixeloidScale)
  
  if (!visibilityData) {
    // Calculate and cache if not present
    if (!obj.metadata.visibilityCache) {
      obj.metadata.visibilityCache = new Map()
    }
    
    const visibilityInfo = GeometryHelper.calculateVisibilityState(obj, pixeloidScale)
    obj.metadata.visibilityCache.set(pixeloidScale, {
      visibility: visibilityInfo.visibility,
      onScreenBounds: visibilityInfo.onScreenBounds
    })
    
    return visibilityInfo.visibility !== 'offscreen'
  }
  
  return visibilityData.visibility !== 'offscreen'
})
```

Update bounds reading in `processObject` and `updateOrCreateSprite`:

```typescript
// In processObject (around line 123)
const visibilityData = obj.metadata.visibilityCache?.get(pixeloidScale)
const isPartial = visibilityData?.visibility === 'partially-onscreen' && visibilityData.onScreenBounds
const bounds = isPartial ? visibilityData.onScreenBounds : obj.metadata.bounds
```

#### 5. Update PixelateFilterRenderer (`app/src/game/PixelateFilterRenderer.ts`)

Apply the same visibility filtering pattern:

```typescript
// In render method (around line 54)
const visibleObjects = gameStore.geometry.objects.filter(obj => {
  if (!obj.isVisible || !obj.metadata) return false
  
  // Get visibility from scale-indexed cache
  const visibilityData = obj.metadata.visibilityCache?.get(pixeloidScale)
  
  if (!visibilityData) {
    // Calculate and cache if not present
    if (!obj.metadata.visibilityCache) {
      obj.metadata.visibilityCache = new Map()
    }
    
    const visibilityInfo = GeometryHelper.calculateVisibilityState(obj, pixeloidScale)
    obj.metadata.visibilityCache.set(pixeloidScale, {
      visibility: visibilityInfo.visibility,
      onScreenBounds: visibilityInfo.onScreenBounds
    })
    
    return visibilityInfo.visibility !== 'offscreen'
  }
  
  return visibilityData.visibility !== 'offscreen'
})
```

Update bounds reading for texture regions:

```typescript
// In the texture region calculation (around line 104)
const visibilityData = obj.metadata.visibilityCache?.get(pixeloidScale)
const isPartial = visibilityData?.visibility === 'partially-onscreen' && visibilityData.onScreenBounds

if (isPartial && visibilityData.onScreenBounds) {
  const fullBounds = obj.metadata.bounds
  const visibleBounds = visibilityData.onScreenBounds
  // ... rest of texture region calculation
}
```

#### 6. Clean Up Other References

Search for and update any other references to `obj.metadata.visibility` or `obj.metadata.onScreenBounds` throughout the codebase to use the scale-indexed cache instead.

### Expected Outcome

1. **No More Aliasing**: Each zoom level will have its own correctly calculated visibility bounds
2. **No Race Conditions**: Scale-indexed data prevents mixing of calculations from different zoom levels
3. **Consistent Architecture**: Mirrors the successful texture cache fix pattern
4. **Memory Efficient**: Automatic cleanup prevents unbounded cache growth
5. **Performance**: Caching prevents redundant visibility calculations at the same scale

### Testing Plan

1. Create large objects that extend beyond screen bounds
2. Zoom in/out while objects are partially visible
3. Verify no aliasing or misalignment occurs
4. Check memory usage doesn't grow unbounded with many zoom operations
5. Test with WASD movement to ensure visibility updates work correctly