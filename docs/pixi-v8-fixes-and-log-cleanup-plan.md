# PixiJS v8 Fixes and Log Cleanup Plan

## Issue 1: PixiJS v8 Deprecation Warning

**Error**: `Container.name property has been removed, use Container.label instead`

**Location**: MirrorLayerRenderer.ts line 211

### Fix:
Replace all instances of `.name` with `.label` in MirrorLayerRenderer:
- Line ~205: `sprite.name = 'mirror_${obj.id}'` → `sprite.label = 'mirror_${obj.id}'`

## Issue 2: Spammy Console Logs

### High-frequency logs to remove/reduce:

1. **InputManager.ts:171** - Mouse move events
   - Logs on every mouse movement
   - Should be removed or moved to debug level

2. **GeometryRenderer.ts:53 & 90** - Render cycle logs
   - Logs twice per frame (120 logs/second at 60fps!)
   - Should be removed or moved to debug level

3. **LayeredInfiniteCanvas.ts:333** - Mirror layer render logs
   - Logs every frame when mirror layer is active
   - Should be removed or only log on actual texture updates

### Proposed Changes:

1. **Create Debug Log System**:
   ```typescript
   const DEBUG = {
     MOUSE_EVENTS: false,
     RENDER_CYCLES: false,
     TEXTURE_UPDATES: true  // Keep important updates
   }
   ```

2. **Wrap verbose logs**:
   ```typescript
   if (DEBUG.MOUSE_EVENTS) {
     console.log('InputManager: Mesh event move...')
   }
   ```

3. **Keep important logs**:
   - Texture extraction/caching
   - Errors and warnings
   - State changes (layer toggles, object creation/deletion)

### Files to Update:
1. MirrorLayerRenderer.ts - Fix deprecation and reduce logs
2. InputManager.ts - Remove/wrap mouse movement logs
3. GeometryRenderer.ts - Remove/wrap render cycle logs
4. LayeredInfiniteCanvas.ts - Reduce mirror layer logs

## Benefits:
- Clean console output
- Easier debugging
- Better performance (less string concatenation)
- PixiJS v8 compatibility