# Selection Highlight Filter Enhancement Plan

## Current Problem
- Selection highlight draws same shape with slightly thicker stroke
- Nearly invisible - identical to actual geometry  
- User feedback: "not much of a way to detect it"

## Solution: Use PixiJS Filters

### Available Filters (pixi-filters v6.1.3 already installed)
- **OutlineFilter** - Perfect for selection (creates colored outline)
- **GlowFilter** - Creates glow effect around object
- **DropShadowFilter** - Creates drop shadow

### Recommended: OutlineFilter
**Benefits:**
- Clear, visible outline around selected object
- Configurable color, thickness, quality
- Distinct from actual geometry
- Works with any shape type

## Implementation Approach

### Option 1: Filter Applied to Individual Objects (Recommended)
```typescript
import { OutlineFilter } from 'pixi-filters'

// In SelectionHighlightRenderer
private selectionFilter = new OutlineFilter({
  thickness: 2,
  color: 0xff0000,  // Red outline
  quality: 0.1
})

// Apply filter to selected object's graphics instead of drawing new graphics
```

### Option 2: Filter Applied to Selection Layer
```typescript
// Apply filter to entire selection layer
this.selectionLayer.filters = [this.selectionFilter]
```

## Implementation Strategy

### Phase 1: Replace Graphics-Based Highlighting
**Current:** Draw selection graphics with thicker stroke
**New:** Apply OutlineFilter to rendered geometry

### Phase 2: Dynamic Filter Application
**When object selected:**
1. Find object's rendered graphics/container in GeometryRenderer
2. Apply OutlineFilter to that specific graphics
3. Animate filter properties (pulsing thickness/alpha)

**When selection cleared:**
1. Remove filter from previously selected object

### Phase 3: Enhanced Visual Effects
- Pulsing outline thickness
- Color coding (red for selection, blue for hover, etc.)
- Smooth fade in/out transitions

## Code Changes Required

### 1. SelectionHighlightRenderer.ts
```typescript
import { OutlineFilter } from 'pixi-filters'

export class SelectionHighlightRenderer {
  private outlineFilter: OutlineFilter
  private currentFilteredObject: Container | null = null
  
  constructor() {
    this.outlineFilter = new OutlineFilter({
      thickness: 3,
      color: 0xff4444,  // Bright red
      quality: 0.1,
      alpha: 0.8
    })
  }
  
  public render(corners: ViewportCorners, pixeloidScale: number): void {
    const selectedId = gameStore.geometry.selection.selectedObjectId
    
    // Remove filter from previous selection
    if (this.currentFilteredObject) {
      this.currentFilteredObject.filters = null
      this.currentFilteredObject = null
    }
    
    if (selectedId) {
      // Get the actual rendered object from GeometryRenderer
      const objectContainer = this.getRenderedObjectContainer(selectedId)
      if (objectContainer) {
        // Apply outline filter
        objectContainer.filters = [this.outlineFilter]
        this.currentFilteredObject = objectContainer
        
        // Animate the outline (pulsing effect)
        this.animateOutline()
      }
    }
  }
}
```

### 2. GeometryRenderer Integration
**Need method to get rendered object containers:**
```typescript
// In GeometryRenderer.ts
public getRenderedObjectContainer(objectId: string): Container | null {
  // Return the specific container/graphics for the object
  return this.objectContainers.get(objectId) || null
}
```

## Benefits of Filter Approach

### Visual
- **Highly visible** - Clear outline distinct from geometry
- **Professional appearance** - Smooth, anti-aliased outline  
- **Customizable** - Color, thickness, glow effects
- **Animated** - Pulsing, fading, color transitions

### Performance
- **GPU accelerated** - Filters run on GPU
- **Efficient** - No additional geometry drawing
- **Reusable** - Same filter instance for all selections

### Compatibility
- **Works with WASD** - Filters move with the objects automatically
- **Works with all shapes** - Outline adapts to any geometry
- **Layer independent** - Can be applied to any rendered object

## Expected Result
- **Bright red outline** around selected objects
- **Pulsing animation** to draw attention
- **Moves with WASD** automatically
- **Clearly visible** against any background
- **Professional selection UX**