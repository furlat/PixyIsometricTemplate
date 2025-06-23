# Optimal Filter & Render Architecture with Render Groups + Cache as Texture

## Current PixiJS Best Practices Integration

### 1. Render Groups (Already Partially Implemented)
**LayeredInfiniteCanvas already uses render groups:**
```typescript
this.backgroundLayer = new Container({ isRenderGroup: true })
this.geometryLayer = new Container({ isRenderGroup: true })
this.selectionLayer = new Container({ isRenderGroup: true })
```

### 2. Missing: Individual Object Containers + Filter Groups
**Need to enhance GeometryRenderer with proper container hierarchy**

### 3. Cache as Texture Strategy for Static Content

## Optimal Architecture Design

### Enhanced Container Hierarchy
```
LayeredInfiniteCanvas
├── backgroundLayer (RenderGroup) ← Already implemented
├── geometryLayer (RenderGroup) ← Already implemented
│   └── GeometryRenderer.mainContainer
│       ├── normalFilterGroup (RenderGroup) ← NEW
│       │   ├── objectContainer_1 (individual object)
│       │   ├── objectContainer_2 (individual object)
│       │   └── ...
│       ├── selectedFilterGroup (RenderGroup) ← NEW
│       │   ├── objectContainer_selected (individual object)
│       │   └── ...
│       ├── pixelatedFilterGroup (RenderGroup) ← NEW
│       │   ├── objectContainer_pixelated (individual object)
│       │   └── ...
│       └── staticCachedGroup (RenderGroup + cacheAsTexture) ← NEW
│           ├── objectContainer_static1 (rarely changing)
│           └── objectContainer_static2 (rarely changing)
├── selectionLayer (RenderGroup) ← Keep for other selection effects
└── mouseLayer (RenderGroup) ← Already implemented
```

## Implementation Strategy

### Phase 1: Individual Object Containers
```typescript
export class GeometryRenderer {
  private mainContainer: Container = new Container()
  
  // Filter groups as render groups for GPU optimization
  private normalFilterGroup: Container = new Container({ isRenderGroup: true })
  private selectedFilterGroup: Container = new Container({ isRenderGroup: true })
  private pixelatedFilterGroup: Container = new Container({ isRenderGroup: true })
  private staticCachedGroup: Container = new Container({ isRenderGroup: true })
  
  // Individual object containers - one per geometric object
  private objectContainers: Map<string, Container> = new Map()
  private objectGraphics: Map<string, Graphics> = new Map()
  
  constructor() {
    // Setup container hierarchy
    this.mainContainer.addChild(this.normalFilterGroup)
    this.mainContainer.addChild(this.selectedFilterGroup)
    this.mainContainer.addChild(this.pixelatedFilterGroup)
    this.mainContainer.addChild(this.staticCachedGroup)
    
    // Apply filters to groups (not individual objects)
    this.selectedFilterGroup.filters = [
      new OutlineFilter({ thickness: 3, color: 0xff4444, quality: 0.1 })
    ]
    
    this.pixelatedFilterGroup.filters = [
      new PixelateFilter({ size: { x: 8, y: 8 } })
    ]
    
    // Enable cache as texture for static content
    this.staticCachedGroup.cacheAsTexture()
  }
  
  private createObjectContainer(objectId: string): Container {
    // Create container for individual object
    const objectContainer = new Container()
    const graphics = new Graphics()
    
    objectContainer.addChild(graphics)
    objectContainer.label = `object_${objectId}` // For debugging
    
    this.objectContainers.set(objectId, objectContainer)
    this.objectGraphics.set(objectId, graphics)
    
    return objectContainer
  }
  
  private assignObjectToFilterGroup(objectId: string): void {
    const objectContainer = this.objectContainers.get(objectId)
    if (!objectContainer) return
    
    // Remove from current parent
    objectContainer.removeFromParent()
    
    // Determine which filter group based on object state
    const isSelected = gameStore.geometry.selection.selectedObjectId === objectId
    const needsPixelate = this.shouldPixelateObject(objectId)
    const isStatic = this.isStaticObject(objectId)
    
    if (isSelected) {
      this.selectedFilterGroup.addChild(objectContainer)
    } else if (needsPixelate) {
      this.pixelatedFilterGroup.addChild(objectContainer)
    } else if (isStatic) {
      this.staticCachedGroup.addChild(objectContainer)
      // Update cache after adding static content
      this.staticCachedGroup.updateCacheTexture()
    } else {
      this.normalFilterGroup.addChild(objectContainer)
    }
  }
}
```

### Phase 2: Cache as Texture Strategy
```typescript
// For navigation/static content optimization
private setupCacheStrategy(): void {
  // Cache static objects that rarely change
  this.staticCachedGroup.cacheAsTexture({
    resolution: 1, // Match renderer resolution
    antialias: false // Small performance boost for static content
  })
}

private updateStaticCache(): void {
  // Only update when static content actually changes
  if (this.staticContentChanged) {
    this.staticCachedGroup.updateCacheTexture()
    this.staticContentChanged = false
  }
}

private isStaticObject(objectId: string): boolean {
  // Determine if object is static (for navigation, rarely changes)
  const obj = gameStore.geometry.objects.find(o => o.id === objectId)
  return obj?.metadata?.isStatic || false
}
```

### Phase 3: Dynamic Filter Group Assignment
```typescript
public render(corners: ViewportCorners, pixeloidScale: number): void {
  // Get all objects and update their containers
  const objects = gameStore.geometry.objects
  const visibleObjects = objects.filter(obj => 
    obj.isVisible && this.isObjectInViewport(obj, corners)
  )
  
  // Update or create object containers
  for (const obj of visibleObjects) {
    let objectContainer = this.objectContainers.get(obj.id)
    
    if (!objectContainer) {
      objectContainer = this.createObjectContainer(obj.id)
    }
    
    // Update graphics content
    const graphics = this.objectGraphics.get(obj.id)!
    this.updateObjectGraphics(obj, graphics, pixeloidScale)
    
    // Assign to appropriate filter group
    this.assignObjectToFilterGroup(obj.id)
  }
  
  // Clean up deleted objects
  this.cleanupDeletedObjects(visibleObjects)
  
  // Update static cache if needed
  this.updateStaticCache()
}
```

## Performance Benefits

### 1. Render Groups (GPU Optimization)
```typescript
// Each filter group is a render group
// Transformations/filters applied on GPU, not CPU
this.selectedFilterGroup = new Container({ isRenderGroup: true })
this.selectedFilterGroup.filters = [outlineFilter] // Applied once to entire group
```

### 2. Individual Object Mobility
```typescript
// Objects can move between filter groups without recreating graphics
const objectContainer = this.objectContainers.get(objectId)
objectContainer.removeFromParent()
this.selectedFilterGroup.addChild(objectContainer) // Fast transfer
```

### 3. Cache as Texture for Static Content
```typescript
// Static objects rendered once to texture, reused every frame
this.staticCachedGroup.cacheAsTexture()
// 100 static objects = 1 texture render instead of 100 individual renders
```

## Advanced Filter Combinations

### Multi-Filter Stacking
```typescript
// Stack multiple filters on specific groups
this.specialEffectGroup.filters = [
  new OutlineFilter({ thickness: 2, color: 0x00ff00 }),
  new PixelateFilter({ size: { x: 4, y: 4 } }),
  new GlowFilter({ distance: 15, outerStrength: 2 })
] // All applied in sequence to group
```

### Conditional Filter Application
```typescript
private updateFilterStates(): void {
  // Only apply filters when needed (performance optimization)
  const hasSelection = gameStore.geometry.selection.selectedObjectId !== null
  
  if (hasSelection && !this.selectedFilterGroup.filters) {
    this.selectedFilterGroup.filters = [this.outlineFilter]
  } else if (!hasSelection && this.selectedFilterGroup.filters) {
    this.selectedFilterGroup.filters = null // Remove unnecessary processing
  }
}
```

## Navigation Cache Strategy

### Static Content Caching for Store Explorer
```typescript
// For navigation/preview purposes - cache object textures
private setupNavigationCache(): void {
  // Objects that appear in Store Explorer get cached for thumbnails
  const navigationGroup = new Container({ isRenderGroup: true })
  navigationGroup.cacheAsTexture({
    resolution: 0.5, // Lower res for thumbnails
    antialias: false // Performance over quality for previews
  })
}
```

### Dynamic vs Static Classification
```typescript
private classifyObjectsForCaching(): void {
  for (const obj of gameStore.geometry.objects) {
    // Static: Objects that haven't changed in last N frames
    if (this.getObjectChangeFrames(obj.id) > STATIC_THRESHOLD) {
      this.moveToStaticGroup(obj.id)
    }
    // Dynamic: Recently modified objects
    else {
      this.moveToDynamicGroup(obj.id)
    }
  }
}
```

## Memory Management

### Cache Size Limits
```typescript
private manageCacheMemory(): void {
  // Prevent excessive memory usage
  const MAX_CACHE_SIZE = 4096 * 4096 // GPU texture limit
  
  if (this.estimateCacheSize() > MAX_CACHE_SIZE) {
    // Split static content into multiple cached groups
    this.splitStaticGroups()
  }
}
```

### Texture Resolution Optimization
```typescript
private optimizeCacheResolution(group: Container): void {
  // Adjust resolution based on usage
  const bounds = group.getBounds()
  const screenUsage = this.calculateScreenUsage(bounds)
  
  const resolution = screenUsage > 0.5 ? 1.0 : 0.5 // Lower res for small/distant objects
  
  group.cacheAsTexture({ resolution, antialias: false })
}
```

## Expected Performance Results

### Before Optimization
- **100 objects** = 100 render calls + filter overhead per object
- **Memory usage**: Moderate (no texture caching)
- **GPU utilization**: High CPU, moderate GPU

### After Optimization  
- **100 objects** = 4 render group calls + cached static textures
- **Memory usage**: Higher (cached textures) but consistent
- **GPU utilization**: Low CPU, high GPU (optimal)

### Background Isolation Maintained
✅ **Background layer completely separate render group**
✅ **No filter interference with checkerboard pattern**
✅ **Perfect isolation guaranteed**

This architecture provides the **foundation for both current selection highlighting and future pixelate effects** while leveraging all PixiJS performance optimizations.