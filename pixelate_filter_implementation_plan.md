# RECALIBRATED Pixelate Filter Implementation Plan

## 🎯 Goal
Add pixelate filter effect to geometric objects by **exactly imitating the outline filter pattern**.

## 📖 **Current Outline Filter Pattern (Study)**

### **GeometryRenderer.ts Pattern:**
```typescript
// Two containers: normal + selected
private normalContainer: Container = new Container({ isRenderGroup: true })
private selectedContainer: Container = new Container({ isRenderGroup: true })

// Filter instance
private outlineFilter: OutlineFilter

// Constructor setup
this.outlineFilter = new OutlineFilter({ thickness: 3, color: 0xff4444, quality: 0.1 })
this.selectedContainer.filters = [this.outlineFilter]

// Assignment logic (selected vs normal)
private assignObjectToFilterContainer(objectId: string, objectContainer: Container): void {
  const isSelected = gameStore.geometry.selection.selectedObjectId === objectId
  objectContainer.removeFromParent()
  
  if (isSelected) {
    this.selectedContainer.addChild(objectContainer)  // Gets outline filter
  } else {
    this.normalContainer.addChild(objectContainer)    // No filter
  }
}

// Reactive updates
private subscribeToFilterChanges(): void {
  subscribe(gameStore.geometry.filterEffects, () => {
    this.updateOutlineFilterState()
  })
}

private updateOutlineFilterState(): void {
  const outlineEnabled = gameStore.geometry.filterEffects.outline
  
  if (outlineEnabled) {
    this.selectedContainer.filters = [this.outlineFilter]
  } else {
    this.selectedContainer.filters = null
  }
}
```

## 🔧 **Step 1: Add Pixelated Container to GeometryRenderer**
**File:** `app/src/game/GeometryRenderer.ts`

**Follow exact outline pattern:**
```typescript
// ADD: Import PixelateFilter alongside OutlineFilter
import { OutlineFilter, PixelateFilter } from 'pixi-filters'

export class GeometryRenderer {
  // ADD: Third container for pixelated objects (line 26)
  private pixelatedContainer: Container = new Container({ isRenderGroup: true })
  
  // ADD: Pixelate filter instance (line 34)
  private pixelateFilter: PixelateFilter
  
  constructor() {
    // ADD: Container to hierarchy (line 38)
    this.mainContainer.addChild(this.normalContainer)
    this.mainContainer.addChild(this.selectedContainer)
    this.mainContainer.addChild(this.pixelatedContainer)  // NEW
    
    // ADD: Create pixelate filter (line 48)
    this.pixelateFilter = new PixelateFilter({
      size: { x: 8, y: 8 }  // 8x8 pixel blocks for visible effect
    })
    this.pixelatedContainer.filters = [this.pixelateFilter]
  }
}
```

## 🔧 **Step 2: Extend Object Assignment Logic (3-Way Logic)**
**File:** `app/src/game/GeometryRenderer.ts`

**Modify existing `assignObjectToFilterContainer` method:**
```typescript
// MODIFY: Extend to handle 3 containers instead of 2 (line 132)
private assignObjectToFilterContainer(objectId: string, objectContainer: Container): void {
  const isSelected = gameStore.geometry.selection.selectedObjectId === objectId
  const needsPixelate = this.shouldPixelateObject(objectId)  // NEW
  
  // Remove from current parent
  objectContainer.removeFromParent()
  
  // EXTEND: Priority: Selection > Pixelate > Normal
  if (isSelected) {
    this.selectedContainer.addChild(objectContainer)  // Gets outline filter
  } else if (needsPixelate) {  // NEW
    this.pixelatedContainer.addChild(objectContainer) // Gets pixelate filter
  } else {
    this.normalContainer.addChild(objectContainer)    // No filter
  }
}

// ADD: New method to check if object should be pixelated
private shouldPixelateObject(objectId: string): boolean {
  const pixelateEnabled = gameStore.geometry.filterEffects.pixelate
  
  // Pixelate all non-selected objects when pixelate filter is enabled
  return pixelateEnabled && gameStore.geometry.selection.selectedObjectId !== objectId
}
```

## 🔧 **Step 3: Add Pixelate Filter State Management**
**File:** `app/src/game/GeometryRenderer.ts`

**Follow exact outline filter pattern:**
```typescript
// MODIFY: subscribeToFilterChanges method (line 151)
private subscribeToFilterChanges(): void {
  subscribe(gameStore.geometry.filterEffects, () => {
    this.updateOutlineFilterState()
    this.updatePixelateFilterState()  // NEW - copy outline pattern
  })
  
  subscribe(gameStore.geometry.selection, () => {
    this.updateSelectionFilterAssignment()
  })
}

// ADD: Copy updateOutlineFilterState pattern exactly
private updatePixelateFilterState(): void {
  const pixelateEnabled = gameStore.geometry.filterEffects.pixelate
  
  if (pixelateEnabled) {
    this.pixelatedContainer.filters = [this.pixelateFilter]
  } else {
    this.pixelatedContainer.filters = null  // Remove filter
  }
  
  // Reassign all objects when pixelate state changes
  this.updateSelectionFilterAssignment()
}
```

## 🔧 **Step 4: Add Store Integration (Follow Outline Pattern)**
**File:** `app/src/store/gameStore.ts`

**Current outline filter in store (line 137):**
```typescript
filterEffects: {
  outline: true  // Selection outline enabled by default
}
```

**EXTEND: Add pixelate alongside outline:**
```typescript
// MODIFY: filterEffects in gameStore (line 137)
filterEffects: {
  outline: true,   // Selection outline enabled by default
  pixelate: false  // NEW - Pixelate effect disabled by default
}
```

**Current outline method in updateGameStore (line 822):**
```typescript
setOutlineFilterEnabled: (enabled: boolean) => {
  gameStore.geometry.filterEffects.outline = enabled
  console.log(`Store: Outline filter ${enabled ? 'enabled' : 'disabled'}`)
}
```

**ADD: Copy exact pattern for pixelate:**
```typescript
// ADD: Copy setOutlineFilterEnabled pattern exactly
setPixelateFilterEnabled: (enabled: boolean) => {
  gameStore.geometry.filterEffects.pixelate = enabled
  console.log(`Store: Pixelate filter ${enabled ? 'enabled' : 'disabled'}`)
}
```

## 🔧 **Step 5: Add LayerToggleBar Integration (Follow Outline Pattern)**
**File:** `app/src/ui/LayerToggleBar.ts`

**Current outline in layerStates (line 14):**
```typescript
private layerStates = {
  // ... existing states ...
  outline: true      // Selection outline filter enabled
}
```

**EXTEND: Add pixelate alongside outline:**
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
  outline: true,     // Selection outline filter enabled
  pixelate: false    // NEW - Pixelate filter disabled by default
}
```

**Current outline event handler (line 88):**
```typescript
// Outline filter toggle
const outlineToggle = document.getElementById('toggle-filter-outline')
if (outlineToggle) {
  outlineToggle.addEventListener('click', () => {
    this.toggleOutlineFilter()
  })
}
```

**ADD: Copy exact pattern for pixelate:**
```typescript
// ADD: Pixelate filter toggle (copy outline pattern)
const pixelateToggle = document.getElementById('toggle-filter-pixelate')
if (pixelateToggle) {
  pixelateToggle.addEventListener('click', () => {
    this.togglePixelateFilter()
  })
}
```

**Current outline methods (lines 102-169):**
```typescript
private toggleOutlineFilter(): void {
  this.layerStates.outline = !this.layerStates.outline
  this.updateOutlineButtonState()
  this.notifyOutlineFilterChange()
}

private updateOutlineButtonState(): void {
  const button = document.getElementById('toggle-filter-outline')
  if (!button) return
  
  const isActive = this.layerStates.outline
  const baseClasses = ['btn', 'btn-sm', 'rounded-full']
  
  button.className = baseClasses.join(' ')
  
  if (isActive) {
    button.classList.add('btn-warning')  // Orange for outline
  } else {
    button.classList.add('btn-outline')
  }
}

private notifyOutlineFilterChange(): void {
  updateGameStore.setOutlineFilterEnabled(this.layerStates.outline)
  
  const event = new CustomEvent('outlineFilterChanged', {
    detail: { enabled: this.layerStates.outline }
  })
  document.dispatchEvent(event)
}
```

**ADD: Copy exact pattern for pixelate:**
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
    button.classList.add('btn-info')  // Cyan for pixelate (different from outline)
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

**Current outline in updateButtonStates (line 140):**
```typescript
private updateButtonStates(): void {
  // ... existing updates ...
  this.updateOutlineButtonState()
}
```

**EXTEND: Add pixelate update:**
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

## 🔧 **Step 6: Add UI Button (Follow Outline Pattern)**
**File:** `app/index.html`

**Current outline button (line 573):**
```html
<button id="toggle-filter-outline" class="btn btn-sm btn-warning rounded-full" title="Toggle Selection Outline">
  <span class="button-text">📝 Outline</span>
</button>
```

**ADD: Copy exact pattern for pixelate:**
```html
<!-- ADD: After outline button -->
<button id="toggle-filter-pixelate" class="btn btn-sm btn-info rounded-full" title="Toggle Pixelate Effect">
  <span class="button-text">🎮 Pixelate</span>
</button>
```

## Advanced Features (Optional)

### Per-Object Pixelate Control
**Enhancement:** Allow individual objects to be marked for pixelation

```typescript
// Add to object metadata or separate state
interface GeometricObjectPixelateState {
  objectId: string
  shouldPixelate: boolean
  pixelateSize?: { x: number, y: number }
}

// Enhanced assignment logic
private shouldPixelateObject(objectId: string): boolean {
  const globalPixelateEnabled = gameStore.geometry.filterEffects.pixelate
  const objectPixelateState = this.getObjectPixelateState(objectId)
  
  return globalPixelateEnabled && objectPixelateState.shouldPixelate
}
```

### Configurable Pixelate Size
**Enhancement:** Allow users to adjust pixelate block size

```typescript
// Add to store
filterEffects: {
  outline: boolean
  pixelate: boolean
  pixelateSize: { x: number, y: number }  // Configurable pixel block size
}

// Update filter when size changes
private updatePixelateFilterState(): void {
  const effects = gameStore.geometry.filterEffects
  
  if (effects.pixelate) {
    this.pixelateFilter.size = effects.pixelateSize
    this.pixelatedContainer.filters = [this.pixelateFilter]
  } else {
    this.pixelatedContainer.filters = null
  }
}
```

## Testing Plan

### Visual Verification
1. **Enable pixelate filter** → All non-selected objects should become pixelated
2. **Select object while pixelate enabled** → Selected object gets outline, others stay pixelated
3. **Disable pixelate filter** → All objects return to normal rendering
4. **Toggle both filters** → Test outline + pixelate combinations
5. **WASD movement** → Pixelated objects should move smoothly

### Performance Testing
1. **Multiple pixelated objects** → Check GPU performance impact
2. **Filter switching** → Rapid enable/disable should be smooth
3. **Large objects** → Ensure pixelation doesn't cause frame drops

### Filter Combination Testing
1. **Outline only** → Only selected object has outline
2. **Pixelate only** → All non-selected objects pixelated
3. **Both enabled** → Selected has outline, others pixelated
4. **Both disabled** → Normal rendering for all objects

## Expected Results

### Visual Effects
- ✅ **Clear pixelation** effect on designated objects
- ✅ **Smooth filter transitions** when toggling
- ✅ **Proper filter priorities** (selection > pixelate > normal)
- ✅ **Background isolation** maintained (no pixelation of checkerboard)

### Performance
- ✅ **GPU-accelerated** pixelation via PixiJS filters
- ✅ **Efficient object reassignment** between containers
- ✅ **No performance degradation** with filter combinations

### Architecture Benefits
- ✅ **Scalable filter system** ready for more effects
- ✅ **Clean separation** between filter types
- ✅ **Reusable container logic** for future filters
- ✅ **Maintains existing coordinate** conversion and reactivity

## Next Phase Preparation

### Phase 3: Cache-as-Texture System
**Ready to implement:**
- Static object detection and caching
- Cache invalidation logic
- Performance optimization for navigation

### Phase 4: Advanced Filter UI
**Future enhancements:**
- Filter configuration panels
- Per-object filter settings
- Filter effect intensity controls
- Filter animation/transitions

This implementation provides a robust pixelate filter system while maintaining the clean architecture established in Phase 1.
## ✅ **RECALIBRATED IMPLEMENTATION SUMMARY**

### **Key Changes Made:**

1. **Follow Exact Outline Pattern** - No reinventing the wheel
2. **3-Container System** - Normal, Selected, Pixelated (extends existing 2-container)
3. **Copy All Methods** - Exact duplication of proven outline filter methods
4. **Consistent Naming** - `pixelate` follows `outline` conventions
5. **Same Event Pattern** - CustomEvent dispatch matching outline
6. **Same Button Pattern** - UI button exactly like outline button

### **Implementation Benefits:**

- ✅ **Proven Architecture** - Uses existing working outline filter pattern
- ✅ **Low Risk** - No new patterns, just extending proven ones  
- ✅ **Easy Maintenance** - Same patterns as outline filter
- ✅ **Filter Priority Logic** - Selection > Pixelate > Normal
- ✅ **Reactive Updates** - Automatic object reassignment on filter changes

## 🧪 **Testing Plan (Simplified)**

### **Visual Verification:**
1. **Toggle pixelate button** → All non-selected objects become pixelated
2. **Select object** → Selected gets outline, others stay pixelated
3. **Toggle outline button** → Only selected objects get outline
4. **Both disabled** → All objects render normally

### **Filter Combinations:**
- **Outline Only:** Normal ✅ + Selected with outline ✅
- **Pixelate Only:** Pixelated ✅ + Selected normal ✅  
- **Both Enabled:** Pixelated ✅ + Selected with outline ✅
- **Both Disabled:** All normal ✅

## 🎯 **Expected Results**

### **Visual Effects:**
- ✅ **8x8 pixel blocks** on non-selected objects when pixelate enabled
- ✅ **Red outline** on selected objects when outline enabled
- ✅ **Proper priorities** - selection always takes precedence over pixelation
- ✅ **Smooth toggling** - immediate filter application/removal

### **Architecture:**
- ✅ **Same pattern as outline** - consistent codebase
- ✅ **Scalable for more filters** - proven container system
- ✅ **GPU-accelerated** - PixiJS filter efficiency
- ✅ **Coordinate system intact** - no interference with existing systems

**This recalibrated plan exactly imitates the working outline filter pattern, ensuring reliable implementation with minimal risk!**

---