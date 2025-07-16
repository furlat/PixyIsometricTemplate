// app/src/ui/StorePanel_3a.ts - Updated to show mesh data
import { subscribe } from 'valtio'
import { gameStore_3a, gameStore_3a_methods } from '../store/gameStore_3a'
import {
  updateElement,
  getBooleanStatusClass,
  getBooleanStatusText,
  STATUS_COLORS
} from './handlers/UIHandlers'

/**
 * StorePanel_3a - Mesh-first Store Panel for Phase 3A
 * 
 * Displays core foundation data:
 * - Game initialization status
 * - Mouse position (vertex, screen, world)
 * - Navigation offset
 * - Mesh system status with vertex data
 * - Layer controls
 */
export class StorePanel_3a {
  private elements: Map<string, HTMLElement> = new Map()
  
  constructor() {
    this.initializeElements()
    this.setupReactivity()
    this.setupEventHandlers()
  }
  
  private initializeElements(): void {
    // Get all Phase 3A elements by their IDs
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
        console.warn(`StorePanel_3a: Element with id '${id}' not found`)
      }
    })
  }
  
  private setupReactivity(): void {
    // Initial state sync
    this.updateValues()
    this.updateDOMVisibility()
    
    // ✅ PRECISE SUBSCRIPTIONS - Only subscribe to relevant slices
    
    // UI-only subscription for visibility
    subscribe(gameStore_3a.ui, () => {
      this.updateDOMVisibility()
    })
    
    // Data subscriptions for content updates
    subscribe(gameStore_3a.mouse, () => {
      this.updateMouseValues()
    })
    
    subscribe(gameStore_3a.navigation, () => {
      this.updateNavigationValues()
    })
    
    subscribe(gameStore_3a.mesh, () => {
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
      console.error('StorePanel_3a: store-panel element not found')
      return
    }
    
    const shouldShow = gameStore_3a.ui.showStorePanel
    const displayValue = shouldShow ? 'block' : 'none'
    
    console.log(`StorePanel_3a: Setting visibility to ${displayValue}`)
    panelElement.style.display = displayValue
  }
  
  private updateValues(): void {
    
    try {
      // Phase 3A Status
      updateElement(this.elements, 'game-initialized', 
        'true', // Game_3a initializes synchronously
        'status-active'
      )
      
      updateElement(this.elements, 'mesh-scale', 
        '1', // Always scale 1 for Phase 3A
        'status-active'
      )
      
      updateElement(this.elements, 'layers-active', 
        '2', // Grid + Mouse layers
        'status-active'
      )
      
      // ✅ MESH-FIRST MOUSE POSITION - Show all coordinate systems
      updateElement(this.elements, 'mouse-vertex',
        `${gameStore_3a.mouse.vertex.x}, ${gameStore_3a.mouse.vertex.y}`,
        STATUS_COLORS.mouse
      )
      
      updateElement(this.elements, 'mouse-screen',
        `${gameStore_3a.mouse.screen.x.toFixed(0)}, ${gameStore_3a.mouse.screen.y.toFixed(0)}`,
        STATUS_COLORS.mouse
      )
      
      updateElement(this.elements, 'mouse-world',
        `${gameStore_3a.mouse.world.x}, ${gameStore_3a.mouse.world.y}`,
        STATUS_COLORS.mouse
      )
      
      // Navigation
      updateElement(this.elements, 'navigation-offset',
        `${gameStore_3a.navigation.offset.x.toFixed(1)}, ${gameStore_3a.navigation.offset.y.toFixed(1)}`,
        STATUS_COLORS.camera
      )
      
      updateElement(this.elements, 'navigation-dragging',
        getBooleanStatusText(gameStore_3a.navigation.isDragging),
        getBooleanStatusClass(gameStore_3a.navigation.isDragging)
      )
      
      updateElement(this.elements, 'navigation-move-amount',
        gameStore_3a.navigation.moveAmount.toString(),
        'text-primary'
      )
      
      // ✅ MESH SYSTEM - Show mesh data
      updateElement(this.elements, 'mesh-ready',
        getBooleanStatusText(gameStore_3a.mesh.vertexData !== null),
        getBooleanStatusClass(gameStore_3a.mesh.vertexData !== null)
      )
      
      updateElement(this.elements, 'mesh-cell-size',
        gameStore_3a.mesh.cellSize.toString(),
        'text-primary'
      )
      
      updateElement(this.elements, 'mesh-dimensions',
        `${gameStore_3a.mesh.dimensions.width}x${gameStore_3a.mesh.dimensions.height}`,
        'text-primary'
      )
      
      updateElement(this.elements, 'mesh-vertex-count',
        gameStore_3a.mesh.vertexData ? (gameStore_3a.mesh.vertexData.length / 2).toString() : '0',
        'text-primary'
      )
      
      updateElement(this.elements, 'mesh-needs-update',
        getBooleanStatusText(gameStore_3a.mesh.needsUpdate),
        getBooleanStatusClass(gameStore_3a.mesh.needsUpdate)
      )
      
      // Layer Controls
      updateElement(this.elements, 'layer-grid-status',
        getBooleanStatusText(gameStore_3a.ui.showGrid),
        getBooleanStatusClass(gameStore_3a.ui.showGrid)
      )
      
      updateElement(this.elements, 'layer-mouse-status',
        getBooleanStatusText(gameStore_3a.ui.showMouse),
        getBooleanStatusClass(gameStore_3a.ui.showMouse)
      )
      
      updateElement(this.elements, 'checkboard-enabled',
        getBooleanStatusText(gameStore_3a.ui.enableCheckboard),
        getBooleanStatusClass(gameStore_3a.ui.enableCheckboard)
      )
      
      // Mouse Highlight Properties
      updateElement(this.elements, 'mouse-highlight-color',
        `#${gameStore_3a.ui.mouse.highlightColor.toString(16).padStart(6, '0')}`,
        'text-primary'
      )
      
      updateElement(this.elements, 'mouse-highlight-intensity',
        gameStore_3a.ui.mouse.highlightIntensity.toFixed(2),
        'text-primary'
      )
      
    } catch (error) {
      console.warn('StorePanel_3a: Error updating values:', error)
    }
  }
  
  /**
   * Update only mouse-related elements
   */
  private updateMouseValues(): void {
    try {
      updateElement(this.elements, 'mouse-vertex',
        `${gameStore_3a.mouse.vertex.x}, ${gameStore_3a.mouse.vertex.y}`,
        STATUS_COLORS.mouse
      )
      
      updateElement(this.elements, 'mouse-screen',
        `${gameStore_3a.mouse.screen.x.toFixed(0)}, ${gameStore_3a.mouse.screen.y.toFixed(0)}`,
        STATUS_COLORS.mouse
      )
      
      updateElement(this.elements, 'mouse-world',
        `${gameStore_3a.mouse.world.x}, ${gameStore_3a.mouse.world.y}`,
        STATUS_COLORS.mouse
      )
      
      updateElement(this.elements, 'mouse-highlight-color',
        `#${gameStore_3a.ui.mouse.highlightColor.toString(16).padStart(6, '0')}`,
        'text-primary'
      )
      
      updateElement(this.elements, 'mouse-highlight-intensity',
        gameStore_3a.ui.mouse.highlightIntensity.toFixed(2),
        'text-primary'
      )
    } catch (error) {
      console.warn('StorePanel_3a: Error updating mouse values:', error)
    }
  }
  
  /**
   * Update only navigation-related elements
   */
  private updateNavigationValues(): void {
    try {
      updateElement(this.elements, 'navigation-offset',
        `${gameStore_3a.navigation.offset.x.toFixed(1)}, ${gameStore_3a.navigation.offset.y.toFixed(1)}`,
        STATUS_COLORS.camera
      )
      
      updateElement(this.elements, 'navigation-dragging',
        getBooleanStatusText(gameStore_3a.navigation.isDragging),
        getBooleanStatusClass(gameStore_3a.navigation.isDragging)
      )
      
      updateElement(this.elements, 'navigation-move-amount',
        gameStore_3a.navigation.moveAmount.toString(),
        'text-primary'
      )
    } catch (error) {
      console.warn('StorePanel_3a: Error updating navigation values:', error)
    }
  }
  
  /**
   * Update only mesh-related elements
   */
  private updateMeshValues(): void {
    try {
      updateElement(this.elements, 'mesh-ready',
        getBooleanStatusText(gameStore_3a.mesh.vertexData !== null),
        getBooleanStatusClass(gameStore_3a.mesh.vertexData !== null)
      )
      
      updateElement(this.elements, 'mesh-cell-size',
        gameStore_3a.mesh.cellSize.toString(),
        'text-primary'
      )
      
      updateElement(this.elements, 'mesh-dimensions',
        `${gameStore_3a.mesh.dimensions.width}x${gameStore_3a.mesh.dimensions.height}`,
        'text-primary'
      )
      
      updateElement(this.elements, 'mesh-vertex-count',
        gameStore_3a.mesh.vertexData ? (gameStore_3a.mesh.vertexData.length / 2).toString() : '0',
        'text-primary'
      )
      
      updateElement(this.elements, 'mesh-needs-update',
        getBooleanStatusText(gameStore_3a.mesh.needsUpdate),
        getBooleanStatusClass(gameStore_3a.mesh.needsUpdate)
      )
    } catch (error) {
      console.warn('StorePanel_3a: Error updating mesh values:', error)
    }
  }
  
  /**
   * Toggle panel visibility
   */
  public toggle(): void {
    const currentState = gameStore_3a.ui.showStorePanel
    console.log(`StorePanel_3a: Toggling from ${currentState} to ${!currentState}`)
    
    // Use store method instead of local state
    gameStore_3a_methods.toggleStorePanel()
    
    // Verify state change
    console.log(`StorePanel_3a: New state is ${gameStore_3a.ui.showStorePanel}`)
  }
  
  /**
   * Set panel visibility
   */
  public setVisible(visible: boolean): void {
    // Update store state instead of local state
    gameStore_3a.ui.showStorePanel = visible
    console.log('StorePanel_3a: Set visibility to', visible)
  }
  
  /**
   * Get current visibility state
   */
  public getVisible(): boolean {
    return gameStore_3a.ui.showStorePanel
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
      isVisible: gameStore_3a.ui.showStorePanel,
      elementsFound: this.elements.size,
      storeData: {
        mouse: gameStore_3a.mouse,
        navigation: gameStore_3a.navigation,
        mesh: gameStore_3a.mesh,
        ui: gameStore_3a.ui
      }
    }
  }
  
  /**
   * Clean up resources
   */
  public destroy(): void {
    console.log('StorePanel_3a: Starting cleanup')
    this.elements.clear()
    console.log('StorePanel_3a: Cleanup complete')
  }
}