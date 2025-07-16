# PHASE 3A - Simple Shader Revert Plan

## **You're Right - Just Use the Old Working Shader**

We have:
- ✅ **Mesh vertices** from MeshManager_3a (already in grid coordinates)
- ✅ **Working old shader** in game_backup/BackgroundGridRenderer.ts
- ✅ **Store toggle** system ready

## **What We Need to Do**

### **1. Copy the Old Shader Exactly**
```glsl
// OLD WORKING SHADER (from game_backup)
varying vec2 vGridPos;  // ✅ This is the key difference

void main() {
  vec2 gridCoord = floor(vGridPos);  // ✅ Direct grid coordinates
  float checker = mod(gridCoord.x + gridCoord.y, 2.0);
  
  vec3 lightColor = vec3(0.941, 0.941, 0.941);
  vec3 darkColor = vec3(0.878, 0.878, 0.878);
  
  vec3 color = mix(lightColor, darkColor, checker);
  gl_FragColor = vec4(color, 1.0);
}
```

### **2. Change Vertex Shader**
```glsl
// OLD WORKING VERTEX SHADER
attribute vec2 aPosition;
varying vec2 vGridPos;  // ✅ Pass grid position directly

void main() {
  // ... matrix transforms ...
  vGridPos = aPosition;  // ✅ Grid coordinates, not screen coordinates
}
```

### **3. Fix Toggle Logic**
```typescript
// SIMPLE TOGGLE
public render(): void {
  const mesh = this.meshManager.getMesh()
  if (!mesh) return
  
  if (gameStore_3a.ui.enableCheckboard) {
    (mesh as any).shader = this.shader  // Apply
  } else {
    (mesh as any).shader = null         // Remove
  }
}
```

## **Why This Will Work**

1. **MeshManager_3a already creates grid coordinates** - vertices are `(x, y)` to `(x+1, y+1)`
2. **Old shader expects grid coordinates** - `vGridPos` is passed directly
3. **No division needed** - `floor(vGridPos)` gives us grid cell coordinates
4. **Proven working** - this exact shader worked before

## **Simple Changes Required**

1. **Change varying name**: `vPosition` → `vGridPos`
2. **Change fragment shader**: `floor(vPosition / uCellSize)` → `floor(vGridPos)`
3. **Remove uCellSize uniform** - not needed
4. **Fix toggle logic** - remove shader when disabled

This should work immediately because we're just using the proven working shader with our existing mesh system.