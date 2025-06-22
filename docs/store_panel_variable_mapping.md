# StorePanel Variable Mapping Analysis

## Exact Variables Being Displayed and Their Store Connections

### **Critical Variables from StorePanel.ts Lines 209-250:**

#### **Line 209: `const coordinateMapping = updateGameStore.getCurrentCoordinateMapping()`**
- **Function Call**: `updateGameStore.getCurrentCoordinateMapping()`
- **Returns**: `PixeloidVertexMapping | null`
- **Store Location**: `gameStore.staticMesh.coordinateMappings.get(gameStore.staticMesh.currentScale)`

#### **Line 210: `const currentScale = gameStore.staticMesh.currentScale`**
- **Store Path**: `gameStore.staticMesh.currentScale`
- **Type**: `number`
- **Default**: `10` (from store initialization)

#### **Lines 213, 217, 222, 228: IF coordinateMapping exists:**
```typescript
const { currentResolution, vertexBounds, viewportOffset } = coordinateMapping;
```
- **`vertexBounds.topLeft.x, vertexBounds.topLeft.y`** (Line 217)
- **`vertexBounds.bottomRight.x, vertexBounds.bottomRight.y`** (Line 217) 
- **`viewportOffset.x, viewportOffset.y`** (Line 223)
- **`currentResolution.level`** (Line 229)
- **`currentResolution.meshBounds.vertexWidth, vertexBounds.vertexHeight`** (Line 229)

#### **Lines 234, 237, 241, 246: IF coordinateMapping is NULL:**
- **`currentScale`** - Same as line 210
- **`totalMappings = gameStore.staticMesh.coordinateMappings.size`** - Size of the Map

### **Other Static Mesh Variables:**

#### **Line 175: `gameStore.staticMesh.stats.activeMeshLevel`**
- **Store Path**: `gameStore.staticMesh.stats.activeMeshLevel`
- **Type**: `number`
- **Default**: `1`

#### **Line 180: `gameStore.staticMesh.activeMesh !== null`** 
- **Store Path**: `gameStore.staticMesh.activeMesh`
- **Type**: `StaticMeshData | null`
- **Default**: `null`

#### **Line 185: `gameStore.staticMesh.coordinateMappings.size > 0`**
- **Store Path**: `gameStore.staticMesh.coordinateMappings`
- **Type**: `Map<number, PixeloidVertexMapping>`
- **Default**: `new Map()` (empty)

#### **Lines 190-191: Cache Stats**
- **`gameStore.staticMesh.stats.totalCachedMeshes`** - Default: `0`
- **`gameStore.staticMesh.stats.totalCachedMappings`** - Default: `0`

### **Mouse Position Variables:**

#### **Line 138: `gameStore.mouseVertexPosition.x, gameStore.mouseVertexPosition.y`**
- **Store Path**: `gameStore.mouseVertexPosition`
- **Type**: `{ x: number, y: number }`
- **Default**: `{ x: 0, y: 0 }`

#### **Line 143: `gameStore.mousePixeloidPosition.x, gameStore.mousePixeloidPosition.y`**
- **Store Path**: `gameStore.mousePixeloidPosition` 
- **Type**: `{ x: number, y: number }`
- **Default**: `{ x: 0, y: 0 }`

### **Viewport Corner Variables:**

#### **Lines 117, 122: Camera Viewport Corners**
- **Store Path**: `gameStore.camera.viewportCorners.topLeft/bottomRight`
- **Type**: `ViewportCorners`
- **Default**: All `{ x: 0, y: 0 }`

#### **Lines 201-204: Same data, formatted differently**
- **Same Store Path**: `gameStore.camera.viewportCorners`

## **Key Functions That Need to Work:**

### **`updateGameStore.getCurrentCoordinateMapping()`**
- **Implementation**: `return gameStore.staticMesh.coordinateMappings.get(gameStore.staticMesh.currentScale) || null`
- **Critical**: This function is what determines if lines 212-231 or lines 232-250 execute

### **Data Population Chain:**
1. **StaticMeshManager** should call `updateGameStore.setCoordinateMapping(pixeloidScale, mapping)`
2. **setCoordinateMapping** should populate `gameStore.staticMesh.coordinateMappings.set(pixeloidScale, mapping)`
3. **getCurrentCoordinateMapping** should retrieve the mapping for current scale
4. **StorePanel** should display the mapping data or "No mapping" message

## **Current Problem Indicators:**
If StorePanel shows `"Scale:10 - No mapping (0 total)"` then:
- `currentScale = 10` ✓ (correct)
- `coordinateMappings.size = 0` ❌ (Map is empty)
- `getCurrentCoordinateMapping() = null` ❌ (no mapping for scale 10)

**Root Issue**: The `coordinateMappings` Map is not being populated by StaticMeshManager.