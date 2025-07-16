# Phase 1 Types Implementation Plan

## 🎯 **Mission: Complete Missing Types for ECS Architecture**

Based on the comprehensive types review, we need to implement the missing pieces to reach 100% type completeness. Here's the prioritized implementation plan.

---

## 📊 **Current Status vs Target**

| System | Current | Target | Priority | Missing Elements |
|--------|---------|--------|----------|------------------|
| Coordinates | 70% | 100% | **HIGH** | Conversion utilities, zoom transforms |
| Mesh System | 85% | 95% | MEDIUM | Layer integration, zoom sync |
| Filter Pipeline | 90% | 95% | LOW | Layer integration |
| Game Store | 95% | 100% | LOW | Cross-system communication |

---

## 🚀 **Implementation Order**

### **Phase 1A: Coordinate System Completion** (HIGH PRIORITY)

#### File: `app/src/types/ecs-coordinates.ts`

**Add these missing functions:**

```typescript
// ================================
// COORDINATE CONVERSION UTILITIES
// ================================

/**
 * Convert pixeloid coordinate to screen coordinate.
 */
export const pixeloidToScreen = (
  pixeloid: PixeloidCoordinate, 
  scale: number
): ScreenCoordinate => ({
  x: pixeloid.x * scale,
  y: pixeloid.y * scale
})

/**
 * Convert screen coordinate to pixeloid coordinate.
 */
export const screenToPixeloid = (
  screen: ScreenCoordinate, 
  scale: number
): PixeloidCoordinate => ({
  x: screen.x / scale,
  y: screen.y / scale
})

/**
 * Convert pixeloid coordinate to vertex coordinate.
 */
export const pixeloidToVertex = (
  pixeloid: PixeloidCoordinate
): VertexCoordinate => ({
  x: pixeloid.x,
  y: pixeloid.y
})

/**
 * Convert vertex coordinate to pixeloid coordinate.
 */
export const vertexToPixeloid = (
  vertex: VertexCoordinate
): PixeloidCoordinate => ({
  x: vertex.x,
  y: vertex.y
})

// ================================
// ZOOM-AWARE TRANSFORMATIONS
// ================================

/**
 * Transform pixeloid coordinate for zoom level.
 */
export const transformPixeloidForZoom = (
  coord: PixeloidCoordinate,
  zoom: number
): PixeloidCoordinate => ({
  x: coord.x * zoom,
  y: coord.y * zoom
})

/**
 * Transform ECS viewport bounds for zoom level.
 */
export const transformBoundsForZoom = (
  bounds: ECSViewportBounds,
  zoom: number
): ECSViewportBounds => ({
  topLeft: transformPixeloidForZoom(bounds.topLeft, zoom),
  bottomRight: transformPixeloidForZoom(bounds.bottomRight, zoom),
  width: bounds.width * zoom,
  height: bounds.height * zoom
})

// ================================
// BOUNDARY VALIDATION
// ================================

/**
 * Check if coordinate is within bounds.
 */
export const isWithinBounds = (
  coord: PixeloidCoordinate,
  bounds: ECSViewportBounds
): boolean => {
  return coord.x >= bounds.topLeft.x &&
         coord.x <= bounds.bottomRight.x &&
         coord.y >= bounds.topLeft.y &&
         coord.y <= bounds.bottomRight.y
}

/**
 * Clamp coordinate to bounds.
 */
export const clampToBounds = (
  coord: PixeloidCoordinate,
  bounds: ECSViewportBounds
): PixeloidCoordinate => ({
  x: Math.max(bounds.topLeft.x, Math.min(bounds.bottomRight.x, coord.x)),
  y: Math.max(bounds.topLeft.y, Math.min(bounds.bottomRight.y, coord.y))
})

// ================================
// DISTANCE AND GEOMETRY UTILITIES
// ================================

/**
 * Calculate distance between two pixeloid coordinates.
 */
export const distance = (
  a: PixeloidCoordinate,
  b: PixeloidCoordinate
): number => {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Calculate Manhattan distance between two pixeloid coordinates.
 */
export const manhattanDistance = (
  a: PixeloidCoordinate,
  b: PixeloidCoordinate
): number => {
  return Math.abs(b.x - a.x) + Math.abs(b.y - a.y)
}

/**
 * Interpolate between two pixeloid coordinates.
 */
export const interpolate = (
  a: PixeloidCoordinate,
  b: PixeloidCoordinate,
  t: number
): PixeloidCoordinate => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t
})
```

**Estimated Implementation Time: 45 minutes**

---

### **Phase 1B: Mesh System Integration** (MEDIUM PRIORITY)

#### File: `app/src/types/mesh-system.ts`

**Add these missing functions:**

```typescript
// ================================
// COORDINATE SYSTEM INTEGRATION
// ================================

/**
 * Convert pixeloid coordinate to mesh vertex coordinate.
 */
export const pixeloidToMeshVertex = (
  pixeloid: PixeloidCoordinate,
  level: MeshLevel
): VertexCoordinate => ({
  x: pixeloid.x / level,
  y: pixeloid.y / level
})

/**
 * Convert mesh vertex coordinate to pixeloid coordinate.
 */
export const meshVertexToPixeloid = (
  vertex: VertexCoordinate,
  level: MeshLevel
): PixeloidCoordinate => ({
  x: vertex.x * level,
  y: vertex.y * level
})

// ================================
// ZOOM LEVEL SYNCHRONIZATION
// ================================

/**
 * Sync mesh level with zoom level.
 */
export const syncMeshLevelWithZoom = (zoomLevel: number): MeshLevel => {
  const validLevels: MeshLevel[] = [1, 2, 4, 8, 16, 32, 64, 128]
  
  // Find the closest valid mesh level
  let closestLevel: MeshLevel = 1
  let minDiff = Math.abs(zoomLevel - 1)
  
  for (const level of validLevels) {
    const diff = Math.abs(zoomLevel - level)
    if (diff < minDiff) {
      minDiff = diff
      closestLevel = level
    }
  }
  
  return closestLevel
}

/**
 * Validate mesh level alignment with zoom level.
 */
export const validateMeshZoomAlignment = (
  meshLevel: MeshLevel,
  zoomLevel: number
): boolean => {
  const recommendedLevel = syncMeshLevelWithZoom(zoomLevel)
  return meshLevel === recommendedLevel
}

// ================================
// ECS LAYER INTEGRATION INTERFACES
// ================================

/**
 * Update mesh for data layer interface.
 */
export interface MeshDataLayerUpdate {
  updateMeshForDataLayer(dataLayer: any): void // Will be properly typed when ECS layers are integrated
}

/**
 * Update mesh for mirror layer interface.
 */
export interface MeshMirrorLayerUpdate {
  updateMeshForMirrorLayer(mirrorLayer: any): void // Will be properly typed when ECS layers are integrated
}
```

**Estimated Implementation Time: 30 minutes**

---

### **Phase 1C: Filter Pipeline Integration** (LOW PRIORITY)

#### File: `app/src/types/filter-pipeline.ts`

**Add these missing functions:**

```typescript
// ================================
// ECS LAYER INTEGRATION
// ================================

/**
 * Apply filter pipeline to data layer.
 */
export interface FilterDataLayerIntegration {
  applyToDataLayer(dataLayer: any): FilterExecutionResult // Will be properly typed when ECS layers are integrated
}

/**
 * Apply filter pipeline to mirror layer.
 */
export interface FilterMirrorLayerIntegration {
  applyToMirrorLayer(mirrorLayer: any): FilterExecutionResult // Will be properly typed when ECS layers are integrated
}

// ================================
// ZOOM-AWARE FILTERING
// ================================

/**
 * Update filters for zoom level.
 */
export const updateFiltersForZoom = (
  pipeline: FilterPipeline,
  zoomLevel: number
): FilterPipeline => {
  // Update filter parameters based on zoom level
  const updatedPreFilters = pipeline.preFilters.map(filter => ({
    ...filter,
    parameters: {
      ...filter.parameters,
      zoomLevel,
      scale: zoomLevel
    }
  }))
  
  const updatedPostFilters = pipeline.postFilters.map(filter => ({
    ...filter,
    parameters: {
      ...filter.parameters,
      zoomLevel,
      scale: zoomLevel
    }
  }))
  
  return {
    ...pipeline,
    preFilters: updatedPreFilters,
    postFilters: updatedPostFilters,
    context: {
      ...pipeline.context,
      currentZoomLevel: zoomLevel
    }
  }
}

/**
 * Get active filters for zoom level.
 */
export const getActiveFiltersForZoom = (
  pipeline: FilterPipeline,
  zoomLevel: number
): FilterConfig[] => {
  const allFilters = [...pipeline.preFilters, ...pipeline.postFilters]
  
  return allFilters.filter(filter => {
    // Filter logic based on zoom level
    const minZoom = filter.parameters.minZoom || 1
    const maxZoom = filter.parameters.maxZoom || 128
    
    return zoomLevel >= minZoom && zoomLevel <= maxZoom
  })
}
```

**Estimated Implementation Time: 25 minutes**

---

### **Phase 1D: Game Store Cross-System Communication** (LOW PRIORITY)

#### File: `app/src/types/game-store.ts`

**Add these missing functions:**

```typescript
// ================================
// CROSS-SYSTEM COMMUNICATION
// ================================

/**
 * Message interface for cross-system communication.
 */
export interface SystemMessage {
  from: keyof Pick<GameStore, 'dataLayer' | 'mirrorLayer' | 'meshSystem' | 'filterPipeline'>
  to: keyof Pick<GameStore, 'dataLayer' | 'mirrorLayer' | 'meshSystem' | 'filterPipeline'>
  type: string
  payload: any
  timestamp: number
  id: string
}

/**
 * Send message between systems.
 */
export interface CrossSystemCommunication {
  sendMessageBetweenSystems(message: SystemMessage): void
  broadcastMessage(message: Omit<SystemMessage, 'to'>): void
  subscribeToMessages(
    system: keyof Pick<GameStore, 'dataLayer' | 'mirrorLayer' | 'meshSystem' | 'filterPipeline'>,
    callback: (message: SystemMessage) => void
  ): void
}

// ================================
// PERFORMANCE OPTIMIZATION
// ================================

/**
 * Optimize system interactions.
 */
export interface SystemOptimization {
  optimizeSystemInteractions(): void
  balanceSystemLoad(): void
  measureSystemPerformance(): Record<string, number>
}
```

**Estimated Implementation Time: 20 minutes**

---

## 📋 **Implementation Checklist**

### **Phase 1A: Coordinate System** ✅ **READY TO IMPLEMENT**
- [ ] Add coordinate conversion utilities (pixeloidToScreen, screenToPixeloid, etc.)
- [ ] Add zoom-aware transformations (transformPixeloidForZoom, transformBoundsForZoom)
- [ ] Add boundary validation (isWithinBounds, clampToBounds)
- [ ] Add distance/geometry utilities (distance, manhattanDistance, interpolate)

### **Phase 1B: Mesh System** ✅ **READY TO IMPLEMENT**
- [ ] Add coordinate system integration (pixeloidToMeshVertex, meshVertexToPixeloid)
- [ ] Add zoom level synchronization (syncMeshLevelWithZoom, validateMeshZoomAlignment)
- [ ] Add ECS layer integration interfaces (placeholder for now)

### **Phase 1C: Filter Pipeline** ✅ **READY TO IMPLEMENT**
- [ ] Add ECS layer integration interfaces (placeholder for now)
- [ ] Add zoom-aware filtering (updateFiltersForZoom, getActiveFiltersForZoom)

### **Phase 1D: Game Store** ✅ **READY TO IMPLEMENT**
- [ ] Add cross-system communication (SystemMessage, CrossSystemCommunication)
- [ ] Add performance optimization interfaces (SystemOptimization)

---

## 🎯 **Total Implementation Time**

- **Phase 1A**: 45 minutes (HIGH PRIORITY)
- **Phase 1B**: 30 minutes (MEDIUM PRIORITY)
- **Phase 1C**: 25 minutes (LOW PRIORITY)
- **Phase 1D**: 20 minutes (LOW PRIORITY)

**Total**: ~2 hours of focused implementation

---

## 🚀 **Next Steps**

1. **Start with Phase 1A** (Coordinate System) - highest impact
2. **Test each phase** before moving to the next
3. **Validate types** with TypeScript compiler
4. **Update exports** in `app/src/types/index.ts`

**Ready to begin implementation?** 🎯
