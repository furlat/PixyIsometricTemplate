import { Container } from 'pixi.js'
import { InfiniteCanvas } from './InfiniteCanvas'
import { BackgroundGridRenderer } from './BackgroundGridRenderer'
import { GeometryRenderer } from './GeometryRenderer'
import { SelectionHighlightRenderer } from './SelectionHighlightRenderer'
import { MouseHighlightRenderer } from './MouseHighlightRenderer'
import { TextureRegistry } from './TextureRegistry'
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
  private selectionLayer: Container  // NEW: Separate layer for selection highlighting
  private raycastLayer: Container
  private uiOverlayLayer: Container
  private mouseLayer: Container  // NEW: Separate layer for mouse visualization

  // Background grid renderer using extracted logic
  private backgroundGridRenderer: BackgroundGridRenderer
  
  // Geometry renderer for user-drawn shapes
  private geometryRenderer: GeometryRenderer
  
  // Selection highlight renderer for reactive selection visualization
  private selectionHighlightRenderer: SelectionHighlightRenderer
  
  // Mouse visualization renderer (lightweight, updates every frame)
  private mouseHighlightRenderer: MouseHighlightRenderer
  
  // Texture registry for StoreExplorer previews (SAFE - no store subscriptions)
  private textureRegistry: TextureRegistry | null = null
  
  // Track which objects need texture capture (performance optimization)
  private objectsNeedingTexture: Set<string> = new Set()
  
  // Dirty tracking with smarter camera handling
  private backgroundDirty = true
  private geometryDirty = true
  private lastPixeloidScale = 0
  private renderBufferPadding = 200 // Large buffer to avoid re-renders on movement
  private isBackgroundRendering = false

  constructor(private app?: any) {
    super()

    // TextureRegistry will be initialized lazily when first needed
    this.textureRegistry = null

    // Create layer containers as Render Groups for better performance
    this.backgroundLayer = new Container({ isRenderGroup: true })
    this.geometryLayer = new Container({ isRenderGroup: true })
    this.selectionLayer = new Container({ isRenderGroup: true }) // Selection layer on top of geometry
    this.raycastLayer = new Container({ isRenderGroup: true })
    this.uiOverlayLayer = new Container({ isRenderGroup: true })
    this.mouseLayer = new Container({ isRenderGroup: true }) // Mouse layer on top

    // Initialize background grid renderer
    this.backgroundGridRenderer = new BackgroundGridRenderer()

    // Initialize geometry renderer
    this.geometryRenderer = new GeometryRenderer()
    
    // Initialize selection highlight renderer (reactive)
    this.selectionHighlightRenderer = new SelectionHighlightRenderer()
    
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
    this.cameraTransform.addChild(this.selectionLayer)     // Selection highlights on top of geometry
    this.cameraTransform.addChild(this.raycastLayer)       // Raycast lines and debug visuals
    this.cameraTransform.addChild(this.uiOverlayLayer)     // UI elements that follow camera
    
    // Selection layer gets the selection highlight renderer graphics
    this.selectionLayer.addChild(this.selectionHighlightRenderer.getGraphics())
    
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
    
    // Render selection highlights (reactive, always updates based on store state)
    this.renderSelectionLayer(paddedCorners, pixeloidScale)
    
    // Render UI overlay layer
    this.renderUIOverlayLayer(paddedCorners, pixeloidScale)
    
    // Update tracking variables
    this.lastPixeloidScale = pixeloidScale
    
    // Update mouse visualization (only when background is not rendering and mouse layer is visible)
    if (!this.isBackgroundRendering) {
      this.renderMouseLayer()
    }

    // TODO: Render raycast layer
    // This will be implemented in subsequent steps
  }
  
  /**
   * Render background layer only when needed and if grid is visible
   */
  private renderBackgroundLayer(corners: ViewportCorners, pixeloidScale: number): void {
    // Clear background layer first
    this.backgroundLayer.removeChildren()
    
    // Only render grid if background layer is visible
    if (gameStore.geometry.layerVisibility.background) {
      this.backgroundGridRenderer.render(corners, pixeloidScale)
      this.backgroundLayer.addChild(this.backgroundGridRenderer.getGraphics())
    }
  }
  
  /**
   * Render geometry layer only when needed
   */
  private renderGeometryLayer(corners: ViewportCorners, pixeloidScale: number): void {
    if (gameStore.geometry.layerVisibility.geometry) {
      this.geometryRenderer.render(corners, pixeloidScale)
      
      // CRITICAL: Always add the full renderer container (includes preview graphics)
      this.geometryLayer.removeChildren()
      this.geometryLayer.addChild(this.geometryRenderer.getGraphics())
      
      // IMPROVED: Capture textures synchronously after render is complete
      if (this.objectsNeedingTexture.size > 0) {
        // Use requestAnimationFrame to ensure render is complete before capture
        requestAnimationFrame(() => {
          this.captureSpecificObjectTexturesSync()
        })
      }
    } else {
      // Clear layer if not visible
      this.geometryLayer.removeChildren()
    }
  }
  
  /**
   * Render selection layer - only if selection layer is visible
   */
  private renderSelectionLayer(corners: ViewportCorners, pixeloidScale: number): void {
    if (gameStore.geometry.layerVisibility.selection) {
      // Selection highlighting is rendered reactively based on current store state
      this.selectionHighlightRenderer.render(corners, pixeloidScale)
      this.selectionLayer.visible = true
    } else {
      // Hide selection layer if not visible
      this.selectionLayer.visible = false
    }
  }
  
  /**
   * Render UI overlay layer - controls visibility of UI elements
   */
  private renderUIOverlayLayer(_corners: ViewportCorners, _pixeloidScale: number): void {
    if (gameStore.geometry.layerVisibility.uiOverlay) {
      this.uiOverlayLayer.visible = true
      // UI overlay elements would be rendered here if any exist
    } else {
      this.uiOverlayLayer.visible = false
    }
  }
  
  /**
   * Render mouse layer - controls mouse visualization
   */
  private renderMouseLayer(): void {
    if (gameStore.geometry.layerVisibility.mouse) {
      this.mouseHighlightRenderer.render()
      this.mouseLayer.visible = true
    } else {
      this.mouseLayer.visible = false
    }
  }
  
  /**
   * Subscribe to store changes to mark layers as dirty when data changes
   */
  private subscribeToStoreChanges(): void {
    // Subscribe to geometry objects specifically to track new/modified objects
    subscribe(gameStore.geometry.objects, () => {
      this.geometryDirty = true
      this.markNewObjectsForTextureCapture()
    })

    // Subscribe to activeDrawing changes for preview rendering during drag-and-drop
    subscribe(gameStore.geometry.drawing.activeDrawing, () => {
      this.geometryDirty = true
    })

    // Subscribe to layer visibility changes to trigger re-rendering
    subscribe(gameStore.geometry.layerVisibility, () => {
      this.backgroundDirty = true
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
   * Mark new objects for texture capture (called when store objects change)
   */
  private markNewObjectsForTextureCapture(): void {
    const currentObjects = gameStore.geometry.objects
    
    // Find new objects that don't have textures yet
    for (const obj of currentObjects) {
      if (!gameStore.textureRegistry.objectTextures[obj.id]) {
        this.objectsNeedingTexture.add(obj.id)
      }
    }
  }

  /**
   * Capture textures only for specific objects that need it (performance optimized)
   */
  

  /**
   * Synchronous texture capture after render completion (improved timing)
   */
  private captureSpecificObjectTexturesSync(): void {
    // Initialize texture registry lazily when first needed
    if (!this.textureRegistry && this.app) {
      this.textureRegistry = new TextureRegistry()
    }
    
    if (!this.textureRegistry) {
      console.warn('LayeredInfiniteCanvas: Cannot capture textures - no app instance provided')
      return
    }

    try {
      console.log(`LayeredInfiniteCanvas: Starting sync texture capture for ${this.objectsNeedingTexture.size} objects`)
      
      // Get all rendered object graphics from GeometryRenderer
      const objectContainers = this.geometryRenderer.getObjectContainers()
      
      // Capture textures individually for better error handling
      for (const objectId of this.objectsNeedingTexture) {
        const graphics = objectContainers.get(objectId)
        if (graphics) {
          // Capture immediately - the improved TextureRegistry handles async internally
          this.textureRegistry.captureObjectTexture(objectId)
        } else {
          console.warn(`LayeredInfiniteCanvas: No graphics found for object ${objectId}`)
        }
      }
      
      // Clear the list of objects needing texture capture
      this.objectsNeedingTexture.clear()
      
    } catch (error) {
      console.error('LayeredInfiniteCanvas: Failed to capture specific object textures sync:', error)
    }
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
   * Get the selection layer container for adding selection highlights
   */
  public getSelectionLayer(): Container {
    return this.selectionLayer
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
    this.selectionHighlightRenderer.destroy()

    // Destroy layer containers
    this.backgroundLayer.destroy()
    this.geometryLayer.destroy()
    this.selectionLayer.destroy()
    this.raycastLayer.destroy()
    this.uiOverlayLayer.destroy()

    // Call parent destroy
    super.destroy()
  }
}