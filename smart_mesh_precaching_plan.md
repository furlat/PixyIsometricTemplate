# 🚀 **SMART MESH PRE-CACHING SYSTEM**

## 🎯 **OBJECTIVE**
Implement intelligent mesh pre-caching that eliminates lag for pixeloid scales 1 & 2, and provides seamless zoom transitions by pre-caching adjacent scales.

## 🧠 **SMART CACHING STRATEGY**

### **Core Principles:**
1. **Always cache pixeloid scales 1 & 2** (most expensive, never evict)
2. **Cache adjacent scales** around current scale for smooth zoom
3. **Async pre-caching** without blocking main rendering
4. **Smart eviction** - keep 1, 2, and current adjacent range

### **Startup Sequence:**
```
App starts at pixeloid scale 10
↓
Immediately start async pre-caching: 8, 9, 11, 12 (adjacent to 10)
↓
Then pre-cache: 1, 2 (expensive scales)
```

### **Runtime Behavior:**
```
User zooms to scale X
↓
Immediately start async pre-caching: X-2, X-1, X+1, X+2
↓
Mark previously used scales with timestamp (for potential return)
↓
Time-based eviction: Remove scales unused for 60+ seconds (except 1, 2)
```

## 🛠️ **IMPLEMENTATION PLAN**

### **Step 1: Replace Level-Based System with Scale-Based**
**File**: `app/src/game/StaticMeshManager.ts`

**Remove**: RESOLUTION_LEVELS array concept
**Add**: Scale-based caching with smart eviction

```typescript
export class StaticMeshManager {
  // Smart cache configuration
  private static readonly CRITICAL_SCALES = [1, 2]; // Never evict these
  private static readonly ADJACENT_RANGE = 2; // Cache ±2 scales around current
  private static readonly EVICTION_TIME_MS = 60000; // 60 seconds unused = eligible for eviction
  private static readonly MAX_CACHED_SCALES = 15; // Higher limit for time-based eviction
  
  // Current scale tracking
  private currentScale: number = 10;
  private preloadQueue: Set<number> = new Set();
  private isPreloading: boolean = false;
  
  // Time-based eviction tracking
  private scaleAccessTimes: Map<number, number> = new Map(); // scale -> last access timestamp
  private evictionTimer: number | null = null;
  
  /**
   * Smart startup pre-caching
   */
  public async initializeSmartCaching(initialScale: number): Promise<void> {
    this.currentScale = initialScale;
    
    console.log(`StaticMeshManager: Starting smart caching from scale ${initialScale}`);
    
    // Phase 1: Pre-cache adjacent scales for immediate use
    const adjacentScales = this.getAdjacentScales(initialScale);
    await this.preloadScales(adjacentScales, 'adjacent');
    
    // Phase 2: Pre-cache critical expensive scales
    await this.preloadScales(StaticMeshManager.CRITICAL_SCALES, 'critical');
    
    console.log('StaticMeshManager: Smart caching initialization complete');
  }
  
  /**
   * Handle scale change with smart pre-caching
   */
  public handleScaleChange(newScale: number): void {
    if (newScale === this.currentScale) return;
    
    const oldScale = this.currentScale;
    this.currentScale = newScale;
    
    console.log(`StaticMeshManager: Scale changed ${oldScale} → ${newScale}`);
    
    // Mark this scale as accessed (for time-based eviction)
    this.markScaleAccessed(newScale);
    
    // Set active mesh for immediate use
    this.setActiveMesh(newScale);
    
    // Start async pre-caching of adjacent scales
    const adjacentScales = this.getAdjacentScales(newScale);
    this.preloadScalesAsync(adjacentScales);
    
    // Start time-based eviction timer if not already running
    this.startEvictionTimer();
  }
  
  /**
   * Mark a scale as recently accessed
   */
  private markScaleAccessed(scale: number): void {
    this.scaleAccessTimes.set(scale, Date.now());
  }
  
  /**
   * Start time-based eviction timer
   */
  private startEvictionTimer(): void {
    if (this.evictionTimer) return; // Already running
    
    this.evictionTimer = window.setInterval(() => {
      this.performTimeBasedEviction();
    }, 30000); // Check every 30 seconds
  }
  
  /**
   * Calculate adjacent scales to pre-cache
   */
  private getAdjacentScales(centerScale: number): number[] {
    const scales: number[] = [];
    const range = StaticMeshManager.ADJACENT_RANGE;
    
    for (let i = -range; i <= range; i++) {
      if (i === 0) continue; // Skip center scale (already active)
      const scale = centerScale + i;
      if (scale >= 1 && scale <= 100) { // Valid scale range
        scales.push(scale);
      }
    }
    
    return scales;
  }
  
  /**
   * Pre-load scales synchronously (for startup)
   */
  private async preloadScales(scales: number[], type: 'adjacent' | 'critical'): Promise<void> {
    for (const scale of scales) {
      if (!gameStore.staticMesh.meshCache.has(scale)) {
        await this.generateMeshAsync(scale);
        console.log(`StaticMeshManager: Pre-cached ${type} scale ${scale}`);
      }
    }
  }
  
  /**
   * Pre-load scales asynchronously (for runtime)
   */
  private preloadScalesAsync(scales: number[]): void {
    if (this.isPreloading) return; // Prevent overlapping preload operations
    
    this.isPreloading = true;
    this.preloadQueue.clear();
    
    // Add scales to queue
    scales.forEach(scale => {
      if (!gameStore.staticMesh.meshCache.has(scale)) {
        this.preloadQueue.add(scale);
      }
    });
    
    // Process queue
    this.processPreloadQueue();
  }
  
  /**
   * Process preload queue during idle time
   */
  private processPreloadQueue(): void {
    if (this.preloadQueue.size === 0) {
      this.isPreloading = false;
      return;
    }
    
    const scale = this.preloadQueue.values().next().value;
    this.preloadQueue.delete(scale);
    
    requestIdleCallback(() => {
      this.generateMeshAsync(scale).then(() => {
        console.log(`StaticMeshManager: Background pre-cached scale ${scale}`);
        this.processPreloadQueue(); // Continue with next
      });
    });
  }
  
  /**
   * Time-based eviction - remove scales unused for 60+ seconds (except critical scales)
   */
  private performTimeBasedEviction(): void {
    const now = Date.now();
    const cachedScales = Array.from(gameStore.staticMesh.meshCache.keys());
    const toEvict: number[] = [];
    
    for (const scale of cachedScales) {
      // Never evict critical scales
      if (StaticMeshManager.CRITICAL_SCALES.includes(scale)) {
        continue;
      }
      
      // Never evict current scale
      if (scale === this.currentScale) {
        continue;
      }
      
      // Check if scale hasn't been accessed recently
      const lastAccess = this.scaleAccessTimes.get(scale) || 0;
      const timeSinceAccess = now - lastAccess;
      
      if (timeSinceAccess > StaticMeshManager.EVICTION_TIME_MS) {
        toEvict.push(scale);
      }
    }
    
    // Perform eviction
    if (toEvict.length > 0) {
      toEvict.forEach(scale => {
        gameStore.staticMesh.meshCache.delete(scale);
        gameStore.staticMesh.coordinateMappings.delete(scale);
        this.scaleAccessTimes.delete(scale);
      });
      
      console.log(`StaticMeshManager: Time-based eviction removed scales [${toEvict.join(', ')}] (unused for 60+ seconds)`);
      
      // Update stats
      gameStore.staticMesh.stats.totalCachedMeshes = gameStore.staticMesh.meshCache.size;
      gameStore.staticMesh.stats.totalCachedMappings = gameStore.staticMesh.coordinateMappings.size;
    }
    
    // Stop eviction timer if cache is small enough
    if (gameStore.staticMesh.meshCache.size <= 5) {
      if (this.evictionTimer) {
        clearInterval(this.evictionTimer);
        this.evictionTimer = null;
        console.log('StaticMeshManager: Stopped eviction timer (cache size manageable)');
      }
    }
  }
  
  /**
   * Generate mesh for specific scale
   */
  private generateMeshAsync(scale: number): Promise<void> {
    return new Promise((resolve) => {
      requestIdleCallback(() => {
        const resolution = this.calculateMeshResolution(scale);
        const meshData = this.generateStaticMesh(resolution);
        gameStore.staticMesh.meshCache.set(scale, meshData);
        gameStore.staticMesh.stats.totalCachedMeshes = gameStore.staticMesh.meshCache.size;
        resolve();
      });
    });
  }
  
  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    totalCached: number,
    criticalCached: boolean,
    currentAdjacentCached: number,
    memoryEfficient: boolean
  } {
    const cached = Array.from(gameStore.staticMesh.meshCache.keys());
    const criticalCached = StaticMeshManager.CRITICAL_SCALES.every(scale => cached.includes(scale));
    const adjacentScales = this.getAdjacentScales(this.currentScale);
    const adjacentCached = adjacentScales.filter(scale => cached.includes(scale)).length;
    
    return {
      totalCached: cached.length,
      criticalCached,
      currentAdjacentCached: adjacentCached,
      memoryEfficient: cached.length <= StaticMeshManager.MAX_CACHED_SCALES
    };
  }
}
```

### **Step 2: Integration with Zoom System**
**File**: `app/src/game/LayeredInfiniteCanvas.ts`

**Modify**: Handle scale changes with smart caching
```typescript
// In render() method, replace:
if (pixeloidScale !== this.lastPixeloidScale) {
  this.staticMeshManager.handleZoomChange(pixeloidScale);
}

// With:
if (pixeloidScale !== this.lastPixeloidScale) {
  this.staticMeshManager.handleScaleChange(pixeloidScale);
}
```

### **Step 3: Startup Integration**
**File**: `app/src/game/Game.ts` or initialization point

```typescript
// Replace current initialization with:
this.staticMeshManager.initializeSmartCaching(initialPixeloidScale)
  .then(() => console.log('Game: Smart mesh caching ready - smooth zoom guaranteed'))
  .catch(err => console.warn('Game: Smart caching failed:', err));
```

## 📊 **EXPECTED PERFORMANCE**

### **Memory Usage:**
- **Critical scales (1, 2)**: Always cached ~2 meshes
- **Current adjacent (±2)**: ~4 meshes around current scale  
- **Total**: ~6-8 meshes at any time (efficient)

### **User Experience:**
- **Pixeloid scales 1, 2**: Always instant (never evicted)
- **Adjacent scales**: Instant (pre-cached)
- **Recently used scales**: Instant for 60+ seconds after last use
- **Distant scales**: One-time generation lag, then cached with timestamp

### **Smart Behavior Examples:**
- **Zoom sequence 10→9→8→9→10**: All steps instant (recently accessed)
- **Jump to scale 50**: Generate 50, pre-cache 48,49,51,52
- **Return to scale 10 after 30 seconds**: Instant (still cached)
- **Return to scale 50 after 2 minutes**: Generate again (evicted), then cache
- **Return to scales 1, 2**: Always instant (never evicted)

**This system provides the perfect balance of performance, memory efficiency, and user experience.**