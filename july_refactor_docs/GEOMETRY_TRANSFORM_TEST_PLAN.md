# Geometry Transform Test Plan - Fix Circle Movement Bug

## 🎯 **OBJECTIVE**

Create isolated, self-contained geometry transform functions to prove the vertex authority architecture works correctly without any PIXI/store dependencies.

## 🏗️ **ARCHITECTURE**

**VERTEX AUTHORITY PRINCIPLE:**
```
vertices (authority) ←→ computed properties (derived, never stored)
```

**TRANSFORM FLOW:**
```
1. vertices (stored) → [forward] → computed properties (display in UI)
2. computed properties (user edit) → [backward] → vertices (update store)
3. REQUIREMENT: backward(forward(vertices)) === vertices (perfect invertibility)
```

## 📋 **TEST SCRIPT REQUIREMENTS**

### **Types to Define:**
```typescript
type Coordinate = { x: number, y: number }
type CircleProperties = { center: Coordinate, radius: number, diameter: number, circumference: number, area: number }
type RectangleProperties = { center: Coordinate, width: number, height: number, topLeft: Coordinate, bottomRight: Coordinate, area: number, perimeter: number }
type DiamondProperties = { center: Coordinate, width: number, height: number, west: Coordinate, north: Coordinate, east: Coordinate, south: Coordinate, area: number, perimeter: number }
```

### **Functions to Implement:**
```typescript
// Forward transforms: vertices → properties
function computeCircleProperties(vertices: Coordinate[]): CircleProperties
function computeRectangleProperties(vertices: Coordinate[]): RectangleProperties  
function computeDiamondProperties(vertices: Coordinate[]): DiamondProperties

// Backward transforms: properties → vertices
function computeCircleVertices(props: CircleProperties): Coordinate[]
function computeRectangleVertices(props: RectangleProperties): Coordinate[]
function computeDiamondVertices(props: DiamondProperties): Coordinate[]
```

### **Test Cases:**
```typescript
// Test perfect invertibility
const originalVertices = [...]
const properties = computeCircleProperties(originalVertices)
const regeneratedVertices = computeCircleVertices(properties)
assert(verticesEqual(originalVertices, regeneratedVertices, 0.001)) // Within tolerance

// Test specific bug cases
testCircle({ center: {x: 100, y: 100}, radius: 50 }) // Should not become radius 78
testRectangle({ center: {x: 50, y: 50}, width: 100, height: 60 }) // Should not "fly away"
testDiamond({ center: {x: 0, y: 0}, width: 40, height: 20 }) // Should maintain isometric ratios
```

## 🧪 **TESTING METHODOLOGY**

1. **Isolated Math Testing:** No PIXI, no store, pure geometry
2. **Invertibility Testing:** forward(backward(props)) === props
3. **Precision Testing:** Verify transforms within 0.001 tolerance
4. **Bug Reproduction:** Test exact cases that are failing (radius 100→78)
5. **Edge Cases:** Test zero dimensions, negative coordinates, etc.

## 🎯 **SUCCESS CRITERIA**

✅ **All transforms are perfectly invertible within 0.001 tolerance**  
✅ **Circle radius 100 stays radius 100 (not 78)**  
✅ **Rectangle maintains position and dimensions**  
✅ **Diamond maintains isometric proportions**  
✅ **No "flying away" or random resizing**

## 📁 **DELIVERABLES**

1. **`geometry_transform_test.ts`** - Self-contained test script
2. **Test results** - Console output showing all tests pass
3. **Bug identification** - If tests fail, exact location of geometry errors
4. **Clean transforms** - Working forward/backward functions ready for integration

## 🚀 **NEXT STEPS**

Once test script proves transforms work correctly:
1. Integrate clean transforms into store
2. Rewrite ObjectEditPanel_3b.ts with vertex authority
3. Remove duplicate calculation systems
4. Verify in actual application

## 💡 **KEY INSIGHT**

If this isolated test script works perfectly, then the bug is **NOT in the geometry math** but in **how the store/UI is using** these transforms. The test will prove where the real problem lies.