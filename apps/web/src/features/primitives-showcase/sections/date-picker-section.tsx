import { useState } from 'react'
import { DatePicker } from '@/components/ui/date-picker'

export function DatePickerSection() {
  const [date1, setDate1] = useState<string>('')
  const [date2, setDate2] = useState<string>('2026-05-22')

  return (
    <section id="date-picker" className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Date Picker</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Calendar popover attached to an input-like trigger for date selection.
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 space-y-4">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Empty (no selection)</p>
        <DatePicker
          placeholder="Pick a start date"
          value={date1}
          onValueChange={setDate1}
        />
        {date1 && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Selected: <span className="font-semibold text-emerald-600">{date1}</span>
          </p>
        )}
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 space-y-4">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Pre-selected date</p>
        <DatePicker
          placeholder="Pick a date"
          value={date2}
          onValueChange={setDate2}
        />
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 space-y-4">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Uncontrolled with defaultValue</p>
        <DatePicker
          placeholder="Pick a date"
          defaultValue="2026-01-15"
          onValueChange={(v) => console.log('uncontrolled picked:', v)}
        />
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 space-y-4">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Disabled</p>
        <DatePicker
          placeholder="Not available"
          disabled
        />
      </div>
    </section>
  )
}
