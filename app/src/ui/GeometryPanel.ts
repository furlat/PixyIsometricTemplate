import { subscribe } from 'valtio'
import { gameStore, updateGameStore } from '../store/gameStore'
import {
  updateElement,
  getBooleanStatusClass,
  getBooleanStatusText
} from './handlers/UIHandlers'

export class GeometryPanel {
  private elements: Map<string, HTMLElement> = new Map()
  private isVisible: boolean = false
  
  constructor() {
    this.initializeElements()
    this.setupReactivity()
    this.setupEventHandlers()
  }
  
  private initializeElements(): void {
    // Get all the elements by their IDs
    const elementIds = [
      'geometry-current-mode',
      'geometry-objects-count',
      'geometry-selected-count',
      'geometry-layer-grid',
      'geometry-layer-geometry', 
      'geometry-layer-raycast',
      'geometry-default-color',
      'geometry-default-stroke-width'
    ]
    
    elementIds.forEach(id => {
      const element = document.getElementById(id)
      if (element) {
        this.elements.set(id, element)
      } else {
        console.warn(`GeometryPanel element with id '${id}' not found`)
      }
    })
  }
  
  private setupReactivity(): void {
    subscribe(gameStore, () => {
      this.updateValues()
    })
    
    // Initial update
    this.updateValues()
  }
  
  private setupEventHandlers(): void {
    // Drawing mode buttons
    const modes = ['none', 'point', 'line', 'circle', 'rectangle', 'diamond']
    modes.forEach(mode => {
      const button = document.getElementById(`geometry-mode-${mode}`)
      if (button) {
        button.addEventListener('click', () => {
          updateGameStore.setDrawingMode(mode as any)
        })
      }
    })
    
    // Layer visibility toggles
    const layers = ['grid', 'geometry', 'raycast']
    layers.forEach(layer => {
      const toggle = document.getElementById(`geometry-toggle-${layer}`)
      if (toggle) {
        toggle.addEventListener('click', () => {
          const currentVisibility = gameStore.geometry.layerVisibility[layer as keyof typeof gameStore.geometry.layerVisibility]
          updateGameStore.setLayerVisibility(layer as any, !currentVisibility)
        })
      }
    })
    
    // Clear all button
    const clearButton = document.getElementById('geometry-clear-all')
    if (clearButton) {
      clearButton.addEventListener('click', () => {
        updateGameStore.clearAllGeometricObjects()
      })
    }
  }
  
  private updateValues(): void {
    if (!this.isVisible) return
    
    // Current drawing mode
    updateElement(this.elements, 'geometry-current-mode', 
      gameStore.geometry.drawing.mode, 'text-success')
    
    // Objects count
    updateElement(this.elements, 'geometry-objects-count', 
      gameStore.geometry.objects.length.toString(), 'text-primary')
    
    // Selected count (placeholder for future selection feature)
    updateElement(this.elements, 'geometry-selected-count', 
      '0', 'text-info')
    
    // Layer visibility states
    updateElement(this.elements, 'geometry-layer-grid', 
      getBooleanStatusText(gameStore.geometry.layerVisibility.grid),
      getBooleanStatusClass(gameStore.geometry.layerVisibility.grid))
    
    updateElement(this.elements, 'geometry-layer-geometry', 
      getBooleanStatusText(gameStore.geometry.layerVisibility.geometry),
      getBooleanStatusClass(gameStore.geometry.layerVisibility.geometry))
    
    updateElement(this.elements, 'geometry-layer-raycast', 
      getBooleanStatusText(gameStore.geometry.layerVisibility.raycast),
      getBooleanStatusClass(gameStore.geometry.layerVisibility.raycast))
    
    // Drawing settings
    updateElement(this.elements, 'geometry-default-color', 
      `#${gameStore.geometry.drawing.settings.defaultColor.toString(16).padStart(6, '0')}`, 
      'text-accent')
    
    updateElement(this.elements, 'geometry-default-stroke-width', 
      gameStore.geometry.drawing.settings.defaultStrokeWidth.toString(), 
      'text-accent')
    
    // Update mode button states
    this.updateModeButtons()
  }
  
  private updateModeButtons(): void {
    const modes = ['none', 'point', 'line', 'circle', 'rectangle', 'diamond']
    const currentMode = gameStore.geometry.drawing.mode
    
    modes.forEach(mode => {
      const button = document.getElementById(`geometry-mode-${mode}`)
      if (button) {
        if (mode === currentMode) {
          button.classList.remove('btn-outline')
          button.classList.add('btn-primary')
        } else {
          button.classList.remove('btn-primary')
          button.classList.add('btn-outline')
        }
      }
    })
  }
  
  /**
   * Toggle panel visibility
   */
  public toggle(): void {
    this.isVisible = !this.isVisible
    const panelElement = document.getElementById('geometry-panel')
    if (panelElement) {
      panelElement.style.display = this.isVisible ? 'block' : 'none'
    }
    
    // Update values if becoming visible
    if (this.isVisible) {
      this.updateValues()
    }
  }
  
  /**
   * Set panel visibility
   */
  public setVisible(visible: boolean): void {
    this.isVisible = visible
    const panelElement = document.getElementById('geometry-panel')
    if (panelElement) {
      panelElement.style.display = this.isVisible ? 'block' : 'none'
    }
    
    // Update values if becoming visible
    if (this.isVisible) {
      this.updateValues()
    }
  }
  
  /**
   * Get current visibility state
   */
  public getVisible(): boolean {
    return this.isVisible
  }
  
  public resize(_width: number, _height: number): void {
    // Panel is positioned with fixed positioning, so no manual resize needed
    // Tailwind's responsive classes handle this automatically
  }
  
  public destroy(): void {
    // Clean up if needed
    this.elements.clear()
  }
}