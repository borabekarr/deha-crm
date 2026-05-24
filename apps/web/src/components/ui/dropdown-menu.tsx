import * as React from 'react'
import { use } from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { AnimatePresence, m, LayoutGroup, useReducedMotion } from 'framer-motion'
import type { DropdownMenuProps } from '@deha/ui-contracts'
import { windowMorph, tabPillSlide } from '@deha/motion-tokens'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Internal context — tracks open state so DropdownMenuContent can drive AnimatePresence
// ---------------------------------------------------------------------------
const DropdownMenuOpenContext = React.createContext(false)

// ---------------------------------------------------------------------------
// Hover-pill context — tracks which item ID is hovered for the shared pill
// ---------------------------------------------------------------------------
interface DropdownHoverContextValue {
  hoveredId: string | null
  setHoveredId: (id: string | null) => void
  scopeId: string
  prefersReducedMotion: boolean
}
const DropdownHoverContext = React.createContext<DropdownHoverContextValue>({
  hoveredId: null,
  setHoveredId: () => void 0,
  scopeId: 'dropdown',
  prefersReducedMotion: false,
})

// ---------------------------------------------------------------------------
// Root — strips reducedMotion before forwarding to Radix Root; tracks open state
// ---------------------------------------------------------------------------
const DropdownMenu = ({
  reducedMotion: _reducedMotion, // eslint-disable-line @typescript-eslint/no-unused-vars
  open: openProp,
  defaultOpen,
  onOpenChange,
  ...props
}: DropdownMenuProps & React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Root>) => {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen ?? false)
  const isOpen = openProp ?? internalOpen
  const handleOpenChange = (next: boolean) => {
    if (openProp === undefined) setInternalOpen(next)
    onOpenChange?.(next)
  }
  return (
    <DropdownMenuOpenContext.Provider value={isOpen}>
      <DropdownMenuPrimitive.Root open={openProp} defaultOpen={defaultOpen} onOpenChange={handleOpenChange} {...props} />
    </DropdownMenuOpenContext.Provider>
  )
}
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
function DropdownMenuContent({ ref, className, sideOffset = 6, children, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  const isOpen = use(DropdownMenuOpenContext)
  const reducedMotion = useReducedMotion() ?? false
  const morphConfig = windowMorph({ reducedMotion })
  const transition = {
    type: 'tween' as const,
    duration: morphConfig.duration / 1000,
    ease: morphConfig.ease as [number, number, number, number],
  }

  const scopeId = React.useId()
  const [hoveredId, setHoveredId] = React.useState<string | null>(null)

  const hoverCtx = React.useMemo(
    () => ({ hoveredId, setHoveredId, scopeId, prefersReducedMotion: reducedMotion }),
    [hoveredId, scopeId, reducedMotion],
  )

  return (
    <DropdownMenuPrimitive.Portal>
      <AnimatePresence>
        {isOpen && (
          <DropdownMenuPrimitive.Content
            ref={ref}
            forceMount
            sideOffset={sideOffset}
            className={cn(
              // base shape — rounded-xl, neutral-50 bg (lighter than context-menu's white)
              'z-50 min-w-[10rem] overflow-hidden rounded-xl',
              'bg-neutral-50 border border-neutral-200/80',
              'shadow-[0_4px_16px_-4px_rgb(15_23_42_/_0.12),0_1px_4px_-1px_rgb(15_23_42_/_0.06)]',
              'p-1',
              className,
            )}
            {...props}
          >
            <m.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={transition}
              style={{ transformOrigin: 'var(--radix-dropdown-menu-content-transform-origin)' }}
            >
              <DropdownHoverContext.Provider value={hoverCtx}>
                <LayoutGroup id={`dropdown-hover-${scopeId}`}>
                  {children}
                </LayoutGroup>
              </DropdownHoverContext.Provider>
            </m.div>
          </DropdownMenuPrimitive.Content>
        )}
      </AnimatePresence>
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
function DropdownMenuItem({ ref, className, destructive, onMouseEnter, onMouseLeave, onFocus, onBlur, children, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & { destructive?: boolean }) {
  const { hoveredId, setHoveredId, scopeId, prefersReducedMotion } = use(DropdownHoverContext)
  const itemId = React.useId()
  const isHovered = hoveredId === itemId

  const pillConfig = tabPillSlide({ reducedMotion: prefersReducedMotion })
  const pillTransition = {
    type: 'tween' as const,
    duration: pillConfig.duration / 1000,
    ease: pillConfig.ease as [number, number, number, number],
  }

  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        // base: flex row, icon gap, rounded, hover bg
        'relative flex cursor-default select-none items-center gap-2 rounded-lg',
        'px-2.5 py-2 text-[13px] font-semibold text-neutral-700 outline-none',
        'transition-colors duration-100',
        'focus:text-neutral-900',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
        destructive && 'text-red-600 focus:text-red-700',
        className,
      )}
      onMouseEnter={(e) => { setHoveredId(itemId); onMouseEnter?.(e as React.MouseEvent<HTMLDivElement>) }}
      onMouseLeave={(e) => { setHoveredId(null); onMouseLeave?.(e as React.MouseEvent<HTMLDivElement>) }}
      onFocus={(e) => { setHoveredId(itemId); onFocus?.(e as React.FocusEvent<HTMLDivElement>) }}
      onBlur={(e) => { setHoveredId(null); onBlur?.(e as React.FocusEvent<HTMLDivElement>) }}
      {...props}
    >
      {/* Hover-only pill — slides between items via shared layoutId */}
      {isHovered && (
        <m.span
          layoutId={`dropdown-hover-pill-${scopeId}`}
          data-motion-hover-pill="dropdown-hover-pill"
          className={cn(
            'absolute inset-0 -z-[1] rounded-lg',
            destructive ? 'bg-red-50' : 'bg-white shadow-sm',
          )}
          transition={pillTransition}
          aria-hidden
        />
      )}
      {children}
    </DropdownMenuPrimitive.Item>
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
      <span className="absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <svg
            className="size-3.5 text-emerald-600"
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
      <span className="absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <svg
            className="size-2 fill-emerald-600"
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
