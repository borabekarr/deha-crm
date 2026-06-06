import { createFileRoute, Link, redirect } from '@tanstack/react-router'

const PREVIEW_ROUTE = import.meta.env.VITE_PREVIEW_ROUTE as string | undefined

export const Route = createFileRoute('/')({
  beforeLoad() {
    if (PREVIEW_ROUTE && PREVIEW_ROUTE !== '/') {
      throw redirect({ to: PREVIEW_ROUTE })
    }
  },
  component: ShowcasePage,
})

const COMPONENT_PLACEHOLDERS = [
  'Button',
  'Badge',
  'Card',
  'Dialog',
  'Dropdown Menu',
  'Input',
  'Select',
  'Tabs',
  'Toast',
  'Tooltip',
  'Combobox',
  'Date Picker',
  'Popover',
  'Scroll Area',
  'Navigation Menu',
]

function ShowcasePage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Component Showcase</h1>
      <p className="mb-6 text-muted-foreground">
        Components will appear here as the design system pipeline progresses.
      </p>

      {/* Live components */}
      <div className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Live</h2>
        <ul className="flex flex-wrap gap-3">
          <li>
            <Link
              to="/leads"
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900"
            >
              Leads Table
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </li>
        </ul>
      </div>

      {/* Planned components */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Planned</h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {COMPONENT_PLACEHOLDERS.map((name) => (
            <li
              key={name}
              className="rounded border px-4 py-3 text-sm font-medium text-foreground"
            >
              {name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
