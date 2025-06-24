# Pixelate Filter Implementation Plan

## Overview
The pixelate filter will apply pixeloid-perfect pixelation to the mirror layer sprites. Since the sprites are already vertex-aligned from the MirrorLayerRenderer, we can achieve perfect pixeloid alignment.

## Current State Analysis

### What We Have
1. **MirrorLayerRenderer** - Creates pixeloid-perfect texture sprites
2. **PixelateFilterRenderer** - Currently empty placeholder
3. **LayeredInfiniteCanvas** - Has pixelate layer ready
4. **Store** - Has `filterEffects.pixelate` toggle

### What We Need
1. **PixelateFilter** - Either from pixi-filters or custom implementation
2. **Filter application** - Apply to mirror sprites with correct pixel size
3. **Scale awareness** - Pixel size must match pixeloid scale

## Implementation Strategy

### Option 1: Use pixi-filters PixelateFilter (Recommended)
```typescript
import { PixelateFilter } from 'pixi-filters';

// In PixelateFilterRenderer
const pixelateFilter = new PixelateFilter({
  size: pixeloidScale  // Match current zoom level
});
```

### Option 2: Custom Pixelate Shader
If we need more control, create a custom filter using the pattern from docs:

```glsl
// Fragment shader
vec2 coord = floor(vTextureCoord * uPixelSize) / uPixelSize;
vec4 color = texture2D(uTexture, coord);
```

## Architecture Design

### PixelateFilterRenderer Changes
```typescript
export class PixelateFilterRenderer {
  private container: Container = new Container()
  private pixelateFilter: PixelateFilter | null = null
  private filteredSprites: Map<string, Sprite> = new Map()
  
  public render(
    corners: ViewportCorners,
    pixeloidScale: number,
    mirrorRenderer?: MirrorLayerRenderer
  ): void {
    // Update filter pixel size based on scale
    this.updateFilterPixelSize(pixeloidScale)
    
    // Get mirror sprites
    const mirrorSprites = mirrorRenderer.getIndependentSprites()
    
    // Apply filter to each sprite
    for (const [objectId, mirrorSprite] of mirrorSprites) {
      this.applyPixelateToSprite(objectId, mirrorSprite, pixeloidScale)
    }
  }
}
```

## Key Implementation Points

### 1. Pixel Size Calculation
The pixel size for the filter must match the pixeloid scale:
- At scale 10: Each pixeloid = 10 screen pixels
- Filter pixel size = pixeloidScale
- This ensures filter pixels align with pixeloid grid

### 2. Filter Application Options

#### Option A: Apply to Individual Sprites
```typescript
sprite.filters = [pixelateFilter];
```
- Pro: Fine control per object
- Con: Many filter instances

#### Option B: Apply to Container
```typescript
container.filters = [pixelateFilter];
```
- Pro: Single filter for all
- Con: Less control

#### Option C: Create Filtered Copies
```typescript
// Copy sprite and apply filter
const filteredSprite = new Sprite(mirrorSprite.texture)
filteredSprite.filters = [pixelateFilter]
```
- Pro: Preserves original sprites
- Con: More memory usage

### 3. Performance Considerations
From the docs:
- Filters are expensive when overused
- One filter on container > many filters on objects
- Filter switches cause performance hits

### Recommendation: Use container-level filtering

## Implementation Steps

### Step 1: Install pixi-filters
```bash
npm install pixi-filters
```

### Step 2: Update PixelateFilterRenderer
1. Import PixelateFilter
2. Create filter with dynamic pixel size
3. Apply to container holding copied sprites
4. Update pixel size on zoom

### Step 3: Coordinate with MirrorLayerRenderer
1. MirrorLayerRenderer provides sprite access
2. PixelateFilterRenderer creates filtered copies
3. Positions match original sprites

### Step 4: Handle Scale Changes
```typescript
private updateFilterPixelSize(pixeloidScale: number): void {
  if (this.pixelateFilter) {
    // Pixel size matches pixeloid scale for perfect alignment
    this.pixelateFilter.size = pixeloidScale
  }
}
```

## Testing Plan

1. **Visual Test**
   - Enable mirror layer
   - Enable pixelate filter
   - Verify pixels align with grid

2. **Scale Test**
   - Zoom in/out
   - Verify pixel size updates
   - Check alignment maintained

3. **Performance Test**
   - Many objects
   - Monitor FPS
   - Check filter overhead

## Success Criteria

✅ Pixelate effect applies to mirror sprites
✅ Pixels perfectly align with pixeloid grid
✅ Pixel size updates with zoom
✅ Performance remains smooth
✅ Toggle on/off works instantly

## Next Steps

1. Install pixi-filters package
2. Implement basic PixelateFilterRenderer
3. Test with single object
4. Optimize for multiple objects
5. Add UI controls if needed