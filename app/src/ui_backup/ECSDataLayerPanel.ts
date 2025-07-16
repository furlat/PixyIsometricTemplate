/**
 * ECS Data Layer Panel - Vanilla TypeScript UI Class
 * 
 * Replaces the React hook useECSDataLayer.ts with vanilla TypeScript + Valtio architecture.
 * Follows the same pattern as StorePanel.ts with subscribe() and DOM manipulation.
 */

import { subscribe } from 'valtio'
import { dataLayerIntegration } from '../store/ecs-data-layer-integration'
import { 
  updateElement,
  formatCoordinates,
  getBooleanStatusClass,
  getBooleanStatusText,
  STATUS_COLORS
} from './handlers/UIHandlers'

export class ECSDataLayerPanel {
  private elements: Map<string, HTMLElement> = new Map()
  private integration = dataLayerIntegration
  private panelElement: HTMLElement | null = null
  
  constructor() {
    this.createPanelElement()
    this.initializeElements()
    this.setupReactivity()
  }
  
  private createPanelElement(): void {
    this.panelElement = document.createElement('div')
    this.panelElement.className = 'ecs-data-layer-panel'
    this.panelElement.innerHTML = `
      <div class="card bg-base-200/30 shadow-sm mb-3">
        <div class="card-body p-3">
          <h3 class="card-title text-sm text-primary flex items-center gap-2">
            <span class="text-xs">▸</span>
            ECS Data Layer
          </h3>
          <div class="space-y-2">
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">Total Objects:</span>
              <span id="ecs-data-layer-objects" class="font-bold font-mono text-primary">0</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">Visible Objects:</span>
              <span id="ecs-data-layer-visible" class="font-bold font-mono text-success">0</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">Sampling Active:</span>
              <span id="ecs-data-layer-sampling" class="font-bold font-mono status-inactive">No</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">Sampling Position:</span>
              <span id="ecs-data-layer-position" class="font-bold font-mono text-info">0, 0</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">Sampling Bounds:</span>
              <span id="ecs-data-layer-bounds" class="font-bold font-mono text-info">0x0</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">Data Bounds:</span>
              <span id="ecs-data-layer-data-bounds" class="font-bold font-mono text-warning">0x0</span>
            </div>
          </div>
        </div>
      </div>
    `
  }
  
  private initializeElements(): void {
    const elementIds = [
      'ecs-data-layer-objects',
      'ecs-data-layer-visible', 
      'ecs-data-layer-sampling',
      'ecs-data-layer-position',
      'ecs-data-layer-bounds',
      'ecs-data-layer-data-bounds'
    ]
    
    elementIds.forEach(id => {
      const element = document.getElementById(id)
      if (element) {
        this.elements.set(id, element)
      } else {
        console.warn(`ECSDataLayerPanel element with id '${id}' not found`)
      }
    })
  }
  
  private setupReactivity(): void {
    // Subscribe to data layer store changes using Valtio
    // Note: We need to subscribe to the actual proxy store, not the integration
    const store = this.integration.getCurrentState()
    
    subscribe(store, () => {
      this.updateValues()
    })
    
    // Initial update
    this.updateValues()
  }
  
  private updateValues(): void {
    const state = this.integration.getCurrentState()
    const stats = this.integration.getStats()
    
    // Total objects
    updateElement(this.elements, 'ecs-data-layer-objects', 
      state.allObjects.length.toString(), 
      'text-primary'
    )
    
    // Visible objects
    updateElement(this.elements, 'ecs-data-layer-visible', 
      state.visibleObjects.length.toString(), 
      'text-success'
    )
    
    // Sampling active
    updateElement(this.elements, 'ecs-data-layer-sampling', 
      getBooleanStatusText(state.sampling.isActive),
      getBooleanStatusClass(state.sampling.isActive)
    )
    
    // Sampling position
    updateElement(this.elements, 'ecs-data-layer-position',
      formatCoordinates(state.samplingWindow.position.x, state.samplingWindow.position.y),
      STATUS_COLORS.camera
    )
    
    // Sampling bounds
    updateElement(this.elements, 'ecs-data-layer-bounds',
      `${state.samplingWindow.bounds.width}x${state.samplingWindow.bounds.height}`,
      'text-info'
    )
    
    // Data bounds
    updateElement(this.elements, 'ecs-data-layer-data-bounds',
      `${state.dataBounds.width}x${state.dataBounds.height}`,
      'text-warning'
    )
  }
  
  // ================================
  // PUBLIC METHODS FOR UI INTERACTION
  // ================================
  
  /**
   * Add a new object to the data layer.
   */
  public addObject(object: any) {
    this.integration.addObject(object)
  }
  
  /**
   * Remove an object from the data layer.
   */
  public removeObject(objectId: string) {
    this.integration.removeObject(objectId)
  }
  
  /**
   * Update the sampling window position (WASD at zoom 1).
   */
  public updateSamplingWindow(position: { x: number, y: number }) {
    this.integration.updateSamplingPosition(position)
  }
  
  /**
   * Get current statistics.
   */
  public getStats() {
    return this.integration.getStats()
  }
  
  /**
   * Get all objects in the data layer.
   */
  public getAllObjects() {
    return this.integration.getAllObjects()
  }
  
  /**
   * Get visible objects from current sampling.
   */
  public getVisibleObjects() {
    return this.integration.getVisibleObjects()
  }
  
  /**
   * Clear all objects from the data layer.
   */
  public clearAllObjects() {
    this.integration.clearAllObjects()
  }
  
  /**
   * Append the panel to a parent element.
   */
  public appendTo(parentElement: HTMLElement) {
    if (this.panelElement) {
      parentElement.appendChild(this.panelElement)
    }
  }
  
  /**
   * Remove the panel from its parent.
   */
  public remove() {
    if (this.panelElement && this.panelElement.parentNode) {
      this.panelElement.parentNode.removeChild(this.panelElement)
    }
  }
  
  /**
   * Clean up resources.
   */
  public destroy() {
    this.remove()
    this.elements.clear()
  }
}