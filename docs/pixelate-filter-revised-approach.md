# Pixelate Filter - Revised Approach Using Texture Cache

## Better Architecture: Use Cached Textures

Instead of copying sprites, we'll create new sprites from the texture cache:

### MirrorLayerRenderer Exposes Texture Cache
```typescript
// In MirrorLayerRenderer
public getTextureCache(): Map<string, { texture: RenderTexture, visualVersion: number, scale: number }> {
  return new Map(this.textureCache) // Return copy for safety
}

// Also expose current sprite positions for alignment
public getSpritePositions(): Map<string, { x: number, y: number }> {
  const positions = new Map()
  for (const [id, sprite] of this.mirrorSprites) {
    positions.set(id, { x: sprite.x, y: sprite.y })
  }
  return positions
}
```

### PixelateFilterRenderer Uses Cached Textures
```typescript
export class PixelateFilterRenderer {
  private container: Container = new Container()
  private pixelateFilter: PixelateFilter
  private filteredContainer: Container = new Container()
  private pixelatedSprites: Map<string, Sprite> = new Map()
  
  constructor() {
    this.pixelateFilter = new PixelateFilter(10)
    this.filteredContainer.filters = [this.pixelateFilter]
    this.container.addChild(this.filteredContainer)
  }

  public render(
    corners: ViewportCorners,
    pixeloidScale: number,
    mirrorRenderer?: MirrorLayerRenderer
  ): void {
    if (!mirrorRenderer) return

    // Update pixel size
    this.pixelateFilter.size = pixeloidScale

    // Get cached textures and positions
    const textureCache = mirrorRenderer.getTextureCache()
    const spritePositions = mirrorRenderer.getSpritePositions()
    
    // Track current objects
    const currentIds = new Set(textureCache.keys())
    
    // Remove sprites for objects no longer in cache
    for (const [id, sprite] of this.pixelatedSprites) {
      if (!currentIds.has(id)) {
        sprite.destroy()
        this.pixelatedSprites.delete(id)
      }
    }
    
    // Create/update sprites from cached textures
    for (const [objectId, cache] of textureCache) {
      let sprite = this.pixelatedSprites.get(objectId)
      
      if (!sprite) {
        // Create new sprite from cached texture
        sprite = new Sprite(cache.texture)
        this.filteredContainer.addChild(sprite)
        this.pixelatedSprites.set(objectId, sprite)
      }
      
      // Update position from mirror sprites
      const pos = spritePositions.get(objectId)
      if (pos) {
        sprite.position.set(pos.x, pos.y)
      }
    }
  }
}
```

## Advantages of This Approach

1. **No Sprite Copying** - Create sprites directly from cached textures
2. **Memory Efficient** - Reuse existing texture cache
3. **Better Performance** - Textures already extracted and cached
4. **Clean Separation** - Each layer manages its own sprites

## Alternative: Direct Texture Access
We could also expose a method to get a specific texture:
```typescript
// In MirrorLayerRenderer
public getCachedTexture(objectId: string): RenderTexture | null {
  const cache = this.textureCache.get(objectId)
  return cache?.texture || null
}
```

## Key Points

- **Texture Reuse**: We're reusing the textures that MirrorLayerRenderer already extracted
- **Independent Sprites**: Each renderer has its own sprites, but shares textures
- **Scale Awareness**: Textures are cached with scale, so we know when to update

This is much cleaner than copying sprites!