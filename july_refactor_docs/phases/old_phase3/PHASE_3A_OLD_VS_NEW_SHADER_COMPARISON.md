# PHASE 3A - Old vs New Shader Comparison

## **Why the Old Shader Worked**

### **Old System (BackgroundGridRenderer.ts - WORKING)**
```glsl
// Old fragment shader
varying vec2 vGridPos;  // ✅ Grid coordinates

void main() {
  vec2 gridCoord = floor(vGridPos);  // ✅ Direct grid coordinates
  float checker = mod(gridCoord.x + gridCoord.y, 2.0);
  // ... works perfectly
}
```

```typescript
// Old mesh creation - Grid coordinates
vertices.push(
  x, y,       // ✅ Grid coordinates (0,1,2,3...)
  x + 1, y,   // ✅ Grid coordinates 
  x + 1, y + 1, // ✅ Grid coordinates
  x, y + 1    // ✅ Grid coordinates
)
```

### **New System (GridShaderRenderer_3a.ts - BROKEN)**
```glsl
// New fragment shader
varying vec2 vPosition;  // ❌ Screen coordinates

void main() {
  vec2 cellCoord = floor(vPosition / uCellSize);  // ❌ Dividing screen by 1
  float checker = mod(cellCoord.x + cellCoord.y, 2.0);
  // ... doesn't work
}
```

```typescript
// New mesh creation - Screen coordinates
const screenX = x * cellSize  // ❌ Screen coordinates (0,1,2,3...)
const screenY = y * cellSize  // ❌ When cellSize=1, same as grid but wrong concept
vertices.push(
  screenX, screenY,                              // ❌ Screen coordinates
  screenX + cellSize, screenY,                   // ❌ Screen coordinates
  screenX + cellSize, screenY + cellSize,        // ❌ Screen coordinates
  screenX, screenY + cellSize                    // ❌ Screen coordinates
)
```

## **The Root Problem**

### **Coordinate System Mismatch**
- **Old**: Mesh vertices in **grid coordinates** (0,1,2,3...), shader uses them directly
- **New**: Mesh vertices in **screen coordinates** (0,1,2,3... when cellSize=1), shader divides by cellSize

### **Why It Shows Black**
With cellSize=1:
```glsl
// vPosition = screen coordinates (0,1,2,3...)
vec2 cellCoord = floor(vPosition / 1);  // = floor(vPosition) = (0,1,2,3...)
float checker = mod(cellCoord.x + cellCoord.y, 2.0);
```

This creates a pixel-level alternating pattern that's too fine to see clearly, appearing as black/gray noise.

## **The Solution: Use Old System Approach**

### **Option 1: Change Shader to Match Old System**
```glsl
// Use vPosition directly like old system
void main() {
  vec2 gridCoord = floor(vPosition);  // ✅ Direct like old system
  float checker = mod(gridCoord.x + gridCoord.y, 2.0);
  // ... rest same
}
```

### **Option 2: Use Larger Pattern Scale**
```glsl
// Make pattern visible by using larger scale
void main() {
  vec2 cellCoord = floor(vPosition / 20.0);  // ✅ Visible squares
  float checker = mod(cellCoord.x + cellCoord.y, 2.0);
  // ... rest same
}
```

### **Option 3: Fix Toggle Logic**
```typescript
// Fix the toggle logic regardless of pattern
public render(): void {
  const mesh = this.meshManager.getMesh()
  if (!mesh) return
  
  if (gameStore_3a.ui.enableCheckboard) {
    (mesh as any).shader = this.shader  // ✅ Apply shader
  } else {
    (mesh as any).shader = null         // ✅ Remove shader
  }
}
```

## **Recommended Fix**

1. **Use Option 1** - Change shader to match old working system
2. **Fix toggle logic** - Remove shader when disabled
3. **Test pattern** - Verify checkboard appears correctly

This will restore the working checkboard pattern with proper toggle functionality.