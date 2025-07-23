// app/src/ui/GeometryPanel.ts - Refactored to use unified game store
import { subscribe } from 'valtio'
import { gameStore, gameStore_methods } from '../store/game-store'

/**
 * GeometryPanel - Geometry Drawing and Style Controls
 *
 * Comprehensive geometry panel with:
 * - Drawing mode selection (point, line, circle, rectangle, diamond)
 * - Style settings (colors, stroke width, fill options, alpha)
 * - Drawing options (preview opacity)
 * - Action buttons (clear all, reset styles)
 * - Live status display (mode, object count, selection)
 * 
 * ✅ Fully refactored to use unified gameStore
 * ✅ All functionality preserved from GeometryPanel_3b
 * ✅ Same HTML element IDs maintained
 * ✅ Color picker state management preserved
 */
export class GeometryPanel {
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
          // ✅ UPDATED: Clear selection when switching drawing modes
          if (gameStore.selection.selectedId) {
            gameStore_methods.clearSelection()
            console.log(`GeometryPanel: Deselected object when switching to ${mode} mode`)
          }
          gameStore_methods.setDrawingMode(mode as any)
          console.log(`GeometryPanel: Set drawing mode to ${mode}`)
        })
      }
    })
    
    // Complete event handler setup
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
        gameStore_methods.setStrokeColor(color)
        this.activeColorPickers.delete('geometry-default-color')
        console.log('Set stroke color to:', color.toString(16))
      })
    }
    
    // Stroke width
    const strokeWidthInput = document.getElementById('geometry-default-stroke-width') as HTMLInputElement
    if (strokeWidthInput) {
      strokeWidthInput.addEventListener('input', (e) => {
        const width = parseFloat((e.target as HTMLInputElement).value)
        gameStore_methods.setStrokeWidth(width)
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
        gameStore_methods.setFillColor(color)
        this.activeColorPickers.delete('geometry-default-fill-color')
        console.log('Set fill color to:', color.toString(16))
      })
    }
    
    // Fill enabled
    const fillEnabledInput = document.getElementById('geometry-fill-enabled') as HTMLInputElement
    if (fillEnabledInput) {
      fillEnabledInput.addEventListener('change', (e) => {
        const enabled = (e.target as HTMLInputElement).checked
        gameStore_methods.setFillEnabled(enabled)
        console.log('Set fill enabled to:', enabled)
      })
    }
    
    // Fill alpha with live update
    const fillAlphaInput = document.getElementById('geometry-fill-alpha') as HTMLInputElement
    const fillAlphaValue = document.getElementById('geometry-fill-alpha-value')
    if (fillAlphaInput && fillAlphaValue) {
      fillAlphaInput.addEventListener('input', (e) => {
        const alpha = parseFloat((e.target as HTMLInputElement).value)
        gameStore_methods.setFillAlpha(alpha)
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
        gameStore_methods.setStrokeAlpha(alpha)
        strokeAlphaValue.textContent = alpha.toFixed(1)
        console.log('Set stroke alpha to:', alpha)
      })
    }
  }
  
  private setupDrawingOptionsHandlers(): void {
    // Preview opacity with live update
    const previewOpacityInput = document.getElementById('drawing-preview-opacity') as HTMLInputElement
    const previewOpacityValue = document.getElementById('drawing-preview-opacity-value')
    if (previewOpacityInput && previewOpacityValue) {
      previewOpacityInput.addEventListener('input', (e) => {
        const opacity = parseFloat((e.target as HTMLInputElement).value)
        // ✅ UPDATED: Direct store property update
        gameStore.drawing.settings.previewOpacity = opacity
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
          gameStore_methods.clearAllObjects()
          console.log('Cleared all objects')
        }
      })
    }
    
    // Reset all styles
    const resetStylesBtn = document.getElementById('geometry-reset-styles')
    if (resetStylesBtn) {
      resetStylesBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all styles to defaults?')) {
          // ✅ UPDATED: Reset styles using unified store methods
          gameStore_methods.resetDefaultStyle()
          
          // Clear all per-object style overrides
          gameStore.objectStyles = {}
          
          // Update UI elements
          this.updateUIFromStore()
          
          console.log('Reset all styles to defaults')
        }
      })
    }
  }
  
  private setupReactivity(): void {
    // ✅ PRECISE SUBSCRIPTIONS - Updated for unified store
    
    // Style-specific subscription for Reset All Styles functionality
    subscribe(gameStore.defaultStyle, () => {
      this.updateUIFromStore()
      console.log('🔧 Style subscription triggered - UI updated')
    })
    
    // Drawing mode subscription for mode button updates
    subscribe(gameStore.drawing, () => {
      this.updateValues()
    })
    
    // ✅ UPDATED: Subscribe to root objects array instead of geometry
    subscribe(gameStore.objects, () => {
      this.updateValues()
    })
    
    // ✅ UPDATED: Subscribe to selection for selected count
    subscribe(gameStore.selection, () => {
      this.updateValues()
    })
    
    // Initial update
    this.updateValues()
  }
  
  private updateValues(): void {
    // Update current mode display
    const currentModeElement = document.getElementById('geometry-current-mode')
    if (currentModeElement) {
      currentModeElement.textContent = gameStore.drawing.mode
      currentModeElement.className = `font-bold font-mono text-success`
    }
    
    // ✅ UPDATED: Update objects count using root objects array
    const objectsCountElement = document.getElementById('geometry-objects-count')
    if (objectsCountElement) {
      objectsCountElement.textContent = gameStore.objects.length.toString()
      objectsCountElement.className = `font-bold font-mono text-primary`
    }
    
    // ✅ UPDATED: Update selected count using selection.selectedId
    const selectedCountElement = document.getElementById('geometry-selected-count')
    if (selectedCountElement) {
      const selectedCount = gameStore.selection.selectedId ? 1 : 0
      selectedCountElement.textContent = selectedCount.toString()
      selectedCountElement.className = `font-bold font-mono text-info`
    }
    
    // ✅ UPDATED: Update stroke width using defaultStyle
    const strokeWidthInput = document.getElementById('geometry-default-stroke-width') as HTMLInputElement
    if (strokeWidthInput) {
      strokeWidthInput.value = gameStore.defaultStyle.strokeWidth.toString()
    }
    
    // ✅ UPDATED: Update stroke color display using defaultStyle
    const colorElement = document.getElementById('geometry-default-color')
    if (colorElement) {
      const colorHex = `#${gameStore.defaultStyle.color.toString(16).padStart(6, '0')}`
      colorElement.textContent = colorHex
      colorElement.style.color = colorHex
    }
    
    // Update drawing mode button states
    this.updateModeButtons()
    
    // Update new UI elements
    this.updateUIFromStore()
  }
  
  // Update UI elements from store values
  private updateUIFromStore(): void {
    // ✅ UPDATED: All properties now use defaultStyle
    
    // Update stroke color (only if not currently active)
    const strokeColorInput = document.getElementById('geometry-default-color') as HTMLInputElement
    if (strokeColorInput && !this.activeColorPickers.has('geometry-default-color')) {
      strokeColorInput.value = '#' + gameStore.defaultStyle.color.toString(16).padStart(6, '0')
    }
    
    // Update stroke width
    const strokeWidthInput = document.getElementById('geometry-default-stroke-width') as HTMLInputElement
    if (strokeWidthInput) {
      strokeWidthInput.value = gameStore.defaultStyle.strokeWidth.toString()
    }
    
    // Update fill color (only if not currently active)
    const fillColorInput = document.getElementById('geometry-default-fill-color') as HTMLInputElement
    if (fillColorInput && !this.activeColorPickers.has('geometry-default-fill-color')) {
      fillColorInput.value = '#' + gameStore.defaultStyle.fillColor.toString(16).padStart(6, '0')
    }
    
    // Update fill enabled
    const fillEnabledInput = document.getElementById('geometry-fill-enabled') as HTMLInputElement
    if (fillEnabledInput) {
      fillEnabledInput.checked = gameStore.defaultStyle.fillEnabled
    }
    
    // Update fill alpha
    const fillAlphaInput = document.getElementById('geometry-fill-alpha') as HTMLInputElement
    const fillAlphaValue = document.getElementById('geometry-fill-alpha-value')
    if (fillAlphaInput && fillAlphaValue) {
      fillAlphaInput.value = gameStore.defaultStyle.fillAlpha.toString()
      fillAlphaValue.textContent = gameStore.defaultStyle.fillAlpha.toFixed(1)
    }
    
    // Update stroke alpha
    const strokeAlphaInput = document.getElementById('geometry-stroke-alpha') as HTMLInputElement
    const strokeAlphaValue = document.getElementById('geometry-stroke-alpha-value')
    if (strokeAlphaInput && strokeAlphaValue) {
      strokeAlphaInput.value = gameStore.defaultStyle.strokeAlpha.toString()
      strokeAlphaValue.textContent = gameStore.defaultStyle.strokeAlpha.toFixed(1)
    }
    
    // Update drawing options - only Preview Opacity remains functional
    const previewOpacityInput = document.getElementById('drawing-preview-opacity') as HTMLInputElement
    const previewOpacityValue = document.getElementById('drawing-preview-opacity-value')
    if (previewOpacityInput && previewOpacityValue) {
      previewOpacityInput.value = gameStore.drawing.settings.previewOpacity.toString()
      previewOpacityValue.textContent = gameStore.drawing.settings.previewOpacity.toFixed(1)
    }
  }
  
  private updateModeButtons(): void {
    const currentMode = gameStore.drawing.mode
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
      // ✅ UPDATED: Update showGeometryPanel in unified store
      gameStore.ui.showGeometryPanel = true
      this.updateValues()
      console.log('GeometryPanel: Shown')
    }
  }
  
  public hide(): void {
    if (this.panel) {
      this.panel.style.display = 'none'
      this.isVisible = false
      // ✅ UPDATED: Update showGeometryPanel in unified store
      gameStore.ui.showGeometryPanel = false
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