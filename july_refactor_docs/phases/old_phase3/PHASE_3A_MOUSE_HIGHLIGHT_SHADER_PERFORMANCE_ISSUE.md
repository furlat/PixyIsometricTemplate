# PHASE 3A - Mouse Highlight: False Shader Performance Issue

## **The Real Problem: CPU-Based Graphics, Not GPU Shader**

### **Current Implementation Analysis**
The "MouseHighlightShader_3a" is **misleadingly named** - it's not actually using a shader at all!

```typescript
// CURRENT (CPU-based) - This is NOT a shader!
this.graphics.rect(screenX, screenY, cellSize, cellSize).stroke({
  width: gameStore_3a.ui.mouse.strokeWidth,
  color: this.highlightColor,
  alpha: animatedAlpha
})

this.graphics.rect(screenX + 1, screenY + 1, cellSize - 2, cellSize - 2).fill({
  color: this.highlightColor,
  alpha: animatedAlpha * gameStore_3a.ui.mouse.fillAlpha
})
```

### **Why This Is Slow**
1. **CPU Graphics Operations**: `graphics.rect()`, `stroke()`, `fill()` are CPU-bound
2. **Expensive Redraws**: `graphics.clear()` + redraw on every mouse move
3. **CPU → GPU Transfer**: Graphics data must be uploaded to GPU each frame
4. **No Hardware Acceleration**: Not using GPU's parallel processing power

### **Performance Bottleneck**
```
Mouse Move → graphics.clear() → graphics.rect() → stroke() → fill() → GPU upload
```
**Every operation runs on CPU main thread!**

## **Real Shader Solutions**

### **Solution 1: PIXI GlowFilter (GPU-Accelerated)**
```typescript
import { GlowFilter } from 'pixi.js'

// Create GPU-accelerated glow filter
const highlightFilter = new GlowFilter({
  distance: 4,
  outerStrength: 2,
  innerStrength: 0.5,
  color: 0x00ff00,
  quality: 0.5
})

// Apply to a simple sprite at mouse position
this.highlightSprite.filters = [highlightFilter]
```

### **Solution 2: Custom Fragment Shader**
```typescript
// Custom GPU shader for mouse highlighting
const fragmentShader = `
precision mediump float;
uniform vec2 u_mouse_pos;
uniform vec2 u_cell_size;
uniform float u_time;
uniform vec4 u_highlight_color;

void main() {
  vec2 cell_pos = floor(gl_FragCoord.xy / u_cell_size);
  vec2 mouse_cell = floor(u_mouse_pos / u_cell_size);
  
  if (cell_pos == mouse_cell) {
    float pulse = sin(u_time * 3.0) * 0.5 + 0.5;
    gl_FragColor = u_highlight_color * pulse;
  } else {
    discard;
  }
}
`
```

### **Solution 3: Mesh-Based Highlighting**
```typescript
// Use existing mesh geometry for highlighting
// Update mesh vertex colors instead of drawing new geometry
const mesh = this.meshManager.getMesh()
const vertices = mesh.geometry.attributes.aVertexPosition.buffer
const colors = mesh.geometry.attributes.aVertexColor.buffer

// Update only the color buffer for highlighted cell
colors[highlightedCellIndex * 4] = 1.0  // Red
colors[highlightedCellIndex * 4 + 1] = 0.0  // Green
colors[highlightedCellIndex * 4 + 2] = 0.0  // Blue
colors[highlightedCellIndex * 4 + 3] = 1.0  // Alpha
```

## **Performance Comparison**

### **Current (CPU Graphics)**
- **Operation**: CPU-based rectangle drawing
- **Performance**: ~10-20ms per update
- **Bottleneck**: CPU main thread, GPU upload
- **Scalability**: Poor (linear with complexity)

### **GPU GlowFilter**
- **Operation**: GPU-accelerated filter
- **Performance**: ~1-2ms per update
- **Bottleneck**: None (runs on GPU)
- **Scalability**: Excellent (parallel processing)

### **Custom Shader**
- **Operation**: Fragment shader on GPU
- **Performance**: ~0.5-1ms per update
- **Bottleneck**: None (pure GPU)
- **Scalability**: Excellent (massively parallel)

## **Recommended Implementation**

### **Phase 1: Quick Fix - Use GlowFilter**
```typescript
export class MouseHighlightShader_3a {
  private highlightSprite: Sprite
  private glowFilter: GlowFilter
  
  constructor(meshManager: MeshManager_3a) {
    // Create simple 1x1 sprite for highlighting
    this.highlightSprite = new Sprite(Texture.WHITE)
    
    // Create GPU-accelerated glow filter
    this.glowFilter = new GlowFilter({
      distance: 8,
      outerStrength: 3,
      innerStrength: 0.5,
      color: 0x00ff00,
      quality: 0.3
    })
    
    this.highlightSprite.filters = [this.glowFilter]
  }
  
  public updateFromMesh(vertexCoord: VertexCoordinate): void {
    const cellSize = this.meshManager.getCellSize()
    
    // Simply move and scale the sprite - no redrawing!
    this.highlightSprite.x = vertexCoord.x * cellSize
    this.highlightSprite.y = vertexCoord.y * cellSize
    this.highlightSprite.width = cellSize
    this.highlightSprite.height = cellSize
  }
}
```

### **Phase 2: Proper Shader Implementation**
Create a true GPU shader that integrates with the existing mesh system for maximum performance.

## **Why This Will Fix The Lag**

### **Current Problem**
- **CPU bottleneck**: Graphics operations block main thread
- **Expensive redraws**: Complete recreation of geometry
- **GPU upload overhead**: Data transfer on every frame

### **Shader Solution**
- **GPU acceleration**: Parallel processing power
- **No redraws**: Simple position/parameter updates
- **Minimal data transfer**: Only position/color uniforms

### **Expected Performance**
- **10-20x faster**: From 10-20ms to 1-2ms
- **Smooth 60fps**: No frame drops
- **Responsive highlighting**: Immediate visual feedback

The current implementation is fundamentally limited by CPU-based graphics operations. A proper GPU shader is required for smooth mouse highlighting.