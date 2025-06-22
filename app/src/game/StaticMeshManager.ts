import type { 
  StaticMeshData, 
  MeshResolution, 
  PixeloidVertexMapping, 
  PixeloidCoordinate,
  MeshVertexCoordinate,
  ViewportCorners 
} from '../types'
import { gameStore, updateGameStore } from '../store/gameStore'

/**
 * StaticMeshManager - Core static mesh system for transform coherence
 * 
 * Establishes mesh vertices as the single source of truth for all coordinate systems.
 * Provides efficient mesh caching at multiple resolution levels for seamless zooming.
 * 
 * Architecture:
 * Layer 1 (GPU): Screen Pixels ↔ Mesh Vertices (natural GPU relationship)
 * Layer 2 (ECS): Mesh Vertices ↔ Pixeloids (via Store mapping)
 * Layer 3 (Game): Game Objects in Pixeloid space
 */
export class StaticMeshManager {
  // Resolution levels for mesh pre-computation (powers of 2)
  private static readonly RESOLUTION_LEVELS = [1, 2, 4, 8, 16, 32, 64, 128]
  
  // Pre-load queue for background mesh generation
  private preloadQueue: Set<number> = new Set()
  
  constructor() {
    console.log('StaticMeshManager: Initializing static mesh system')
  }

  /**
   * Initialize the static mesh system with the current pixeloid scale
   */
  public initialize(initialPixeloidScale: number): void {
    console.log(`StaticMeshManager: Initializing with pixeloid scale ${initialPixeloidScale}`)
    
    // Set the initial active mesh
    this.setActiveMesh(initialPixeloidScale)
    
    // Pre-load adjacent scales for smooth transitions
    this.preloadAdjacentScales(initialPixeloidScale)
  }

  /**
   * Calculate the appropriate mesh resolution for a given pixeloid scale
   */
  public calculateMeshResolution(pixeloidScale: number): MeshResolution {
    // Find the best resolution level for this scale
    // Use the largest level that is <= pixeloidScale for optimal vertex density
    let bestLevel = 1
    for (const level of StaticMeshManager.RESOLUTION_LEVELS) {
      if (level <= pixeloidScale) {
        bestLevel = level
      } else {
        break
      }
    }

    // Calculate 20% oversized viewport for seamless transitions
    const oversizePercent = gameStore.staticMesh.config.oversizePercent
    const baseSize = 1000 // Base viewport size in vertices
    const oversizedSize = baseSize * (1 + oversizePercent / 100)

    return {
      level: bestLevel,
      pixeloidScale: pixeloidScale,
      oversizePercent: oversizePercent,
      meshBounds: {
        vertexWidth: Math.ceil(oversizedSize / bestLevel),
        vertexHeight: Math.ceil(oversizedSize / bestLevel)
      }
    }
  }

  /**
   * Generate static mesh data for a given resolution
   */
  public generateStaticMesh(resolution: MeshResolution): StaticMeshData {
    const { vertexWidth, vertexHeight } = resolution.meshBounds
    const level = resolution.level
    
    console.log(`StaticMeshManager: Generating mesh for level ${level} (${vertexWidth}x${vertexHeight} vertices)`)

    // Calculate total vertices and indices
    const totalVertices = vertexWidth * vertexHeight
    const totalQuads = (vertexWidth - 1) * (vertexHeight - 1)
    const totalIndices = totalQuads * 6 // 2 triangles per quad, 3 vertices per triangle

    // Create vertex array (x, y coordinates)
    const vertices = new Float32Array(totalVertices * 2)
    let vertexIndex = 0

    // Generate vertices in a grid pattern
    for (let y = 0; y < vertexHeight; y++) {
      for (let x = 0; x < vertexWidth; x++) {
        // Vertex positions scaled by resolution level
        vertices[vertexIndex++] = x * level
        vertices[vertexIndex++] = y * level
      }
    }

    // Create index array for triangulation
    const indices = new Uint16Array(totalIndices)
    let indexIndex = 0

    // Generate indices for grid quads
    for (let y = 0; y < vertexHeight - 1; y++) {
      for (let x = 0; x < vertexWidth - 1; x++) {
        // Calculate vertex indices for this quad
        const topLeft = y * vertexWidth + x
        const topRight = topLeft + 1
        const bottomLeft = (y + 1) * vertexWidth + x
        const bottomRight = bottomLeft + 1

        // First triangle (top-left, top-right, bottom-left)
        indices[indexIndex++] = topLeft
        indices[indexIndex++] = topRight
        indices[indexIndex++] = bottomLeft

        // Second triangle (top-right, bottom-right, bottom-left)
        indices[indexIndex++] = topRight
        indices[indexIndex++] = bottomRight
        indices[indexIndex++] = bottomLeft
      }
    }

    const meshData: StaticMeshData = {
      resolution,
      vertices,
      indices,
      createdAt: Date.now(),
      isValid: true
    }

    console.log(`StaticMeshManager: Generated mesh with ${totalVertices} vertices and ${totalIndices} indices`)
    return meshData
  }

  /**
   * Set the active mesh for a given pixeloid scale
   */
  public setActiveMesh(pixeloidScale: number): void {
    const resolution = this.calculateMeshResolution(pixeloidScale)
    const level = resolution.level

    // Check if we already have this mesh cached
    let meshData = gameStore.staticMesh.meshCache.get(level)
    
    if (!meshData || !meshData.isValid) {
      // Generate new mesh
      meshData = this.generateStaticMesh(resolution)
      
      // Cache the mesh
      gameStore.staticMesh.meshCache.set(level, meshData)
      
      // Update cache statistics
      gameStore.staticMesh.stats.totalCachedMeshes = gameStore.staticMesh.meshCache.size
    }

    // Set as active mesh
    gameStore.staticMesh.activeMesh = meshData
    gameStore.staticMesh.stats.activeMeshLevel = level
    gameStore.staticMesh.stats.lastMeshSwitch = Date.now()

    console.log(`StaticMeshManager: Activated mesh level ${level} for pixeloid scale ${pixeloidScale}`)

    // Update coordinate mapping
    this.updateCoordinateMapping(resolution)
  }

  /**
   * Update coordinate mapping between mesh vertices and pixeloids
   */
  private updateCoordinateMapping(resolution: MeshResolution): void {
    const { vertexWidth, vertexHeight } = resolution.meshBounds
    const level = resolution.level

    // Create bidirectional mapping
    const meshToPixeloid = new Map<string, PixeloidCoordinate>()
    const pixeloidToMesh = new Map<string, MeshVertexCoordinate>()

    // Calculate viewport bounds in vertex coordinates
    const viewportBounds = {
      minVertexX: 0,
      maxVertexX: vertexWidth - 1,
      minVertexY: 0,
      maxVertexY: vertexHeight - 1
    }

    // Generate mappings for the current viewport
    for (let vx = 0; vx < vertexWidth; vx++) {
      for (let vy = 0; vy < vertexHeight; vy++) {
        // Mesh vertex coordinate
        const meshVertex: MeshVertexCoordinate = { x: vx, y: vy }
        
        // Convert to pixeloid coordinate (scaled by resolution level)
        const pixeloidCoord: PixeloidCoordinate = {
          x: vx * level,
          y: vy * level
        }

        // Create bidirectional mapping
        const meshKey = `${vx},${vy}`
        const pixeloidKey = `${pixeloidCoord.x},${pixeloidCoord.y}`
        
        meshToPixeloid.set(meshKey, pixeloidCoord)
        pixeloidToMesh.set(pixeloidKey, meshVertex)
      }
    }

    // Update coordinate mapping in store
    const coordinateMapping: PixeloidVertexMapping = {
      meshToPixeloid,
      pixeloidToMesh,
      currentResolution: resolution,
      viewportBounds
    }

    gameStore.staticMesh.coordinateMapping = coordinateMapping
    gameStore.staticMesh.stats.coordinateMappingUpdates++

    console.log(`StaticMeshManager: Updated coordinate mapping for ${meshToPixeloid.size} vertices at level ${level}`)
  }

  /**
   * Pre-load adjacent scales for smooth zoom transitions
   */
  private preloadAdjacentScales(currentPixeloidScale: number): void {
    const currentLevel = this.calculateMeshResolution(currentPixeloidScale).level
    const currentIndex = StaticMeshManager.RESOLUTION_LEVELS.indexOf(currentLevel)

    // Pre-load next scale (zoom in)
    if (currentIndex < StaticMeshManager.RESOLUTION_LEVELS.length - 1) {
      const nextLevel = StaticMeshManager.RESOLUTION_LEVELS[currentIndex + 1]
      this.queuePreload(nextLevel)
    }

    // Pre-load previous scale (zoom out)
    if (currentIndex > 0) {
      const prevLevel = StaticMeshManager.RESOLUTION_LEVELS[currentIndex - 1]
      this.queuePreload(prevLevel)
    }
  }

  /**
   * Queue a mesh level for background pre-loading
   */
  private queuePreload(level: number): void {
    if (!gameStore.staticMesh.meshCache.has(level) && !this.preloadQueue.has(level)) {
      this.preloadQueue.add(level)
      console.log(`StaticMeshManager: Queued level ${level} for pre-loading`)
      
      // Process preload queue in next frame
      requestIdleCallback(() => this.processPreloadQueue())
    }
  }

  /**
   * Process the preload queue during idle time
   */
  private processPreloadQueue(): void {
    if (this.preloadQueue.size === 0) return

    // Process one level per idle callback to avoid blocking
    const iteratorResult = this.preloadQueue.values().next()
    if (iteratorResult.done || iteratorResult.value === undefined) return
    
    const level = iteratorResult.value
    this.preloadQueue.delete(level)

    if (!gameStore.staticMesh.meshCache.has(level)) {
      // Create a dummy pixeloid scale for this level
      const resolution = this.calculateMeshResolution(level)
      const meshData = this.generateStaticMesh(resolution)
      
      // Cache the pre-generated mesh
      gameStore.staticMesh.meshCache.set(level, meshData)
      gameStore.staticMesh.stats.totalCachedMeshes = gameStore.staticMesh.meshCache.size
      
      console.log(`StaticMeshManager: Pre-loaded mesh level ${level}`)
    }

    // Continue processing queue if more items exist
    if (this.preloadQueue.size > 0) {
      requestIdleCallback(() => this.processPreloadQueue())
    }
  }

  /**
   * Get the current active mesh
   */
  public getActiveMesh(): StaticMeshData | null {
    return gameStore.staticMesh.activeMesh
  }

  /**
   * Get coordinate mapping for conversions
   */
  public getCoordinateMapping(): PixeloidVertexMapping | null {
    return gameStore.staticMesh.coordinateMapping
  }

  /**
   * Handle zoom change and switch meshes if needed
   */
  public handleZoomChange(newPixeloidScale: number): void {
    const currentLevel = gameStore.staticMesh.stats.activeMeshLevel
    const newLevel = this.calculateMeshResolution(newPixeloidScale).level

    // Switch mesh if resolution level changed
    if (newLevel !== currentLevel) {
      this.setActiveMesh(newPixeloidScale)
      
      // Pre-load adjacent scales for the new level
      this.preloadAdjacentScales(newPixeloidScale)
    }
  }

  /**
   * Clear mesh cache (for debugging or memory management)
   */
  public clearCache(): void {
    gameStore.staticMesh.meshCache.clear()
    gameStore.staticMesh.activeMesh = null
    gameStore.staticMesh.coordinateMapping = null
    gameStore.staticMesh.stats.totalCachedMeshes = 0
    this.preloadQueue.clear()
    
    console.log('StaticMeshManager: Cleared all cached meshes')
  }

  /**
   * Get performance statistics
   */
  public getStats(): typeof gameStore.staticMesh.stats {
    return gameStore.staticMesh.stats
  }

  /**
   * Check if the system is ready for use
   */
  public isReady(): boolean {
    return gameStore.staticMesh.activeMesh !== null && 
           gameStore.staticMesh.coordinateMapping !== null
  }
}