import type { ReactNode } from 'react'
import { ThemeToggle } from './ThemeToggle'
import { SlowDownToggle } from './SlowDownToggle'
import { PrimaryThemeSwitcher } from './PrimaryThemeSwitcher'
import { Sidebar } from './Sidebar'

interface GalleryLayoutProps {
  children: ReactNode
  activeSlug?: string
}

export function GalleryLayout({ children, activeSlug }: GalleryLayoutProps) {
  return (
    <div className="flex h-full min-h-screen flex-col">
      {/* Top bar */}
      <header className="flex h-10 shrink-0 items-center justify-between border-b border-border bg-background px-4">
        <span className="text-xs text-muted-foreground">UI Library — Deha CRM</span>
        <div className="flex items-center gap-2">
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
    </div>
  )
}
