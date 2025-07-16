import { subscribeKey } from 'valtio/utils'
import { gameStore_3b, gameStore_3b_methods } from '../store/gameStore_3b'

/**
 * Phase 3B Layer Toggle Bar
 *
 * Reactive layer controls following StorePanel_3b pattern:
 * - Store-driven visibility (no independent state)
 * - Fine-grained subscriptions to logical chunks
 * - Automatic synchronization with store changes
 *
 * Complete integration with gameStore_3b reactive architecture
 */
export class LayerToggleBar_3b {
  private panel: HTMLElement | null = null
  private unsubscribers: (() => void)[] = []
  
  constructor() {
    this.panel = document.getElementById('layer-toggle-bar')
    this.setupEventHandlers()
    this.setupReactivity()
    console.log('LayerToggleBar_3b: Initialized Phase 3B reactive layer toggle bar')
  }
  
  /**
   * Setup event handlers for layer toggle buttons
   */
  private setupEventHandlers(): void {
    if (!this.panel) {
      console.warn('LayerToggleBar_3b: Panel element not found')
      return
    }
    
    // Mouse layer toggle
    const mouseToggle = document.getElementById('toggle-layer-mouse')
    if (mouseToggle) {
      mouseToggle.addEventListener('click', () => {
        this.toggleMouse()
      })
    } else {
      console.warn('LayerToggleBar_3b: Mouse toggle button not found')
    }
    
    // Checkboard toggle
    const checkboardToggle = document.getElementById('toggle-checkboard')
    if (checkboardToggle) {
      checkboardToggle.addEventListener('click', () => {
        this.toggleCheckboard()
      })
    } else {
      console.warn('LayerToggleBar_3b: Checkboard toggle button not found')
    }
    
    // Geometry toggle
    const geometryToggle = document.getElementById('toggle-geometry')
    if (geometryToggle) {
      geometryToggle.addEventListener('click', () => {
        this.toggleGeometry()
      })
    } else {
      console.warn('LayerToggleBar_3b: Geometry toggle button not found')
    }
  }
  
  /**
   * Setup reactive subscriptions following StorePanel_3b pattern
   */
  private setupReactivity(): void {
    // Initial state sync
    this.updateVisibility()
    this.updateButtonStates()
    
    // ✅ Fine-grained subscription to UI state changes
    this.unsubscribers.push(
      subscribeKey(gameStore_3b.ui, 'showLayerToggle', () => {
        this.updateVisibility()
      })
    )
    
    this.unsubscribers.push(
      subscribeKey(gameStore_3b.ui, 'showMouse', () => {
        this.updateMouseButtonState()
      })
    )
    
    this.unsubscribers.push(
      subscribeKey(gameStore_3b.ui, 'enableCheckboard', () => {
        this.updateCheckboardButtonState()
      })
    )
    
    this.unsubscribers.push(
      subscribeKey(gameStore_3b.ui, 'showGeometry', () => {
        this.updateGeometryButtonState()
      })
    )
    
    console.log('LayerToggleBar_3b: Reactive subscriptions setup complete')
  }
  
  /**
   * Toggle mouse layer visibility
   */
  private toggleMouse(): void {
    console.log('LayerToggleBar_3b: toggleMouse() called - before:', gameStore_3b.ui.showMouse)
    gameStore_3b_methods.toggleMouse()
    console.log('LayerToggleBar_3b: toggleMouse() called - after:', gameStore_3b.ui.showMouse)
    
    // Dispatch event for canvas layer updates
    const event = new CustomEvent('phase3b-layer-changed', {
      detail: { layer: 'mouse', visible: gameStore_3b.ui.showMouse }
    })
    document.dispatchEvent(event)
    
    console.log(`LayerToggleBar_3b: Mouse layer ${gameStore_3b.ui.showMouse ? 'shown' : 'hidden'}`)
  }
  
  /**
   * Toggle checkboard visibility
   */
  private toggleCheckboard(): void {
    console.log('LayerToggleBar_3b: toggleCheckboard() called - before:', gameStore_3b.ui.enableCheckboard)
    gameStore_3b_methods.toggleCheckboard()
    console.log('LayerToggleBar_3b: toggleCheckboard() called - after:', gameStore_3b.ui.enableCheckboard)
    
    // Dispatch event for canvas layer updates
    const event = new CustomEvent('phase3b-layer-changed', {
      detail: { layer: 'checkboard', visible: gameStore_3b.ui.enableCheckboard }
    })
    document.dispatchEvent(event)
    
    console.log(`LayerToggleBar_3b: Checkboard ${gameStore_3b.ui.enableCheckboard ? 'enabled' : 'disabled'}`)
  }
  
  /**
   * Toggle geometry layer visibility
   */
  private toggleGeometry(): void {
    console.log('LayerToggleBar_3b: toggleGeometry() called - before:', gameStore_3b.ui.showGeometry)
    gameStore_3b_methods.toggleGeometry()
    console.log('LayerToggleBar_3b: toggleGeometry() called - after:', gameStore_3b.ui.showGeometry)
    
    // Dispatch event for canvas layer updates
    const event = new CustomEvent('phase3b-layer-changed', {
      detail: { layer: 'geometry', visible: gameStore_3b.ui.showGeometry }
    })
    document.dispatchEvent(event)
    
    console.log(`LayerToggleBar_3b: Geometry layer ${gameStore_3b.ui.showGeometry ? 'shown' : 'hidden'}`)
  }
  
  /**
   * Update mouse button visual state
   */
  private updateMouseButtonState(): void {
    const button = document.getElementById('toggle-layer-mouse')
    if (!button) return
    
    const isActive = gameStore_3b.ui.showMouse
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
   */
  private updateCheckboardButtonState(): void {
    const button = document.getElementById('toggle-checkboard')
    if (!button) return
    
    const isActive = gameStore_3b.ui.enableCheckboard
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
   */
  private updateGeometryButtonState(): void {
    const button = document.getElementById('toggle-geometry')
    if (!button) return
    
    const isActive = gameStore_3b.ui.showGeometry
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
   */
  private updateVisibility(): void {
    const isVisible = gameStore_3b.ui.showLayerToggle
    if (this.panel) {
      this.panel.style.display = isVisible ? 'flex' : 'none'
    }
  }
  
  /**
   * Toggle panel visibility (use store methods)
   */
  public toggle(): void {
    gameStore_3b_methods.toggleLayerToggle()
    console.log(`LayerToggleBar_3b: Panel ${gameStore_3b.ui.showLayerToggle ? 'shown' : 'hidden'}`)
  }
  
  /**
   * Set panel visibility (use store state)
   */
  public setVisible(visible: boolean): void {
    gameStore_3b.ui.showLayerToggle = visible
    console.log('LayerToggleBar_3b: Set visibility to', visible)
  }
  
  /**
   * Get panel visibility (from store state)
   */
  public getVisible(): boolean {
    return gameStore_3b.ui.showLayerToggle
  }
  
  /**
   * Check if panel is visible (from store state)
   */
  public isVisible(): boolean {
    return gameStore_3b.ui.showLayerToggle
  }
  
  /**
   * Get current layer states
   */
  public getLayerStates(): { mouse: boolean; checkboard: boolean; geometry: boolean } {
    return {
      mouse: gameStore_3b.ui.showMouse,
      checkboard: gameStore_3b.ui.enableCheckboard,
      geometry: gameStore_3b.ui.showGeometry
    }
  }
  
  /**
   * Set layer state programmatically
   */
  public setLayerState(layer: 'mouse' | 'checkboard' | 'geometry', visible: boolean): void {
    if (layer === 'mouse') {
      if (gameStore_3b.ui.showMouse !== visible) {
        this.toggleMouse()
      }
    } else if (layer === 'checkboard') {
      if (gameStore_3b.ui.enableCheckboard !== visible) {
        this.toggleCheckboard()
      }
    } else if (layer === 'geometry') {
      if (gameStore_3b.ui.showGeometry !== visible) {
        this.toggleGeometry()
      }
    }
  }
  
  /**
   * Get debug information
   */
  public getDebugInfo(): any {
    return {
      panel: {
        found: this.panel !== null,
        visible: gameStore_3b.ui.showLayerToggle
      },
      buttons: {
        mouse: {
          found: document.getElementById('toggle-layer-mouse') !== null,
          active: gameStore_3b.ui.showMouse
        },
        checkboard: {
          found: document.getElementById('toggle-checkboard') !== null,
          active: gameStore_3b.ui.enableCheckboard
        },
        geometry: {
          found: document.getElementById('toggle-geometry') !== null,
          active: gameStore_3b.ui.showGeometry
        }
      },
      store: {
        showMouse: gameStore_3b.ui.showMouse,
        enableCheckboard: gameStore_3b.ui.enableCheckboard,
        showGeometry: gameStore_3b.ui.showGeometry,
        showLayerToggle: gameStore_3b.ui.showLayerToggle
      }
    }
  }
  
  /**
   * Cleanup method
   */
  public destroy(): void {
    // Clean up subscriptions to prevent memory leaks
    this.unsubscribers.forEach(unsubscribe => unsubscribe())
    this.unsubscribers = []
    
    console.log('LayerToggleBar_3b: Destroyed with proper subscription cleanup')
  }
}