export class UIControlBar {
  private storePanel: { toggle: () => void; getVisible: () => boolean } | null = null;
  
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
  }
  
  /**
   * Register the store panel with the control bar
   */
  public registerStorePanel(storePanel: { toggle: () => void; getVisible: () => boolean }): void {
    this.storePanel = storePanel;
    this.updateStorePanelButton();
  }
  
  /**
   * Toggle store panel visibility
   */
  private toggleStorePanel(): void {
    if (this.storePanel) {
      this.storePanel.toggle();
      this.updateStorePanelButton();
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
  
  public destroy(): void {
    // Clean up event listeners if needed
  }
}