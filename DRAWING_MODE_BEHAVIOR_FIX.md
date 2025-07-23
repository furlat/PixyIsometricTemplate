# 🎯 **DRAWING MODE BEHAVIOR FIX**

## ❌ **CURRENT WRONG BEHAVIOR**

1. **After drawing completion** → Mode resets to 'none' (should stay in same mode)
2. **Esc key** → Cancels drawing but doesn't reset mode (should go to 'none')

## 🔍 **ROOT CAUSE ANALYSIS**

### **Problem 1: Auto-reset to 'none'**
**File**: `app/src/game/InputManager.ts` 
**Method**: `finishDrawingViaPreview()` - Line ~158
```typescript
private finishDrawingViaPreview(): void {
  PreviewSystem.commitPreview(gameStore)
  gameStore_methods.setDrawingMode('none')  // ❌ WRONG - should stay in mode
  console.log('InputManager: Finished drawing via PreviewSystem')
}
```

### **Problem 2: Esc doesn't reset mode**
**File**: `app/src/game/InputManager.ts`
**Method**: `KeyboardHandler.handleEscape()` - Line ~727
```typescript
public handleEscape(): void {
  if (gameStore.drawing.isDrawing) {
    gameStore_methods.cancelDrawing()  // Cancels but doesn't reset mode
  }
  // Should also: gameStore_methods.setDrawingMode('none')
}
```

## ✅ **CORRECT BEHAVIOR**

1. **After drawing completion** → Stay in same drawing mode (continuous drawing)
2. **Esc key** → Cancel drawing AND reset mode to 'none' (exit drawing)

## 🔧 **FIXES NEEDED**

1. Remove `gameStore_methods.setDrawingMode('none')` from `finishDrawingViaPreview()`
2. Add `gameStore_methods.setDrawingMode('none')` to `handleEscape()`