import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '../../theme/useTheme'
import type { ThemeMode } from '../../theme/theme.constants'

const MODES: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
  { mode: 'light', label: 'Light mode', icon: Sun },
  { mode: 'dark', label: 'Dark mode', icon: Moon },
  { mode: 'system', label: 'System theme', icon: Monitor },
]

type ThemeToggleProps = {
  /** Compact icon-only button for header */
  variant?: 'icon' | 'menu'
  className?: string
}

export function ThemeToggle({ variant = 'icon', className = '' }: ThemeToggleProps) {
  const { mode, resolvedTheme, setMode, toggleTheme } = useTheme()

  if (variant === 'icon') {
    const Icon = resolvedTheme === 'dark' ? Sun : Moon
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={[
          'erp-icon-btn',
          'transition-transform duration-300 active:scale-95',
          className,
        ].join(' ')}
        aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title={resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
      >
        <Icon
          className={[
            'h-5 w-5 transition-all duration-300',
            resolvedTheme === 'dark' ? 'rotate-0 text-amber-300' : 'rotate-0 text-erp-muted dark:text-zinc-300',
          ].join(' ')}
          aria-hidden
        />
      </button>
    )
  }

  return (
    <div
      className={['inline-flex rounded-lg border p-0.5 erp-icon-btn-border', className].join(' ')}
      role="group"
      aria-label="Theme selection"
    >
      {MODES.map(({ mode: m, label, icon: Icon }) => (
        <button
          key={m}
          type="button"
          onClick={() => setMode(m)}
          className={[
            'inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md px-2 transition-colors duration-200',
            mode === m ? 'erp-theme-pill-active' : 'erp-theme-pill',
          ].join(' ')}
          aria-label={label}
          aria-pressed={mode === m}
          title={label}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </button>
      ))}
    </div>
  )
}
