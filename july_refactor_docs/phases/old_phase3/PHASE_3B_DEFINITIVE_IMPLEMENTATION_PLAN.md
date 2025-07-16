# PHASE 3B DEFINITIVE IMPLEMENTATION PLAN

## 🎯 **EXECUTIVE SUMMARY**

This document consolidates all analysis and creates a definitive implementation plan for Phase 3B completion. Based on comprehensive analysis of backup files, current implementation, and style system requirements, this plan provides specific, actionable steps to fix all identified issues.

**KEY INSIGHT**: Since we're working at pixel scale 1 (single pixels), we don't need anchoring logic at all. Focus on core drawing functionality and style system only.

---

## 📊 **CRITICAL ISSUES SUMMARY**

### **Issue 1: Rectangle Drawing Logic - BROKEN**
- **Problem**: Simplified bounds calculation missing proper logic
- **Impact**: Rectangle drawing doesn't work correctly
- **Priority**: HIGH (blocks basic functionality)

### **Issue 2: Style System - 60% MISSING**
- **Problem**: Missing per-object style overrides and resolution logic
- **Impact**: ObjectEditPanel cannot function without this
- **Priority**: HIGH (blocks object editing)

### **Issue 3: Complete Geometry Panel UI - 70% MISSING**
- **Problem**: Missing drawing settings, basic controls, actions
- **Impact**: Basic UI doesn't match backup functionality
- **Priority**: MEDIUM (limits user experience)

### **Issue 4: ObjectEditPanel - 100% MISSING**
- **Problem**: Complete object editing functionality missing
- **Impact**: Cannot edit existing objects
- **Priority**: HIGH (core functionality)

---

## 🔧 **IMPLEMENTATION PLAN**

## **PHASE 0: ANCHOR CODE CLEANUP (CRITICAL - BLOCKING ISSUE)**

### **🚨 CORRECTED: Remove Legacy Multi-Zoom Anchor System**

**Context**: The anchor system was designed for the old multi-zoom level system where you could choose where to draw inside upscaled pixels. Since Phase 3B operates at pixel scale 1 (single pixels), this anchor system is no longer needed.

**Search Results**: Found anchor references in **3 current Phase 3B files** that need cleanup:

### **0.1 Remove Anchor Types**

**File**: `app/src/types/geometry-drawing.ts`

**Remove anchor-related types**:
```typescript
// ❌ REMOVE ANCHOR TYPES
export type AnchorType = 'corner' | 'midpoint' | 'center'
export interface AnchorPoint { ... }
export interface AnchorConfiguration { ... }

// ❌ REMOVE FROM DrawingSettings
export interface DrawingSettings {
  enableAnchors: boolean  // ← REMOVE THIS
}

// ❌ REMOVE FROM DrawingState
export interface DrawingState {
  anchors: AnchorConfiguration  // ← REMOVE THIS
}

// ❌ REMOVE ANCHOR FUNCTIONS
export const createDefaultAnchorConfiguration = (): AnchorConfiguration => { ... }
export const isAnchorPoint = (point: any): point is AnchorPoint => { ... }
```

### **0.2 Remove Anchor Imports from Store**

**File**: `app/src/store/gameStore_3b.ts`

**Remove anchor imports and usage**:
```typescript
// ❌ REMOVE ANCHOR IMPORTS
import {
  createDefaultAnchorConfiguration,  // ← REMOVE THIS
} from '../types/geometry-drawing'

// ❌ REMOVE FROM STORE
export const gameStore_3b = proxy<GameState3b>({
  drawing: {
    anchors: createDefaultAnchorConfiguration(),  // ← REMOVE THIS
  }
})
```

### **0.3 Remove Anchor Methods from Helper**

**File**: `app/src/game/GeometryHelper_3b.ts`

**Remove anchor methods but KEEP diamond properties**:
```typescript
// ❌ REMOVE ANCHOR METHODS
static snapToPixeloidAnchor() { ... }         // ← REMOVE THIS
static calculatePixeloidAnchorPoints() { ... } // ← REMOVE THIS
import type { AnchorPoint } from '../types/geometry-drawing'  // ← REMOVE THIS

// ✅ KEEP DIAMOND PROPERTIES (these are legitimate shape properties)
static calculateDiamondProperties(): { anchorX: number; anchorY: number; width: number; height: number }
static calculateDiamondVertices(diamond: { anchorX: number; anchorY: number; width: number; height: number })
static calculateDiamondMetadata(diamond: { anchorX: number; anchorY: number; width: number; height: number })
```

### **0.4 Priority Level: CRITICAL**

**This cleanup MUST be completed before any other implementation work** to avoid:
- Type conflicts during implementation
- Unused code causing confusion
- Anchor logic interfering with simplified approach
- Import errors and circular dependencies

**Note**: Diamond `anchorX` and `anchorY` properties are **legitimate shape positioning** and should be kept.

---

## **PHASE 1: CRITICAL DRAWING LOGIC FIXES**

### **1.1 Fix Rectangle Drawing Logic**

**File**: `app/src/game/GeometryHelper_3b.ts`

**Fix (Correct)**:
```typescript
// ✅ CORRECT - proper bounds calculation
static calculateRectanglePreview(
  startPoint: PixeloidCoordinate,
  currentPoint: PixeloidCoordinate
): PreviewObject {
  const minX = Math.min(startPoint.x, currentPoint.x)
  const maxX = Math.max(startPoint.x, currentPoint.x)
  const minY = Math.min(startPoint.y, currentPoint.y)
  const maxY = Math.max(startPoint.y, currentPoint.y)
  
  const vertices = [
    { x: minX, y: minY },     // top-left
    { x: maxX, y: minY },     // top-right
    { x: maxX, y: maxY },     // bottom-right
    { x: minX, y: maxY }      // bottom-left
  ]
  
  return {
    type: 'rectangle',
    vertices: vertices,
    style: gameStore_3b.style,
    isValid: (maxX - minX) > 0 && (maxY - minY) > 0,
    bounds: {
      minX: minX,
      minY: minY,
      maxX: maxX,
      maxY: maxY,
      width: maxX - minX,
      height: maxY - minY
    }
  }
}
```

### **1.2 Update Store Drawing Methods**

**File**: `app/src/store/gameStore_3b.ts`

**Fix finishDrawing() method**:
```typescript
// Update finishDrawing() to use correct metadata calculations
finishDrawing: () => {
  console.log('gameStore_3b: Finishing drawing')
  
  if (!gameStore_3b.drawing.isDrawing || !gameStore_3b.drawing.preview.object) {
    gameStore_3b_methods.cancelDrawing()
    return null
  }
  
  const previewObj = gameStore_3b.drawing.preview.object
  const startPoint = gameStore_3b.drawing.startPoint!
  const currentPoint = gameStore_3b.drawing.preview.currentPoint!
  
  // Use GeometryHelper_3b for correct metadata calculation
  let metadata: any = null
  const mode = gameStore_3b.drawing.mode
  
  switch (mode) {
    case 'circle':
      // ✅ CORRECT - use start→end point logic (like rectangle and diamond)
      const radius = Math.sqrt(
        Math.pow(currentPoint.x - startPoint.x, 2) +
        Math.pow(currentPoint.y - startPoint.y, 2)
      )
      metadata = GeometryHelper_3b.calculateCircleMetadata({
        centerX: startPoint.x,  // First click = start point
        centerY: startPoint.y,
        radius: radius
      })
      break
    case 'rectangle':
      // ✅ FIXED - use proper bounds
      const x = Math.min(startPoint.x, currentPoint.x)
      const y = Math.min(startPoint.y, currentPoint.y)
      const width = Math.abs(currentPoint.x - startPoint.x)
      const height = Math.abs(currentPoint.y - startPoint.y)
      metadata = GeometryHelper_3b.calculateRectangleMetadata({ x, y, width, height })
      break
    // ... other cases remain the same
  }
  
  // Rest of method remains the same
}
```

**Note**: Circle drawing logic is actually CORRECT as-is (start→end point logic, similar to rectangle and diamond). No changes needed to circle logic.

---

## **PHASE 2: STYLE SYSTEM COMPLETION**

### **2.1 Add Per-Object Style Overrides to Store**

**File**: `app/src/store/gameStore_3b.ts`

**Add to GameState3b interface**:
```typescript
export interface GameState3b {
  // ... existing fields
  
  // ✅ NEW: Per-object style overrides
  objectStyles: {
    [objectId: string]: {
      color?: number
      strokeWidth?: number
      strokeAlpha?: number
      fillColor?: number
      fillAlpha?: number
      texture?: string
      isVisible?: boolean
    }
  }
  
}
```

**Add to store proxy**:
```typescript
export const gameStore_3b = proxy<GameState3b>({
  // ... existing fields
  
  // ✅ NEW: Initialize empty style overrides
  objectStyles: {}
})
```

### **2.2 Add Style Resolution Methods**

**File**: `app/src/store/gameStore_3b.ts`

**Add to gameStore_3b_methods**:
```typescript
export const gameStore_3b_methods = {
  // ... existing methods
  
  // ✅ NEW: Style resolution
  getEffectiveStyle: (objectId: string, property: keyof StyleSettings) => {
    const objectOverride = gameStore_3b.objectStyles[objectId]?.[property]
    if (objectOverride !== undefined) return objectOverride
    
    const globalDefault = gameStore_3b.style[property]
    if (globalDefault !== undefined) return globalDefault
    
    // Hardcoded fallbacks
    const fallbacks = {
      color: 0x0066cc,
      strokeWidth: 2,
      strokeAlpha: 1.0,
      fillColor: 0x0066cc,
      fillAlpha: 0.3,
      defaultColor: 0x0066cc,
      defaultStrokeWidth: 2,
      defaultFillColor: 0x0066cc,
      fillEnabled: false,
      highlightColor: 0xff6600,
      selectionColor: 0xff0000
    }
    
    return fallbacks[property]
  },
  
  // ✅ NEW: Per-object style management
  setObjectStyle: (objectId: string, property: string, value: any) => {
    if (!gameStore_3b.objectStyles[objectId]) {
      gameStore_3b.objectStyles[objectId] = {}
    }
    gameStore_3b.objectStyles[objectId][property] = value
    console.log(`Set ${property} to ${value} for object ${objectId}`)
  },
  
  clearObjectStyle: (objectId: string, property: string) => {
    if (gameStore_3b.objectStyles[objectId]) {
      delete gameStore_3b.objectStyles[objectId][property]
      console.log(`Cleared ${property} for object ${objectId}`)
    }
  },
  
  getObjectStyle: (objectId: string, property: string) => {
    return gameStore_3b.objectStyles[objectId]?.[property]
  },
  
  resetObjectStyleToDefault: (objectId: string) => {
    delete gameStore_3b.objectStyles[objectId]
    console.log(`Reset style to default for object ${objectId}`)
  },
  
  // ✅ NEW: Fill system controls
  enableFillForObject: (objectId: string, color?: number, alpha?: number) => {
    const fillColor = color || gameStore_3b.style.defaultFillColor
    const fillAlpha = alpha || gameStore_3b.style.fillAlpha
    
    gameStore_3b_methods.setObjectStyle(objectId, 'fillColor', fillColor)
    gameStore_3b_methods.setObjectStyle(objectId, 'fillAlpha', fillAlpha)
    console.log(`Enabled fill for object ${objectId}`)
  },
  
  removeFillFromObject: (objectId: string) => {
    gameStore_3b_methods.clearObjectStyle(objectId, 'fillColor')
    gameStore_3b_methods.clearObjectStyle(objectId, 'fillAlpha')
    console.log(`Removed fill from object ${objectId}`)
  },
  
  hasObjectFill: (objectId: string): boolean => {
    return gameStore_3b_methods.getObjectStyle(objectId, 'fillColor') !== undefined
  },
  
  
  // ✅ NEW: Clear all objects
  clearAllObjects: () => {
    console.log('gameStore_3b: Clearing all objects')
    
    gameStore_3b.geometry.objects = []
    gameStore_3b.ecsDataLayer.allObjects = []
    gameStore_3b.ecsDataLayer.visibleObjects = []
    gameStore_3b.objectStyles = {}
    gameStore_3b_methods.clearSelectionEnhanced()
  }
}
```

---

## **PHASE 3: COMPLETE GEOMETRY PANEL UI**

### **3.1 Add Complete HTML Elements**

**File**: `app/index.html`

**Add missing sections to geometry panel**:
```html
<!-- Drawing Settings -->
<div class="card bg-base-200/30 shadow-sm mb-3">
  <div class="card-body p-3">
    <h3 class="card-title text-sm text-accent flex items-center gap-2">
      <span class="text-xs">▸</span>
      Drawing Settings
    </h3>
    <div class="space-y-2">
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/70">Stroke Color:</span>
        <input id="geometry-default-color" type="color" value="#0066cc" class="w-8 h-8 border border-base-300 rounded cursor-pointer" />
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/70">Stroke Width:</span>
        <input id="geometry-default-stroke-width" type="number" step="0.5" min="0.5" value="2" class="input input-bordered input-xs w-20 text-center font-mono" />
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/70">Fill Color:</span>
        <input id="geometry-default-fill-color" type="color" value="#99ccff" class="w-8 h-8 border border-base-300 rounded cursor-pointer" />
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/70">Fill Enabled:</span>
        <input id="geometry-fill-enabled" type="checkbox" class="toggle toggle-accent toggle-xs" />
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/70">Fill Alpha:</span>
        <input id="geometry-fill-alpha" type="range" min="0" max="1" step="0.1" value="0.5" class="range range-xs range-accent w-20" />
        <span id="geometry-fill-alpha-value" class="text-xs text-base-content/70">0.5</span>
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/70">Stroke Alpha:</span>
        <input id="geometry-stroke-alpha" type="range" min="0" max="1" step="0.1" value="1.0" class="range range-xs range-accent w-20" />
        <span id="geometry-stroke-alpha-value" class="text-xs text-base-content/70">1.0</span>
      </div>
    </div>
  </div>
</div>

<!-- Drawing Options -->
<div class="card bg-base-200/30 shadow-sm mb-3">
  <div class="card-body p-3">
    <h3 class="card-title text-sm text-warning flex items-center gap-2">
      <span class="text-xs">▸</span>
      Drawing Options
    </h3>
    <div class="space-y-2">
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/70">Snap to Grid:</span>
        <input id="drawing-snap-grid" type="checkbox" class="toggle toggle-warning toggle-xs" checked />
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/70">Show Preview:</span>
        <input id="drawing-show-preview" type="checkbox" class="toggle toggle-warning toggle-xs" checked />
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/70">Preview Opacity:</span>
        <input id="drawing-preview-opacity" type="range" min="0.1" max="1" step="0.1" value="0.7" class="range range-xs range-warning w-20" />
        <span id="drawing-preview-opacity-value" class="text-xs text-base-content/70">0.7</span>
      </div>
    </div>
  </div>
</div>

<!-- Actions -->
<div class="card bg-base-200/30 shadow-sm mb-3">
  <div class="card-body p-3">
    <h3 class="card-title text-sm text-error flex items-center gap-2">
      <span class="text-xs">▸</span>
      Actions
    </h3>
    <button id="geometry-clear-all" class="btn btn-sm btn-error w-full">
      Clear All Objects
    </button>
  </div>
</div>
```

### **3.2 Add Complete Event Handlers**

**File**: `app/src/ui/GeometryPanel_3b.ts`

**Add missing event handlers**:
```typescript
export class GeometryPanel_3b {
  // ... existing code
  
  private setupEventHandlers(): void {
    // ... existing handlers
    
    // ✅ NEW: Drawing settings handlers
    this.setupDrawingSettingsHandlers()
    
    // ✅ NEW: Drawing options handlers
    this.setupDrawingOptionsHandlers()
    
    // ✅ NEW: Actions handlers
    this.setupActionsHandlers()
  }
  
  private setupDrawingSettingsHandlers(): void {
    // Stroke color
    const strokeColorInput = document.getElementById('geometry-default-color') as HTMLInputElement
    if (strokeColorInput) {
      strokeColorInput.addEventListener('change', (e) => {
        const color = parseInt((e.target as HTMLInputElement).value.replace('#', ''), 16)
        gameStore_3b_methods.setStrokeColor(color)
      })
    }
    
    // Stroke width
    const strokeWidthInput = document.getElementById('geometry-default-stroke-width') as HTMLInputElement
    if (strokeWidthInput) {
      strokeWidthInput.addEventListener('input', (e) => {
        const width = parseFloat((e.target as HTMLInputElement).value)
        gameStore_3b_methods.setStrokeWidth(width)
      })
    }
    
    // Fill color
    const fillColorInput = document.getElementById('geometry-default-fill-color') as HTMLInputElement
    if (fillColorInput) {
      fillColorInput.addEventListener('change', (e) => {
        const color = parseInt((e.target as HTMLInputElement).value.replace('#', ''), 16)
        gameStore_3b_methods.setFillColor(color)
      })
    }
    
    // Fill enabled
    const fillEnabledInput = document.getElementById('geometry-fill-enabled') as HTMLInputElement
    if (fillEnabledInput) {
      fillEnabledInput.addEventListener('change', (e) => {
        const enabled = (e.target as HTMLInputElement).checked
        gameStore_3b_methods.setFillEnabled(enabled)
      })
    }
    
    // Fill alpha
    const fillAlphaInput = document.getElementById('geometry-fill-alpha') as HTMLInputElement
    const fillAlphaValue = document.getElementById('geometry-fill-alpha-value')
    if (fillAlphaInput && fillAlphaValue) {
      fillAlphaInput.addEventListener('input', (e) => {
        const alpha = parseFloat((e.target as HTMLInputElement).value)
        gameStore_3b_methods.setFillAlpha(alpha)
        fillAlphaValue.textContent = alpha.toFixed(1)
      })
    }
    
    // Stroke alpha
    const strokeAlphaInput = document.getElementById('geometry-stroke-alpha') as HTMLInputElement
    const strokeAlphaValue = document.getElementById('geometry-stroke-alpha-value')
    if (strokeAlphaInput && strokeAlphaValue) {
      strokeAlphaInput.addEventListener('input', (e) => {
        const alpha = parseFloat((e.target as HTMLInputElement).value)
        gameStore_3b_methods.setStrokeAlpha(alpha)
        strokeAlphaValue.textContent = alpha.toFixed(1)
      })
    }
  }
  
  private setupDrawingOptionsHandlers(): void {
    // Snap to grid
    const snapGridInput = document.getElementById('drawing-snap-grid') as HTMLInputElement
    if (snapGridInput) {
      snapGridInput.addEventListener('change', (e) => {
        const enabled = (e.target as HTMLInputElement).checked
        gameStore_3b.drawing.settings.snapToGrid = enabled
        console.log('Snap to grid:', enabled)
      })
    }
    
    // Show preview
    const showPreviewInput = document.getElementById('drawing-show-preview') as HTMLInputElement
    if (showPreviewInput) {
      showPreviewInput.addEventListener('change', (e) => {
        const enabled = (e.target as HTMLInputElement).checked
        gameStore_3b.drawing.settings.showPreview = enabled
        console.log('Show preview:', enabled)
      })
    }
    
    // Preview opacity
    const previewOpacityInput = document.getElementById('drawing-preview-opacity') as HTMLInputElement
    const previewOpacityValue = document.getElementById('drawing-preview-opacity-value')
    if (previewOpacityInput && previewOpacityValue) {
      previewOpacityInput.addEventListener('input', (e) => {
        const opacity = parseFloat((e.target as HTMLInputElement).value)
        gameStore_3b.drawing.settings.previewOpacity = opacity
        previewOpacityValue.textContent = opacity.toFixed(1)
        console.log('Preview opacity:', opacity)
      })
    }
  }
  
  private setupActionsHandlers(): void {
    // Clear all objects
    const clearAllBtn = document.getElementById('geometry-clear-all')
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all objects?')) {
          gameStore_3b_methods.clearAllObjects()
        }
      })
    }
  }
}
```

---

## **PHASE 4: OBJECTEDITPANEL IMPLEMENTATION**

### **4.1 Create ObjectEditPanel_3b.ts**

**File**: `app/src/ui/ObjectEditPanel_3b.ts`

**Create new file**:
```typescript
import { subscribe } from 'valtio'
import { gameStore_3b, gameStore_3b_methods } from '../store/gameStore_3b'

export class ObjectEditPanel_3b {
  private panel: HTMLElement | null = null
  private isVisible: boolean = false
  private originalObject: any = null
  private originalObjectStyles: any = null
  
  constructor() {
    this.panel = document.getElementById('object-edit-panel')
    this.setupReactivity()
    this.setupEventHandlers()
  }
  
  private setupReactivity(): void {
    // Listen for selection changes
    subscribe(gameStore_3b.selection, () => {
      this.updateVisibility()
    })
  }
  
  private updateVisibility(): void {
    const selectedObjectId = gameStore_3b.selection.selectedObjectId
    const shouldBeVisible = selectedObjectId !== null
    
    if (shouldBeVisible !== this.isVisible) {
      this.isVisible = shouldBeVisible
      if (this.panel) {
        this.panel.style.display = this.isVisible ? 'block' : 'none'
      }
      
      if (this.isVisible && selectedObjectId) {
        this.loadSelectedObject(selectedObjectId)
      }
    }
  }
  
  private loadSelectedObject(objectId: string): void {
    const selectedObject = gameStore_3b.geometry.objects.find(obj => obj.id === objectId)
    if (!selectedObject) return
    
    // Store original state for cancel functionality
    this.originalObject = { ...selectedObject }
    this.originalObjectStyles = { ...gameStore_3b.objectStyles[objectId] }
    
    // Generate form based on object type
    this.generateForm(selectedObject)
  }
  
  private generateForm(obj: any): void {
    if (!this.panel) return
    
    const objectType = this.getObjectType(obj)
    
    this.panel.innerHTML = `
      <!-- Header -->
      <div class="bg-base-200/50 border-b border-base-300 p-4 flex justify-between items-center">
        <h2 class="text-lg font-bold text-accent flex items-center gap-2">
          <span class="text-warning">✏️</span>
          Edit ${objectType}
        </h2>
        <button id="edit-panel-close" class="btn btn-sm btn-ghost btn-circle">
          <span class="text-lg">✕</span>
        </button>
      </div>
      
      <!-- Content -->
      <div class="max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar p-4 space-y-4">
        ${this.generateObjectProperties(obj)}
        
        <!-- Actions -->
        <div class="flex gap-2 pt-4">
          <button id="edit-panel-apply" class="btn btn-primary flex-1">Apply Changes</button>
          <button id="edit-panel-cancel" class="btn btn-outline flex-1">Cancel</button>
        </div>
      </div>
    `
    
    this.setupFormEventHandlers()
  }
  
  private getObjectType(obj: any): string {
    return obj.type.charAt(0).toUpperCase() + obj.type.slice(1)
  }
  
  private generateObjectProperties(obj: any): string {
    let html = ''
    
    // Object ID
    html += `
      <div class="alert alert-info bg-info/10 border-info/20">
        <div class="text-sm">
          <div class="font-bold mb-1">Object ID:</div>
          <div class="font-mono text-xs">${obj.id}</div>
        </div>
      </div>
    `
    
    // Common properties
    html += `
      <div class="card bg-base-200/30 shadow-sm">
        <div class="card-body p-3">
          <h3 class="card-title text-sm text-warning mb-2">Properties</h3>
          <div class="space-y-2">
            <div class="flex justify-between items-center text-xs">
              <span>Visible:</span>
              <input id="edit-visible" type="checkbox" class="toggle toggle-primary toggle-xs" ${obj.isVisible ? 'checked' : ''} />
            </div>
            <div class="flex justify-between items-center text-xs">
              <span>Color:</span>
              <input id="edit-color" type="color" value="${this.numberToHex(obj.color || 0x0066cc)}" class="w-8 h-8 border border-base-300 rounded cursor-pointer" />
            </div>
            <div class="flex justify-between items-center text-xs">
              <span>Stroke Width:</span>
              <input id="edit-stroke-width" type="number" step="0.5" min="0.5" value="${obj.strokeWidth || 2}" class="input input-bordered input-xs w-20 text-center font-mono" />
            </div>
            <div class="flex justify-between items-center text-xs">
              <span>Stroke Alpha:</span>
              <input id="edit-stroke-alpha" type="range" min="0" max="1" step="0.1" value="${obj.strokeAlpha || 1}" class="range range-xs range-primary w-20" />
              <span id="edit-stroke-alpha-value" class="text-xs text-base-content/70">${obj.strokeAlpha || 1}</span>
            </div>
          </div>
        </div>
      </div>
    `
    
    // Fill properties for supported objects
    if (this.objectSupportsFill(obj)) {
      const hasFill = gameStore_3b_methods.hasObjectFill(obj.id)
      if (hasFill) {
        const fillColor = gameStore_3b_methods.getObjectStyle(obj.id, 'fillColor') || 0x0066cc
        const fillAlpha = gameStore_3b_methods.getObjectStyle(obj.id, 'fillAlpha') || 0.5
        
        html += `
          <div class="card bg-base-200/30 shadow-sm">
            <div class="card-body p-3">
              <h3 class="card-title text-sm text-success mb-2">Fill</h3>
              <div class="space-y-2">
                <div class="flex justify-between items-center text-xs">
                  <span>Fill Color:</span>
                  <input id="edit-fill-color" type="color" value="${this.numberToHex(fillColor)}" class="w-8 h-8 border border-base-300 rounded cursor-pointer" />
                </div>
                <div class="flex justify-between items-center text-xs">
                  <span>Fill Alpha:</span>
                  <input id="edit-fill-alpha" type="range" min="0" max="1" step="0.1" value="${fillAlpha}" class="range range-xs range-success w-20" />
                  <span id="edit-fill-alpha-value" class="text-xs text-base-content/70">${fillAlpha}</span>
                </div>
                <button id="edit-remove-fill" class="btn btn-error btn-xs w-full">Remove Fill</button>
              </div>
            </div>
          </div>
        `
      } else {
        html += `
          <div class="card bg-base-200/30 shadow-sm">
            <div class="card-body p-3">
              <h3 class="card-title text-sm text-success mb-2">Fill</h3>
              <button id="edit-enable-fill" class="btn btn-success btn-xs w-full">Enable Fill</button>
            </div>
          </div>
        `
      }
    }
    
    // Type-specific properties
    html += this.generateTypeSpecificProperties(obj)
    
    return html
  }
  
  private generateTypeSpecificProperties(obj: any): string {
    let html = ''
    
    // Type-specific properties based on object type
    if (obj.type === 'point') {
      html += `
        <div class="card bg-base-200/30 shadow-sm">
          <div class="card-body p-3">
            <h3 class="card-title text-sm text-info mb-2">Position</h3>
            <div class="space-y-2">
              <div class="flex justify-between items-center text-xs">
                <span>X:</span>
                <input id="edit-x" type="number" step="0.5" value="${obj.x || 0}" class="input input-bordered input-xs w-20 text-center font-mono" />
              </div>
              <div class="flex justify-between items-center text-xs">
                <span>Y:</span>
                <input id="edit-y" type="number" step="0.5" value="${obj.y || 0}" class="input input-bordered input-xs w-20 text-center font-mono" />
              </div>
            </div>
          </div>
        </div>
      `
    } else if (obj.type === 'circle') {
      html += `
        <div class="card bg-base-200/30 shadow-sm">
          <div class="card-body p-3">
            <h3 class="card-title text-sm text-info mb-2">Circle Properties</h3>
            <div class="space-y-2">
              <div class="flex justify-between items-center text-xs">
                <span>Center X:</span>
                <input id="edit-center-x" type="number" step="0.5" value="${obj.centerX || 0}" class="input input-bordered input-xs w-20 text-center font-mono" />
              </div>
              <div class="flex justify-between items-center text-xs">
                <span>Center Y:</span>
                <input id="edit-center-y" type="number" step="0.5" value="${obj.centerY || 0}" class="input input-bordered input-xs w-20 text-center font-mono" />
              </div>
              <div class="flex justify-between items-center text-xs">
                <span>Radius:</span>
                <input id="edit-radius" type="number" step="1" min="1" value="${obj.radius || 10}" class="input input-bordered input-xs w-20 text-center font-mono" />
              </div>
            </div>
          </div>
        </div>
      `
    } else if (obj.type === 'rectangle') {
      html += `
        <div class="card bg-base-200/30 shadow-sm">
          <div class="card-body p-3">
            <h3 class="card-title text-sm text-info mb-2">Rectangle Properties</h3>
            <div class="space-y-2">
              <div class="flex justify-between items-center text-xs">
                <span>X:</span>
                <input id="edit-x" type="number" step="0.5" value="${obj.x || 0}" class="input input-bordered input-xs w-20 text-center font-mono" />
              </div>
              <div class="flex justify-between items-center text-xs">
                <span>Y:</span>
                <input id="edit-y" type="number" step="0.5" value="${obj.y || 0}" class="input input-bordered input-xs w-20 text-center font-mono" />
              </div>
              <div class="flex justify-between items-center text-xs">
                <span>Width:</span>
                <input id="edit-width" type="number" step="1" min="1" value="${obj.width || 10}" class="input input-bordered input-xs w-20 text-center font-mono" />
              </div>
              <div class="flex justify-between items-center text-xs">
                <span>Height:</span>
                <input id="edit-height" type="number" step="1" min="1" value="${obj.height || 10}" class="input input-bordered input-xs w-20 text-center font-mono" />
              </div>
            </div>
          </div>
        </div>
      `
    }
    
    return html
  }
  
  private setupFormEventHandlers(): void {
    // Close button
    const closeBtn = this.panel?.querySelector('#edit-panel-close')
    closeBtn?.addEventListener('click', () => this.closePanel())
    
    // Cancel button
    const cancelBtn = this.panel?.querySelector('#edit-panel-cancel')
    cancelBtn?.addEventListener('click', () => this.closePanel())
    
    // Apply button
    const applyBtn = this.panel?.querySelector('#edit-panel-apply')
    applyBtn?.addEventListener('click', () => this.applyChanges())
    
    // Live preview on input changes
    const inputs = this.panel?.querySelectorAll('input') || []
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        this.updateLivePreview()
      })
    })
    
    // Fill controls
    const enableFillBtn = this.panel?.querySelector('#edit-enable-fill')
    enableFillBtn?.addEventListener('click', () => this.enableFill())
    
    const removeFillBtn = this.panel?.querySelector('#edit-remove-fill')
    removeFillBtn?.addEventListener('click', () => this.removeFill())
  }
  
  private updateLivePreview(): void {
    const selectedObjectId = gameStore_3b.selection.selectedObjectId
    if (!selectedObjectId) return
    
    // Get current values from form
    const updates = this.buildUpdatedProperties()
    
    // Apply updates to object
    if (updates && Object.keys(updates).length > 0) {
      // Apply to store - this will trigger visual update
      Object.keys(updates).forEach(key => {
        gameStore_3b_methods.setObjectStyle(selectedObjectId, key, updates[key])
      })
    }
  }
  
  private buildUpdatedProperties(): any {
    const updates: any = {}
    
    // Common properties
    const visibleInput = this.panel?.querySelector('#edit-visible') as HTMLInputElement
    if (visibleInput) {
      updates.isVisible = visibleInput.checked
    }
    
    const colorInput = this.panel?.querySelector('#edit-color') as HTMLInputElement
    if (colorInput) {
      updates.color = parseInt(colorInput.value.replace('#', ''), 16)
    }
    
    const strokeWidthInput = this.panel?.querySelector('#edit-stroke-width') as HTMLInputElement
    if (strokeWidthInput) {
      updates.strokeWidth = parseFloat(strokeWidthInput.value)
    }
    
    const strokeAlphaInput = this.panel?.querySelector('#edit-stroke-alpha') as HTMLInputElement
    if (strokeAlphaInput) {
      updates.strokeAlpha = parseFloat(strokeAlphaInput.value)
    }
    
    // Fill properties
    const fillColorInput = this.panel?.querySelector('#edit-fill-color') as HTMLInputElement
    if (fillColorInput) {
      updates.fillColor = parseInt(fillColorInput.value.replace('#', ''), 16)
    }
    
    const fillAlphaInput = this.panel?.querySelector('#edit-fill-alpha') as HTMLInputElement
    if (fillAlphaInput) {
      updates.fillAlpha = parseFloat(fillAlphaInput.value)
    }
    
    // Type-specific properties
    const xInput = this.panel?.querySelector('#edit-x') as HTMLInputElement
    if (xInput) {
      updates.x = parseFloat(xInput.value)
    }
    
    const yInput = this.panel?.querySelector('#edit-y') as HTMLInputElement
    if (yInput) {
      updates.y = parseFloat(yInput.value)
    }
    
    const centerXInput = this.panel?.querySelector('#edit-center-x') as HTMLInputElement
    if (centerXInput) {
      updates.centerX = parseFloat(centerXInput.value)
    }
    
    const centerYInput = this.panel?.querySelector('#edit-center-y') as HTMLInputElement
    if (centerYInput) {
      updates.centerY = parseFloat(centerYInput.value)
    }
    
    const radiusInput = this.panel?.querySelector('#edit-radius') as HTMLInputElement
    if (radiusInput) {
      updates.radius = parseFloat(radiusInput.value)
    }
    
    const widthInput = this.panel?.querySelector('#edit-width') as HTMLInputElement
    if (widthInput) {
      updates.width = parseFloat(widthInput.value)
    }
    
    const heightInput = this.panel?.querySelector('#edit-height') as HTMLInputElement
    if (heightInput) {
      updates.height = parseFloat(heightInput.value)
    }
    
    return updates
  }
  
  private enableFill(): void {
    const selectedObjectId = gameStore_3b.selection.selectedObjectId
    if (selectedObjectId) {
      gameStore_3b_methods.enableFillForObject(selectedObjectId)
      this.loadSelectedObject(selectedObjectId) // Refresh form
    }
  }
  
  private removeFill(): void {
    const selectedObjectId = gameStore_3b.selection.selectedObjectId
    if (selectedObjectId) {
      gameStore_3b_methods.removeFillFromObject(selectedObjectId)
      this.loadSelectedObject(selectedObjectId) // Refresh form
    }
  }
  
  private applyChanges(): void {
    // Changes are already applied via live preview
    this.originalObject = null
    this.originalObjectStyles = null
    this.closePanel()
  }
  
  private closePanel(): void {
    // Restore original state if canceling
    if (this.originalObject) {
      const selectedObjectId = gameStore_3b.selection.selectedObjectId
      if (selectedObjectId) {
        // Restore original object properties
        const objectIndex = gameStore_3b.geometry.objects.findIndex(obj => obj.id === selectedObjectId)
        if (objectIndex !== -1) {
          gameStore_3b.geometry.objects[objectIndex] = this.originalObject
        }
        
        // Restore original style overrides
        if (this.originalObjectStyles) {
          gameStore_3b.objectStyles[selectedObjectId] = this.originalObjectStyles
        } else {
          delete gameStore_3b.objectStyles[selectedObjectId]
        }
      }
    }
    
    // Clear selection and close
    gameStore_3b_methods.clearSelectionEnhanced()
    this.isVisible = false
    if (this.panel) {
      this.panel.style.display = 'none'
    }
    
    // Clear original state
    this.originalObject = null
    this.originalObjectStyles = null
  }
  
  private objectSupportsFill(obj: any): boolean {
    return ['circle', 'rectangle', 'diamond'].includes(obj.type)
  }
  
  private numberToHex(num: number): string {
    return '#' + num.toString(16).padStart(6, '0')
  }
}
```

### **4.2 Add ObjectEditPanel HTML**

**File**: `app/index.html`

**Add object edit panel container**:
```html
<!-- Object Edit Panel -->
<div id="object-edit-panel" class="fixed top-0 right-0 w-80 h-full bg-base-100 border-l border-base-300 shadow-xl transform translate-x-full transition-transform duration-300 ease-in-out z-50" style="display: none;">
  <!-- Content will be dynamically generated -->
</div>
```

### **4.3 Initialize ObjectEditPanel**

**File**: `app/src/main.ts`

**Add initialization**:
```typescript
// Add to main.ts imports
import { ObjectEditPanel_3b } from './ui/ObjectEditPanel_3b'

// Add to initialization
const objectEditPanel = new ObjectEditPanel_3b()
```

---

## **PHASE 5: TESTING AND VALIDATION**

### **5.1 Test All Drawing Modes**

**Test checklist**:
- [ ] Point drawing works correctly
- [ ] Line drawing works correctly
- [ ] Circle drawing uses start→end point logic (like other shapes)
- [ ] Rectangle drawing uses proper bounds
- [ ] Diamond drawing works correctly
- [ ] Preview system shows correct shapes

### **5.2 Test Style System**

**Test checklist**:
- [ ] Global style defaults apply to new objects
- [ ] Per-object style overrides work
- [ ] Fill enable/disable works for supported objects
- [ ] Style resolution follows correct hierarchy
- [ ] Clear all objects clears styles

### **5.3 Test Object Editing**

**Test checklist**:
- [ ] ObjectEditPanel opens on object selection
- [ ] All object properties can be edited
- [ ] Live preview updates work
- [ ] Apply changes persists modifications
- [ ] Cancel restores original state

---

## 🎯 **IMPLEMENTATION PRIORITY ORDER**

### **Day 1: Critical Drawing Fixes**
1. Fix rectangle drawing logic (proper bounds)
2. Test all 6 drawing modes work (circle logic is already correct)

### **Day 2: Style System**
1. Add per-object style overrides to store
2. Add style resolution methods
3. Test style system works

### **Day 3: Complete UI**
1. Add complete geometry panel HTML
2. Add all missing event handlers
3. Test all UI controls work

### **Day 4: Object Editing**
1. Create ObjectEditPanel_3b.ts
2. Add object editing HTML
3. Test complete object editing workflow

---

## 🎉 **SUCCESS CRITERIA**

### **Phase 3B Complete When:**
- ✅ All 6 drawing modes work correctly (point, line, circle, rectangle, diamond)
- ✅ Circle drawing uses start→end point logic (like rectangle and diamond - already correct)
- ✅ Rectangle drawing uses proper bounds calculation
- ✅ Style system supports global defaults and per-object overrides
- ✅ Complete geometry panel UI with all controls
- ✅ ObjectEditPanel allows editing all object properties
- ✅ Fill system works for supported objects
- ✅ Clear all objects functionality works
- ✅ Live preview during object editing works
- ✅ Cancel/Apply functionality works correctly

### **Estimated Completion Time: 3-4 days**

This definitive plan focuses on the essential functionality needed to complete Phase 3B, removing complex anchoring logic since we're working at pixel scale 1. The implementation is straightforward and builds on the existing solid foundation.
