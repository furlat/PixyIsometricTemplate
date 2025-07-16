# ECS Recovery Plan
## Clean Implementation Path After gameStore.ts Mistake

### SITUATION ASSESSMENT
- ✅ **Good**: gameStore.ts reverted to clean state via git
- ✅ **Good**: ECS Data Layer Store exists as separate module
- ✅ **Good**: ECS Mirror Layer Store exists as separate module
- ❌ **Problem**: No integration layer exists
- ❌ **Problem**: No UI hooks exist
- ❌ **Problem**: No coordination between stores

### RECOVERY STRATEGY
**Principle**: gameStore.ts is READ-ONLY reference. Never modify it.

---

## Phase 1: Create Integration Architecture

### Step 1: ECS Integration Controller
Create a master integration controller that coordinates all ECS stores:

**File**: `app/src/store/ecs-integration-controller.ts`
```typescript
import { createECSDataLayerStore } from './ecs-data-layer-store'
import { createECSMirrorLayerStore } from './ecs-mirror-layer-store'

export class ECSIntegrationController {
  private dataLayerStore = createECSDataLayerStore()
  private mirrorLayerStore = createECSMirrorLayerStore()
  
  // Public API for components
  getDataLayer() { return this.dataLayerStore }
  getMirrorLayer() { return this.mirrorLayerStore }
  
  // Coordination methods
  syncLayers() { /* coordinate between stores */ }
  handleZoomChange(level: number) { /* coordinate zoom */ }
  handleWASDMovement(delta: {x: number, y: number}) { /* coordinate movement */ }
}
```

### Step 2: ECS React Hooks
Create hooks for UI components:

**File**: `app/src/store/hooks/useECSSystem.ts`
```typescript
import { useRef, useEffect, useState } from 'react'
import { ECSIntegrationController } from '../ecs-integration-controller'

export const useECSSystem = () => {
  const controller = useRef(new ECSIntegrationController())
  
  return {
    dataLayer: controller.current.getDataLayer(),
    mirrorLayer: controller.current.getMirrorLayer(),
    controller: controller.current
  }
}
```

### Step 3: ECS Service Layer
Create service layer for renderer integration:

**File**: `app/src/store/ecs-service-layer.ts`
```typescript
export class ECSServiceLayer {
  private controller: ECSIntegrationController
  
  constructor(controller: ECSIntegrationController) {
    this.controller = controller
  }
  
  // Methods for renderer integration
  sampleDataLayer(viewport: ViewportBounds) { /* ... */ }
  updateMirrorLayer(textures: any) { /* ... */ }
  coordinateMovement(input: any) { /* ... */ }
}
```

---

## Phase 2: Create UI Integration

### Step 1: ECS Store Panel Component
Create new panel specifically for ECS system:

**File**: `app/src/ui/ECSStorePanel.ts`
```typescript
import { useECSSystem } from '../store/hooks/useECSSystem'

export class ECSStorePanel {
  private ecsSystem = useECSSystem()
  
  render() {
    // Show ECS-specific debug info
    // - Data layer statistics
    // - Mirror layer status
    // - Coordination state
  }
}
```

### Step 2: ECS Debug Hooks
Create hooks for debugging:

**File**: `app/src/store/hooks/useECSDebug.ts`
```typescript
export const useECSDebug = () => {
  const { controller } = useECSSystem()
  
  return {
    getDataLayerStats: () => controller.getDataLayer().getStats(),
    getMirrorLayerStats: () => controller.getMirrorLayer().getStats(),
    getCoordinationState: () => controller.getCoordinationState()
  }
}
```

---

## Phase 3: Create Renderer Integration

### Step 1: ECS Renderer Adapter
Create adapter for existing renderer:

**File**: `app/src/game/ECSRendererAdapter.ts`
```typescript
import { ECSServiceLayer } from '../store/ecs-service-layer'

export class ECSRendererAdapter {
  private ecsService: ECSServiceLayer
  
  // Adapter methods to bridge ECS and existing renderer
  integrateWithGeometryRenderer(renderer: GeometryRenderer) { /* ... */ }
  integrateWithMirrorRenderer(renderer: MirrorLayerRenderer) { /* ... */ }
}
```

### Step 2: ECS Input Handler
Create input handler for ECS system:

**File**: `app/src/game/ECSInputHandler.ts`
```typescript
export class ECSInputHandler {
  private ecsService: ECSServiceLayer
  
  handleWASDMovement(keys: any) {
    // Route to appropriate layer based on zoom
    this.ecsService.coordinateMovement(keys)
  }
  
  handleZoomChange(level: number) {
    this.ecsService.controller.handleZoomChange(level)
  }
}
```

---

## Phase 4: Implementation Files to Create

### Store Integration Files
1. `app/src/store/ecs-integration-controller.ts` - Master controller
2. `app/src/store/ecs-service-layer.ts` - Service layer for renderers
3. `app/src/store/ecs-coordination-state.ts` - Coordination state management

### React Hooks Files
1. `app/src/store/hooks/useECSSystem.ts` - Main ECS system hook
2. `app/src/store/hooks/useECSDebug.ts` - Debug information hooks
3. `app/src/store/hooks/useECSDataLayer.ts` - Data layer specific hooks
4. `app/src/store/hooks/useECSMirrorLayer.ts` - Mirror layer specific hooks

### UI Integration Files
1. `app/src/ui/ECSStorePanel.ts` - ECS-specific debug panel
2. `app/src/ui/ECSDebugControls.ts` - Debug controls for ECS
3. `app/src/ui/ECSLayerToggles.ts` - Layer visibility controls

### Renderer Integration Files
1. `app/src/game/ECSRendererAdapter.ts` - Adapter for existing renderer
2. `app/src/game/ECSInputHandler.ts` - Input handling for ECS
3. `app/src/game/ECSCoordinationManager.ts` - Coordinate between systems

---

## Phase 5: Integration Strategy

### Step 1: Gradual Integration
- Start with ECS controller and hooks
- Add debug UI to see it working
- Integrate with renderer step by step
- Test each integration point

### Step 2: Component Migration
- Create ECS-powered components alongside existing ones
- Allow switching between legacy and ECS modes
- Gradually replace legacy components

### Step 3: Full System Coordination
- Implement WASD routing based on zoom
- Coordinate data layer sampling
- Implement mirror layer texture management

---

## Implementation Priority

### Phase 1 (Immediate)
1. Create ECS Integration Controller
2. Create basic React hooks
3. Create ECS Store Panel for debugging

### Phase 2 (Next)
1. Create service layer for renderer integration
2. Create input handler for ECS system
3. Add debug controls to UI

### Phase 3 (Final)
1. Create renderer adapters
2. Implement full coordination
3. Add layer visibility controls

---

## Success Criteria

### ✅ Clean Architecture
- gameStore.ts remains untouched
- All ECS code is modular and separate
- Clean interfaces between systems

### ✅ Functional Integration
- ECS stores work independently
- UI can interact with ECS system
- Renderer can use ECS data

### ✅ Debugging Support
- Full visibility into ECS state
- Debug controls for testing
- Clear error handling

### ✅ Future Ready
- Can gradually replace legacy system
- Modular architecture supports expansion
- Type-safe throughout

This recovery plan provides a clear path forward without touching gameStore.ts while creating a clean, modular ECS integration.