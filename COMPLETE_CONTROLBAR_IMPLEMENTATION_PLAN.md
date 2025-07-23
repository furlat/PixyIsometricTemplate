# Complete Control Bar Implementation Plan

## Overview
Comprehensive plan to fix all UI components and integrate them with the new unified store at `/app/src/store/game-store.ts`.

## Current State Analysis

### ✅ What's Working
- **New Unified Store** (`/app/src/store/game-store.ts`) - Complete with all required methods
- **InputManager** - Already uses new store, handles WASD/Ctrl+C/V/Delete/Escape/E/Space
- **Game Architecture** - Clean Phase 3B foundation established

### ❌ What's Broken
- **UIControlBar_3b.ts** - Imports non-existent `gameStore_3b`, duplicate keyboard handling
- **LayerToggleBar_3b.ts** - Imports non-existent `gameStore_3b`
- **StorePanel_3b.ts** - Missing (only .old exists)
- **UIHandlers.ts** - Missing helper functions

## Implementation Strategy

### Phase 1: Input Centralization & Core UI Fix
**Goal:** Single input authority + working control bar

### Phase 2: Panel Components Creation  
**Goal:** All panels working with new store

### Phase 3: Integration & Testing
**Goal:** Complete system integration

---

## Phase 1: Input Centralization & Core UI Fix

### Step 1.1: Centralize Keyboard Input ⭐ **PRIORITY**

#### **File:** `app/src/game/InputManager.ts`
**Location:** Line 650-670 in `KeyboardHandler.handleKeyDown()`

**Add after existing action shortcuts:**
```typescript
// Panel shortcuts (moved from UIControlBar_3b)
if (!event.ctrlKey && !event.metaKey) {
  switch (key) {
    case 'f1':
      gameStore_methods.toggleStorePanel()
      event.preventDefault()
      break
    case 'f2':
      gameStore_methods.toggleLayerToggle()
      event.preventDefault()
      break
    case 'f3':
      gameStore_methods.toggleGeometryPanel()
      event.preventDefault()
      break
  }
}
```

### Step 1.2: Fix UIControlBar_3b Store Integration ⭐ **PRIORITY**

#### **File:** `app/src/ui/UIControlBar_3b.ts`

**1.2.1: Fix Import (Line 4)**
```typescript
// CHANGE:
import { gameStore_3b, gameStore_3b_methods } from '../store/gameStore_3b'

// TO:
import { gameStore, gameStore_methods } from '../store/game-store'
```

**1.2.2: Update All Store References**
| Find | Replace | Count |
|------|---------|-------|
| `gameStore_3b_methods.toggleStorePanel()` | `gameStore_methods.toggleStorePanel()` | 1 |
| `gameStore_3b_methods.toggleGeometryPanel()` | `gameStore_methods.toggleGeometryPanel()` | 1 |
| `gameStore_3b_methods.toggleLayerToggle()` | `gameStore_methods.toggleLayerToggle()` | 1 |
| `gameStore_3b.ui.showStorePanel` | `gameStore.ui.showStorePanel` | 2 |
| `gameStore_3b.ui.showGeometryPanel` | `gameStore.ui.showGeometryPanel` | 2 |
| `gameStore_3b.ui.showLayerToggle` | `gameStore.ui.showLayerToggle` | 2 |
| `gameStore_3b.selection` | `gameStore.selection` | 1 |
| `gameStore_3b.selection.selectedObjectId` | `gameStore.selection.selectedId` | 2 |

**1.2.3: Remove Duplicate Keyboard Handling**
```typescript
// DELETE entire method (lines 65-83):
private setupKeyboardShortcuts(): void {
  // ... DELETE ALL CONTENT
}

// REMOVE from constructor (line 25):
this.setupKeyboardShortcuts()  // ❌ DELETE this line
```

### Step 1.3: Fix LayerToggleBar_3b Store Integration

#### **File:** `app/src/ui/LayerToggleBar_3b.ts`

**1.3.1: Fix Import**
```typescript
// CHANGE:
import { gameStore_3b, gameStore_3b_methods } from '../store/gameStore_3b'

// TO:
import { gameStore, gameStore_methods } from '../store/game-store'
```

**1.3.2: Update All Store References**
| Find | Replace |
|------|---------|
| `gameStore_3b_methods.toggleMouse()` | `gameStore_methods.toggleMouse()` |
| `gameStore_3b_methods.toggleCheckboard()` | `gameStore_methods.toggleCheckboard()` |
| `gameStore_3b_methods.toggleGeometry()` | `gameStore_methods.toggleGeometry()` |
| `gameStore_3b.ui.showMouse` | `gameStore.ui.showMouse` |
| `gameStore_3b.ui.enableCheckboard` | `gameStore.ui.enableCheckboard` |
| `gameStore_3b.ui.showGeometry` | `gameStore.ui.showGeometry` |

---

## Phase 2: Panel Components Creation

### Step 2.1: Create UIHandlers Helper

#### **File:** `app/src/ui/helpers/UIHandlers.ts` (NEW FILE)

```typescript
/**
 * UI Helper Functions
 * Shared utilities for UI panel management
 */

export function updateElement(
  elements: Map<string, HTMLElement>, 
  id: string, 
  content: string, 
  className?: string
): void {
  const element = elements.get(id)
  if (element) {
    element.textContent = content
    if (className) {
      element.className = className
    }
  }
}

export function getBooleanStatusClass(value: boolean): string {
  return value ? 'status-active' : 'status-inactive'
}

export function getBooleanStatusText(value: boolean): string {
  return value ? 'ON' : 'OFF'
}

export const STATUS_COLORS = {
  active: '#4ade80',      // green-400
  inactive: '#6b7280',    // gray-500  
  error: '#ef4444',       // red-500
  warning: '#f59e0b'      // amber-500
}

export function createElementsMap(containerId: string): Map<string, HTMLElement> {
  const container = document.getElementById(containerId)
  const elements = new Map<string, HTMLElement>()
  
  if (container) {
    const elementsWithIds = container.querySelectorAll('[id]') as NodeListOf<HTMLElement>
    elementsWithIds.forEach(element => {
      elements.set(element.id, element)
    })
  }
  
  return elements
}

export function formatCoordinate(coord: { x: number, y: number }): string {
  return `(${coord.x.toFixed(1)}, ${coord.y.toFixed(1)})`
}

export function formatNumber(value: number, decimals: number = 1): string {
  return value.toFixed(decimals)
}
```

### Step 2.2: Create StorePanel_3b.ts

#### **File:** `app/src/ui/StorePanel_3b.ts` (NEW FILE)

**Based on StorePanel_3b.ts.old but with NEW store integration:**

```typescript
import { gameStore, gameStore_methods } from '../store/game-store'
import { subscribe } from 'valtio'
import { updateElement, getBooleanStatusClass, getBooleanStatusText, createElementsMap, formatCoordinate, formatNumber } from './helpers/UIHandlers'

export class StorePanel_3b {
  private elements: Map<string, HTMLElement>
  private updateInterval: number | null = null
  private unsubscribeCallbacks: Array<() => void> = []
  
  constructor() {
    this.elements = createElementsMap('store-panel')
    this.setupSubscriptions()
    this.setupEventHandlers()
    this.startPeriodicUpdates()
    console.log('StorePanel_3b: Initialized with new unified store')
  }
  
  private setupSubscriptions(): void {
    // Mouse tracking
    const unsubMouse = subscribe(gameStore.mouse, () => {
      this.updateMouseValues()
    })
    
    // Navigation tracking  
    const unsubNav = subscribe(gameStore.navigation, () => {
      this.updateNavigationValues()
    })
    
    // UI state tracking
    const unsubUI = subscribe(gameStore.ui, () => {
      this.updateUIValues()
    })
    
    // Mesh tracking
    const unsubMesh = subscribe(gameStore.mesh, () => {
      this.updateMeshValues()
    })
    
    // Selection tracking
    const unsubSelection = subscribe(gameStore.selection, () => {
      this.updateSelectionValues()
    })
    
    this.unsubscribeCallbacks.push(unsubMouse, unsubNav, unsubUI, unsubMesh, unsubSelection)
  }
  
  private updateMouseValues(): void {
    updateElement(this.elements, 'mouse-vertex', formatCoordinate(gameStore.mouse.vertex))
    updateElement(this.elements, 'mouse-world', formatCoordinate(gameStore.mouse.world))
    updateElement(this.elements, 'mouse-screen', formatCoordinate(gameStore.mouse.position))
  }
  
  private updateNavigationValues(): void {
    updateElement(this.elements, 'navigation-offset', formatCoordinate(gameStore.navigation.offset))
    updateElement(this.elements, 'navigation-dragging', getBooleanStatusText(gameStore.navigation.isDragging))
  }
  
  private updateUIValues(): void {
    updateElement(this.elements, 'ui-show-grid', getBooleanStatusText(gameStore.ui.showGrid))
    updateElement(this.elements, 'ui-show-mouse', getBooleanStatusText(gameStore.ui.showMouse))
    updateElement(this.elements, 'ui-show-geometry', getBooleanStatusText(gameStore.ui.showGeometry))
    updateElement(this.elements, 'ui-checkboard', getBooleanStatusText(gameStore.ui.enableCheckboard))
  }
  
  private updateMeshValues(): void {
    updateElement(this.elements, 'mesh-cell-size', formatNumber(gameStore.mesh.cellSize))
    updateElement(this.elements, 'mesh-dimensions', 
      gameStore.mesh.dimensions ? 
        `${gameStore.mesh.dimensions.width}x${gameStore.mesh.dimensions.height}` : 
        'Not set'
    )
  }
  
  private updateSelectionValues(): void {
    updateElement(this.elements, 'selection-id', gameStore.selection.selectedId || 'None')
  }
  
  private setupEventHandlers(): void {
    // Reset buttons
    const resetNavButton = this.elements.get('reset-navigation')
    if (resetNavButton) {
      resetNavButton.addEventListener('click', () => {
        gameStore_methods.resetNavigationOffset()
      })
    }
    
    // Toggle buttons
    const toggles = [
      { id: 'toggle-grid', method: 'toggleGrid' },
      { id: 'toggle-mouse', method: 'toggleMouse' },
      { id: 'toggle-geometry', method: 'toggleGeometry' },
      { id: 'toggle-checkboard', method: 'toggleCheckboard' }
    ]
    
    toggles.forEach(({ id, method }) => {
      const button = this.elements.get(id)
      if (button) {
        button.addEventListener('click', () => {
          (gameStore_methods as any)[method]()
        })
      }
    })
  }
  
  private startPeriodicUpdates(): void {
    // Update static values periodically
    this.updateInterval = window.setInterval(() => {
      this.updateObjectCount()
      this.updatePerformanceMetrics()
    }, 1000)
  }
  
  private updateObjectCount(): void {
    updateElement(this.elements, 'object-count', gameStore.objects.length.toString())
  }
  
  private updatePerformanceMetrics(): void {
    // Add performance metrics if needed
  }
  
  public destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
    
    this.unsubscribeCallbacks.forEach(unsubscribe => unsubscribe())
    this.unsubscribeCallbacks = []
    
    console.log('StorePanel_3b: Destroyed')
  }
}
```

---

## Phase 3: Integration & Testing

### Step 3.1: Update Index Exports

#### **File:** `app/src/ui/index.ts`

**Add missing exports:**
```typescript
export { UIControlBar_3b } from './UIControlBar_3b'
export { LayerToggleBar_3b } from './LayerToggleBar_3b'
export { StorePanel_3b } from './StorePanel_3b'  // ✅ NEW
export { GeometryPanel_3b } from './GeometryPanel_3b'
export { ObjectEditPanel_3b } from './ObjectEditPanel_3b'

// ✅ NEW: Export helpers
export * from './helpers/UIHandlers'  // ✅ NEW
```

### Step 3.2: Integration Testing

#### **Keyboard Shortcuts Test:**
```bash
F1 - Toggle Store Panel (now handled by InputManager)
F2 - Toggle Layer Controls (now handled by InputManager)  
F3 - Toggle Geometry Panel (now handled by InputManager)
WASD - Navigate (existing in InputManager)
Ctrl+C/V - Copy/Paste (existing in InputManager)
Delete - Delete object (existing in InputManager)
Escape - Cancel operations (existing in InputManager)
```

#### **UI Integration Test:**
```bash
✅ UIControlBar_3b - Store toggle buttons work
✅ LayerToggleBar_3b - Layer toggle buttons work  
✅ StorePanel_3b - Live data display works
✅ All panels use unified store
✅ No duplicate keyboard handling
```

---

## Architecture Achievement

### **Before (Broken):**
```
UIControlBar_3b ❌ → gameStore_3b (doesn't exist)
LayerToggleBar_3b ❌ → gameStore_3b (doesn't exist)
StorePanel_3b ❌ → Missing file
InputManager ✅ → New unified store
```

### **After (Fixed):**
```
InputManager ✅ → ALL keyboard input → New unified store
UIControlBar_3b ✅ → New unified store  
LayerToggleBar_3b ✅ → New unified store
StorePanel_3b ✅ → New unified store (created)
UIHandlers ✅ → Shared helper functions (created)
```

## Success Criteria

### ✅ **Phase 1 Complete When:**
- [ ] F1/F2/F3 handled by InputManager only
- [ ] UIControlBar_3b uses new store (no import errors)
- [ ] LayerToggleBar_3b uses new store (no import errors)
- [ ] All existing functionality preserved

### ✅ **Phase 2 Complete When:**
- [ ] StorePanel_3b.ts exists and works
- [ ] UIHandlers.ts provides shared utilities
- [ ] All panels display live data from new store

### ✅ **Phase 3 Complete When:**
- [ ] All exports work in index.ts
- [ ] All keyboard shortcuts work
- [ ] All UI panels work
- [ ] No console errors
- [ ] Build succeeds

## Implementation Order

1. **Step 1.1** - Add F1/F2/F3 to InputManager ⭐
2. **Step 1.2** - Fix UIControlBar_3b store import ⭐
3. **Step 1.3** - Fix LayerToggleBar_3b store import
4. **Step 2.1** - Create UIHandlers.ts helper
5. **Step 2.2** - Create StorePanel_3b.ts
6. **Step 3.1** - Update index.ts exports
7. **Step 3.2** - Integration testing

**Priority:** Steps 1.1 and 1.2 are critical - they fix the core control bar and centralize input handling according to Phase 3B architecture.