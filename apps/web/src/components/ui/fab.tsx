/* eslint-disable react-refresh/only-export-components */
import * as React from 'react'
import {
  AnimatePresence,
  m,
  useReducedMotion,
  type Variants,
} from 'framer-motion'
import { fabStaggerOpen } from '@deha/motion-tokens'
import { cn } from '@/lib/utils'
import { FabContext, useFabContext } from './fab-context'

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------
interface FabRootProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (v: boolean) => void
  defaultOpen?: boolean
}

function FabRoot({ children, open: openProp, onOpenChange, defaultOpen = false }: FabRootProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const isOpen = openProp ?? internalOpen

  const setOpen = React.useCallback(
    (v: boolean) => {
      if (openProp === undefined) setInternalOpen(v)
      onOpenChange?.(v)
    },
    [openProp, onOpenChange],
  )

  const contextValue = React.useMemo(() => ({ open: isOpen, setOpen }), [isOpen, setOpen])

  return <FabContext.Provider value={contextValue}>{children}</FabContext.Provider>
}
FabRoot.displayName = 'Fab.Root'

// ---------------------------------------------------------------------------
// Trigger (default: the circular FAB button)
// ---------------------------------------------------------------------------
interface FabTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** If true, renders as fixed; if false, renders as absolute (for showcase). Default true. */
  fixed?: boolean
}

function FabTrigger({ className, fixed = true, 'aria-label': ariaLabel, ...props }: FabTriggerProps) {
  const { open, setOpen } = useFabContext()

  return (
    <m.button
      type="button"
      aria-label={ariaLabel ?? (open ? 'Close menu' : 'Open menu')}
      aria-expanded={open}
      aria-haspopup="true"
      onClick={() => setOpen(!open)}
      data-fab-trigger=""
      animate={{ rotate: open ? 45 : 0 }}
      transition={{ duration: 0.2, ease: [0.3, 0, 0, 1] }}
      className={cn(
        'z-50 flex size-14 items-center justify-center rounded-full bg-neutral-900 dark:bg-neutral-100 shadow-xl text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100 transition-colors',
        fixed ? 'fixed bottom-6 right-6' : 'absolute bottom-6 right-6',
        className,
      )}
      {...(props as React.ComponentPropsWithoutRef<typeof m.button>)}
    >
      {/* Plus icon — morphs to X via parent rotate */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </m.button>
  )
}
FabTrigger.displayName = 'Fab.Trigger'

// ---------------------------------------------------------------------------
// MenuItem
// ---------------------------------------------------------------------------
interface FabMenuItemProps {
  label: string
  icon: React.ReactNode
  onClick?: () => void
  className?: string
}

const menuItemVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.92 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 8, scale: 0.94 },
}

function FabMenuItem({ label, icon, onClick, className }: FabMenuItemProps) {
  const { setOpen } = useFabContext()

  const activateItem = () => {
    onClick?.()
    setOpen(false)
  }

  return (
    <m.button
      type="button"
      role="menuitem"
      variants={menuItemVariants}
      onClick={activateItem}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl bg-white/90 dark:bg-neutral-900/90 px-4 py-3 text-sm font-medium text-neutral-800 dark:text-neutral-100 shadow-md shadow-black/5 hover:bg-white dark:hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100',
        className,
      )}
    >
      <span className="flex size-8 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 shrink-0">
        {icon}
      </span>
      <span>{label}</span>
    </m.button>
  )
}
FabMenuItem.displayName = 'Fab.MenuItem'

// ---------------------------------------------------------------------------
// Overlay — full-screen backdrop + staggered menu list
// ---------------------------------------------------------------------------
interface FabOverlayProps {
  children: React.ReactNode
  /** If true, overlay uses fixed; if false, absolute (for showcase). Default true. */
  fixed?: boolean
  className?: string
}

function FabOverlay({ children, fixed = true, className }: FabOverlayProps) {
  const { open, setOpen } = useFabContext()
  const reducedMotion = useReducedMotion() ?? false
  const stagger = fabStaggerOpen({ reducedMotion })

  // Escape + outside-click close. Document-level pointerdown avoids relying on
  // the backdrop element's own onClick, which proved flaky when the trigger
  // is re-clicked or when the showcase section clips backdrop bounds.
  React.useEffect(() => {
    if (!open) return
    const handlePointer = (e: PointerEvent) => {
      const target = e.target as Element | null
      if (!target) return
      if (target.closest('[data-fab-trigger]') || target.closest('[data-fab-menu]')) return
      setOpen(false)
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    // Capture phase so siblings that call stopPropagation cannot suppress close.
    document.addEventListener('pointerdown', handlePointer, true)
    document.addEventListener('keydown', handleKey, true)
    return () => {
      document.removeEventListener('pointerdown', handlePointer, true)
      document.removeEventListener('keydown', handleKey, true)
    }
  }, [open, setOpen])

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: stagger.duration / 1000,
        ease: [...stagger.ease] as [number, number, number, number],
        staggerChildren: stagger.staggerChildren,
        when: 'beforeChildren',
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.15,
        ease: [0.3, 0, 0.8, 0.15] as [number, number, number, number],
        staggerChildren: stagger.staggerChildren ? stagger.staggerChildren * 0.5 : 0,
        staggerDirection: -1,
      },
    },
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <m.div
            key="fab-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            aria-hidden="true"
            className={cn(
              'inset-0 z-40 backdrop-blur-[20px] bg-background/40',
              fixed ? 'fixed' : 'absolute',
            )}
          />

          {/* Menu items column */}
          <m.div
            key="fab-menu"
            role="menu"
            aria-label="Floating action menu"
            data-fab-menu=""
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              'z-50 flex flex-col gap-2 items-stretch w-56',
              fixed ? 'fixed bottom-24 right-6' : 'absolute bottom-24 right-6',
              className,
            )}
          >
            {children}
          </m.div>
        </>
      )}
    </AnimatePresence>
  )
}
FabOverlay.displayName = 'Fab.Overlay'

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------
export { FabRoot, FabTrigger, FabOverlay, FabMenuItem }
export const Fab = {
  Root: FabRoot,
  Trigger: FabTrigger,
  Overlay: FabOverlay,
  MenuItem: FabMenuItem,
}
