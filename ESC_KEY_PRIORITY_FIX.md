# 🚨 **ESC KEY PRIORITY CONTROL FLOW FIX**

## ❌ **CURRENT PROBLEM**

Esc key is trying to close panels while drawing, causing conflicts:
```
EditActions.ts:273 Selection cleared (enhanced - edit panel closed)
```

## ✅ **CORRECT ESC PRIORITY ORDER**

```typescript
public handleEscape(): void {
  // PRIORITY 1: Close edit panel if open
  if (gameStore.ui.isEditPanelOpen) {
    // Close edit panel via store method
    gameStore_methods.closeEditPanel() // or equivalent
    return // STOP HERE
  }
  
  // PRIORITY 2: Cancel drawing and reset mode
  if (gameStore.drawing.isDrawing || gameStore.drawing.mode !== 'none') {
    gameStore_methods.cancelDrawing()
    gameStore_methods.setDrawingMode('none')  // Reset to none
    return // STOP HERE
  }
  
  // PRIORITY 3: Cancel dragging
  if (gameStore.dragging.isDragging) {
    gameStore_methods.cancelDragging()
    return // STOP HERE
  }
  
  // PRIORITY 4: Clear selection (last resort)
  gameStore_methods.clearSelectionEnhanced()
}
```

## 🔧 **ALSO FIX: Drawing Mode Persistence**

Remove auto-reset in `finishDrawingViaPreview()`:
```typescript
private finishDrawingViaPreview(): void {
  PreviewSystem.commitPreview(gameStore)
  // ❌ REMOVE: gameStore_methods.setDrawingMode('none')
  console.log('InputManager: Finished drawing via PreviewSystem')
}
```

## 🎯 **RESULT**

- **Drawing completion** → Stay in same mode (continuous drawing)
- **Esc during drawing** → Cancel + reset to 'none' 
- **Esc with edit panel** → Close panel only
- **Esc otherwise** → Clear selection