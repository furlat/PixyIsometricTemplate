# CONSISTENT GRID ANCHORING IMPLEMENTATION PLAN

## 🎯 **Strategy A: Consistent Grid-Corner Anchoring**

### **Core Principle:**
All geometry types use 'top-left' anchoring for both user-defined points, ensuring **predictable, grid-aligned, integer-coordinate positioning**.

### **New Anchor Configuration:**
```typescript
point:     { firstPointAnchor: 'center' }     // Exception: points at centers (makes sense)
line:      { firstPointAnchor: 'top-left', secondPointAnchor: 'top-left' }
circle:    { firstPointAnchor: 'top-left', secondPointAnchor: 'top-left' }  
rectangle: { firstPointAnchor: 'top-left', secondPointAnchor: 'top-left' }
diamond:   { firstPointAnchor: 'top-left', secondPointAnchor: 'top-left' }
```

### **Expected Behavior:**
- ✅ **Predictable**: Every click snaps to top-left corner of pixeloid square
- ✅ **Consistent**: Same anchoring rule across all geometry types
- ✅ **Grid-aligned**: All vertices align to integer boundaries
- ⚠️ **Circle centers**: May end up at half-pixeloid positions (acceptable trade-off)

## 📋 **IMPLEMENTATION PLAN**

### **Phase 1: Update Anchor Defaults** 
1. **Modify `GeometryVertexCalculator.getDefaultAnchorConfig()`**
   - Set all geometry types to use 'top-left' anchoring consistently
   - Keep points using 'center' as special case

### **Phase 2: Add UI Anchor Controls**
1. **GeometryPanel.ts** - Global anchor settings
   - Add anchor dropdown for default behavior
   - Apply to all new geometry creation

2. **ObjectEditPanel.ts** - Per-object anchor editing  
   - Allow changing anchoring of existing objects
   - Ensure both points use same anchor strategy (consistency rule)

### **Phase 3: Test & Debug**
1. **Test each geometry type** with new anchoring
2. **Verify consistency** - both click points use same strategy
3. **Check edge cases** - small sizes, different positions
4. **Validate no drift** - ensure discrete offset fix still works

### **Phase 4: Future Enhancements (Optional)**
1. **Corner-based anchoring** - squares that perfectly envelope pixeloids
2. **Smart circle anchoring** - ensure integer centers when possible
3. **Context-aware anchoring** - different strategies for different use cases

## 🔧 **DETAILED IMPLEMENTATION**

### **Step 1: Update GeometryVertexCalculator**
```typescript
static getDefaultAnchorConfig(geometryType: string): AnchorConfig {
  switch (geometryType) {
    case 'point':
      return { firstPointAnchor: 'center' }  // Special case
    case 'line':
    case 'circle':  
    case 'rectangle':
    case 'diamond':
      return { 
        firstPointAnchor: 'top-left', 
        secondPointAnchor: 'top-left'  // Consistent anchoring
      }
    default:
      return { firstPointAnchor: 'top-left' }
  }
}
```

### **Step 2: Add Global Anchor Settings to Store**
```typescript
// Add to gameStore
geometry: {
  anchorConfig: {
    globalDefaults: {
      point: 'center',
      line: 'top-left',
      circle: 'top-left', 
      rectangle: 'top-left',
      diamond: 'top-left'
    }
  }
}
```

### **Step 3: Add UI Controls**
- **GeometryPanel**: Dropdown to change global defaults
- **ObjectEditPanel**: Per-object anchor override
- **Consistency rule**: Both points always use same anchor type

### **Step 4: Circle Center Handling**
For circles with 'top-left' anchoring:
```typescript
// West vertex at top-left of first pixeloid: (0, 0)
// East vertex at top-left of second pixeloid: (2, 0)  
// Center calculation: ((0+2)/2, (0+0)/2) = (1, 0) ✅ Integer center

// OR if closer:
// West at (0, 0), East at (1, 0)
// Center: (0.5, 0) ⚠️ Half-pixeloid center (acceptable)
```

## 🎉 **BENEFITS OF THIS APPROACH**

1. **Immediate consistency** - eliminates current mixed anchoring
2. **Predictable behavior** - user knows every click → top-left corner
3. **Grid alignment** - perfect for pixel-art style geometry
4. **Foundation for future** - can enhance with more sophisticated anchoring later
5. **User control** - UI allows changing defaults and per-object anchoring

**This provides a solid, consistent foundation that we can iterate on!**