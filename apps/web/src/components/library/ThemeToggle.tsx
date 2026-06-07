import { useState } from 'react'

function readInitialDark(): boolean {
  if (typeof window === 'undefined') return false
  const stored = localStorage.getItem('deha-theme')
  if (stored !== null) return stored === 'dark'
  return document.documentElement.classList.contains('dark')
}

// Apply dark mode via both the .dark class and the data-theme attribute, so
// the restored component CSS (which keys off html.dark and [data-theme]) renders
// correctly in both light and dark.
function applyTheme(dark: boolean) {
  const el = document.documentElement
  el.classList.toggle('dark', dark)
  el.setAttribute('data-theme', dark ? 'dark' : 'light')
  localStorage.setItem('deha-theme', dark ? 'dark' : 'light')
}

export function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(readInitialDark)

  function handleToggle() {
    const next = !isDark
    setIsDark(next)
    applyTheme(next)
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary-500)] focus-visible:ring-offset-2"
    >
      {isDark ? (
        // Sun icon
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <line x1="12" y1="2" x2="12" y2="6" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="4.22" y1="4.22" x2="7.05" y2="7.05" />
          <line x1="16.95" y1="16.95" x2="19.78" y2="19.78" />
          <line x1="2" y1="12" x2="6" y2="12" />
          <line x1="18" y1="12" x2="22" y2="12" />
          <line x1="4.22" y1="19.78" x2="7.05" y2="16.95" />
          <line x1="16.95" y1="7.05" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        // Moon icon
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}
