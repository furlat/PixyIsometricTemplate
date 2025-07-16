# PHASE 3A - Mouse Highlight: Sprite + ColorMatrixFilter Implementation Plan

## **Implementation Overview**
Replace the current CPU-based Graphics system with a GPU-accelerated Sprite + ColorMatrixFilter approach for immediate, responsive mouse highlighting.

## **Core Architecture**

### **Current System (CPU-based)**
```typescript
// CURRENT (Slow) - CPU Graphics operations
this.graphics.clear()
this.graphics.rect(screenX, screenY, cellSize, cellSize).stroke({...})
this.graphics.rect(screenX + 1, screenY + 1, cellSize - 2, cellSize - 2).fill({...})
```

### **New System (GPU-accelerated)**
```typescript
// NEW (Fast) - GPU Sprite + Filter
this.highlightSprite.x = vertexCoord.x * cellSize
this.highlightSprite.y = vertexCoord.y * cellSize
this.highlightSprite.width = cellSize
this.highlightSprite.height = cellSize
```

## **Detailed Implementation Plan**

### **Step 1: Update MouseHighlightShader_3a Constructor**
```typescript
import { Sprite, Texture, ColorMatrixFilter } from 'pixi.js'

export class MouseHighlightShader_3a {
  private highlightSprite: Sprite
  private colorMatrixFilter: ColorMatrixFilter
  private meshManager: MeshManager_3a
  
  constructor(meshManager: MeshManager_3a) {
    this.meshManager = meshManager
    
    // Create simple white sprite for highlighting
    this.highlightSprite = new Sprite(Texture.WHITE)
    
    // Set highlight color via tint (no animations)
    this.highlightSprite.tint = 0x00ff00  // Green highlight
    
    // Create color matrix filter for enhancement
    this.colorMatrixFilter = new ColorMatrixFilter()
    this.colorMatrixFilter.brightness(1.3)  // Static brightness boost
    this.colorMatrixFilter.contrast(1.1)    // Static contrast boost
    
    // Apply filter to sprite
    this.highlightSprite.filters = [this.colorMatrixFilter]
    
    // Initially hidden
    this.highlightSprite.visible = false
    
    console.log('MouseHighlightShader_3a: Initialized with Sprite + ColorMatrixFilter')
  }
}
```

### **Step 2: Replace Graphics-based Rendering**
```typescript
// REMOVE: Current graphics-based rendering
public render(): void {
  if (!this.isDirty) return
  this.graphics.clear()
  // ... complex graphics operations
}

// REPLACE WITH: Simple sprite positioning
public updateFromMesh(vertexCoord: VertexCoordinate): void {
  // Only show if mouse highlighting is enabled
  if (!gameStore_3a.ui.showMouse) {
    this.highlightSprite.visible = false
    return
  }
  
  const cellSize = this.meshManager.getCellSize()
  
  // Position sprite at mesh cell (no expensive redrawing)
  this.highlightSprite.x = vertexCoord.x * cellSize
  this.highlightSprite.y = vertexCoord.y * cellSize
  this.highlightSprite.width = cellSize
  this.highlightSprite.height = cellSize
  this.highlightSprite.visible = true
}
```

### **Step 3: Update Interface Methods**
```typescript
// CHANGE: getGraphics() -> getSprite()
public getSprite(): Sprite {
  return this.highlightSprite
}

// REMOVE: Valtio subscription setup (no longer needed)
// The old setupMouseSubscription() method can be removed
// since we're using direct mesh updates

// REMOVE: isDirty pattern (no longer needed)
// Direct positioning doesn't require dirty checking
```

### **Step 4: Update Phase3ACanvas Integration**
```typescript
// In Phase3ACanvas.ts renderMouseLayer()
private renderMouseLayer(): void {
  try {
    // CHANGE: Use getSprite() instead of getGraphics()
    const mouseSprite = this.mouseHighlightShader.getSprite()
    if (mouseSprite) {
      this.mouseLayer.addChild(mouseSprite)
    }
  } catch (error) {
    console.warn('Phase3ACanvas: Mouse rendering error:', error)
  }
}
```

### **Step 5: Remove Unnecessary Store Dependencies**
```typescript
// REMOVE: These are no longer needed for immediate highlighting
// - Animation timing calculations
// - Pulse calculations
// - isDirty state management
// - Valtio subscriptions for rendering

// KEEP: Only visibility check from store
if (!gameStore_3a.ui.showMouse) {
  this.highlightSprite.visible = false
  return
}
```

## **Performance Benefits**

### **Operation Comparison**
| Operation | Current (Graphics) | New (Sprite + Filter) |
|-----------|-------------------|----------------------|
| Clear | `graphics.clear()` | None needed |
| Draw | `rect() + stroke() + fill()` | `sprite.x/y/width/height` |
| GPU Upload | Every frame | Only on position change |
| Processing | CPU-bound | GPU-accelerated |
| Time | ~10-20ms | ~1-2ms |

### **Memory Comparison**
| Resource | Current | New |
|----------|---------|-----|
| Graphics Objects | Created/destroyed each frame | Single sprite reused |
| GPU Memory | Uploaded each frame | Static texture + filter |
| CPU Usage | High (graphics operations) | Low (position updates) |

## **Configuration Options**

### **Highlight Appearance**
```typescript
// Color options (via tint)
this.highlightSprite.tint = 0x00ff00  // Green
this.highlightSprite.tint = 0xff0000  // Red
this.highlightSprite.tint = 0x0000ff  // Blue
this.highlightSprite.tint = 0xffff00  // Yellow

// Brightness/Contrast options (via ColorMatrixFilter)
this.colorMatrixFilter.brightness(1.0)   // Normal
this.colorMatrixFilter.brightness(1.3)   // Brighter
this.colorMatrixFilter.brightness(1.5)   // Very bright

this.colorMatrixFilter.contrast(1.0)     // Normal
this.colorMatrixFilter.contrast(1.1)     // Enhanced
this.colorMatrixFilter.contrast(1.2)     // High contrast
```

### **Store Integration**
```typescript
// Read highlight color from store
this.highlightSprite.tint = gameStore_3a.ui.mouse.highlightColor

// Read brightness from store
this.colorMatrixFilter.brightness(gameStore_3a.ui.mouse.highlightIntensity)
```

## **Future Checkboard Pattern Integration**

### **Reusable Filter System**
```typescript
// The same ColorMatrixFilter approach can be used for checkboard
class CheckboardRenderer {
  private checkboardSprites: Sprite[]
  private colorMatrixFilter: ColorMatrixFilter
  
  constructor() {
    this.colorMatrixFilter = new ColorMatrixFilter()
    this.colorMatrixFilter.brightness(0.8)  // Darker checkboard
    this.colorMatrixFilter.contrast(1.2)    // Higher contrast
  }
  
  // Apply same filter to multiple sprites for checkboard pattern
  private applyCheckboardFilter(sprite: Sprite): void {
    sprite.filters = [this.colorMatrixFilter]
  }
}
```

### **Consistent Visual System**
- **Mouse Highlight**: Bright, high-contrast sprite
- **Checkboard Pattern**: Darker, medium-contrast sprites
- **Both use**: Same ColorMatrixFilter technology
- **Performance**: GPU-accelerated for both systems

## **Implementation Checklist**

### **Phase 1: Core Replacement**
- [ ] Replace Graphics with Sprite in constructor
- [ ] Add ColorMatrixFilter setup
- [ ] Update updateFromMesh() method
- [ ] Change getGraphics() to getSprite()
- [ ] Remove isDirty pattern

### **Phase 2: Integration**
- [ ] Update Phase3ACanvas to use getSprite()
- [ ] Remove Valtio subscriptions
- [ ] Test direct mesh connection
- [ ] Verify performance improvement

### **Phase 3: Configuration**
- [ ] Add store-driven color configuration
- [ ] Add store-driven brightness configuration
- [ ] Test visibility toggling
- [ ] Validate mesh-first architecture

### **Phase 4: Cleanup**
- [ ] Remove unused Graphics code
- [ ] Remove animation calculations
- [ ] Remove console logging
- [ ] Update documentation

## **Expected Results**
- **5-10x faster** mouse highlighting response
- **No lag** during mouse movements
- **Consistent 60fps** performance
- **Reusable filter system** for future checkboard work
- **Maintained mesh-first architecture**

This implementation provides immediate, responsive mouse highlighting while setting up a foundation for future filter-based visual effects.