# Phase 3B: Final Comprehensive Integration Plan

## 🎯 **Complete Integration Analysis**

Based on user feedback, this plan integrates:
1. **GeometryPanel_3b.ts** analysis and fixes
2. **TextureRegistry.ts** texture extraction preservation (verbatim)
3. **Complete Phase 3B architecture** with all components

---

## 📊 **Current Status Summary**

### **✅ What We Have (60% Complete)**
- **Helper Files**: CoordinateHelper_3b.ts, CoordinateCalculations_3b.ts, GeometryHelper_3b.ts (all fixed)
- **UI Components**: LayerToggleBar_3b.ts, StorePanel_3b.ts, UIControlBar_3b.ts (all working)
- **Store System**: gameStore_3b.ts extended with geometry drawing systems
- **Canvas Foundation**: Phase3BCanvas.ts, BackgroundGridRenderer_3b.ts (working)

### **❌ What We Need (40% Missing)**
- **GeometryRenderer_3b.ts** - THE CORE RENDERER (missing)
- **GeometryInputHandler_3b.ts** - Input routing system (missing)
- **GeometryPanel_3b.ts** - Store integration fixes (needs updates)
- **TextureRegistry_3b.ts** - Texture extraction system (needs porting)
- **Integration Updates** - Canvas, store, and input routing

---

## 🔥 **COMPONENT 1: GeometryPanel_3b.ts Analysis & Fixes**

### **Current Issues in GeometryPanel_3b.ts:**
```typescript
// Lines 2-3 - WRONG store imports
import { gameStore, updateGameStore } from '../store/gameStore'

// Lines 66, 104, 181, 288, 358, 380 - WRONG store references
// All gameStore references need to be gameStore_3b
// All updateGameStore references need to be gameStore_3b_methods

// Lines 111, 120, 130, 141, 152, 164, 307, 310, 364 - WRONG method calls
// Missing methods in gameStore_3b_methods:
// - setDrawingSettings()
// - clearAllGeometricObjects()
// - getDefaultAnchor()
// - setDefaultAnchor()
```

### **Required GeometryPanel_3b.ts Fixes:**
```typescript
// app/src/ui/GeometryPanel_3b.ts - REQUIRED FIXES

// 1. FIX IMPORTS (Lines 2-3)
import { gameStore_3b, gameStore_3b_methods } from '../store/gameStore_3b'

// 2. FIX ALL STORE REFERENCES (66 occurrences)
// Replace: gameStore.geometry.selection.selectedObjectId
// With: gameStore_3b.geometry.selectedId

// Replace: gameStore.geometry.drawing.mode
// With: gameStore_3b.geometryDrawing.mode

// Replace: gameStore.geometry.drawing.settings
// With: gameStore_3b.geometryDrawing.settings

// 3. FIX ALL METHOD CALLS
// Replace: updateGameStore.setDrawingMode()
// With: gameStore_3b_methods.setDrawingMode()

// Replace: updateGameStore.clearSelection()
// With: gameStore_3b_methods.clearSelection()

// 4. ADD MISSING METHODS TO gameStore_3b_methods
// - setDrawingSettings()
// - clearAllGeometricObjects()
// - getDefaultAnchor()
// - setDefaultAnchor()
```

### **GeometryPanel_3b.ts Integration Pattern:**
```typescript
// Updated GeometryPanel_3b.ts structure
export class GeometryPanel_3b {
  private elements: Map<string, HTMLElement> = new Map()
  private isVisible: boolean = false
  
  constructor() {
    this.initializeElements()
    this.setupReactivity()
    this.setupEventHandlers()
  }
  
  private setupReactivity(): void {
    // Use precise Valtio subscriptions (like other _3b components)
    subscribe(gameStore_3b.geometryDrawing, () => {
      this.updateValues()
    })
    
    subscribe(gameStore_3b.geometry, () => {
      this.updateValues()
    })
    
    subscribe(gameStore_3b.ui, () => {
      this.updateValues()
    })
  }
  
  // Rest of the class follows the existing pattern but with corrected references
}
```

---

## 🔥 **COMPONENT 2: TextureRegistry_3b.ts (Preserved Verbatim)**

### **Critical Texture Extraction System:**
The original TextureRegistry.ts has sophisticated texture extraction logic that was difficult to implement. We need to preserve this **verbatim** with only minimal adaptations:

```typescript
// app/src/game/TextureRegistry_3b.ts - PRESERVE ORIGINAL LOGIC

import { Graphics } from 'pixi.js'
import { gameStore_3b, gameStore_3b_methods } from '../store/gameStore_3b'
import { GeometryHelper_3b } from './GeometryHelper_3b'
import type { ObjectTextureData } from '../types/geometry-drawing'

export class TextureRegistry_3b {
  private previewSize = 64 // Small preview size in pixels

  constructor() {
    // CRITICAL: NO store subscriptions - only external method calls
    console.log('TextureRegistry_3b initialized (no store subscriptions)')
  }

  /**
   * Capture texture from a Graphics object AFTER rendering is complete.
   * PRESERVED VERBATIM from original TextureRegistry.ts
   */
  public async captureObjectTexture(objectId: string): Promise<void> {
    try {
      console.log(`TextureRegistry_3b: Creating pixeloid preview for object ${objectId}`)
      
      // Find the object in the store to get its pixeloid coordinates
      const obj = this.findObjectInStore(objectId)
      if (!obj) {
        console.warn(`TextureRegistry_3b: Object ${objectId} not found in store`)
        this.setFailedTexture(objectId, 'Object not found')
        return
      }

      // Create mini pixeloid viewport preview
      const preview = await this.createPixeloidPreview(obj)
      
      // Create texture data object
      const textureData: ObjectTextureData = {
        objectId,
        base64Preview: preview,
        capturedAt: Date.now(),
        isValid: true
      }

      // Store in game store (one-way write)
      gameStore_3b_methods.setObjectTexture(objectId, textureData)
      
      console.log(`TextureRegistry_3b: Created pixeloid preview for ${objectId}`)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`TextureRegistry_3b: Failed to capture texture for object ${objectId}:`, error)
      this.setFailedTexture(objectId, errorMessage)
    }
  }

  // ALL OTHER METHODS PRESERVED VERBATIM FROM ORIGINAL
  // - createPixeloidPreview()
  // - getObjectPixeloidBounds()
  // - calculateObjectCenter()
  // - renderObjectToContext()
  // - setFailedTexture()
  // - createErrorPreview()
  // - captureMultipleTextures()
  // - removeObjectTexture()
  // - getObjectPreview()
  // - hasObjectTexture()
  // - clearCache()
  // - getStats()
  // - destroy()
}
```

### **Key Texture Extraction Features (Preserved):**
- **Mini Pixeloid Viewport**: Creates 64x64 pixel previews
- **Pixeloid-Perfect Scaling**: Maintains coordinate system accuracy
- **Canvas-based Rendering**: Independent of PIXI.js for stability
- **Error Handling**: Graceful failure with error previews
- **Batch Processing**: Multiple texture capture support
- **Memory Management**: Proper cleanup and cache management

**Note**: Single-layer architecture means no multilevel cache like before, but the core extraction logic remains intact.

---

## 🔥 **COMPONENT 3: GeometryRenderer_3b.ts (Core Missing Component)**

### **Complete GeometryRenderer_3b.ts Implementation:**
```typescript
// app/src/game/GeometryRenderer_3b.ts - BASED ON BACKUP PATTERNS

import { Graphics, Container } from 'pixi.js'
import { gameStore_3b } from '../store/gameStore_3b'
import { GeometryHelper_3b } from './GeometryHelper_3b'
import { TextureRegistry_3b } from './TextureRegistry_3b'
import { subscribe } from 'valtio'
import type { GeometricObject } from '../types/ecs-data-layer'

export class GeometryRenderer_3b {
  private mainContainer: Container = new Container()
  
  // Filter containers as render groups (like original)
  private normalContainer: Container = new Container({ isRenderGroup: true })
  private selectedContainer: Container = new Container({ isRenderGroup: true })
  
  // Individual object containers and graphics tracking (like original)
  private objectContainers: Map<string, Container> = new Map()
  private objectGraphics: Map<string, Graphics> = new Map()
  private previewGraphics: Graphics = new Graphics()
  
  // Texture extraction system
  private textureRegistry: TextureRegistry_3b
  
  constructor() {
    // Setup container hierarchy (like original)
    this.mainContainer.addChild(this.normalContainer)
    this.mainContainer.addChild(this.selectedContainer)
    this.mainContainer.addChild(this.previewGraphics)
    
    // Initialize texture registry
    this.textureRegistry = new TextureRegistry_3b()
    
    // Subscribe to selection changes (like original)
    this.subscribeToSelection()
    
    // Subscribe to geometry visibility
    this.subscribeToVisibility()
  }
  
  private subscribeToSelection(): void {
    subscribe(gameStore_3b.geometry, () => {
      this.updateSelectionFilterAssignment()
    })
  }
  
  private subscribeToVisibility(): void {
    subscribe(gameStore_3b.ui, () => {
      this.mainContainer.visible = gameStore_3b.ui.showGeometry
    })
  }
  
  // Main render method (like original)
  public render(): void {
    if (!gameStore_3b.ui.showGeometry) return
    
    try {
      const zoomFactor = gameStore_3b.cameraViewport.zoom_factor
      const samplingPos = gameStore_3b.cameraViewport.geometry_sampling_position
      
      // ECS viewport sampling (like original)
      const viewportBounds = {
        minX: samplingPos.x,
        maxX: samplingPos.x + (gameStore_3b.window.width / zoomFactor),
        minY: samplingPos.y,
        maxY: samplingPos.y + (gameStore_3b.window.height / zoomFactor)
      }
      
      // Get objects from store
      const objects = gameStore_3b.geometry.objects
      const visibleObjects = objects.filter(obj => {
        if (!obj.isVisible || !obj.metadata) return false
        return this.isObjectInViewportBounds(obj, viewportBounds)
      })
      
      // Remove objects no longer visible
      const currentObjectIds = new Set(visibleObjects.map(obj => obj.id))
      for (const [objectId, container] of this.objectContainers) {
        if (!currentObjectIds.has(objectId)) {
          container.removeFromParent()
          container.destroy()
          this.objectContainers.delete(objectId)
          this.objectGraphics.delete(objectId)
        }
      }
      
      // Render each object (like original)
      for (const obj of visibleObjects) {
        this.renderObjectDirectly(obj)
      }
      
      // Always render preview (like original)
      this.renderPreviewDirectly()
      
      // Capture textures for new objects (async)
      this.captureTexturesForNewObjects(visibleObjects)
      
    } catch (error) {
      console.error('GeometryRenderer_3b render error:', error)
    }
  }
  
  // Render object directly at fixed scale 1 (like original)
  private renderObjectDirectly(obj: GeometricObject): void {
    let objectContainer = this.objectContainers.get(obj.id)
    let graphics = this.objectGraphics.get(obj.id)
    
    if (!objectContainer) {
      objectContainer = new Container()
      graphics = new Graphics()
      objectContainer.addChild(graphics)
      
      this.objectContainers.set(obj.id, objectContainer)
      this.objectGraphics.set(obj.id, graphics)
    }

    graphics!.clear()
    graphics!.position.set(0, 0)
    
    // Render at fixed scale 1 with ECS sampling position offset (like original)
    const samplingPos = gameStore_3b.cameraViewport.geometry_sampling_position
    this.renderGeometricObjectToGraphicsECS(obj, graphics!, samplingPos)
    
    this.assignObjectToFilterContainer(obj.id, objectContainer)
  }
  
  // Render based on geometry type (like original)
  private renderGeometricObjectToGraphicsECS(obj: GeometricObject, graphics: Graphics, samplingPos: any): void {
    const zoomFactor = gameStore_3b.cameraViewport.zoom_factor
    
    // Apply object style
    graphics.strokeStyle = {
      color: obj.style?.color || 0x0066cc,
      width: (obj.style?.strokeWidth || 2) * zoomFactor,
      alpha: obj.style?.strokeAlpha || 1
    }
    
    if (obj.style?.fillColor) {
      graphics.fillStyle = {
        color: obj.style.fillColor,
        alpha: obj.style.fillAlpha || 0.5
      }
    }
    
    // Render based on type using helper functions
    switch (obj.type) {
      case 'point':
        this.renderPointECS(obj, graphics, samplingPos, zoomFactor)
        break
      case 'line':
        this.renderLineECS(obj, graphics, samplingPos, zoomFactor)
        break
      case 'circle':
        this.renderCircleECS(obj, graphics, samplingPos, zoomFactor)
        break
      case 'rectangle':
        this.renderRectangleECS(obj, graphics, samplingPos, zoomFactor)
        break
      case 'diamond':
        this.renderDiamondECS(obj, graphics, samplingPos, zoomFactor)
        break
    }
  }
  
  // Geometry type renderers (like original)
  private renderPointECS(obj: any, graphics: Graphics, samplingPos: any, zoomFactor: number): void {
    const x = (obj.vertices[0].x - samplingPos.x) * zoomFactor
    const y = (obj.vertices[0].y - samplingPos.y) * zoomFactor
    graphics.circle(x, y, 3 * zoomFactor).fill()
  }
  
  private renderLineECS(obj: any, graphics: Graphics, samplingPos: any, zoomFactor: number): void {
    if (obj.vertices.length < 2) return
    const x1 = (obj.vertices[0].x - samplingPos.x) * zoomFactor
    const y1 = (obj.vertices[0].y - samplingPos.y) * zoomFactor
    const x2 = (obj.vertices[1].x - samplingPos.x) * zoomFactor
    const y2 = (obj.vertices[1].y - samplingPos.y) * zoomFactor
    graphics.moveTo(x1, y1).lineTo(x2, y2).stroke()
  }
  
  private renderCircleECS(obj: any, graphics: Graphics, samplingPos: any, zoomFactor: number): void {
    if (obj.vertices.length < 2) return
    const centerX = (obj.vertices[0].x - samplingPos.x) * zoomFactor
    const centerY = (obj.vertices[0].y - samplingPos.y) * zoomFactor
    const radius = Math.sqrt(
      Math.pow(obj.vertices[1].x - obj.vertices[0].x, 2) + 
      Math.pow(obj.vertices[1].y - obj.vertices[0].y, 2)
    ) * zoomFactor
    graphics.circle(centerX, centerY, radius).stroke()
  }
  
  private renderRectangleECS(obj: any, graphics: Graphics, samplingPos: any, zoomFactor: number): void {
    if (obj.vertices.length < 2) return
    const x1 = (obj.vertices[0].x - samplingPos.x) * zoomFactor
    const y1 = (obj.vertices[0].y - samplingPos.y) * zoomFactor
    const x2 = (obj.vertices[1].x - samplingPos.x) * zoomFactor
    const y2 = (obj.vertices[1].y - samplingPos.y) * zoomFactor
    graphics.rect(x1, y1, x2 - x1, y2 - y1).stroke()
  }
  
  private renderDiamondECS(obj: any, graphics: Graphics, samplingPos: any, zoomFactor: number): void {
    const vertices = GeometryHelper_3b.calculateDiamondVertices(obj)
    
    const west = { x: (vertices.west.x - samplingPos.x) * zoomFactor, y: (vertices.west.y - samplingPos.y) * zoomFactor }
    const north = { x: (vertices.north.x - samplingPos.x) * zoomFactor, y: (vertices.north.y - samplingPos.y) * zoomFactor }
    const east = { x: (vertices.east.x - samplingPos.x) * zoomFactor, y: (vertices.east.y - samplingPos.y) * zoomFactor }
    const south = { x: (vertices.south.x - samplingPos.x) * zoomFactor, y: (vertices.south.y - samplingPos.y) * zoomFactor }
    
    graphics.moveTo(west.x, west.y)
          .lineTo(north.x, north.y)
          .lineTo(east.x, east.y)
          .lineTo(south.x, south.y)
          .closePath().stroke()
  }
  
  // Render preview for active drawing (like original)
  private renderPreviewDirectly(): void {
    this.previewGraphics.clear()
    
    const preview = gameStore_3b.geometryDrawing.preview
    if (!preview) return
    
    const samplingPos = gameStore_3b.cameraViewport.geometry_sampling_position
    const zoomFactor = gameStore_3b.cameraViewport.zoom_factor
    
    // Convert preview vertices to screen coordinates (like original)
    const renderVertices = preview.vertices.map(vertex => {
      const relativeX = (vertex.x - samplingPos.x) * zoomFactor
      const relativeY = (vertex.y - samplingPos.y) * zoomFactor
      return { x: relativeX, y: relativeY }
    })
    
    // Render preview with alpha
    const previewAlpha = 0.6
    this.renderPreviewByType(preview.type, renderVertices, preview.style, zoomFactor, previewAlpha)
  }
  
  // Additional methods...
  private isObjectInViewportBounds(obj: GeometricObject, viewportBounds: any): boolean {
    if (!obj.metadata) return false
    
    const objBounds = obj.metadata.bounds
    return !(objBounds.maxX < viewportBounds.minX || 
            objBounds.minX > viewportBounds.maxX ||
            objBounds.maxY < viewportBounds.minY ||
            objBounds.minY > viewportBounds.maxY)
  }
  
  private assignObjectToFilterContainer(objectId: string, objectContainer: Container): void {
    const isSelected = gameStore_3b.geometry.selectedId === objectId
    
    objectContainer.removeFromParent()
    
    if (isSelected) {
      this.selectedContainer.addChild(objectContainer)
    } else {
      this.normalContainer.addChild(objectContainer)
    }
  }
  
  private updateSelectionFilterAssignment(): void {
    for (const [objectId, container] of this.objectContainers) {
      this.assignObjectToFilterContainer(objectId, container)
    }
  }
  
  private async captureTexturesForNewObjects(visibleObjects: GeometricObject[]): Promise<void> {
    // Capture textures for objects that don't have them yet
    for (const obj of visibleObjects) {
      if (!this.textureRegistry.hasObjectTexture(obj.id)) {
        await this.textureRegistry.captureObjectTexture(obj.id)
      }
    }
  }
  
  public getContainer(): Container {
    return this.mainContainer
  }
  
  public getObjectContainer(objectId: string): Container | undefined {
    return this.objectContainers.get(objectId)
  }
  
  public getObjectGraphics(objectId: string): Graphics | undefined {
    return this.objectGraphics.get(objectId)
  }
  
  public destroy(): void {
    for (const container of this.objectContainers.values()) {
      container.destroy()
    }
    this.objectContainers.clear()
    this.objectGraphics.clear()
    this.previewGraphics.destroy()
    this.textureRegistry.destroy()
    this.mainContainer.destroy()
  }
}
```

---

## 🔥 **COMPONENT 4: GeometryInputHandler_3b.ts (Input System)**

### **Complete Input Handler Based on Original Pattern:**
```typescript
// app/src/game/GeometryInputHandler_3b.ts - BASED ON BACKUP PATTERNS

import { gameStore_3b, gameStore_3b_methods } from '../store/gameStore_3b'
import { GeometryHelper_3b } from './GeometryHelper_3b'
import { CoordinateCalculations_3b } from './CoordinateCalculations_3b'
import type { PixeloidCoordinate } from '../types/ecs-coordinates'

export class GeometryInputHandler_3b {
  // Object dragging state (like original)
  private isDragging: boolean = false
  private dragStartPosition: { x: number, y: number } | null = null
  private dragObjectId: string | null = null
  private dragObjectOriginalPosition: { x: number, y: number } | null = null
  
  // Double-click detection (like original)
  private lastClickTime: number = 0
  private doubleClickThreshold: number = 300

  constructor() {
    // Set global reference for BackgroundGridRenderer (like original)
    ;(globalThis as any).geometryInputHandler = this
    console.log('GeometryInputHandler_3b initialized')
  }

  // Handle mesh events from BackgroundGridRenderer (like original)
  public handleMeshEvent(
    eventType: 'move' | 'down' | 'up',
    vertexX: number,
    vertexY: number,
    pixeloidPos: { x: number, y: number },
    originalEvent: any
  ): void {
    console.log(`GeometryInputHandler_3b: Mesh event ${eventType} at Vertex(${vertexX}, ${vertexY})`)
    
    if (eventType === 'move') {
      if (this.isDragging) {
        this.handleObjectDragging(pixeloidPos)
      } else {
        this.handleGeometryMouseMove(pixeloidPos)
      }
    } else if (eventType === 'down') {
      if (originalEvent.button !== 0) return
      this.handleGeometryMouseDown(pixeloidPos)
    } else if (eventType === 'up') {
      if (originalEvent.button !== 0) return
      
      if (this.isDragging) {
        this.stopObjectDragging()
        return
      }
      
      this.handleGeometryMouseUp(pixeloidPos)
    }
  }

  // Handle geometry drawing on mouse down (like original)
  private handleGeometryMouseDown(pixeloidPos: { x: number, y: number }): void {
    const mode = gameStore_3b.geometryDrawing.mode
    
    if (mode === 'none') {
      this.handleObjectSelection(pixeloidPos)
      return
    }
    
    const firstPixeloidPos = { x: pixeloidPos.x, y: pixeloidPos.y }
    
    if (mode === 'point') {
      // Points: create immediately (like original)
      this.createPointWithVertices(firstPixeloidPos)
    } else {
      // Multi-step shapes: start drawing (like original)
      gameStore_3b.geometryDrawing.activeDrawing = {
        type: mode,
        firstPixeloidPos: firstPixeloidPos,
        currentPixeloidPos: null,
        isDrawing: true
      }
    }
  }

  // Handle geometry drawing on mouse up (like original)
  private handleGeometryMouseUp(pixeloidPos: { x: number, y: number }): void {
    const activeDrawing = gameStore_3b.geometryDrawing.activeDrawing
    
    if (activeDrawing.isDrawing && activeDrawing.firstPixeloidPos && activeDrawing.type) {
      const secondPixeloidPos = { x: pixeloidPos.x, y: pixeloidPos.y }
      
      // Create geometry using helper functions (like original)
      this.createGeometryWithVertices(
        activeDrawing.firstPixeloidPos,
        secondPixeloidPos,
        activeDrawing.type
      )
      
      // Clear active drawing (like original)
      this.clearActiveDrawing()
    }
  }

  // Handle geometry drawing during mouse move (like original)
  private handleGeometryMouseMove(pixeloidPos: { x: number, y: number }): void {
    const activeDrawing = gameStore_3b.geometryDrawing.activeDrawing
    
    if (activeDrawing.isDrawing && activeDrawing.firstPixeloidPos && activeDrawing.type) {
      const currentPixeloidPos = { x: pixeloidPos.x, y: pixeloidPos.y }
      
      // Update current position (like original)
      gameStore_3b.geometryDrawing.activeDrawing.currentPixeloidPos = currentPixeloidPos
      
      // Calculate preview vertices using helper functions (like original)
      const previewVertices = this.calculatePreviewVertices(
        activeDrawing.firstPixeloidPos,
        currentPixeloidPos,
        activeDrawing.type
      )
      
      // Create preview state (like original)
      gameStore_3b.geometryDrawing.preview = {
        vertices: previewVertices,
        type: activeDrawing.type,
        style: {
          color: gameStore_3b.geometryDrawing.settings.defaultColor,
          strokeWidth: gameStore_3b.geometryDrawing.settings.defaultStrokeWidth,
          strokeAlpha: gameStore_3b.geometryDrawing.settings.strokeAlpha,
          ...(gameStore_3b.geometryDrawing.settings.fillEnabled && {
            fillColor: gameStore_3b.geometryDrawing.settings.defaultFillColor,
            fillAlpha: gameStore_3b.geometryDrawing.settings.fillAlpha
          })
        },
        isPreview: true
      }
    }
  }

  // Create geometry using helper functions
  private createPointWithVertices(pixeloidPos: PixeloidCoordinate): void {
    const vertices = [pixeloidPos]
    gameStore_3b_methods.addGeometryObject('point', vertices)
  }

  private createGeometryWithVertices(
    firstPos: PixeloidCoordinate,
    secondPos: PixeloidCoordinate,
    geometryType: string
  ): void {
    const vertices = [firstPos, secondPos]
    gameStore_3b_methods.addGeometryObject(geometryType, vertices)
  }

  private calculatePreviewVertices(
    firstPos: PixeloidCoordinate,
    currentPos: PixeloidCoordinate,
    geometryType: string
  ): PixeloidCoordinate[] {
    // Use helper functions for calculations
    switch (geometryType) {
      case 'line':
        return [firstPos, currentPos]
      case 'circle':
        return [firstPos, currentPos]
      case 'rectangle':
        return [firstPos, currentPos]
      case 'diamond':
        return GeometryHelper_3b.calculateDiamondVertices({
          anchorX: firstPos.x,
          anchorY: firstPos.y,
          width: Math.abs(currentPos.x - firstPos.x),
          height: Math.abs(currentPos.y - firstPos.y)
        })
      default:
        return [firstPos, currentPos]
    }
  }

  // Object selection logic (like original)
  private handleObjectSelection(pixeloidPos: { x: number, y: number }): void {
    const currentTime = Date.now()
    const isDoubleClick = currentTime - this.lastClickTime < this.doubleClickThreshold
    this.lastClickTime = currentTime

    // Find clicked objects using geometry-specific hit testing
    const clickedObjects = gameStore_3b.geometry.objects.filter(obj => {
      if (!obj.isVisible) return false
      
      // Use GeometryHelper_3b for hit testing
      return this.isPointInsideObject(pixeloidPos, obj)
    })
    
    if (clickedObjects.length > 0) {
      const selectedObject = clickedObjects[clickedObjects.length - 1]
      const wasAlreadySelected = gameStore_3b.geometry.selectedId === selectedObject.id
      
      gameStore_3b_methods.selectObject(selectedObject.id)
      
      if (isDoubleClick && wasAlreadySelected) {
        // Open edit panel (like original)
        gameStore_3b.ui.showGeometryPanel = true
      } else if (wasAlreadySelected) {
        // Start dragging (like original)
        this.startObjectDragging(selectedObject.id, pixeloidPos)
      }
    } else {
      // Clear selection (like original)
      gameStore_3b_methods.clearSelection()
    }
  }

  // Additional methods for object dragging, hit testing, etc.
  private isPointInsideObject(pixeloidPos: { x: number, y: number }, obj: any): boolean {
    // Use GeometryHelper_3b for hit testing
    return GeometryHelper_3b.isPointInsideObject(pixeloidPos, obj)
  }

  private startObjectDragging(objectId: string, startPos: { x: number, y: number }): void {
    this.isDragging = true
    this.dragObjectId = objectId
    this.dragStartPosition = { ...startPos }
    console.log(`Started dragging object ${objectId}`)
  }

  private handleObjectDragging(pixeloidPos: { x: number, y: number }): void {
    if (!this.isDragging || !this.dragObjectId || !this.dragStartPosition) return
    
    const deltaX = pixeloidPos.x - this.dragStartPosition.x
    const deltaY = pixeloidPos.y - this.dragStartPosition.y
    
    // Update object position through store
    gameStore_3b_methods.updateObjectPosition(this.dragObjectId, deltaX, deltaY)
  }

  private stopObjectDragging(): void {
    if (this.isDragging && this.dragObjectId) {
      console.log(`Stopped dragging object ${this.dragObjectId}`)
    }
    
    this.isDragging = false
    this.dragObjectId = null
    this.dragStartPosition = null
  }

  private clearActiveDrawing(): void {
    gameStore_3b.geometryDrawing.activeDrawing = {
      type: null,
      firstPixeloidPos: null,
      currentPixeloidPos: null,
      isDrawing: false
    }
    gameStore_3b.geometryDrawing.preview = null
  }

  public destroy(): void {
    ;(globalThis as any).geometryInputHandler = null
    console.log('GeometryInputHandler_3b destroyed')
  }
}
```

---

## 🔥 **COMPONENT 5: Integration Updates**

### **Update BackgroundGridRenderer_3b.ts:**
```typescript
// app/src/game/BackgroundGridRenderer_3b.ts - ADD TO EXISTING

private setupMeshInteraction(): void {
  // ... existing mouse highlighting code ...
  
  // Add geometry input handling
  mesh.on('globalpointermove', (event) => {
    // ... existing mouse highlighting code ...
    
    // Route to geometry input handler
    const geometryInputHandler = (globalThis as any).geometryInputHandler
    if (geometryInputHandler) {
      geometryInputHandler.handleMeshEvent('move', vertexX, vertexY, pixeloidCoord, event)
    }
  })
  
  mesh.on('pointerdown', (event) => {
    // ... existing code ...
    
    // Route to geometry input handler
    const geometryInputHandler = (globalThis as any).geometryInputHandler
    if (geometryInputHandler) {
      geometryInputHandler.handleMeshEvent('down', vertexX, vertexY, pixeloidCoord, event)
    }
  })
  
  mesh.on('pointerup', (event) => {
    // ... existing code ...
    
    // Route to geometry input handler
    const geometryInputHandler = (globalThis as any).geometryInputHandler
    if (geometryInputHandler) {
      geometryInputHandler.handleMeshEvent('up', vertexX, vertexY, pixeloidCoord, event)
    }
  })
}
```

### **Update gameStore_3b.ts:**
```typescript
// app/src/store/gameStore_3b.ts - ADD TO EXISTING

export const gameStore_3b = proxy({
  // ... existing state ...
  
  // Add geometry drawing state (like original)
  geometryDrawing: {
    mode: 'none' as 'none' | 'point' | 'line' | 'circle' | 'rectangle' | 'diamond',
    activeDrawing: {
      type: null as string | null,
      firstPixeloidPos: null as { x: number, y: number } | null,
      currentPixeloidPos: null as { x: number, y: number } | null,
      isDrawing: false
    },
    preview: null as any,
    settings: {
      defaultColor: 0x0066cc,
      defaultStrokeWidth: 2,
      strokeAlpha: 1,
      fillEnabled: false,
      defaultFillColor: 0x0066cc,
      fillAlpha: 0.5
    }
  },
  
  // Add texture system
  textures: {
    objectTextures: new Map<string, any>()
  }
})

export const gameStore_3b_methods = {
  // ... existing methods ...
  
  // Add geometry methods
  addGeometryObject: (type: string, vertices: any[]) => {
    // Create object and add to store
    const obj = {
      id: Date.now().toString(),
      type,
      vertices,
      isVisible: true,
      metadata: { bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 } }
    }
    gameStore_3b.geometry.objects.push(obj)
  },
  
  selectObject: (objectId: string) => {
    gameStore_3b.geometry.selectedId = objectId
  },
  
  clearSelection: () => {
    gameStore_3b.geometry.selectedId = null
  },
  
  updateObjectPosition: (objectId: string, deltaX: number, deltaY: number) => {
    const obj = gameStore_3b.geometry.objects.find(o => o.id === objectId)
    if (obj) {
      obj.vertices.forEach(vertex => {
        vertex.x += deltaX
        vertex.y += deltaY
      })
    }
  },
  
  // Texture methods
  setObjectTexture: (objectId: string, textureData: any) => {
    gameStore_3b.textures.objectTextures.set(objectId, textureData)
  },
  
  removeObjectTexture: (objectId: string) => {
    gameStore_3b.textures.objectTextures.delete(objectId)
  },
  
  hasObjectTexture: (objectId: string) => {
    return gameStore_3b.textures.objectTextures.has(objectId)
  },
  
  // GeometryPanel methods
  setDrawingMode: (mode: string) => {
    gameStore_3b.geometryDrawing.mode = mode
  },
  
  setDrawingSettings: (settings: any) => {
    Object.assign(gameStore_3b.geometryDrawing.settings, settings)
  },
  
  clearAllGeometricObjects: () => {
    gameStore_3b.geometry.objects.length = 0
  },
  
  getDefaultAnchor: (type: string) => {
    return 'center' // Default anchor
  },
  
  setDefaultAnchor: (type: string, anchor: string) => {
    // Store anchor configuration
    console.log(`Set default anchor for ${type} to ${anchor}`)
  }
}
```

### **Update Phase3BCanvas.ts:**
```typescript
// app/src/game/Phase3BCanvas.ts - ADD GEOMETRY LAYER

import { Application, Container } from 'pixi.js'
import { BackgroundGridRenderer_3b } from './BackgroundGridRenderer_3b'
import { GeometryRenderer_3b } from './GeometryRenderer_3b'  // NEW
import { GeometryInputHandler_3b } from './GeometryInputHandler_3b'  // NEW
import { MouseHighlightShader_3b } from './MouseHighlightShader_3b'

export class Phase3BCanvas {
  private app: Application
  private backgroundGridRenderer: BackgroundGridRenderer_3b
  private geometryRenderer: GeometryRenderer_3b  // NEW
  private geometryInputHandler: GeometryInputHandler_3b  // NEW
  private mouseHighlightShader: MouseHighlightShader_3b
  
  constructor(canvas: HTMLCanvasElement) {
    this.app = new Application()
    this.app.renderer.init({ canvas, backgroundColor: 0xffffff })
    
    this.backgroundGridRenderer = new BackgroundGridRenderer_3b()
    this.geometryRenderer = new GeometryRenderer_3b()  // NEW
    this.geometryInputHandler = new GeometryInputHandler_3b()  // NEW
    this.mouseHighlightShader = new MouseHighlightShader_3b()
    
    this.setupLayers()
    this.startRenderLoop()
  }
  
  private setupLayers(): void {
    // Layer 0: Grid + Input
    this.app.stage.addChild(this.backgroundGridRenderer.getContainer())
    
    // Layer 1: Geometry (NEW)
    this.app.stage.addChild(this.geometryRenderer.getContainer())
    
    // Layer 2: Mouse Highlight
    this.app.stage.addChild(this.mouseHighlightShader.getContainer())
  }
  
  private startRenderLoop(): void {
    const render = () => {
      this.backgroundGridRenderer.render()
      this.geometryRenderer.render()  // NEW
      this.mouseHighlightShader.render()
      
      requestAnimationFrame(render)
    }
    render()
  }
  
  public getApp(): Application {
    return this.app
  }
  
  public destroy(): void {
    this.backgroundGridRenderer.destroy()
    this.geometryRenderer.destroy()  // NEW
    this.geometryInputHandler.destroy()  // NEW
    this.mouseHighlightShader.destroy()
    this.app.destroy()
  }
}
```

---

## 🎯 **Final Implementation Order**

### **1. Fix GeometryPanel_3b.ts (30 minutes)**
- Update imports to use gameStore_3b
- Fix all store references 
- Add missing methods to gameStore_3b_methods

### **2. Create TextureRegistry_3b.ts (30 minutes)**
- Port original TextureRegistry.ts verbatim
- Update imports and store references
- Test texture capture functionality

### **3. Create GeometryRenderer_3b.ts (2 hours)**
- Implement following original patterns
- Integrate TextureRegistry_3b
- Test basic geometry rendering

### **4. Create GeometryInputHandler_3b.ts (1 hour)**
- Implement following original patterns
- Integrate with BackgroundGridRenderer_3b
- Test input handling

### **5. Update Integration Points (1 hour)**
- Update BackgroundGridRenderer_3b mesh events
- Update gameStore_3b with new methods
- Update Phase3BCanvas.ts with geometry layer

### **6. Test Complete System (1 hour)**
- Test geometry creation
- Test texture extraction
- Test UI integration
- Test performance

---

## 🎉 **Success Criteria**

### **Phase 3B Complete When:**
- ✅ All 5 geometry types render correctly (point, line, circle, rectangle, diamond)
- ✅ Texture extraction system works (preserved from original)
- ✅ GeometryPanel_3b.ts controls functional
- ✅ Input handling works through mesh events
- ✅ Preview system works during drawing
- ✅ Object selection and dragging works
- ✅ Performance maintained at 60fps
- ✅ No TypeScript compilation errors

### **Architecture Validated:**
- ✅ Single-layer texture system (no multilevel cache)
- ✅ Mesh-first input handling
- ✅ ECS sampling position rendering
- ✅ Sophisticated texture extraction preserved
- ✅ Container-based rendering with filter optimization
- ✅ Proper Valtio subscription architecture

**Total Estimated Time: 6 hours**
**Status: Ready for implementation with complete architecture**
