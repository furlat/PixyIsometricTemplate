# Pixelate Filter Proper Solution

## Key Insights from PixiJS Filter Documentation

### Performance Trade-off
From the docs (line 319-320):
> "One filter applied to a container with many objects is MUCH faster than many filter applied to many objects."

This explains why the current approach uses one filter on the container. However, this causes pixel bleeding.

### The Solution: filterArea
From the docs (line 270):
```typescript
// Limit filter area
sprite.filterArea = new Rectangle(0, 0, 100, 100);
```

## Recommended Implementation

Keep the current architecture (one filter, one container) but use `filterArea` on each sprite:

```typescript
export class PixelateFilterRenderer {
  private container: Container = new Container()
  private pixelateFilter: PixelateFilter
  
  constructor() {
    // ONE shared filter (good for performance)
    this.pixelateFilter = new PixelateFilter(10)
    
    // Apply filter to container
    this.container.filters = [this.pixelateFilter]
  }

  public render(
    corners: ViewportCorners,
    pixeloidScale: number,
    mirrorRenderer?: MirrorLayerRenderer
  ): void {
    // ... existing code ...
    
    for (const obj of visibleObjects) {
      // ... create/update sprite ...
      
      // KEY FIX: Set filterArea to constrain pixel sampling
      const bounds = obj.metadata.bounds
      const width = (bounds.maxX - bounds.minX) * pixeloidScale
      const height = (bounds.maxY - bounds.minY) * pixeloidScale
      
      // This prevents the filter from sampling beyond sprite bounds
      sprite.filterArea = new Rectangle(0, 0, width, height)
      
      // ... position sprite ...
    }
  }
}
```

## Why This Works
1. **Performance**: Still uses one filter instance (efficient)
2. **No Bleeding**: filterArea constrains where the filter can sample pixels
3. **Simple**: Minimal code change required

## Alternative if filterArea Doesn't Work

If filterArea on sprites doesn't work with a container-level filter, then we need individual containers:

```typescript
// Plan B: Individual containers with shared filter
private objectContainers: Map<string, Container> = new Map()

// For each object
let container = this.objectContainers.get(obj.id)
if (!container) {
  container = new Container()
  container.filters = [this.pixelateFilter] // Shared instance
  this.container.addChild(container)
  this.objectContainers.set(obj.id, container)
}

// Set filterArea on container
container.filterArea = new Rectangle(0, 0, width, height)

// Add sprite to container
sprite.parent?.removeChild(sprite)
container.addChild(sprite)
```

## Summary
The proper PixiJS way is to:
1. Try filterArea on sprites first (simpler)
2. If that fails, use individual containers with filterArea
3. Always share the filter instance for performance