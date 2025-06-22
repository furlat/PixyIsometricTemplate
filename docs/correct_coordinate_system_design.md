# Correct Coordinate System Design - From First Principles

## Core Understanding

**The user's feedback is absolutely correct. I was overcomplicating a simple system.**

## Fundamental Principles

### 1. Single Scale Variable
- **ONE** `pixeloid_scale` variable (not two separate ones)
- Used by both mesh generation AND pixeloid calculations
- No `camera.pixeloidScale` vs `staticMesh.currentScale` duplication

### 2. Viewport Always Shows Vertex (0,0) at Pixel (0,0)
- The viewport ALWAYS displays vertex (0,0) at the top-left pixel (0,0)
- This is a constant - never changes
- No complex camera positioning calculations

### 3. Simple Conversion Formula
```
pixeloid = vertex + offset
```
**NOT** `pixeloid = vertex * level + offset` - that was wrong!

### 4. Offset - The Key State Variable
- `offset` determines which pixeloid coordinate appears at vertex (0,0)
- This is the ONLY state that changes during movement
- No circular dependencies on camera position or viewport corners

## How Movement Works

### WASD Movement
1. Convert continuous pixel movement to discrete pixeloid movement: `pixeloid_movement = pixel_movement / pixeloid_scale`
2. Add to current offset: `new_offset = old_offset + pixeloid_movement`
3. Store the new offset

### Zooming
1. Change `pixeloid_scale` to new value
2. **Keep offset constant** - no recalculation needed
3. Swap to new vertex grid with different scale

## Implementation

### Store State
```typescript
// Single scale variable
pixeloid_scale: number

// Single offset variable - which pixeloid appears at vertex (0,0)
viewport_offset: PixeloidCoordinate
```

### Conversion Functions
```typescript
// Simple conversion
function vertexToPixeloid(vertex: VertexCoordinate): PixeloidCoordinate {
  return {
    x: vertex.x + store.viewport_offset.x,
    y: vertex.y + store.viewport_offset.y
  }
}

function pixeloidToVertex(pixeloid: PixeloidCoordinate): VertexCoordinate {
  return {
    x: pixeloid.x - store.viewport_offset.x,
    y: pixeloid.y - store.viewport_offset.y
  }
}
```

### WASD Movement Handler
```typescript
function handleWASDMovement(deltaPixels: {x: number, y: number}) {
  // Convert pixel movement to pixeloid movement
  const pixeloidDelta = {
    x: deltaPixels.x / store.pixeloid_scale,
    y: deltaPixels.y / store.pixeloid_scale
  }
  
  // Update offset
  store.viewport_offset.x += pixeloidDelta.x
  store.viewport_offset.y += pixeloidDelta.y
}
```

### Zoom Handler
```typescript
function handleZoom(newScale: number) {
  // Simply change scale, keep offset constant
  store.pixeloid_scale = newScale
  // offset stays the same!
}
```

## Mouse Highlight Shader

Simple implementation - same as checkerboard shader but highlight specific vertex:

```glsl
// In fragment shader
uniform vec2 uHighlightVertex; // The vertex to highlight
uniform vec3 uHighlightColor;  // Color for highlighted vertex

void main() {
  vec2 gridCoord = floor(vGridPos);
  
  // Check if this is the highlighted vertex
  if (gridCoord.x == uHighlightVertex.x && gridCoord.y == uHighlightVertex.y) {
    gl_FragColor = vec4(uHighlightColor, 1.0);
  } else {
    // Normal checkerboard pattern
    float checker = mod(gridCoord.x + gridCoord.y, 2.0);
    vec3 lightColor = vec3(0.941, 0.941, 0.941);
    vec3 darkColor = vec3(0.878, 0.878, 0.878);
    vec3 color = mix(lightColor, darkColor, checker);
    gl_FragColor = vec4(color, 1.0);
  }
}
```

## What I Got Wrong

1. **Circular Dependencies**: Made offset depend on camera position, which depended on viewport corners, etc.
2. **Complex Formulas**: Used `vertex * level + offset` instead of simple `vertex + offset`
3. **Duplicate Variables**: Had two scale variables that should be one
4. **Overcomplicated Movement**: Tried to calculate camera positions instead of just updating offset
5. **Overcomplicated Zoom**: Tried to recalculate offsets instead of just changing scale

## The Simple Truth

- Viewport shows vertices starting at (0,0)
- Offset determines which pixeloid is at vertex (0,0)
- Movement changes offset
- Zoom changes scale but preserves offset
- Conversion is trivial: `pixeloid = vertex + offset`

That's it. Everything else I added was unnecessary complexity.