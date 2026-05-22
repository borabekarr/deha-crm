import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SegmentedPillsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Ordered list of option labels */
  options: string[]
  /** Currently selected option (controlled — state lives in consumer) */
  value: string
  /** Called with the newly selected option when the user clicks */
  onChange: (value: string) => void
}

/**
 * SegmentedPills — recessed pill-group with emerald active state.
 *
 * Controlled: the component owns zero state. Pass `value` + `onChange` from the consumer.
 *
 * Track:   slate-100 bg + inset shadow (shadow-recessed).
 * Active:  emerald-500 fill + white text.
 * Inactive: transparent fill + slate-500 text.
 */
export function SegmentedPills({ options, value, onChange, className, ref, ...rest }: SegmentedPillsProps & { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <fieldset
      ref={ref as unknown as React.Ref<HTMLFieldSetElement>}
      className={cn(
        'm-0 min-w-0 border-0 p-[3px]',
        'inline-flex items-center rounded-full bg-slate-100',
        '[box-shadow:var(--shadow-recessed,inset_0_2px_4px_rgba(0,0,0,0.06))]',
        className,
      )}
      {...(rest as unknown as React.FieldsetHTMLAttributes<HTMLFieldSetElement>)}
    >
      {options.map((opt) => {
        const active = opt === value
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt)}
            className={cn(
              'rounded-full px-[14px] py-[6px] text-xs font-semibold transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50',
              active
                ? 'bg-emerald-500 text-white font-extrabold shadow-sm'
                : 'bg-transparent text-slate-500 hover:text-slate-700',
            )}
          >
            {opt}
          </button>
        )
      })}
    </fieldset>
  )
}
