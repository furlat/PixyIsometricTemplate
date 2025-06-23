# Independent Filter Layer Architecture Plan

## Analysis of PixiJS Advanced APIs for Independent Texture Processing

Based on the PixiJS documentation analysis, here are the key approaches for implementing independent filter layers that can re-use geometry data without affecting the original:

## Approach 1: Multi-Pass Rendering with RenderTextures (RECOMMENDED)

**Pattern from docs/export.md lines 3010-3188:**

```javascript
// Phase 1: Render geometry to texture
const geometryTexture = RenderTexture.create({ width: 300, height: 300 });
app.renderer.render({
  container: geometryContainer,
  target: geometryTexture,
});

// Phase 2: Create multiple sprite copies from the same texture
const filterSprite1 = new Sprite(geometryTexture);
const filterSprite2 = new Sprite(geometryTexture);

// Phase 3: Apply different filters to each sprite
filterSprite1.filters = [new PixelateFilter()];
filterSprite2.filters = [new OutlineFilter()];

// Phase 4: Combine results or use independently
```

**Advantages:**
- ✅ Perfect pixel-level fidelity with original geometry
- ✅ Independent filter chains without affecting original
- ✅ Multiple sprites can share the same source texture
- ✅ GPU-accelerated filtering on each sprite copy
- ✅ Can combine results in various ways

## Approach 2: Container.cacheAsTexture() with Sprite Extraction

**Pattern from docs/export.md lines 2084-2204:**

```javascript
// Phase 1: Cache geometry container as texture
geometryContainer.cacheAsTexture({
  resolution: 2,
  antialias: true,
});

// Phase 2: Extract the cached texture
const cachedTexture = geometryContainer.renderGroup.cacheAsTexture;

// Phase 3: Create independent sprites
const filterSprite = new Sprite(cachedTexture);
filterSprite.filters = [customFilter];
```

**Advantages:**
- ✅ Automatic texture management
- ✅ Built-in caching optimization
- ✅ Easy to enable/disable

**Disadvantages:**
- ❌ Less control over texture creation timing
- ❌ Tied to container lifecycle

## Approach 3: RenderLayers for Independent Draw Order

**Pattern from docs/export.md lines 97-233:**

```javascript
// Create independent render layers
const baseLayer = new RenderLayer();
const filterLayer1 = new RenderLayer();
const filterLayer2 = new RenderLayer();

// Attach geometry to multiple layers
baseLayer.attach(geometryObject);
filterLayer1.attach(geometrySpriteCopy1);
filterLayer2.attach(geometrySpriteCopy2);

// Control render order independently
stage.addChild(baseLayer);
stage.addChild(filterLayer1);
stage.addChild(filterLayer2);
```

**Advantages:**
- ✅ Decoupled rendering order from logical hierarchy
- ✅ Objects maintain transformations from logical parent
- ✅ Fine-grained control over layer composition

## Approach 4: Direct renderer.render() with Target

**Pattern from docs/export.md lines 2708-2761:**

```javascript
const rt = RenderTexture.create({
  width: 300,
  height: 300,
  scaleMode: SCALE_MODES.LINEAR,
  resolution: 1,
});

// Direct rendering control
app.ticker.add(() => {
  app.renderer.render(geometryContainer, { renderTexture: rt });
});

const sprite = new Sprite(rt);
sprite.filters = [customFilter];
```

**Advantages:**
- ✅ Complete control over render timing
- ✅ Can render different containers to different textures
- ✅ Perfect for frame-by-frame texture updates

## Recommended Implementation Strategy

### Phase 1: Core Texture Extraction System

```typescript
export class TextureExtractionRenderer {
  private geometryTexture: RenderTexture;
  private filterSprites: Map<string, Sprite> = new Map();

  public extractGeometryTexture(
    geometryContainer: Container, 
    renderer: Renderer
  ): RenderTexture {
    // Create high-quality render texture
    this.geometryTexture = RenderTexture.create({
      width: geometryContainer.width,
      height: geometryContainer.height,
      resolution: 2, // High DPI for quality
      scaleMode: SCALE_MODES.LINEAR
    });

    // Render geometry to texture with perfect pixel alignment
    renderer.render({
      container: geometryContainer,
      target: this.geometryTexture,
      clear: true,
      transform: new Matrix() // Identity transform for 1:1 capture
    });

    return this.geometryTexture;
  }

  public createFilterSprite(filterId: string, filters: Filter[]): Sprite {
    if (!this.geometryTexture) {
      throw new Error('Geometry texture not extracted yet');
    }

    const sprite = new Sprite(this.geometryTexture);
    sprite.filters = filters;
    this.filterSprites.set(filterId, sprite);
    
    return sprite;
  }
}
```

### Phase 2: Independent Filter Chains

```typescript
export class IndependentFilterManager {
  private extractionRenderer: TextureExtractionRenderer;
  private filterLayers: Map<string, Container> = new Map();

  public createFilterChain(
    filterId: string,
    filters: Filter[],
    renderLayer: RenderLayer
  ): Sprite {
    // Extract fresh geometry texture
    const geometryTexture = this.extractionRenderer.extractGeometryTexture(
      this.getGeometryContainer(),
      this.renderer
    );

    // Create independent sprite with filters
    const filterSprite = new Sprite(geometryTexture);
    filterSprite.filters = filters;

    // Add to independent render layer
    const layerContainer = new Container({ isRenderGroup: true });
    layerContainer.addChild(filterSprite);
    renderLayer.attach(layerContainer);
    
    this.filterLayers.set(filterId, layerContainer);
    
    return filterSprite;
  }

  public updateFilters(filterId: string, newFilters: Filter[]): void {
    const sprite = this.filterLayers.get(filterId)?.children[0] as Sprite;
    if (sprite) {
      sprite.filters = newFilters;
    }
  }
}
```

### Phase 3: Perfect Pixeloid Alignment

```typescript
export class PixeloidPerfectExtraction {
  public extractWithPixeloidBounds(
    geometryObject: GeometricObject,
    renderer: Renderer
  ): { texture: RenderTexture, bounds: Rectangle } {
    // Use metadata bounds for perfect pixeloid alignment
    const bounds = geometryObject.metadata.bounds;
    
    // Calculate pixeloid-perfect dimensions
    const pixeloidWidth = Math.ceil(bounds.maxX - bounds.minX);
    const pixeloidHeight = Math.ceil(bounds.maxY - bounds.minY);
    
    // Create texture with exact pixeloid dimensions
    const texture = RenderTexture.create({
      width: pixeloidWidth * this.pixeloidScale,
      height: pixeloidHeight * this.pixeloidScale,
      resolution: 1
    });

    // Create temporary container positioned at bounds origin
    const extractContainer = new Container();
    extractContainer.position.set(-bounds.minX, -bounds.minY);
    extractContainer.addChild(this.getObjectGraphics(geometryObject.id));

    // Render with perfect alignment
    renderer.render({
      container: extractContainer,
      target: texture,
      clear: true
    });

    return { texture, bounds: new Rectangle(bounds.minX, bounds.minY, pixeloidWidth, pixeloidHeight) };
  }
}
```

### Phase 4: Integration with LayeredInfiniteCanvas

```typescript
// Add to LayeredInfiniteCanvas.ts
private textureExtractionRenderer: TextureExtractionRenderer;
private independentFilterManager: IndependentFilterManager;

// In render method:
private renderIndependentFilterLayers(): void {
  // Extract geometry textures after geometry layer renders
  if (this.needsTextureExtraction()) {
    this.textureExtractionRenderer.extractGeometryTexture(
      this.geometryRenderer.getContainer(),
      this.app.renderer
    );
  }

  // Update all active filter chains
  for (const [filterId, isActive] of this.getActiveFilters()) {
    if (isActive) {
      this.independentFilterManager.updateFilterChain(filterId);
    }
  }
}
```

## Key Benefits of This Architecture

1. **100% Visual Fidelity**: Direct texture extraction preserves exact pixel data
2. **Independent Processing**: Each filter chain operates on its own sprite copy
3. **Parallel Filtering**: Multiple filters can run simultaneously without interference
4. **Combinable Results**: Sprites can be composited in various ways
5. **Performance Optimized**: Uses GPU-accelerated RenderTextures and Render Groups
6. **Pixeloid Perfect**: Maintains precise pixeloid boundaries and alignment

## Implementation Priority

1. **Phase 1**: Implement basic texture extraction from GeometryRenderer
2. **Phase 2**: Create sprite copies with independent filter chains  
3. **Phase 3**: Add pixeloid-perfect bounds calculation and alignment
4. **Phase 4**: Integrate with existing layer system and store visibility controls

This approach leverages PixiJS's advanced rendering pipeline while maintaining perfect fidelity with the original geometry and enabling truly independent filter processing.