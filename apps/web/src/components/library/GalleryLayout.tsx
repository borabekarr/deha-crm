import { useState, type ReactNode } from 'react'
import { ThemeToggle } from './ThemeToggle'
import { SlowDownToggle } from './SlowDownToggle'
import { PrimaryThemeSwitcher } from './PrimaryThemeSwitcher'
import { Sidebar } from './Sidebar'
import { MobileNavSheet } from './MobileNavSheet'

interface GalleryLayoutProps {
  children: ReactNode
  activeSlug?: string
}

export function GalleryLayout({ children, activeSlug }: GalleryLayoutProps) {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="flex h-full min-h-dvh flex-col">
      {/* Top bar */}
      <header className="flex h-11 md:h-10 shrink-0 items-center justify-between border-b border-border bg-background px-4">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            className="flex min-h-11 items-center gap-1.5 rounded-md px-1 text-sm text-foreground transition-transform duration-[calc(var(--duration-fast)*var(--anim-mult,1))] ease-out active:scale-[0.97] md:hidden"
            aria-label="Browse components"
          >
            <svg viewBox="0 0 20 20" fill="none" className="size-5 shrink-0" aria-hidden="true">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Browse
          </button>
          <span className="truncate text-xs text-muted-foreground">
            UI Library<span className="hidden sm:inline"> — Deha CRM</span>
          </span>
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          <SlowDownToggle />
          <PrimaryThemeSwitcher />
          <ThemeToggle />
        </div>
      </header>

      {/* Body: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeSlug={activeSlug} />
        <main className="flex flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>

      <MobileNavSheet open={navOpen} onClose={() => setNavOpen(false)} activeSlug={activeSlug} />
    </div>
  )
}
