import * as React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import type { DropdownMenuProps } from '@deha/ui-contracts'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Root — strips reducedMotion before forwarding to Radix Root
// ---------------------------------------------------------------------------
const DropdownMenu = ({
  reducedMotion: _reducedMotion, // eslint-disable-line @typescript-eslint/no-unused-vars
  ...props
}: DropdownMenuProps & React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Root>) => (
  <DropdownMenuPrimitive.Root {...props} />
)
DropdownMenu.displayName = 'DropdownMenu'

// ---------------------------------------------------------------------------
// Trigger — the button / element that opens the menu
// ---------------------------------------------------------------------------
function DropdownMenuTrigger({ ref, className, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      ref={ref}
      className={cn('outline-none', className)}
      {...props}
    />
  )
}
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger'

// ---------------------------------------------------------------------------
// Portal — renders into document.body (avoids z-index / overflow clipping)
// ---------------------------------------------------------------------------
const DropdownMenuPortal = DropdownMenuPrimitive.Portal
DropdownMenuPortal.displayName = 'DropdownMenuPortal'

// ---------------------------------------------------------------------------
// Group — logical grouping of items
// ---------------------------------------------------------------------------
const DropdownMenuGroup = DropdownMenuPrimitive.Group
DropdownMenuGroup.displayName = 'DropdownMenuGroup'

// ---------------------------------------------------------------------------
// Content — the floating panel
// Prototype .menu — neutral-50 bg, subtle border, rounded-xl, tight shadow.
// Distinct from context-menu: lighter bg + softer border (not bolder framing).
// Arrow keys navigate items (free from Radix).
// Escape closes (free from Radix).
// ---------------------------------------------------------------------------
function DropdownMenuContent({ ref, className, sideOffset = 6, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          // base shape — rounded-xl, neutral-50 bg (lighter than context-menu's white)
          'z-50 min-w-[10rem] overflow-hidden rounded-xl',
          'bg-neutral-50 border border-neutral-200/80',
          'shadow-[0_4px_16px_-4px_rgb(15_23_42_/_0.12),0_1px_4px_-1px_rgb(15_23_42_/_0.06)]',
          'p-1',
          // animation
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
          'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}
DropdownMenuContent.displayName = 'DropdownMenuContent'

// ---------------------------------------------------------------------------
// Label — non-interactive section header within the menu
// ---------------------------------------------------------------------------
function DropdownMenuLabel({ ref, className, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Label>) {
  return (
    <DropdownMenuPrimitive.Label
      ref={ref}
      className={cn(
        'px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-neutral-400',
        className,
      )}
      {...props}
    />
  )
}
DropdownMenuLabel.displayName = 'DropdownMenuLabel'

// ---------------------------------------------------------------------------
// Item — standard action row
// Prototype .menu button: flex, gap .4rem, icons via .msi, red for destructive
// ---------------------------------------------------------------------------
function DropdownMenuItem({ ref, className, destructive, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & { destructive?: boolean }) {
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        // base: flex row, icon gap, rounded, hover bg
        'relative flex cursor-default select-none items-center gap-2 rounded-lg',
        'px-2.5 py-2 text-[13px] font-semibold text-neutral-700 outline-none',
        'transition-colors duration-100',
        'focus:bg-white focus:text-neutral-900 focus:shadow-sm',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
        destructive && 'text-red-600 focus:bg-red-50 focus:text-red-700',
        className,
      )}
      {...props}
    />
  )
}
DropdownMenuItem.displayName = 'DropdownMenuItem'

// ---------------------------------------------------------------------------
// CheckboxItem — item with a checkmark indicator
// ---------------------------------------------------------------------------
function DropdownMenuCheckboxItem({ ref, className, children, checked, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      ref={ref}
      checked={checked}
      className={cn(
        'relative flex cursor-default select-none items-center rounded-lg',
        'py-2 pl-8 pr-2.5 text-[13px] font-semibold text-neutral-700 outline-none',
        'transition-colors duration-100',
        'focus:bg-white focus:text-neutral-900 focus:shadow-sm',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <svg
            className="h-3.5 w-3.5 text-emerald-600"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 8l3.5 3.5L13 4.5" />
          </svg>
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem'

// ---------------------------------------------------------------------------
// RadioGroup + RadioItem — single-select group
// ---------------------------------------------------------------------------
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup
DropdownMenuRadioGroup.displayName = 'DropdownMenuRadioGroup'

function DropdownMenuRadioItem({ ref, className, children, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      ref={ref}
      className={cn(
        'relative flex cursor-default select-none items-center rounded-lg',
        'py-2 pl-8 pr-2.5 text-[13px] font-semibold text-neutral-700 outline-none',
        'transition-colors duration-100',
        'focus:bg-white focus:text-neutral-900 focus:shadow-sm',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <svg
            className="h-2 w-2 fill-emerald-600"
            viewBox="0 0 8 8"
            aria-hidden="true"
          >
            <circle cx={4} cy={4} r={4} />
          </svg>
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}
DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem'

// ---------------------------------------------------------------------------
// Separator — thin divider between menu sections
// Prototype: .sep — 1px neutral-200 line, vertical margin
// ---------------------------------------------------------------------------
function DropdownMenuSeparator({ ref, className, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      className={cn('my-1 h-px bg-neutral-200', className)}
      {...props}
    />
  )
}
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator'

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuGroup,
}
