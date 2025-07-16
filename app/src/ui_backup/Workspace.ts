import { subscribe } from 'valtio'
import { gameStore, updateGameStore } from '../store/gameStore'
import type { GeometricObject } from '../types'

export class Workspace {
  private panel: HTMLElement | null = null
  private _isVisible: boolean = false
  
  // Double-click detection (copied from proven StoreExplorer implementation)
  private lastClickTime = 0
  private lastClickedObjectId: string | null = null
  private readonly DOUBLE_CLICK_THRESHOLD = 300 // ms
  
  constructor() {
    this.panel = document.getElementById('workspace-panel')
    this.setupReactivity()
    this.setupEventHandlers()
    this.updateContent()
    
    // Set initial visibility
    if (this.panel) {
      this.panel.style.display = this._isVisible ? 'block' : 'none'
    }
  }
  
  private setupReactivity(): void {
    subscribe(gameStore.geometry, () => {
      this.updateContent()
    })
  }
  
  private setupEventHandlers(): void {
    if (!this.panel) return
    
    // Handle clicks on workspace items
    this.panel.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      
      // Handle object selection
      const objectItem = target.closest('[data-object-id]')
      if (objectItem) {
        const objectId = objectItem.getAttribute('data-object-id')
        if (objectId) {
          this.handleObjectClick(objectId, event)
        }
        return
      }
      
      // Handle favorite removal
      if (target.classList.contains('remove-favorite')) {
        const objectId = target.getAttribute('data-object-id')
        if (objectId) {
          updateGameStore.removeFromFavorites(objectId)
          event.stopPropagation()
        }
        return
      }
    })
  }
  
  private handleObjectClick(objectId: string, event: MouseEvent): void {
    const target = event.target as HTMLElement
    
    // Handle remove favorite button clicks
    if (target.classList.contains('remove-favorite')) {
      updateGameStore.removeFromFavorites(objectId)
      event.stopPropagation()
      return
    }
    
    const obj = gameStore.geometry.objects.find(o => o.id === objectId)
    if (!obj) return
    
    event.preventDefault()
    
    // Use proven StoreExplorer double-click detection method
    const currentTime = Date.now()
    const isDoubleClick = (
      currentTime - this.lastClickTime < this.DOUBLE_CLICK_THRESHOLD &&
      this.lastClickedObjectId === objectId
    )
    
    this.lastClickTime = currentTime
    this.lastClickedObjectId = objectId
    
    // Select the object
    updateGameStore.setSelectedObject(objectId)
    
    // Handle double-click navigation (use proven viewport method)
    if (isDoubleClick) {
      updateGameStore.centerViewportOnObject(objectId)
    }
  }
  
  private updateContent(): void {
    if (!this.panel) return
    
    const clipboardObject = gameStore.geometry.clipboard.copiedObject
    const favoriteObjects = this.getFavoriteObjects()
    
    this.panel.innerHTML = `
      <div class="flex h-full gap-3">
        <!-- Clipboard Section -->
        <div class="w-24 border-r border-base-300 p-3 flex flex-col">
          <h3 class="text-xs font-bold text-primary mb-3 flex items-center gap-1">
            <span>📋</span>
            <span>Clipboard</span>
          </h3>
          <div class="flex-1 flex flex-col gap-2">
            ${clipboardObject ? this.renderCompactObjectItem(clipboardObject, 'clipboard') : '<div class="text-xs opacity-50 text-center py-4">Empty</div>'}
          </div>
        </div>
        
        <!-- Favorites Section -->
        <div class="flex-1 p-3 flex flex-col">
          <h3 class="text-xs font-bold text-warning mb-3 flex items-center gap-1">
            <span>⭐</span>
            <span>Favorites (${favoriteObjects.length})</span>
          </h3>
          <div class="flex-1 flex flex-wrap gap-2 content-start overflow-y-auto custom-scrollbar">
            ${favoriteObjects.length > 0
              ? favoriteObjects.map(obj => this.renderCompactObjectItem(obj, 'favorite')).join('')
              : '<div class="text-xs opacity-50 py-4">No favorites</div>'
            }
          </div>
        </div>
      </div>
    `
  }
  
  private getFavoriteObjects(): GeometricObject[] {
    return gameStore.geometry.favorites.favoriteObjectIds
      .map(id => gameStore.geometry.objects.find(obj => obj.id === id))
      .filter(obj => obj !== undefined) as GeometricObject[]
  }
  
  private renderCompactObjectItem(obj: GeometricObject, context: 'clipboard' | 'favorite'): string {
    const isSelected = gameStore.geometry.selection.selectedObjectId === obj.id
    const colorHex = `#${obj.color.toString(16).padStart(6, '0')}`
    const objectType = this.getObjectType(obj)
    const typeIcon = this.getObjectTypeIcon(objectType)
    const position = this.formatCompactPosition(obj)
    
    // Get texture preview if available
    const textureData = updateGameStore.getObjectTexture(obj.id)
    const hasTexture = textureData && textureData.isValid
    
    return `
      <div class="workspace-object-item group relative bg-base-200/50 hover:bg-base-300/70 border border-base-300 rounded p-2 cursor-pointer transition-all duration-200 ${isSelected ? 'ring-2 ring-primary bg-primary/10' : ''} flex-shrink-0"
           data-object-id="${obj.id}"
           title="${objectType} - ${position}">
        
        <!-- Preview -->
        <div class="w-12 h-12 mb-1">
          ${hasTexture
            ? `<img src="${textureData.base64Preview}" class="w-full h-full object-cover rounded border" alt="${objectType}" />`
            : `<div class="w-full h-full rounded border flex items-center justify-center text-xs font-bold" style="background-color: ${colorHex}20; border-color: ${colorHex}; color: ${colorHex};">${typeIcon}</div>`
          }
        </div>
        
        <!-- Type and Position -->
        <div class="text-xs text-center">
          <div class="font-semibold text-base-content truncate">${objectType}</div>
          <div class="text-base-content/60 font-mono text-xs">${position}</div>
        </div>
        
        <!-- Remove favorite star for favorites context -->
        ${context === 'favorite'
          ? `<button class="remove-favorite absolute -top-1 -right-1 w-5 h-5 bg-base-100 border border-base-300 rounded-full text-xs leading-none opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-warning hover:text-white"
                     data-object-id="${obj.id}"
                     title="Remove from favorites">⭐</button>`
          : ''
        }
      </div>
    `
  }
  
  private formatCompactPosition(obj: GeometricObject): string {
    if ('anchorX' in obj && 'anchorY' in obj) {
      return `${obj.anchorX.toFixed(0)},${obj.anchorY.toFixed(0)}`
    } else if ('centerX' in obj && 'centerY' in obj) {
      return `${obj.centerX.toFixed(0)},${obj.centerY.toFixed(0)}`
    } else if ('x' in obj && 'y' in obj && 'width' in obj) {
      return `${obj.x.toFixed(0)},${obj.y.toFixed(0)}`
    } else if ('startX' in obj && 'endX' in obj) {
      return `${obj.startX.toFixed(0)},${obj.startY.toFixed(0)}`
    } else if ('x' in obj && 'y' in obj) {
      return `${obj.x.toFixed(0)},${obj.y.toFixed(0)}`
    }
    return '0,0'
  }
  
  
  private getObjectType(obj: GeometricObject): string {
    if ('anchorX' in obj) return 'Diamond'
    if ('width' in obj && 'height' in obj) return 'Rectangle'
    if ('centerX' in obj && 'radius' in obj) return 'Circle'
    if ('startX' in obj && 'endX' in obj) return 'Line'
    if ('x' in obj && 'y' in obj) return 'Point'
    return 'Object'
  }
  
  private getObjectTypeIcon(type: string): string {
    switch (type) {
      case 'Point': return '●'
      case 'Line': return '—'
      case 'Circle': return '○'
      case 'Rectangle': return '▢'
      case 'Diamond': return '◇'
      default: return '?'
    }
  }
  
  public toggle(): void {
    this._isVisible = !this._isVisible
    if (this.panel) {
      this.panel.style.display = this._isVisible ? 'block' : 'none'
    }
  }
  
  public setVisible(visible: boolean): void {
    this._isVisible = visible
    if (this.panel) {
      this.panel.style.display = this._isVisible ? 'block' : 'none'
    }
  }
  
  public getVisible(): boolean {
    return this._isVisible
  }
  
  public isVisible(): boolean {
    return this._isVisible
  }
  
  public destroy(): void {
    // Clean up if needed
  }
}