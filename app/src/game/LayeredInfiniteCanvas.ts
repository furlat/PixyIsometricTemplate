import { Container } from 'pixi.js'
import { InfiniteCanvas } from './InfiniteCanvas'
import { BackgroundGridRenderer } from './BackgroundGridRenderer'

/**
 * LayeredInfiniteCanvas extends the existing InfiniteCanvas with a multi-layer architecture.
 * Uses PixiJS Container objects to implement proper layer separation for:
 * - Background grid layer
 * - Geometry drawing layer  
 * - Raycast visualization layer
 * - UI overlay elements
 */
export class LayeredInfiniteCanvas extends InfiniteCanvas {
  // Layer containers for multi-layer rendering
  private backgroundLayer: Container
  private geometryLayer: Container
  private raycastLayer: Container
  private uiOverlayLayer: Container

  // Background grid renderer using extracted logic
  private backgroundGridRenderer: BackgroundGridRenderer

  constructor() {
    super()

    // Create layer containers
    this.backgroundLayer = new Container()
    this.geometryLayer = new Container()
    this.raycastLayer = new Container()
    this.uiOverlayLayer = new Container()

    // Initialize background grid renderer
    this.backgroundGridRenderer = new BackgroundGridRenderer()

    // Setup layer hierarchy within the existing camera transform
    // This maintains all existing InfiniteCanvas functionality
    this.setupLayers()
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
  }

  /**
   * Override the parent render method to use layered rendering
   */
  public render(): void {
    // Call parent render to handle camera transforms and viewport updates
    super.render()

    // Calculate viewport corners for layer rendering
    const corners = this.calculateViewportCorners()
    const pixeloidScale = this.localPixeloidScale

    // Render background grid using the extracted renderer
    this.backgroundGridRenderer.render(corners, pixeloidScale)
    
    // Clear and re-add grid graphics to background layer
    this.backgroundLayer.removeChildren()
    this.backgroundLayer.addChild(this.backgroundGridRenderer.getGraphics())

    // TODO: Render other layers (geometry, raycast, UI overlay)
    // This will be implemented in subsequent steps
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
    // Destroy background grid renderer
    this.backgroundGridRenderer.destroy()

    // Destroy layer containers
    this.backgroundLayer.destroy()
    this.geometryLayer.destroy()
    this.raycastLayer.destroy()
    this.uiOverlayLayer.destroy()

    // Call parent destroy
    super.destroy()
  }
}