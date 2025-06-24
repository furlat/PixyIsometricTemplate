import { Container } from 'pixi.js'
import { InfiniteCanvas } from './InfiniteCanvas'
import { BackgroundGridRenderer } from './BackgroundGridRenderer'
import { GeometryRenderer } from './GeometryRenderer'
import { SelectionFilterRenderer } from './SelectionFilterRenderer'
import { PixelateFilterRenderer } from './PixelateFilterRenderer'
import { MouseHighlightShader } from './MouseHighlightShader'
import { BoundingBoxRenderer } from './BoundingBoxRenderer'
import { MirrorLayerRenderer } from './MirrorLayerRenderer'
import { TextureRegistry } from './TextureRegistry'
import { StaticMeshManager } from './StaticMeshManager'
import { gameStore, createPixeloidCoordinate } from '../store/gameStore'
import { CoordinateHelper } from './CoordinateHelper'
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
  private pixelateLayer: Container   // NEW: Separate layer for pixelate effects
  private mirrorLayer: Container     // Mirror layer for cached texture sprites
  private raycastLayer: Container
  private bboxLayer: Container      // NEW: Separate layer for bbox overlay
  private mouseLayer: Container     // NEW: Separate layer for mouse visualization

  // Background grid renderer using extracted logic
  private backgroundGridRenderer: BackgroundGridRenderer
  
  // Graphics-based geometry renderer for user-drawn shapes (simple and reliable)
  private geometryRenderer: GeometryRenderer
  
  // Selection filter renderer for GPU-accelerated selection highlighting
  private selectionFilterRenderer: SelectionFilterRenderer
  
  // Pixelate filter renderer for GPU-accelerated pixeloid-perfect effects
  private pixelateFilterRenderer: PixelateFilterRenderer
  
  // Mouse visualization renderer (lightweight, updates every frame)
  private mouseHighlightShader: MouseHighlightShader
  
  
  // Simple bounding box renderer for comparison
  private boundingBoxRenderer: BoundingBoxRenderer
  
  // Mirror layer renderer for cached texture sprites
  private mirrorLayerRenderer: MirrorLayerRenderer
  
  // Texture registry for StoreExplorer previews (SAFE - no store subscriptions)
  private textureRegistry: TextureRegistry | null = null
  
  // Static mesh manager for transform coherence
  private staticMeshManager: StaticMeshManager
  
  // Track which objects need texture capture (performance optimization)
  private objectsNeedingTexture: Set<string> = new Set()
  
  // Dirty tracking with smarter camera handling (background only)
  private backgroundDirty = true
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
    this.pixelateLayer = new Container({ isRenderGroup: true })  // Pixelate layer for GPU-accelerated effects
    this.mirrorLayer = new Container({ isRenderGroup: true })    // Mirror layer for cached texture sprites
    this.raycastLayer = new Container({ isRenderGroup: true })
    this.bboxLayer = new Container({ isRenderGroup: true })     // Bbox layer for comparison overlay
    this.mouseLayer = new Container({ isRenderGroup: true })    // Mouse layer on top

    // Initialize background grid renderer
    this.backgroundGridRenderer = new BackgroundGridRenderer()

    // Initialize graphics-based geometry renderer
    this.geometryRenderer = new GeometryRenderer()
    
    // Initialize selection filter renderer (GPU-accelerated)
    this.selectionFilterRenderer = new SelectionFilterRenderer()
    
    // Initialize pixelate filter renderer (will be initialized after app.init())
    this.pixelateFilterRenderer = new PixelateFilterRenderer()
    
    // Initialize mouse highlight renderer (lightweight)
    this.mouseHighlightShader = new MouseHighlightShader()
    
    // Initialize simple bounding box renderer for comparison
    this.boundingBoxRenderer = new BoundingBoxRenderer()

    // Initialize mirror layer renderer
    this.mirrorLayerRenderer = new MirrorLayerRenderer()

    // Initialize static mesh manager for transform coherence
    this.staticMeshManager = new StaticMeshManager()

    // Setup layer hierarchy within the existing camera transform
    // This maintains all existing InfiniteCanvas functionality
    this.setupLayers()
    
    // Subscribe to store changes to mark layers as dirty
    this.subscribeToStoreChanges()
    
    // Initialize static mesh system with current pixeloid scale
    this.initializeStaticMeshSystem()
  }

  /**
   * Setup the multi-layer hierarchy within the existing camera transform container
   */
  private setupLayers(): void {
    // Clear existing grid graphics from camera transform (it will be managed by backgroundLayer)
    if (this.gridGraphics.parent) {
      this.gridGraphics.parent.removeChild(this.gridGraphics)
    }

    // Only background layer goes under camera transform (needs scaling)
    this.cameraTransform.addChild(this.backgroundLayer)    // Grid and background elements
    
    // All other layers go directly to container (no scaling - they draw at screen coordinates)
    const mainContainer = this.getContainer()
    mainContainer.addChild(this.geometryLayer)            // Geometric shapes at screen coords
    mainContainer.addChild(this.selectionLayer)           // Selection highlights at screen coords
    mainContainer.addChild(this.pixelateLayer)            // Pixelate effects at screen coords
    mainContainer.addChild(this.mirrorLayer)              // Mirror layer at screen coords
    mainContainer.addChild(this.raycastLayer)             // Raycast lines at screen coords
    mainContainer.addChild(this.bboxLayer)                // Bbox layer at screen coords
    
    // Selection layer gets the selection filter renderer container
    this.selectionLayer.addChild(this.selectionFilterRenderer.getContainer())
    
    // Pixelate layer gets the pixelate filter renderer container
    this.pixelateLayer.addChild(this.pixelateFilterRenderer.getContainer())
    
    
    // Bbox layer gets the simple bounding box renderer
    this.bboxLayer.addChild(this.boundingBoxRenderer.getGraphics())
    
    // Mouse layer goes into camera transform so it scales and positions with the grid
    // This ensures perfect alignment with pixeloids
    this.mouseLayer.addChild(this.mouseHighlightShader.getGraphics())
    this.cameraTransform.addChild(this.mouseLayer)
  }

  /**
   * Initialize the static mesh system with current camera state
   */
  private initializeStaticMeshSystem(): void {
    const initialPixeloidScale = this.localPixeloidScale || gameStore.camera.pixeloid_scale
    this.staticMeshManager.initialize(initialPixeloidScale)
    
    console.log(`LayeredInfiniteCanvas: Initialized static mesh system with scale ${initialPixeloidScale}`)
  }

  /**
   * Initialize renderers that require the PIXI renderer (call after app.init())
   */
  public initializeRenderers(): void {
    if (this.app?.renderer) {
      // Initialize MirrorLayerRenderer with the PixiJS renderer for texture extraction
      this.mirrorLayerRenderer.initializeWithRenderer(this.app.renderer)
      console.log('LayeredInfiniteCanvas: Initialized pixelate and mirror layer renderers with dependencies')
    } else {
      console.warn('LayeredInfiniteCanvas: App renderer not available for renderer initialization')
    }
  }

  /**
   * Override the parent render method to use optimized layered rendering with Render Groups
   */
  public render(): void {
    // Call parent render to handle camera transforms and viewport updates
    super.render()

    // Use pre-calculated viewport bounds from store (no recomputation)
    const viewportBounds = CoordinateHelper.getCurrentViewportBounds()
    const corners = {
      topLeft: viewportBounds.world.top_left,
      topRight: createPixeloidCoordinate(viewportBounds.world.bottom_right.x, viewportBounds.world.top_left.y),
      bottomLeft: createPixeloidCoordinate(viewportBounds.world.top_left.x, viewportBounds.world.bottom_right.y),
      bottomRight: viewportBounds.world.bottom_right
    }
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

    // Always render geometry every frame at 60fps (full redraw ensures old positions cleared)
    this.renderGeometryLayer(paddedCorners, pixeloidScale)
    
    // Render selection highlights (reactive, always updates based on store state)
    this.renderSelectionLayer(paddedCorners, pixeloidScale)
    
    // Render pixelate effects (independent, GPU-accelerated)
    this.renderPixelateLayer(paddedCorners, pixeloidScale)
    
    // Render mirror layer (cached texture sprites)
    this.renderMirrorLayer(paddedCorners, pixeloidScale)
    
    // Render bbox layer (comparison overlay)
    this.renderBboxLayer(paddedCorners, pixeloidScale)
    
    // Render UI overlay layer
    this.renderUIOverlayLayer(paddedCorners, pixeloidScale)
    
    // Handle static mesh zoom changes with smart caching
    if (pixeloidScale !== this.lastPixeloidScale) {
      this.staticMeshManager.handleScaleChange(pixeloidScale)
    }
    
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
      const mesh = this.backgroundGridRenderer.getMesh()
      if (mesh) {
        this.backgroundLayer.addChild(mesh)
      }
    }
  }
  
  /**
   * Render geometry layer with store-driven offset positioning
   * ALWAYS renders to maintain object containers for mirror layer
   */
  private renderGeometryLayer(corners: ViewportCorners, pixeloidScale: number): void {
    // ALWAYS render to maintain object containers (required for mirror layer)
    this.geometryRenderer.render(corners, pixeloidScale)
    
    // Clear and re-add to ensure fresh state
    this.geometryLayer.removeChildren()
    this.geometryLayer.addChild(this.geometryRenderer.getContainer())
    
    // Control visibility instead of conditional rendering
    this.geometryLayer.visible = gameStore.geometry.layerVisibility.geometry
    
    // ✅ NO LAYER POSITIONING: Keep layer at (0,0) and let GeometryRenderer handle coordinates
    this.geometryLayer.position.set(0, 0)
    
    // IMPROVED: Capture textures synchronously after render is complete
    if (this.objectsNeedingTexture.size > 0) {
      // Use requestAnimationFrame to ensure render is complete before capture
      requestAnimationFrame(() => {
        this.captureSpecificObjectTexturesSync()
      })
    }
  }
  
  /**
   * Render selection layer - RE-ENABLED: Using working SelectionHighlightRenderer
   */
  private renderSelectionLayer(corners: ViewportCorners, pixeloidScale: number): void {
    if (gameStore.geometry.layerVisibility.selection) {
      this.selectionFilterRenderer.render(corners, pixeloidScale)
      this.selectionLayer.visible = true
    } else {
      this.selectionLayer.visible = false
    }
  }
  
  /**
   * Render pixelate layer - GPU-accelerated pixeloid-perfect effects (independent from selection)
   */
  private renderPixelateLayer(corners: ViewportCorners, pixeloidScale: number): void {
    if (gameStore.geometry.filterEffects.pixelate) {
      // Pass the mirror renderer to get access to cached textures
      this.pixelateFilterRenderer.render(corners, pixeloidScale, this.mirrorLayerRenderer)
      this.pixelateLayer.visible = true
    } else {
      this.pixelateLayer.visible = false
    }
  }

  /**
   * Render mirror layer - cached texture sprites that mirror the geometry layer
   * ALWAYS renders to maintain texture cache for filter layers
   */
  private renderMirrorLayer(corners: ViewportCorners, pixeloidScale: number): void {
    // ALWAYS render to maintain texture cache (required for pixelate and other filters)
    this.mirrorLayerRenderer.render(
      corners,
      pixeloidScale,
      this.geometryRenderer
    )
    
    // Always update the container content
    this.mirrorLayer.removeChildren()
    this.mirrorLayer.addChild(this.mirrorLayerRenderer.getContainer())
    
    // Control visibility separately (allows filters to work even when mirror is hidden)
    this.mirrorLayer.visible = gameStore.geometry.layerVisibility.mirror
    
    if (gameStore.geometry.layerVisibility.mirror) {
      console.log('🎯 LayeredInfiniteCanvas: Rendered mirror layer with cached texture sprites')
    }
  }
  
  /**
   * Render bbox layer - separate from mask layer for independent control with proper coordinate system
   */
  private renderBboxLayer(corners: ViewportCorners, pixeloidScale: number): void {
    if (gameStore.geometry.layerVisibility.bbox) {
      this.boundingBoxRenderer.render(corners, pixeloidScale)
      
      // Position bbox layer at (0,0) like geometry layer (no transform offset)
      // This ensures bbox uses same coordinate system as GeometryRenderer
      this.bboxLayer.position.set(0, 0)
      this.bboxLayer.visible = true
    } else {
      this.bboxLayer.visible = false
    }
  }
  
  /**
   * Render UI overlay layer - controls visibility of UI elements
   */
  private renderUIOverlayLayer(_corners: ViewportCorners, _pixeloidScale: number): void {
    // UI overlay layer is no longer used - removed in favor of mask layer
    // Method kept for backwards compatibility
  }
  
  /**
   * Render mouse layer - controls mouse visualization
   */
  private renderMouseLayer(): void {
    if (gameStore.geometry.layerVisibility.mouse) {
      this.mouseHighlightShader.render()
      this.mouseLayer.visible = true
    } else {
      this.mouseLayer.visible = false
    }
  }
  
  /**
   * Subscribe to store changes for side effects (no geometry dirty flags - renders every frame)
   */
  private subscribeToStoreChanges(): void {
    // Subscribe to geometry objects for texture capture side effects only
    subscribe(gameStore.geometry.objects, () => {
      this.markNewObjectsForTextureCapture()
    })

    // Subscribe to layer visibility changes for background re-rendering
    subscribe(gameStore.geometry.layerVisibility, () => {
      this.backgroundDirty = true
    })

    // Subscribe to camera changes for background re-rendering (less aggressive)
    subscribe(gameStore.camera, () => {
      // Only mark background dirty on significant changes (zoom, not position)
      if (gameStore.camera.pixeloid_scale !== this.lastPixeloidScale) {
        this.backgroundDirty = true
        this.lastPixeloidScale = gameStore.camera.pixeloid_scale
      }
    })

    // No offset subscription needed - geometry renders every frame and reads current offset
    // No activeDrawing subscription needed - geometry renders every frame and reads current drawing state
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
      
      // Get all rendered object containers from MeshGeometryRenderer
      const objectContainers = this.geometryRenderer.getObjectContainers()
      
      // Capture textures individually for better error handling
      for (const objectId of this.objectsNeedingTexture) {
        const container = objectContainers.get(objectId)
        if (container) {
          // Capture immediately - the improved TextureRegistry handles async internally
          this.textureRegistry.captureObjectTexture(objectId)
        } else {
          console.warn(`LayeredInfiniteCanvas: No container found for object ${objectId}`)
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
      topLeft: createPixeloidCoordinate(
        corners.topLeft.x - this.renderBufferPadding,
        corners.topLeft.y - this.renderBufferPadding
      ),
      topRight: createPixeloidCoordinate(
        corners.topRight.x + this.renderBufferPadding,
        corners.topRight.y - this.renderBufferPadding
      ),
      bottomLeft: createPixeloidCoordinate(
        corners.bottomLeft.x - this.renderBufferPadding,
        corners.bottomLeft.y + this.renderBufferPadding
      ),
      bottomRight: createPixeloidCoordinate(
        corners.bottomRight.x + this.renderBufferPadding,
        corners.bottomRight.y + this.renderBufferPadding
      )
    }
  }

  /**
   * Force re-render of all layers (useful for debugging or manual refresh)
   */
  public forceRefresh(): void {
    this.backgroundDirty = true
    // No geometryDirty needed - geometry renders every frame
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
   * Get the bbox layer container for adding bbox elements
   */
  public getBboxLayer(): Container {
    return this.bboxLayer
  }

  /**
   * Override destroy to clean up layer resources
   */
  public destroy(): void {
    // Destroy static mesh manager
    this.staticMeshManager.clearCache()
    
    // Destroy renderers
    this.backgroundGridRenderer.destroy()
    this.geometryRenderer.destroy()
    this.selectionFilterRenderer.destroy()
    this.pixelateFilterRenderer.destroy()
    this.mirrorLayerRenderer.destroy()
    this.boundingBoxRenderer.destroy()

    // Destroy layer containers
    this.backgroundLayer.destroy()
    this.geometryLayer.destroy()
    this.selectionLayer.destroy()
    this.pixelateLayer.destroy()
    this.mirrorLayer.destroy()
    this.raycastLayer.destroy()
    this.bboxLayer.destroy()

    // Call parent destroy
    super.destroy()
  }

  /**
   * Get bbox data for external access (filters, shaders, analysis)
   * Provides object bounds data while maintaining filter isolation
   */
  public getBboxData(): Map<string, { bounds: any, visible: boolean }> {
    const bboxData = new Map()
    
    if (gameStore.geometry.layerVisibility.bbox) {
      const enabledObjects = gameStore.geometry.objects.filter(obj =>
        obj.isVisible &&
        obj.metadata
      )
      
      for (const obj of enabledObjects) {
        bboxData.set(obj.id, {
          bounds: obj.metadata.bounds,
          visible: true
        })
      }
    }
    
    return bboxData
  }

  /**
   * Get the static mesh manager for external access
   */
  public getStaticMeshManager(): StaticMeshManager {
    return this.staticMeshManager
  }
}