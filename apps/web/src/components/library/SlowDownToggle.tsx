import { useState } from 'react'

function readInitialSlow(): boolean {
  if (typeof window === 'undefined') return false
  const stored = localStorage.getItem('deha-anim-slow')
  return stored === 'true'
}

function applySlow(slow: boolean) {
  document.documentElement.setAttribute('data-anim-slow', slow ? 'true' : 'false')
  localStorage.setItem('deha-anim-slow', slow ? 'true' : 'false')
}

// Re-apply the persisted preference at module load so a hard reload keeps the
// button and the actual animation speed in sync (no useEffect needed).
if (typeof window !== 'undefined') {
  applySlow(readInitialSlow())
}

export function SlowDownToggle() {
  const [slow, setSlow] = useState<boolean>(readInitialSlow)

  function handleToggle() {
    const next = !slow
    setSlow(next)
    applySlow(next)
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={slow ? 'Normal animation speed' : 'Slow down animations'}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary-500)] focus-visible:ring-offset-2"
    >
      {slow ? (
        // Turtle icon (slow mode active)
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M4 12a8 8 0 0 1 8-8" />
          <path d="M20 12a8 8 0 0 1-8 8" />
          <line x1="12" y1="8" x2="12" y2="4" />
          <line x1="16" y1="12" x2="20" y2="12" />
          <line x1="12" y1="16" x2="12" y2="20" />
          <line x1="8" y1="12" x2="4" y2="12" />
        </svg>
      ) : (
        // Gauge/speed icon (normal mode)
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
          <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
          <line x1="12" y1="12" x2="8" y2="8" />
          <line x1="12" y1="4" x2="12" y2="6" />
          <line x1="4" y1="12" x2="6" y2="12" />
          <line x1="20" y1="12" x2="18" y2="12" />
        </svg>
      )}
    </button>
  )
}
