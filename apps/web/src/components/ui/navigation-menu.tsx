import * as React from 'react'
import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu'
import { motion, LayoutGroup, useReducedMotion } from 'framer-motion'
import { tabMorph } from '@deha/motion-tokens'
import type { NavigationMenuProps } from '@deha/ui-contracts'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Context — tracks hovered/active item for shared-element morph indicator
// ---------------------------------------------------------------------------
const NavigationMenuContext = React.createContext<{
  hoveredId: string | null
  setHoveredId: (id: string | null) => void
  scopeId: string
}>({ hoveredId: null, setHoveredId: () => undefined, scopeId: 'nav' })

// ---------------------------------------------------------------------------
// Root — pill-shaped horizontal nav bar
// Prototype .navmenu: inline-flex, gap .25rem, padding .375rem, pill radius,
//   white/70 frosted glass bg, subtle box-shadow.
// ---------------------------------------------------------------------------
const NavigationMenu = ({
  reducedMotion: _reducedMotion, // eslint-disable-line @typescript-eslint/no-unused-vars
  className,
  children,
  ...props
}: NavigationMenuProps & React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>) => {
  const [hoveredId, setHoveredId] = React.useState<string | null>(null)
  const scopeId = React.useId()
  const ctx = React.useMemo(() => ({ hoveredId, setHoveredId, scopeId }), [hoveredId, scopeId])

  return (
    <NavigationMenuContext.Provider value={ctx}>
      <LayoutGroup id={`nav-indicator-${scopeId}`}>
        <NavigationMenuPrimitive.Root
          className={cn(
            'relative inline-flex items-center gap-1 p-1.5 rounded-full',
            'bg-white/70 backdrop-blur-[40px]',
            'border border-white/60',
            'shadow-[0_4px_6px_-1px_rgb(0_0_0_/_0.10),0_2px_4px_-1px_rgb(0_0_0_/_0.06),inset_0_1px_0_rgb(255_255_255_/_0.4)]',
            className,
          )}
          {...props}
        >
          {children}
          <NavigationMenuViewport />
        </NavigationMenuPrimitive.Root>
      </LayoutGroup>
    </NavigationMenuContext.Provider>
  )
}
NavigationMenu.displayName = 'NavigationMenu'

// ---------------------------------------------------------------------------
// List — horizontal row of nav items
// ---------------------------------------------------------------------------
function NavigationMenuList({ ref, className, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.List>) {
  return (
    <NavigationMenuPrimitive.List
      ref={ref}
      className={cn('flex flex-row items-center gap-1', className)}
      {...props}
    />
  )
}
NavigationMenuList.displayName = 'NavigationMenuList'

// ---------------------------------------------------------------------------
// Item — individual nav entry container
// ---------------------------------------------------------------------------
const NavigationMenuItem = NavigationMenuPrimitive.Item
NavigationMenuItem.displayName = 'NavigationMenuItem'

// ---------------------------------------------------------------------------
// Trigger — hover-open button inside an item
// Prototype .navmenu a: padding .5rem 1rem, font-size 13px, weight 600,
//   color neutral-500, pill radius. Active: neutral-900 bg, white text.
// ---------------------------------------------------------------------------
function NavigationMenuTrigger({ ref, className, children, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.Trigger>) {
  const { hoveredId, setHoveredId, scopeId } = React.useContext(NavigationMenuContext)
  const itemId = React.useId()
  const isHovered = hoveredId === itemId

  const prefersReducedMotion = useReducedMotion() ?? false
  const morphConfig = tabMorph({ reducedMotion: prefersReducedMotion })
  const transition = {
    type: 'tween' as const,
    duration: morphConfig.duration / 1000,
    ease: morphConfig.ease as [number, number, number, number],
  }

  return (
    <NavigationMenuPrimitive.Trigger
      ref={ref}
      className={cn(
        'relative inline-flex items-center gap-1.5 rounded-full px-4 py-2',
        'text-[13px] font-semibold text-neutral-500',
        'transition-colors duration-150 ease-out',
        'hover:text-neutral-900',
        'data-[state=open]:text-white',
        'outline-none select-none',
        className,
      )}
      onMouseEnter={() => setHoveredId(itemId)}
      onMouseLeave={() => setHoveredId(null)}
      onFocus={() => setHoveredId(itemId)}
      onBlur={() => setHoveredId(null)}
      {...props}
    >
      {/* Morphing background indicator */}
      {isHovered && (
        <motion.span
          layoutId={`nav-indicator-${scopeId}`}
          data-motion-indicator="true"
          className="absolute inset-0 -z-[1] rounded-full bg-muted"
          transition={transition}
          aria-hidden
        />
      )}
      {children}
      <svg
        className="relative top-px size-3 flex-shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M2 4l4 4 4-4" />
      </svg>
    </NavigationMenuPrimitive.Trigger>
  )
}
NavigationMenuTrigger.displayName = 'NavigationMenuTrigger'

// ---------------------------------------------------------------------------
// Content — floating dropdown panel
// Prototype .menu: white/85 frosted, border white/60, shadow, rounded-2xl.
// ---------------------------------------------------------------------------
function NavigationMenuContent({ ref, className, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.Content>) {
  return (
    <NavigationMenuPrimitive.Content
      ref={ref}
      className={cn(
        'absolute left-0 top-0 w-auto',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52',
        'data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52',
        className,
      )}
      {...props}
    />
  )
}
NavigationMenuContent.displayName = 'NavigationMenuContent'

// ---------------------------------------------------------------------------
// Link — plain nav link (no dropdown)
// Prototype .navmenu a active state: neutral-900 bg, white text, inner shadow.
// ---------------------------------------------------------------------------
function NavigationMenuLink({ ref, className, active, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.Link> & { active?: boolean }) {
  const { hoveredId, setHoveredId, scopeId } = React.useContext(NavigationMenuContext)
  const itemId = React.useId()
  // Show indicator when hovered OR when link is explicitly marked active
  const isHighlighted = hoveredId === itemId || (active === true && hoveredId === null)

  const prefersReducedMotion = useReducedMotion() ?? false
  const morphConfig = tabMorph({ reducedMotion: prefersReducedMotion })
  const transition = {
    type: 'tween' as const,
    duration: morphConfig.duration / 1000,
    ease: morphConfig.ease as [number, number, number, number],
  }

  return (
    <NavigationMenuPrimitive.Link
      ref={ref}
      active={active}
      className={cn(
        'relative inline-flex items-center gap-1.5 rounded-full px-4 py-2',
        'text-[13px] font-semibold text-neutral-500 no-underline',
        'transition-colors duration-150 ease-out',
        'hover:text-neutral-900',
        'data-[active]:text-white',
        'outline-none',
        className,
      )}
      onMouseEnter={() => setHoveredId(itemId)}
      onMouseLeave={() => setHoveredId(null)}
      onFocus={() => setHoveredId(itemId)}
      onBlur={() => setHoveredId(null)}
      {...props}
    >
      {/* Morphing background indicator */}
      {isHighlighted && (
        <motion.span
          layoutId={`nav-indicator-${scopeId}`}
          data-motion-indicator="true"
          className="absolute inset-0 -z-[1] rounded-full bg-muted"
          transition={transition}
          aria-hidden
        />
      )}
      {props.children}
    </NavigationMenuPrimitive.Link>
  )
}
NavigationMenuLink.displayName = 'NavigationMenuLink'

// ---------------------------------------------------------------------------
// Indicator — sliding underline indicator (optional)
// ---------------------------------------------------------------------------
function NavigationMenuIndicator({ ref, className, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.Indicator>) {
  return (
    <NavigationMenuPrimitive.Indicator
      ref={ref}
      className={cn(
        'top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden',
        'data-[state=visible]:animate-in data-[state=hidden]:animate-out',
        'data-[state=hidden]:fade-out data-[state=visible]:fade-in',
        className,
      )}
      {...props}
    >
      <div className="relative top-[60%] size-2 rotate-45 rounded-tl-sm bg-neutral-200 shadow-md" />
    </NavigationMenuPrimitive.Indicator>
  )
}
NavigationMenuIndicator.displayName = 'NavigationMenuIndicator'

// ---------------------------------------------------------------------------
// Viewport — where dropdown Contents render
// Frosted glass panel; same menu visual treatment.
// ---------------------------------------------------------------------------
function NavigationMenuViewport({ ref, className, ...props }: React.ComponentProps<typeof NavigationMenuPrimitive.Viewport>) {
  return (
    <div className={cn('absolute left-0 top-full flex justify-center')}>
      <NavigationMenuPrimitive.Viewport
        ref={ref}
        className={cn(
          'relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)]',
          'w-full overflow-hidden rounded-2xl',
          'bg-white/85 backdrop-blur-[40px]',
          'border border-white/60',
          'shadow-[0_12px_32px_-8px_rgb(15_23_42_/_0.20),inset_0_1px_0_rgb(255_255_255_/_0.5)]',
          'p-1.5',
          'origin-[top_center]',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'min-w-[13rem]',
          className,
        )}
        {...props}
      />
    </div>
  )
}
NavigationMenuViewport.displayName = 'NavigationMenuViewport'

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
}
