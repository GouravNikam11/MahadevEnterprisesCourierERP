/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        erp: {
          bg: 'rgb(var(--erp-bg) / <alpha-value>)',
          surface: 'rgb(var(--erp-surface) / <alpha-value>)',
          'surface-elevated': 'rgb(var(--erp-surface-elevated) / <alpha-value>)',
          border: 'rgb(var(--erp-border) / <alpha-value>)',
          'border-strong': 'rgb(var(--erp-border-strong) / <alpha-value>)',
          text: 'rgb(var(--erp-text) / <alpha-value>)',
          muted: 'rgb(var(--erp-text-muted) / <alpha-value>)',
          subtle: 'rgb(var(--erp-text-subtle) / <alpha-value>)',
          primary: 'rgb(var(--erp-primary) / <alpha-value>)',
          'primary-hover': 'rgb(var(--erp-primary-hover) / <alpha-value>)',
          'primary-fg': 'rgb(var(--erp-primary-fg) / <alpha-value>)',
          accent: 'rgb(var(--erp-accent) / <alpha-value>)',
          hover: 'rgb(var(--erp-hover) / <alpha-value>)',
          chart: 'rgb(var(--erp-chart) / <alpha-value>)',
          overlay: 'rgb(var(--erp-overlay) / <alpha-value>)',
          ring: 'rgb(var(--erp-ring) / <alpha-value>)',
        },
      },
      boxShadow: {
        erp: 'var(--erp-shadow)',
      },
      transitionDuration: {
        theme: '300ms',
      },
    },
  },
  plugins: [],
}
