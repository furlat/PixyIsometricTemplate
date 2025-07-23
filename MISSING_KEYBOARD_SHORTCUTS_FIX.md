# CRITICAL: Missing F1/F2/F3 Keyboard Shortcuts

## **The Problem**
I removed F1/F2/F3 UI panel shortcuts from UIControlBar but never added them to InputManager!

## **Missing Shortcuts:**
- **F1** → Toggle Store Panel
- **F2** → Toggle Layer Bar  
- **F3** → Toggle Geometry Panel

## **Solution Options:**

### **Option A: Add to InputManager**
```typescript
// Add to InputManager.KeyboardHandler.handleKeyDown()
case 'f1':
  // Need access to UIControlBar or direct store methods
  gameStore_methods.toggleStorePanel()
  break
case 'f2':
  gameStore_methods.toggleLayerToggle()
  break  
case 'f3':
  gameStore_methods.toggleGeometryPanel()
  break
```

### **Option B: Keep in UIControlBar**
```typescript
// Keep UI shortcuts in UIControlBar, game shortcuts in InputManager
private setupUIKeyboardShortcuts(): void {
  document.addEventListener('keydown', (event) => {
    // Only UI panel shortcuts, not game controls
    if (event.key === 'F1') {
      this.toggleStorePanel()
      event.preventDefault()
    }
    // etc...
  })
}
```

## **Recommendation:**
**Option A** - Add F1/F2/F3 to InputManager for centralized keyboard handling.

## **Implementation:**
Add F1/F2/F3 handling to InputManager.KeyboardHandler.handleKeyDown() method.