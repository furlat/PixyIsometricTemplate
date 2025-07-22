# CORRECTED Phase 0 & 1 Implementation Guide

## 🚨 **CRITICAL CORRECTIONS FROM ORIGINAL PLAN**

**Problem**: Original plan assumed wrong type exports and import sources.  
**Solution**: This corrected plan uses **actual existing types** from the real codebase.

---

## 📋 **PHASE 0: TYPESCRIPT CLEANUP (CORRECTED)**

### **Step 0.1: Fix `app/src/types/index.ts` (CORRECTED)**

Based on **actual existing exports**, not assumptions:

```typescript
// app/src/types/index.ts - CORRECTED VERSION
/**
 * Phase 3B Types - Core Exports Only (CORRECTED)
 * 
 * Clean export of only the types actually used in Phase 3B.
 * Uses REAL exports from actual files, not assumed ones.
 */

// ================================
// CORE COORDINATES (VERIFIED REAL EXPORTS)
// ================================
export type {
  PixeloidCoordinate,
  VertexCoordinate, 
  ScreenCoordinate,
  ECSViewportBounds,
  ECSBoundingBox
} from './ecs-coordinates'

export {
  createPixeloidCoordinate,
  createVertexCoordinate,
  createScreenCoordinate,
  createECSViewportBounds,
  createECSBoundingBox,
  ECS_COORDINATE_CONSTANTS
} from './ecs-coordinates'

// ================================
// GEOMETRY DRAWING (VERIFIED REAL EXPORTS)
// ================================
export type {
  DrawingMode,
  ObjectEditFormData,
  ObjectEditPreviewState,
  StyleSettings,  // NOT GeometryStyle - that doesn't exist
  PreviewObject,
  PreviewState,
  DrawingSettings,
  DrawingState,
  SelectionState
} from './geometry-drawing'

export {
  createDefaultDrawingSettings,
  createDefaultStyleSettings,
  createDefaultSelectionState,
  createDefaultObjectEditPreviewState,
  createDefaultGeometryPanelState,
  createDefaultPreviewState,
  isDrawingMode,
  isPreviewObject
} from './geometry-drawing'

// ================================
// ECS DATA LAYER (VERIFIED REAL EXPORTS)
// ================================
export type {
  GeometricObject,  // THIS is in ecs-data-layer, NOT geometry-drawing
  CreateGeometricObjectParams,  // THIS is in ecs-data-layer
  GeometryProperties,
  PointProperties,
  LineProperties,
  CircleProperties,
  RectangleProperties,
  DiamondProperties
} from './ecs-data-layer'

export {
  createGeometricObject,
  calculateObjectBounds,
  isGeometricObject
} from './ecs-data-layer'

// ================================
// BASIC MESH TYPES (VERIFIED REAL EXPORTS)
// ================================
export type {
  MeshLevel
} from './mesh-system'

export {
  createMeshSystem,  // NOT createMeshLevel - that doesn't exist
  createMeshResolution,
  isMeshLevel
} from './mesh-system'

// ================================
// NO FUTURE PHASE EXPORTS
// ================================
// REMOVED: All future phase types and require() functions
```

### **Step 0.2: Fix `app/src/types/ecs-data-layer.ts` (CORRECTED)**

Remove the circular dependency:

```typescript
// FIND this line around line 358 and REPLACE:

// ❌ REMOVE:
const { GeometryPropertyCalculators } = require('../game/GeometryPropertyCalculators')
properties = GeometryPropertyCalculators.calculateProperties(params.type, params.vertices)

// ✅ REPLACE WITH:
// Calculate properties directly from params (no reverse engineering needed)
properties = {
  type: params.type,
  // Add basic properties based on type
  ...(params.properties || {})
}
```

---

## 📋 **PHASE 1: NEW MODULAR ARCHITECTURE (CORRECTED)**

### **Step 1.1: Create New Store Structure (CORRECTED IMPORTS)**

#### **File: `app/src/store/game-store.ts`** (NEW - CORRECTED IMPORTS)
```typescript
/**
 * Game Store - Clean Modular Architecture (CORRECTED)
 * 
 * Single entry point with modular dispatch to action submodules.
 * Uses REAL types from actual codebase.
 */

import { proxy } from 'valtio'
import type { 
  GeometricObject,  // FROM ecs-data-layer, NOT geometry-drawing
  ObjectEditFormData,
  ObjectEditPreviewState,
  StyleSettings,  // NOT GeometryStyle - use StyleSettings
  DrawingMode 
} from '../types'  // Use index.ts for clean imports
import type { PixeloidCoordinate, ECSBoundingBox } from '../types'

// Import action modules
import { CreateActions } from './actions/CreateActions'
import { EditActions } from './actions/EditActions'
import { GeometryHelper } from './helpers/GeometryHelper'
import { PreviewSystem } from './systems/PreviewSystem'

// ================================
// PURE DATA STORAGE (CORRECTED TYPES)
// ================================

interface GameStoreData {
  // Single source of truth for objects
  objects: GeometricObject[]  // CORRECTED: from ecs-data-layer
  
  // Selection state
  selection: {
    selectedId: string | null
    selectionBounds: ECSBoundingBox | null
  }
  
  // Preview state (unified preview system)
  preview: ObjectEditPreviewState  // CORRECTED: from geometry-drawing
  
  // Drawing state
  drawing: {
    mode: DrawingMode
    isDrawing: boolean
    startPoint: PixeloidCoordinate | null
    currentPoint: PixeloidCoordinate | null
  }
  
  // Default style settings (CORRECTED TYPE)
  defaultStyle: StyleSettings  // CORRECTED: use StyleSettings, not GeometryStyle
  
  // UI state
  ui: {
    showGeometry: boolean
    showGeometryPanel: boolean
    showStorePanel: boolean
    isEditPanelOpen: boolean
  }
  
  // Mouse tracking
  mouse: {
    position: PixeloidCoordinate
    isOverObject: boolean
    hoveredObjectId: string | null
  }
  
  // Navigation
  navigation: {
    offset: PixeloidCoordinate
    isDragging: boolean
  }
}

// ================================
// STORE INSTANCE (CORRECTED DEFAULTS)
// ================================

export const gameStore = proxy<GameStoreData>({
  objects: [],
  
  selection: {
    selectedId: null,
    selectionBounds: null
  },
  
  preview: {
    isActive: false,
    editingObjectId: null,  // CORRECTED: based on real ObjectEditPreviewState
    originalObject: null,
    previewData: null,
    shouldShowPreview: true,
    previewOpacity: 0.8
  },
  
  drawing: {
    mode: 'none',
    isDrawing: false,
    startPoint: null,
    currentPoint: null
  },
  
  // CORRECTED: Use real StyleSettings defaults
  defaultStyle: {
    color: 0x0066cc,
    strokeWidth: 2,
    fillColor: 0x0066cc,
    fillEnabled: false,
    strokeAlpha: 1.0,
    fillAlpha: 0.3,
    highlightColor: 0xff6600,
    selectionColor: 0xff0000
  },
  
  ui: {
    showGeometry: true,
    showGeometryPanel: false,
    showStorePanel: false,
    isEditPanelOpen: false
  },
  
  mouse: {
    position: { x: 0, y: 0 },
    isOverObject: false,
    hoveredObjectId: null
  },
  
  navigation: {
    offset: { x: 0, y: 0 },
    isDragging: false
  }
})

// ================================
// SINGLE ENTRY POINT METHODS (CORRECTED TYPES)
// ================================

export const gameStore_methods = {
  // ==========================================
  // CREATION OPERATIONS (dispatch to CreateActions)
  // ==========================================
  
  createObject(params: CreateObjectParams): string {
    return CreateActions.createObject(gameStore, params)
  },
  
  finishDrawing(mode: DrawingMode, startPoint: PixeloidCoordinate, endPoint: PixeloidCoordinate): string {
    return CreateActions.finishDrawing(gameStore, mode, startPoint, endPoint)
  },
  
  // ==========================================
  // EDIT OPERATIONS (dispatch to EditActions)
  // ==========================================
  
  removeObject(objectId: string): void {
    EditActions.removeObject(gameStore, objectId)
  },
  
  selectObject(objectId: string): void {
    EditActions.selectObject(gameStore, objectId)
  },
  
  clearSelection(): void {
    EditActions.clearSelection(gameStore)
  },
  
  // UNIFIED MOVEMENT (drag OR edit panel)
  moveObject(objectId: string, newVertices: PixeloidCoordinate[]): void {
    EditActions.moveObject(gameStore, objectId, newVertices)
  },
  
  // UNIFIED RESIZING
  resizeObject(objectId: string, newDimensions: ObjectDimensions): void {
    EditActions.resizeObject(gameStore, objectId, newDimensions)
  },
  
  // ==========================================
  // PREVIEW OPERATIONS (dispatch to PreviewSystem) 
  // ==========================================
  
  startPreview(operation: 'create' | 'move' | 'resize', originalObjectId?: string): void {
    PreviewSystem.startPreview(gameStore, operation, originalObjectId)
  },
  
  updatePreview(data: PreviewUpdateData): void {
    PreviewSystem.updatePreview(gameStore, data)
  },
  
  commitPreview(): void {
    PreviewSystem.commitPreview(gameStore)
  },
  
  cancelPreview(): void {
    PreviewSystem.cancelPreview(gameStore)
  },
  
  // ==========================================
  // STYLE OPERATIONS (CORRECTED TYPE)
  // ==========================================
  
  setDefaultStyle(style: Partial<StyleSettings>): void {  // CORRECTED: StyleSettings
    Object.assign(gameStore.defaultStyle, style)
  },
  
  resetDefaultStyle(): void {
    // CORRECTED: Use real StyleSettings structure
    gameStore.defaultStyle = {
      color: 0x0066cc,
      strokeWidth: 2,
      fillColor: 0x0066cc,
      fillEnabled: false,
      strokeAlpha: 1.0,
      fillAlpha: 0.3,
      highlightColor: 0xff6600,
      selectionColor: 0xff0000
    }
  },
  
  // ==========================================
  // DRAWING OPERATIONS
  // ==========================================
  
  setDrawingMode(mode: DrawingMode): void {
    gameStore.drawing.mode = mode
    if (mode === 'none') {
      gameStore.drawing.isDrawing = false
      gameStore.drawing.startPoint = null
      gameStore.drawing.currentPoint = null
    }
  },
  
  startDrawing(point: PixeloidCoordinate): void {
    if (gameStore.drawing.mode === 'none') return
    
    gameStore.drawing.isDrawing = true
    gameStore.drawing.startPoint = point
    gameStore.drawing.currentPoint = point
  },
  
  updateDrawing(point: PixeloidCoordinate): void {
    if (!gameStore.drawing.isDrawing) return
    gameStore.drawing.currentPoint = point
  },
  
  // ==========================================
  // UTILITY OPERATIONS
  // ==========================================
  
  clearAllObjects(): void {
    gameStore.objects = []
    this.clearSelection()
  },
  
  getObjectById(objectId: string): GeometricObject | null {
    return gameStore.objects.find(obj => obj.id === objectId) || null
  },
  
  getSelectedObject(): GeometricObject | null {
    return gameStore.selection.selectedId 
      ? this.getObjectById(gameStore.selection.selectedId)
      : null
  },
  
  // ==========================================
  // MOUSE & NAVIGATION
  // ==========================================
  
  updateMousePosition(position: PixeloidCoordinate): void {
    gameStore.mouse.position = position
  },
  
  updateNavigationOffset(deltaX: number, deltaY: number): void {
    gameStore.navigation.offset.x += deltaX
    gameStore.navigation.offset.y += deltaY
  },
  
  resetNavigationOffset(): void {
    gameStore.navigation.offset = { x: 0, y: 0 }
  }
}

// ================================
// TYPE DEFINITIONS (CORRECTED)
// ================================

interface CreateObjectParams {
  type: string
  vertices?: PixeloidCoordinate[]
  style?: StyleSettings  // CORRECTED: StyleSettings
  properties?: any  // Will use GeometryProperties when needed
}

interface ObjectDimensions {
  width?: number
  height?: number
  radius?: number
  center?: PixeloidCoordinate
  [key: string]: any
}

interface PreviewUpdateData {
  operation: 'create' | 'move' | 'resize'
  formData?: ObjectEditFormData
  vertices?: PixeloidCoordinate[]
  dimensions?: ObjectDimensions
}

export type { GameStoreData, CreateObjectParams, ObjectDimensions, PreviewUpdateData }
```

### **Step 1.2: Create Action Modules (CORRECTED IMPORTS)**

#### **File: `app/src/store/actions/CreateActions.ts`** (CORRECTED)
```typescript
/**
 * Create Actions - Object Creation Operations (CORRECTED)
 * 
 * Pure functions for creating new objects in the store.
 * Uses REAL types from actual codebase.
 */

import type { GameStoreData, CreateObjectParams } from '../game-store'
import type { DrawingMode, PixeloidCoordinate, GeometricObject } from '../../types'  // CORRECTED imports
import { GeometryHelper } from '../helpers/GeometryHelper'

export const CreateActions = {
  /**
   * Create a new object from parameters (CORRECTED)
   */
  createObject(store: GameStoreData, params: CreateObjectParams): string {
    // Generate vertices using unified helper
    const vertices = params.vertices || GeometryHelper.generateVertices(params.type, params.properties)
    
    // CORRECTED: Use real GeometricObject structure from ecs-data-layer
    const newObject: GeometricObject = {
      id: `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: params.type as GeometricObject['type'],  // CORRECTED type casting
      vertices: vertices,
      bounds: GeometryHelper.calculateBounds(vertices),
      style: {
        color: params.style?.color || store.defaultStyle.color,
        strokeWidth: params.style?.strokeWidth || store.defaultStyle.strokeWidth,
        strokeAlpha: params.style?.strokeAlpha || store.defaultStyle.strokeAlpha,
        fillColor: params.style?.fillColor,
        fillAlpha: params.style?.fillAlpha
      },
      isVisible: true,
      createdAt: Date.now(),
      properties: params.properties || GeometryHelper.calculateProperties(params.type, vertices)
    }
    
    // Add to store
    store.objects.push(newObject)
    return newObject.id
  },
  
  /**
   * Finish drawing and create object (CORRECTED)
   */
  finishDrawing(store: GameStoreData, mode: DrawingMode, startPoint: PixeloidCoordinate, endPoint: PixeloidCoordinate): string {
    // Calculate drawing properties using unified helper
    const properties = GeometryHelper.calculateDrawingProperties(mode, startPoint, endPoint)
    
    // Create object using standard creation path
    return this.createObject(store, {
      type: mode,
      properties: properties,
      style: store.defaultStyle
    })
  }
}
```

### **Step 1.3: Create Helper Module (CORRECTED IMPORTS)**

#### **File: `app/src/store/helpers/GeometryHelper.ts`** (CORRECTED)
```typescript
/**
 * Unified Geometry Helper - Single Helper for ALL Shapes (CORRECTED)
 * 
 * This is the key module that fixes the circle bug by providing
 * consistent forward-only calculations for all geometry operations.
 * Uses REAL types from actual codebase.
 */

import type { PixeloidCoordinate, ECSBoundingBox, DrawingMode, GeometryProperties } from '../../types'

export class GeometryHelper {
  // ==========================================
  // VERTEX GENERATION (Forward calculation only)
  // ==========================================
  
  /**
   * Generate vertices from properties (FORWARD ONLY - No reverse engineering)
   */
  static generateVertices(type: string, properties: any): PixeloidCoordinate[] {
    switch (type) {
      case 'circle':
        return this.generateCircleVertices(properties.center, properties.radius)
      case 'rectangle':
        return this.generateRectangleVertices(properties.center, properties.width, properties.height)
      case 'line':
        return this.generateLineVertices(properties.startPoint, properties.endPoint)
      case 'diamond':
        return this.generateDiamondVertices(properties.center, properties.width, properties.height)
      case 'point':
        return [properties.center]
      default:
        throw new Error(`Unknown shape type: ${type}`)
    }
  }
  
  /**
   * Move vertices by offset (fine-grained control)
   */
  static moveVertices(vertices: PixeloidCoordinate[], offset: PixeloidCoordinate): PixeloidCoordinate[] {
    return vertices.map(vertex => ({
      x: vertex.x + offset.x,
      y: vertex.y + offset.y
    }))
  }
  
  // ==========================================
  // BOUNDS CALCULATION (Consistent everywhere)
  // ==========================================
  
  static calculateBounds(vertices: PixeloidCoordinate[]): ECSBoundingBox {
    if (vertices.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 }
    }
    
    const xs = vertices.map(v => v.x)
    const ys = vertices.map(v => v.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    
    return {
      minX, minY, maxX, maxY,
      width: maxX - minX,
      height: maxY - minY
    }
  }
  
  // ==========================================
  // DRAWING CALCULATIONS (For drawing system)
  // ==========================================
  
  static calculateDrawingProperties(mode: DrawingMode, startPoint: PixeloidCoordinate, endPoint: PixeloidCoordinate): any {
    switch (mode) {
      case 'circle':
        const center = {
          x: (startPoint.x + endPoint.x) / 2,
          y: (startPoint.y + endPoint.y) / 2
        }
        const radius = Math.sqrt(
          Math.pow(endPoint.x - startPoint.x, 2) + 
          Math.pow(endPoint.y - startPoint.y, 2)
        ) / 2
        return { center, radius }
        
      case 'rectangle':
        const rectCenter = {
          x: (startPoint.x + endPoint.x) / 2,
          y: (startPoint.y + endPoint.y) / 2
        }
        return {
          center: rectCenter,
          width: Math.abs(endPoint.x - startPoint.x),
          height: Math.abs(endPoint.y - startPoint.y)
        }
        
      case 'line':
        return { startPoint, endPoint }
        
      default:
        throw new Error(`Drawing properties not implemented for ${mode}`)
    }
  }
  
  // ==========================================
  // PROPERTIES CALCULATION (CORRECTED - return GeometryProperties)
  // ==========================================
  
  static calculateProperties(type: string, vertices: PixeloidCoordinate[]): GeometryProperties {
    const bounds = this.calculateBounds(vertices)
    
    switch (type) {
      case 'circle':
        return {
          type: 'circle',
          center: { x: bounds.minX + bounds.width / 2, y: bounds.minY + bounds.height / 2 },
          radius: bounds.width / 2,
          diameter: bounds.width,
          circumference: Math.PI * bounds.width,
          area: Math.PI * Math.pow(bounds.width / 2, 2)
        }
      
      case 'rectangle':
        return {
          type: 'rectangle',
          center: { x: bounds.minX + bounds.width / 2, y: bounds.minY + bounds.height / 2 },
          topLeft: { x: bounds.minX, y: bounds.minY },
          bottomRight: { x: bounds.maxX, y: bounds.maxY },
          width: bounds.width,
          height: bounds.height,
          area: bounds.width * bounds.height,
          perimeter: 2 * (bounds.width + bounds.height)
        }
        
      case 'point':
        const center = vertices[0] || { x: 0, y: 0 }
        return {
          type: 'point',
          center: center
        }
        
      case 'line':
        const start = vertices[0] || { x: 0, y: 0 }
        const end = vertices[1] || { x: 0, y: 0 }
        const dx = end.x - start.x
        const dy = end.y - start.y
        return {
          type: 'line',
          startPoint: start,
          endPoint: end,
          midpoint: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
          length: Math.sqrt(dx * dx + dy * dy),
          angle: Math.atan2(dy, dx)
        }
        
      case 'diamond':
        const west = vertices[0] || { x: -1, y: 0 }
        const north = vertices[1] || { x: 0, y: -1 }
        const east = vertices[2] || { x: 1, y: 0 }
        const south = vertices[3] || { x: 0, y: 1 }
        const diamondCenter = { x: (west.x + east.x) / 2, y: (north.y + south.y) / 2 }
        const diamondWidth = east.x - west.x
        const diamondHeight = south.y - north.y
        return {
          type: 'diamond',
          center: diamondCenter,
          west, north, east, south,
          width: diamondWidth,
          height: diamondHeight,
          area: (diamondWidth * diamondHeight) / 2,
          perimeter: 2 * Math.sqrt((diamondWidth/2) * (diamondWidth/2) + (diamondHeight/2) * (diamondHeight/2))
        }
        
      default:
        throw new Error(`Properties calculation not implemented for ${type}`)
    }
  }
  
  // ==========================================
  // PRIVATE SHAPE-SPECIFIC IMPLEMENTATIONS
  // ==========================================
  
  private static generateCircleVertices(center: PixeloidCoordinate, radius: number): PixeloidCoordinate[] {
    const segments = 32
    const vertices: PixeloidCoordinate[] = []
    
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * 2 * Math.PI
      vertices.push({
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius
      })
    }
    
    return vertices
  }
  
  private static generateRectangleVertices(center: PixeloidCoordinate, width: number, height: number): PixeloidCoordinate[] {
    const halfWidth = width / 2
    const halfHeight = height / 2
    
    return [
      { x: center.x - halfWidth, y: center.y - halfHeight }, // top-left
      { x: center.x + halfWidth, y: center.y - halfHeight }, // top-right
      { x: center.x + halfWidth, y: center.y + halfHeight }, // bottom-right
      { x: center.x - halfWidth, y: center.y + halfHeight }  // bottom-left
    ]
  }
  
  private static generateLineVertices(startPoint: PixeloidCoordinate, endPoint: PixeloidCoordinate): PixeloidCoordinate[] {
    return [startPoint, endPoint]
  }
  
  private static generateDiamondVertices(center: PixeloidCoordinate, width: number, height: number): PixeloidCoordinate[] {
    const halfWidth = width / 2
    const halfHeight = height / 2
    
    return [
      { x: center.x, y: center.y - halfHeight },      // top
      { x: center.x + halfWidth, y: center.y },       // right
      { x: center.x, y: center.y + halfHeight },      // bottom
      { x: center.x - halfWidth, y: center.y }        // left
    ]
  }
}
```

### **Step 1.4: Create Preview System (CORRECTED)**

#### **File: `app/src/store/systems/PreviewSystem.ts`** (CORRECTED)
```typescript
/**
 * Preview System - Unified Preview for All Operations (CORRECTED)
 * 
 * This is the key module that fixes the circle bug by using the
 * SAME methods for preview as actual operations.
 * Uses REAL types from actual codebase.
 */

import type { GameStoreData, PreviewUpdateData } from '../game-store'
import type { GeometricObject, ObjectEditFormData } from '../../types'  // CORRECTED imports
import { GeometryHelper } from '../helpers/GeometryHelper'

export const PreviewSystem = {
  /**
   * Start preview operation (CORRECTED)
   */
  startPreview(store: GameStoreData, operation: 'create' | 'move' | 'resize', originalObjectId?: string): void {
    if (originalObjectId) {
      // Editing existing object - create copy for preview
      const originalObject = store.objects.find(obj => obj.id === originalObjectId)
      if (originalObject) {
        // CORRECTED: Use real ObjectEditPreviewState structure
        store.preview = {
          isActive: true,
          editingObjectId: originalObjectId,
          originalObject: { ...originalObject },
          previewData: {
            previewProperties: originalObject.properties,
            previewVertices: [...originalObject.vertices],
            previewStyle: { ...originalObject.style },
            previewBounds: { ...originalObject.bounds },
            isValid: true,
            hasChanges: false,
            lastUpdateTime: Date.now()
          },
          shouldShowPreview: true,
          previewOpacity: 0.8
        }
      }
    } else {
      // Creating new object - will be populated by updatePreview
      store.preview = {
        isActive: true,
        editingObjectId: null,
        originalObject: null,
        previewData: null,
        shouldShowPreview: true,
        previewOpacity: 0.8
      }
    }
  },
  
  /**
   * Update preview - USES SAME METHODS AS ACTUAL OPERATIONS (CORRECTED)
   * This is the key fix for the circle bug!
   */
  updatePreview(store: GameStoreData, data: PreviewUpdateData): void {
    if (!store.preview.isActive) return
    
    switch (data.operation) {
      case 'create':
        if (data.formData) {
          // Create preview object using SAME geometry helper as actual operations
          const vertices = this.generateVerticesFromFormData(data.formData)
          const properties = this.generatePropertiesFromFormData(data.formData)
          
          store.preview.previewData = {
            previewProperties: properties,
            previewVertices: vertices,
            previewStyle: {
              color: parseInt(data.formData.style.strokeColor.replace('#', ''), 16) || store.defaultStyle.color,
              strokeWidth: data.formData.style.strokeWidth || store.defaultStyle.strokeWidth,
              strokeAlpha: data.formData.style.strokeAlpha || store.defaultStyle.strokeAlpha,
              fillColor: data.formData.style.fillColor ? parseInt(data.formData.style.fillColor.replace('#', ''), 16) : undefined,
              fillAlpha: data.formData.style.fillAlpha
            },
            previewBounds: GeometryHelper.calculateBounds(vertices),
            isValid: true,
            hasChanges: true,
            lastUpdateTime: Date.now()
          }
        }
        break
        
      case 'move':
        if (store.preview.previewData) {
          if (data.vertices) {
            // Direct vertex update
            store.preview.previewData.previewVertices = data.vertices
            store.preview.previewData.previewBounds = GeometryHelper.calculateBounds(data.vertices)
          } else if (data.formData) {
            // ✅ CIRCLE BUG FIX: Use form data directly (no reverse engineering)
            const vertices = this.generateVerticesFromFormData(data.formData)
            const properties = this.generatePropertiesFromFormData(data.formData)
            
            store.preview.previewData.previewVertices = vertices
            store.preview.previewData.previewBounds = GeometryHelper.calculateBounds(vertices)
            store.preview.previewData.previewProperties = properties
            store.preview.previewData.hasChanges = true
            store.preview.previewData.lastUpdateTime = Date.now()
          }
        }
        break
        
      case 'resize':
        if (store.preview.previewData && data.dimensions) {
          // Use SAME geometry generation as actual operations
          const vertices = GeometryHelper.generateVertices(
            store.preview.originalObject?.type || 'point', 
            data.dimensions
          )
          store.preview.previewData.previewVertices = vertices
          store.preview.previewData.previewBounds = GeometryHelper.calculateBounds(vertices)
          store.preview.previewData.hasChanges = true
          store.preview.previewData.lastUpdateTime = Date.now()
        }
        break
    }
  },
  
  /**
   * Commit preview to actual store (CORRECTED)
   */
  commitPreview(store: GameStoreData): void {
    if (!store.preview.isActive || !store.preview.previewData) return
    
    if (store.preview.editingObjectId) {
      // Update existing object with preview data
      const objIndex = store.objects.findIndex(obj => obj.id === store.preview.editingObjectId)
      if (objIndex !== -1) {
        store.objects[objIndex] = {
          ...store.objects[objIndex],
          vertices: store.preview.previewData.previewVertices,
          bounds: store.preview.previewData.previewBounds!,
          properties: store.preview.previewData.previewProperties!,
          style: {
            ...store.objects[objIndex].style,
            ...store.preview.previewData.previewStyle
          }
        }
      }
    } else {
      // Add new object (CORRECTED: use GeometricObject structure)
      const newObject: GeometricObject = {
        id: `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: store.preview.previewData.previewProperties?.type as GeometricObject['type'] || 'point',
        vertices: store.preview.previewData.previewVertices,
        bounds: store.preview.previewData.previewBounds!,
        style: {
          color: store.preview.previewData.previewStyle.color || store.defaultStyle.color,
          strokeWidth: store.preview.previewData.previewStyle.strokeWidth || store.defaultStyle.strokeWidth,
          strokeAlpha: store.preview.previewData.previewStyle.strokeAlpha || store.defaultStyle.strokeAlpha,
          fillColor: store.preview.previewData.previewStyle.fillColor,
          fillAlpha: store.preview.previewData.previewStyle.fillAlpha
        },
        isVisible: true,
        createdAt: Date.now(),
        properties: store.preview.previewData.previewProperties!
      }
      store.objects.push(newObject)
    }
    
    this.clearPreview(store)
  },
  
  /**
   * Cancel preview (CORRECTED)
   */
  cancelPreview(store: GameStoreData): void {
    this.clearPreview(store)
  },
  
  /**
   * Clear preview state (CORRECTED)
   */
  private clearPreview(store: GameStoreData): void {
    store.preview = {
      isActive: false,
      editingObjectId: null,
      originalObject: null,
      previewData: null,
      shouldShowPreview: true,
      previewOpacity: 0.8
    }
  },
  
  // ==========================================
  // FORM DATA HELPERS (Circle Bug Fix - CORRECTED)
  // ==========================================
  
  /**
   * Generate vertices from form data (FORWARD CALCULATION ONLY)
   */
  private generateVerticesFromFormData(formData: ObjectEditFormData): PixeloidCoordinate[] {
    if (formData.circle) {
      return GeometryHelper.generateVertices('circle', {
        center: { x: formData.circle.centerX, y: formData.circle.centerY },
        radius: formData.circle.radius
      })
    }
    
    if (formData.rectangle) {
      return GeometryHelper.generateVertices('rectangle', {
        center: { x: formData.rectangle.centerX, y: formData.rectangle.centerY },
        width: formData.rectangle.width,
        height: formData.rectangle.height
      })
    }
    
    if (formData.line) {
      return GeometryHelper.generateVertices('line', {
        startPoint: { x: formData.line.startX, y: formData.line.startY },
        endPoint: { x: formData.line.endX, y: formData.line.endY }
      })
    }
    
    if (formData.point) {
      return GeometryHelper.generateVertices('point', {
        center: { x: formData.point.centerX, y: formData.point.centerY }
      })
    }
    
    if (formData.diamond) {
      return GeometryHelper.generateVertices('diamond', {
        center: { x: formData.diamond.centerX, y: formData.diamond.centerY },
        width: formData.diamond.width,
        height: formData.diamond.height
      })
    }
    
    return []
  },
  
  /**
   * Generate properties from form data (DIRECT FROM FORM - NO CALCULATION)
   */
  private generatePropertiesFromFormData(formData: ObjectEditFormData): any {
    if (formData.circle) {
      // ✅ CIRCLE BUG FIX: Use form data directly
      const radius = formData.circle.radius
      return {
        type: 'circle',
        center: { x: formData.circle.centerX, y: formData.circle.centerY },
        radius: radius,  // ✅ Direct from form - NO REVERSE ENGINEERING
        diameter: radius * 2,
        circumference: 2 * Math.PI * radius,
        area: Math.PI * radius * radius
      }
    }
    
    if (formData.rectangle) {
      return {
        type: 'rectangle',
        center: { x: formData.rectangle.centerX, y: formData.rectangle.centerY },
        topLeft: { 
          x: formData.rectangle.centerX - formData.rectangle.width / 2, 
          y: formData.rectangle.centerY - formData.rectangle.height / 2 
        },
        bottomRight: { 
          x: formData.rectangle.centerX + formData.rectangle.width / 2, 
          y: formData.rectangle.centerY + formData.rectangle.height / 2 
        },
        width: formData.rectangle.width,
        height: formData.rectangle.height,
        area: formData.rectangle.width * formData.rectangle.height,
        perimeter: 2 * (formData.rectangle.width + formData.rectangle.height)
      }
    }
    
    if (formData.point) {
      return {
        type: 'point',
        center: { x: formData.point.centerX, y: formData.point.centerY }
      }
    }
    
    if (formData.line) {
      const start = { x: formData.line.startX, y: formData.line.startY }
      const end = { x: formData.line.endX, y: formData.line.endY }
      const dx = end.x - start.x
      const dy = end.y - start.y
      return {
        type: 'line',
        startPoint: start,
        endPoint: end,
        midpoint: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
        length: Math.sqrt(dx * dx + dy * dy),
        angle: Math.atan2(dy, dx)
      }
    }
    
    return { type: 'unknown' }
  }
}
```

---

## 📋 **KEY CORRECTIONS FROM ORIGINAL PLAN**

### **❌ Original Wrong Assumptions**:
- `GeometryStyle` type (doesn't exist - use `StyleSettings`)
- `GeometricObject` in geometry-drawing.ts (it's in ecs-data-layer.ts)  
- `createMeshLevel()` function (doesn't exist - use `createMeshSystem()`)
- Various form data types like `CircleFormData` (don't exist as exports)

### **✅ Corrected Reality**:
- `StyleSettings` from geometry-drawing.ts
- `GeometricObject` from ecs-data-layer.ts
- `ObjectEditFormData` from geometry-drawing.ts (real structure)
- `ObjectEditPreviewState` from geometry-drawing.ts (real structure)
- All coordinate types from ecs-coordinates.ts

### **🎯 Circle Bug Fix Consistency**:
- Preview system uses `generatePropertiesFromFormData()` with direct form values
- Both preview and commit use same `GeometryHelper.generateVertices()`
- No reverse engineering from vertices to properties
- Form data flows directly to final object properties

---

## ✅ **VERIFICATION STEPS**

### **Phase 0 Verification**:
```bash
cd app
npm run type-check
# Should compile without require() or missing export errors
```

### **Phase 1 Verification**:
```typescript
// Test the corrected store
import { gameStore, gameStore_methods } from './store/game-store'

// Test object creation with REAL types
const circleId = gameStore_methods.createObject({
  type: 'circle',
  properties: { center: { x: 100, y: 100 }, radius: 50 }
})

// Test preview system (circle bug fix) with REAL ObjectEditFormData
gameStore_methods.startPreview('move', circleId)
gameStore_methods.updatePreview({
  operation: 'move',
  formData: {
    isVisible: true,
    circle: { centerX: 150, centerY: 100, radius: 50 },
    style: { 
      strokeColor: '#0066cc', 
      strokeWidth: 2, 
      strokeAlpha: 1.0, 
      hasFill: false 
    }
  }
})
gameStore_methods.commitPreview()

// Verify: radius should stay exactly 50 using REAL GeometryProperties
console.log(gameStore.objects[0].properties.radius) // Should be 50, not 47.3
```

---

**Status**: CORRECTED IMPLEMENTATION PLAN  
**Based On**: Actual existing types from real codebase  
**Circle Bug**: Fixed through unified preview/commit system using real types  
**Ready For**: Implementation with accurate type imports