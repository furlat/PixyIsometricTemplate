import { Container, Graphics } from 'pixi.js'
import { InfiniteCanvas } from './InfiniteCanvas'
import { BackgroundGridRenderer } from './BackgroundGridRenderer'
import { GeometryRenderer } from './GeometryRenderer'
import { MouseHighlightRenderer } from './MouseHighlightRenderer'
import { gameStore } from '../store/gameStore'
import { subscribe } from 'valtio'
import type { ViewportCorners } from '../types'

/**
 * LayeredInfiniteCanvas extends the existing InfiniteCanvas with a multi-layer architecture.
 * Uses PixiJS Container objects to implement proper layer separation for:
 * - Background grid layer
 * - Geometry drawing layer  
 * - Raycast visualization layer
 * - UI overlay elements
 */
export class LayeredInfiniteCanvas extends InfiniteCanvas {
  // Layer containers for multi-layer rendering (now using Render Groups)
  private backgroundLayer: Container
  private geometryLayer: Container
  private raycastLayer: Container
  private uiOverlayLayer: Container
  private mouseLayer: Container  // NEW: Separate layer for mouse visualization

  // Background grid renderer using extracted logic
  private backgroundGridRenderer: BackgroundGridRenderer
  
  // Geometry renderer for user-drawn shapes
  private geometryRenderer: GeometryRenderer
  
  // Mouse visualization renderer (lightweight, updates every frame)
  private mouseHighlightRenderer: MouseHighlightRenderer
  
  // Dirty tracking with smarter camera handling
  private backgroundDirty = true
  private geometryDirty = true
  private lastPixeloidScale = 0
  private renderBufferPadding = 200 // Large buffer to avoid re-renders on movement
  private isBackgroundRendering = false

  constructor() {
    super()

    // Create layer containers as Render Groups for better performance
    this.backgroundLayer = new Container({ isRenderGroup: true })
    this.geometryLayer = new Container({ isRenderGroup: true })
    this.raycastLayer = new Container({ isRenderGroup: true })
    this.uiOverlayLayer = new Container({ isRenderGroup: true })
    this.mouseLayer = new Container({ isRenderGroup: true }) // Mouse layer on top

    // Initialize background grid renderer
    this.backgroundGridRenderer = new BackgroundGridRenderer()

    // Initialize geometry renderer
    this.geometryRenderer = new GeometryRenderer()
    
    // Initialize mouse highlight renderer (lightweight)
    this.mouseHighlightRenderer = new MouseHighlightRenderer()

    // Setup layer hierarchy within the existing camera transform
    // This maintains all existing InfiniteCanvas functionality
    this.setupLayers()
    
    // Subscribe to store changes to mark layers as dirty
    this.subscribeToStoreChanges()
  }

  /**
   * Setup the multi-layer hierarchy within the existing camera transform container
   */
  private setupLayers(): void {
    // Clear existing grid graphics from camera transform (it will be managed by backgroundLayer)
    if (this.gridGraphics.parent) {
      this.gridGraphics.parent.removeChild(this.gridGraphics)
    }

    // Add layers to camera transform in correct order (back to front)
    this.cameraTransform.addChild(this.backgroundLayer)    // Grid and background elements
    this.cameraTransform.addChild(this.geometryLayer)      // Geometric shapes and objects
    this.cameraTransform.addChild(this.raycastLayer)       // Raycast lines and debug visuals
    this.cameraTransform.addChild(this.uiOverlayLayer)     // UI elements that follow camera
    
    // Mouse layer goes into camera transform so it scales and positions with the grid
    // This ensures perfect alignment with pixeloids
    this.mouseLayer.addChild(this.mouseHighlightRenderer.getGraphics())
    this.cameraTransform.addChild(this.mouseLayer)
  }

  /**
   * Override the parent render method to use optimized layered rendering with Render Groups
   */
  public render(): void {
    // Call parent render to handle camera transforms and viewport updates
    super.render()

    // Calculate viewport corners for layer rendering
    const corners = this.calculateViewportCorners()
    const pixeloidScale = this.localPixeloidScale
    
    // Use much larger viewport with padding to avoid constant re-renders during navigation
    const paddedCorners = this.calculatePaddedViewport(corners)
    
    // Check if background needs re-rendering (only on zoom or major movement)
    if (this.backgroundDirty || pixeloidScale !== this.lastPixeloidScale) {
      this.isBackgroundRendering = true
      this.renderBackgroundLayer(paddedCorners, pixeloidScale)
      this.backgroundDirty = false
      this.isBackgroundRendering = false
    }

    // Check if geometry needs re-rendering (only on data changes or zoom)
    if (this.geometryDirty || pixeloidScale !== this.lastPixeloidScale) {
      this.renderGeometryLayer(paddedCorners, pixeloidScale)
      this.geometryDirty = false
    }
    
    // Update tracking variables
    this.lastPixeloidScale = pixeloidScale
    
    // Update mouse visualization (only when background is not rendering)
    if (!this.isBackgroundRendering) {
      this.mouseHighlightRenderer.render(this.localPixeloidScale)
    }

    // TODO: Render other layers (raycast, UI overlay)
    // This will be implemented in subsequent steps
  }
  
  /**
   * Render background layer only when needed
   */
  private renderBackgroundLayer(corners: ViewportCorners, pixeloidScale: number): void {
    // Render background grid using the extracted renderer
    this.backgroundGridRenderer.render(corners, pixeloidScale)
    
    // Only update if graphics changed
    this.backgroundLayer.removeChildren()
    this.backgroundLayer.addChild(this.backgroundGridRenderer.getGraphics())
  }
  
  /**
   * Render geometry layer only when needed
   */
  private renderGeometryLayer(corners: ViewportCorners, pixeloidScale: number): void {
    if (gameStore.geometry.layerVisibility.geometry) {
      this.geometryRenderer.render(corners, pixeloidScale)
      
      // Only update if graphics changed
      this.geometryLayer.removeChildren()
      this.geometryLayer.addChild(this.geometryRenderer.getGraphics())
    } else {
      // Clear layer if not visible
      this.geometryLayer.removeChildren()
    }
  }
  
  /**
   * Subscribe to store changes to mark layers as dirty when data changes
   */
  private subscribeToStoreChanges(): void {
    // Subscribe to geometry changes using Valtio
    subscribe(gameStore.geometry, () => {
      this.geometryDirty = true
    })

    // Subscribe to camera changes for background re-rendering (less aggressive)
    subscribe(gameStore.camera, () => {
      // Only mark background dirty on significant changes (zoom, not position)
      if (gameStore.camera.pixeloidScale !== this.lastPixeloidScale) {
        this.backgroundDirty = true
      }
    })
  }

  /**
   * Calculate padded viewport to avoid constant re-renders during navigation
   */
  private calculatePaddedViewport(corners: ViewportCorners): ViewportCorners {
    return {
      topLeft: {
        x: corners.topLeft.x - this.renderBufferPadding,
        y: corners.topLeft.y - this.renderBufferPadding
      },
      topRight: {
        x: corners.topRight.x + this.renderBufferPadding,
        y: corners.topRight.y - this.renderBufferPadding
      },
      bottomLeft: {
        x: corners.bottomLeft.x - this.renderBufferPadding,
        y: corners.bottomLeft.y + this.renderBufferPadding
      },
      bottomRight: {
        x: corners.bottomRight.x + this.renderBufferPadding,
        y: corners.bottomRight.y + this.renderBufferPadding
      }
    }
  }

  /**
   * Force re-render of all layers (useful for debugging or manual refresh)
   */
  public forceRefresh(): void {
    this.backgroundDirty = true
    this.geometryDirty = true
  }

  /**
   * Override parent renderGrid to prevent double rendering
   * The grid is now handled by the backgroundGridRenderer in the render() method
   */
  protected renderGrid(): void {
    // No-op: Grid rendering is now handled by BackgroundGridRenderer in render()
  }

  /**
   * Get the background layer container for adding background elements
   */
  public getBackgroundLayer(): Container {
    return this.backgroundLayer
  }

  /**
   * Get the geometry layer container for adding geometric shapes
   */
  public getGeometryLayer(): Container {
    return this.geometryLayer
  }

  /**
   * Get the raycast layer container for adding raycast visualization
   */
  public getRaycastLayer(): Container {
    return this.raycastLayer
  }

  /**
   * Get the UI overlay layer container for adding UI elements
   */
  public getUIOverlayLayer(): Container {
    return this.uiOverlayLayer
  }


  /**
   * Override destroy to clean up layer resources
   */
  public destroy(): void {
    // Destroy renderers
    this.backgroundGridRenderer.destroy()
    this.geometryRenderer.destroy()

    // Destroy layer containers
    this.backgroundLayer.destroy()
    this.geometryLayer.destroy()
    this.raycastLayer.destroy()
    this.uiOverlayLayer.destroy()

    // Call parent destroy
    super.destroy()
  }
}