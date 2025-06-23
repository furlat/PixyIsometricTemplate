# ANCHOR CONFIGURATION UI INTEGRATION PLAN

## 🎯 **OBJECTIVE**

Integrate UI controls to allow users to:
1. **Set default anchor types** from GeometryPanel (affects new geometry creation)
2. **Change anchor types per-object** from ObjectEditPanel (affects existing geometry)

## 🔍 **INTERVENTION POINTS ANALYSIS**

### **1. STORE LAYER** 📦
**Current State**: No anchor configuration state
**Required Changes**: Add anchor state management

**Files to Modify:**
- `app/src/store/gameStore.ts`

**New State Structure:**
```typescript
geometry: {
  anchoring: {
    // Global defaults for new geometry creation
    defaults: {
      point: 'center',
      line: 'top-left', 
      circle: 'top-left',
      rectangle: 'top-left',
      diamond: 'top-left'
    },
    // Per-object anchor overrides (objectId -> anchorConfig)
    objectOverrides: Map<string, AnchorConfig>
  }
}
```

**New Actions Needed:**
```typescript
setDefaultAnchor(geometryType, anchorType)
setObjectAnchor(objectId, anchorConfig)
clearObjectAnchor(objectId)
```

### **2. GEOMETRY VERTEX CALCULATOR** 🧮
**Current State**: Hardcoded anchor defaults
**Required Changes**: Read from store instead of hardcoded values

**Files to Modify:**
- `app/src/game/GeometryVertexCalculator.ts`

**Changes Required:**
```typescript
// OLD (hardcoded):
static getDefaultAnchorConfig(geometryType: string): AnchorConfig

// NEW (store-driven):
static getAnchorConfig(geometryType: string, objectId?: string): AnchorConfig {
  // Check for per-object override first
  if (objectId && gameStore.geometry.anchoring.objectOverrides.has(objectId)) {
    return gameStore.geometry.anchoring.objectOverrides.get(objectId)
  }
  // Fall back to global default
  return gameStore.geometry.anchoring.defaults[geometryType]
}
```

### **3. INPUT MANAGER** 🎮
**Current State**: Uses hardcoded anchor config from GeometryVertexCalculator
**Required Changes**: Pass store-driven anchor config

**Files to Modify:**
- `app/src/game/InputManager.ts`

**Changes Required:**
```typescript
// Update geometry creation calls to use store-driven anchors
const anchorConfig = GeometryVertexCalculator.getAnchorConfig(geometryType)
// Pass anchorConfig to vertex calculation
```

### **4. GEOMETRY PANEL UI** 🛠️
**Current State**: No anchor controls
**Required Changes**: Add anchor selection dropdowns

**Files to Modify:**
- `app/src/ui/GeometryPanel.ts`
- `app/index.html` (add HTML elements)

**New UI Elements:**
```html
<!-- Add to geometry panel -->
<div class="anchor-configuration">
  <h4>Default Anchoring</h4>
  <label>Point: <select id="anchor-point">...</select></label>
  <label>Line: <select id="anchor-line">...</select></label>
  <label>Circle: <select id="anchor-circle">...</select></label>
  <label>Rectangle: <select id="anchor-rectangle">...</select></label>
  <label>Diamond: <select id="anchor-diamond">...</select></label>
</div>
```

### **5. OBJECT EDIT PANEL UI** ✏️
**Current State**: No anchor controls
**Required Changes**: Add per-object anchor editing

**Files to Modify:**
- `app/src/ui/ObjectEditPanel.ts`
- `app/index.html` (add HTML elements)

**New UI Elements:**
```html
<!-- Add to object edit panel -->
<div class="object-anchor-configuration">
  <h4>Object Anchoring</h4>
  <label>First Point: <select id="obj-anchor-first">...</select></label>
  <label>Second Point: <select id="obj-anchor-second">...</select></label>
  <button id="reset-to-default">Reset to Default</button>
</div>
```

## 📋 **IMPLEMENTATION ATTACK PLAN**

### **Phase 1: Store Foundation** 🏗️
1. **Add anchor state** to gameStore
2. **Add anchor actions** for setting defaults and per-object overrides
3. **Initialize with current defaults** to maintain backward compatibility

### **Phase 2: Core Logic Update** ⚙️
1. **Modify GeometryVertexCalculator** to read from store
2. **Update InputManager** to use store-driven anchors
3. **Test anchor logic** works with store integration

### **Phase 3: GeometryPanel UI** 🎨
1. **Add HTML elements** for anchor selection dropdowns
2. **Implement GeometryPanel.ts logic** for anchor controls
3. **Wire up to store actions** for setting defaults
4. **Test default anchor changes** affect new geometry creation

### **Phase 4: ObjectEditPanel UI** 🔧
1. **Add HTML elements** for per-object anchor editing
2. **Implement ObjectEditPanel.ts logic** for object anchor controls
3. **Wire up to store actions** for per-object overrides
4. **Test per-object anchor changes** affect existing geometry

### **Phase 5: Integration Testing** 🧪
1. **Test default anchors** work across all geometry types
2. **Test per-object anchors** override defaults correctly
3. **Test anchor changes** update geometry positioning
4. **Test UI responsiveness** and state synchronization

## 🎯 **KEY DESIGN DECISIONS**

### **1. Store Structure**
- **Global defaults** for new geometry creation
- **Per-object overrides** stored by objectId
- **Fallback hierarchy**: object override → global default → hardcoded fallback

### **2. UI Control Strategy**
- **GeometryPanel**: Sets defaults for future geometry
- **ObjectEditPanel**: Overrides anchoring for specific objects
- **Consistent dropdowns**: Same anchor options across both panels

### **3. Backward Compatibility**
- **Initialize store** with current hardcoded defaults
- **Graceful fallbacks** if store state missing
- **Existing geometry** maintains current positioning

**This plan provides a complete UI integration for configurable anchoring while maintaining system stability!**