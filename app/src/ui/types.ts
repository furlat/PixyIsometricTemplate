/**
 * UI Types
 * 
 * Type definitions for UI components, handlers, and styling.
 * Centralizes UI-specific types for consistent usage across the UI layer.
 */

/**
 * Status color mapping interface for consistent UI styling.
 * Maps status names to CSS class names for different UI states.
 */
export interface StatusColors {
  readonly active: string
  readonly inactive: string
  readonly system: string
  readonly camera: string
  readonly mouse: string
}

/**
 * UI element update parameters for consistent element manipulation.
 */
export interface UIElementUpdateParams {
  elements: Map<string, HTMLElement>
  id: string
  value: string
  cssClass: string
}

/**
 * Coordinate formatting options for display purposes.
 */
export interface CoordinateFormatOptions {
  decimals?: number
}

/**
 * Window size formatting data.
 */
export interface WindowSizeData {
  width: number
  height: number
}

/**
 * Boolean status configuration for consistent status display.
 */
export interface BooleanStatusConfig {
  activeText: string
  inactiveText: string
  activeClass: string
  inactiveClass: string
}

/**
 * Key press status configuration.
 */
export interface KeyStatusConfig {
  pressedText: string
  releasedText: string
}

// Type guards for UI types
export const isStatusColors = (obj: any): obj is StatusColors => {
  return obj &&
         typeof obj === 'object' &&
         typeof obj.active === 'string' &&
         typeof obj.inactive === 'string' &&
         typeof obj.system === 'string' &&
         typeof obj.camera === 'string' &&
         typeof obj.mouse === 'string'
}

export const isUIElementUpdateParams = (obj: any): obj is UIElementUpdateParams => {
  return obj &&
         typeof obj === 'object' &&
         obj.elements instanceof Map &&
         typeof obj.id === 'string' &&
         typeof obj.value === 'string' &&
         typeof obj.cssClass === 'string'
}