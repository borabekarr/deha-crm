import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { AnimatePresence, m, useReducedMotion } from 'framer-motion'
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
import { windowMorph } from '@deha/motion-tokens'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxPropsExtended extends Omit<ComboboxProps, 'children'> {
  options: ComboboxOption[]
  placeholder?: string
  emptyText?: string
  creatable?: boolean
  onCreate?: (query: string) => void
  className?: string
  'aria-label'?: string
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
  value,
  defaultValue,
  onValueChange,
  onInputChange,
  open,
  onOpenChange,
  placeholder = 'Select…',
  emptyText = 'No results.',
  creatable = false,
  onCreate,
  reducedMotion: _reducedMotion, // eslint-disable-line @typescript-eslint/no-unused-vars
  className,
  'aria-label': ariaLabel,
}: ComboboxPropsExtended) => {
  const listboxId = React.useId()

  // Controlled / uncontrolled open state
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isOpen = open ?? internalOpen
  const setOpen = (next: boolean) => {
    if (open === undefined) setInternalOpen(next)
    onOpenChange?.(next)
  }

  // Controlled / uncontrolled value state
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? '')
  const currentValue = value ?? internalValue
  const setValue = (next: string) => {
    if (value === undefined) setInternalValue(next)
    onValueChange?.(next)
  }

  const [query, setQuery] = React.useState('')

  const reducedMotion = useReducedMotion() ?? false
  const morphConfig = windowMorph({ reducedMotion })
  const transition = {
    type: 'tween' as const,
    duration: morphConfig.duration / 1000,
    ease: morphConfig.ease as [number, number, number, number],
  }

  const handleQueryChange = (q: string) => {
    setQuery(q)
    onInputChange?.(q)
  }

  const handleSelect = (val: string) => {
    const next = val === currentValue ? '' : val
    setValue(next)
    setOpen(false)
    setQuery('')
    onInputChange?.('')
  }

  const selectedLabel = options.find((o) => o.value === currentValue)?.label

  // Determine if the current query matches any option exactly
  const hasExactMatch = options.some(
    (o) => o.label.toLowerCase() === query.toLowerCase(),
  )

  const showCreateOption = creatable && query.length > 0 && !hasExactMatch

  return (
    <PopoverPrimitive.Root open={isOpen} onOpenChange={setOpen}>
      {/* Trigger */}
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          role="combobox"
          aria-label={ariaLabel}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          className={cn(
            // layout
            'flex h-10 w-full items-center justify-between',
            'rounded-[14px] px-3.5 py-2',
            // surface — white bg, inner shadow matching prototype combo trigger
            'bg-white border border-neutral-200',
            'shadow-[inset_0_1px_3px_rgb(15_23_42_/_0.06)]',
            // text
            'text-sm font-medium text-left',
            currentValue ? 'text-neutral-900' : 'text-neutral-400',
            // focus ring — emerald
            'outline-none focus-visible:border-emerald-500',
            'focus-visible:ring-[3px] focus-visible:ring-emerald-500/15',
            // open state — emerald border
            isOpen && 'border-emerald-500 ring-[3px] ring-emerald-500/15',
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
              'ml-2 size-4 shrink-0 text-neutral-500',
              'transition-transform duration-[var(--duration-fast,120ms)]',
              isOpen && 'rotate-180',
            )}
          />
        </button>
      </PopoverPrimitive.Trigger>

      {/* Floating panel */}
      <PopoverPrimitive.Portal>
        <AnimatePresence>
          {isOpen && (
          <PopoverPrimitive.Content
            forceMount
            sideOffset={6}
            align="start"
            // Match trigger width
            style={{ width: 'var(--radix-popover-trigger-width)' }}
            className={cn(
              // shape
              'z-50 rounded-[12px] p-0',
              // surface — prototype .combo-list
              'bg-white border border-neutral-200',
              'shadow-[0_8px_32px_-4px_rgb(15_23_42_/_0.18),0_2px_8px_-2px_rgb(15_23_42_/_0.08)]',
              'focus:outline-none',
            )}
          >
            <m.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={transition}
              style={{ transformOrigin: 'var(--radix-popover-content-transform-origin)' }}
            >
          <Command
            // Disable cmdk's built-in filtering — Radix + cmdk do the filtering via shouldFilter
            className="flex flex-col overflow-hidden rounded-[12px]"
          >
            {/* Search input */}
            <div className="flex items-center border-b border-neutral-100 px-3">
              <CommandInput
                value={query}
                onValueChange={handleQueryChange}
                placeholder={placeholder}
                className={cn(
                  // reset cmdk default styles
                  'h-10 flex-1 bg-transparent py-3',
                  'text-sm font-medium text-neutral-900 placeholder:text-neutral-400',
                  'outline-none border-0 focus:ring-0',
                )}
              />
            </div>

            {/* List */}
            <CommandList id={listboxId} className="max-h-56 overflow-y-auto p-1">
              <CommandEmpty className="py-3 text-center text-sm text-neutral-400">
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
                      'text-sm font-medium text-neutral-700',
                      // hover / focus — cmdk uses data-[selected] for keyboard highlight
                      'data-[selected=true]:bg-neutral-100 data-[selected=true]:text-neutral-900',
                      'hover:bg-neutral-50 hover:text-neutral-900',
                      'focus:outline-none',
                      // selected (chosen) state — emerald
                      currentValue === option.value && 'text-emerald-600 font-semibold',
                      // transition
                      'transition-colors duration-[var(--duration-fast,120ms)]',
                    )}
                  >
                    {option.label}
                    {currentValue === option.value && (
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
                      onInputChange?.('')
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
            </m.div>
          </PopoverPrimitive.Content>
          )}
        </AnimatePresence>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

Combobox.displayName = 'Combobox'

export { Combobox }
export type { ComboboxOption, ComboboxPropsExtended as ComboboxComponentProps }
