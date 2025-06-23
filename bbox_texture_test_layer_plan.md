# 🎯 Bbox Texture Test Layer: Perfect Overlap Approach

## 💡 **Core Insight**
The problem is **sprite shape ≠ bounding box shape**. We need to create sprites that are **exactly** the bounding box dimensions and fill them with the captured texture.

## 🎯 **New Approach: Bbox-Shaped Sprites**

### **Step 1: Create Simple Test Layer**
```typescript
// New renderer: BboxTextureTestRenderer
// Purpose: Create sprites that exactly match bounding box dimensions
// Result: Perfect overlap with geometry layer
```

### **Step 2: Bbox-Exact Sprite Creation**
```typescript
// For each object:
// 1. Get bbox dimensions from obj.metadata.bounds
// 2. Create sprite EXACTLY those dimensions (width/height)
// 3. Fill sprite with captured texture
// 4. Position sprite at bbox.minX, bbox.minY
// Result: Sprite IS the bounding box
```

### **Step 3: Texture Filling Strategy**
```typescript
// Option A: Stretch texture to fill bbox
sprite.width = bounds.maxX - bounds.minX
sprite.height = bounds.maxY - bounds.minY

// Option B: Tile texture within bbox
// Option C: Center texture within bbox
```

## 🛠️ **Implementation Plan**

### **Create BboxTextureTestRenderer.ts**
```typescript
export class BboxTextureTestRenderer {
  private container: Container = new Container()
  private bboxSprites: Map<string, Sprite> = new Map()
  
  public render(corners: ViewportCorners, pixeloidScale: number): void {
    // Clear previous sprites
    this.container.removeChildren()
    this.clearOldSprites()
    
    const visibleObjects = gameStore.geometry.objects.filter(obj => 
      obj.isVisible && obj.metadata && this.isObjectInViewport(obj, corners)
    )
    
    for (const obj of visibleObjects) {
      const bboxSprite = this.createBboxTextureSprite(obj)
      if (bboxSprite) {
        this.container.addChild(bboxSprite)
      }
    }
  }
  
  private createBboxTextureSprite(obj: GeometricObject): Sprite | null {
    // 1. Get exact bbox dimensions
    const bounds = obj.metadata.bounds
    const width = bounds.maxX - bounds.minX
    const height = bounds.maxY - bounds.minY
    
    // 2. Capture texture (same method as before)
    const texture = this.captureGeometryTexture(obj)
    if (!texture) return null
    
    // 3. Create sprite exactly matching bbox
    const sprite = new Sprite(texture)
    
    // 4. Set sprite to exact bbox dimensions
    sprite.width = width
    sprite.height = height
    
    // 5. Position at bbox origin
    sprite.position.set(bounds.minX, bounds.minY)
    
    // 6. Apply pixelate filter
    sprite.filters = [this.pixelateFilter]
    
    return sprite
  }
}
```

### **Add to LayeredInfiniteCanvas**
```typescript
// Add new test layer
private bboxTextureTestLayer: Container
private bboxTextureTestRenderer: BboxTextureTestRenderer

// In setupLayers():
this.cameraTransform.addChild(this.bboxTextureTestLayer)
```

### **Layer Order for Testing**
```typescript
// Test setup:
├── geometryLayer (original geometry)
├── bboxTextureTestLayer (bbox sprites with textures) ← NEW TEST LAYER
├── pixelateLayer (current broken implementation) ← Keep for comparison
```

## ✅ **Expected Result**
- **Perfect overlap**: Bbox sprites exactly match geometry positions
- **Correct dimensions**: Sprite dimensions = bbox dimensions
- **Clean testing**: Can toggle test layer on/off independently
- **Debug capability**: Compare original vs bbox sprites side by side

## 🎯 **Testing Strategy**
1. **Overlap Test**: Enable both geometry and bbox test layers - should be identical
2. **Position Test**: Move camera - bbox sprites should follow perfectly
3. **Size Test**: Zoom - bbox sprites should scale correctly
4. **Filter Test**: Apply pixelate to bbox sprites - should be clean and aligned

This approach eliminates **all** coordinate and shape mismatches by making the sprite **exactly** the bounding box!