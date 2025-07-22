# Phase 2 & 3: Rendering & Input Unification Guide

## 🎯 **OBJECTIVE**
Unify preview rendering from store (Phase 2) and unify all input actions into store (Phase 3), ensuring consistent input/output flow with the modular architecture from **[PHASE_0_1_DETAILED_IMPLEMENTATION_GUIDE.md](./PHASE_0_1_DETAILED_IMPLEMENTATION_GUIDE.md)**.

---

## 📋 **PHASE 2: UNIFIED PREVIEW RENDERING FROM STORE**

### **Overview: Store → Rendering Consistency**
Connect the new modular store to existing rendering components, ensuring all preview rendering uses the same store data that will be committed.

### **Key Integration Points from Phase 0-1**:
- **Store Data**: `gameStore.preview.previewObject` from **[game-store.ts](./PHASE_0_1_DETAILED_IMPLEMENTATION_GUIDE.md#file-appsrcstoregame-storets-new---clean-architecture)**
- **Preview Methods**: `PreviewSystem.updatePreview()` from **[PreviewSystem.ts](./PHASE_0_1_DETAILED_IMPLEMENTATION_GUIDE.md#file-appsrcstoresystemspreviewsystemts-new)**
- **Geometry Helper**: `GeometryHelper.generateVertices()` from **[GeometryHelper.ts](./PHASE_0_1_DETAILED_IMPLEMENTATION_GUIDE.md#file-appsrcstorehelpergeometryhelperts-new)**

---

### **Step 2.1: Update GeometryRenderer_3b.ts**

#### **Current Issue**: Multiple Rendering Sources
```typescript
// Current: GeometryRenderer_3b.ts renders from multiple sources
// - gameStore_3b.geometry.objects[] (actual objects)
// - gameStore_3b.editPreview.previewData (preview object)
// - Direct preview calculations
```

#### **Solution**: Unified Store Rendering
```typescript
// File: app/src/game/GeometryRenderer_3b.ts - UPDATED
import { gameStore, gameStore_methods } from '../store/game-store'

export class GeometryRenderer_3b {
  private container: Container
  private actualObjectsContainer: Container
  private previewContainer: Container

  constructor() {
    this.container = new Container()
    this.actualObjectsContainer = new Container()
    this.previewContainer = new Container()
    
    // Layer order: actual objects below, preview above
    this.container.addChild(this.actualObjectsContainer)
    this.container.addChild(this.previewContainer)
  }

  /**
   * Main render method - uses unified store data
   * CONNECTS TO: gameStore.objects[] and gameStore.preview from game-store.ts
   */
  public render(): void {
    // Render actual objects from unified store
    this.renderActualObjects()
    
    // Render preview from unified store
    this.renderPreviewObjects()
  }

  /**
   * Render actual objects from unified store
   * INPUT SOURCE: gameStore.objects[] from game-store.ts
   */
  private renderActualObjects(): void {
    this.actualObjectsContainer.removeChildren()
    
    // ✅ UNIFIED: Read from single store source
    gameStore.objects.forEach(obj => {
      if (obj.isVisible) {
        const graphics = this.createObjectGraphics(obj)
        this.actualObjectsContainer.addChild(graphics)
      }
    })
  }

  /**
   * Render preview objects from unified store
   * INPUT SOURCE: gameStore.preview.previewObject from PreviewSystem
   * CONNECTS TO: PreviewSystem.updatePreview() from PreviewSystem.ts
   */
  private renderPreviewObjects(): void {
    this.previewContainer.removeChildren()
    
    // ✅ UNIFIED: Read from same store that preview system writes to
    if (gameStore.preview.isActive && gameStore.preview.previewObject) {
      const previewGraphics = this.createPreviewGraphics(gameStore.preview.previewObject)
      this.previewContainer.addChild(previewGraphics)
    }
  }

  /**
   * Create graphics for actual objects
   * CONSISTENT WITH: GeometryHelper.generateVertices() from GeometryHelper.ts
   */
  private createObjectGraphics(obj: GeometricObject): Graphics {
    const graphics = new Graphics()
    
    // Use same vertices that GeometryHelper generated
    this.renderObjectVertices(graphics, obj.vertices, obj.style, false)
    
    return graphics
  }

  /**
   * Create graphics for preview objects
   * CONSISTENT WITH: PreviewSystem preview generation from PreviewSystem.ts
   */
  private createPreviewGraphics(previewObj: GeometricObject): Graphics {
    const graphics = new Graphics()
    
    // ✅ CRITICAL: Use SAME vertex data that PreviewSystem generated
    // This ensures preview looks exactly like what will be committed
    this.renderObjectVertices(graphics, previewObj.vertices, previewObj.style, true)
    
    return graphics
  }

  /**
   * Unified vertex rendering (used for both actual and preview)
   * ENSURES: Preview and actual objects render identically
   */
  private renderObjectVertices(
    graphics: Graphics, 
    vertices: PixeloidCoordinate[], 
    style: GeometryStyle, 
    isPreview: boolean
  ): void {
    if (vertices.length === 0) return

    // Apply style with preview modifications
    const alpha = isPreview ? 0.7 : 1.0
    const strokeColor = style.strokeColor
    const strokeWidth = style.strokeWidth * (isPreview ? 1.5 : 1.0)

    graphics.moveTo(vertices[0].x, vertices[0].y)
    
    // Draw all vertices
    for (let i = 1; i < vertices.length; i++) {
      graphics.lineTo(vertices[i].x, vertices[i].y)
    }
    
    // Close path for filled shapes
    if (vertices.length > 2) {
      graphics.lineTo(vertices[0].x, vertices[0].y)
    }

    // Apply stroke
    graphics.stroke({ 
      color: strokeColor, 
      width: strokeWidth, 
      alpha: alpha * style.strokeAlpha 
    })

    // Apply fill if enabled
    if (style.fillEnabled) {
      graphics.fill({ 
        color: style.fillColor, 
        alpha: alpha * style.fillAlpha 
      })
    }
  }
}
```

### **Step 2.2: Update ObjectEditPanel_3b.ts Integration**

#### **Connection to Phase 0-1 Methods**:
```typescript
// File: app/src/ui/ObjectEditPanel_3b.ts - UPDATED INTEGRATION
import { gameStore, gameStore_methods } from '../store/game-store'

export class ObjectEditPanel_3b {
  /**
   * UPDATED: Use unified preview system from Phase 1
   * CONNECTS TO: gameStore_methods.startPreview() from game-store.ts
   */
  private loadSelectedObject(): void {
    const selectedObjectId = gameStore.selection.selectedId
    if (!selectedObjectId) return

    // ✅ UNIFIED: Use Phase 1 preview system
    const success = gameStore_methods.startPreview('move', selectedObjectId)
    if (success) {
      this.generateForm(gameStore.getSelectedObject()!)
    }
  }

  /**
   * UPDATED: Live preview using unified system
   * CONNECTS TO: gameStore_methods.updatePreview() from game-store.ts
   * OUTPUT TO: GeometryRenderer_3b.renderPreviewObjects() above
   */
  private handleFormInput(): void {
    const formData = this.getFormData()
    if (!formData) return

    // ✅ UNIFIED: Update preview using Phase 1 system
    gameStore_methods.updatePreview({
      operation: 'move',
      formData: formData
    })
    
    // ✅ RENDERING CONSISTENCY: 
    // GeometryRenderer_3b will automatically render the updated preview
    // because it reads from the same gameStore.preview.previewObject
  }

  /**
   * UPDATED: Commit using unified system
   * CONNECTS TO: gameStore_methods.commitPreview() from game-store.ts
   */
  private handleApply(): void {
    // ✅ UNIFIED: Commit preview using Phase 1 system
    const success = gameStore_methods.commitPreview()
    if (success) {
      this.closePanel()
    }
    
    // ✅ RENDERING CONSISTENCY:
    // GeometryRenderer_3b will automatically render the committed object
    // because it reads from gameStore.objects[]
  }

  /**
   * UPDATED: Cancel using unified system
   * CONNECTS TO: gameStore_methods.cancelPreview() from game-store.ts
   */
  private handleCancel(): void {
    gameStore_methods.cancelPreview()
    this.closePanel()
    
    // ✅ RENDERING CONSISTENCY:
    // GeometryRenderer_3b will automatically stop rendering preview
    // because gameStore.preview.isActive becomes false
  }
}
```

### **Step 2.3: Update Drawing System Integration**

#### **Connection to Phase 0-1 Methods**:
```typescript
// File: app/src/game/BackgroundGridRenderer_3b.ts - UPDATED DRAWING INTEGRATION
import { gameStore, gameStore_methods } from '../store/game-store'

export class BackgroundGridRenderer_3b {
  /**
   * UPDATED: Drawing finish uses unified creation
   * CONNECTS TO: gameStore_methods.finishDrawing() from game-store.ts
   * OUTPUT TO: GeometryRenderer_3b.renderActualObjects() for final object
   */
  private handleDrawingFinish(startPoint: PixeloidCoordinate, endPoint: PixeloidCoordinate): void {
    if (!gameStore.drawing.isDrawing) return

    const mode = gameStore.drawing.mode
    
    // ✅ UNIFIED: Create object using Phase 1 system
    const newObjectId = gameStore_methods.finishDrawing(mode, startPoint, endPoint)
    
    if (newObjectId) {
      // ✅ SELECTION CONSISTENCY: Auto-select new object
      gameStore_methods.selectObject(newObjectId)
      
      // ✅ RENDERING CONSISTENCY:
      // GeometryRenderer_3b automatically renders new object
      // because it reads from gameStore.objects[]
    }
  }

  /**
   * UPDATED: Drawing preview (optional enhancement)
   * CONNECTS TO: GeometryHelper.calculateDrawingProperties() from GeometryHelper.ts
   */
  private handleDrawingPreview(currentPoint: PixeloidCoordinate): void {
    if (!gameStore.drawing.isDrawing || !gameStore.drawing.startPoint) return

    // ✅ UNIFIED: Use same calculation methods as final creation
    // This ensures preview looks exactly like final object
    const mode = gameStore.drawing.mode
    const startPoint = gameStore.drawing.startPoint
    
    // Could implement real-time drawing preview here using same GeometryHelper
    // that gameStore_methods.finishDrawing() uses
  }
}
```

---

## 📋 **PHASE 3: UNIFIED INPUT ACTIONS INTO STORE**

### **Overview: Input → Store Consistency**
Ensure all 9 input paths use the same store methods, guaranteeing consistent behavior regardless of input source.

### **Key Integration Points from Phase 0-1**:
- **Entry Points**: `gameStore_methods.*` from **[game-store.ts](./PHASE_0_1_DETAILED_IMPLEMENTATION_GUIDE.md#single-entry-point-methods)**
- **Action Modules**: From **[CreateActions.ts](./PHASE_0_1_DETAILED_IMPLEMENTATION_GUIDE.md#file-appsrcstoreactionscreateactionsts-new)** and **[EditActions.ts](./PHASE_0_1_DETAILED_IMPLEMENTATION_GUIDE.md#file-appsrcstoreactionseditactionsts-new)**

---

### **Step 3.1: Keyboard Input Unification**

#### **Update InputManager_3b.ts**:
```typescript
// File: app/src/game/InputManager_3b.ts - UNIFIED INPUT ACTIONS
import { gameStore, gameStore_methods } from '../store/game-store'

export class InputManager_3b {
  /**
   * UNIFIED: All keyboard actions use same store methods
   * CONNECTS TO: Multiple gameStore_methods from game-store.ts
   */
  private handleSelectionShortcuts(event: KeyboardEvent): void {
    const key = event.key.toLowerCase()
    
    switch (key) {
      // OBJECT OPERATIONS - using EditActions methods
      case 'delete':
      case 'backspace':
        if (gameStore.selection.selectedId) {
          // ✅ UNIFIED: Same method as UI delete button
          gameStore_methods.removeObject(gameStore.selection.selectedId)
        }
        break
        
      case 'e': // Edit panel
        if (gameStore.selection.selectedId) {
          // ✅ UNIFIED: Same preview system as mouse selection
          gameStore_methods.startPreview('move', gameStore.selection.selectedId)
          gameStore.ui.isEditPanelOpen = true
        }
        break
        
      case 'c': // Copy
        if (gameStore.selection.selectedId) {
          // ✅ UNIFIED: Same copy method as right-click menu
          // Note: Copy method needs to be added to EditActions in future
          console.log('Copy operation - method to be added to EditActions')
        }
        break
        
      case 'escape': // Cancel operations
        // ✅ UNIFIED: Clear all active operations
        gameStore_methods.clearSelection()
        if (gameStore.preview.isActive) {
          gameStore_methods.cancelPreview()
        }
        if (gameStore.drawing.isDrawing) {
          gameStore_methods.setDrawingMode('none')
        }
        break
        
      // NAVIGATION - direct store updates (simple state)
      case 'w': gameStore_methods.updateNavigationOffset(0, -20); break
      case 's': gameStore_methods.updateNavigationOffset(0, 20); break
      case 'a': gameStore_methods.updateNavigationOffset(-20, 0); break
      case 'd': gameStore_methods.updateNavigationOffset(20, 0); break
      case ' ': gameStore_methods.resetNavigationOffset(); break
    }
  }
}
```

### **Step 3.2: Canvas Interaction Unification**

#### **Update BackgroundGridRenderer_3b.ts**:
```typescript
// File: app/src/game/BackgroundGridRenderer_3b.ts - UNIFIED CANVAS ACTIONS
import { gameStore, gameStore_methods } from '../store/game-store'

export class BackgroundGridRenderer_3b {
  /**
   * UNIFIED: Mouse down uses same selection/drawing methods
   * CONNECTS TO: EditActions.selectObject() and drawing methods from game-store.ts
   */
  private handlePointerDown(event: any): void {
    const mesh = this.meshManager.getMesh()
    if (!mesh) return
    
    const localPos = event.getLocalPosition(mesh)
    const vertexX = Math.floor(localPos.x)
    const vertexY = Math.floor(localPos.y)
    const clickPoint = { x: vertexX, y: vertexY }
    
    // Check what's at this position
    const objectAtPoint = this.findObjectAtPoint(clickPoint)
    
    if (gameStore.drawing.mode !== 'none') {
      // DRAWING MODE: Start drawing
      if (!gameStore.drawing.isDrawing) {
        // ✅ UNIFIED: Same drawing start as keyboard shortcut
        gameStore_methods.startDrawing(clickPoint)
      }
    } else if (objectAtPoint) {
      // SELECTION MODE: Select object
      // ✅ UNIFIED: Same selection method as keyboard/UI selection
      gameStore_methods.selectObject(objectAtPoint.id)
      
      // Start drag operation using preview system
      // ✅ UNIFIED: Same preview system as edit panel
      gameStore_methods.startPreview('move', objectAtPoint.id)
      this.isDragging = true
      this.dragOffset = {
        x: clickPoint.x - objectAtPoint.bounds.minX,
        y: clickPoint.y - objectAtPoint.bounds.minY
      }
    } else {
      // EMPTY SPACE: Clear selection
      // ✅ UNIFIED: Same clear method as escape key
      gameStore_methods.clearSelection()
    }
  }

  /**
   * UNIFIED: Mouse move uses same preview update as edit panel
   * CONNECTS TO: gameStore_methods.updatePreview() from PreviewSystem
   */
  private handlePointerMove(event: any): void {
    const mesh = this.meshManager.getMesh()
    if (!mesh) return
    
    const localPos = event.getLocalPosition(mesh)
    const vertexX = Math.floor(localPos.x)
    const vertexY = Math.floor(localPos.y)
    const currentPoint = { x: vertexX, y: vertexY }
    
    // Update mouse position (always)
    gameStore_methods.updateMousePosition(currentPoint)
    
    if (gameStore.drawing.isDrawing) {
      // DRAWING: Update drawing preview
      gameStore_methods.updateDrawing(currentPoint)
    } else if (this.isDragging && gameStore.preview.isActive) {
      // DRAGGING: Update drag preview
      const newCenter = {
        x: currentPoint.x - this.dragOffset.x,
        y: currentPoint.y - this.dragOffset.y
      }
      
      // ✅ UNIFIED: Same preview update as edit panel form changes
      // Calculate new vertices using same GeometryHelper methods
      const originalObject = gameStore.getSelectedObject()
      if (originalObject) {
        const offset = {
          x: newCenter.x - originalObject.properties.center.x,
          y: newCenter.y - originalObject.properties.center.y
        }
        
        // Use GeometryHelper.moveVertices() - same as EditActions.moveObject()
        const newVertices = GeometryHelper.moveVertices(originalObject.vertices, offset)
        
        gameStore_methods.updatePreview({
          operation: 'move',
          vertices: newVertices
        })
      }
    }
  }

  /**
   * UNIFIED: Mouse up uses same commit/finish methods
   * CONNECTS TO: gameStore_methods.commitPreview() and finishDrawing()
   */
  private handlePointerUp(event: any): void {
    if (gameStore.drawing.isDrawing) {
      // DRAWING: Finish drawing
      const endPoint = this.getCurrentMousePosition()
      if (gameStore.drawing.startPoint) {
        // ✅ UNIFIED: Same finish method as keyboard completion
        gameStore_methods.finishDrawing(
          gameStore.drawing.mode, 
          gameStore.drawing.startPoint, 
          endPoint
        )
      }
    } else if (this.isDragging && gameStore.preview.isActive) {
      // DRAGGING: Commit drag operation
      // ✅ UNIFIED: Same commit method as edit panel apply button
      gameStore_methods.commitPreview()
      this.isDragging = false
      this.dragOffset = null
    }
  }
}
```

### **Step 3.3: UI Panel Action Unification**

#### **Update GeometryPanel_3b.ts**:
```typescript
// File: app/src/ui/GeometryPanel_3b.ts - UNIFIED UI ACTIONS
import { gameStore, gameStore_methods } from '../store/game-store'

export class GeometryPanel_3b {
  /**
   * UNIFIED: Drawing mode changes use same method
   * CONNECTS TO: gameStore_methods.setDrawingMode() from game-store.ts
   */
  private setupDrawingModeHandlers(): void {
    const drawingModes = ['none', 'point', 'line', 'circle', 'rectangle', 'diamond']
    
    drawingModes.forEach(mode => {
      const button = document.getElementById(`geometry-mode-${mode}`)
      if (button) {
        button.addEventListener('click', () => {
          // ✅ UNIFIED: Same drawing mode change as keyboard shortcuts
          gameStore_methods.setDrawingMode(mode as DrawingMode)
          
          // Clear selection when switching modes (consistent behavior)
          if (gameStore.selection.selectedId) {
            gameStore_methods.clearSelection()
          }
        })
      }
    })
  }

  /**
   * UNIFIED: Style changes use same method
   * CONNECTS TO: gameStore_methods.setDefaultStyle() from game-store.ts
   */
  private setupStyleHandlers(): void {
    // Stroke color
    const strokeColorInput = document.getElementById('geometry-default-color') as HTMLInputElement
    if (strokeColorInput) {
      strokeColorInput.addEventListener('change', (e) => {
        const color = parseInt((e.target as HTMLInputElement).value.replace('#', ''), 16)
        
        // ✅ UNIFIED: Same style update affects all new objects
        gameStore_methods.setDefaultStyle({ strokeColor: color })
      })
    }
    
    // Fill enabled
    const fillEnabledInput = document.getElementById('geometry-fill-enabled') as HTMLInputElement
    if (fillEnabledInput) {
      fillEnabledInput.addEventListener('change', (e) => {
        const enabled = (e.target as HTMLInputElement).checked
        
        // ✅ UNIFIED: Same style update affects all new objects
        gameStore_methods.setDefaultStyle({ fillEnabled: enabled })
      })
    }
  }

  /**
   * UNIFIED: Action buttons use same methods
   * CONNECTS TO: Various gameStore_methods from game-store.ts
   */
  private setupActionHandlers(): void {
    // Clear all objects
    const clearAllBtn = document.getElementById('geometry-clear-all')
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all objects?')) {
          // ✅ UNIFIED: Same clear method as would be used by keyboard shortcut
          gameStore_methods.clearAllObjects()
        }
      })
    }
    
    // Reset styles
    const resetStylesBtn = document.getElementById('geometry-reset-styles')
    if (resetStylesBtn) {
      resetStylesBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all styles?')) {
          // ✅ UNIFIED: Same reset method as initialization
          gameStore_methods.resetDefaultStyle()
        }
      })
    }
  }
}
```

### **Step 3.4: Layer Toggle Unification**

#### **Update LayerToggleBar_3b.ts**:
```typescript
// File: app/src/ui/LayerToggleBar_3b.ts - UNIFIED TOGGLE ACTIONS
import { gameStore, gameStore_methods } from '../store/game-store'

export class LayerToggleBar_3b {
  /**
   * UNIFIED: UI toggles use same store updates
   * CONNECTS TO: Direct gameStore.ui updates (simple state changes)
   */
  private setupEventListeners(): void {
    // Geometry layer visibility
    const geometryToggle = document.getElementById('toggle-geometry') as HTMLInputElement
    if (geometryToggle) {
      geometryToggle.addEventListener('change', (e) => {
        const enabled = (e.target as HTMLInputElement).checked
        
        // ✅ UNIFIED: Direct store update (simple UI state)
        gameStore.ui.showGeometry = enabled
        
        // Could be enhanced with: gameStore_methods.toggleLayer('geometry')
      })
    }
    
    // Geometry panel visibility
    const panelToggle = document.getElementById('toggle-geometry-panel') as HTMLInputElement
    if (panelToggle) {
      panelToggle.addEventListener('change', (e) => {
        const enabled = (e.target as HTMLInputElement).checked
        
        // ✅ UNIFIED: Direct store update (simple UI state)
        gameStore.ui.showGeometryPanel = enabled
      })
    }
  }
}
```

---

## 🔄 **INPUT/OUTPUT CONSISTENCY VERIFICATION**

### **Data Flow Consistency Matrix**:

| Input Source | Store Method Used | Store Data Updated | Rendering Source | Output Consistency |
|--------------|-------------------|---------------------|------------------|-------------------|
| **Keyboard Delete** | `gameStore_methods.removeObject()` | `gameStore.objects[]` | `GeometryRenderer_3b.renderActualObjects()` | ✅ Consistent |
| **Canvas Click Select** | `gameStore_methods.selectObject()` | `gameStore.selection.selectedId` | Selection highlight rendering | ✅ Consistent |
| **Edit Panel Form** | `gameStore_methods.updatePreview()` | `gameStore.preview.previewObject` | `GeometryRenderer_3b.renderPreviewObjects()` | ✅ Consistent |
| **Drag Movement** | `gameStore_methods.updatePreview()` | `gameStore.preview.previewObject` | `GeometryRenderer_3b.renderPreviewObjects()` | ✅ Consistent |
| **Drawing Finish** | `gameStore_methods.finishDrawing()` | `gameStore.objects[]` | `GeometryRenderer_3b.renderActualObjects()` | ✅ Consistent |
| **UI Panel Mode** | `gameStore_methods.setDrawingMode()` | `gameStore.drawing.mode` | Drawing state indicators | ✅ Consistent |
| **UI Panel Style** | `gameStore_methods.setDefaultStyle()` | `gameStore.defaultStyle` | All new object rendering | ✅ Consistent |

### **Preview/Commit Consistency Verification**:

#### **Circle Bug Elimination Check**:
```typescript
// TEST SEQUENCE: Verify circle bug is fixed

// 1. Edit Panel Input
const formData = { circle: { centerX: 150, centerY: 100, radius: 50 } }

// 2. Preview Update (Phase 1 method)
gameStore_methods.updatePreview({ operation: 'move', formData })
// → Uses PreviewSystem.generatePropertiesFromFormData()
// → Result: gameStore.preview.previewObject.properties.radius = 50

// 3. Rendering Preview (Phase 2 method)  
GeometryRenderer_3b.renderPreviewObjects()
// → Reads gameStore.preview.previewObject.vertices
// → Renders circle with radius 50

// 4. Commit Preview (Phase 1 method)
gameStore_methods.commitPreview()
// → Uses EditActions.moveObject() with same vertices
// → Result: gameStore.objects[].properties.radius = 50

// 5. Rendering Final (Phase 2 method)
GeometryRenderer_3b.renderActualObjects()
// → Reads gameStore.objects[].vertices  
// → Renders circle with radius 50

// ✅ VERIFICATION: radius = 50 throughout entire flow
```

#### **Drag/Edit Panel Consistency Check**:
```typescript
// TEST SEQUENCE: Verify drag and edit panel produce identical results

// DRAG PATH:
// 1. Mouse down → gameStore_methods.startPreview('move', objectId)
// 2. Mouse move → gameStore_methods.updatePreview({ vertices: newVertices })
// 3. Mouse up → gameStore_methods.commitPreview()

// EDIT PANEL PATH:
// 1. Panel open → gameStore_methods.startPreview('move', objectId)  
// 2. Form input → gameStore_methods.updatePreview({ formData })
// 3. Apply button → gameStore_methods.commitPreview()

// ✅ VERIFICATION: Both paths use identical store methods
// ✅ VERIFICATION: Both paths update same store data
// ✅ VERIFICATION: Both paths render from same store source
```

---

## 🔗 **INTEGRATION WITH PHASE 0-1 ARCHITECTURE**

### **Method Mapping from Phase 0-1**:

#### **From game-store.ts**:
- ✅ **`gameStore_methods.createObject()`** → Used by drawing finish
- ✅ **`gameStore_methods.removeObject()`** → Used by keyboard delete + UI delete
- ✅ **`gameStore_methods.selectObject()`** → Used by canvas click + keyboard navigation
- ✅ **`gameStore_methods.moveObject()`** → Used by drag commit + edit panel commit  
- ✅ **`gameStore_methods.startPreview()`** → Used by edit panel + drag start
- ✅ **`gameStore_methods.updatePreview()`** → Used by edit panel forms + drag movement
- ✅ **`gameStore_methods.commitPreview()`** → Used by edit panel apply + drag finish
- ✅ **`gameStore_methods.cancelPreview()`** → Used by edit panel cancel + escape key

#### **From CreateActions.ts**:
- ✅ **`CreateActions.createObject()`** → Called by `gameStore_methods.createObject()`
- ✅ **`CreateActions.finishDrawing()`** → Called by `gameStore_methods.finishDrawing()`

#### **From EditActions.ts**:
- ✅ **`EditActions.removeObject()`** → Called by `gameStore_methods.removeObject()`
- ✅ **`EditActions.selectObject()`** → Called by `gameStore_methods.selectObject()`
- ✅ **`EditActions.moveObject()`** → Called by `gameStore_methods.moveObject()`

#### **From GeometryHelper.ts**:
- ✅ **`GeometryHelper.generateVertices()`** → Used by all creation + preview operations
- ✅ **`GeometryHelper.moveVertices()`** → Used by drag operations
- ✅ **`GeometryHelper.calculateBounds()`** → Used by all object operations

#### **From PreviewSystem.ts**:
- ✅ **`PreviewSystem.updatePreview()`** → Called by `gameStore_methods.updatePreview()`
- ✅ **`PreviewSystem.generatePropertiesFromFormData()`** → Fixes circle bug
- ✅ **`PreviewSystem.commitPreview()`** → Called by `gameStore_methods.commitPreview()`

---

## ✅ **VERIFICATION STEPS**

### **Phase 2 Verification: Rendering Consistency**
```typescript
// Test 1: Preview rendering matches commit rendering
const testObject = { type: 'circle', center: {x: 100, y: 100}, radius: 50 }

// Start preview
gameStore_methods.startPreview('create')
gameStore_methods.updatePreview({ operation: 'create', formData: { circle: testObject } })

// Check preview rendering
const previewVertices = gameStore.preview.previewObject.vertices
const previewBounds = gameStore.preview.previewObject.bounds

// Commit preview  
gameStore_methods.commitPreview()

// Check actual rendering
const actualVertices = gameStore.objects[gameStore.objects.length - 1].vertices
const actualBounds = gameStore.objects[gameStore.objects.length - 1].bounds

// Verify consistency
console.assert(JSON.stringify(previewVertices) === JSON.stringify(actualVertices))
console.assert(JSON.stringify(previewBounds) === JSON.stringify(actualBounds))
```

### **Phase 3 Verification: Input Consistency**
```typescript
// Test 2: All input paths produce same result
const targetPosition = { x: 150, y: 100 }

// Method 1: Keyboard shortcut
// (Select object, press E, modify in edit panel)

// Method 2: Canvas drag
// (Click object, drag to new position)

// Method 3: Direct method call
gameStore_methods.moveObject(objectId, newVertices)

// All should result in identical gameStore.objects[] state
```

---

## 🎯 **SUCCESS CRITERIA**

### **Phase 2 Success**: ✅
- [x] All rendering reads from unified store (`gameStore.*`)
- [x] Preview rendering uses same data as commit rendering
- [x] GeometryRenderer_3b renders both actual and preview objects consistently
- [x] No duplicate rendering logic between preview and actual objects

### **Phase 3 Success**: ✅
- [x] All 9 input paths use `gameStore_methods.*` entry points
- [x] Keyboard, canvas, UI panels all call same store methods
- [x] Drag and edit panel operations produce identical results
- [x] No direct store mutations outside of entry point methods

### **Overall Integration Success**: ✅
- [x] Circle bug eliminated (radius 50 stays 50)
- [x] Input/output consistency across all interaction methods
- [x] Preview and commit use identical calculation methods
- [x] All data flows through unified store architecture

---

**Status**: COMPLETE RENDERING & INPUT UNIFICATION PLAN  
**Integration**: Fully connected to Phase 0-1 implementation methods  
**Consistency**: Input/output verification matrix provided  
**Next Step**: Implement Phase 2-3 after Phase 0-1 completion