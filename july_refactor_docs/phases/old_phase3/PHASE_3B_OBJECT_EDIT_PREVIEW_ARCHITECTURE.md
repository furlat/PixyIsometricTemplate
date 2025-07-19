# Phase 3B: Object Edit Preview Architecture - CORRECT APPROACH

## 🎯 **THE CORRECT DESIGN PATTERN**

### **✅ LIKE DRAG SYSTEM** - Preview Without Store Spam

**User's Insight**: "exactly the approach we used for dragging to avoid spamming the store until things where actually set"

## 📋 **CURRENT DRAG SYSTEM** (Working Correctly)

### **Drag Preview State** (`gameStore_3b.ts` line 92-97):
```typescript
// ✅ NEW: Drag preview state - separate from drawing preview
dragPreview: {
  isActive: boolean
  currentMousePosition: PixeloidCoordinate | null
  previewVertices: PixeloidCoordinate[]  // PREVIEW ONLY - original unchanged
}
```

### **Drag System Flow** (✅ CORRECT):
```
1. Start Drag → Store drag state, original object UNCHANGED
2. Update Drag → Update preview state ONLY, original object UNCHANGED  
3. Stop Drag → Commit preview to store, update original object ONCE
```

## 🔧 **REQUIRED: OBJECT EDIT PREVIEW SYSTEM**

### **New Edit Preview State** (Required):
```typescript
editPreview: {
  isActive: boolean
  objectId: string | null
  previewProperties: GeometryProperties | null  // PREVIEW ONLY
  previewVertices: PixeloidCoordinate[]         // PREVIEW ONLY
  previewStyle: StyleSettings | null            // PREVIEW ONLY
}
```

### **Object Edit System Flow** (✅ CORRECT):
```
1. Open Panel → Read stored properties, original object UNCHANGED
2. User Types → Update preview state ONLY, original object UNCHANGED
3. Apply → Commit preview to store, update original object ONCE
4. Cancel → Discard preview, restore original object
```

## 🚨 **CURRENT BROKEN APPROACH** vs **CORRECT APPROACH**

### **❌ CURRENT (Wrong)**:
```typescript
// BROKEN: updateLivePreview() → updateObjectInStore() → store spam
private updateLivePreview(): void {
  const updates = this.buildUpdatedProperties()
  this.updateObjectInStore(selectedObjectId, updates)  // ❌ STORE SPAM
}
```

### **✅ REQUIRED (Correct)**:
```typescript
// CORRECT: updateLivePreview() → updatePreviewState() → no store spam  
private updateLivePreview(): void {
  const previewData = this.buildPreviewData()
  this.updatePreviewState(previewData)  // ✅ PREVIEW ONLY
}

// Only update store on Apply
private applyChanges(): void {
  this.commitPreviewToStore()  // ✅ SINGLE STORE UPDATE
}
```

## 📋 **VERTEX AUTHORITY PRINCIPLE**

### **✅ NO MULTIPATH** - Properties Calculated ONCE:
```typescript
// ✅ CREATION: Properties calculated from user input (center + radius)
createCircle(center, radius) → generateVertices(center, radius) → calculateProperties(center, radius) → store

// ✅ EDITING: Properties updated from user input (NOT from vertices)  
editCircle(newCenter, newRadius) → generateVertices(newCenter, newRadius) → updateStoredProperties(newCenter, newRadius)
```

### **❌ NEVER RECALCULATE** from vertices:
```typescript
// ❌ WRONG: updateGeometryObjectVertices() → calculateProperties() ← FORBIDDEN
// ✅ CORRECT: updateGeometryObjectVertices() → keep existing properties ← REQUIRED
```

## 🎯 **IMPLEMENTATION APPROACH**

### **Phase 1**: Add Edit Preview State to Store
### **Phase 2**: Update Object Edit Panel to Use Preview
### **Phase 3**: Remove Store Spam from Live Preview
### **Phase 4**: Implement Apply/Cancel with Single Store Update

**Result**: Live preview works exactly like drag system - smooth, fast, no store spam, single commit.

## 🏆 **SUCCESS CRITERIA**

✅ Live preview shows changes instantly  
✅ Original object never touched during editing  
✅ Store updated only once on Apply  
✅ Properties NEVER recalculated from vertices  
✅ Cancel restores original object perfectly  

**Approach**: **EXACTLY like drag system** - preview state, single commit.