# 🚨 Bbox Test Layer Correction Analysis

## ❌ **What I Implemented WRONG**

### **1. Applied Pixelate Filter (WRONG!)**
```typescript
// In BboxTextureTestRenderer.createBboxTextureSprite():
sprite.filters = [this.pixelateFilter]  // ❌ WRONG! Should be NO FILTER
```

### **2. Pixelate Filter Initialization (WRONG!)**
```typescript
// In constructor:
this.pixelateFilter = new PixelateFilter([...])  // ❌ WRONG! No filter needed
```

### **3. Wrong Objective in Documentation**
- Documented as "Clean pixelated appearance" ❌ WRONG
- Should be "Perfect geometry mirror" ✅ CORRECT

## ✅ **What Should Be Implemented**

### **Objective: PERFECT MIRROR OF GEOMETRY LAYER**
- **No filters applied** - pure texture sprites
- **Bbox-sized sprites** positioned exactly at geometry locations
- **Should be invisible when overlapping** geometry (perfect alignment test)

### **Correct Implementation:**
```typescript
// Create sprite that exactly matches bbox
const sprite = new Sprite(texture)
sprite.width = width      // Exact bbox dimensions
sprite.height = height    
sprite.position.set(bounds.minX, bounds.minY)  // Exact bbox position
// NO FILTERS! sprite.filters = [] or undefined
```

## 🔧 **Required Changes**

### **1. Remove Pixelate Filter from BboxTextureTestRenderer**
- Remove `pixelateFilter` property
- Remove filter initialization in constructor  
- Remove `updatePixelateFilterScale()` method
- Remove filter application in `createBboxTextureSprite()`

### **2. Add UI Toggle Integration**
- Add `bboxTest: false` to LayerToggleBar layerStates
- Add event handler for bbox test toggle
- Add UI button integration
- Update store to track bboxTest layer visibility

### **3. Connect to Store State**
- Replace hardcoded `testEnabled = true` 
- Use `gameStore.geometry.layerVisibility.bboxTest`
- Make layer truly toggleable from UI

### **4. Update Documentation**
- Correct objective: "Perfect geometry mirror"
- Remove all pixelate filter references
- Emphasize "invisible overlay" testing concept

## 🎯 **Expected Behavior After Fix**

### **When bboxTest layer is ON:**
- Sprites should be **completely invisible** over geometry (perfect overlap)
- **Same visual appearance** as geometry-only rendering
- **Perfect alignment** during camera movement/zoom

### **When geometry layer is OFF, bboxTest ON:**
- Should see **exact replica** of geometry using sprites
- **Same shapes, same positions, same sizes**
- **No visual differences** except it's sprite-based instead of graphics-based

This will validate that bbox-exact sprites work perfectly before applying the approach to actual pixelate filtering!