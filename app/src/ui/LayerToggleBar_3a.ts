import { gameStore_3a, gameStore_3a_methods } from '../store/gameStore_3a'

/**
 * Phase 3A Layer Toggle Bar
 * 
 * Simplified layer controls for Phase 3A foundation:
 * - Grid layer toggle
 * - Mouse layer toggle
 * 
 * Complete isolation from old system - only uses gameStore_3a
 */
export class LayerToggleBar_3a {
  private panel: HTMLElement | null = null
  private _isVisible: boolean = false
  
  constructor() {
    this.panel = document.getElementById('layer-toggle-bar')
    this.setupEventHandlers()
    this.updateButtonStates()
    this.updateVisibility()
    console.log('LayerToggleBar_3a: Initialized Phase 3A layer toggle bar')
  }
  
  /**
   * Setup event handlers for layer toggle buttons
   */
  private setupEventHandlers(): void {
    if (!this.panel) {
      console.warn('LayerToggleBar_3a: Panel element not found')
      return
    }
    
    // Grid layer toggle
    const gridToggle = document.getElementById('toggle-layer-grid')
    if (gridToggle) {
      gridToggle.addEventListener('click', () => {
        this.toggleGrid()
      })
    } else {
      console.warn('LayerToggleBar_3a: Grid toggle button not found')
    }
    
    // Mouse layer toggle
    const mouseToggle = document.getElementById('toggle-layer-mouse')
    if (mouseToggle) {
      mouseToggle.addEventListener('click', () => {
        this.toggleMouse()
      })
    } else {
      console.warn('LayerToggleBar_3a: Mouse toggle button not found')
    }
  }
  
  /**
   * Toggle grid layer visibility
   */
  private toggleGrid(): void {
    gameStore_3a_methods.toggleGrid()
    this.updateGridButtonState()
    
    // Dispatch event for canvas layer updates
    const event = new CustomEvent('phase3a-layer-changed', {
      detail: { layer: 'grid', visible: gameStore_3a.ui.showGrid }
    })
    document.dispatchEvent(event)
    
    console.log(`LayerToggleBar_3a: Grid layer ${gameStore_3a.ui.showGrid ? 'shown' : 'hidden'}`)
  }
  
  /**
   * Toggle mouse layer visibility
   */
  private toggleMouse(): void {
    gameStore_3a_methods.toggleMouse()
    this.updateMouseButtonState()
    
    // Dispatch event for canvas layer updates
    const event = new CustomEvent('phase3a-layer-changed', {
      detail: { layer: 'mouse', visible: gameStore_3a.ui.showMouse }
    })
    document.dispatchEvent(event)
    
    console.log(`LayerToggleBar_3a: Mouse layer ${gameStore_3a.ui.showMouse ? 'shown' : 'hidden'}`)
  }
  
  /**
   * Update grid button visual state
   */
  private updateGridButtonState(): void {
    const button = document.getElementById('toggle-layer-grid')
    if (!button) return
    
    const isActive = gameStore_3a.ui.showGrid
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
      buttonText.textContent = 'Grid'
    }
    
    // Update tooltip
    button.title = `${isActive ? 'Hide' : 'Show'} Grid Layer`
  }
  
  /**
   * Update mouse button visual state
   */
  private updateMouseButtonState(): void {
    const button = document.getElementById('toggle-layer-mouse')
    if (!button) return
    
    const isActive = gameStore_3a.ui.showMouse
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
   * Update all button states
   */
  private updateButtonStates(): void {
    this.updateGridButtonState()
    this.updateMouseButtonState()
  }
  
  /**
   * Update panel visibility
   */
  private updateVisibility(): void {
    if (this.panel) {
      this.panel.style.display = this._isVisible ? 'flex' : 'none'
    }
  }
  
  /**
   * Toggle panel visibility
   */
  public toggle(): void {
    this._isVisible = !this._isVisible
    this.updateVisibility()
    console.log(`LayerToggleBar_3a: Panel ${this._isVisible ? 'shown' : 'hidden'}`)
  }
  
  /**
   * Set panel visibility
   */
  public setVisible(visible: boolean): void {
    this._isVisible = visible
    this.updateVisibility()
  }
  
  /**
   * Get panel visibility
   */
  public getVisible(): boolean {
    return this._isVisible
  }
  
  /**
   * Check if panel is visible
   */
  public isVisible(): boolean {
    return this._isVisible
  }
  
  /**
   * Get current layer states
   */
  public getLayerStates(): { grid: boolean; mouse: boolean } {
    return {
      grid: gameStore_3a.ui.showGrid,
      mouse: gameStore_3a.ui.showMouse
    }
  }
  
  /**
   * Set layer state programmatically
   */
  public setLayerState(layer: 'grid' | 'mouse', visible: boolean): void {
    if (layer === 'grid') {
      if (gameStore_3a.ui.showGrid !== visible) {
        this.toggleGrid()
      }
    } else if (layer === 'mouse') {
      if (gameStore_3a.ui.showMouse !== visible) {
        this.toggleMouse()
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
        visible: this._isVisible
      },
      buttons: {
        grid: {
          found: document.getElementById('toggle-layer-grid') !== null,
          active: gameStore_3a.ui.showGrid
        },
        mouse: {
          found: document.getElementById('toggle-layer-mouse') !== null,
          active: gameStore_3a.ui.showMouse
        }
      },
      store: {
        showGrid: gameStore_3a.ui.showGrid,
        showMouse: gameStore_3a.ui.showMouse,
        showLayerToggle: gameStore_3a.ui.showLayerToggle
      }
    }
  }
  
  /**
   * Cleanup method
   */
  public destroy(): void {
    // Clean up event listeners if needed
    console.log('LayerToggleBar_3a: Destroyed')
  }
}