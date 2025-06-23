# Unified Pixeloid Anchoring System Design

## 🎯 Problem Statement: Inconsistent Anchoring Behavior

### Current Issues
1. **Circle**: Snaps to **center** when drawing
2. **Rectangle**: Snaps to **top-left corner** when drawing  
3. **Line**: Snaps to **start point** when drawing
4. **Diamond**: Snaps to **west vertex** when drawing
5. **Point**: Snaps to **exact position** when drawing

**Result**: Different geometry types anchor to different points within the same pixeloid → coordinate drift during zoom

## 🏗️ Solution: Unified Configurable Anchoring System

### Core Principle: Click = Starting Vertex
```
User clicks at pixeloid (5.7, 3.2)
↓
Snap to configured anchor point within that pixeloid
↓  
Use snapped position as starting vertex for drawing
↓
Drag defines size/end point from starting vertex
```

### 9 Anchor Point Options per Object Type
```
Pixeloid Grid Cell (5,3) to (6,4):
┌─────┬─────┬─────┐
│ TL  │ TM  │ TR  │ ← TL=top-left, TM=top-mid, TR=top-right
├─────┼─────┼─────┤
│ LM  │ C   │ RM  │ ← LM=left-mid, C=center, RM=right-mid  
├─────┼─────┼─────┤
│ BL  │ BM  │ BR  │ ← BL=bottom-left, BM=bottom-mid, BR=bottom-right
└─────┴─────┴─────┘

### ⚠️ IMPORTANT: Isometric Shape Constraints
- **Diamonds**: Height is ALWAYS derived from width (height = width / 4)
- **Circles**: Radius is ALWAYS derived from width (radius = width / 2)
- **User cannot independently set height** for these isometric shapes
- **Only width dimension** is user-controlled during drawing
- **Height calculation** maintains proper isometric proportions
Coordinates:
TL: (5, 3)     TM: (5.5, 3)   TR: (6, 3)
LM: (5, 3.5)   C:  (5.5, 3.5) RM: (6, 3.5)  
BL: (5, 4)     BM: (5.5, 4)   BR: (6, 4)
```

## 📊 Object Type Configuration

### Default Anchoring Configuration
```typescript
interface GeometryAnchorConfig {
  rectangle: 'top-left'     // ✅ Current behavior - keep
  circle: 'top-left'        // ❌ Change from 'center' to 'top-left'  
  line: 'top-left'          // ❌ Change from 'start-point' to 'top-left'
  point: 'top-left'         // ❌ Change from 'exact' to 'top-left'
  diamond: 'top-left'       // ❌ Change from 'west-vertex' to 'top-left'
}
```

### Per-Object Anchor Configuration
```typescript
interface GeometricObjectWithAnchor extends GeometricObject {
  anchorConfig: {
    snapPoint: 'top-left' | 'top-mid' | 'top-right' | 
               'left-mid' | 'center' | 'right-mid' |
               'bottom-left' | 'bottom-mid' | 'bottom-right'
    preComputedAnchors?: {
      // Store all vertex positions at creation time
      vertices: PixeloidCoordinate[]
      createdAtOffset: PixeloidCoordinate  // Offset when created
    }
  }
}
```

## 🛠️ Implementation Strategy

### Phase 1: Unified Snapping Function
```typescript
// In GeometryHelper.ts
export class GeometryHelper {
  
  static snapToPixeloidAnchor(
    clickPosition: PixeloidCoordinate, 
    snapPoint: AnchorSnapPoint
  ): PixeloidCoordinate {
    const gridX = Math.floor(clickPosition.x)
    const gridY = Math.floor(clickPosition.y)
    
    switch (snapPoint) {
      case 'top-left':     return { x: gridX,     y: gridY }
      case 'top-mid':      return { x: gridX + 0.5, y: gridY }
      case 'top-right':    return { x: gridX + 1, y: gridY }
      case 'left-mid':     return { x: gridX,     y: gridY + 0.5 }
      case 'center':       return { x: gridX + 0.5, y: gridY + 0.5 }
      case 'right-mid':    return { x: gridX + 1, y: gridY + 0.5 }
      case 'bottom-left':  return { x: gridX,     y: gridY + 1 }
      case 'bottom-mid':   return { x: gridX + 0.5, y: gridY + 1 }
      case 'bottom-right': return { x: gridX + 1, y: gridY + 1 }
    }
  }
}
```

### Phase 2: Update Object Creation Logic

#### Rectangle (Already Correct)
```typescript
// Current: click = top-left corner ✅
createRectangle(clickPos: PixeloidCoordinate, dragPos: PixeloidCoordinate) {
  const snapPoint = getAnchorConfig('rectangle') // 'top-left'
  const anchoredStart = GeometryHelper.snapToPixeloidAnchor(clickPos, snapPoint)
  
  const width = dragPos.x - anchoredStart.x
  const height = dragPos.y - anchoredStart.y
  
  return {
    x: anchoredStart.x,  // Top-left corner
    y: anchoredStart.y,
    width: Math.abs(width),
    height: Math.abs(height),
    anchorConfig: { 
      snapPoint,
      preComputedAnchors: {
        vertices: [anchoredStart], // Store creation anchor
        createdAtOffset: getCurrentOffset()
      }
    }
  }
}
```

#### Circle (Needs Change)
```typescript
// NEW: click = top-left corner of bounding box
createCircle(clickPos: PixeloidCoordinate, dragPos: PixeloidCoordinate) {
  const snapPoint = getAnchorConfig('circle') // 'top-left' (changed!)
  const anchoredStart = GeometryHelper.snapToPixeloidAnchor(clickPos, snapPoint)
  
  const radius = Math.sqrt(
    Math.pow(dragPos.x - anchoredStart.x, 2) + 
    Math.pow(dragPos.y - anchoredStart.y, 2)
  )
  
  return {
    centerX: anchoredStart.x + radius,  // Calculate center from anchor
    centerY: anchoredStart.y + radius,
    radius,
    anchorConfig: {
      snapPoint,
      preComputedAnchors: {
        vertices: [anchoredStart], // Store creation anchor  
        createdAtOffset: getCurrentOffset()
      }
    }
  }
}
```

#### Line (Needs Change)
```typescript
// NEW: click = starting vertex snapped to anchor
createLine(clickPos: PixeloidCoordinate, dragPos: PixeloidCoordinate) {
  const snapPoint = getAnchorConfig('line') // 'top-left' (changed!)
  const anchoredStart = GeometryHelper.snapToPixeloidAnchor(clickPos, snapPoint)
  
  return {
    startX: anchoredStart.x,
    startY: anchoredStart.y,
    endX: dragPos.x,  // End point can be anywhere
    endY: dragPos.y,
    anchorConfig: {
      snapPoint,
      preComputedAnchors: {
        vertices: [anchoredStart], // Store creation anchor
        createdAtOffset: getCurrentOffset()
      }
    }
  }
}
```

#### Point (Needs Change)
```typescript
// NEW: click = snapped to anchor point
createPoint(clickPos: PixeloidCoordinate) {
  const snapPoint = getAnchorConfig('point') // 'top-left' (changed!)
  const anchoredPos = GeometryHelper.snapToPixeloidAnchor(clickPos, snapPoint)
  
  return {
    x: anchoredPos.x,
    y: anchoredPos.y,
    anchorConfig: {
      snapPoint,
      preComputedAnchors: {
        vertices: [anchoredPos], // Store creation anchor
        createdAtOffset: getCurrentOffset()
      }
    }
  }
}
```

#### Diamond (Needs Change)
```typescript
// NEW: click = top-left corner of bounding box
createDiamond(clickPos: PixeloidCoordinate, dragPos: PixeloidCoordinate) {
  const snapPoint = getAnchorConfig('diamond') // 'top-left' (changed!)
  const anchoredStart = GeometryHelper.snapToPixeloidAnchor(clickPos, snapPoint)
  
  const width = Math.abs(dragPos.x - anchoredStart.x)
  const height = width / 4  // Diamond height ratio
  
  // Calculate west vertex from top-left anchor
  const westX = anchoredStart.x
  const westY = anchoredStart.y + height  // Center Y
  
  return {
    anchorX: westX,
    anchorY: westY,
    width,
    height,
    anchorConfig: {
      snapPoint,
      preComputedAnchors: {
        vertices: [anchoredStart], // Store creation anchor
        createdAtOffset: getCurrentOffset()
      }
    }
  }
}
```

### Phase 3: Pre-Computed Coordinate Storage

#### Store All Vertex Positions at Creation
```typescript
interface PreComputedGeometryAnchors {
  // Store actual vertex coordinates at creation time
  vertices: VertexCoordinate[]           // All shape vertices
  creationOffset: PixeloidCoordinate     // Offset when created
  lastUpdateOffset: PixeloidCoordinate   // Track offset changes
}

// When creating object, pre-compute all vertex positions
function preComputeGeometryVertices(obj: GeometricObject): PreComputedGeometryAnchors {
  const currentOffset = getCurrentOffset()
  
  if (obj.type === 'rectangle') {
    return {
      vertices: [
        CoordinateHelper.pixeloidToVertex({x: obj.x, y: obj.y}, currentOffset),           // Top-left
        CoordinateHelper.pixeloidToVertex({x: obj.x + obj.width, y: obj.y}, currentOffset),     // Top-right  
        CoordinateHelper.pixeloidToVertex({x: obj.x, y: obj.y + obj.height}, currentOffset),    // Bottom-left
        CoordinateHelper.pixeloidToVertex({x: obj.x + obj.width, y: obj.y + obj.height}, currentOffset) // Bottom-right
      ],
      creationOffset: currentOffset,
      lastUpdateOffset: currentOffset
    }
  }
  // ... similar for other shapes
}
```

#### Use Pre-Computed Coordinates for Rendering
```typescript
// In GeometryRenderer - avoid coordinate conversion
private renderGeometricObjectWithPreComputedCoords(obj: GeometricObjectWithAnchor): void {
  if (obj.anchorConfig.preComputedAnchors) {
    // Use pre-computed vertex coordinates - no conversion needed!
    const vertices = obj.anchorConfig.preComputedAnchors.vertices
    
    // Render directly using stored vertex coordinates
    this.renderUsingPreComputedVertices(obj, vertices)
  } else {
    // Fallback to current coordinate conversion
    this.renderWithCoordinateConversion(obj)
  }
}
```

## 🧪 Testing Strategy

### Test 1: Consistent Anchoring
```typescript
// All geometry types should anchor to same point
1. Set all objects to 'top-left' anchor
2. Click at same pixeloid position for each shape type
3. Verify all shapes start at identical vertex position
4. No relative position drift between shapes
```

### Test 2: Zoom Stability with Pre-Computed Coordinates
```typescript
// Objects should be completely stable during zoom
1. Draw objects with pre-computed coordinates enabled
2. Zoom in/out extensively  
3. Objects should not move AT ALL
4. No coordinate conversion = no drift
```

### Test 3: Configurable Anchoring
```typescript
// Test all 9 anchor points
1. Draw rectangle with each anchor point setting
2. Verify rectangle anchors to correct position
3. Test that different anchor points produce different positions
4. Verify consistency across zoom levels
```

## 🎯 Expected Results

### Before: Inconsistent Anchoring
- ❌ **Circle**: Anchors to center  
- ❌ **Rectangle**: Anchors to top-left
- ❌ **Different coordinate systems** per shape type
- ❌ **Coordinate drift** during zoom due to re-computation

### After: Unified Anchoring  
- ✅ **All shapes**: Anchor to configurable points (default: top-left)
- ✅ **Consistent behavior** across all geometry types
- ✅ **Pre-computed coordinates** eliminate zoom drift
- ✅ **User control** over anchoring behavior per object type
- ✅ **Zoom-invariant** positioning

This design provides the **stable, predictable anchoring behavior** you're looking for!