import { MeshSimple, Container, Texture } from 'pixi.js'
import { gameStore } from '../store/gameStore'
import { GeometryHelper } from './GeometryHelper'
import * as MeshVertexHelper from './MeshVertexHelper'
import type { ViewportCorners, GeometricObject, GeometricRectangle, GeometricCircle, GeometricLine, GeometricPoint, GeometricDiamond } from '../types'

/**
 * MeshGeometryRenderer - Mesh-based geometry renderer for better performance
 * Uses MeshSimple objects instead of Graphics for GPU-accelerated rendering
 */
export class MeshGeometryRenderer {
  private mainContainer: Container = new Container()
  private objectContainers: Map<string, Container> = new Map()
  private previewContainer: Container | null = null

  constructor() {
    // Container is ready for mesh children
  }

  /**
   * Render geometric objects using mesh-based approach
   */
  public render(corners: ViewportCorners, pixeloidScale: number): void {
    // Get all geometric objects from store
    const objects = gameStore.geometry.objects

    // Only render visible objects that are within or near the viewport
    const visibleObjects = objects.filter(obj => obj.isVisible && this.isObjectInViewport(obj, corners))
    const currentObjectIds = new Set(visibleObjects.map(obj => obj.id))

    // Remove objects that are no longer visible or deleted
    for (const [objectId, container] of this.objectContainers) {
      if (!currentObjectIds.has(objectId)) {
        this.mainContainer.removeChild(container)
        container.destroy()
        this.objectContainers.delete(objectId)
      }
    }

    // Update visible objects
    for (const obj of visibleObjects) {
      this.updateGeometricObjectMesh(obj, pixeloidScale)
    }

    // Always render preview for active drawing
    this.renderPreviewMesh(pixeloidScale)
  }

  /**
   * Update or create a single geometric object mesh
   */
  private updateGeometricObjectMesh(obj: GeometricObject, pixeloidScale: number): void {
    let container = this.objectContainers.get(obj.id)
    
    if (container) {
      // Remove existing container to recreate with new geometry
      this.mainContainer.removeChild(container)
      container.destroy()
    }

    // Create new container for this object
    const newContainer = this.createMeshForObject(obj, pixeloidScale)
    
    if (newContainer) {
      this.objectContainers.set(obj.id, newContainer)
      this.mainContainer.addChild(newContainer)
    }
  }

  /**
   * Create a mesh container for a specific geometric object
   * Matches the exact behavior of the original Graphics-based renderer
   */
  private createMeshForObject(obj: GeometricObject, pixeloidScale: number): Container | null {
    let vertexData: MeshVertexHelper.MeshVertexData | null = null

    // Type narrowing and vertex calculation based on object properties
    if ('anchorX' in obj && 'anchorY' in obj) {
      // Diamond object
      const diamond = obj as GeometricDiamond
      vertexData = MeshVertexHelper.calculateDiamondVertices(
        diamond.anchorX,
        diamond.anchorY,
        diamond.width,
        diamond.height
      )
    } else if ('width' in obj && 'height' in obj) {
      // Rectangle object
      const rect = obj as GeometricRectangle
      vertexData = MeshVertexHelper.calculateRectangleVertices(
        rect.x,
        rect.y,
        rect.width,
        rect.height
      )
    } else if ('radius' in obj) {
      // Circle object
      const circle = obj as GeometricCircle
      const segments = this.calculateCircleSegments(circle.radius, pixeloidScale)
      vertexData = MeshVertexHelper.calculateCircleVertices(
        circle.centerX,
        circle.centerY,
        circle.radius,
        segments
      )
    } else if ('startX' in obj && 'endX' in obj) {
      // Line object - only stroke (same as original)
      const line = obj as GeometricLine
      const thickness = (line.strokeWidth || gameStore.geometry.drawing.settings.defaultStrokeWidth) / pixeloidScale
      vertexData = MeshVertexHelper.calculateLineVertices(
        line.startX,
        line.startY,
        line.endX,
        line.endY,
        thickness
      )
      
      // Lines only have stroke
      const strokeMesh = new MeshSimple({
        texture: Texture.WHITE,
        vertices: vertexData.vertices,
        uvs: vertexData.uvs,
        indices: vertexData.indices
      })
      strokeMesh.tint = line.color
      strokeMesh.alpha = line.strokeAlpha

      const container = new Container()
      container.addChild(strokeMesh)
      return container
    } else if ('x' in obj && 'y' in obj && !('width' in obj)) {
      // Point object - only fill (same as original)
      const point = obj as GeometricPoint
      const radius = 2 / pixeloidScale // Scale point size
      vertexData = MeshVertexHelper.calculatePointVertices(point.x, point.y, radius)
      
      // Points are always filled with their color
      const fillMesh = new MeshSimple({
        texture: Texture.WHITE,
        vertices: vertexData.vertices,
        uvs: vertexData.uvs,
        indices: vertexData.indices
      })
      fillMesh.tint = point.color
      fillMesh.alpha = point.strokeAlpha

      const container = new Container()
      container.addChild(fillMesh)
      return container
    }

    if (!vertexData) {
      return null
    }

    // For shapes that can have both fill and stroke (rectangles, circles, diamonds)
    // EXACTLY match the original Graphics renderer behavior with proper stroke outlines
    const container = new Container()
    
    // STEP 1: Add fill if fillColor is defined (exactly like Graphics)
    if ('fillColor' in obj && obj.fillColor !== undefined) {
      const fillMesh = new MeshSimple({
        texture: Texture.WHITE,
        vertices: vertexData.vertices,
        uvs: vertexData.uvs,
        indices: vertexData.indices
      })
      fillMesh.tint = obj.fillColor
      fillMesh.alpha = ('fillAlpha' in obj && obj.fillAlpha !== undefined) ? obj.fillAlpha : 0.5
      container.addChild(fillMesh)
    }

    // STEP 2: Always add stroke outline (exactly like Graphics)
    let strokeVertexData: MeshVertexHelper.MeshVertexData | null = null
    const strokeWidth = ('strokeWidth' in obj && obj.strokeWidth !== undefined) ? obj.strokeWidth : gameStore.geometry.drawing.settings.defaultStrokeWidth

    if ('anchorX' in obj && 'anchorY' in obj) {
      // Diamond stroke outline
      const diamond = obj as GeometricDiamond
      strokeVertexData = MeshVertexHelper.calculateDiamondStrokeVertices(
        diamond.anchorX,
        diamond.anchorY,
        diamond.width,
        diamond.height,
        strokeWidth / pixeloidScale
      )
    } else if ('width' in obj && 'height' in obj) {
      // Rectangle stroke outline
      const rect = obj as GeometricRectangle
      strokeVertexData = MeshVertexHelper.calculateRectangleStrokeVertices(
        rect.x,
        rect.y,
        rect.width,
        rect.height,
        strokeWidth / pixeloidScale
      )
    } else if ('radius' in obj) {
      // Circle stroke outline
      const circle = obj as GeometricCircle
      const segments = this.calculateCircleSegments(circle.radius, pixeloidScale)
      strokeVertexData = MeshVertexHelper.calculateCircleStrokeVertices(
        circle.centerX,
        circle.centerY,
        circle.radius,
        strokeWidth / pixeloidScale,
        segments
      )
    }

    if (strokeVertexData) {
      const strokeMesh = new MeshSimple({
        texture: Texture.WHITE,
        vertices: strokeVertexData.vertices,
        uvs: strokeVertexData.uvs,
        indices: strokeVertexData.indices
      })
      strokeMesh.tint = obj.color
      strokeMesh.alpha = obj.strokeAlpha
      container.addChild(strokeMesh)
    }

    return container
  }

  /**
   * Calculate optimal segment count for circles based on radius and scale
   */
  private calculateCircleSegments(radius: number, pixeloidScale: number): number {
    // Adaptive segment count based on visual size
    const visualRadius = radius * pixeloidScale
    const segments = Math.max(8, Math.min(64, Math.floor(visualRadius / 4)))
    return segments
  }

  /**
   * Check if object is within or near the viewport for culling
   * Reuses the same logic as Graphics-based renderer
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
   * Render preview mesh for active drawing operations
   * Matches the exact behavior of the original Graphics-based renderer
   */
  private renderPreviewMesh(pixeloidScale: number): void {
    // Remove existing preview container
    if (this.previewContainer) {
      this.mainContainer.removeChild(this.previewContainer)
      this.previewContainer.destroy()
      this.previewContainer = null
    }
    
    const activeDrawing = gameStore.geometry.drawing.activeDrawing
    
    if (!activeDrawing.isDrawing || !activeDrawing.startPoint || !activeDrawing.currentPoint) {
      return
    }

    const startPoint = activeDrawing.startPoint
    const currentPoint = activeDrawing.currentPoint
    const settings = gameStore.geometry.drawing.settings
    const previewAlpha = 0.6
    let vertexData: MeshVertexHelper.MeshVertexData | null = null

    if (activeDrawing.type === 'rectangle') {
      // Calculate preview rectangle properties
      const minX = Math.min(startPoint.x, currentPoint.x)
      const minY = Math.min(startPoint.y, currentPoint.y)
      const maxX = Math.max(startPoint.x, currentPoint.x)
      const maxY = Math.max(startPoint.y, currentPoint.y)
      
      const width = maxX - minX
      const height = maxY - minY
      
      // Only render preview if it has some size
      if (width >= 1 && height >= 1) {
        vertexData = MeshVertexHelper.calculateRectangleVertices(minX, minY, width, height)
      }
    } else if (activeDrawing.type === 'line') {
      // Calculate distance for minimum line length
      const distance = Math.sqrt(Math.pow(currentPoint.x - startPoint.x, 2) + Math.pow(currentPoint.y - startPoint.y, 2))
      
      if (distance >= 1) {
        const thickness = settings.defaultStrokeWidth / pixeloidScale
        vertexData = MeshVertexHelper.calculateLineVertices(startPoint.x, startPoint.y, currentPoint.x, currentPoint.y, thickness)
      }
    } else if (activeDrawing.type === 'circle') {
      // Calculate radius
      const radius = Math.sqrt(Math.pow(currentPoint.x - startPoint.x, 2) + Math.pow(currentPoint.y - startPoint.y, 2))
      
      if (radius >= 1) {
        const segments = this.calculateCircleSegments(radius, pixeloidScale)
        vertexData = MeshVertexHelper.calculateCircleVertices(startPoint.x, startPoint.y, radius, segments)
      }
    } else if (activeDrawing.type === 'diamond') {
      // Use centralized geometry calculations for preview
      const preview = GeometryHelper.calculateDiamondPreview(startPoint, currentPoint)
      
      if (preview.width > 0) {
        vertexData = MeshVertexHelper.calculateDiamondVertices(
          preview.anchorX,
          preview.anchorY,
          preview.width,
          preview.height
        )
      }
    }

    if (vertexData) {
      this.previewContainer = new Container()

      // STEP 1: Apply fill if enabled (exactly like original Graphics renderer)
      if (settings.fillEnabled) {
        const fillMesh = new MeshSimple({
          texture: Texture.WHITE,
          vertices: vertexData.vertices,
          uvs: vertexData.uvs,
          indices: vertexData.indices
        })
        fillMesh.tint = settings.defaultFillColor
        fillMesh.alpha = previewAlpha * settings.fillAlpha
        this.previewContainer.addChild(fillMesh)
      }

      // STEP 2: Always apply stroke outline (exactly like original Graphics renderer)
      let strokeVertexData: MeshVertexHelper.MeshVertexData | null = null

      if (activeDrawing.type === 'rectangle') {
        const minX = Math.min(startPoint.x, currentPoint.x)
        const minY = Math.min(startPoint.y, currentPoint.y)
        const maxX = Math.max(startPoint.x, currentPoint.x)
        const maxY = Math.max(startPoint.y, currentPoint.y)
        const width = maxX - minX
        const height = maxY - minY
        
        if (width >= 1 && height >= 1) {
          strokeVertexData = MeshVertexHelper.calculateRectangleStrokeVertices(
            minX, minY, width, height, settings.defaultStrokeWidth / pixeloidScale
          )
        }
      } else if (activeDrawing.type === 'circle') {
        const radius = Math.sqrt(Math.pow(currentPoint.x - startPoint.x, 2) + Math.pow(currentPoint.y - startPoint.y, 2))
        
        if (radius >= 1) {
          const segments = this.calculateCircleSegments(radius, pixeloidScale)
          strokeVertexData = MeshVertexHelper.calculateCircleStrokeVertices(
            startPoint.x, startPoint.y, radius, settings.defaultStrokeWidth / pixeloidScale, segments
          )
        }
      } else if (activeDrawing.type === 'diamond') {
        const preview = GeometryHelper.calculateDiamondPreview(startPoint, currentPoint)
        
        if (preview.width > 0) {
          strokeVertexData = MeshVertexHelper.calculateDiamondStrokeVertices(
            preview.anchorX, preview.anchorY, preview.width, preview.height, settings.defaultStrokeWidth / pixeloidScale
          )
        }
      } else if (activeDrawing.type === 'line') {
        // For lines, use the original filled approach (lines are already stroke-like)
        strokeVertexData = vertexData
      }

      if (strokeVertexData) {
        const strokeMesh = new MeshSimple({
          texture: Texture.WHITE,
          vertices: strokeVertexData.vertices,
          uvs: strokeVertexData.uvs,
          indices: strokeVertexData.indices
        })
        strokeMesh.tint = settings.defaultColor
        strokeMesh.alpha = previewAlpha * settings.strokeAlpha
        this.previewContainer.addChild(strokeMesh)
      }

      this.mainContainer.addChild(this.previewContainer)
    }
  }

  /**
   * Get the main container for adding to layer
   */
  public getContainer(): Container {
    return this.mainContainer
  }

  /**
   * Get object containers for texture capture (READ-ONLY access for TextureRegistry)
   */
  public getObjectContainers(): Map<string, Container> {
    return new Map(this.objectContainers) // Return copy to prevent external modification
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    // Destroy all object containers
    for (const container of this.objectContainers.values()) {
      container.destroy()
    }
    this.objectContainers.clear()
    
    // Destroy preview container
    if (this.previewContainer) {
      this.previewContainer.destroy()
      this.previewContainer = null
    }
    
    // Destroy main container
    this.mainContainer.destroy()
  }
}