import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import type { SelectProps } from '@deha/ui-contracts'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Root — strips reducedMotion before forwarding to Radix Root
// ---------------------------------------------------------------------------
const Select = ({
  reducedMotion: _reducedMotion, // eslint-disable-line @typescript-eslint/no-unused-vars
  ...props
}: SelectProps & React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root>) => (
  <SelectPrimitive.Root {...props} />
)
Select.displayName = 'Select'

// ---------------------------------------------------------------------------
// Group — logical grouping of items
// ---------------------------------------------------------------------------
const SelectGroup = SelectPrimitive.Group
SelectGroup.displayName = 'SelectGroup'

// ---------------------------------------------------------------------------
// Value — renders the selected item label inside the trigger
// ---------------------------------------------------------------------------
const SelectValue = SelectPrimitive.Value
SelectValue.displayName = 'SelectValue'

// ---------------------------------------------------------------------------
// Trigger — button that opens the dropdown
// Prototype: full-width, rounded-[14px], white bg, neutral-200 border,
// inner shadow, emerald focus ring. Chevron rotates on open.
// ---------------------------------------------------------------------------
function SelectTrigger({ ref, className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        // base shape
        'flex h-10 w-full items-center justify-between',
        'rounded-[14px] px-3.5 py-2',
        // surface — white bg, inner shadow matching prototype .select
        'bg-white border border-neutral-200',
        'shadow-[inset_0_1px_3px_rgb(15_23_42_/_0.06)]',
        // text
        'text-sm font-medium text-neutral-900 text-left',
        // focus ring — emerald
        'outline-none focus-visible:border-emerald-500',
        'focus-visible:ring-[3px] focus-visible:ring-emerald-500/15',
        // disabled
        'disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400',
        // transition
        'transition-[border-color,box-shadow] duration-[var(--duration-fast,120ms)]',
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="ml-2 size-4 shrink-0 text-neutral-500 transition-transform duration-[var(--duration-fast,120ms)] group-data-[state=open]:rotate-180" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}
SelectTrigger.displayName = 'SelectTrigger'

// ---------------------------------------------------------------------------
// Content — the floating dropdown panel
// Prototype: white bg, rounded-[12px], neutral-200 border, strong overlay shadow,
// inset top highlight, max-h 14rem, overflow scroll.
// ---------------------------------------------------------------------------
function SelectContent({ ref, className, children, position = 'popper', ...props }: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        position={position}
        sideOffset={6}
        className={cn(
          // shape
          'z-50 min-w-[var(--radix-select-trigger-width)] rounded-[12px]',
          // surface
          'bg-white border border-neutral-200',
          'shadow-[0_8px_32px_-4px_rgb(15_23_42_/_0.18),0_2px_8px_-2px_rgb(15_23_42_/_0.08),inset_0_1px_0_rgb(255_255_255_/_0.5)]',
          // scroll
          'max-h-56 overflow-hidden',
          // animation
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
          'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          className,
        )}
        {...props}
      >
        <SelectPrimitive.ScrollUpButton className="flex items-center justify-center py-1 text-neutral-500">
          <ChevronUpIcon className="size-4" />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport
          className={cn(
            'p-1',
            position === 'popper' &&
              'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]',
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="flex items-center justify-center py-1 text-neutral-500">
          <ChevronDownIcon className="size-4" />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}
SelectContent.displayName = 'SelectContent'

// ---------------------------------------------------------------------------
// Label — group heading inside the dropdown
// ---------------------------------------------------------------------------
function SelectLabel({ ref, className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      ref={ref}
      className={cn(
        'px-3 py-1.5 text-xs font-700 text-neutral-400 uppercase tracking-[0.08em]',
        className,
      )}
      {...props}
    />
  )
}
SelectLabel.displayName = 'SelectLabel'

// ---------------------------------------------------------------------------
// Item — single option row
// Prototype: py-2 px-3, text-14 font-500 neutral-700, hover neutral-50 neutral-900,
// selected: emerald-600 font-600, check icon on the right.
// ---------------------------------------------------------------------------
function SelectItem({ ref, className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        // layout
        'relative flex w-full cursor-pointer select-none items-center',
        'rounded-[8px] py-2 pl-3 pr-8',
        // text
        'text-sm font-medium text-neutral-700',
        // hover / focus
        'hover:bg-neutral-50 hover:text-neutral-900',
        'focus:bg-neutral-100 focus:text-neutral-900 focus:outline-none',
        // selected state — emerald text + bolder weight
        'data-[state=checked]:text-emerald-600 data-[state=checked]:font-semibold',
        // disabled
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        // transition
        'transition-colors duration-[var(--duration-fast,120ms)]',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      {/* Check icon appears on the right for selected item — matches prototype ::after */}
      <SelectPrimitive.ItemIndicator className="absolute right-2.5 flex items-center">
        <CheckIcon className="size-4 text-emerald-500" strokeWidth={2.5} />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}
SelectItem.displayName = 'SelectItem'

// ---------------------------------------------------------------------------
// Separator — thin horizontal divider between groups
// ---------------------------------------------------------------------------
function SelectSeparator({ ref, className, ...props }: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      ref={ref}
      className={cn('my-1 h-px bg-neutral-200', className)}
      {...props}
    />
  )
}
SelectSeparator.displayName = 'SelectSeparator'

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
}
