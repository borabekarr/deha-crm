import * as React from 'react'
import { Drawer } from 'vaul'
import type { SidebarProps } from '@deha/ui-contracts'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Context — shared collapsed state for compound children
// ---------------------------------------------------------------------------
interface SidebarContextValue {
  isCollapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}

const SidebarContext = React.createContext<SidebarContextValue>({
  isCollapsed: false,
  setCollapsed: () => void 0,
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
  const [internalCollapsed, setInternalCollapsed] = React.useState(defaultCollapsed)
  const isCollapsed = collapsed ?? internalCollapsed

  const setCollapsed = React.useCallback(
    (next: boolean) => {
      if (collapsed === undefined) setInternalCollapsed(next)
      onCollapsedChange?.(next)
    },
    [collapsed, onCollapsedChange],
  )

  const ctx = React.useMemo(() => ({ isCollapsed, setCollapsed }), [isCollapsed, setCollapsed])

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
      <Drawer.Root open={!isCollapsed} onOpenChange={(open) => setCollapsed(!open)} direction="left">
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm md:hidden" />
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
// SidebarContent — scrollable nav area
// ---------------------------------------------------------------------------
const SidebarContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-1 flex-col overflow-y-auto overflow-x-hidden px-3 py-4 gap-1', className)}
    {...props}
  />
)
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

const SidebarItem = React.forwardRef<HTMLAnchorElement, SidebarItemProps>(
  ({ className, active, icon, children, ...props }, ref) => (
    <a
      ref={ref}
      className={cn(
        'flex items-center gap-2.5 rounded-lg px-3 py-2',
        'text-[length:var(--text-14)] font-medium transition-colors duration-150',
        active
          ? 'bg-[var(--emerald-50,oklch(0.979_0.021_166.113))] text-[var(--emerald-700)]'
          : 'text-[var(--slate-600)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]',
        className,
      )}
      aria-current={active ? 'page' : undefined}
      {...props}
    >
      {icon && (
        <span className="shrink-0 text-[20px] leading-none">{icon}</span>
      )}
      <span className="truncate">{children}</span>
    </a>
  ),
)
SidebarItem.displayName = 'SidebarItem'

export { Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarItem }
