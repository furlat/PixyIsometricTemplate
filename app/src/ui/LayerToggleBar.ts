// app/src/ui/LayerToggleBar.ts - Refactored to use unified game store
import { subscribeKey } from 'valtio/utils'
import { gameStore, gameStore_methods } from '../store/game-store'

/**
 * LayerToggleBar - Layer Toggle Controls
 *
 * Reactive layer controls:
 * - Store-driven visibility (no independent state)
 * - Fine-grained subscriptions to logical chunks
 * - Automatic synchronization with store changes
 * - Dispatches custom events for canvas layer updates
 *
 * ✅ Fully refactored to use unified gameStore
 * ✅ All functionality preserved from LayerToggleBar_3b
 * ✅ Same HTML element IDs maintained
 * ✅ Same event dispatch system
 */
export class LayerToggleBar {
  private panel: HTMLElement | null = null
  private unsubscribers: (() => void)[] = []
  
  constructor() {
    this.panel = document.getElementById('layer-toggle-bar')
    this.setupEventHandlers()
    this.setupReactivity()
    console.log('LayerToggleBar: Initialized reactive layer toggle bar')
  }
  
  /**
   * Setup event handlers for layer toggle buttons
   */
  private setupEventHandlers(): void {
    if (!this.panel) {
      console.warn('LayerToggleBar: Panel element not found')
      return
    }
    
    // Mouse layer toggle
    const mouseToggle = document.getElementById('toggle-layer-mouse')
    if (mouseToggle) {
      mouseToggle.addEventListener('click', () => {
        this.toggleMouse()
      })
    } else {
      console.warn('LayerToggleBar: Mouse toggle button not found')
    }
    
    // Checkboard toggle
    const checkboardToggle = document.getElementById('toggle-checkboard')
    if (checkboardToggle) {
      checkboardToggle.addEventListener('click', () => {
        this.toggleCheckboard()
      })
    } else {
      console.warn('LayerToggleBar: Checkboard toggle button not found')
    }
    
    // Geometry toggle
    const geometryToggle = document.getElementById('toggle-geometry')
    if (geometryToggle) {
      geometryToggle.addEventListener('click', () => {
        this.toggleGeometry()
      })
    } else {
      console.warn('LayerToggleBar: Geometry toggle button not found')
    }
  }
  
  /**
   * Setup reactive subscriptions
   * ✅ UPDATED: Using unified gameStore with subscribeKey
   */
  private setupReactivity(): void {
    // Initial state sync
    this.updateVisibility()
    this.updateButtonStates()
    
    // ✅ Fine-grained subscription to UI state changes
    this.unsubscribers.push(
      subscribeKey(gameStore.ui, 'showLayerToggle', () => {
        this.updateVisibility()
      })
    )
    
    this.unsubscribers.push(
      subscribeKey(gameStore.ui, 'showMouse', () => {
        this.updateMouseButtonState()
      })
    )
    
    this.unsubscribers.push(
      subscribeKey(gameStore.ui, 'enableCheckboard', () => {
        this.updateCheckboardButtonState()
      })
    )
    
    this.unsubscribers.push(
      subscribeKey(gameStore.ui, 'showGeometry', () => {
        this.updateGeometryButtonState()
      })
    )
    
    console.log('LayerToggleBar: Reactive subscriptions setup complete')
  }
  
  /**
   * Toggle mouse layer visibility
   * ✅ UPDATED: Using gameStore_methods from unified store
   */
  private toggleMouse(): void {
    console.log('LayerToggleBar: toggleMouse() called - before:', gameStore.ui.showMouse)
    gameStore_methods.toggleMouse()
    console.log('LayerToggleBar: toggleMouse() called - after:', gameStore.ui.showMouse)
    
    // Dispatch event for canvas layer updates
    const event = new CustomEvent('phase3b-layer-changed', {
      detail: { layer: 'mouse', visible: gameStore.ui.showMouse }
    })
    document.dispatchEvent(event)
    
    console.log(`LayerToggleBar: Mouse layer ${gameStore.ui.showMouse ? 'shown' : 'hidden'}`)
  }
  
  /**
   * Toggle checkboard visibility
   * ✅ UPDATED: Using gameStore_methods from unified store
   */
  private toggleCheckboard(): void {
    console.log('LayerToggleBar: toggleCheckboard() called - before:', gameStore.ui.enableCheckboard)
    gameStore_methods.toggleCheckboard()
    console.log('LayerToggleBar: toggleCheckboard() called - after:', gameStore.ui.enableCheckboard)
    
    // Dispatch event for canvas layer updates
    const event = new CustomEvent('phase3b-layer-changed', {
      detail: { layer: 'checkboard', visible: gameStore.ui.enableCheckboard }
    })
    document.dispatchEvent(event)
    
    console.log(`LayerToggleBar: Checkboard ${gameStore.ui.enableCheckboard ? 'enabled' : 'disabled'}`)
  }
  
  /**
   * Toggle geometry layer visibility
   * ✅ UPDATED: Using gameStore_methods from unified store
   */
  private toggleGeometry(): void {
    console.log('LayerToggleBar: toggleGeometry() called - before:', gameStore.ui.showGeometry)
    gameStore_methods.toggleGeometry()
    console.log('LayerToggleBar: toggleGeometry() called - after:', gameStore.ui.showGeometry)
    
    // Dispatch event for canvas layer updates
    const event = new CustomEvent('phase3b-layer-changed', {
      detail: { layer: 'geometry', visible: gameStore.ui.showGeometry }
    })
    document.dispatchEvent(event)
    
    console.log(`LayerToggleBar: Geometry layer ${gameStore.ui.showGeometry ? 'shown' : 'hidden'}`)
  }
  
  /**
   * Update mouse button visual state
   * ✅ Preserved exact visual logic from original
   */
  private updateMouseButtonState(): void {
    const button = document.getElementById('toggle-layer-mouse')
    if (!button) return
    
    const isActive = gameStore.ui.showMouse
    const baseClasses = ['btn', 'btn-sm', 'rounded-full']
    
    // Reset button classes
    button.className = baseClasses.join(' ')
    
    if (isActive) {
      button.classList.add('btn-accent')
    } else {
      button.classList.add('btn-outline')
    }
    
    // Update button text
    const buttonText = button.querySelector('.button-text')
    if (buttonText) {
      buttonText.textContent = 'Mouse'
    }
    
    // Update tooltip
    button.title = `${isActive ? 'Hide' : 'Show'} Mouse Layer`
  }
  
  /**
   * Update checkboard button visual state
   * ✅ Preserved exact visual logic from original
   */
  private updateCheckboardButtonState(): void {
    const button = document.getElementById('toggle-checkboard')
    if (!button) return
    
    const isActive = gameStore.ui.enableCheckboard
    const baseClasses = ['btn', 'btn-sm', 'rounded-full']
    
    // Reset button classes
    button.className = baseClasses.join(' ')
    
    if (isActive) {
      button.classList.add('btn-warning')
    } else {
      button.classList.add('btn-outline')
    }
    
    // Update button text
    const buttonText = button.querySelector('.button-text')
    if (buttonText) {
      buttonText.textContent = 'Checkboard'
    }
    
    // Update tooltip
    button.title = `${isActive ? 'Hide' : 'Show'} Checkboard Pattern`
  }
  
  /**
   * Update geometry button visual state
   * ✅ Preserved exact visual logic from original
   */
  private updateGeometryButtonState(): void {
    const button = document.getElementById('toggle-geometry')
    if (!button) return
    
    const isActive = gameStore.ui.showGeometry
    const baseClasses = ['btn', 'btn-sm', 'rounded-full']
    
    // Reset button classes
    button.className = baseClasses.join(' ')
    
    if (isActive) {
      button.classList.add('btn-success')
    } else {
      button.classList.add('btn-outline')
    }
    
    // Update button text
    const buttonText = button.querySelector('.button-text')
    if (buttonText) {
      buttonText.textContent = 'Geometry'
    }
    
    // Update tooltip
    button.title = `${isActive ? 'Hide' : 'Show'} Geometry Layer`
  }
  
  /**
   * Update all button states
   */
  private updateButtonStates(): void {
    this.updateMouseButtonState()
    this.updateCheckboardButtonState()
    this.updateGeometryButtonState()
  }
  
  /**
   * Update panel visibility (reactive to store state)
   * ✅ UPDATED: Using unified gameStore
   */
  private updateVisibility(): void {
    const isVisible = gameStore.ui.showLayerToggle
    if (this.panel) {
      this.panel.style.display = isVisible ? 'flex' : 'none'
    }
  }
  
  /**
   * Toggle panel visibility
   * ✅ UPDATED: Using gameStore_methods from unified store
   */
  public toggle(): void {
    gameStore_methods.toggleLayerToggle()
    console.log(`LayerToggleBar: Panel ${gameStore.ui.showLayerToggle ? 'shown' : 'hidden'}`)
  }
  
  /**
   * Set panel visibility
   * ✅ UPDATED: Direct store state update
   */
  public setVisible(visible: boolean): void {
    gameStore.ui.showLayerToggle = visible
    console.log('LayerToggleBar: Set visibility to', visible)
  }
  
  /**
   * Get panel visibility
   * ✅ UPDATED: From unified gameStore
   */
  public getVisible(): boolean {
    return gameStore.ui.showLayerToggle
  }
  
  /**
   * Check if panel is visible
   * ✅ UPDATED: From unified gameStore
   */
  public isVisible(): boolean {
    return gameStore.ui.showLayerToggle
  }
  
  /**
   * Get current layer states
   * ✅ UPDATED: From unified gameStore
   */
  public getLayerStates(): { mouse: boolean; checkboard: boolean; geometry: boolean } {
    return {
      mouse: gameStore.ui.showMouse,
      checkboard: gameStore.ui.enableCheckboard,
      geometry: gameStore.ui.showGeometry
    }
  }
  
  /**
   * Set layer state programmatically
   * ✅ Preserved exact logic from original
   */
  public setLayerState(layer: 'mouse' | 'checkboard' | 'geometry', visible: boolean): void {
    if (layer === 'mouse') {
      if (gameStore.ui.showMouse !== visible) {
        this.toggleMouse()
      }
    } else if (layer === 'checkboard') {
      if (gameStore.ui.enableCheckboard !== visible) {
        this.toggleCheckboard()
      }
    } else if (layer === 'geometry') {
      if (gameStore.ui.showGeometry !== visible) {
        this.toggleGeometry()
      }
    }
  }
  
  /**
   * Get debug information
   * ✅ UPDATED: Using unified gameStore
   */
  public getDebugInfo(): any {
    return {
      panel: {
        found: this.panel !== null,
        visible: gameStore.ui.showLayerToggle
      },
      buttons: {
        mouse: {
          found: document.getElementById('toggle-layer-mouse') !== null,
          active: gameStore.ui.showMouse
        },
        checkboard: {
          found: document.getElementById('toggle-checkboard') !== null,
          active: gameStore.ui.enableCheckboard
        },
        geometry: {
          found: document.getElementById('toggle-geometry') !== null,
          active: gameStore.ui.showGeometry
        }
      },
      store: {
        showMouse: gameStore.ui.showMouse,
        enableCheckboard: gameStore.ui.enableCheckboard,
        showGeometry: gameStore.ui.showGeometry,
        showLayerToggle: gameStore.ui.showLayerToggle
      }
    }
  }
  
  /**
   * Cleanup method
   * ✅ Proper cleanup of subscriptions
   */
  public destroy(): void {
    // Clean up subscriptions to prevent memory leaks
    this.unsubscribers.forEach(unsubscribe => unsubscribe())
    this.unsubscribers = []
    
    console.log('LayerToggleBar: Destroyed with proper subscription cleanup')
  }
}