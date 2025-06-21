import { Graphics } from 'pixi.js'
import { updateGameStore, gameStore } from '../store/gameStore'
import { GeometryHelper } from './GeometryHelper'
import type { ObjectTextureData } from '../types'

/**
 * TextureRegistry handles post-render texture capture for object previews.
 * 
 * CRITICAL: This class NEVER subscribes to store changes to prevent feedback loops.
 * It only provides write methods called externally AFTER rendering completes.
 */
export class TextureRegistry {
  private previewSize = 64 // Small preview size in pixels

  constructor() {
    // CRITICAL: NO store subscriptions - only external method calls
    console.log('TextureRegistry initialized (no store subscriptions)')
  }

  /**
   * Capture texture from a Graphics object AFTER rendering is complete.
   * Uses simplified approach similar to PixiJS extract example.
   *
   * @param objectId - Unique identifier for the geometric object
   * @param graphics - The rendered Graphics object to capture
   */
  public async captureObjectTexture(objectId: string): Promise<void> {
    try {
      console.log(`TextureRegistry: Creating pixeloid preview for object ${objectId}`)
      
      // Find the object in the store to get its pixeloid coordinates
      const obj = this.findObjectInStore(objectId)
      if (!obj) {
        console.warn(`TextureRegistry: Object ${objectId} not found in store`)
        this.setFailedTexture(objectId, 'Object not found')
        return
      }

      // Create mini pixeloid viewport preview
      const preview = await this.createPixeloidPreview(obj)
      
      // Create texture data object
      const textureData: ObjectTextureData = {
        objectId,
        base64Preview: preview,
        capturedAt: Date.now(),
        isValid: true
      }

      // Store in game store (one-way write)
      updateGameStore.setObjectTexture(objectId, textureData)
      
      console.log(`TextureRegistry: Created pixeloid preview for ${objectId}`)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`TextureRegistry: Failed to capture texture for object ${objectId}:`, error)
      this.setFailedTexture(objectId, errorMessage)
    }
  }

  /**
   * Find object in store by ID
   */
  private findObjectInStore(objectId: string): any {
    return gameStore.geometry.objects.find((obj: any) => obj.id === objectId)
  }

  /**
   * Create a mini pixeloid viewport preview (like a small camera)
   */
  private async createPixeloidPreview(obj: any): Promise<string> {
    // Create canvas for mini viewport
    const canvas = document.createElement('canvas')
    canvas.width = this.previewSize
    canvas.height = this.previewSize
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      throw new Error('Failed to get canvas context')
    }

    // White background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, this.previewSize, this.previewSize)

    // Use metadata center point for proper centering
    const objectBounds = this.getObjectPixeloidBounds(obj)
    const objectCenter = obj.metadata ? obj.metadata.center : this.calculateObjectCenter(obj)
    
    const padding = 2 // pixeloids
    const viewportSize = Math.max(
      objectBounds.maxX - objectBounds.minX + (padding * 2),
      objectBounds.maxY - objectBounds.minY + (padding * 2),
      4 // minimum viewport size
    )
    
    // Calculate scale: how many canvas pixels per pixeloid
    const pixeloidScale = this.previewSize / viewportSize
    
    // Calculate viewport to center around object's center point
    const viewportLeft = objectCenter.x - viewportSize / 2
    const viewportTop = objectCenter.y - viewportSize / 2
    
    console.log(`TextureRegistry: Mini viewport - center: (${objectCenter.x.toFixed(1)}, ${objectCenter.y.toFixed(1)}), size: ${viewportSize.toFixed(1)} pixeloids, scale: ${pixeloidScale.toFixed(2)} px/pixeloid`)

    // Transform context to pixeloid coordinate system
    ctx.save()
    ctx.scale(pixeloidScale, pixeloidScale)
    ctx.translate(-viewportLeft, -viewportTop)

    // Render object using same logic as main canvas
    this.renderObjectToContext(obj, ctx)
    
    ctx.restore()
    
    return canvas.toDataURL('image/png')
  }

  /**
   * Get pixeloid bounds for an object
   */
  private getObjectPixeloidBounds(obj: any): { minX: number, maxX: number, minY: number, maxY: number } {
    if ('anchorX' in obj && 'anchorY' in obj) {
      // Diamond
      const halfWidth = obj.width / 2
      const halfHeight = obj.height / 2
      return {
        minX: obj.anchorX - halfWidth,
        maxX: obj.anchorX + halfWidth,
        minY: obj.anchorY - halfHeight,
        maxY: obj.anchorY + halfHeight
      }
    } else if ('centerX' in obj && 'centerY' in obj) {
      // Circle
      return {
        minX: obj.centerX - obj.radius,
        maxX: obj.centerX + obj.radius,
        minY: obj.centerY - obj.radius,
        maxY: obj.centerY + obj.radius
      }
    } else if ('x' in obj && 'width' in obj) {
      // Rectangle
      return {
        minX: obj.x,
        maxX: obj.x + obj.width,
        minY: obj.y,
        maxY: obj.y + obj.height
      }
    } else if ('startX' in obj && 'endX' in obj) {
      // Line
      return {
        minX: Math.min(obj.startX, obj.endX),
        maxX: Math.max(obj.startX, obj.endX),
        minY: Math.min(obj.startY, obj.endY),
        maxY: Math.max(obj.startY, obj.endY)
      }
    } else {
      // Point
      return {
        minX: obj.x - 1,
        maxX: obj.x + 1,
        minY: obj.y - 1,
        maxY: obj.y + 1
      }
    }
  }

  /**
   * Calculate object center point (fallback for objects without metadata)
   */
  private calculateObjectCenter(obj: any): { x: number, y: number } {
    if ('anchorX' in obj && 'anchorY' in obj) {
      // Diamond - center is at anchor + half width
      return {
        x: obj.anchorX + obj.width / 2,
        y: obj.anchorY
      }
    } else if ('centerX' in obj && 'centerY' in obj) {
      // Circle
      return {
        x: obj.centerX,
        y: obj.centerY
      }
    } else if ('x' in obj && 'width' in obj) {
      // Rectangle
      return {
        x: obj.x + obj.width / 2,
        y: obj.y + obj.height / 2
      }
    } else if ('startX' in obj && 'endX' in obj) {
      // Line
      return {
        x: (obj.startX + obj.endX) / 2,
        y: (obj.startY + obj.endY) / 2
      }
    } else {
      // Point
      return {
        x: obj.x,
        y: obj.y
      }
    }
  }

  /**
   * Render object to canvas context (mini version of GeometryRenderer)
   */
  private renderObjectToContext(obj: any, ctx: CanvasRenderingContext2D): void {
    // Set stroke properties with thinner lines for preview
    ctx.strokeStyle = `#${obj.color.toString(16).padStart(6, '0')}`
    
    // FIXED: Much thinner stroke width for previews to avoid filling small objects
    const originalStrokeWidth = obj.strokeWidth || 2
    ctx.lineWidth = Math.max(0.5, originalStrokeWidth * 0.25) // 25% of original, minimum 0.5px
    
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Set fill properties if available
    if (obj.fillColor !== undefined) {
      ctx.fillStyle = `#${obj.fillColor.toString(16).padStart(6, '0')}`
    }

    // Render based on object type
    if ('anchorX' in obj && 'anchorY' in obj) {
      // Diamond - use same logic as GeometryHelper
      const vertices = GeometryHelper.calculateDiamondVertices(obj)
      
      ctx.beginPath()
      ctx.moveTo(vertices.west.x, vertices.west.y)
      ctx.lineTo(vertices.north.x, vertices.north.y)
      ctx.lineTo(vertices.east.x, vertices.east.y)
      ctx.lineTo(vertices.south.x, vertices.south.y)
      ctx.closePath()
      
      if (obj.fillColor !== undefined) ctx.fill()
      ctx.stroke()
    } else if ('centerX' in obj && 'centerY' in obj) {
      // Circle
      ctx.beginPath()
      ctx.arc(obj.centerX, obj.centerY, obj.radius, 0, 2 * Math.PI)
      
      if (obj.fillColor !== undefined) ctx.fill()
      ctx.stroke()
    } else if ('x' in obj && 'width' in obj) {
      // Rectangle
      ctx.beginPath()
      ctx.rect(obj.x, obj.y, obj.width, obj.height)
      
      if (obj.fillColor !== undefined) ctx.fill()
      ctx.stroke()
    } else if ('startX' in obj && 'endX' in obj) {
      // Line
      ctx.beginPath()
      ctx.moveTo(obj.startX, obj.startY)
      ctx.lineTo(obj.endX, obj.endY)
      ctx.stroke()
    } else {
      // Point
      ctx.beginPath()
      ctx.arc(obj.x, obj.y, 2, 0, 2 * Math.PI)
      ctx.fillStyle = `#${obj.color.toString(16).padStart(6, '0')}`
      ctx.fill()
    }
  }


  /**
   * Set a failed texture state for debugging
   */
  private setFailedTexture(objectId: string, reason: string): void {
    const textureData: ObjectTextureData = {
      objectId,
      base64Preview: this.createErrorPreview(reason),
      capturedAt: Date.now(),
      isValid: false
    }

    updateGameStore.setObjectTexture(objectId, textureData)
    console.warn(`TextureRegistry: Set failed texture for ${objectId}: ${reason}`)
  }

  /**
   * Create an error preview image
   */
  private createErrorPreview(reason: string): string {
    const canvas = document.createElement('canvas')
    canvas.width = this.previewSize
    canvas.height = this.previewSize
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

    // Red background for error
    ctx.fillStyle = '#ffebee'
    ctx.fillRect(0, 0, this.previewSize, this.previewSize)
    
    // Error text
    ctx.fillStyle = '#d32f2f'
    ctx.font = '10px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('ERROR', this.previewSize / 2, this.previewSize / 2 - 8)
    ctx.font = '8px Arial'
    ctx.fillText(reason.slice(0, 8), this.previewSize / 2, this.previewSize / 2 + 4)
    
    return canvas.toDataURL('image/png')
  }




  /**
   * Batch capture textures for multiple objects.
   * Called after bulk rendering operations.
   *
   * @param objectGraphicsMap - Map of objectId to Graphics objects
   */
  public async captureMultipleTextures(objectGraphicsMap: Map<string, Graphics>): Promise<void> {
    console.log(`TextureRegistry: Batch capturing ${objectGraphicsMap.size} textures`)
    
    // Process sequentially to avoid overwhelming the renderer
    for (const [objectId] of objectGraphicsMap) {
      await this.captureObjectTexture(objectId)
    }
  }

  /**
   * Clean up texture for removed object.
   * Called when objects are deleted from the store.
   * 
   * @param objectId - ID of the deleted object
   */
  public removeObjectTexture(objectId: string): void {
    // Remove from store
    updateGameStore.removeObjectTexture(objectId)
    
    console.log(`TextureRegistry: Removed texture for object ${objectId}`)
  }

  /**
   * Get preview base64 for an object (READ-ONLY method for consumers).
   * 
   * @param objectId - Object to get preview for
   * @returns Base64 data URL or null if not available
   */
  public getObjectPreview(objectId: string): string | null {
    const textureData = updateGameStore.getObjectTexture(objectId)
    return textureData?.base64Preview || null
  }

  /**
   * Check if texture exists for an object.
   * 
   * @param objectId - Object to check
   * @returns True if texture is cached
   */
  public hasObjectTexture(objectId: string): boolean {
    return updateGameStore.hasObjectTexture(objectId)
  }

  /**
   * Clear all cached textures.
   */
  public clearCache(): void {
    // Clear store cache
    updateGameStore.clearTextureCache()
    
    console.log('TextureRegistry: Cleared all cached textures')
  }

  /**
   * Get cache statistics.
   */
  public getStats() {
    return updateGameStore.getObjectTexture
  }

  /**
   * Destroy the texture registry and clean up resources.
   */
  public destroy(): void {
    this.clearCache()
    console.log('TextureRegistry: Destroyed')
  }
}