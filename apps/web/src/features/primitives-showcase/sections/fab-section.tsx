import { useState } from 'react'
import { Fab } from '@/components/ui/fab'

const MENU_ITEMS = [
  {
    id: 'contact',
    label: 'New Contact',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    id: 'deal',
    label: 'New Deal',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
  },
  {
    id: 'task',
    label: 'New Task',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="9 11 12 14 22 4"/>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
  },
  {
    id: 'note',
    label: 'New Note',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
]

/**
 * Shows FAB in a contained preview: the FAB renders position:absolute inside
 * a position:relative container so it doesn't escape the showcase card.
 * A separate toggle button mounts/unmounts the contained FAB so users can
 * also preview the "appears on screen" feel without a truly fixed overlay.
 */
export function FABSection() {
  const [mounted, setMounted] = useState(false)

  return (
    <section id="fab" className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          FAB
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Floating action button with expanding overlay, staggered menu items, and
          plus-to-close icon morph. Honors{' '}
          <code className="font-mono text-xs">prefers-reduced-motion</code>. Escape
          and backdrop click close.
        </p>
        <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
          Ported from rit3zh/expo-fab.
        </p>
      </div>

      {/* Contained preview */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6">
        <p className="mb-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">
          Contained preview (position: absolute)
        </p>

        <div className="relative h-80 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          {/* Background content */}
          <div className="p-6 space-y-3">
            {['Alice Johnson', 'Ben Carter', 'Clara Kim'].map((name) => (
              <div
                key={name}
                className="flex items-center gap-3 rounded-lg bg-white dark:bg-neutral-800 px-4 py-3 shadow-sm"
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-xs font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                  {name[0]}
                </span>
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{name}</span>
              </div>
            ))}
          </div>

          {/* Contained FAB */}
          <Fab.Root>
            <Fab.Overlay fixed={false}>
              {MENU_ITEMS.map((item) => (
                <Fab.MenuItem
                  key={item.id}
                  label={item.label}
                  icon={item.icon}
                  onClick={() => {}}
                />
              ))}
            </Fab.Overlay>
            <Fab.Trigger fixed={false} aria-label="Open CRM actions" />
          </Fab.Root>
        </div>
      </div>

      {/* Fixed FAB toggle */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6">
        <p className="mb-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">
          Fixed FAB (position: fixed, bottom-right of viewport)
        </p>
        <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          Click the button below to mount a truly fixed Fab. The FAB will appear
          fixed to the bottom-right corner of the page. Click it to open/close the
          menu. Clicking anywhere outside, or pressing{' '}
          <kbd className="font-mono text-xs bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-600">Esc</kbd>
          {' '}will close the menu.
        </p>
        <div className="flex gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setMounted((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 dark:bg-white px-4 py-2.5 text-sm font-medium text-white dark:text-neutral-900 shadow-sm hover:bg-neutral-700 dark:hover:bg-neutral-100 transition-colors"
          >
            {mounted ? 'Unmount fixed FAB' : 'Mount fixed FAB'}
          </button>
          {mounted && (
            <span className="inline-flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              FAB active: look bottom-right
            </span>
          )}
        </div>

        {mounted && (
          <Fab.Root>
            <Fab.Overlay fixed>
              {MENU_ITEMS.map((item) => (
                <Fab.MenuItem
                  key={item.id}
                  label={item.label}
                  icon={item.icon}
                  onClick={() => {}}
                />
              ))}
            </Fab.Overlay>
            <Fab.Trigger fixed aria-label="Open CRM actions" />
          </Fab.Root>
        )}
      </div>
    </section>
  )
}
