# Pixelate Filter Final Solution

## The Problem Clarified
- We have ONE container with MANY sprites
- ONE filter applied to the container
- Setting filterArea on sprites won't help because the filter is on the container
- The filter samples across ALL sprites, causing bleeding

## The Only Solution: Individual Containers

Each sprite needs its own container with filterArea:

```typescript
export class PixelateFilterRenderer {
  private container: Container = new Container()
  private pixelateFilter: PixelateFilter
  private objectContainers: Map<string, Container> = new Map()
  
  constructor() {
    // ONE shared filter instance (for performance)
    this.pixelateFilter = new PixelateFilter(10)
    // NO filter on main container
  }

  public render(
    corners: ViewportCorners,
    pixeloidScale: number,
    mirrorRenderer?: MirrorLayerRenderer
  ): void {
    // Update filter size
    this.pixelateFilter.size = pixeloidScale
    
    // ... get visible objects ...
    
    for (const obj of visibleObjects) {
      // Get or create individual container for this object
      let spriteContainer = this.objectContainers.get(obj.id)
      
      if (!spriteContainer) {
        spriteContainer = new Container()
        // Apply filter to individual container
        spriteContainer.filters = [this.pixelateFilter]
        this.container.addChild(spriteContainer)
        this.objectContainers.set(obj.id, spriteContainer)
      }
      
      // Set filterArea on container to prevent bleeding
      const bounds = obj.metadata.bounds
      const width = (bounds.maxX - bounds.minX) * pixeloidScale
      const height = (bounds.maxY - bounds.minY) * pixeloidScale
      spriteContainer.filterArea = new Rectangle(0, 0, width, height)
      
      // Create/update sprite in its container
      let sprite = /* ... existing sprite logic ... */
      
      // Ensure sprite is in its container
      if (sprite.parent !== spriteContainer) {
        sprite.parent?.removeChild(sprite)
        spriteContainer.addChild(sprite)
      }
      
      // Position the CONTAINER (not the sprite)
      spriteContainer.position.set(screenPos.x, screenPos.y)
      sprite.position.set(0, 0) // Sprite at origin within container
    }
  }
}
```

## Why This Is The Right Approach

1. **Isolation**: Each sprite has its own filtered container
2. **No Bleeding**: filterArea constrains pixel sampling per container
3. **Performance**: Still shares one filter instance (as recommended by docs)
4. **Correct Architecture**: Filter → Container → Sprite

## Key Changes Required
1. Add `objectContainers` Map to track individual containers
2. Create container per object with shared filter
3. Set filterArea on each container
4. Position containers, not sprites
5. Clean up unused containers when objects are removed