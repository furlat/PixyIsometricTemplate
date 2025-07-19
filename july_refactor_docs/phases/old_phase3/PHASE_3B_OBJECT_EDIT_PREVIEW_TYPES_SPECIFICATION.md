# Phase 3B: Object Edit Preview Types Specification

## 🎯 **TEMPORARY PREVIEW TYPES** - Exactly Like Drag System

### **Current Drag System Types** (Working Example):
```typescript
// ✅ EXISTING: Drag preview state (gameStore_3b.ts line 92-97)
dragPreview: {
  isActive: boolean
  currentMousePosition: PixeloidCoordinate | null
  previewVertices: PixeloidCoordinate[]  // PREVIEW ONLY - original unchanged
}
```

## 📋 **REQUIRED: Object Edit Preview Types**

### **New Types to Add to `geometry-drawing.ts`**:

```typescript
// ================================
// OBJECT EDIT PREVIEW SYSTEM
// ================================

/**
 * Temporary preview data for object editing - SEPARATE from renderer data
 */
export interface ObjectEditPreviewData {
  // Shape-specific preview properties (user input)
  previewProperties: GeometryProperties | null
  previewVertices: PixeloidCoordinate[]
  previewStyle: Partial<StyleSettings>
  previewBounds: ECSBoundingBox | null
  
  // UI state
  isValid: boolean
  hasChanges: boolean
  lastUpdateTime: number
}

/**
 * Object edit preview state - EXACTLY like drag system
 */
export interface ObjectEditPreviewState {
  isActive: boolean
  editingObjectId: string | null
  originalObject: GeometricObject | null  // For cancel restoration
  previewData: ObjectEditPreviewData | null
  
  // Preview rendering info (separate from actual renderer)
  shouldShowPreview: boolean
  previewOpacity: number
}

/**
 * Object edit form data - UI input values (NOT stored properties)
 */
export interface ObjectEditFormData {
  // Common properties
  isVisible: boolean
  
  // Type-specific form inputs
  point?: {
    centerX: number
    centerY: number
  }
  
  line?: {
    startX: number
    startY: number
    endX: number
    endY: number
  }
  
  circle?: {
    centerX: number
    centerY: number
    radius: number
  }
  
  rectangle?: {
    centerX: number
    centerY: number
    width: number
    height: number
  }
  
  diamond?: {
    centerX: number
    centerY: number
    width: number
    height: number
  }
  
  // Style form inputs
  style: {
    strokeColor: string  // hex color for UI
    strokeWidth: number
    strokeAlpha: number
    fillColor?: string   // hex color for UI
    fillAlpha?: number
    hasFill: boolean
  }
}
```

## 🔧 **Store Integration Types**

### **Addition to `GameState3b` interface**:

```typescript
// ✅ NEW: Object edit preview state - like drag system
editPreview: ObjectEditPreviewState
```

### **Factory Function**:

```typescript
/**
 * Create default object edit preview state
 */
export const createDefaultObjectEditPreviewState = (): ObjectEditPreviewState => ({
  isActive: false,
  editingObjectId: null,
  originalObject: null,
  previewData: null,
  shouldShowPreview: true,
  previewOpacity: 0.8
})
```

## 🎯 **USAGE FLOW**

### **✅ CORRECT Object Edit Flow**:

```typescript
// 1. OPEN PANEL: Store original, create preview
openEditPanel(objectId: string) {
  const original = store.geometry.objects.find(obj => obj.id === objectId)
  
  store.editPreview.isActive = true
  store.editPreview.editingObjectId = objectId
  store.editPreview.originalObject = { ...original }  // Deep copy for restoration
  store.editPreview.previewData = createPreviewFromObject(original)
}

// 2. USER TYPES: Update preview ONLY (no store spam)
updatePreview(formData: ObjectEditFormData) {
  // Generate new vertices from form inputs
  const newVertices = generateVerticesFromFormData(formData)
  
  // Update preview state ONLY
  store.editPreview.previewData.previewVertices = newVertices
  store.editPreview.previewData.previewProperties = calculatePropertiesFromFormData(formData)
  
  // Original object UNCHANGED
}

// 3. APPLY: Commit preview to store (single update)
applyChanges() {
  const previewData = store.editPreview.previewData
  
  // SINGLE store update
  updateGeometryObject(editingObjectId, {
    vertices: previewData.previewVertices,
    properties: previewData.previewProperties,
    style: previewData.previewStyle
  })
  
  clearEditPreview()
}

// 4. CANCEL: Restore original (no store spam)
cancelChanges() {
  // Original already preserved, just clear preview
  clearEditPreview()
}
```

## 🚨 **CRITICAL VERTEX AUTHORITY COMPLIANCE**

### **✅ NO MULTIPATH** - Properties from Form Input:

```typescript
// ✅ CORRECT: Properties calculated from form input (like creation)
calculatePropertiesFromFormData(formData: ObjectEditFormData): GeometryProperties {
  switch (formData.type) {
    case 'circle':
      // Use form center + radius (NOT vertices)
      return calculateCircleProperties(formData.circle.center, formData.circle.radius)
    
    case 'rectangle':
      // Use form center + dimensions (NOT vertices)
      return calculateRectangleProperties(formData.rectangle.center, formData.rectangle.width, formData.rectangle.height)
  }
}

// ❌ NEVER: Properties calculated from vertices
// calculateProperties(vertices) ← FORBIDDEN IN EDIT FLOW
```

## 📋 **RENDERER INTEGRATION**

### **Preview Renderer Access**:

```typescript
// Renderer checks preview state
getObjectToRender(objectId: string): GeometricObject {
  // If editing this object, show preview
  if (store.editPreview.isActive && store.editPreview.editingObjectId === objectId) {
    return createPreviewObject(store.editPreview.previewData)
  }
  
  // Otherwise show original
  return store.geometry.objects.find(obj => obj.id === objectId)
}
```

## 🏆 **SUCCESS CRITERIA**

✅ **Temporary preview types** separate from renderer data  
✅ **No store spam** during editing (like drag system)  
✅ **Single commit** on Apply (like drag system)  
✅ **Perfect restoration** on Cancel (like drag system)  
✅ **Vertex authority** maintained - properties from form input  
✅ **Live preview** shows changes instantly without touching original  

**Architecture**: **EXACTLY like drag system** - preview state, original preserved, single commit.