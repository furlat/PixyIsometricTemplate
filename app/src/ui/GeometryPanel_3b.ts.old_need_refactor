import { subscribe } from 'valtio'
import { gameStore_3b, gameStore_3b_methods } from '../store/gameStore_3b'

export class GeometryPanel_3b {
  private panel: HTMLElement | null = null
  private isVisible: boolean = false
  private activeColorPickers: Set<string> = new Set()

  constructor() {
    this.panel = document.getElementById('geometry-panel')
    this.setupEventListeners()
    this.setupReactivity()
  }

  private setupEventListeners(): void {
    // Close button
    const closeBtn = document.getElementById('close-geometry-panel')
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hide()
      })
    }

    // Drawing mode buttons
    const drawingModes = ['none', 'point', 'line', 'circle', 'rectangle', 'diamond']
    drawingModes.forEach(mode => {
      const button = document.getElementById(`geometry-mode-${mode}`)
      if (button) {
        button.addEventListener('click', () => {
          // Clear selection when switching drawing modes
          if (gameStore_3b.geometry.selectedId) {
            gameStore_3b_methods.clearSelection()
            console.log(`GeometryPanel: Deselected object when switching to ${mode} mode`)
          }
          gameStore_3b_methods.setDrawingMode(mode as any)
          console.log(`GeometryPanel: Set drawing mode to ${mode}`)
        })
      }
    })

    // ✅ NEW: Complete event handler setup
    this.setupDrawingSettingsHandlers()
    this.setupDrawingOptionsHandlers()
    this.setupActionsHandlers()
  }

  private setupDrawingSettingsHandlers(): void {
    // Stroke color
    const strokeColorInput = document.getElementById('geometry-default-color') as HTMLInputElement
    if (strokeColorInput) {
      strokeColorInput.addEventListener('focus', () => {
        this.activeColorPickers.add('geometry-default-color')
      })
      strokeColorInput.addEventListener('change', (e) => {
        const color = parseInt((e.target as HTMLInputElement).value.replace('#', ''), 16)
        gameStore_3b_methods.setStrokeColor(color)
        this.activeColorPickers.delete('geometry-default-color')
        console.log('Set stroke color to:', color.toString(16))
      })
      // Remove blur event that was interfering with click-away behavior
    }
    
    // Stroke width
    const strokeWidthInput = document.getElementById('geometry-default-stroke-width') as HTMLInputElement
    if (strokeWidthInput) {
      strokeWidthInput.addEventListener('input', (e) => {
        const width = parseFloat((e.target as HTMLInputElement).value)
        gameStore_3b_methods.setStrokeWidth(width)
        console.log('Set stroke width to:', width)
      })
    }
    
    // Fill color
    const fillColorInput = document.getElementById('geometry-default-fill-color') as HTMLInputElement
    if (fillColorInput) {
      fillColorInput.addEventListener('focus', () => {
        this.activeColorPickers.add('geometry-default-fill-color')
      })
      fillColorInput.addEventListener('change', (e) => {
        const color = parseInt((e.target as HTMLInputElement).value.replace('#', ''), 16)
        gameStore_3b_methods.setFillColor(color)
        this.activeColorPickers.delete('geometry-default-fill-color')
        console.log('Set fill color to:', color.toString(16))
      })
      // Remove blur event that was interfering with click-away behavior
    }
    
    // Fill enabled
    const fillEnabledInput = document.getElementById('geometry-fill-enabled') as HTMLInputElement
    if (fillEnabledInput) {
      fillEnabledInput.addEventListener('change', (e) => {
        const enabled = (e.target as HTMLInputElement).checked
        gameStore_3b_methods.setFillEnabled(enabled)
        console.log('Set fill enabled to:', enabled)
      })
    }
    
    // Fill alpha with live update
    const fillAlphaInput = document.getElementById('geometry-fill-alpha') as HTMLInputElement
    const fillAlphaValue = document.getElementById('geometry-fill-alpha-value')
    if (fillAlphaInput && fillAlphaValue) {
      fillAlphaInput.addEventListener('input', (e) => {
        const alpha = parseFloat((e.target as HTMLInputElement).value)
        gameStore_3b_methods.setFillAlpha(alpha)
        fillAlphaValue.textContent = alpha.toFixed(1)
        console.log('Set fill alpha to:', alpha)
      })
    }
    
    // Stroke alpha with live update
    const strokeAlphaInput = document.getElementById('geometry-stroke-alpha') as HTMLInputElement
    const strokeAlphaValue = document.getElementById('geometry-stroke-alpha-value')
    if (strokeAlphaInput && strokeAlphaValue) {
      strokeAlphaInput.addEventListener('input', (e) => {
        const alpha = parseFloat((e.target as HTMLInputElement).value)
        gameStore_3b_methods.setStrokeAlpha(alpha)
        strokeAlphaValue.textContent = alpha.toFixed(1)
        console.log('Set stroke alpha to:', alpha)
      })
    }
  }
  
  private setupDrawingOptionsHandlers(): void {
    // Preview opacity with live update - ONLY functional option remaining
    const previewOpacityInput = document.getElementById('drawing-preview-opacity') as HTMLInputElement
    const previewOpacityValue = document.getElementById('drawing-preview-opacity-value')
    if (previewOpacityInput && previewOpacityValue) {
      previewOpacityInput.addEventListener('input', (e) => {
        const opacity = parseFloat((e.target as HTMLInputElement).value)
        gameStore_3b.drawing.settings.previewOpacity = opacity
        previewOpacityValue.textContent = opacity.toFixed(1)
        console.log('Preview opacity:', opacity)
      })
    }
  }
  
  private setupActionsHandlers(): void {
    // Clear all objects
    const clearAllBtn = document.getElementById('geometry-clear-all')
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all objects?')) {
          gameStore_3b_methods.clearAllObjects()
          console.log('Cleared all objects')
        }
      })
    }
    
    // Reset all styles
    const resetStylesBtn = document.getElementById('geometry-reset-styles')
    if (resetStylesBtn) {
      resetStylesBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all styles to defaults?')) {
          // Reset global styles
          gameStore_3b_methods.setStrokeColor(0x0066cc)
          gameStore_3b_methods.setStrokeWidth(2)
          gameStore_3b_methods.setFillColor(0x0066cc)
          gameStore_3b_methods.setFillEnabled(false)
          gameStore_3b_methods.setStrokeAlpha(1.0)
          gameStore_3b_methods.setFillAlpha(0.3)
          
          // Clear all per-object style overrides
          gameStore_3b.objectStyles = {}
          
          // Update UI elements
          this.updateUIFromStore()
          
          console.log('Reset all styles to defaults')
        }
      })
    }
  }

  private setupReactivity(): void {
    // ✅ PRECISE SUBSCRIPTIONS - Following StorePanel_3b pattern
    
    // Style-specific subscription for Reset All Styles functionality
    subscribe(gameStore_3b.style, () => {
      this.updateUIFromStore()
      console.log('🔧 Style subscription triggered - UI updated')
    })
    
    // Drawing mode subscription for mode button updates
    subscribe(gameStore_3b.drawing, () => {
      this.updateValues()
    })
    
    // Geometry subscription for object count updates
    subscribe(gameStore_3b.geometry, () => {
      this.updateValues()
    })
    
    // Initial update
    this.updateValues()
  }

  private updateValues(): void {
    // Update current mode display
    const currentModeElement = document.getElementById('geometry-current-mode')
    if (currentModeElement) {
      currentModeElement.textContent = gameStore_3b.drawing.mode
      currentModeElement.className = `font-bold font-mono text-success`
    }

    // Update objects count
    const objectsCountElement = document.getElementById('geometry-objects-count')
    if (objectsCountElement) {
      objectsCountElement.textContent = gameStore_3b.geometry.objects.length.toString()
      objectsCountElement.className = `font-bold font-mono text-primary`
    }

    // Update selected count
    const selectedCountElement = document.getElementById('geometry-selected-count')
    if (selectedCountElement) {
      const selectedCount = gameStore_3b.geometry.selectedId ? 1 : 0
      selectedCountElement.textContent = selectedCount.toString()
      selectedCountElement.className = `font-bold font-mono text-info`
    }

    // Update stroke width input
    const strokeWidthInput = document.getElementById('geometry-default-stroke-width') as HTMLInputElement
    if (strokeWidthInput) {
      strokeWidthInput.value = gameStore_3b.style.strokeWidth.toString()
    }

    // Update stroke color display
    const colorElement = document.getElementById('geometry-default-color')
    if (colorElement) {
      const colorHex = `#${gameStore_3b.style.color.toString(16).padStart(6, '0')}`
      colorElement.textContent = colorHex
      colorElement.style.color = colorHex
    }

    // Update drawing mode button states
    this.updateModeButtons()
    
    // Update new UI elements
    this.updateUIFromStore()
  }

  // ✅ NEW: Update UI elements from store values
  private updateUIFromStore(): void {
    // Update stroke color (only if not currently active)
    const strokeColorInput = document.getElementById('geometry-default-color') as HTMLInputElement
    if (strokeColorInput && !this.activeColorPickers.has('geometry-default-color')) {
      strokeColorInput.value = '#' + gameStore_3b.style.color.toString(16).padStart(6, '0')
    }
    
    // Update stroke width
    const strokeWidthInput = document.getElementById('geometry-default-stroke-width') as HTMLInputElement
    if (strokeWidthInput) {
      strokeWidthInput.value = gameStore_3b.style.strokeWidth.toString()
    }
    
    // Update fill color (only if not currently active)
    const fillColorInput = document.getElementById('geometry-default-fill-color') as HTMLInputElement
    if (fillColorInput && !this.activeColorPickers.has('geometry-default-fill-color')) {
      fillColorInput.value = '#' + gameStore_3b.style.fillColor.toString(16).padStart(6, '0')
    }
    
    // Update fill enabled
    const fillEnabledInput = document.getElementById('geometry-fill-enabled') as HTMLInputElement
    if (fillEnabledInput) {
      fillEnabledInput.checked = gameStore_3b.style.fillEnabled
    }
    
    // Update fill alpha
    const fillAlphaInput = document.getElementById('geometry-fill-alpha') as HTMLInputElement
    const fillAlphaValue = document.getElementById('geometry-fill-alpha-value')
    if (fillAlphaInput && fillAlphaValue) {
      fillAlphaInput.value = gameStore_3b.style.fillAlpha.toString()
      fillAlphaValue.textContent = gameStore_3b.style.fillAlpha.toFixed(1)
    }
    
    // Update stroke alpha
    const strokeAlphaInput = document.getElementById('geometry-stroke-alpha') as HTMLInputElement
    const strokeAlphaValue = document.getElementById('geometry-stroke-alpha-value')
    if (strokeAlphaInput && strokeAlphaValue) {
      strokeAlphaInput.value = gameStore_3b.style.strokeAlpha.toString()
      strokeAlphaValue.textContent = gameStore_3b.style.strokeAlpha.toFixed(1)
    }
    
    // Update drawing options - only Preview Opacity remains functional
    const previewOpacityInput = document.getElementById('drawing-preview-opacity') as HTMLInputElement
    const previewOpacityValue = document.getElementById('drawing-preview-opacity-value')
    if (previewOpacityInput && previewOpacityValue) {
      previewOpacityInput.value = gameStore_3b.drawing.settings.previewOpacity.toString()
      previewOpacityValue.textContent = gameStore_3b.drawing.settings.previewOpacity.toFixed(1)
    }
  }

  private updateModeButtons(): void {
    const currentMode = gameStore_3b.drawing.mode
    const drawingModes = ['none', 'point', 'line', 'circle', 'rectangle', 'diamond']
    
    drawingModes.forEach(mode => {
      const button = document.getElementById(`geometry-mode-${mode}`)
      if (button) {
        if (mode === currentMode) {
          button.className = 'btn btn-xs btn-success'
        } else {
          button.className = 'btn btn-xs btn-outline'
        }
      }
    })
  }

  public show(): void {
    if (this.panel) {
      this.panel.style.display = 'block'
      this.isVisible = true
      this.updateValues()
      console.log('GeometryPanel: Shown')
    }
  }

  public hide(): void {
    if (this.panel) {
      this.panel.style.display = 'none'
      this.isVisible = false
      console.log('GeometryPanel: Hidden')
    }
  }

  public toggle(): void {
    if (this.isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }

  public isOpen(): boolean {
    return this.isVisible
  }
}