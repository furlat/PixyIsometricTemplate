# 🎯 Perfect Bbox Texture Copy Implementation Plan

## 🎯 **Objective: 100% Perfect Geometry Copy as Sprites**

Create sprites that are **completely invisible** when overlapping geometry - proving perfect coordinate and texture alignment.

## 🔧 **Implementation Steps**

### **Step 1: Add Rendering Texture Types**

```typescript
// Add to types/index.ts
export interface RenderingTextureData {
  objectId: string
  texture: Texture
  capturedAt: number
  isValid: boolean
  captureSettings: {
    resolution: number
    antialias: boolean
    scaleMode: string
  }
}

// Add to GameState
renderingTextures: {
  objectTextures: Map<string, RenderingTextureData>
  stats: {
    totalTextures: number
    lastCaptureTime: number
  }
}
```

### **Step 2: Extend GameStore with Texture Management**

```typescript
// Add to gameStore.ts
renderingTextures: {
  objectTextures: new Map(),
  stats: {
    totalTextures: 0,
    lastCaptureTime: 0
  }
}

// Add store actions
setRenderingTexture: (objectId: string, textureData: RenderingTextureData) => {
  gameStore.renderingTextures.objectTextures.set(objectId, textureData)
  gameStore.renderingTextures.stats.totalTextures = gameStore.renderingTextures.objectTextures.size
  gameStore.renderingTextures.stats.lastCaptureTime = Date.now()
},

getRenderingTexture: (objectId: string): RenderingTextureData | undefined => {
  return gameStore.renderingTextures.objectTextures.get(objectId)
},

clearRenderingTextures: () => {
  for (const textureData of gameStore.renderingTextures.objectTextures.values()) {
    textureData.texture.destroy()
  }
  gameStore.renderingTextures.objectTextures.clear()
  gameStore.renderingTextures.stats.totalTextures = 0
}
```

### **Step 3: Modify GeometryRenderer as Texture Producer**

```typescript
// Add to GeometryRenderer.ts
private updateGeometricObjectWithCoordinateConversion(obj: GeometricObject, pixeloidScale: number): void {
  // ... existing rendering code ...
  
  // After rendering graphics, capture and store texture
  this.captureAndStoreTexture(obj.id, graphics!)
}

private captureAndStoreTexture(objectId: string, graphics: Graphics): void {
  try {
    // CRITICAL: Capture with exact settings to prevent blur
    const texture = this.renderer.generateTexture(graphics, {
      resolution: 1,        // No upscaling
      antialias: false,     // No antialiasing
      scaleMode: 'nearest'  // Pixel-perfect scaling
    })
    
    updateGameStore.setRenderingTexture(objectId, {
      objectId,
      texture,
      capturedAt: Date.now(),
      isValid: true,
      captureSettings: {
        resolution: 1,
        antialias: false,
        scaleMode: 'nearest'
      }
    })
    
    console.log(`GeometryRenderer: Captured and stored texture for ${objectId}`)
  } catch (error) {
    console.error(`GeometryRenderer: Failed to capture texture for ${objectId}:`, error)
  }
}
```

### **Step 4: Fix BboxTextureTestRenderer Coordinate System**

```typescript
// Fix BboxTextureTestRenderer.ts
private createBboxTextureSprite(obj: GeometricObject): Sprite | null {
  if (!obj.metadata) return null

  // 1. Get texture from store (not local capture)
  const textureData = updateGameStore.getRenderingTexture(obj.id)
  if (!textureData || !textureData.isValid) {
    console.warn(`BboxTextureTestRenderer: No valid texture in store for object ${obj.id}`)
    return null
  }

  // 2. Get bbox dimensions (still from metadata)
  const bounds = obj.metadata.bounds
  const width = bounds.maxX - bounds.minX
  const height = bounds.maxY - bounds.minY

  // 3. Create sprite with store texture
  const sprite = new Sprite(textureData.texture)

  // 4. Set exact bbox dimensions
  sprite.width = width
  sprite.height = height

  // 5. CRITICAL FIX: Use vertex coordinates (same as GeometryRenderer)
  const offset = gameStore.mesh.vertex_to_pixeloid_offset
  const vertexX = bounds.minX - offset.x
  const vertexY = bounds.minY - offset.y
  sprite.position.set(vertexX, vertexY)

  console.log(`BboxTextureTestRenderer: Created sprite for ${obj.id} at vertex (${vertexX}, ${vertexY}) size ${width}x${height}`)
  return sprite
}

// Remove local texture capture - use store only
// Remove this.captureGeometryTexture method
// Remove this.objectTextures Map
```

### **Step 5: Initialize Renderer Dependencies**

```typescript
// Ensure GeometryRenderer has access to renderer for texture capture
// Modify GeometryRenderer.init() or constructor to store renderer reference

export class GeometryRenderer {
  private renderer!: Renderer
  
  public init(renderer: Renderer): void {
    this.renderer = renderer
    console.log('GeometryRenderer: Initialized with renderer for texture capture')
  }
}

// Update LayeredInfiniteCanvas.initializeRenderers()
public initializeRenderers(): void {
  if (this.app?.renderer) {
    this.geometryRenderer.init(this.app.renderer)  // Add this line
    this.pixelateFilterRenderer.init(this.app.renderer, this.geometryRenderer)
    this.bboxTextureTestRenderer.init(this.app.renderer, this.geometryRenderer)
    console.log('LayeredInfiniteCanvas: Initialized all renderers with dependencies')
  }
}
```

## ✅ **Expected Results**

### **Perfect Overlap Test:**
1. **Invisible sprites**: When both geometry and bboxTest layers are on, sprites should be completely invisible
2. **Identical appearance**: When geometry is off and bboxTest is on, should look exactly the same
3. **Perfect tracking**: WASD movement should keep sprites perfectly aligned
4. **No blur**: Sprites should be crisp and pixel-perfect

### **Validation Method:**
1. Draw a circle
2. Enable bboxTest layer
3. Sprites should be invisible (perfect overlap)
4. Disable geometry layer
5. Should see identical circle as sprite
6. WASD movement should maintain perfect alignment

## 🎯 **Success Criteria**

The BboxTextureTestRenderer becomes a **perfect mirror** of GeometryRenderer:
- ✅ Same coordinate system (vertex space)
- ✅ Same texture source (store-managed)
- ✅ Same movement behavior (tracks camera)
- ✅ Same visual quality (no blur)

Once this works perfectly, the same approach can be applied to fix the pixelate filter!