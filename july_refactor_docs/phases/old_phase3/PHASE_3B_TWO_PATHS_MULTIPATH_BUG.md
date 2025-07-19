# Phase 3B: TWO PATHS Multipath Bug Analysis

## 🚨 **THE REAL BUG: TWO DIFFERENT CALCULATION PATHS**

### **User's Critical Insight**: 
*"why isn't doing the same mistake the second time???? it means there are TWO PATHS"*

## 📋 **THE TWO PATHS**

### **PATH 1: CREATION (100 → 78)**
```
User draws radius 100
↓
Creation logic uses BROKEN calculation
↓ 
Properties calculated as radius 78
↓
Object stored with wrong properties
```

### **PATH 2: EDITING (78 → 78)**  
```
Object already has radius 78 stored
↓
Edit panel reads stored radius 78
↓
When editing, uses stored value (no recalculation)
↓
Stays at 78
```

## 🔍 **WHERE ARE THE TWO PATHS?**

### **Path 1 Suspects (Creation)**:
1. `gameStore_3b_methods.finishDrawing()`
2. `gameStore_3b_methods.addGeometryObject()`
3. `gameStore_3b_methods.addGeometryObjectWithProperties()`
4. `createGeometricObject()` in ecs-data-layer.ts
5. `GeometryPropertyCalculators.calculateCircleProperties()`

### **Path 2 Suspects (Editing)**:
1. Object Edit Panel reads stored properties
2. Edit preview uses stored properties
3. Apply uses stored or recalculated properties

## 🎯 **THE SMOKING GUN**

**If the SAME calculation was used both times:**
- Creation: 100 → 78
- Editing: 78 → 61 (same broken math applied again)

**But it's actually:**
- Creation: 100 → 78 
- Editing: 78 → 78 (different path!)

## 🔧 **INVESTIGATION NEEDED**

1. **Find Path 1**: Where during creation does 100 become 78?
2. **Find Path 2**: Where during editing does it use stored vs calculated?
3. **Eliminate both paths**: Single source of truth for properties

**The user is absolutely right - there are TWO DIFFERENT calculation paths!**