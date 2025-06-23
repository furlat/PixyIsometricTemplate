# Layer Toggle & Filter Integration Study

## Current LayerToggleBar Analysis

### Existing Layer Structure (LayerToggleBar.ts)
```typescript
private layerStates = {
  background: true,  // Grid and background elements
  geometry: true,    // Geometric shapes and objects  ← NEEDS ENHANCEMENT
  selection: true,   // Selection highlights          ← POTENTIAL CONFLICT
  raycast: true,     // Raycast lines and debug visuals
  mask: false,       // Pixeloid mask layer
  bbox: false,       // Bounding box overlay  
  mouse: true        // Mouse visualization
}
```

### Store Integration
```typescript
// Line 131: Updates store on toggle
updateGameStore.setLayerVisibility(layerName, isVisible)

// Line 135: Dispatches custom events
const event = new CustomEvent('layerVisibilityChanged', {
  detail: { layerName, isVisible }
})
```

## New Filter Architecture Integration Challenges

### Challenge 1: Geometry Layer vs Filter Groups
**Current:** Single `geometry` toggle affects entire geometry layer
**New:** Geometry layer contains multiple filter groups:
- `normalFilterGroup`
- `selectedFilterGroup` 
- `pixelatedFilterGroup`
- `staticCachedGroup`

**Problem:** What should the `geometry` toggle do now?

### Challenge 2: Selection Layer vs Selected Filter Group
**Current:** `selection` toggle affects `selectionLayer` (separate layer)
**New:** Selection highlighting via `selectedFilterGroup` (within geometry layer)

**Conflict:** Two different selection visualization systems

### Challenge 3: Missing Filter Effect Toggles
**Current:** No toggles for filter effects (outline, pixelate, etc.)
**New:** Need UI controls for filter effects

## Proposed Enhanced Layer Architecture

### Option A: Hierarchical Layer Control
```typescript
private layerStates = {
  // Main layers (existing)
  background: true,
  geometry: true,      // Master toggle for all geometry
  selection: true,     // Keep for selection layer effects
  raycast: true,
  mask: false,
  bbox: false,
  mouse: true,
  
  // NEW: Filter effect toggles
  geometryFilters: {
    outline: true,       // Enable outline filter on selected objects
    pixelate: false,     // Enable pixelate filter
    staticCache: true    // Enable cache-as-texture for static objects
  }
}
```

### Option B: Flat Extended Structure
```typescript
private layerStates = {
  // Existing layers
  background: true,
  geometry: true,
  selection: true,
  raycast: true,
  mask: false,
  bbox: false,
  mouse: true,
  
  // NEW: Filter controls
  outline: true,        // Selection outline filter
  pixelate: false,      // Pixelate filter effect
  staticCache: true     // Static object caching
}
```

## Recommended Solution: Enhanced Integration

### Enhanced LayerToggleBar Structure
```typescript
export class LayerToggleBar {
  private layerStates = {
    // Main layer visibility
    background: true,
    geometry: true,
    selection: true,   // Keep for selection layer (non-filter effects)
    raycast: true,
    mask: false,
    bbox: false,
    mouse: true,
    
    // NEW: Filter effect states
    outline: true,       // Selection outline filter
    pixelate: false,     // Pixelate filter
    staticCache: true    // Cache static objects
  }
  
  // NEW: Filter-specific methods
  private toggleFilterEffect(effectName: 'outline' | 'pixelate' | 'staticCache'): void {
    this.layerStates[effectName] = !this.layerStates[effectName]
    this.updateButtonState(effectName)
    this.notifyFilterChange(effectName, this.layerStates[effectName])
  }
  
  private notifyFilterChange(effectName: string, isEnabled: boolean): void {
    // Update store with filter state
    updateGameStore.setFilterEffect(effectName, isEnabled)
    
    // Dispatch filter change event
    const event = new CustomEvent('filterEffectChanged', {
      detail: { effectName, isEnabled }
    })
    document.dispatchEvent(event)
  }
}
```

### Store Integration Enhancement
```typescript
// In gameStore.ts - ADD filter effect state
export const gameStore = proxy({
  // ... existing state ...
  
  geometry: {
    // ... existing geometry state ...
    
    // NEW: Filter effects state
    filterEffects: {
      outline: true,        // Selection outline enabled
      pixelate: false,      // Pixelate effect enabled
      staticCache: true     // Static caching enabled
    }
  }
})

// NEW: Store update methods
const updateGameStore = {
  // ... existing methods ...
  
  setFilterEffect: (effectName: 'outline' | 'pixelate' | 'staticCache', enabled: boolean) => {
    gameStore.geometry.filterEffects[effectName] = enabled
  }
}
```

### GeometryRenderer Reactive Integration
```typescript
export class GeometryRenderer {
  // ... existing code ...
  
  constructor() {
    // ... existing setup ...
    
    // Subscribe to filter effect changes
    this.subscribeToFilterEffectChanges()
  }
  
  private subscribeToFilterEffectChanges(): void {
    // React to outline filter toggle
    subscribe(gameStore.geometry.filterEffects, () => {
      this.updateFilterStates()
    })
  }
  
  private updateFilterStates(): void {
    const effects = gameStore.geometry.filterEffects
    
    // Apply/remove outline filter based on state
    if (effects.outline) {
      this.selectedFilterGroup.filters = [this.outlineFilter]
    } else {
      this.selectedFilterGroup.filters = null
    }
    
    // Apply/remove pixelate filter
    if (effects.pixelate) {
      this.pixelatedFilterGroup.filters = [this.pixelateFilter]
    } else {
      this.pixelatedFilterGroup.filters = null
    }
    
    // Enable/disable static caching
    if (effects.staticCache) {
      this.staticCachedGroup.cacheAsTexture()
    } else {
      this.staticCachedGroup.cacheAsTexture(false)
    }
  }
  
  private assignObjectToFilterGroup(objectId: string): void {
    const objectContainer = this.objectContainers.get(objectId)
    if (!objectContainer) return
    
    objectContainer.removeFromParent()
    
    const isSelected = gameStore.geometry.selection.selectedObjectId === objectId
    const effects = gameStore.geometry.filterEffects
    
    // Smart assignment based on both selection state AND filter effects
    if (isSelected && effects.outline) {
      this.selectedFilterGroup.addChild(objectContainer)
    } else if (effects.pixelate && this.shouldPixelateObject(objectId)) {
      this.pixelatedFilterGroup.addChild(objectContainer)
    } else if (effects.staticCache && this.isStaticObject(objectId)) {
      this.staticCachedGroup.addChild(objectContainer)
    } else {
      this.normalFilterGroup.addChild(objectContainer)
    }
  }
}
```

### LayeredInfiniteCanvas Integration
```typescript
export class LayeredInfiniteCanvas extends InfiniteCanvas {
  // ... existing code ...
  
  private subscribeToStoreChanges(): void {
    // ... existing subscriptions ...
    
    // NEW: Subscribe to filter effect changes
    subscribe(gameStore.geometry.filterEffects, () => {
      // Filter changes don't require full re-render, just filter reassignment
      // GeometryRenderer handles this internally
    })
    
    // Enhanced layer visibility subscription
    subscribe(gameStore.geometry.layerVisibility, () => {
      this.handleLayerVisibilityChange()
    })
  }
  
  private handleLayerVisibilityChange(): void {
    const visibility = gameStore.geometry.layerVisibility
    
    // Handle main layer visibility
    this.backgroundLayer.visible = visibility.background
    this.geometryLayer.visible = visibility.geometry
    this.selectionLayer.visible = visibility.selection
    this.raycastLayer.visible = visibility.raycast
    this.maskLayer.visible = visibility.mask
    this.bboxLayer.visible = visibility.bbox
    this.mouseLayer.visible = visibility.mouse
    
    // If geometry layer is hidden, all filter groups are hidden
    if (!visibility.geometry) {
      this.geometryRenderer.setAllFilterGroupsVisible(false)
    }
  }
}
```

## UI Enhancement for Filter Controls

### Enhanced HTML Structure
```html
<!-- Existing layer toggles -->
<div class="layer-toggles">
  <button id="toggle-layer-background">Grid</button>
  <button id="toggle-layer-geometry">Geometry</button>
  <button id="toggle-layer-selection">Selection</button>
  <!-- ... existing buttons ... -->
</div>

<!-- NEW: Filter effect toggles -->
<div class="filter-toggles">
  <button id="toggle-filter-outline">Outline</button>
  <button id="toggle-filter-pixelate">Pixelate</button>
  <button id="toggle-filter-cache">Cache</button>
</div>
```

### Enhanced Event Handlers
```typescript
private setupEventHandlers(): void {
  // ... existing layer handlers ...
  
  // NEW: Filter effect handlers
  const outlineToggle = document.getElementById('toggle-filter-outline')
  if (outlineToggle) {
    outlineToggle.addEventListener('click', () => {
      this.toggleFilterEffect('outline')
    })
  }
  
  const pixelateToggle = document.getElementById('toggle-filter-pixelate')
  if (pixelateToggle) {
    pixelateToggle.addEventListener('click', () => {
      this.toggleFilterEffect('pixelate')
    })
  }
  
  const cacheToggle = document.getElementById('toggle-filter-cache')
  if (cacheToggle) {
    cacheToggle.addEventListener('click', () => {
      this.toggleFilterEffect('staticCache')
    })
  }
}
```

## Reactive Flow Summary

### Layer Toggle Workflow
1. **User clicks layer toggle** → LayerToggleBar.toggleLayer()
2. **Store updated** → updateGameStore.setLayerVisibility()
3. **Subscription fires** → LayeredInfiniteCanvas.handleLayerVisibilityChange()
4. **Layer visibility changed** → layer.visible = newState

### Filter Effect Workflow
1. **User clicks filter toggle** → LayerToggleBar.toggleFilterEffect()
2. **Store updated** → updateGameStore.setFilterEffect()
3. **Subscription fires** → GeometryRenderer.updateFilterStates()
4. **Filters applied/removed** → filterGroup.filters = [filter] or null
5. **Objects reassigned** → assignObjectToFilterGroup()

### Selection Change Workflow
1. **Object selected** → updateGameStore.setSelectedObject()
2. **Selection subscription fires** → GeometryRenderer detects change
3. **Object moved to filter group** → assignObjectToFilterGroup()
4. **Filter applied** → selectedFilterGroup renders with outline

## Performance Considerations

### Efficient Filter Toggling
```typescript
// Avoid recreating filters - reuse instances
private static outlineFilter = new OutlineFilter({ thickness: 3, color: 0xff4444 })
private static pixelateFilter = new PixelateFilter({ size: { x: 8, y: 8 } })

// Apply/remove without recreation
this.selectedFilterGroup.filters = enabled ? [this.outlineFilter] : null
```

### Batched Filter Group Updates
```typescript
// Update multiple objects efficiently
private updateAllFilterAssignments(): void {
  // Batch remove all objects
  this.normalFilterGroup.removeChildren()
  this.selectedFilterGroup.removeChildren()
  this.pixelatedFilterGroup.removeChildren()
  this.staticCachedGroup.removeChildren()
  
  // Batch reassign based on current state
  for (const [objectId, container] of this.objectContainers) {
    this.assignObjectToFilterGroup(objectId)
  }
}
```

This architecture provides **seamless integration** between layer visibility controls and filter effects while maintaining **reactive rendering** and **optimal performance**.