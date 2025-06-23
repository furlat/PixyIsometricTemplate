# WASD Render Pipeline Debug Plan

## Problem Statement
Geometry doesn't render during WASD movement but appears correctly when drawing new objects. This indicates the render triggering pipeline is broken, not the coordinate conversion logic.

## Expected Render Flow
1. **WASD Keys** → InputManager.updateMovement()
2. **Store Update** → updateGameStore.setVertexToPixeloidOffset()
3. **Subscription Trigger** → LayeredInfiniteCanvas subscription fires
4. **Dirty Flag** → geometryDirty = true
5. **Render Loop** → Game.update() → LayeredInfiniteCanvas.render()
6. **Conditional Render** → if (geometryDirty) → GeometryRenderer.render()
7. **Always Render** → GeometryRenderer renders without memoization

## Debug Investigation Steps

### Phase 1: Verify Store Updates
**Question:** Does setVertexToPixeloidOffset actually update the store during WASD?

**Debug Actions:**
- Add console.log in updateGameStore.setVertexToPixeloidOffset()
- Verify store value actually changes during WASD movement
- Check if Valtio subscriptions are properly configured

### Phase 2: Verify Subscription Triggers  
**Question:** Does LayeredInfiniteCanvas subscription actually fire when offset changes?

**Debug Actions:**
- Add console.log in LayeredInfiniteCanvas offset subscription
- Verify subscription is properly set up and not cleaned up
- Check if subscription callback is actually executed during WASD

### Phase 3: Verify Dirty Flag Setting
**Question:** Does geometryDirty flag actually get set to true?

**Debug Actions:**
- Add console.log when geometryDirty is set to true
- Verify the flag persists until the next render cycle
- Check for race conditions or immediate flag resets

### Phase 4: Verify Render Loop Execution
**Question:** Is LayeredInfiniteCanvas.render() being called continuously during WASD?

**Debug Actions:**
- Add console.log in LayeredInfiniteCanvas.render() to verify frequency
- Check if Game.update() → infiniteCanvas.render() chain is working
- Verify PixiJS ticker is running properly

### Phase 5: Verify Conditional Render Logic
**Question:** Does the geometryDirty check properly trigger GeometryRenderer.render()?

**Debug Actions:**
- Add console.log in LayeredInfiniteCanvas.renderGeometryLayer()
- Verify the conditional logic executes when geometryDirty is true
- Check if GeometryRenderer.render() is actually called

### Phase 6: Verify GeometryRenderer Execution
**Question:** Does GeometryRenderer.render() execute and complete successfully?

**Debug Actions:**
- Add console.log at start and end of GeometryRenderer.render()
- Verify coordinate conversion logic executes
- Check if container updates are applied to the scene

## Most Likely Failure Points

### 1. Valtio Subscription Issues
- Subscription not firing due to object mutation detection
- Subscription cleaned up prematurely
- Store proxy not triggering change detection

### 2. Race Conditions
- geometryDirty flag being reset before render
- Multiple rapid updates causing batching issues
- Async timing problems between store updates and renders

### 3. Render Loop Throttling
- PixiJS ticker not running during movement
- Game.update() not calling LayeredInfiniteCanvas.render()
- Performance optimizations preventing continuous rendering

### 4. Store Batching
- Valtio batching multiple offset changes
- React-like batching preventing intermediate renders
- Store updates being deferred or queued

## Quick Test Implementation

Add extensive debug logging to trace the complete pipeline:

```typescript
// In InputManager.updateMovement()
console.log('🎮 WASD: About to update offset', { newOffset, timestamp: Date.now() })

// In LayeredInfiniteCanvas subscription
subscribe(gameStore.mesh.vertex_to_pixeloid_offset, () => {
  console.log('📡 SUBSCRIPTION: Offset changed, setting geometryDirty', { 
    newOffset: {...gameStore.mesh.vertex_to_pixeloid_offset}, 
    timestamp: Date.now() 
  })
  this.geometryDirty = true
})

// In LayeredInfiniteCanvas.render()
console.log('🔄 RENDER LOOP: LayeredInfiniteCanvas.render() called', {
  geometryDirty: this.geometryDirty,
  timestamp: Date.now()
})

// In LayeredInfiniteCanvas.renderGeometryLayer()
console.log('🎨 GEOMETRY RENDER: About to call GeometryRenderer.render()', {
  timestamp: Date.now()
})

// In GeometryRenderer.render()
console.log('✏️ GEOMETRY: Rendering geometry objects', {
  objectCount: gameStore.geometry.objects.length,
  timestamp: Date.now()
})
```

## Expected Outcome

After adding debug logging, we should see a continuous sequence during WASD movement:
1. `🎮 WASD: About to update offset`
2. `📡 SUBSCRIPTION: Offset changed, setting geometryDirty`  
3. `🔄 RENDER LOOP: LayeredInfiniteCanvas.render() called`
4. `🎨 GEOMETRY RENDER: About to call GeometryRenderer.render()`
5. `✏️ GEOMETRY: Rendering geometry objects`

**If any step is missing, that's where the pipeline breaks.**

## Alternative Solutions

If debugging reveals unfixable architectural issues:

### Option A: Force Render Every Frame
Remove all dirty flag optimizations and render geometry every frame regardless

### Option B: Direct Render Triggering  
Make InputManager directly trigger GeometryRenderer during WASD movement

### Option C: Store-Driven Immediate Render
Make store updates immediately trigger renders instead of relying on subscriptions

## Next Steps

1. **Implement debug logging** across the entire pipeline
2. **Test WASD movement** and analyze the debug output
3. **Identify the exact failure point** in the render chain
4. **Implement targeted fix** based on findings
5. **Verify geometry renders correctly** during WASD movement