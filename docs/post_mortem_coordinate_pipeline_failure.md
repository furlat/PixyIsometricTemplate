# Post-Mortem: Coordinate Pipeline Implementation Failure

## What I Was Asked to Do

Simple and clear:
1. **Mouse highlighting should be vertex-based** (using `gameStore.mouseVertexPosition` directly)
2. **Pixeloid position calculation should be simple: vertex + offset** 
3. **UI should show REAL store data** (not fake calculated values)

## What I Actually Did

1. **Created a detailed implementation plan** in `docs/viewport_offset_implementation_plan.md` ✓
2. **Added the required types** to `PixeloidVertexMapping` ✓  
3. **Modified StaticMeshManager** to calculate viewport offset and vertex bounds ✓
4. **Updated CoordinateHelper** to use simple offset formula ✓
5. **Modified StorePanel** to show real store data ✓

## The Critical Failure

**Despite implementing all the pieces, the system is NOT WORKING!**

### Evidence of Failure

UI shows:
```
Pixeloids: TL:(-20.3,-19.3) BR:(212.3,99.3)
Vertices: TL:(0,0) BR:(29,14)           ← WRONG! Should be (-3,-3)  
Viewport Offset: Offset:(0.00,0.00)     ← WRONG! Should be (3.7,4.7)
```

**Expected calculation:**
- `vertexTopLeftX = Math.floor(-20.3 / 8) = -3`
- `vertexTopLeftY = Math.floor(-19.3 / 8) = -3` 
- `offsetX = -20.3 - (-3 * 8) = 3.7`
- `offsetY = -19.3 - (-3 * 8) = 4.7`

## Root Cause Analysis

### Problem 1: Store Data Missing
The `gameStore.staticMesh.coordinateMapping` either:
- **Doesn't have `viewportOffset` and `vertexBounds` fields** (despite type definition)
- **Has incorrect/default values** (0,0) instead of calculated values
- **Isn't being updated** by StaticMeshManager

### Problem 2: StaticMeshManager Not Working
The `updateCoordinateMapping()` method either:
- **Isn't being called** at all
- **Has bugs in the calculation logic**
- **Isn't properly writing to the store**
- **Is being overwritten** by other code

### Problem 3: UI Still Shows Fake Data
The StorePanel shows calculated values instead of raw store fields, indicating:
- **The store doesn't contain real viewport offset data**
- **The UI is falling back to computed values**
- **The coordinate mapping isn't properly initialized**

## The Core Issue: Store-to-UI Disconnect

**The fundamental problem is that the store doesn't contain the real coordinate mapping data that the UI is trying to display.**

This creates a broken pipeline:
1. StaticMeshManager should calculate and store viewport offset
2. Store should contain real `viewportOffset` and `vertexBounds` 
3. UI should display these raw store values
4. **But the store contains default/empty/incorrect values instead**

## Immediate Action Required

### Phase 1: Verify Store Data
1. **Check if `coordinateMapping.viewportOffset` exists in the store**
2. **Check if `coordinateMapping.vertexBounds` exists in the store**  
3. **Verify StaticMeshManager is actually being called**
4. **Add debug logging to see what values are calculated vs stored**

### Phase 2: Fix the Data Flow
1. **Ensure StaticMeshManager properly updates the store**
2. **Verify coordinate mapping contains real calculated values**
3. **Fix any bugs in the viewport offset calculation**
4. **Ensure the store reactively updates the UI**

### Phase 3: Validate UI Shows Real Data
1. **StorePanel should display only raw store fields**
2. **No calculated/derived values in the UI**
3. **Clear indication when store data is missing**
4. **Vertex bounds and offset should show real calculated values**

## Key Learning

**I implemented all the right pieces but failed to ensure they actually work together.** The types, calculations, and UI changes are correct in isolation, but the system as a whole isn't functioning because:

1. **The store doesn't contain the expected data**
2. **StaticMeshManager isn't properly populating the store**  
3. **The UI can't show real data that doesn't exist**

## Next Steps

**Priority 1:** Debug why StaticMeshManager isn't updating the store with real coordinate mapping data.

**Priority 2:** Ensure the store contains actual viewport offset and vertex bounds values.

**Priority 3:** Verify the UI displays only real store data, not fallback calculations.

The coordinate pipeline will only work when the store actually contains the real coordinate mapping data that the UI is designed to display.