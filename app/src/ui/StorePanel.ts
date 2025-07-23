// app/src/ui/StorePanel.ts - Refactored to use unified game store
import { subscribe } from 'valtio'
import { gameStore, gameStore_methods } from '../store/game-store'
import {
  updateElement,
  getBooleanStatusClass,
  getBooleanStatusText,
  STATUS_COLORS
} from './handlers/UIHandlers'

/**
 * StorePanel - Unified Store Panel
 *
 * Displays core foundation data:
 * - Game initialization status
 * - Mouse position (vertex, screen, world)
 * - Navigation offset
 * - Mesh system status with vertex data
 * - Layer controls
 * - Selected object information
 * - Drag state information
 * 
 * ✅ Fully refactored to use unified gameStore
 * ✅ All functionality preserved from StorePanel_3b
 * ✅ Same HTML element IDs maintained
 */
export class StorePanel {
  private elements: Map<string, HTMLElement> = new Map()
  
  constructor() {
    this.initializeElements()
    this.setupReactivity()
    this.setupEventHandlers()
  }
  
  private initializeElements(): void {
    // Get all elements by their IDs - SAME AS ORIGINAL
    const elementIds = [
      'game-initialized',
      'mesh-scale',
      'layers-active',
      'mouse-vertex',
      'mouse-screen',
      'mouse-world',
      'navigation-offset',
      'navigation-dragging',
      'navigation-move-amount',
      'mesh-ready',
      'mesh-cell-size',
      'mesh-dimensions',
      'mesh-vertex-count',
      'mesh-needs-update',
      'layer-grid-status',
      'layer-mouse-status',
      'layer-geometry-status',
      'checkboard-enabled',
      'mouse-highlight-color',
      'mouse-highlight-intensity',
      'geometry-objects-count',
      'geometry-drawing-mode',
      'geometry-is-drawing',
      'geometry-preview-active',
      // Selected object testing elements
      'selected-object-id',
      'selected-object-type',
      'selected-object-pixeloid-x',
      'selected-object-pixeloid-y',
      'selected-object-vertex-x',
      'selected-object-vertex-y',
      'selected-object-screen-x',
      'selected-object-screen-y',
      'selected-object-style-color',
      'selected-object-style-stroke-width',
      'selected-object-dragging-state',
      // Drag state elements
      'drag-state-is-dragging',
      'drag-state-object-id',
      'drag-state-click-position',
      'drag-state-vertex-offsets-count',
      'drag-preview-is-active',
      'drag-preview-mouse-position',
      'drag-preview-vertices-count'
    ]
    
    elementIds.forEach(id => {
      const element = document.getElementById(id)
      if (element) {
        this.elements.set(id, element)
      } else {
        console.warn(`StorePanel: Element with id '${id}' not found`)
      }
    })
  }
  
  private setupReactivity(): void {
    // Initial state sync
    this.updateValues()
    this.updateDOMVisibility()
    
    // ✅ PRECISE SUBSCRIPTIONS - Only subscribe to relevant slices
    
    // UI-only subscription for visibility
    subscribe(gameStore.ui, () => {
      this.updateDOMVisibility()
      this.updateValues()  // Updates layer controls when UI state changes
    })
    
    // Data subscriptions for content updates
    subscribe(gameStore.mouse, () => {
      this.updateMouseValues()
    })
    
    subscribe(gameStore.navigation, () => {
      this.updateNavigationValues()
    })
    
    subscribe(gameStore.mesh, () => {
      this.updateMeshValues()
    })
    
    // ✅ UPDATED: Subscribe to root objects array instead of geometry.objects
    subscribe(gameStore.objects, () => {
      this.updateGeometryValues()
      this.updateSelectedObjectValues() // Update selection when objects change
    })
    
    subscribe(gameStore.drawing, () => {
      this.updateGeometryValues()
    })
    
    // Selection subscription
    subscribe(gameStore.selection, () => {
      this.updateSelectedObjectValues()
    })
    
    // Drag state subscriptions
    subscribe(gameStore.dragging, () => {
      this.updateDragValues()
    })
    
    subscribe(gameStore.dragPreview, () => {
      this.updateDragValues()
    })
  }
  
  private setupEventHandlers(): void {
    // Close button
    const closeBtn = document.getElementById('close-store-panel')
    closeBtn?.addEventListener('click', () => {
      this.toggle()
    })
  }
  
  private updateDOMVisibility(): void {
    const panelElement = document.getElementById('store-panel')
    
    if (!panelElement) {
      console.error('StorePanel: store-panel element not found')
      return
    }
    
    const shouldShow = gameStore.ui.showStorePanel
    const displayValue = shouldShow ? 'block' : 'none'
    
    console.log(`StorePanel: Setting visibility to ${displayValue}`)
    panelElement.style.display = displayValue
  }
  
  private updateValues(): void {
    try {
      // Phase 3b Status
      updateElement(this.elements, 'game-initialized', 
        'true', // Game initializes synchronously
        'status-active'
      )
      
      updateElement(this.elements, 'mesh-scale', 
        '1', // Always scale 1 for Phase 3b
        'status-active'
      )
      
      updateElement(this.elements, 'layers-active',
        '3', // Grid + Geometry + Mouse layers
        'status-active'
      )
      
      // ✅ MESH-FIRST MOUSE POSITION - Show all coordinate systems
      updateElement(this.elements, 'mouse-vertex',
        `${gameStore.mouse.vertex.x}, ${gameStore.mouse.vertex.y}`,
        STATUS_COLORS.mouse
      )
      
      // ✅ UPDATED: mouse.position instead of mouse.screen
      updateElement(this.elements, 'mouse-screen',
        `${gameStore.mouse.position.x.toFixed(0)}, ${gameStore.mouse.position.y.toFixed(0)}`,
        STATUS_COLORS.mouse
      )
      
      updateElement(this.elements, 'mouse-world',
        `${gameStore.mouse.world.x}, ${gameStore.mouse.world.y}`,
        STATUS_COLORS.mouse
      )
      
      // Navigation
      updateElement(this.elements, 'navigation-offset',
        `${gameStore.navigation.offset.x.toFixed(1)}, ${gameStore.navigation.offset.y.toFixed(1)}`,
        STATUS_COLORS.camera
      )
      
      updateElement(this.elements, 'navigation-dragging',
        getBooleanStatusText(gameStore.navigation.isDragging),
        getBooleanStatusClass(gameStore.navigation.isDragging)
      )
      
      updateElement(this.elements, 'navigation-move-amount',
        gameStore.navigation.moveAmount.toString(),
        'text-primary'
      )
      
      // ✅ MESH SYSTEM - Show mesh data
      updateElement(this.elements, 'mesh-ready',
        getBooleanStatusText(gameStore.mesh.vertexData !== null),
        getBooleanStatusClass(gameStore.mesh.vertexData !== null)
      )
      
      updateElement(this.elements, 'mesh-cell-size',
        gameStore.mesh.cellSize.toString(),
        'text-primary'
      )
      
      updateElement(this.elements, 'mesh-dimensions',
        gameStore.mesh.dimensions 
          ? `${gameStore.mesh.dimensions.width}x${gameStore.mesh.dimensions.height}`
          : '0x0',
        'text-primary'
      )
      
      updateElement(this.elements, 'mesh-vertex-count',
        gameStore.mesh.vertexData ? (gameStore.mesh.vertexData.length / 2).toString() : '0',
        'text-primary'
      )
      
      updateElement(this.elements, 'mesh-needs-update',
        getBooleanStatusText(gameStore.mesh.needsUpdate),
        getBooleanStatusClass(gameStore.mesh.needsUpdate)
      )
      
      // Layer Controls
      updateElement(this.elements, 'layer-grid-status',
        getBooleanStatusText(gameStore.ui.showGrid),
        getBooleanStatusClass(gameStore.ui.showGrid)
      )
      
      updateElement(this.elements, 'layer-mouse-status',
        getBooleanStatusText(gameStore.ui.showMouse),
        getBooleanStatusClass(gameStore.ui.showMouse)
      )
      
      updateElement(this.elements, 'checkboard-enabled',
        getBooleanStatusText(gameStore.ui.enableCheckboard),
        getBooleanStatusClass(gameStore.ui.enableCheckboard)
      )
      
      updateElement(this.elements, 'layer-geometry-status',
        getBooleanStatusText(gameStore.ui.showGeometry),
        getBooleanStatusClass(gameStore.ui.showGeometry)
      )
      
      // ✅ UPDATED: Geometry System Status - using root objects array
      updateElement(this.elements, 'geometry-objects-count',
        gameStore.objects.length.toString(),
        'text-primary'
      )
      
      updateElement(this.elements, 'geometry-drawing-mode',
        gameStore.drawing.mode,
        gameStore.drawing.mode === 'none' ? 'text-muted' : 'text-success'
      )
      
      updateElement(this.elements, 'geometry-is-drawing',
        getBooleanStatusText(gameStore.drawing.isDrawing),
        getBooleanStatusClass(gameStore.drawing.isDrawing)
      )
      
      // ✅ UPDATED: Using gameStore.preview instead of gameStore.drawing.preview
      updateElement(this.elements, 'geometry-preview-active',
        getBooleanStatusText(gameStore.preview.isActive),
        getBooleanStatusClass(gameStore.preview.isActive)
      )
      
      // Mouse Highlight Properties
      updateElement(this.elements, 'mouse-highlight-color',
        `#${gameStore.ui.mouse.highlightColor.toString(16).padStart(6, '0')}`,
        'text-primary'
      )
      
      updateElement(this.elements, 'mouse-highlight-intensity',
        gameStore.ui.mouse.highlightIntensity.toFixed(2),
        'text-primary'
      )
      
    } catch (error) {
      console.warn('StorePanel: Error updating values:', error)
    }
  }
  
  /**
   * Update selected object display for testing
   * ✅ UPDATED: Uses gameStore.selection.selectedId and gameStore.objects
   */
  private updateSelectedObjectValues(): void {
    try {
      const selectedId = gameStore.selection.selectedId // ✅ Changed from selectedObjectId
      const selectedObject = selectedId ?
        gameStore.objects.find(obj => obj.id === selectedId) : null // ✅ Changed from geometry.objects
      
      if (selectedObject) {
        // Object info
        updateElement(this.elements, 'selected-object-id',
          selectedId || 'none', 'text-info')
        
        updateElement(this.elements, 'selected-object-type',
          selectedObject.type, 'text-success')
        
        // Position in different coordinate systems
        const firstVertex = selectedObject.vertices[0]
        updateElement(this.elements, 'selected-object-pixeloid-x',
          firstVertex.x.toFixed(2), 'text-primary')
        
        updateElement(this.elements, 'selected-object-pixeloid-y',
          firstVertex.y.toFixed(2), 'text-primary')
        
        // Convert to vertex coordinates (subtract navigation offset)
        const vertexX = firstVertex.x - gameStore.navigation.offset.x
        const vertexY = firstVertex.y - gameStore.navigation.offset.y
        
        updateElement(this.elements, 'selected-object-vertex-x',
          vertexX.toFixed(2), STATUS_COLORS.mouse)
        
        updateElement(this.elements, 'selected-object-vertex-y',
          vertexY.toFixed(2), STATUS_COLORS.mouse)
        
        // Convert to screen coordinates
        const screenX = vertexX * gameStore.mesh.cellSize
        const screenY = vertexY * gameStore.mesh.cellSize
        
        updateElement(this.elements, 'selected-object-screen-x',
          screenX.toFixed(0), STATUS_COLORS.camera)
        
        updateElement(this.elements, 'selected-object-screen-y',
          screenY.toFixed(0), STATUS_COLORS.camera)
        
        // Style information
        updateElement(this.elements, 'selected-object-style-color',
          `#${selectedObject.style.color.toString(16).padStart(6, '0')}`, 'text-accent')
        
        updateElement(this.elements, 'selected-object-style-stroke-width',
          selectedObject.style.strokeWidth.toString(), 'text-accent')
        
        // ✅ UPDATED: Dragging state - using draggedObjectId
        const isDragging = gameStore.dragging?.draggedObjectId === selectedId
        updateElement(this.elements, 'selected-object-dragging-state',
          getBooleanStatusText(isDragging), getBooleanStatusClass(isDragging))
        
      } else {
        // No selection
        updateElement(this.elements, 'selected-object-id', 'none', 'text-muted')
        updateElement(this.elements, 'selected-object-type', 'none', 'text-muted')
        updateElement(this.elements, 'selected-object-pixeloid-x', '-', 'text-muted')
        updateElement(this.elements, 'selected-object-pixeloid-y', '-', 'text-muted')
        updateElement(this.elements, 'selected-object-vertex-x', '-', 'text-muted')
        updateElement(this.elements, 'selected-object-vertex-y', '-', 'text-muted')
        updateElement(this.elements, 'selected-object-screen-x', '-', 'text-muted')
        updateElement(this.elements, 'selected-object-screen-y', '-', 'text-muted')
        updateElement(this.elements, 'selected-object-style-color', '-', 'text-muted')
        updateElement(this.elements, 'selected-object-style-stroke-width', '-', 'text-muted')
        updateElement(this.elements, 'selected-object-dragging-state', 'false', 'status-inactive')
      }
    } catch (error) {
      console.warn('StorePanel: Error updating selected object values:', error)
    }
  }
  
  /**
   * Update only mouse-related elements
   * ✅ UPDATED: Uses mouse.position instead of mouse.screen
   */
  private updateMouseValues(): void {
    try {
      updateElement(this.elements, 'mouse-vertex',
        `${gameStore.mouse.vertex.x}, ${gameStore.mouse.vertex.y}`,
        STATUS_COLORS.mouse
      )
      
      // ✅ UPDATED: mouse.position instead of mouse.screen
      updateElement(this.elements, 'mouse-screen',
        `${gameStore.mouse.position.x.toFixed(0)}, ${gameStore.mouse.position.y.toFixed(0)}`,
        STATUS_COLORS.mouse
      )
      
      updateElement(this.elements, 'mouse-world',
        `${gameStore.mouse.world.x}, ${gameStore.mouse.world.y}`,
        STATUS_COLORS.mouse
      )
      
      updateElement(this.elements, 'mouse-highlight-color',
        `#${gameStore.ui.mouse.highlightColor.toString(16).padStart(6, '0')}`,
        'text-primary'
      )
      
      updateElement(this.elements, 'mouse-highlight-intensity',
        gameStore.ui.mouse.highlightIntensity.toFixed(2),
        'text-primary'
      )
    } catch (error) {
      console.warn('StorePanel: Error updating mouse values:', error)
    }
  }
  
  /**
   * Update only navigation-related elements
   */
  private updateNavigationValues(): void {
    try {
      updateElement(this.elements, 'navigation-offset',
        `${gameStore.navigation.offset.x.toFixed(1)}, ${gameStore.navigation.offset.y.toFixed(1)}`,
        STATUS_COLORS.camera
      )
      
      updateElement(this.elements, 'navigation-dragging',
        getBooleanStatusText(gameStore.navigation.isDragging),
        getBooleanStatusClass(gameStore.navigation.isDragging)
      )
      
      updateElement(this.elements, 'navigation-move-amount',
        gameStore.navigation.moveAmount.toString(),
        'text-primary'
      )
    } catch (error) {
      console.warn('StorePanel: Error updating navigation values:', error)
    }
  }
  
  /**
   * Update only mesh-related elements
   */
  private updateMeshValues(): void {
    try {
      updateElement(this.elements, 'mesh-ready',
        getBooleanStatusText(gameStore.mesh.vertexData !== null),
        getBooleanStatusClass(gameStore.mesh.vertexData !== null)
      )
      
      updateElement(this.elements, 'mesh-cell-size',
        gameStore.mesh.cellSize.toString(),
        'text-primary'
      )
      
      updateElement(this.elements, 'mesh-dimensions',
        gameStore.mesh.dimensions 
          ? `${gameStore.mesh.dimensions.width}x${gameStore.mesh.dimensions.height}`
          : '0x0',
        'text-primary'
      )
      
      updateElement(this.elements, 'mesh-vertex-count',
        gameStore.mesh.vertexData ? (gameStore.mesh.vertexData.length / 2).toString() : '0',
        'text-primary'
      )
      
      updateElement(this.elements, 'mesh-needs-update',
        getBooleanStatusText(gameStore.mesh.needsUpdate),
        getBooleanStatusClass(gameStore.mesh.needsUpdate)
      )
    } catch (error) {
      console.warn('StorePanel: Error updating mesh values:', error)
    }
  }
  
  /**
   * Update only geometry-related elements
   * ✅ UPDATED: Uses gameStore.objects and gameStore.preview
   */
  private updateGeometryValues(): void {
    try {
      updateElement(this.elements, 'layer-geometry-status',
        getBooleanStatusText(gameStore.ui.showGeometry),
        getBooleanStatusClass(gameStore.ui.showGeometry)
      )
      
      // ✅ UPDATED: gameStore.objects instead of geometry.objects
      updateElement(this.elements, 'geometry-objects-count',
        gameStore.objects.length.toString(),
        'text-primary'
      )
      
      updateElement(this.elements, 'geometry-drawing-mode',
        gameStore.drawing.mode,
        gameStore.drawing.mode === 'none' ? 'text-muted' : 'text-success'
      )
      
      updateElement(this.elements, 'geometry-is-drawing',
        getBooleanStatusText(gameStore.drawing.isDrawing),
        getBooleanStatusClass(gameStore.drawing.isDrawing)
      )
      
      // ✅ UPDATED: gameStore.preview instead of drawing.preview
      updateElement(this.elements, 'geometry-preview-active',
        getBooleanStatusText(gameStore.preview.isActive),
        getBooleanStatusClass(gameStore.preview.isActive)
      )
    } catch (error) {
      console.warn('StorePanel: Error updating geometry values:', error)
    }
  }
  
  /**
   * Update drag state values for debugging
   * ✅ UPDATED: Uses draggedObjectId and dragStartPosition
   */
  private updateDragValues(): void {
    try {
      // Drag state
      updateElement(this.elements, 'drag-state-is-dragging',
        getBooleanStatusText(gameStore.dragging.isDragging),
        getBooleanStatusClass(gameStore.dragging.isDragging))
      
      // ✅ UPDATED: draggedObjectId instead of dragObjectId
      updateElement(this.elements, 'drag-state-object-id',
        gameStore.dragging.draggedObjectId || 'none',
        gameStore.dragging.draggedObjectId ? 'text-info' : 'text-muted')
      
      // ✅ UPDATED: dragStartPosition instead of clickPosition
      const clickPos = gameStore.dragging.dragStartPosition
      updateElement(this.elements, 'drag-state-click-position',
        clickPos ? `${clickPos.x.toFixed(1)}, ${clickPos.y.toFixed(1)}` : 'none',
        clickPos ? 'text-primary' : 'text-muted')
      
      updateElement(this.elements, 'drag-state-vertex-offsets-count',
        gameStore.dragging.vertexOffsets.length.toString(),
        gameStore.dragging.vertexOffsets.length > 0 ? 'text-success' : 'text-muted')
      
      // Drag preview state
      updateElement(this.elements, 'drag-preview-is-active',
        getBooleanStatusText(gameStore.dragPreview.isActive),
        getBooleanStatusClass(gameStore.dragPreview.isActive))
      
      const mousePos = gameStore.dragPreview.currentMousePosition
      updateElement(this.elements, 'drag-preview-mouse-position',
        mousePos ? `${mousePos.x.toFixed(1)}, ${mousePos.y.toFixed(1)}` : 'none',
        mousePos ? 'text-warning' : 'text-muted')
      
      updateElement(this.elements, 'drag-preview-vertices-count',
        gameStore.dragPreview.previewVertices.length.toString(),
        gameStore.dragPreview.previewVertices.length > 0 ? 'text-success' : 'text-muted')
        
    } catch (error) {
      console.warn('StorePanel: Error updating drag values:', error)
    }
  }
  
  /**
   * Toggle panel visibility
   * ✅ UPDATED: Uses gameStore_methods from unified store
   */
  public toggle(): void {
    const currentState = gameStore.ui.showStorePanel
    console.log(`StorePanel: Toggling from ${currentState} to ${!currentState}`)
    
    // Use store method
    gameStore_methods.toggleStorePanel()
    
    // Verify state change
    console.log(`StorePanel: New state is ${gameStore.ui.showStorePanel}`)
  }
  
  /**
   * Set panel visibility
   */
  public setVisible(visible: boolean): void {
    // Update store state
    gameStore.ui.showStorePanel = visible
    console.log('StorePanel: Set visibility to', visible)
  }
  
  /**
   * Get current visibility state
   */
  public getVisible(): boolean {
    return gameStore.ui.showStorePanel
  }
  
  /**
   * Handle window resize
   */
  public resize(_width: number, _height: number): void {
    // Panel is positioned with fixed positioning, so no manual resize needed
    // Tailwind's responsive classes handle this automatically
  }
  
  /**
   * Get debug information
   */
  public getDebugInfo(): any {
    return {
      isVisible: gameStore.ui.showStorePanel,
      elementsFound: this.elements.size,
      storeData: {
        mouse: gameStore.mouse,
        navigation: gameStore.navigation,
        mesh: gameStore.mesh,
        objects: gameStore.objects.length,
        drawing: gameStore.drawing,
        selection: gameStore.selection,
        dragging: gameStore.dragging,
        dragPreview: gameStore.dragPreview,
        ui: gameStore.ui
      }
    }
  }
  
  /**
   * Clean up resources
   */
  public destroy(): void {
    console.log('StorePanel: Starting cleanup')
    this.elements.clear()
    console.log('StorePanel: Cleanup complete')
  }
}