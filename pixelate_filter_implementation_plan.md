# Pixelate Filter Implementation Plan - Phase 2

## Goal
Add pixelate filter effect to geometric objects with UI controls and smart object assignment logic.

## Phase 2 Scope
- ✅ **Extend existing filter container architecture** 
- ✅ **Add PixelateFilter integration** for special effects
- ✅ **Enhance store integration** with pixelate state
- ✅ **Add UI controls** for pixelate toggle
- ✅ **Test filter combinations** (outline + pixelate)

## Implementation Steps

### Step 1: Add PixelateFilter to GeometryRenderer
**File:** `app/src/game/GeometryRenderer.ts`

**Changes:**
```typescript
import { OutlineFilter, PixelateFilter } from 'pixi-filters'

export class GeometryRenderer {
  // Add pixelated container
  private pixelatedContainer: Container = new Container({ isRenderGroup: true })
  
  // Add pixelate filter instance
  private pixelateFilter: PixelateFilter
  
  constructor() {
    // Add to container hierarchy
    this.mainContainer.addChild(this.normalContainer)
    this.mainContainer.addChild(this.selectedContainer)
    this.mainContainer.addChild(this.pixelatedContainer)  // NEW
    
    // Create pixelate filter
    this.pixelateFilter = new PixelateFilter({
      size: { x: 8, y: 8 }  // 8x8 pixel blocks for visible effect
    })
    this.pixelatedContainer.filters = [this.pixelateFilter]
  }
}
```

### Step 2: Enhance Object Assignment Logic
**File:** `app/src/game/GeometryRenderer.ts`

**Changes:**
```typescript
private assignObjectToFilterContainer(objectId: string, objectContainer: Container): void {
  const isSelected = gameStore.geometry.selection.selectedObjectId === objectId
  const needsPixelate = this.shouldPixelateObject(objectId)
  
  // Remove from current parent
  objectContainer.removeFromParent()
  
  // Priority: Selection > Pixelate > Normal
  if (isSelected) {
    this.selectedContainer.addChild(objectContainer)  // Gets outline filter
  } else if (needsPixelate) {
    this.pixelatedContainer.addChild(objectContainer) // Gets pixelate filter
  } else {
    this.normalContainer.addChild(objectContainer)    // No filter
  }
}

private shouldPixelateObject(objectId: string): boolean {
  // Check if pixelate filter is enabled globally AND object should be pixelated
  const pixelateEnabled = gameStore.geometry.filterEffects.pixelate
  
  // For now, pixelate all non-selected objects when pixelate filter is enabled
  // Later can be enhanced with per-object pixelate settings
  return pixelateEnabled && gameStore.geometry.selection.selectedObjectId !== objectId
}
```

### Step 3: Extend Store Integration
**File:** `app/src/store/gameStore.ts`

**Changes:**
```typescript
// In gameStore geometry section
filterEffects: {
  outline: true,   // Selection outline enabled by default
  pixelate: false  // Pixelate effect disabled by default
}

// In updateGameStore section
setPixelateFilterEnabled: (enabled: boolean) => {
  gameStore.geometry.filterEffects.pixelate = enabled
  console.log(`Store: Pixelate filter ${enabled ? 'enabled' : 'disabled'}`)
}
```

### Step 4: Update TypeScript Types
**File:** `app/src/types/index.ts`

**Changes:**
```typescript
// Filter effects state
filterEffects: {
  outline: boolean     // Selection outline filter enabled
  pixelate: boolean    // Pixelate filter enabled
}
```

### Step 5: Enhance GeometryRenderer Subscriptions
**File:** `app/src/game/GeometryRenderer.ts`

**Changes:**
```typescript
private subscribeToFilterChanges(): void {
  // React to filter effects changes
  subscribe(gameStore.geometry.filterEffects, () => {
    this.updateOutlineFilterState()
    this.updatePixelateFilterState()  // NEW
  })
  
  // React to selection changes (for object reassignment)
  subscribe(gameStore.geometry.selection, () => {
    this.updateSelectionFilterAssignment()
  })
}

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

### Step 6: Update LayerToggleBar
**File:** `app/src/ui/LayerToggleBar.ts`

**Changes:**
```typescript
private layerStates = {
  // ... existing states ...
  outline: true,     // Selection outline filter enabled
  pixelate: false    // Pixelate filter disabled by default
}

private setupEventHandlers(): void {
  // ... existing handlers ...
  
  // Pixelate filter toggle
  const pixelateToggle = document.getElementById('toggle-filter-pixelate')
  if (pixelateToggle) {
    pixelateToggle.addEventListener('click', () => {
      this.togglePixelateFilter()
    })
  }
}

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
    button.classList.add('btn-info')  // Blue/cyan for pixelate
  } else {
    button.classList.add('btn-outline')
  }
}

private notifyPixelateFilterChange(): void {
  // Update store with pixelate filter state
  updateGameStore.setPixelateFilterEnabled(this.layerStates.pixelate)
  
  // Dispatch custom event
  const event = new CustomEvent('pixelateFilterChanged', {
    detail: { enabled: this.layerStates.pixelate }
  })
  document.dispatchEvent(event)
}

private updateButtonStates(): void {
  // ... existing button updates ...
  this.updatePixelateButtonState()
}
```

### Step 7: Add Pixelate UI Button
**File:** `app/index.html`

**Add:**
```html
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