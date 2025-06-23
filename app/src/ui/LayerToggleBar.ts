import { updateGameStore } from '../store/gameStore'

export class LayerToggleBar {
  private panel: HTMLElement | null = null
  private _isVisible: boolean = false
  private layerStates = {
    background: true,  // Grid and background elements
    geometry: true,    // Geometric shapes and objects
    selection: true,   // Selection highlights
    raycast: true,     // Raycast lines and debug visuals
    bbox: false,       // Bounding box overlay for comparison (off by default)
    mirror: false,     // Mirror layer for cached texture sprites (off by default)
    mouse: true,       // Mouse visualization
    pixelate: false    // Pixeloid-perfect pixelation filter disabled by default
  }
  
  constructor() {
    this.panel = document.getElementById('layer-toggle-bar')
    this.setupEventHandlers()
    this.updateButtonStates()
    
    // Set initial visibility
    if (this.panel) {
      this.panel.style.display = this._isVisible ? 'flex' : 'none'
    }
  }
  
  private setupEventHandlers(): void {
    if (!this.panel) return
    
    // Background layer toggle (grid)
    const backgroundToggle = document.getElementById('toggle-layer-background')
    if (backgroundToggle) {
      backgroundToggle.addEventListener('click', () => {
        this.toggleLayer('background')
      })
    }
    
    // Geometry layer toggle
    const geometryToggle = document.getElementById('toggle-layer-geometry')
    if (geometryToggle) {
      geometryToggle.addEventListener('click', () => {
        this.toggleLayer('geometry')
      })
    }
    
    // Selection layer toggle
    const selectionToggle = document.getElementById('toggle-layer-selection')
    if (selectionToggle) {
      selectionToggle.addEventListener('click', () => {
        this.toggleLayer('selection')
      })
    }
    
    // Raycast layer toggle
    const raycastToggle = document.getElementById('toggle-layer-raycast')
    if (raycastToggle) {
      raycastToggle.addEventListener('click', () => {
        this.toggleLayer('raycast')
      })
    }
    
    // Bbox layer toggle
    const bboxToggle = document.getElementById('toggle-layer-bbox')
    if (bboxToggle) {
      bboxToggle.addEventListener('click', () => {
        this.toggleLayer('bbox')
      })
    }
    
    // Mirror layer toggle
    const mirrorToggle = document.getElementById('toggle-layer-mirror')
    if (mirrorToggle) {
      mirrorToggle.addEventListener('click', () => {
        this.toggleLayer('mirror')
      })
    }
    
    // Mouse layer toggle
    const mouseToggle = document.getElementById('toggle-layer-mouse')
    if (mouseToggle) {
      mouseToggle.addEventListener('click', () => {
        this.toggleLayer('mouse')
      })
    }
    
    // Pixelate filter toggle - DISCONNECTED (awaiting implementation)
    const pixelateToggle = document.getElementById('toggle-filter-pixelate')
    if (pixelateToggle) {
      pixelateToggle.addEventListener('click', () => {
        console.warn('Pixelate filter: Awaiting implementation of pixeloid-perfect pixelation system')
        // this.togglePixelateFilter() // DISCONNECTED
      })
    }
  }
  
  private toggleLayer(layerName: 'background' | 'geometry' | 'selection' | 'raycast' | 'bbox' | 'mirror' | 'mouse'): void {
    this.layerStates[layerName] = !this.layerStates[layerName]
    this.updateButtonState(layerName)
    this.notifyLayerChange(layerName, this.layerStates[layerName])
  }

  private togglePixelateFilter(): void {
    // DISCONNECTED: Awaiting implementation of pixeloid-perfect pixelation system
    console.warn('togglePixelateFilter: Functionality disconnected until proper implementation')
    // this.layerStates.pixelate = !this.layerStates.pixelate
    // this.updatePixelateButtonState()
    // this.notifyPixelateFilterChange()
  }
  
  private updateButtonState(layerName: 'background' | 'geometry' | 'selection' | 'raycast' | 'bbox' | 'mirror' | 'mouse'): void {
    const buttonId = `toggle-layer-${layerName}`
    const button = document.getElementById(buttonId)
    if (!button) return
    
    const isActive = this.layerStates[layerName]
    const baseClasses = ['btn', 'btn-sm', 'rounded-full']
    const activeClass = layerName === 'background' ? 'btn-success' :
                       layerName === 'geometry' ? 'btn-secondary' :
                       layerName === 'selection' ? 'btn-primary' :
                       layerName === 'raycast' ? 'btn-warning' :
                       layerName === 'bbox' ? 'btn-error' :
                       layerName === 'mirror' ? 'btn-neutral' : 'btn-accent'
    
    // Reset button classes
    button.className = baseClasses.join(' ')
    
    if (isActive) {
      button.classList.add(activeClass)
    } else {
      button.classList.add('btn-outline')
    }
  }
  
  private updateButtonStates(): void {
    this.updateButtonState('background')
    this.updateButtonState('geometry')
    this.updateButtonState('selection')
    this.updateButtonState('raycast')
    this.updateButtonState('bbox')
    this.updateButtonState('mirror')
    this.updateButtonState('mouse')
    // this.updatePixelateButtonState() // DISCONNECTED
  }

  private updatePixelateButtonState(): void {
    // DISCONNECTED: Awaiting implementation of pixeloid-perfect pixelation system
    console.warn('updatePixelateButtonState: Functionality disconnected until proper implementation')
    // const button = document.getElementById('toggle-filter-pixelate')
    // if (!button) return
    // const isActive = this.layerStates.pixelate
    // ... button state logic disconnected
  }

  private notifyPixelateFilterChange(): void {
    // DISCONNECTED: Awaiting implementation of pixeloid-perfect pixelation system
    console.warn('notifyPixelateFilterChange: Functionality disconnected until proper implementation')
    // updateGameStore.setPixelateFilterEnabled(this.layerStates.pixelate)
    // const event = new CustomEvent('pixelateFilterChanged', {
    //   detail: { enabled: this.layerStates.pixelate }
    // })
    // document.dispatchEvent(event)
  }
  
  private notifyLayerChange(layerName: string, isVisible: boolean): void {
    // Update the store with the layer visibility change
    if (layerName === 'background' || layerName === 'geometry' || layerName === 'selection' ||
        layerName === 'raycast' || layerName === 'bbox' || layerName === 'mirror' || layerName === 'mouse') {
      updateGameStore.setLayerVisibility(layerName as any, isVisible)
    }
    
    // Dispatch custom event for layer visibility change
    const event = new CustomEvent('layerVisibilityChanged', {
      detail: { layerName, isVisible }
    })
    document.dispatchEvent(event)
    
    // Also update the store panel indicators if they exist (for backwards compatibility)
    const indicator = document.getElementById(`layer-${layerName === 'background' ? 'grid' : layerName}`)
    if (indicator) {
      indicator.textContent = isVisible ? 'ON' : 'OFF'
      indicator.className = `font-bold font-mono ${isVisible ? 'status-active' : 'status-inactive'}`
    }
  }
  
  public getLayerState(layerName: 'background' | 'geometry' | 'selection' | 'raycast' | 'bbox' | 'mirror' | 'mouse'): boolean {
    return this.layerStates[layerName]
  }
  
  public setLayerState(layerName: 'background' | 'geometry' | 'selection' | 'raycast' | 'bbox' | 'mirror' | 'mouse', isVisible: boolean): void {
    this.layerStates[layerName] = isVisible
    this.updateButtonState(layerName)
    this.notifyLayerChange(layerName, isVisible)
  }
  
  public toggle(): void {
    this._isVisible = !this._isVisible
    if (this.panel) {
      this.panel.style.display = this._isVisible ? 'flex' : 'none'
    }
  }
  
  public setVisible(visible: boolean): void {
    this._isVisible = visible
    if (this.panel) {
      this.panel.style.display = this._isVisible ? 'flex' : 'none'
    }
  }
  
  public getVisible(): boolean {
    return this._isVisible
  }
  
  public isVisible(): boolean {
    return this._isVisible
  }
  
  public destroy(): void {
    // Clean up if needed
  }
}