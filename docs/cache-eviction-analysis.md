# Cache Eviction Analysis for Resolution/Zoom Changes

## Overview

When users zoom in/out (change pixeloid scale), multiple cache systems need to manage memory efficiently while maintaining performance. Here's how each system handles cache eviction:

## 1. StaticMeshManager - Mesh & Coordinate Cache Eviction

### Smart Time-Based Eviction
- **Trigger**: Every 30 seconds via timer
- **Policy**: Evict scales unused for 60+ seconds
- **Protected scales**: 
  - Critical scales (1, 2) - never evicted
  - Current active scale - never evicted
- **What gets evicted**:
  - Mesh data (`gameStore.staticMesh.meshCache`)
  - Coordinate mappings (`gameStore.staticMesh.coordinateMappings`)
  - Access time tracking

```typescript
// StaticMeshManager.ts:425-474
private performTimeBasedEviction(): void {
  const now = Date.now()
  const toEvict: number[] = []
  
  for (const scale of cachedScales) {
    // Skip critical scales (1, 2) and current scale
    if (CRITICAL_SCALES.includes(scale) || scale === this.currentScale) continue
    
    const timeSinceAccess = now - this.scaleAccessTimes.get(scale)
    if (timeSinceAccess > 60000) { // 60 seconds
      toEvict.push(scale)
    }
  }
  
  // Remove from both mesh cache and coordinate mappings
  toEvict.forEach(scale => {
    gameStore.staticMesh.meshCache.delete(scale)
    gameStore.staticMesh.coordinateMappings.delete(scale)
  })
}
```

### Adjacent Scale Pre-caching
- **Range**: ±2 scales around current scale
- **Purpose**: Smooth zoom transitions
- **Eviction**: Old adjacent scales naturally fall out of time-based eviction

## 2. MirrorLayerRenderer - Texture Cache Eviction

### Scale-Indexed Cache Keys
- **Key format**: `${objectId}_${scale}`
- **Benefit**: Each scale has separate texture cache
- **Problem**: Could lead to memory explosion

### Active Scale-Based Cleanup
- **Trigger**: Every render call
- **Policy**: Keep current scale ± 1 only
- **Aggressive**: Immediate cleanup vs StaticMeshManager's time-based approach

```typescript
// MirrorLayerRenderer.ts:115-148
private cleanupOldScaleCaches(currentScale: number): void {
  // Keep only current ±1 scales
  const scalesToKeep = new Set([
    currentScale,
    currentScale - 1, 
    currentScale + 1
  ])
  
  for (const [key, cache] of this.textureCache) {
    const scale = parseInt(key.split('_').pop())
    if (!scalesToKeep.has(scale)) {
      cache.texture.destroy() // Important: destroy GPU texture
      this.textureCache.delete(key)
    }
  }
}
```

## 3. Visibility Cache Management (Store Level)

### Per-Object Scale-Indexed Visibility
- **Location**: `obj.metadata.visibilityCache`
- **Key**: Scale number
- **Content**: Visibility state + on-screen bounds

### Conservative Cleanup
- **Policy**: Keep current scale ± 1
- **Trigger**: After zoom operations and window resize
- **Applied to**: All objects simultaneously

```typescript
// gameStore.ts:521-529
function cleanupVisibilityCache(cache: Map<number, any>, currentScale: number): void {
  const scalesToKeep = new Set([currentScale, currentScale - 1, currentScale + 1])
  
  for (const [scale] of cache) {
    if (!scalesToKeep.has(scale) && scale >= 1 && scale <= 100) {
      cache.delete(scale)
    }
  }
}
```

## 4. Object Texture Cache (TextureRegistry)

### Visual Change-Based Invalidation
- **Trigger**: When object visual properties change
- **Scope**: Specific object only
- **Method**: Complete texture removal

```typescript
// gameStore.ts:872-882
if ('color' in updates || 'strokeWidth' in updates || /* geometry changes */) {
  updateGameStore.removeObjectTexture(id)
  updateGameStore.removeRenderingTexture(id)
}
```

## Cache Coordination Issues

### 1. Inconsistent Eviction Timing
- **StaticMeshManager**: 60-second time-based eviction
- **MirrorLayerRenderer**: Immediate ±1 scale eviction
- **Store visibility**: ±1 scale eviction after operations

### 2. Memory Pressure Points
- **MirrorLayerRenderer**: Most aggressive, destroys textures frequently
- **StaticMeshManager**: Most conservative, keeps adjacent scales longer
- **Gap**: No global memory pressure monitoring

### 3. Scale Transition Conflicts
```typescript
// User zooms from scale 10 → 11
// StaticMeshManager: Keeps scales 8,9,10,11,12,13 (adjacent range ±2)
// MirrorLayerRenderer: Only keeps scales 10,11,12 (current ±1)
// Result: Mesh exists but textures missing for scales 8,9,13
```

## Optimization Opportunities

### 1. Distance-Based Eviction (NEW REQUIREMENT)
- **Policy**: Evict scales more than 4 away from current scale
- **Protected**: Always keep scales 1 and 2 (critical scales)
- **Trigger**: Immediate on scale change, regardless of time
- **Benefit**: Aggressive cleanup on large zoom jumps (e.g., scale 10 → 50)

```typescript
// Proposed distance-based eviction logic
private performDistanceBasedEviction(currentScale: number): void {
  const DISTANCE_THRESHOLD = 4
  const CRITICAL_SCALES = [1, 2]
  
  for (const [scale] of this.cacheMap) {
    // Never evict critical scales
    if (CRITICAL_SCALES.includes(scale)) continue
    
    // Evict if distance > threshold
    const distance = Math.abs(scale - currentScale)
    if (distance > DISTANCE_THRESHOLD) {
      this.evictScale(scale)
    }
  }
}
```

### 2. Hybrid Eviction Strategy
- **Distance-based**: Immediate eviction for scales >4 away
- **Time-based**: 60-second timeout for scales 2-4 away
- **Range-based**: Keep current ±1 or ±2 always

### 3. Unified Eviction Policy
- Coordinate eviction timing across all cache systems
- Use same scale range (±1 or ±2) consistently

### 4. Memory Pressure Detection
- Monitor total GPU texture memory usage
- Trigger aggressive cleanup when approaching limits

### 5. Scale Transition Optimization
- Pre-load textures for scales that have mesh data
- Delay texture eviction during active zooming

### 6. Cache Size Limits
- Add maximum texture cache size limits
- Evict least recently used textures when limit exceeded

## Current Behavior on Zoom Change

1. **Immediate** (frame 0):
   - StaticMeshManager marks new scale as accessed
   - Sets new active mesh (from cache or generates)
   - Visibility cache updated for all objects

2. **Next render** (frame 1):
   - MirrorLayerRenderer cleans up textures for scales outside ±1
   - Objects missing textures at new scale get re-extracted

3. **Background** (30 seconds later):
   - StaticMeshManager evicts unused scales older than 60 seconds
   - Coordinate mappings cleaned up

## Proposed Distance-Based Eviction Behavior

### Implementation Across All Systems

#### 1. StaticMeshManager
```typescript
public handleScaleChange(newScale: number): void {
  // ... existing code ...
  
  // NEW: Distance-based eviction on scale change
  this.performDistanceBasedEviction(newScale)
  
  // Continue with time-based eviction for nearby scales
  this.startEvictionTimer()
}

private performDistanceBasedEviction(currentScale: number): void {
  const DISTANCE_THRESHOLD = 4
  const toEvict: number[] = []
  
  for (const scale of gameStore.staticMesh.meshCache.keys()) {
    // Never evict critical scales (1, 2)
    if ([1, 2].includes(scale)) continue
    
    // Never evict current scale
    if (scale === currentScale) continue
    
    // Evict if distance > 4
    if (Math.abs(scale - currentScale) > DISTANCE_THRESHOLD) {
      toEvict.push(scale)
    }
  }
  
  // Immediate eviction regardless of access time
  toEvict.forEach(scale => {
    gameStore.staticMesh.meshCache.delete(scale)
    gameStore.staticMesh.coordinateMappings.delete(scale)
  })
}
```

#### 2. MirrorLayerRenderer
```typescript
private cleanupOldScaleCaches(currentScale: number): void {
  // Keep current ±1 AND apply distance-based eviction
  const scalesToKeep = new Set([
    currentScale - 1, currentScale, currentScale + 1
  ].filter(s => s >= 1 && s <= 100))
  
  const DISTANCE_THRESHOLD = 4
  
  for (const [key, cache] of this.textureCache) {
    const scale = parseInt(key.split('_').pop())
    
    // Keep if in ±1 range OR is critical scale
    if (scalesToKeep.has(scale) || [1, 2].includes(scale)) continue
    
    // Evict if distance > 4
    if (Math.abs(scale - currentScale) > DISTANCE_THRESHOLD) {
      cache.texture.destroy()
      this.textureCache.delete(key)
    }
  }
}
```

#### 3. Store Visibility Cache
```typescript
// Enhanced cleanup for large scale jumps
function cleanupVisibilityCache(cache: Map<number, any>, currentScale: number): void {
  const DISTANCE_THRESHOLD = 4
  
  for (const [scale] of cache) {
    // Keep current ±1
    if (Math.abs(scale - currentScale) <= 1) continue
    
    // Keep critical scales
    if ([1, 2].includes(scale)) continue
    
    // Evict if distance > 4 OR outside 1-100 range
    if (Math.abs(scale - currentScale) > DISTANCE_THRESHOLD ||
        scale < 1 || scale > 100) {
      cache.delete(scale)
    }
  }
}
```

### Benefits of Distance-Based Eviction

1. **Large Zoom Jumps**: User zooms 10 → 50, immediately cleans scales 1-5 and 55-100
2. **Memory Efficiency**: Prevents accumulation of distant scale caches
3. **Critical Scale Protection**: Always preserves scales 1 and 2 for performance
4. **Immediate Response**: No waiting for 60-second timers on large movements

### Example Scenarios

**Scenario 1: Small zoom change (10 → 12)**
- Keep: scales 8,9,10,11,12,13,14 (within distance 4)
- Evict: Nothing (time-based eviction handles old scales)

**Scenario 2: Large zoom jump (10 → 50)**
- Keep: scales 1,2,46,47,48,49,50,51,52,53,54 (critical + within distance 4)
- Evict: scales 3-45,55-100 (immediate distance-based eviction)

**Scenario 3: Zoom to scale 1**
- Keep: scales 1,2,3,4,5 (critical + within distance 4)
- Evict: scales 6-100 (distance-based eviction)

This hybrid approach combines the benefits of immediate cleanup for large movements while maintaining smooth performance for small zoom adjustments.

This analysis shows the system has good memory management but could benefit from better coordination between the different cache systems.