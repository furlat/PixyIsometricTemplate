# Phase 2C Implementation Plan: ECS Layer Coordination State - REVISED

## Implementation Overview - REVISED

**Phase:** 2C - Layer Coordination State Implementation
**Goal:** Create coordination layer WITHOUT modifying gameStore.ts
**Architecture:** Clean integration controllers that coordinate separate ECS stores
**Success Criteria:** Pass static analysis validation against ECS coordination requirements

**CRITICAL CHANGE**: gameStore.ts is READ-ONLY reference. Never modify it.

---

## Core ECS Coordination Requirements - REVISED

### 1. Zoom-Dependent WASD Routing (CRITICAL)
- **Zoom Level 1**: WASD → Data Layer (sampling window movement)
- **Zoom Level 2+**: WASD → Mirror Layer (camera viewport movement)
- **Automatic Switching**: Seamless transition between zoom levels
- **No Interference**: Layers don't interfere with each other's operations

### 2. Texture Synchronization (CRITICAL)
- **Data → Mirror**: Sync rendered textures from data layer to mirror layer
- **Cache Management**: Coordinate texture cache between layers
- **Invalidation**: Proper texture invalidation when data changes
- **Performance**: Efficient texture transfer without duplication

### 3. Layer Visibility Management (CRITICAL)
- **Zoom Level 1**: Both layers visible (data sampling + complete mirror)
- **Zoom Level 2+**: Only mirror layer visible (camera viewport)
- **Smooth Transitions**: Fade transitions between visibility states
- **No Flicker**: Seamless layer switching

### 4. State Synchronization (CRITICAL)
- **Zoom State**: Single source of truth for zoom level
- **Position State**: Coordinate position state between layers
- **Performance State**: Aggregate performance metrics
- **Debug State**: Unified debugging interface

### 5. Performance Coordination (CRITICAL)
- **Resource Management**: Prevent duplicate work between layers
- **Cache Coordination**: Shared cache strategies
- **Memory Management**: Coordinate memory usage
- **Optimization**: System-wide performance optimization

---

## Implementation Architecture - REVISED

### Core Components

```typescript
// Phase 2C Implementation Structure - REVISED
ECSCoordinationController {
  private dataLayerIntegration: ECSDataLayerIntegration
  private mirrorLayerIntegration: ECSMirrorLayerIntegration
  private coordinationState: ECSCoordinationState
  private actions: ECSCoordinationActions
  
  // Public API
  getCoordinationState(): Readonly<ECSCoordinationState>
  getActions(): ECSCoordinationActions
  getUnifiedStats(): UnifiedSystemStats
  
  // Integration Methods
  routeWASDMovement(direction: WASDDirection): void
  syncTextures(): void
  manageLayerVisibility(): void
  coordinatePerformance(): void
}
```

### Clean Integration Architecture

Following the ECS Recovery Plan approach:

1. **ECS Coordination Controller** (`ecs-coordination-controller.ts`)
   - Coordinates between data and mirror layer integrations
   - Manages zoom-dependent WASD routing
   - Handles texture synchronization
   - Controls layer visibility

2. **Integration Service** (`ecs-coordination-service.ts`)
   - Service layer for renderer integration
   - Provides unified interface for existing systems
   - Handles performance coordination

3. **Vanilla TypeScript UI Integration** (`ui/ECSCoordinationPanel.ts`)
   - Clean UI classes using Valtio subscribe pattern
   - Unified debugging interface using DOM manipulation
   - Performance monitoring through direct state access

4. **Debug UI** (`ECSCoordinationDebugPanel.ts`)
   - Unified debugging panel using vanilla TypeScript
   - System-wide performance metrics displayed via DOM
   - Layer coordination status through Valtio subscriptions

### Coordination State Structure

```typescript
interface ECSCoordinationState {
  // ================================
  // ZOOM LEVEL MANAGEMENT
  // ================================
  zoomLevel: ZoomLevel
  previousZoomLevel: ZoomLevel
  zoomTransition: {
    isTransitioning: boolean
    startTime: number
    duration: number
    fromLevel: ZoomLevel
    toLevel: ZoomLevel
  }
  
  // ================================
  // WASD ROUTING STATE
  // ================================
  wasdRouting: {
    currentTarget: 'data-layer' | 'mirror-layer' | 'inactive'
    isRoutingActive: boolean
    lastMovementTime: number
    movementQueue: WASDMovement[]
  }
  
  // ================================
  // LAYER VISIBILITY STATE
  // ================================
  layerVisibility: {
    dataLayer: {
      isVisible: boolean
      opacity: number
      fadeState: 'stable' | 'fading-in' | 'fading-out'
    }
    mirrorLayer: {
      isVisible: boolean
      opacity: number
      fadeState: 'stable' | 'fading-in' | 'fading-out'
    }
  }
  
  // ================================
  // TEXTURE SYNCHRONIZATION STATE
  // ================================
  textureSynchronization: {
    isActive: boolean
    lastSyncTime: number
    syncVersion: number
    pendingTextures: string[]
    failedTextures: string[]
    syncPerformance: {
      texturesPerSecond: number
      averageSyncTime: number
    }
  }
  
  // ================================
  // PERFORMANCE COORDINATION
  // ================================
  performance: {
    totalMemoryUsage: number
    aggregatedCacheSize: number
    totalObjectCount: number
    totalVisibleObjects: number
    frameRate: number
    lastOptimizationTime: number
  }
}
```

---

---

## Detailed Implementation Plan - REVISED

### Phase 2C.1: Create ECS Coordination Controller

#### 2C.1.1 Create Coordination Controller
```typescript
// app/src/store/ecs-coordination-controller.ts
import { ecsDataLayerIntegration } from './ecs-data-layer-integration'
import { ecsMirrorLayerIntegration } from './ecs-mirror-layer-integration'
import { ECSCoordinationState } from '@/types/ecs-coordination'

export class ECSCoordinationController {
  private dataLayerIntegration: ECSDataLayerIntegration
  private mirrorLayerIntegration: ECSMirrorLayerIntegration
  private coordinationState: ECSCoordinationState
  private actions: ECSCoordinationActions
  
  constructor() {
    this.dataLayerIntegration = ecsDataLayerIntegration
    this.mirrorLayerIntegration = ecsMirrorLayerIntegration
    this.coordinationState = createECSCoordinationState()
    this.actions = this.createActions()
  }
  
  // Public API
  getCoordinationState(): Readonly<ECSCoordinationState> {
    return this.coordinationState
  }
  
  getActions(): ECSCoordinationActions {
    return this.actions
  }
  
  getUnifiedStats(): UnifiedSystemStats {
    return {
      totalObjects: this.dataLayerIntegration.getState().objects.length,
      totalVisibleObjects: this.dataLayerIntegration.getVisibleObjects().length,
      totalMemoryUsage: this.calculateTotalMemoryUsage(),
      
      dataLayer: {
        samplingActive: this.dataLayerIntegration.getState().state.isActive,
        objectCount: this.dataLayerIntegration.getState().objects.length,
        visibleCount: this.dataLayerIntegration.getVisibleObjects().length,
        memoryUsage: this.dataLayerIntegration.getStats().memoryUsage
      },
      
      mirrorLayer: {
        zoomLevel: this.mirrorLayerIntegration.getStats().zoomLevel,
        cacheSize: this.mirrorLayerIntegration.getStats().textureCacheSize,
        cacheHitRate: this.mirrorLayerIntegration.getStats().cacheHitRate,
        memoryUsage: this.mirrorLayerIntegration.getStats().memoryUsage
      },
      
      coordination: {
        wasdTarget: this.coordinationState.wasdRouting.currentTarget,
        layersVisible: this.getVisibleLayers(),
        syncActive: this.coordinationState.textureSynchronization.isActive,
        performance: this.coordinationState.performance.frameRate
      }
    }
  }
  
  // WASD Routing Methods
  moveUp(): void {
    this.routeWASDMovement('up')
  }
  
  moveDown(): void {
    this.routeWASDMovement('down')
  }
  
  moveLeft(): void {
    this.routeWASDMovement('left')
  }
  
  moveRight(): void {
    this.routeWASDMovement('right')
  }
  
  // Zoom Level Management
  setZoomLevel(level: ZoomLevel): void {
    this.updateZoomLevel(level)
    this.updateWASDRouting(level)
    this.updateLayerVisibility(level)
  }
  
  // Texture Synchronization
  syncTextures(): void {
    this.performTextureSync()
  }
  
  // Layer Visibility
  setLayerVisibility(layer: 'data' | 'mirror', visible: boolean): void {
    this.updateLayerVisibility({ [layer]: visible })
  }
}

// Export singleton instance
export const ecsCoordinationController = new ECSCoordinationController()
```

#### 2C.1.2 Create Actions Interface
```typescript
// Internal actions creation
private createActions(): ECSCoordinationActions {
  return {
    // WASD Routing
    moveUp: () => this.routeWASDMovement('up'),
    moveDown: () => this.routeWASDMovement('down'),
    moveLeft: () => this.routeWASDMovement('left'),
    moveRight: () => this.routeWASDMovement('right'),
    
    // Zoom Management
    setZoomLevel: (level: ZoomLevel) => this.setZoomLevel(level),
    
    // Texture Synchronization
    syncTextures: () => this.syncTextures(),
    syncSingleTexture: (objectId: string) => this.syncSingleTexture(objectId),
    
    // Layer Visibility
    setLayerVisibility: (layer: 'data' | 'mirror', visible: boolean) =>
      this.setLayerVisibility(layer, visible),
    
    // Performance
    optimizeSystem: () => this.optimizeSystem(),
    coordinatePerformance: () => this.coordinatePerformance()
  }
}
```

#### 2C.1.3 Implement Unified Stats Interface
```typescript
interface UnifiedSystemStats {
  // System-wide metrics
  totalObjects: number
  totalVisibleObjects: number
  totalMemoryUsage: number
  
  // Data layer stats
  dataLayer: {
    samplingActive: boolean
    objectCount: number
    visibleCount: number
    memoryUsage: number
  }
  
  // Mirror layer stats
  mirrorLayer: {
    zoomLevel: ZoomLevel
    cacheSize: number
    cacheHitRate: number
    memoryUsage: number
  }
  
  // Coordination stats
  coordination: {
    wasdTarget: 'data-layer' | 'mirror-layer' | 'inactive'
    layersVisible: string[]
    syncActive: boolean
    performance: number
  }
}
```

### Phase 2C.2: Zoom Level Management

#### 2C.2.1 Zoom Level Operations
```typescript
// Actions: Zoom level management
setZoomLevel(level: ZoomLevel): void

// Internal: Zoom level coordination
private updateZoomLevel(newLevel: ZoomLevel): void
private handleZoomTransition(from: ZoomLevel, to: ZoomLevel): void
private updateWASDRouting(zoomLevel: ZoomLevel): void
private updateLayerVisibility(zoomLevel: ZoomLevel): void
```

#### 2C.2.2 Zoom Transition System
```typescript
// Internal: Smooth zoom transitions
private startZoomTransition(fromLevel: ZoomLevel, toLevel: ZoomLevel): void
private updateZoomTransition(): void
private completeZoomTransition(): void

// Zoom transition rules
private applyZoomTransitionRules(): void {
  const { zoomLevel } = this.coordinationState
  
  if (zoomLevel === 1) {
    // Zoom 1: Data layer sampling active, mirror shows complete
    this.updateWASDRouting('data-layer')
    this.updateLayerVisibility({ data: true, mirror: true })
  } else {
    // Zoom 2+: Mirror layer camera active, data layer hidden
    this.updateWASDRouting('mirror-layer')
    this.updateLayerVisibility({ data: false, mirror: true })
  }
}
```

### Phase 2C.3: WASD Routing System

#### 2C.3.1 WASD Movement Routing
```typescript
// Actions: WASD routing
moveUp(): void
moveDown(): void
moveLeft(): void
moveRight(): void

// Internal: WASD routing logic
private routeWASDMovement(direction: WASDDirection): void
private sendToDataLayer(direction: WASDDirection): void
private sendToMirrorLayer(direction: WASDDirection): void
private isWASDActive(): boolean
```

#### 2C.3.2 Movement Queue Management
```typescript
// Internal: Movement queue for smooth routing
private addMovementToQueue(movement: WASDMovement): void
private processMovementQueue(): void
private clearMovementQueue(): void

interface WASDMovement {
  direction: WASDDirection
  timestamp: number
  targetLayer: 'data-layer' | 'mirror-layer'
  processed: boolean
}
```

#### 2C.3.3 WASD Target Determination
```typescript
// Internal: Determine correct WASD target
private determineWASDTarget(): 'data-layer' | 'mirror-layer' | 'inactive' {
  const { zoomLevel } = this.coordinationState
  
  if (zoomLevel === 1) {
    return 'data-layer'  // Data layer sampling
  } else if (zoomLevel > 1) {
    return 'mirror-layer'  // Mirror layer camera
  }
  
  return 'inactive'  // Should not happen
}
```

### Phase 2C.4: Texture Synchronization

#### 2C.4.1 Texture Sync Operations
```typescript
// Actions: Texture synchronization
syncTextures(): void
syncSingleTexture(objectId: string): void
invalidateTexture(objectId: string): void

// Internal: Texture sync logic
private performTextureSync(): void
private extractTextureFromDataLayer(objectId: string): MirrorTexture | null
private updateMirrorLayerTexture(texture: MirrorTexture): void
private handleTextureSyncFailure(objectId: string, error: Error): void
```

#### 2C.4.2 Texture Cache Coordination
```typescript
// Internal: Coordinate texture caches
private coordinateTextureCaches(): void
private optimizeSharedCache(): void
private preventDuplicateTextures(): void

// Texture invalidation cascade
private invalidateTextureCascade(objectId: string): void {
  // Remove from data layer cache
  this.dataLayerStore.getActions().removeFromCache?.(objectId)
  
  // Remove from mirror layer cache
  this.mirrorLayerStore.getActions().evictTexture(objectId)
  
  // Update sync state
  this.coordinationState.textureSynchronization.syncVersion++
}
```

#### 2C.4.3 Texture Validation
```typescript
// Internal: Texture validation and integrity
private validateTextureSync(): boolean
private isTextureSyncValid(): boolean
private repairBrokenTextureSync(): void
```

### Phase 2C.5: Layer Visibility Management

#### 2C.5.1 Layer Visibility Operations
```typescript
// Actions: Layer visibility
setLayerVisibility(layer: 'data' | 'mirror', visible: boolean): void
setLayerOpacity(layer: 'data' | 'mirror', opacity: number): void

// Internal: Visibility management
private updateLayerVisibility(config: LayerVisibilityConfig): void
private fadeLayer(layer: 'data' | 'mirror', opacity: number, duration: number): void
private handleVisibilityTransition(): void
```

#### 2C.5.2 Visibility Transition System
```typescript
// Internal: Smooth layer transitions
private startVisibilityTransition(config: VisibilityTransitionConfig): void
private updateVisibilityTransition(): void
private completeVisibilityTransition(): void

interface VisibilityTransitionConfig {
  dataLayer: { visible: boolean, opacity: number }
  mirrorLayer: { visible: boolean, opacity: number }
  duration: number
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
}
```

### Phase 2C.6: Performance Coordination

#### 2C.6.1 Performance Operations
```typescript
// Actions: Performance coordination
optimizeSystem(): void
coordinatePerformance(): void
validateSystemIntegrity(): boolean

// Internal: Performance coordination
private aggregatePerformanceMetrics(): void
private optimizeLayerCoordination(): void
private preventPerformanceInterference(): void
```

#### 2C.6.2 Memory Management
```typescript
// Internal: Coordinate memory usage
private coordinateMemoryUsage(): void
private optimizeSharedResources(): void
private preventMemoryLeaks(): void

// Memory usage calculation
private calculateTotalMemoryUsage(): number {
  const dataMemory = this.dataLayerStore.getStats().memoryUsage
  const mirrorMemory = this.mirrorLayerStore.getStats().memoryUsage
  const coordMemory = this.calculateCoordinationMemory()
  
  return dataMemory + mirrorMemory + coordMemory
}
```

---

### Phase 2C.2: Create Vanilla TypeScript UI Integration for Coordination

#### 2C.2.1 Create Coordination UI Panel
```typescript
// app/src/ui/ECSCoordinationPanel.ts
import { subscribe } from 'valtio'
import { ecsCoordinationController } from '../store/ecs-coordination-controller'

export class ECSCoordinationPanel {
  private controller = ecsCoordinationController
  private panelElement: HTMLElement | null = null
  private elements: { [key: string]: HTMLElement } = {}
  
  constructor() {
    this.createPanelElement()
    this.setupSubscriptions()
  }
  
  private createPanelElement() {
    this.panelElement = document.createElement('div')
    this.panelElement.className = 'ecs-coordination-panel'
    this.panelElement.innerHTML = `
      <div class="card bg-base-200/30 shadow-sm mb-3">
        <div class="card-body p-3">
          <h3 class="card-title text-sm text-success flex items-center gap-2">
            <span class="text-xs">▸</span>
            ECS Layer Coordination
          </h3>
          <div class="space-y-2">
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">WASD Target:</span>
              <span id="coord-wasd-target" class="font-bold font-mono text-success">inactive</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">Zoom Level:</span>
              <span id="coord-zoom-level" class="font-bold font-mono text-success">1</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">Layers Visible:</span>
              <span id="coord-layers-visible" class="font-bold font-mono text-success">data, mirror</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">Sync Active:</span>
              <span id="coord-sync-active" class="font-bold font-mono text-success">No</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">Performance:</span>
              <span id="coord-performance" class="font-bold font-mono text-success">0.0 fps</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">Memory Usage:</span>
              <span id="coord-memory-usage" class="font-bold font-mono text-success">0 bytes</span>
            </div>
          </div>
        </div>
      </div>
    `
    this.setupElements()
  }
  
  private setupElements() {
    this.elements.wasdTarget = document.getElementById('coord-wasd-target')!
    this.elements.zoomLevel = document.getElementById('coord-zoom-level')!
    this.elements.layersVisible = document.getElementById('coord-layers-visible')!
    this.elements.syncActive = document.getElementById('coord-sync-active')!
    this.elements.performance = document.getElementById('coord-performance')!
    this.elements.memoryUsage = document.getElementById('coord-memory-usage')!
  }
  
  private setupSubscriptions() {
    // Subscribe to coordination state changes
    // Note: This would require making the coordination state a Valtio proxy
    const updateInterval = setInterval(() => {
      this.updateValues()
    }, 16) // 60fps updates
    
    // Clean up on destroy
    // TODO: Add proper cleanup mechanism
  }
  
  private updateValues() {
    const coordinationState = this.controller.getCoordinationState()
    const unifiedStats = this.controller.getUnifiedStats()
    
    this.elements.wasdTarget.textContent = coordinationState.wasdRouting.currentTarget
    this.elements.zoomLevel.textContent = coordinationState.zoomLevel.toString()
    this.elements.layersVisible.textContent = unifiedStats.coordination.layersVisible.join(', ')
    this.elements.syncActive.textContent = coordinationState.textureSynchronization.isActive ? 'Yes' : 'No'
    this.elements.performance.textContent = coordinationState.performance.frameRate.toFixed(1) + ' fps'
    this.elements.memoryUsage.textContent = unifiedStats.totalMemoryUsage.toString() + ' bytes'
  }
  
  // Public methods for UI interaction
  public moveUp() {
    this.controller.moveUp()
  }
  
  public moveDown() {
    this.controller.moveDown()
  }
  
  public moveLeft() {
    this.controller.moveLeft()
  }
  
  public moveRight() {
    this.controller.moveRight()
  }
  
  public setZoomLevel(level: number) {
    this.controller.setZoomLevel(level as any)
  }
  
  public syncTextures() {
    this.controller.syncTextures()
  }
  
  public getUnifiedStats() {
    return this.controller.getUnifiedStats()
  }
  
  public appendTo(parentElement: HTMLElement) {
    if (this.panelElement) {
      parentElement.appendChild(this.panelElement)
    }
  }
}
```

### Phase 2C.3: Create Coordination Service

#### 2C.3.1 Create Service Layer
```typescript
// app/src/store/ecs-coordination-service.ts
import { ECSCoordinationController } from './ecs-coordination-controller'

export class ECSCoordinationService {
  private controller: ECSCoordinationController
  
  constructor(controller: ECSCoordinationController) {
    this.controller = controller
  }
  
  // Methods for renderer integration
  handleWASDInput(direction: 'up' | 'down' | 'left' | 'right') {
    switch (direction) {
      case 'up': return this.controller.moveUp()
      case 'down': return this.controller.moveDown()
      case 'left': return this.controller.moveLeft()
      case 'right': return this.controller.moveRight()
    }
  }
  
  // Methods for zoom management
  updateZoomLevel(level: number) {
    this.controller.setZoomLevel(level as ZoomLevel)
  }
  
  // Methods for texture synchronization
  syncTexturesBetweenLayers() {
    this.controller.syncTextures()
  }
  
  // Methods for layer visibility
  setLayerVisibility(layer: 'data' | 'mirror', visible: boolean) {
    this.controller.setLayerVisibility(layer, visible)
  }
  
  // Methods for performance monitoring
  getSystemPerformance() {
    return this.controller.getUnifiedStats()
  }
  
  // Methods for state management
  getCoordinationState() {
    return this.controller.getCoordinationState()
  }
}

// Export singleton service
export const ecsCoordinationService = new ECSCoordinationService(ecsCoordinationController)
```

### Phase 2C.4: Create Debug UI Component

#### 2C.4.1 Create Coordination Debug UI (Corrected - Vanilla TypeScript)
```typescript
// app/src/ui/ECSCoordinationDebugPanel.ts
import { subscribe } from 'valtio'
import { ecsCoordinationController } from '../store/ecs-coordination-controller'

export class ECSCoordinationDebugPanel {
  private controller = ecsCoordinationController
  private panelElement: HTMLElement | null = null
  private updateInterval: NodeJS.Timeout | null = null
  
  constructor() {
    this.createPanelElement()
    this.setupUpdateLoop()
  }
  
  private createPanelElement() {
    this.panelElement = document.createElement('div')
    this.panelElement.className = 'ecs-coordination-debug-panel'
    this.panelElement.innerHTML = `
      <div class="card bg-base-200/30 shadow-sm mb-3">
        <div class="card-body p-3">
          <h3 class="card-title text-sm text-info flex items-center gap-2">
            <span class="text-xs">▸</span>
            ECS Coordination Debug
          </h3>
          
          <div class="divider my-2 text-xs text-base-content/50">WASD Routing</div>
          <div class="space-y-1">
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">Current Target:</span>
              <span id="debug-wasd-target" class="font-bold font-mono text-info">inactive</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">Zoom Level:</span>
              <span id="debug-zoom-level" class="font-bold font-mono text-info">1</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">Routing Active:</span>
              <span id="debug-routing-active" class="font-bold font-mono text-info">No</span>
            </div>
          </div>
          
          <div class="divider my-2 text-xs text-base-content/50">Layer Visibility</div>
          <div class="space-y-1">
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">Visible Layers:</span>
              <span id="debug-layers-visible" class="font-bold font-mono text-info">data, mirror</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">Data Layer Opacity:</span>
              <span id="debug-data-opacity" class="font-bold font-mono text-info">1.0</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">Mirror Layer Opacity:</span>
              <span id="debug-mirror-opacity" class="font-bold font-mono text-info">1.0</span>
            </div>
          </div>
          
          <div class="divider my-2 text-xs text-base-content/50">Texture Synchronization</div>
          <div class="space-y-1">
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">Sync Active:</span>
              <span id="debug-sync-active" class="font-bold font-mono text-info">No</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">Sync Version:</span>
              <span id="debug-sync-version" class="font-bold font-mono text-info">0</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">Pending Textures:</span>
              <span id="debug-pending-textures" class="font-bold font-mono text-info">0</span>
            </div>
          </div>
          
          <div class="divider my-2 text-xs text-base-content/50">Performance</div>
          <div class="space-y-1">
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">Frame Rate:</span>
              <span id="debug-frame-rate" class="font-bold font-mono text-info">0.0 fps</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">Total Memory:</span>
              <span id="debug-total-memory" class="font-bold font-mono text-info">0 bytes</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-base-content/70">Total Objects:</span>
              <span id="debug-total-objects" class="font-bold font-mono text-info">0</span>
            </div>
          </div>
        </div>
      </div>
    `
  }
  
  private setupUpdateLoop() {
    this.updateInterval = setInterval(() => {
      this.updateValues()
    }, 100) // Update every 100ms for debug info
  }
  
  private updateValues() {
    const coordinationState = this.controller.getCoordinationState()
    const unifiedStats = this.controller.getUnifiedStats()
    
    const elements = {
      wasdTarget: document.getElementById('debug-wasd-target'),
      zoomLevel: document.getElementById('debug-zoom-level'),
      routingActive: document.getElementById('debug-routing-active'),
      layersVisible: document.getElementById('debug-layers-visible'),
      dataOpacity: document.getElementById('debug-data-opacity'),
      mirrorOpacity: document.getElementById('debug-mirror-opacity'),
      syncActive: document.getElementById('debug-sync-active'),
      syncVersion: document.getElementById('debug-sync-version'),
      pendingTextures: document.getElementById('debug-pending-textures'),
      frameRate: document.getElementById('debug-frame-rate'),
      totalMemory: document.getElementById('debug-total-memory'),
      totalObjects: document.getElementById('debug-total-objects')
    }
    
    if (elements.wasdTarget) elements.wasdTarget.textContent = coordinationState.wasdRouting.currentTarget
    if (elements.zoomLevel) elements.zoomLevel.textContent = coordinationState.zoomLevel.toString()
    if (elements.routingActive) elements.routingActive.textContent = coordinationState.wasdRouting.isRoutingActive ? 'Yes' : 'No'
    if (elements.layersVisible) elements.layersVisible.textContent = unifiedStats.coordination.layersVisible.join(', ')
    if (elements.dataOpacity) elements.dataOpacity.textContent = coordinationState.layerVisibility.dataLayer.opacity.toFixed(2)
    if (elements.mirrorOpacity) elements.mirrorOpacity.textContent = coordinationState.layerVisibility.mirrorLayer.opacity.toFixed(2)
    if (elements.syncActive) elements.syncActive.textContent = coordinationState.textureSynchronization.isActive ? 'Yes' : 'No'
    if (elements.syncVersion) elements.syncVersion.textContent = coordinationState.textureSynchronization.syncVersion.toString()
    if (elements.pendingTextures) elements.pendingTextures.textContent = coordinationState.textureSynchronization.pendingTextures.length.toString()
    if (elements.frameRate) elements.frameRate.textContent = coordinationState.performance.frameRate.toFixed(1) + ' fps'
    if (elements.totalMemory) elements.totalMemory.textContent = unifiedStats.totalMemoryUsage.toString() + ' bytes'
    if (elements.totalObjects) elements.totalObjects.textContent = unifiedStats.totalObjects.toString()
  }
  
  public appendTo(parentElement: HTMLElement) {
    if (this.panelElement) {
      parentElement.appendChild(this.panelElement)
    }
  }
  
  public destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
    if (this.panelElement && this.panelElement.parentNode) {
      this.panelElement.parentNode.removeChild(this.panelElement)
    }
  }
}
```

---

## ECS Architecture Validation Criteria - REVISED

### Phase 2C Must Pass These Tests:

1. **✅ Non-Intrusive Implementation**
   - gameStore.ts remains completely untouched
   - Clean integration without modification
   - Coordinates separate ECS stores without coupling

2. **✅ Zoom-Dependent WASD Routing**
   - Zoom 1: WASD → Data Layer (sampling window)
   - Zoom 2+: WASD → Mirror Layer (camera viewport)
   - Seamless switching between zoom levels
   - No interference between layers

3. **✅ Texture Synchronization**
   - Data → Mirror texture flow
   - No texture duplication
   - Proper invalidation cascade
   - Performance-optimized sync

4. **✅ Layer Visibility Management**
   - Zoom 1: Both layers visible
   - Zoom 2+: Only mirror visible
   - Smooth transitions between states
   - No rendering flicker

5. **✅ Clean Integration Architecture**
   - Controller pattern for coordination
   - Service layer for renderer integration
   - Vanilla TypeScript UI classes using Valtio subscribe pattern
   - Debug UI for monitoring

---

## Implementation Phases - REVISED

### Phase 2C.1: Coordination Controller (Day 1)
- [ ] Create ECS Coordination Controller
- [ ] Implement WASD routing logic
- [ ] Create unified stats interface
- [ ] Test coordination without gameStore.ts modification

### Phase 2C.2: Vanilla TypeScript UI Integration (Day 2)
- [ ] Create coordination UI panel using Valtio subscribe pattern
- [ ] Implement debug panels using DOM manipulation
- [ ] Create type-safe interfaces for existing UI system
- [ ] Test UI classes with existing application

### Phase 2C.3: Service Layer (Day 3)
- [ ] Create coordination service
- [ ] Implement renderer integration methods
- [ ] Create performance monitoring
- [ ] Test service layer integration

### Phase 2C.4: Debug UI (Day 4)
- [ ] Create coordination debug UI
- [ ] Implement system-wide monitoring
- [ ] Create visual debugging tools
- [ ] Test complete coordination system

### Phase 2C.5: Integration Testing (Day 5)
- [ ] Test WASD routing between layers
- [ ] Test texture synchronization
- [ ] Test layer visibility management
- [ ] Test performance coordination

---

## Success Metrics - REVISED

### Code Quality Metrics
- **Non-Intrusive:** gameStore.ts remains completely untouched
- **Clean Coordination:** No tight coupling between layers
- **Efficient Routing:** Fast WASD routing with minimal overhead
- **Resource Optimization:** No duplicate work or memory waste

### ECS Compliance Metrics
- **Proper WASD Routing:** Correct target based on zoom level
- **Layer Independence:** Layers don't interfere with each other
- **State Consistency:** Single source of truth for shared state
- **Performance Efficiency:** Optimized system-wide performance

### Integration Readiness
- **Phase 2D Ready:** Provides foundation for migration strategy
- **Clean APIs:** Easy to integrate with existing systems
- **Debugging Support:** Rich debugging and monitoring capabilities
- **Extensible Design:** Easy to add new coordination features

---

## Critical Success Factors - REVISED

1. **Non-Intrusive:** Never modify gameStore.ts
2. **Layer Independence:** Ensure layers remain independent while coordinated
3. **Performance Focus:** Optimize for real-time coordination operations
4. **Clean Interfaces:** Keep coordination interfaces clean and focused
5. **Validation First:** Build comprehensive validation framework

---

## Integration Notes - REVISED

### Coordination Patterns
- **Controller Pattern:** For centralized coordination
- **Service Pattern:** For renderer integration
- **Observer Pattern:** For state synchronization
- **Strategy Pattern:** For zoom-dependent behavior

### Performance Considerations
- **Minimal Overhead:** Coordination should add minimal performance cost
- **Efficient Routing:** WASD routing must be fast and responsive
- **Smart Caching:** Coordinate caches to prevent duplication
- **Memory Efficiency:** Shared resources where possible

---

## Next Steps - REVISED

After Phase 2C completion:
1. **Phase 2C Architecture Validation:** Static analysis validation
2. **Phase 2D Migration Strategy:** Implement backwards compatibility
3. **Phase 2E Complete Integration:** Full system integration
4. **Performance Testing:** Validate coordinated system performance

The Phase 2C implementation will create the critical coordination layer that ties the data and mirror layer integrations together into a cohesive ECS dual-layer system, enabling proper WASD routing and layer management without modifying gameStore.ts.