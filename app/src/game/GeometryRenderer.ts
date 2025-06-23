import { Graphics, Container, Rectangle } from 'pixi.js'
import { PixelateFilter } from 'pixi-filters'
import { gameStore, updateGameStore } from '../store/gameStore'
import { GeometryHelper } from './GeometryHelper'
import { CoordinateHelper } from './CoordinateHelper'
import { subscribe } from 'valtio'
import type {
  ViewportCorners,
  GeometricObject,
  GeometricRectangle,
  GeometricCircle,
  GeometricLine,
  GeometricPoint,
  GeometricDiamond,
  BboxMeshReference
} from '../types'

/**
 * GeometryRenderer handles rendering of user-drawn geometric shapes
 * Uses individual containers for each object for better performance and batching
 */
export class GeometryRenderer {
  private mainContainer: Container = new Container()
  
  // Filter containers as render groups for GPU optimization
  private normalContainer: Container = new Container({ isRenderGroup: true })
  private selectedContainer: Container = new Container({ isRenderGroup: true })
  
  // Individual object containers and graphics tracking
  private objectContainers: Map<string, Container> = new Map()
  private objectGraphics: Map<string, Graphics> = new Map()
  private objectBboxMeshes: Map<string, Graphics> = new Map() // NEW: Track bbox meshes
  private previewGraphics: Graphics = new Graphics()
  
  // Filter instances (reuse for performance)
  private pixelateFilter: PixelateFilter
  
  constructor() {
    // Setup container hierarchy
    this.mainContainer.addChild(this.normalContainer)
    this.mainContainer.addChild(this.selectedContainer)
    this.mainContainer.addChild(this.previewGraphics)
    
    // Create pixelate filter with pixeloid-perfect configuration
    this.pixelateFilter = new PixelateFilter([gameStore.camera.pixeloid_scale, gameStore.camera.pixeloid_scale])
    
    // Performance optimizations for pixelate filter
    this.pixelateFilter.padding = 0  // No extra padding needed for pixelation
    this.pixelateFilter.resolution = 1  // Full resolution for pixeloid-perfect quality
    
    // Keep containers clean - no initial filters (handled per-object via bbox meshes)
    this.selectedContainer.filters = null
    this.normalContainer.filters = null
    
    // Subscribe to filter and selection changes
    this.subscribeToFilterChanges()
    
    // Subscribe to object changes for bbox mesh updates
    this.subscribeToObjectChanges()
  }

  /**
   * Simple render system - always renders when called by LayeredInfiniteCanvas
   * No memoization, no optimization - just reliable rendering every time
   */
  public render(corners: ViewportCorners, pixeloidScale: number): void {
    console.log('🎨 GeometryRenderer: Always rendering (no memoization)', {
      offset: { ...gameStore.mesh.vertex_to_pixeloid_offset },
      scale: pixeloidScale,
      objectCount: gameStore.geometry.objects.length,
      timestamp: Date.now()
    })

    // Get all objects from store
    const objects = gameStore.geometry.objects
    
    // Filter objects in viewport (use original pixeloid coordinates for culling)
    const visibleObjects = objects.filter(obj =>
      obj.isVisible && this.isObjectInViewport(obj, corners)
    )
    
    const currentObjectIds = new Set(visibleObjects.map(obj => obj.id))

    // Remove objects that are no longer visible or deleted
    for (const [objectId, container] of this.objectContainers) {
      if (!currentObjectIds.has(objectId)) {
        // Clean up bbox mesh
        const bboxMesh = this.objectBboxMeshes.get(objectId)
        if (bboxMesh) {
          bboxMesh.destroy()
          this.objectBboxMeshes.delete(objectId)
        }
        
        // Clean up container and graphics
        container.removeFromParent()
        container.destroy()
        this.objectContainers.delete(objectId)
        this.objectGraphics.delete(objectId)
        console.log(`GeometryRenderer: Removed object ${objectId} (no longer visible)`)
      }
    }

    // Update visible objects (convert to vertex coordinates for rendering)
    for (const obj of visibleObjects) {
      this.updateGeometricObjectWithCoordinateConversion(obj, pixeloidScale)
    }

    // Always render preview for active drawing (also with coordinate conversion)
    this.renderPreviewWithCoordinateConversion()
    
    console.log('✅ GeometryRenderer: Render completed - always renders every call')
  }

  /**
   * Update or create a single geometric object with coordinate conversion
   */
  private updateGeometricObjectWithCoordinateConversion(obj: GeometricObject, pixeloidScale: number): void {
    let objectContainer = this.objectContainers.get(obj.id)
    let graphics = this.objectGraphics.get(obj.id)
    
    const isNewObject = !objectContainer
    
    if (!objectContainer) {
      // Create new container + graphics for this object
      objectContainer = new Container()
      graphics = new Graphics()
      objectContainer.addChild(graphics)
      
      this.objectContainers.set(obj.id, objectContainer)
      this.objectGraphics.set(obj.id, graphics)
    }

    // Clear and re-render the graphics
    graphics!.clear()
    
    // ✅ COORDINATE CONVERSION: Convert object from pixeloid to vertex coordinates
    const convertedObject = this.convertObjectToVertexCoordinates(obj)
    
    // Position graphics at (0,0) and draw object at vertex coordinates
    graphics!.position.set(0, 0)
    this.renderGeometricObjectToGraphics(convertedObject, pixeloidScale, graphics!)
    
    // Create bbox mesh for new objects (will be handled by subscription for existing objects)
    if (isNewObject) {
      this.createBboxMeshForObject(obj)
    }
    
    // Update bbox mesh position with coordinate conversion
    this.updateBboxMeshPosition(obj.id, obj)
    
    // Assign to appropriate filter container based on selection
    this.assignObjectToFilterContainer(obj.id, objectContainer)
  }

  /**
   * Assign object container to appropriate filter group based on selection state
   */
  private assignObjectToFilterContainer(objectId: string, objectContainer: Container): void {
    const isSelected = gameStore.geometry.selection.selectedObjectId === objectId
    
    // Remove from current parent
    objectContainer.removeFromParent()
    
    // Assign to appropriate container
    if (isSelected) {
      this.selectedContainer.addChild(objectContainer)  // Selection handled by SelectionFilterRenderer
    } else {
      this.normalContainer.addChild(objectContainer)    // No filter
    }
  }

  /**
   * Subscribe to filter and selection changes for reactive updates
   */
  private subscribeToFilterChanges(): void {
    // React to filter effects changes (pixelate only now)
    subscribe(gameStore.geometry.filterEffects, () => {
      this.updatePixelateFilterState()
    })
    
    // React to pixeloid scale changes for perfect alignment
    subscribe(gameStore.camera, () => {
      this.updatePixelateFilterScale()
    })
    
    // React to selection changes (for object reassignment)
    subscribe(gameStore.geometry.selection, () => {
      this.updateSelectionFilterAssignment()
    })
  }


  /**
   * Update pixelate filter state - OBJECT-LEVEL FILTERING: Uses bbox meshes, preserves container filters
   */
  private updatePixelateFilterState(): void {
    const pixelateEnabled = gameStore.geometry.filterEffects.pixelate
    
    console.log(`GeometryRenderer: Updating pixelate filter state - ${pixelateEnabled ? 'ENABLED' : 'DISABLED'}`)
    
    if (pixelateEnabled) {
      // Set pixeloid-perfect filter size
      this.updatePixelateFilterScale()
    }
    
    // ✅ OBJECT-LEVEL FILTERING: Update filters on all bbox meshes only
    this.updateAllObjectFilters()
    
    // ✅ PRESERVE GLOBAL FILTERS: Don't touch container filters (selection handled by SelectionFilterRenderer)
    // normalContainer.filters stays null (no global filters needed)
    // selectedContainer.filters stays null (no filters in GeometryRenderer)
    
    console.log(`GeometryRenderer: Updated pixelate filters on ${this.objectBboxMeshes.size} bbox meshes`)
  }

  /**
   * Dynamic scale adjustment for perfect pixeloid alignment
   */
  private updatePixelateFilterScale(): void {
    const pixeloidScale = gameStore.camera.pixeloid_scale
    this.pixelateFilter.size = [pixeloidScale, pixeloidScale]
    console.log(`PixelateFilter: Updated size to ${pixeloidScale}x${pixeloidScale} for perfect pixeloid alignment`)
  }


  /**
   * Update filter assignment when selection changes
   */
  private updateSelectionFilterAssignment(): void {
    // Update bbox mesh filters for all objects (selection handled by SelectionFilterRenderer)
    this.updateAllObjectFilters()
    
    // Reassign all objects to correct containers when selection changes
    for (const [objectId, container] of this.objectContainers) {
      this.assignObjectToFilterContainer(objectId, container)
    }
  }

  /**
   * Subscribe to object changes for bbox mesh updates
   */
  private subscribeToObjectChanges(): void {
    subscribe(gameStore.geometry.objects, () => {
      // Check each object for bbox updates needed
      for (const obj of gameStore.geometry.objects) {
        if (this.needsBboxUpdate(obj)) {
          this.updateBboxMeshForObject(obj)
        }
      }
    })
  }

  /**
   * Check if bbox mesh needs updating for an object
   */
  private needsBboxUpdate(obj: GeometricObject): boolean {
    // Object needs bbox update if:
    // 1. No bbox mesh exists, OR
    // 2. Object metadata is newer than bbox mesh
    if (!obj.bboxMesh) return true
    
    // Check if we have the mesh tracked locally
    const localMesh = this.objectBboxMeshes.get(obj.id)
    if (!localMesh) return true
    
    // Compare timestamps (metadata should have lastUpdated, but fallback to createdAt)
    const metadataTime = (obj.metadata as any).lastUpdated || obj.createdAt
    return metadataTime > obj.bboxMesh.lastUpdated
  }

  /**
   * Create or update bbox mesh for an object
   */
  private updateBboxMeshForObject(obj: GeometricObject): void {
    // Remove old bbox mesh if it exists
    const oldMesh = this.objectBboxMeshes.get(obj.id)
    if (oldMesh) {
      oldMesh.destroy()
      this.objectBboxMeshes.delete(obj.id)
    }
    
    // Create new bbox mesh
    this.createBboxMeshForObject(obj)
  }

  /**
   * Create pixeloid-perfect bbox mesh for filtering
   */
  private createBboxMeshForObject(obj: GeometricObject): void {
    if (!obj.metadata) {
      console.warn(`GeometryRenderer: Cannot create bbox mesh for object ${obj.id} - missing metadata`)
      return
    }
    
    const bounds = obj.metadata.bounds
    const width = bounds.maxX - bounds.minX
    const height = bounds.maxY - bounds.minY
    
    // Create invisible bbox mesh at exact pixeloid bounds
    const bboxMesh = new Graphics()
    bboxMesh.rect(bounds.minX, bounds.minY, width, height)
    bboxMesh.fill({ color: 0x000000, alpha: 0 }) // Invisible
    
    // Apply filters to bbox mesh instead of graphics
    const filters = this.getFiltersForObject(obj.id)
    if (filters && filters.length > 0) {
      bboxMesh.filters = filters
    }
    
    // Store bbox mesh reference
    const meshId = `bbox_${obj.id}_${Date.now()}`
    this.objectBboxMeshes.set(obj.id, bboxMesh)
    
    // Add bbox mesh to object container
    const objectContainer = this.objectContainers.get(obj.id)
    if (objectContainer) {
      objectContainer.addChild(bboxMesh)
    }
    
    // Update store with bbox mesh reference
    const bboxRef: BboxMeshReference = {
      meshId: meshId,
      bounds: {
        minX: bounds.minX,
        maxX: bounds.maxX,
        minY: bounds.minY,
        maxY: bounds.maxY
      },
      lastUpdated: Date.now()
    }
    
    updateGameStore.updateGeometricObject(obj.id, {
      bboxMesh: bboxRef
    })
    
    console.log(`GeometryRenderer: Created bbox mesh for object ${obj.id} at bounds:`, bounds)
  }

  /**
   * Get appropriate filters for bbox mesh (pixelate only - outline handled at container level)
   */
  private getFiltersForObject(objectId: string): any[] | null {
    const pixelateEnabled = gameStore.geometry.filterEffects.pixelate
    
    const filters: any[] = []
    
    // Only add pixelate filter to bbox meshes (outline handled by selectedContainer)
    if (pixelateEnabled) {
      filters.push(this.pixelateFilter)
    }
    
    return filters.length > 0 ? filters : null
  }

  /**
   * Update filters on all existing object bbox meshes
   */
  private updateAllObjectFilters(): void {
    for (const [objectId, bboxMesh] of this.objectBboxMeshes) {
      const filters = this.getFiltersForObject(objectId)
      bboxMesh.filters = filters
    }
    console.log(`GeometryRenderer: Updated filters on ${this.objectBboxMeshes.size} bbox meshes`)
  }

  /**
   * Update bbox mesh position to match coordinate conversion
   */
  private updateBboxMeshPosition(objectId: string, obj: GeometricObject): void {
    const bboxMesh = this.objectBboxMeshes.get(objectId)
    if (!bboxMesh || !obj.metadata) return
    
    // Apply same coordinate conversion as graphics
    const offset = gameStore.mesh.vertex_to_pixeloid_offset
    const convertedBounds = {
      minX: obj.metadata.bounds.minX - offset.x,
      minY: obj.metadata.bounds.minY - offset.y,
      maxX: obj.metadata.bounds.maxX - offset.x,
      maxY: obj.metadata.bounds.maxY - offset.y
    }
    
    // Clear and redraw bbox mesh with converted coordinates
    bboxMesh.clear()
    bboxMesh.rect(convertedBounds.minX, convertedBounds.minY,
                  convertedBounds.maxX - convertedBounds.minX,
                  convertedBounds.maxY - convertedBounds.minY)
    bboxMesh.fill({ color: 0x000000, alpha: 0 }) // Keep invisible
  }

  /**
   * Convert object from pixeloid coordinates to vertex coordinates using EXACT conversion (no rounding)
   * This prevents geometry anchoring drift during zoom operations
   */
  private convertObjectToVertexCoordinates(obj: GeometricObject): GeometricObject {
    const offset = gameStore.mesh.vertex_to_pixeloid_offset
    
    if ('anchorX' in obj && 'anchorY' in obj) {
      // Diamond object - use exact coordinate conversion
      return {
        ...obj,
        anchorX: obj.anchorX - offset.x,  // EXACT conversion, no rounding
        anchorY: obj.anchorY - offset.y
      }
    } else if ('x' in obj && 'width' in obj && 'height' in obj) {
      // Rectangle object - use exact coordinate conversion
      return {
        ...obj,
        x: obj.x - offset.x,  // EXACT conversion, no rounding
        y: obj.y - offset.y
      }
    } else if ('centerX' in obj && 'centerY' in obj) {
      // Circle object - use exact coordinate conversion
      return {
        ...obj,
        centerX: obj.centerX - offset.x,  // EXACT conversion, no rounding
        centerY: obj.centerY - offset.y
      }
    } else if ('startX' in obj && 'endX' in obj) {
      // Line object - convert both points using exact conversion
      return {
        ...obj,
        startX: obj.startX - offset.x,  // EXACT conversion, no rounding
        startY: obj.startY - offset.y,
        endX: obj.endX - offset.x,
        endY: obj.endY - offset.y
      }
    } else if ('x' in obj && 'y' in obj) {
      // Point object - use exact coordinate conversion
      return {
        ...obj,
        x: obj.x - offset.x,  // EXACT conversion, no rounding
        y: obj.y - offset.y
      }
    }
    
    // Fallback - return original object
    return obj
  }

  /**
   * Check if object is within or near the viewport for culling
   */
  private isObjectInViewport(obj: GeometricObject, corners: ViewportCorners): boolean {
    // Add padding to viewport for objects that might partially be visible
    const padding = 50 // pixeloids
    const viewportLeft = corners.topLeft.x - padding
    const viewportRight = corners.bottomRight.x + padding
    const viewportTop = corners.topLeft.y - padding
    const viewportBottom = corners.bottomRight.y + padding

    // Check bounds based on object type
    if ('anchorX' in obj && 'anchorY' in obj) {
      // Diamond object - use GeometryHelper to get vertices and calculate bounds
      const diamond = obj as GeometricDiamond
      const vertices = GeometryHelper.calculateDiamondVertices(diamond)
      const bounds = {
        left: Math.min(vertices.west.x, vertices.east.x, vertices.north.x, vertices.south.x),
        right: Math.max(vertices.west.x, vertices.east.x, vertices.north.x, vertices.south.x),
        top: Math.min(vertices.west.y, vertices.east.y, vertices.north.y, vertices.south.y),
        bottom: Math.max(vertices.west.y, vertices.east.y, vertices.north.y, vertices.south.y)
      }
      return !(
        bounds.right < viewportLeft ||
        bounds.left > viewportRight ||
        bounds.bottom < viewportTop ||
        bounds.top > viewportBottom
      )
    } else if ('width' in obj && 'height' in obj) {
      // Rectangle object
      const rect = obj as GeometricRectangle
      return !(
        rect.x + rect.width < viewportLeft ||
        rect.x > viewportRight ||
        rect.y + rect.height < viewportTop ||
        rect.y > viewportBottom
      )
    } else if ('radius' in obj) {
      // Circle object
      const circle = obj as GeometricCircle
      return !(
        circle.centerX + circle.radius < viewportLeft ||
        circle.centerX - circle.radius > viewportRight ||
        circle.centerY + circle.radius < viewportTop ||
        circle.centerY - circle.radius > viewportBottom
      )
    } else if ('startX' in obj && 'endX' in obj) {
      // Line object
      const line = obj as GeometricLine
      const minX = Math.min(line.startX, line.endX)
      const maxX = Math.max(line.startX, line.endX)
      const minY = Math.min(line.startY, line.endY)
      const maxY = Math.max(line.startY, line.endY)
      return !(
        maxX < viewportLeft ||
        minX > viewportRight ||
        maxY < viewportTop ||
        minY > viewportBottom
      )
    } else if ('x' in obj && 'y' in obj) {
      // Point object
      const point = obj as GeometricPoint
      return !(
        point.x < viewportLeft ||
        point.x > viewportRight ||
        point.y < viewportTop ||
        point.y > viewportBottom
      )
    }

    // Default to visible if we can't determine bounds
    return true
  }

  /**
   * Render a single geometric object to specific graphics context
   */
  private renderGeometricObjectToGraphics(obj: GeometricObject, pixeloidScale: number, graphics: Graphics): void {
    // Type narrowing based on object properties
    if ('anchorX' in obj && 'anchorY' in obj) {
      this.renderDiamondToGraphics(obj as GeometricDiamond, graphics)
    } else if ('width' in obj && 'height' in obj) {
      this.renderRectangleToGraphics(obj as GeometricRectangle, graphics)
    } else if ('radius' in obj) {
      this.renderCircleToGraphics(obj as GeometricCircle, graphics)
    } else if ('startX' in obj && 'endX' in obj) {
      this.renderLineToGraphics(obj as GeometricLine, graphics)
    } else if ('x' in obj && 'y' in obj && !('width' in obj)) {
      this.renderPointToGraphics(obj as GeometricPoint, pixeloidScale, graphics)
    }
  }

  /**
   * Render a rectangle shape to specific graphics
   */
  private renderRectangleToGraphics(rect: GeometricRectangle, graphics: Graphics): void {
    // Use raw pixeloid coordinates - camera transform handles scaling
    const x = rect.x
    const y = rect.y
    const width = rect.width
    const height = rect.height

    // Draw rectangle
    graphics.rect(x, y, width, height)

    // Apply fill if specified
    if (rect.fillColor !== undefined) {
      graphics.fill({
        color: rect.fillColor,
        alpha: rect.fillAlpha ?? 0.5
      })
    }

    // Apply stroke (strokeWidth is multiplier over pixeloidScale)
    graphics.stroke({
      width: rect.strokeWidth || gameStore.geometry.drawing.settings.defaultStrokeWidth,
      color: rect.color,
      alpha: rect.strokeAlpha
    })
  }

  /**
   * Render a circle shape to specific graphics
   */
  private renderCircleToGraphics(circle: GeometricCircle, graphics: Graphics): void {
    // Use raw pixeloid coordinates - camera transform handles scaling
    const centerX = circle.centerX
    const centerY = circle.centerY
    const radius = circle.radius

    // Draw circle
    graphics.circle(centerX, centerY, radius)

    // Apply fill if specified
    if (circle.fillColor !== undefined) {
      graphics.fill({
        color: circle.fillColor,
        alpha: circle.fillAlpha ?? 0.5
      })
    }

    // Apply stroke (strokeWidth is multiplier over pixeloidScale)
    graphics.stroke({
      width: circle.strokeWidth || gameStore.geometry.drawing.settings.defaultStrokeWidth,
      color: circle.color,
      alpha: circle.strokeAlpha
    })
  }

  /**
   * Render a line shape to specific graphics
   */
  private renderLineToGraphics(line: GeometricLine, graphics: Graphics): void {
    // Use raw pixeloid coordinates - camera transform handles scaling
    const startX = line.startX
    const startY = line.startY
    const endX = line.endX
    const endY = line.endY

    // Draw line
    graphics.moveTo(startX, startY)
    graphics.lineTo(endX, endY)

    // Apply stroke (strokeWidth is multiplier over pixeloidScale)
    graphics.stroke({
      width: line.strokeWidth || gameStore.geometry.drawing.settings.defaultStrokeWidth,
      color: line.color,
      alpha: line.strokeAlpha
    })
  }

  /**
   * Render a point shape to specific graphics
   */
  private renderPointToGraphics(point: GeometricPoint, pixeloidScale: number, graphics: Graphics): void {
    // Use raw pixeloid coordinates - camera transform handles scaling
    const x = point.x
    const y = point.y

    // Draw point as small circle (scale radius by pixeloidScale for consistent size)
    const pointRadius = 2 / pixeloidScale
    graphics.circle(x, y, pointRadius)
    graphics.fill({
      color: point.color,
      alpha: point.strokeAlpha
    })
  }

  /**
   * Render an isometric diamond shape to specific graphics
   */
  private renderDiamondToGraphics(diamond: GeometricDiamond, graphics: Graphics): void {
    // Use centralized geometry calculations
    const vertices = GeometryHelper.calculateDiamondVertices(diamond)
    
    // Draw diamond shape using calculated vertices
    graphics.moveTo(vertices.west.x, vertices.west.y)    // West
    graphics.lineTo(vertices.north.x, vertices.north.y)  // North
    graphics.lineTo(vertices.east.x, vertices.east.y)    // East
    graphics.lineTo(vertices.south.x, vertices.south.y)  // South
    graphics.lineTo(vertices.west.x, vertices.west.y)    // Back to West (close)

    // Apply fill if specified
    if (diamond.fillColor !== undefined) {
      graphics.fill({
        color: diamond.fillColor,
        alpha: diamond.fillAlpha ?? 0.5
      })
    }

    // Apply stroke (strokeWidth is multiplier over pixeloidScale)
    graphics.stroke({
      width: diamond.strokeWidth || gameStore.geometry.drawing.settings.defaultStrokeWidth,
      color: diamond.color,
      alpha: diamond.strokeAlpha
    })
  }

  /**
   * Legacy preview method - DEPRECATED - now uses renderPreviewWithCoordinateConversion
   */
  private renderPreview(): void {
    // This method is deprecated - preview rendering now handled by renderPreviewWithCoordinateConversion
    this.renderPreviewWithCoordinateConversion()
  }

  /**
   * Get the main container for adding to layer
   */
  public getContainer(): Container {
    return this.mainContainer
  }

  /**
   * Get object containers for texture capture (READ-ONLY access for TextureRegistry)
   * This provides access to individual object Graphics for post-render texture capture
   */
  public getObjectContainers(): Map<string, Graphics> {
    return new Map(this.objectGraphics) // Return copy to prevent external modification
  }


  /**
   * Render preview for active drawing operations - NEW: uses unified preview system
   */
  private renderPreviewWithCoordinateConversion(): void {
    this.previewGraphics.clear()
    
    const preview = gameStore.geometry.drawing.preview
    
    if (!preview) {
      return
    }

    // ✅ COORDINATE CONVERSION: Convert preview vertices using EXACT conversion
    const offset = gameStore.mesh.vertex_to_pixeloid_offset
    const renderVertices = preview.vertices.map(vertex => ({
      x: vertex.x - offset.x,  // EXACT conversion, no rounding
      y: vertex.y - offset.y
    }))

    const previewAlpha = 0.6

    // Render based on geometry type using converted vertices (same logic as new renderActiveDrawing)
    switch (preview.type) {
      case 'point':
        if (renderVertices[0]) {
          this.previewGraphics.circle(renderVertices[0].x, renderVertices[0].y, 2)
          this.previewGraphics.fill({
            color: preview.style.color,
            alpha: previewAlpha * preview.style.strokeAlpha
          })
        }
        break
        
      case 'line':
        if (renderVertices[0] && renderVertices[1]) {
          this.previewGraphics.moveTo(renderVertices[0].x, renderVertices[0].y)
          this.previewGraphics.lineTo(renderVertices[1].x, renderVertices[1].y)
          this.previewGraphics.stroke({
            width: preview.style.strokeWidth,
            color: preview.style.color,
            alpha: previewAlpha * preview.style.strokeAlpha
          })
        }
        break
        
      case 'circle':
        if (renderVertices.length >= 3) {
          const [west, east, center] = renderVertices
          const radius = Math.abs(east.x - west.x) / 2
          if (radius > 0) {
            this.previewGraphics.circle(center.x, center.y, radius)
            
            // Apply fill if enabled
            if (preview.style.fillColor !== undefined) {
              this.previewGraphics.fill({
                color: preview.style.fillColor,
                alpha: previewAlpha * (preview.style.fillAlpha ?? 0.5)
              })
            }
            
            this.previewGraphics.stroke({
              width: preview.style.strokeWidth,
              color: preview.style.color,
              alpha: previewAlpha * preview.style.strokeAlpha
            })
          }
        }
        break
        
      case 'rectangle':
        if (renderVertices.length >= 4) {
          const [topLeft, topRight, bottomRight, bottomLeft] = renderVertices
          const width = topRight.x - topLeft.x
          const height = bottomLeft.y - topLeft.y
          
          if (width >= 1 && height >= 1) {
            this.previewGraphics.rect(topLeft.x, topLeft.y, width, height)
            
            // Apply fill if enabled
            if (preview.style.fillColor !== undefined) {
              this.previewGraphics.fill({
                color: preview.style.fillColor,
                alpha: previewAlpha * (preview.style.fillAlpha ?? 0.5)
              })
            }
            
            this.previewGraphics.stroke({
              width: preview.style.strokeWidth,
              color: preview.style.color,
              alpha: previewAlpha * preview.style.strokeAlpha
            })
          }
        }
        break
        
      case 'diamond':
        if (renderVertices.length >= 4) {
          const [west, north, east, south] = renderVertices
          this.previewGraphics.moveTo(west.x, west.y)
          this.previewGraphics.lineTo(north.x, north.y)
          this.previewGraphics.lineTo(east.x, east.y)
          this.previewGraphics.lineTo(south.x, south.y)
          this.previewGraphics.lineTo(west.x, west.y) // Close path
          
          // Apply fill if enabled
          if (preview.style.fillColor !== undefined) {
            this.previewGraphics.fill({
              color: preview.style.fillColor,
              alpha: previewAlpha * (preview.style.fillAlpha ?? 0.5)
            })
          }
          
          this.previewGraphics.stroke({
            width: preview.style.strokeWidth,
            color: preview.style.color,
            alpha: previewAlpha * preview.style.strokeAlpha
          })
        }
        break
    }
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    // Destroy all object graphics
    for (const graphics of this.objectContainers.values()) {
      graphics.destroy()
    }
    this.objectContainers.clear()
    
    // Destroy all bbox meshes
    for (const bboxMesh of this.objectBboxMeshes.values()) {
      bboxMesh.destroy()
    }
    this.objectBboxMeshes.clear()
    
    // Destroy preview graphics
    this.previewGraphics.destroy()
    
    // Destroy main container
    this.mainContainer.destroy()
  }
}