import { subscribe } from 'valtio';
import { gameStore } from '../store/gameStore';
import {
  updateElement,
  formatCoordinates,
  formatWindowSize,
  getBooleanStatusClass,
  getBooleanStatusText,
  getKeyStatusText,
  STATUS_COLORS
} from './handlers/UIHandlers';

export class StorePanel {
  private elements: Map<string, HTMLElement> = new Map();
  private isVisible: boolean = true;
  
  constructor() {
    this.initializeElements();
    this.setupReactivity();
    this.setupEventHandlers();
  }
  
  private initializeElements(): void {
    // Get all the elements by their IDs
    const elementIds = [
      'game-initialized',
      'game-loading',
      'game-scene',
      'camera-position',
      'pixeloid-scale',
      'top-left-corner',
      'bottom-right-corner',
      'window-size',
      'mouse-position',
      'mouse-pixeloid-position',
      'key-w',
      'key-a',
      'key-s',
      'key-d',
      'key-space',
      // Geometry Debug elements (Phase 1: Multi-Layer System)
      'drawing-mode',
      'objects-count',
      'selected-object',
      'active-raycasts',
      'layer-grid',
      'layer-geometry',
      'layer-raycast'
    ];
    
    elementIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        this.elements.set(id, element);
      } else {
        console.warn(`StorePanel element with id '${id}' not found`);
      }
    });
  }
  
  private setupReactivity(): void {
    subscribe(gameStore, () => {
      this.updateValues();
    });
    
    // Initial update
    this.updateValues();
  }
  
  private setupEventHandlers(): void {
    // Close button
    const closeBtn = document.getElementById('close-store-panel');
    closeBtn?.addEventListener('click', () => {
      this.toggle();
    });
  }
  
  private updateValues(): void {
    if (!this.isVisible) return;
    
    // System Status
    updateElement(this.elements, 'game-initialized', 
      getBooleanStatusText(gameStore.isInitialized),
      getBooleanStatusClass(gameStore.isInitialized)
    );
    
    updateElement(this.elements, 'game-loading', 
      getBooleanStatusText(gameStore.isLoading),
      getBooleanStatusClass(gameStore.isLoading)
    );
    
    updateElement(this.elements, 'game-scene', gameStore.currentScene, STATUS_COLORS.system);
    
    // Camera & Canvas
    updateElement(this.elements, 'camera-position', 
      formatCoordinates(gameStore.camera.position.x, gameStore.camera.position.y),
      STATUS_COLORS.camera
    );
    
    updateElement(this.elements, 'pixeloid-scale', 
      gameStore.camera.pixeloidScale.toString(),
      'text-primary'
    );
    
    updateElement(this.elements, 'top-left-corner', 
      formatCoordinates(gameStore.camera.viewportCorners.topLeft.x, gameStore.camera.viewportCorners.topLeft.y, 0),
      STATUS_COLORS.camera
    );
    
    updateElement(this.elements, 'bottom-right-corner', 
      formatCoordinates(gameStore.camera.viewportCorners.bottomRight.x, gameStore.camera.viewportCorners.bottomRight.y, 0),
      STATUS_COLORS.camera
    );
    
    // Window & Mouse
    updateElement(this.elements, 'window-size', 
      formatWindowSize(gameStore.windowWidth, gameStore.windowHeight),
      'text-info'
    );
    
    updateElement(this.elements, 'mouse-position', 
      formatCoordinates(gameStore.mousePosition.x, gameStore.mousePosition.y, 0),
      STATUS_COLORS.mouse
    );
    
    updateElement(this.elements, 'mouse-pixeloid-position', 
      formatCoordinates(gameStore.mousePixeloidPosition.x, gameStore.mousePixeloidPosition.y, 2),
      STATUS_COLORS.mouse
    );
    
    // Input State
    updateElement(this.elements, 'key-w', 
      getKeyStatusText(gameStore.input.keys.w),
      getBooleanStatusClass(gameStore.input.keys.w)
    );
    
    updateElement(this.elements, 'key-a', 
      getKeyStatusText(gameStore.input.keys.a),
      getBooleanStatusClass(gameStore.input.keys.a)
    );
    
    updateElement(this.elements, 'key-s', 
      getKeyStatusText(gameStore.input.keys.s),
      getBooleanStatusClass(gameStore.input.keys.s)
    );
    
    updateElement(this.elements, 'key-d', 
      getKeyStatusText(gameStore.input.keys.d),
      getBooleanStatusClass(gameStore.input.keys.d)
    );
    
    updateElement(this.elements, 'key-space',
      getKeyStatusText(gameStore.input.keys.space),
      getBooleanStatusClass(gameStore.input.keys.space)
    );

    // Geometry Debug (Phase 1: Multi-Layer System)
    updateElement(this.elements, 'drawing-mode',
      gameStore.geometry.drawing.mode,
      'text-success'
    );

    updateElement(this.elements, 'objects-count',
      gameStore.geometry.objects.length.toString(),
      'text-primary'
    );

    // Selected object
    const selectedObjectId = gameStore.geometry.selection.selectedObjectId
    const selectedText = selectedObjectId ? selectedObjectId : 'none'
    updateElement(this.elements, 'selected-object',
      selectedText,
      selectedObjectId ? 'text-info' : 'text-base-content/50'
    );

    updateElement(this.elements, 'active-raycasts',
      gameStore.geometry.raycast.activeRaycasts.length.toString(),
      'text-warning'
    );

    // Layer visibility states
    updateElement(this.elements, 'layer-grid',
      getBooleanStatusText(gameStore.geometry.layerVisibility.grid),
      getBooleanStatusClass(gameStore.geometry.layerVisibility.grid)
    );

    updateElement(this.elements, 'layer-geometry',
      getBooleanStatusText(gameStore.geometry.layerVisibility.geometry),
      getBooleanStatusClass(gameStore.geometry.layerVisibility.geometry)
    );

    updateElement(this.elements, 'layer-raycast',
      getBooleanStatusText(gameStore.geometry.layerVisibility.raycast),
      getBooleanStatusClass(gameStore.geometry.layerVisibility.raycast)
    );
  }
  
  /**
   * Toggle panel visibility
   */
  public toggle(): void {
    this.isVisible = !this.isVisible;
    const panelElement = document.getElementById('store-panel');
    if (panelElement) {
      panelElement.style.display = this.isVisible ? 'block' : 'none';
    }
    
    // Update values if becoming visible
    if (this.isVisible) {
      this.updateValues();
    }
  }
  
  /**
   * Set panel visibility
   */
  public setVisible(visible: boolean): void {
    this.isVisible = visible;
    const panelElement = document.getElementById('store-panel');
    if (panelElement) {
      panelElement.style.display = this.isVisible ? 'block' : 'none';
    }
    
    // Update values if becoming visible
    if (this.isVisible) {
      this.updateValues();
    }
  }
  
  /**
   * Get current visibility state
   */
  public getVisible(): boolean {
    return this.isVisible;
  }
  
  public resize(_width: number, _height: number): void {
    // Panel is positioned with fixed positioning, so no manual resize needed
    // Tailwind's responsive classes handle this automatically
  }
  
  public destroy(): void {
    // Clean up if needed
    this.elements.clear();
  }
}