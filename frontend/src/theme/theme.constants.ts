export const THEME_STORAGE_KEY = 'mecs-erp-theme'

/** User preference; `system` follows OS color scheme. */
export type ThemeMode = 'light' | 'dark' | 'system'

export type ResolvedTheme = 'light' | 'dark'

export const DEFAULT_THEME_MODE: ThemeMode = 'light'

/** Chart theming tokens (for Recharts / Chart.js when added). */
export const CHART_THEME = {
  light: {
    grid: '#e2e8f0',
    axis: '#64748b',
    tooltipBg: '#ffffff',
    tooltipBorder: '#e2e8f0',
    tooltipText: '#0f172a',
    series: ['#0f172a', '#3b82f6', '#10b981', '#f59e0b'],
  },
  dark: {
    grid: '#3f3f46',
    axis: '#a1a1aa',
    tooltipBg: '#18181b',
    tooltipBorder: '#3f3f46',
    tooltipText: '#f4f4f5',
    series: ['#f4f4f5', '#60a5fa', '#34d399', '#fbbf24'],
  },
} as const
