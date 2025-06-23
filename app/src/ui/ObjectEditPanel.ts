import { subscribe } from 'valtio'
import { gameStore, updateGameStore } from '../store/gameStore'
import { GeometryVertexCalculator } from '../game/GeometryVertexCalculator'
import type { GeometricObject, GeometricDiamond, GeometricRectangle, GeometricCircle, GeometricLine, GeometricPoint, PixeloidAnchorPoint, PixeloidCoordinate } from '../types'

export class ObjectEditPanel {
  private elements: Map<string, HTMLElement> = new Map()
  private isVisible: boolean = false
  private originalObject: GeometricObject | null = null
  private originalAnchorOverride: any = null // Save original anchor override state
  private panel: HTMLElement | null = null
  
  constructor() {
    this.panel = document.getElementById('object-edit-panel')
    this.setupReactivity()
  }
  
  private setupReactivity(): void {
    subscribe(gameStore.geometry.selection, () => {
      this.updateVisibility()
    })
  }
  
  private updateVisibility(): void {
    const shouldBeVisible = gameStore.geometry.selection.isEditPanelOpen
    
    if (shouldBeVisible !== this.isVisible) {
      this.isVisible = shouldBeVisible
      if (this.panel) {
        this.panel.style.display = this.isVisible ? 'block' : 'none'
      }
      
      if (this.isVisible) {
        this.loadSelectedObject()
      }
    }
  }
  
  private loadSelectedObject(): void {
    const selectedObjectId = gameStore.geometry.selection.selectedObjectId
    if (!selectedObjectId) return
    
    const selectedObject = gameStore.geometry.objects.find(obj => obj.id === selectedObjectId)
    if (!selectedObject) return
    
    // Store original object for restoration on cancel
    this.originalObject = { ...selectedObject }
    
    // Store original anchor override state for restoration on cancel
    this.originalAnchorOverride = updateGameStore.getObjectAnchor(selectedObjectId)
    
    // Generate form based on object type
    this.generateForm(selectedObject)
  }
  
  private generateForm(obj: GeometricObject): void {
    if (!this.panel) return
    
    const objectType = this.getObjectType(obj)
    
    this.panel.innerHTML = `
      <!-- Header -->
      <div class="bg-base-200/50 border-b border-base-300 p-4 flex justify-between items-center">
        <h2 class="text-lg font-bold text-accent flex items-center gap-2">
          <span class="text-warning">✏️</span>
          Edit ${objectType}
        </h2>
        <button id="edit-panel-close" class="btn btn-sm btn-ghost btn-circle">
          <span class="text-lg">✕</span>
        </button>
      </div>
      
      <!-- Content -->
      <div class="p-4 space-y-4">
        <div class="alert alert-info bg-info/10 border-info/20">
          <div class="text-sm">
            <div class="font-bold mb-1">Object ID:</div>
            <div class="font-mono text-xs">${obj.id}</div>
          </div>
        </div>

        <!-- Object Properties -->
        <div id="object-properties" class="space-y-3">
          ${this.generateObjectProperties(obj)}
        </div>

        <!-- Actions -->
        <div class="flex gap-2 pt-4">
          <button id="edit-panel-apply" class="btn btn-primary flex-1">Apply Changes</button>
          <button id="edit-panel-cancel" class="btn btn-outline flex-1">Cancel</button>
        </div>
      </div>
    `
    
    this.setupEventHandlers()
  }
  
  private getObjectType(obj: GeometricObject): string {
    if ('anchorX' in obj) return 'Diamond'
    if ('width' in obj && 'height' in obj) return 'Rectangle'
    if ('centerX' in obj && 'radius' in obj) return 'Circle'
    if ('startX' in obj && 'endX' in obj) return 'Line'
    if ('x' in obj && 'y' in obj) return 'Point'
    return 'Object'
  }

  private objectSupportsFill(obj: GeometricObject): boolean {
    // Check if the object type supports fill (circles, rectangles, diamonds)
    // Points and lines don't support fill
    return 'anchorX' in obj || ('width' in obj && 'height' in obj) || 'radius' in obj
  }
  
  private generateObjectProperties(obj: GeometricObject): string {
    let html = ''
    
    // Anchor Configuration
    html += this.generateAnchorControls(obj)
    
    // Common properties
    html += `
      <div>
        <label class="label">
          <span class="label-text">Visible:</span>
        </label>
        <input id="edit-visible" type="checkbox" class="toggle toggle-primary" ${obj.isVisible ? 'checked' : ''} />
      </div>
    `
    
    // Color property (all objects have it)
    html += `
      <div>
        <label class="label">
          <span class="label-text">Color:</span>
        </label>
        <input id="edit-color" type="color" value="${this.numberToHex(obj.color)}" class="input input-bordered w-full h-12" />
      </div>
    `
    
    // Stroke width for objects that have it
    if ('strokeWidth' in obj) {
      html += `
        <div>
          <label class="label">
            <span class="label-text">Stroke Width:</span>
          </label>
          <input id="edit-stroke-width" type="number" step="0.5" min="0.5" value="${obj.strokeWidth}" class="input input-bordered w-full" />
        </div>
      `
    }

    // Stroke alpha for all objects
    html += `
      <div>
        <label class="label">
          <span class="label-text">Stroke Alpha:</span>
        </label>
        <input id="edit-stroke-alpha" type="range" min="0" max="1" step="0.1" value="${obj.strokeAlpha}" class="range range-primary" />
        <span class="text-xs text-base-content/70">${obj.strokeAlpha}</span>
      </div>
    `

    // Fill color and alpha for objects that support fill (circles, rectangles, diamonds)
    if (this.objectSupportsFill(obj)) {
      const fillObj = obj as GeometricCircle | GeometricRectangle | GeometricDiamond
      if (fillObj.fillColor !== undefined) {
        html += `
          <div>
            <label class="label">
              <span class="label-text">Fill Color:</span>
            </label>
            <div class="flex gap-2">
              <input id="edit-fill-color" type="color" value="${this.numberToHex(fillObj.fillColor)}" class="input input-bordered flex-1 h-12" />
              <button id="edit-remove-fill" class="btn btn-error btn-sm">Remove Fill</button>
            </div>
          </div>
          <div>
            <label class="label">
              <span class="label-text">Fill Alpha:</span>
            </label>
            <input id="edit-fill-alpha" type="range" min="0" max="1" step="0.1" value="${fillObj.fillAlpha ?? 0.5}" class="range range-primary" />
            <span class="text-xs text-base-content/70">${fillObj.fillAlpha ?? 0.5}</span>
          </div>
        `
      } else {
        html += `
          <div>
            <label class="label">
              <span class="label-text">Fill:</span>
            </label>
            <button id="edit-enable-fill" class="btn btn-primary btn-sm">Enable Fill</button>
          </div>
        `
      }
    }
    
    // Type-specific properties
    if ('anchorX' in obj && 'anchorY' in obj) {
      // Diamond
      const diamond = obj as GeometricDiamond
      html += `
        <div>
          <label class="label">
            <span class="label-text">Anchor X:</span>
          </label>
          <input id="edit-anchor-x" type="number" step="0.5" value="${diamond.anchorX}" class="input input-bordered w-full" />
        </div>
        <div>
          <label class="label">
            <span class="label-text">Anchor Y:</span>
          </label>
          <input id="edit-anchor-y" type="number" step="0.5" value="${diamond.anchorY}" class="input input-bordered w-full" />
        </div>
        <div>
          <label class="label">
            <span class="label-text">Width:</span>
          </label>
          <input id="edit-width" type="number" step="1" min="0" value="${diamond.width}" class="input input-bordered w-full" />
        </div>
      `
    } else if ('width' in obj && 'height' in obj) {
      // Rectangle
      const rect = obj as GeometricRectangle
      html += `
        <div>
          <label class="label">
            <span class="label-text">X Position:</span>
          </label>
          <input id="edit-x" type="number" step="0.5" value="${rect.x}" class="input input-bordered w-full" />
        </div>
        <div>
          <label class="label">
            <span class="label-text">Y Position:</span>
          </label>
          <input id="edit-y" type="number" step="0.5" value="${rect.y}" class="input input-bordered w-full" />
        </div>
        <div>
          <label class="label">
            <span class="label-text">Width:</span>
          </label>
          <input id="edit-width" type="number" step="1" min="1" value="${rect.width}" class="input input-bordered w-full" />
        </div>
        <div>
          <label class="label">
            <span class="label-text">Height:</span>
          </label>
          <input id="edit-height" type="number" step="1" min="1" value="${rect.height}" class="input input-bordered w-full" />
        </div>
      `
    } else if ('centerX' in obj && 'centerY' in obj && 'radius' in obj) {
      // Circle
      const circle = obj as GeometricCircle
      html += `
        <div>
          <label class="label">
            <span class="label-text">Center X:</span>
          </label>
          <input id="edit-center-x" type="number" step="0.5" value="${circle.centerX}" class="input input-bordered w-full" />
        </div>
        <div>
          <label class="label">
            <span class="label-text">Center Y:</span>
          </label>
          <input id="edit-center-y" type="number" step="0.5" value="${circle.centerY}" class="input input-bordered w-full" />
        </div>
        <div>
          <label class="label">
            <span class="label-text">Radius:</span>
          </label>
          <input id="edit-radius" type="number" step="1" min="1" value="${circle.radius}" class="input input-bordered w-full" />
        </div>
      `
    } else if ('startX' in obj && 'startY' in obj && 'endX' in obj && 'endY' in obj) {
      // Line
      const line = obj as GeometricLine
      html += `
        <div>
          <label class="label">
            <span class="label-text">Start X:</span>
          </label>
          <input id="edit-start-x" type="number" step="0.5" value="${line.startX}" class="input input-bordered w-full" />
        </div>
        <div>
          <label class="label">
            <span class="label-text">Start Y:</span>
          </label>
          <input id="edit-start-y" type="number" step="0.5" value="${line.startY}" class="input input-bordered w-full" />
        </div>
        <div>
          <label class="label">
            <span class="label-text">End X:</span>
          </label>
          <input id="edit-end-x" type="number" step="0.5" value="${line.endX}" class="input input-bordered w-full" />
        </div>
        <div>
          <label class="label">
            <span class="label-text">End Y:</span>
          </label>
          <input id="edit-end-y" type="number" step="0.5" value="${line.endY}" class="input input-bordered w-full" />
        </div>
      `
    } else if ('x' in obj && 'y' in obj && !('width' in obj)) {
      // Point
      const point = obj as GeometricPoint
      html += `
        <div>
          <label class="label">
            <span class="label-text">X Position:</span>
          </label>
          <input id="edit-x" type="number" step="0.5" value="${point.x}" class="input input-bordered w-full" />
        </div>
        <div>
          <label class="label">
            <span class="label-text">Y Position:</span>
          </label>
          <input id="edit-y" type="number" step="0.5" value="${point.y}" class="input input-bordered w-full" />
        </div>
      `
    }
    
    return html
  }

  /**
   * Generate anchor configuration controls for per-object anchoring
   */
  private generateAnchorControls(obj: GeometricObject): string {
    const objectType = this.getObjectType(obj).toLowerCase()
    
    // Get current anchor override or default
    const currentOverride = updateGameStore.getObjectAnchor(obj.id)
    const defaultAnchor = updateGameStore.getDefaultAnchor(objectType as any)
    const currentAnchor = currentOverride ? currentOverride.firstPointAnchor : defaultAnchor
    
    const anchorOptions = [
      { value: 'top-left', label: 'Top Left' },
      { value: 'top-mid', label: 'Top Center' },
      { value: 'top-right', label: 'Top Right' },
      { value: 'left-mid', label: 'Left Center' },
      { value: 'center', label: 'Center' },
      { value: 'right-mid', label: 'Right Center' },
      { value: 'bottom-left', label: 'Bottom Left' },
      { value: 'bottom-mid', label: 'Bottom Center' },
      { value: 'bottom-right', label: 'Bottom Right' }
    ]

    let html = `
      <div class="bg-warning/10 border border-warning/20 rounded-lg p-3 mb-3">
        <h4 class="font-bold text-sm text-warning mb-2 flex items-center gap-2">
          <span>⚓</span>
          Object Anchoring
        </h4>
        <div class="space-y-2">
          <div>
            <label class="label">
              <span class="label-text">Anchor Point:</span>
            </label>
            <select id="edit-anchor-point" class="select select-bordered select-sm w-full">
    `
    
    // Add anchor options
    anchorOptions.forEach(option => {
      const selected = option.value === currentAnchor ? 'selected' : ''
      html += `<option value="${option.value}" ${selected}>${option.label}</option>`
    })
    
    html += `
            </select>
          </div>
          <div class="flex gap-2">
            <button id="edit-reset-anchor" class="btn btn-sm btn-outline flex-1">Reset to Default</button>
            <span class="text-xs text-base-content/70 flex items-center">
              Default: ${anchorOptions.find(opt => opt.value === defaultAnchor)?.label || defaultAnchor}
            </span>
          </div>
        </div>
      </div>
    `
    
    return html
  }
  
  private numberToHex(num: number): string {
    return `#${num.toString(16).padStart(6, '0')}`
  }
  
  private hexToNumber(hex: string): number {
    return parseInt(hex.replace('#', ''), 16)
  }
  
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
    const inputs = this.panel.querySelectorAll('input')
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        this.updatePreview()
        // Update range slider display values
        this.updateRangeDisplays()
      })
    })

    // Handle enable fill button
    const enableFillButton = this.panel.querySelector('#edit-enable-fill') as HTMLButtonElement
    if (enableFillButton) {
      enableFillButton.addEventListener('click', () => {
        // Enable fill with default color and alpha
        const selectedObjectId = gameStore.geometry.selection.selectedObjectId
        if (selectedObjectId) {
          updateGameStore.updateGeometricObject(selectedObjectId, {
            fillColor: gameStore.geometry.drawing.settings.defaultFillColor,
            fillAlpha: gameStore.geometry.drawing.settings.fillAlpha
          })
          // Regenerate the form to show the new fill controls
          this.loadSelectedObject()
        }
      })
    }

    // Handle remove fill button
    const removeFillButton = this.panel.querySelector('#edit-remove-fill') as HTMLButtonElement
    if (removeFillButton) {
      removeFillButton.addEventListener('click', () => {
        // Remove fill by setting fillColor to undefined
        const selectedObjectId = gameStore.geometry.selection.selectedObjectId
        if (selectedObjectId) {
          const updates: any = { fillColor: undefined, fillAlpha: undefined }
          updateGameStore.updateGeometricObject(selectedObjectId, updates)
          // Regenerate the form to show the enable fill button
          this.loadSelectedObject()
        }
      })
    }

    // Handle anchor point changes
    const anchorSelect = this.panel.querySelector('#edit-anchor-point') as HTMLSelectElement
    if (anchorSelect) {
      anchorSelect.addEventListener('change', () => {
        const selectedObjectId = gameStore.geometry.selection.selectedObjectId
        if (selectedObjectId) {
          this.handleAnchorChange(selectedObjectId, anchorSelect.value as PixeloidAnchorPoint)
        }
      })
    }

    // Handle reset anchor button
    const resetAnchorButton = this.panel.querySelector('#edit-reset-anchor') as HTMLButtonElement
    if (resetAnchorButton) {
      resetAnchorButton.addEventListener('click', () => {
        const selectedObjectId = gameStore.geometry.selection.selectedObjectId
        if (selectedObjectId) {
          updateGameStore.clearObjectAnchor(selectedObjectId)
          console.log(`ObjectEditPanel: Reset object anchor for ${selectedObjectId} to default`)
          // Regenerate the form to show the updated anchor
          this.loadSelectedObject()
        }
      })
    }
  }
  
  private updatePreview(): void {
    if (!this.originalObject || !this.panel) return
    
    const selectedObjectId = gameStore.geometry.selection.selectedObjectId
    if (!selectedObjectId) return
    
    const updates = this.buildUpdatedProperties()
    if (updates && Object.keys(updates).length > 0) {
      updateGameStore.updateGeometricObject(selectedObjectId, updates)
    }
  }

  private buildUpdatedProperties(): Partial<GeometricObject> | null {
    if (!this.originalObject || !this.panel) return null
    
    const updates: Partial<GeometricObject> = {}
    
    // Common properties
    const visibleInput = this.panel.querySelector('#edit-visible') as HTMLInputElement
    if (visibleInput && visibleInput.checked !== this.originalObject.isVisible) {
      updates.isVisible = visibleInput.checked
    }
    
    const colorInput = this.panel.querySelector('#edit-color') as HTMLInputElement
    if (colorInput) {
      const newColor = this.hexToNumber(colorInput.value)
      if (newColor !== this.originalObject.color) {
        updates.color = newColor
      }
    }
    
    const strokeWidthInput = this.panel.querySelector('#edit-stroke-width') as HTMLInputElement
    if (strokeWidthInput && 'strokeWidth' in this.originalObject) {
      const newStrokeWidth = parseFloat(strokeWidthInput.value) || 1
      if (newStrokeWidth !== (this.originalObject as any).strokeWidth) {
        (updates as any).strokeWidth = newStrokeWidth
      }
    }

    // Stroke alpha (all objects have this)
    const strokeAlphaInput = this.panel.querySelector('#edit-stroke-alpha') as HTMLInputElement
    if (strokeAlphaInput) {
      const newStrokeAlpha = parseFloat(strokeAlphaInput.value) || 1
      if (newStrokeAlpha !== this.originalObject.strokeAlpha) {
        (updates as any).strokeAlpha = newStrokeAlpha
      }
    }

    // Fill color and alpha for objects that support fill
    if (this.objectSupportsFill(this.originalObject)) {
      const fillObj = this.originalObject as GeometricCircle | GeometricRectangle | GeometricDiamond
      
      const fillColorInput = this.panel.querySelector('#edit-fill-color') as HTMLInputElement
      if (fillColorInput && fillObj.fillColor !== undefined) {
        const newFillColor = this.hexToNumber(fillColorInput.value)
        if (newFillColor !== fillObj.fillColor) {
          (updates as any).fillColor = newFillColor
        }
      }

      const fillAlphaInput = this.panel.querySelector('#edit-fill-alpha') as HTMLInputElement
      if (fillAlphaInput && fillObj.fillColor !== undefined) {
        const newFillAlpha = parseFloat(fillAlphaInput.value) || 0.5
        if (newFillAlpha !== (fillObj.fillAlpha ?? 0.5)) {
          (updates as any).fillAlpha = newFillAlpha
        }
      }
    }
    
    // Type-specific updates
    if ('anchorX' in this.originalObject) {
      // Diamond
      const diamond = this.originalObject as GeometricDiamond
      const anchorXInput = this.panel.querySelector('#edit-anchor-x') as HTMLInputElement
      const anchorYInput = this.panel.querySelector('#edit-anchor-y') as HTMLInputElement
      const widthInput = this.panel.querySelector('#edit-width') as HTMLInputElement
      
      if (anchorXInput) {
        const newAnchorX = parseFloat(anchorXInput.value) || 0
        if (newAnchorX !== diamond.anchorX) {
          (updates as any).anchorX = newAnchorX
        }
      }
      if (anchorYInput) {
        const newAnchorY = parseFloat(anchorYInput.value) || 0
        if (newAnchorY !== diamond.anchorY) {
          (updates as any).anchorY = newAnchorY
        }
      }
      if (widthInput) {
        const width = parseFloat(widthInput.value) || 0
        if (width !== diamond.width) {
          (updates as any).width = width
          ;(updates as any).height = width / 4 // Calculate height
        }
      }
    } else if ('width' in this.originalObject && 'height' in this.originalObject) {
      // Rectangle
      const rect = this.originalObject as GeometricRectangle
      const xInput = this.panel.querySelector('#edit-x') as HTMLInputElement
      const yInput = this.panel.querySelector('#edit-y') as HTMLInputElement
      const widthInput = this.panel.querySelector('#edit-width') as HTMLInputElement
      const heightInput = this.panel.querySelector('#edit-height') as HTMLInputElement
      
      if (xInput) {
        const newX = parseFloat(xInput.value) || 0
        if (newX !== rect.x) (updates as any).x = newX
      }
      if (yInput) {
        const newY = parseFloat(yInput.value) || 0
        if (newY !== rect.y) (updates as any).y = newY
      }
      if (widthInput) {
        const newWidth = Math.max(1, parseInt(widthInput.value) || 1)
        if (newWidth !== rect.width) (updates as any).width = newWidth
      }
      if (heightInput) {
        const newHeight = Math.max(1, parseInt(heightInput.value) || 1)
        if (newHeight !== rect.height) (updates as any).height = newHeight
      }
    } else if ('centerX' in this.originalObject && 'radius' in this.originalObject) {
      // Circle
      const circle = this.originalObject as GeometricCircle
      const centerXInput = this.panel.querySelector('#edit-center-x') as HTMLInputElement
      const centerYInput = this.panel.querySelector('#edit-center-y') as HTMLInputElement
      const radiusInput = this.panel.querySelector('#edit-radius') as HTMLInputElement
      
      if (centerXInput) {
        const newCenterX = parseFloat(centerXInput.value) || 0
        if (newCenterX !== circle.centerX) (updates as any).centerX = newCenterX
      }
      if (centerYInput) {
        const newCenterY = parseFloat(centerYInput.value) || 0
        if (newCenterY !== circle.centerY) (updates as any).centerY = newCenterY
      }
      if (radiusInput) {
        const newRadius = Math.max(1, parseInt(radiusInput.value) || 1)
        if (newRadius !== circle.radius) (updates as any).radius = newRadius
      }
    } else if ('startX' in this.originalObject && 'endX' in this.originalObject) {
      // Line
      const line = this.originalObject as GeometricLine
      const startXInput = this.panel.querySelector('#edit-start-x') as HTMLInputElement
      const startYInput = this.panel.querySelector('#edit-start-y') as HTMLInputElement
      const endXInput = this.panel.querySelector('#edit-end-x') as HTMLInputElement
      const endYInput = this.panel.querySelector('#edit-end-y') as HTMLInputElement
      
      if (startXInput) {
        const newStartX = parseFloat(startXInput.value) || 0
        if (newStartX !== line.startX) (updates as any).startX = newStartX
      }
      if (startYInput) {
        const newStartY = parseFloat(startYInput.value) || 0
        if (newStartY !== line.startY) (updates as any).startY = newStartY
      }
      if (endXInput) {
        const newEndX = parseFloat(endXInput.value) || 0
        if (newEndX !== line.endX) (updates as any).endX = newEndX
      }
      if (endYInput) {
        const newEndY = parseFloat(endYInput.value) || 0
        if (newEndY !== line.endY) (updates as any).endY = newEndY
      }
    } else if ('x' in this.originalObject && 'y' in this.originalObject && !('width' in this.originalObject)) {
      // Point
      const point = this.originalObject as GeometricPoint
      const xInput = this.panel.querySelector('#edit-x') as HTMLInputElement
      const yInput = this.panel.querySelector('#edit-y') as HTMLInputElement
      
      if (xInput) {
        const newX = parseFloat(xInput.value) || 0
        if (newX !== point.x) (updates as any).x = newX
      }
      if (yInput) {
        const newY = parseFloat(yInput.value) || 0
        if (newY !== point.y) (updates as any).y = newY
      }
    }
    
    return updates
  }

  private updateRangeDisplays(): void {
    if (!this.panel) return

    // Update stroke alpha display
    const strokeAlphaInput = this.panel.querySelector('#edit-stroke-alpha') as HTMLInputElement
    const strokeAlphaDisplay = this.panel.querySelector('#edit-stroke-alpha + span')
    if (strokeAlphaInput && strokeAlphaDisplay) {
      strokeAlphaDisplay.textContent = strokeAlphaInput.value
    }

    // Update fill alpha display
    const fillAlphaInput = this.panel.querySelector('#edit-fill-alpha') as HTMLInputElement
    const fillAlphaDisplay = this.panel.querySelector('#edit-fill-alpha + span')
    if (fillAlphaInput && fillAlphaDisplay) {
      fillAlphaDisplay.textContent = fillAlphaInput.value
    }
  }
  
  
  private applyChanges(): void {
    // Changes are already applied via live preview
    this.originalObject = null
    this.originalAnchorOverride = null // Clear original state since changes are accepted
    updateGameStore.setEditPanelOpen(false)
  }
  
  /**
   * Handle anchor point changes using existing vertex calculation system
   */
  private handleAnchorChange(objectId: string, newAnchor: PixeloidAnchorPoint): void {
    const selectedObject = gameStore.geometry.objects.find(obj => obj.id === objectId)
    if (!selectedObject) {
      console.warn(`ObjectEditPanel: Object ${objectId} not found for anchor change`)
      return
    }

    const objectType = this.getObjectType(selectedObject).toLowerCase()
    console.log(`ObjectEditPanel: Changing anchor for ${objectId} to ${newAnchor}`)

    // Step 1: Extract geometry defining points from current coordinates
    const geometryPoints = this.extractGeometryPoints(selectedObject)

    // Step 2: Create new anchor config
    const newAnchorConfig = {
      firstPointAnchor: newAnchor,
      secondPointAnchor: newAnchor
    }

    // Step 3: Recalculate vertices using existing vertex calculation system
    const newVertices = GeometryVertexCalculator.calculateGeometryVertices(
      geometryPoints.firstPos,
      geometryPoints.secondPos,
      objectType as 'point' | 'line' | 'circle' | 'rectangle' | 'diamond',
      newAnchorConfig
    )

    // Step 4: Extract properties using existing system
    const newProperties = GeometryVertexCalculator.extractGeometryProperties(
      newVertices,
      objectType
    )

    // Step 5: Update object coordinates AND anchor override
    updateGameStore.updateGeometricObject(objectId, newProperties)
    updateGameStore.setObjectAnchor(objectId, newAnchorConfig)
    
    console.log(`ObjectEditPanel: Anchor changed using vertex recalculation:`, newProperties)
  }

  /**
   * Extract geometry defining points from current object coordinates
   */
  private extractGeometryPoints(obj: GeometricObject): {
    firstPos: PixeloidCoordinate,
    secondPos: PixeloidCoordinate
  } {
    
    if ('x' in obj && 'width' in obj && 'height' in obj) {
      // Rectangle: use top-left + bottom-right
      const rect = obj as GeometricRectangle
      return {
        firstPos: { __brand: 'pixeloid', x: rect.x, y: rect.y },
        secondPos: { __brand: 'pixeloid', x: rect.x + rect.width, y: rect.y + rect.height }
      }
    }
    
    if ('centerX' in obj && 'centerY' in obj && 'radius' in obj) {
      // Circle: use west + east points
      const circle = obj as GeometricCircle
      return {
        firstPos: { __brand: 'pixeloid', x: circle.centerX - circle.radius, y: circle.centerY },
        secondPos: { __brand: 'pixeloid', x: circle.centerX + circle.radius, y: circle.centerY }
      }
    }
    
    if ('anchorX' in obj && 'anchorY' in obj) {
      // Diamond: use west + east vertices
      const diamond = obj as GeometricDiamond
      return {
        firstPos: { __brand: 'pixeloid', x: diamond.anchorX, y: diamond.anchorY },
        secondPos: { __brand: 'pixeloid', x: diamond.anchorX + diamond.width, y: diamond.anchorY }
      }
    }
    
    if ('startX' in obj && 'endX' in obj) {
      // Line: use start + end
      const line = obj as GeometricLine
      return {
        firstPos: { __brand: 'pixeloid', x: line.startX, y: line.startY },
        secondPos: { __brand: 'pixeloid', x: line.endX, y: line.endY }
      }
    }
    
    if ('x' in obj && 'y' in obj && !('width' in obj)) {
      // Point: same position for both
      const point = obj as GeometricPoint
      return {
        firstPos: { __brand: 'pixeloid', x: point.x, y: point.y },
        secondPos: { __brand: 'pixeloid', x: point.x, y: point.y }
      }
    }
    
    // Fallback
    return {
      firstPos: { __brand: 'pixeloid', x: 0, y: 0 },
      secondPos: { __brand: 'pixeloid', x: 0, y: 0 }
    }
  }

  private closePanel(): void {
    // Restore original object if cancelled
    if (this.originalObject) {
      const selectedObjectId = gameStore.geometry.selection.selectedObjectId
      if (selectedObjectId) {
        const objectIndex = gameStore.geometry.objects.findIndex(obj => obj.id === selectedObjectId)
        if (objectIndex !== -1) {
          gameStore.geometry.objects[objectIndex] = this.originalObject
        }
        
        // Restore original anchor override state
        if (this.originalAnchorOverride) {
          updateGameStore.setObjectAnchor(selectedObjectId, this.originalAnchorOverride)
        } else {
          updateGameStore.clearObjectAnchor(selectedObjectId)
        }
        
        console.log(`ObjectEditPanel: Restored object and anchor override state on cancel`)
      }
    }
    
    this.originalObject = null
    this.originalAnchorOverride = null
    updateGameStore.setEditPanelOpen(false)
  }
  
  public destroy(): void {
    this.elements.clear()
  }
}