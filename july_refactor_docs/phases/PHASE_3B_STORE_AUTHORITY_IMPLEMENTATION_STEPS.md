# PHASE 3B - Store Authority Implementation Steps

## Exact Implementation Order

### Step 1: Fix Types (app/src/types/geometry-drawing.ts)
```typescript
// CHANGE: Remove "default" prefix from StyleSettings
export interface StyleSettings {
  color: number              // ✅ WAS: defaultColor
  strokeWidth: number        // ✅ WAS: defaultStrokeWidth  
  fillColor: number          // ✅ WAS: defaultFillColor
  strokeAlpha: number        // ✅ Keep as is
  fillAlpha: number          // ✅ Keep as is
  fillEnabled: boolean       // ✅ Keep as is
  highlightColor: number     // ✅ Keep as is
  selectionColor: number     // ✅ Keep as is
}

// CHANGE: Update createDefaultStyleSettings
export function createDefaultStyleSettings(): StyleSettings {
  return {
    color: 0x0066cc,          // ✅ WAS: defaultColor
    strokeWidth: 2,           // ✅ WAS: defaultStrokeWidth
    fillColor: 0x0066cc,      // ✅ WAS: defaultFillColor
    strokeAlpha: 1.0,
    fillAlpha: 0.3,
    fillEnabled: false,
    highlightColor: 0xff6600,
    selectionColor: 0xff0000
  }
}
```

### Step 2: Fix Store Methods (app/src/store/gameStore_3b.ts)
```typescript
// CHANGE: Update store methods to use new property names
setStrokeColor: (color: number) => {
  gameStore_3b.style.color = color  // ✅ WAS: defaultColor
},

setFillColor: (color: number) => {
  gameStore_3b.style.fillColor = color  // ✅ WAS: defaultFillColor
},

setStrokeWidth: (width: number) => {
  gameStore_3b.style.strokeWidth = Math.max(1, width)  // ✅ WAS: defaultStrokeWidth
},

// CHANGE: Update object creation in finishDrawing
finishDrawing: () => {
  // ... existing code ...
  const geometryParams: CreateGeometricObjectParams = {
    type: previewObj.type,
    vertices: previewObj.vertices,
    style: {
      color: gameStore_3b.style.color,        // ✅ WAS: defaultColor
      strokeWidth: gameStore_3b.style.strokeWidth,  // ✅ WAS: defaultStrokeWidth
      strokeAlpha: gameStore_3b.style.strokeAlpha,
      fillColor: gameStore_3b.style.fillEnabled ? gameStore_3b.style.fillColor : undefined,  // ✅ WAS: defaultFillColor
      fillAlpha: gameStore_3b.style.fillAlpha
    }
  }
}

// CHANGE: Update addGeometryObjectAdvanced
addGeometryObjectAdvanced: (type: GeometricObject['type'], vertices: PixeloidCoordinate[]) => {
  const params: CreateGeometricObjectParams = {
    type,
    vertices,
    style: {
      color: gameStore_3b.style.color,        // ✅ WAS: defaultColor
      strokeWidth: gameStore_3b.style.strokeWidth,  // ✅ WAS: defaultStrokeWidth
      strokeAlpha: gameStore_3b.style.strokeAlpha,
      fillColor: gameStore_3b.style.fillEnabled ? gameStore_3b.style.fillColor : undefined,  // ✅ WAS: defaultFillColor
      fillAlpha: gameStore_3b.style.fillAlpha
    }
  }
  
  return gameStore_3b_methods.addGeometryObject(params)
}
```

### Step 3: Fix UI (app/src/ui/GeometryPanel_3b.ts)
```typescript
// CHANGE: Update UI to read new property names
private updateUIFromStore(): void {
  // Update stroke color
  const strokeColorInput = document.getElementById('geometry-default-color') as HTMLInputElement
  if (strokeColorInput) {
    strokeColorInput.value = '#' + gameStore_3b.style.color.toString(16).padStart(6, '0')  // ✅ WAS: defaultColor
  }
  
  // Update stroke width
  const strokeWidthInput = document.getElementById('geometry-default-stroke-width') as HTMLInputElement
  if (strokeWidthInput) {
    strokeWidthInput.value = gameStore_3b.style.strokeWidth.toString()  // ✅ WAS: defaultStrokeWidth
  }
  
  // Update fill color
  const fillColorInput = document.getElementById('geometry-default-fill-color') as HTMLInputElement
  if (fillColorInput) {
    fillColorInput.value = '#' + gameStore_3b.style.fillColor.toString(16).padStart(6, '0')  // ✅ WAS: defaultFillColor
  }
}

// CHANGE: Update updateValues method
private updateValues(): void {
  // Update stroke color display
  const colorElement = document.getElementById('geometry-default-color')
  if (colorElement) {
    const colorHex = `#${gameStore_3b.style.color.toString(16).padStart(6, '0')}`  // ✅ WAS: defaultColor
    colorElement.textContent = colorHex
    colorElement.style.color = colorHex
  }

  // Update stroke width input
  const strokeWidthInput = document.getElementById('geometry-default-stroke-width') as HTMLInputElement
  if (strokeWidthInput) {
    strokeWidthInput.value = gameStore_3b.style.strokeWidth.toString()  // ✅ WAS: defaultStrokeWidth
  }
}
```

### Step 4: Fix GeometryHelper_3b (app/src/game/GeometryHelper_3b.ts)
```typescript
// CHANGE: Update preview generation to use new property names
style: {
  color: style.color,        // ✅ WAS: defaultColor
  strokeWidth: style.strokeWidth,  // ✅ WAS: defaultStrokeWidth
  strokeAlpha: style.strokeAlpha,
  fillColor: style.fillEnabled ? style.fillColor : undefined,  // ✅ WAS: defaultFillColor
  fillAlpha: style.fillAlpha
}
```

### Step 5: Fix GeometryRenderer_3b (app/src/game/GeometryRenderer_3b.ts)
```typescript
// CHANGE: Remove fallback logic - use obj.style directly
private renderGeometricObjectToGraphics3B(obj: GeometricObject, graphics: Graphics, samplingPos: any): void {
  const zoomFactor = 1  // Fixed for Phase 3B
  
  // Use obj.style directly - no fallbacks needed
  const style = obj.style  // ✅ REMOVED: || fallback logic
  
  // ... rest of method unchanged ...
}
```

## Success Criteria After Implementation
- ✅ Store has `color`, `strokeWidth`, `fillColor` (no "default" prefix)
- ✅ UI reads/writes store properties directly
- ✅ Objects get created with current store style
- ✅ Renderer uses `obj.style` directly (no fallbacks)
- ✅ No TypeScript errors
- ✅ No more "default" prefix anywhere

## Testing
1. Open geometry panel
2. Change stroke color → should immediately update store.style.color
3. Draw a shape → should use current store.style.color 
4. Renderer should display correct color with no fallbacks

This fixes the fundamental "default" prefix mismatch that was causing the fallback logic complexity.