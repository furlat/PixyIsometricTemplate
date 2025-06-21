# StoreExplorer Implementation Plan

## Overview

The StoreExplorer is a new UI component that will provide a comprehensive view of all geometric objects in the store with interactive features for navigation and object management.

## Requirements Analysis

### Core Features
1. **Object List with Previews**: Display all geometric objects with small visual previews
2. **Summary Statistics**: Show position and shape information for each object
3. **Scrollable Interface**: Handle large numbers of objects efficiently
4. **Right-click Context**: Open object details panel (reuse existing ObjectEditPanel)
5. **Double-click Navigation**: Teleport viewport to center object anchor

## Technical Architecture

### Component Structure
```
StoreExplorer.ts
├── PreviewGenerator.ts (new utility)
├── StoreExplorerItem.ts (individual list item)
└── Integration with existing systems:
    ├── ObjectEditPanel.ts (reuse for details)
    ├── CoordinateHelper.ts (for viewport teleportation)
    └── GeometryRenderer.ts (for preview generation)
```

## Implementation Strategy

### ⚠️ CRITICAL: Feedback Loop Prevention

**Problem**: If the main rendering system subscribes to texture references in the store, it would create an infinite loop:
1. `GeometryRenderer` renders objects →
2. Textures stored in `gameStore` →
3. `GeometryRenderer` detects store change →
4. Re-renders → Loop infinitely

**Solution**: **STRICT ONE-WAY DATA FLOW**

```
🔄 Main Rendering Flow (UNCHANGED):
   gameStore.geometry.objects → GeometryRenderer → Canvas

📸 Texture Capture Flow (NEW, ONE-WAY):
   GeometryRenderer.objectContainers → TextureRegistry → Store
   
👀 Preview Consumption (NEW, READ-ONLY):
   Store.textureRegistry → StoreExplorer → HTML Preview
```

**Architectural Safeguards**:
1. `GeometryRenderer` **NEVER** subscribes to `textureRegistry`
2. `GeometryRenderer` **ONLY** subscribes to `geometry.objects` (as it does now)
3. `TextureRegistry` is **WRITE-ONLY** from rendering perspective
4. `StoreExplorer` is **READ-ONLY** from store perspective
5. Texture capture happens **AFTER** rendering, not during

### 1. Texture Registry System

**Approach**: Post-rendering texture capture with one-way data flow

**Technical Details**:
- **Post-Render Capture**: After `GeometryRenderer` completes rendering, capture Graphics references
- **Texture Registry**: Store in separate `textureRegistry` section of store (isolated from main geometry)
- **One-Way Flow**: `GeometryRenderer` → `TextureCapture` → `Store` → `StoreExplorer`
- **No Subscriptions**: Main renderer never listens to texture registry changes

**TextureRegistry.ts**:
```typescript
class TextureRegistry {
  private app: Application
  private textureCache: Map<string, RenderTexture> = new Map()
  
  constructor(app: Application) {
    this.app = app
    // CRITICAL: Does NOT subscribe to store changes
    // Only provides write methods for external callers
  }
  
  captureObjectTexture(objectId: string, graphics: Graphics): void {
    // Called externally AFTER rendering is complete
    // Extract RenderTexture from Graphics
    // Store in gameStore.textureRegistry (one-way write)
    // Convert to base64 for HTML preview
  }
  
  // READ-ONLY methods for consumers
  getObjectTexture(objectId: string): RenderTexture | null
  getObjectPreview(objectId: string): string | null
}
```

**Integration Point - Post-Render Hook**:
```typescript
// In GeometryRenderer.ts - AFTER rendering loop completes
public render(corners: ViewportCorners, pixeloidScale: number): void {
  // ... existing rendering logic (UNCHANGED) ...
  
  // NEW: Post-render texture capture (external call)
  // This is called by LayeredInfiniteCanvas, not internally
}

// In LayeredInfiniteCanvas.ts - orchestrator calls texture capture
private renderGeometryLayer(corners: ViewportCorners, pixeloidScale: number): void {
  this.geometryRenderer.render(corners, pixeloidScale) // Normal rendering
  
  // AFTER rendering completes, capture textures (one-way)
  this.captureObjectTextures() // New method
}
```

### 2. StoreExplorer Component

**UI Structure** (following existing panel patterns):
```html
<div id="store-explorer-panel" class="fixed ... similar to other panels">
  <div class="header">Store Explorer</div>
  <div class="stats-summary">
    <!-- Object count, types breakdown -->
  </div>
  <div class="object-list scrollable">
    <!-- Dynamic list items -->
  </div>
</div>
```

**StoreExplorer.ts**:
- Subscribe to `gameStore.geometry.objects` changes
- Generate/update list items when objects change
- Handle right-click and double-click events
- Manage preview generation lifecycle

### 3. Object List Item Structure

**StoreExplorerItem.ts**:
```typescript
interface ObjectListItem {
  id: string
  preview: string (base64 data URL)
  type: 'point' | 'line' | 'circle' | 'rectangle' | 'diamond'
  position: string (formatted coordinates)
  properties: string (shape-specific info)
  isSelected: boolean
}
```

**HTML Structure per item**:
```html
<div class="object-item" data-object-id="${object.id}">
  <img class="preview" src="${preview}" />
  <div class="info">
    <div class="type-badge">${type}</div>
    <div class="position">${position}</div>
    <div class="properties">${properties}</div>
  </div>
  <div class="actions">
    <!-- Selection indicator -->
  </div>
</div>
```

### 4. Integration Points

#### A. Object Selection Integration
- Sync with existing `gameStore.geometry.selection.selectedObjectId`
- Highlight selected object in list
- Right-click updates selection and opens `ObjectEditPanel`

#### B. Viewport Navigation
- Double-click calculates target camera position using `CoordinateHelper`
- Update `gameStore.camera.position` to center object anchor
- Smooth animation (optional enhancement)

#### C. Store Reactivity
- Subscribe to `gameStore.geometry.objects` for list updates
- Subscribe to selection changes for highlighting
- Use existing `UIHandlers` utilities for consistent styling

## Detailed Implementation Steps

### Phase 1: Core Infrastructure
1. **Create PreviewGenerator utility**
   - Integrate with existing `LayeredInfiniteCanvas` application
   - Create dedicated preview Container (not added to stage)
   - Implement preview generation using existing `GeometryRenderer`
   - Add caching mechanism

2. **Create StoreExplorer base component**
   - HTML structure in `index.html`
   - Basic TypeScript class with element management
   - Valtio store subscription setup

### Phase 2: Preview System
1. **Implement preview rendering**
   - Use existing `GeometryRenderer.renderGeometricObjectToGraphics()` directly
   - Create temporary Graphics within preview Container
   - Extract RenderTexture from Container bounds
   - Handle different shape types using existing rendering methods

2. **Preview optimization**
   - Cache management (invalidate on object changes)
   - Lazy loading for performance
   - RenderTexture cleanup for destroyed objects
   - Reuse existing viewport culling logic for efficiency

### Phase 3: List Management
1. **Dynamic list generation**
   - Create/update DOM elements for each object
   - Handle object additions/removals
   - Efficient DOM updates (avoid full re-renders)

2. **Statistics and summary**
   - Object count by type
   - Bounding box calculations
   - Memory usage indicators

### Phase 4: Interaction Features
1. **Selection integration**
   - Visual selection highlighting
   - Sync with existing selection system
   - Right-click context menu

2. **Navigation features**
   - Double-click viewport teleportation
   - Calculate optimal camera position using `CoordinateHelper`
   - Smooth transitions (optional)

### Phase 5: Polish and Integration
1. **UI styling**
   - Consistent with existing DaisyUI theme
   - Responsive design
   - Smooth animations

2. **Performance optimization**
   - Virtual scrolling for large lists (if needed)
   - Preview generation throttling
   - Memory management

## File Structure

```
app/src/ui/
├── StoreExplorer.ts           (main component)
├── PreviewGenerator.ts        (preview utility)
└── handlers/
    └── StoreExplorerHandlers.ts (event handlers)

app/src/types/
└── index.ts                   (add StoreExplorer types)

app/index.html                 (add HTML structure)
app/src/main.ts               (integrate component)
```

## Key Technical Considerations

### 1. Feedback Loop Prevention (CRITICAL)
- **Challenge**: Main renderer must NOT subscribe to texture registry
- **Solution**:
  - `GeometryRenderer` only subscribes to `gameStore.geometry.objects` (as now)
  - `TextureRegistry` placed in separate store section (`gameStore.textureRegistry`)
  - Post-render capture called by orchestrator (`LayeredInfiniteCanvas`)
  - **NEVER** call texture capture from within `GeometryRenderer.render()`

### 2. Preview Generation Efficiency
- **Challenge**: Generating previews for many objects can be expensive
- **Solution**:
  - Reuse existing rendered Graphics from `objectContainers` Map
  - Capture **AFTER** normal rendering completes
  - Lazy generation (only when StoreExplorer needs them)
  - Cache invalidation only on object creation/deletion, not texture changes

### 2. Memory Management
- **Challenge**: Preview RenderTextures consume memory
- **Solution**:
  - LRU cache with size limits for RenderTextures
  - Dispose RenderTextures when objects deleted
  - Reuse existing object disposal patterns from `GeometryRenderer`
  - Monitor memory usage

### 3. Coordinate System Integration
- **Challenge**: Preview rendering needs proper scaling/positioning
- **Solution**:
  - Leverage existing coordinate system from `GeometryRenderer`
  - Use existing viewport culling and bounds calculation
  - Normalize preview bounds using existing `CoordinateHelper` utilities
  - Reuse existing pixeloidScale calculations for consistent scaling

### 4. Event Handling
- **Challenge**: Managing right-click vs left-click vs double-click
- **Solution**:
  - Use event.preventDefault() appropriately
  - Implement proper event timing for double-click detection
  - Context menu integration

## Data Flow Architecture

### Main Rendering Flow (UNCHANGED)
```
User Input → gameStore.geometry.objects → GeometryRenderer → Canvas
     ↑                                           ↓
     └─── Object Selection ← User Interaction ──┘
```

### Texture Capture Flow (NEW, ONE-WAY)
```
GeometryRenderer.objectContainers → TextureRegistry.captureTexture() → gameStore.textureRegistry
                                                                              ↓
StoreExplorer ← TextureRegistry.getPreview() ←──────────────────────────────┘
```

### Critical Safeguards
1. **`GeometryRenderer`** - Subscribes ONLY to `gameStore.geometry` (unchanged)
2. **`TextureRegistry`** - NO store subscriptions, only write/read methods
3. **`LayeredInfiniteCanvas`** - Orchestrates post-render texture capture
4. **`StoreExplorer`** - Reads textures, never writes to geometry

## Dependencies

### Existing Components to Reuse (NO CHANGES)
- `LayeredInfiniteCanvas.ts` - Orchestrates rendering and texture capture
- `GeometryRenderer.ts` - **UNCHANGED** - only renders, never reads textures
- `ObjectEditPanel.ts` - Details panel (triggered by right-click)
- `CoordinateHelper.ts` - Viewport navigation calculations
- `UIHandlers.ts` - Consistent UI update utilities
- `gameStore.ts` - Enhanced with separate `textureRegistry` section

### New Components (SAFE)
- `TextureRegistry.ts` - Pure utility, no store subscriptions
- `StoreExplorer.ts` - Read-only consumer of texture registry

## Testing Strategy

### Unit Tests
- Preview generation for each object type
- Cache management functionality
- Event handling logic

### Integration Tests
- Store reactivity (object add/remove/modify)
- Selection synchronization
- Viewport navigation accuracy

### Performance Tests
- Large object count handling
- Memory usage monitoring
- Preview generation timing

## Future Enhancements

1. **Virtual Scrolling**: For handling thousands of objects
2. **Filtering/Search**: Find objects by type, properties, or ID
3. **Grouping**: Organize objects by type or creation time
4. **Export**: Save object list or previews
5. **Drag and Drop**: Reorder or organize objects
6. **Batch Operations**: Select multiple objects for batch editing

## Risk Mitigation

### Performance Risks
- **Risk**: Slow preview generation
- **Mitigation**: Lazy loading, caching, background generation

### Memory Risks  
- **Risk**: Memory leaks from preview textures
- **Mitigation**: Proper cleanup, LRU cache, monitoring

### Integration Risks
- **Risk**: Breaking existing object selection
- **Mitigation**: Careful integration with existing selection system, thorough testing

This implementation plan provides a comprehensive roadmap for creating a robust, performant StoreExplorer component that integrates seamlessly with the existing architecture while providing powerful new functionality for object management and navigation.