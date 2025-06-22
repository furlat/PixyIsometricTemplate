# Simple Coordinate System Implementation Plan

## Based on Correct Understanding

Following the user's feedback, here's the proper implementation that eliminates complexity and circular dependencies.

## 1. Store Redesign

### Replace Complex State with Simple State

**Remove**:
- `camera.position` (this was causing circular dependencies)
- `camera.pixeloidScale` vs `staticMesh.currentScale` duplication
- Complex viewport corner calculations
- Fabricated viewport offset calculations

**Keep Only**:
```typescript
// Single scale variable used everywhere
pixeloid_scale: number

// Single offset - which pixeloid appears at vertex (0,0)
viewport_offset: PixeloidCoordinate

// Window size for calculations
windowWidth: number
windowHeight: number
```

## 2. Core Conversion Functions

**Simple and correct**:
```typescript
// mesh vertex to pixeloid
function vertexToPixeloid(vertex: VertexCoordinate): PixeloidCoordinate {
  return {
    x: vertex.x + gameStore.viewport_offset.x,
    y: vertex.y + gameStore.viewport_offset.y
  }
}

// pixeloid to mesh vertex  
function pixeloidToVertex(pixeloid: PixeloidCoordinate): VertexCoordinate {
  return {
    x: pixeloid.x - gameStore.viewport_offset.x,
    y: pixeloid.y - gameStore.viewport_offset.y
  }
}
```

## 3. Input Handling Redesign

### WASD Movement
```typescript
function handleWASDMovement(deltaPixels: {x: number, y: number}) {
  // Convert pixel movement to pixeloid movement
  const pixeloidDelta = {
    x: deltaPixels.x / gameStore.pixeloid_scale,
    y: deltaPixels.y / gameStore.pixeloid_scale
  }
  
  // Update offset (this is the ONLY thing that changes during movement)
  gameStore.viewport_offset.x += pixeloidDelta.x
  gameStore.viewport_offset.y += pixeloidDelta.y
}
```

### Zoom Handling
```typescript
function handleZoom(newScale: number) {
  // Simply change scale, offset stays constant
  gameStore.pixeloid_scale = newScale
  // No recalculation of offset needed!
}
```

## 4. Static Mesh Manager Simplification

**Remove all complex calculations, replace with**:
```typescript
function updateCoordinateMapping(resolution: MeshResolution) {
  const level = resolution.level  // Same as pixeloid_scale
  
  // Simple mapping generation
  for (let vx = 0; vx < vertexWidth; vx++) {
    for (let vy = 0; vy < vertexHeight; vy++) {
      const vertex = { x: vx, y: vy }
      // Simple conversion
      const pixeloid = {
        x: vx + gameStore.viewport_offset.x,
        y: vy + gameStore.viewport_offset.y
      }
      
      // Store bidirectional mapping
      meshToPixeloid.set(`${vx},${vy}`, pixeloid)
      pixeloidToMesh.set(`${pixeloid.x},${pixeloid.y}`, vertex)
    }
  }
}
```

## 5. Mouse Highlight Shader Implementation

**Same as checkerboard shader with highlight**:
```glsl
// Vertex shader (same as grid)
attribute vec2 aPosition;
varying vec2 vGridPos;
uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;

void main() {
  mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
  gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
  vGridPos = aPosition;
}

// Fragment shader
precision mediump float;
varying vec2 vGridPos;
uniform vec2 uHighlightVertex;
uniform vec3 uHighlightColor;

void main() {
  vec2 gridCoord = floor(vGridPos);
  
  // Check if this is the highlighted vertex
  if (abs(gridCoord.x - uHighlightVertex.x) < 0.5 && 
      abs(gridCoord.y - uHighlightVertex.y) < 0.5) {
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

## 6. Implementation Steps

### Step 1: Clean Store State
- Remove duplicate scale variables
- Remove camera.position (source of circular dependencies)
- Add single `viewport_offset` variable

### Step 2: Fix CoordinateHelper
- Replace complex formulas with simple `vertex + offset`
- Remove all camera position dependencies

### Step 3: Simplify StaticMeshManager
- Remove complex viewport calculations
- Use simple offset-based mapping

### Step 4: Fix Input Handling
- WASD updates offset directly
- Zoom changes scale, keeps offset

### Step 5: Implement Mouse Highlight Shader
- Copy grid shader structure
- Add highlight vertex uniform
- Simple coordinate comparison

## 7. Expected Results

- **No circular dependencies**: Offset doesn't depend on camera position
- **Simple movement**: WASD just updates offset
- **Simple zoom**: Just changes scale, offset preserved
- **Simple conversion**: `pixeloid = vertex + offset`
- **Consistent alignment**: Vertex (0,0) always at pixel (0,0)
- **Mouse highlight**: Working shader-based highlighting

## 8. Key Fixes

1. **Single scale variable**: `pixeloid_scale` used everywhere
2. **Offset-based movement**: No camera position calculations
3. **Preserved zoom**: Offset stays constant during zoom
4. **Simple formulas**: No multiplication by level
5. **No circular deps**: Clean, linear data flow

This eliminates all the complexity I incorrectly introduced and follows the user's correct understanding of how the system should work.