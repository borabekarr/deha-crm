import * as React from 'react'
import * as ContextMenuPrimitive from '@radix-ui/react-context-menu'
import type { ContextMenuProps } from '@deha/ui-contracts'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Root — strips reducedMotion before forwarding to Radix Root
// ---------------------------------------------------------------------------
const ContextMenu = ({
  reducedMotion: _reducedMotion, // eslint-disable-line @typescript-eslint/no-unused-vars
  ...props
}: ContextMenuProps & React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Root>) => (
  <ContextMenuPrimitive.Root {...props} />
)
ContextMenu.displayName = 'ContextMenu'

// ---------------------------------------------------------------------------
// Trigger — right-click target element
// ---------------------------------------------------------------------------
const ContextMenuTrigger = ContextMenuPrimitive.Trigger
ContextMenuTrigger.displayName = 'ContextMenuTrigger'

// ---------------------------------------------------------------------------
// Portal — renders into document.body
// ---------------------------------------------------------------------------
const ContextMenuPortal = ContextMenuPrimitive.Portal
ContextMenuPortal.displayName = 'ContextMenuPortal'

// ---------------------------------------------------------------------------
// Group — logical grouping of items
// ---------------------------------------------------------------------------
const ContextMenuGroup = ContextMenuPrimitive.Group
ContextMenuGroup.displayName = 'ContextMenuGroup'

// ---------------------------------------------------------------------------
// RadioGroup — single-select group
// ---------------------------------------------------------------------------
const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup
ContextMenuRadioGroup.displayName = 'ContextMenuRadioGroup'

// ---------------------------------------------------------------------------
// Content — the floating panel positioned at the cursor (right-click point).
// Radix ContextMenu positions content at the right-click cursor; `align` and
// `sideOffset` are intentionally omitted from ContextMenuContentProps by Radix
// because context menus anchor to the cursor, not a trigger element.
// Pass 3 anchor intent: menu opens near the top-right of the right-click zone;
// avoidCollisions keeps it on-screen. Distinct from dropdown-menu: pure white
// bg (not neutral-50), stronger border + ring + shadow framing.
// Prototype .menu: white/85 frosted, border white/60, shadow 0 12px 32px.
// ---------------------------------------------------------------------------
function ContextMenuContent({ ref, className, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Content>) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        ref={ref}
        className={cn(
          // base shape — rounded-2xl, pure white bg (distinct from dropdown-menu's neutral-50)
          'z-50 min-w-[13rem] overflow-hidden rounded-2xl',
          'bg-white/90 backdrop-blur-[40px]',
          // bolder border frame vs dropdown-menu (white/80 vs white/60)
          'border border-white/80 ring-1 ring-neutral-200/60',
          // stronger shadow vs dropdown-menu
          'shadow-[0_12px_32px_-8px_rgb(15_23_42_/_0.22),inset_0_1px_0_rgb(255_255_255_/_0.6)]',
          'p-1.5',
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
    </ContextMenuPrimitive.Portal>
  )
}
ContextMenuContent.displayName = 'ContextMenuContent'

// ---------------------------------------------------------------------------
// Label — non-interactive section header
// ---------------------------------------------------------------------------
function ContextMenuLabel({ ref, className, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Label>) {
  return (
    <ContextMenuPrimitive.Label
      ref={ref}
      className={cn(
        'px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-neutral-400',
        className,
      )}
      {...props}
    />
  )
}
ContextMenuLabel.displayName = 'ContextMenuLabel'

// ---------------------------------------------------------------------------
// Item — standard action row
// Prototype .menu button: flex, gap .625rem, icon neutral-400, rounded-[10px].
// ---------------------------------------------------------------------------
function ContextMenuItem({ ref, className, destructive, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Item> & { destructive?: boolean }) {
  return (
    <ContextMenuPrimitive.Item
      ref={ref}
      className={cn(
        'relative flex cursor-default select-none items-center gap-2.5 rounded-[10px]',
        'px-2.5 py-2 text-[13px] font-semibold text-neutral-700 outline-none',
        'transition-colors duration-100',
        'focus:bg-neutral-100 focus:text-neutral-900',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
        destructive && 'text-red-600 focus:bg-red-50 focus:text-red-700',
        className,
      )}
      {...props}
    />
  )
}
ContextMenuItem.displayName = 'ContextMenuItem'

// ---------------------------------------------------------------------------
// Separator — thin divider
// ---------------------------------------------------------------------------
function ContextMenuSeparator({ ref, className, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Separator>) {
  return (
    <ContextMenuPrimitive.Separator
      ref={ref}
      className={cn('my-1.5 h-px bg-neutral-200/80 mx-1', className)}
      {...props}
    />
  )
}
ContextMenuSeparator.displayName = 'ContextMenuSeparator'

// ---------------------------------------------------------------------------
// CheckboxItem — item with a checkmark indicator
// ---------------------------------------------------------------------------
function ContextMenuCheckboxItem({ ref, className, children, checked, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.CheckboxItem>) {
  return (
    <ContextMenuPrimitive.CheckboxItem
      ref={ref}
      checked={checked}
      className={cn(
        'relative flex cursor-default select-none items-center rounded-[10px]',
        'py-2 pl-8 pr-2.5 text-[13px] font-semibold text-neutral-700 outline-none',
        'transition-colors duration-100',
        'focus:bg-neutral-100 focus:text-neutral-900',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <ContextMenuPrimitive.ItemIndicator>
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
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.CheckboxItem>
  )
}
ContextMenuCheckboxItem.displayName = 'ContextMenuCheckboxItem'

// ---------------------------------------------------------------------------
// RadioItem — single-select item within RadioGroup
// ---------------------------------------------------------------------------
function ContextMenuRadioItem({ ref, className, children, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.RadioItem>) {
  return (
    <ContextMenuPrimitive.RadioItem
      ref={ref}
      className={cn(
        'relative flex cursor-default select-none items-center rounded-[10px]',
        'py-2 pl-8 pr-2.5 text-[13px] font-semibold text-neutral-700 outline-none',
        'transition-colors duration-100',
        'focus:bg-neutral-100 focus:text-neutral-900',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <ContextMenuPrimitive.ItemIndicator>
          <svg
            className="h-2 w-2 fill-emerald-600"
            viewBox="0 0 8 8"
            aria-hidden="true"
          >
            <circle cx={4} cy={4} r={4} />
          </svg>
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.RadioItem>
  )
}
ContextMenuRadioItem.displayName = 'ContextMenuRadioItem'

// ---------------------------------------------------------------------------
// Sub — submenu root
// ---------------------------------------------------------------------------
const ContextMenuSub = ContextMenuPrimitive.Sub
ContextMenuSub.displayName = 'ContextMenuSub'

// ---------------------------------------------------------------------------
// SubTrigger — item that opens a nested submenu
// ---------------------------------------------------------------------------
function ContextMenuSubTrigger({ ref, className, inset, children, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.SubTrigger> & { inset?: boolean }) {
  return (
    <ContextMenuPrimitive.SubTrigger
      ref={ref}
      className={cn(
        'flex cursor-default select-none items-center gap-2.5 rounded-[10px]',
        'px-2.5 py-2 text-[13px] font-semibold text-neutral-700 outline-none',
        'transition-colors duration-100',
        'focus:bg-neutral-100 focus:text-neutral-900',
        'data-[state=open]:bg-neutral-100 data-[state=open]:text-neutral-900',
        inset && 'pl-8',
        className,
      )}
      {...props}
    >
      {children}
      <svg
        className="ml-auto h-3.5 w-3.5 text-neutral-400"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 2l4 4-4 4" />
      </svg>
    </ContextMenuPrimitive.SubTrigger>
  )
}
ContextMenuSubTrigger.displayName = 'ContextMenuSubTrigger'

// ---------------------------------------------------------------------------
// SubContent — nested submenu panel
// ---------------------------------------------------------------------------
function ContextMenuSubContent({ ref, className, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.SubContent>) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.SubContent
        ref={ref}
        className={cn(
          'z-50 min-w-[13rem] overflow-hidden rounded-2xl',
          'bg-white/90 backdrop-blur-[40px]',
          'border border-white/80 ring-1 ring-neutral-200/60',
          'shadow-[0_12px_32px_-8px_rgb(15_23_42_/_0.22),inset_0_1px_0_rgb(255_255_255_/_0.6)]',
          'p-1.5',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
          'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          className,
        )}
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  )
}
ContextMenuSubContent.displayName = 'ContextMenuSubContent'

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuPortal,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuGroup,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
}
