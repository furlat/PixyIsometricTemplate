import { MeshSimple, MeshGeometry, Shader, Texture } from 'pixi.js'
import type { ViewportCorners } from '../types'
import { CoordinateHelper } from './CoordinateHelper'
import { gameStore } from '../store/gameStore'

/**
 * Mesh-based background grid renderer
 * Creates individual quads for each grid square using MeshSimple
 * This provides the foundation for shader-based effects like pixeloid masks
 */
export class BackgroundGridRenderer {
  private mesh: MeshSimple | null = null
  private shader: Shader | null = null
  private lastScale: number = -1
  private lastViewport: string = ''
  
  constructor() {
    this.createGridShader()
  }

  /**
   * Create shader for grid rendering with proper checkerboard pattern
   */
  private createGridShader(): void {
    this.shader = Shader.from({
      gl: {
        vertex: `
          attribute vec2 aPosition;
          attribute vec2 aUV;
          varying vec2 vUV;
          varying vec2 vGridPos;
          
          uniform mat3 uProjectionMatrix;
          uniform mat3 uWorldTransformMatrix;
          uniform mat3 uTransformMatrix;
          
          void main() {
            mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
            gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
            vUV = aUV;
            vGridPos = aPosition;
          }
        `,
        fragment: `
          precision mediump float;
          varying vec2 vUV;
          varying vec2 vGridPos;
          
          uniform float uPixeloidScale;
          
          void main() {
            // Calculate checkerboard pattern based on grid position
            // Each quad represents a 1x1 grid square
            vec2 gridCoord = floor(vGridPos);
            float checker = mod(gridCoord.x + gridCoord.y, 2.0);
            
            // Light and dark colors for checkerboard (matching original BackgroundGridRenderer)
            vec3 lightColor = vec3(0.941, 0.941, 0.941); // 0xf0f0f0
            vec3 darkColor = vec3(0.878, 0.878, 0.878);  // 0xe0e0e0
            
            // Mix between light and dark based on checker value
            vec3 color = mix(lightColor, darkColor, checker);
            
            gl_FragColor = vec4(color, 1.0);
          }
        `
      },
      resources: {
        uTexture: Texture.WHITE.source,
        uPixeloidScale: 1.0
      }
    })
  }
  
  /**
   * Render the grid mesh using efficient viewport culling
   */
  public render(
    corners: ViewportCorners,
    pixeloidScale: number
  ): void {
    // Create viewport hash for caching (using larger tile size for efficiency)
    const viewportHash = `${Math.floor(corners.topLeft.x/50)},${Math.floor(corners.topLeft.y/50)},${Math.floor(corners.bottomRight.x/50)},${Math.floor(corners.bottomRight.y/50)}`
    
    // Check if we need to regenerate (scale changed or major viewport change)
    if (pixeloidScale !== this.lastScale || viewportHash !== this.lastViewport) {
      // Try to use static mesh system for better coherence
      if (this.tryUseStaticMesh(corners, pixeloidScale)) {
        console.log('BackgroundGridRenderer: Using static mesh system')
      } else {
        // Fallback to dynamic mesh generation
        this.regenerateGridMesh(corners, pixeloidScale)
      }
      this.lastScale = pixeloidScale
      this.lastViewport = viewportHash
    }
    
    // Update shader uniforms
    if (this.shader) {
      this.shader.resources.uPixeloidScale = pixeloidScale
    }
  }
  
  /**
   * Generate grid mesh for the current viewport
   */
  private regenerateGridMesh(corners: ViewportCorners, pixeloidScale: number): void {
    // Use same efficient bounds calculation
    const bounds = CoordinateHelper.calculateVisibleGridBounds(corners, 2)
    const { startX, endX, startY, endY } = bounds

    console.log(`BackgroundGridRenderer: Generating mesh for bounds ${startX},${startY} to ${endX},${endY}`)

    // Create mesh geometry for grid squares
    this.createGridMesh(startX, endX, startY, endY)
  }

  /**
   * Create MeshSimple with quads for each grid square
   */
  private createGridMesh(startX: number, endX: number, startY: number, endY: number): void {
    const squareCount = (endX - startX) * (endY - startY)
    console.log(`Creating grid mesh: ${squareCount} squares`)

    // Create vertex arrays for all grid squares
    const vertices: number[] = []
    const uvs: number[] = []
    const indices: number[] = []

    let vertexIndex = 0
    for (let x = startX; x < endX; x++) {
      for (let y = startY; y < endY; y++) {
        // Create quad for this grid square (x,y to x+1,y+1)
        vertices.push(
          x, y,       // top-left
          x + 1, y,   // top-right
          x + 1, y + 1, // bottom-right
          x, y + 1    // bottom-left
        )
        
        // UV coordinates (simple mapping)
        uvs.push(
          0, 0,
          1, 0,
          1, 1,
          0, 1
        )
        
        // Indices for two triangles per quad
        const base = vertexIndex * 4
        indices.push(
          base + 0, base + 1, base + 2,  // First triangle
          base + 0, base + 2, base + 3   // Second triangle
        )
        
        vertexIndex++
      }
    }

    // Create or update mesh
    if (this.mesh) {
      this.mesh.destroy()
    }

    // Create mesh with checkerboard shader
    this.mesh = new MeshSimple({
      texture: Texture.WHITE,
      vertices: new Float32Array(vertices),
      uvs: new Float32Array(uvs),
      indices: new Uint32Array(indices)
    })

    // Apply the checkerboard shader if available
    if (this.shader) {
      // Use type assertion to bypass the TypeScript texture requirement
      (this.mesh as any).shader = this.shader
    }
    
    // Make mesh interactive for direct vertex detection
    this.setupMeshInteraction()
  }
  
  /**
   * Try to use static mesh system for vertex-aligned grid rendering
   * Returns true if successful, false if fallback needed
   */
  private tryUseStaticMesh(corners: ViewportCorners, pixeloidScale: number): boolean {
    const staticMeshData = gameStore.staticMesh.activeMesh
    const coordinateMapping = gameStore.staticMesh.coordinateMapping
    
    if (!staticMeshData || !coordinateMapping || !staticMeshData.isValid) {
      return false // Static mesh system not ready
    }

    console.log(`BackgroundGridRenderer: Using static mesh level ${coordinateMapping.currentResolution.level}`)

    // Use static mesh vertices for grid rendering
    this.createStaticMeshGrid(staticMeshData, coordinateMapping, corners)
    return true
  }

  /**
   * Create grid using static mesh vertices for perfect alignment
   */
  private createStaticMeshGrid(
    staticMeshData: any,
    coordinateMapping: any,
    corners: ViewportCorners
  ): void {
    const { vertices, indices } = staticMeshData
    const { currentResolution } = coordinateMapping
    
    console.log(`Creating static mesh grid with ${vertices.length / 2} vertices`)

    // Calculate visible bounds for culling
    const bounds = CoordinateHelper.calculateVisibleGridBounds(corners, 2)
    const { startX, endX, startY, endY } = bounds
    
    // Filter vertices to visible area and create grid quads
    const visibleVertices: number[] = []
    const visibleUvs: number[] = []
    const visibleIndices: number[] = []
    
    let vertexIndex = 0
    const level = currentResolution.level

    // Generate grid quads aligned to static mesh vertices
    for (let x = Math.floor(startX / level) * level; x < endX; x += level) {
      for (let y = Math.floor(startY / level) * level; y < endY; y += level) {
        // Create quad for this grid square using mesh vertex positions
        visibleVertices.push(
          x, y,           // top-left
          x + level, y,   // top-right
          x + level, y + level, // bottom-right
          x, y + level    // bottom-left
        )
        
        // UV coordinates
        visibleUvs.push(
          0, 0,
          1, 0,
          1, 1,
          0, 1
        )
        
        // Indices for two triangles per quad
        const base = vertexIndex * 4
        visibleIndices.push(
          base + 0, base + 1, base + 2,  // First triangle
          base + 0, base + 2, base + 3   // Second triangle
        )
        
        vertexIndex++
      }
    }

    // Create or update mesh with static mesh aligned vertices
    if (this.mesh) {
      this.mesh.destroy()
    }

    // Create mesh with vertex-aligned grid
    this.mesh = new MeshSimple({
      texture: Texture.WHITE,
      vertices: new Float32Array(visibleVertices),
      uvs: new Float32Array(visibleUvs),
      indices: new Uint32Array(visibleIndices)
    })

    // Apply the checkerboard shader
    if (this.shader) {
      (this.mesh as any).shader = this.shader
    }
    
    // Make mesh interactive for direct vertex detection
    this.setupMeshInteraction()
  }

  /**
   * Setup direct mesh interaction using PixiJS events API
   * This provides vertex-level mouse detection without manual coordinate conversion
   * HANDLES ALL MOUSE/POINTER EVENTS THROUGH THE MESH
   */
  private setupMeshInteraction(): void {
    if (!this.mesh) return
    
    // Enable interaction on the mesh
    this.mesh.eventMode = 'static'
    this.mesh.interactiveChildren = false // Optimize since we don't have children
    
    // MOUSE MOVEMENT - Use global pointer movement for continuous tracking
    this.mesh.on('globalpointermove', (event) => {
      this.handleMeshPointerEvent(event, 'move')
    })
    
    // MOUSE DOWN - Handle all mouse button presses
    this.mesh.on('pointerdown', (event) => {
      this.handleMeshPointerEvent(event, 'down')
    })
    
    // MOUSE UP - Handle all mouse button releases
    this.mesh.on('pointerup', (event) => {
      this.handleMeshPointerEvent(event, 'up')
    })
    
    // WHEEL EVENTS - Handle zoom/scroll
    this.mesh.on('wheel', (event) => {
      this.handleMeshWheelEvent(event)
    })
    
    console.log('BackgroundGridRenderer: Complete mesh interaction enabled with direct vertex detection')
  }

  /**
   * Handle pointer events on the mesh - converts to vertex coordinates and delegates to InputManager
   */
  private handleMeshPointerEvent(event: any, eventType: 'move' | 'down' | 'up'): void {
    if (!this.mesh) return
    
    // Get local coordinates relative to the mesh
    const localPos = event.getLocalPosition(this.mesh)
    
    // Since the mesh is constructed with vertex coordinates,
    // the local position IS the vertex coordinate
    const vertexX = Math.floor(localPos.x)
    const vertexY = Math.floor(localPos.y)
    
    // Update store with vertex position (no conversion needed!)
    gameStore.mouseVertexPosition.x = vertexX
    gameStore.mouseVertexPosition.y = vertexY
    
    // Convert to pixeloid using mesh vertex to pixeloid conversion
    const pixeloidCoord = CoordinateHelper.meshVertexToPixeloid({ x: vertexX, y: vertexY })
    gameStore.mousePixeloidPosition.x = pixeloidCoord.x
    gameStore.mousePixeloidPosition.y = pixeloidCoord.y
    
    // Get InputManager instance and delegate the event
    // We need to access this through the game instance
    if ((globalThis as any).inputManager) {
      (globalThis as any).inputManager.handleMeshEvent(eventType, vertexX, vertexY, pixeloidCoord, event)
    }
  }

  /**
   * Handle wheel events on the mesh
   */
  private handleMeshWheelEvent(event: any): void {
    if (!this.mesh) return
    
    // Get local coordinates for wheel event
    const localPos = event.getLocalPosition(this.mesh)
    const vertexX = Math.floor(localPos.x)
    const vertexY = Math.floor(localPos.y)
    
    // Delegate to InputManager for zoom handling
    if ((globalThis as any).inputManager) {
      (globalThis as any).inputManager.handleMeshWheelEvent(vertexX, vertexY, event)
    }
  }

  /**
   * Get the mesh for adding to render layer
   */
  public getMesh(): MeshSimple | null {
    return this.mesh
  }
  
  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.mesh) {
      this.mesh.destroy()
      this.mesh = null
    }
    if (this.shader) {
      this.shader.destroy()
      this.shader = null
    }
  }
}