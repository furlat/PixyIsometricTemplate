// app/src/game/MeshManager_3b.ts
import { MeshSimple, Texture } from 'pixi.js'
import { VertexCoordinate } from '../types/ecs-coordinates'
import { gameStore } from '../store/game-store'

export class MeshManager_3b {
  private mesh: MeshSimple | null = null
  private vertices: Float32Array | null = null
  private indices: Uint32Array | null = null
  
  constructor(private store: typeof gameStore) {
    this.generateMesh()
  }
  
  private get cellSize(): number {
    return this.store.mesh.cellSize
  }
  
  private generateMesh(): void {
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    const cellSize = this.cellSize
    const gridWidth = Math.ceil(screenWidth / cellSize)
    const gridHeight = Math.ceil(screenHeight / cellSize)
    
    console.log(`Generating mesh: ${gridWidth}x${gridHeight} cells with cellSize=${cellSize}`)
    
    const vertices: number[] = []
    const indices: number[] = []
    
    let vertexIndex = 0
    for (let x = 0; x < gridWidth; x++) {
      for (let y = 0; y < gridHeight; y++) {
        const screenX = x * cellSize
        const screenY = y * cellSize
        
        // Create quad vertices for each cell
        vertices.push(
          screenX, screenY,                              // top-left
          screenX + cellSize, screenY,                   // top-right
          screenX + cellSize, screenY + cellSize,        // bottom-right
          screenX, screenY + cellSize                    // bottom-left
        )
        
        // Create triangle indices for the quad
        const base = vertexIndex * 4
        indices.push(
          base + 0, base + 1, base + 2,  // First triangle
          base + 0, base + 2, base + 3   // Second triangle
        )
        
        vertexIndex++
      }
    }
    
    this.vertices = new Float32Array(vertices)
    this.indices = new Uint32Array(indices)
    
    console.log(`Mesh generated: ${this.vertices.length / 2} vertices, ${this.indices.length / 3} triangles`)
    
    // Create PIXI mesh
    this.mesh = new MeshSimple({
      texture: Texture.WHITE,
      vertices: this.vertices,
      indices: this.indices
    })
  }
  
  // Authoritative mesh access
  public getMesh(): MeshSimple | null {
    return this.mesh
  }
  
  public getVertices(): Float32Array | null {
    return this.vertices
  }
  
  public getIndices(): Uint32Array | null {
    return this.indices
  }
  
  // Convert screen coordinates to mesh vertex coordinates
  public screenToVertex(screenX: number, screenY: number): VertexCoordinate {
    const cellSize = this.cellSize
    const vertexX = Math.floor(screenX / cellSize)
    const vertexY = Math.floor(screenY / cellSize)
    return { x: vertexX, y: vertexY }
  }
  
  // Convert mesh vertex coordinates to screen coordinates
  public vertexToScreen(vertexX: number, vertexY: number): { x: number, y: number } {
    const cellSize = this.cellSize
    return {
      x: vertexX * cellSize,
      y: vertexY * cellSize
    }
  }
  
  // Get mesh cell size
  public getCellSize(): number {
    return this.store.mesh.cellSize
  }
  
  // Get mesh dimensions
  public getMeshDimensions(): { width: number, height: number } {
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    const cellSize = this.cellSize
    return {
      width: Math.ceil(screenWidth / cellSize),
      height: Math.ceil(screenHeight / cellSize)
    }
  }
  
  // Cleanup
  public destroy(): void {
    if (this.mesh) {
      this.mesh.destroy()
      this.mesh = null
    }
    this.vertices = null
    this.indices = null
  }
}