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

import { useState, useCallback } from 'react'
import { iconClass } from '../../../lib/iconClass'
import { useTimerRef, useSheetRef, useHandleRef, type DrawerSide } from './smooth-drawer-hook'
import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './SmoothDrawer.css'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
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
  const [shown, setShown] = useState(defaultOpen)
  const [closing, setClosing] = useState(false)

  // ---- drag state ----
  const [drag, setDrag] = useState(0)
  const [dragging, setDragging] = useState(false)

  // ---- timers ----
  const closeTimer = useTimerRef()

  // ---- open / close helpers ----
  const openDrawer = useCallback(() => {
    closeTimer.clear()
    setDrag(0)
    setClosing(false)
    // Double rAF to let the browser paint before applying .is-open
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setShown(true)),
    )
  }, [closeTimer])

  const closeDrawer = useCallback(() => {
    setDragging(false)
    setDrag(0)
    setShown(false)
    setClosing(true)
    closeTimer.set(460, () => setClosing(false))
  }, [closeTimer])

  // ---- drag callbacks (stable, passed to useHandleRef) ----
  const handleDragChange = useCallback((delta: number, isDragging: boolean) => {
    setDrag(delta)
    setDragging(isDragging)
  }, [])

  // ---- callback refs ----
  const sheetRef = useSheetRef({ open: shown, onClose: closeDrawer })
  const handleRef = useHandleRef({
    onDragChange: handleDragChange,
    onDismiss: closeDrawer,
    side,
  })

  // ---- derived inline styles for sheet + scrim ----
  // Drag offset and closed transform are on the same axis as the side
  const isVertical = side === 'bottom' || side === 'top'
  const isLateral  = side === 'left'   || side === 'right'
  const closedTranslate =
    side === 'bottom' ? 'translateY(115%)' :
    side === 'top'    ? 'translateY(-115%)' :
    side === 'left'   ? 'translateX(-115%)' :
    /* right */         'translateX(115%)'

  const openTranslate =
    isVertical
      ? `translateY(${drag}px)`
      : `translateX(${drag}px)`

  const sheetStyle: React.CSSProperties = {
    transform: shown ? openTranslate : closedTranslate,
    transition: dragging
      ? 'none'
      : 'transform calc(0.46s * var(--anim-mult, 1)) cubic-bezier(.32,1.45,.45,1)',
  }

  // For left/right the outer shell and inner sheet animate as ONE unit:
  // the transform lives on .sd-sheet-outer (so the shell is off-screen at rest),
  // and .sd-sheet gets no transform of its own.
  const outerShellStyle: React.CSSProperties = isLateral ? sheetStyle : {}
  const innerSheetStyle: React.CSSProperties = isLateral ? {} : sheetStyle

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
      <button type="button" className="sd-trigger" onClick={openDrawer}>
        <span className={iconClass('play_arrow')} aria-hidden="true">
          play_arrow
        </span>
        Open {side.charAt(0).toUpperCase() + side.slice(1)}
      </button>

      {/* Overlay always mounted — exit animation plays before visibility hides */}
      <div className={overlayClass} aria-hidden={!shown}>
        <div
          className="sd-scrim"
          style={scrimStyle}
          onClick={closeDrawer}
          aria-hidden="true"
        />
        <div className="sd-sheet-outer" style={outerShellStyle}>
        <div
          ref={sheetRef}
          className="sd-sheet"
          style={innerSheetStyle}
          aria-modal="true"
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
                <span className="sd-title">{title}</span>
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
              <button type="button" className="btn-green sd-buy" onClick={closeDrawer}>
                <span className="sd-buy-shimmer" aria-hidden="true" />
                <span className="sd-buy-inner">
                  {primaryButtonText}
                  <span className={iconClass('close') + ' sd-buy-icon'} aria-hidden="true">
                    close
                  </span>
                </span>
              </button>

              <button type="button" className="sd-later" onClick={closeDrawer}>
                {secondaryButtonText}
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Default export — Showcase: four cards, one per side
// The component-registry imports this via slug `smooth-drawer`.
// ---------------------------------------------------------------------------
export default function SmoothDrawer(props: SmoothDrawerProps) {
  const sides: DrawerSide[] = ['bottom', 'top', 'left', 'right']

  return (
    <div className="sd-showcase">
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
