import { useState } from 'react'

export const PRIMARY_THEMES = ['emerald', 'sunflower', 'bloodymary', 'petalglow', 'sexyblue', 'richgold'] as const
export type PrimaryTheme = (typeof PRIMARY_THEMES)[number]

function readInitialPrimary(): PrimaryTheme {
  if (typeof window === 'undefined') return 'emerald'
  const stored = localStorage.getItem('deha-primary')
  return (PRIMARY_THEMES as readonly string[]).includes(stored ?? '') ? (stored as PrimaryTheme) : 'emerald'
}

function applyPrimaryDom(theme: PrimaryTheme) {
  const el = document.documentElement
  if (theme === 'emerald') el.removeAttribute('data-primary')
  else el.setAttribute('data-primary', theme)
  localStorage.setItem('deha-primary', theme)
}

// Re-apply the persisted palette at module load so a hard reload restores
// data-primary before first paint, mirroring SlowDownToggle's pattern
// (no useEffect needed).
if (typeof window !== 'undefined') {
  applyPrimaryDom(readInitialPrimary())
}

export function PrimaryThemeSwitcher() {
  const [theme, setTheme] = useState<PrimaryTheme>(readInitialPrimary)

  function handleCycle() {
    const next = PRIMARY_THEMES[(PRIMARY_THEMES.indexOf(theme) + 1) % PRIMARY_THEMES.length]
    setTheme(next)
    applyPrimaryDom(next)
  }

  return (
    <button
      type="button"
      onClick={handleCycle}
      aria-label={`Primary theme: ${theme}. Click to switch.`}
      title={`Primary theme: ${theme}`}
      className="flex size-8 items-center justify-center rounded-md border border-[var(--border-hairline)] bg-[var(--bg-card-solid)] text-[var(--fg1)] transition-[color,background-color,border-color,transform] hover:bg-[var(--bg-chip)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary-500)] focus-visible:ring-offset-2"
    >
      <span
        aria-hidden="true"
        className="size-3.5 rounded-full border border-border"
        style={{ backgroundColor: 'var(--brand-primary)' }}
      />
    </button>
  )
}
