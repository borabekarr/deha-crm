import * as React from 'react'
import { DayPicker } from 'react-day-picker'
import type { Matcher } from 'react-day-picker'
import 'react-day-picker/style.css'
import type { CalendarProps } from '@deha/ui-contracts'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Calendar — single-select wrapper around react-day-picker v10 DayPicker.
// Styled to match the prototype: white cells, minimal header, emerald accent.
// classNames keys align with the v10 UI enum.
// ---------------------------------------------------------------------------

export interface CalendarComponentProps
  extends Omit<CalendarProps, 'value' | 'defaultValue' | 'onValueChange' | 'mode'> {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  /** Fine-grained classNames override forwarded to DayPicker. */
  classNames?: React.ComponentProps<typeof DayPicker>['classNames']
  className?: string
}

const Calendar = ({
  reducedMotion: _reducedMotion, // eslint-disable-line @typescript-eslint/no-unused-vars
  selected,
  onSelect,
  classNames,
  className,
  disabled,
  minDate,
  maxDate,
  ...props
}: CalendarComponentProps) => {
  const fromDate = minDate ? new Date(minDate) : undefined
  const toDate = maxDate ? new Date(maxDate) : undefined

  const disabledMatchers: Matcher[] = []
  if (disabled === true) disabledMatchers.push({ before: new Date(8640000000000000) })
  if (minDate) disabledMatchers.push({ before: new Date(minDate + 'T00:00:00') })
  if (maxDate) disabledMatchers.push({ after: new Date(maxDate + 'T00:00:00') })

  return (
    <DayPicker
      mode="single"
      selected={selected}
      onSelect={onSelect}
      disabled={disabledMatchers.length > 0 ? disabledMatchers : undefined}
      startMonth={fromDate}
      endMonth={toDate}
      showOutsideDays
      className={cn('p-3', className)}
      classNames={{
        // Root layout
        root: 'rdp-root',
        months: 'flex flex-col space-y-4',
        month: 'space-y-4',
        // Caption / navigation (v10 key names)
        month_caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-semibold text-slate-800',
        nav: 'flex items-center gap-1',
        button_previous: cn(
          'absolute left-1 inline-flex items-center justify-center rounded-lg',
          'h-7 w-7 bg-transparent text-slate-500',
          'hover:bg-slate-100 hover:text-slate-800',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
          'transition-colors duration-150',
          'disabled:pointer-events-none disabled:opacity-40',
        ),
        button_next: cn(
          'absolute right-1 inline-flex items-center justify-center rounded-lg',
          'h-7 w-7 bg-transparent text-slate-500',
          'hover:bg-slate-100 hover:text-slate-800',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
          'transition-colors duration-150',
          'disabled:pointer-events-none disabled:opacity-40',
        ),
        // Grid
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex',
        weekday: 'text-slate-400 rounded-md w-9 font-normal text-[0.8rem] text-center',
        weeks: '',
        week: 'flex w-full mt-2',
        // Day cells (v10: day = td, day_button = button inside td)
        day: cn(
          'h-9 w-9 text-center text-sm p-0 relative',
          'focus-within:relative focus-within:z-20',
        ),
        day_button: cn(
          'h-9 w-9 p-0 font-normal rounded-lg',
          'inline-flex items-center justify-center',
          'text-slate-700',
          'hover:bg-slate-100 hover:text-slate-900',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
          'transition-colors duration-150',
        ),
        // Selection & modifier states
        selected: cn(
          '[&>button]:bg-emerald-500 [&>button]:text-white [&>button]:font-semibold',
          '[&>button]:hover:bg-emerald-600 [&>button]:hover:text-white',
        ),
        today: '[&>button]:bg-slate-100 [&>button]:text-slate-900 [&>button]:font-semibold',
        outside: '[&>button]:text-slate-300 [&>button]:opacity-50',
        disabled: '[&>button]:text-slate-300 [&>button]:opacity-40 [&>button]:cursor-not-allowed',
        range_middle: '[&>button]:rounded-none',
        hidden: 'invisible',
        chevron: 'h-4 w-4',
        // Spread caller-supplied classNames last so they win
        ...classNames,
      }}
      {...props}
    />
  )
}

Calendar.displayName = 'Calendar'

export { Calendar }
