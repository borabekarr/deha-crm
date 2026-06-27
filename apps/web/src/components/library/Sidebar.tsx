import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { getGroupedByStatus, type RegistryEntry } from '@/lib/component-registry'

const grouped = getGroupedByStatus()

type StatusGroups = Map<string, Map<string, RegistryEntry[]>>

interface SidebarProps {
  activeSlug?: string
}

function filterGroups(query: string): StatusGroups {
  if (query.trim() === '') return grouped

  const lower = query.toLowerCase()
  const out: StatusGroups = new Map()

  for (const [status, sub] of grouped) {
    const subOut = new Map<string, RegistryEntry[]>()
    for (const [cat, entries] of sub) {
      const matches = entries.filter(
        (e) =>
          e.name.toLowerCase().includes(lower) ||
          e.subtitle.toLowerCase().includes(lower),
      )
      if (matches.length > 0) subOut.set(cat, matches)
    }
    if (subOut.size > 0) out.set(status, subOut)
  }

  return out
}

function statusCount(sub: Map<string, RegistryEntry[]>): number {
  let n = 0
  for (const entries of sub.values()) n += entries.length
  return n
}

export function Sidebar({ activeSlug }: SidebarProps) {
  const [query, setQuery] = useState('')
  const filtered = filterGroups(query)

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

      {/* Nav groups: status → subcategory → entries */}
      <nav className="flex flex-col gap-6 overflow-y-auto">
        {filtered.size === 0 && (
          <p className="px-1 text-xs text-muted-foreground">No results for "{query}"</p>
        )}
        {[...filtered.entries()].map(([status, sub]) => (
          <div key={status} className="flex flex-col gap-3">
            {/* Status header */}
            <div className="flex items-baseline justify-between px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                {status}
              </h2>
              <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
                {statusCount(sub)}
              </span>
            </div>

            {/* Subcategories */}
            {[...sub.entries()].map(([cat, entries]) => (
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
          </div>
        ))}
      </nav>
    </aside>
  )
}
