# Filter Layer Architecture

## Core Concept
The mirror layer serves as the **template and texture provider** for all filter layers.

## Architecture Overview

```
GeometryRenderer (draws geometry)
        ↓
MirrorLayerRenderer (template layer)
  - Extracts textures from geometry
  - Caches textures
  - Provides positioning template
  - Acts as "source of truth"
        ↓
Filter Layers (pixelate, blur, etc.)
  - Read from mirror's texture cache
  - Create their own sprites
  - Copy mirror's positioning logic
  - Apply their specific filters
```

## Mirror Layer Role

### 1. Texture Cache Generator
```typescript
// MirrorLayerRenderer generates and maintains texture cache
private textureCache: Map<string, {
  texture: RenderTexture
  visualVersion: number
  scale: number
}>
```

### 2. Positioning Template
```typescript
// Standard positioning logic all filter layers should follow
const bounds = geometricObject.metadata.bounds
const offset = gameStore.mesh.vertex_to_pixeloid_offset

sprite.position.set(
  bounds.minX - offset.x,
  bounds.minY - offset.y
)
```

## Filter Layer Pattern

Each filter layer should:

### 1. Read Textures from Mirror Cache
```typescript
const textureCache = mirrorRenderer.getTextureCache()
```

### 2. Create Own Sprites
```typescript
// Don't reuse mirror sprites - create new ones
const sprite = new Sprite(cache.texture)
```

### 3. Apply Same Positioning
```typescript
// Exact same logic as mirror layer
const bounds = geometricObject.metadata.bounds
const offset = gameStore.mesh.vertex_to_pixeloid_offset
container.position.set(bounds.minX - offset.x, bounds.minY - offset.y)
```

### 4. Apply Specific Filter
```typescript
container.filters = [specificFilter]
```

## Benefits of This Architecture

1. **Single Source of Truth** - Mirror layer handles all texture extraction
2. **Consistent Positioning** - All layers use same positioning logic
3. **Filter Independence** - Each filter layer can have different settings
4. **Performance** - Textures extracted once, reused many times
5. **Maintainability** - Change positioning in one place (mirror template)

## Implementation Template for Filter Layers

```typescript
export class FilterLayerTemplate {
  private container: Container = new Container()
  private filter: Filter
  private objectContainers: Map<string, Container> = new Map()
  
  public render(
    corners: ViewportCorners,
    pixeloidScale: number,
    mirrorRenderer: MirrorLayerRenderer
  ): void {
    // 1. Get texture cache from mirror
    const textureCache = mirrorRenderer.getTextureCache()
    
    // 2. For each cached texture
    for (const [objectId, cache] of textureCache) {
      // 3. Get geometric object for positioning
      const obj = gameStore.geometry.objects.find(o => o.id === objectId)
      if (!obj?.metadata?.bounds) continue
      
      // 4. Create/update container with sprite
      let container = this.objectContainers.get(objectId)
      if (!container) {
        container = new Container()
        container.filters = [this.filter]
        const sprite = new Sprite(cache.texture)
        container.addChild(sprite)
        this.container.addChild(container)
        this.objectContainers.set(objectId, container)
      }
      
      // 5. Apply mirror layer positioning
      const bounds = obj.metadata.bounds
      const offset = gameStore.mesh.vertex_to_pixeloid_offset
      container.position.set(
        bounds.minX - offset.x,
        bounds.minY - offset.y
      )
    }
  }
}
```

## Future Filter Layers

Using this pattern, we can easily add:
- **BlurFilter** - Gaussian blur effect
- **GlowFilter** - Outer glow effect
- **ColorMatrixFilter** - Color adjustments
- **DropShadowFilter** - Shadow effects

Each would follow the same pattern: read textures from mirror, create sprites, apply positioning, add filter.