# 🎯 Texture Store Integration Plan

## 💡 **Brilliant Architectural Improvement**

Instead of each renderer managing its own texture cache, integrate captured textures directly into the store - similar to how bbox data is stored.

## 🏗️ **Current vs Proposed Architecture**

### **Current (Fragmented):**
```typescript
// Each renderer has its own texture cache
PixelateFilterRenderer: Map<string, Texture>
BboxTextureTestRenderer: Map<string, Texture>  
// → Duplicate captures, inconsistent quality, no sharing
```

### **Proposed (Centralized):**
```typescript
// Store manages all rendering textures
gameStore.renderingTextures: {
  objectTextures: Map<string, RenderingTextureData>
  stats: { totalTextures, lastCaptureTime }
}
```

## 🔧 **Implementation Plan**

### **1. Extend Store with Rendering Textures**

```typescript
// New type for actual rendering textures (not base64 previews)
export interface RenderingTextureData {
  objectId: string
  texture: Texture           // Actual PIXI texture for rendering
  capturedAt: number
  isValid: boolean
  captureSettings: {         // Ensure consistent quality
    resolution: number
    antialias: boolean
    scaleMode: string
  }
}

// Add to gameStore
renderingTextures: {
  objectTextures: Map<string, RenderingTextureData>
  stats: {
    totalTextures: number
    lastCaptureTime: number
  }
}
```

### **2. GeometryRenderer as Texture Producer**

```typescript
// GeometryRenderer becomes the single source of truth for textures
export class GeometryRenderer {
  private updateGeometricObject(obj: GeometricObject): void {
    // ... render graphics ...
    
    // Capture and store texture in store
    this.captureAndStoreTexture(obj.id, graphics)
  }
  
  private captureAndStoreTexture(objectId: string, graphics: Graphics): void {
    const texture = this.renderer.generateTexture(graphics, {
      resolution: 1,
      antialias: false,
      scaleMode: 'nearest'
    })
    
    updateGameStore.setRenderingTexture(objectId, {
      objectId,
      texture,
      capturedAt: Date.now(),
      isValid: true,
      captureSettings: { resolution: 1, antialias: false, scaleMode: 'nearest' }
    })
  }
}
```

### **3. Filter Renderers as Texture Consumers**

```typescript
// BboxTextureTestRenderer reads from store
export class BboxTextureTestRenderer {
  private createBboxTextureSprite(obj: GeometricObject): Sprite | null {
    // Get texture from store instead of capturing
    const textureData = gameStore.renderingTextures.objectTextures.get(obj.id)
    
    if (!textureData || !textureData.isValid) {
      console.warn(`No valid texture in store for object ${obj.id}`)
      return null
    }
    
    const sprite = new Sprite(textureData.texture)
    // ... rest of sprite setup with CORRECT coordinate system ...
  }
}
```

### **4. Store Actions for Texture Management**

```typescript
// Add to updateGameStore
setRenderingTexture: (objectId: string, textureData: RenderingTextureData) => {
  gameStore.renderingTextures.objectTextures.set(objectId, textureData)
  gameStore.renderingTextures.stats.totalTextures = gameStore.renderingTextures.objectTextures.size
  gameStore.renderingTextures.stats.lastCaptureTime = Date.now()
},

invalidateRenderingTexture: (objectId: string) => {
  const textureData = gameStore.renderingTextures.objectTextures.get(objectId)
  if (textureData) {
    textureData.isValid = false
  }
},

clearRenderingTextures: () => {
  // Destroy all textures before clearing
  for (const textureData of gameStore.renderingTextures.objectTextures.values()) {
    textureData.texture.destroy()
  }
  gameStore.renderingTextures.objectTextures.clear()
  gameStore.renderingTextures.stats.totalTextures = 0
}
```

## ✅ **Benefits of This Approach**

### **1. Consistency**
- **Single texture capture point**: Only GeometryRenderer captures textures
- **Consistent quality**: Same capture settings across all consumers
- **Coordinated invalidation**: Store manages texture lifecycle

### **2. Performance**
- **No duplicate captures**: Multiple renderers share same textures  
- **Efficient caching**: Store-level texture management
- **Memory optimization**: Centralized cleanup and invalidation

### **3. Architecture**
- **Follows existing patterns**: Similar to bbox data storage
- **Clear separation**: Producer (GeometryRenderer) vs Consumers (Filter renderers)
- **Store-driven**: All texture state managed centrally

### **4. Debugging**
- **Centralized logging**: All texture operations go through store
- **Store panel visibility**: Can display texture stats
- **Consistent behavior**: Same texture source for all renderers

## 🎯 **Implementation Order**

1. **Add rendering texture types** to types/index.ts
2. **Extend gameStore** with renderingTextures section  
3. **Add store actions** for texture management
4. **Modify GeometryRenderer** to capture and store textures
5. **Update BboxTextureTestRenderer** to consume from store
6. **Fix coordinate system** in BboxTextureTestRenderer
7. **Test perfect overlap** with corrected implementation

This approach makes the bbox test layer a **true validation** of the centralized texture system that can then be applied to fix the pixelate filter!