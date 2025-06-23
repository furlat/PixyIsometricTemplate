# DIAMOND BBOX PIXELOID-PERFECT FIX

## 🚨 **PROBLEM IDENTIFIED**

### **Issue:** Bbox cuts off diamond vertices with fractional coordinates
- **Current:** Bbox precise to fractional vertex coordinates (diamond.anchorY ± diamond.height)
- **Problem:** When north/south vertices have fractional coordinates, bbox doesn't encompass full pixeloids
- **Result:** Parts of diamond vertices get clipped in pixeloid-perfect scenarios

## 📷 **VISUAL EVIDENCE FROM SCREENSHOTS:**
- Red bbox rectangles cutting off diamond vertices
- More evident with thin strokes
- Bbox should encompass complete pixeloids, not fractional coordinates

## 🔧 **SOLUTION: Pixeloid-Perfect Diamond Bounds**

### **Current GeometryHelper.calculateDiamondMetadata (WRONG):**
```typescript
bounds: {
  minX: diamond.anchorX,              // ✅ OK (integer)
  maxX: diamond.anchorX + diamond.width,  // ✅ OK (integer)
  minY: diamond.anchorY - diamond.height, // ❌ FRACTIONAL - cuts off north vertex
  maxY: diamond.anchorY + diamond.height  // ❌ FRACTIONAL - cuts off south vertex
}
```

### **Fixed Pixeloid-Perfect Bounds:**
```typescript
bounds: {
  minX: diamond.anchorX,
  maxX: diamond.anchorX + diamond.width,
  minY: Math.floor(diamond.anchorY - diamond.height), // ✅ Round DOWN - include full pixeloid containing north vertex
  maxY: Math.ceil(diamond.anchorY + diamond.height)   // ✅ Round UP - include full pixeloid containing south vertex
}
```

## 🎯 **WHY THIS WORKS:**

### **North Vertex (minY):**
- **Before:** `anchorY - height = 10.5 - 2.5 = 8.0` → bbox minY = 8.0
- **After:** `Math.floor(8.0) = 8` → bbox starts at pixeloid 8 (correct)
- **Fractional case:** `anchorY - height = 10.5 - 2.75 = 7.75` → `Math.floor(7.75) = 7` → includes full pixeloid 7

### **South Vertex (maxY):**
- **Before:** `anchorY + height = 10.5 + 2.5 = 13.0` → bbox maxY = 13.0  
- **After:** `Math.ceil(13.0) = 13` → bbox ends at pixeloid 13 (correct)
- **Fractional case:** `anchorY + height = 10.5 + 2.75 = 13.25` → `Math.ceil(13.25) = 14` → includes full pixeloid 13

## ✅ **EXPECTED RESULT:**
- ✅ **Diamond vertices fully contained** within bbox rectangles
- ✅ **Pixeloid-perfect alignment** for filter positioning
- ✅ **Extra 0.5 pixeloid safety margin** when needed for fractional coordinates
- ✅ **No more clipped vertices** in bbox visualization

**This ensures bbox always encompasses complete pixeloids rather than cutting off vertices at fractional coordinates!**