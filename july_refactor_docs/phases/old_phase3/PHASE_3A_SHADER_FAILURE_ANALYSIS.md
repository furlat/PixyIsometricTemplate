# PHASE 3A - Shader Failure Analysis

## **You're Right - Should See Alternating Pixels**

Even with cellSize=1, the shader should create:
- Light gray pixels: `vec3(0.941, 0.941, 0.941)` 
- Dark gray pixels: `vec3(0.878, 0.878, 0.878)`

On a 500$ monitor, this should be **clearly visible** as alternating pixels.

## **Full Black = Shader Failure**

The fact that it shows **full black** suggests:

### **1. Shader Compilation Error**
```glsl
// Current shader might be failing
void main() {
  vec2 cellCoord = floor(vPosition / uCellSize);  // ❌ Might be failing
  float checker = mod(cellCoord.x + cellCoord.y, 2.0);
  // ... rest might never execute
}
```

### **2. Uniform/Varying Issues**
```typescript
// Current uniform setup
resources: {
  uCellSize: this.meshManager.getCellSize()  // ❌ Might be wrong value
}
```

### **3. Toggle Logic Causing Render Failure**
```typescript
// Current toggle logic
if (!gameStore_3a.ui.enableCheckboard) {
  return // ❌ Shader never removed, causing render conflicts
}
```

## **Most Likely Cause: Toggle Logic**

The shader is **never removed** when disabled, which can cause:
- Render conflicts
- GPU state issues
- Shader staying active when it shouldn't

## **Primary Fix: Toggle Logic**

```typescript
// CURRENT (BROKEN)
public render(): void {
  if (!gameStore_3a.ui.enableCheckboard) {
    return // ❌ Shader stays applied
  }
  // Apply shader
}

// FIXED
public render(): void {
  const mesh = this.meshManager.getMesh()
  if (!mesh) return
  
  if (gameStore_3a.ui.enableCheckboard) {
    (mesh as any).shader = this.shader  // ✅ Apply
  } else {
    (mesh as any).shader = null         // ✅ Remove
  }
}
```

## **Secondary Investigation**

If toggle fix doesn't work, check:
1. **Shader compilation** - Add console logging
2. **Uniform values** - Verify uCellSize is correct
3. **Varying values** - Verify vPosition is correct

But most likely the toggle logic is causing the rendering failure.