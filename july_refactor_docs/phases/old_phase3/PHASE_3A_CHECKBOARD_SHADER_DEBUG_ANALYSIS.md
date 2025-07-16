# PHASE 3A - Checkboard Shader Debug Analysis

## **Current Issues**

1. **Full black screen** when checkboard is enabled
2. **Toggle not working** - turns on but doesn't turn off
3. **No visible checkboard pattern**

## **Potential Root Causes**

### **Issue 1: Shader Application Problems**

```typescript
// GridShaderRenderer_3a.ts - Current implementation
public render(): void {
  if (!gameStore_3a.ui.enableCheckboard) {
    console.log('GridShaderRenderer_3a: Checkboard disabled in store')
    return // ❌ PROBLEM: Doesn't remove shader when disabled
  }
  
  const mesh = this.meshManager.getMesh()
  if (mesh && this.shader) {
    // Apply shader to mesh
    (mesh as any).shader = this.shader // ❌ PROBLEM: Never removes shader
    console.log('Grid shader applied to mesh')
  }
}
```

**Problem**: The shader is never **removed** when disabled, only **not applied** when disabled.

### **Issue 2: Fragment Shader Logic**

```glsl
// Current fragment shader
void main() {
  vec2 cellCoord = floor(vPosition / uCellSize);
  float checker = mod(cellCoord.x + cellCoord.y, 2.0);
  
  vec3 lightColor = vec3(0.941, 0.941, 0.941); // #f0f0f0
  vec3 darkColor = vec3(0.878, 0.878, 0.878);  // #e0e0e0
  
  vec3 color = mix(lightColor, darkColor, checker);
  
  gl_FragColor = vec4(color, 1.0);
}
```

**Potential Problems**:
1. **vPosition scaling** - vPosition might not be in the right coordinate space
2. **uCellSize value** - Cell size might be wrong (currently set to 1 from store)
3. **Coordinate system mismatch** - Mesh coordinates vs shader coordinates

### **Issue 3: Cell Size Mismatch**

```typescript
// MeshManager_3a.ts - Creates mesh with hardcoded cell size
const CELL_SIZE = 20 // ❌ HARDCODED

// GridShaderRenderer_3a.ts - Uses store cell size
resources: {
  uCellSize: this.meshManager.getCellSize() // ❌ Returns store value (1)
}
```

**Problem**: Mesh is created with cell size 20, but shader uses cell size 1.

### **Issue 4: Toggle Logic**

```typescript
// Current toggle behavior
render(): void {
  if (!gameStore_3a.ui.enableCheckboard) {
    return // ❌ Just returns, doesn't remove shader
  }
  // Apply shader
}
```

**Required**: Need to **remove** shader when disabled.

## **Solutions**

### **Solution 1: Fix Toggle Logic**

```typescript
// GridShaderRenderer_3a.ts - CORRECTED
public render(): void {
  const mesh = this.meshManager.getMesh()
  if (!mesh) return
  
  if (gameStore_3a.ui.enableCheckboard) {
    // Apply shader
    if (this.shader) {
      (mesh as any).shader = this.shader
    }
  } else {
    // Remove shader
    (mesh as any).shader = null
  }
}
```

### **Solution 2: Fix Cell Size**

```typescript
// GridShaderRenderer_3a.ts - Use actual mesh cell size
resources: {
  uCellSize: 20 // Use actual mesh cell size, not store value
}
```

### **Solution 3: Fix Coordinate System**

```glsl
// Corrected fragment shader
void main() {
  // Use actual mesh cell size for coordinate calculation
  vec2 cellCoord = floor(vPosition / 20.0); // Use actual cell size
  float checker = mod(cellCoord.x + cellCoord.y, 2.0);
  
  vec3 lightColor = vec3(0.941, 0.941, 0.941);
  vec3 darkColor = vec3(0.878, 0.878, 0.878);
  
  vec3 color = mix(lightColor, darkColor, checker);
  
  gl_FragColor = vec4(color, 1.0);
}
```

### **Solution 4: Debug Shader Values**

```typescript
// Add debug logging
console.log('Shader values:', {
  uCellSize: this.meshManager.getCellSize(),
  meshCellSize: 20,
  enableCheckboard: gameStore_3a.ui.enableCheckboard
})
```

## **Implementation Priority**

1. **Fix toggle logic** - Remove shader when disabled
2. **Fix cell size** - Use correct mesh cell size (20, not 1)
3. **Test pattern** - Verify checkboard appears
4. **Debug coordinates** - Add logging to verify shader values

## **Expected Results**

After fixes:
- ✅ **Toggle works** - Turns checkboard on/off
- ✅ **Pattern visible** - Light/dark checkboard squares
- ✅ **Correct scale** - Matches mesh cell size
- ✅ **No black screen** - Proper shader rendering

This should resolve the shader issues and restore proper checkboard functionality.