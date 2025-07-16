# Scale Span Limit Implementation Plan

## Overview
Implement a 15x scale span limit to prevent OOM errors by tracking object creation scales and blocking zoom operations that would exceed the span.

## Implementation Steps

### 1. Add Creation Scale to Object Metadata
**File**: `app/src/types/index.ts`
- Add `createdAtScale: number` to `GeometricMetadata` interface
- This tracks the pixeloid scale when each object was created

### 2. Update Store to Track Global Scale Range
**File**: `app/src/store/gameStore.ts`
- Add to geometry state:
  ```typescript
  scaleTracking: {
    minCreationScale: number | null,
    maxCreationScale: number | null,
    SCALE_SPAN_LIMIT: 15  // constant
  }
  ```
- Update `minCreationScale` and `maxCreationScale` when:
  - Objects are created (all factory methods)
  - Objects are deleted (recalculate from remaining objects)

### 3. Initialize Creation Scale in Object Factory Methods
**File**: `app/src/store/gameStore.ts`
- In all creation methods (`createPoint`, `createLine`, etc.):
  - Add `createdAtScale: gameStore.camera.pixeloid_scale` to metadata
  - Update global min/max tracking

### 4. Add Scale Limit Checking
**File**: `app/src/store/gameStore.ts`
- Create helper method:
  ```typescript
  canZoomToScale(targetScale: number): { allowed: boolean, reason?: string }
  ```
- Check if targetScale would violate the 15x span limit
- Return reason if blocked

### 5. Update Zoom Handling
**File**: `app/src/game/InfiniteCanvas.ts`
- In `applyBatchedZoom()`:
  - Check `canZoomToScale()` before applying zoom
  - If blocked, show dialog and prevent zoom

### 6. Add Blocked Zoom Dialog
**File**: `app/src/ui/UIHandlers.ts` (or create new dialog component)
- Create dialog that shows:
  - Current scale range (min-max of created objects)
  - Attempted scale
  - Why it's blocked
  - Suggestion to create objects at different scales

### 7. Handle Object Deletion
**File**: `app/src/store/gameStore.ts`
- In `removeGeometricObject()`:
  - After deletion, recalculate min/max scales from remaining objects
  - This allows the scale range to expand if extreme objects are deleted

## Example Scenarios

### Scenario 1: Objects at scale 1
- Min scale: 1, Max scale: 1
- Allowed zoom range: 1-15
- If user tries to zoom to 16, show dialog

### Scenario 2: Objects at scales 2 and 10
- Min scale: 2, Max scale: 10
- Allowed zoom range: 1-25 (to maintain 15x span from scale 10)
- If user tries to zoom to 26, show dialog

### Scenario 3: Object at scale 45
- Min scale: 45, Max scale: 45
- Allowed zoom range: 30-60 (45 ± 15)
- If user tries to zoom to 29 or 61, show dialog

## Future Improvements
After this temporary solution works, we can implement adaptive texture carving:
- Split large textures into tiles
- Only render visible tiles
- Add padding to reduce recomputation
- This would remove the need for scale limits