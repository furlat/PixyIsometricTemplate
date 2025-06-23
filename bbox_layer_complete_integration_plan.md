# BBox Layer Complete Integration Plan

## Current Issues Analysis

### 🔍 Identified Problems
1. **Coordinate System Inconsistency**: BoundingBoxRenderer uses raw pixeloid coordinates, not the proper coordinate conversion pipeline used by GeometryRenderer
2. **No Viewport Culling**: Renders all objects regardless of viewport visibility
3. **Missing Coordinate Conversion**: Doesn't use `convertObjectToVertexCoordinates()` like GeometryRenderer
4. **Filter Isolation**: Good - already completely separate from filter system ✅
5. **Layer Integration**: Partially integrated but needs coordinate pipeline consistency

### 🎯 Solution Goals
- ✅ **Coordinate Consistency**: Use same coordinate conversion as GeometryRenderer
- ✅ **Filter Isolation**: Maintain complete separation from filter effects 
- ✅ **Data Availability**: Provide bbox data for shaders/filters if needed
- ✅ **Performance**: Add proper viewport culling
- ✅ **Integration**: Complete proper layer rendering

## Implementation Plan

### Step 1: Fix BoundingBoxRenderer Coordinate System
**File:** `app/src/game/BoundingBoxRenderer.ts`

**Problem:** Using raw metadata bounds instead of converted coordinates

**Solution:**
```typescript
import { Graphics } from 'pixi.js'
import { gameStore } from '../store/gameStore'
import { CoordinateHelper } from './CoordinateHelper'
import type { ViewportCorners, GeometricObject, PixeloidCoordinate } from '../types'

export class BoundingBoxRenderer {
  private graphics: Graphics
  
  constructor() {
    this.graphics = new Graphics()
  }

  public render(corners: ViewportCorners, pixeloidScale: number): void {
    this.graphics.clear()

    if (!gameStore.geometry.layerVisibility.bbox) {
      return
    }

    // Get objects that should show bounding boxes AND are in viewport
    const objectsToRender = gameStore.geometry.objects.filter(obj => 
      gameStore.geometry.mask.enabledObjects.has(obj.id) && 
      obj.isVisible && 
      obj.metadata &&
      this.isObjectInViewport(obj, corners) // ADD VIEWPORT CULLING
    )

    if (objectsToRender.length === 0) return

    // Use same coordinate conversion as GeometryRenderer
    for (const obj of objectsToRender) {
      const convertedObject = this.convertObjectToVertexCoordinates(obj)
      this.renderBoundingBoxRectangle(convertedObject, pixeloidScale)
    }
  }

  // NEW: Use same coordinate conversion as GeometryRenderer
  private convertObjectToVertexCoordinates(obj: GeometricObject): GeometricObject {
    const offset = gameStore.mesh.vertex_to_pixeloid_offset
    
    // Convert object coordinates to vertex space (same as GeometryRenderer)
    if ('centerX' in obj && 'centerY' in obj) {
      // Circle
      return {
        ...obj,
        centerX: obj.centerX - offset.x,
        centerY: obj.centerY - offset.y
      } as GeometricObject
    } else if ('x' in obj && 'width' in obj) {
      // Rectangle  
      return {
        ...obj,
        x: obj.x - offset.x,
        y: obj.y - offset.y
      } as GeometricObject
    } else if ('startX' in obj && 'endX' in obj) {
      // Line
      return {
        ...obj,
        startX: obj.startX - offset.x,
        startY: obj.startY - offset.y,
        endX: obj.endX - offset.x,
        endY: obj.endY - offset.y
      } as GeometricObject
    } else if ('anchorX' in obj && 'anchorY' in obj) {
      // Diamond
      return {
        ...obj,
        anchorX: obj.anchorX - offset.x,
        anchorY: obj.anchorY - offset.y
      } as GeometricObject
    } else if ('x' in obj && 'y' in obj) {
      // Point
      return {
        ...obj,
        x: obj.x - offset.x,
        y: obj.y - offset.y
      } as GeometricObject
    }
    
    return obj
  }

  // NEW: Add viewport culling (same logic as GeometryRenderer)
  private isObjectInViewport(obj: GeometricObject, corners: ViewportCorners): boolean {
    if (!obj.metadata) return false
    
    const bounds = obj.metadata.bounds
    
    // Check if object bounds intersect with viewport
    return !(
      bounds.maxX < corners.topLeft.x ||     // Object is left of viewport
      bounds.minX > corners.bottomRight.x || // Object is right of viewport  
      bounds.maxY < corners.topLeft.y ||     // Object is above viewport
      bounds.minY > corners.bottomRight.y    // Object is below viewport
    )
  }

  // UPDATED: Use converted coordinates for rendering
  private renderBoundingBoxRectangle(convertedObj: GeometricObject, pixeloidScale: number): void {
    if (!convertedObj.metadata) return

    // Calculate bounds from converted object coordinates
    const bounds = this.calculateConvertedBounds(convertedObj)
    
    const x = bounds.minX
    const y = bounds.minY  
    const width = bounds.maxX - bounds.minX
    const height = bounds.maxY - bounds.minY

    // Draw bounding box with scale-appropriate stroke width
    const strokeWidth = Math.max(0.1, 2 / pixeloidScale) // Maintain visibility at all zoom levels

    this.graphics
      .rect(x, y, width, height)
      .fill({
        color: 0xff0000,  // Red fill for easy distinction
        alpha: 0.1        // Very transparent
      })
      .stroke({
        width: strokeWidth,
        color: 0xff0000,  // Red outline
        alpha: 0.8        // More visible outline
      })
  }

  // NEW: Calculate bounds from converted coordinates
  private calculateConvertedBounds(obj: GeometricObject): { minX: number, maxX: number, minY: number, maxY: number } {
    if ('centerX' in obj && 'centerY' in obj) {
      // Circle
      const circle = obj as any
      return {
        minX: circle.centerX - circle.radius,
        maxX: circle.centerX + circle.radius,
        minY: circle.centerY - circle.radius,
        maxY: circle.centerY + circle.radius
      }
    } else if ('x' in obj && 'width' in obj) {
      // Rectangle
      const rect = obj as any
      return {
        minX: rect.x,
        maxX: rect.x + rect.width,
        minY: rect.y,
        maxY: rect.y + rect.height
      }
    } else if ('startX' in obj && 'endX' in obj) {
      // Line
      const line = obj as any
      return {
        minX: Math.min(line.startX, line.endX),
        maxX: Math.max(line.startX, line.endX),
        minY: Math.min(line.startY, line.endY),
        maxY: Math.max(line.startY, line.endY)
      }
    } else if ('anchorX' in obj && 'anchorY' in obj) {
      // Diamond
      const diamond = obj as any
      const halfWidth = diamond.width / 2
      const halfHeight = diamond.height / 2
      return {
        minX: diamond.anchorX - halfWidth,
        maxX: diamond.anchorX + halfWidth,
        minY: diamond.anchorY - halfHeight,
        maxY: diamond.anchorY + halfHeight
      }
    } else if ('x' in obj && 'y' in obj) {
      // Point (small bounds for visibility)
      const point = obj as any
      const pointSize = 2 // Minimum visible size
      return {
        minX: point.x - pointSize,
        maxX: point.x + pointSize,
        minY: point.y - pointSize,
        maxY: point.y + pointSize
      }
    }
    
    // Fallback to metadata bounds if available
    return obj.metadata?.bounds || { minX: 0, maxX: 0, minY: 0, maxY: 0 }
  }
}
```

### Step 2: Ensure Filter Isolation & Data Availability
**File:** `app/src/game/LayeredInfiniteCanvas.ts`

**Current Status:** ✅ Already properly isolated in separate layer

**Enhancement:** Add bbox data access for filters/shaders

```typescript
/**
 * Get bbox data for external access (filters, shaders, analysis)
 */
public getBboxData(): Map<string, { bounds: any, visible: boolean }> {
  const bboxData = new Map()
  
  if (gameStore.geometry.layerVisibility.bbox) {
    const enabledObjects = gameStore.geometry.objects.filter(obj => 
      gameStore.geometry.mask.enabledObjects.has(obj.id) && 
      obj.isVisible && 
      obj.metadata
    )
    
    for (const obj of enabledObjects) {
      bboxData.set(obj.id, {
        bounds: obj.metadata.bounds,
        visible: true
      })
    }
  }
  
  return bboxData
}
```

### Step 3: Complete Layer Integration  
**File:** `app/src/game/LayeredInfiniteCanvas.ts`

**Current Issue:** Layer rendering doesn't handle coordinate conversion properly

**Solution:** Update renderBboxLayer to use proper coordinate pipeline

```typescript
private renderBboxLayer(corners: ViewportCorners, pixeloidScale: number): void {
  if (gameStore.geometry.layerVisibility.bbox) {
    // Use same coordinate system as geometry layer
    this.boundingBoxRenderer.render(corners, pixeloidScale)
    
    // Position bbox layer at (0,0) like geometry layer (no transform offset)
    this.bboxLayer.position.set(0, 0)
    this.bboxLayer.visible = true
  } else {
    this.bboxLayer.visible = false
  }
}
```

### Step 4: Add Bbox Toggle Consistency
**File:** `app/src/ui/LayerToggleBar.ts`

**Enhancement:** Ensure bbox toggle works consistently with other layers

```typescript
// Already implemented correctly, just verify the bbox button state logic:
private updateButtonState(layerName: 'background' | 'geometry' | 'selection' | 'raycast' | 'mask' | 'bbox' | 'mouse'): void {
  const buttonId = `toggle-layer-${layerName}`
  const button = document.getElementById(buttonId)
  if (!button) return
  
  const isActive = this.layerStates[layerName]
  const baseClasses = ['btn', 'btn-sm', 'rounded-full']
  const activeClass = layerName === 'bbox' ? 'btn-error' : /* other colors */
  
  // Reset button classes
  button.className = baseClasses.join(' ')
  
  if (isActive) {
    button.classList.add(activeClass)
  } else {
    button.classList.add('btn-outline')
  }
}
```

## Filter System Coordination

### Data Flow Design
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Geometry      │    │  BBox Layer      │    │  Filter System  │
│   Objects       │───▶│  (Data Source)   │───▶│  (Data Consumer)│
│                 │    │                  │    │                 │
│ • Coordinates   │    │ • Bounds Data    │    │ • Outline       │
│ • Properties    │    │ • Visibility     │    │ • Pixelate      │  
│ • Metadata      │    │ • Coord Convert  │    │ • Effects       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Shaders       │
                       │ • Mouse HL      │
                       │ • Analysis      │
                       │ • Debug         │
                       └─────────────────┘
```

### Key Principles
1. **BBox Layer = Data Provider**: Provides accurate bounds data for other systems
2. **Filter Isolation**: Filters never affect bbox rendering 
3. **Coordinate Consistency**: Same coordinate conversion as GeometryRenderer
4. **Performance**: Viewport culling and efficient rendering
5. **Accessibility**: Bbox data available via public API for shaders/filters

## Testing Plan

### Visual Verification
1. **Coordinate Consistency**: Bbox rectangles should perfectly align with geometric objects during WASD movement
2. **Filter Isolation**: Enable outline/pixelate filters → bbox layer unaffected
3. **Viewport Culling**: Zoom out → only visible bboxes rendered
4. **Toggle Functionality**: Bbox layer toggle should show/hide all bbox rectangles
5. **Scale Responsiveness**: Bbox stroke width should remain visible at all zoom levels

### Integration Testing  
1. **WASD Movement**: Bbox rectangles move perfectly with geometry
2. **Zoom Consistency**: Bbox accuracy maintained at all zoom levels  
3. **Object Changes**: Adding/removing objects updates bbox layer correctly
4. **Layer Combinations**: All layer combinations work (geometry + bbox + filters)
5. **Performance**: No frame drops with many objects + bbox layer enabled

## Expected Results

### Before Integration
- ❌ **Coordinate inconsistency** between bbox and geometry
- ❌ **Performance issues** with unnecessary rendering
- ❌ **Poor visual alignment** during WASD movement
- ❌ **Missing viewport optimization**

### After Integration ✅
- ✅ **Perfect coordinate alignment** with GeometryRenderer
- ✅ **Filter isolation maintained** - no interference  
- ✅ **Viewport culling** for performance optimization
- ✅ **Data availability** for shaders/filters via public API
- ✅ **Consistent WASD movement** with all layers
- ✅ **Scale-responsive rendering** at all zoom levels

## Architecture Benefits

### Complete Layer System
- **Background Layer**: Grid/checkerboard (isolated)
- **Geometry Layer**: Objects with filters (outline, pixelate, etc.)
- **Selection Layer**: Reserved for non-filter selection effects  
- **BBox Layer**: Object bounds visualization (isolated, data provider)
- **Mask Layer**: Spatial analysis (isolated)
- **Mouse Layer**: Mouse visualization (isolated)

### Filter System Completeness
- **Geometry Objects**: Can have outline, pixelate, and future filters
- **All Other Layers**: Completely isolated from filters
- **Data Access**: Bbox, mask, and other data available for shader consumption
- **Performance**: Each layer optimized for its specific purpose

This completes the filter system integration with proper layer coordination!