# 🔍 **GEOMETRY RENDERER REACTIVITY STUDY**

## 🐛 **IDENTIFIED ISSUES**

### **Issue 1: No Store Subscription**
**Current State**:
- GeometryRenderer checks offset changes in `render()` method ✅
- But `render()` is only called by LayeredInfiniteCanvas ❌
- No direct subscription to `gameStore.mesh.vertex_to_pixeloid_offset` ❌

**Problem**: If offset changes but LayeredInfiniteCanvas doesn't re-render, objects stay in wrong positions.

### **Issue 2: Zoom Changes Not Handled**
**Current State**:
- When `pixeloid_scale` changes (zoom in/out), coordinate conversion stays the same ❌
- Mesh changes resolution but GeometryRenderer doesn't react ❌

**Problem**: After zoom, objects might be positioned incorrectly relative to new mesh.

## 🔍 **STUDY: CURRENT RENDER CALL CHAIN**

### **Expected Flow**:
```
1. User changes offset via WASD
2. Store updates: gameStore.mesh.vertex_to_pixeloid_offset
3. ??? Something should trigger re-render
4. LayeredInfiniteCanvas.renderGeometryLayer()
5. GeometryRenderer.render() detects change and redraws
```

### **Questions to Investigate**:
1. **What triggers LayeredInfiniteCanvas.render()?**
2. **Is LayeredInfiniteCanvas reactive to store changes?**
3. **How does zoom trigger re-renders?**
4. **Should GeometryRenderer have its own store subscription?**

## 📋 **INVESTIGATION PLAN**

### **Step 1: Study LayeredInfiniteCanvas Reactivity**
**Files to Check**:
- `LayeredInfiniteCanvas.ts` - How does it get triggered to re-render?
- `Game.ts` - Does game loop call render continuously?
- `InfiniteCanvas.ts` - What triggers the render cycle?

### **Step 2: Study Store Reactivity Pattern**
**Files to Check**:
- `MouseHighlightRenderer.ts` - How does it react to mouse changes?
- `gameStore.ts` - What store subscription patterns exist?

### **Step 3: Identify Solution**
**Options**:
1. **Add Store Subscription to GeometryRenderer**
2. **Ensure LayeredInfiniteCanvas is reactive to offset changes**
3. **Force render() calls when offset/scale changes**

## 🎯 **EXPECTED SOLUTIONS**

### **Option 1: GeometryRenderer Store Subscription**
```typescript
// In GeometryRenderer constructor
subscribe(gameStore.mesh.vertex_to_pixeloid_offset, () => {
  this.markDirty() // Force redraw on next render
})

subscribe(gameStore.camera.pixeloid_scale, () => {
  this.markDirty() // Force redraw when zoom changes
})
```

### **Option 2: LayeredInfiniteCanvas Reactivity**
```typescript
// In LayeredInfiniteCanvas
// Ensure it re-renders when offset or scale changes
```

### **Option 3: Game Loop Force Render**
```typescript
// In Game.ts
// Detect store changes and force render calls
```

## 🔧 **IMMEDIATE FIXES NEEDED**

1. **Study current render trigger mechanism**
2. **Add proper store reactivity**
3. **Handle zoom changes correctly**
4. **Test WASD movement responsiveness**

**The GeometryRenderer needs to be truly reactive to coordinate system changes, not just check for changes when coincidentally called.**