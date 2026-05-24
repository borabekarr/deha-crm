import * as React from 'react'
import { Drawer } from 'vaul'
import { motion, LayoutGroup, useReducedMotion } from 'framer-motion'
import { tabMorph, tabPillSlide } from '@deha/motion-tokens'
import type { SidebarProps } from '@deha/ui-contracts'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Context — shared collapsed state + morph scope for compound children
// ---------------------------------------------------------------------------
interface SidebarContextValue {
  isCollapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  scopeId: string
  hoveredItemId: string | null
  setHoveredItemId: (id: string | null) => void
}

const SidebarContext = React.createContext<SidebarContextValue>({
  isCollapsed: false,
  setCollapsed: () => void 0,
  scopeId: 'sidebar',
  hoveredItemId: null,
  setHoveredItemId: () => void 0,
})

// ---------------------------------------------------------------------------
// Root — persistent left-edge nav; below md renders as a Vaul Drawer
// The SSR/CSR-safe swap is handled purely via Tailwind hidden/md:flex.
// No useEffect.
// ---------------------------------------------------------------------------
const Sidebar = ({
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  reducedMotion: _reducedMotion, // eslint-disable-line @typescript-eslint/no-unused-vars
  children,
}: SidebarProps) => {
  // Uncontrolled fallback — no useEffect, plain useState initial value
  const [internalCollapsed, setInternalCollapsed] = React.useState(() => defaultCollapsed ?? false)
  const isCollapsed = collapsed ?? internalCollapsed

  const setCollapsed = React.useCallback(
    (next: boolean) => {
      if (collapsed === undefined) setInternalCollapsed(next)
      onCollapsedChange?.(next)
    },
    [collapsed, onCollapsedChange],
  )

  // Stable scope per mount for layoutId
  const scopeId = React.useId()

  const [hoveredItemId, setHoveredItemId] = React.useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const ctx = React.useMemo(
    () => ({ isCollapsed, setCollapsed, scopeId, hoveredItemId, setHoveredItemId }),
    [isCollapsed, setCollapsed, scopeId, hoveredItemId],
  )

  return (
    <SidebarContext.Provider value={ctx}>
      {/* ── Desktop: persistent aside ── */}
      <aside
        className={cn(
          'hidden md:flex flex-col h-full shrink-0',
          'bg-white border-r border-[var(--border)]',
          'transition-[width] duration-200',
          isCollapsed ? 'w-14' : 'w-56',
        )}
        aria-label="Sidebar navigation"
      >
        {children}
      </aside>

      {/* ── Mobile: Vaul Drawer ── */}
      <Drawer.Root open={mobileOpen} onOpenChange={setMobileOpen} direction="left">
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-sm md:hidden" />
          <Drawer.Content
            aria-label="Sidebar navigation"
            className={cn(
              'fixed bottom-0 left-0 top-0 z-50 flex flex-col md:hidden',
              'w-56 bg-white outline-none',
              'shadow-[var(--shadow-overlay-strong)]',
            )}
          >
            {children}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </SidebarContext.Provider>
  )
}
Sidebar.displayName = 'Sidebar'

// ---------------------------------------------------------------------------
// SidebarHeader
// ---------------------------------------------------------------------------
const SidebarHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex h-14 shrink-0 items-center px-4 border-b border-[var(--border)]', className)}
    {...props}
  />
)
SidebarHeader.displayName = 'SidebarHeader'

// ---------------------------------------------------------------------------
// SidebarContent — scrollable nav area; wraps children in LayoutGroup for morph
// Two LayoutGroups: one for active indicator, one for hover pill.
// ---------------------------------------------------------------------------
const SidebarContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const { scopeId } = React.useContext(SidebarContext)
  return (
    <div
      className={cn('flex flex-1 flex-col overflow-y-auto overflow-x-hidden px-3 py-4 gap-1', className)}
      {...props}
    >
      <LayoutGroup id={`sidebar-indicator-${scopeId}`}>
        <LayoutGroup id={`sidebar-hover-${scopeId}`}>
          {children}
        </LayoutGroup>
      </LayoutGroup>
    </div>
  )
}
SidebarContent.displayName = 'SidebarContent'

// ---------------------------------------------------------------------------
// SidebarFooter
// ---------------------------------------------------------------------------
const SidebarFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('shrink-0 border-t border-[var(--border)] px-3 py-3', className)}
    {...props}
  />
)
SidebarFooter.displayName = 'SidebarFooter'

// ---------------------------------------------------------------------------
// SidebarItem — nav link row matching prototype `sidebar a` styling
// ---------------------------------------------------------------------------
interface SidebarItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  active?: boolean
  icon?: React.ReactNode
}

function SidebarItem({ ref, className, active, icon, children, onMouseEnter, onMouseLeave, onFocus, onBlur, ...props }: SidebarItemProps & { ref?: React.Ref<HTMLAnchorElement> }) {
  const { scopeId, setHoveredItemId, hoveredItemId } = React.useContext(SidebarContext)

  // Stable item id derived from children string or icon — use useId as stable fallback
  const itemId = React.useId()

  const prefersReducedMotion = useReducedMotion() ?? false
  const morphConfig = tabMorph({ reducedMotion: prefersReducedMotion })
  const morphTransition = {
    type: 'tween' as const,
    duration: morphConfig.duration / 1000,
    ease: morphConfig.ease as [number, number, number, number],
  }

  const pillConfig = tabPillSlide({ reducedMotion: prefersReducedMotion })
  const pillTransition = {
    type: 'tween' as const,
    duration: pillConfig.duration / 1000,
    ease: pillConfig.ease as [number, number, number, number],
  }

  const isHovered = hoveredItemId === itemId

  return (
    <a
      ref={ref}
      className={cn(
        'relative flex items-center gap-2.5 rounded-lg px-3 py-2',
        'text-[length:var(--text-14)] font-medium transition-colors duration-150',
        active
          ? 'text-[var(--emerald-700)]'
          : 'text-[var(--neutral-600)] hover:text-[var(--foreground)]',
        className,
      )}
      aria-current={active ? 'page' : undefined}
      onMouseEnter={(e) => { setHoveredItemId(itemId); onMouseEnter?.(e) }}
      onMouseLeave={(e) => { setHoveredItemId(null); onMouseLeave?.(e) }}
      onFocus={(e) => { setHoveredItemId(itemId); onFocus?.(e) }}
      onBlur={(e) => { setHoveredItemId(null); onBlur?.(e) }}
      {...props}
    >
      {/* Full-row morph indicator — only rendered on active item */}
      {active && (
        <motion.span
          layoutId={`sidebar-indicator-${scopeId}`}
          data-motion-indicator="true"
          className="absolute inset-0 -z-[1] rounded-lg bg-[var(--emerald-50,oklch(0.979_0.021_166.113))]"
          transition={morphTransition}
          aria-hidden
        />
      )}
      {/* Hover-only pill — second layer, distinct layoutId; hidden when no item hovered */}
      {isHovered && (
        <motion.span
          layoutId={`sidebar-hover-pill-${scopeId}`}
          data-motion-hover-pill="sidebar-hover-pill"
          className="absolute inset-0 -z-[2] rounded-lg bg-neutral-100 dark:bg-neutral-800"
          transition={pillTransition}
          aria-hidden
        />
      )}
      {icon && (
        <span className="shrink-0 text-[20px] leading-none">{icon}</span>
      )}
      <span className="truncate">{children}</span>
    </a>
  )
}
SidebarItem.displayName = 'SidebarItem'

export { Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarItem }
