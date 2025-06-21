import { gameStore, updateGameStore } from '../store/gameStore'
import { subscribe } from 'valtio'
import type { GeometricObject, GeometricPoint, GeometricLine, GeometricCircle, GeometricRectangle, GeometricDiamond } from '../types'

// Shared panel constants - realistic heights that match Store panel's actual size
const PANEL_CONSTANTS = {
  DEFAULT_MAX_HEIGHT: 600, // Reasonable max height for both panels
  MIN_HEIGHT: 200, // Minimum panel height
  TOP_OFFSET: 16, // top-4 = 1rem = 16px
  SIDE_OFFSET: 16 // right-4/left-4 = 1rem = 16px
} as const

/**
 * StoreExplorer provides a comprehensive view of all geometric objects in the store
 * with interactive features for navigation and object management.
 * 
 * Features:
 * - Object list with small visual previews
 * - Summary statistics for each object
 * - Scrollable interface for large object counts
 * - Right-click context menu (opens ObjectEditPanel)
 * - Double-click navigation (teleports viewport to object)
 */
export class StoreExplorer {
  private panel: HTMLElement
  private objectList: HTMLElement
  private objectItems: Map<string, HTMLElement> = new Map()
  private savedStorePanelHeight: number = PANEL_CONSTANTS.DEFAULT_MAX_HEIGHT
  private storeVisibilityObserver: MutationObserver | null = null
  
  // Double-click detection
  private lastClickTime = 0
  private lastClickedObjectId: string | null = null
  private readonly DOUBLE_CLICK_THRESHOLD = 300 // ms

  constructor() {
    this.panel = this.createPanel()
    this.objectList = this.panel.querySelector('.object-list') as HTMLElement
    
    this.setupEventListeners()
    this.subscribeToStoreChanges()
    this.setupStoreVisibilityObserver()
    
    // Initial render
    this.updateObjectList()
    this.updateStats()
  }

  /**
   * Create the main panel HTML structure
   */
  private createPanel(): HTMLElement {
    const panel = document.createElement('div')
    panel.id = 'store-explorer-panel'
    panel.className = 'fixed top-4 w-80 h-96 bg-base-100 border border-base-300 rounded-lg shadow-lg z-20 flex-col'
    panel.style.display = 'none' // Start hidden
    
    // Position smartly relative to store panel
    this.updatePanelPosition(panel)
    
    panel.innerHTML = `
      <div class="flex items-center justify-between p-3 border-b border-base-300">
        <h3 class="text-lg font-semibold">Store Explorer</h3>
        <button class="btn btn-sm btn-ghost btn-circle hover:bg-error hover:text-white transition-colors" id="close-store-explorer" title="Close Store Explorer">
          <span class="text-lg">✕</span>
        </button>
      </div>
      
      <div class="stats-summary p-3 text-sm bg-base-200 border-b border-base-300">
        <div class="flex justify-between">
          <span>Objects: <span class="font-mono" id="object-count">0</span></span>
          <span>Selected: <span class="font-mono" id="selected-info">None</span></span>
        </div>
        <div class="mt-1 text-xs opacity-70">
          Right-click: Edit • Double-click: Navigate
        </div>
      </div>
      
      <div class="object-list flex-1 overflow-y-auto p-2">
        <!-- Dynamic object items will be inserted here -->
      </div>
    `
    
    document.body.appendChild(panel)
    return panel
  }

  /**
   * Set up event listeners for panel interactions
   */
  private setupEventListeners(): void {
    // Close button
    const closeBtn = this.panel.querySelector('#close-store-explorer')
    closeBtn?.addEventListener('click', () => {
      this.hide()
    })
    
    // Panel-wide event delegation for object interactions
    this.objectList.addEventListener('click', this.handleObjectClick.bind(this))
    this.objectList.addEventListener('contextmenu', this.handleObjectRightClick.bind(this))
  }

  /**
   * Subscribe to store changes for reactive updates
   */
  private subscribeToStoreChanges(): void {
    // Subscribe to geometry objects changes
    subscribe(gameStore.geometry.objects, () => {
      this.updateObjectList()
      this.updateStats()
    })
    
    // Subscribe to selection changes
    subscribe(gameStore.geometry.selection, () => {
      this.updateSelection()
      this.updateStats()
    })
    
    // Subscribe to texture registry changes for preview updates
    subscribe(gameStore.textureRegistry.objectTextures, () => {
      this.updatePreviews()
    })
    
    // Subscribe to favorites changes for star icon updates
    subscribe(gameStore.geometry.favorites, () => {
      this.updateObjectList()
    })
  }

  /**
   * Set up store panel visibility observer for dynamic repositioning
   */
  private setupStoreVisibilityObserver(): void {
    const storePanel = document.getElementById('store-panel')
    if (!storePanel) return

    this.storeVisibilityObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const target = mutation.target as HTMLElement
          const isVisible = target.style.display !== 'none'
          
          if (isVisible) {
            // Store panel became visible - save its height and reposition
            this.saveStorePanelHeight()
          }
          
          // Always update position when store panel visibility changes
          this.updatePanelPosition()
          
          // Update height to match or adapt
          if (this.isVisible()) {
            setTimeout(() => this.updatePanelHeight(), 10)
          }
          
          console.log(`StoreExplorer: Store panel visibility changed, visible: ${isVisible}`)
        }
      })
    })

    this.storeVisibilityObserver.observe(storePanel, {
      attributes: true,
      attributeFilter: ['style']
    })
  }

  /**
   * Save the current Store panel height for later use
   */
  private saveStorePanelHeight(): void {
    const storePanel = document.getElementById('store-panel')
    if (storePanel && storePanel.style.display !== 'none') {
      const height = storePanel.getBoundingClientRect().height
      if (height > 0) {
        this.savedStorePanelHeight = height
        console.log(`StoreExplorer: Saved Store panel height: ${height}px`)
      }
    }
  }

  /**
   * Update the object list display
   */
  private updateObjectList(): void {
    const objects = gameStore.geometry.objects
    const currentObjectIds = new Set(objects.map(obj => obj.id))
    
    // Remove items for deleted objects
    for (const [objectId, element] of this.objectItems) {
      if (!currentObjectIds.has(objectId)) {
        element.remove()
        this.objectItems.delete(objectId)
      }
    }
    
    // Add or update items for current objects
    objects.forEach(obj => {
      if (this.objectItems.has(obj.id)) {
        this.updateObjectItem(obj)
      } else {
        this.createObjectItem(obj)
      }
    })
    
    // Update panel height after content changes
    setTimeout(() => this.updatePanelHeight(), 0)
  }

  /**
   * Create a new object list item
   */
  private createObjectItem(obj: GeometricObject): void {
    const item = document.createElement('div')
    item.className = 'object-item flex items-center p-2 mb-2 rounded border border-base-300 hover:bg-base-200 cursor-pointer'
    item.dataset.objectId = obj.id
    
    item.innerHTML = `
      <div class="preview-container w-12 h-12 flex-shrink-0 mr-3 bg-base-100 border border-base-300 rounded flex items-center justify-center">
        <div class="preview-placeholder text-xs opacity-50">...</div>
      </div>
      
      <div class="object-info flex-1 min-w-0">
        <div class="flex items-center justify-between">
          <span class="type-badge text-xs px-2 py-1 rounded text-white font-medium bg-primary">
            ${this.getObjectTypeName(obj)}
          </span>
          <div class="flex items-center gap-1">
            <button class="favorite-star btn btn-xs btn-ghost btn-circle hover:bg-warning hover:text-white transition-colors ${updateGameStore.isFavorite(obj.id) ? 'text-warning' : 'text-base-content/30'}" data-object-id="${obj.id}" title="${updateGameStore.isFavorite(obj.id) ? 'Remove from favorites' : 'Add to favorites'}">
              ${updateGameStore.isFavorite(obj.id) ? '⭐' : '☆'}
            </button>
            <button class="delete-btn btn btn-xs btn-ghost btn-circle text-error hover:bg-error hover:text-white" data-object-id="${obj.id}" title="Delete object">
              🗑️
            </button>
            <span class="text-xs opacity-70">#${obj.id.split('_')[1] || obj.id}</span>
          </div>
        </div>
        
        <div class="position text-xs opacity-80 mt-1 font-mono">
          ${this.formatObjectPosition(obj)}
        </div>
        
        <div class="properties text-xs opacity-60 mt-1">
          ${this.formatObjectProperties(obj)}
        </div>
      </div>
    `
    
    this.objectList.appendChild(item)
    this.objectItems.set(obj.id, item)
    
    // Try to load preview immediately if available
    this.updateObjectItemPreview(obj.id)
  }

  /**
   * Update an existing object item
   */
  private updateObjectItem(obj: GeometricObject): void {
    const item = this.objectItems.get(obj.id)
    if (!item) return
    
    // Update position and properties
    const positionEl = item.querySelector('.position')
    const propertiesEl = item.querySelector('.properties')
    
    if (positionEl) {
      positionEl.textContent = this.formatObjectPosition(obj)
    }
    
    if (propertiesEl) {
      propertiesEl.textContent = this.formatObjectProperties(obj)
    }
    
    // Update favorite star
    const starBtn = item.querySelector('.favorite-star') as HTMLElement
    if (starBtn) {
      const isFavorite = updateGameStore.isFavorite(obj.id)
      starBtn.textContent = isFavorite ? '⭐' : '☆'
      starBtn.className = `favorite-star btn btn-xs btn-ghost btn-circle hover:bg-warning hover:text-white transition-colors ${isFavorite ? 'text-warning' : 'text-base-content/30'}`
      starBtn.title = isFavorite ? 'Remove from favorites' : 'Add to favorites'
    }
    
    // Update preview
    this.updateObjectItemPreview(obj.id)
  }

  /**
   * Update preview image for a specific object item
   */
  private updateObjectItemPreview(objectId: string): void {
    const item = this.objectItems.get(objectId)
    if (!item) {
      console.log(`StoreExplorer: No item found for object ${objectId}`)
      return
    }
    
    const previewContainer = item.querySelector('.preview-container') as HTMLElement
    const textureData = gameStore.textureRegistry.objectTextures[objectId]
    
    console.log(`StoreExplorer: Updating preview for ${objectId}`, {
      hasTextureData: !!textureData,
      hasBase64: !!(textureData?.base64Preview),
      isValid: textureData?.isValid,
      base64Length: textureData?.base64Preview?.length || 0,
      capturedAt: textureData?.capturedAt ? new Date(textureData.capturedAt).toLocaleTimeString() : 'N/A'
    })
    
    if (textureData && textureData.base64Preview) {
      if (textureData.isValid) {
        console.log(`StoreExplorer: Setting valid preview for ${objectId}`)
        // Replace placeholder with actual preview image
        previewContainer.innerHTML = `
          <img
            src="${textureData.base64Preview}"
            alt="Object Preview"
            class="w-full h-full object-contain rounded"
            title="Preview captured at ${new Date(textureData.capturedAt).toLocaleTimeString()}"
            onload="console.log('Image loaded for ${objectId}')"
            onerror="console.error('Image failed to load for ${objectId}')"
          />
        `
      } else {
        console.log(`StoreExplorer: Setting error preview for ${objectId}`)
        // Show error state with retry button
        previewContainer.innerHTML = `
          <div class="preview-error flex flex-col items-center justify-center h-full">
            <img
              src="${textureData.base64Preview}"
              alt="Error Preview"
              class="w-full h-full object-contain rounded opacity-75"
              title="Capture failed - click to retry"
            />
            <button class="retry-preview-btn absolute inset-0 w-full h-full opacity-0 hover:opacity-20 bg-blue-500 rounded transition-opacity"
                    data-object-id="${objectId}"
                    title="Click to retry preview capture">
            </button>
          </div>
        `
      }
    } else {
      console.log(`StoreExplorer: Setting loading placeholder for ${objectId}`)
      // Show loading placeholder with object info
      const obj = gameStore.geometry.objects.find(o => o.id === objectId)
      const objType = obj ? this.getObjectTypeName(obj) : 'Object'
      
      previewContainer.innerHTML = `
        <div class="preview-placeholder text-xs opacity-50 flex flex-col items-center justify-center h-full">
          <div class="text-xs mb-1">${objType}</div>
          <div class="text-xs">Loading...</div>
        </div>
      `
    }
  }

  /**
   * Update previews for all items
   */
  private updatePreviews(): void {
    for (const objectId of this.objectItems.keys()) {
      this.updateObjectItemPreview(objectId)
    }
  }

  /**
   * Update selection highlighting
   */
  private updateSelection(): void {
    const selectedId = gameStore.geometry.selection.selectedObjectId
    
    // Remove previous selection highlighting
    this.objectItems.forEach(item => {
      item.classList.remove('ring-2', 'ring-primary', 'bg-primary/10')
    })
    
    // Add selection highlighting to current selection
    if (selectedId) {
      const selectedItem = this.objectItems.get(selectedId)
      if (selectedItem) {
        selectedItem.classList.add('ring-2', 'ring-primary', 'bg-primary/10')
      }
    }
  }

  /**
   * Update statistics display
   */
  private updateStats(): void {
    const objectCount = gameStore.geometry.objects.length
    const selectedId = gameStore.geometry.selection.selectedObjectId
    
    const countEl = this.panel.querySelector('#object-count')
    const selectedEl = this.panel.querySelector('#selected-info')
    
    if (countEl) {
      countEl.textContent = objectCount.toString()
    }
    
    if (selectedEl) {
      if (selectedId) {
        const selectedObj = gameStore.geometry.objects.find(obj => obj.id === selectedId)
        selectedEl.textContent = selectedObj ? this.getObjectTypeName(selectedObj) : 'None'
      } else {
        selectedEl.textContent = 'None'
      }
    }
  }

  /**
   * Handle object item clicks (selection and double-click navigation)
   */
  private handleObjectClick(event: MouseEvent): void {
    const target = event.target as HTMLElement
    
    // Handle retry preview button clicks
    if (target.classList.contains('retry-preview-btn') || target.closest('.retry-preview-btn')) {
      const retryBtn = target.classList.contains('retry-preview-btn') ? target : target.closest('.retry-preview-btn') as HTMLElement
      const objectId = retryBtn?.dataset.objectId
      if (objectId) {
        this.retryObjectPreview(objectId)
        event.preventDefault()
        event.stopPropagation()
        return
      }
    }
    
    // Handle favorite star clicks
    if (target.classList.contains('favorite-star') || target.closest('.favorite-star')) {
      const starBtn = target.classList.contains('favorite-star') ? target : target.closest('.favorite-star') as HTMLElement
      const objectId = starBtn?.dataset.objectId
      if (objectId) {
        updateGameStore.toggleFavorite(objectId)
        this.updateObjectItem(gameStore.geometry.objects.find(obj => obj.id === objectId)!)
        event.preventDefault()
        event.stopPropagation()
        return
      }
    }
    
    // Handle delete button clicks
    if (target.classList.contains('delete-btn') || target.closest('.delete-btn')) {
      const deleteBtn = target.classList.contains('delete-btn') ? target : target.closest('.delete-btn') as HTMLElement
      const objectId = deleteBtn?.dataset.objectId
      if (objectId) {
        // Delete the object
        updateGameStore.removeGeometricObject(objectId)
        // Clear selection if this was the selected object
        if (gameStore.geometry.selection.selectedObjectId === objectId) {
          updateGameStore.clearSelection()
        }
        event.preventDefault()
        event.stopPropagation()
        return
      }
    }
    
    const item = target.closest('.object-item') as HTMLElement
    if (!item) return
    
    const objectId = item.dataset.objectId
    if (!objectId) return
    
    event.preventDefault()
    
    const currentTime = Date.now()
    const isDoubleClick = (
      currentTime - this.lastClickTime < this.DOUBLE_CLICK_THRESHOLD &&
      this.lastClickedObjectId === objectId
    )
    
    this.lastClickTime = currentTime
    this.lastClickedObjectId = objectId
    
    // Select the object
    updateGameStore.setSelectedObject(objectId)
    
    // Handle double-click navigation
    if (isDoubleClick) {
      this.navigateToObject(objectId)
    }
  }

  /**
   * Handle right-click context menu (open edit panel)
   */
  private handleObjectRightClick(event: MouseEvent): void {
    event.preventDefault()
    
    const item = (event.target as HTMLElement).closest('.object-item') as HTMLElement
    if (!item) return
    
    const objectId = item.dataset.objectId
    if (!objectId) return
    
    // Select and open edit panel
    updateGameStore.setSelectedObject(objectId)
    updateGameStore.setEditPanelOpen(true)
  }

  /**
   * Navigate viewport to center on the selected object
   */
  private navigateToObject(objectId: string): void {
    // Use the new store method that leverages metadata for precise centering
    updateGameStore.centerCameraOnObject(objectId)
  }

  /**
   * Get human-readable object type name
   */
  private getObjectTypeName(obj: GeometricObject): string {
    if ('anchorX' in obj) return 'Diamond'
    if ('radius' in obj) return 'Circle'
    if ('width' in obj && 'height' in obj) return 'Rectangle'
    if ('startX' in obj && 'endX' in obj) return 'Line'
    if ('x' in obj && 'y' in obj) return 'Point'
    return 'Unknown'
  }

  /**
   * Format object position for display
   */
  private formatObjectPosition(obj: GeometricObject): string {
    if ('anchorX' in obj && 'anchorY' in obj) {
      const diamond = obj as GeometricDiamond
      return `(${diamond.anchorX.toFixed(1)}, ${diamond.anchorY.toFixed(1)})`
    } else if ('centerX' in obj && 'centerY' in obj) {
      const circle = obj as GeometricCircle
      return `Center: (${circle.centerX.toFixed(1)}, ${circle.centerY.toFixed(1)})`
    } else if ('x' in obj && 'y' in obj && 'width' in obj && 'height' in obj) {
      const rect = obj as GeometricRectangle
      return `(${rect.x.toFixed(1)}, ${rect.y.toFixed(1)})`
    } else if ('startX' in obj && 'endX' in obj) {
      const line = obj as GeometricLine
      return `(${line.startX.toFixed(1)}, ${line.startY.toFixed(1)}) → (${line.endX.toFixed(1)}, ${line.endY.toFixed(1)})`
    } else if ('x' in obj && 'y' in obj) {
      const point = obj as GeometricPoint
      return `(${point.x.toFixed(1)}, ${point.y.toFixed(1)})`
    }
    return 'Unknown position'
  }

  /**
   * Format object properties for display
   */
  private formatObjectProperties(obj: GeometricObject): string {
    if ('width' in obj && 'height' in obj) {
      const sized = obj as GeometricRectangle | GeometricDiamond
      return `Size: ${sized.width.toFixed(1)} × ${sized.height.toFixed(1)}`
    } else if ('radius' in obj) {
      const circle = obj as GeometricCircle
      return `Radius: ${circle.radius.toFixed(1)}`
    } else if ('startX' in obj && 'endX' in obj) {
      const line = obj as GeometricLine
      const length = Math.sqrt(
        Math.pow(line.endX - line.startX, 2) +
        Math.pow(line.endY - line.startY, 2)
      )
      return `Length: ${length.toFixed(1)}`
    }
    return `Created: ${new Date(obj.createdAt).toLocaleTimeString()}`
  }

  /**
   * Retry preview capture for a specific object
   */
  private retryObjectPreview(objectId: string): void {
    console.log(`StoreExplorer: Retrying preview capture for object ${objectId}`)
    
    // Clear existing texture data to force re-capture
    updateGameStore.removeObjectTexture(objectId)
    
    // Show loading state immediately
    this.updateObjectItemPreview(objectId)
    
    // Trigger a geometry layer refresh to re-capture textures
    // This will mark the object as needing texture capture again
    const obj = gameStore.geometry.objects.find(o => o.id === objectId)
    if (obj) {
      // Force a geometry refresh by briefly making the object invisible and visible again
      updateGameStore.updateGeometricObjectVisibility(objectId, false)
      
      // Use a small delay to ensure the visibility change is processed
      setTimeout(() => {
        updateGameStore.updateGeometricObjectVisibility(objectId, true)
        console.log(`StoreExplorer: Triggered re-render for object ${objectId}`)
      }, 50)
    }
  }

  /**
   * Update panel position based on store panel visibility
   */
  public updatePanelPosition(panel?: HTMLElement): void {
    const targetPanel = panel || this.panel
    const storePanel = document.getElementById('store-panel')
    
    if (storePanel && storePanel.style.display !== 'none') {
      // Store panel is visible, position StoreExplorer to its left
      targetPanel.style.right = '352px' // 320px panel width + 32px gap
    } else {
      // Store panel is hidden, position StoreExplorer at the right
      targetPanel.style.right = '16px'
    }
  }

  /**
   * Update panel height to auto-adapt to content until reaching store panel height
   */
  private updatePanelHeight(): void {
    if (!this.panel) return
    
    // Get the actual content elements using the correct structure
    const headerDiv = this.panel.querySelector('.flex.items-center.justify-between') as HTMLElement
    const statsDiv = this.panel.querySelector('.stats-summary') as HTMLElement
    const scrollableDiv = this.panel.querySelector('.object-list') as HTMLElement
    
    if (!headerDiv || !statsDiv || !scrollableDiv) {
      console.warn('StoreExplorer: Could not find panel elements for height calculation', {
        header: !!headerDiv,
        stats: !!statsDiv,
        scrollable: !!scrollableDiv
      })
      return
    }
    
    // Calculate actual heights from DOM elements
    const headerHeight = headerDiv.getBoundingClientRect().height
    const statsHeight = statsDiv.getBoundingClientRect().height
    
    // Calculate actual item heights if we have items
    let actualItemHeight = 76 // Default fallback
    const firstItem = scrollableDiv.querySelector('.object-item') as HTMLElement
    if (firstItem) {
      const itemRect = firstItem.getBoundingClientRect()
      const itemStyle = window.getComputedStyle(firstItem)
      const marginBottom = parseInt(itemStyle.marginBottom) || 0
      actualItemHeight = itemRect.height + marginBottom
    }
    
    const objectCount = gameStore.geometry.objects.length
    const contentHeight = objectCount > 0 ? objectCount * actualItemHeight : 100
    
    // Account for scrollable div padding
    const scrollablePadding = 16 // The p-2 class adds padding to the scrollable div
    const totalContentHeight = contentHeight + scrollablePadding
    
    const baseHeight = headerHeight + statsHeight
    
    const safetyBuffer = 12
    const neededHeight = baseHeight + totalContentHeight + safetyBuffer
    
    // Always use natural growth behavior - grow to fit content up to saved height limit
    const maxHeight = this.savedStorePanelHeight
    
    if (neededHeight <= maxHeight) {
      // Content fits - panel grows naturally
      this.panel.style.height = `${neededHeight}px`
      this.panel.style.maxHeight = 'none'
      scrollableDiv.style.maxHeight = `${totalContentHeight}px`
      scrollableDiv.style.overflowY = 'visible'
      
      console.log(`StoreExplorer: Natural growth - objects: ${objectCount}, height: ${neededHeight}px (max: ${maxHeight}px)`)
    } else {
      // Content exceeds saved max - use saved max height and scroll
      this.panel.style.height = `${maxHeight}px`
      this.panel.style.maxHeight = `${maxHeight}px`
      
      const availableScrollHeight = maxHeight - baseHeight - safetyBuffer
      scrollableDiv.style.maxHeight = `${availableScrollHeight}px`
      scrollableDiv.style.overflowY = 'auto'
      
      console.log(`StoreExplorer: Using saved max height with scroll - objects: ${objectCount}, needed: ${neededHeight}px, max: ${maxHeight}px`)
    }
  }

  /**
   * Show the store explorer panel
   */
  public show(): void {
    this.saveStorePanelHeight() // Save current store panel height
    this.updatePanelPosition() // Update position before showing
    this.panel.style.display = 'flex'
    this.updateObjectList()
    this.updateStats()
    this.updatePanelHeight() // Update height based on content
  }

  /**
   * Hide the store explorer panel
   */
  public hide(): void {
    this.panel.style.display = 'none'
  }

  /**
   * Toggle the store explorer panel visibility
   */
  public toggle(): void {
    if (this.panel.style.display === 'none') {
      this.show()
    } else {
      this.hide()
    }
  }

  /**
   * Check if panel is currently visible
   */
  public isVisible(): boolean {
    return this.panel.style.display !== 'none'
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.storeVisibilityObserver) {
      this.storeVisibilityObserver.disconnect()
      this.storeVisibilityObserver = null
    }
    this.panel.remove()
    this.objectItems.clear()
  }
}