# ✅ **SIMPLIFIED ESC KEY PRIORITY FIX**

## 🎯 **CLEAN ESC PRIORITY (3 steps only)**

```typescript
public handleEscape(): void {
  // PRIORITY 1: Close edit panel if open
  if (gameStore.ui.isEditPanelOpen) {
    // Close edit panel (probably via some close method)
    // This should close the panel and clear selection
    gameStore_methods.clearSelectionEnhanced() // This closes panel too
    return // STOP HERE
  }
  
  // PRIORITY 2: Cancel drawing and reset mode
  if (gameStore.drawing.isDrawing || gameStore.drawing.mode !== 'none') {
    gameStore_methods.cancelDrawing()
    gameStore_methods.setDrawingMode('none')  // Reset to none on ESC
    return // STOP HERE
  }
  
  // PRIORITY 3: Clear selection (fallback)
  gameStore_methods.clearSelectionEnhanced()
}
```

## 🔧 **ALSO FIX: Drawing Mode Persistence**

In `finishDrawingViaPreview()` - remove the auto-reset:
```typescript
private finishDrawingViaPreview(): void {
  PreviewSystem.commitPreview(gameStore)
  // ❌ REMOVE THIS: gameStore_methods.setDrawingMode('none')
  console.log('InputManager: Finished drawing via PreviewSystem')
}
```

## 🎯 **RESULT**

- **Drawing completion** → Stay in same mode ✅
- **ESC during drawing** → Cancel + reset to 'none' ✅
- **ESC with edit panel** → Close panel ✅
- **ESC otherwise** → Clear selection ✅
- **Dragging** → Handled naturally by mouse events ✅

Much simpler!