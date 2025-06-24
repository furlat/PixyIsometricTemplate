# Mirror Layer Visibility Fix Plan

## Overview
Fix the mirror layer to work independently of geometry layer visibility by implementing proper texture caching and decoupling rendering from visibility.

## Core Changes Required

### 1. Always Render GeometryRenderer (Hidden State)
**File:** `app/src/game/LayeredInfiniteCanvas.ts`

Change `renderGeometryLayer()` to always render GeometryRenderer, but control visibility:

```typescript
private renderGeometryLayer(corners: ViewportCorners, pixeloidScale: number): void {
  // ALWAYS render to maintain object containers
  this.geometryRenderer.render(corners, pixeloidScale)
  
  // Clear and re-add to ensure fresh state
  this.geometryLayer.removeChildren()
  this.geometryLayer.addChild(this.geometryRenderer.getContainer())
  
  // Control visibility instead of rendering
  this.geometryLayer.visible = gameStore.geometry.layerVisibility.geometry
  
  // Position layer at (0,0)
  this.geometryLayer.position.set(0, 0)
  
  // Capture textures after render
  if (this.objectsNeedingTexture.size > 0) {
    requestAnimationFrame(() => {
      this.captureSpecificObjectTexturesSync()
    })
  }
}
```

### 2. Add Persistent Texture Cache to BboxTextureTestRenderer
**File:** `app/src/game/BboxTextureTestRenderer.ts`

Add proper caching that persists across frames:

```typescript
export class BboxTextureTestRenderer {
  private container: Container = new Container()
  private textureExtractor: TextureExtractionRenderer | null = null
  private independentSprites: Map<string, Sprite> = new Map()
  
  // PERSISTENT CACHE: Survives across frames
  private textureCache: Map<string, RenderTexture> = new Map()
  private spriteCache: Map<string, Sprite> = new Map()
  private objectVersions: Map<string, number> = new Map()
  
  public render(
    corners: ViewportCorners,
    pixeloidScale: number,
    geometryRenderer?: GeometryRenderer
  ): void {
    if (!this.textureExtractor || !geometryRenderer) {
      return
    }

    // Clear container but keep caches
    this.container.removeChildren()

    const visibleObjects = gameStore.geometry.objects.filter(obj => obj.isVisible)
    
    for (const obj of visibleObjects) {
      const cachedSprite = this.getCachedOrCreateSprite(obj, geometryRenderer, pixeloidScale)
      if (cachedSprite) {
        this.container.addChild(cachedSprite)
        this.positionSprite(cachedSprite, obj)
      }
    }
  }
  
  private getCachedOrCreateSprite(
    obj: GeometricObject,
    geometryRenderer: GeometryRenderer,
    pixeloidScale: number
  ): Sprite | null {
    const version = this.getObjectVersion(obj)
    const cachedVersion = this.objectVersions.get(obj.id) || 0
    
    // Use cache if version matches
    if (version === cachedVersion && this.spriteCache.has(obj.id)) {
      return this.spriteCache.get(obj.id)!
    }
    
    // Extract new texture
    const texture = this.extractOrGetTexture(obj, geometryRenderer, pixeloidScale)
    if (!texture) return null
    
    // Create sprite and cache it
    const sprite = new Sprite(texture)
    sprite.alpha = 0.7
    sprite.name = `mirror_${obj.id}`
    
    // Update caches
    this.spriteCache.set(obj.id, sprite)
    this.objectVersions.set(obj.id, version)
    
    return sprite
  }
  
  private getObjectVersion(obj: GeometricObject): number {
    // Simple version based on properties that affect rendering
    return obj.createdAt + (obj.color || 0) + ((obj as any).width || 0) + ((obj as any).height || 0)
  }
}
```

### 3. Add Mirror Layer to LayerToggleBar
**File:** `app/src/ui/LayerToggleBar.ts`

Add a toggle for the mirror layer (currently uses 'bboxTest'):

```typescript
private layers = [
  { id: 'background', label: 'Grid' },
  { id: 'geometry', label: 'Geometry' },
  { id: 'selection', label: 'Selection' },
  { id: 'bbox', label: 'Bounding Box' },
  { id: 'bboxTest', label: 'Mirror Layer' }, // Rename for clarity
  { id: 'mouse', label: 'Mouse' }
]
```

### 4. Update TextureExtractionRenderer for Better Caching
**File:** `app/src/game/TextureExtractionRenderer.ts`

Add texture versioning and better cache management:

```typescript
export class TextureExtractionRenderer {
  private renderer: Renderer
  private extractedTextures: Map<string, RenderTexture> = new Map()
  private textureVersions: Map<string, number> = new Map()
  
  public extractObjectTexture(
    objectId: string,
    objectGraphics: Graphics,
    geometricObject: any,
    pixeloidScale: number,
    version: number
  ): RenderTexture | null {
    // Check if cached texture is still valid
    const cachedVersion = this.textureVersions.get(objectId) || 0
    if (cachedVersion === version && this.extractedTextures.has(objectId)) {
      return this.extractedTextures.get(objectId)!
    }
    
    // Extract new texture...
    const texture = this.performExtraction(objectGraphics, geometricObject, pixeloidScale)
    
    if (texture) {
      // Update cache
      this.extractedTextures.set(objectId, texture)
      this.textureVersions.set(objectId, version)
    }
    
    return texture
  }
}
```

## Implementation Steps

1. **Update LayeredInfiniteCanvas**
   - Modify `renderGeometryLayer()` to always render
   - Control visibility instead of conditional rendering

2. **Enhance BboxTextureTestRenderer**
   - Add persistent texture and sprite caches
   - Implement version tracking for objects
   - Only re-extract when objects change

3. **Update UI Labels**
   - Rename "bboxTest" to "Mirror Layer" in UI
   - Add documentation about mirror layer purpose

4. **Test Scenarios**
   - Draw some geometry
   - Turn off geometry layer
   - Verify mirror layer still shows cached sprites
   - Turn geometry back on
   - Verify both layers show correctly

## Benefits

1. **True Independence**: Mirror layer works regardless of geometry visibility
2. **Performance**: Textures cached and reused, not extracted every frame
3. **Debugging**: Can compare geometry vs cached textures side-by-side
4. **Filter Testing**: Can apply filters to mirror layer without affecting geometry

## Success Criteria

- [ ] Mirror layer shows sprites when geometry layer is off
- [ ] Textures are cached and reused across frames
- [ ] Performance improves (fewer texture extractions)
- [ ] Both layers can be toggled independently
- [ ] No visual artifacts or positioning issues