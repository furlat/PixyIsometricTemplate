/**
 * GeometryRenderer - Pure Rendering System (CORRECTED)
 * 
 * CLEAN ARCHITECTURE: Zero duplication, pure rendering only
 * - NO input logic (handled by InputManager)
 * - NO hit testing (handled by InputManager.HitTester)
 * - NO preview logic (coordinates with PreviewSystem)
 * - ONLY PIXI rendering and visual state management
 * 
 * Uses ACTUAL implemented store and types.
 */

import { Graphics, Container } from 'pixi.js'
import { gameStore } from '../store/game-store'  // ✅ ONLY what we actually use
import { subscribe } from 'valtio'
import type {
  GeometricObject,     // ✅ From our ecs-data-layer.ts
  PixeloidCoordinate   // ✅ From our ecs-coordinates.ts
} from '../types'  // ✅ CORRECT types location

// ===== RENDERING TYPES =====

// Extract style type from GeometricObject (our actual implementation)
type GeometricObjectStyle = GeometricObject['style']

interface RenderContext {
  graphics: Graphics
  samplingPos: PixeloidCoordinate
  zoomFactor: number
  style: GeometricObjectStyle  // ✅ Uses actual style structure from ecs-data-layer
  alpha?: number
}

// ===== MAIN GEOMETRY RENDERER =====

export class GeometryRenderer {
  private containerHierarchy: ContainerHierarchy
  private objectTracking: ObjectTrackingSystem
  private performanceMonitor: RenderingStats
  private previewRenderer: PreviewRenderingSystem
  private shapeRenderer: CommonShapeRenderer
  
  constructor() {
    this.containerHierarchy = new ContainerHierarchy()
    this.objectTracking = new ObjectTrackingSystem()
    this.performanceMonitor = new RenderingStats()
    this.shapeRenderer = new CommonShapeRenderer()
    this.previewRenderer = new PreviewRenderingSystem(this.shapeRenderer)
    
    // Add preview graphics to hierarchy
    this.containerHierarchy.getPreviewContainer().addChild(this.previewRenderer.getPreviewGraphics())
    
    // ✅ STORE SUBSCRIPTION: Visual state changes only
    this.subscribeToVisualState()
    
    console.log('GeometryRenderer: Pure rendering system initialized')
  }
  
  // ===== MAIN RENDERING =====
  
  public render(): void {
    const startTime = this.performanceMonitor.startRender()
    
    // ✅ CORRECT: Read from our actual store
    const objects = gameStore.objects  // ✅ From GameStoreData.objects
    const visibleObjects = objects.filter(obj => obj.isVisible !== false)
    
    // ✅ OBJECT LIFECYCLE: Cleanup removed objects
    this.cleanupRemovedObjects(visibleObjects)
    
    // ✅ MAIN RENDERING: Render all visible objects
    for (const obj of visibleObjects) {
      this.renderObject(obj)
    }
    
    // ✅ PREVIEW RENDERING: Render preview via PreviewSystem
    this.previewRenderer.renderPreview()
    
    // ✅ PERFORMANCE TRACKING
    this.performanceMonitor.endRender(startTime, visibleObjects.length)
  }
  
  private renderObject(obj: GeometricObject): void {
    const { container, graphics } = this.objectTracking.getOrCreateObjectContainer(obj.id)
    
    // Clear and reset graphics
    graphics.clear()
    graphics.position.set(0, 0)
    
    // ✅ UX ISSUE A: Check if object is being dragged for transparency effect
    const isDraggedObject = gameStore.dragging.isDragging &&
                           gameStore.dragging.draggedObjectId === obj.id
    
    // ✅ CORRECT: Get rendering context from our actual store
    const samplingPos = gameStore.navigation.offset  // ✅ From GameStoreData.navigation
    const zoomFactor = 1 // Fixed for Phase 3
    const context: RenderContext = {
      graphics,
      samplingPos,
      zoomFactor,
      style: obj.style,  // ✅ Uses actual GeometricObject.style structure
      alpha: isDraggedObject ? 0.2 : 1.0  // ✅ 20% opacity for dragged objects (ghost effect)
    }
    
    // ✅ COMMON RENDERING: Use shared shape renderer
    switch (obj.type) {
      case 'point':
        this.shapeRenderer.renderPoint(obj.vertices, context)
        break
      case 'line':
        this.shapeRenderer.renderLine(obj.vertices, context)
        break
      case 'circle':
        this.shapeRenderer.renderCircle(obj.vertices, context)
        break
      case 'rectangle':
        this.shapeRenderer.renderRectangle(obj.vertices, context)
        break
      case 'diamond':
        this.shapeRenderer.renderDiamond(obj.vertices, context)
        break
    }
    
    // ✅ VISUAL ASSIGNMENT: Assign to appropriate visual container
    this.assignObjectToVisualContainer(obj.id, container)
  }
  
  private cleanupRemovedObjects(visibleObjects: GeometricObject[]): void {
    const currentObjectIds = new Set(visibleObjects.map(obj => obj.id))
    const trackedObjectIds = this.objectTracking.getAllObjectIds()
    
    for (const trackedId of trackedObjectIds) {
      if (!currentObjectIds.has(trackedId)) {
        this.objectTracking.removeObject(trackedId)
      }
    }
  }
  
  private assignObjectToVisualContainer(objectId: string, container: Container): void {
    // ✅ CORRECT: Use our actual selection state
    const isSelected = gameStore.selection.selectedId === objectId  // ✅ From GameStoreData.selection
    
    // Remove from current parent
    container.removeFromParent()
    
    // Assign to appropriate visual container
    if (isSelected) {
      this.containerHierarchy.getSelectedContainer().addChild(container)
    } else {
      this.containerHierarchy.getNormalContainer().addChild(container)
    }
  }
  
  // ===== VISUAL STATE MANAGEMENT =====
  
  // ✅ STORE SUBSCRIPTION: Visual state changes only (no input handling)
  private subscribeToVisualState(): void {
    subscribe(gameStore.selection, () => {
      this.updateSelectionVisuals()
    })
  }
  
  private updateSelectionVisuals(): void {
    // Reassign all objects to correct visual containers when selection changes
    const trackedObjectIds = this.objectTracking.getAllObjectIds()
    for (const objectId of trackedObjectIds) {
      const { container } = this.objectTracking.getOrCreateObjectContainer(objectId)
      this.assignObjectToVisualContainer(objectId, container)
    }
  }
  
  // ===== PUBLIC INTERFACE =====
  
  public getContainer(): Container {
    return this.containerHierarchy.getMainContainer()
  }
  
  public getObjectContainer(objectId: string): Container | undefined {
    const result = this.objectTracking.getOrCreateObjectContainer(objectId)
    return result ? result.container : undefined
  }
  
  public destroy(): void {
    this.containerHierarchy.destroy()
    this.objectTracking.destroy()
    this.previewRenderer.destroy()
    console.log('GeometryRenderer: Cleanup complete')
  }
}

// ===== CONTAINER HIERARCHY SYSTEM =====

class ContainerHierarchy {
  private mainContainer: Container = new Container()
  private normalContainer: Container = new Container({ isRenderGroup: true })
  private selectedContainer: Container = new Container({ isRenderGroup: true })
  private previewContainer: Container = new Container()
  
  constructor() {
    this.setupHierarchy()
  }
  
  private setupHierarchy(): void {
    this.mainContainer.addChild(this.normalContainer)
    this.mainContainer.addChild(this.selectedContainer)  
    this.mainContainer.addChild(this.previewContainer)
  }
  
  public getMainContainer(): Container { return this.mainContainer }
  public getNormalContainer(): Container { return this.normalContainer }
  public getSelectedContainer(): Container { return this.selectedContainer }
  public getPreviewContainer(): Container { return this.previewContainer }
  
  public destroy(): void {
    this.mainContainer.destroy()
  }
}

// ===== OBJECT TRACKING SYSTEM =====

class ObjectTrackingSystem {
  private objectContainers: Map<string, Container> = new Map()
  private objectGraphics: Map<string, Graphics> = new Map()
  
  public getOrCreateObjectContainer(objectId: string): { container: Container, graphics: Graphics } {
    let container = this.objectContainers.get(objectId)
    let graphics = this.objectGraphics.get(objectId)
    
    if (!container) {
      container = new Container()
      graphics = new Graphics()
      container.addChild(graphics)
      
      this.objectContainers.set(objectId, container)
      this.objectGraphics.set(objectId, graphics)
    }
    
    return { container: container!, graphics: graphics! }
  }
  
  public removeObject(objectId: string): void {
    const container = this.objectContainers.get(objectId)
    if (container) {
      container.removeFromParent()
      container.destroy()
      this.objectContainers.delete(objectId)
      this.objectGraphics.delete(objectId)
    }
  }
  
  public hasObject(objectId: string): boolean {
    return this.objectContainers.has(objectId)
  }
  
  public getAllObjectIds(): string[] {
    return Array.from(this.objectContainers.keys())
  }
  
  public destroy(): void {
    for (const container of this.objectContainers.values()) {
      container.destroy()
    }
    this.objectContainers.clear()
    this.objectGraphics.clear()
  }
}

// ===== PERFORMANCE MONITORING =====

class RenderingStats {
  private stats = {
    renderCount: 0,
    lastStatsTime: Date.now(),
    totalRenderTime: 0,
    objectsRendered: 0,
    lastObjectCount: 0
  }
  
  public startRender(): number {
    return Date.now()
  }
  
  public endRender(startTime: number, objectCount: number): void {
    const renderTime = Date.now() - startTime
    
    this.stats.renderCount++
    this.stats.totalRenderTime += renderTime
    this.stats.objectsRendered += objectCount
    this.stats.lastObjectCount = objectCount
    
    this.logStatsIfNeeded()
  }
  
  private logStatsIfNeeded(): void {
    const now = Date.now()
    if (now - this.stats.lastStatsTime >= 15000) {
      const avgRenderTime = this.stats.totalRenderTime / this.stats.renderCount
      const renderRate = this.stats.renderCount / 15
      
      console.log('📊 GeometryRenderer Stats (15s):', {
        renders: this.stats.renderCount,
        avgRenderTime: avgRenderTime.toFixed(2) + 'ms',
        renderRate: renderRate.toFixed(1) + '/s',
        objects: this.stats.lastObjectCount
      })
      
      this.resetStats(now)
    }
  }
  
  private resetStats(now: number): void {
    this.stats.renderCount = 0
    this.stats.totalRenderTime = 0
    this.stats.objectsRendered = 0
    this.stats.lastStatsTime = now
  }
}

// ===== COMMON SHAPE RENDERER =====

class CommonShapeRenderer {
  // Eliminates duplication between main object rendering and preview rendering
  
  public renderPoint(vertices: PixeloidCoordinate[], context: RenderContext): void {
    // ✅ STRICT AUTHORITY: NO SILENT FAILURES
    if (!vertices || vertices.length === 0) {
      throw new Error('Point rendering requires vertices - missing vertices array')
    }
    
    const { graphics, samplingPos, zoomFactor, style, alpha = 1 } = context
    const { x, y } = this.transformCoordinate(vertices[0], samplingPos, zoomFactor)
    
    const pointRadius = 2 * zoomFactor
    graphics.circle(x, y, pointRadius)
    
    // ✅ STRICT AUTHORITY: Complete style required - NO FALLBACKS
    if (style.strokeAlpha === undefined) {
      throw new Error('Point rendering requires complete style - missing strokeAlpha')
    }
    graphics.fill({
      color: style.color,
      alpha: style.strokeAlpha * alpha
    })
  }
  
  public renderLine(vertices: PixeloidCoordinate[], context: RenderContext): void {
    // ✅ STRICT AUTHORITY: NO SILENT FAILURES
    if (!vertices || vertices.length < 2) {
      throw new Error('Line rendering requires at least 2 vertices')
    }
    
    const { graphics, samplingPos, zoomFactor, style, alpha = 1 } = context
    const start = this.transformCoordinate(vertices[0], samplingPos, zoomFactor)
    const end = this.transformCoordinate(vertices[1], samplingPos, zoomFactor)
    
    graphics.moveTo(start.x, start.y)
    graphics.lineTo(end.x, end.y)
    this.applyStroke(graphics, style, zoomFactor, alpha)
  }
  
  public renderCircle(vertices: PixeloidCoordinate[], context: RenderContext): void {
    // ✅ STRICT AUTHORITY: NO SILENT FAILURES
    if (!vertices || vertices.length < 2) {
      throw new Error('Circle rendering requires at least 2 vertices - center and radius point')
    }
    
    const { graphics, samplingPos, zoomFactor, style, alpha = 1 } = context
    const center = this.transformCoordinate(vertices[0], samplingPos, zoomFactor)
    const radiusPoint = this.transformCoordinate(vertices[1], samplingPos, zoomFactor)
    
    const radius = Math.sqrt(
      Math.pow(radiusPoint.x - center.x, 2) +
      Math.pow(radiusPoint.y - center.y, 2)
    )
    
    graphics.circle(center.x, center.y, radius)
    this.applyFill(graphics, style, alpha)
    this.applyStroke(graphics, style, zoomFactor, alpha)
  }
  
  public renderRectangle(vertices: PixeloidCoordinate[], context: RenderContext): void {
    // ✅ STRICT AUTHORITY: NO SILENT FAILURES
    if (!vertices || vertices.length < 2) {
      throw new Error('Rectangle rendering requires at least 2 vertices - opposite corners')
    }
    
    const { graphics, samplingPos, zoomFactor, style, alpha = 1 } = context
    const v1 = this.transformCoordinate(vertices[0], samplingPos, zoomFactor)
    const v2 = this.transformCoordinate(vertices[1], samplingPos, zoomFactor)
    
    const x = Math.min(v1.x, v2.x)
    const y = Math.min(v1.y, v2.y)
    const width = Math.abs(v2.x - v1.x)
    const height = Math.abs(v2.y - v1.y)
    
    graphics.rect(x, y, width, height)
    this.applyFill(graphics, style, alpha)
    this.applyStroke(graphics, style, zoomFactor, alpha)
  }
  
  public renderDiamond(vertices: PixeloidCoordinate[], context: RenderContext): void {
    // ✅ STRICT AUTHORITY: NO SILENT FAILURES
    if (!vertices || vertices.length < 4) {
      throw new Error('Diamond rendering requires 4 vertices - west, north, east, south')
    }
    
    const { graphics, samplingPos, zoomFactor, style, alpha = 1 } = context
    const transformedVertices = vertices.map(v => this.transformCoordinate(v, samplingPos, zoomFactor))
    
    graphics.moveTo(transformedVertices[0].x, transformedVertices[0].y)
    for (let i = 1; i < transformedVertices.length; i++) {
      graphics.lineTo(transformedVertices[i].x, transformedVertices[i].y)
    }
    graphics.lineTo(transformedVertices[0].x, transformedVertices[0].y) // Close path
    
    this.applyFill(graphics, style, alpha)
    this.applyStroke(graphics, style, zoomFactor, alpha)
  }
  
  private applyFill(graphics: Graphics, style: GeometricObjectStyle, alpha: number = 1): void {
    // ✅ STRICT AUTHORITY: Complete style required - NO FALLBACKS
    if (style.fillColor !== undefined) {
      if (style.fillAlpha === undefined) {
        throw new Error('Fill rendering requires complete style - missing fillAlpha')
      }
      graphics.fill({
        color: style.fillColor,
        alpha: style.fillAlpha * alpha
      })
    }
  }
  
  private applyStroke(graphics: Graphics, style: GeometricObjectStyle, zoomFactor: number, alpha: number = 1): void {
    // ✅ STRICT AUTHORITY: Complete style required - NO FALLBACKS
    if (style.strokeWidth === undefined) {
      throw new Error('Stroke rendering requires complete style - missing strokeWidth')
    }
    if (style.strokeAlpha === undefined) {
      throw new Error('Stroke rendering requires complete style - missing strokeAlpha')
    }
    graphics.stroke({
      width: style.strokeWidth * zoomFactor,
      color: style.color,
      alpha: style.strokeAlpha * alpha
    })
  }
  
  private transformCoordinate(vertex: PixeloidCoordinate, samplingPos: PixeloidCoordinate, zoomFactor: number): {x: number, y: number} {
    return {
      x: (vertex.x - samplingPos.x) * zoomFactor,
      y: (vertex.y - samplingPos.y) * zoomFactor
    }
  }
}

// ===== PREVIEW RENDERING SYSTEM =====

class PreviewRenderingSystem {
  private previewGraphics: Graphics = new Graphics()
  private shapeRenderer: CommonShapeRenderer
  
  constructor(shapeRenderer: CommonShapeRenderer) {
    this.shapeRenderer = shapeRenderer
  }
  
  public renderPreview(): void {
    this.previewGraphics.clear()
    
    // ✅ CORRECT: Use our actual PreviewSystem structure
    if (!gameStore.preview.isActive || !gameStore.preview.previewData) {
      return
    }
    
    const previewData = gameStore.preview.previewData
    const previewVertices = previewData.previewVertices      // ✅ Our actual structure
    const previewStyle = previewData.previewStyle            // ✅ Our actual structure  
    const previewOpacity = gameStore.preview.previewOpacity || 0.8  // ✅ Our actual structure
    
    if (!previewVertices || previewVertices.length === 0) {
      return
    }
    
    // ✅ CORRECT: Get current navigation offset from our store
    const samplingPos = gameStore.navigation.offset  // ✅ From GameStoreData.navigation
    const zoomFactor = 1 // Fixed for Phase 3
    
    // ✅ STRICT AUTHORITY: Complete preview style required - NO FALLBACKS
    if (previewStyle.color === undefined) {
      throw new Error('Preview rendering requires complete style - missing color')
    }
    if (previewStyle.strokeWidth === undefined) {
      throw new Error('Preview rendering requires complete style - missing strokeWidth')
    }
    if (previewStyle.strokeAlpha === undefined) {
      throw new Error('Preview rendering requires complete style - missing strokeAlpha')
    }
    
    const completeStyle: GeometricObjectStyle = {
      color: previewStyle.color,
      strokeWidth: previewStyle.strokeWidth,
      strokeAlpha: previewStyle.strokeAlpha,
      fillColor: previewStyle.fillColor,
      fillAlpha: previewStyle.fillAlpha
    }
    
    const context: RenderContext = {
      graphics: this.previewGraphics,
      samplingPos,
      zoomFactor,
      style: completeStyle,
      alpha: previewOpacity
    }
    
    // ✅ COMMON RENDERING: Use same shape renderer as main objects
    const previewType = previewData.previewProperties?.type
    switch (previewType) {
      case 'point':
        this.shapeRenderer.renderPoint(previewVertices, context)
        break
      case 'line':
        this.shapeRenderer.renderLine(previewVertices, context)
        break
      case 'circle':
        this.shapeRenderer.renderCircle(previewVertices, context)
        break
      case 'rectangle':
        this.shapeRenderer.renderRectangle(previewVertices, context)
        break
      case 'diamond':
        this.shapeRenderer.renderDiamond(previewVertices, context)
        break
    }
  }
  
  public getPreviewGraphics(): Graphics {
    return this.previewGraphics
  }
  
  public destroy(): void {
    this.previewGraphics.destroy()
  }
}

// ===== DEBUG UTILITIES =====

export const GeometryRendererUtils = {
  createDebugRenderer(): GeometryRenderer {
    return new GeometryRenderer()
  },
  
  validateRenderContext(context: RenderContext): boolean {
    return !!(context.graphics && context.samplingPos && context.style)
  }
}