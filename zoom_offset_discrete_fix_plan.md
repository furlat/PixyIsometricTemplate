# ZOOM OFFSET DISCRETE FIX PLAN

## 🎯 **ROOT CAUSE IDENTIFIED**

**CONTINUOUS OFFSET DURING ZOOM** - The `vertex_to_pixeloid_offset` becomes continuous floating-point values instead of discrete integers during mouse-centered zoom operations.

### **Where the Problem Occurs:**
- **File**: `app/src/game/InfiniteCanvas.ts`
- **Method**: `applyMouseCenteredZoom()` 
- **Lines**: 184-193

### **Current Code (BROKEN):**
```typescript
// Calculate new offset to keep same pixeloid under mouse
const newOffsetX = targetPixeloidX - newMouseVertexX  // ❌ CONTINUOUS FLOAT (e.g., 1.234)
const newOffsetY = targetPixeloidY - newMouseVertexY  // ❌ CONTINUOUS FLOAT (e.g., 5.678)

// Update offset
updateGameStore.setVertexToPixeloidOffset(
  createPixeloidCoordinate(newOffsetX, newOffsetY)  // ❌ Non-integer offset!
)
```

### **The Problem:**
1. **Mouse position is arbitrary** → calculations produce fractional offsets
2. **Fractional offset** → pixeloid grid not aligned to integer boundaries  
3. **Non-aligned grid** → geometry appears to "drift" or "float"
4. **Visual inconsistency** → shapes don't stay at exact pixeloid positions

## 🔧 **THE FIX**

### **ROUND OFFSET TO INTEGERS** for pixeloid-perfect alignment:

```typescript
// Calculate new offset to keep same pixeloid under mouse
const rawOffsetX = targetPixeloidX - newMouseVertexX
const rawOffsetY = targetPixeloidY - newMouseVertexY

// ✅ FIX: Round to integers for pixeloid-perfect alignment
const newOffsetX = Math.round(rawOffsetX)  // ✅ DISCRETE INTEGER
const newOffsetY = Math.round(rawOffsetY)  // ✅ DISCRETE INTEGER

// Update offset with integer values
updateGameStore.setVertexToPixeloidOffset(
  createPixeloidCoordinate(newOffsetX, newOffsetY)  // ✅ Integer-aligned offset!
)
```

## 📋 **IMPLEMENTATION PLAN**

### **Step 1: Fix Mouse-Centered Zoom**
- Update `InfiniteCanvas.ts:applyMouseCenteredZoom()` 
- Round offset calculations to integers
- Add console logging to verify integer alignment

### **Step 2: Verify WASD Movement** 
- Ensure WASD movement also produces integer offsets
- Check `InputManager.ts:updateMovement()` for integer snapping

### **Step 3: Test Results**
- Verify geometry stays in exact positions during zoom
- Confirm no visual drift or floating
- Test at various zoom levels and mouse positions

## 🎯 **EXPECTED RESULTS**

- ✅ **No geometry drift** during zoom operations
- ✅ **Pixeloid-perfect positioning** maintained at all zoom levels  
- ✅ **Integer-aligned grid** ensures consistent visual appearance
- ✅ **Stable geometry anchoring** - shapes stay exactly where placed

**This fix will eliminate the geometry drift completely by ensuring the pixeloid grid is always aligned to integer boundaries!**