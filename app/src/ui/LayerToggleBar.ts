export class LayerToggleBar {
  private panel: HTMLElement | null = null
  private _isVisible: boolean = false
  private layerStates = {
    grid: true,
    geometry: true,
    raycast: true
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
    
    // Grid layer toggle
    const gridToggle = document.getElementById('toggle-layer-grid')
    if (gridToggle) {
      gridToggle.addEventListener('click', () => {
        this.toggleLayer('grid')
      })
    }
    
    // Geometry layer toggle
    const geometryToggle = document.getElementById('toggle-layer-geometry')
    if (geometryToggle) {
      geometryToggle.addEventListener('click', () => {
        this.toggleLayer('geometry')
      })
    }
    
    // Raycast layer toggle
    const raycastToggle = document.getElementById('toggle-layer-raycast')
    if (raycastToggle) {
      raycastToggle.addEventListener('click', () => {
        this.toggleLayer('raycast')
      })
    }
  }
  
  private toggleLayer(layerName: 'grid' | 'geometry' | 'raycast'): void {
    this.layerStates[layerName] = !this.layerStates[layerName]
    this.updateButtonState(layerName)
    this.notifyLayerChange(layerName, this.layerStates[layerName])
  }
  
  private updateButtonState(layerName: 'grid' | 'geometry' | 'raycast'): void {
    const buttonId = `toggle-layer-${layerName}`
    const button = document.getElementById(buttonId)
    if (!button) return
    
    const isActive = this.layerStates[layerName]
    const baseClasses = ['btn', 'btn-sm', 'rounded-full']
    const activeClass = layerName === 'grid' ? 'btn-success' : 
                       layerName === 'geometry' ? 'btn-secondary' : 'btn-warning'
    
    // Reset button classes
    button.className = baseClasses.join(' ')
    
    if (isActive) {
      button.classList.add(activeClass)
    } else {
      button.classList.add('btn-outline')
    }
  }
  
  private updateButtonStates(): void {
    this.updateButtonState('grid')
    this.updateButtonState('geometry')
    this.updateButtonState('raycast')
  }
  
  private notifyLayerChange(layerName: string, isVisible: boolean): void {
    // Dispatch custom event for layer visibility change
    const event = new CustomEvent('layerVisibilityChanged', {
      detail: { layerName, isVisible }
    })
    document.dispatchEvent(event)
    
    // Also update the store panel indicators if they exist
    const indicator = document.getElementById(`layer-${layerName}`)
    if (indicator) {
      indicator.textContent = isVisible ? 'ON' : 'OFF'
      indicator.className = `font-bold font-mono ${isVisible ? 'status-active' : 'status-inactive'}`
    }
  }
  
  public getLayerState(layerName: 'grid' | 'geometry' | 'raycast'): boolean {
    return this.layerStates[layerName]
  }
  
  public setLayerState(layerName: 'grid' | 'geometry' | 'raycast', isVisible: boolean): void {
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