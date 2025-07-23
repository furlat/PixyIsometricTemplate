/**
 * UnifiedGeometryGenerator - Single Source of Truth for ALL Geometry Generation
 * 
 * FIXES: Drawing system failure, edit panel inconsistency, zero-size shapes
 * UNIFIES: Drawing (InputManager) + Editing (ObjectEditPanel) logic
 * AUTHORITY: Single geometry generation path - no fallbacks, no duplicates
 */

import type { PixeloidCoordinate, ObjectEditFormData, DrawingMode } from '../../types'

interface GeometryGenerationParams {
  type: DrawingMode,
  
  // For drawing scenarios (coordinate-based)
  startPoint?: PixeloidCoordinate,
  endPoint?: PixeloidCoordinate,
  
  // For edit panel scenarios (form data passthrough)
  formData?: ObjectEditFormData,
  
  // Style (unified for all scenarios)
  style: {
    strokeColor: string,
    strokeWidth: number,
    strokeAlpha: number,
    fillColor?: string,
    fillAlpha?: number,
    hasFill: boolean
  },
  
  isVisible: boolean
}

export class UnifiedGeometryGenerator {
  
  /**
   * Generate FormData for ANY geometry scenario
   * HANDLES: Drawing, Editing, Preview, Finalization
   * ELIMINATES: All drawing system failures and inconsistencies
   */
  static generateFormData(params: GeometryGenerationParams): ObjectEditFormData {
    // Validate required parameters
    if (!params.type || params.type === 'none') {
      throw new Error('UnifiedGeometryGenerator: Invalid geometry type')
    }
    
    if (!params.style) {
      throw new Error('UnifiedGeometryGenerator: Style is required')
    }
    
    // Handle edit panel scenario (form data passthrough with validation)
    if (params.formData) {
      return this.validateAndNormalizeFormData(params.formData)
    }
    
    // Handle drawing scenarios (coordinate-based generation)
    if (!params.startPoint || !params.endPoint) {
      throw new Error('UnifiedGeometryGenerator: Both startPoint and endPoint required for coordinate-based generation')
    }
    
    return this.generateFromCoordinates(params)
  }
  
  /**
   * Generate geometry from coordinates (drawing scenarios)
   * AUTHORITY: Single coordinate-to-geometry conversion logic
   */
  private static generateFromCoordinates(params: GeometryGenerationParams): ObjectEditFormData {
    const { type, startPoint, endPoint, style, isVisible } = params
    
    switch (type) {
      case 'point':
        return this.generatePointFormData(endPoint!, style, isVisible)
        
      case 'line':
        return this.generateLineFormData(startPoint!, endPoint!, style, isVisible)
        
      case 'circle':
        return this.generateCircleFormData(startPoint!, endPoint!, style, isVisible)
        
      case 'rectangle':
        return this.generateRectangleFormData(startPoint!, endPoint!, style, isVisible)
        
      case 'diamond':
        return this.generateDiamondFormData(startPoint!, endPoint!, style, isVisible)
        
      default:
        throw new Error(`UnifiedGeometryGenerator: Unsupported geometry type: ${type}`)
    }
  }
  
  /**
   * POINT GENERATION - Single coordinate
   */
  private static generatePointFormData(
    position: PixeloidCoordinate, 
    style: GeometryGenerationParams['style'], 
    isVisible: boolean
  ): ObjectEditFormData {
    return {
      point: {
        centerX: position.x,
        centerY: position.y
      },
      style,
      isVisible
    }
  }
  
  /**
   * LINE GENERATION - Start to end points
   */
  private static generateLineFormData(
    start: PixeloidCoordinate, 
    end: PixeloidCoordinate, 
    style: GeometryGenerationParams['style'], 
    isVisible: boolean
  ): ObjectEditFormData {
    return {
      line: {
        startX: start.x,
        startY: start.y,
        endX: end.x,
        endY: end.y
      },
      style,
      isVisible
    }
  }
  
  /**
   * CIRCLE GENERATION - Midpoint center, distance-based radius
   * FIXES: Circle drawing issues with consistent radius calculation
   */
  private static generateCircleFormData(
    start: PixeloidCoordinate, 
    end: PixeloidCoordinate, 
    style: GeometryGenerationParams['style'], 
    isVisible: boolean
  ): ObjectEditFormData {
    // Calculate center as midpoint between start and end
    const centerX = (start.x + end.x) / 2
    const centerY = (start.y + end.y) / 2
    
    // Calculate radius as half the distance between start and end
    const dx = end.x - start.x
    const dy = end.y - start.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const radius = Math.max(distance / 2, 0.1) // Minimum radius to prevent zero-size
    
    return {
      circle: {
        centerX,
        centerY,
        radius
      },
      style,
      isVisible
    }
  }
  
  /**
   * RECTANGLE GENERATION - Corner-based dimensions
   * FIXES: Rectangle drawing with proper center and dimensions
   */
  private static generateRectangleFormData(
    start: PixeloidCoordinate, 
    end: PixeloidCoordinate, 
    style: GeometryGenerationParams['style'], 
    isVisible: boolean
  ): ObjectEditFormData {
    // Calculate center and dimensions from corners
    const centerX = (start.x + end.x) / 2
    const centerY = (start.y + end.y) / 2
    const width = Math.abs(end.x - start.x)
    const height = Math.abs(end.y - start.y)
    
    return {
      rectangle: {
        centerX,
        centerY,
        width: Math.max(width, 0.1), // Minimum size
        height: Math.max(height, 0.1)
      },
      style,
      isVisible
    }
  }
  
  /**
   * DIAMOND GENERATION - Isometric diamond with proper dimensions
   * FIXES: Diamond drawing with consistent center and sizing
   */
  private static generateDiamondFormData(
    start: PixeloidCoordinate,
    end: PixeloidCoordinate,
    style: GeometryGenerationParams['style'],
    isVisible: boolean
  ): ObjectEditFormData {
    // DIAMOND CONSTRAINT: start = west vertex, end = drag for width only
    // Width from drag, Height = width/2 (isometric), Y stays same as west vertex
    const width = Math.abs(end.x - start.x)
    const height = width / 2  // Isometric constraint: height = width/2
    const centerX = start.x + (width / 2)  // West vertex X + half width
    const centerY = start.y                // Same Y as west vertex
    
    return {
      diamond: {
        centerX,
        centerY,
        width: Math.max(width, 0.1), // Minimum size
        height: Math.max(height, 0.1) // But respect isometric ratio
      },
      style,
      isVisible
    }
  }
  
  /**
   * Validate and normalize form data (edit panel scenarios)
   * ENSURES: Consistent data structure regardless of source
   */
  private static validateAndNormalizeFormData(formData: ObjectEditFormData): ObjectEditFormData {
    // Validate required fields exist
    if (!formData.style) {
      throw new Error('UnifiedGeometryGenerator: FormData missing style information')
    }
    
    if (formData.isVisible === undefined) {
      throw new Error('UnifiedGeometryGenerator: FormData missing visibility information')
    }
    
    // Ensure at least one geometry type is defined
    const hasGeometry = !!(
      formData.point || 
      formData.line || 
      formData.circle || 
      formData.rectangle || 
      formData.diamond
    )
    
    if (!hasGeometry) {
      throw new Error('UnifiedGeometryGenerator: FormData missing geometry information')
    }
    
    // Validate specific geometry types
    if (formData.circle) {
      if (formData.circle.radius <= 0) {
        formData.circle.radius = 0.1 // Minimum radius
      }
    }
    
    if (formData.rectangle) {
      if (formData.rectangle.width <= 0) formData.rectangle.width = 0.1
      if (formData.rectangle.height <= 0) formData.rectangle.height = 0.1
    }
    
    if (formData.diamond) {
      if (formData.diamond.width <= 0) formData.diamond.width = 0.1
      if (formData.diamond.height <= 0) formData.diamond.height = 0.1
    }
    
    return formData
  }
  
  /**
   * Utility: Check if two coordinates represent actual movement
   * PREVENTS: Zero-size shapes from same start/end coordinates
   */
  static hasMovementBetweenPoints(
    start: PixeloidCoordinate, 
    end: PixeloidCoordinate, 
    threshold: number = 2
  ): boolean {
    const dx = Math.abs(end.x - start.x)
    const dy = Math.abs(end.y - start.y)
    return dx > threshold || dy > threshold
  }
  
  /**
   * Utility: Get default style for drawing operations
   * PROVIDES: Consistent default styling across all operations
   */
  static getDefaultStyle(): GeometryGenerationParams['style'] {
    return {
      strokeColor: '#000000',
      strokeWidth: 2,
      strokeAlpha: 1.0,
      fillColor: '#ffffff',
      fillAlpha: 0.5,
      hasFill: false
    }
  }
}