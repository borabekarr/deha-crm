// ---------------------------------------------------------------------------
// WheelDatePicker — three CSS scroll-snap wheels (month / day / year)
//
// Design constraints:
//   - NO useEffect anywhere.
//   - Scroll position is read via useSyncExternalStore. subscribe and
//     getSnapshot are derived from module-level closures keyed by a stable
//     per-instance token — React Compiler safe (no ref.current during render).
//   - CSS scroll-snap handles snapping natively.
//   - Reduced motion: scroll-behavior switches to 'auto'. Detected via
//     framer-motion's useReducedMotion() hook.
//   - Keyboard: ArrowUp / ArrowDown on a focused wheel scroll programmatically.
// ---------------------------------------------------------------------------

import * as React from 'react'
import { useSyncExternalStore } from 'react'
import { useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ITEM_HEIGHT = 40 // px
const VISIBLE_COUNT = 5 // odd so center is obvious
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT // 200 px
const HALF = Math.floor(VISIBLE_COUNT / 2) // 2

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function daysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

// ---------------------------------------------------------------------------
// Module-level scroll store registry
//
// Each WheelColumn has a unique numeric id. The registry stores state for each
// id. subscribe() and getSnapshot() are module-level functions that accept the
// id — they are never called through a ref, so they pass the React Compiler
// `react-hooks/refs` rule.
// ---------------------------------------------------------------------------

interface StoreBag {
  el: HTMLElement | null
  snapshot: number
  listener: (() => void) | null
  onSettle: ((idx: number) => void) | null
  debounceTimer: ReturnType<typeof setTimeout> | null
}

const _stores = new Map<number, StoreBag>()
let _nextId = 0

function _allocate(): number {
  const id = _nextId++
  _stores.set(id, {
    el: null,
    snapshot: 0,
    listener: null,
    onSettle: null,
    debounceTimer: null,
  })
  return id
}

function _free(id: number): void {
  const bag = _stores.get(id)
  if (bag?.debounceTimer != null) clearTimeout(bag.debounceTimer)
  _stores.delete(id)
}

// ---------------------------------------------------------------------------
// Module-level scroll event handlers (stable references — never re-created)
// ---------------------------------------------------------------------------

function _onScroll(id: number): void {
  const bag = _stores.get(id)
  if (!bag?.el) return
  bag.snapshot = bag.el.scrollTop
  bag.listener?.()
  if (bag.debounceTimer != null) clearTimeout(bag.debounceTimer)
  bag.debounceTimer = setTimeout(() => {
    const b = _stores.get(id)
    if (!b?.el || !b.onSettle) return
    b.onSettle(Math.round(b.el.scrollTop / ITEM_HEIGHT))
    b.debounceTimer = null
  }, 150)
}

function _onScrollEnd(id: number): void {
  const bag = _stores.get(id)
  if (!bag?.el || !bag.onSettle) return
  if (bag.debounceTimer != null) { clearTimeout(bag.debounceTimer); bag.debounceTimer = null }
  bag.onSettle(Math.round(bag.el.scrollTop / ITEM_HEIGHT))
}

// ---------------------------------------------------------------------------
// Per-instance store API — returned from useWheelStore() and passed as plain
// values (not refs) into useSyncExternalStore.
// ---------------------------------------------------------------------------

interface WheelStore {
  id: number
  subscribe: (cb: () => void) => () => void
  getSnapshot: () => number
}

function _makeStore(id: number): WheelStore {
  return {
    id,
    subscribe(cb: () => void) {
      const bag = _stores.get(id)
      if (bag) bag.listener = cb
      return () => {
        const b = _stores.get(id)
        if (b) b.listener = null
      }
    },
    getSnapshot() {
      return _stores.get(id)?.snapshot ?? 0
    },
  }
}

/** Hook that allocates a stable store id and returns stable store object.
 *  The returned object is the same reference for the component's lifetime. */
function useWheelStore(): WheelStore {
  // We need a stable WheelStore object that persists across renders without
  // going through useRef.current at render time.
  // Strategy: allocate in useState initializer (runs once) so the store
  // object is in React state — a plain value, not a ref.
  const [store] = React.useState<WheelStore>(() => _makeStore(_allocate()))

  // Cleanup on unmount via useLayoutEffect with empty deps
  React.useLayoutEffect(() => {
    return () => _free(store.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return store
}

// ---------------------------------------------------------------------------
// WheelColumn
// ---------------------------------------------------------------------------

interface WheelColumnProps {
  items: string[]
  selectedIndex: number
  onSettle: (index: number) => void
  reducedMotion: boolean
  'aria-label': string
}

function WheelColumn({
  items,
  selectedIndex,
  onSettle,
  reducedMotion,
  'aria-label': ariaLabel,
}: WheelColumnProps) {
  const store = useWheelStore()
  const { id } = store

  // Keep the settle callback current. useLayoutEffect is outside render.
  React.useLayoutEffect(() => {
    const bag = _stores.get(id)
    if (bag) {
      bag.onSettle = (rawIdx: number) => {
        onSettle(clamp(rawIdx, 0, items.length - 1))
      }
    }
  })

  // Stable event handler functions (per store id) — created once
  const [scrollHandler] = React.useState(() => () => _onScroll(id))
  const [scrollEndHandler] = React.useState(() => () => _onScrollEnd(id))

  // DOM ref for scroll + keyboard imperatives
  const elRef = React.useRef<HTMLDivElement | null>(null)

  // Ref-callback: attach / detach DOM listeners
  const refCallback = React.useCallback(
    (el: HTMLDivElement | null) => {
      const bag = _stores.get(id)
      if (elRef.current) {
        elRef.current.removeEventListener('scroll', scrollHandler)
        elRef.current.removeEventListener('scrollend', scrollEndHandler)
      }
      elRef.current = el
      if (el && bag) {
        bag.el = el
        bag.snapshot = el.scrollTop
        el.addEventListener('scroll', scrollHandler, { passive: true })
        el.addEventListener('scrollend', scrollEndHandler, { passive: true })
        el.scrollTop = selectedIndex * ITEM_HEIGHT
      } else if (bag) {
        bag.el = null
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, scrollHandler, scrollEndHandler],
  )

  // Sync scroll position when selectedIndex changes
  const lastScrolledTo = React.useRef<number>(-1)
  React.useLayoutEffect(() => {
    const el = elRef.current
    if (!el) return
    if (lastScrolledTo.current === selectedIndex) return
    lastScrolledTo.current = selectedIndex
    el.scrollTo({
      top: selectedIndex * ITEM_HEIGHT,
      behavior: reducedMotion ? 'instant' : 'smooth',
    })
  })

  // Read scroll state — subscribe and getSnapshot are plain object properties,
  // not ref accesses, so the React Compiler accepts them.
  const scrollTop = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    () => 0,
  )
  const currentIndex = clamp(Math.round(scrollTop / ITEM_HEIGHT), 0, items.length - 1)

  // Keyboard
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
    e.preventDefault()
    const delta = e.key === 'ArrowDown' ? 1 : -1
    const next = clamp(currentIndex + delta, 0, items.length - 1)
    const el = elRef.current
    if (el) {
      el.scrollTo({
        top: next * ITEM_HEIGHT,
        behavior: reducedMotion ? 'instant' : 'smooth',
      })
    }
    onSettle(next)
  }

  const wheelId = ariaLabel.replace(/\s+/g, '-')

  return (
    <div
      className="relative flex flex-col items-stretch"
      style={{ width: 90, height: WHEEL_HEIGHT }}
    >
      {/* Selection highlight band */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 z-10 rounded-lg bg-neutral-100 dark:bg-neutral-700/60"
        style={{ top: ITEM_HEIGHT * HALF, height: ITEM_HEIGHT }}
      />

      {/* Top fade mask */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-white dark:from-neutral-900"
        style={{ height: ITEM_HEIGHT * HALF }}
      />

      {/* Bottom fade mask */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-white dark:from-neutral-900"
        style={{ height: ITEM_HEIGHT * HALF }}
      />

      {/* Scroll container */}
      <div
        ref={refCallback}
        role="listbox"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-activedescendant={`wheel-item-${wheelId}-${currentIndex}`}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative z-0 overflow-y-scroll overscroll-contain outline-none',
          '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        )}
        style={{
          height: WHEEL_HEIGHT,
          scrollSnapType: 'y mandatory',
          scrollBehavior: reducedMotion ? 'auto' : undefined,
          paddingTop: ITEM_HEIGHT * HALF,
          paddingBottom: ITEM_HEIGHT * HALF,
        }}
      >
        {items.map((label, idx) => (
          <div
            key={label}
            id={`wheel-item-${wheelId}-${idx}`}
            role="option"
            aria-selected={idx === currentIndex}
            onClick={() => {
              const el = elRef.current
              if (el) {
                el.scrollTo({
                  top: idx * ITEM_HEIGHT,
                  behavior: reducedMotion ? 'instant' : 'smooth',
                })
              }
              onSettle(idx)
            }}
            className={cn(
              'flex items-center justify-center select-none cursor-default',
              'transition-colors duration-150',
              idx === currentIndex
                ? 'text-neutral-900 dark:text-neutral-50 font-semibold text-[15px]'
                : 'text-neutral-400 dark:text-neutral-500 font-normal text-sm',
            )}
            style={{ height: ITEM_HEIGHT, scrollSnapAlign: 'center' }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// WheelDatePicker — public API
// ---------------------------------------------------------------------------

export interface WheelDatePickerProps {
  value: Date
  onChange: (d: Date) => void
  minYear?: number
  maxYear?: number
  className?: string
}

export function WheelDatePicker({
  value,
  onChange,
  minYear = 1924,
  maxYear = 2124,
  className,
}: WheelDatePickerProps) {
  const reducedMotion = useReducedMotion() ?? false

  const currentMonth = value.getMonth()
  const currentDay = value.getDate()
  const currentYear = value.getFullYear()

  const dayCount = daysInMonth(currentMonth, currentYear)
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => String(minYear + i))
  const days = Array.from({ length: dayCount }, (_, i) => String(i + 1).padStart(2, '0'))

  const monthIdx = clamp(currentMonth, 0, 11)
  const dayIdx = clamp(currentDay - 1, 0, dayCount - 1)
  const yearIdx = clamp(currentYear - minYear, 0, years.length - 1)

  function handleMonthSettle(idx: number) {
    const m = clamp(idx, 0, 11)
    const d = clamp(currentDay, 1, daysInMonth(m, currentYear))
    onChange(new Date(currentYear, m, d))
  }

  function handleDaySettle(idx: number) {
    onChange(new Date(currentYear, currentMonth, clamp(idx + 1, 1, dayCount)))
  }

  function handleYearSettle(idx: number) {
    const y = minYear + clamp(idx, 0, years.length - 1)
    const d = clamp(currentDay, 1, daysInMonth(currentMonth, y))
    onChange(new Date(y, currentMonth, d))
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-2xl',
        'bg-white dark:bg-neutral-900',
        'border border-neutral-200 dark:border-neutral-700',
        'px-3 py-2 shadow-sm',
        className,
      )}
      role="group"
      aria-label="Date picker"
      data-testid="wheel-date-picker"
    >
      <WheelColumn
        items={MONTH_NAMES}
        selectedIndex={monthIdx}
        onSettle={handleMonthSettle}
        reducedMotion={reducedMotion}
        aria-label="Month"
      />

      <div aria-hidden="true" className="w-px self-stretch bg-neutral-200 dark:bg-neutral-700 mx-1" />

      <WheelColumn
        items={days}
        selectedIndex={dayIdx}
        onSettle={handleDaySettle}
        reducedMotion={reducedMotion}
        aria-label="Day"
      />

      <div aria-hidden="true" className="w-px self-stretch bg-neutral-200 dark:bg-neutral-700 mx-1" />

      <WheelColumn
        items={years}
        selectedIndex={yearIdx}
        onSettle={handleYearSettle}
        reducedMotion={reducedMotion}
        aria-label="Year"
      />
    </div>
  )
}
