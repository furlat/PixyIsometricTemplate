/**
 * InputManager - Unified Drawing System with Delayed Preview Creation
 *
 * UNIFIED SOLUTION: Fixes all drawing issues through single geometry generator
 * - Delayed preview creation (no preview until movement detected)
 * - UnifiedGeometryGenerator for consistent geometry generation
 * - ALWAYS use PreviewSystem for object operations
 * - Single creation path for both drawing and editing
 */

import { gameStore, gameStore_methods } from '../store/game-store'
import { PreviewSystem } from '../store/systems/PreviewSystem'
import { UnifiedGeometryGenerator } from '../store/helpers/UnifiedGeometryGenerator'
import type {
  PixeloidCoordinate,
  GeometricObject,
  ObjectEditFormData,
  DrawingMode
} from '../types'
import type { FederatedMouseEvent } from 'pixi.js'

export class InputManager {
  // ===== SAFE INPUT DETECTION COMPONENTS =====
  private hitTester = new HitTester()
  private clickDetector = new ClickDetector()
  private dragDetector = new DragDetector()
  private keyboardHandler = new KeyboardHandler()
  
  // ===== INITIALIZATION =====
  constructor() {
    this.setupEventHandlers()
    console.log('InputManager: Safe input system initialized')
  }
  
  public initialize(): void {
    this.keyboardHandler.initialize()
    console.log('InputManager: Complete input system ready')
  }
  
  // ===== SAFE MOUSE EVENT HANDLERS =====
  public handleMouseDown(coord: PixeloidCoordinate, event: FederatedMouseEvent | MouseEvent): void {
    // ✅ SAFE: Input detection only
    const hitObjectId = this.hitTester.getObjectAtPosition(coord)
    const clickType = this.clickDetector.handleMouseDown(coord)
    
    console.log('InputManager: Mouse down', { coord, hitObjectId, clickType })
    
    // ✅ SAFE: Route to appropriate handler
    if (gameStore.drawing.mode === 'none') {
      this.handleSelectionMode(hitObjectId, coord, clickType, event)
    } else {
      this.handleDrawingMode(hitObjectId, coord, clickType, event)
    }
  }
  
  public handleMouseMove(coord: PixeloidCoordinate): void {
    // ✅ UNIFIED: Movement detection only
    const dragAction = this.dragDetector.handleMouseMove(coord)
    
    // ✅ DRAG AND DROP: Handle object dragging preview updates
    if (gameStore.dragging.isDragging && gameStore.preview.isActive) {
      this.updateDragPreview(coord)
    }
    
    // ✅ UNIFIED: Delayed preview creation on movement
    if (gameStore.drawing.isDrawing) {
      const startPoint = gameStore.drawing.startPoint
      const hasMovement = this.hasMovedFromStartPoint(coord, startPoint)
      
      if (hasMovement) {
        // Create or update preview with UnifiedGeometryGenerator
        if (!gameStore.preview.isActive) {
          this.startPreviewFromMovement(coord)
        } else {
          this.updatePreviewFromMovement(coord)
        }
      }
    }
    
    // ✅ SAFE: Drag updates via existing store methods
    if (dragAction === 'drag-continue') {
      gameStore_methods.updateDragPosition(coord)
    }
  }
  
  public handleMouseUp(coord: PixeloidCoordinate): void {
    // ✅ UNIFIED: Click completion detection
    const clickResult = this.clickDetector.handleMouseUp(coord)
    
    console.log('InputManager: Mouse up', { coord, clickResult })
    
    // ✅ DRAG AND DROP: Complete drag operation
    if (gameStore.dragging.isDragging && gameStore.preview.isActive) {
      this.completeDragOperation()
    }
    
    // ✅ SAFE: Drag completion via existing store methods
    if (this.dragDetector.isDragging) {
      this.dragDetector.reset()
      gameStore_methods.updateDragPosition(coord)
    }
    
    // ✅ UNIFIED: Drawing completion via PreviewSystem
    if (gameStore.drawing.isDrawing && clickResult === 'click') {
      const startPoint = gameStore.drawing.startPoint
      const hasMovement = this.hasMovedFromStartPoint(coord, startPoint)
      
      if (hasMovement && gameStore.preview.isActive) {
        // Finalize drawing with preview
        PreviewSystem.commitPreview(gameStore)
      } else {
        // Handle click-without-drag based on mode
        this.handleClickWithoutDrag(coord)
      }
      
      // ✅ CORRECT BEHAVIOR: Stay in drawing mode but stop drawing state
      // Reset drawing state (isDrawing=false, startPoint=null) but keep mode
      gameStore.drawing.isDrawing = false
      gameStore.drawing.startPoint = null
      gameStore.drawing.currentPoint = null
      // DON'T reset mode - stay in same shape mode for next click
    }
  }
  
  // ===== SAFE MODE-SPECIFIC HANDLERS =====
  private handleSelectionMode(hitObjectId: string | null, coord: PixeloidCoordinate, clickType: string, event: FederatedMouseEvent | MouseEvent): void {
    if (hitObjectId) {
      // ✅ DRAG AND DROP: Check if clicking on already selected object
      if (hitObjectId === gameStore.selection.selectedId) {
        // ✅ Already selected → START DRAG
        if (clickType === 'single-click') {
          this.initiateDragOperation(hitObjectId, coord)
          console.log('InputManager: Drag initiated for selected object', hitObjectId)
        } else if (clickType === 'double-click') {
          // Double-click on selected object - keep selection, don't drag
          console.log('InputManager: Double-click on selected object', hitObjectId)
          // TODO: Open edit panel via existing UI methods
        }
      } else {
        // ✅ Different object → SELECT IT
        if (clickType === 'single-click') {
          gameStore_methods.selectObject(hitObjectId)
          console.log('InputManager: Object selected', hitObjectId)
        } else if (clickType === 'double-click') {
          gameStore_methods.selectObject(hitObjectId)
          console.log('InputManager: Object double-clicked', hitObjectId)
          // TODO: Open edit panel via existing UI methods
        }
      }
    } else {
      // ✅ SAFE: Clear selection via existing store methods
      gameStore_methods.clearSelection()
      console.log('InputManager: Selection cleared')
    }
    
    // ✅ SAFE: Context menu via existing UI methods
    if (event.button === 2 && hitObjectId) {
      this.handleContextMenu(hitObjectId, coord)
    }
  }
  
  private handleDrawingMode(hitObjectId: string | null, coord: PixeloidCoordinate, clickType: string, _event: FederatedMouseEvent | MouseEvent): void {
    // ✅ UNIFIED: Double-click exits drawing mode
    if (clickType === 'double-click' && hitObjectId) {
      gameStore_methods.setDrawingMode('none')
      gameStore_methods.selectObject(hitObjectId)
      console.log('InputManager: Double-click exit drawing mode, selected', hitObjectId)
      return
    }
    
    // ✅ UNIFIED: Set startPoint only, NO immediate preview creation
    gameStore_methods.startDrawing(coord)
    console.log('InputManager: Drawing started, waiting for movement...', gameStore.drawing.mode)
  }
  
  private handleContextMenu(objectId: string, coord: PixeloidCoordinate): void {
    // TODO: Integrate with existing UI context menu system
    console.log('InputManager: Context menu for object', objectId, 'at', coord)
  }
  
  /**
   * Initiate drag operation for the selected object
   * ✅ DRAG AND DROP: Calculate vertex offsets and start drag state
   */
  private initiateDragOperation(objectId: string, clickPosition: PixeloidCoordinate): void {
    const object = gameStore_methods.getObjectById(objectId)
    if (!object) {
      console.warn('InputManager: Cannot drag - object not found:', objectId)
      return
    }
    
    // ✅ Calculate vertex offsets from click position (ONCE - no accumulation)
    const vertexOffsets = object.vertices.map(vertex => ({
      x: vertex.x - clickPosition.x,
      y: vertex.y - clickPosition.y
    }))
    
    // ✅ Start drag using existing method
    gameStore_methods.startDragging(objectId, clickPosition)
    
    // ✅ Store offsets in existing store structure
    gameStore.dragging.vertexOffsets = vertexOffsets
    
    // ✅ Start preview using existing method
    gameStore_methods.startPreview('move', objectId)
    
    console.log('InputManager: Drag initiated:', {
      objectId,
      clickPosition,
      vertexCount: vertexOffsets.length
    })
  }

  /**
   * Update drag preview during mouse movement
   * ✅ DRAG AND DROP: Calculate new vertices from offsets (no accumulation)
   */
  private updateDragPreview(currentMousePosition: PixeloidCoordinate): void {
    const { dragStartPosition, vertexOffsets } = gameStore.dragging
    
    if (!dragStartPosition || !vertexOffsets || vertexOffsets.length === 0) {
      console.warn('InputManager: Cannot update drag preview - missing drag data')
      return
    }
    
    // ✅ Update drag position using existing method
    gameStore_methods.updateDragPosition(currentMousePosition)
    
    // ✅ Calculate mouse delta (absolute, no accumulation)
    const mouseDelta = {
      x: currentMousePosition.x - dragStartPosition.x,
      y: currentMousePosition.y - dragStartPosition.y
    }
    
    // ✅ Calculate new vertices using pre-calculated offsets
    const newVertices = vertexOffsets.map(offset => ({
      x: dragStartPosition.x + offset.x + mouseDelta.x,
      y: dragStartPosition.y + offset.y + mouseDelta.y
    }))
    
    // ✅ Update preview using existing method
    gameStore_methods.updatePreview({
      operation: 'move',
      vertices: newVertices
    })
  }

  /**
   * Complete drag operation by committing preview to store
   * ✅ DRAG AND DROP: Finalize object position in store
   */
  private completeDragOperation(): void {
    // ✅ Commit preview using existing method
    gameStore_methods.commitPreview()
    
    // ✅ Clear drag state using existing method
    gameStore_methods.cancelDragging()
    
    console.log('InputManager: Drag completed and committed to store')
  }
  
  // ===== UNIFIED PREVIEWSYSTEM INTEGRATION =====
  private startPreviewFromMovement(coord: PixeloidCoordinate): void {
    // ✅ UNIFIED: Create preview with UnifiedGeometryGenerator
    const startPoint = gameStore.drawing.startPoint
    const formData = this.generateFormDataFromCoordinates(startPoint!, coord, gameStore.drawing.mode)
    
    PreviewSystem.startPreview(gameStore, 'create')
    PreviewSystem.updatePreview(gameStore, {
      operation: 'create',
      formData: formData
    })
    
    console.log('InputManager: Started preview from movement', gameStore.drawing.mode)
  }
  
  private updatePreviewFromMovement(coord: PixeloidCoordinate): void {
    // ✅ UNIFIED: Update preview with UnifiedGeometryGenerator
    const startPoint = gameStore.drawing.startPoint
    const formData = this.generateFormDataFromCoordinates(startPoint!, coord, gameStore.drawing.mode)
    
    PreviewSystem.updatePreview(gameStore, {
      operation: 'create',
      formData: formData
    })
  }
  
  private handleClickWithoutDrag(coord: PixeloidCoordinate): void {
    if (gameStore.drawing.mode === 'point') {
      // Points can be created with single click
      this.createPointAtPosition(coord)
    } else {
      // Other shapes require dragging - just cancel
      console.log('InputManager: Drag required for', gameStore.drawing.mode, '- canceling')
    }
  }
  
  private createPointAtPosition(coord: PixeloidCoordinate): void {
    // ✅ UNIFIED: Create point immediately using UnifiedGeometryGenerator
    const formData = this.generateFormDataFromCoordinates(coord, coord, 'point')
    
    PreviewSystem.startPreview(gameStore, 'create')
    PreviewSystem.updatePreview(gameStore, {
      operation: 'create',
      formData: formData
    })
    PreviewSystem.commitPreview(gameStore)
    
    console.log('InputManager: Point created at', coord)
  }
  
  // ===== UNIFIED GEOMETRY GENERATION =====
  private generateFormDataFromCoordinates(
    startPoint: PixeloidCoordinate,
    endPoint: PixeloidCoordinate,
    mode: DrawingMode
  ): ObjectEditFormData {
    // ✅ UNIFIED: Use UnifiedGeometryGenerator for all geometry creation
    return UnifiedGeometryGenerator.generateFormData({
      type: mode,
      startPoint: startPoint,
      endPoint: endPoint,
      style: this.getDefaultStyle(),
      isVisible: true
    })
  }
  
  private getDefaultStyle() {
    // ✅ UNIFIED: Get default style from store or use fallback
    return {
      strokeColor: `#${gameStore.defaultStyle.color.toString(16).padStart(6, '0')}`,
      strokeWidth: gameStore.defaultStyle.strokeWidth,
      strokeAlpha: gameStore.defaultStyle.strokeAlpha,
      fillColor: gameStore.defaultStyle.fillEnabled ? `#${gameStore.defaultStyle.fillColor.toString(16).padStart(6, '0')}` : undefined,
      fillAlpha: gameStore.defaultStyle.fillAlpha,
      hasFill: gameStore.defaultStyle.fillEnabled
    }
  }
  
  private hasMovedFromStartPoint(
    current: PixeloidCoordinate,
    start: PixeloidCoordinate | null,
    threshold: number = 2
  ): boolean {
    if (!start) return false
    return UnifiedGeometryGenerator.hasMovementBetweenPoints(start, current, threshold)
  }
  
  // ===== KEYBOARD INTEGRATION =====
  private setupEventHandlers(): void {
    // Setup mouse event delegation (handled by canvas/background renderer)
    // Setup keyboard event handling
    this.keyboardHandler.setupGlobalHandlers()
  }
  
  // ===== SAFE STORE OVERRIDE INTERFACE =====
  public forceReset(): void {
    this.clickDetector.reset()
    this.dragDetector.reset()
    PreviewSystem.cancelPreview(gameStore)  // ✅ Use PreviewSystem
    console.log('InputManager: Force reset applied')
  }
  
  public forceStopDragging(): void {
    this.dragDetector.reset()
    gameStore_methods.updateDragPosition({ x: 0, y: 0 })
    console.log('InputManager: Force stop dragging')
  }
  
  public forceDrawingMode(mode: DrawingMode): void {
    gameStore_methods.setDrawingMode(mode)
    console.log('InputManager: Force drawing mode', mode)
  }
  
  // ===== SAFE CLEANUP =====
  public destroy(): void {
    this.keyboardHandler.destroy()
    this.clickDetector.reset()
    this.dragDetector.reset()
    PreviewSystem.cancelPreview(gameStore)  // ✅ Use PreviewSystem
    console.log('InputManager: Cleanup complete')
  }
  
  // ===== PUBLIC ACCESS =====
  public getDebugInfo(): any {
    return {
      clickState: this.clickDetector.getState(),
      dragState: this.dragDetector.getState(),
      keyboardState: this.keyboardHandler.getState(),
      hitTestCache: this.hitTester.getCacheInfo()
    }
  }
}

// ===== SAFE HELPER CLASSES =====

/**
 * HitTester - Safe object detection (extracted from GeometryRenderer_3b.ts lines 273-405)
 * ✅ SAFE: Uses existing object data, no property calculation
 */
class HitTester {
  private hitTestCache: Map<string, { result: boolean, timestamp: number }> = new Map()
  private cacheTimeout = 100 // ms
  
  // ✅ SAFE: Object detection using existing store data (no property calculation)
  public getObjectAtPosition(coord: PixeloidCoordinate): string | null {
    // Test objects from top to bottom (last drawn first)
    for (let i = gameStore.objects.length - 1; i >= 0; i--) {
      const obj = gameStore.objects[i]
      if (obj.isVisible !== false && this.hitTestObject(obj, coord)) {
        return obj.id
      }
    }
    return null
  }
  
  // ✅ SAFE: Hit test using existing object properties (no recalculation)
  private hitTestObject(obj: GeometricObject, coord: PixeloidCoordinate): boolean {
    // Check cache first
    const cacheKey = `${obj.id}_${coord.x}_${coord.y}`
    const cached = this.hitTestCache.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.result
    }
    
    let result = false
    
    switch (obj.type) {
      case 'point':
        result = this.isPointInsidePoint(coord, obj.vertices[0])
        break
      case 'line':
        result = this.isPointInsideLine(coord, obj.vertices[0], obj.vertices[1], obj.style.strokeWidth)
        break
      case 'circle':
        result = this.isPointInsideCircle(coord, obj.vertices[0], obj.vertices[1])
        break
      case 'rectangle':
        result = this.isPointInsideRectangle(coord, obj.vertices[0], obj.vertices[1])
        break
      case 'diamond':
        result = this.isPointInsideDiamond(coord, obj.vertices)
        break
      default:
        result = false
    }
    
    // Cache result
    this.hitTestCache.set(cacheKey, { result, timestamp: Date.now() })
    
    return result
  }
  
  // ✅ SAFE: Geometric tests using existing data (no property calculation)
  private isPointInsidePoint(clickPos: PixeloidCoordinate, pointPos: PixeloidCoordinate): boolean {
    const dx = Math.abs(clickPos.x - pointPos.x)
    const dy = Math.abs(clickPos.y - pointPos.y)
    return dx <= 2 && dy <= 2 // 4x4 pixeloid selection area
  }
  
  private isPointInsideLine(clickPos: PixeloidCoordinate, startPos: PixeloidCoordinate, endPos: PixeloidCoordinate, strokeWidth: number): boolean {
    const tolerance = Math.max(strokeWidth * 0.5, 2)
    return this.isPointNearLine(clickPos, startPos, endPos, tolerance)
  }
  
  private isPointInsideCircle(clickPos: PixeloidCoordinate, centerPos: PixeloidCoordinate, radiusPos: PixeloidCoordinate): boolean {
    const radius = Math.sqrt(
      Math.pow(radiusPos.x - centerPos.x, 2) +
      Math.pow(radiusPos.y - centerPos.y, 2)
    )
    const distance = Math.sqrt(
      Math.pow(clickPos.x - centerPos.x, 2) +
      Math.pow(clickPos.y - centerPos.y, 2)
    )
    return distance <= radius
  }
  
  private isPointInsideRectangle(clickPos: PixeloidCoordinate, vertex1: PixeloidCoordinate, vertex2: PixeloidCoordinate): boolean {
    // ✅ Direction-independent rectangle hit testing
    const minX = Math.min(vertex1.x, vertex2.x)
    const maxX = Math.max(vertex1.x, vertex2.x)
    const minY = Math.min(vertex1.y, vertex2.y)
    const maxY = Math.max(vertex1.y, vertex2.y)
    
    return clickPos.x >= minX && clickPos.x <= maxX &&
           clickPos.y >= minY && clickPos.y <= maxY
  }
  
  private isPointInsideDiamond(clickPos: PixeloidCoordinate, vertices: PixeloidCoordinate[]): boolean {
    if (vertices.length < 4) return false
    
    // Point-in-polygon algorithm for diamond hit testing
    let inside = false
    let j = vertices.length - 1
    
    for (let i = 0; i < vertices.length; i++) {
      const xi = vertices[i].x
      const yi = vertices[i].y
      const xj = vertices[j].x
      const yj = vertices[j].y
      
      if (((yi > clickPos.y) !== (yj > clickPos.y)) &&
          (clickPos.x < (xj - xi) * (clickPos.y - yi) / (yj - yi) + xi)) {
        inside = !inside
      }
      j = i
    }
    
    return inside
  }
  
  private isPointNearLine(point: PixeloidCoordinate, start: PixeloidCoordinate, end: PixeloidCoordinate, tolerance: number): boolean {
    const A = point.x - start.x
    const B = point.y - start.y
    const C = end.x - start.x
    const D = end.y - start.y
    
    const dot = A * C + B * D
    const lenSq = C * C + D * D
    
    if (lenSq === 0) {
      const dx = point.x - start.x
      const dy = point.y - start.y
      return Math.sqrt(dx * dx + dy * dy) <= tolerance
    }
    
    let param = dot / lenSq
    
    let xx, yy
    if (param < 0) {
      xx = start.x
      yy = start.y
    } else if (param > 1) {
      xx = end.x
      yy = end.y
    } else {
      xx = start.x + param * C
      yy = start.y + param * D
    }
    
    const dx = point.x - xx
    const dy = point.y - yy
    return Math.sqrt(dx * dx + dy * dy) <= tolerance
  }
  
  public getCacheInfo(): any {
    return {
      cacheSize: this.hitTestCache.size,
      cacheTimeout: this.cacheTimeout
    }
  }
  
  public clearCache(): void {
    this.hitTestCache.clear()
  }
}

/**
 * ClickDetector - Safe click timing detection
 * ✅ SAFE: Pure timing detection, no property calculation
 */
class ClickDetector {
  private lastClickTime: number = 0
  private clickCount: number = 0
  private lastClickPosition: PixeloidCoordinate | null = null
  private doubleClickThreshold: number = 500 // ms
  private positionThreshold: number = 5 // pixels
  
  public handleMouseDown(coord: PixeloidCoordinate): 'single-click' | 'double-click' {
    const now = Date.now()
    const isNearLastClick = this.lastClickPosition && 
      this.isWithinPositionThreshold(coord, this.lastClickPosition)
    
    if (isNearLastClick && (now - this.lastClickTime) < this.doubleClickThreshold) {
      this.clickCount = 2
      this.lastClickTime = now
      this.lastClickPosition = coord
      return 'double-click'
    } else {
      this.clickCount = 1
      this.lastClickTime = now
      this.lastClickPosition = coord
      return 'single-click'
    }
  }
  
  public handleMouseUp(_coord: PixeloidCoordinate): 'click' | 'double-click' | 'drag-end' {
    // Simple click completion detection
    if (this.clickCount === 2) {
      return 'double-click'
    } else {
      return 'click'
    }
  }
  
  private isWithinPositionThreshold(coord1: PixeloidCoordinate, coord2: PixeloidCoordinate): boolean {
    const dx = Math.abs(coord1.x - coord2.x)
    const dy = Math.abs(coord1.y - coord2.y)
    return dx <= this.positionThreshold && dy <= this.positionThreshold
  }
  
  public reset(): void {
    this.clickCount = 0
    this.lastClickTime = 0
    this.lastClickPosition = null
  }
  
  public getState(): any {
    return {
      clickCount: this.clickCount,
      lastClickTime: this.lastClickTime,
      lastClickPosition: this.lastClickPosition
    }
  }
}

/**
 * DragDetector - Safe drag threshold detection
 * ✅ SAFE: Movement threshold detection only
 */
class DragDetector {
  private _isDragging: boolean = false
  private dragStartPosition: PixeloidCoordinate | null = null
  private draggedObjectId: string | null = null
  private dragThreshold: number = 5 // pixels
  
  public handleMouseMove(coord: PixeloidCoordinate): 'hover' | 'drag-start' | 'drag-continue' {
    if (!this.dragStartPosition) {
      this.dragStartPosition = coord
      return 'hover'
    }
    
    const exceeds = this.exceedsThreshold(this.dragStartPosition, coord)
    
    if (!this._isDragging && exceeds) {
      this._isDragging = true
      return 'drag-start'
    } else if (this._isDragging) {
      return 'drag-continue'
    } else {
      return 'hover'
    }
  }
  
  public startDrag(objectId: string, startPos: PixeloidCoordinate): void {
    this._isDragging = true
    this.draggedObjectId = objectId
    this.dragStartPosition = startPos
  }
  
  public reset(): void {
    this._isDragging = false
    this.draggedObjectId = null
    this.dragStartPosition = null
  }
  
  private exceedsThreshold(startPos: PixeloidCoordinate, currentPos: PixeloidCoordinate): boolean {
    const dx = Math.abs(currentPos.x - startPos.x)
    const dy = Math.abs(currentPos.y - startPos.y)
    return dx > this.dragThreshold || dy > this.dragThreshold
  }
  
  public get isDragging(): boolean {
    return this._isDragging
  }
  
  public getState(): any {
    return {
      isDragging: this._isDragging,
      draggedObjectId: this.draggedObjectId,
      dragStartPosition: this.dragStartPosition
    }
  }
}

/**
 * KeyboardHandler - Safe keyboard input detection
 * ✅ SAFE: Pure keyboard input, uses existing store methods
 */
class KeyboardHandler {
  private keysPressed: Set<string> = new Set()
  private keyEventListeners: Array<() => void> = []
  
  public initialize(): void {
    this.setupGlobalHandlers()
  }
  
  public setupGlobalHandlers(): void {
    const handleKeyDown = (event: KeyboardEvent) => {
      this.keysPressed.add(event.key.toLowerCase())
      this.handleKeyDown(event)
    }
    
    const handleKeyUp = (event: KeyboardEvent) => {
      this.keysPressed.delete(event.key.toLowerCase())
    }
    
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    
    // Store cleanup functions
    this.keyEventListeners.push(
      () => document.removeEventListener('keydown', handleKeyDown),
      () => document.removeEventListener('keyup', handleKeyUp)
    )
  }
  
  private handleKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase()
    
    // Navigation shortcuts
    if (['w', 'a', 's', 'd'].includes(key)) {
      this.handleWASD(key as 'w'|'a'|'s'|'d')
      event.preventDefault()
    }
    
    // Action shortcuts
    if (event.ctrlKey || event.metaKey) {
      switch (key) {
        case 'c':
          this.handleCopy()
          event.preventDefault()
          break
        case 'v':
          this.handlePaste()
          event.preventDefault()
          break
      }
    }
    
    // Direct action keys
    switch (key) {
      case 'delete':
      case 'backspace':
        this.handleDelete()
        event.preventDefault()
        break
      case 'escape':
        this.handleEscape()
        event.preventDefault()
        break
      case 'e':
        this.handleEdit()
        event.preventDefault()
        break
      case ' ':
        this.handleSpacebar()
        event.preventDefault()
        break
      case 'f1':
        this.handleToggleStorePanel()
        event.preventDefault()
        break
      case 'f2':
        this.handleToggleLayerBar()
        event.preventDefault()
        break
      case 'f3':
        this.handleToggleGeometryPanel()
        event.preventDefault()
        break
    }
  }
  
  // ✅ SAFE: Navigation via existing store methods
  public handleWASD(key: 'w'|'a'|'s'|'d'): void {
    const moveAmount = gameStore.navigation.moveAmount  // ✅ FIXED: Use store value
    
    // ✅ FIXED: Pass deltas instead of absolute coordinates
    let deltaX = 0
    let deltaY = 0
    
    switch (key) {
      case 'w': deltaY = -moveAmount; break
      case 's': deltaY = +moveAmount; break
      case 'a': deltaX = -moveAmount; break
      case 'd': deltaX = +moveAmount; break
    }
    
    gameStore_methods.updateNavigationOffset(deltaX, deltaY)
  }
  
  public handleSpacebar(): void {
    gameStore_methods.resetNavigationOffset()
  }
  
  // ✅ SAFE: Actions via existing store methods
  public handleCopy(): void {
    if (gameStore.selection.selectedId) {
      gameStore_methods.copyObject(gameStore.selection.selectedId)
    }
  }
  
  public handlePaste(): void {
    if (gameStore_methods.hasClipboardObject()) {
      const mousePos = gameStore.mouse.world || { x: 0, y: 0 }
      gameStore_methods.pasteObject(mousePos)
    }
  }
  
  public handleDelete(): void {
    if (gameStore.selection.selectedId) {
      gameStore_methods.deleteSelected()
    }
  }
  
  public handleEscape(): void {
    // ✅ ESC PRIORITY 1: Cancel drag operation if active
    if (gameStore.dragging.isDragging) {
      gameStore_methods.cancelDragging()
      gameStore_methods.cancelPreview() // Cancel preview too
      console.log('KeyboardHandler: Cancelled drag operation (ESC)')
      return // STOP HERE
    }
    
    // ✅ ESC PRIORITY 2: Close edit panel if open
    if (gameStore.ui.isEditPanelOpen) {
      gameStore_methods.clearSelectionEnhanced() // This closes panel
      return // STOP HERE
    }
    
    // ✅ ESC PRIORITY 3: Cancel drawing and reset mode
    if (gameStore.drawing.isDrawing || gameStore.drawing.mode !== 'none') {
      gameStore_methods.cancelDrawing()
      gameStore_methods.setDrawingMode('none')  // Reset to none on ESC
      return // STOP HERE
    }
    
    // ✅ ESC PRIORITY 4: Clear selection (fallback)
    gameStore_methods.clearSelectionEnhanced()
  }
  
  public handleEdit(): void {
    if (gameStore.selection.selectedId) {
      // TODO: Open edit panel via existing UI methods
      console.log('KeyboardHandler: Edit requested for', gameStore.selection.selectedId)
    }
  }
  
  // ✅ UI Panel toggle methods
  public handleToggleStorePanel(): void {
    gameStore_methods.toggleStorePanel()
    console.log('KeyboardHandler: Toggled store panel (F1)')
  }
  
  public handleToggleLayerBar(): void {
    gameStore_methods.toggleLayerToggle()
    console.log('KeyboardHandler: Toggled layer bar (F2)')
  }
  
  public handleToggleGeometryPanel(): void {
    gameStore_methods.toggleGeometryPanel()
    console.log('KeyboardHandler: Toggled geometry panel (F3)')
  }
  
  // ===== STATE ACCESS =====
  public isKeyPressed(key: string): boolean {
    return this.keysPressed.has(key.toLowerCase())
  }
  
  public getPressedKeys(): string[] {
    return Array.from(this.keysPressed)
  }
  
  public getState(): any {
    return {
      keysPressed: this.getPressedKeys(),
      moveAmount: gameStore.navigation.moveAmount  // ✅ FIXED: Use store value
    }
  }
  
  public reset(): void {
    this.keysPressed.clear()
  }
  
  public destroy(): void {
    // Remove all event listeners
    this.keyEventListeners.forEach(cleanup => cleanup())
    this.keyEventListeners = []
    this.reset()
  }
}