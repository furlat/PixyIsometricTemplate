# Outline Filter Implementation Plan - Phase 1

## Goal ✅ COMPLETED
Replace current graphics-based selection highlighting with OutlineFilter for better visibility and prepare foundation for future filter effects.

## Phase 1 Scope (Minimal Implementation) ✅ COMPLETED
- ✅ **Basic filter container structure** in GeometryRenderer ✅ DONE
- ✅ **OutlineFilter integration** for selection highlighting ✅ DONE
- ✅ **Store integration** for outline filter toggle ✅ DONE
- ✅ **Replace SelectionHighlightRenderer** with filter approach ✅ DONE
- ❌ **Skip pixelate, cache, complex UI** for now

## Implementation Steps ✅ ALL COMPLETED

### Step 1: Enhance GeometryRenderer with Basic Filter Structure ✅ COMPLETED
**File:** `app/src/game/GeometryRenderer.ts`

**Changes:**
```typescript
import { OutlineFilter } from 'pixi-filters'

export class GeometryRenderer {
  private mainContainer: Container = new Container()
  
  // Basic filter groups (start with just 2)
  private normalContainer: Container = new Container({ isRenderGroup: true })
  private selectedContainer: Container = new Container({ isRenderGroup: true })
  
  // Individual object containers (existing concept, enhance)
  private objectContainers: Map<string, Container> = new Map() // Changed from Graphics to Container
  private objectGraphics: Map<string, Graphics> = new Map()   // Separate graphics tracking
  
  // Filter instance (reuse for performance)
  private outlineFilter: OutlineFilter
  
  constructor() {
    // Setup container hierarchy
    this.mainContainer.addChild(this.normalContainer)
    this.mainContainer.addChild(this.selectedContainer)
    
    // Create and apply outline filter
    this.outlineFilter = new OutlineFilter({
      thickness: 3,
      color: 0xff4444,  // Bright red for visibility
      quality: 0.1      // Performance optimization
    })
    this.selectedContainer.filters = [this.outlineFilter]
    
    // Keep existing preview setup
    this.mainContainer.addChild(this.previewGraphics)
  }
}
```

**Status:** ✅ COMPLETED
- Added `normalContainer` and `selectedContainer` as render groups
- Imported and configured OutlineFilter with optimized settings
- Added individual object containers with Graphics separation
- Added filter subscription and assignment methods

### Step 2: Update Object Container Management ✅ COMPLETED
**File:** `app/src/game/GeometryRenderer.ts`

**Changes:**
```typescript
private updateGeometricObjectWithCoordinateConversion(obj: GeometricObject, pixeloidScale: number): void {
  let objectContainer = this.objectContainers.get(obj.id)
  let graphics = this.objectGraphics.get(obj.id)
  
  if (!objectContainer) {
    // Create new container + graphics for this object
    objectContainer = new Container()
    graphics = new Graphics()
    objectContainer.addChild(graphics)
    
    this.objectContainers.set(obj.id, objectContainer)
    this.objectGraphics.set(obj.id, graphics)
  }

  // Clear and re-render the graphics
  graphics!.clear()
  
  // Convert coordinates and render (existing logic)
  const convertedObject = this.convertObjectToVertexCoordinates(obj)
  this.renderGeometricObjectToGraphics(convertedObject, pixeloidScale, graphics!)
  
  // Assign to appropriate filter container based on selection
  this.assignObjectToFilterContainer(obj.id, objectContainer)
}

private assignObjectToFilterContainer(objectId: string, objectContainer: Container): void {
  const isSelected = gameStore.geometry.selection.selectedObjectId === objectId
  
  // Remove from current parent
  objectContainer.removeFromParent()
  
  // Assign to appropriate container
  if (isSelected) {
    this.selectedContainer.addChild(objectContainer)  // Gets outline filter
  } else {
    this.normalContainer.addChild(objectContainer)    // No filter
  }
}
```

**Status:** ✅ COMPLETED
- Enhanced `updateGeometricObjectWithCoordinateConversion()` to use container hierarchy
- Added `assignObjectToFilterContainer()` for dynamic object assignment
- Added reactive `updateSelectionFilterAssignment()` method

### Step 3: Add Store Integration for Outline Toggle ✅ COMPLETED
**File:** `app/src/store/gameStore.ts`

**Changes:**
```typescript
export const gameStore = proxy({
  // ... existing state ...
  
  geometry: {
    // ... existing geometry state ...
    
    // NEW: Filter effects state (start simple)
    filterEffects: {
      outline: true  // Selection outline enabled by default
    }
  }
})

// NEW: Store update method
const updateGameStore = {
  // ... existing methods ...
  
  setOutlineFilterEnabled: (enabled: boolean) => {
    gameStore.geometry.filterEffects.outline = enabled
  }
}
```

**Status:** ✅ COMPLETED
- Added `filterEffects.outline` to geometry state
- Added `setOutlineFilterEnabled()` store method
- Updated TypeScript types in `app/src/types/index.ts`

### Step 4: Add Reactive Filter State Management ✅ COMPLETED
**File:** `app/src/game/GeometryRenderer.ts`

**Changes:**
```typescript
constructor() {
  // ... existing setup ...
  
  // Subscribe to filter effect changes
  this.subscribeToFilterChanges()
}

private subscribeToFilterChanges(): void {
  // React to outline filter toggle
  subscribe(gameStore.geometry.filterEffects, () => {
    this.updateOutlineFilterState()
  })
  
  // React to selection changes (for object reassignment)
  subscribe(gameStore.geometry.selection, () => {
    this.updateSelectionFilterAssignment()
  })
}

private updateOutlineFilterState(): void {
  const outlineEnabled = gameStore.geometry.filterEffects.outline
  
  if (outlineEnabled) {
    this.selectedContainer.filters = [this.outlineFilter]
  } else {
    this.selectedContainer.filters = null  // Remove filter
  }
}

private updateSelectionFilterAssignment(): void {
  // Reassign all objects to correct containers when selection changes
  for (const [objectId, container] of this.objectContainers) {
    this.assignObjectToFilterContainer(objectId, container)
  }
}
```

**Status:** ✅ COMPLETED
- Added `subscribeToFilterChanges()` with reactive store subscriptions
- Added `updateOutlineFilterState()` for filter enable/disable
- Added `updateSelectionFilterAssignment()` for object reassignment

### Step 5: Update LayerToggleBar with Outline Toggle ✅ COMPLETED
**File:** `app/src/ui/LayerToggleBar.ts`

**Changes:**
```typescript
private layerStates = {
  // ... existing states ...
  
  // NEW: Add outline filter toggle
  outline: true  // Selection outline filter enabled
}

private setupEventHandlers(): void {
  // ... existing handlers ...
  
  // NEW: Outline filter toggle
  const outlineToggle = document.getElementById('toggle-filter-outline')
  if (outlineToggle) {
    outlineToggle.addEventListener('click', () => {
      this.toggleOutlineFilter()
    })
  }
}

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
  // Update store with outline filter state
  updateGameStore.setOutlineFilterEnabled(this.layerStates.outline)
  
  // Dispatch custom event
  const event = new CustomEvent('outlineFilterChanged', {
    detail: { enabled: this.layerStates.outline }
  })
  document.dispatchEvent(event)
}
```

### Step 6: Remove Current SelectionHighlightRenderer Usage
**File:** `app/src/game/LayeredInfiniteCanvas.ts`

**Changes:**
```typescript
// REMOVE or comment out selection highlight rendering
private renderSelectionLayer(corners: ViewportCorners, pixeloidScale: number): void {
  // DISABLE old graphics-based selection highlighting
  // if (gameStore.geometry.layerVisibility.selection) {
  //   this.selectionHighlightRenderer.render(corners, pixeloidScale)
  //   this.selectionLayer.visible = true
  // } else {
  //   this.selectionLayer.visible = false
  // }
  
  // NEW: Selection highlighting now handled by GeometryRenderer filters
  // Keep layer for future non-filter selection effects
  this.selectionLayer.visible = false
}
```

### Step 7: Add UI Button for Outline Toggle
**File:** `app/index.html` (or wherever layer toggle UI is defined)

**Add:**
```html
<!-- Add to existing layer toggle bar -->
<button id="toggle-filter-outline" class="btn btn-sm btn-warning rounded-full" title="Toggle Selection Outline">
  📝 Outline
</button>
```

## Testing Plan

### Visual Verification
1. **Select an object** → Should see bright red outline around it
2. **Toggle outline filter** → Outline should appear/disappear
3. **WASD movement** → Outline should move with object (coordinate conversion working)
4. **Select different object** → Outline should move to new object
5. **Background visibility** → Checkerboard should be unaffected by outline filter

### Performance Testing
1. **Multiple objects** → Only selected object gets outline
2. **Rapid selection changes** → Smooth filter reassignment
3. **Filter toggle** → No performance impact when disabled

## Expected Results

### Before Implementation
- Selection barely visible (thick stroke graphics)
- Selection doesn't move properly with WASD
- Graphics-based rendering overhead

### After Implementation  
- ✅ **Bright red outline** clearly visible around selected objects
- ✅ **Outline moves with WASD** (proper coordinate conversion)
- ✅ **Toggle control** to enable/disable outline effect
- ✅ **GPU-accelerated filtering** for better performance
- ✅ **Foundation ready** for future filter effects (pixelate, etc.)

## Future Extension Points

### Ready for Phase 2
- Add `pixelatedContainer` and PixelateFilter
- Add `staticCachedContainer` with cache-as-texture  
- Enhance LayerToggleBar with more filter controls
- Add filter combination support

### Architecture Benefits
- **Minimal change to existing geometry rendering**
- **Reuses existing coordinate conversion**
- **Leverages existing store reactivity**
- **Maintains background isolation**
- **Easy to extend with more filters**

This focused implementation provides immediate visual improvement while establishing the foundation for the complete filter architecture.