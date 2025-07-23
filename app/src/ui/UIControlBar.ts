import { StorePanel } from './StorePanel'
import { GeometryPanel } from './GeometryPanel'
import { ObjectEditPanel } from './ObjectEditPanel'
import { gameStore, gameStore_methods } from '../store/game-store'
import { subscribe } from 'valtio'

/**
 * UI Control Bar - Unified Store Version
 * 
 * Clean control bar with unified store integration:
 * - Store panel toggle
 * - Layer toggle bar
 * - Geometry panel toggle
 * - Selection-based object edit panel
 * 
 * ✅ Uses unified gameStore from game-store.ts
 * ✅ No keyboard handling (moved to InputManager)
 * ✅ Clean panel management
 * ✅ Proper selection subscription
 */
export class UIControlBar {
  private storePanel: StorePanel | null = null
  private geometryPanel: GeometryPanel | null = null
  private layerToggleBar: { toggle: () => void; isVisible: () => boolean } | null = null
  private objectEditPanel: ObjectEditPanel | null = null
  
  constructor() {
    this.setupEventListeners()
    this.setupSelectionSubscription()
    console.log('UIControlBar: Initialized with unified store (no keyboard handling)')
  }
  
  /**
   * Setup event listeners for control bar buttons
   */
  private setupEventListeners(): void {
    // Geometry panel toggle button
    const geometryPanelToggle = document.getElementById('toggle-geometry-panel')
    if (geometryPanelToggle) {
      geometryPanelToggle.addEventListener('click', () => {
        this.toggleGeometryPanel()
      })
    } else {
      console.warn('UIControlBar: Geometry panel toggle button not found')
    }
    
    // Store panel toggle button
    const storePanelToggle = document.getElementById('toggle-store-panel')
    if (storePanelToggle) {
      storePanelToggle.addEventListener('click', () => {
        this.toggleStorePanel()
      })
    } else {
      console.warn('UIControlBar: Store panel toggle button not found')
    }
    
    // Layer toggle bar button
    const layerToggle = document.getElementById('toggle-layers')
    if (layerToggle) {
      layerToggle.addEventListener('click', () => {
        this.toggleLayerBar()
      })
    } else {
      console.warn('UIControlBar: Layer toggle button not found')
    }
  }
  
  /**
   * Setup selection subscription for object edit panel
   * ✅ FIXED: Uses gameStore.selection.selectedId (not selectedObjectId)
   */
  private setupSelectionSubscription(): void {
    console.log('🔍 UIControlBar: Setting up selection subscription...')
    
    subscribe(gameStore.selection, () => {
      console.log('🔍 UIControlBar: Selection changed!')
      console.log('🔍 Selected object ID:', gameStore.selection.selectedId)
      console.log('🔍 Current panel instance:', this.objectEditPanel ? 'EXISTS' : 'NULL')
      
      if (gameStore.selection.selectedId) {
        // Object selected - show edit panel
        console.log('✅ UIControlBar: Object selected - creating panel...')
        if (!this.objectEditPanel) {
          console.log('✅ UIControlBar: Creating new ObjectEditPanel instance...')
          try {
            this.objectEditPanel = new ObjectEditPanel()
            console.log('✅ UIControlBar: ObjectEditPanel created successfully!')
          } catch (error) {
            console.error('❌ UIControlBar: Error creating ObjectEditPanel:', error)
          }
        } else {
          console.log('✅ UIControlBar: Panel already exists, reusing instance')
        }
      } else {
        // No object selected - hide edit panel
        console.log('❌ UIControlBar: No object selected - destroying panel...')
        if (this.objectEditPanel) {
          console.log('❌ UIControlBar: Destroying ObjectEditPanel instance...')
          this.objectEditPanel.destroy()
          this.objectEditPanel = null
          console.log('❌ UIControlBar: ObjectEditPanel destroyed')
        }
      }
    })
    
    console.log('✅ UIControlBar: Selection subscription setup complete')
  }
  
  /**
   * Register store panel with the control bar
   */
  public registerStorePanel(storePanel: StorePanel): void {
    this.storePanel = storePanel
    this.updateStorePanelButton()
    console.log('UIControlBar: Registered store panel')
  }
  
  /**
   * Register geometry panel with the control bar
   */
  public registerGeometryPanel(geometryPanel: GeometryPanel): void {
    this.geometryPanel = geometryPanel
    this.updateGeometryPanelButton()
    console.log('UIControlBar: Registered geometry panel')
  }
  
  /**
   * Register layer toggle bar with the control bar
   */
  public registerLayerToggleBar(layerToggleBar: { toggle: () => void; isVisible: () => boolean }): void {
    this.layerToggleBar = layerToggleBar
    this.updateLayerToggleButton()
    console.log('UIControlBar: Registered layer toggle bar')
  }
  
  /**
   * Toggle store panel visibility
   * ✅ FIXED: Uses gameStore_methods.toggleStorePanel()
   */
  private toggleStorePanel(): void {
    gameStore_methods.toggleStorePanel()
    this.updateStorePanelButton()
    
    // StorePanel handles its own DOM updates via subscription
    console.log(`UIControlBar: Store panel ${gameStore.ui.showStorePanel ? 'shown' : 'hidden'}`)
  }
  
  /**
   * Toggle geometry panel visibility
   * ✅ FIXED: Uses gameStore_methods.toggleGeometryPanel()
   */
  private toggleGeometryPanel(): void {
    gameStore_methods.toggleGeometryPanel()
    this.updateGeometryPanelButton()
    
    // Update DOM visibility
    const geometryPanel = document.getElementById('geometry-panel')
    if (geometryPanel) {
      geometryPanel.style.display = gameStore.ui.showGeometryPanel ? 'block' : 'none'
    }
    
    console.log(`UIControlBar: Geometry panel ${gameStore.ui.showGeometryPanel ? 'shown' : 'hidden'}`)
  }
  
  /**
   * Toggle layer toggle bar visibility
   * ✅ FIXED: Uses gameStore_methods.toggleLayerToggle()
   */
  private toggleLayerBar(): void {
    gameStore_methods.toggleLayerToggle()
    this.updateLayerToggleButton()
    
    // Update DOM visibility
    const toggleBar = document.getElementById('layer-toggle-bar')
    if (toggleBar) {
      toggleBar.style.display = gameStore.ui.showLayerToggle ? 'block' : 'none'
    }
    
    console.log(`UIControlBar: Layer toggle bar ${gameStore.ui.showLayerToggle ? 'shown' : 'hidden'}`)
  }
  
  /**
   * Update store panel button visual state
   * ✅ FIXED: Uses gameStore.ui.showStorePanel
   */
  private updateStorePanelButton(): void {
    const button = document.getElementById('toggle-store-panel')
    if (button) {
      const isVisible = gameStore.ui.showStorePanel
      
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
   * Update geometry panel button visual state
   * ✅ FIXED: Uses gameStore.ui.showGeometryPanel
   */
  private updateGeometryPanelButton(): void {
    const button = document.getElementById('toggle-geometry-panel')
    if (button) {
      const isVisible = gameStore.ui.showGeometryPanel
      
      // Update button appearance
      if (isVisible) {
        button.classList.remove('btn-outline')
        button.classList.add('btn-success')
      } else {
        button.classList.remove('btn-success')
        button.classList.add('btn-outline')
      }
      
      // Update button text
      const buttonText = button.querySelector('.button-text')
      if (buttonText) {
        buttonText.textContent = 'Geometry'
      }
      
      // Update tooltip
      button.title = `${isVisible ? 'Hide' : 'Show'} Geometry Panel (F3)`
    }
  }
  
  /**
   * Update layer toggle button visual state
   * ✅ FIXED: Uses gameStore.ui.showLayerToggle
   */
  private updateLayerToggleButton(): void {
    const button = document.getElementById('toggle-layers')
    if (button) {
      const isVisible = gameStore.ui.showLayerToggle
      
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
    this.updateGeometryPanelButton()
    this.updateStorePanelButton()
    this.updateLayerToggleButton()
  }
  
  /**
   * Get current state for debugging
   * ✅ FIXED: Uses gameStore.ui properties
   */
  public getDebugInfo(): any {
    return {
      geometryPanel: {
        registered: this.geometryPanel !== null,
        visible: gameStore.ui.showGeometryPanel
      },
      storePanel: {
        registered: this.storePanel !== null,
        visible: gameStore.ui.showStorePanel
      },
      layerToggleBar: {
        registered: this.layerToggleBar !== null,
        visible: gameStore.ui.showLayerToggle
      },
      selection: {
        selectedId: gameStore.selection.selectedId,
        editPanelActive: this.objectEditPanel !== null
      }
    }
  }
  
  /**
   * Cleanup method
   */
  public destroy(): void {
    // Clean up object edit panel
    if (this.objectEditPanel) {
      this.objectEditPanel.destroy()
      this.objectEditPanel = null
    }
    
    console.log('UIControlBar: Destroyed')
  }
}