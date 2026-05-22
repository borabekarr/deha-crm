import * as React from 'react'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import type { DatePickerProps } from '@deha/ui-contracts'
import { cn } from '@/lib/utils'
import { Popover, PopoverTrigger, PopoverContent } from './popover'
import { Calendar } from './calendar'

// ---------------------------------------------------------------------------
// DatePicker — composes Popover + Calendar.
// Controlled via `value` (ISO YYYY-MM-DD string) or uncontrolled via
// `defaultValue`. Fires `onValueChange(isoString)` on selection.
// No useEffect anywhere.
// ---------------------------------------------------------------------------

const formatISO = (d: Date): string => d.toISOString().slice(0, 10)

const parseISO = (s: string): Date | undefined => {
  const d = new Date(s + 'T00:00:00')
  return isNaN(d.getTime()) ? undefined : d
}

const DatePicker = ({
  value,
  defaultValue,
  onValueChange,
  placeholder = 'Pick a date',
  disabled = false,
  reducedMotion,
  minDate,
  maxDate,
}: DatePickerProps) => {
  const [open, setOpen] = React.useState(false)
  const [internal, setInternal] = React.useState<Date | undefined>(
    defaultValue ? parseISO(defaultValue) : undefined,
  )

  // Controlled takes precedence; uncontrolled falls back to internal state.
  const currentDate: Date | undefined =
    value !== undefined ? (value ? parseISO(value) : undefined) : internal

  const setDate = (d: Date | undefined) => {
    if (value === undefined) setInternal(d)
    onValueChange?.(d ? formatISO(d) : '')
  }

  const handleSelect = (d: Date | undefined) => {
    setOpen(false)
    setDate(d)
  }

  return (
    <Popover open={open} onOpenChange={setOpen} reducedMotion={reducedMotion}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={cn(
            // Input-like appearance
            'flex h-10 w-full items-center justify-between',
            'rounded-xl border border-neutral-200 bg-white px-3 py-2',
            'text-sm text-left',
            'shadow-sm',
            // Placeholder vs value colour
            currentDate ? 'text-neutral-800' : 'text-neutral-400',
            // States
            'hover:border-neutral-300 hover:bg-neutral-50',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-colors duration-150',
          )}
        >
          <span className="truncate">
            {currentDate ? format(currentDate, 'PP') : placeholder}
          </span>
          <CalendarIcon className="ml-2 h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-0"
        align="start"
        sideOffset={8}
      >
        <Calendar
          selected={currentDate}
          onSelect={handleSelect}
          disabled={disabled}
          minDate={minDate}
          maxDate={maxDate}
          reducedMotion={reducedMotion}
        />
      </PopoverContent>
    </Popover>
  )
}

DatePicker.displayName = 'DatePicker'

export { DatePicker }
