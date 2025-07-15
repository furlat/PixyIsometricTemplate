# Claude Context Documentation

## Project: ECS Camera Viewport Architecture Implementation

### Critical System Understanding

This project implements a **dual-layer ECS camera viewport system** to solve Out-of-Memory (OOM) issues in a pixeloid-based geometry rendering system.

#### Core Architecture:

1. **Geometry Layer (Layer 1)** - ECS Data Sampling Layer
   - Always renders at **scale 1** and **position (0,0)** (FIXED - never changes)
   - Uses **ECS viewport sampling** to render only objects within a sampling window
   - **NO camera viewport transforms applied** to this layer
   - At **zoom level 1**: WASD moves the sampling window (what gets rendered)
   - At **zoom level 2+**: Hidden (not rendered)

2. **Mirror Layer (Layer 2+)** - Camera Viewport Display Layer  
   - **Copies textures FROM Geometry Layer**
   - **HAS camera viewport transforms** (scale, position)
   - At **zoom level 1**: Shows **complete mirror** of all geometry (no viewport)
   - At **zoom level 2+**: Shows **camera viewport** of pre-rendered Layer 1

#### WASD Movement Behavior:

- **Zoom Level 1**: WASD moves **ONLY** geometry layer sampling window (mirror shows complete geometry)
- **Zoom Level 2+**: WASD moves **ONLY** mirror layer camera viewport (geometry layer hidden)

#### Layer Visibility:

- **Zoom Level 1**: Both layers visible (live geometry + complete mirror)
- **Zoom Level 2+**: Only mirror layer visible (camera viewport of pre-rendered content)

### Implementation Status (85% Complete)

#### ✅ Already Implemented:
- ECS viewport sampling in GeometryRenderer
- Fixed geometry layer positioning (scale 1, position 0,0)
- Mirror layer camera viewport transforms
- cameraViewport state in gameStore
- Basic WASD movement (currently only updates mirror layer)

#### ❌ Missing (15%):
1. **Zoom-dependent WASD movement** - Need to route WASD to geometry sampling at zoom 1, mirror viewport at zoom 2+
2. **Automatic layer visibility switching** - Show/hide layers based on zoom level
3. **Independent geometry sampling position** - Separate state for geometry layer sampling window

### Key Files:

- `CORRECT_SYSTEM_ARCHITECTURE.md` - Complete system specification
- `IMPLEMENTATION_GAP_ANALYSIS.md` - Detailed gap analysis and implementation plan
- `OOM_ANALYSIS_AND_REFACTOR_PLAN.md` - Original problem analysis and architecture design
- `gameStore.ts` - Core state management with cameraViewport
- `GeometryRenderer.ts` - ECS viewport sampling implementation
- `LayeredInfiniteCanvas.ts` - Layer management and rendering coordination
- `InputManager.ts` - WASD movement handling (needs zoom-dependent routing)

### Critical Points to Remember:

1. **Geometry Layer NEVER gets camera viewport transforms** - it's pure ECS data sampling
2. **Mirror Layer is the display layer** - it has all the camera viewport logic
3. **At zoom 1, mirror shows COMPLETE geometry, not a viewport** - viewport only at zoom 2+
4. **WASD behavior changes based on zoom level** - geometry sampling vs mirror viewport
5. **The system eliminates OOM by keeping geometry at fixed scale 1** - memory is O(1) not O(scale²)

### Recent Confusion Points:

- ❌ Don't apply camera viewport to geometry layer
- ❌ Don't move both layers simultaneously at zoom 1 
- ❌ Don't think of mirror as a viewport at zoom 1
- ✅ Geometry layer = data sampling, Mirror layer = display viewport
- ✅ WASD targets different layers depending on zoom level
- ✅ Mirror shows complete geometry at zoom 1, viewport at zoom 2+

### Next Steps:
Implement the 3 missing pieces per the Implementation Gap Analysis to achieve the complete correct system behavior.