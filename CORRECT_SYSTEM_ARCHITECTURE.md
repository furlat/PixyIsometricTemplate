# CORRECT ECS Camera Viewport System Architecture

## Core System Design

### Two Layer System:

1. **Geometry Layer (Layer 1)** - ECS Data Sampling Layer
2. **Mirror Layer (Layer 2+)** - Camera Viewport Display Layer

---

## Geometry Layer (Layer 1) - ECS Data Sampling

### Properties:
- **Scale**: ALWAYS 1 (FIXED - never changes)
- **Position**: ALWAYS (0,0) (FIXED - never changes)  
- **NO Camera Viewport**: Geometry layer has NO camera viewport applied to it
- **WASD Movement**: At zoom level 1, WASD moves the geometry sampling window (ECS-style data sampling)

### Behavior:
```typescript
// Geometry Layer - Pure ECS data sampling
class GeometryLayer {
  scale: 1,           // FIXED - never changes
  position: (0,0),    // FIXED - never changes
  
  // ECS viewport sampling window (controlled by WASD at zoom 1)
  sampleViewport: {
    x: wasdPosition.x,
    y: wasdPosition.y,
    width: screenWidth,
    height: screenHeight
  },
  
  render(): void {
    // Sample and render objects within viewport at scale 1
    const visibleObjects = storage.getObjectsInBounds(this.sampleViewport)
    visibleObjects.forEach(obj => renderAtScale1(obj))
  }
}
```

---

## Mirror Layer (Layer 2+) - Camera Viewport Display

### Properties:
- **Source**: Copies textures FROM Geometry Layer
- **Camera Viewport**: HAS camera viewport transforms applied
- **Scale**: Changes with zoom factor (1, 2, 4, 8, etc.)
- **Position**: Camera viewport position transforms

### Behavior:
```typescript
// Mirror Layer - Camera viewport display
class MirrorLayer {
  sourceTexture: GeometryLayer.getTexture(),  // Copy from Layer 1
  
  // Camera viewport transforms
  scale: zoomFactor,                          // 1, 2, 4, 8, 16, 32, 64, 128
  position: (-cameraX * zoomFactor, -cameraY * zoomFactor),
  
  render(): void {
    // Display the copied texture with camera transforms
    this.displayTexture(this.sourceTexture, this.scale, this.position)
  }
}
```

---

## Layer Visibility Control

### At Zoom Level 1:
- **Geometry Layer**: VISIBLE (rendering live geometry)
- **Mirror Layer**: VISIBLE (showing same content with camera viewport ready)
- **Both layers show the same content**

### At Zoom Level 2+:
- **Geometry Layer**: HIDDEN (rendering turned OFF)
- **Mirror Layer**: VISIBLE (showing camera viewport of pre-rendered Layer 1)
- **Only mirror layer visible with zoom transforms**

```typescript
// Layer visibility switching
function updateLayerVisibility(zoomFactor: number) {
  if (zoomFactor === 1) {
    geometryLayer.visible = true   // Show live geometry
    mirrorLayer.visible = true     // Show mirror (same content)
  } else {
    geometryLayer.visible = false  // Hide live geometry
    mirrorLayer.visible = true     // Show only mirror with viewport
  }
}
```

---

## WASD Movement Behavior

### At Zoom Level 1 (Both Layers Visible):
- **WASD applies ONLY to Geometry Layer sampling window**
- **Geometry Layer**: Moves the ECS sampling window (what gets rendered)
- **Mirror Layer**: Shows COMPLETE mirror of all geometry (no viewport movement)
- **Result**: Geometry layer samples different data, mirror shows everything

```typescript
// WASD at zoom 1 - move only geometry sampling
function handleWASDAtZoom1(deltaX: number, deltaY: number) {
  // Move geometry layer sampling window
  geometryLayer.sampleViewport.x += deltaX
  geometryLayer.sampleViewport.y += deltaY
  
  // Mirror layer shows COMPLETE geometry (no movement)
  // mirrorLayer.position stays at (0,0) - shows full geometry texture
}
```

### At Zoom Level 2+ (Only Mirror Layer Visible):
- **WASD applies ONLY to Mirror Layer camera viewport**
- **Geometry Layer**: Stays fixed (not visible anyway)
- **Mirror Layer**: Camera viewport moves around the pre-rendered Layer 1 texture
- **Result**: Camera viewport navigation of pre-rendered content

```typescript
// WASD at zoom 2+ - move only mirror layer viewport
function handleWASDAtZoom2Plus(deltaX: number, deltaY: number) {
  // Geometry layer stays fixed (not visible)
  // Move only mirror layer camera viewport
  mirrorLayer.cameraPosition.x += deltaX
  mirrorLayer.cameraPosition.y += deltaY
}
```

---

## Future Enhancement: Viewport Bounds Detection

### When Mirror Layer Viewport Hits Bounds:
```typescript
// Future: ECS expansion when viewport hits pre-rendered bounds
function handleViewportBoundsHit(newViewportPosition) {
  if (isOutsidePreRenderedBounds(newViewportPosition)) {
    // Expand geometry layer sampling area
    geometryLayer.expandSamplingBounds(newViewportPosition)
    
    // Re-render geometry layer at new bounds
    geometryLayer.render()
    
    // Update mirror layer source texture
    mirrorLayer.updateSourceTexture(geometryLayer.getTexture())
  }
}
```

---

## System Flow Summary

### Zoom Level 1 Flow:
```
User Input → WASD → Only Geometry Sampling Moves → Geometry Renders Live + Mirror Shows Complete Geometry
```

### Zoom Level 2+ Flow:
```
User Input → WASD → Only Mirror Viewport Moves → Shows Camera View of Pre-rendered Layer 1
```

### Layer Switching Flow:
```
Zoom Change → Update Layer Visibility → Geometry ON/OFF + Mirror Always ON
```

---

## Key Principles

1. **Geometry Layer = ECS Data Sampling** (no camera viewport, pure data layer)
2. **Mirror Layer = Camera Viewport Display** (has camera viewport, pure display layer)  
3. **WASD Behavior Changes with Zoom Level** (both layers vs viewport only)
4. **Layer Visibility Switches with Zoom** (both visible vs mirror only)
5. **No Camera Viewport on Geometry Layer** (camera viewport ONLY on mirror layer)

This creates a clean separation between data sampling (ECS) and display viewport (camera), with smooth transitions between zoom levels and intuitive WASD behavior.