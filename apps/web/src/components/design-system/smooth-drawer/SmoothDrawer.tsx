/**
 * SmoothDrawer — Deha Design System
 * Four-sided drawer (bottom/top/left/right) with spring slide-in via CSS
 * transition, staggered content reveal via opacity delays, drag-to-dismiss
 * handle (axis matches side), scrim + ESC close. Has a PriceTag sub-component.
 *
 * Default export: Showcase rendering four DrawerInstance cards, one per side.
 * DrawerInstance: core named inner component holding all drawer logic + state.
 *
 * Props (SmoothDrawerProps):
 *   title               : string
 *   description         : string
 *   primaryButtonText   : string
 *   secondaryButtonText : string
 *   price               : number
 *   discountedPrice     : number
 *   defaultOpen         : boolean  (false by default — open only on trigger click)
 *   side                : 'bottom' | 'top' | 'left' | 'right'
 *
 * No useEffect / useLayoutEffect anywhere. All DOM side-effects (drag pointer
 * handlers + ESC keydown) live in smooth-drawer-hook.ts as callback refs.
 * Mounted-through-exit: overlay + sheet always in DOM; open/close driven by
 * CSS state classes .is-open / .is-closing + transform/opacity.
 */

import { useReducer, useCallback, useRef, useId } from 'react'
import { iconClass } from '../../../lib/iconClass'
import {
  useTimerRef,
  useSheetRef,
  useHandleRef,
  drawerReducer,
  initialDrawerState,
  type DrawerSide,
} from './smooth-drawer-hook'
import { useSquircle } from '../../../lib/hooks/use-squircle'
import { useProximityGroup } from '../../../lib/hooks/use-proximity-group'
import { tokenMs } from '@/lib/token-ms'
import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './SmoothDrawer.css'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
const INNER_SHEET_STYLE: React.CSSProperties = {}

// Faster-exits rule (plan: faster-exits-debts step 7): a drag release keeps
// the open-tier momentum curve (Apple sheets settle from the finger's
// velocity); a programmatic close (button, backdrop tap, Escape) runs one
// duration tier faster. Reads the token live via the shared helper, see
// lib/token-ms.ts.

export interface SmoothDrawerProps {
  title?: string
  description?: string
  primaryButtonText?: string
  secondaryButtonText?: string
  price?: number
  discountedPrice?: number
  defaultOpen?: boolean
  side?: DrawerSide
}

// ---------------------------------------------------------------------------
// PriceTag sub-component
// ---------------------------------------------------------------------------
function PriceTag({ price, discountedPrice }: { price: number; discountedPrice: number }) {
  return (
    <div className="sd-price">
      <div className="sd-price-amt">
        <span className="sd-price-now">${discountedPrice}</span>
        <span className="sd-price-was">${price}</span>
      </div>
      <div className="sd-price-meta">
        <span className="sd-price-lt">Lifetime access</span>
        <span className="sd-price-ot">One-time payment</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// DrawerInstance — core drawer logic; one per side in the showcase
// ---------------------------------------------------------------------------
function DrawerInstance({
  title = 'Deha — Pro',
  description = '100+ polished UI components and templates for React, Next.js, and Tailwind. Skip the design grind and focus on shipping.',
  primaryButtonText = 'Buy Now',
  secondaryButtonText = 'Maybe Later',
  price = 169,
  discountedPrice = 99,
  defaultOpen = false,
  side = 'bottom',
}: SmoothDrawerProps) {
  // ---- animation state ----
  // shown: true  = .is-open  (fully revealed)
  // closing: true = .is-closing (exit transition in progress)
  const titleId = `sd-title-${useId()}`
  const [state, dispatch] = useReducer(drawerReducer, defaultOpen, initialDrawerState)
  const { shown, closing, closeVariant, drag, dragging } = state

  // ---- timers ----
  const closeTimer = useTimerRef()

  // ---- close-source tracking (drag release keeps momentum; programmatic
  // closes run one tier faster) ----
  const closedByDragRef = useRef(false)

  // ---- focus return: closeDrawer moves focus out of the overlay before
  // aria-hidden flips (avoids Chrome's "aria-hidden retained focus" warning)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  // ---- open / close helpers ----
  const openDrawer = useCallback(() => {
    closeTimer.clear()
    closedByDragRef.current = false
    dispatch({ type: 'OPEN_START' })
    // Double rAF to let the browser paint before applying .is-open
    requestAnimationFrame(() =>
      requestAnimationFrame(() => dispatch({ type: 'OPEN_SHOWN' })),
    )
  }, [closeTimer])

  const closeDrawer = useCallback(() => {
    const byDrag = closedByDragRef.current
    if (document.activeElement instanceof HTMLElement) {
      const overlay = document.activeElement.closest('.sd-overlay')
      if (overlay) triggerRef.current?.focus()
    }
    dispatch({ type: 'CLOSE', byDrag })
    const ms = byDrag
      ? tokenMs('--duration-expand', 460)
      : tokenMs('--duration-420', 420)
    closeTimer.set(ms, () => dispatch({ type: 'CLOSE_DONE' }))
  }, [closeTimer])

  // Drag-dismiss goes through this so closeDrawer knows to keep momentum.
  const closeDrawerFromDrag = useCallback(() => {
    closedByDragRef.current = true
    closeDrawer()
  }, [closeDrawer])

  // ---- drag callbacks (stable, passed to useHandleRef) ----
  const handleDragChange = useCallback((delta: number, isDragging: boolean) => {
    dispatch({ type: 'DRAG_MOVE', drag: delta })
    dispatch({ type: isDragging ? 'DRAG_START' : 'DRAG_END' })
  }, [])

  // ---- callback refs ----
  const sheetRef = useSheetRef({ open: shown, onClose: closeDrawer })
  const handleRef = useHandleRef({
    onDragChange: handleDragChange,
    onDismiss: closeDrawerFromDrag,
    side,
  })

  // ---- squircle refs (geometry only — combined with sheetRef below) ----
  const sheetSquircleRef = useSquircle<HTMLDivElement>()
  const outerSquircleRef = useSquircle<HTMLDivElement>()
  const combinedSheetRef = useCallback(
    (el: HTMLDivElement | null) => {
      sheetRef(el)
      sheetSquircleRef(el)
    },
    [sheetRef, sheetSquircleRef],
  )

  // ---- derived inline styles for sheet + scrim ----
  // Drag offset and closed transform are on the same axis as the side
  const isVertical = side === 'bottom' || side === 'top'
  const closedTranslate =
    side === 'bottom' ? 'translateY(115%)' :
    side === 'top'    ? 'translateY(-115%)' :
    side === 'left'   ? 'translateX(-115%)' :
    /* right */         'translateX(115%)'

  const openTranslate =
    isVertical
      ? `translateY(${drag}px)`
      : `translateX(${drag}px)`

  // Programmatic closes (button/backdrop/Escape) run one tier faster than the
  // open tier; drag-released closes keep the open tier's momentum curve.
  const sheetDurationVar = closing ? closeVariant : '--duration-expand'

  const sheetStyle: React.CSSProperties = {
    transform: shown ? openTranslate : closedTranslate,
    transition: dragging
      ? 'none'
      : `transform calc(var(${sheetDurationVar}) * var(--anim-mult, 1)) cubic-bezier(.32,1.45,.45,1)`, /* motion-sweep: kept, easing curve used <3x, no exact/near token */
  }

  // The outer bezel shell and inner card sheet always animate as ONE unit on
  // every side: the transform lives on .sd-sheet-outer (so the shell is
  // off-screen at rest, matching the canon bezel+card recipe), and .sd-sheet
  // gets no transform of its own. This mirrors the left/right-only behavior
  // that used to gate the outer transform on a side check before the bezel
  // was added to bottom/top too; the numeric transform values are unchanged.
  const outerShellStyle: React.CSSProperties = sheetStyle
  const innerSheetStyle: React.CSSProperties = INNER_SHEET_STYLE

  // Scrim opacity fades as drag distance grows; use abs value for any axis
  const scrimStyle: React.CSSProperties = {
    opacity: shown ? Math.max(0, 1 - Math.abs(drag) / 340) : 0,
  }

  // ---- staggered item helper ----
  const itemProps = (i: number) => ({
    className: 'sd-item' + (shown ? ' in' : ''),
    style: {
      transitionDelay: (shown ? 130 + i * 70 : 0) + 'ms',
    } as React.CSSProperties,
  })

  // ---- overlay visibility class (mounted-through-exit) ----
  const overlayClass = [
    'sd-overlay',
    `sd-overlay--${side}`,
    shown ? 'is-open' : '',
    closing ? 'is-closing' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      {/* Trigger button to open / reopen */}
      <button type="button" className="sd-trigger" ref={triggerRef} onClick={openDrawer} data-proximity>
        <span className={iconClass('play_arrow')} aria-hidden="true">
          play_arrow
        </span>
        Open {side.charAt(0).toUpperCase() + side.slice(1)}
      </button>

      {/* Overlay always mounted — exit animation plays before visibility hides.
          Native <dialog> (non-modal `open`, no showModal()) so the drag-to-
          dismiss gesture and the existing manual Escape listener (sheet-hook)
          keep working unchanged; box-model UA defaults neutralised inline so
          .sd-overlay's own CSS (no background/border of its own) still governs
          every pixel exactly as the plain div did. */}
      <dialog open className={overlayClass} aria-hidden={!shown} aria-labelledby={titleId} style={{ background: 'none', border: 'none', margin: 0, maxWidth: 'none', maxHeight: 'none', color: 'inherit' }}>
        <div
          className="sd-scrim"
          style={scrimStyle}
          onClick={closeDrawer}
          aria-hidden="true"
        />
        <div
          className="sd-sheet-outer"
          style={outerShellStyle}
          ref={outerSquircleRef}
        >
        <div
          ref={combinedSheetRef}
          className="sd-sheet"
          style={innerSheetStyle}
          aria-label={title}
          aria-live="polite"
          data-screen-label="Smooth Drawer"
          data-side={side}
        >
          {/* Drag handle */}
          <div
            ref={handleRef}
            className="sd-handle-wrap"
          >
            <span className="sd-handle" />
          </div>

          <div className="sd-content">
            {/* Item 0: header */}
            <div {...itemProps(0)}>
              <div className="sd-head">
                <span className="sd-logo" aria-hidden="true">
                  <span className={iconClass('check')} aria-hidden="true">
                    check
                  </span>
                </span>
                <span className="sd-title" id={titleId}>{title}</span>
              </div>
            </div>

            {/* Item 1: description */}
            <div {...itemProps(1)}>
              <p className="sd-desc">{description}</p>
            </div>

            {/* Item 2: price tag */}
            <div {...itemProps(2)}>
              <PriceTag price={price} discountedPrice={discountedPrice} />
            </div>

            {/* Item 3: action buttons */}
            <div
              className={'sd-item sd-actions' + (shown ? ' in' : '')}
              style={{
                transitionDelay: (shown ? 130 + 3 * 70 : 0) + 'ms',
              }}
            >
              {/* Primary: global .btn-green — never redefine its styles here */}
              <button type="button" className="btn-green sd-buy" onClick={closeDrawer} data-proximity>
                <span className="sd-buy-shimmer" aria-hidden="true" />
                <span className="sd-buy-inner">
                  {primaryButtonText}
                  <span className={iconClass('close') + ' sd-buy-icon'} aria-hidden="true">
                    close
                  </span>
                </span>
              </button>

              <button type="button" className="sd-later" onClick={closeDrawer} data-proximity>
                {secondaryButtonText}
              </button>
            </div>
          </div>
        </div>
        </div>
      </dialog>
    </>
  )
}

// ---------------------------------------------------------------------------
// Default export — Showcase: four cards, one per side
// The component-registry imports this via slug `smooth-drawer`.
// ---------------------------------------------------------------------------
const SD_SIDES: DrawerSide[] = ['bottom', 'top', 'left', 'right']

export default function SmoothDrawer(props: SmoothDrawerProps) {
  const sides = SD_SIDES
  // One group covers all 4 stages' triggers + sheet action buttons (overlay
  // divs are always mounted per the mounted-through-exit pattern above, so
  // they're valid DOM descendants of .sd-showcase even before a drawer opens).
  const proximityRef = useProximityGroup<HTMLDivElement>()

  return (
    <div className="sd-showcase" ref={proximityRef}>
      {sides.map((side) => (
        <div key={side} className="sd-showcase-card">
          <span className="sd-showcase-label">{side.charAt(0).toUpperCase() + side.slice(1)}</span>
          <div className="sd-stage">
            <DrawerInstance {...props} side={side} defaultOpen={false} />
          </div>
        </div>
      ))}
    </div>
  )
}
