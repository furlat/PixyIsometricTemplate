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

    // Space to recenter camera to place (0,0) at top-left
    if (keys.space) {
      // Reset camera to place pixeloid (0,0) at top-left corner
      const centerPosition = CoordinateHelper.calculateInitialCameraPosition(
        this.localViewportSize,
        this.localPixeloidScale
      )
      this.localCameraPosition.x = centerPosition.x
      this.localCameraPosition.y = centerPosition.y
      moved = true
      // Reset space key to prevent continuous recentering
      updateGameStore.setKeyState('space', false)
      console.log(`Camera recentered to place (0,0) at top-left at zoom level ${this.localPixeloidScale}`)
    }

    // Only update store if camera moved
    if (moved) {
      this.syncToStore()
    }
  }

  /**
   * Handle zoom input (mouse wheel)
   */
  public handleZoom(deltaY: number): void {
    // Calculate new scale as integer
    const zoomStep = deltaY > 0 ? -1 : 1
    const newScale = this.localPixeloidScale + zoomStep
    
    // Clamp zoom levels to integers between 2 and 100
    this.localPixeloidScale = Math.max(2, Math.min(100, newScale))
    
    // Update store
    updateGameStore.setPixeloidScale(this.localPixeloidScale)
    
    // Update viewport corners since scale changed
    this.syncToStore()
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
    this.gridGraphics.destroy()
    this.cameraTransform.destroy()
    this.container.destroy()
  }
}