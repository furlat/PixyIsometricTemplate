/**
 * ECS Mirror Layer Panel - Vanilla TypeScript UI Class
 * 
 * Replaces the React hook useECSMirrorLayer.ts with vanilla TypeScript + Valtio architecture.
 * Follows the same pattern as StorePanel.ts with subscribe() and DOM manipulation.
 */

import { subscribe } from 'valtio'
import { mirrorLayerIntegration } from '../store/ecs-mirror-layer-integration'
import { 
  updateElement,
  formatCoordinates,
  getBooleanStatusClass,
  getBooleanStatusText,
  STATUS_COLORS
} from './handlers/UIHandlers'

export class ECSMirrorLayerPanel {
  private elements: Map<string, HTMLElement> = new Map()
  private integration = mirrorLayerIntegration
  private panelElement: HTMLElement | null = null
  
  constructor() {
    this.createPanelElement()
    this.initializeElements()
    this.setupReactivity()
  }
  
  private createPanelElement(): void {
    this.panelElement = document.createElement('div')
    this.panelElement.className = 'ecs-mirror-layer-panel'
    this.panelElement.innerHTML = `
      <div class="card bg-base-200/30 shadow-sm mb-3">
        <div class="card-body p-3">
          <h3 class="card-title text-sm text-secondary flex items-center gap-2">
            <span class="text-xs">▸</span>
            ECS Mirror Layer
          </h3>
          <div class="space-y-2">
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">Zoom Level:</span>
              <span id="ecs-mirror-layer-zoom" class="font-bold font-mono text-primary">1</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">WASD Active:</span>
              <span id="ecs-mirror-layer-wasd" class="font-bold font-mono status-inactive">No</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">Camera Position:</span>
              <span id="ecs-mirror-layer-position" class="font-bold font-mono text-info">0, 0</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">Camera Scale:</span>
              <span id="ecs-mirror-layer-scale" class="font-bold font-mono text-warning">1.0</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">Camera Rotation:</span>
              <span id="ecs-mirror-layer-rotation" class="font-bold font-mono text-accent">0°</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">Visible:</span>
              <span id="ecs-mirror-layer-visible" class="font-bold font-mono status-active">Yes</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">Opacity:</span>
              <span id="ecs-mirror-layer-opacity" class="font-bold font-mono text-success">100%</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">Panning:</span>
              <span id="ecs-mirror-layer-panning" class="font-bold font-mono status-inactive">No</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">Texture Cache:</span>
              <span id="ecs-mirror-layer-cache" class="font-bold font-mono text-info">0</span>
            </div>
          </div>
        </div>
      </div>
    `
  }
  
  private initializeElements(): void {
    const elementIds = [
      'ecs-mirror-layer-zoom',
      'ecs-mirror-layer-wasd',
      'ecs-mirror-layer-position',
      'ecs-mirror-layer-scale',
      'ecs-mirror-layer-rotation',
      'ecs-mirror-layer-visible',
      'ecs-mirror-layer-opacity', 
      'ecs-mirror-layer-panning',
      'ecs-mirror-layer-cache'
    ]
    
    elementIds.forEach(id => {
      const element = document.getElementById(id)
      if (element) {
        this.elements.set(id, element)
      } else {
        console.warn(`ECSMirrorLayerPanel element with id '${id}' not found`)
      }
    })
  }
  
  private setupReactivity(): void {
    // Subscribe to mirror layer store changes using Valtio
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
    
    // Zoom level
    updateElement(this.elements, 'ecs-mirror-layer-zoom', 
      state.zoomLevel.toString(), 
      'text-primary'
    )
    
    // WASD active
    updateElement(this.elements, 'ecs-mirror-layer-wasd', 
      getBooleanStatusText(this.integration.isWASDActive()),
      getBooleanStatusClass(this.integration.isWASDActive())
    )
    
    // Camera position
    updateElement(this.elements, 'ecs-mirror-layer-position',
      formatCoordinates(state.cameraViewport.position.x, state.cameraViewport.position.y),
      STATUS_COLORS.camera
    )
    
    // Camera scale
    updateElement(this.elements, 'ecs-mirror-layer-scale',
      state.cameraViewport.scale.toFixed(2),
      'text-warning'
    )
    
    // Camera rotation
    updateElement(this.elements, 'ecs-mirror-layer-rotation',
      `${state.cameraViewport.rotation.toFixed(1)}°`,
      'text-accent'
    )
    
    // Visibility
    updateElement(this.elements, 'ecs-mirror-layer-visible', 
      getBooleanStatusText(state.display.isVisible),
      getBooleanStatusClass(state.display.isVisible)
    )
    
    // Opacity
    updateElement(this.elements, 'ecs-mirror-layer-opacity',
      `${Math.round(state.display.opacity * 100)}%`,
      'text-success'
    )
    
    // Panning
    updateElement(this.elements, 'ecs-mirror-layer-panning', 
      getBooleanStatusText(state.camera.isPanning),
      getBooleanStatusClass(state.camera.isPanning)
    )
    
    // Texture cache
    updateElement(this.elements, 'ecs-mirror-layer-cache',
      state.textureCache.size.toString(),
      'text-info'
    )
  }
  
  // ================================
  // PUBLIC METHODS FOR UI INTERACTION
  // ================================
  
  /**
   * Move camera to specific position (only at zoom 2+).
   */
  public moveCamera(position: { x: number, y: number }) {
    this.integration.moveCamera(position)
  }
  
  /**
   * Pan camera by delta amounts (only at zoom 2+).
   */
  public panCamera(deltaX: number, deltaY: number) {
    this.integration.panCamera(deltaX, deltaY)
  }
  
  /**
   * Set zoom level.
   */
  public setZoomLevel(level: number) {
    this.integration.setZoomLevel(level as any) // Cast to ZoomLevel
  }
  
  /**
   * Set camera scale.
   */
  public setCameraScale(scale: number) {
    this.integration.setCameraScale(scale)
  }
  
  /**
   * Set camera rotation.
   */
  public setCameraRotation(rotation: number) {
    this.integration.setCameraRotation(rotation)
  }
  
  /**
   * Set visibility.
   */
  public setVisibility(visible: boolean) {
    this.integration.setVisibility(visible)
  }
  
  /**
   * Set opacity.
   */
  public setOpacity(opacity: number) {
    this.integration.setOpacity(opacity)
  }
  
  /**
   * Start panning operation.
   */
  public startPanning(startPos: { x: number, y: number }) {
    this.integration.startPanning(startPos)
  }
  
  /**
   * Stop panning operation.
   */
  public stopPanning() {
    this.integration.stopPanning()
  }
  
  /**
   * Clear texture cache.
   */
  public clearTextureCache() {
    this.integration.clearTextureCache()
  }
  
  /**
   * Get current statistics.
   */
  public getStats() {
    return this.integration.getStats()
  }
  
  /**
   * Get current camera position.
   */
  public getCameraPosition() {
    return this.integration.getCameraPosition()
  }
  
  /**
   * Get current zoom level.
   */
  public getZoomLevel() {
    return this.integration.getCurrentZoomLevel()
  }
  
  /**
   * Check if WASD is active.
   */
  public isWASDActive() {
    return this.integration.isWASDActive()
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