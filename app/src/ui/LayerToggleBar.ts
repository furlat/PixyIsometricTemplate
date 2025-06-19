import { updateGameStore, gameStore } from '../store/gameStore'

export class LayerToggleBar {
  constructor() {
    this.initializeElements();
    this.setupEventListeners();
    this.updateAllButtons();
  }
  
  private initializeElements(): void {
    // Get the layer toggle bar element
    const layerToggleBar = document.getElementById('layer-toggle-bar');
    if (!layerToggleBar) {
      console.warn('LayerToggleBar element with id "layer-toggle-bar" not found');
    }
  }
  
  private setupEventListeners(): void {
    // Grid layer toggle button
    const gridToggle = document.getElementById('toggle-layer-grid');
    if (gridToggle) {
      gridToggle.addEventListener('click', () => {
        this.toggleLayer('grid');
      });
    } else {
      console.warn('Grid layer toggle button not found');
    }
    
    // Geometry layer toggle button
    const geometryToggle = document.getElementById('toggle-layer-geometry');
    if (geometryToggle) {
      geometryToggle.addEventListener('click', () => {
        this.toggleLayer('geometry');
      });
    } else {
      console.warn('Geometry layer toggle button not found');
    }
    
    // Raycast layer toggle button
    const raycastToggle = document.getElementById('toggle-layer-raycast');
    if (raycastToggle) {
      raycastToggle.addEventListener('click', () => {
        this.toggleLayer('raycast');
      });
    } else {
      console.warn('Raycast layer toggle button not found');
    }
  }
  
  /**
   * Toggle layer visibility
   */
  private toggleLayer(layer: 'grid' | 'geometry' | 'raycast'): void {
    const currentVisibility = gameStore.geometry.layerVisibility[layer];
    updateGameStore.setLayerVisibility(layer, !currentVisibility);
    this.updateLayerButton(layer);
  }
  
  /**
   * Update a specific layer button state
   */
  private updateLayerButton(layer: 'grid' | 'geometry' | 'raycast'): void {
    const button = document.getElementById(`toggle-layer-${layer}`);
    if (button) {
      const isVisible = gameStore.geometry.layerVisibility[layer];
      
      // Update button appearance based on state
      if (isVisible) {
        button.classList.remove('btn-outline');
        // Use different colors for each layer
        switch (layer) {
          case 'grid':
            button.classList.add('btn-success');
            button.classList.remove('btn-secondary', 'btn-warning');
            break;
          case 'geometry':
            button.classList.add('btn-secondary');
            button.classList.remove('btn-success', 'btn-warning');
            break;
          case 'raycast':
            button.classList.add('btn-warning');
            button.classList.remove('btn-success', 'btn-secondary');
            break;
        }
      } else {
        // Remove all color classes and add outline
        button.classList.remove('btn-success', 'btn-secondary', 'btn-warning');
        button.classList.add('btn-outline');
      }
      
      // Update button text (keep the same text)
      const buttonText = button.querySelector('.button-text');
      if (buttonText) {
        buttonText.textContent = layer.charAt(0).toUpperCase() + layer.slice(1);
      }
    }
  }
  
  /**
   * Update all layer button states
   */
  public updateAllButtons(): void {
    this.updateLayerButton('grid');
    this.updateLayerButton('geometry');
    this.updateLayerButton('raycast');
  }
  
  public destroy(): void {
    // Clean up event listeners if needed
  }
}