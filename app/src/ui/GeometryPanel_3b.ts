import { subscribe } from 'valtio'
import { gameStore_3b, gameStore_3b_methods } from '../store/gameStore_3b'

export class GeometryPanel_3b {
  private panel: HTMLElement | null = null
  private isVisible: boolean = false

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

    // Stroke width input
    const strokeWidthInput = document.getElementById('geometry-default-stroke-width') as HTMLInputElement
    if (strokeWidthInput) {
      strokeWidthInput.addEventListener('input', (event) => {
        const target = event.target as HTMLInputElement
        const newValue = Math.max(0.1, parseFloat(target.value) || 0.1)
        gameStore_3b_methods.setStrokeWidth(newValue)
        console.log(`GeometryPanel: Updated stroke width to ${newValue}`)
      })
    }

    // Clear all button
    const clearButton = document.getElementById('geometry-clear-all')
    if (clearButton) {
      clearButton.addEventListener('click', () => {
        gameStore_3b_methods.clearAllGeometry()
        console.log('GeometryPanel: Cleared all geometry objects')
      })
    }
  }

  private setupReactivity(): void {
    subscribe(gameStore_3b, () => {
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
      strokeWidthInput.value = gameStore_3b.style.defaultStrokeWidth.toString()
    }

    // Update stroke color display
    const colorElement = document.getElementById('geometry-default-color')
    if (colorElement) {
      const colorHex = `#${gameStore_3b.style.defaultColor.toString(16).padStart(6, '0')}`
      colorElement.textContent = colorHex
      colorElement.style.color = colorHex
    }

    // Update drawing mode button states
    this.updateModeButtons()
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