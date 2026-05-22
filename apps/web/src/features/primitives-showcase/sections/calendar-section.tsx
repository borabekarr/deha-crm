import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'

export function CalendarSection() {
  const [date1, setDate1] = useState<Date | undefined>()
  const [date2, setDate2] = useState<Date | undefined>(new Date())

  return (
    <section id="calendar" className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Calendar</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Inline date picker built on react-day-picker with emerald accent selection.
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 space-y-4">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Uncontrolled (no selection)</p>
        <div className="inline-block">
          <Calendar
            selected={date1}
            onSelect={setDate1}
          />
        </div>
        {date1 && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Selected: <span className="font-semibold text-emerald-600">{date1.toLocaleDateString()}</span>
          </p>
        )}
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 space-y-4">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Pre-selected today</p>
        <div className="inline-block">
          <Calendar
            selected={date2}
            onSelect={setDate2}
          />
        </div>
      </div>
    </section>
  )
}
