import { useLocalStorage } from '@/lib/hooks'

// Apply dark mode via both the .dark class and the data-theme attribute, so
// the restored component CSS (which keys off html.dark and [data-theme]) renders
// correctly in both light and dark. Storage is owned by the hook — no localStorage.setItem here.
function applyThemeDom(dark: boolean) {
  const el = document.documentElement
  el.classList.toggle('dark', dark)
  el.setAttribute('data-theme', dark ? 'dark' : 'light')
}

export function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage<'dark' | 'light'>(
    'deha-theme',
    () => (document.documentElement.classList.contains('dark') ? 'dark' : 'light'),
    { serializer: (v) => v, deserializer: (v) => v as 'dark' | 'light' },
  )
  const isDark = theme === 'dark'

  function handleToggle() {
    const next = isDark ? 'light' : 'dark'
    setTheme(next)
    applyThemeDom(next === 'dark')
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex size-8 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary-500)] focus-visible:ring-offset-2"
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
