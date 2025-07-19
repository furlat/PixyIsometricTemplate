# Phase 3B: Radius Halving Bug - Root Cause Documentation

## 🎯 **COMPLETE INVESTIGATION FINDINGS**

### **Method**: Read file analysis of geometry system implementation

---

## 🔍 **ROOT CAUSE IDENTIFIED**

### **The Exact Bug Location**
**File**: `app/src/store/gameStore_3b.ts`  
**Line**: 1176  
**Method**: `updateGeometryObjectVertices()`

```typescript
// LINE 1176 - THE BUG TRIGGER:
const newProperties = GeometryPropertyCalculators.calculateProperties(obj.type, newVertices)
```

### **The Bug Flow**:
1. **Circle Created**: User drags, creates circle with radius 20
2. **Vertices Generated**: 8 circumference vertices correctly placed at radius 20
3. **Object Stored**: Circle stored with vertices + initial properties
4. **BUG TRIGGERED**: When object is edited, `updateGeometryObjectVertices()` calls `calculateProperties()`
5. **MATH ERROR**: `calculateCircleProperties()` uses arithmetic average of circumference points (WRONG)
6. **WRONG CENTER**: Calculated center ≠ actual center → calculated radius ≠ actual radius
7. **UI DISPLAY**: Shows wrong calculated radius (halved value)

---

## 📊 **MULTIPATH ANALYSIS**

### **CONFIRMED: Multiple Paths to Populate Properties**

**Path 1 (Creation)**: Generation → Store (vertices + properties)
**Path 2 (Editing)**: Vertex update → Recalculate properties (BROKEN)

### **The Multipath Evidence**:
```typescript
// PATH 1: Object creation (works correctly)
addGeometryObjectWithProperties: (params: CreateGeometricObjectParams) => {
  const properties = GeometryPropertyCalculators.calculateProperties(params.type, params.vertices)
  // Properties calculated once during creation
}

// PATH 2: Object editing (BROKEN - recalculates properties)
updateGeometryObjectVertices: (objectId: string, newVertices: PixeloidCoordinate[]) => {
  const newProperties = GeometryPropertyCalculators.calculateProperties(obj.type, newVertices)
  // ❌ AUTOMATIC: Recalculates properties - CAUSES BUG
}
```

---

## 🚨 **MATHEMATICAL ERROR IN PROPERTY CALCULATION**

### **The Broken Math** (`GeometryPropertyCalculators.ts` lines 85-90):
```typescript
// ❌ WRONG: Arithmetic average of circumference points
const sumX = vertices.reduce((sum, v) => sum + v.x, 0)
const sumY = vertices.reduce((sum, v) => sum + v.y, 0)
center = {
  x: sumX / vertices.length,  // This is NOT the geometric center!
  y: sumY / vertices.length
}
```

### **Why This Is Wrong**:
- **8 circumference vertices**: Points ON the circle boundary
- **Arithmetic average**: Assumes points are distributed around center
- **Reality**: For perfect circle, arithmetic average ≠ geometric center
- **Result**: Calculated "center" is offset, calculated radius is wrong

---

## 🔧 **VERTEX AUTHORITY VIOLATION**

### **The Problem**: Properties Should Be Computed, Not Recomputed

**Current (WRONG) Flow**:
```
UI Edit → Generate New Vertices → Recalculate Properties → Store → Display
                                    ↑
                              BROKEN MATH HERE
```

**Required (CORRECT) Flow**:
```
UI Edit → Generate New Vertices → Store → Properties Always Computed from ORIGINAL CENTER
```

### **The Store Code That Violates Vertex Authority**:
```typescript
// LINE 1175-1185: The violation
try {
  // ❌ AUTOMATIC: Recalculate properties when vertices change
  const newProperties = GeometryPropertyCalculators.calculateProperties(obj.type, newVertices)
  const newBounds = calculateObjectBounds(newVertices)
  
  // Update object with new vertices AND recalculated properties
  gameStore_3b.geometry.objects[objIndex] = {
    ...obj,
    vertices: newVertices,
    bounds: newBounds,
    properties: newProperties  // ❌ Automatically maintained (BROKEN)
  }
```

---

## 📝 **API CONSISTENCY STATUS** 

### **✅ CONFIRMED**: APIs Are Consistent

**Circle Generation API**: Uses `radius` parameter ✅  
**Circle Property Calculation**: Returns `radius` value ✅  
**UI Input Field**: Expects `radius` value ✅  

**No radius/diameter confusion** - the issue is purely mathematical error in center calculation.

### **All Shape Analysis**:
- **Rectangle**: ✅ Correct - center calculation from corner vertices works
- **Diamond**: ✅ Correct - center calculation from cardinal vertices works  
- **Line**: ✅ Correct - no center calculation needed
- **Point**: ✅ Correct - trivial case
- **Circle**: ❌ **BROKEN** - center calculation from circumference vertices is mathematically wrong

---

## 🎯 **THE EXACT FIX REQUIRED**

### **Option 1: Preserve Original Center (Recommended)**
```typescript
// For circles, preserve the original center instead of recalculating
if (obj.type === 'circle' && obj.properties?.center) {
  // Use original center, only recalculate radius if needed
  newProperties = {
    ...obj.properties,
    // Keep original center, update other properties as needed
  }
}
```

### **Option 2: Fix the Math (Alternative)**
```typescript
// Fix the geometric center calculation for circumference vertices
// (But this is more complex and error-prone)
```

### **Option 3: No Recalculation (Simplest)**
```typescript
// Don't recalculate properties during vertex updates
// Properties should be immutable once created
properties: obj.properties  // Keep original properties
```

---

## 🚨 **CRITICAL UNDERSTANDING**

### **This Is NOT**:
- ❌ Radius/diameter API confusion  
- ❌ UI input field issues
- ❌ Drawing generation problems

### **This IS**:
- ✅ **Mathematical error in property calculation**
- ✅ **Vertex authority violation through property recalculation**  
- ✅ **Multipath property population causing inconsistency**

### **Impact**: 
- **First Edit**: Triggers property recalculation → wrong radius displayed
- **Subsequent Edits**: Uses cached wrong properties → no additional change
- **User Experience**: "Radius halves on first edit only"

---

## 📋 **IMPLEMENTATION PRIORITY**

1. **Immediate Fix**: Stop recalculating circle properties during vertex updates
2. **Proper Fix**: Preserve original circle center during all operations  
3. **Architecture Fix**: Eliminate multipath property population
4. **Validation**: Test all shape types for similar issues

**Status**: Root cause identified and documented with exact fix locations.