export class UIControlBar {
  private storePanel: { toggle: () => void; getVisible: () => boolean } | null = null;
  private geometryPanel: { toggle: () => void; getVisible: () => boolean } | null = null;
  private storeExplorer: { toggle: () => void; isVisible: () => boolean } | null = null;
  private workspace: { toggle: () => void; isVisible: () => boolean } | null = null;
  private layers: { toggle: () => void; isVisible: () => boolean } | null = null;
  
  constructor() {
    this.initializeElements();
    this.setupEventListeners();
  }
  
  private initializeElements(): void {
    // Get the control bar element
    const controlBar = document.getElementById('ui-control-bar');
    if (!controlBar) {
      console.warn('UIControlBar element with id "ui-control-bar" not found');
    }
  }
  
  private setupEventListeners(): void {
    // Store Panel toggle button
    const storePanelToggle = document.getElementById('toggle-store-panel');
    if (storePanelToggle) {
      storePanelToggle.addEventListener('click', () => {
        this.toggleStorePanel();
      });
    } else {
      console.warn('Store panel toggle button not found');
    }
    
    // Geometry Panel toggle button
    const geometryPanelToggle = document.getElementById('toggle-geometry-panel');
    if (geometryPanelToggle) {
      geometryPanelToggle.addEventListener('click', () => {
        this.toggleGeometryPanel();
      });
    } else {
      console.warn('Geometry panel toggle button not found');
    }
    
    // Store Explorer toggle button
    const storeExplorerToggle = document.getElementById('toggle-store-explorer');
    if (storeExplorerToggle) {
      storeExplorerToggle.addEventListener('click', () => {
        this.toggleStoreExplorer();
      });
    } else {
      console.warn('Store explorer toggle button not found');
    }
    
    // Workspace toggle button
    const workspaceToggle = document.getElementById('toggle-workspace');
    if (workspaceToggle) {
      workspaceToggle.addEventListener('click', () => {
        this.toggleWorkspace();
      });
    } else {
      console.warn('Workspace toggle button not found');
    }
    
    // Layers toggle button
    const layersToggle = document.getElementById('toggle-layers');
    if (layersToggle) {
      layersToggle.addEventListener('click', () => {
        this.toggleLayers();
      });
    } else {
      console.warn('Layers toggle button not found');
    }
  }
  
  /**
   * Register the store panel with the control bar
   */
  public registerStorePanel(storePanel: { toggle: () => void; getVisible: () => boolean }): void {
    this.storePanel = storePanel;
    this.updateStorePanelButton();
  }
  
  /**
   * Register the geometry panel with the control bar
   */
  public registerGeometryPanel(geometryPanel: { toggle: () => void; getVisible: () => boolean }): void {
    this.geometryPanel = geometryPanel;
    this.updateGeometryPanelButton();
  }
  
  /**
   * Register the store explorer with the control bar
   */
  public registerStoreExplorer(storeExplorer: { toggle: () => void; isVisible: () => boolean }): void {
    this.storeExplorer = storeExplorer;
    this.updateStoreExplorerButton();
  }
  
  /**
   * Register the workspace with the control bar
   */
  public registerWorkspace(workspace: { toggle: () => void; isVisible: () => boolean }): void {
    this.workspace = workspace;
    this.updateWorkspaceButton();
  }
  
  /**
   * Register the layers with the control bar
   */
  public registerLayers(layers: { toggle: () => void; isVisible: () => boolean }): void {
    this.layers = layers;
    this.updateLayersButton();
  }
  
  /**
   * Toggle store panel visibility
   */
  private toggleStorePanel(): void {
    if (this.storePanel) {
      this.storePanel.toggle();
      this.updateStorePanelButton();
      
      // Notify StoreExplorer of store panel state change for repositioning
      if (this.storeExplorer) {
        // Small delay to ensure DOM updates are complete
        setTimeout(() => {
          if (this.storeExplorer) { // Additional null check for timeout context
            // Force StoreExplorer to update position and height
            if ('updatePanelPosition' in this.storeExplorer && typeof (this.storeExplorer as any).updatePanelPosition === 'function') {
              (this.storeExplorer as any).updatePanelPosition();
            }
            if ('updatePanelHeight' in this.storeExplorer && typeof (this.storeExplorer as any).updatePanelHeight === 'function') {
              (this.storeExplorer as any).updatePanelHeight();
            }
          }
        }, 10);
      }
    }
  }
  
  /**
   * Toggle geometry panel visibility
   */
  private toggleGeometryPanel(): void {
    if (this.geometryPanel) {
      this.geometryPanel.toggle();
      this.updateGeometryPanelButton();
    }
  }
  
  /**
   * Toggle store explorer visibility
   */
  private toggleStoreExplorer(): void {
    if (this.storeExplorer) {
      this.storeExplorer.toggle();
      this.updateStoreExplorerButton();
    }
  }
  
  /**
   * Toggle workspace visibility
   */
  private toggleWorkspace(): void {
    if (this.workspace) {
      this.workspace.toggle();
      this.updateWorkspaceButton();
    }
  }
  
  /**
   * Toggle layers visibility
   */
  private toggleLayers(): void {
    if (this.layers) {
      this.layers.toggle();
      this.updateLayersButton();
    }
  }
  
  /**
   * Update the store panel button state
   */
  private updateStorePanelButton(): void {
    const button = document.getElementById('toggle-store-panel');
    if (button && this.storePanel) {
      const isVisible = this.storePanel.getVisible();
      
      // Update button appearance based on state
      if (isVisible) {
        button.classList.remove('btn-outline');
        button.classList.add('btn-primary');
      } else {
        button.classList.remove('btn-primary');
        button.classList.add('btn-outline');
      }
      
      // Update button text
      const buttonText = button.querySelector('.button-text');
      if (buttonText) {
        buttonText.textContent = 'Store';
      }
    }
  }
  
  /**
   * Update the geometry panel button state
   */
  private updateGeometryPanelButton(): void {
    const button = document.getElementById('toggle-geometry-panel');
    if (button && this.geometryPanel) {
      const isVisible = this.geometryPanel.getVisible();
      
      // Update button appearance based on state
      if (isVisible) {
        button.classList.remove('btn-outline');
        button.classList.add('btn-secondary');
      } else {
        button.classList.remove('btn-secondary');
        button.classList.add('btn-outline');
      }
      
      // Update button text
      const buttonText = button.querySelector('.button-text');
      if (buttonText) {
        buttonText.textContent = 'Geometry';
      }
    }
  }
  
  /**
   * Update the store explorer button state
   */
  private updateStoreExplorerButton(): void {
    const button = document.getElementById('toggle-store-explorer');
    if (button && this.storeExplorer) {
      const isVisible = this.storeExplorer.isVisible();
      
      // Update button appearance based on state
      if (isVisible) {
        button.classList.remove('btn-outline');
        button.classList.add('btn-accent');
      } else {
        button.classList.remove('btn-accent');
        button.classList.add('btn-outline');
      }
      
      // Update button text
      const buttonText = button.querySelector('.button-text');
      if (buttonText) {
        buttonText.textContent = 'Explorer';
      }
    }
  }
  
  /**
   * Update the workspace button state
   */
  private updateWorkspaceButton(): void {
    const button = document.getElementById('toggle-workspace');
    if (button && this.workspace) {
      const isVisible = this.workspace.isVisible();
      
      // Update button appearance based on state
      if (isVisible) {
        button.classList.remove('btn-outline');
        button.classList.add('btn-info');
      } else {
        button.classList.remove('btn-info');
        button.classList.add('btn-outline');
      }
      
      // Update button text
      const buttonText = button.querySelector('.button-text');
      if (buttonText) {
        buttonText.textContent = 'Workspace';
      }
    }
  }
  
  /**
   * Update the layers button state
   */
  private updateLayersButton(): void {
    const button = document.getElementById('toggle-layers');
    if (button && this.layers) {
      const isVisible = this.layers.isVisible();
      
      // Update button appearance based on state
      if (isVisible) {
        button.classList.remove('btn-outline');
        button.classList.add('btn-warning');
      } else {
        button.classList.remove('btn-warning');
        button.classList.add('btn-outline');
      }
      
      // Update button text
      const buttonText = button.querySelector('.button-text');
      if (buttonText) {
        buttonText.textContent = 'Layers';
      }
    }
  }
  
  public destroy(): void {
    // Clean up event listeners if needed
  }
}