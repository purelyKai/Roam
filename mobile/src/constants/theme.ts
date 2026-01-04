/**
 * Theme constants for the Roam app
 * Provides consistent styling across the application
 */

export const colors = {
  // Brand colors
  primary: "#E20074",

  // Status colors
  success: "#1eff00ff",

  // Neutral colors
  white: "#ffffff",
  whiteOverlay: "rgba(255, 255, 255, 0.2)",
} as const;

export const spacing = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
} as const;

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  full: 9999,
} as const;

export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
  },
  weights: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
} as const;

// Convenience export for the entire theme
export const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
} as const;
