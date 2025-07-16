# Filter Pipeline Architecture Analysis

## Critical Issue Identified

The current filter system architecture has a **fundamental flaw** in its interaction with the camera viewport system. The filters are applied at the wrong stages of the rendering pipeline.

## Current (Incorrect) Architecture

```
Data Layer (no viewport) → Mirror Layer (no viewport) → Filters → Camera Transform
```

**Problem**: Filters are applied after camera transforms, which means:
- Filter vertices are calculated in zoomed space
- Filter effects are applied to already-transformed content
- Upscaling artifacts and inconsistent filter behavior

## Correct Architecture (Your Insight)

```
Data Layer (no viewport) → Mirror Layer (no viewport) → Pre-filters (original scale) → Viewport Transform → Post-filters (zoom-aware) → Upscaling
```

## Detailed Filter Pipeline

### Stage 1: Data Layer (No Viewport)
```typescript
// GeometryRenderer - ECS data sampling at fixed scale 1
const samplingPos = gameStore.dataLayer.sampling_position
const x = (rect.x - samplingPos.x) * 1  // Always scale 1
```

### Stage 2: Mirror Layer (No Viewport)
```typescript
// MirrorLayerRenderer - Texture capture at original scale
const textureWidth = (bounds.maxX - bounds.minX) * 1  // Original scale
const textureHeight = (bounds.maxY - bounds.minY) * 1  // Original scale
```

### Stage 3: Pre-filters (Original Scale)
**Applied to mirror layer textures at original scale 1**

```typescript
// SelectionFilterRenderer - SHOULD BE HERE
// Apply outline filter to original scale textures
filter.apply(mirrorTexture, originalScale: 1)

// PixelateFilterRenderer - SHOULD BE HERE  
// Apply pixelation to original scale textures
pixelateFilter.size = 1  // Original scale pixelation
```

### Stage 4: Viewport Transform
**Camera transforms applied (zoom, pan)**

```typescript
// LayeredInfiniteCanvas - Camera transforms
container.scale.set(zoomFactor)
container.position.set(-viewportPos.x * zoomFactor, -viewportPos.y * zoomFactor)
```

### Stage 5: Post-filters (Zoom-aware)
**Applied to viewport-transformed content**

```typescript
// NEW: Zoom-aware filters
// These work in zoomed space with different vertex calculations
const zoomAwareFilter = new ZoomAwareShader({
  zoomFactor: gameStore.mirrorLayer.zoom_factor,
  viewportBounds: screenBounds
})
```

### Stage 6: Upscaling
**Final result upscaled to screen resolution**

## Current Filter System Issues

### 1. **SelectionFilterRenderer** (Currently Wrong)
```typescript
// CURRENT: Applied after camera transforms
this.container.filters = [this.outlineFilter]
this.container.filterArea = new Rectangle(0, 0, gameStore.windowWidth, gameStore.windowHeight)
```

**Problem**: 
- Outline filter applied to zoomed content
- Filter vertices calculated in screen space
- Inconsistent outline thickness at different zoom levels

**SHOULD BE:**
```typescript
// Apply to mirror layer textures at original scale
const originalTexture = mirrorLayer.getCachedTexture(selectedObjectId)
const outlinedTexture = this.outlineFilter.apply(originalTexture, scale: 1)
```

### 2. **PixelateFilterRenderer** (Currently Wrong)
```typescript
// CURRENT: Applied to mirror sprites with camera transforms
spriteContainer.filters = [this.pixelateFilter]
this.pixelateFilter.size = pixeloidScale  // Wrong - uses zoom scale
```

**Problem**:
- Pixelation applied to zoomed sprites
- Pixel size changes with zoom level
- Inconsistent pixelation effect

**SHOULD BE:**
```typescript
// Apply to mirror layer textures at original scale
const originalTexture = mirrorLayer.getCachedTexture(objectId)
const pixelatedTexture = this.pixelateFilter.apply(originalTexture, size: 1)
```

## Shader Vertex Implications

### Pre-filter Shaders (Original Scale)
```glsl
// Vertices in original pixeloid space
attribute vec2 aPosition;  // Original scale vertices
uniform float uScale;      // Always 1.0
uniform vec2 uViewport;    // Original scale viewport

void main() {
    vec2 position = aPosition * uScale;  // Scale 1
    gl_Position = vec4(position, 0.0, 1.0);
}
```

### Post-filter Shaders (Zoom-aware)
```glsl
// Vertices in zoomed screen space
attribute vec2 aPosition;  // Screen space vertices
uniform float uZoomFactor; // Current zoom level
uniform vec2 uViewport;    // Screen viewport

void main() {
    vec2 position = aPosition * uZoomFactor;  // Zoom-aware scaling
    gl_Position = vec4(position, 0.0, 1.0);
}
```

## Required Architecture Changes

### 1. **Move SelectionFilterRenderer to Pre-filter Stage**
```typescript
// NEW: Pre-filter selection highlighting
class PreFilterSelectionRenderer {
  applyToMirrorTexture(texture: RenderTexture, selectedObjectId: string): RenderTexture {
    // Apply outline filter to original scale texture
    const outlineFilter = new OutlineFilter({
      thickness: 3,      // Fixed thickness in original scale
      color: 0xff4444
    })
    return outlineFilter.apply(texture)
  }
}
```

### 2. **Move PixelateFilterRenderer to Pre-filter Stage**
```typescript
// NEW: Pre-filter pixelation
class PreFilterPixelateRenderer {
  applyToMirrorTexture(texture: RenderTexture, pixelSize: number): RenderTexture {
    // Apply pixelation to original scale texture
    const pixelateFilter = new PixelateFilter(pixelSize)
    return pixelateFilter.apply(texture)
  }
}
```

### 3. **Create Post-filter System**
```typescript
// NEW: Post-filter zoom-aware effects
class PostFilterRenderer {
  applyZoomAwareEffects(container: Container, zoomFactor: number): void {
    // Apply filters that work correctly in zoomed space
    const zoomAwareShader = new ZoomAwareShader({
      zoomFactor: zoomFactor,
      screenBounds: getScreenBounds()
    })
    container.filters = [zoomAwareShader]
  }
}
```

## New Rendering Pipeline

### LayeredInfiniteCanvas (Modified)
```typescript
// Stage 1: Data layer
this.geometryRenderer.render()

// Stage 2: Mirror layer (no viewport)
this.mirrorLayerRenderer.render()

// Stage 3: Pre-filters (original scale)
this.preFilterSelectionRenderer.applyToMirrorTextures()
this.preFilterPixelateRenderer.applyToMirrorTextures()

// Stage 4: Apply camera transforms
this.cameraTransform.scale.set(zoomFactor)
this.cameraTransform.position.set(-viewportPos.x * zoomFactor, -viewportPos.y * zoomFactor)

// Stage 5: Post-filters (zoom-aware)
this.postFilterRenderer.applyZoomAwareEffects(this.cameraTransform, zoomFactor)

// Stage 6: Render to screen (upscaling handled by GPU)
```

## Benefits of Correct Architecture

### 1. **Consistent Filter Effects**
- Selection outlines same thickness at all zoom levels
- Pixelation maintains consistent pixel size
- Filters work predictably regardless of zoom

### 2. **Performance Optimization**
- Pre-filters applied once to cached textures
- Post-filters only applied to viewport content
- Reduced GPU processing for off-screen content

### 3. **Visual Quality**
- No upscaling artifacts in filter effects
- Crisp filter boundaries at all zoom levels
- Proper filter interaction with camera transforms

## Implementation Priority

### **Critical** (Breaks current system):
1. Move SelectionFilterRenderer to pre-filter stage
2. Move PixelateFilterRenderer to pre-filter stage
3. Modify LayeredInfiniteCanvas pipeline

### **High** (Enhances system):
1. Create post-filter system for zoom-aware effects
2. Implement proper shader vertex calculations
3. Add upscaling quality controls

### **Medium** (Future enhancements):
1. Additional pre-filter effects
2. Advanced post-filter effects
3. Filter performance optimizations

## Conclusion

This is a **fundamental architectural issue** that affects the entire filter system. The current approach of applying filters after camera transforms is incorrect and leads to:
- Inconsistent filter behavior
- Visual artifacts
- Performance issues

The correct approach is:
1. **Pre-filters** at original scale (consistent effects)
2. **Camera transforms** (zoom/pan)
3. **Post-filters** in zoomed space (zoom-aware effects)
4. **Upscaling** by GPU (quality preservation)

This requires significant refactoring of the filter system but will result in a much more robust and visually consistent architecture.