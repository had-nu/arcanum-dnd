export const theme = {
  colors: {
    bg: {
      root: '#0d0d12',
      surface: '#14141a',
      elevated: '#1a1a24',
      hover: '#24243d',
      active: '#2a2a40',
      input: '#0a0a0f',
    },
    border: {
      default: '#2a1f1f',
      light: '#3d2a2a',
      focus: '#c50009',
    },
    text: {
      default: '#e8e0d8',
      muted: '#9a8e86',
      dim: '#6b5f57',
    },
    red: {
      default: '#c50009',
      hover: '#a00008',
    },
    blue: '#5b8def',
    green: '#00b87a',
    gold: {
      default: '#c9a94e',
      dim: '#a8882e',
    },
    purple: '#a855f7',
    pact: '#7c3aed',
  },
  fonts: {
    body: '"Roboto", "Helvetica Neue", Arial, sans-serif',
    heading: '"Tiamat Condensed SC", Georgia, serif',
    label: '"Roboto Condensed", "Roboto", sans-serif',
  },
  radii: {
    default: '4px',
    lg: '8px',
    xl: '12px',
  },
  spacing: {
    header: '60px',
    steps: '56px',
    maxWidth: '1200px',
  },
  shadows: {
    red: 'rgba(197, 0, 9, 0.15)',
    gold: 'rgba(201, 169, 78, 0.15)',
    green: 'rgba(0, 184, 122, 0.15)',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
} as const;

export type Theme = typeof theme;

export function getCssVariables(customTheme: Theme = theme): Record<string, string> {
  return {
    '--bg-root': customTheme.colors.bg.root,
    '--bg-surface': customTheme.colors.bg.surface,
    '--bg-elevated': customTheme.colors.bg.elevated,
    '--bg-hover': customTheme.colors.bg.hover,
    '--bg-active': customTheme.colors.bg.active,
    '--bg-input': customTheme.colors.bg.input,
    '--border': customTheme.colors.border.default,
    '--border-light': customTheme.colors.border.light,
    '--border-focus': customTheme.colors.border.focus,
    '--text': customTheme.colors.text.default,
    '--text-muted': customTheme.colors.text.muted,
    '--text-dim': customTheme.colors.text.dim,
    '--red': customTheme.colors.red.default,
    '--red-hover': customTheme.colors.red.hover,
    '--blue': customTheme.colors.blue,
    '--green': customTheme.colors.green,
    '--gold': customTheme.colors.gold.default,
    '--gold-dim': customTheme.colors.gold.dim,
    '--purple': customTheme.colors.purple,
    '--pact': customTheme.colors.pact,
    '--font-body': customTheme.fonts.body,
    '--font-heading': customTheme.fonts.heading,
    '--font-label': customTheme.fonts.label,
    '--radius': customTheme.radii.default,
    '--radius-lg': customTheme.radii.lg,
    '--radius-xl': customTheme.radii.xl,
    '--max-width': customTheme.spacing.maxWidth,
    '--header-h': customTheme.spacing.header,
    '--steps-h': customTheme.spacing.steps,
  };
}