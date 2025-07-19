import { subscribe } from 'valtio'
import { gameStore_3b, gameStore_3b_methods } from '../store/gameStore_3b'
import type { GeometricObject, PixeloidCoordinate } from '../types'
import type { CircleProperties, RectangleProperties, LineProperties, DiamondProperties } from '../types/ecs-data-layer'

/**
 * ObjectEditPanel_3b - Phase 3B Object Editing Interface
 * 
 * Simplified object editing panel that focuses on essential functionality:
 * - Live preview of changes
 * - Apply/Cancel functionality with restoration
 * - Simple position and style editing
 * - Phase 3B store integration
 * - No complex anchor calculations
 */
export class ObjectEditPanel_3b {
  private isVisible: boolean = false
  private originalObject: GeometricObject | null = null
  private panel: HTMLElement | null = null
  
  constructor() {
    this.panel = document.getElementById('object-edit-panel')
    if (!this.panel) {
      console.warn('ObjectEditPanel_3b: Panel element not found')
      return
    }
    
    // Initialize with proper opacity for smooth transitions
    this.panel.style.opacity = '0'
    this.panel.style.display = 'none'
    this.panel.style.transition = 'opacity 0.2s ease-in-out'
    
    this.setupReactivity()
    console.log('ObjectEditPanel_3b: Initialized')
  }

  /**
   * Setup reactive subscriptions to store changes
   */
  private setupReactivity(): void {
    // Listen for edit panel state changes
    subscribe(gameStore_3b.selection, () => {
      this.updateVisibility()
    })
    
    // Listen for selected object changes
    subscribe(gameStore_3b.selection, () => {
      if (this.isVisible) {
        this.loadSelectedObject()
      }
    })
  }

  /**
   * Update panel visibility based on store state
   */
  private updateVisibility(): void {
    // Use the proper edit panel state flag
    const shouldBeVisible = gameStore_3b.selection.isEditPanelOpen
    
    if (shouldBeVisible !== this.isVisible) {
      this.isVisible = shouldBeVisible
      if (this.panel) {
        if (this.isVisible) {
          this.panel.style.display = 'block'
          // Use setTimeout to ensure the display change is processed before opacity change
          setTimeout(() => {
            this.panel!.style.opacity = '1'
          }, 10)
        } else {
          this.panel.style.opacity = '0'
          // Hide after transition completes
          setTimeout(() => {
            if (this.panel && !this.isVisible) {
              this.panel.style.display = 'none'
            }
          }, 200)
        }
      }
      
      if (this.isVisible) {
        this.loadSelectedObject()
      } else {
        this.originalObject = null
      }
      
      console.log(`ObjectEditPanel_3b: Panel ${this.isVisible ? 'opened' : 'closed'}`)
    }
  }

  /**
   * Load the currently selected object for editing
   */
  private loadSelectedObject(): void {
    const selectedObjectId = gameStore_3b.selection.selectedObjectId
    if (!selectedObjectId) {
      console.warn('ObjectEditPanel_3b: No object selected')
      return
    }
    
    // ✅ FIXED: Always get fresh object from store (not cached)
    const selectedObject = gameStore_3b.geometry.objects.find(obj => obj.id === selectedObjectId)
    if (!selectedObject) {
      console.warn('ObjectEditPanel_3b: Selected object not found:', selectedObjectId)
      return
    }
    
    // ✅ FIXED: Only store original if we don't have one yet (preserve original for cancel)
    if (!this.originalObject) {
      this.originalObject = { ...selectedObject }
    }
    
    // ✅ FIXED: Always generate form with CURRENT object state (fresh data)
    this.generateForm(selectedObject)
    
    console.log('ObjectEditPanel_3b: Loaded fresh object for editing:', selectedObjectId)
  }

  /**
   * Generate the editing form based on object type
   */
  private generateForm(obj: GeometricObject): void {
    if (!this.panel) return
    
    const objectType = this.getObjectTypeName(obj)
    
    this.panel.innerHTML = `
      <!-- Header -->
      <div class="bg-base-200/50 border-b border-base-300 p-4 flex justify-between items-center">
        <h2 class="text-lg font-bold text-accent flex items-center gap-2">
          <span class="text-warning">✏️</span>
          Edit ${objectType}
        </h2>
        <button id="edit-panel-close" class="btn btn-sm btn-ghost btn-circle hover:bg-error hover:text-white transition-colors">
          <span class="text-lg">✕</span>
        </button>
      </div>
      
      <!-- Scrollable Content -->
      <div class="max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar p-2">
        
        <!-- Object Info -->
        <div class="alert alert-info bg-info/10 border-info/20 mb-3">
          <div class="text-sm">
            <div class="font-bold mb-1">Object ID:</div>
            <div class="font-mono text-xs">${obj.id}</div>
          </div>
        </div>

        <!-- Object Properties -->
        <div class="card bg-base-200/30 shadow-sm mb-3">
          <div class="card-body p-3">
            <h3 class="card-title text-sm text-warning flex items-center gap-2">
              <span class="text-xs">▸</span>
              Object Properties
            </h3>
            <div class="space-y-2">
              ${this.generateObjectProperties(obj)}
            </div>
          </div>
        </div>

        <!-- Style Properties -->
        <div class="card bg-base-200/30 shadow-sm mb-3">
          <div class="card-body p-3">
            <h3 class="card-title text-sm text-accent flex items-center gap-2">
              <span class="text-xs">▸</span>
              Style Properties
            </h3>
            <div class="space-y-2">
              ${this.generateStyleProperties(obj)}
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="card bg-base-200/30 shadow-sm mb-3">
          <div class="card-body p-3">
            <h3 class="card-title text-sm text-success flex items-center gap-2">
              <span class="text-xs">▸</span>
              Actions
            </h3>
            <div class="flex gap-2">
              <button id="edit-panel-apply" class="btn btn-sm btn-primary flex-1">Apply Changes</button>
              <button id="edit-panel-cancel" class="btn btn-sm btn-outline flex-1">Cancel</button>
            </div>
          </div>
        </div>

      </div>
    `
    
    this.setupEventHandlers()
  }

  /**
   * Get human-readable object type name
   */
  private getObjectTypeName(obj: GeometricObject): string {
    return obj.type.charAt(0).toUpperCase() + obj.type.slice(1)
  }

  /**
   * Generate type-specific object properties
   */
  private generateObjectProperties(obj: GeometricObject): string {
    let html = ''
    
    // Common visibility property
    html += `
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/70">Visible:</span>
        <input id="edit-visible" type="checkbox" class="toggle toggle-accent toggle-xs" ${obj.isVisible ? 'checked' : ''} />
      </div>
    `
    
    // Type-specific properties using our Phase 3B system
    switch (obj.type) {
      case 'point':
        html += this.generatePointForm(obj)
        break
      case 'line':
        html += this.generateLineForm(obj)
        break
      case 'circle':
        html += this.generateCircleForm(obj)
        break
      case 'rectangle':
        html += this.generateRectangleForm(obj)
        break
      case 'diamond':
        html += this.generateDiamondForm(obj)
        break
    }
    
    return html
  }

  /**
   * Generate point form using STORED properties (Store Authority)
   * ✅ FIXED: No more broken calculations - direct property access!
   */
  private generatePointForm(obj: GeometricObject): string {
    // ✅ CLEAN: Direct property access from store
    if (obj.properties.type !== 'point') {
      return '<div class="text-error">Object is not a point</div>'
    }
    
    const { center } = obj.properties
    
    return `
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/70">Center X:</span>
        <input id="edit-center-x" type="number" step="1" value="${Math.round(center.x)}" class="input input-bordered input-xs w-20 text-center font-mono" />
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/70">Center Y:</span>
        <input id="edit-center-y" type="number" step="1" value="${Math.round(center.y)}" class="input input-bordered input-xs w-20 text-center font-mono" />
      </div>
    `
  }

  /**
   * Generate line form using STORED properties (Store Authority)
   * ✅ FIXED: No more broken calculations - direct property access!
   */
  private generateLineForm(obj: GeometricObject): string {
    // ✅ CLEAN: Direct property access from store
    if (obj.properties.type !== 'line') {
      return '<div class="text-error">Object is not a line</div>'
    }
    
    const { startPoint, endPoint, midpoint, length, angle } = obj.properties as LineProperties
    
    return `
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/70">Start X:</span>
        <input id="edit-start-x" type="number" step="1" value="${Math.round(startPoint.x)}" class="input input-bordered input-xs w-20 text-center font-mono" />
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/70">Start Y:</span>
        <input id="edit-start-y" type="number" step="1" value="${Math.round(startPoint.y)}" class="input input-bordered input-xs w-20 text-center font-mono" />
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/70">End X:</span>
        <input id="edit-end-x" type="number" step="1" value="${Math.round(endPoint.x)}" class="input input-bordered input-xs w-20 text-center font-mono" />
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/70">End Y:</span>
        <input id="edit-end-y" type="number" step="1" value="${Math.round(endPoint.y)}" class="input input-bordered input-xs w-20 text-center font-mono" />
      </div>
      <div class="flex justify-between items-center text-xs mt-2 pt-2 border-t border-base-300">
        <span class="text-base-content/50">Midpoint:</span>
        <span class="font-mono text-xs">${Math.round(midpoint.x)}, ${Math.round(midpoint.y)}</span>
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/50">Length:</span>
        <span class="font-mono text-xs">${length.toFixed(2)}</span>
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/50">Angle:</span>
        <span class="font-mono text-xs">${(angle * 180 / Math.PI).toFixed(1)}°</span>
      </div>
    `
  }

  /**
   * Generate circle form using STORED properties (Store Authority)
   * ✅ FIXED: No more broken calculations - direct property access!
   */
  private generateCircleForm(obj: GeometricObject): string {
    // ✅ CLEAN: Direct property access from store
    if (obj.properties.type !== 'circle') {
      return '<div class="text-error">Object is not a circle</div>'
    }
    
    const { center, radius, diameter, circumference, area } = obj.properties as CircleProperties
    
    return `
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/70">Center X:</span>
        <input id="edit-center-x" type="number" step="1" value="${Math.round(center.x)}" class="input input-bordered input-xs w-20 text-center font-mono" />
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/70">Center Y:</span>
        <input id="edit-center-y" type="number" step="1" value="${Math.round(center.y)}" class="input input-bordered input-xs w-20 text-center font-mono" />
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/70">Radius:</span>
        <input id="edit-radius" type="number" step="1" min="1" value="${Math.round(radius)}" class="input input-bordered input-xs w-20 text-center font-mono" />
      </div>
      <div class="flex justify-between items-center text-xs mt-2 pt-2 border-t border-base-300">
        <span class="text-base-content/50">Circumference:</span>
        <span class="font-mono text-xs">${circumference.toFixed(2)}</span>
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/50">Area:</span>
        <span class="font-mono text-xs">${area.toFixed(2)}</span>
      </div>
    `
  }

  /**
   * Generate rectangle form using STORED properties (Store Authority)
   * ✅ FIXED: No more broken calculations - direct property access!
   */
  private generateRectangleForm(obj: GeometricObject): string {
    // ✅ CLEAN: Direct property access from store
    if (obj.properties.type !== 'rectangle') {
      return '<div class="text-error">Object is not a rectangle</div>'
    }
    
    const { center, topLeft, bottomRight, width, height, area, perimeter } = obj.properties as RectangleProperties
    
    return `
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/70">Center X:</span>
        <input id="edit-center-x" type="number" step="1" value="${Math.round(center.x)}" class="input input-bordered input-xs w-20 text-center font-mono" />
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/70">Center Y:</span>
        <input id="edit-center-y" type="number" step="1" value="${Math.round(center.y)}" class="input input-bordered input-xs w-20 text-center font-mono" />
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/70">Width:</span>
        <input id="edit-width" type="number" step="1" min="1" value="${Math.round(width)}" class="input input-bordered input-xs w-20 text-center font-mono" />
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/70">Height:</span>
        <input id="edit-height" type="number" step="1" min="1" value="${Math.round(height)}" class="input input-bordered input-xs w-20 text-center font-mono" />
      </div>
      <div class="flex justify-between items-center text-xs mt-2 pt-2 border-t border-base-300">
        <span class="text-base-content/50">Top-Left:</span>
        <span class="font-mono text-xs">${Math.round(topLeft.x)}, ${Math.round(topLeft.y)}</span>
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/50">Bottom-Right:</span>
        <span class="font-mono text-xs">${Math.round(bottomRight.x)}, ${Math.round(bottomRight.y)}</span>
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/50">Area:</span>
        <span class="font-mono text-xs">${area.toFixed(2)}</span>
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/50">Perimeter:</span>
        <span class="font-mono text-xs">${perimeter.toFixed(2)}</span>
      </div>
    `
  }

  /**
   * Generate diamond form using STORED properties (Store Authority)
   * ✅ FIXED: No more broken calculations - direct property access!
   */
  private generateDiamondForm(obj: GeometricObject): string {
    // ✅ CLEAN: Direct property access from store
    if (obj.properties.type !== 'diamond') {
      return '<div class="text-error">Object is not a diamond</div>'
    }
    
    const { center, west, north, east, south, width, height, area, perimeter } = obj.properties as DiamondProperties
    
    return `
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/70">Center X:</span>
        <input id="edit-center-x" type="number" step="1" value="${Math.round(center.x)}" class="input input-bordered input-xs w-20 text-center font-mono" />
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/70">Center Y:</span>
        <input id="edit-center-y" type="number" step="1" value="${Math.round(center.y)}" class="input input-bordered input-xs w-20 text-center font-mono" />
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/70">Width:</span>
        <input id="edit-width" type="number" step="1" min="1" value="${Math.round(width)}" class="input input-bordered input-xs w-20 text-center font-mono" />
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/70">Height:</span>
        <input id="edit-height" type="number" step="1" min="1" value="${Math.round(height)}" class="input input-bordered input-xs w-20 text-center font-mono" />
      </div>
      <div class="flex justify-between items-center text-xs mt-2 pt-2 border-t border-base-300">
        <span class="text-base-content/50">West:</span>
        <span class="font-mono text-xs">${Math.round(west.x)}, ${Math.round(west.y)}</span>
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/50">North:</span>
        <span class="font-mono text-xs">${Math.round(north.x)}, ${Math.round(north.y)}</span>
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/50">East:</span>
        <span class="font-mono text-xs">${Math.round(east.x)}, ${Math.round(east.y)}</span>
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/50">South:</span>
        <span class="font-mono text-xs">${Math.round(south.x)}, ${Math.round(south.y)}</span>
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/50">Area:</span>
        <span class="font-mono text-xs">${area.toFixed(2)}</span>
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/50">Perimeter:</span>
        <span class="font-mono text-xs">${perimeter.toFixed(2)}</span>
      </div>
    `
  }

  /**
   * Generate style properties
   */
  private generateStyleProperties(obj: GeometricObject): string {
    const style = obj.style || gameStore_3b.style
    
    let html = `
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/70">Stroke Color:</span>
        <input id="edit-stroke-color" type="color" value="${this.numberToHex(style.color)}" class="w-8 h-8 border border-base-300 rounded cursor-pointer" />
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/70">Stroke Width:</span>
        <input id="edit-stroke-width" type="number" step="0.5" min="0.5" value="${style.strokeWidth}" class="input input-bordered input-xs w-20 text-center font-mono" />
      </div>
      <div class="flex justify-between items-center text-xs">
        <span class="text-base-content/70">Stroke Alpha:</span>
        <input id="edit-stroke-alpha" type="range" min="0" max="1" step="0.1" value="${style.strokeAlpha}" class="range range-xs range-accent w-20" />
        <span id="stroke-alpha-value" class="text-xs text-base-content/70">${style.strokeAlpha}</span>
      </div>
    `
    
    // Fill properties for supported objects
    if (this.objectSupportsFill(obj.type)) {
      if (style.fillColor !== undefined) {
        html += `
          <div class="flex justify-between items-center text-xs">
            <span class="text-base-content/70">Fill Color:</span>
            <input id="edit-fill-color" type="color" value="${this.numberToHex(style.fillColor)}" class="w-8 h-8 border border-base-300 rounded cursor-pointer" />
          </div>
          <div class="flex justify-between items-center text-xs">
            <span class="text-base-content/70">Fill Alpha:</span>
            <input id="edit-fill-alpha" type="range" min="0" max="1" step="0.1" value="${style.fillAlpha || 0.5}" class="range range-xs range-accent w-20" />
            <span id="fill-alpha-value" class="text-xs text-base-content/70">${style.fillAlpha || 0.5}</span>
          </div>
          <div class="flex justify-between items-center text-xs">
            <span class="text-base-content/70">Fill:</span>
            <button id="edit-remove-fill" class="btn btn-error btn-xs">Remove Fill</button>
          </div>
        `
      } else {
        html += `
          <div class="flex justify-between items-center text-xs">
            <span class="text-base-content/70">Fill:</span>
            <button id="edit-enable-fill" class="btn btn-primary btn-xs">Enable Fill</button>
          </div>
        `
      }
    }
    
    return html
  }

  /**
   * Check if object type supports fill
   */
  private objectSupportsFill(type: string): boolean {
    return ['circle', 'rectangle', 'diamond'].includes(type)
  }

  /**
   * Convert number to hex color string
   */
  private numberToHex(num: number): string {
    return `#${num.toString(16).padStart(6, '0')}`
  }

  /**
   * Convert hex color string to number
   */
  private hexToNumber(hex: string): number {
    return parseInt(hex.replace('#', ''), 16)
  }

  /**
   * Setup event handlers for the form
   */
  private setupEventHandlers(): void {
    if (!this.panel) return
    
    // Close button
    const closeButton = this.panel.querySelector('#edit-panel-close')
    closeButton?.addEventListener('click', () => this.closePanel())
    
    // Cancel button
    const cancelButton = this.panel.querySelector('#edit-panel-cancel')
    cancelButton?.addEventListener('click', () => this.closePanel())
    
    // Apply button
    const applyButton = this.panel.querySelector('#edit-panel-apply')
    applyButton?.addEventListener('click', () => this.applyChanges())
    
    // Live preview on input changes
    const inputs = this.panel.querySelectorAll('input, select')
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        this.updateLivePreview()
        this.updateRangeDisplays()
      })
    })

    // Enable/Remove fill buttons
    const enableFillButton = this.panel.querySelector('#edit-enable-fill')
    enableFillButton?.addEventListener('click', () => this.enableFill())
    
    const removeFillButton = this.panel.querySelector('#edit-remove-fill')
    removeFillButton?.addEventListener('click', () => this.removeFill())
  }

  /**
   * Update live preview of changes
   */
  private updateLivePreview(): void {
    if (!this.originalObject || !this.panel) return
    
    const selectedObjectId = gameStore_3b.selection.selectedObjectId
    if (!selectedObjectId) return
    
    const updates = this.buildUpdatedProperties()
    if (updates && Object.keys(updates).length > 0) {
      this.updateObjectInStore(selectedObjectId, updates)
      console.log('ObjectEditPanel_3b: Live preview updated', updates)
    }
  }

  /**
   * Update object in store directly
   */
  private updateObjectInStore(objectId: string, updates: any): void {
    const objIndex = gameStore_3b.geometry.objects.findIndex(obj => obj.id === objectId)
    if (objIndex !== -1) {
      gameStore_3b.geometry.objects[objIndex] = {
        ...gameStore_3b.geometry.objects[objIndex],
        ...updates
      }
    }
  }

  /**
   * Build updated properties from form inputs
   */
  private buildUpdatedProperties(): Partial<GeometricObject> | null {
    if (!this.originalObject || !this.panel) return null
    
    const updates: any = {}
    
    // Visibility
    const visibleInput = this.panel.querySelector('#edit-visible') as HTMLInputElement
    if (visibleInput && visibleInput.checked !== this.originalObject.isVisible) {
      updates.isVisible = visibleInput.checked
    }
    
    // Position and size updates based on type
    const updatedVertices = this.calculateUpdatedVertices()
    if (updatedVertices) {
      updates.vertices = updatedVertices
    }
    
    // Style updates
    const styleUpdates = this.buildStyleUpdates()
    if (styleUpdates && Object.keys(styleUpdates).length > 0) {
      updates.style = {
        ...(this.originalObject.style || gameStore_3b.style),
        ...styleUpdates
      }
    }
    
    return Object.keys(updates).length > 0 ? updates : null
  }

  /**
   * Calculate updated vertices using store authority methods - NO FALLBACKS
   */
  private calculateUpdatedVertices(): { x: number, y: number }[] | null {
    if (!this.panel || !this.originalObject) return null
    
    const type = this.originalObject.type
    const objectId = this.originalObject.id
    
    // Use store authority methods directly - NO try/catch fallback bullshit
    switch (type) {
      case 'point':
        return this.updatePointUsingStore(objectId)
      case 'line':
        return this.updateLineUsingStore(objectId)
      case 'circle':
        return this.updateCircleUsingStore(objectId)
      case 'rectangle':
        return this.updateRectangleUsingStore(objectId)
      case 'diamond':
        return this.updateDiamondUsingStore(objectId)
      default:
        console.warn('ObjectEditPanel_3b: Unknown geometry type for store update:', type)
        return null
    }
  }

  /**
   * ✅ NEW: Update point using store authority methods
   */
  private updatePointUsingStore(objectId: string): { x: number, y: number }[] | null {
    if (!this.panel) return null
    
    const centerXInput = this.panel.querySelector('#edit-center-x') as HTMLInputElement
    const centerYInput = this.panel.querySelector('#edit-center-y') as HTMLInputElement
    
    if (!centerXInput || !centerYInput) return null
    
    const center = {
      x: parseFloat(centerXInput.value) || 0,
      y: parseFloat(centerYInput.value) || 0
    }
    
    // Generate vertices and get updated object
    const vertices = [center]
    const success = gameStore_3b_methods.updateGeometryObjectVertices(objectId, vertices)
    return success ? vertices : null
  }

  /**
   * ✅ NEW: Update line using store authority methods
   */
  private updateLineUsingStore(objectId: string): { x: number, y: number }[] | null {
    if (!this.panel) return null
    
    const startXInput = this.panel.querySelector('#edit-start-x') as HTMLInputElement
    const startYInput = this.panel.querySelector('#edit-start-y') as HTMLInputElement
    const endXInput = this.panel.querySelector('#edit-end-x') as HTMLInputElement
    const endYInput = this.panel.querySelector('#edit-end-y') as HTMLInputElement
    
    if (!startXInput || !startYInput || !endXInput || !endYInput) return null
    
    const startPoint = {
      x: parseFloat(startXInput.value) || 0,
      y: parseFloat(startYInput.value) || 0
    }
    
    const endPoint = {
      x: parseFloat(endXInput.value) || 0,
      y: parseFloat(endYInput.value) || 0
    }
    
    // Use the store's line update method that handles property calculation
    const success = gameStore_3b_methods.updateLineFromProperties(objectId, startPoint, endPoint)
    return success ? [startPoint, endPoint] : null
  }

  /**
   * ✅ NEW: Update circle using store authority methods
   */
  private updateCircleUsingStore(objectId: string): { x: number, y: number }[] | null {
    if (!this.panel) return null
    
    const centerXInput = this.panel.querySelector('#edit-center-x') as HTMLInputElement
    const centerYInput = this.panel.querySelector('#edit-center-y') as HTMLInputElement
    const radiusInput = this.panel.querySelector('#edit-radius') as HTMLInputElement
    
    if (!centerXInput || !centerYInput || !radiusInput) return null
    
    const center = {
      x: parseFloat(centerXInput.value) || 0,
      y: parseFloat(centerYInput.value) || 0
    }
    
    const radius = parseFloat(radiusInput.value) || 1
    
    // Use the store's circle update method that handles vertex generation and properties
    const success = gameStore_3b_methods.updateCircleFromProperties(objectId, center, radius)
    if (!success) return null
    
    // Get the updated object to return its vertices
    const updatedObj = gameStore_3b.geometry.objects.find(obj => obj.id === objectId)
    return updatedObj?.vertices || null
  }

  /**
   * ✅ NEW: Update rectangle using store authority methods
   */
  private updateRectangleUsingStore(objectId: string): { x: number, y: number }[] | null {
    if (!this.panel) return null
    
    const centerXInput = this.panel.querySelector('#edit-center-x') as HTMLInputElement
    const centerYInput = this.panel.querySelector('#edit-center-y') as HTMLInputElement
    const widthInput = this.panel.querySelector('#edit-width') as HTMLInputElement
    const heightInput = this.panel.querySelector('#edit-height') as HTMLInputElement
    
    if (!centerXInput || !centerYInput || !widthInput || !heightInput) return null
    
    const center = {
      x: parseFloat(centerXInput.value) || 0,
      y: parseFloat(centerYInput.value) || 0
    }
    
    const width = parseFloat(widthInput.value) || 1
    const height = parseFloat(heightInput.value) || 1
    
    // Use the store's rectangle update method that handles vertex generation and properties
    const success = gameStore_3b_methods.updateRectangleFromProperties(objectId, center, width, height)
    if (!success) return null
    
    // Get the updated object to return its vertices
    const updatedObj = gameStore_3b.geometry.objects.find(obj => obj.id === objectId)
    return updatedObj?.vertices || null
  }

  /**
   * ✅ NEW: Update diamond using store authority methods
   */
  private updateDiamondUsingStore(objectId: string): { x: number, y: number }[] | null {
    if (!this.panel) return null
    
    const centerXInput = this.panel.querySelector('#edit-center-x') as HTMLInputElement
    const centerYInput = this.panel.querySelector('#edit-center-y') as HTMLInputElement
    const widthInput = this.panel.querySelector('#edit-width') as HTMLInputElement
    const heightInput = this.panel.querySelector('#edit-height') as HTMLInputElement
    
    if (!centerXInput || !centerYInput || !widthInput || !heightInput) return null
    
    const center = {
      x: parseFloat(centerXInput.value) || 0,
      y: parseFloat(centerYInput.value) || 0
    }
    
    const width = parseFloat(widthInput.value) || 1
    const height = parseFloat(heightInput.value) || 1
    
    // Use the store's diamond update method that handles vertex generation and properties
    const success = gameStore_3b_methods.updateDiamondFromProperties(objectId, center, width, height)
    if (!success) return null
    
    // Get the updated object to return its vertices
    const updatedObj = gameStore_3b.geometry.objects.find(obj => obj.id === objectId)
    return updatedObj?.vertices || null
  }


  /**
   * Build style updates from form inputs
   */
  private buildStyleUpdates(): any {
    if (!this.panel) return null
    
    const updates: any = {}
    
    // Stroke color
    const strokeColorInput = this.panel.querySelector('#edit-stroke-color') as HTMLInputElement
    if (strokeColorInput) {
      updates.strokeColor = this.hexToNumber(strokeColorInput.value)
    }
    
    // Stroke width
    const strokeWidthInput = this.panel.querySelector('#edit-stroke-width') as HTMLInputElement
    if (strokeWidthInput) {
      updates.strokeWidth = parseFloat(strokeWidthInput.value) || 1
    }
    
    // Stroke alpha
    const strokeAlphaInput = this.panel.querySelector('#edit-stroke-alpha') as HTMLInputElement
    if (strokeAlphaInput) {
      updates.strokeAlpha = parseFloat(strokeAlphaInput.value) || 1
    }
    
    // Fill color
    const fillColorInput = this.panel.querySelector('#edit-fill-color') as HTMLInputElement
    if (fillColorInput) {
      updates.fillColor = this.hexToNumber(fillColorInput.value)
    }
    
    // Fill alpha
    const fillAlphaInput = this.panel.querySelector('#edit-fill-alpha') as HTMLInputElement
    if (fillAlphaInput) {
      updates.fillAlpha = parseFloat(fillAlphaInput.value) || 0.5
    }
    
    return updates
  }

  /**
   * Update range display values
   */
  private updateRangeDisplays(): void {
    if (!this.panel) return
    
    // Update stroke alpha display
    const strokeAlphaInput = this.panel.querySelector('#edit-stroke-alpha') as HTMLInputElement
    const strokeAlphaValue = this.panel.querySelector('#stroke-alpha-value')
    if (strokeAlphaInput && strokeAlphaValue) {
      strokeAlphaValue.textContent = strokeAlphaInput.value
    }
    
    // Update fill alpha display
    const fillAlphaInput = this.panel.querySelector('#edit-fill-alpha') as HTMLInputElement
    const fillAlphaValue = this.panel.querySelector('#fill-alpha-value')
    if (fillAlphaInput && fillAlphaValue) {
      fillAlphaValue.textContent = fillAlphaInput.value
    }
  }

  /**
   * Enable fill for the current object
   */
  private enableFill(): void {
    const selectedObjectId = gameStore_3b.selection.selectedObjectId
    if (!selectedObjectId) return
    
    const updates = {
      style: {
        ...(this.originalObject?.style || gameStore_3b.style),
        fillColor: gameStore_3b.style.fillColor,
        fillAlpha: gameStore_3b.style.fillAlpha
      }
    }
    
    this.updateObjectInStore(selectedObjectId, updates)
    this.loadSelectedObject() // Refresh form
  }

  /**
   * Remove fill from the current object
   */
  private removeFill(): void {
    const selectedObjectId = gameStore_3b.selection.selectedObjectId
    if (!selectedObjectId) return
    
    const updates = {
      style: {
        ...(this.originalObject?.style || gameStore_3b.style),
        fillColor: undefined,
        fillAlpha: undefined
      }
    }
    
    this.updateObjectInStore(selectedObjectId, updates)
    this.loadSelectedObject() // Refresh form
  }

  /**
   * Apply changes and close panel
   */
  private applyChanges(): void {
    // Changes already applied via live preview
    this.originalObject = null
    gameStore_3b.selection.isEditPanelOpen = false
    console.log('ObjectEditPanel_3b: Changes applied')
  }

  /**
   * Close panel and restore original object if cancelled
   */
  private closePanel(): void {
    // Restore original object if cancelled
    if (this.originalObject) {
      const selectedObjectId = gameStore_3b.selection.selectedObjectId
      if (selectedObjectId) {
        this.updateObjectInStore(selectedObjectId, this.originalObject)
        console.log('ObjectEditPanel_3b: Restored original object on cancel')
      }
    }
    
    this.originalObject = null
    gameStore_3b.selection.isEditPanelOpen = false
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    // Clean implementation - no complex cleanup needed
    this.originalObject = null
    console.log('ObjectEditPanel_3b: Destroyed')
  }
}