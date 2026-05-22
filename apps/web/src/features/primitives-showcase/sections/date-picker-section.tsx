import { useState } from 'react'
import { DatePicker } from '@/components/ui/date-picker'

export function DatePickerSection() {
  const [date1, setDate1] = useState<Date | undefined>()
  const [date2, setDate2] = useState<Date | undefined>(new Date())

  return (
    <section id="date-picker" className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Date Picker</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Calendar popover attached to an input-like trigger for date selection.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Empty (no selection)</p>
        <DatePicker
          placeholder="Pick a start date"
          selected={date1}
          onChange={setDate1}
        />
        {date1 && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Selected: <span className="font-semibold text-emerald-600">{date1.toLocaleDateString()}</span>
          </p>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pre-selected date</p>
        <DatePicker
          placeholder="Pick a date"
          selected={date2}
          onChange={setDate2}
        />
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Disabled</p>
        <DatePicker
          placeholder="Not available"
          disabled
        />
      </div>
    </section>
  )
}
