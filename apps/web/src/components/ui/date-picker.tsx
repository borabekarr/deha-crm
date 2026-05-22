import * as React from 'react'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import type { DatePickerProps } from '@deha/ui-contracts'
import { cn } from '@/lib/utils'
import { Popover, PopoverTrigger, PopoverContent } from './popover'
import { Calendar } from './calendar'

// ---------------------------------------------------------------------------
// DatePicker — composes Popover + Calendar.
// Trigger is an input-like button; selecting a date closes the popover.
// No useEffect anywhere.
// ---------------------------------------------------------------------------

export interface DatePickerComponentProps extends DatePickerProps {
  /** Controlled selected date as Date object. If omitted, parses `value`. */
  selected?: Date
  /** Called with the new Date on selection. */
  onChange?: (date: Date | undefined) => void
}

const DatePicker = ({
  value,
  selected: selectedProp,
  onChange,
  placeholder = 'Pick a date',
  disabled = false,
  reducedMotion,
  minDate,
  maxDate,
}: DatePickerComponentProps) => {
  const [open, setOpen] = React.useState(false)

  // Derive selected Date: prefer explicit `selected` prop; fall back to `value` string.
  const selectedDate: Date | undefined = React.useMemo(() => {
    if (selectedProp instanceof Date) return selectedProp
    if (value) {
      const parsed = new Date(value)
      return isNaN(parsed.getTime()) ? undefined : parsed
    }
    return undefined
  }, [selectedProp, value])

  const handleSelect = (date: Date | undefined) => {
    setOpen(false)
    onChange?.(date)
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
            'rounded-xl border border-slate-200 bg-white px-3 py-2',
            'text-sm text-left',
            'shadow-sm',
            // Placeholder vs value colour
            selectedDate ? 'text-slate-800' : 'text-slate-400',
            // States
            'hover:border-slate-300 hover:bg-slate-50',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-colors duration-150',
          )}
        >
          <span className="truncate">
            {selectedDate ? format(selectedDate, 'PP') : placeholder}
          </span>
          <CalendarIcon className="ml-2 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-0"
        align="start"
        sideOffset={8}
      >
        <Calendar
          selected={selectedDate}
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
