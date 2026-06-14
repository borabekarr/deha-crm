import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { getGrouped } from '@/lib/component-registry'
import { GalleryLayout } from '@/components/library/GalleryLayout'

const PREVIEW_ROUTE = import.meta.env.VITE_PREVIEW_ROUTE as string | undefined

export const Route = createFileRoute('/')({
  beforeLoad() {
    if (PREVIEW_ROUTE && PREVIEW_ROUTE !== '/') {
      throw redirect({ to: PREVIEW_ROUTE })
    }
  },
  component: ShowcasePage,
})

const grouped = getGrouped()

function ShowcasePage() {
  const total = [...grouped.values()].reduce((n, entries) => n + entries.length, 0)

  return (
    <GalleryLayout>
      <div className="flex-1 overflow-auto bg-muted/30">
        <div className="mx-auto max-w-5xl px-6 py-10">
          {/* Hero */}
          <header className="mb-10">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Deha UI Library</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {total} components across {grouped.size} categories. Click any card to open its live preview.
            </p>
          </header>

          {/* Live (app routes, not registry previews) */}
          <section className="mb-10">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Live
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                to="/leads"
                className="group flex flex-col rounded-lg border border-emerald-200 bg-emerald-50 p-4 transition-colors hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60"
              >
                <span className="flex items-center justify-between text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                  Leads Table
                  <svg className="size-3.5 opacity-60 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
                <span className="mt-1 text-xs text-emerald-800/80 dark:text-emerald-300/70">
                  Full leads data table at /leads
                </span>
              </Link>
            </div>
          </section>

          {/* Registry components grouped by category */}
          {[...grouped.entries()].map(([category, entries]) =>
            entries.length === 0 ? null : (
              <section key={category} className="mb-10">
                <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {category}
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {entries.map((entry) => (
                    <Link
                      key={entry.slug}
                      to="/components/$slug"
                      params={{ slug: entry.slug }}
                      className="group flex flex-col rounded-lg border border-border bg-card p-4 transition-colors hover:border-foreground/20 hover:bg-muted"
                    >
                      <span className="flex items-center justify-between text-sm font-semibold text-foreground">
                        {entry.name}
                        <svg className="size-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                      <span className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {entry.subtitle}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            ),
          )}
        </div>
      </div>
    </GalleryLayout>
  )
}
