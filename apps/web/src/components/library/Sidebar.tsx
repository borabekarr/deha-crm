import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { getGrouped, type RegistryEntry } from '@/lib/component-registry'

const grouped = getGrouped()

interface SidebarProps {
  activeSlug?: string
}

export function Sidebar({ activeSlug }: SidebarProps) {
  const [query, setQuery] = useState('')

  const filtered: Map<string, RegistryEntry[]> = new Map()

  if (query.trim() === '') {
    for (const [cat, entries] of grouped) {
      if (entries.length > 0) filtered.set(cat, entries)
    }
  } else {
    const lower = query.toLowerCase()
    for (const [cat, entries] of grouped) {
      const matches = entries.filter(
        (e) =>
          e.name.toLowerCase().includes(lower) ||
          e.subtitle.toLowerCase().includes(lower),
      )
      if (matches.length > 0) filtered.set(cat, matches)
    }
  }

  return (
    <aside className="flex w-56 shrink-0 flex-col gap-4 border-r border-border bg-background px-3 py-4">
      {/* Brand */}
      <div className="px-1">
        <Link to="/" className="text-sm font-semibold tracking-tight text-foreground hover:text-foreground/80">
          Deha UI Library
        </Link>
      </div>

      {/* Search */}
      <div className="px-1">
        <input
          type="search"
          placeholder="Search components…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-md border border-border bg-muted px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          aria-label="Search components"
        />
      </div>

      {/* Nav groups */}
      <nav className="flex flex-col gap-4 overflow-y-auto">
        {filtered.size === 0 && (
          <p className="px-1 text-xs text-muted-foreground">No results for "{query}"</p>
        )}
        {[...filtered.entries()].map(([cat, entries]) => (
          <div key={cat}>
            <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {cat}
            </p>
            <ul className="flex flex-col gap-0.5">
              {entries.map((entry) => {
                const isActive = entry.slug === activeSlug
                return (
                  <li key={entry.slug}>
                    <Link
                      to="/components/$slug"
                      params={{ slug: entry.slug }}
                      className={[
                        'block rounded-md px-2 py-1.5 text-sm transition-colors',
                        isActive
                          ? 'bg-accent text-accent-foreground font-medium'
                          : 'text-foreground/80 hover:bg-muted hover:text-foreground',
                      ].join(' ')}
                    >
                      {entry.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
