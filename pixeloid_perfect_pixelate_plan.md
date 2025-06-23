# PIXELOID-PERFECT PIXELATE FILTER IMPLEMENTATION PLAN

## 🎯 **FUNDAMENTAL REQUIREMENTS**

### **✅ PIXELOID-PERFECT ALIGNMENT:**
1. **🎯 All Geometry Pixelated** - Every geometric object gets pixelated when enabled
2. **🎯 Pixeloid Grid Alignment** - Pixelation blocks align exactly with pixeloid coordinate system
3. **🎯 Dynamic Scale Adjustment** - Pixelation size automatically matches current pixeloid scale
4. **🎯 Independent Filters** - Outline and pixelation work separately (can combine)
5. **🎯 Geometry Only** - Background/UI unaffected by pixelation
6. **🎯 SURFACE ALIGNMENT** - Container/texture positioning aligns with pixeloid boundaries

### **🚨 CRITICAL INSIGHTS:**
1. **Pixelation size must equal pixeloid scale** for correct block dimensions
2. **Surface positioning must align with pixeloid grid** for perfect sampling alignment

## 💡 **PIXELOID-PERFECT CALCULATION**

### **Dynamic Pixelation Formula:**
```typescript
// Perfect alignment: 1 pixelate block = 1 pixeloid unit
const pixeloidScale = gameStore.camera.pixeloid_scale
const pixelationSize = {
  x: pixeloidScale,  // At scale=10 → 10x10 pixel blocks
  y: pixeloidScale   // At scale=20 → 20x20 pixel blocks
}

this.pixelateFilter.size = pixelationSize
```

### **Why This Works:**
- ✅ **Scale = 10** → 10x10 pixel blocks = 1 pixeloid per block = Perfect alignment
- ✅ **Scale = 20** → 20x20 pixel blocks = 1 pixeloid per block = Perfect alignment
- ✅ **Zoom changes** → Pixelation automatically scales to maintain alignment
- ✅ **Vertex mesh** → Always aligns perfectly with pixelation boundaries

## 🎯 **CRITICAL: SURFACE ALIGNMENT REQUIREMENT**

### **🚨 CRITICAL: Surface Positioning + Bbox Inconsistency Fix**
The pixelation filter samples the rendered texture, so **container positioning** must align with pixeloid grid boundaries. **PLUS we must fix dangerous coordinate computation duplication.**

### **❌ DANGEROUS: Bbox/Geometry Inconsistency Found:**
```typescript
// BoundingBoxRenderer.calculateConvertedBounds() - WRONG diamond calculation
const halfWidth = diamond.width / 2
return {
  minX: diamond.anchorX - halfWidth,  // ❌ ASSUMES anchorX = centerX (WRONG!)
  maxX: diamond.anchorX + halfWidth   // ❌ Diamond bbox completely wrong
}

// GeometryHelper.calculateDiamondMetadata() - CORRECT calculation
const centerX = diamond.anchorX + diamond.width / 2  // ✅ anchorX = west vertex
return {
  bounds: {
    minX: diamond.anchorX,              // ✅ Correct bounds
    maxX: diamond.anchorX + diamond.width
  }
}
```

### **✅ SOLUTION: Centralized Bounds for Pixeloid-Perfect Alignment:**
```typescript
// Use metadata bounds as single source of truth for all positioning
private getObjectBoundsForPixelation(obj: GeometricObject): { x: number, y: number, width: number, height: number } {
  if (!obj.metadata) throw new Error('Object missing metadata for pixelation')
  
  // ALWAYS use metadata bounds (centralized, correct calculation)
  const bounds = obj.metadata.bounds
  
  return {
    x: bounds.minX,
    y: bounds.minY,
    width: bounds.maxX - bounds.minX,
    height: bounds.maxY - bounds.minY
  }
}

// Align each object container to pixeloid grid using CORRECT bounds
private alignObjectContainerToPixeloidGrid(objectId: string, container: Container): void {
  const obj = gameStore.geometry.objects.find(o => o.id === objectId)
  if (!obj || !obj.metadata) return
  
  const bounds = this.getObjectBoundsForPixelation(obj)
  const pixeloidScale = gameStore.camera.pixeloid_scale
  
  // Align container position to pixeloid grid boundaries
  const alignedX = Math.round(bounds.x / pixeloidScale) * pixeloidScale
  const alignedY = Math.round(bounds.y / pixeloidScale) * pixeloidScale
  
  container.x = alignedX
  container.y = alignedY
  
  console.log(`PixelateFilter: Aligned object ${objectId} container to (${alignedX}, ${alignedY})`)
}

// Apply alignment when pixelation is enabled
private updatePixelateFilterState(): void {
  const pixelateEnabled = gameStore.geometry.filterEffects.pixelate
  
  if (pixelateEnabled) {
    // 1. Set correct filter size
    this.updatePixelateFilterScale()
    
    // 2. CRITICAL: Align each object container to pixeloid grid
    for (const [objectId, container] of this.objectContainers) {
      this.alignObjectContainerToPixeloidGrid(objectId, container)
    }
    
    // 3. Apply filters
    this.normalContainer.filters = [this.pixelateFilter]
    this.selectedContainer.filters = [this.outlineFilter, this.pixelateFilter]
  }
}
```

### **Centralized Bounds Strategy:**
```typescript
// ELIMINATE dangerous computation duplication
// ALL positioning decisions use obj.metadata.bounds
// NO more recalculating bounds in different places
// SINGLE source of truth for all geometry bounds
```

## 🔧 **IMPLEMENTATION APPROACH**

### **❌ WRONG: 3-Container Selective Approach**
```typescript
// This breaks pixeloid-perfect requirement
if (isSelected) {
  this.selectedContainer.addChild(objectContainer)  // No pixelation
} else if (needsPixelate) {
  this.pixelatedContainer.addChild(objectContainer) // Only some objects pixelated
}
```

### **✅ CORRECT: Filter All Geometry Approach**
```typescript
// Apply pixelation to ALL geometry containers when enabled
private updatePixelateFilterState(): void {
  const pixelateEnabled = gameStore.geometry.filterEffects.pixelate
  const pixeloidScale = gameStore.camera.pixeloid_scale
  
  if (pixelateEnabled) {
    // Update pixelation size for perfect alignment
    this.pixelateFilter.size = { x: pixeloidScale, y: pixeloidScale }
    
    // Apply to ALL geometry containers
    this.normalContainer.filters = [this.pixelateFilter]
    this.selectedContainer.filters = [this.outlineFilter, this.pixelateFilter] // Combine filters
  } else {
    // Remove pixelation, keep outline if enabled
    this.normalContainer.filters = null
    this.selectedContainer.filters = gameStore.geometry.filterEffects.outline ? [this.outlineFilter] : null
  }
}
```

## 🔧 **STEP 1: Add Pixelate Filter to GeometryRenderer**
**File:** `app/src/game/GeometryRenderer.ts`

### **Import PixelateFilter:**
```typescript
// ADD: Import PixelateFilter alongside OutlineFilter (line 2)
import { OutlineFilter, PixelateFilter } from 'pixi-filters'
```

### **Add Filter Instance:**
```typescript
// ADD: Pixelate filter instance (line 34)
private pixelateFilter: PixelateFilter

constructor() {
  // ... existing setup ...
  
  // ADD: Create pixelate filter with initial scale (line 48)
  this.pixelateFilter = new PixelateFilter({
    size: { x: gameStore.camera.pixeloid_scale, y: gameStore.camera.pixeloid_scale }
  })
  
  // Note: Don't apply filters in constructor - handled by update methods
}
```

## 🔧 **STEP 2: Modify Filter Update System**
**File:** `app/src/game/GeometryRenderer.ts`

### **Extend subscribeToFilterChanges:**
```typescript
// MODIFY: subscribeToFilterChanges method (line 149)
private subscribeToFilterChanges(): void {
  // React to filter effects changes
  subscribe(gameStore.geometry.filterEffects, () => {
    this.updateOutlineFilterState()
    this.updatePixelateFilterState()  // NEW
  })
  
  // NEW: React to pixeloid scale changes for perfect alignment
  subscribe(gameStore.camera, () => {
    this.updatePixelateFilterScale()  // NEW
  })
  
  // React to selection changes
  subscribe(gameStore.geometry.selection, () => {
    this.updateSelectionFilterAssignment()
  })
}
```

### **Add Pixelate Filter State Management:**
```typescript
// ADD: Pixelate filter state management
private updatePixelateFilterState(): void {
  const pixelateEnabled = gameStore.geometry.filterEffects.pixelate
  const outlineEnabled = gameStore.geometry.filterEffects.outline
  
  if (pixelateEnabled) {
    // 1. Set perfect pixeloid-aligned filter size
    this.updatePixelateFilterScale()
    
    // 2. CRITICAL: Ensure surface alignment with pixeloid grid
    this.ensureContainerPixeloidAlignment()
    
    // 3. Apply pixelation to ALL geometry
    this.normalContainer.filters = [this.pixelateFilter]
    
    // Combine with outline on selected container if both enabled
    if (outlineEnabled) {
      this.selectedContainer.filters = [this.outlineFilter, this.pixelateFilter]
    } else {
      this.selectedContainer.filters = [this.pixelateFilter]
    }
  } else {
    // Remove pixelation, keep outline if enabled
    this.normalContainer.filters = null
    this.selectedContainer.filters = outlineEnabled ? [this.outlineFilter] : null
  }
}

// ADD: Dynamic scale adjustment for perfect alignment
private updatePixelateFilterScale(): void {
  const pixeloidScale = gameStore.camera.pixeloid_scale
  this.pixelateFilter.size = { x: pixeloidScale, y: pixeloidScale }
// ADD: CRITICAL - Ensure container surfaces align with pixeloid grid
private ensureContainerPixeloidAlignment(): void {
  const pixeloidScale = gameStore.camera.pixeloid_scale
  
  // Align normal container to pixeloid grid boundaries
  this.normalContainer.x = Math.round(this.normalContainer.x / pixeloidScale) * pixeloidScale
  this.normalContainer.y = Math.round(this.normalContainer.y / pixeloidScale) * pixeloidScale
  
  // Align selected container to pixeloid grid boundaries
  this.selectedContainer.x = Math.round(this.selectedContainer.x / pixeloidScale) * pixeloidScale
  this.selectedContainer.y = Math.round(this.selectedContainer.y / pixeloidScale) * pixeloidScale
  
  console.log(`PixelateFilter: Aligned container surfaces to pixeloid grid (scale=${pixeloidScale})`)
}
  console.log(`PixelateFilter: Updated size to ${pixeloidScale}x${pixeloidScale} for perfect pixeloid alignment`)
}
```

### **Update Outline Filter State (Modified):**
```typescript
// MODIFY: updateOutlineFilterState to work with pixelation (line 164)
private updateOutlineFilterState(): void {
  const outlineEnabled = gameStore.geometry.filterEffects.outline
  const pixelateEnabled = gameStore.geometry.filterEffects.pixelate
  
  if (outlineEnabled) {
    // Combine with pixelation if both enabled
    if (pixelateEnabled) {
      this.selectedContainer.filters = [this.outlineFilter, this.pixelateFilter]
    } else {
      this.selectedContainer.filters = [this.outlineFilter]
    }
  } else {
    // Remove outline, keep pixelation if enabled
    if (pixelateEnabled) {
      this.selectedContainer.filters = [this.pixelateFilter]
    } else {
      this.selectedContainer.filters = null
    }
  }
}
```

## 🔧 **STEP 3: Store Integration (Copy Outline Pattern)**
**File:** `app/src/store/gameStore.ts`

### **Extend filterEffects:**
```typescript
// MODIFY: filterEffects (line 137)
filterEffects: {
  outline: true,   // Selection outline enabled by default
  pixelate: false  // NEW - Pixeloid-perfect pixelation disabled by default
}
```

### **Add Store Method:**
```typescript
// ADD: Copy setOutlineFilterEnabled pattern exactly
setPixelateFilterEnabled: (enabled: boolean) => {
  gameStore.geometry.filterEffects.pixelate = enabled
  console.log(`Store: Pixeloid-perfect pixelate filter ${enabled ? 'enabled' : 'disabled'}`)
}
```

## 🔧 **STEP 4: UI Integration (Copy Outline Pattern)**
**File:** `app/src/ui/LayerToggleBar.ts`

### **Extend layerStates:**
```typescript
// MODIFY: layerStates (line 6)
private layerStates = {
  background: true,
  geometry: true,
  selection: true,
  raycast: true,
  mask: false,
  bbox: false,
  mouse: true,
  outline: true,      // Selection outline filter enabled
  pixelate: false     // NEW - Pixeloid-perfect pixelation disabled by default
}
```

### **Add Event Handler:**
```typescript
// ADD: Pixelate filter toggle (copy outline pattern)
const pixelateToggle = document.getElementById('toggle-filter-pixelate')
if (pixelateToggle) {
  pixelateToggle.addEventListener('click', () => {
    this.togglePixelateFilter()
  })
}
```

### **Add Toggle Methods:**
```typescript
// ADD: Copy all three outline methods exactly
private togglePixelateFilter(): void {
  this.layerStates.pixelate = !this.layerStates.pixelate
  this.updatePixelateButtonState()
  this.notifyPixelateFilterChange()
}

private updatePixelateButtonState(): void {
  const button = document.getElementById('toggle-filter-pixelate')
  if (!button) return
  
  const isActive = this.layerStates.pixelate
  const baseClasses = ['btn', 'btn-sm', 'rounded-full']
  
  button.className = baseClasses.join(' ')
  
  if (isActive) {
    button.classList.add('btn-info')  // Cyan for pixelate
  } else {
    button.classList.add('btn-outline')
  }
}

private notifyPixelateFilterChange(): void {
  updateGameStore.setPixelateFilterEnabled(this.layerStates.pixelate)
  
  const event = new CustomEvent('pixelateFilterChanged', {
    detail: { enabled: this.layerStates.pixelate }
  })
  document.dispatchEvent(event)
}
```

### **Update updateButtonStates:**
```typescript
// MODIFY: updateButtonStates (line 132)
private updateButtonStates(): void {
  this.updateButtonState('background')
  this.updateButtonState('geometry')
  this.updateButtonState('selection')
  this.updateButtonState('raycast')
  this.updateButtonState('mask')
  this.updateButtonState('bbox')
  this.updateButtonState('mouse')
  this.updateOutlineButtonState()
  this.updatePixelateButtonState()  // NEW
}
```

## 🔧 **STEP 5: Add UI Button**
**File:** `app/index.html`

### **Add Pixelate Button:**
```html
<!-- ADD: After outline button -->
<button id="toggle-filter-pixelate" class="btn btn-sm btn-info rounded-full" title="Toggle Pixeloid-Perfect Pixelation">
  <span class="button-text">🎮 Pixelate</span>
</button>
```

## 🧪 **TESTING PLAN**

### **Pixeloid-Perfect Verification:**
1. **Enable pixelate at scale=10** → All geometry shows 10x10 pixel blocks
2. **Zoom to scale=20** → Pixelation automatically becomes 20x20 blocks
3. **Draw geometry** → New objects immediately get correct pixelation
4. **Toggle outline + pixelate** → Both effects combine on all objects

### **Filter Independence:**
- **Outline Only:** Red outline on selected objects only
- **Pixelate Only:** Pixeloid-perfect pixelation on ALL geometry
- **Both Enabled:** Red outline + pixelation on ALL geometry
- **Both Disabled:** Normal rendering

## 🎯 **EXPECTED RESULTS**

### **Visual Effects:**
- ✅ **Perfect Alignment** - Pixelation blocks align exactly with pixeloid grid
- ✅ **Dynamic Scaling** - Pixelation size matches current zoom level
- ✅ **All Geometry** - Every object gets pixelated when enabled
- ✅ **Filter Combination** - Outline + pixelation work together

### **Architecture:**
- ✅ **2-Container System** - Maintains existing proven pattern
- ✅ **Filter Arrays** - Multiple filters can be applied to same container
- ✅ **Reactive Updates** - Automatic scale adjustment on zoom
- ✅ **Independent Toggle** - Each filter works separately

**This achieves pixeloid-perfect pixelation that aligns exactly with the coordinate system mesh!**