# 🔍 **ZOOM & MESH COORDINATE SYSTEM STUDY**

## 🚨 **CRITICAL DISCOVERY: MESH VERTICES SCALE WITH ZOOM**

### **What I Found in StaticMeshManager.ts**:

#### **Mesh Resolution Changes with Zoom**:
```typescript
// Line 99: Level IS the pixeloid scale
level: pixeloidScale

// Line 131: Vertices are scaled by level
vertices[vertexIndex++] = x * level
```

#### **This Means**:
- **Scale 10**: Vertex (1,1) → Screen position (10, 10)
- **Scale 5**: Vertex (1,1) → Screen position (5, 5)  
- **Scale 20**: Vertex (1,1) → Screen position (20, 20)

**The mesh itself changes resolution with every zoom!**

## 🐛 **GEOMETRY RENDERER COORDINATE CONVERSION IS WRONG**

### **Current GeometryRenderer Logic** (BROKEN ❌):
```typescript
// Line 130: Simple offset subtraction
anchorX: obj.anchorX - offset.x,
anchorY: obj.anchorY - offset.y
```

### **What This Produces**:
- Object at pixeloid (100, 50) with offset (10, 5)
- Renders at vertex coordinate (90, 45)
- **But vertices are scaled by current pixeloid scale!**

### **At Scale 10**:
- Vertex (90, 45) → Screen position (900, 450) ✅ Correct

### **At Scale 5** (BROKEN ❌):
- Vertex (90, 45) → Screen position (450, 225) ❌ Wrong!
- Should be at screen position (900, 450) to stay in same place

## 📊 **THE REAL COORDINATE CONVERSION FORMULA**

### **Correct Formula**:
```typescript
// Convert pixeloid to vertex coordinates accounting for mesh scaling
const vertexX = (obj.anchorX - offset.x) / currentScale
const vertexY = (obj.anchorY - offset.y) / currentScale
```

### **Why This Works**:
- Object at pixeloid (100, 50), offset (10, 5), scale 10
- Vertex coordinate: (100-10)/10 = 9, (50-5)/10 = 4.5
- Screen position: (9 × 10, 4.5 × 10) = (90, 45) ✅

- Same object at scale 5:
- Vertex coordinate: (100-10)/5 = 18, (50-5)/5 = 9  
- Screen position: (18 × 5, 9 × 5) = (90, 45) ✅ Same screen position!

## 🔍 **ZOOM REACTIVITY CHAIN**

### **Current Flow**:
```
1. User scrolls wheel
2. InfiniteCanvas.handleZoom() → applyBatchedZoom()
3. updateGameStore.setPixeloidScale(newScale)
4. StaticMeshManager subscription → updateCoordinateMapping()
5. New mesh generated with new scale
6. ??? GeometryRenderer should react and recalculate coordinates
```

### **Missing Link**:
GeometryRenderer has no subscription to scale changes and doesn't use scale in coordinate conversion!

## ✅ **REQUIRED FIXES**

### **Fix 1: Correct Coordinate Conversion in GeometryRenderer**
```typescript
private convertObjectToVertexCoordinates(obj: GeometricObject): GeometricObject {
  const offset = gameStore.mesh.vertex_to_pixeloid_offset
  const currentScale = gameStore.camera.pixeloid_scale  // ✅ ADD THIS
  
  if ('anchorX' in obj && 'anchorY' in obj) {
    return {
      ...obj,
      anchorX: (obj.anchorX - offset.x) / currentScale,  // ✅ DIVIDE BY SCALE
      anchorY: (obj.anchorY - offset.y) / currentScale
    }
  }
  // ... handle all object types
}
```

### **Fix 2: Subscribe to Scale Changes**
```typescript
constructor() {
  subscribe(gameStore.mesh.vertex_to_pixeloid_offset, () => {
    this.isDirty = true
  })
  
  subscribe(gameStore.camera.pixeloid_scale, () => {  // ✅ ADD THIS
    this.isDirty = true
    console.log('GeometryRenderer: Scale changed, marking dirty')
  })
}
```

### **Fix 3: Update Preview Coordinate Conversion**
```typescript
// In renderPreviewWithCoordinateConversion():
const currentScale = gameStore.camera.pixeloid_scale  // ✅ ADD THIS
const startPoint = {
  x: (activeDrawing.startPoint.x - offset.x) / currentScale,   // ✅ DIVIDE BY SCALE
  y: (activeDrawing.startPoint.y - offset.y) / currentScale
}
```

## 🎯 **EXPECTED RESULT AFTER FIXES**

### **WASD Movement**:
- ✅ Objects maintain screen position when offset changes
- ✅ Works correctly at all zoom levels

### **Zoom In/Out**:
- ✅ Objects maintain screen position when scale changes  
- ✅ New mesh resolution automatically handled
- ✅ Coordinate conversion accounts for mesh scaling

### **Drawing**:
- ✅ Preview appears at correct position during zoom
- ✅ Final objects placed at correct coordinates

**The coordinate conversion must account for BOTH offset AND current mesh scale to work correctly across zoom levels.**