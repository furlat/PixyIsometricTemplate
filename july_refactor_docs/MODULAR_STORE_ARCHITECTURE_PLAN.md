# Modular Store Architecture Plan

## Overview
This document outlines the architectural plan for replacing the monolithic `gameStore.ts` with a clean, modular store architecture that properly separates ECS Data Layer, ECS Mirror Layer, and coordination concerns.

## Current Problem Analysis

### Monolithic Store Issues
- **Single File Complexity**: 1400+ lines in `gameStore.ts`
- **Mixed Concerns**: ECS, legacy, and coordination code intermingled
- **Type Contamination**: Legacy types mixed with new ECS types
- **Maintenance Nightmare**: Hard to understand, modify, and test
- **Performance Impact**: Large bundle size, difficult tree-shaking

### Legacy vs ECS Conflict
- Legacy geometry objects lack proper ECS structure
- TypeScript errors from type mismatches
- Difficult to migrate incrementally
- No clear separation of responsibilities

## Proposed Modular Architecture

### 1. Store Module Structure
```
app/src/store/
├── index.ts                    # Main store exports and composition
├── ecs-data-layer-store.ts     # ECS Data Layer state and actions
├── ecs-mirror-layer-store.ts   # ECS Mirror Layer state and actions
├── ecs-coordination-store.ts   # ECS coordination and WASD routing
├── legacy-geometry-store.ts    # Legacy geometry compatibility layer
├── ui-state-store.ts          # UI-specific state management
└── store-composition.ts        # Store composition utilities
```

### 2. Individual Store Responsibilities

#### ECS Data Layer Store (`ecs-data-layer-store.ts`)
**Purpose**: Pure ECS data management with no rendering concerns
- **State**: Object storage, viewport sampling window, performance metrics
- **Actions**: CRUD operations, viewport sampling, object queries
- **Type Safety**: Uses only ECS types from `types/ecs-data-layer.ts`
- **Performance**: Optimized for large-scale object management

#### ECS Mirror Layer Store (`ecs-mirror-layer-store.ts`)
**Purpose**: Texture caching and camera viewport management
- **State**: Texture cache, camera viewport, render settings
- **Actions**: Texture CRUD, camera movement, viewport updates
- **Type Safety**: Uses only ECS types from `types/ecs-mirror-layer.ts`
- **Performance**: Optimized for texture memory management

#### ECS Coordination Store (`ecs-coordination-store.ts`)
**Purpose**: Coordinate between Data Layer and Mirror Layer
- **State**: Zoom level, WASD routing, layer visibility
- **Actions**: Zoom control, movement routing, layer coordination
- **Type Safety**: Uses coordination types from `types/ecs-coordinates.ts`
- **Logic**: Implements dual-layer ECS architecture rules

#### Legacy Geometry Store (`legacy-geometry-store.ts`)
**Purpose**: Backwards compatibility during migration
- **State**: Legacy geometry objects, compatibility mappings
- **Actions**: Legacy CRUD operations, migration utilities
- **Type Safety**: Uses legacy types with migration adapters
- **Lifecycle**: Temporary during migration, then removed

#### UI State Store (`ui-state-store.ts`)
**Purpose**: UI-specific state management
- **State**: Panel visibility, selection state, drawing modes
- **Actions**: UI state updates, panel toggles, mode changes
- **Type Safety**: Uses UI-specific types
- **Separation**: No business logic, only presentation state

### 3. Store Composition Pattern

#### Composition Strategy
```typescript
// Store composition with clear boundaries
export const gameStore = {
  // ECS Stores (Phase 2)
  ecsDataLayer: ecsDataLayerStore,
  ecsMirrorLayer: ecsMirrorLayerStore,
  ecsCoordination: ecsCoordinationStore,
  
  // Legacy Store (Migration Phase)
  legacyGeometry: legacyGeometryStore,
  
  // UI Store (Independent)
  uiState: uiStateStore
}
```

#### Store Communication Rules
- **Data Layer ↔ Mirror Layer**: Only through Coordination Store
- **ECS Stores ↔ Legacy Store**: Through migration adapters
- **UI Store ↔ Business Stores**: Through well-defined interfaces
- **No Direct Communication**: Stores cannot directly import each other

### 4. Type Safety Strategy

#### Type Isolation
- Each store uses only its specific types
- No type contamination between stores
- Migration adapters handle type conversions
- Clear interface boundaries

#### Type Import Rules
```typescript
// ✅ Correct: Store-specific types only
import type { ECSDataLayerStore } from '../types/ecs-data-layer'

// ❌ Incorrect: Cross-store type contamination
import type { ECSMirrorLayerStore } from '../types/ecs-mirror-layer'
```

### 5. Performance Architecture

#### Memory Management
- **ECS Data Layer**: Efficient object storage with spatial indexing
- **ECS Mirror Layer**: Texture cache with LRU eviction
- **Coordination Store**: Minimal state, efficient routing
- **Legacy Store**: Temporary, optimized for migration

#### Bundle Optimization
- **Tree Shaking**: Each store can be tree-shaken independently
- **Code Splitting**: Stores can be loaded on demand
- **Lazy Loading**: Legacy store only loaded when needed

### 6. Migration Strategy

#### Phase 2A: ECS Data Layer Store
- Create `ecs-data-layer-store.ts`
- Implement ECS Data Layer state and actions
- Add to composition without disrupting legacy code
- Validate against ECS Data Layer requirements

#### Phase 2B: ECS Mirror Layer Store
- Create `ecs-mirror-layer-store.ts`
- Implement ECS Mirror Layer state and actions
- Add texture caching and camera viewport management
- Validate against ECS Mirror Layer requirements

#### Phase 2C: ECS Coordination Store
- Create `ecs-coordination-store.ts`
- Implement dual-layer coordination logic
- Add WASD routing and zoom management
- Validate against ECS coordination requirements

#### Phase 2D: Legacy Compatibility
- Create `legacy-geometry-store.ts`
- Add migration adapters and compatibility layers
- Ensure backwards compatibility during transition
- Plan legacy code removal strategy

#### Phase 2E: Store Composition
- Create `store-composition.ts`
- Integrate all stores into cohesive system
- Update main `gameStore.ts` to use composition
- Validate complete integration

### 7. Testing Strategy

#### Unit Testing
- Each store tested independently
- Mock dependencies for isolation
- Test ECS compliance and performance
- Validate type safety

#### Integration Testing
- Test store composition
- Validate store communication
- Test migration scenarios
- Performance benchmarking

#### Validation Criteria
- **ECS Compliance**: Follows ECS architecture principles
- **Type Safety**: No type contamination
- **Performance**: Meets performance requirements
- **Maintainability**: Easy to understand and modify

### 8. Implementation Guidelines

#### Code Quality Standards
- **Single Responsibility**: Each store has one clear purpose
- **Interface Segregation**: Small, focused interfaces
- **Dependency Inversion**: Stores depend on abstractions
- **Open/Closed**: Open for extension, closed for modification

#### Performance Requirements
- **Memory Usage**: No memory leaks, efficient garbage collection
- **Bundle Size**: Minimal impact on bundle size
- **Runtime Performance**: No performance degradation
- **Scalability**: Handles large-scale geometry efficiently

#### Developer Experience
- **Clear Documentation**: Each store well-documented
- **Type Safety**: Full TypeScript support
- **Debugging**: Easy to debug and inspect
- **Testing**: Comprehensive test coverage

## Benefits of Modular Architecture

### 1. Separation of Concerns
- Clear boundaries between different responsibilities
- Easy to understand and modify individual components
- Reduced coupling between different parts of the system

### 2. Type Safety
- No type contamination between stores
- Clear type boundaries and interfaces
- Better IDE support and error detection

### 3. Performance
- Tree-shaking friendly
- Efficient memory management
- Optimized for specific use cases

### 4. Maintainability
- Smaller, focused modules
- Easy to test and debug
- Clear migration path

### 5. Scalability
- Easy to add new stores
- Flexible composition patterns
- Supports large-scale applications

## Next Steps

1. **Phase 2A**: Implement ECS Data Layer Store
2. **Phase 2B**: Implement ECS Mirror Layer Store
3. **Phase 2C**: Implement ECS Coordination Store
4. **Phase 2D**: Implement Legacy Compatibility Store
5. **Phase 2E**: Implement Store Composition

Each phase includes implementation, validation, and testing to ensure the modular architecture meets all requirements.