# Off-Screen Object Initialization Bug Analysis

## System Flow (Expected)

1. **GeometryRenderer** → Draws shapes at their pixeloid coordinates
2. **GeometryHelper** → Computes pixeloid-perfect bounds (full object bounds)
3. **Store** → Computes visible_bbox based on screen intersection
4. **MirrorLayerRenderer** → 
   - Extracts full texture once
   - Creates sprite showing only visible portion
   - Positions sprite to perfectly overlay visible area

## The Bug

When an object starts completely off-screen and then zooms into view:

### Screenshot 1 Analysis
- Blue circle partially visible
- Red bbox extends beyond screen (showing full bounds, not clipped)
- This indicates visible_bbox is not being calculated correctly

### Screenshot 2 Analysis  
- Complex shape (peace symbol) 
- Blue geometry and red bbox are misaligned
- The texture appears "out of center"
- This shows the sprite positioning is wrong

## Root Cause

When an object starts off-screen:

1. **Initial state**: Object is created with `visibility: 'offscreen'`
2. **Zoom in**: Object comes into view but visibility state doesn't update properly
3. **Never transitions**: Since it starts off-screen, it never goes through the proper transition from `offscreen` → `partially-onscreen` → `fully-onscreen`
4. **Stale bounds**: The visible_bbox calculation happens once with wrong initial state
5. **Sprite never recomputed**: MirrorLayerRenderer keeps using the initial (wrong) texture extraction

## The Cascade

```
Object created off-screen
    ↓
Initial visibility = 'offscreen' (correct)
    ↓
Zoom brings object into view
    ↓
Visibility cache not updated (BUG)
    ↓
visible_bbox calculated with stale state
    ↓
MirrorLayerRenderer extracts wrong texture region
    ↓
Sprite positioned incorrectly
    ↓
Visual artifacts (misalignment, aliasing)
```

## Why BBox Shows the Problem

The BoundingBoxRenderer is showing the full bounds (not using visibility cache), which reveals that:
- The object IS in the correct position
- But the visible_bbox calculation is wrong
- So the mirror layer sprite is extracted/positioned incorrectly

## The Fix Needed

1. When objects move into view (via zoom or pan), update their visibility state
2. Recalculate visible_bbox when visibility changes
3. Force MirrorLayerRenderer to re-extract texture when transitioning from offscreen
4. Make BoundingBoxRenderer use visibility cache to show actual rendered bounds