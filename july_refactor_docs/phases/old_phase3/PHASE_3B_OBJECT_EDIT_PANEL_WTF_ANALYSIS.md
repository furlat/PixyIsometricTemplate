# Phase 3B: Object Edit Panel WTF Analysis

## 🚨 **THE CRITICAL WTF DISCOVERED**

**USER QUESTION**: "WHY when the object edit is opened we call create when we should have everything in the store from initialization"

## 🔍 **ROOT CAUSE INVESTIGATION**

### **The Exact Bug Trigger Flow**:

1. **Object Edit Panel Opens**: 
   - Line 311: `const { center, radius } = obj.properties as CircleProperties`
   - ✅ **CORRECT**: Reading stored properties (radius = 20)

2. **User Types in Input Field**:
   - Line 542: Input change triggers `updateLivePreview()`
   - ❌ **BUG TRIGGER**: Live preview calls store update methods

3. **Live Preview Chain Reaction**:
   ```typescript
   updateLivePreview() → 
   updateCircleUsingStore() → 
   updateCircleFromProperties() → 
   updateGeometryObjectVertices() → 
   calculateProperties() ← THE BUG!
   ```

4. **The Actual WTF Line**: `ObjectEditPanel_3b.ts` line 714:
   ```typescript
   const success = gameStore_3b_methods.updateCircleFromProperties(objectId, center, radius)
   ```

### **Why This Is Wrong**:
- **Object edit panel opens**: Should just READ `obj.properties.radius` (works fine)
- **User types**: Should just update the INPUT FIELD (not recalculate properties)
- **Apply changes**: Should generate new vertices from UI inputs (not recalculate from old vertices)

## 🚨 **THE MULTIPATH VIOLATION**

### **Current (WRONG) Flow**:
```
UI Opens → Read Properties (✅ radius=20)
User Types → Live Preview → Store Update → Recalculate Properties (❌ radius=10)
UI Updates → Shows Wrong Value (❌ radius=10)
```

### **Required (CORRECT) Flow**:
```
UI Opens → Read Properties (✅ radius=20)
User Types → Update UI Only (✅ input field shows user value)
Apply → Generate New Vertices → Store New Vertices (✅ no property recalc)
```

## 📍 **EXACT BUG LOCATION**

**File**: `app/src/ui/ObjectEditPanel_3b.ts`  
**Method**: `updateLivePreview()` (line 559)  
**Problem**: Live preview calls store update methods that trigger property recalculation

**The WTF Lines**:
```typescript
// Line 566-567: THIS IS THE PROBLEM
const updates = this.buildUpdatedProperties()
this.updateObjectInStore(selectedObjectId, updates)

// Line 714: WHICH CALLS THIS
const success = gameStore_3b_methods.updateCircleFromProperties(objectId, center, radius)

// Which calls gameStore_3b.ts line 1216: 
return gameStore_3b_methods.updateGeometryObjectVertices(objectId, newVertices)

// Which calls gameStore_3b.ts line 1176: THE BUG TRIGGER
const newProperties = GeometryPropertyCalculators.calculateProperties(obj.type, newVertices)
```

## 🔧 **THE ACTUAL FIX NEEDED**

### **Option 1: No Live Preview (Simplest)**
```typescript
// Remove live preview completely
// Only update store on Apply, not on every input change
```

### **Option 2: Preview Without Store Updates (Better)**
```typescript
// Live preview shows visual changes without touching store
// Only update store when Apply is clicked
```

### **Option 3: Fix Store Methods (Complete)**
```typescript
// Make store update methods preserve original center for circles
// Don't recalculate properties during editing
```

## 📋 **WTF SUMMARY**

**The Problem**: Object edit panel has **"live preview"** that triggers store updates on every input change, and those store updates call the broken property recalculation.

**The WTF**: 
- ✅ Panel **opens** correctly (just reads stored properties)
- ❌ Panel **live preview** incorrectly triggers property recalculation
- ❌ Every **input change** calls store methods that recalculate properties

**The Solution**: Either disable live preview or make it not trigger store property recalculation.

**Priority**: This is the **ROOT CAUSE** of the radius halving bug - fix this and the bug disappears.