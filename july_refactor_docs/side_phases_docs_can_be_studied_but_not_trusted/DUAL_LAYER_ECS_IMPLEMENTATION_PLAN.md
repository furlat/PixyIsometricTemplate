# Dual-Layer ECS System: Step-by-Step Implementation Plan

## Executive Summary

This plan addresses the critical coordinate system inconsistency in the dual-layer ECS camera viewport system. The approach is designed to uncover and resolve deeper architectural issues as we implement the fix.

## Problem Statement

### Current Issue
- **Legacy Path A (Active)**: [`BackgroundGridRenderer.ts:338-350`](app/src/game/BackgroundGridRenderer.ts) directly mutates gameStore
- **ECS Path B (Inactive)**: [`gameStore.ts:268-291`](app/src/store/gameStore.ts) contains proper ECS logic but is never called

### Expected Complications
As we implement the fix, we expect to discover:
1. **Additional coordinate conversion inconsistencies** in other components
2. **Layer rendering dependencies** that rely on the current broken system
3. **Event handling chains** that expect direct gameStore mutations
4. **UI synchronization issues** when switching to reactive coordinate updates

## Phase 1: Foundation Analysis & Preparation

### Step 1.1: Deep Coordinate Flow Analysis
**Goal**: Map every coordinate update path in the system
**Time**: 2-3 hours

**Tasks**:
1. **Audit all coordinate mutations**:
   ```bash
   # Search for all direct gameStore.mouse mutations
   grep -r "gameStore\.mouse\." app/src/ --include="*.ts"
   grep -r "mouse\..*=" app/src/ --include="*.ts"
   ```

2. **Document coordinate conversion functions**:
   - [`CoordinateHelper.ts`](app/src/game/CoordinateHelper.ts) - all static methods
   - [`CoordinateCalculations.ts`](app/src/game/CoordinateCalculations.ts) - conversion logic
   - [`GeometryVertexCalculator.ts`](app/src/game/GeometryVertexCalculator.ts) - vertex calculations

3. **Identify coordinate consumers**:
   - UI panels that display coordinates
   - Geometry renderers that use mouse position
   - Input handlers that depend on coordinate values

**Expected Discoveries**:
- More direct mutations beyond BackgroundGridRenderer
- Inconsistent coordinate spaces across different components
- Missing coordinate transformations in some paths

### Step 1.2: Create Coordinate System Test Suite
**Goal**: Establish validation for coordinate consistency
**Time**: 1-2 hours

**Tasks**:
1. **Create coordinate validation helpers**:
   ```typescript
   // Test utilities for coordinate validation
   interface CoordinateTestCase {
     screenPos: { x: number; y: number }
     expectedVertex: { x: number; y: number }
     expectedPixeloid: { x: number; y: number }
     zoomLevel: number
   }
   ```

2. **Implement coordinate consistency checks**:
   ```typescript
   function validateCoordinateConsistency(testCase: CoordinateTestCase): boolean {
     // Test both Path A and Path B produce same results
     const pathAResult = simulatePathA(testCase.screenPos, testCase.zoomLevel)
     const pathBResult = simulatePathB(testCase.screenPos, testCase.zoomLevel)
     return compareCoordinates(pathAResult, pathBResult)
   }
   ```

## Phase 2: Incremental Refactoring

### Step 2.1: Introduce Coordinate Update Abstraction
**Goal**: Create a single entry point for all coordinate updates
**Time**: 2-3 hours

**Tasks**:
1. **Create CoordinateUpdateManager**:
   ```typescript
   // New file: app/src/game/CoordinateUpdateManager.ts
   export class CoordinateUpdateManager {
     private static instance: CoordinateUpdateManager | null = null
     
     static getInstance(): CoordinateUpdateManager {
       if (!this.instance) {
         this.instance = new CoordinateUpdateManager()
       }
       return this.instance
     }
     
     updateMouseCoordinates(screenPos: { x: number; y: number }): void {
       // Route to appropriate update method based on system state
       if (this.shouldUseECSPath()) {
         this.updateViaECSPath(screenPos)
       } else {
         this.updateViaLegacyPath(screenPos)
       }
     }
     
     private shouldUseECSPath(): boolean {
       // Feature flag for gradual migration
       return gameStore.system.useECSCoordinates ?? false
     }
   }
   ```

2. **Add feature flag to gameStore**:
   ```typescript
   // In gameStore.ts
   system: {
     useECSCoordinates: false, // Feature flag for migration
     coordinateUpdateSource: 'legacy' as 'legacy' | 'ecs'
   }
   ```

### Step 2.2: Refactor BackgroundGridRenderer
**Goal**: Remove direct gameStore mutations
**Time**: 1-2 hours

**Tasks**:
1. **Modify handleMeshPointerEvent method**:
   ```typescript
   // In BackgroundGridRenderer.ts:327-356
   private handleMeshPointerEvent(event: any, eventType: 'move' | 'down' | 'up'): void {
     if (!this.mesh) return
     
     const localPos = event.getLocalPosition(this.mesh)
     const screenPos = this.convertLocalToScreen(localPos)
     
     // ❌ Remove direct mutations:
     // gameStore.mouse.vertex_position.x = vertexX
     // gameStore.mouse.vertex_position.y = vertexY
     // gameStore.mouse.pixeloid_position.x = pixeloidCoord.x
     // gameStore.mouse.pixeloid_position.y = pixeloidCoord.y
     
     // ✅ Use coordinate update manager:
     CoordinateUpdateManager.getInstance().updateMouseCoordinates(screenPos)
     
     // Continue with event delegation
     if ((globalThis as any).inputManager) {
       (globalThis as any).inputManager.handleMeshEvent(eventType, screenPos, event)
     }
   }
   ```

2. **Add screen coordinate conversion**:
   ```typescript
   private convertLocalToScreen(localPos: { x: number; y: number }): { x: number; y: number } {
     // Convert mesh-local coordinates back to screen coordinates
     const scale = gameStore.cameraViewport.zoom_factor
     return {
       x: localPos.x * scale,
       y: localPos.y * scale
     }
   }
   ```

### Step 2.3: Enable ECS Path Gradually
**Goal**: Test ECS coordinate system without breaking existing functionality
**Time**: 2-3 hours

**Tasks**:
1. **Implement A/B testing infrastructure**:
   ```typescript
   // In CoordinateUpdateManager.ts
   private updateViaECSPath(screenPos: { x: number; y: number }): void {
     // Call the existing but unused ECS method
     updateGameStore.updateMousePositions(screenPos)
     
     // Log for debugging
     console.log('ECS Coordinate Update:', {
       screen: screenPos,
       vertex: gameStore.mouse.vertex_position,
       pixeloid: gameStore.mouse.pixeloid_position
     })
   }
   
   private updateViaLegacyPath(screenPos: { x: number; y: number }): void {
     // Replicate the old direct mutation logic
     // ... existing logic from BackgroundGridRenderer
   }
   ```

2. **Add validation logging**:
   ```typescript
   updateMouseCoordinates(screenPos: { x: number; y: number }): void {
     // Always run both paths for comparison
     const legacyResult = this.simulateLegacyPath(screenPos)
     const ecsResult = this.simulateECSPath(screenPos)
     
     // Log differences
     if (!this.coordinatesMatch(legacyResult, ecsResult)) {
       console.warn('Coordinate mismatch detected:', {
         legacy: legacyResult,
         ecs: ecsResult,
         screen: screenPos
       })
     }
     
     // Use active path
     if (this.shouldUseECSPath()) {
       this.updateViaECSPath(screenPos)
     } else {
       this.updateViaLegacyPath(screenPos)
     }
   }
   ```

## Phase 3: Deep System Integration

### Step 3.1: Fix Coordinate Conversion Inconsistencies
**Goal**: Resolve differences between legacy and ECS coordinate calculations
**Time**: 3-4 hours

**Expected Issues**:
1. **Screen-to-vertex conversion differences**:
   - Legacy: Uses mesh-local coordinates directly
   - ECS: Uses screen coordinates with zoom factor division

2. **Vertex-to-pixeloid conversion differences**:
   - Legacy: Uses CoordinateHelper.vertexToPixeloid
   - ECS: Uses different offset calculation

**Tasks**:
1. **Standardize coordinate conversion**:
   ```typescript
   // In gameStore.ts - fix updateMousePositions
   updateMousePositions: (screenPos: { x: number, y: number }) => {
     const scale = gameStore.cameraViewport.zoom_factor
     
     // ✅ Fix vertex conversion to match legacy behavior
     const vertexX = Math.floor(screenPos.x / scale)
     const vertexY = Math.floor(screenPos.y / scale)
     
     // ✅ Use same coordinate helper as legacy
     const offset = CoordinateHelper.getCurrentOffset()
     const pixeloidCoord = CoordinateHelper.vertexToPixeloid(
       createVertexCoordinate(vertexX, vertexY),
       offset
     )
     
     // Update store with consistent values
     gameStore.mouse.screen_position = screenPos
     gameStore.mouse.vertex_position = { x: vertexX, y: vertexY }
     gameStore.mouse.pixeloid_position = pixeloidCoord
   }
   ```

2. **Create coordinate validation suite**:
   ```typescript
   // Test coordinate consistency across zoom levels
   const testCases: CoordinateTestCase[] = [
     { screenPos: { x: 100, y: 100 }, zoomLevel: 1 },
     { screenPos: { x: 200, y: 150 }, zoomLevel: 2 },
     { screenPos: { x: 300, y: 200 }, zoomLevel: 5 },
     { screenPos: { x: 400, y: 250 }, zoomLevel: 10 }
   ]
   ```

### Step 3.2: Integrate with Input System
**Goal**: Ensure InputManager works with ECS coordinate system
**Time**: 2-3 hours

**Tasks**:
1. **Update InputManager to use CoordinateUpdateManager**:
   ```typescript
   // In InputManager.ts
   private handleMouseEvent(event: PointerEvent): void {
     const screenPos = {
       x: event.clientX,
       y: event.clientY
     }
     
     // Use coordinate update manager instead of direct calls
     CoordinateUpdateManager.getInstance().updateMouseCoordinates(screenPos)
     
     // Continue with existing logic
   }
   ```

2. **Remove redundant coordinate updates**:
   - Search for other places that call updateMousePositions
   - Ensure single source of truth for coordinate updates

### Step 3.3: Update UI Synchronization
**Goal**: Ensure UI panels display consistent coordinates
**Time**: 1-2 hours

**Tasks**:
1. **Verify UI reactivity**:
   ```typescript
   // In StorePanel.ts - ensure these are reactive
   updateElement(this.elements, 'mouse-position',
     formatCoordinates(gameStore.mouse.screen_position.x, gameStore.mouse.screen_position.y, 0)
   )
   ```

2. **Add coordinate source indicator**:
   ```typescript
   // Show which coordinate system is active
   updateElement(this.elements, 'coordinate-source',
     gameStore.system.coordinateUpdateSource
   )
   ```

## Phase 4: Complete ECS System Implementation

### Step 4.1: Implement Independent Geometry Sampling
**Goal**: Separate geometry sampling from camera viewport
**Time**: 3-4 hours

**Tasks**:
1. **Add geometrySamplingPosition to gameStore**:
   ```typescript
   // In gameStore.ts
   geometrySampling: {
     position: { x: 0, y: 0 },
     windowSize: { width: 100, height: 100 }
   }
   ```

2. **Update GeometryRenderer to use sampling position**:
   ```typescript
   // In GeometryRenderer.ts
   const samplingWindow = calculateSamplingWindow(
     gameStore.geometrySampling.position.x,  // ✅ Use sampling position
     gameStore.geometrySampling.position.y,  // ✅ Use sampling position
     gameStore.geometrySampling.windowSize
   )
   ```

### Step 4.2: Implement Zoom-Dependent WASD Movement
**Goal**: Route WASD to different systems based on zoom level
**Time**: 2-3 hours

**Tasks**:
1. **Add movement routing logic**:
   ```typescript
   // In InputManager.ts
   private handleWASDMovement(direction: 'w' | 'a' | 's' | 'd'): void {
     const dx = this.getMovementDelta(direction).x
     const dy = this.getMovementDelta(direction).y
     
     if (gameStore.cameraViewport.zoom_factor === 1) {
       // Move geometry sampling window
       updateGameStore.updateGeometrySamplingPosition(
         gameStore.geometrySampling.position.x + dx,
         gameStore.geometrySampling.position.y + dy
       )
     } else {
       // Move camera viewport
       updateGameStore.updateCameraViewport({
         x: gameStore.cameraViewport.x + dx,
         y: gameStore.cameraViewport.y + dy
       })
     }
   }
   ```

### Step 4.3: Implement Layer Visibility Switching
**Goal**: Show/hide layers based on zoom level
**Time**: 2-3 hours

**Tasks**:
1. **Add layer visibility controller**:
   ```typescript
   // In LayeredInfiniteCanvas.ts
   private updateLayerVisibility(): void {
     const zoomLevel = gameStore.cameraViewport.zoom_factor
     
     if (zoomLevel === 1) {
       this.showLayer('geometry')
       this.showLayer('mirror-complete')
       this.hideLayer('mirror-viewport')
     } else {
       this.hideLayer('geometry')
       this.hideLayer('mirror-complete')
       this.showLayer('mirror-viewport')
     }
   }
   ```

## Phase 5: Testing & Validation

### Step 5.1: Comprehensive Testing
**Goal**: Verify system works correctly across all zoom levels
**Time**: 2-3 hours

**Testing Matrix**:
```
Zoom Level | WASD Target | Layer Visibility | Coordinate System
1          | Geometry    | Both            | ECS
2          | Mirror      | Mirror Only     | ECS
5          | Mirror      | Mirror Only     | ECS
10         | Mirror      | Mirror Only     | ECS
```

### Step 5.2: Performance Validation
**Goal**: Ensure ECS system maintains performance improvements
**Time**: 1-2 hours

**Metrics to Track**:
- Memory usage at different zoom levels
- Frame rate during coordinate updates
- Layer switching performance

## Implementation Timeline

### Week 1: Foundation (Days 1-2)
- Phase 1: Analysis & Preparation
- Phase 2: Incremental Refactoring (Steps 2.1-2.2)

### Week 2: Core Implementation (Days 3-4)
- Phase 2: Complete incremental refactoring (Step 2.3)
- Phase 3: Deep system integration (Steps 3.1-3.2)

### Week 3: Full ECS Implementation (Days 5-6)
- Phase 3: Complete integration (Step 3.3)
- Phase 4: Complete ECS system implementation

### Week 4: Testing & Refinement (Day 7)
- Phase 5: Testing & validation
- Bug fixes and optimizations

## Risk Mitigation

### High-Risk Areas
1. **Coordinate conversion edge cases** - Test extensively at different zoom levels
2. **Event handling chain breakage** - Maintain backward compatibility during migration
3. **UI synchronization issues** - Implement gradual rollout with rollback capability
4. **Performance regressions** - Monitor metrics throughout implementation

### Rollback Strategy
- Feature flags allow instant rollback to legacy system
- Coordinate update manager provides abstraction layer
- A/B testing infrastructure enables gradual migration

## Success Criteria

### Functional Requirements
- [ ] Mouse coordinates consistent across all zoom levels
- [ ] WASD movement works correctly at zoom level 1 (geometry) and 2+ (mirror)
- [ ] Layer visibility switches automatically based on zoom
- [ ] UI panels display accurate coordinate information

### Performance Requirements
- [ ] Memory usage remains O(1) relative to zoom level
- [ ] No performance regression in coordinate updates
- [ ] Layer switching happens without frame drops

### System Requirements
- [ ] Single source of truth for coordinate updates
- [ ] ECS system fully integrated and functional
- [ ] Legacy system completely removed
- [ ] Code maintainability improved

This implementation plan provides a structured approach to resolving the coordinate system inconsistency while uncovering and addressing deeper architectural issues as they arise.