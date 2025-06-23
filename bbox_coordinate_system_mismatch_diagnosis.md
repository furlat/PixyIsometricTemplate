# 🚨 CRITICAL: Coordinate System Mismatch Identified

## 🔍 **Root Cause Found**

**GeometryRenderer** and **BboxTextureTestRenderer** use **completely different coordinate systems**!

### **GeometryRenderer Coordinate Flow:**
```typescript
// 1. Objects stored in PIXELOID coordinates in store
const obj = gameStore.geometry.objects[0] // {x: 100, y: 50} pixeloid coords

// 2. Convert to VERTEX coordinates for rendering
const convertedObject = this.convertObjectToVertexCoordinates(obj)
// convertedObject = {x: 100 - offset.x, y: 50 - offset.y} vertex coords

// 3. Graphics positioned at (0,0), drawn using vertex coordinates
graphics.position.set(0, 0)
this.renderGeometricObjectToGraphics(convertedObject, graphics)
```

### **BboxTextureTestRenderer Coordinate Flow:**
```typescript
// 1. Uses bounds in PIXELOID coordinates from metadata
const bounds = obj.metadata.bounds // {minX: 100, minY: 50} pixeloid coords

// 2. Directly positions sprite using PIXELOID coordinates (WRONG!)
sprite.position.set(bounds.minX, bounds.minY) // 100, 50 pixeloid coords
```

## ⚡ **The Critical Issue**

- **GeometryRenderer**: Renders at `vertex coordinates` = `pixeloid - offset`
- **BboxTextureTestRenderer**: Positions at `pixeloid coordinates` = `raw bounds`

**When WASD moves:**
- `offset` changes (e.g., from `(0,0)` to `(10,5)`)
- **GeometryRenderer**: Updates to `vertex = pixeloid - new_offset` ✅
- **BboxTextureTestRenderer**: Still uses `raw pixeloid bounds` ❌

**Result**: Sprites stay at old positions while geometry moves!

## 🔧 **Required Fixes**

### **1. Fix Coordinate System**
```typescript
// CURRENT (WRONG):
sprite.position.set(bounds.minX, bounds.minY)

// SHOULD BE:
const offset = gameStore.mesh.vertex_to_pixeloid_offset
sprite.position.set(bounds.minX - offset.x, bounds.minY - offset.y)
```

### **2. Fix Texture Resolution**
```typescript
// CURRENT (WRONG):
const texture = this.renderer.generateTexture(graphics)

// SHOULD BE:
const texture = this.renderer.generateTexture(graphics, {
  resolution: 1,
  antialias: false,
  scaleMode: 'nearest'
})
```

### **3. Fix Camera Tracking**
- Recalculate sprite positions every frame (like GeometryRenderer)
- Or subscribe to offset changes and update positions

## 🎯 **The Gaussian Blur**

The blur is likely from:
1. **Wrong resolution**: Default generateTexture resolution
2. **Antialiasing**: Default texture filtering
3. **Scale mismatch**: Texture captured at one scale, displayed at another

## ✅ **Validation**

This explains **all observed issues**:
- ✅ **WASD disconnection**: Different coordinate systems
- ✅ **Zoom works**: Coordinate ratio preserved
- ✅ **Complete disconnection**: Wrong base coordinates
- ✅ **Gaussian blur**: Wrong texture capture settings

The fix is to make BboxTextureTestRenderer use the **exact same coordinate system** as GeometryRenderer!