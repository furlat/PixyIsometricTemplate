# Vanilla TypeScript Integration Plan

## Phase 2A Reality: Replace React Hooks with Vanilla TypeScript Classes

### Current Problem:
- `useECSDataLayer.ts` - React hook (WRONG ARCHITECTURE)
- `useECSMirrorLayer.ts` - React hook (WRONG ARCHITECTURE)

### Correct Architecture:
This is a **vanilla TypeScript + PixiJS + Valtio** application that uses:
- `proxy()` from Valtio for reactive state
- `subscribe()` from Valtio for UI reactivity
- Direct DOM manipulation for UI updates
- No React components or hooks

---

## Replacement Plan

### 1. Replace useECSDataLayer.ts → ECSDataLayerPanel.ts

**Location**: `app/src/ui/ECSDataLayerPanel.ts`

**Pattern**: Follow existing UI panel pattern like `StorePanel.ts`

```typescript
// app/src/ui/ECSDataLayerPanel.ts
import { subscribe } from 'valtio'
import { ecsDataLayerIntegration } from '../store/ecs-data-layer-integration'

export class ECSDataLayerPanel {
  private integration = ecsDataLayerIntegration
  private dataLayerStore = this.integration.getDataLayerStore()
  private panelElement: HTMLElement | null = null
  private elements: { [key: string]: HTMLElement } = {}
  
  constructor() {
    this.createPanelElement()
    this.setupSubscriptions()
  }
  
  private createPanelElement() {
    this.panelElement = document.createElement('div')
    this.panelElement.className = 'ecs-data-layer-panel'
    this.panelElement.innerHTML = `
      <div class="card bg-base-200/30 shadow-sm mb-3">
        <div class="card-body p-3">
          <h3 class="card-title text-sm text-primary flex items-center gap-2">
            <span class="text-xs">▸</span>
            ECS Data Layer
          </h3>
          <div class="space-y-2">
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">Objects:</span>
              <span id="data-layer-objects" class="font-bold font-mono text-primary">0</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">Visible:</span>
              <span id="data-layer-visible" class="font-bold font-mono text-primary">0</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">Sampling Active:</span>
              <span id="data-layer-sampling" class="font-bold font-mono text-primary">No</span>
            </div>
          </div>
        </div>
      </div>
    `
    this.setupElements()
  }
  
  private setupElements() {
    this.elements.objects = document.getElementById('data-layer-objects')!
    this.elements.visible = document.getElementById('data-layer-visible')!
    this.elements.sampling = document.getElementById('data-layer-sampling')!
  }
  
  private setupSubscriptions() {
    // Subscribe to data layer store changes using Valtio
    subscribe(this.dataLayerStore, () => {
      this.updateValues()
    })
  }
  
  private updateValues() {
    const state = this.dataLayerStore.getState()
    const stats = this.integration.getStats()
    
    this.elements.objects.textContent = state.objects.length.toString()
    this.elements.visible.textContent = stats.visibleObjects.toString()
    this.elements.sampling.textContent = state.state.isActive ? 'Yes' : 'No'
  }
  
  // Public methods for UI interaction
  public addObject(object: any) {
    this.integration.addObject(object)
  }
  
  public removeObject(objectId: string) {
    this.integration.removeObject(objectId)
  }
  
  public updateSamplingWindow(position: { x: number, y: number }) {
    this.integration.updateSamplingWindow(position)
  }
  
  public getStats() {
    return this.integration.getStats()
  }
  
  public appendTo(parentElement: HTMLElement) {
    if (this.panelElement) {
      parentElement.appendChild(this.panelElement)
    }
  }
}
```

### 2. Replace useECSMirrorLayer.ts → ECSMirrorLayerPanel.ts

**Location**: `app/src/ui/ECSMirrorLayerPanel.ts`

**Pattern**: Same pattern as above but for mirror layer

```typescript
// app/src/ui/ECSMirrorLayerPanel.ts
import { subscribe } from 'valtio'
import { ecsMirrorLayerIntegration } from '../store/ecs-mirror-layer-integration'

export class ECSMirrorLayerPanel {
  private integration = ecsMirrorLayerIntegration
  private mirrorLayerStore = this.integration.getMirrorLayerStore()
  private panelElement: HTMLElement | null = null
  private elements: { [key: string]: HTMLElement } = {}
  
  constructor() {
    this.createPanelElement()
    this.setupSubscriptions()
  }
  
  private createPanelElement() {
    this.panelElement = document.createElement('div')
    this.panelElement.className = 'ecs-mirror-layer-panel'
    this.panelElement.innerHTML = `
      <div class="card bg-base-200/30 shadow-sm mb-3">
        <div class="card-body p-3">
          <h3 class="card-title text-sm text-warning flex items-center gap-2">
            <span class="text-xs">▸</span>
            ECS Mirror Layer
          </h3>
          <div class="space-y-2">
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">Zoom Level:</span>
              <span id="mirror-layer-zoom" class="font-bold font-mono text-warning">1</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">Cache Size:</span>
              <span id="mirror-layer-cache" class="font-bold font-mono text-warning">0</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">Visible:</span>
              <span id="mirror-layer-visible" class="font-bold font-mono text-warning">Yes</span>
            </div>
          </div>
        </div>
      </div>
    `
    this.setupElements()
  }
  
  private setupElements() {
    this.elements.zoom = document.getElementById('mirror-layer-zoom')!
    this.elements.cache = document.getElementById('mirror-layer-cache')!
    this.elements.visible = document.getElementById('mirror-layer-visible')!
  }
  
  private setupSubscriptions() {
    // Subscribe to mirror layer store changes using Valtio
    subscribe(this.mirrorLayerStore, () => {
      this.updateValues()
    })
  }
  
  private updateValues() {
    const state = this.mirrorLayerStore.getState()
    const stats = this.integration.getStats()
    
    this.elements.zoom.textContent = stats.zoomLevel.toString()
    this.elements.cache.textContent = Object.keys(state.textureCache).length.toString()
    this.elements.visible.textContent = state.layerState.isVisible ? 'Yes' : 'No'
  }
  
  // Public methods for UI interaction
  public setZoomLevel(level: number) {
    this.integration.setZoomLevel(level)
  }
  
  public updateCameraViewport(viewport: any) {
    this.integration.updateCameraViewport(viewport)
  }
  
  public evictTexture(objectId: string) {
    this.integration.evictTexture(objectId)
  }
  
  public getStats() {
    return this.integration.getStats()
  }
  
  public appendTo(parentElement: HTMLElement) {
    if (this.panelElement) {
      parentElement.appendChild(this.panelElement)
    }
  }
}
```

---

## Integration with Existing UI System

### Update UI Panel Registration

These panels should be integrated into the existing UI system following the pattern in `app/src/ui/index.ts`:

```typescript
// app/src/ui/index.ts
import { ECSDataLayerPanel } from './ECSDataLayerPanel'
import { ECSMirrorLayerPanel } from './ECSMirrorLayerPanel'

// Add to existing UI system
export const ecsDataLayerPanel = new ECSDataLayerPanel()
export const ecsMirrorLayerPanel = new ECSMirrorLayerPanel()

// Integrate with existing store panel
const storePanel = document.getElementById('store-panel')
if (storePanel) {
  ecsDataLayerPanel.appendTo(storePanel)
  ecsMirrorLayerPanel.appendTo(storePanel)
}
```

---

## Implementation Steps

1. **Delete React hooks** (requires code mode):
   - Remove `useECSDataLayer.ts`
   - Remove `useECSMirrorLayer.ts`

2. **Create vanilla TypeScript classes** (code mode):
   - Create `ECSDataLayerPanel.ts`
   - Create `ECSMirrorLayerPanel.ts`

3. **Update UI integration** (code mode):
   - Update `app/src/ui/index.ts`
   - Test integration with existing UI system

4. **Test Valtio subscriptions** (code mode):
   - Verify reactive updates work correctly
   - Test DOM manipulation updates
   - Ensure no memory leaks

---

## Success Criteria

✅ **No React dependencies**
✅ **Pure Valtio + DOM manipulation**
✅ **Follows existing UI panel pattern**
✅ **Proper subscription management**
✅ **Type-safe integration**
✅ **Memory leak prevention**

This completes the architectural mismatch fix and properly aligns with the vanilla TypeScript + Valtio architecture.