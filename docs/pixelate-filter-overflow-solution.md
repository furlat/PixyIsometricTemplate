# Pixelate Filter Overflow Solution

## Root Cause
The pixelated pixels extending beyond bounds are caused by:

1. **Math.ceil() in texture extraction** (MirrorLayerRenderer line 162-163):
```typescript
const textureWidth = Math.ceil((vertexBounds.maxX - vertexBounds.minX) * pixeloidScale)
const textureHeight = Math.ceil((vertexBounds.maxY - vertexBounds.minY) * pixeloidScale)
```
This rounds UP, potentially adding extra pixels.

2. **PixelateFilter behavior**: When filter size = pixeloid scale, it chunks pixels and may sample beyond original bounds.

## Solution: Apply Filter Area Clipping

### Implementation Plan

#### Step 1: Add filterArea to PixelateFilterRenderer
Set explicit bounds for each filtered container to prevent overflow:

```typescript
// In PixelateFilterRenderer.render()
// After creating/updating sprite:

// Get exact bounds from object metadata
const bounds = obj.metadata.bounds
const width = (bounds.maxX - bounds.minX) * pixeloidScale
const height = (bounds.maxY - bounds.minY) * pixeloidScale

// Create filter area to clip rendering
const filterArea = new Rectangle(0, 0, width, height)

// Find the container holding this sprite
let spriteContainer = this.objectContainers.get(obj.id)
if (!spriteContainer) {
  spriteContainer = new Container()
  spriteContainer.addChild(sprite)
  this.filteredContainer.addChild(spriteContainer)
  this.objectContainers.set(obj.id, spriteContainer)
}

// Apply filter area to prevent overflow
spriteContainer.filterArea = filterArea
```

#### Step 2: Alternative - Apply Mask
If filterArea doesn't work, use masking:

```typescript
// Create mask matching exact bounds
const mask = new Graphics()
mask.rect(0, 0, width, height)
mask.fill(0xffffff)
spriteContainer.mask = mask
```

#### Step 3: Fix Texture Extraction (Optional)
Change Math.ceil to Math.floor to avoid extra pixels:

```typescript
// In MirrorLayerRenderer.extractObjectTexture()
const textureWidth = Math.floor((vertexBounds.maxX - vertexBounds.minX) * pixeloidScale)
const textureHeight = Math.floor((vertexBounds.maxY - vertexBounds.minY) * pixeloidScale)
```

## Recommended Approach

Use **filterArea** first as it's more performant than masks. The PixelateFilterRenderer should:

1. Create individual containers for each sprite
2. Apply the shared PixelateFilter to the parent container
3. Set filterArea on each sprite container to clip rendering

## Benefits
- ✅ Prevents pixel overflow beyond bounds
- ✅ Uses actual bbox data from store
- ✅ Maintains performance (filterArea is GPU-efficient)
- ✅ Preserves pixeloid-perfect alignment