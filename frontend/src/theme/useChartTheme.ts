import { CHART_THEME } from './theme.constants'
import { useTheme } from './useTheme'

/** Returns chart color tokens for the active resolved theme (Recharts, Chart.js, etc.). */
export function useChartTheme() {
  const { resolvedTheme } = useTheme()
  return CHART_THEME[resolvedTheme]
}
