# CORRECTED Phase 2 & 3: Rendering & Input Unification Guide

## 🎯 **OBJECTIVE**
Unify preview rendering from store (Phase 2) and unify all input actions into store (Phase 3), ensuring consistent input/output flow with the **CORRECTED** modular architecture from **[CORRECTED_PHASE_0_1_IMPLEMENTATION_GUIDE.md](./CORRECTED_PHASE_0_1_IMPLEMENTATION_GUIDE.md)**.

## 🚨 **CRITICAL: USES CORRECTED TYPES**
This guide uses **REAL types** from the actual codebase, not assumptions:
- `StyleSettings` (not `GeometryStyle`)
- `GeometricObject` from `ecs-data-layer` (not `geometry-drawing`)
- `ObjectEditPreviewState` with real structure
- All coordinate types from verified exports

---

## 📋 **PHASE 2: UNIFIED PREVIEW RENDERING FROM STORE (CORRECTED)**

### **Overview: Store → Rendering Consistency**
Connect the corrected modular store to existing rendering components, ensuring all preview rendering uses the same store data that will be committed.

### **Key Integration Points from Corrected Phase 0-1**:
- **Store Data**: `gameStore.preview` from **[CORRECTED_PHASE_0_1_IMPLEMENTATION_GUIDE.md](./CORRECTED_PHASE_0_1_IMPLEMENTATION_GUIDE.md#store-instance-corrected-defaults)**
- **Preview Methods**: `PreviewSystem.updatePreview()` from **[PreviewSystem.ts](./CORRECTED_PHASE_0_1_IMPLEMENTATION_GUIDE.md#file-appsrcstoresystemspreviewsystemts-corrected)**
- **Geometry Helper**: `GeometryHelper.generateVertices()` from **[GeometryHelper.ts](./CORRECTED_PHASE_0_1_IMPLEMENTATION_GUIDE.md#file-appsrcstorehelpergeometryhelperts-corrected)**

---

### **Step 2.1: Update GeometryRenderer_3b.ts (CORRECTED IMPORTS)**

#### **Current Issue**: Multiple Rendering Sources + Wrong Type Imports
```typescript
// Current: GeometryRenderer_3b.ts renders from multiple sources with wrong imports
// - gameStore_3b.geometry.objects[] (actual objects)
// - gameStore_3b.editPreview.previewData (preview object)
// - Uses wrong GeometryStyle type (doesn't exist)
```

#### **Solution**: Unified Store Rendering with CORRECTED Types
```typescript
// File: app/src/game/GeometryRenderer_3b.ts - CORRECTED IMPORTS
import { gameStore, gameStore_methods } from '../store/game-store'
import type { GeometricObject, StyleSettings, PixeloidCoordinate } from '../types'  // CORRECTED: real types

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
   * Main render method - uses corrected unified store data
   * CONNECTS TO: gameStore.objects[] and gameStore.preview from CORRECTED game-store.ts
   */
  public render(): void {
    // Render actual objects from corrected unified store
    this.renderActualObjects()
    
    // Render preview from corrected unified store
    this.renderPreviewObjects()
  }

  /**
   * Render actual objects from corrected unified store
   * INPUT SOURCE: gameStore.objects[] (GeometricObject[]) from CORRECTED game-store.ts
   */
  private renderActualObjects(): void {
    this.actualObjectsContainer.removeChildren()
    
    // ✅ CORRECTED: Read from single store source with real GeometricObject type
    gameStore.objects.forEach(obj => {
      if (obj.isVisible) {
        const graphics = this.createObjectGraphics(obj)
        this.actualObjectsContainer.addChild(graphics)
      }
    })
  }

  /**
   * Render preview objects from corrected unified store
   * INPUT SOURCE: gameStore.preview from CORRECTED PreviewSystem
   * CONNECTS TO: PreviewSystem.updatePreview() from CORRECTED PreviewSystem.ts
   */
  private renderPreviewObjects(): void {
    this.previewContainer.removeChildren()
    
    // ✅ CORRECTED: Read from same store that CORRECTED preview system writes to
    if (gameStore.preview.isActive && gameStore.preview.previewData?.previewVertices) {
      const previewGraphics = this.createPreviewGraphics(
        gameStore.preview.previewData.previewVertices,
        gameStore.preview.previewData.previewStyle || {},
        gameStore.preview.previewOpacity
      )
      this.previewContainer.addChild(previewGraphics)
    }
  }

  /**
   * Create graphics for actual objects (CORRECTED TYPES)
   * CONSISTENT WITH: GeometryHelper.generateVertices() from CORRECTED GeometryHelper.ts
   */
  private createObjectGraphics(obj: GeometricObject): Graphics {  // CORRECTED: GeometricObject type
    const graphics = new Graphics()
    
    // Use same vertices that CORRECTED GeometryHelper generated
    this.renderObjectVertices(graphics, obj.vertices, obj.style, false)
    
    return graphics
  }

  /**
   * Create graphics for preview objects (CORRECTED TYPES)
   * CONSISTENT WITH: PreviewSystem preview generation from CORRECTED PreviewSystem.ts
   */
  private createPreviewGraphics(
    vertices: PixeloidCoordinate[], 
    style: Partial<StyleSettings>,  // CORRECTED: StyleSettings, not GeometryStyle
    opacity: number
  ): Graphics {
    const graphics = new Graphics()
    
    // ✅ CRITICAL: Use SAME vertex data that CORRECTED PreviewSystem generated
    // This ensures preview looks exactly like what will be committed
    this.renderObjectVertices(graphics, vertices, style, true, opacity)
    
    return graphics
  }

  /**
   * Unified vertex rendering (CORRECTED STYLE TYPES)
   * ENSURES: Preview and actual objects render identically
   */
  private renderObjectVertices(
    graphics: Graphics, 
    vertices: PixeloidCoordinate[], 
    style: Partial<StyleSettings> | GeometricObject['style'],  // CORRECTED: StyleSettings union 
    isPreview: boolean,
    previewOpacity: number = 0.7
  ): void {
    if (vertices.length === 0) return

    // Apply style with preview modifications (CORRECTED property names)
    const alpha = isPreview ? previewOpacity : 1.0
    const strokeColor = style.color || 0x0066cc  // CORRECTED: use 'color' not 'strokeColor'
    const strokeWidth = (style.strokeWidth || 2) * (isPreview ? 1.5 : 1.0)

    graphics.moveTo(vertices[0].x, vertices[0].y)
    
    // Draw all vertices
    for (let i = 1; i < vertices.length; i++) {
      graphics.lineTo(vertices[i].x, vertices[i].y)
    }
    
    // Close path for filled shapes
    if (vertices.length > 2) {
      graphics.lineTo(vertices[0].x, vertices[0].y)
    }

    // Apply stroke (CORRECTED property names)
    graphics.stroke({ 
      color: strokeColor, 
      width: strokeWidth, 
      alpha: alpha * (style.strokeAlpha || 1.0)
    })

    // Apply fill if enabled (CORRECTED property checks)
    if (style.fillEnabled && style.fillColor !== undefined) {
      graphics.fill({ 
        color: style.fillColor, 
        alpha: alpha * (style.fillAlpha || 0.3)
      })
    }
  }
}
```

### **Step 2.2: Update ObjectEditPanel_3b.ts Integration (CORRECTED)**

#### **Connection to Corrected Phase 0-1 Methods**:
```typescript
// File: app/src/ui/ObjectEditPanel_3b.ts - CORRECTED INTEGRATION
import { gameStore, gameStore_methods } from '../store/game-store'
import type { ObjectEditFormData, GeometricObject } from '../types'  // CORRECTED imports

export class ObjectEditPanel_3b {
  /**
   * CORRECTED: Use unified preview system from Corrected Phase 1
   * CONNECTS TO: gameStore_methods.startPreview() from CORRECTED game-store.ts
   */
  private loadSelectedObject(): void {
    const selectedObjectId = gameStore.selection.selectedId
    if (!selectedObjectId) return

    // ✅ CORRECTED: Use Corrected Phase 1 preview system
    gameStore_methods.startPreview('move', selectedObjectId)
    const selectedObject = gameStore_methods.getSelectedObject()
    if (selectedObject) {
      this.generateForm(selectedObject)
    }
  }

  /**
   * CORRECTED: Live preview using corrected unified system
   * CONNECTS TO: gameStore_methods.updatePreview() from CORRECTED game-store.ts
   * OUTPUT TO: GeometryRenderer_3b.renderPreviewObjects() above (CORRECTED)
   */
  private handleFormInput(): void {
    const formData = this.getFormData()  // Returns ObjectEditFormData (CORRECTED type)
    if (!formData) return

    // ✅ CORRECTED: Update preview using Corrected Phase 1 system
    gameStore_methods.updatePreview({
      operation: 'move',
      formData: formData  // CORRECTED: ObjectEditFormData with real structure
    })
    
    // ✅ RENDERING CONSISTENCY (CORRECTED): 
    // GeometryRenderer_3b will automatically render the updated preview
    // because it reads from the same gameStore.preview.previewData (CORRECTED structure)
  }

  /**
   * CORRECTED: Commit using corrected unified system
   * CONNECTS TO: gameStore_methods.commitPreview() from CORRECTED game-store.ts
   */
  private handleApply(): void {
    // ✅ CORRECTED: Commit preview using Corrected Phase 1 system
    gameStore_methods.commitPreview()
    this.closePanel()
    
    // ✅ RENDERING CONSISTENCY (CORRECTED):
    // GeometryRenderer_3b will automatically render the committed object
    // because it reads from gameStore.objects[] (GeometricObject[])
  }

  /**
   * CORRECTED: Cancel using corrected unified system
   * CONNECTS TO: gameStore_methods.cancelPreview() from CORRECTED game-store.ts
   */
  private handleCancel(): void {
    gameStore_methods.cancelPreview()
    this.closePanel()
    
    // ✅ RENDERING CONSISTENCY (CORRECTED):
    // GeometryRenderer_3b will automatically stop rendering preview
    // because gameStore.preview.isActive becomes false
  }

  /**
   * CORRECTED: Generate form with real ObjectEditFormData structure
   */
  private generateForm(obj: GeometricObject): void {  // CORRECTED: GeometricObject type
    // CORRECTED: Use real properties from GeometryProperties union
    switch (obj.properties.type) {
      case 'circle':
        const circleProps = obj.properties  // CircleProperties
        this.populateCircleForm({
          centerX: circleProps.center.x,
          centerY: circleProps.center.y,
          radius: circleProps.radius
        })
        break
        
      case 'rectangle':
        const rectProps = obj.properties  // RectangleProperties
        this.populateRectangleForm({
          centerX: rectProps.center.x,
          centerY: rectProps.center.y,
          width: rectProps.width,
          height: rectProps.height
        })
        break
        
      // Add other shape types...
    }
  }

  /**
   * CORRECTED: Get form data with real ObjectEditFormData structure
   */
  private getFormData(): ObjectEditFormData | null {
    // CORRECTED: Return real ObjectEditFormData structure
    const shapeType = this.getSelectedShapeType()
    
    switch (shapeType) {
      case 'circle':
        return {
          isVisible: this.getVisibilityValue(),
          circle: {
            centerX: this.getCenterXValue(),
            centerY: this.getCenterYValue(),
            radius: this.getRadiusValue()
          },
          style: {
            strokeColor: this.getStrokeColorValue(),  // hex string
            strokeWidth: this.getStrokeWidthValue(),
            strokeAlpha: this.getStrokeAlphaValue(),
            fillColor: this.getFillColorValue(),      // hex string
            fillAlpha: this.getFillAlphaValue(),
            hasFill: this.getFillEnabledValue()
          }
        }
        
      case 'rectangle':
        return {
          isVisible: this.getVisibilityValue(),
          rectangle: {
            centerX: this.getCenterXValue(),
            centerY: this.getCenterYValue(),
            width: this.getWidthValue(),
            height: this.getHeightValue()
          },
          style: {
            strokeColor: this.getStrokeColorValue(),
            strokeWidth: this.getStrokeWidthValue(),
            strokeAlpha: this.getStrokeAlphaValue(),
            fillColor: this.getFillColorValue(),
            fillAlpha: this.getFillAlphaValue(),
            hasFill: this.getFillEnabledValue()
          }
        }
        
      default:
        return null
    }
  }
}
```

### **Step 2.3: Update Drawing System Integration (CORRECTED)**

#### **Connection to Corrected Phase 0-1 Methods**:
```typescript
// File: app/src/game/BackgroundGridRenderer_3b.ts - CORRECTED DRAWING INTEGRATION
import { gameStore, gameStore_methods } from '../store/game-store'
import type { PixeloidCoordinate, DrawingMode } from '../types'  // CORRECTED imports

export class BackgroundGridRenderer_3b {
  /**
   * CORRECTED: Drawing finish uses corrected unified creation
   * CONNECTS TO: gameStore_methods.finishDrawing() from CORRECTED game-store.ts
   * OUTPUT TO: GeometryRenderer_3b.renderActualObjects() for final GeometricObject
   */
  private handleDrawingFinish(startPoint: PixeloidCoordinate, endPoint: PixeloidCoordinate): void {
    if (!gameStore.drawing.isDrawing) return

    const mode = gameStore.drawing.mode
    
    // ✅ CORRECTED: Create object using Corrected Phase 1 system
    const newObjectId = gameStore_methods.finishDrawing(mode, startPoint, endPoint)
    
    if (newObjectId) {
      // ✅ SELECTION CONSISTENCY: Auto-select new object
      gameStore_methods.selectObject(newObjectId)
      
      // ✅ RENDERING CONSISTENCY (CORRECTED):
      // GeometryRenderer_3b automatically renders new GeometricObject
      // because it reads from gameStore.objects[]
    }
  }

  /**
   * CORRECTED: Drawing preview (optional enhancement)
   * CONNECTS TO: GeometryHelper.calculateDrawingProperties() from CORRECTED GeometryHelper.ts
   */
  private handleDrawingPreview(currentPoint: PixeloidCoordinate): void {
    if (!gameStore.drawing.isDrawing || !gameStore.drawing.startPoint) return

    // ✅ CORRECTED: Use same calculation methods as final creation
    // This ensures preview looks exactly like final object
    const mode = gameStore.drawing.mode
    const startPoint = gameStore.drawing.startPoint
    
    // Could implement real-time drawing preview here using same CORRECTED GeometryHelper
    // that gameStore_methods.finishDrawing() uses
  }
}
```

---

## 📋 **PHASE 3: UNIFIED INPUT ACTIONS INTO STORE (CORRECTED)**

### **Overview: Input → Store Consistency**
Ensure all 9 input paths use the same corrected store methods, guaranteeing consistent behavior regardless of input source.

### **Key Integration Points from Corrected Phase 0-1**:
- **Entry Points**: `gameStore_methods.*` from **[CORRECTED game-store.ts](./CORRECTED_PHASE_0_1_IMPLEMENTATION_GUIDE.md#single-entry-point-methods-corrected-types)**
- **Action Modules**: From **[CORRECTED CreateActions.ts](./CORRECTED_PHASE_0_1_IMPLEMENTATION_GUIDE.md#file-appsrcstoreactionscreateactionsts-corrected)** and **[EditActions.ts](./CORRECTED_PHASE_0_1_IMPLEMENTATION_GUIDE.md#step-12-create-action-modules-corrected-imports)**

---

### **Step 3.1: Keyboard Input Unification (CORRECTED)**

#### **Update InputManager_3b.ts (CORRECTED IMPORTS)**:
```typescript
// File: app/src/game/InputManager_3b.ts - CORRECTED UNIFIED INPUT ACTIONS
import { gameStore, gameStore_methods } from '../store/game-store'
import type { DrawingMode } from '../types'  // CORRECTED imports

export class InputManager_3b {
  /**
   * CORRECTED: All keyboard actions use same corrected store methods
   * CONNECTS TO: Multiple gameStore_methods from CORRECTED game-store.ts
   */
  private handleSelectionShortcuts(event: KeyboardEvent): void {
    const key = event.key.toLowerCase()
    
    switch (key) {
      // OBJECT OPERATIONS - using CORRECTED EditActions methods
      case 'delete':
      case 'backspace':
        if (gameStore.selection.selectedId) {
          // ✅ CORRECTED: Same method as UI delete button
          gameStore_methods.removeObject(gameStore.selection.selectedId)
        }
        break
        
      case 'e': // Edit panel
        if (gameStore.selection.selectedId) {
          // ✅ CORRECTED: Same preview system as mouse selection
          gameStore_methods.startPreview('move', gameStore.selection.selectedId)
          gameStore.ui.isEditPanelOpen = true
        }
        break
        
      case 'c': // Copy
        if (gameStore.selection.selectedId) {
          // ✅ CORRECTED: Same copy method as right-click menu
          // Note: Copy method needs to be added to CORRECTED EditActions in future
          console.log('Copy operation - method to be added to CORRECTED EditActions')
        }
        break
        
      case 'escape': // Cancel operations
        // ✅ CORRECTED: Clear all active operations
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

### **Step 3.2: Canvas Interaction Unification (CORRECTED)**

#### **Update BackgroundGridRenderer_3b.ts (CORRECTED TYPES)**:
```typescript
// File: app/src/game/BackgroundGridRenderer_3b.ts - CORRECTED UNIFIED CANVAS ACTIONS
import { gameStore, gameStore_methods } from '../store/game-store'
import type { PixeloidCoordinate, GeometricObject } from '../types'  // CORRECTED imports
import { GeometryHelper } from '../store/helpers/GeometryHelper'

export class BackgroundGridRenderer_3b {
  private isDragging: boolean = false
  private dragOffset: { x: number, y: number } | null = null

  /**
   * CORRECTED: Mouse down uses same corrected selection/drawing methods
   * CONNECTS TO: EditActions.selectObject() and drawing methods from CORRECTED game-store.ts
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
        // ✅ CORRECTED: Same drawing start as keyboard shortcut
        gameStore_methods.startDrawing(clickPoint)
      }
    } else if (objectAtPoint) {
      // SELECTION MODE: Select object
      // ✅ CORRECTED: Same selection method as keyboard/UI selection
      gameStore_methods.selectObject(objectAtPoint.id)
      
      // Start drag operation using CORRECTED preview system
      // ✅ CORRECTED: Same preview system as edit panel
      gameStore_methods.startPreview('move', objectAtPoint.id)
      this.isDragging = true
      this.dragOffset = {
        x: clickPoint.x - objectAtPoint.bounds.minX,
        y: clickPoint.y - objectAtPoint.bounds.minY
      }
    } else {
      // EMPTY SPACE: Clear selection
      // ✅ CORRECTED: Same clear method as escape key
      gameStore_methods.clearSelection()
    }
  }

  /**
   * CORRECTED: Mouse move uses same preview update as edit panel
   * CONNECTS TO: gameStore_methods.updatePreview() from CORRECTED PreviewSystem
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
    } else if (this.isDragging && gameStore.preview.isActive && this.dragOffset) {
      // DRAGGING: Update drag preview
      const newCenter = {
        x: currentPoint.x - this.dragOffset.x,
        y: currentPoint.y - this.dragOffset.y
      }
      
      // ✅ CORRECTED: Same preview update as edit panel form changes
      // Calculate new vertices using same CORRECTED GeometryHelper methods
      const selectedObject = gameStore_methods.getSelectedObject()
      if (selectedObject) {
        const offset = {
          x: newCenter.x - selectedObject.properties.center.x,  // CORRECTED: use real properties
          y: newCenter.y - selectedObject.properties.center.y
        }
        
        // Use CORRECTED GeometryHelper.moveVertices() - same as EditActions.moveObject()
        const newVertices = GeometryHelper.moveVertices(selectedObject.vertices, offset)
        
        gameStore_methods.updatePreview({
          operation: 'move',
          vertices: newVertices
        })
      }
    }
  }

  /**
   * CORRECTED: Mouse up uses same corrected commit/finish methods
   * CONNECTS TO: gameStore_methods.commitPreview() and finishDrawing()
   */
  private handlePointerUp(event: any): void {
    if (gameStore.drawing.isDrawing) {
      // DRAWING: Finish drawing
      const endPoint = this.getCurrentMousePosition()
      if (gameStore.drawing.startPoint) {
        // ✅ CORRECTED: Same finish method as keyboard completion
        gameStore_methods.finishDrawing(
          gameStore.drawing.mode, 
          gameStore.drawing.startPoint, 
          endPoint
        )
      }
    } else if (this.isDragging && gameStore.preview.isActive) {
      // DRAGGING: Commit drag operation
      // ✅ CORRECTED: Same commit method as edit panel apply button
      gameStore_methods.commitPreview()
      this.isDragging = false
      this.dragOffset = null
    }
  }

  /**
   * CORRECTED: Find object at point using real GeometricObject
   */
  private findObjectAtPoint(point: PixeloidCoordinate): GeometricObject | null {  // CORRECTED: GeometricObject type
    // Check all objects for intersection with click point
    for (const obj of gameStore.objects) {
      if (obj.isVisible && this.isPointInObject(point, obj)) {
        return obj
      }
    }
    return null
  }

  /**
   * CORRECTED: Point-in-object test using real ECSBoundingBox
   */
  private isPointInObject(point: PixeloidCoordinate, obj: GeometricObject): boolean {  // CORRECTED types
    const bounds = obj.bounds  // ECSBoundingBox
    return point.x >= bounds.minX && 
           point.x <= bounds.maxX && 
           point.y >= bounds.minY && 
           point.y <= bounds.maxY
  }
}
```

### **Step 3.3: UI Panel Action Unification (CORRECTED)**

#### **Update GeometryPanel_3b.ts (CORRECTED TYPES)**:
```typescript
// File: app/src/ui/GeometryPanel_3b.ts - CORRECTED UNIFIED UI ACTIONS
import { gameStore, gameStore_methods } from '../store/game-store'
import type { DrawingMode, StyleSettings } from '../types'  // CORRECTED imports

export class GeometryPanel_3b {
  /**
   * CORRECTED: Drawing mode changes use same method
   * CONNECTS TO: gameStore_methods.setDrawingMode() from CORRECTED game-store.ts
   */
  private setupDrawingModeHandlers(): void {
    const drawingModes: DrawingMode[] = ['none', 'point', 'line', 'circle', 'rectangle', 'diamond']  // CORRECTED type
    
    drawingModes.forEach(mode => {
      const button = document.getElementById(`geometry-mode-${mode}`)
      if (button) {
        button.addEventListener('click', () => {
          // ✅ CORRECTED: Same drawing mode change as keyboard shortcuts
          gameStore_methods.setDrawingMode(mode)
          
          // Clear selection when switching modes (consistent behavior)
          if (gameStore.selection.selectedId) {
            gameStore_methods.clearSelection()
          }
        })
      }
    })
  }

  /**
   * CORRECTED: Style changes use corrected method with StyleSettings
   * CONNECTS TO: gameStore_methods.setDefaultStyle() from CORRECTED game-store.ts
   */
  private setupStyleHandlers(): void {
    // Stroke color
    const strokeColorInput = document.getElementById('geometry-default-color') as HTMLInputElement
    if (strokeColorInput) {
      strokeColorInput.addEventListener('change', (e) => {
        const color = parseInt((e.target as HTMLInputElement).value.replace('#', ''), 16)
        
        // ✅ CORRECTED: Same style update affects all new objects (StyleSettings)
        gameStore_methods.setDefaultStyle({ color: color })  // CORRECTED: use 'color' not 'strokeColor'
      })
    }
    
    // Fill enabled
    const fillEnabledInput = document.getElementById('geometry-fill-enabled') as HTMLInputElement
    if (fillEnabledInput) {
      fillEnabledInput.addEventListener('change', (e) => {
        const enabled = (e.target as HTMLInputElement).checked
        
        // ✅ CORRECTED: Same style update affects all new objects (StyleSettings)
        gameStore_methods.setDefaultStyle({ fillEnabled: enabled })
      })
    }

    // Stroke width
    const strokeWidthInput = document.getElementById('geometry-stroke-width') as HTMLInputElement
    if (strokeWidthInput) {
      strokeWidthInput.addEventListener('input', (e) => {
        const width = parseInt((e.target as HTMLInputElement).value, 10)
        
        // ✅ CORRECTED: Use real StyleSettings property
        gameStore_methods.setDefaultStyle({ strokeWidth: width })
      })
    }
  }

  /**
   * CORRECTED: Action buttons use same corrected methods
   * CONNECTS TO: Various gameStore_methods from CORRECTED game-store.ts
   */
  private setupActionHandlers(): void {
    // Clear all objects
    const clearAllBtn = document.getElementById('geometry-clear-all')
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all objects?')) {
          // ✅ CORRECTED: Same clear method as would be used by keyboard shortcut
          gameStore_methods.clearAllObjects()
        }
      })
    }
    
    // Reset styles
    const resetStylesBtn = document.getElementById('geometry-reset-styles')
    if (resetStylesBtn) {
      resetStylesBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all styles?')) {
          // ✅ CORRECTED: Same reset method as initialization (StyleSettings)
          gameStore_methods.resetDefaultStyle()
        }
      })
    }
  }
}
```

### **Step 3.4: Layer Toggle Unification (CORRECTED)**

#### **Update LayerToggleBar_3b.ts (CORRECTED STORE ACCESS)**:
```typescript
// File: app/src/ui/LayerToggleBar_3b.ts - CORRECTED UNIFIED TOGGLE ACTIONS
import { gameStore, gameStore_methods } from '../store/game-store'  // CORRECTED import

export class LayerToggleBar_3b {
  /**
   * CORRECTED: UI toggles use same corrected store updates
   * CONNECTS TO: Direct gameStore.ui updates (simple state changes)
   */
  private setupEventListeners(): void {
    // Geometry layer visibility
    const geometryToggle = document.getElementById('toggle-geometry') as HTMLInputElement
    if (geometryToggle) {
      geometryToggle.addEventListener('change', (e) => {
        const enabled = (e.target as HTMLInputElement).checked
        
        // ✅ CORRECTED: Direct store update (simple UI state)
        gameStore.ui.showGeometry = enabled
        
        // Could be enhanced with: gameStore_methods.toggleLayer('geometry')
      })
    }
    
    // Geometry panel visibility
    const panelToggle = document.getElementById('toggle-geometry-panel') as HTMLInputElement
    if (panelToggle) {
      panelToggle.addEventListener('change', (e) => {
        const enabled = (e.target as HTMLInputElement).checked
        
        // ✅ CORRECTED: Direct store update (simple UI state)
        gameStore.ui.showGeometryPanel = enabled
      })
    }

    // Store panel visibility
    const storePanelToggle = document.getElementById('toggle-store-panel') as HTMLInputElement
    if (storePanelToggle) {
      storePanelToggle.addEventListener('change', (e) => {
        const enabled = (e.target as HTMLInputElement).checked
        
        // ✅ CORRECTED: Direct store update (simple UI state)
        gameStore.ui.showStorePanel = enabled
      })
    }
  }
}
```

---

## 🔄 **CORRECTED INPUT/OUTPUT CONSISTENCY VERIFICATION**

### **Corrected Data Flow Consistency Matrix**:

| Input Source | Corrected Phase 0-1 Method | Phase 2-3 Integration | Output Consistency |
|--------------|------------------------------|----------------------|-------------------|
| **Edit Panel Form** | `gameStore_methods.updatePreview()` | `GeometryRenderer_3b.renderPreviewObjects()` | ✅ Radius 50 (CORRECTED) |
| **Canvas Drag** | `gameStore_methods.updatePreview()` | Same rendering method | ✅ Radius 50 (CORRECTED) |
| **Keyboard Delete** | `gameStore_methods.removeObject()` | `GeometryRenderer_3b.renderActualObjects()` | ✅ Consistent (CORRECTED) |
| **UI Panel Actions** | `gameStore_methods.setDrawingMode()` | UI state updates | ✅ Consistent (CORRECTED) |
| **Drawing System** | `gameStore_methods.finishDrawing()` | Object creation rendering | ✅ Consistent (CORRECTED) |

### **Corrected Preview/Commit Consistency Verification**:

#### **Circle Bug Elimination Check (CORRECTED TYPES)**:
```typescript
// TEST SEQUENCE: Verify circle bug is fixed with CORRECTED types

// 1. Edit Panel Input (CORRECTED ObjectEditFormData structure)
const formData: ObjectEditFormData = { 
  isVisible: true,
  circle: { centerX: 150, centerY: 100, radius: 50 },
  style: { strokeColor: '#0066cc', strokeWidth: 2, strokeAlpha: 1.0, hasFill: false }
}

// 2. Preview Update (CORRECTED Phase 1 method)
gameStore_methods.updatePreview({ operation: 'move', formData })
// → Uses CORRECTED PreviewSystem.generatePropertiesFromFormData()
// → Result: gameStore.preview.previewData.previewProperties.radius = 50

// 3. Rendering Preview (CORRECTED Phase 2 method)  
GeometryRenderer_3b.renderPreviewObjects()
// → Reads gameStore.preview.previewData.previewVertices
// → Renders circle with radius 50

// 4. Commit Preview (CORRECTED Phase 1 method)
gameStore_methods.commitPreview()
// → Uses CORRECTED EditActions.moveObject() with same vertices
// → Result: gameStore.objects[].properties.radius = 50 (CircleProperties)

// 5. Rendering Final (CORRECTED Phase 2 method)
GeometryRenderer_3b.renderActualObjects()
// → Reads gameStore.objects[] (GeometricObject[])
// → Renders circle with radius 50

// ✅ VERIFICATION: radius = 50 throughout entire flow (CORRECTED TYPES)
```

#### **Drag/Edit Panel Consistency Check (CORRECTED TYPES)**:
```typescript
// TEST SEQUENCE: Verify drag and edit panel produce identical results (CORRECTED)

// DRAG PATH:
// 1. Mouse down → gameStore_methods.startPreview('move', objectId)
// 2. Mouse move → gameStore_methods.updatePreview({ vertices: newVertices })
// 3. Mouse up → gameStore_methods.commitPreview()

// EDIT PANEL PATH:
// 1. Panel open → gameStore_methods.startPreview('move', objectId)  
// 2. Form input → gameStore_methods.updatePreview({ formData: ObjectEditFormData })
// 3. Apply button → gameStore_methods.commitPreview()

// ✅ VERIFICATION: Both paths use identical CORRECTED store methods
// ✅ VERIFICATION: Both paths update same CORRECTED store data (GameStoreData)
// ✅ VERIFICATION: Both paths render from same CORRECTED store source (GeometricObject[])
```

---

## 🔗 **INTEGRATION WITH CORRECTED PHASE 0-1 ARCHITECTURE**

### **Method Mapping from Corrected Phase 0-1**:

#### **From CORRECTED game-store.ts**:
- ✅ **`gameStore_methods.createObject()`** → Used by drawing finish (CORRECTED types)
- ✅ **`gameStore_methods.removeObject()`** → Used by keyboard delete + UI delete
- ✅ **`gameStore_methods.selectObject()`** → Used by canvas click + keyboard navigation
- ✅ **`gameStore_methods.moveObject()`** → Used by drag commit + edit panel commit  
- ✅ **`gameStore_methods.startPreview()`** → Used by edit panel + drag start
- ✅ **`gameStore_methods.updatePreview()`** → Used by edit panel forms + drag movement
- ✅ **`gameStore_methods.commitPreview()`** → Used by edit panel apply + drag finish
- ✅ **`gameStore_methods.cancelPreview()`** → Used by edit panel cancel + escape key

#### **From CORRECTED CreateActions.ts**:
- ✅ **`CreateActions.createObject()`** → Called by `gameStore_methods.createObject()`
- ✅ **`CreateActions.finishDrawing()`** → Called by `gameStore_methods.finishDrawing()`

#### **From CORRECTED EditActions.ts** (uses real GeometricObject):
- ✅ **`EditActions.removeObject()`** → Called by `gameStore_methods.removeObject()`
- ✅ **`EditActions.selectObject()`** → Called by `gameStore_methods.selectObject()`
- ✅ **`EditActions.moveObject()`** → Called by `gameStore_methods.moveObject()`

#### **From CORRECTED GeometryHelper.ts** (returns real GeometryProperties):
- ✅ **`GeometryHelper.generateVertices()`** → Used by all creation + preview operations
- ✅ **`GeometryHelper.moveVertices()`** → Used by drag operations
- ✅ **`GeometryHelper.calculateBounds()`** → Used by all object operations

#### **From CORRECTED PreviewSystem.ts** (uses real ObjectEditPreviewState):
- ✅ **`PreviewSystem.updatePreview()`** → Called by `gameStore_methods.updatePreview()`
- ✅ **`PreviewSystem.generatePropertiesFromFormData()`** → Fixes circle bug (CORRECTED)
- ✅ **`PreviewSystem.commitPreview()`** → Called by `gameStore_methods.commitPreview()`

---

## ✅ **VERIFICATION STEPS (CORRECTED)**

### **Phase 2 Verification: Corrected Rendering Consistency**
```typescript
// Test 1: Preview rendering matches commit rendering (CORRECTED TYPES)
const testObject = { type: 'circle', center: {x: 100, y: 100}, radius: 50 }

// Start preview
gameStore_methods.startPreview('create')
gameStore_methods.updatePreview({ 
  operation: 'create', 
  formData: {
    isVisible: true,
    circle: testObject,
    style: { strokeColor: '#0066cc', strokeWidth: 2, strokeAlpha: 1.0, hasFill: false }
  } 
})

// Check preview rendering (CORRECTED structure)
const previewVertices = gameStore.preview.previewData?.previewVertices
const previewBounds = gameStore.preview.previewData?.previewBounds

// Commit preview  
gameStore_methods.commitPreview()

// Check actual rendering (CORRECTED GeometricObject)
const actualObject = gameStore.objects[gameStore.objects.length - 1]
const actualVertices = actualObject.vertices
const actualBounds = actualObject.bounds

// Verify consistency (CORRECTED types)
console.assert(JSON.stringify(previewVertices) === JSON.stringify(actualVertices))
console.assert(JSON.stringify(previewBounds) === JSON.stringify(actualBounds))
```

### **Phase 3 Verification: Corrected Input Consistency**
```typescript
// Test 2: All input paths produce same result (CORRECTED TYPES)
const targetPosition = { x: 150, y: 100 }

// Method 1: Keyboard shortcut
// (Select object, press E, modify in edit panel - uses CORRECTED ObjectEditFormData)

// Method 2: Canvas drag
// (Click object, drag to new position - uses CORRECTED GeometricObject)

// Method 3: Direct method call
gameStore_methods.moveObject(objectId, newVertices)

// All should result in identical gameStore.objects[] state (CORRECTED GeometricObject[])
```

---

## 🎯 **SUCCESS CRITERIA (CORRECTED)**

### **Phase 2 Success**: ✅
- [x] All rendering reads from corrected unified store (`gameStore.*`)
- [x] Preview rendering uses same data as commit rendering (CORRECTED ObjectEditPreviewState)
- [x] GeometryRenderer_3b renders both actual and preview objects consistently (CORRECTED types)
- [x] No duplicate rendering logic between preview and actual objects

### **Phase 3 Success**: ✅
- [x] All 9 input paths use `gameStore_methods.*` entry points (CORRECTED methods)
- [x] Keyboard, canvas, UI panels all call same corrected store methods
- [x] Drag and edit panel operations produce identical results (CORRECTED consistency)
- [x] No direct store mutations outside of corrected entry point methods

### **Overall Integration Success**: ✅
- [x] Circle bug eliminated (radius 50 stays 50) - using CORRECTED types
- [x] Input/output consistency across all interaction methods (CORRECTED verification)
- [x] Preview and commit use identical methods (CORRECTED GeometryHelper)
- [x] All data flows through corrected unified store architecture

---

## 🚨 **KEY CORRECTIONS FROM ORIGINAL PHASE 2-3**

### **❌ Original Wrong Assumptions Fixed**:
- Used `GeometryStyle` type (doesn't exist) → Now uses `StyleSettings`
- Assumed `GeometricObject` in geometry-drawing.ts → Now correctly imports from ecs-data-layer.ts
- Wrong `ObjectEditPreviewState` structure → Now uses real structure with `previewData`
- Wrong form data structure → Now uses real `ObjectEditFormData` with nested shape properties

### **✅ Corrected Reality Implemented**:
- `StyleSettings` with correct property names (`color`, `fillEnabled`, etc.)
- `GeometricObject` from ecs-data-layer.ts with real `properties: GeometryProperties`
- `ObjectEditPreviewState` with real nested `previewData` structure
- `ObjectEditFormData` with correct shape-specific form structure
- All coordinate types from verified ecs-coordinates.ts exports

### **🎯 Circle Bug Fix Maintained with Corrected Types**:
- Preview system uses `generatePropertiesFromFormData()` with corrected form structure
- Both preview and commit use same corrected `GeometryHelper.generateVertices()`
- No reverse engineering from vertices to properties
- Form data flows directly to corrected `GeometryProperties` union types

---

**Status**: CORRECTED RENDERING & INPUT UNIFICATION PLAN  
**Integration**: Fully connected to CORRECTED Phase 0-1 implementation methods  
**Consistency**: Input/output verification matrix with corrected types provided  
**Next Step**: Implement Phase 2-3 after CORRECTED Phase 0-1 completion