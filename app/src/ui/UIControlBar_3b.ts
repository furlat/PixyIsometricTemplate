import { StorePanel_3a } from './StorePanel_3a'
import { gameStore_3a, gameStore_3a_methods } from '../store/gameStore_3a'

/**
 * Phase 3A UI Control Bar
 * 
 * Simplified control bar with only essential Phase 3A buttons:
 * - Store panel toggle
 * - Layer toggle bar
 * - Keyboard shortcuts (F1, F2)
 * 
 * Complete isolation from old system - only uses gameStore_3a
 */
export class UIControlBar_3a {
  private storePanel: StorePanel_3a | null = null
  private layerToggleBar: { toggle: () => void; isVisible: () => boolean } | null = null
  
  constructor() {
    this.setupEventListeners()
    this.setupKeyboardShortcuts()
    console.log('UIControlBar_3a: Initialized Phase 3A control bar')
  }
  
  /**
   * Setup event listeners for control bar buttons
   */
  private setupEventListeners(): void {
    // Store panel toggle button
    const storePanelToggle = document.getElementById('toggle-store-panel')
    if (storePanelToggle) {
      storePanelToggle.addEventListener('click', () => {
        this.toggleStorePanel()
      })
    } else {
      console.warn('UIControlBar_3a: Store panel toggle button not found')
    }
    
    // Layer toggle bar button
    const layerToggle = document.getElementById('toggle-layers')
    if (layerToggle) {
      layerToggle.addEventListener('click', () => {
        this.toggleLayerBar()
      })
    } else {
      console.warn('UIControlBar_3a: Layer toggle button not found')
    }
  }
  
  /**
   * Setup keyboard shortcuts for Phase 3A
   */
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'F1') {
        this.toggleStorePanel()
        event.preventDefault()
      }
      if (event.key === 'F2') {
        this.toggleLayerBar()
        event.preventDefault()
      }
    })
  }
  
  /**
   * Register store panel with the control bar
   */
  public registerStorePanel(storePanel: StorePanel_3a): void {
    this.storePanel = storePanel
    this.updateStorePanelButton()
    console.log('UIControlBar_3a: Registered store panel')
  }
  
  /**
   * Register layer toggle bar with the control bar
   */
  public registerLayerToggleBar(layerToggleBar: { toggle: () => void; isVisible: () => boolean }): void {
    this.layerToggleBar = layerToggleBar
    this.updateLayerToggleButton()
    console.log('UIControlBar_3a: Registered layer toggle bar')
  }
  
  /**
   * Toggle store panel visibility
   */
  private toggleStorePanel(): void {
    gameStore_3a_methods.toggleStorePanel()
    this.updateStorePanelButton()
    
    // StorePanel_3a handles its own DOM updates via subscription
    console.log(`UIControlBar_3a: Store panel ${gameStore_3a.ui.showStorePanel ? 'shown' : 'hidden'}`)
  }
  
  /**
   * Toggle layer toggle bar visibility
   */
  private toggleLayerBar(): void {
    gameStore_3a_methods.toggleLayerToggle()
    this.updateLayerToggleButton()
    
    // Update DOM visibility
    const toggleBar = document.getElementById('layer-toggle-bar')
    if (toggleBar) {
      toggleBar.style.display = gameStore_3a.ui.showLayerToggle ? 'block' : 'none'
    }
    
    console.log(`UIControlBar_3a: Layer toggle bar ${gameStore_3a.ui.showLayerToggle ? 'shown' : 'hidden'}`)
  }
  
  /**
   * Update store panel button visual state
   */
  private updateStorePanelButton(): void {
    const button = document.getElementById('toggle-store-panel')
    if (button) {
      const isVisible = gameStore_3a.ui.showStorePanel
      
      // Update button appearance
      if (isVisible) {
        button.classList.remove('btn-outline')
        button.classList.add('btn-primary')
      } else {
        button.classList.remove('btn-primary')
        button.classList.add('btn-outline')
      }
      
      // Update button text
      const buttonText = button.querySelector('.button-text')
      if (buttonText) {
        buttonText.textContent = 'Store'
      }
      
      // Update tooltip
      button.title = `${isVisible ? 'Hide' : 'Show'} Store Panel (F1)`
    }
  }
  
  /**
   * Update layer toggle button visual state
   */
  private updateLayerToggleButton(): void {
    const button = document.getElementById('toggle-layers')
    if (button) {
      const isVisible = gameStore_3a.ui.showLayerToggle
      
      // Update button appearance
      if (isVisible) {
        button.classList.remove('btn-outline')
        button.classList.add('btn-warning')
      } else {
        button.classList.remove('btn-warning')
        button.classList.add('btn-outline')
      }
      
      // Update button text
      const buttonText = button.querySelector('.button-text')
      if (buttonText) {
        buttonText.textContent = 'Layers'
      }
      
      // Update tooltip
      button.title = `${isVisible ? 'Hide' : 'Show'} Layer Controls (F2)`
    }
  }
  
  /**
   * Update all button states
   */
  public updateAllButtonStates(): void {
    this.updateStorePanelButton()
    this.updateLayerToggleButton()
  }
  
  /**
   * Get current state for debugging
   */
  public getDebugInfo(): any {
    return {
      storePanel: {
        registered: this.storePanel !== null,
        visible: gameStore_3a.ui.showStorePanel
      },
      layerToggleBar: {
        registered: this.layerToggleBar !== null,
        visible: gameStore_3a.ui.showLayerToggle
      }
    }
  }
  
  /**
   * Cleanup method
   */
  public destroy(): void {
    // Clean up event listeners if needed
    console.log('UIControlBar_3a: Destroyed')
  }
}