import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from 'cmdk'
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react'
import type { ComboboxProps } from '@deha/ui-contracts'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxPropsExtended
  extends Omit<ComboboxProps, 'children' | 'onInputChange' | 'open' | 'onOpenChange'> {
  options: ComboboxOption[]
  value?: string
  onValueChange?: (v: string) => void
  placeholder?: string
  emptyText?: string
  creatable?: boolean
  onCreate?: (query: string) => void
  reducedMotion?: 'auto' | 'reduce' | 'no-preference'
  className?: string
}

// ---------------------------------------------------------------------------
// Combobox — Radix Popover + cmdk Command for a searchable list-select
// ---------------------------------------------------------------------------
// Keyboard behaviour (all free from the primitives):
//   ArrowUp/Down — move highlight (cmdk)
//   Enter        — select highlighted item or fire onCreate (cmdk + our handler)
//   Escape       — close popover (Radix Popover)
// ---------------------------------------------------------------------------
const Combobox = ({
  options,
  value: controlledValue,
  onValueChange,
  placeholder = 'Select…',
  emptyText = 'No results.',
  creatable = false,
  onCreate,
  reducedMotion: _reducedMotion, // eslint-disable-line @typescript-eslint/no-unused-vars
  className,
}: ComboboxPropsExtended) => {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [internalValue, setInternalValue] = React.useState(controlledValue ?? '')

  // Resolve whether controlled or uncontrolled
  const selected = controlledValue !== undefined ? controlledValue : internalValue

  const handleSelect = (val: string) => {
    const next = val === selected ? '' : val
    if (controlledValue === undefined) {
      setInternalValue(next)
    }
    onValueChange?.(next)
    setOpen(false)
    setQuery('')
  }

  const selectedLabel = options.find((o) => o.value === selected)?.label

  // Determine if the current query matches any option exactly
  const hasExactMatch = options.some(
    (o) => o.label.toLowerCase() === query.toLowerCase(),
  )

  const showCreateOption = creatable && query.length > 0 && !hasExactMatch

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      {/* Trigger */}
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          className={cn(
            // layout
            'flex h-10 w-full items-center justify-between',
            'rounded-[14px] px-3.5 py-2',
            // surface — white bg, inner shadow matching prototype combo trigger
            'bg-white border border-slate-200',
            'shadow-[inset_0_1px_3px_rgb(15_23_42_/_0.06)]',
            // text
            'text-sm font-medium text-left',
            selected ? 'text-slate-900' : 'text-slate-400',
            // focus ring — emerald
            'outline-none focus-visible:border-emerald-500',
            'focus-visible:ring-[3px] focus-visible:ring-emerald-500/15',
            // open state — emerald border
            open && 'border-emerald-500 ring-[3px] ring-emerald-500/15',
            // transition
            'transition-[border-color,box-shadow] duration-[var(--duration-fast,120ms)]',
            className,
          )}
        >
          <span className="flex-1 truncate">
            {selectedLabel ?? placeholder}
          </span>
          <ChevronsUpDownIcon
            className={cn(
              'ml-2 size-4 shrink-0 text-slate-500',
              'transition-transform duration-[var(--duration-fast,120ms)]',
              open && 'rotate-180',
            )}
          />
        </button>
      </PopoverPrimitive.Trigger>

      {/* Floating panel */}
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          sideOffset={6}
          align="start"
          // Match trigger width
          style={{ width: 'var(--radix-popover-trigger-width)' }}
          className={cn(
            // shape
            'z-50 rounded-[12px] p-0',
            // surface — prototype .combo-list
            'bg-white border border-slate-200',
            'shadow-[0_8px_32px_-4px_rgb(15_23_42_/_0.18),0_2px_8px_-2px_rgb(15_23_42_/_0.08)]',
            // animation
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
            'focus:outline-none',
          )}
        >
          <Command
            // Disable cmdk's built-in filtering — Radix + cmdk do the filtering via shouldFilter
            className="flex flex-col overflow-hidden rounded-[12px]"
          >
            {/* Search input */}
            <div className="flex items-center border-b border-slate-100 px-3">
              <CommandInput
                value={query}
                onValueChange={setQuery}
                placeholder={placeholder}
                className={cn(
                  // reset cmdk default styles
                  'h-10 flex-1 bg-transparent py-3',
                  'text-sm font-medium text-slate-900 placeholder:text-slate-400',
                  'outline-none border-0 focus:ring-0',
                )}
              />
            </div>

            {/* List */}
            <CommandList className="max-h-56 overflow-y-auto p-1">
              <CommandEmpty className="py-3 text-center text-sm text-slate-400">
                {emptyText}
              </CommandEmpty>

              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => handleSelect(option.value)}
                    className={cn(
                      // layout
                      'relative flex w-full cursor-pointer select-none items-center',
                      'rounded-[8px] py-2 pl-3 pr-8',
                      // text
                      'text-sm font-medium text-slate-700',
                      // hover / focus — cmdk uses data-[selected] for keyboard highlight
                      'data-[selected=true]:bg-slate-100 data-[selected=true]:text-slate-900',
                      'hover:bg-slate-50 hover:text-slate-900',
                      'focus:outline-none',
                      // selected (chosen) state — emerald
                      selected === option.value && 'text-emerald-600 font-semibold',
                      // transition
                      'transition-colors duration-[var(--duration-fast,120ms)]',
                    )}
                  >
                    {option.label}
                    {selected === option.value && (
                      <span className="absolute right-2.5 flex items-center">
                        <CheckIcon className="size-4 text-emerald-500" strokeWidth={2.5} />
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>

              {/* Creatable option — shown when query has no exact match */}
              {showCreateOption && (
                <CommandGroup>
                  <CommandItem
                    value={`__create__${query}`}
                    onSelect={() => {
                      onCreate?.(query)
                      setOpen(false)
                      setQuery('')
                    }}
                    className={cn(
                      'relative flex w-full cursor-pointer select-none items-center gap-2',
                      'rounded-[8px] py-2 pl-3 pr-8',
                      'text-sm font-medium text-emerald-600',
                      'data-[selected=true]:bg-emerald-50',
                      'hover:bg-emerald-50',
                      'focus:outline-none',
                      'transition-colors duration-[var(--duration-fast,120ms)]',
                    )}
                  >
                    <span className="text-xs font-700 uppercase tracking-wide text-emerald-500">
                      Create
                    </span>
                    <span className="truncate">&ldquo;{query}&rdquo;</span>
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

Combobox.displayName = 'Combobox'

export { Combobox }
export type { ComboboxOption, ComboboxPropsExtended as ComboboxComponentProps }
