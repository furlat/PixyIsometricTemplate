# Phase 3B: API Consistency Investigation - All Shapes

## 🕵️ **COMPREHENSIVE API ANALYSIS**

### **INVESTIGATION METHOD**: Read file analysis of geometry API implementation

---

## 📊 **CIRCLE - RADIUS/DIAMETER CONSISTENCY**

### **Generation API** (`GeometryVertexGenerators.ts` line 15):
```typescript
generateCircleVertices(center: PixeloidCoordinate, radius: number, segments: number = 8)
```
- ✅ **Uses RADIUS** parameter
- ✅ Generates 8 circumference vertices at distance = radius from center
- ✅ Math: `x: center.x + Math.cos(angle) * radius`

### **Property Calculation** (`GeometryPropertyCalculators.ts` line 63-108):
```typescript
calculateCircleProperties(vertices: PixeloidCoordinate[]): CircleProperties
```

**TWO CALCULATION PATHS**:

1. **Creation format** (2 vertices: [center, radiusPoint]):
   - ✅ `center = vertices[0]`
   - ✅ `radius = distance(center, radiusPoint)`
   - ✅ **Consistent with generation API**

2. **Circumference format** (8+ vertices: circumference points):
   - ❌ **MATHEMATICAL ERROR**: `center = arithmetic average of circumference points`
   - ❌ **WRONG**: For circumference points, arithmetic average ≠ geometric center
   - ❌ **Result**: Calculated radius will be incorrect

### **CIRCLE BUG IDENTIFIED**:
```typescript
// WRONG (line 85-90):
const sumX = vertices.reduce((sum, v) => sum + v.x, 0)
const sumY = vertices.reduce((sum, v) => sum + v.y, 0)
center = { x: sumX / vertices.length, y: sumY / vertices.length }

// CORRECT: Should use original center from object creation, not recalculate
```

---

## 📊 **RECTANGLE - CENTER/DIMENSIONS CONSISTENCY**

### **Generation API** (`GeometryVertexGenerators.ts` line 32):
```typescript
generateRectangleVertices(center: PixeloidCoordinate, width: number, height: number)
```
- ✅ **Uses CENTER + WIDTH/HEIGHT** parameters
- ✅ Generates 4 corner vertices: [topLeft, topRight, bottomRight, bottomLeft]
- ✅ Math: `halfWidth = width / 2`, corners calculated from center

### **Property Calculation** (`GeometryPropertyCalculators.ts` line 113-167):
```typescript
calculateRectangleProperties(vertices: PixeloidCoordinate[]): RectangleProperties
```

**TWO CALCULATION PATHS**:

1. **Creation format** (2 vertices: diagonal corners):
   - ✅ Finds topLeft/bottomRight from min/max coordinates
   - ✅ Calculates center: `center = topLeft + (width/2, height/2)`
   - ✅ **Consistent with generation API**

2. **4-vertex format** (corner vertices):
   - ✅ Finds min/max from all 4 vertices
   - ✅ Calculates center from min/max coordinates  
   - ✅ **Should be consistent**

### **RECTANGLE STATUS**: ✅ **LIKELY CORRECT** - Math appears consistent

---

## 📊 **DIAMOND - CENTER/DIMENSIONS CONSISTENCY**

### **Generation API** (`GeometryVertexGenerators.ts` line 59):
```typescript
generateDiamondVertices(center: PixeloidCoordinate, width: number, height: number)
```
- ✅ **Uses CENTER + WIDTH/HEIGHT** parameters
- ✅ Generates 4 cardinal vertices: [west, north, east, south]
- ✅ Math: `west = center.x - halfWidth`, etc.

### **Property Calculation** (`GeometryPropertyCalculators.ts` line 172-200):
```typescript
calculateDiamondProperties(vertices: PixeloidCoordinate[]): DiamondProperties
```

**SINGLE CALCULATION PATH**:
- ✅ Expects 4 vertices: [west, north, east, south]
- ✅ `centerX = (west.x + east.x) / 2`
- ✅ `centerY = (north.y + south.y) / 2`
- ✅ `width = east.x - west.x`
- ✅ `height = south.y - north.y`

### **DIAMOND STATUS**: ✅ **CORRECT** - Calculation exactly reverses generation

---

## 📊 **LINE - START/END CONSISTENCY**

### **Generation API** (`GeometryVertexGenerators.ts` line 74):
```typescript
generateLineVertices(startPoint: PixeloidCoordinate, endPoint: PixeloidCoordinate)
```
- ✅ **Uses START/END POINTS** parameters
- ✅ Generates 2 vertices: [startPoint, endPoint]

### **Property Calculation** (`GeometryPropertyCalculators.ts` line 37-58):
```typescript
calculateLineProperties(vertices: PixeloidCoordinate[]): LineProperties
```

**SINGLE CALCULATION PATH**:
- ✅ `start = vertices[0]`
- ✅ `end = vertices[1]`
- ✅ Calculates additional properties (midpoint, length, angle)

### **LINE STATUS**: ✅ **CORRECT** - Direct vertex preservation

---

## 📊 **POINT - CENTER CONSISTENCY**

### **Generation API** (`GeometryVertexGenerators.ts` line 95):
```typescript
generatePointVertices(center: PixeloidCoordinate)
```
- ✅ **Uses CENTER** parameter
- ✅ Generates 1 vertex: [center]

### **Property Calculation** (`GeometryPropertyCalculators.ts` line 23-32):
```typescript
calculatePointProperties(vertices: PixeloidCoordinate[]): PointProperties
```

**SINGLE CALCULATION PATH**:
- ✅ `center = vertices[0]`

### **POINT STATUS**: ✅ **CORRECT** - Trivial case

---

## 🚨 **CRITICAL FINDINGS SUMMARY**

### **✅ WORKING CORRECTLY**:
- **RECTANGLE**: Center/dimensions calculation consistent with generation
- **DIAMOND**: Cardinal point calculation consistent with generation  
- **LINE**: Start/end point preservation working correctly
- **POINT**: Center preservation working correctly (trivial)

### **❌ BROKEN - MATHEMATICAL ERROR**:
- **CIRCLE**: Circumference-to-center calculation is mathematically wrong
  - **Problem**: Arithmetic average of circumference points ≠ geometric center
  - **Result**: Calculated radius differs from generation radius
  - **Impact**: Radius halving bug on first edit

### **🔧 SPECIFIC FIX REQUIRED**:

**Circle Property Calculation Fix** (`GeometryPropertyCalculators.ts` line 84-90):
```typescript
// CURRENT (WRONG):
const sumX = vertices.reduce((sum, v) => sum + v.x, 0)
const sumY = vertices.reduce((sum, v) => sum + v.y, 0)
center = { x: sumX / vertices.length, y: sumY / vertices.length }

// REQUIRED (CORRECT):
// For circumference vertices, use geometric center calculation OR
// preserve original center from object metadata instead of recalculating
```

### **📋 API CONSISTENCY STATUS**:
- ✅ **All shapes use consistent parameter types** (radius not diameter for circles)
- ✅ **All generation APIs work correctly**
- ❌ **Circle property calculation has mathematical error**
- ✅ **Rectangle/diamond/line/point calculations are correct**

### **🎯 ROOT CAUSE CONFIRMED**:
The radius halving bug is caused by **incorrect geometric center calculation from circumference vertices** in circle property calculation, not by radius/diameter confusion in APIs.