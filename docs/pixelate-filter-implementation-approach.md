# Pixelate Filter Implementation Approach

## Integration Strategy

Since we have:
1. **MirrorLayerRenderer** - Creates perfect texture sprites from geometry
2. **PixelateFilterRenderer** - Needs to apply pixelate filter to those sprites
3. **pixi-filters** - Already installed with PixelateFilter available

## Proposed Architecture

### Option 1: Direct Integration with MirrorLayerRenderer (Recommended)
```typescript
// In LayeredInfiniteCanvas.render()
private renderPixelateLayer(corners: ViewportCorners, pixeloidScale: number): void {
  if (gameStore.geometry.filterEffects.pixelate) {
    // Pass the mirror renderer to get access to sprites
    this.pixelateFilterRenderer.render(
      corners,
      pixeloidScale,
      this.mirrorLayerRenderer  // NEW: Pass mirror renderer
    )
    this.pixelateLayer.visible = true
  } else {
    this.pixelateLayer.visible = false
  }
}
```

### Option 2: Shared Sprite Registry
Create a shared registry where MirrorLayerRenderer registers sprites and PixelateFilterRenderer reads them.

## Implementation Code

### PixelateFilterRenderer.ts
```typescript
import { Container, Sprite } from 'pixi.js'
import { PixelateFilter } from 'pixi-filters'
import type { ViewportCorners } from '../types'
import type { MirrorLayerRenderer } from './MirrorLayerRenderer'

export class PixelateFilterRenderer {
  private container: Container = new Container()
  private pixelateFilter: PixelateFilter
  private filteredContainer: Container = new Container()
  
  constructor() {
    // Initialize filter with default size
    this.pixelateFilter = new PixelateFilter(10)
    
    // Apply filter to the container that will hold copied sprites
    this.filteredContainer.filters = [this.pixelateFilter]
    this.container.addChild(this.filteredContainer)
  }

  public render(
    corners: ViewportCorners,
    pixeloidScale: number,
    mirrorRenderer?: MirrorLayerRenderer
  ): void {
    if (!mirrorRenderer) {
      console.warn('PixelateFilterRenderer: No mirror renderer provided')
      return
    }

    // Update pixel size to match pixeloid scale
    this.pixelateFilter.size = pixeloidScale

    // Clear previous filtered sprites
    this.filteredContainer.removeChildren()

    // Get sprites from mirror renderer
    const mirrorSprites = mirrorRenderer.getAllIndependentSprites()
    
    // Create filtered copies
    for (const [objectId, mirrorSprite] of mirrorSprites) {
      // Create a copy to avoid modifying the original
      const filteredSprite = new Sprite(mirrorSprite.texture)
      
      // Copy position and scale from mirror sprite
      filteredSprite.position.copyFrom(mirrorSprite.position)
      filteredSprite.scale.copyFrom(mirrorSprite.scale)
      filteredSprite.anchor.copyFrom(mirrorSprite.anchor)
      filteredSprite.alpha = mirrorSprite.alpha
      
      // Add to filtered container
      this.filteredContainer.addChild(filteredSprite)
    }
  }

  public getContainer(): Container {
    return this.container
  }

  public destroy(): void {
    this.pixelateFilter.destroy()
    this.container.destroy()
  }
}
```

### MirrorLayerRenderer Changes
Add method to expose sprites:
```typescript
/**
 * Get all mirror sprites for external processing
 */
public getAllIndependentSprites(): Map<string, Sprite> {
  return new Map(this.mirrorSprites) // Return copy for safety
}
```

## Key Implementation Points

### 1. Pixel Size = Pixeloid Scale
```typescript
this.pixelateFilter.size = pixeloidScale
```
This ensures:
- At scale 10: Each pixel in the filter = 10 screen pixels = 1 pixeloid
- Perfect alignment with the pixeloid grid

### 2. Container-Level Filtering
Apply filter to container, not individual sprites:
- Better performance (single filter instance)
- Consistent effect across all objects
- Easier to toggle on/off

### 3. Sprite Copying
Create copies of mirror sprites to:
- Preserve original unfiltered sprites
- Allow independent positioning/effects
- Enable multiple filters in parallel

## Testing Steps

1. **Basic Test**
   ```typescript
   // Draw a circle
   // Enable mirror layer
   // Enable pixelate filter
   // Should see pixelated version
   ```

2. **Alignment Test**
   - Zoom to different scales
   - Verify pixels align with grid lines
   - Check no half-pixel artifacts

3. **Performance Test**
   - Create 20+ objects
   - Enable both layers
   - Monitor FPS

## Next Implementation Phase

After basic pixelate works, we can:
1. Add more filters (blur, glow, etc.)
2. Create filter combinations
3. Add per-object filter controls
4. Implement filter animations

## Success Metrics

✅ Pixelate effect visible
✅ Pixels exactly match pixeloid size
✅ No positioning errors
✅ Smooth toggle on/off
✅ Good performance with many objects