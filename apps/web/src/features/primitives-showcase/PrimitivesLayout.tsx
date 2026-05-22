import { useState } from 'react'
import { Outlet } from '@tanstack/react-router'
import { ScrollArea } from '@/components/ui/scroll-area'

const NAV_ITEMS = [
  { id: 'tabs', label: 'Tabs' },
  { id: 'badge', label: 'Badge' },
  { id: 'popover', label: 'Popover' },
  { id: 'select', label: 'Select' },
  { id: 'combobox', label: 'Combobox' },
  { id: 'sidebar', label: 'Sidebar' },
  { id: 'sheet', label: 'Sheet' },
  { id: 'scroll-area', label: 'Scroll Area' },
  { id: 'date-picker', label: 'Date Picker' },
  { id: 'pagination', label: 'Pagination' },
  { id: 'navigation-menu', label: 'Navigation Menu' },
  { id: 'dropdown-menu', label: 'Dropdown Menu' },
  { id: 'tooltip', label: 'Tooltip' },
  { id: 'dialog', label: 'Dialog' },
  { id: 'toast', label: 'Toast' },
  { id: 'context-menu', label: 'Context Menu' },
  { id: 'calendar', label: 'Calendar' },
] as const

export function PrimitivesLayout() {
  const [dark, setDark] = useState(
    () => document.documentElement.classList.contains('dark'),
  )

  function toggleDark() {
    const next = !dark
    document.documentElement.classList.toggle('dark', next)
    setDark(next)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-950">
      <aside className="hidden md:flex w-56 shrink-0 flex-col bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800">
        <div className="flex h-14 shrink-0 items-center px-5 border-b border-neutral-200 dark:border-neutral-800">
          <span className="text-sm font-black tracking-tight text-neutral-900 dark:text-neutral-100">
            deha<span className="text-emerald-500">.</span>
            <span className="ml-1.5 text-xs font-medium text-neutral-400">primitives</span>
          </span>
        </div>

        <ScrollArea className="flex-1">
          <nav className="p-3 space-y-0.5" aria-label="Primitive sections">
            {NAV_ITEMS.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-neutral-600 dark:text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
              >
                {label}
              </a>
            ))}
          </nav>
        </ScrollArea>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-6">
          <h1 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
            UI Primitives Showcase
          </h1>
          <button
            type="button"
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggleDark}
            className="flex size-8 items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
          >
            {dark ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
        </header>

        <ScrollArea className="flex-1">
          <div className="px-6 py-8">
            <Outlet />
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
