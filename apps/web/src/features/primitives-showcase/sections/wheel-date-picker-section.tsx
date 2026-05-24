import { useState } from 'react'
import { WheelDatePicker } from '@/components/ui/wheel-date-picker'

export function WheelDatePickerSection() {
  const [date1, setDate1] = useState<Date>(() => new Date(2026, 4, 23)) // 2026-05-23
  const [date2, setDate2] = useState<Date>(() => new Date(1990, 0, 1))  // 1990-01-01

  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <section id="wheel-date-picker" className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Wheel Date Picker
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          iOS-style scroll-snap wheels for month, day, and year selection.
          No JS animation — pure CSS scroll-snap. Keyboard and reduced-motion
          aware.
        </p>
        <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
          Ported from rit3zh/expo-ios-like-date-picker.
        </p>
      </div>

      {/* Variant 1 — current date */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 space-y-4">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
          Default (today)
        </p>
        <div className="flex flex-col items-start gap-4">
          <WheelDatePicker value={date1} onChange={setDate1} />
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Selected:{' '}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {fmt(date1)}
            </span>
          </p>
        </div>
      </div>

      {/* Variant 2 — historical date */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 space-y-4">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
          Historical date (1990 — 2050 range)
        </p>
        <div className="flex flex-col items-start gap-4">
          <WheelDatePicker
            value={date2}
            onChange={setDate2}
            minYear={1990}
            maxYear={2050}
          />
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Selected:{' '}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {fmt(date2)}
            </span>
          </p>
        </div>
      </div>

      <p className="text-xs text-neutral-400 dark:text-neutral-500">
        Tip: use{' '}
        <kbd className="rounded bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 font-mono text-[11px]">
          ↑
        </kbd>{' '}
        /{' '}
        <kbd className="rounded bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 font-mono text-[11px]">
          ↓
        </kbd>{' '}
        on a focused wheel. Honors{' '}
        <code className="text-[11px] font-mono">prefers-reduced-motion</code>{' '}
        (instant snaps).
      </p>
    </section>
  )
}
