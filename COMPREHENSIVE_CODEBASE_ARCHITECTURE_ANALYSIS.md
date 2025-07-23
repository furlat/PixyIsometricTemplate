# Comprehensive Codebase Architecture Analysis

## Overview
This is a sophisticated isometric pixel-perfect rendering application with a unified store architecture, ECS-inspired coordinate systems, and complex bidirectional data flows between UI panels, store, and geometry rendering.

## 1. Core Architecture Layers

### 1.1 Application Entry Point
- **File**: `app/src/main.ts`
- **Role**: Bootstrap application, create Game instance
- **Flow**: main.ts → Game.ts → Canvas.ts → rendering components

### 1.2 Game Orchestrator
- **File**: `app/src/game/Game.ts`
- **Responsibilities**:
  - PIXI Application lifecycle management
  - Dependency injection (creates InputManager, passes to Canvas)
  - Window resize handling
  - Clean render loop orchestration
- **Key Pattern**: **Dependency Injection** - Game creates InputManager once, injects into components

### 1.3 Canvas System
- **File**: `app/src/game/Canvas.ts` (Phase3BCanvas)
- **Architecture**: **Layered Rendering System**
  - Layer 1: BackgroundGridRenderer (grid + checkboard)
  - Layer 2: GeometryRenderer (shapes)  
  - Layer 3: MouseHighlightShader (mouse effects)
- **Key Pattern**: **Composition over Inheritance** - aggregates specialized renderers

## 2. Input & Store Integration

### 2.1 InputManager - Central Input Hub
- **File**: `app/src/game/InputManager.ts`
- **Pattern**: **Observer + Command** pattern
- **Responsibilities**:
  - Keyboard/mouse event handling
  - Store updates via gameStore_methods
  - Drawing operation coordination
  - Selection management
- **Key Insight**: **Single Source of Input** - no duplicate input handling

### 2.2 Store Architecture
- **File**: `app/src/store/game-store.ts`
- **Pattern**: **Valtio Proxy State + Action Dispatch**
- **Structure**:
  ```typescript
  gameStore = proxy<GameStoreData>({
    objects: GeometricObject[],           // Single source of truth
    selection: { selectedId, bounds },
    preview: ObjectEditPreviewState,      // Unified preview system
    drawing: { mode, isDrawing, ... },
    defaultStyle: StyleSettings,
    mouse: { position, vertex, world },   // Multi-coordinate tracking
    navigation: { offset, isDragging },
    mesh: { cellSize, vertexData, ... },
    ui: { showGrid, showMouse, panels }, 
    clipboard: { objectData, hasObject },
    dragging: { isDragging, offsets },
    dragPreview: { isActive, vertices }
  })
  ```

### 2.3 Store Actions - Modular Dispatch
- **Files**: 
  - `app/src/store/actions/CreateActions.ts` - Object creation
  - `app/src/store/actions/EditActions.ts` - Object editing + UI actions
  - `app/src/store/systems/PreviewSystem.ts` - Unified preview system
  - `app/src/store/helpers/GeometryHelper.ts` - Geometry calculations

**Key Architecture**: **Action Modules + Pure Functions**
```typescript
gameStore_methods = {
  createObject(params) → CreateActions.createObject(gameStore, params),
  selectObject(id) → EditActions.selectObject(gameStore, id),
  updatePreview(data) → PreviewSystem.updatePreview(gameStore, data)
}
```

## 3. Coordinate Systems & Rendering Pipeline

### 3.1 Multi-Coordinate Architecture
Based on ECS-inspired types in `app/src/types/`:

1. **PixeloidCoordinate** - World space coordinates (scale 1)
2. **VertexCoordinate** - Mesh vertex coordinates  
3. **ScreenCoordinate** - Actual pixel positions
4. **ECSViewportBounds** - Viewport sampling bounds

### 3.2 Rendering Components

#### BackgroundGridRenderer
- **File**: `app/src/game/BackgroundGridRenderer.ts`
- **Dual Responsibility**: 
  - Renders grid using PIXI Graphics
  - **Updates store** with mouse tracking (`updateMouseVertex`, `updateMousePosition`)
- **Key Pattern**: **Renderer + Store Updater** - bidirectional flow

#### GeometryRenderer  
- **File**: `app/src/game/GeometryRenderer.ts`
- **Reads from store**: `gameStore.objects`, `gameStore.selection`, `gameStore.preview`
- **Rendering Logic**: 
  - Real objects (green for visible, red for selected)
  - Preview objects (yellow/orange for active previews)
  - Selection bounds (red outline)

#### MouseHighlightShader
- **File**: `app/src/game/MouseHighlightShader.ts`  
- **GPU Shader-based**: Real-time mouse highlighting
- **Store Integration**: Reads `gameStore.ui.mouse.highlightColor`

### 3.3 Mesh System
- **File**: `app/src/game/MeshManager.ts`
- **Pattern**: **Static Mesh + Dynamic Updates**
- **Coordinate Translation**: Screen → Vertex → World coordinates
- **Store Integration**: Updates `gameStore.mesh` state

## 4. Geometry System - The Heart of the Application

### 4.1 GeometricObject Structure
```typescript
interface GeometricObject {
  id: string,
  type: 'point' | 'line' | 'circle' | 'rectangle' | 'diamond',
  vertices: PixeloidCoordinate[],        // Raw vertex data
  bounds: ECSBoundingBox,                // Calculated bounds  
  style: { color, strokeWidth, ... },    // Visual styling
  properties: GeometryProperties,        // Shape-specific properties
  isVisible: boolean,
  createdAt: number
}
```

### 4.2 Shape-Specific Properties (Union Type)
```typescript
type GeometryProperties = 
  | PointProperties { type: 'point', center }
  | LineProperties { type: 'line', startPoint, endPoint, midpoint, length, angle }
  | CircleProperties { type: 'circle', center, radius, diameter, circumference, area }
  | RectangleProperties { type: 'rectangle', center, topLeft, bottomRight, width, height }
  | DiamondProperties { type: 'diamond', center, west, north, east, south, width, height }
```

### 4.3 GeometryHelper - Unified Calculations
- **File**: `app/src/store/helpers/GeometryHelper.ts`
- **Pattern**: **Static Helper Class + Forward-Only Calculations**
- **Key Methods**:
  - `generateVertices(type, properties)` - Forward calculation only
  - `calculateBounds(vertices)` - Consistent bounds calculation
  - `calculateProperties(type, vertices)` - Properties from vertices
  - `moveVertices(vertices, offset)` - Movement operations

**Critical Insight**: **No Reverse Engineering** - always forward calculations to prevent circular bugs

## 5. Preview System - Unified Preview Architecture

### 5.1 PreviewSystem Architecture
- **File**: `app/src/store/systems/PreviewSystem.ts`
- **Pattern**: **State Machine + Preview-Commit**
- **States**: `isActive`, `editingObjectId`, `originalObject`, `previewData`

### 5.2 Circle Bug Fix Strategy
**Problem**: Circle radius would change during editing due to reverse engineering from vertices
**Solution**: **Direct Form Data Usage** - never reverse engineer, always use form input directly

```typescript
// ✅ FIXED: Direct from form data
generatePropertiesFromFormData(formData) {
  if (formData.circle) {
    const radius = formData.circle.radius  // Direct from form - NO REVERSE ENGINEERING
    return { type: 'circle', center, radius, diameter: radius * 2, ... }
  }
}
```

## 6. Data Flow Patterns

### 6.1 User Input → Store → Rendering
```
Mouse Move → InputManager → gameStore_methods.updateMousePosition() 
          → store.mouse.position updated
          → BackgroundGridRenderer reads store.mouse
          → PIXI renders mouse cursor
```

### 6.2 UI Panel → Store → Rendering  
```
GeometryPanel color change → gameStore_methods.setStrokeColor()
                          → store.defaultStyle.color updated
                          → GeometryRenderer reads store.defaultStyle
                          → PIXI renders objects with new color
```

### 6.3 Object Editing Flow
```
ObjectEditPanel form input → PreviewSystem.updatePreview()
                          → store.preview.previewData updated  
                          → GeometryRenderer reads store.preview
                          → PIXI renders preview (yellow/orange)
Apply button → PreviewSystem.commitPreview()
            → store.objects updated
            → GeometryRenderer renders final object (green)
```

## 7. Bidirectional Store-Geometry Relationships

### 7.1 Store → Rendering (Data Flow)
- **GeometryRenderer** reads `gameStore.objects` for object rendering
- **BackgroundGridRenderer** reads `gameStore.ui.showGrid` for visibility
- **MouseHighlightShader** reads `gameStore.ui.mouse.highlightColor`

### 7.2 Rendering → Store (Update Flow)  
- **BackgroundGridRenderer** updates `gameStore.mouse.vertex` during mouse tracking
- **InputManager** updates `gameStore.drawing.isDrawing` during draw operations
- **MeshManager** updates `gameStore.mesh.cellSize` for mesh state

### 7.3 UI → Store → Rendering (Control Flow)
- **GeometryPanel** updates `gameStore.defaultStyle` → affects GeometryRenderer
- **LayerToggleBar** updates `gameStore.ui.showMouse` → affects MouseHighlightShader
- **ObjectEditPanel** updates `gameStore.preview` → affects GeometryRenderer preview

## 8. Key Architectural Insights

### 8.1 Unified Store as Single Source of Truth
- **All components** read from and write to the same `gameStore`
- **No component-specific state** - everything flows through central store
- **Valtio reactivity** enables automatic UI updates

### 8.2 Dependency Injection Pattern
- **Game** creates InputManager, injects into Canvas
- **Canvas** receives InputManager, passes to renderers
- **No global singletons** - clean dependency flow

### 8.3 Action-Based Store Updates
- **Store mutations** only through `gameStore_methods`
- **Action modules** provide organized, pure functions
- **No direct store manipulation** from components

### 8.4 ECS-Inspired Coordinate System
- **Multiple coordinate spaces** with clear transformations
- **PixeloidCoordinate** as canonical world space
- **Mesh system** handles coordinate translations

### 8.5 Preview-First Architecture  
- **All modifications** go through preview system first
- **Visual feedback** before commitment
- **Undo/cancel** capability through original object preservation

## 9. Rendering Loop Analysis

### 9.1 Core Render Loop
```
Game.render() → Phase3BCanvas.render() → {
  BackgroundGridRenderer.render()     // Grid + mouse tracking
  GeometryRenderer.render()           // Objects + selection + preview  
  MouseHighlightShader.render()       // GPU mouse effects
}
```

### 9.2 Store-Driven Rendering
- **Each renderer** reads relevant store slices
- **Automatic updates** via Valtio subscriptions
- **No manual render triggers** needed

### 9.3 Layer Visibility Control
- **LayerToggleBar** controls layer visibility via store
- **Renderers** check `gameStore.ui.showGrid`, `gameStore.ui.showMouse` etc.
- **Dynamic layer composition** based on UI state

## 10. Next Analysis Areas

### 10.1 UI Component Integration (Not Yet Analyzed)
- Individual panel architectures
- UI event handling patterns  
- Panel-to-panel communication

### 10.2 Remaining Type System (Not Yet Analyzed)
- Complete ECS coordinate system details
- Filter pipeline architecture
- Mesh system type definitions

### 10.3 Advanced Data Flows (Not Yet Analyzed)
- Selection → Edit Panel → Preview → Commit flow
- Drag system architecture
- Clipboard operations

## Summary

This codebase demonstrates a sophisticated **Unified Store + ECS + Component Architecture** with:

- **Central store** (`gameStore`) as single source of truth
- **Action-based mutations** through organized modules
- **Bidirectional data flow** between rendering and store
- **Preview-first editing** with visual feedback
- **Multi-coordinate system** for pixel-perfect rendering
- **Modular renderer composition** with clean dependencies
- **GPU shader integration** for performance-critical effects

The architecture successfully handles complex geometry editing, real-time preview, and pixel-perfect rendering while maintaining clean separation of concerns and predictable data flow.