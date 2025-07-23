import type { StatusColors } from '../types'

// Status color mapping for consistent UI styling
export const STATUS_COLORS: StatusColors = {
  active: 'status-active',
  inactive: 'status-inactive', 
  system: 'status-system',
  camera: 'status-camera',
  mouse: 'status-mouse'
}

/**
 * Updates a UI element with new value and CSS class
 */
export function updateElement(
  elements: Map<string, HTMLElement>,
  id: string, 
  value: string, 
  cssClass: string
): void {
  const element = elements.get(id);
  if (element) {
    // Clear existing status classes
    element.className = element.className
      .split(' ')
      .filter(cls => !cls.startsWith('status-') && !cls.startsWith('text-'))
      .join(' ');
    
    // Add base classes back and new status class
    element.className += ` font-bold font-mono ${cssClass}`;
    element.textContent = value;
    
    // Add a subtle animation on update
    element.classList.add('value-updated');
    setTimeout(() => {
      element.classList.remove('value-updated');
    }, 300);
  }
}

/**
 * Format coordinate pair as string
 */
export function formatCoordinates(x: number, y: number, decimals: number = 1): string {
  return `${x.toFixed(decimals)}, ${y.toFixed(decimals)}`
}

/**
 * Format window size as string
 */
export function formatWindowSize(width: number, height: number): string {
  return `${width} x ${height}`
}

/**
 * Get status class for boolean state
 */
export function getBooleanStatusClass(isActive: boolean): string {
  return isActive ? STATUS_COLORS.active : STATUS_COLORS.inactive
}

/**
 * Get status text for boolean state
 */
export function getBooleanStatusText(isActive: boolean): string {
  return isActive ? 'true' : 'false'
}

/**
 * Get key press status text
 */
export function getKeyStatusText(isPressed: boolean): string {
  return isPressed ? 'Pressed' : 'Released'
}