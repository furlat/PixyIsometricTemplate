import { subscribe } from 'valtio'
import { gameStore, updateGameStore } from '../store/gameStore'
import {
  updateElement
} from './handlers/UIHandlers'

export class GeometryPanel {
  private elements: Map<string, HTMLElement> = new Map()
  private isVisible: boolean = false
  
  constructor() {
    this.initializeElements()
    this.setupReactivity()
    this.setupEventHandlers()
    this.setupKeyboardHandlers()
  }
  
  private initializeElements(): void {
    // Get all the elements by their IDs
    const elementIds = [
      'geometry-current-mode',
      'geometry-objects-count',
      'geometry-selected-count',
      'geometry-default-color',
      'geometry-default-stroke-width',
      'geometry-default-fill-color',
      'geometry-fill-enabled',
      'geometry-fill-alpha',
      'geometry-stroke-alpha',
      'geometry-default-texture'
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
          // Clear selection when switching drawing modes
          if (gameStore.geometry.selection.selectedObjectId) {
            updateGameStore.clearSelection()
            console.log(`GeometryPanel: Deselected object when switching to ${mode} mode`)
          }
          updateGameStore.setDrawingMode(mode as any)
        })
      }
    })
    
    // Default stroke color picker
    const defaultColorElement = this.elements.get('geometry-default-color')
    if (defaultColorElement) {
      defaultColorElement.addEventListener('click', () => {
        this.openColorPicker('stroke')
      })
      // Make it look clickable
      defaultColorElement.style.cursor = 'pointer'
      defaultColorElement.title = 'Click to change default stroke color'
    }

    // Default fill color picker
    const defaultFillColorElement = this.elements.get('geometry-default-fill-color')
    if (defaultFillColorElement) {
      defaultFillColorElement.addEventListener('click', () => {
        this.openColorPicker('fill')
      })
      // Make it look clickable
      defaultFillColorElement.style.cursor = 'pointer'
      defaultFillColorElement.title = 'Click to change default fill color'
    }

    // Default texture element (prepare for future - no clicking yet)
    const defaultTextureElement = this.elements.get('geometry-default-texture')
    if (defaultTextureElement) {
      defaultTextureElement.style.cursor = 'pointer'
      defaultTextureElement.title = 'Texture settings (coming soon)'
      // Note: opacity is already set in HTML via Tailwind class
    }
    
    // Default stroke width input
    const defaultStrokeWidthElement = this.elements.get('geometry-default-stroke-width')
    if (defaultStrokeWidthElement) {
      defaultStrokeWidthElement.addEventListener('input', (event) => {
        const target = event.target as HTMLInputElement
        const newValue = Math.max(0.5, parseFloat(target.value) || 0.5)
        updateGameStore.setDrawingSettings({ defaultStrokeWidth: newValue })
      })
      
      // Ensure minimum value
      defaultStrokeWidthElement.addEventListener('blur', (event) => {
        const target = event.target as HTMLInputElement
        const value = parseFloat(target.value) || 0.5
        if (value < 0.5) {
          target.value = '0.5'
          updateGameStore.setDrawingSettings({ defaultStrokeWidth: 0.5 })
        }
      })
    }

    // Fill enabled toggle
    const fillEnabledElement = this.elements.get('geometry-fill-enabled') as HTMLInputElement
    if (fillEnabledElement) {
      fillEnabledElement.addEventListener('change', (event) => {
        const target = event.target as HTMLInputElement
        updateGameStore.setDrawingSettings({ fillEnabled: target.checked })
        console.log(`GeometryPanel: Fill enabled set to ${target.checked}`)
      })
    }

    // Fill alpha slider
    const fillAlphaElement = this.elements.get('geometry-fill-alpha') as HTMLInputElement
    if (fillAlphaElement) {
      fillAlphaElement.addEventListener('input', (event) => {
        const target = event.target as HTMLInputElement
        const alpha = parseFloat(target.value)
        updateGameStore.setDrawingSettings({ fillAlpha: alpha })
        console.log(`GeometryPanel: Fill alpha set to ${alpha}`)
      })
    }

    // Stroke alpha slider
    const strokeAlphaElement = this.elements.get('geometry-stroke-alpha') as HTMLInputElement
    if (strokeAlphaElement) {
      strokeAlphaElement.addEventListener('input', (event) => {
        const target = event.target as HTMLInputElement
        const alpha = parseFloat(target.value)
        updateGameStore.setDrawingSettings({ strokeAlpha: alpha })
        console.log(`GeometryPanel: Stroke alpha set to ${alpha}`)
      })
    }
    
    // Clear all button
    const clearButton = document.getElementById('geometry-clear-all')
    if (clearButton) {
      clearButton.addEventListener('click', () => {
        updateGameStore.clearAllGeometricObjects()
      })
    }
    
    // Close button
    const closeBtn = document.getElementById('close-geometry-panel')
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.toggle()
      })
    }
  }

  private setupKeyboardHandlers(): void {
    document.addEventListener('keydown', (event) => {
      // ESC key - clear selection if entity is selected, or set drawing mode to none
      if (event.key === 'Escape' && this.isVisible) {
        if (gameStore.geometry.selection.selectedObjectId) {
          // If an entity is selected, deselect it
          updateGameStore.clearSelection()
          console.log('GeometryPanel: Deselected object via ESC key')
        } else {
          // If no entity selected, set drawing mode to none
          updateGameStore.setDrawingMode('none')
        }
        event.preventDefault()
      }
    })
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
    
    
    // Drawing settings
    updateElement(this.elements, 'geometry-default-color',
      `#${gameStore.geometry.drawing.settings.defaultColor.toString(16).padStart(6, '0')}`,
      'text-accent')
    
    // Handle stroke width input element separately
    const strokeWidthInput = this.elements.get('geometry-default-stroke-width') as HTMLInputElement
    if (strokeWidthInput) {
      strokeWidthInput.value = gameStore.geometry.drawing.settings.defaultStrokeWidth.toString()
    }
    
    // Fill color (show as hex or "transparent")
    const fillColor = gameStore.geometry.drawing.settings.defaultFillColor
    const fillColorDisplay = fillColor === 0x000000 ? 'transparent' : `#${fillColor.toString(16).padStart(6, '0')}`
    updateElement(this.elements, 'geometry-default-fill-color',
      fillColorDisplay,
      'text-accent')

    // Fill enabled toggle
    const fillEnabledInput = this.elements.get('geometry-fill-enabled') as HTMLInputElement
    if (fillEnabledInput) {
      fillEnabledInput.checked = gameStore.geometry.drawing.settings.fillEnabled
    }

    // Fill alpha slider
    const fillAlphaInput = this.elements.get('geometry-fill-alpha') as HTMLInputElement
    if (fillAlphaInput) {
      fillAlphaInput.value = gameStore.geometry.drawing.settings.fillAlpha.toString()
    }

    // Stroke alpha slider
    const strokeAlphaInput = this.elements.get('geometry-stroke-alpha') as HTMLInputElement
    if (strokeAlphaInput) {
      strokeAlphaInput.value = gameStore.geometry.drawing.settings.strokeAlpha.toString()
    }
    
    // Texture (placeholder for future implementation)
    updateElement(this.elements, 'geometry-default-texture',
      'none',
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
   * Open color picker for stroke or fill color
   */
  private openColorPicker(colorType: 'stroke' | 'fill'): void {
    // Create a temporary color input element
    const colorInput = document.createElement('input')
    colorInput.type = 'color'
    colorInput.style.position = 'absolute'
    colorInput.style.left = '-9999px'
    
    // Set current color value
    if (colorType === 'stroke') {
      const currentColor = gameStore.geometry.drawing.settings.defaultColor
      colorInput.value = `#${currentColor.toString(16).padStart(6, '0')}`
    } else {
      // Fill color - using defaultFillColor from store
      const currentFillColor = gameStore.geometry.drawing.settings.defaultFillColor
      colorInput.value = `#${currentFillColor.toString(16).padStart(6, '0')}`
    }
    
    // Add to document and trigger click
    document.body.appendChild(colorInput)
    colorInput.click()
    
    // Handle color change
    colorInput.addEventListener('change', (event) => {
      const target = event.target as HTMLInputElement
      const hexColor = target.value
      const numericColor = parseInt(hexColor.replace('#', ''), 16)
      
      if (colorType === 'stroke') {
        updateGameStore.setDrawingSettings({ defaultColor: numericColor })
        console.log(`GeometryPanel: Updated default stroke color to ${hexColor} (${numericColor})`)
      } else {
        updateGameStore.setDrawingSettings({ defaultFillColor: numericColor })
        console.log(`GeometryPanel: Updated default fill color to ${hexColor} (${numericColor})`)
      }
      
      // Clean up
      document.body.removeChild(colorInput)
    })
    
    // Clean up if cancelled
    colorInput.addEventListener('blur', () => {
      if (document.body.contains(colorInput)) {
        document.body.removeChild(colorInput)
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
    } else {
      // When geometry panel is closed, set drawing mode to none
      updateGameStore.setDrawingMode('none')
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