# Pixelate Filter Real Issue Analysis

## The Actual Problem
The PixelateFilter is applied to the ENTIRE container holding all sprites:

```typescript
// Current implementation (WRONG)
this.filteredContainer.filters = [this.pixelateFilter]  // Filter on parent container
this.filteredContainer.addChild(sprite)                 // All sprites in same container
```

This means the filter samples pixels across ALL sprites, causing bleeding/overflow between objects!

## Why Mirror Layer Works
The mirror layer works perfectly because it doesn't apply any filters - it just displays the sprites as-is.

## The Solution
Each sprite needs its own container with the filter applied individually:

```typescript
// Correct implementation
for (const obj of visibleObjects) {
  // Create individual container for this sprite
  let spriteContainer = this.objectContainers.get(obj.id)
  if (!spriteContainer) {
    spriteContainer = new Container()
    spriteContainer.filters = [this.pixelateFilter]  // Filter per container
    this.container.addChild(spriteContainer)         // Add to main container
  }
  
  // Add sprite to its own container
  sprite = new Sprite(cache.texture)
  spriteContainer.addChild(sprite)
}
```

## Additional Issues Found

### 1. Sprite Anchor
The sprites don't have explicit anchor settings. Default anchor is (0,0) which should be correct for top-left positioning.

### 2. No Bounds Clipping
Even with individual containers, we might need to set filterArea to prevent sampling beyond bounds:

```typescript
const bounds = obj.metadata.bounds
const width = (bounds.maxX - bounds.minX) * pixeloidScale
const height = (bounds.maxY - bounds.minY) * pixeloidScale
spriteContainer.filterArea = new Rectangle(0, 0, width, height)
```

## Root Cause Summary
The pixelated pixels outside bounding boxes are caused by:
1. Single filter applied to container with multiple sprites
2. PixelateFilter samples across sprite boundaries
3. No isolation between filtered objects

## Implementation Fix
Need to refactor PixelateFilterRenderer to:
1. Create individual containers per sprite
2. Apply filter to each container separately
3. Optionally add filterArea for extra safety