# Scale-Indexed Visibility Cache Implementation

## Overview

This document summarizes the implementation of the scale-indexed visibility cache system to fix the OOM (Out of Memory) bug that occurs when drawing at pixel size 1 and then zooming to high levels like 100x.

## Problem

When zooming with objects drawn at scale 1, the visibility calculation and shader application areas were not properly constrained to the screen bounds, leading to:
- Massive texture extraction areas (millions of pixels)
- GPU shader application on enormous off-screen areas
- Memory exhaustion and crashes

## Solution

Implemented a scale-indexed visibility cache that:
1. Stores visibility state per scale level in object metadata
2. Constrains calculations to screen bounds
3. Cleans up old scale data to prevent memory bloat

## Implementation Details

### 1. Type System Updates (`app/src/types/index.ts`)

Added scale-indexed visibility cache to `GeometricMetadata`:

```typescript
interface GeometricMetadata {
  center: PixeloidCoordinate
  bounds: BoundingBox
  visibilityCache: Map<number, {
    visibility: ObjectVisibility
    onScreenBounds?: BoundingBox
  }>
}
```

### 2. Geometry Helper Updates (`app/src/game/GeometryHelper.ts`)

Updated all metadata calculation functions to initialize the visibility cache:
- `calculatePointMetadata`
- `calculateLineMetadata`
- `calculateCircleMetadata`
- `calculateRectangleMetadata`
- `calculateDiamondMetadata`

Each now includes: `visibilityCache: new Map()`

### 3. Game Store Updates (`app/src/store/gameStore.ts`)

Added cleanup function and updated visibility calculations:

```typescript
function cleanupVisibilityCache(cache: Map<number, any>, currentScale: number): void {
  const scalesToKeep = new Set([currentScale, currentScale - 1, currentScale + 1])
  
  for (const [scale] of cache) {
    if (!scalesToKeep.has(scale) && scale >= 1 && scale <= 100) {
      cache.delete(scale)
    }
  }
}
```

Updated all visibility update points:
- `setPixeloidScale` - zoom changes
- `setCameraPosition` - camera movement
- `setWindowSize` - window resize
- `updateObjectVisibility` - individual object updates
- `updateAllObjectsVisibility` - batch updates

### 4. Renderer Updates

#### MirrorLayerRenderer (`app/src/game/MirrorLayerRenderer.ts`)
- Updated to use scale-indexed visibility cache when filtering visible objects
- Checks `visibilityCache.get(pixeloidScale)` for visibility data
- Falls back to calculating and caching if not present

#### PixelateFilterRenderer (`app/src/game/PixelateFilterRenderer.ts`)
- Similar updates to use scale-indexed visibility cache
- Properly handles partial visibility bounds from the cache

### 5. Memory Management

The implementation includes:
- Cache cleanup that keeps only current scale ±1
- Prevents accumulation of visibility data across zoom levels
- Constrains filter areas to screen bounds to prevent GPU OOM

## Benefits

1. **Memory Efficiency**: Only stores visibility for relevant scales
2. **Performance**: Cached visibility calculations reduce redundant computation
3. **Stability**: Prevents OOM by constraining calculations to screen bounds
4. **Scalability**: Works at any zoom level without memory bloat

## Testing

To verify the fix:
1. Draw objects at pixel size 1
2. Zoom to 100x scale
3. Observe that:
   - No OOM errors occur
   - Visibility calculations remain fast
   - Memory usage remains stable
   - Objects render correctly at all scales