import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  DEFAULT_THEME_MODE,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemeMode,
} from './theme.constants'
import { ThemeContext } from './ThemeContext'

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function readStoredMode(): ThemeMode {
  if (typeof window === 'undefined') return DEFAULT_THEME_MODE
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  return DEFAULT_THEME_MODE
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  return mode === 'system' ? getSystemTheme() : mode
}

function applyThemeClass(resolved: ResolvedTheme) {
  const root = document.documentElement
  root.classList.toggle('dark', resolved === 'dark')
  root.style.colorScheme = resolved
}

type ThemeProviderProps = {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(() => readStoredMode())
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(readStoredMode()))

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next)
    localStorage.setItem(THEME_STORAGE_KEY, next)
    const resolved = resolveTheme(next)
    setResolvedTheme(resolved)
    applyThemeClass(resolved)
  }, [])

  const toggleTheme = useCallback(() => {
    const nextResolved: ResolvedTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
    setMode(nextResolved)
  }, [resolvedTheme, setMode])

  // Sync class when mode changes
  useEffect(() => {
    const resolved = resolveTheme(mode)
    setResolvedTheme(resolved)
    applyThemeClass(resolved)
  }, [mode])

  // Follow OS changes when mode is system
  useEffect(() => {
    if (mode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const resolved = getSystemTheme()
      setResolvedTheme(resolved)
      applyThemeClass(resolved)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [mode])

  const value = useMemo(
    () => ({ mode, resolvedTheme, setMode, toggleTheme }),
    [mode, resolvedTheme, setMode, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
