# 🚨 Critical Issues in Bbox Test Layer Implementation

## 📸 **Image Analysis Reveals Major Problems**

### **Issue 1: Gaussian Blur Effect** 
- **Problem**: Sprites appear blurred/gaussian filtered
- **Cause**: Texture capture using `generateTexture()` with wrong resolution/filtering
- **Evidence**: Image 2 shows clear blur on sprites vs sharp original geometry

### **Issue 2: Coordinate System Mismatch**
- **Problem**: Sprites positioned in wrong coordinate space
- **Cause**: Using `bounds.minX, bounds.minY` directly without coordinate transformation
- **Evidence**: Image 4 shows sprites completely disconnected from geometry positions

### **Issue 3: WASD Movement Disconnection**
- **Problem**: Sprites don't follow geometry during WASD movement
- **Cause**: Sprites positioned once, no camera tracking updates
- **Evidence**: User reports "zoom works good if I recenter" but WASD broken

### **Issue 4: Vertex vs Pixeloid Confusion**
- **Problem**: Positioning coordinates likely in vertex space, not pixeloid space
- **Cause**: Metadata bounds might be vertex coordinates, sprites need screen coordinates
- **Evidence**: Complete disconnection suggests wrong coordinate system

## 🔍 **Root Cause Analysis**

### **Texture Capture Problem:**
```typescript
// CURRENT (WRONG):
const texture = this.renderer.generateTexture(graphics)
// Issue: generateTexture() uses default resolution, causes blur

// SHOULD BE:
// Need to capture at exact pixeloid resolution, no filtering
```

### **Coordinate System Problem:**
```typescript
// CURRENT (WRONG):
sprite.position.set(bounds.minX, bounds.minY)
// Issue: bounds are in pixeloid space, sprites need camera-relative positioning

// SHOULD BE:
// Need to transform pixeloid coordinates to current camera space
```

### **Camera Tracking Problem:**
```typescript
// CURRENT (WRONG):
// Sprites positioned once in render(), no updates
// Issue: Sprites don't track camera movement

// SHOULD BE:
// Sprites need to update positions when camera moves
```

## 💡 **Required Fixes**

### **1. Fix Texture Capture**
- Use exact pixeloid resolution for texture generation
- Disable filtering/smoothing
- Ensure crisp pixel-perfect capture

### **2. Fix Coordinate System**
- Transform pixeloid coordinates to camera space
- Account for camera position and scale
- Use same coordinate system as geometry renderer

### **3. Fix Camera Tracking**
- Update sprite positions when camera moves
- Subscribe to camera changes or recalculate per frame
- Maintain perfect alignment during WASD movement

### **4. Debug Coordinate Flow**
- Log pixeloid bounds vs sprite positions
- Verify coordinate transformations
- Test with simple geometry (single circle)

## 🎯 **The Fundamental Issue**

The bbox test layer is **not in the same coordinate system** as the geometry layer. We're positioning sprites in some coordinate space that doesn't match where the geometry is actually rendered.

**This explains why:**
- Zoom works (coordinate ratio maintained)
- WASD doesn't work (coordinate offset changes)
- Complete disconnection when isolated (wrong base coordinates)

The implementation needs a **complete coordinate system overhaul** to match the geometry rendering pipeline exactly.