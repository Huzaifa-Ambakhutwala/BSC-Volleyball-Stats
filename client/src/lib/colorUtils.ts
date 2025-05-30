/**
 * Utility functions for color manipulation and contrast calculation
 */

/**
 * Convert hex color to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculate the luminance of a color
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: { r: number; g: number; b: number }, color2: { r: number; g: number; b: number }): number {
  const lum1 = getLuminance(color1.r, color1.g, color1.b);
  const lum2 = getLuminance(color2.r, color2.g, color2.b);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Determine if a color is light or dark
 */
export function isLightColor(color: string): boolean {
  const rgb = hexToRgb(color);
  if (!rgb) return true; // Default to light if can't parse
  
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  return luminance > 0.5;
}

/**
 * Get contrasting text color (black or white) for a given background color
 */
export function getContrastingTextColor(backgroundColor: string): string {
  return isLightColor(backgroundColor) ? '#000000' : '#ffffff';
}

/**
 * Add text shadow for better readability on colored backgrounds
 */
export function getTextShadowStyle(backgroundColor: string): string {
  const isLight = isLightColor(backgroundColor);
  if (isLight) {
    // For light backgrounds, use dark shadow
    return '1px 1px 2px rgba(0, 0, 0, 0.5), -1px -1px 2px rgba(0, 0, 0, 0.3)';
  } else {
    // For dark backgrounds, use light shadow
    return '1px 1px 2px rgba(255, 255, 255, 0.5), -1px -1px 2px rgba(255, 255, 255, 0.3)';
  }
}

/**
 * Darken a color by a percentage
 */
export function darkenColor(color: string, percent: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  const factor = 1 - (percent / 100);
  const r = Math.round(rgb.r * factor);
  const g = Math.round(rgb.g * factor);
  const b = Math.round(rgb.b * factor);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Get optimized styling for text on colored background
 */
export function getOptimizedTextStyle(backgroundColor: string): {
  color: string;
  textShadow: string;
  backgroundColor?: string;
} {
  const isLight = isLightColor(backgroundColor);
  
  // Special handling for yellow and other light colors that are hard to read
  if (backgroundColor.toLowerCase() === '#eab308' || backgroundColor.toLowerCase() === '#fbbf24' || isLight) {
    return {
      color: '#000000',
      textShadow: '1px 1px 2px rgba(255, 255, 255, 0.8), -1px -1px 2px rgba(255, 255, 255, 0.6)',
      backgroundColor: darkenColor(backgroundColor, 15) // Slightly darken light backgrounds
    };
  }
  
  return {
    color: getContrastingTextColor(backgroundColor),
    textShadow: getTextShadowStyle(backgroundColor)
  };
}