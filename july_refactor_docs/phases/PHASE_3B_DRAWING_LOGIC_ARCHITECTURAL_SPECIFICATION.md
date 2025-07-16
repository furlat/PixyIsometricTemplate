# Phase 3B Drawing Logic Architectural Specification

## 🎯 **Core Problem Analysis**

### **Current Issue**
The circle and rectangle drawing logic uses `Math.min/Math.max` approach which doesn't respect the **origin vertex** as the reference point. This creates inconsistent behavior during bidirectional dragging.

### **Diamond Pattern Success**
The diamond implementation correctly handles bidirectional dragging by:
1. Treating `startPoint` as the **origin reference point**
2. Calculating dimensions relative to the origin
3. Determining shape position based on drag direction
4. Maintaining semantic meaning of the origin point

## 🏗️ **Unified Drawing Pattern Architecture**

### **Core Principles**

1. **Origin Authority**: `startPoint` is always the semantic reference point
2. **Bidirectional Support**: Shape construction handles all drag directions
3. **Relative Positioning**: Shape position calculated relative to origin
4. **Consistent Interface**: All shapes follow the same pattern

### **Universal Drawing Flow**

```typescript
// Universal pattern for all shapes
static calculateShapePreview(
  originVertex: PixeloidCoordinate,    // Where user clicked first
  targetVertex: PixeloidCoordinate     // Where user dragged to
): PreviewObject {
  
  // 1. Calculate raw dimensions
  const dimensions = this.calculateDimensions(originVertex, targetVertex)
  
  // 2. Determine positioning based on drag direction
  const positioning = this.calculatePositioning(originVertex, targetVertex, dimensions)
  
  // 3. Construct shape-specific geometry
  const geometry = this.constructGeometry(positioning, dimensions)
  
  // 4. Return preview object
  return {
    type: 'shape',
    vertices: geometry.vertices,
    style: gameStore_3b.style,
    isValid: dimensions.isValid,
    bounds: geometry.bounds
  }
}
```

## 📐 **Shape-Specific Specifications**

### **Rectangle Drawing Logic**

```typescript
/**
 * CORRECT Rectangle Pattern (Diamond-Style)
 */
static calculateRectanglePreview(
  originVertex: PixeloidCoordinate,
  targetVertex: PixeloidCoordinate
): PreviewObject {
  
  // 1. Calculate dimensions (always positive)
  const width = Math.abs(targetVertex.x - originVertex.x)
  const height = Math.abs(targetVertex.y - originVertex.y)
  
  // 2. Determine rectangle position based on drag direction
  let rectX: number, rectY: number
  
  if (targetVertex.x >= originVertex.x) {
    rectX = originVertex.x  // Dragging right: origin is left edge
  } else {
    rectX = originVertex.x - width  // Dragging left: origin is right edge
  }
  
  if (targetVertex.y >= originVertex.y) {
    rectY = originVertex.y  // Dragging down: origin is top edge
  } else {
    rectY = originVertex.y - height  // Dragging up: origin is bottom edge
  }
  
  // 3. Construct rectangle vertices (clockwise from top-left)
  const vertices = [
    { x: rectX, y: rectY },                    // top-left
    { x: rectX + width, y: rectY },            // top-right
    { x: rectX + width, y: rectY + height },   // bottom-right
    { x: rectX, y: rectY + height }            // bottom-left
  ]
  
  return {
    type: 'rectangle',
    vertices: vertices,
    style: gameStore_3b.style,
    isValid: width > 0 && height > 0,
    bounds: {
      minX: rectX,
      minY: rectY,
      maxX: rectX + width,
      maxY: rectY + height,
      width: width,
      height: height
    }
  }
}
```

### **Circle Drawing Logic**

```typescript
/**
 * CORRECT Circle Pattern (Diamond-Style)
 * Two approaches: Origin as center OR Origin as corner
 */

// APPROACH 1: Origin as Center (radius-based)
static calculateCirclePreview_CenterOrigin(
  originVertex: PixeloidCoordinate,    // Center of circle
  targetVertex: PixeloidCoordinate     // Point on circumference
): PreviewObject {
  
  // 1. Calculate radius as distance from center to target
  const radius = Math.sqrt(
    Math.pow(targetVertex.x - originVertex.x, 2) + 
    Math.pow(targetVertex.y - originVertex.y, 2)
  )
  
  // 2. Circle is always centered at origin
  const centerX = originVertex.x
  const centerY = originVertex.y
  
  // 3. Construct circle vertices (center + radius point)
  const vertices = [
    { x: centerX, y: centerY },                // Center
    { x: centerX + radius, y: centerY }        // Radius point
  ]
  
  return {
    type: 'circle',
    vertices: vertices,
    style: gameStore_3b.style,
    isValid: radius > 0,
    bounds: {
      minX: centerX - radius,
      minY: centerY - radius,
      maxX: centerX + radius,
      maxY: centerY + radius,
      width: radius * 2,
      height: radius * 2
    }
  }
}

// APPROACH 2: Origin as Corner (bounding box-based)
static calculateCirclePreview_CornerOrigin(
  originVertex: PixeloidCoordinate,    // Corner of bounding box
  targetVertex: PixeloidCoordinate     // Opposite corner
): PreviewObject {
  
  // 1. Calculate bounding box dimensions
  const width = Math.abs(targetVertex.x - originVertex.x)
  const height = Math.abs(targetVertex.y - originVertex.y)
  
  // 2. Determine bounding box position (like rectangle)
  let boxX: number, boxY: number
  
  if (targetVertex.x >= originVertex.x) {
    boxX = originVertex.x
  } else {
    boxX = originVertex.x - width
  }
  
  if (targetVertex.y >= originVertex.y) {
    boxY = originVertex.y
  } else {
    boxY = originVertex.y - height
  }
  
  // 3. Calculate circle center and radius from bounding box
  const centerX = boxX + width / 2
  const centerY = boxY + height / 2
  const radius = Math.min(width, height) / 2
  
  // 4. Construct circle vertices
  const vertices = [
    { x: centerX, y: centerY },                // Center
    { x: centerX + radius, y: centerY }        // Radius point
  ]
  
  return {
    type: 'circle',
    vertices: vertices,
    style: gameStore_3b.style,
    isValid: radius > 0,
    bounds: {
      minX: centerX - radius,
      minY: centerY - radius,
      maxX: centerX + radius,
      maxY: centerY + radius,
      width: radius * 2,
      height: radius * 2
    }
  }
}
```

## 🔄 **Bidirectional Drag Support Matrix**

### **Drag Direction Handling**

```typescript
// Universal drag direction calculation
interface DragDirection {
  horizontal: 'left' | 'right'
  vertical: 'up' | 'down'
}

static calculateDragDirection(
  originVertex: PixeloidCoordinate,
  targetVertex: PixeloidCoordinate
): DragDirection {
  return {
    horizontal: targetVertex.x >= originVertex.x ? 'right' : 'left',
    vertical: targetVertex.y >= originVertex.y ? 'down' : 'up'
  }
}

// Position calculation based on drag direction
static calculateShapePosition(
  originVertex: PixeloidCoordinate,
  dimensions: { width: number, height: number },
  dragDirection: DragDirection
): { x: number, y: number } {
  
  let x: number, y: number
  
  // X position based on horizontal drag
  if (dragDirection.horizontal === 'right') {
    x = originVertex.x  // Origin is left edge
  } else {
    x = originVertex.x - dimensions.width  // Origin is right edge
  }
  
  // Y position based on vertical drag
  if (dragDirection.vertical === 'down') {
    y = originVertex.y  // Origin is top edge
  } else {
    y = originVertex.y - dimensions.height  // Origin is bottom edge
  }
  
  return { x, y }
}
```

## 📊 **Visual Behavior Examples**

### **Rectangle Dragging Scenarios**

```
Scenario 1: Drag Right-Down
Origin: (10, 10) → Target: (20, 15)
Result: Rectangle from (10, 10) to (20, 15)
├─ Origin at top-left corner
└─ Width: 10, Height: 5

Scenario 2: Drag Left-Up  
Origin: (10, 10) → Target: (5, 8)
Result: Rectangle from (5, 8) to (10, 10)
├─ Origin at bottom-right corner
└─ Width: 5, Height: 2

Scenario 3: Drag Right-Up
Origin: (10, 10) → Target: (15, 7)
Result: Rectangle from (10, 7) to (15, 10)
├─ Origin at bottom-left corner
└─ Width: 5, Height: 3

Scenario 4: Drag Left-Down
Origin: (10, 10) → Target: (8, 12)
Result: Rectangle from (8, 10) to (10, 12)
├─ Origin at top-right corner
└─ Width: 2, Height: 2
```

### **Circle Dragging Scenarios**

```
APPROACH 1: Origin as Center
Origin: (10, 10) → Target: (13, 14)
Result: Circle centered at (10, 10) with radius: 5
├─ Origin always remains center
└─ Radius = √((13-10)² + (14-10)²) = √(9+16) = 5

APPROACH 2: Origin as Corner
Origin: (10, 10) → Target: (16, 14)
Result: Circle centered at (13, 12) with radius: 2
├─ Bounding box: (10, 10) to (16, 14)
├─ Center: (13, 12)
└─ Radius = min(6, 4) / 2 = 2
```

## 🎨 **Implementation Strategy**

### **Phase 1: Core Pattern Implementation**

1. **Extract Universal Logic**
   - Create base dimension calculation method
   - Create drag direction detection method
   - Create position calculation method

2. **Refactor Rectangle**
   - Apply diamond-style bidirectional logic
   - Ensure origin vertex semantics
   - Test all 4 quadrant dragging

3. **Refactor Circle**
   - Choose between center-origin or corner-origin approach
   - Apply consistent bidirectional logic
   - Maintain circle-specific radius calculation

### **Phase 2: Validation and Testing**

1. **Drag Direction Tests**
   - Test all 8 cardinal directions
   - Verify origin vertex behavior
   - Validate bounds calculations

2. **Visual Consistency**
   - Ensure smooth preview updates
   - Verify no coordinate jumps
   - Check edge case handling

### **Phase 3: Integration**

1. **Update Store Methods**
   - Ensure `updateDrawingPreview` uses corrected methods
   - Validate preview object structure
   - Test reactivity

2. **UI Integration**
   - Verify drawing modes work correctly
   - Test shape selection consistency
   - Validate geometry creation

## 🚀 **Success Criteria**

### **Behavioral Requirements**

1. **Origin Consistency**: Origin vertex always maintains semantic meaning
2. **Bidirectional Support**: All shapes handle all drag directions correctly
3. **Smooth Preview**: No coordinate jumps during dragging
4. **Bounds Accuracy**: Calculated bounds match visual representation
5. **Performance**: Real-time preview updates without lag

### **Technical Requirements**

1. **Code Consistency**: All shapes follow the same pattern
2. **Type Safety**: Proper TypeScript type usage
3. **Store Integration**: Correct integration with gameStore_3b
4. **Mesh Authority**: Coordinates respect mesh system
5. **Documentation**: Clear comments explaining the logic

## 📝 **Implementation Notes**

### **Critical Decisions**

1. **Circle Origin Approach**: Need to decide between center-origin vs corner-origin
2. **Dimension Calculation**: Always use `Math.abs()` for positive dimensions
3. **Position Logic**: Use drag direction to determine final position
4. **Bounds Calculation**: Ensure bounds match actual shape geometry
5. **Validation**: Add proper `isValid` checks for all shapes

### **Diamond Pattern Lessons**

1. **Reference Point**: Origin vertex is always the reference
2. **Direction Handling**: Explicit logic for each drag direction
3. **Dimension Calculation**: Separate dimension from positioning
4. **Semantic Meaning**: Origin point has specific meaning for each shape
5. **Consistency**: Same pattern across all shape types

This specification provides the architectural foundation for implementing correct bidirectional drawing logic that follows the proven diamond pattern.