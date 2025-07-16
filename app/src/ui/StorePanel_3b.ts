// app/src/ui/StorePanel_3b.ts - Updated to show mesh data
import { subscribe } from 'valtio'
import { gameStore_3b, gameStore_3b_methods } from '../store/gameStore_3b'
import {
  updateElement,
  getBooleanStatusClass,
  getBooleanStatusText,
  STATUS_COLORS
} from './handlers/UIHandlers'

/**
 * StorePanel_3b - Mesh-first Store Panel for Phase 3B
 *
 * Displays core foundation data:
 * - Game initialization status
 * - Mouse position (vertex, screen, world)
 * - Navigation offset
 * - Mesh system status with vertex data
 * - Layer controls
 */
export class StorePanel_3b {
  private elements: Map<string, HTMLElement> = new Map()
  
  constructor() {
    this.initializeElements()
    this.setupReactivity()
    this.setupEventHandlers()
  }
  
  private initializeElements(): void {
    // Get all Phase 3b elements by their IDs
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
      'checkboard-enabled',
      'mouse-highlight-color',
      'mouse-highlight-intensity'
    ]
    
    elementIds.forEach(id => {
      const element = document.getElementById(id)
      if (element) {
        this.elements.set(id, element)
      } else {
        console.warn(`StorePanel_3b: Element with id '${id}' not found`)
      }
    })
  }
  
  private setupReactivity(): void {
    // Initial state sync
    this.updateValues()
    this.updateDOMVisibility()
    
    // ✅ PRECISE SUBSCRIPTIONS - Only subscribe to relevant slices
    
    // UI-only subscription for visibility
    subscribe(gameStore_3b.ui, () => {
      this.updateDOMVisibility()
      this.updateValues()  // ✅ ADD THIS - Updates layer controls when UI state changes
    })
    
    // Data subscriptions for content updates
    subscribe(gameStore_3b.mouse, () => {
      this.updateMouseValues()
    })
    
    subscribe(gameStore_3b.navigation, () => {
      this.updateNavigationValues()
    })
    
    subscribe(gameStore_3b.mesh, () => {
      this.updateMeshValues()
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
      console.error('StorePanel_3b: store-panel element not found')
      return
    }
    
    const shouldShow = gameStore_3b.ui.showStorePanel
    const displayValue = shouldShow ? 'block' : 'none'
    
    console.log(`StorePanel_3b: Setting visibility to ${displayValue}`)
    panelElement.style.display = displayValue
  }
  
  private updateValues(): void {
    
    try {
      // Phase 3b Status
      updateElement(this.elements, 'game-initialized', 
        'true', // Game_3b initializes synchronously
        'status-active'
      )
      
      updateElement(this.elements, 'mesh-scale', 
        '1', // Always scale 1 for Phase 3b
        'status-active'
      )
      
      updateElement(this.elements, 'layers-active', 
        '2', // Grid + Mouse layers
        'status-active'
      )
      
      // ✅ MESH-FIRST MOUSE POSITION - Show all coordinate systems
      updateElement(this.elements, 'mouse-vertex',
        `${gameStore_3b.mouse.vertex.x}, ${gameStore_3b.mouse.vertex.y}`,
        STATUS_COLORS.mouse
      )
      
      updateElement(this.elements, 'mouse-screen',
        `${gameStore_3b.mouse.screen.x.toFixed(0)}, ${gameStore_3b.mouse.screen.y.toFixed(0)}`,
        STATUS_COLORS.mouse
      )
      
      updateElement(this.elements, 'mouse-world',
        `${gameStore_3b.mouse.world.x}, ${gameStore_3b.mouse.world.y}`,
        STATUS_COLORS.mouse
      )
      
      // Navigation
      updateElement(this.elements, 'navigation-offset',
        `${gameStore_3b.navigation.offset.x.toFixed(1)}, ${gameStore_3b.navigation.offset.y.toFixed(1)}`,
        STATUS_COLORS.camera
      )
      
      updateElement(this.elements, 'navigation-dragging',
        getBooleanStatusText(gameStore_3b.navigation.isDragging),
        getBooleanStatusClass(gameStore_3b.navigation.isDragging)
      )
      
      updateElement(this.elements, 'navigation-move-amount',
        gameStore_3b.navigation.moveAmount.toString(),
        'text-primary'
      )
      
      // ✅ MESH SYSTEM - Show mesh data
      updateElement(this.elements, 'mesh-ready',
        getBooleanStatusText(gameStore_3b.mesh.vertexData !== null),
        getBooleanStatusClass(gameStore_3b.mesh.vertexData !== null)
      )
      
      updateElement(this.elements, 'mesh-cell-size',
        gameStore_3b.mesh.cellSize.toString(),
        'text-primary'
      )
      
      updateElement(this.elements, 'mesh-dimensions',
        `${gameStore_3b.mesh.dimensions.width}x${gameStore_3b.mesh.dimensions.height}`,
        'text-primary'
      )
      
      updateElement(this.elements, 'mesh-vertex-count',
        gameStore_3b.mesh.vertexData ? (gameStore_3b.mesh.vertexData.length / 2).toString() : '0',
        'text-primary'
      )
      
      updateElement(this.elements, 'mesh-needs-update',
        getBooleanStatusText(gameStore_3b.mesh.needsUpdate),
        getBooleanStatusClass(gameStore_3b.mesh.needsUpdate)
      )
      
      // Layer Controls
      updateElement(this.elements, 'layer-grid-status',
        getBooleanStatusText(gameStore_3b.ui.showGrid),
        getBooleanStatusClass(gameStore_3b.ui.showGrid)
      )
      
      updateElement(this.elements, 'layer-mouse-status',
        getBooleanStatusText(gameStore_3b.ui.showMouse),
        getBooleanStatusClass(gameStore_3b.ui.showMouse)
      )
      
      updateElement(this.elements, 'checkboard-enabled',
        getBooleanStatusText(gameStore_3b.ui.enableCheckboard),
        getBooleanStatusClass(gameStore_3b.ui.enableCheckboard)
      )
      
      // Mouse Highlight Properties
      updateElement(this.elements, 'mouse-highlight-color',
        `#${gameStore_3b.ui.mouse.highlightColor.toString(16).padStart(6, '0')}`,
        'text-primary'
      )
      
      updateElement(this.elements, 'mouse-highlight-intensity',
        gameStore_3b.ui.mouse.highlightIntensity.toFixed(2),
        'text-primary'
      )
      
    } catch (error) {
      console.warn('StorePanel_3b: Error updating values:', error)
    }
  }
  
  /**
   * Update only mouse-related elements
   */
  private updateMouseValues(): void {
    try {
      updateElement(this.elements, 'mouse-vertex',
        `${gameStore_3b.mouse.vertex.x}, ${gameStore_3b.mouse.vertex.y}`,
        STATUS_COLORS.mouse
      )
      
      updateElement(this.elements, 'mouse-screen',
        `${gameStore_3b.mouse.screen.x.toFixed(0)}, ${gameStore_3b.mouse.screen.y.toFixed(0)}`,
        STATUS_COLORS.mouse
      )
      
      updateElement(this.elements, 'mouse-world',
        `${gameStore_3b.mouse.world.x}, ${gameStore_3b.mouse.world.y}`,
        STATUS_COLORS.mouse
      )
      
      updateElement(this.elements, 'mouse-highlight-color',
        `#${gameStore_3b.ui.mouse.highlightColor.toString(16).padStart(6, '0')}`,
        'text-primary'
      )
      
      updateElement(this.elements, 'mouse-highlight-intensity',
        gameStore_3b.ui.mouse.highlightIntensity.toFixed(2),
        'text-primary'
      )
    } catch (error) {
      console.warn('StorePanel_3b: Error updating mouse values:', error)
    }
  }
  
  /**
   * Update only navigation-related elements
   */
  private updateNavigationValues(): void {
    try {
      updateElement(this.elements, 'navigation-offset',
        `${gameStore_3b.navigation.offset.x.toFixed(1)}, ${gameStore_3b.navigation.offset.y.toFixed(1)}`,
        STATUS_COLORS.camera
      )
      
      updateElement(this.elements, 'navigation-dragging',
        getBooleanStatusText(gameStore_3b.navigation.isDragging),
        getBooleanStatusClass(gameStore_3b.navigation.isDragging)
      )
      
      updateElement(this.elements, 'navigation-move-amount',
        gameStore_3b.navigation.moveAmount.toString(),
        'text-primary'
      )
    } catch (error) {
      console.warn('StorePanel_3b: Error updating navigation values:', error)
    }
  }
  
  /**
   * Update only mesh-related elements
   */
  private updateMeshValues(): void {
    try {
      updateElement(this.elements, 'mesh-ready',
        getBooleanStatusText(gameStore_3b.mesh.vertexData !== null),
        getBooleanStatusClass(gameStore_3b.mesh.vertexData !== null)
      )
      
      updateElement(this.elements, 'mesh-cell-size',
        gameStore_3b.mesh.cellSize.toString(),
        'text-primary'
      )
      
      updateElement(this.elements, 'mesh-dimensions',
        `${gameStore_3b.mesh.dimensions.width}x${gameStore_3b.mesh.dimensions.height}`,
        'text-primary'
      )
      
      updateElement(this.elements, 'mesh-vertex-count',
        gameStore_3b.mesh.vertexData ? (gameStore_3b.mesh.vertexData.length / 2).toString() : '0',
        'text-primary'
      )
      
      updateElement(this.elements, 'mesh-needs-update',
        getBooleanStatusText(gameStore_3b.mesh.needsUpdate),
        getBooleanStatusClass(gameStore_3b.mesh.needsUpdate)
      )
    } catch (error) {
      console.warn('StorePanel_3b: Error updating mesh values:', error)
    }
  }
  
  /**
   * Toggle panel visibility
   */
  public toggle(): void {
    const currentState = gameStore_3b.ui.showStorePanel
    console.log(`StorePanel_3b: Toggling from ${currentState} to ${!currentState}`)
    
    // Use store method instead of local state
    gameStore_3b_methods.toggleStorePanel()
    
    // Verify state change
    console.log(`StorePanel_3b: New state is ${gameStore_3b.ui.showStorePanel}`)
  }
  
  /**
   * Set panel visibility
   */
  public setVisible(visible: boolean): void {
    // Update store state instead of local state
    gameStore_3b.ui.showStorePanel = visible
    console.log('StorePanel_3b: Set visibility to', visible)
  }
  
  /**
   * Get current visibility state
   */
  public getVisible(): boolean {
    return gameStore_3b.ui.showStorePanel
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
      isVisible: gameStore_3b.ui.showStorePanel,
      elementsFound: this.elements.size,
      storeData: {
        mouse: gameStore_3b.mouse,
        navigation: gameStore_3b.navigation,
        mesh: gameStore_3b.mesh,
        ui: gameStore_3b.ui
      }
    }
  }
  
  /**
   * Clean up resources
   */
  public destroy(): void {
    console.log('StorePanel_3b: Starting cleanup')
    this.elements.clear()
    console.log('StorePanel_3b: Cleanup complete')
  }
}