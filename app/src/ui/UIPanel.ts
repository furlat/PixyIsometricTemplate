import { subscribe } from 'valtio';
import { gameStore } from '../store/gameStore';

export class UIPanel {
  private elements: Map<string, HTMLElement> = new Map();
  
  constructor() {
    this.initializeElements();
    this.setupReactivity();
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
      'key-space'
    ];
    
    elementIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        this.elements.set(id, element);
      } else {
        console.warn(`UI element with id '${id}' not found`);
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
  
  private updateValues(): void {
    // System Status
    this.updateElement('game-initialized', 
      gameStore.isInitialized ? 'true' : 'false',
      gameStore.isInitialized ? 'status-active' : 'status-inactive'
    );
    
    this.updateElement('game-loading', 
      gameStore.isLoading ? 'true' : 'false',
      gameStore.isLoading ? 'status-active' : 'status-inactive'
    );
    
    this.updateElement('game-scene', gameStore.currentScene, 'status-system');
    
    // Camera & Canvas
    this.updateElement('camera-position', 
      `${gameStore.camera.position.x.toFixed(1)}, ${gameStore.camera.position.y.toFixed(1)}`,
      'status-camera'
    );
    
    this.updateElement('pixeloid-scale', 
      gameStore.camera.pixeloidScale.toString(),
      'text-primary'
    );
    
    this.updateElement('top-left-corner', 
      `${gameStore.camera.viewportCorners.topLeft.x.toFixed(0)}, ${gameStore.camera.viewportCorners.topLeft.y.toFixed(0)}`,
      'status-camera'
    );
    
    this.updateElement('bottom-right-corner', 
      `${gameStore.camera.viewportCorners.bottomRight.x.toFixed(0)}, ${gameStore.camera.viewportCorners.bottomRight.y.toFixed(0)}`,
      'status-camera'
    );
    
    // Window & Mouse
    this.updateElement('window-size', 
      `${gameStore.windowWidth} x ${gameStore.windowHeight}`,
      'text-info'
    );
    
    this.updateElement('mouse-position', 
      `${gameStore.mousePosition.x}, ${gameStore.mousePosition.y}`,
      'status-mouse'
    );
    
    this.updateElement('mouse-pixeloid-position', 
      `${gameStore.mousePixeloidPosition.x.toFixed(2)}, ${gameStore.mousePixeloidPosition.y.toFixed(2)}`,
      'status-mouse'
    );
    
    // Input State
    this.updateElement('key-w', 
      gameStore.input.keys.w ? 'Pressed' : 'Released',
      gameStore.input.keys.w ? 'status-active' : 'status-inactive'
    );
    
    this.updateElement('key-a', 
      gameStore.input.keys.a ? 'Pressed' : 'Released',
      gameStore.input.keys.a ? 'status-active' : 'status-inactive'
    );
    
    this.updateElement('key-s', 
      gameStore.input.keys.s ? 'Pressed' : 'Released',
      gameStore.input.keys.s ? 'status-active' : 'status-inactive'
    );
    
    this.updateElement('key-d', 
      gameStore.input.keys.d ? 'Pressed' : 'Released',
      gameStore.input.keys.d ? 'status-active' : 'status-inactive'
    );
    
    this.updateElement('key-space', 
      gameStore.input.keys.space ? 'Pressed' : 'Released',
      gameStore.input.keys.space ? 'status-active' : 'status-inactive'
    );
  }
  
  private updateElement(id: string, value: string, cssClass: string): void {
    const element = this.elements.get(id);
    if (element) {
      // Clear existing status classes
      element.className = element.className
        .split(' ')
        .filter(cls => !cls.startsWith('status-') && !cls.startsWith('text-'))
        .join(' ');
      
      // Add base classes back and new status class
      element.className += ` font-bold font-mono ${cssClass}`;
      element.textContent = value;
      
      // Add a subtle animation on update
      element.classList.add('value-updated');
      setTimeout(() => {
        element.classList.remove('value-updated');
      }, 300);
    }
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