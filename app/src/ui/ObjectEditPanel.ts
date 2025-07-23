/**
 * ObjectEditPanel.ts - CORRECTED Unified Store Integration
 * 
 * Object editing panel using unified game store.
 * Fixes the circle movement bug through direct form data usage.
 * need a double check is correct
 */

import { gameStore, gameStore_methods } from '../store/game-store'
import { UnifiedGeometryGenerator } from '../store/helpers/UnifiedGeometryGenerator'
import type { GeometricObject, ObjectEditFormData } from '../types'

export class ObjectEditPanel {
  private panelElement: HTMLElement | null = null
  private formElement: HTMLFormElement | null = null

  constructor() {
    this.createPanelHTML()
    this.setupEventListeners()
  }

  /**
   * Initialize and show edit panel for selected object
   * CONNECTS TO: gameStore_methods.startPreview() from unified store
   */
  public showPanel(): void {
    const selectedObjectId = gameStore.selection.selectedId
    if (!selectedObjectId) {
      console.warn('No object selected for editing')
      return
    }

    // ✅ CORRECTED: Use unified preview system
    gameStore_methods.startPreview('move', selectedObjectId)
    
    const selectedObject = gameStore_methods.getSelectedObject()
    if (!selectedObject) {
      console.warn('Selected object not found')
      return
    }

    this.populateForm(selectedObject)
    this.showPanelElement()
    gameStore.ui.isEditPanelOpen = true
  }

  /**
   * Hide and cleanup edit panel
   */
  public hidePanel(): void {
    this.hidePanelElement()
    gameStore.ui.isEditPanelOpen = false
  }

  /**
   * Create the HTML structure for the edit panel
   */
  private createPanelHTML(): void {
    const panelHTML = `
      <div id="object-edit-panel" class="object-edit-panel" style="display: none;">
        <div class="panel-header">
          <h3>Edit Object</h3>
          <button id="edit-panel-close" class="close-button">&times;</button>
        </div>
        
        <form id="object-edit-form" class="edit-form">
          <!-- Object Type Display -->
          <div class="form-group">
            <label>Type:</label>
            <span id="edit-object-type" class="object-type-display"></span>
          </div>
          
          <!-- Visibility Toggle -->
          <div class="form-group">
            <label>
              <input type="checkbox" id="edit-visibility" />
              Visible
            </label>
          </div>
          
          <!-- Shape-specific properties (dynamically populated) -->
          <div id="shape-properties" class="shape-properties"></div>
          
          <!-- Style Properties -->
          <div class="style-section">
            <h4>Style</h4>
            
            <div class="form-group">
              <label for="edit-stroke-color">Stroke Color:</label>
              <input type="color" id="edit-stroke-color" />
            </div>
            
            <div class="form-group">
              <label for="edit-stroke-width">Stroke Width:</label>
              <input type="number" id="edit-stroke-width" min="1" max="10" step="1" />
            </div>
            
            <div class="form-group">
              <label for="edit-stroke-alpha">Stroke Alpha:</label>
              <input type="range" id="edit-stroke-alpha" min="0" max="1" step="0.1" />
              <span id="stroke-alpha-value">1.0</span>
            </div>
            
            <div class="form-group">
              <label>
                <input type="checkbox" id="edit-fill-enabled" />
                Enable Fill
              </label>
            </div>
            
            <div class="form-group" id="fill-controls" style="display: none;">
              <label for="edit-fill-color">Fill Color:</label>
              <input type="color" id="edit-fill-color" />
              
              <label for="edit-fill-alpha">Fill Alpha:</label>
              <input type="range" id="edit-fill-alpha" min="0" max="1" step="0.1" />
              <span id="fill-alpha-value">0.3</span>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div class="form-actions">
            <button type="button" id="edit-apply" class="apply-button">Apply</button>
            <button type="button" id="edit-cancel" class="cancel-button">Cancel</button>
          </div>
        </form>
      </div>
    `
    
    document.body.insertAdjacentHTML('beforeend', panelHTML)
    this.panelElement = document.getElementById('object-edit-panel')
    this.formElement = document.getElementById('object-edit-form') as HTMLFormElement
  }

  /**
   * Setup all event listeners
   */
  private setupEventListeners(): void {
    if (!this.panelElement) return

    // Close button
    const closeBtn = document.getElementById('edit-panel-close')
    closeBtn?.addEventListener('click', () => this.handleCancel())

    // Apply button
    const applyBtn = document.getElementById('edit-apply')
    applyBtn?.addEventListener('click', () => this.handleApply())

    // Cancel button
    const cancelBtn = document.getElementById('edit-cancel')
    cancelBtn?.addEventListener('click', () => this.handleCancel())

    // Form input changes (live preview)
    this.formElement?.addEventListener('input', () => this.handleFormInput())
    this.formElement?.addEventListener('change', () => this.handleFormInput())

    // Fill enabled toggle
    const fillEnabled = document.getElementById('edit-fill-enabled') as HTMLInputElement
    fillEnabled?.addEventListener('change', (e) => {
      const fillControls = document.getElementById('fill-controls')
      if (fillControls) {
        fillControls.style.display = (e.target as HTMLInputElement).checked ? 'block' : 'none'
      }
      this.handleFormInput()
    })

    // Alpha sliders
    const strokeAlpha = document.getElementById('edit-stroke-alpha') as HTMLInputElement
    strokeAlpha?.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value
      const display = document.getElementById('stroke-alpha-value')
      if (display) display.textContent = value
      this.handleFormInput()
    })

    const fillAlpha = document.getElementById('edit-fill-alpha') as HTMLInputElement
    fillAlpha?.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value
      const display = document.getElementById('fill-alpha-value')
      if (display) display.textContent = value
      this.handleFormInput()
    })
  }

  /**
   * Populate form with selected object data
   * USES: Real GeometricObject structure
   */
  private populateForm(obj: GeometricObject): void {
    // Set object type display
    const typeDisplay = document.getElementById('edit-object-type')
    if (typeDisplay) typeDisplay.textContent = obj.type

    // Set visibility
    const visibilityInput = document.getElementById('edit-visibility') as HTMLInputElement
    if (visibilityInput) visibilityInput.checked = obj.isVisible

    // Populate shape-specific properties
    this.populateShapeProperties(obj)

    // Populate style properties
    this.populateStyleProperties(obj)
  }

  /**
   * Populate shape-specific property fields
   * USES: Real GeometryProperties union types
   */
  private populateShapeProperties(obj: GeometricObject): void {
    const container = document.getElementById('shape-properties')
    if (!container) return

    const props = obj.properties

    switch (props.type) {
      case 'circle':
        container.innerHTML = `
          <div class="form-group">
            <label for="edit-center-x">Center X:</label>
            <input type="number" id="edit-center-x" value="${props.center.x}" step="0.1" />
          </div>
          <div class="form-group">
            <label for="edit-center-y">Center Y:</label>
            <input type="number" id="edit-center-y" value="${props.center.y}" step="0.1" />
          </div>
          <div class="form-group">
            <label for="edit-radius">Radius:</label>
            <input type="number" id="edit-radius" value="${props.radius}" min="0.1" step="0.1" />
          </div>
        `
        break

      case 'rectangle':
        container.innerHTML = `
          <div class="form-group">
            <label for="edit-center-x">Center X:</label>
            <input type="number" id="edit-center-x" value="${props.center.x}" step="0.1" />
          </div>
          <div class="form-group">
            <label for="edit-center-y">Center Y:</label>
            <input type="number" id="edit-center-y" value="${props.center.y}" step="0.1" />
          </div>
          <div class="form-group">
            <label for="edit-width">Width:</label>
            <input type="number" id="edit-width" value="${props.width}" min="0.1" step="0.1" />
          </div>
          <div class="form-group">
            <label for="edit-height">Height:</label>
            <input type="number" id="edit-height" value="${props.height}" min="0.1" step="0.1" />
          </div>
        `
        break

      case 'line':
        container.innerHTML = `
          <div class="form-group">
            <label for="edit-start-x">Start X:</label>
            <input type="number" id="edit-start-x" value="${props.startPoint.x}" step="0.1" />
          </div>
          <div class="form-group">
            <label for="edit-start-y">Start Y:</label>
            <input type="number" id="edit-start-y" value="${props.startPoint.y}" step="0.1" />
          </div>
          <div class="form-group">
            <label for="edit-end-x">End X:</label>
            <input type="number" id="edit-end-x" value="${props.endPoint.x}" step="0.1" />
          </div>
          <div class="form-group">
            <label for="edit-end-y">End Y:</label>
            <input type="number" id="edit-end-y" value="${props.endPoint.y}" step="0.1" />
          </div>
        `
        break

      case 'point':
        container.innerHTML = `
          <div class="form-group">
            <label for="edit-center-x">X Position:</label>
            <input type="number" id="edit-center-x" value="${props.center.x}" step="0.1" />
          </div>
          <div class="form-group">
            <label for="edit-center-y">Y Position:</label>
            <input type="number" id="edit-center-y" value="${props.center.y}" step="0.1" />
          </div>
        `
        break

      default:
        container.innerHTML = `<p>Edit properties for ${props.type} not implemented yet.</p>`
    }
  }

  /**
   * Populate style property fields
   * USES: Real StyleSettings structure
   */
  private populateStyleProperties(obj: GeometricObject): void {
    const style = obj.style

    // Stroke color (convert number to hex)
    const strokeColorInput = document.getElementById('edit-stroke-color') as HTMLInputElement
    if (strokeColorInput && style.color !== undefined) {
      strokeColorInput.value = `#${style.color.toString(16).padStart(6, '0')}`
    }

    // Stroke width
    const strokeWidthInput = document.getElementById('edit-stroke-width') as HTMLInputElement
    if (strokeWidthInput && style.strokeWidth !== undefined) {
      strokeWidthInput.value = style.strokeWidth.toString()
    }

    // Stroke alpha
    const strokeAlphaInput = document.getElementById('edit-stroke-alpha') as HTMLInputElement
    const strokeAlphaDisplay = document.getElementById('stroke-alpha-value')
    if (strokeAlphaInput && style.strokeAlpha !== undefined) {
      strokeAlphaInput.value = style.strokeAlpha.toString()
      if (strokeAlphaDisplay) strokeAlphaDisplay.textContent = style.strokeAlpha.toString()
    }

    // Fill enabled
    const fillEnabledInput = document.getElementById('edit-fill-enabled') as HTMLInputElement
    if (fillEnabledInput) {
      fillEnabledInput.checked = !!style.fillColor
      
      // Show/hide fill controls
      const fillControls = document.getElementById('fill-controls')
      if (fillControls) {
        fillControls.style.display = fillEnabledInput.checked ? 'block' : 'none'
      }
    }

    // Fill color
    const fillColorInput = document.getElementById('edit-fill-color') as HTMLInputElement
    if (fillColorInput && style.fillColor !== undefined) {
      fillColorInput.value = `#${style.fillColor.toString(16).padStart(6, '0')}`
    }

    // Fill alpha
    const fillAlphaInput = document.getElementById('edit-fill-alpha') as HTMLInputElement
    const fillAlphaDisplay = document.getElementById('fill-alpha-value')
    if (fillAlphaInput && style.fillAlpha !== undefined) {
      fillAlphaInput.value = style.fillAlpha.toString()
      if (fillAlphaDisplay) fillAlphaDisplay.textContent = style.fillAlpha.toString()
    }
  }

  /**
   * Handle form input changes - live preview
   * UNIFIED: Uses UnifiedGeometryGenerator for consistent validation
   * CRITICAL: Prevents circle bug through unified geometry generation
   */
  private handleFormInput(): void {
    try {
      const rawFormData = this.getRawFormData()
      if (!rawFormData) return

      // ✅ UNIFIED: Use UnifiedGeometryGenerator for validation and normalization
      const normalizedFormData = UnifiedGeometryGenerator.generateFormData({
        type: this.getObjectType(),
        formData: rawFormData,
        style: rawFormData.style,
        isVisible: rawFormData.isVisible
      })

      // ✅ UNIFIED: Same preview system as drawing
      gameStore_methods.updatePreview({
        operation: 'move',
        formData: normalizedFormData  // Unified geometry generation
      })
    } catch (error) {
      console.warn('ObjectEditPanel: Form validation failed:', error)
      // Don't update preview if form data is invalid
    }
  }

  /**
   * Handle apply button - commit changes
   * CONNECTS TO: gameStore_methods.commitPreview() from unified store
   */
  private handleApply(): void {
    // ✅ CORRECTED: Commit using unified preview system
    gameStore_methods.commitPreview()
    this.hidePanel()
  }

  /**
   * Handle cancel button - revert changes  
   * CONNECTS TO: gameStore_methods.cancelPreview() from unified store
   */
  private handleCancel(): void {
    // ✅ CORRECTED: Cancel using unified preview system
    gameStore_methods.cancelPreview()
    this.hidePanel()
  }

  /**
   * Extract form data into ObjectEditFormData structure
   * UNIFIED: Works with UnifiedGeometryGenerator for consistency
   */
  private getFormData(): ObjectEditFormData | null {
    try {
      const rawFormData = this.getRawFormData()
      if (!rawFormData) return null

      // ✅ UNIFIED: Use UnifiedGeometryGenerator for validation
      return UnifiedGeometryGenerator.generateFormData({
        type: this.getObjectType(),
        formData: rawFormData,
        style: rawFormData.style,
        isVisible: rawFormData.isVisible
      })
    } catch (error) {
      console.warn('ObjectEditPanel: Unified geometry generation failed:', error)
      return null
    }
  }

  /**
   * Get object type for UnifiedGeometryGenerator
   */
  private getObjectType(): 'point' | 'line' | 'circle' | 'rectangle' | 'diamond' {
    const selectedObject = gameStore_methods.getSelectedObject()
    if (!selectedObject) {
      throw new Error('ObjectEditPanel: No selected object for type detection')
    }
    return selectedObject.type
  }

  /**
   * Extract raw form data (unified with InputManager approach)
   * UNIFIED: Same validation logic as UnifiedGeometryGenerator expects
   */
  private getRawFormData(): ObjectEditFormData | null {
    if (!this.formElement) return null

    const selectedObject = gameStore_methods.getSelectedObject()
    if (!selectedObject) return null

    // Get common properties
    const visibilityInput = document.getElementById('edit-visibility') as HTMLInputElement
    if (!visibilityInput) {
      throw new Error('ObjectEditPanel: visibility input element missing')
    }
    const isVisible = visibilityInput.checked

    // Get style properties
    const style = this.getStyleData()

    // Get shape-specific properties based on object type
    const objectType = selectedObject.properties.type

    switch (objectType) {
      case 'circle': {
        const centerXInput = document.getElementById('edit-center-x') as HTMLInputElement
        const centerYInput = document.getElementById('edit-center-y') as HTMLInputElement
        const radiusInput = document.getElementById('edit-radius') as HTMLInputElement

        if (!centerXInput || !centerYInput || !radiusInput) {
          throw new Error('ObjectEditPanel: circle input elements missing')
        }

        const centerX = parseFloat(centerXInput.value || '0')
        const centerY = parseFloat(centerYInput.value || '0')
        const radius = parseFloat(radiusInput.value || '0.1')

        return {
          isVisible,
          circle: { centerX, centerY, radius },
          style
        }
      }

      case 'rectangle': {
        const centerXInput = document.getElementById('edit-center-x') as HTMLInputElement
        const centerYInput = document.getElementById('edit-center-y') as HTMLInputElement
        const widthInput = document.getElementById('edit-width') as HTMLInputElement
        const heightInput = document.getElementById('edit-height') as HTMLInputElement

        if (!centerXInput || !centerYInput || !widthInput || !heightInput) {
          throw new Error('ObjectEditPanel: rectangle input elements missing - form corrupted')
        }

        if (!centerXInput.value || !centerYInput.value || !widthInput.value || !heightInput.value) {
          throw new Error('ObjectEditPanel: rectangle input values missing - form incomplete')
        }

        const centerX = parseFloat(centerXInput.value)
        const centerY = parseFloat(centerYInput.value)
        const width = parseFloat(widthInput.value)
        const height = parseFloat(heightInput.value)

        if (isNaN(centerX) || isNaN(centerY) || isNaN(width) || isNaN(height)) {
          throw new Error('ObjectEditPanel: invalid rectangle values - not numbers')
        }

        if (width <= 0 || height <= 0) {
          throw new Error(`ObjectEditPanel: invalid rectangle dimensions ${width}x${height} - must be positive`)
        }

        return {
          isVisible,
          rectangle: { centerX, centerY, width, height },
          style
        }
      }

      case 'line': {
        const startXInput = document.getElementById('edit-start-x') as HTMLInputElement
        const startYInput = document.getElementById('edit-start-y') as HTMLInputElement
        const endXInput = document.getElementById('edit-end-x') as HTMLInputElement
        const endYInput = document.getElementById('edit-end-y') as HTMLInputElement

        if (!startXInput || !startYInput || !endXInput || !endYInput) {
          throw new Error('ObjectEditPanel: line input elements missing - form corrupted')
        }

        if (!startXInput.value || !startYInput.value || !endXInput.value || !endYInput.value) {
          throw new Error('ObjectEditPanel: line input values missing - form incomplete')
        }

        const startX = parseFloat(startXInput.value)
        const startY = parseFloat(startYInput.value)
        const endX = parseFloat(endXInput.value)
        const endY = parseFloat(endYInput.value)

        if (isNaN(startX) || isNaN(startY) || isNaN(endX) || isNaN(endY)) {
          throw new Error('ObjectEditPanel: invalid line values - not numbers')
        }

        return {
          isVisible,
          line: { startX, startY, endX, endY },
          style
        }
      }

      case 'point': {
        const centerXInput = document.getElementById('edit-center-x') as HTMLInputElement
        const centerYInput = document.getElementById('edit-center-y') as HTMLInputElement

        if (!centerXInput || !centerYInput) {
          throw new Error('ObjectEditPanel: point input elements missing - form corrupted')
        }

        if (!centerXInput.value || !centerYInput.value) {
          throw new Error('ObjectEditPanel: point input values missing - form incomplete')
        }

        const centerX = parseFloat(centerXInput.value)
        const centerY = parseFloat(centerYInput.value)

        if (isNaN(centerX) || isNaN(centerY)) {
          throw new Error('ObjectEditPanel: invalid point values - not numbers')
        }

        return {
          isVisible,
          point: { centerX, centerY },
          style
        }
      }

      default:
        throw new Error(`ObjectEditPanel: unsupported object type ${objectType}`)
    }
  }

  /**
   * Extract style data from form inputs
   * UNIFIED: Consistent with UnifiedGeometryGenerator expectations
   */
  private getStyleData(): ObjectEditFormData['style'] {
    const strokeColorInput = document.getElementById('edit-stroke-color') as HTMLInputElement
    const strokeWidthInput = document.getElementById('edit-stroke-width') as HTMLInputElement
    const strokeAlphaInput = document.getElementById('edit-stroke-alpha') as HTMLInputElement
    const fillEnabledInput = document.getElementById('edit-fill-enabled') as HTMLInputElement
    const fillColorInput = document.getElementById('edit-fill-color') as HTMLInputElement
    const fillAlphaInput = document.getElementById('edit-fill-alpha') as HTMLInputElement

    if (!strokeColorInput || !strokeWidthInput || !strokeAlphaInput || !fillEnabledInput) {
      throw new Error('ObjectEditPanel: style input elements missing')
    }

    const strokeWidth = parseInt(strokeWidthInput.value || '2', 10)
    const strokeAlpha = parseFloat(strokeAlphaInput.value || '1.0')
    const hasFill = fillEnabledInput.checked

    let fillColor: string | undefined
    let fillAlpha: number | undefined

    if (hasFill && fillColorInput && fillAlphaInput) {
      fillColor = fillColorInput.value || '#ffffff'
      fillAlpha = parseFloat(fillAlphaInput.value || '0.5')
    }

    return {
      strokeColor: strokeColorInput.value || '#000000',
      strokeWidth,
      strokeAlpha,
      fillColor,
      fillAlpha,
      hasFill
    }
  }

  /**
   * Show the panel element
   */
  private showPanelElement(): void {
    if (this.panelElement) {
      this.panelElement.style.display = 'block'
    }
  }

  /**
   * Hide the panel element
   */
  private hidePanelElement(): void {
    if (this.panelElement) {
      this.panelElement.style.display = 'none'
    }
  }

  /**
   * Clean up resources and remove the panel
   */
  public destroy(): void {
    this.hidePanel()
    if (this.panelElement) {
      this.panelElement.remove()
      this.panelElement = null
    }
    this.formElement = null
    console.log('ObjectEditPanel: Destroyed')
  }
}