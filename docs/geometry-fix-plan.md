# Geometry Layer Fix - Complete Coordinate Flow

## Current Complete Flow
1. **ECS Store**: Objects in pixeloid coordinates (e.g., rect at 50,50)
2. **convertObjectToVertexCoordinates()**: Pixeloid → Vertex (50 - offset.x = 10)
3. **renderGeometricObjectToGraphics()**: Draw at vertex size (10x10)
4. **Camera Transform**: Scales by pixeloidScale (10x10 → 100x100 screen pixels)

## New Complete Flow
1. **ECS Store**: Objects in pixeloid coordinates (same)
2. **convertObjectToVertexCoordinates()**: Pixeloid → Vertex (same - KEEP THIS!)
3. **renderGeometricObjectToGraphics()**: 
   - Vertex → Screen using `CoordinateCalculations.vertexToScreen()`
   - Draw at screen pixel size
4. **No Camera Transform**: Geometry draws directly at screen coordinates

## Specific Implementation

### 1. Import the helper
```typescript
import { CoordinateCalculations } from './CoordinateCalculations'
```

### 2. Update renderGeometricObjectToGraphics()
Pass pixeloidScale parameter:
```typescript
private renderGeometricObjectToGraphics(
  obj: GeometricObject, 
  pixeloidScale: number, 
  graphics: Graphics
): void
```

### 3. renderRectangleToGraphics()
```typescript
private renderRectangleToGraphics(
  rect: GeometricRectangle, 
  pixeloidScale: number,  // NEW parameter
  graphics: Graphics
): void {
  // Current (vertex coordinates):
  // const x = rect.x
  // const y = rect.y
  
  // NEW: Convert vertex to screen
  const topLeft = CoordinateCalculations.vertexToScreen(
    { __brand: 'vertex' as const, x: rect.x, y: rect.y },
    pixeloidScale
  )
  const x = topLeft.x
  const y = topLeft.y
  const width = rect.width * pixeloidScale
  const height = rect.height * pixeloidScale
  
  // Draw at screen size
  graphics.rect(x, y, width, height)
  // ... rest stays the same
}
```

### 4. renderCircleToGraphics()
```typescript
private renderCircleToGraphics(
  circle: GeometricCircle,
  pixeloidScale: number,  // NEW parameter
  graphics: Graphics
): void {
  // Convert center to screen
  const center = CoordinateCalculations.vertexToScreen(
    { __brand: 'vertex' as const, x: circle.centerX, y: circle.centerY },
    pixeloidScale
  )
  const centerX = center.x
  const centerY = center.y
  const radius = circle.radius * pixeloidScale
  
  graphics.circle(centerX, centerY, radius)
  // ... rest stays the same
}
```

### 5. renderLineToGraphics()
```typescript
private renderLineToGraphics(
  line: GeometricLine,
  pixeloidScale: number,  // NEW parameter
  graphics: Graphics
): void {
  // Convert both points to screen
  const start = CoordinateCalculations.vertexToScreen(
    { __brand: 'vertex' as const, x: line.startX, y: line.startY },
    pixeloidScale
  )
  const end = CoordinateCalculations.vertexToScreen(
    { __brand: 'vertex' as const, x: line.endX, y: line.endY },
    pixeloidScale
  )
  
  graphics.moveTo(start.x, start.y)
  graphics.lineTo(end.x, end.y)
  // ... rest stays the same
}
```

### 6. renderPointToGraphics() 
Already has pixeloidScale parameter! Just fix:
```typescript
// Current line 391:
const pointRadius = 2 / pixeloidScale  // This compensates for camera scaling

// Change to:
const pointRadius = 2  // Fixed pixel size (no compensation needed)

// And convert position to screen:
const pos = CoordinateCalculations.vertexToScreen(
  { __brand: 'vertex' as const, x: point.x, y: point.y },
  pixeloidScale
)
graphics.circle(pos.x, pos.y, pointRadius)
```

### 7. renderDiamondToGraphics()
```typescript
private renderDiamondToGraphics(
  diamond: GeometricDiamond,
  pixeloidScale: number,  // NEW parameter
  graphics: Graphics
): void {
  const vertices = GeometryHelper.calculateDiamondVertices(diamond)
  
  // Convert each vertex to screen
  const west = CoordinateCalculations.vertexToScreen(
    { __brand: 'vertex' as const, x: vertices.west.x, y: vertices.west.y },
    pixeloidScale
  )
  // ... repeat for north, east, south
  
  graphics.moveTo(west.x, west.y)
  // ... etc
}
```

### 8. Preview rendering
Update `renderPreviewWithCoordinateConversion()` similarly - convert vertex to screen.

### 9. LayeredInfiniteCanvas setupLayers()
```typescript
// Only grid needs camera transform:
this.cameraTransform.addChild(this.backgroundLayer)

// Everything else at screen coordinates:
this.container.addChild(this.geometryLayer)
this.container.addChild(this.selectionLayer)
this.container.addChild(this.pixelateLayer)
this.container.addChild(this.mirrorLayer)
this.container.addChild(this.bboxLayer)
this.container.addChild(this.mouseLayer)
```

## Summary
- KEEP pixeloid → vertex conversion in `convertObjectToVertexCoordinates()`
- ADD vertex → screen conversion using `CoordinateCalculations.vertexToScreen()`
- Pass pixeloidScale to all render methods
- Move geometry out of camera transform