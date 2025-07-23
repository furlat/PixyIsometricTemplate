# 🚨 SNEAKY FALLBACKS DISCOVERED

## **CRITICAL: ObjectEditPanel Form Fallbacks**
**LOCATION**: `app/src/ui/ObjectEditPanel.ts` lines 412-465
**DANGER LEVEL**: 🔴 CRITICAL - Creates invalid objects silently

```typescript
// ❌ SNEAKY FALLBACKS - Mask missing form data!
circle: {
  centerX: parseFloat(centerXInput?.value ?? '0'),      // ❌ Defaults to 0!
  centerY: parseFloat(centerYInput?.value ?? '0'),      // ❌ Defaults to 0!
  radius: parseFloat(radiusInput?.value ?? '1')         // ❌ Defaults to 1!
},

rectangle: {
  centerX: parseFloat(centerXInput?.value ?? '0'),      // ❌ Defaults to 0!
  centerY: parseFloat(centerYInput?.value ?? '0'),      // ❌ Defaults to 0!
  width: parseFloat(widthInput?.value ?? '1'),          // ❌ Defaults to 1!
  height: parseFloat(heightInput?.value ?? '1')         // ❌ Defaults to 1!
},

// STYLE FALLBACKS:
strokeColor: strokeColorInput?.value ?? '#0066cc',      // ❌ Default color
strokeWidth: parseInt(strokeWidthInput?.value ?? '2', 10), // ❌ Default width
strokeAlpha: parseFloat(strokeAlphaInput?.value ?? '1.0'), // ❌ Default alpha
fillAlpha: parseFloat(fillAlphaInput?.value ?? '0.3'),     // ❌ Default alpha
hasFill: fillEnabledInput?.checked ?? false               // ❌ Default no fill
```
**PROBLEM**: If form inputs are missing/corrupted, these create objects at (0,0) with default dimensions!

## **CRITICAL: PreviewSystem Type Fallbacks**
**LOCATION**: `app/src/store/systems/PreviewSystem.ts`
**DANGER LEVEL**: 🔴 CRITICAL - Wrong object types

```typescript
// Line 119: ❌ Fallback to 'point' type
const vertices = GeometryHelper.generateVertices(
  store.preview.originalObject?.type || 'point',  // ❌ SNEAKY!
  data.dimensions
)

// Line 156: ❌ Another fallback to 'point'
type: store.preview.previewData.previewProperties?.type as GeometricObject['type'] || 'point',
```
**PROBLEM**: If preview data is corrupted, creates wrong object types!

## **HIGH: LINE Drawing Fallback**
**LOCATION**: `app/src/game/InputManager.ts` line 198
**DANGER LEVEL**: 🟡 SUSPICIOUS - Same pattern as broken shapes

```typescript
case 'line':
  const startPoint = gameStore.drawing.startPoint || coord  // ❌ SAME FALLBACK!
  return {
    line: {
      startX: startPoint.x,  // Could be coord.x if startPoint null
      startY: startPoint.y,  // Could be coord.y if startPoint null
      endX: coord.x,         // Current position
      endY: coord.y          // Current position
    }
  }
```
**MYSTERY**: This has the SAME dangerous fallback pattern, but LINE works. WHY?
**THEORY**: Maybe startPoint is properly set for LINE but not for circle/rectangle/diamond?

## **MEDIUM: Mouse Position Fallback**
**LOCATION**: `app/src/game/InputManager.ts` line 716
**DANGER LEVEL**: 🟡 MEDIUM - Affects paste operations

```typescript
const mousePos = gameStore.mouse.world || { x: 0, y: 0 }  // ❌ Defaults to origin
gameStore_methods.pasteObject(mousePos)
```
**PROBLEM**: If mouse.world is null, pastes objects at (0,0) instead of failing safely.

## **MEDIUM: Preview Opacity Fallback**
**LOCATION**: `app/src/game/GeometryRenderer.ts` line 472
**DANGER LEVEL**: 🟡 MEDIUM - Visual only

```typescript
const previewOpacity = gameStore.preview.previewOpacity || 0.8  // ❌ Default opacity
```
**PROBLEM**: Minor - just visual default.

## **ROOT CAUSE THEORY**

The **ObjectEditPanel fallbacks** are the most dangerous because they:
1. **Mask missing form data** - Creates objects when form is broken
2. **Default to origin (0,0)** - Objects appear in wrong location
3. **Use arbitrary dimensions** - Objects have wrong size

**COMBINED WITH** the InputManager fallbacks, this creates a **double fallback system**:
1. InputManager fallback: `startPoint || coord` (creates zero-size)
2. ObjectEditPanel fallback: `?? '0'` (creates objects at origin)

## **ELIMINATION PRIORITY**

1. 🔴 **URGENT**: ObjectEditPanel fallbacks - Most dangerous
2. 🔴 **URGENT**: PreviewSystem type fallbacks - Wrong object types  
3. 🟡 **HIGH**: Investigate why LINE works with same fallback pattern
4. 🟡 **MEDIUM**: Mouse position fallback for paste
5. 🟡 **LOW**: Preview opacity fallback

## **WHY LINE WORKS MYSTERY**

LINE has the SAME fallback pattern but works correctly. Possible reasons:
1. **startPoint is properly set for LINE** but not others
2. **LINE drawing initialization is different**
3. **LINE coordinates are handled differently** in the pipeline
4. **Visual difference**: Zero-length line is invisible, but zero-size rectangle/diamond/circle might still render

**NEED TO INVESTIGATE**: Drawing initialization sequence to understand why LINE startPoint is valid but others aren't.

## **🚨 FAKE "BACKWARD COMPATIBILITY" FALLBACK**
**LOCATION**: `app/src/game/Canvas.ts` line 41
**DANGER LEVEL**: 🔴 CRITICAL - Architectural lie!

```typescript
// ✅ Use provided InputManager or create new one (backward compatibility)
this.inputManager = inputManager || new InputManager()
```

**PROBLEM**:
- **WHAT BACKWARD COMPATIBILITY?** This is a brand new system!
- **ARCHITECTURAL LIE**: No old system exists to be compatible with
- **DANGEROUS PATTERN**: Creates duplicate InputManager instances
- **BREAKS SINGLE AUTHORITY**: Multiple InputManagers = conflicting event handling

**TRUTH**: This should REQUIRE an InputManager parameter. The constructor should throw an error if none provided, not silently create a duplicate!

**CORRECT APPROACH**:
```typescript
constructor(app: Application, inputManager: InputManager) {  // ✅ REQUIRED!
  if (!inputManager) {
    throw new Error('Canvas requires InputManager - no fallback allowed')
  }
  this.inputManager = inputManager  // ✅ Single instance only
}
```

This "backward compatibility" excuse is **architectural poison** - it's a fallback pretending to be helpful!