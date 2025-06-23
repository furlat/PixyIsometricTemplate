# ✅ GeometryRenderer Cleanup Verification Checklist

## 🎯 **Pre-Cleanup State Assessment**

### **Current Issues to Resolve:**
- [ ] 17 TypeScript errors related to missing `objectBboxMeshes` property
- [ ] 3 TypeScript errors related to missing `pixelateFilter` property  
- [ ] 1 TypeScript error related to missing `subscribeToSelectionChanges` method
- [ ] Mixed responsibilities: geometry rendering + bbox mesh management + pixelate filtering

### **Target State:**
- [ ] Pure geometry rendering functionality only
- [ ] Clean separation: geometry objects handled by GeometryRenderer, pixelate effects by PixelateFilterRenderer
- [ ] No TypeScript errors
- [ ] ~200 lines of code reduction (850 → 650 lines)

## 🛠️ **Implementation Checklist**

### **Phase 1: Imports & Properties ✅**
- [ ] Remove `import { PixelateFilter } from 'pixi-filters'`
- [ ] Remove `import { BboxMeshReference } from '../types'`  
- [ ] Remove `private objectBboxMeshes: Map<string, Graphics> = new Map()`
- [ ] Remove `private pixelateFilter: PixelateFilter`

### **Phase 2: Constructor Cleanup ✅**
- [ ] Remove pixelate filter initialization (5 lines)
- [ ] Remove `this.subscribeToFilterChanges()`
- [ ] Remove `this.subscribeToObjectChanges()`
- [ ] Fix method name: `subscribeToSelectionChanges()` → `subscribeToSelection()`

### **Phase 3: Remove Entire Methods ✅**
- [ ] Remove `subscribeToFilterChanges()` method
- [ ] Remove `updatePixelateFilterState()` method
- [ ] Remove `updatePixelateFilterScale()` method
- [ ] Remove `subscribeToObjectChanges()` method
- [ ] Remove `needsBboxUpdate()` method
- [ ] Remove `updateBboxMeshForObject()` method
- [ ] Remove `createBboxMeshForObject()` method
- [ ] Remove `getFiltersForObject()` method
- [ ] Remove `updateAllObjectFilters()` method
- [ ] Remove `updateBboxMeshPosition()` method

### **Phase 4: Clean Existing Methods ✅**
- [ ] **render()**: Remove bbox mesh cleanup section (lines ~74-88)
- [ ] **updateGeometricObjectWithCoordinateConversion()**: Remove bbox mesh creation (lines ~143-149)
- [ ] **destroy()**: Remove bbox mesh cleanup (lines ~810-815)

### **Phase 5: Add Missing Functionality ✅**
- [ ] Create `subscribeToSelection()` method
- [ ] Create `updateSelectionContainerAssignment()` method
- [ ] Wire selection changes to container assignment

## 🔍 **Post-Cleanup Verification**

### **Functionality Tests:**
- [ ] Geometry objects still render correctly
- [ ] Selection highlighting works (objects move to selectedContainer)
- [ ] Preview rendering still works
- [ ] Coordinate conversion still accurate
- [ ] No visual regressions

### **Architecture Tests:**
- [ ] GeometryRenderer only handles geometry rendering
- [ ] PixelateFilterRenderer handles pixelate effects independently
- [ ] SelectionFilterRenderer handles selection highlights independently
- [ ] Clean separation of concerns

### **Technical Tests:**
- [ ] Zero TypeScript errors
- [ ] No console errors
- [ ] Performance not degraded
- [ ] Memory usage not increased

### **Integration Tests:**
- [ ] LayeredInfiniteCanvas renders all layers correctly
- [ ] Pixelate filter toggle works via PixelateFilterRenderer
- [ ] Selection toggle works via SelectionFilterRenderer
- [ ] Background grid and mouse systems unaffected

## 🚨 **Risk Mitigation**

### **Backup Strategy:**
- [ ] Current GeometryRenderer backed up (git state preserved)
- [ ] Can revert if critical issues found
- [ ] Incremental testing after each phase

### **Error Prevention:**
- [ ] Follow exact line numbers from plan
- [ ] Remove entire methods rather than partial cleanup
- [ ] Test after each major phase
- [ ] Verify TypeScript compilation at each step

### **Rollback Triggers:**
- [ ] If geometry rendering breaks
- [ ] If selection highlighting fails
- [ ] If coordinate conversion fails
- [ ] If performance significantly degrades

## 📊 **Success Metrics**

### **Code Quality:**
- [ ] Lines of code: 850 → ~650 (23% reduction)
- [ ] Cyclomatic complexity reduced
- [ ] Single responsibility principle achieved
- [ ] No mixed concerns

### **Maintainability:**
- [ ] Clear method names and purposes
- [ ] No complex subscription logic
- [ ] No filter management complexity
- [ ] Easy to understand and debug

### **Performance:**
- [ ] No bbox mesh creation overhead
- [ ] No filter management overhead
- [ ] Simpler object lifecycle
- [ ] Faster rendering loop

This systematic approach ensures we complete the cleanup without breaking existing functionality!