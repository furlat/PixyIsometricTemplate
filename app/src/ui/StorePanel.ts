import { subscribe } from 'valtio';
import { gameStore, updateGameStore } from '../store/gameStore';
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
      'mouse-vertex-position',
      'mouse-pixeloid-position',
      'key-w',
      'key-a',
      'key-s',
      'key-d',
      'key-space',
      // Static Mesh Debug elements
      'static-mesh-level',
      'static-mesh-ready',
      'coordinate-mapping-ready',
      'mesh-cache-size',
      'viewport-corners-pixel',
      'viewport-corners-pixeloids',
      'viewport-corners-vertices',
      'viewport-offset',
      'current-resolution',
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
    
    // Simple Coordinate System - Show actual camera world position
    updateElement(this.elements, 'camera-position',
      formatCoordinates(gameStore.camera.world_position.x, gameStore.camera.world_position.y),
      STATUS_COLORS.camera
    );
    
    updateElement(this.elements, 'pixeloid-scale',
      gameStore.camera.pixeloid_scale.toString(),
      'text-primary'
    );
    
    updateElement(this.elements, 'top-left-corner',
      'N/A (simple system)',
      'text-gray-400'
    );
    
    updateElement(this.elements, 'bottom-right-corner',
      'N/A (simple system)',
      'text-gray-400'
    );
    
    // Window & Mouse
    updateElement(this.elements, 'window-size', 
      formatWindowSize(gameStore.windowWidth, gameStore.windowHeight),
      'text-info'
    );
    
    updateElement(this.elements, 'mouse-position',
      formatCoordinates(gameStore.mouse.screen_position.x, gameStore.mouse.screen_position.y, 0),
      STATUS_COLORS.mouse
    );
    
    updateElement(this.elements, 'mouse-vertex-position',
      formatCoordinates(gameStore.mouse.vertex_position.x, gameStore.mouse.vertex_position.y, 0),
      'text-purple-400'
    );
    
    updateElement(this.elements, 'mouse-pixeloid-position',
      formatCoordinates(gameStore.mouse.pixeloid_position.x, gameStore.mouse.pixeloid_position.y, 2),
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

    // Static Mesh Debug Information
    updateElement(this.elements, 'static-mesh-level',
      gameStore.staticMesh.stats.activeMeshLevel.toString(),
      'text-purple-400'
    );

    updateElement(this.elements, 'static-mesh-ready',
      getBooleanStatusText(gameStore.staticMesh.activeMesh !== null),
      getBooleanStatusClass(gameStore.staticMesh.activeMesh !== null)
    );

    updateElement(this.elements, 'coordinate-mapping-ready',
      getBooleanStatusText(gameStore.staticMesh.coordinateMappings.size > 0),
      getBooleanStatusClass(gameStore.staticMesh.coordinateMappings.size > 0)
    );

    updateElement(this.elements, 'mesh-cache-size',
      `Meshes:${gameStore.staticMesh.stats.totalCachedMeshes} Mappings:${gameStore.staticMesh.stats.totalCachedMappings}`,
      'text-info'
    );

    // Viewport corners in pixel coordinates (should be constant unless window resizes)
    updateElement(this.elements, 'viewport-corners-pixel',
      `TL:(0,0) BR:(${gameStore.windowWidth},${gameStore.windowHeight})`,
      'text-cyan-400'
    );

    // Viewport corners in pixeloid coordinates (simple system - no corners)
    updateElement(this.elements, 'viewport-corners-pixeloids',
      'N/A (simple offset system)',
      'text-gray-400'
    );

    // Viewport corners in vertex coordinates (from stored vertexBounds)
    // Get current coordinate mapping for the active pixeloid scale
    const coordinateMapping = updateGameStore.getCurrentCoordinateMapping();
    const currentScale = gameStore.camera.pixeloid_scale;
    
    if (coordinateMapping) {
      const { currentResolution, vertexBounds, viewportOffset } = coordinateMapping;
      
      // ✅ Calculate screen mesh dimensions once for reuse
      const scale = gameStore.camera.pixeloid_scale;
      const screenVertexWidth = Math.ceil(gameStore.windowWidth / scale);
      const screenVertexHeight = Math.ceil(gameStore.windowHeight / scale);
      
      // ✅ FIXED: Show actual screen mesh bounds (what we render)
      updateElement(this.elements, 'viewport-corners-vertices',
        `TL:(0,0) BR:(${screenVertexWidth},${screenVertexHeight}) [Screen Mesh]`,
        'text-green-400'
      );

      // ✅ FIXED: Always show real offset from store (not from coordinateMapping)
      const actualOffset = gameStore.mesh.vertex_to_pixeloid_offset;
      updateElement(this.elements, 'viewport-offset',
        `Vertex→Pixeloid Offset:(${actualOffset.x.toFixed(2)},${actualOffset.y.toFixed(2)})`,
        'text-purple-400'
      );

      // ✅ FIXED: Show both screen mesh and static mesh info for clear distinction
      updateElement(this.elements, 'current-resolution',
        `Screen: ${screenVertexWidth}x${screenVertexHeight} | Static: ${currentResolution.meshBounds.vertexWidth}x${currentResolution.meshBounds.vertexHeight} | Scale:${currentScale}`,
        'text-yellow-400'
      );
    } else {
      // ✅ FIXED: Show real data even when mapping is missing
      const totalMappings = gameStore.staticMesh.coordinateMappings.size;
      const actualOffset = gameStore.mesh.vertex_to_pixeloid_offset;
      
      // Calculate screen mesh dimensions even without coordinate mapping
      const scale = gameStore.camera.pixeloid_scale;
      const screenVertexWidth = Math.ceil(gameStore.windowWidth / scale);
      const screenVertexHeight = Math.ceil(gameStore.windowHeight / scale);
      
      updateElement(this.elements, 'viewport-corners-vertices',
        `TL:(0,0) BR:(${screenVertexWidth},${screenVertexHeight}) [Screen Mesh] - No static mapping`,
        'text-orange-400'
      );
      
      updateElement(this.elements, 'viewport-offset',
        `Vertex→Pixeloid Offset:(${actualOffset.x.toFixed(2)},${actualOffset.y.toFixed(2)}) - No static mapping`,
        'text-orange-400'
      );
      
      updateElement(this.elements, 'current-resolution',
        `Screen: ${screenVertexWidth}x${screenVertexHeight} | Scale:${currentScale} - No static mapping (${totalMappings} total)`,
        'text-orange-400'
      );
    }

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
      getBooleanStatusText(gameStore.geometry.layerVisibility.background),
      getBooleanStatusClass(gameStore.geometry.layerVisibility.background)
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