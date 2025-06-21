import { Container, Graphics, Point } from 'pixi.js'
import { gameStore, updateGameStore } from '../store/gameStore'
import type { ViewportCorners } from '../types'
import { CoordinateHelper } from './CoordinateHelper'

export class InfiniteCanvas {
  private container: Container
  protected gridGraphics: Graphics
  protected cameraTransform: Container
  
  // Local state to avoid store loops during rendering
  protected localCameraPosition = { x: 0, y: 0 }
  protected localPixeloidScale = 10
  protected localViewportSize = { width: window.innerWidth, height: window.innerHeight }
  
  // Movement speed in pixeloids per second
  private readonly CAMERA_SPEED = 50
  
  // Zoom batching to prevent rapid scroll events from causing multiple re-renders
  private zoomBatchTimeout: number | null = null
  private pendingZoomDelta: number = 0
  private readonly ZOOM_BATCH_DELAY = 50 // ms
  
  // Mouse-centered zooming
  private zoomTargetScreen: { x: number, y: number } | null = null

  constructor() {
    this.container = new Container()
    this.cameraTransform = new Container()
    this.gridGraphics = new Graphics()
    
    // Setup hierarchy: container -> cameraTransform -> gridGraphics
    this.container.addChild(this.cameraTransform)
    this.cameraTransform.addChild(this.gridGraphics)
    
    // Initialize local state from store
    this.syncFromStore()
    
    // Set initial camera position to place (0,0) at top-left at default zoom
    this.setInitialCameraPosition()
    
    // Calculate initial viewport corners to sync to store
    this.syncToStore()
  }

  /**
   * Sync local state from store (one-way: store -> local)
   * Called only when we need to read from store, not during rendering
   */
  private syncFromStore(): void {
    this.localCameraPosition.x = gameStore.camera.position.x
    this.localCameraPosition.y = gameStore.camera.position.y
    this.localPixeloidScale = gameStore.camera.pixeloidScale
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
   * Set initial camera position so (0,0) appears at top-left at default zoom
   */
  private setInitialCameraPosition(): void {
    const initialPosition = CoordinateHelper.calculateInitialCameraPosition(
      this.localViewportSize,
      this.localPixeloidScale
    )
    
    this.localCameraPosition.x = initialPosition.x
    this.localCameraPosition.y = initialPosition.y
    
    console.log(`Initial camera position set to (${this.localCameraPosition.x.toFixed(1)}, ${this.localCameraPosition.y.toFixed(1)}) to place (0,0) at top-left`)
  }

  /**
   * Update local state to store (one-way: local -> store)
   * Called only when local state changes, not during rendering
   */
  private syncToStore(): void {
    // Update camera position
    updateGameStore.setCameraPosition(this.localCameraPosition.x, this.localCameraPosition.y)
    
    // Calculate and update viewport corners
    const corners = this.calculateViewportCorners()
    updateGameStore.updateViewportCorners(corners)
  }

  /**
   * Calculate viewport corners in pixeloid coordinates
   */
  protected calculateViewportCorners(): ViewportCorners {
    return CoordinateHelper.calculateViewportCorners(
      this.localCameraPosition,
      this.localViewportSize,
      this.localPixeloidScale
    )
  }

  /**
   * Update camera position based on input
   */
  public updateCamera(deltaTime: number): void {
    // Sync input state from store
    const keys = gameStore.input.keys
    
    let moved = false
    const moveDistance = this.CAMERA_SPEED * deltaTime

    // WASD movement
    if (keys.w) {
      this.localCameraPosition.y -= moveDistance
      moved = true
    }
    if (keys.s) {
      this.localCameraPosition.y += moveDistance
      moved = true
    }
    if (keys.a) {
      this.localCameraPosition.x -= moveDistance
      moved = true
    }
    if (keys.d) {
      this.localCameraPosition.x += moveDistance
      moved = true
    }

    // Space to recenter camera - smart behavior based on selection
    if (keys.space) {
      const selectedObjectId = gameStore.geometry.selection.selectedObjectId
      
      if (selectedObjectId) {
        // If object is selected, center on that object
        const selectedObject = gameStore.geometry.objects.find(obj => obj.id === selectedObjectId)
        if (selectedObject && selectedObject.metadata) {
          this.localCameraPosition.x = selectedObject.metadata.center.x
          this.localCameraPosition.y = selectedObject.metadata.center.y
          moved = true
          console.log(`Camera recentered to selected object ${selectedObjectId} at (${selectedObject.metadata.center.x.toFixed(1)}, ${selectedObject.metadata.center.y.toFixed(1)})`)
        }
      } else {
        // No selection, reset camera to place pixeloid (0,0) at top-left corner
        const centerPosition = CoordinateHelper.calculateInitialCameraPosition(
          this.localViewportSize,
          this.localPixeloidScale
        )
        this.localCameraPosition.x = centerPosition.x
        this.localCameraPosition.y = centerPosition.y
        moved = true
        console.log(`Camera recentered to place (0,0) at top-left at zoom level ${this.localPixeloidScale}`)
      }
      
      // Reset space key to prevent continuous recentering
      updateGameStore.setKeyState('space', false)
    }

    // Only update store if camera moved
    if (moved) {
      this.syncToStore()
    }
  }

  /**
   * Handle zoom input (mouse wheel) with batching and mouse-centered zooming
   */
  public handleZoom(deltaY: number, mouseScreenX?: number, mouseScreenY?: number): void {
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
   * Apply accumulated zoom changes in one batch with mouse-centered zooming
   */
  private applyBatchedZoom(): void {
    if (this.pendingZoomDelta === 0) return
    
    // Store old scale for zoom-to-center calculation
    const oldScale = this.localPixeloidScale
    
    // Calculate new scale with accumulated delta
    const newScale = this.localPixeloidScale + this.pendingZoomDelta
    
    // Clamp zoom levels to integers between 1 and 100 (unlocked full zoom out)
    this.localPixeloidScale = Math.max(1, Math.min(100, newScale))
    
    // Apply mouse-centered zoom if we have a target
    if (this.zoomTargetScreen && oldScale !== this.localPixeloidScale) {
      this.applyMouseCenteredZoom(oldScale, this.localPixeloidScale)
    }
    
    // Reset state
    this.pendingZoomDelta = 0
    this.zoomTargetScreen = null
    
    // Update store once with final value
    updateGameStore.setPixeloidScale(this.localPixeloidScale)
    
    // Update viewport corners since scale changed
    this.syncToStore()
  }
  
  /**
   * Adjust camera position so the target pixeloid ends up at screen center
   */
  private applyMouseCenteredZoom(oldScale: number, newScale: number): void {
    if (!this.zoomTargetScreen) return
    
    // Convert mouse screen position to pixeloid coordinates at old scale
    const targetPixeloid = CoordinateHelper.screenToPixeloid(
      this.zoomTargetScreen.x,
      this.zoomTargetScreen.y,
      this.localCameraPosition,
      this.localViewportSize,
      oldScale
    )
    
    // Calculate screen center
    const screenCenterX = this.localViewportSize.width / 2
    const screenCenterY = this.localViewportSize.height / 2
    
    // Calculate what camera position would put the target pixeloid at screen center with new scale
    const newCameraX = targetPixeloid.x - (screenCenterX - this.localViewportSize.width / 2) / newScale
    const newCameraY = targetPixeloid.y - (screenCenterY - this.localViewportSize.height / 2) / newScale
    
    // Update camera position
    this.localCameraPosition.x = newCameraX
    this.localCameraPosition.y = newCameraY
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
      this.localCameraPosition,
      this.localViewportSize,
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

    // Calculate visible area in pixeloid coordinates
    const corners = this.calculateViewportCorners()
    
    // Get visible grid bounds with padding
    const bounds = CoordinateHelper.calculateVisibleGridBounds(corners, 2)
    const { startX, endX, startY, endY } = bounds

    // Get mouse pixeloid position for highlighting
    const mousePixeloidX = Math.floor(gameStore.mousePixeloidPosition.x)
    const mousePixeloidY = Math.floor(gameStore.mousePixeloidPosition.y)

    // Draw checkered pattern
    for (let x = startX; x < endX; x++) {
      for (let y = startY; y < endY; y++) {
        // Check if this is the targeted pixeloid
        const isTargeted = (x === mousePixeloidX && y === mousePixeloidY)
        
        let color: number
        if (isTargeted) {
          // Highlight targeted pixeloid in bright green
          color = 0x00ff00
        } else {
          // Checkered pattern: alternate colors
          const isLight = (x + y) % 2 === 0
          color = isLight ? 0xf0f0f0 : 0xe0e0e0
        }
        
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

  /**
   * Convert screen coordinates to pixeloid coordinates
   */
  public screenToPixeloid(screenX: number, screenY: number): Point {
    return CoordinateHelper.screenToPixeloid(
      screenX,
      screenY,
      this.localCameraPosition,
      this.localViewportSize,
      this.localPixeloidScale
    )
  }

  /**
   * Convert pixeloid coordinates to screen coordinates
   */
  public pixeloidToScreen(pixeloidX: number, pixeloidY: number): Point {
    return CoordinateHelper.pixeloidToScreen(
      pixeloidX,
      pixeloidY,
      this.localCameraPosition,
      this.localViewportSize,
      this.localPixeloidScale
    )
  }

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
    
    this.gridGraphics.destroy()
    this.cameraTransform.destroy()
    this.container.destroy()
  }
}