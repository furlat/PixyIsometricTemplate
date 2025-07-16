# PHASE 3B - Store Authority Fix

## Problem Analysis
The current system has a fundamental mismatch:
- Store has `StyleSettings` with `defaultColor`, `defaultStrokeWidth`, etc.
- Objects need `color`, `strokeWidth`, etc. (without "default" prefix)
- This creates fallback logic everywhere instead of clean authority

## Store Authority Pattern
**STORE IS AUTHORITY** - UI begs the store, store provides current drawing style

### Current Flow (BROKEN)
```typescript
// Store has "default" prefixed properties
store.style.defaultColor = 0xff0000

// UI updates "default" properties
gameStore_3b_methods.setStrokeColor(color) // sets defaultColor

// Object creation copies "default" to non-"default"
style: {
  color: gameStore_3b.style.defaultColor,  // ❌ Mismatch
  strokeWidth: gameStore_3b.style.defaultStrokeWidth
}

// Renderer has fallback logic
const style = obj.style || { /* fallback logic */ }  // ❌ Complexity
```

### Fixed Flow (CLEAN)
```typescript
// Store has current drawing style (no "default" prefix)
store.style.color = 0xff0000
store.style.strokeWidth = 2
store.style.fillColor = 0x0066cc

// UI reads current style
const currentColor = gameStore_3b.style.color  // ✅ Direct read

// UI updates current style
gameStore_3b_methods.setStrokeColor(color)  // sets style.color

// Object creation uses current style directly
style: {
  color: gameStore_3b.style.color,      // ✅ Direct copy
  strokeWidth: gameStore_3b.style.strokeWidth
}

// Renderer uses obj.style directly
const style = obj.style  // ✅ No fallbacks needed
```

## Implementation Plan

### 1. Fix Store Types
Remove "default" prefix from StyleSettings:
```typescript
interface StyleSettings {
  color: number              // ✅ NOT defaultColor
  strokeWidth: number        // ✅ NOT defaultStrokeWidth
  fillColor: number          // ✅ NOT defaultFillColor
  strokeAlpha: number
  fillAlpha: number
  fillEnabled: boolean
}
```

### 2. Update Store Methods
```typescript
setStrokeColor: (color: number) => {
  gameStore_3b.style.color = color  // ✅ Direct assignment
}
```

### 3. Update UI
```typescript
// Read current style
strokeColorInput.value = '#' + gameStore_3b.style.color.toString(16)

// Update current style
gameStore_3b_methods.setStrokeColor(color)
```

### 4. Update Object Creation
```typescript
// Copy current style directly
style: {
  color: gameStore_3b.style.color,
  strokeWidth: gameStore_3b.style.strokeWidth,
  fillColor: gameStore_3b.style.fillEnabled ? gameStore_3b.style.fillColor : undefined
}
```

### 5. Remove Renderer Fallbacks
```typescript
// Use obj.style directly
const style = obj.style  // ✅ No fallbacks
```

## Files to Update
1. `app/src/types/geometry-drawing.ts` - Fix StyleSettings interface
2. `app/src/store/gameStore_3b.ts` - Update store methods
3. `app/src/ui/GeometryPanel_3b.ts` - Update UI to read/write current style
4. `app/src/game/GeometryHelper_3b.ts` - Remove fallback logic
5. `app/src/game/GeometryRenderer_3b.ts` - Remove fallback logic

## Success Criteria
- Store has `color`, `strokeWidth`, `fillColor` (no "default" prefix)
- UI reads/writes store properties directly
- Objects get created with current store style
- Renderer uses `obj.style` directly (no fallbacks)
- No more "default" prefix anywhere