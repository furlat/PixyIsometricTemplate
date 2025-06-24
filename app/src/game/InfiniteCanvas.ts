import { Container, Graphics } from 'pixi.js'
import { gameStore, updateGameStore, createPixeloidCoordinate } from '../store/gameStore'
import type { PixeloidCoordinate } from '../types'
import { CoordinateHelper } from './CoordinateHelper'

export class InfiniteCanvas {
  private container: Container
  protected gridGraphics: Graphics
  protected cameraTransform: Container
  
  // Local state to avoid store loops during rendering
  protected localCameraPosition = { x: 0, y: 0 }
  protected localPixeloidScale = 10
  protected localViewportSize = { width: window.innerWidth, height: window.innerHeight }
  
  // Zoom batching to prevent rapid scroll events from causing multiple re-renders
  private zoomBatchTimeout: number | null = null
  private pendingZoomDelta: number = 0
  private readonly ZOOM_BATCH_DELAY = 50 // ms
  
  // Mouse-centered zooming
  private zoomTargetScreen: { x: number, y: number } | null = null
  
  // Zoom center locking to prevent drift during continuous scrolling
  private zoomLockTimeout: number | null = null
  private lockedZoomPixeloid: PixeloidCoordinate | null = null
  private readonly ZOOM_LOCK_RESET_DELAY = 200 // ms
  
  // ✅ REMOVED: Movement state tracking - now handled by InputManager

  constructor() {
    this.container = new Container()
    this.cameraTransform = new Container()
    this.gridGraphics = new Graphics()
    
    // Setup hierarchy: container -> cameraTransform -> gridGraphics
    this.container.addChild(this.cameraTransform)
    this.cameraTransform.addChild(this.gridGraphics)
    
    // Initialize local state from store
    this.syncFromStore()
    
    // Set initial camera position (now defaults to (0,0) for top-left alignment)
    this.setInitialCameraPosition()
    
    // Calculate initial viewport corners to sync to store
    this.syncToStore()
  }

  /**
   * Sync local state from store (one-way: store -> local)
   * Called only when we need to read from store, not during rendering
   */
  private syncFromStore(): void {
    // Use new coordinate system
    this.localCameraPosition.x = gameStore.camera.world_position.x
    this.localCameraPosition.y = gameStore.camera.world_position.y
    this.localPixeloidScale = gameStore.camera.pixeloid_scale
    this.localViewportSize.width = gameStore.windowWidth
    this.localViewportSize.height = gameStore.windowHeight
  }

  /**
   * Directly move camera to specific position (like WASD movement)
   * This bypasses store updates to avoid re-rendering cycles
   */
  public moveCameraToPosition(pixeloidX: number, pixeloidY: number): void {
    // Directly update local camera position (same as WASD movement)
    this.localCameraPosition.x = pixeloidX
    this.localCameraPosition.y = pixeloidY
    
    // Sync to store once (same as WASD movement does)
    this.syncToStore()
    
    console.log(`InfiniteCanvas: Camera moved directly to (${pixeloidX.toFixed(1)}, ${pixeloidY.toFixed(1)})`)
  }

  /**
   * Set initial camera position - now defaults to (0,0) for clean top-left alignment
   */
  private setInitialCameraPosition(): void {
    const initialPosition = CoordinateHelper.calculateInitialCameraPosition()
    
    this.localCameraPosition.x = initialPosition.x
    this.localCameraPosition.y = initialPosition.y
    
    console.log(`Initial camera position set to (${this.localCameraPosition.x.toFixed(1)}, ${this.localCameraPosition.y.toFixed(1)}) - camera now represents top-left corner`)
  }

  /**
   * Update local state to store (one-way: local -> store)
   * Called only when local state changes, not during rendering
   */
  private syncToStore(): void {
    // Update camera position using new coordinate system
    updateGameStore.setCameraPosition(createPixeloidCoordinate(this.localCameraPosition.x, this.localCameraPosition.y))
  }

  // calculateViewportCorners method removed - use CoordinateHelper.getCurrentViewportBounds() directly

  // ✅ REMOVED: updateCamera method - input handling moved to InputManager
  // InfiniteCanvas now focuses purely on rendering, not input processing

  /**
   * Handle zoom input (mouse wheel) with batching and mouse-centered zooming
   */
  public handleZoom(deltaY: number, mouseScreenX?: number, mouseScreenY?: number): void {
    // Capture and lock pixeloid position on first event
    if (!this.lockedZoomPixeloid && mouseScreenX !== undefined && mouseScreenY !== undefined) {
      // Use the store's mouse pixeloid position - it's already correctly maintained by BackgroundGridRenderer!
      this.lockedZoomPixeloid = createPixeloidCoordinate(
        gameStore.mouse.pixeloid_position.x,
        gameStore.mouse.pixeloid_position.y
      )
      console.log(`Zoom locked to pixeloid (${this.lockedZoomPixeloid.x.toFixed(2)}, ${this.lockedZoomPixeloid.y.toFixed(2)}) from store`)
    }
    
    // Reset lock timer - release lock after no scrolling for 200ms
    if (this.zoomLockTimeout) {
      clearTimeout(this.zoomLockTimeout)
    }
    this.zoomLockTimeout = window.setTimeout(() => {
      this.lockedZoomPixeloid = null
      this.zoomLockTimeout = null
      console.log('Zoom lock released')
    }, this.ZOOM_LOCK_RESET_DELAY)
    
    // Accumulate zoom delta
    const zoomStep = deltaY > 0 ? -1 : 1
    this.pendingZoomDelta += zoomStep
    
    // Store mouse position for zoom-to-center functionality
    if (mouseScreenX !== undefined && mouseScreenY !== undefined) {
      this.zoomTargetScreen = { x: mouseScreenX, y: mouseScreenY }
    }
    
    // Clear existing timeout
    if (this.zoomBatchTimeout !== null) {
      clearTimeout(this.zoomBatchTimeout)
    }
    
    // Set new timeout to batch zoom changes
    this.zoomBatchTimeout = window.setTimeout(() => {
      this.applyBatchedZoom()
      this.zoomBatchTimeout = null
    }, this.ZOOM_BATCH_DELAY)
  }
  
  /**
   * Apply accumulated zoom changes in one batch with conditional recentering
   */
  private applyBatchedZoom(): void {
    if (this.pendingZoomDelta === 0) return
    
    // Store old scale for zoom-to-center calculation
    const oldScale = this.localPixeloidScale
    
    // Calculate new scale with accumulated delta
    const newScale = this.localPixeloidScale + this.pendingZoomDelta
    
    // Clamp zoom levels to integers between 1 and 100 (unlocked full zoom out)
    const clampedScale = Math.max(1, Math.min(100, newScale))
    
    // Check if zoom is allowed based on scale tracking
    const zoomCheck = updateGameStore.canZoomToScale(clampedScale)
    if (!zoomCheck.allowed) {
      console.warn(`InfiniteCanvas: ${zoomCheck.reason}`)
      // Reset zoom delta without applying
      this.pendingZoomDelta = 0
      this.zoomTargetScreen = null
      // TODO: Show dialog to user about zoom restriction
      return
    }
    
    this.localPixeloidScale = clampedScale
    
    // Reset zoom delta
    this.pendingZoomDelta = 0
    
    // ✅ UPDATE SCALE IN STORE FIRST (before offset calculation)
    updateGameStore.setPixeloidScale(this.localPixeloidScale)
    
    // ✅ THEN apply mouse-centered zoom (which needs the new scale in store)
    // Apply for both zoom in and zoom out to keep pixeloid under mouse
    if (this.lockedZoomPixeloid && oldScale !== this.localPixeloidScale) {
      this.applyMouseCenteredZoom(oldScale, this.localPixeloidScale)
    }
    
    // Reset target screen AFTER using it
    this.zoomTargetScreen = null
    
    console.log(`InfiniteCanvas: Zoom completed - scale: ${this.localPixeloidScale} (static mesh design)`)
  }
  
  /**
   * ✅ ZOOM-TO-MOUSE: Keep the pixeloid under mouse at the same screen position
   * The pixeloid that was under the mouse before zoom stays under the mouse after zoom
   */
  private applyMouseCenteredZoom(_oldScale: number, newScale: number): void {
    if (!this.lockedZoomPixeloid || !this.zoomTargetScreen) return
    
    // The mouse screen position where we want to keep the pixeloid
    const mouseScreenX = this.zoomTargetScreen.x
    const mouseScreenY = this.zoomTargetScreen.y
    
    // Convert mouse screen position to vertex coordinates at NEW scale
    const mouseVertexX = mouseScreenX / newScale
    const mouseVertexY = mouseScreenY / newScale
    
    // Calculate the offset that keeps the locked pixeloid at the mouse position
    // offset = pixeloid - vertex (at mouse position)
    const rawTargetOffset = createPixeloidCoordinate(
      this.lockedZoomPixeloid.x - mouseVertexX,
      this.lockedZoomPixeloid.y - mouseVertexY
    )
    
    // ✅ FIX: Apply integer snapping to prevent misalignment (same as WASD movement)
    // This ensures zoom operations produce pixel-perfect coordinates like WASD movement
    const targetOffset = createPixeloidCoordinate(
      Math.round(rawTargetOffset.x),
      Math.round(rawTargetOffset.y)
    )
    
    // TODO: Future enhancement - implement full coordinate snapping consistency
    // - Create shared snapping utility in CoordinateCalculations
    // - Apply consistent rounding logic across all coordinate operations (zoom, WASD, teleport)
    // - Add coordinate validation to prevent fractional coordinates in critical paths
    
    updateGameStore.setVertexToPixeloidOffset(targetOffset)
    
    console.log(`Zoom-to-Mouse: Pixeloid (${this.lockedZoomPixeloid.x.toFixed(1)}, ${this.lockedZoomPixeloid.y.toFixed(1)}) stays at screen (${mouseScreenX}, ${mouseScreenY}) - offset snapped to integers`)
  }

  /**
   * Update viewport size when window resizes
   */
  public updateViewportSize(width: number, height: number): void {
    this.localViewportSize.width = width
    this.localViewportSize.height = height
    
    // Recalculate viewport corners
    this.syncToStore()
  }

  /**
   * Render the infinite grid pattern
   */
  public render(): void {
    // Check if viewport size changed and update if needed
    const storeWidth = gameStore.windowWidth
    const storeHeight = gameStore.windowHeight
    
    if (this.localViewportSize.width !== storeWidth || this.localViewportSize.height !== storeHeight) {
      this.localViewportSize.width = storeWidth
      this.localViewportSize.height = storeHeight
      // Recalculate viewport corners when size changes
      this.syncToStore()
    }
    
    // Update camera transform
    this.cameraTransform.scale.set(this.localPixeloidScale)
    const transformPosition = CoordinateHelper.calculateCameraTransformPosition(
      createPixeloidCoordinate(this.localCameraPosition.x, this.localCameraPosition.y),
      this.localPixeloidScale
    )
    this.cameraTransform.position.set(transformPosition.x, transformPosition.y)

    // Render grid
    this.renderGrid()
  }

  /**
   * Render the checkered grid pattern
   */
  protected renderGrid(): void {
    this.gridGraphics.clear()

    // Use pre-calculated viewport bounds from store (no recomputation)
    const viewportBounds = CoordinateHelper.getCurrentViewportBounds()
    const corners = {
      topLeft: viewportBounds.world.top_left,
      topRight: createPixeloidCoordinate(viewportBounds.world.bottom_right.x, viewportBounds.world.top_left.y),
      bottomLeft: createPixeloidCoordinate(viewportBounds.world.top_left.x, viewportBounds.world.bottom_right.y),
      bottomRight: viewportBounds.world.bottom_right
    }
    
    // Get visible grid bounds with padding
    const bounds = CoordinateHelper.calculateVisibleGridBounds(corners, 2)
    const { startX, endX, startY, endY } = bounds

    // Draw checkered pattern (mouse highlighting now handled by MouseHighlightShader)
    for (let x = startX; x < endX; x++) {
      for (let y = startY; y < endY; y++) {
        // Checkered pattern: alternate colors
        const isLight = (x + y) % 2 === 0
        const color = isLight ? 0xf0f0f0 : 0xe0e0e0
        
        // Draw pixeloid square using PixiJS v8 API
        this.gridGraphics
          .rect(x, y, 1, 1)
          .fill(color)
      }
    }

    // Draw origin marker at (0,0) using PixiJS v8 API
    this.gridGraphics
      .setStrokeStyle({ width: 2 / this.localPixeloidScale, color: 0xff0000, alpha: 1 })
      .moveTo(-0.5, 0)
      .lineTo(0.5, 0)
      .moveTo(0, -0.5)
      .lineTo(0, 0.5)
    
    // Draw grid lines for better visibility using PixiJS v8 API
    this.gridGraphics
      .setStrokeStyle({ width: 1 / this.localPixeloidScale, color: 0xcccccc, alpha: 0.5 })
    
    // Vertical lines
    for (let x = startX; x <= endX; x++) {
      this.gridGraphics.moveTo(x, startY).lineTo(x, endY)
    }
    
    // Horizontal lines
    for (let y = startY; y <= endY; y++) {
      this.gridGraphics.moveTo(startX, y).lineTo(endX, y)
    }
  }

  // Coordinate conversion methods removed - use CoordinateHelper directly

  /**
   * Get the container for adding to the stage
   */
  public getContainer(): Container {
    return this.container
  }

  /**
   * Destroy the canvas and clean up resources
   */
  public destroy(): void {
    // Clear any pending zoom batch timeout
    if (this.zoomBatchTimeout !== null) {
      clearTimeout(this.zoomBatchTimeout)
      this.zoomBatchTimeout = null
    }
    
    // Clear any pending zoom lock timeout
    if (this.zoomLockTimeout !== null) {
      clearTimeout(this.zoomLockTimeout)
      this.zoomLockTimeout = null
    }
    
    this.gridGraphics.destroy()
    this.cameraTransform.destroy()
    this.container.destroy()
  }
}