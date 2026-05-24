import * as React from 'react'
import { useReducedMotion } from 'framer-motion'
import { Drawer } from 'vaul'
import { cn } from '@/lib/utils'
import { sheetDetent } from '@deha/motion-tokens'

// ---------------------------------------------------------------------------
// Snap points for Apple Maps peek / half / full behaviour
// ---------------------------------------------------------------------------
const SNAP_POINTS = [0.18, 0.5, 0.95] as const
const FADE_FROM_INDEX = 1

// Map snap index → overlay opacity (0 at peek, ~0.3 at half, ~0.5 at full)
const OVERLAY_OPACITY: Record<number, number> = { 0: 0, 1: 0.3, 2: 0.5 }

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
interface MapsSheetCtx {
  activeSnapIndex: number
  reducedMotion: boolean
  transitionDuration: number
}
const MapsSheetContext = React.createContext<MapsSheetCtx>({
  activeSnapIndex: 0,
  reducedMotion: false,
  transitionDuration: 280,
})

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------
type MapsSheetRootProps = React.ComponentPropsWithoutRef<typeof Drawer.Root> & {
  /** Override reduced-motion; defaults to CSS prefers-reduced-motion media query. */
  reducedMotion?: boolean
}

function MapsSheetRoot({
  children,
  reducedMotion: reducedMotionProp,
  activeSnapPoint: activeSnapPointProp,
  setActiveSnapPoint: setActiveSnapPointProp,
  ...props
}: MapsSheetRootProps) {
  // Detect reduced-motion from OS/browser preference when not overridden
  const systemReducedMotion = useReducedMotion() ?? false
  const reducedMotion = reducedMotionProp ?? systemReducedMotion

  const detent = sheetDetent({ reducedMotion })
  const transitionDuration = detent.duration

  const [internalSnap, setInternalSnap] = React.useState<number | string | null>(null)
  const activeSnapPoint = activeSnapPointProp ?? internalSnap
  const setActiveSnapPoint = setActiveSnapPointProp ?? setInternalSnap

  // Derive index from active snap point
  const activeSnapIndex = React.useMemo(() => {
    const idx = (SNAP_POINTS as readonly (number | string)[]).indexOf(activeSnapPoint as number | string)
    return idx === -1 ? 0 : idx
  }, [activeSnapPoint])

  const ctx = React.useMemo<MapsSheetCtx>(
    () => ({ activeSnapIndex, reducedMotion, transitionDuration }),
    [activeSnapIndex, reducedMotion, transitionDuration],
  )

  return (
    <MapsSheetContext.Provider value={ctx}>
      <Drawer.Root
        snapPoints={[...SNAP_POINTS]}
        fadeFromIndex={FADE_FROM_INDEX}
        activeSnapPoint={activeSnapPoint}
        setActiveSnapPoint={setActiveSnapPoint}
        {...props}
      >
        {children}
      </Drawer.Root>
    </MapsSheetContext.Provider>
  )
}
MapsSheetRoot.displayName = 'MapsSheet.Root'

// ---------------------------------------------------------------------------
// Trigger
// ---------------------------------------------------------------------------
function MapsSheetTrigger({ ref, ...props }: React.ComponentProps<typeof Drawer.Trigger>) {
  return <Drawer.Trigger ref={ref} {...props} />
}
MapsSheetTrigger.displayName = 'MapsSheet.Trigger'

// ---------------------------------------------------------------------------
// Backdrop — custom because Vaul's Overlay has no built-in opacity-by-snap-point API
// ---------------------------------------------------------------------------
function MapsSheetBackdrop({ className }: { className?: string }) {
  const { activeSnapIndex, transitionDuration } = React.use(MapsSheetContext)
  const opacity = OVERLAY_OPACITY[activeSnapIndex] ?? 0

  return (
    <Drawer.Overlay
      className={cn('fixed inset-0 z-50', className)}
      style={{
        backgroundColor: `rgba(0,0,0,${opacity})`,
        transition: `background-color ${transitionDuration}ms cubic-bezier(0.05,0.7,0.1,1)`,
      }}
    />
  )
}
MapsSheetBackdrop.displayName = 'MapsSheet.Backdrop'

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------
function MapsSheetContent({
  ref,
  className,
  children,
  ...props
}: React.ComponentProps<typeof Drawer.Content>) {
  const { transitionDuration } = React.use(MapsSheetContext)

  return (
    <Drawer.Portal>
      <MapsSheetBackdrop />
      <Drawer.Content
        ref={ref}
        className={cn(
          // Position — bottom sheet
          'fixed bottom-0 left-0 right-0 z-50',
          // Sizing
          'mx-auto max-w-2xl',
          // Shape
          'rounded-t-2xl',
          // Colours
          'bg-white dark:bg-neutral-900',
          // Shadow
          'shadow-[0_-4px_32px_rgba(0,0,0,0.12)]',
          // Focus ring suppressed
          'outline-none',
          className,
        )}
        style={{
          // Rubber-band overscroll is enabled by default in Vaul on bottom drawers.
          // Smooth transition when snapping between detents.
          transition: `height ${transitionDuration}ms cubic-bezier(0.05,0.7,0.1,1)`,
        }}
        {...props}
      >
        {/* Handle indicator */}
        <div
          aria-hidden="true"
          className="mx-auto mt-3 mb-2 h-1.5 w-10 shrink-0 rounded-full bg-neutral-300 dark:bg-neutral-600"
        />
        {/* Scrollable inner area */}
        <div className="flex flex-col overflow-auto px-4 pb-6">
          {children}
        </div>
      </Drawer.Content>
    </Drawer.Portal>
  )
}
MapsSheetContent.displayName = 'MapsSheet.Content'

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------
const MapsSheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mb-3 pt-1', className)} {...props} />
)
MapsSheetHeader.displayName = 'MapsSheet.Header'

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------
function MapsSheetTitle({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof Drawer.Title>) {
  return (
    <Drawer.Title
      ref={ref}
      className={cn('text-[length:var(--text-20)] font-semibold text-neutral-900 dark:text-neutral-100', className)}
      {...props}
    />
  )
}
MapsSheetTitle.displayName = 'MapsSheet.Title'

// ---------------------------------------------------------------------------
// Compound namespace export
// ---------------------------------------------------------------------------
export const MapsSheet = {
  Root: MapsSheetRoot,
  Trigger: MapsSheetTrigger,
  Content: MapsSheetContent,
  Header: MapsSheetHeader,
  Title: MapsSheetTitle,
}
