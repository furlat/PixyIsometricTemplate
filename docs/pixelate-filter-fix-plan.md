# Pixelate Filter Fix Plan

## Problem Summary
The pixelate filter is not properly aligned with the geometry because it's using a naive approach to positioning sprites. It needs to follow the same coordinate system logic as MirrorLayerRenderer.

## Current vs Desired Architecture

### Current (Broken)
```
GeometryRenderer → Textures → MirrorLayerRenderer → Sprite Positions → PixelateFilterRenderer
                                                           ↓
                                                    (Wrong coordinates)
```

### Desired (Option A - Direct Filter)
```
GeometryRenderer → Textures → MirrorLayerRenderer → Container with Sprites
                                                           ↓
                                                    Apply Filter Directly
```

### Desired (Option B - Proper Coordinates)
```
GeometryRenderer → Textures → MirrorLayerRenderer → Cached Textures
                                    ↓                      ↓
                              Object Bounds          PixelateFilterRenderer
                                                    (Uses same positioning logic)
```

## Recommended Solution: Direct Filter Application

Instead of creating duplicate sprites, apply the pixelate filter directly to the mirror layer's container.

### Implementation Steps

#### Step 1: Expose Mirror Container
In MirrorLayerRenderer:
```typescript
/**
 * Get the container holding all mirror sprites for direct filter application
 */
public getMirrorContainer(): Container {
  return this.container // or whatever container holds the sprites
}
```

#### Step 2: Simplify PixelateFilterRenderer
```typescript
export class PixelateFilterRenderer {
  private pixelateFilter: PixelateFilter
  private targetContainer: Container | null = null
  
  constructor() {
    this.pixelateFilter = new PixelateFilter(10)
  }

  public render(
    corners: ViewportCorners,
    pixeloidScale: number,
    mirrorRenderer?: MirrorLayerRenderer
  ): void {
    if (!mirrorRenderer) return

    // Update pixel size
    this.pixelateFilter.size = pixeloidScale

    // Get the mirror container
    const mirrorContainer = mirrorRenderer.getMirrorContainer()
    
    // Apply or remove filter based on state
    if (gameStore.geometry.filterEffects.pixelate) {
      // Apply filter to mirror container
      if (!mirrorContainer.filters?.includes(this.pixelateFilter)) {
        mirrorContainer.filters = [
          ...(mirrorContainer.filters || []),
          this.pixelateFilter
        ]
      }
    } else {
      // Remove filter
      if (mirrorContainer.filters?.includes(this.pixelateFilter)) {
        mirrorContainer.filters = mirrorContainer.filters.filter(
          f => f !== this.pixelateFilter
        )
      }
    }
  }
}
```

#### Step 3: Clean Up LayeredInfiniteCanvas
Since we're applying the filter directly, we don't need a separate container:
```typescript
private renderPixelateLayer(corners: ViewportCorners, pixeloidScale: number): void {
  // Just update the filter settings
  this.pixelateFilterRenderer.render(corners, pixeloidScale, this.mirrorLayerRenderer)
  // No need to manage visibility - filter is applied to mirror layer
}
```

## Alternative Solution: Fix Coordinate System

If we must keep separate sprites:

### Get Bounds from Objects
```typescript
// In PixelateFilterRenderer
private positionSpriteCorrectly(sprite: Sprite, objectId: string): void {
  const object = gameStore.geometry.objects.find(obj => obj.id === objectId)
  if (!object?.metadata?.bounds) return
  
  const bounds = object.metadata.bounds
  const offset = gameStore.mesh.vertex_to_pixeloid_offset
  
  // Position at exact bbox location like MirrorLayerRenderer
  sprite.position.set(
    bounds.minX - offset.x,
    bounds.minY - offset.y
  )
}
```

## Benefits of Direct Filter Approach

1. **No Coordinate Issues** - Filter applies to already-positioned sprites
2. **Better Performance** - No duplicate sprites
3. **Simpler Code** - Less to maintain
4. **Perfect Alignment** - Guaranteed to match mirror layer

## Implementation Priority

1. **First**: Try direct filter application (recommended)
2. **Fallback**: Fix coordinate system if direct approach has issues
3. **Test**: Verify with multiple objects at different scales

## Success Criteria

✅ Pixelated sprites align perfectly with geometry
✅ No positioning errors when zooming
✅ No scaling issues
✅ Filter updates dynamically
✅ Clean toggle on/off

## Next Steps

1. Implement getMirrorContainer() in MirrorLayerRenderer
2. Refactor PixelateFilterRenderer to apply filter directly
3. Test thoroughly at different scales
4. Document any edge cases found