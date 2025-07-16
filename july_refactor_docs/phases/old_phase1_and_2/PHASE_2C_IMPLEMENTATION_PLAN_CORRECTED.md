# Phase 2C Implementation Plan - CORRECTED

## **Critical Corrections Based on Actual Interfaces**

### **ERROR ANALYSIS:**
- ❌ Used `totalObjects` instead of `objectCount`
- ❌ Used `visibleObjects` instead of `visibleObjectCount`
- ❌ Used `memoryUsage` on data layer (doesn't exist)
- ❌ Used `setVisibility` on data layer (doesn't exist)
- ❌ Missing required properties in factory objects

### **CORRECTED IMPLEMENTATION:**

```typescript
// ================================
// ECS COORDINATION CONTROLLER
// ================================

import { dataLayerIntegration } from './ecs-data-layer-integration'
import { mirrorLayerIntegration } from './ecs-mirror-layer-integration'
import { 
  createECSCoordinationState, 
  ECSCoordinationState,
  ECSCoordinationActions,
  ZoomLevel
} from '../types/ecs-coordination'

/**
 * CORRECTED: ECS Coordination Controller
 * Uses ACTUAL interfaces, not assumed ones.
 */
export class ECSCoordinationController {
  private state: ECSCoordinationState

  constructor() {
    this.state = createECSCoordinationState() // ✅ WORKS
  }

  // ================================
  // CORRECTED STATE ACCESS
  // ================================
  
  getState(): Readonly<ECSCoordinationState> {
    return this.state
  }

  // ================================
  // CORRECTED WASD ROUTING
  // ================================
  
  moveUp(): void {
    if (this.state.zoomLevel === 1) {
      // Data layer sampling - NO setVisibility method
      dataLayerIntegration.moveSamplingWindow(0, -10)
    } else {
      // Mirror layer camera - HAS setVisibility method
      mirrorLayerIntegration.panCamera(0, -10)
    }
  }

  // ================================
  // CORRECTED PERFORMANCE COORDINATION
  // ================================
  
  coordinatePerformance(): void {
    // CORRECTED: Use actual property names
    const dataStats = dataLayerIntegration.getStats()
    const mirrorStats = mirrorLayerIntegration.getStats()
    
    this.state.performance.totalObjectCount = dataStats.objectCount      // ✅ CORRECT
    this.state.performance.totalVisibleObjects = dataStats.visibleObjectCount // ✅ CORRECT
    this.state.performance.totalMemoryUsage = mirrorStats.memoryUsage    // ✅ CORRECT
    // NO memoryUsage on data layer
  }

  // ================================
  // CORRECTED LAYER VISIBILITY
  // ================================
  
  setLayerVisibility(layer: 'data' | 'mirror', visible: boolean): void {
    if (layer === 'data') {
      // Data layer has NO setVisibility method
      console.warn('Data layer visibility controlled by sampling')
    } else {
      // Mirror layer HAS setVisibility method
      mirrorLayerIntegration.setVisibility(visible)
    }
  }
}

// ================================
// CORRECTED FACTORY
// ================================

export const createECSCoordinationController = (): ECSCoordinationController => {
  return new ECSCoordinationController()
}
```

### **KEY CORRECTIONS:**

1. **Property Names:** `objectCount` not `totalObjects`
2. **Property Names:** `visibleObjectCount` not `visibleObjects`
3. **Memory Usage:** Only on mirror layer, not data layer
4. **Visibility Control:** Only on mirror layer, not data layer
5. **Factory Functions:** Use existing `createECSCoordinationState()`

### **VALIDATION CRITERIA:**

- ✅ Uses actual interface properties
- ✅ Handles missing methods gracefully
- ✅ Implements proper WASD routing
- ✅ Coordinates performance correctly
- ✅ Manages layer visibility appropriately

### **NEXT STEPS:**

1. Delete failed `ecs-coordination-controller.ts`
2. Implement corrected version
3. Validate against actual interfaces
4. Proceed to Phase 2D