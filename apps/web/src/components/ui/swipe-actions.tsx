// Compound namespace pattern — sub-components exported individually for fast-refresh.
/* eslint-disable react-refresh/only-export-components */
import * as React from 'react'
import { m, useReducedMotion } from 'framer-motion'
import { useDrag } from '@use-gesture/react'
import { swipeReveal } from '@deha/motion-tokens'
import { cn } from '@/lib/utils'
import { SwipeActionsContext, useSwipeActionsContext } from './swipe-actions-context'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SwipeActionsRootProps {
  children: React.ReactNode
  className?: string
  /** Called when left reveal is committed (velocity or threshold). */
  onLeftAction?: () => void
  /** Called when right reveal is committed (velocity or threshold). */
  onRightAction?: () => void
}

interface SwipeActionsContentProps {
  children: React.ReactNode
  className?: string
}

interface SwipeActionsSlotProps {
  children: React.ReactNode
  className?: string
}

// ---------------------------------------------------------------------------
// LeftActions + RightActions — reveal slots
// They measure their own width so Root can compute thresholds.
// ---------------------------------------------------------------------------
function LeftActions({ children, className }: SwipeActionsSlotProps) {
  const { leftWidth } = useSwipeActionsContext()
  return (
    <div
      aria-hidden="true"
      className={cn(
        'absolute inset-y-0 left-0 flex items-stretch overflow-hidden',
        className,
      )}
      style={{ width: leftWidth || 'auto' }}
    >
      {children}
    </div>
  )
}
LeftActions.displayName = 'SwipeActions.LeftActions'

function RightActions({ children, className }: SwipeActionsSlotProps) {
  const { rightWidth } = useSwipeActionsContext()
  return (
    <div
      aria-hidden="true"
      className={cn(
        'absolute inset-y-0 right-0 flex items-stretch overflow-hidden',
        className,
      )}
      style={{ width: rightWidth || 'auto' }}
    >
      {children}
    </div>
  )
}
RightActions.displayName = 'SwipeActions.RightActions'

// ---------------------------------------------------------------------------
// Content — the draggable row foreground
// ---------------------------------------------------------------------------
function Content({ children, className }: SwipeActionsContentProps) {
  return (
    <div className={cn('relative z-10 bg-white dark:bg-neutral-900', className)}>
      {children}
    </div>
  )
}
Content.displayName = 'SwipeActions.Content'

// ---------------------------------------------------------------------------
// Root — orchestrates drag, spring, threshold logic
// ---------------------------------------------------------------------------
function Root({ children, className, onLeftAction, onRightAction }: SwipeActionsRootProps) {
  const prefersReduced = useReducedMotion()

  // Measure reveal slot widths from child components.
  const leftRef = React.useRef<HTMLDivElement>(null)
  const rightRef = React.useRef<HTMLDivElement>(null)
  const [leftWidth, setLeftWidth] = React.useState(0)
  const [rightWidth, setRightWidth] = React.useState(0)

  // Parse children to locate LeftActions, RightActions, Content
  const { left, right, content } = React.useMemo(() => {
    const arr = React.Children.toArray(children)
    let left: React.ReactNode = null
    let right: React.ReactNode = null
    const contentNodes: React.ReactNode[] = []

    for (const child of arr) {
      if (!React.isValidElement(child)) {
        contentNodes.push(child)
        continue
      }
      const type = child.type as { displayName?: string }
      if (type?.displayName === 'SwipeActions.LeftActions') left = child
      else if (type?.displayName === 'SwipeActions.RightActions') right = child
      else if (type?.displayName === 'SwipeActions.Content') contentNodes.push(child)
      else contentNodes.push(child)
    }

    return { left, right, content: contentNodes }
  }, [children])

  // Measure reveal widths after mount.
  const measureLeft = React.useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    ;(leftRef as React.MutableRefObject<HTMLDivElement | null>).current = node
    // Temporarily reveal to measure natural width
    node.style.width = 'auto'
    const w = node.getBoundingClientRect().width
    node.style.width = ''
    setLeftWidth(w)
  }, [])

  const measureRight = React.useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    ;(rightRef as React.MutableRefObject<HTMLDivElement | null>).current = node
    node.style.width = 'auto'
    const w = node.getBoundingClientRect().width
    node.style.width = ''
    setRightWidth(w)
  }, [])

  // Drag state
  const [dragX, setDragX] = React.useState(0)
  const [animating, setAnimating] = React.useState(false)
  const COMMIT_THRESHOLD = 0.5 // 50% of reveal width
  const VELOCITY_COMMIT = 0.8  // use-gesture reports px/ms

  const spring = swipeReveal({ reducedMotion: prefersReduced ?? false })

  const bind = useDrag(
    ({ movement: [mx], velocity: [vx], direction: [dx], last, cancel }) => {
      if (animating) { cancel?.(); return }

      const limit = mx > 0 ? leftWidth : rightWidth
      // Allow drag only if the relevant slot exists
      if (limit === 0 && ((mx > 0 && !left) || (mx < 0 && !right))) {
        setDragX(0)
        return
      }
      if (mx > 0 && !left) { setDragX(0); return }
      if (mx < 0 && !right) { setDragX(0); return }

      if (!last) {
        // Elastic resistance beyond reveal width
        if (Math.abs(mx) > limit) {
          const overflow = Math.abs(mx) - limit
          const elastic = limit + overflow * 0.2
          setDragX(mx > 0 ? elastic : -elastic)
        } else {
          setDragX(mx)
        }
        return
      }

      // On release: decide commit vs. snap-back
      const absX = Math.abs(dragX)
      const side: 'left' | 'right' = mx >= 0 ? 'left' : 'right'
      const revealLimit = side === 'left' ? leftWidth : rightWidth
      const velocityCommit = Math.abs(vx) > VELOCITY_COMMIT && dx === (side === 'left' ? 1 : -1)
      const thresholdCommit = absX >= revealLimit * COMMIT_THRESHOLD

      if ((velocityCommit || thresholdCommit) && revealLimit > 0) {
        // Snap to open
        setAnimating(true)
        setDragX(side === 'left' ? revealLimit : -revealLimit)
        if (side === 'left') onLeftAction?.()
        else onRightAction?.()
        setTimeout(() => setAnimating(false), 400)
      } else {
        // Snap back
        setAnimating(true)
        setDragX(0)
        setTimeout(() => setAnimating(false), 400)
      }
    },
    { axis: 'x', filterTaps: true, from: () => [dragX, 0] },
  )

  const ctxValue = React.useMemo(
    () => ({ leftWidth, rightWidth, onLeftAction, onRightAction }),
    [leftWidth, rightWidth, onLeftAction, onRightAction],
  )

  return (
    <SwipeActionsContext.Provider value={ctxValue}>
      <ul className={cn('list-none m-0 p-0', className)}>
        <li
          className="relative overflow-hidden select-none touch-pan-y"
        >
          {/* Hidden measurement wrappers */}
          {left && (
            <div ref={measureLeft} className="absolute inset-y-0 left-0 flex items-stretch" style={{ visibility: 'hidden', pointerEvents: 'none' }}>
              {left}
            </div>
          )}
          {right && (
            <div ref={measureRight} className="absolute inset-y-0 right-0 flex items-stretch" style={{ visibility: 'hidden', pointerEvents: 'none' }}>
              {right}
            </div>
          )}

          {/* Visible reveal underlays */}
          {left && dragX > 0 && (
            <div className="absolute inset-y-0 left-0 flex items-stretch" style={{ width: leftWidth }}>
              {left}
            </div>
          )}
          {right && dragX < 0 && (
            <div className="absolute inset-y-0 right-0 flex items-stretch" style={{ width: rightWidth }}>
              {right}
            </div>
          )}

          {/* Draggable content — bind() goes on a plain div to avoid framer-motion onDrag type collision */}
          <div
            {...bind()}
            className="relative z-10 cursor-grab active:cursor-grabbing"
            style={{ touchAction: 'pan-y' }}
          >
            <m.div
              animate={{ x: dragX }}
              transition={spring}
              data-testid="swipe-content"
            >
              {content}
            </m.div>
          </div>
        </li>
      </ul>
    </SwipeActionsContext.Provider>
  )
}
Root.displayName = 'SwipeActions.Root'

// ---------------------------------------------------------------------------
// Namespace export
// ---------------------------------------------------------------------------
export { Root, LeftActions, RightActions, Content }
export const SwipeActions = { Root, LeftActions, RightActions, Content }
