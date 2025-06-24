import type {
  StaticMeshData,
  MeshResolution,
  PixeloidVertexMapping,
  PixeloidCoordinate,
  MeshVertexCoordinate
} from '../types'
import { gameStore, updateGameStore, createPixeloidCoordinate, createVertexCoordinate } from '../store/gameStore'
import { subscribe } from 'valtio'

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
  // Smart cache configuration
  private static readonly CRITICAL_SCALES = [1, 2] // Never evict these
  private static readonly ADJACENT_RANGE = 2 // Cache ±2 scales around current
  private static readonly EVICTION_TIME_MS = 60000 // 60 seconds unused = eligible for eviction
  private static readonly MAX_CACHED_SCALES = 15 // Higher limit for time-based eviction
  
  // Current scale tracking
  private currentScale: number = 10
  private preloadQueue: Set<number> = new Set()
  private isPreloading: boolean = false
  
  // Time-based eviction tracking
  private scaleAccessTimes: Map<number, number> = new Map() // scale -> last access timestamp
  private evictionTimer: number | null = null
  
  // Track last processed scale to prevent subscription loops
  private lastProcessedScale: number = -1
  
  constructor() {
    console.log('StaticMeshManager: Initializing static mesh system')
    
    // Subscribe to viewport changes to update coordinate mapping
    this.setupViewportSubscription()
  }

  /**
   * Subscribe to pixeloid scale changes to update mesh resolution
   */
  private setupViewportSubscription(): void {
    subscribe(gameStore.camera, () => {
      // Update mesh when pixeloid scale changes
      if (gameStore.staticMesh.activeMesh) {
        const currentPixeloidScale = gameStore.camera.pixeloid_scale
        
        // Prevent subscription loop by checking if scale actually changed
        if (currentPixeloidScale === this.lastProcessedScale) {
          return
        }
        
        this.lastProcessedScale = currentPixeloidScale
        const resolution = this.calculateMeshResolution(currentPixeloidScale)
        
        console.log(`StaticMeshManager: Scale changed to ${currentPixeloidScale}, updating mesh`)
        this.updateCoordinateMapping(resolution)
      }
    })
  }

  /**
   * Initialize the static mesh system with the current pixeloid scale
   */
  public initialize(initialPixeloidScale: number): void {
    console.log(`StaticMeshManager: Initializing with pixeloid scale ${initialPixeloidScale}`)
    
    // Set the initial active mesh
    this.setActiveMesh(initialPixeloidScale)
    
    // Start smart caching system
    this.initializeSmartCaching(initialPixeloidScale)
      .catch(err => console.warn('StaticMeshManager: Smart caching initialization failed:', err))
  }

  /**
   * Calculate mesh resolution for a given pixeloid scale (direct scale-based)
   */
  public calculateMeshResolution(pixeloidScale: number): MeshResolution {
    // ✅ FIXED: Direct scale-based resolution (no more level mapping)
    // Each pixeloid scale gets its own mesh with appropriate vertex density
    
    // Calculate 20% oversized viewport for seamless transitions
    const oversizePercent = gameStore.staticMesh.config.oversizePercent
    const baseSize = 1000 // Base viewport size in vertices
    const oversizedSize = baseSize * (1 + oversizePercent / 100)

    return {
      level: pixeloidScale, // Level IS the pixeloid scale
      pixeloidScale: pixeloidScale,
      oversizePercent: oversizePercent,
      meshBounds: {
        vertexWidth: Math.ceil(oversizedSize / pixeloidScale),
        vertexHeight: Math.ceil(oversizedSize / pixeloidScale)
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
   * SIMPLE: Uses vertex + offset formula
   */
  private updateCoordinateMapping(resolution: MeshResolution): void {
    const { vertexWidth, vertexHeight } = resolution.meshBounds
    const level = resolution.level

    // Simple viewport bounds for mesh generation
    const viewportBounds = {
      minVertexX: 0,
      maxVertexX: vertexWidth - 1,
      minVertexY: 0,
      maxVertexY: vertexHeight - 1
    }

    // Create bidirectional mapping using simple formula: pixeloid = vertex + offset
    const meshToPixeloid = new Map<string, PixeloidCoordinate>()
    const pixeloidToMesh = new Map<string, MeshVertexCoordinate>()

    // Generate mappings for the current viewport
    for (let vx = 0; vx < vertexWidth; vx++) {
      for (let vy = 0; vy < vertexHeight; vy++) {
        // Mesh vertex coordinate
        const meshVertex: MeshVertexCoordinate = createVertexCoordinate(vx, vy)
        
        // SIMPLE CONVERSION: pixeloid = vertex + vertex_to_pixeloid_offset
        const pixeloidCoord: PixeloidCoordinate = createPixeloidCoordinate(
          vx + gameStore.mesh.vertex_to_pixeloid_offset.x,
          vy + gameStore.mesh.vertex_to_pixeloid_offset.y
        )

        // Create bidirectional mapping
        const meshKey = `${vx},${vy}`
        const pixeloidKey = `${pixeloidCoord.x},${pixeloidCoord.y}`
        
        meshToPixeloid.set(meshKey, pixeloidCoord)
        pixeloidToMesh.set(pixeloidKey, meshVertex)
      }
    }

    // Dummy vertex bounds (not used in simple system)
    const vertexBounds = {
      topLeft: createVertexCoordinate(0, 0),
      bottomRight: createVertexCoordinate(vertexWidth - 1, vertexHeight - 1)
    }

    // Update coordinate mapping in store
    const coordinateMapping: PixeloidVertexMapping = {
      meshToPixeloid,
      pixeloidToMesh,
      currentResolution: resolution,
      viewportBounds,
      viewportOffset: gameStore.mesh.vertex_to_pixeloid_offset,  // Simple offset
      vertexBounds
    }

    // Store the coordinate mapping for this specific pixeloid scale
    updateGameStore.setCoordinateMapping(resolution.pixeloidScale, coordinateMapping)
    
    gameStore.staticMesh.stats.totalCachedMappings = gameStore.staticMesh.coordinateMappings.size
    gameStore.staticMesh.stats.coordinateMappingUpdates++

    console.log(`StaticMeshManager: Updated coordinate mapping for ${meshToPixeloid.size} vertices at level ${level}`)
    console.log(`StaticMeshManager: Vertex to pixeloid offset: (${gameStore.mesh.vertex_to_pixeloid_offset.x.toFixed(2)}, ${gameStore.mesh.vertex_to_pixeloid_offset.y.toFixed(2)})`)
  }

  /**
   * Smart startup pre-caching
   */
  public async initializeSmartCaching(initialScale: number): Promise<void> {
    this.currentScale = initialScale
    
    console.log(`StaticMeshManager: Starting smart caching from scale ${initialScale}`)
    
    // Phase 1: Pre-cache adjacent scales for immediate use
    const adjacentScales = this.getAdjacentScales(initialScale)
    await this.preloadScales(adjacentScales, 'adjacent')
    
    // Phase 2: Pre-cache critical expensive scales
    await this.preloadScales(StaticMeshManager.CRITICAL_SCALES, 'critical')
    
    console.log('StaticMeshManager: Smart caching initialization complete')
  }

  /**
   * Calculate adjacent scales to pre-cache
   */
  private getAdjacentScales(centerScale: number): number[] {
    const scales: number[] = []
    const range = StaticMeshManager.ADJACENT_RANGE
    
    for (let i = -range; i <= range; i++) {
      if (i === 0) continue // Skip center scale (already active)
      const scale = centerScale + i
      if (scale >= 1 && scale <= 100) { // Valid scale range
        scales.push(scale)
      }
    }
    
    return scales
  }

  /**
   * Pre-load scales synchronously (for startup)
   */
  private async preloadScales(scales: number[], type: 'adjacent' | 'critical'): Promise<void> {
    for (const scale of scales) {
      if (!gameStore.staticMesh.meshCache.has(scale)) {
        await this.generateMeshAsync(scale)
        console.log(`StaticMeshManager: Pre-cached ${type} scale ${scale}`)
      }
    }
  }

  /**
   * Handle scale change with smart pre-caching
   */
  public handleScaleChange(newScale: number): void {
    if (newScale === this.currentScale) return
    
    const oldScale = this.currentScale
    this.currentScale = newScale
    
    console.log(`StaticMeshManager: Scale changed ${oldScale} → ${newScale}`)
    
    // Mark this scale as accessed (for time-based eviction)
    this.markScaleAccessed(newScale)
    
    // Set active mesh for immediate use
    this.setActiveMesh(newScale)
    
    // Start async pre-caching of adjacent scales
    const adjacentScales = this.getAdjacentScales(newScale)
    this.preloadScalesAsync(adjacentScales)
    
    // Start time-based eviction timer if not already running
    this.startEvictionTimer()
  }

  /**
   * Mark a scale as recently accessed
   */
  private markScaleAccessed(scale: number): void {
    this.scaleAccessTimes.set(scale, Date.now())
  }

  /**
   * Start time-based eviction timer
   */
  private startEvictionTimer(): void {
    if (this.evictionTimer) return // Already running
    
    this.evictionTimer = window.setInterval(() => {
      this.performTimeBasedEviction()
    }, 30000) // Check every 30 seconds
  }

  /**
   * Pre-load scales asynchronously (for runtime)
   */
  private preloadScalesAsync(scales: number[]): void {
    if (this.isPreloading) return // Prevent overlapping preload operations
    
    this.isPreloading = true
    this.preloadQueue.clear()
    
    // Add scales to queue
    scales.forEach(scale => {
      if (!gameStore.staticMesh.meshCache.has(scale)) {
        this.preloadQueue.add(scale)
      }
    })
    
    // Process queue
    this.processPreloadQueue()
  }

  /**
   * Process preload queue during idle time
   */
  private processPreloadQueue(): void {
    if (this.preloadQueue.size === 0) {
      this.isPreloading = false
      return
    }
    
    const iteratorResult = this.preloadQueue.values().next()
    if (iteratorResult.done || iteratorResult.value === undefined) {
      this.isPreloading = false
      return
    }
    
    const scale = iteratorResult.value
    this.preloadQueue.delete(scale)
    
    requestIdleCallback(() => {
      this.generateMeshAsync(scale).then(() => {
        console.log(`StaticMeshManager: Background pre-cached scale ${scale}`)
        this.processPreloadQueue() // Continue with next
      })
    })
  }

  /**
   * Generate mesh for specific scale
   */
  private generateMeshAsync(scale: number): Promise<void> {
    return new Promise((resolve) => {
      requestIdleCallback(() => {
        const resolution = this.calculateMeshResolution(scale)
        const meshData = this.generateStaticMesh(resolution)
        gameStore.staticMesh.meshCache.set(scale, meshData)
        gameStore.staticMesh.stats.totalCachedMeshes = gameStore.staticMesh.meshCache.size
        resolve()
      })
    })
  }

  /**
   * Time-based eviction - remove scales unused for 60+ seconds (except critical scales)
   */
  private performTimeBasedEviction(): void {
    const now = Date.now()
    const cachedScales = Array.from(gameStore.staticMesh.meshCache.keys())
    const toEvict: number[] = []
    
    for (const scale of cachedScales) {
      // Never evict critical scales
      if (StaticMeshManager.CRITICAL_SCALES.includes(scale)) {
        continue
      }
      
      // Never evict current scale
      if (scale === this.currentScale) {
        continue
      }
      
      // Check if scale hasn't been accessed recently
      const lastAccess = this.scaleAccessTimes.get(scale) || 0
      const timeSinceAccess = now - lastAccess
      
      if (timeSinceAccess > StaticMeshManager.EVICTION_TIME_MS) {
        toEvict.push(scale)
      }
    }
    
    // Perform eviction
    if (toEvict.length > 0) {
      toEvict.forEach(scale => {
        gameStore.staticMesh.meshCache.delete(scale)
        gameStore.staticMesh.coordinateMappings.delete(scale)
        this.scaleAccessTimes.delete(scale)
      })
      
      console.log(`StaticMeshManager: Time-based eviction removed scales [${toEvict.join(', ')}] (unused for 60+ seconds)`)
      
      // Update stats
      gameStore.staticMesh.stats.totalCachedMeshes = gameStore.staticMesh.meshCache.size
      gameStore.staticMesh.stats.totalCachedMappings = gameStore.staticMesh.coordinateMappings.size
    }
    
    // Stop eviction timer if cache is small enough
    if (gameStore.staticMesh.meshCache.size <= 5) {
      if (this.evictionTimer) {
        clearInterval(this.evictionTimer)
        this.evictionTimer = null
        console.log('StaticMeshManager: Stopped eviction timer (cache size manageable)')
      }
    }
  }

  /**
   * Get the current active mesh
   */
  public getActiveMesh(): StaticMeshData | null {
    return gameStore.staticMesh.activeMesh
  }

  /**
   * Get coordinate mapping for conversions (for current scale)
   */
  public getCoordinateMapping(): PixeloidVertexMapping | null {
    return updateGameStore.getCurrentCoordinateMapping()
  }

  /**
   * Get cache statistics for monitoring
   */
  public getCacheStats(): {
    totalCached: number,
    criticalCached: boolean,
    currentAdjacentCached: number,
    memoryEfficient: boolean
  } {
    const cached = Array.from(gameStore.staticMesh.meshCache.keys())
    const criticalCached = StaticMeshManager.CRITICAL_SCALES.every(scale => cached.includes(scale))
    const adjacentScales = this.getAdjacentScales(this.currentScale)
    const adjacentCached = adjacentScales.filter(scale => cached.includes(scale)).length
    
    return {
      totalCached: cached.length,
      criticalCached,
      currentAdjacentCached: adjacentCached,
      memoryEfficient: cached.length <= StaticMeshManager.MAX_CACHED_SCALES
    }
  }

  /**
   * Handle zoom change and switch meshes if needed (legacy method - use handleScaleChange instead)
   */
  public handleZoomChange(newPixeloidScale: number): void {
    // Delegate to new smart caching system
    this.handleScaleChange(newPixeloidScale)
  }

  /**
   * Clear mesh cache (for debugging or memory management)
   */
  public clearCache(): void {
    gameStore.staticMesh.meshCache.clear()
    gameStore.staticMesh.activeMesh = null
    gameStore.staticMesh.coordinateMappings.clear()
    gameStore.staticMesh.stats.totalCachedMeshes = 0
    gameStore.staticMesh.stats.totalCachedMappings = 0
    this.preloadQueue.clear()
    
    console.log('StaticMeshManager: Cleared all cached meshes and coordinate mappings')
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
           gameStore.staticMesh.coordinateMappings.size > 0 &&
           updateGameStore.getCurrentCoordinateMapping() !== null
  }
}