# Geometry Anchoring Zoom Drift Analysis

## 🎯 REAL PROBLEM: Geometry Jumps Between Pixeloid Anchors During Zoom

### The Issue You're Describing
1. **Draw a rectangle** at some position
2. **Zoom in/out** 
3. **The rectangle itself moves** to different pixeloid anchoring points
4. **"Corner becomes different"** - the geometry jumps to align with different pixeloid boundaries

This is NOT about bbox alignment - this is about the **geometry itself being unstable** during zoom operations.

## 🔬 Root Cause Analysis: Rounding + Offset Interaction

### Current Coordinate Flow in GeometryRenderer
```typescript
// When rendering (line 119 in GeometryRenderer):
const convertedObject = this.convertObjectToVertexCoordinates(obj)

// convertObjectToVertexCoordinates uses (line 202):
const vertexCoord = CoordinateHelper.pixeloidToMeshVertex({
  __brand: 'pixeloid',
  x: obj.x,  // Original pixeloid coordinate
  y: obj.y
})

// pixeloidToMeshVertex does (CoordinateHelper line 93-97):
const offset = this.getCurrentOffset()  // ← CHANGES WITH ZOOM/WASD
const vertex = this.pixeloidToVertex(pixeloid, offset)
return { x: Math.round(vertex.x), y: Math.round(vertex.y) }  // ← ROUNDING!
```

### The Anchoring Drift Problem
```
Rectangle stored at pixeloid: (10.7, 15.3)

Scenario 1 - Offset: (5.2, 8.1)
  vertex = (10.7 - 5.2, 15.3 - 8.1) = (5.5, 7.2)
  rounded = (6, 7)  ← Renders at vertex (6, 7)

Scenario 2 - Offset changes to: (5.7, 8.6) due to zoom/WASD  
  vertex = (10.7 - 5.7, 15.3 - 8.6) = (5.0, 6.7)
  rounded = (5, 7)  ← Renders at vertex (5, 7)

RESULT: Rectangle JUMPED from vertex (6,7) to (5,7)!
The "corner" moved by 1 vertex unit due to rounding interaction!
```

### Why This Happens
1. **Offset changes** during zoom or WASD movement
2. **Rounding boundary crossing**: Small offset changes can push coordinates across rounding boundaries
3. **Geometry jumps**: Rectangle "snaps" to different pixeloid grid alignments
4. **Visual instability**: User sees geometry moving unexpectedly

## 🔍 Detailed Investigation of Coordinate Conversion

### How pixeloidToVertex Works (from CoordinateCalculations)
```typescript
// Basic conversion formula:
vertex = pixeloid - offset

// When offset changes slightly:
// Before: vertex = 10.7 - 5.2 = 5.5 → rounds to 6
// After:  vertex = 10.7 - 5.7 = 5.0 → rounds to 5
```

### Pixeloid Anchoring Analysis
```
Pixeloid Grid (showing pixeloid boundaries):
┌─────┌─────┌─────┬─────┐
│  4  │  5  │  6  │  7  │
└─────┴─────┼─────┼─────┤
             │     │     │
             │ 5.5 │ 6.5 │  ← Rectangle can round to either side
             │     │     │
             └─────┴─────┘

When vertex coordinate is 5.5:
- Math.round(5.5) = 6 → anchors to pixeloid 6
When vertex coordinate is 5.4:  
- Math.round(5.4) = 5 → anchors to pixeloid 5

Small offset changes cause crossing of rounding boundaries!
```

## 🎯 Root Cause: Rounding Creates Unstable Anchoring

### The Core Issue
**Objects stored in pixeloid coordinates + offset-dependent conversion + rounding = unstable anchoring**

### Current Anchoring Behavior
- **Intended**: Objects should stay visually stable during zoom/pan
- **Actual**: Objects jump between pixeloid grid positions
- **Cause**: Rounding makes anchoring dependent on current offset value

## 🛠️ Solution Approaches

### Option A: Remove Rounding (Exact Positioning)
```typescript
// Modify pixeloidToMeshVertex to NOT round:
static pixeloidToMeshVertex(pixeloid: PixeloidCoordinate): { x: number, y: number } {
  const offset = this.getCurrentOffset()
  const vertex = this.pixeloidToVertex(pixeloid, offset)
  return { x: vertex.x, y: vertex.y }  // NO ROUNDING
}
```

**Pros**: Stable positioning, no jumping
**Cons**: Geometry might not align perfectly to pixeloid boundaries

### Option B: Store Objects in Vertex Coordinates
```typescript
// Store rectangles in vertex coordinates instead of pixeloid
interface GeometricRectangle {
  x: number      // Vertex coordinate (stable)
  y: number      // Vertex coordinate (stable)
  width: number  // Vertex units
  height: number // Vertex units
}
```

**Pros**: No conversion needed, inherently stable
**Cons**: Major architectural change

### Option C: Offset-Independent Anchoring
```typescript
// Calculate absolute vertex position at creation time
// Store both pixeloid AND vertex coordinates
interface GeometricRectangle {
  x: number           // Original pixeloid coordinate
  y: number
  anchorVertex: {     // Calculated once at creation
    x: number         // Absolute vertex position
    y: number
  }
}
```

**Pros**: Stable anchoring, maintains pixeloid conceptual model
**Cons**: Storage overhead

### Option D: Smart Rounding Strategy
```typescript
// Round to consistent pixeloid boundaries regardless of offset
static stablePixeloidToVertex(pixeloid: PixeloidCoordinate): { x: number, y: number } {
  // Always anchor to the same pixeloid boundary
  const stableX = Math.floor(pixeloid.x) + 0.5  // Always pixeloid center
  const stableY = Math.floor(pixeloid.y) + 0.5
  
  const offset = this.getCurrentOffset()
  return {
    x: stableX - offset.x,
    y: stableY - offset.y
  }
}
```

**Pros**: Pixeloid-aligned and stable
**Cons**: Forces all geometry to pixeloid centers

## 🎯 Recommended Solution: Option A (Remove Rounding)

### Rationale
- **Immediate fix**: Solves anchoring drift problem
- **Minimal code change**: Only affects coordinate conversion
- **Maintains architecture**: No major structural changes
- **Better UX**: Stable, predictable geometry positioning

### Implementation
```typescript
// In CoordinateHelper.ts:
static pixeloidToMeshVertex(pixeloid: PixeloidCoordinate): { x: number, y: number } {
  const offset = this.getCurrentOffset()
  const vertex = this.pixeloidToVertex(pixeloid, offset)
  return { x: vertex.x, y: vertex.y }  // Remove Math.round()
}
```

## 🧪 Test Cases to Verify Fix

### Test 1: Zoom Stability
```typescript
1. Draw rectangle at fractional coordinates (10.7, 15.3)
2. Note exact corner position
3. Zoom in 2x, 5x, 10x
4. Verify corner stays at same visual position
5. No "jumping" between pixeloid anchors
```

### Test 2: WASD Movement Stability  
```typescript
1. Draw rectangle 
2. Use WASD to move viewport around
3. Verify rectangle maintains stable position
4. No unexpected position shifts
```

### Test 3: Fractional Coordinate Precision
```typescript
1. Draw multiple rectangles at various fractional coordinates
2. Zoom in/out repeatedly
3. Verify all rectangles maintain their relative positions
4. No coordinate drift or accumulation errors
```

This explains the "corner becoming different" - the rounding is causing geometry to jump between different pixeloid anchoring points!