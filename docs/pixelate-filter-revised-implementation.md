# Pixelate Filter - Revised Implementation Plan

## Requirements Clarification
- Replicate the mirror layer exactly
- Read from mirror layer's texture cache
- Apply filter to each object's container independently

## Implementation Strategy

### Key Insight
We need to duplicate the EXACT logic from MirrorLayerRenderer, but with individual filters per sprite container.

### MirrorLayerRenderer Pattern to Replicate
```typescript
// How MirrorLayerRenderer positions sprites:
const bounds = geometricObject.metadata.bounds
const offset = gameStore.mesh.vertex_to_pixeloid_offset

sprite.position.set(
  bounds.minX - offset.x,
  bounds.minY - offset.y
)
```

### PixelateFilterRenderer - Correct Implementation

```typescript
export class PixelateFilterRenderer {
  private container: Container = new Container()
  private pixelateFilter: PixelateFilter
  private objectContainers: Map<string, Container> = new Map()
  
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

    // Get texture cache from mirror renderer
    const textureCache = mirrorRenderer.getTextureCache()
    const currentIds = new Set(textureCache.keys())
    
    // Remove containers for objects no longer in cache
    for (const [id, container] of this.objectContainers) {
      if (!currentIds.has(id)) {
        container.destroy()
        this.objectContainers.delete(id)
      }
    }
    
    // REPLICATE MIRROR LAYER LOGIC EXACTLY
    for (const [objectId, cache] of textureCache) {
      // Get the geometric object for positioning
      const geometricObject = gameStore.geometry.objects.find(
        obj => obj.id === objectId
      )
      if (!geometricObject?.metadata?.bounds) continue
      
      // Get or create container for this object
      let objectContainer = this.objectContainers.get(objectId)
      if (!objectContainer) {
        objectContainer = new Container()
        // Apply filter to individual container
        objectContainer.filters = [this.pixelateFilter]
        this.container.addChild(objectContainer)
        this.objectContainers.set(objectId, objectContainer)
      }
      
      // Create or update sprite in container
      let sprite = objectContainer.children[0] as Sprite
      if (!sprite) {
        sprite = new Sprite(cache.texture)
        objectContainer.addChild(sprite)
      }
      
      // EXACT SAME POSITIONING AS MIRROR LAYER
      const bounds = geometricObject.metadata.bounds
      const offset = gameStore.mesh.vertex_to_pixeloid_offset
      
      objectContainer.position.set(
        bounds.minX - offset.x,
        bounds.minY - offset.y
      )
      
      // Sprite at (0,0) within container since container is positioned
      sprite.position.set(0, 0)
      sprite.scale.set(1) // Texture is pre-scaled
    }
  }
}
```

## Key Differences from Previous Attempt

### Wrong Approach:
- Created sprites and tried to position them
- Got positions from mirror sprites (already transformed)
- Single filter on one container

### Correct Approach:
- Create container per object
- Apply filter to each container
- Use SAME positioning logic as mirror layer
- Read bounds from geometric objects
- Apply vertex_to_pixeloid_offset conversion

## Architecture

```
PixelateFilterRenderer Container
  ├── Object1 Container [Filter Applied]
  │   └── Sprite (texture from cache)
  ├── Object2 Container [Filter Applied]
  │   └── Sprite (texture from cache)
  └── ObjectN Container [Filter Applied]
      └── Sprite (texture from cache)
```

## Benefits

1. **Exact Replication** - Uses same positioning as mirror layer
2. **Per-Object Filters** - Can control filter per object
3. **Correct Coordinates** - No position copying, uses source data
4. **Clean Architecture** - Each object isolated in container

## Testing Points

- Verify positions match mirror layer exactly
- Check filter applies to each object
- Confirm zoom updates pixel size
- Test with object creation/deletion