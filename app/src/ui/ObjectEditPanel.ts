import { subscribe } from 'valtio'
import { gameStore, updateGameStore } from '../store/gameStore'
import type { GeometricDiamond } from '../types'

export class ObjectEditPanel {
  private elements: Map<string, HTMLElement> = new Map()
  private isVisible: boolean = false
  private originalObject: GeometricDiamond | null = null
  
  constructor() {
    this.initializeElements()
    this.setupReactivity()
    this.setupEventHandlers()
  }
  
  private initializeElements(): void {
    const elementIds = [
      'object-edit-panel',
      'edit-object-id',
      'edit-anchor-x',
      'edit-anchor-y', 
      'edit-width',
      'edit-stroke-width',
      'edit-visible',
      'edit-panel-close',
      'edit-panel-apply',
      'edit-panel-cancel'
    ]
    
    elementIds.forEach(id => {
      const element = document.getElementById(id)
      if (element) {
        this.elements.set(id, element)
      } else {
        console.warn(`ObjectEditPanel element with id '${id}' not found`)
      }
    })
  }
  
  private setupReactivity(): void {
    subscribe(gameStore, () => {
      this.updateVisibility()
      this.updateValues()
    })
  }
  
  private setupEventHandlers(): void {
    // Close button
    const closeButton = this.elements.get('edit-panel-close')
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.closePanel()
      })
    }
    
    // Cancel button
    const cancelButton = this.elements.get('edit-panel-cancel')
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        this.closePanel()
      })
    }
    
    // Apply button
    const applyButton = this.elements.get('edit-panel-apply')
    if (applyButton) {
      applyButton.addEventListener('click', () => {
        this.applyChanges()
      })
    }
    
    // Live preview on input changes
    const inputIds = ['edit-anchor-x', 'edit-anchor-y', 'edit-width', 'edit-stroke-width', 'edit-visible']
    inputIds.forEach(id => {
      const input = this.elements.get(id)
      if (input) {
        input.addEventListener('input', () => {
          this.updatePreview()
        })
      }
    })
  }
  
  private updateVisibility(): void {
    const shouldBeVisible = gameStore.geometry.selection.isEditPanelOpen
    
    if (shouldBeVisible !== this.isVisible) {
      this.isVisible = shouldBeVisible
      const panelElement = this.elements.get('object-edit-panel')
      if (panelElement) {
        panelElement.style.display = this.isVisible ? 'block' : 'none'
      }
      
      if (this.isVisible) {
        this.loadSelectedObject()
      }
    }
  }
  
  private updateValues(): void {
    if (!this.isVisible) return
    
    const selectedObjectId = gameStore.geometry.selection.selectedObjectId
    if (!selectedObjectId) return
    
    const selectedObject = gameStore.geometry.objects.find(obj => obj.id === selectedObjectId)
    if (!selectedObject || !('anchorX' in selectedObject)) return
    
    const diamond = selectedObject as GeometricDiamond
    
    // Update UI elements
    const objectIdElement = this.elements.get('edit-object-id')
    if (objectIdElement) {
      objectIdElement.textContent = diamond.id
    }
    
    const anchorXInput = this.elements.get('edit-anchor-x') as HTMLInputElement
    if (anchorXInput) {
      anchorXInput.value = diamond.anchorX.toString()
    }
    
    const anchorYInput = this.elements.get('edit-anchor-y') as HTMLInputElement
    if (anchorYInput) {
      anchorYInput.value = diamond.anchorY.toString()
    }
    
    const widthInput = this.elements.get('edit-width') as HTMLInputElement
    if (widthInput) {
      widthInput.value = diamond.width.toString()
    }
    
    const strokeWidthInput = this.elements.get('edit-stroke-width') as HTMLInputElement
    if (strokeWidthInput) {
      strokeWidthInput.value = diamond.strokeWidth.toString()
    }
    
    const visibleInput = this.elements.get('edit-visible') as HTMLInputElement
    if (visibleInput) {
      visibleInput.checked = diamond.isVisible
    }
  }
  
  private loadSelectedObject(): void {
    const selectedObjectId = gameStore.geometry.selection.selectedObjectId
    if (!selectedObjectId) return
    
    const selectedObject = gameStore.geometry.objects.find(obj => obj.id === selectedObjectId)
    if (!selectedObject || !('anchorX' in selectedObject)) return
    
    // Store original object for restoration on cancel
    this.originalObject = { ...(selectedObject as GeometricDiamond) }
    
    this.updateValues()
  }
  
  private updatePreview(): void {
    if (!this.originalObject) return
    
    const selectedObjectId = gameStore.geometry.selection.selectedObjectId
    if (!selectedObjectId) return
    
    const objectIndex = gameStore.geometry.objects.findIndex(obj => obj.id === selectedObjectId)
    if (objectIndex === -1) return
    
    // Get current input values
    const anchorXInput = this.elements.get('edit-anchor-x') as HTMLInputElement
    const anchorYInput = this.elements.get('edit-anchor-y') as HTMLInputElement
    const widthInput = this.elements.get('edit-width') as HTMLInputElement
    const strokeWidthInput = this.elements.get('edit-stroke-width') as HTMLInputElement
    const visibleInput = this.elements.get('edit-visible') as HTMLInputElement
    
    if (!anchorXInput || !anchorYInput || !widthInput || !strokeWidthInput || !visibleInput) return
    
    // Parse values with validation
    let width = parseInt(widthInput.value)
    if (width % 2 === 1) width = width - 1 // Force even width
    if (width < 2) width = 2
    
    const anchorX = parseFloat(anchorXInput.value) || 0
    const anchorY = parseFloat(anchorYInput.value) || 0
    const strokeWidth = parseFloat(strokeWidthInput.value) || 1
    const isVisible = visibleInput.checked
    
    // Calculate height using geometry helper logic
    const totalHeight = (width - 1) / 2
    const height = totalHeight / 2
    
    // Update the object in store for live preview
    const updatedObject: GeometricDiamond = {
      ...this.originalObject,
      anchorX,
      anchorY,
      width,
      height,
      strokeWidth,
      isVisible
    }
    
    // Update object in store (this will trigger re-render)
    gameStore.geometry.objects[objectIndex] = updatedObject
  }
  
  private applyChanges(): void {
    // Changes are already applied via live preview
    // Just close the panel and clear original object
    this.originalObject = null
    this.closePanel()
  }
  
  private closePanel(): void {
    // Restore original object if cancel was pressed
    if (this.originalObject) {
      const selectedObjectId = gameStore.geometry.selection.selectedObjectId
      if (selectedObjectId) {
        const objectIndex = gameStore.geometry.objects.findIndex(obj => obj.id === selectedObjectId)
        if (objectIndex !== -1) {
          gameStore.geometry.objects[objectIndex] = this.originalObject
        }
      }
    }
    
    this.originalObject = null
    updateGameStore.setEditPanelOpen(false)
  }
  
  public destroy(): void {
    this.elements.clear()
  }
}