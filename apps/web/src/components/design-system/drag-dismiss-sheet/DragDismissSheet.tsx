/**
 * DragDismissSheet — Deha Design System
 * Bottom sheet with a physically accurate drag-to-dismiss handle: 1:1 pointer
 * tracking, rubber-band resistance past the resting position, spring-back or
 * momentum dismiss decided by the PROJECTED endpoint (position + velocity),
 * never position alone. Reduced-motion users get an instant position jump
 * paired with the CSS opacity fade (no sustained travel animation).
 *
 * No useEffect anywhere (hard rule): @use-gesture's `useDrag` owns its own
 * pointer listeners, and framer-motion's `useMotionValue` + `motion.div`
 * mutate the DOM's `transform` imperatively -- neither needs a React effect.
 * `from: () => [0, y.get()]` reads the live presentation value on every new
 * grab, so a re-grab mid-flight (open, spring-back, or dismiss) picks up
 * exactly where the sheet visually is instead of snapping to origin.
 *
 * Mounted-through-exit (lessons/mounted-through-exit-css-animations): the
 * overlay/scrim/sheet subtree is ALWAYS rendered. Open/closed is a
 * `data-state` attribute driving CSS opacity only; the sheet's vertical
 * position is 100% JS (never a CSS transform transition), because CSS
 * transitions cannot be smoothly re-targeted mid-flight (apple-design skill
 * §3; apple-physics-to-web.md §11's "reversing shortening factor") and this
 * sheet must stay interruptible through open, spring-back, and dismiss.
 *
 * Physics sources (see READ-REPORT in the step's completion report):
 *   - apple-physics-to-web.md §3    -- projected-endpoint formula
 *   - apple-physics-to-web.md §5-6  -- velocity handoff into the spring, ζ=0
 *   - gesture-velocity-handoff.md §1, §2, §4 -- `from`, rubberband vs bounds,
 *     swipe commit gate paired with projection
 *
 * Interaction breakdown (emil-design-eng mandatory protocol):
 *   | Part           | Interaction        | Animate? | Primitive                | Easing           | Duration                          |
 *   |----------------|---------------------|----------|--------------------------|------------------|-------------------------------------|
 *   | Trigger button | press               | yes      | CSS transition           | var(--ease-out)  | var(--duration-fast)                |
 *   | Scrim          | entrance/exit       | yes      | CSS transition           | var(--ease-fade) | var(--duration-slow)                |
 *   | Sheet position | entrance/exit/drag  | yes      | JS spring (MotionValue)  | n/a (physics)    | var(--duration-slow) * anim-mult    |
 *   | Sheet opacity  | entrance/exit       | yes      | CSS transition           | var(--ease-fade) | var(--duration-slow)                |
 *   | Handle grip    | press (grab)        | yes      | CSS transition           | var(--ease-out)  | var(--duration-fast)                |
 *   | Close button   | press               | yes      | CSS transition           | var(--ease-out)  | var(--duration-fast)                |
 */

import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, useMotionValue } from 'framer-motion'
import { animate } from 'framer-motion/dom'
import { useDrag } from '@use-gesture/react'
import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './DragDismissSheet.css'

// ---------------------------------------------------------------------------
// Physics constants
// ---------------------------------------------------------------------------

/**
 * apple-physics-to-web.md §3: continuous-decay projected distance,
 * s = -0.001 * v0 / ln(lambda). lambda = 0.998 matches that file's own
 * unit-test fixture (-1/ln(0.998) ~= 499.0, vs the Euler approximation's
 * 499.5); the exact log form is used here since it only runs once per
 * release, not per frame.
 */
const PROJECTION_LAMBDA = 0.998

function projectedTravel(velocityPxPerSec: number): number {
  return (-0.001 * velocityPxPerSec) / Math.log(PROJECTION_LAMBDA)
}

/**
 * gesture-velocity-handoff.md §4 defaults. These gate WHETHER a release
 * counts as an intentional swipe; apple-physics-to-web.md §3's projection
 * above decides WHERE the projected endpoint lands. A recognized downward
 * swipe always commits to dismiss; independently, a slower drag whose
 * projected endpoint alone crosses DISMISS_RATIO also dismisses -- so the
 * decision always runs through position + velocity, never position alone.
 */
const SWIPE_CONFIG = { distance: 50, velocity: 0.5, duration: 250 } as const
const DISMISS_RATIO = 0.5

/**
 * gesture-velocity-handoff.md §2: @use-gesture's own `rubberband` elasticity
 * defaults to 0.15 and is a DIFFERENT number from apple-design skill §9's
 * hand-rolled 0.55 constant (a from-scratch resistance curve for code that
 * isn't going through @use-gesture's bounds/rubberband pair at all). This
 * component drives resistance entirely through `bounds` + `rubberband: true`,
 * so only the 0.15-family default applies; the 0.55 constant is deliberately
 * NOT ported into this config.
 */
const RUBBER_TOP_MAX = 64
const DEFAULT_SHEET_TRAVEL = 420
const CLOSED_MARGIN = 24

function readAnimMult(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--anim-mult').trim()
  const parsed = raw === '' ? 1 : parseFloat(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

function readDurationSeconds(token: string, fallbackMs: number): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim()
  const ms = raw ? parseFloat(raw) : fallbackMs
  return (Number.isFinite(ms) ? ms : fallbackMs) / 1000
}

function isMotionDisabled(): boolean {
  if (readAnimMult() <= 0) return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export default function DragDismissSheet() {
  const [open, setOpen] = useState(false)
  const y = useMotionValue(DEFAULT_SHEET_TRAVEL)
  const sheetRef = useRef<HTMLDivElement | null>(null)
  const animRef = useRef<ReturnType<typeof animate> | null>(null)

  const sheetTravel = () => (sheetRef.current?.offsetHeight ?? DEFAULT_SHEET_TRAVEL) + CLOSED_MARGIN

  const springDuration = () => readDurationSeconds('--duration-slow', 220) * readAnimMult()

  const openSheet = () => {
    setOpen(true)
    animRef.current?.stop()
    if (isMotionDisabled()) {
      y.set(0)
      animRef.current = null
      return
    }
    animRef.current = animate(y, 0, { type: 'spring', velocity: 0, bounce: 0, duration: springDuration() })
  }

  /** Spring-back (apple-physics-to-web.md §5-6): rest = 0, initial velocity =
   *  release velocity, bounce 0 (critically damped) for a clean settle. */
  const springBack = (releaseVelocity: number) => {
    if (isMotionDisabled()) {
      y.set(0)
      animRef.current = null
      return
    }
    animRef.current = animate(y, 0, {
      type: 'spring',
      velocity: releaseVelocity,
      bounce: 0,
      duration: springDuration(),
    })
  }

  /** Dismiss / non-drag close: animates to fully off-screen, THEN flips
   *  `open` false via the animation's own `.then()` -- never sooner -- so
   *  the sheet (and its handle) stays grabbable and visible for the whole
   *  flight, satisfying apple-design skill §3's interruptibility rule for
   *  the exact "closing modal grabbed again" case it names. */
  const settleClosed = (releaseVelocity: number) => {
    const travel = sheetTravel()
    if (isMotionDisabled()) {
      y.set(travel)
      animRef.current = null
      setOpen(false)
      return
    }
    const controls = animate(y, travel, {
      type: 'spring',
      velocity: releaseVelocity,
      bounce: 0,
      duration: springDuration(),
    })
    animRef.current = controls
    controls.then(() => setOpen(false))
  }

  const closeSheet = () => settleClosed(0)

  const bind = useDrag(
    (state) => {
      const { down, first, last, offset, velocity, direction, swipe } = state
      if (first) animRef.current?.stop()
      const oy = offset[1]
      if (down) {
        y.set(oy)
        return
      }
      if (!last) return
      // gesture-velocity-handoff.md §4 example: sign-aware release velocity
      // in px/s, from the raw drag state (not gated on `swipe` firing).
      const releaseVelocity = velocity[1] * direction[1] * 1000
      const travel = sheetTravel()
      // apple-physics-to-web.md §3: the dismissal decision runs off the
      // PROJECTED endpoint (position + projected travel), never `oy` alone.
      const projected = oy + projectedTravel(releaseVelocity)
      const shouldDismiss = swipe[1] === 1 || projected >= travel * DISMISS_RATIO
      if (shouldDismiss) {
        settleClosed(releaseVelocity)
      } else {
        springBack(releaseVelocity)
      }
    },
    {
      // gesture-velocity-handoff.md §1: read the live presentation value so
      // a re-grab mid-animation starts from where the sheet visually is.
      //
      // BUG FIX (STUCK AT UP, root cause): @use-gesture's `computeRubberband`
      // (rubberbandIfOutOfBounds) re-derives its elastic curve from whatever
      // raw position it is handed, treating anything past `bounds` as "still
      // travelling away from the bound" and re-compressing it. `y.get()` can
      // legitimately sit PAST `-RUBBER_TOP_MAX` while the sheet is mid rubber-
      // band-overshoot or mid spring-back (confirmed via instrumented log: a
      // release at the rubberband edge reports offset clamped to exactly
      // -RUBBER_TOP_MAX while `y` itself is still further out, e.g. -83).
      // Feeding that already-out-of-bounds value straight into `from` means a
      // re-grab (up -> down -> up, rapid reversals, or a quick re-grab during
      // spring-back) hands the engine a position it re-runs through the
      // elastic formula a SECOND time. Confirmed directly (both at the pure-
      // math level against the installed rubberbandIfOutOfBounds function,
      // and via precise in-browser instrumentation): pre-fix, a re-grab at
      // y=-71.8 computes an arbitrary first-frame offset of -65.1 -- a value
      // that depends on exactly how far out of bounds `y` had drifted, so it
      // differs on every re-grab and can compound differently each time.
      // Clamping `from` to the same range `bounds` enforces makes a re-grab
      // always hand the engine a value already at the boundary: a STABLE
      // fixed point (re-clamping -RUBBER_TOP_MAX always returns
      // -RUBBER_TOP_MAX unchanged), so repeated re-grabs converge instead of
      // drifting to a new arbitrary value each time.
      from: () => [0, clamp(y.get(), -RUBBER_TOP_MAX, sheetTravel() * 1.4)],
      axis: 'y',
      bounds: () => ({ top: -RUBBER_TOP_MAX, bottom: sheetTravel() * 1.4 }),
      rubberband: true,
      swipe: SWIPE_CONFIG,
      filterTaps: true,
    },
  )

  // BUG FIX (CLIPPING on drag-up, root cause): `.dds-overlay` is `position:
  // fixed`, which normally resolves against the viewport -- but a `transform`
  // on ANY ancestor (verified live: the gallery's `PreviewFrame` reveal
  // wrapper applies a transient `translateY(...) rotate(...)` to its preview
  // pane on mount, confirmed via getComputedStyle polling) creates a new
  // containing block for fixed descendants, so the overlay resolves against
  // that ancestor's (rotated/offset) box instead of the viewport. Once that
  // happens, `.dds-demo`'s own `overflow: hidden` (plus the surrounding
  // layout chrome's overflow-hidden wrappers) clips the sheet -- confirmed
  // live: forcing that ancestor transform reproduced an overlay bounding box
  // of ~1092x2475 instead of the 1280x800 viewport, with the sheet rendered
  // far outside the visible area. Rendering the overlay subtree through a
  // portal to `document.body` removes it from that DOM subtree entirely, so
  // no ancestor transform can ever hijack its containing block again.
  // Mounted-through-exit is preserved: the portalled subtree is always
  // rendered (never `{open && ...}`), `data-state` still drives visibility.
  return (
    <div className="dds-demo">
      <button type="button" className="dds-trigger" onClick={openSheet}>
        Open sheet
      </button>

      {createPortal(
        <div className="dds-overlay" data-state={open ? 'open' : 'closed'} aria-hidden={!open}>
          <div className="dds-scrim" onClick={closeSheet} />

          <motion.div
            ref={sheetRef}
            className="dds-sheet"
            data-state={open ? 'open' : 'closed'}
            style={{ y }}
            role="dialog"
            aria-modal="true"
            aria-label="Drag dismiss sheet"
          >
            {/* gesture-velocity-handoff.md §3: touch-action: none is safe on
                this small handle only -- never on the whole sheet body. */}
            <div className="dds-handle" {...bind()} style={{ touchAction: 'none' }} />
            <div className="dds-content">
              <h2 className="dds-title">Drag to dismiss</h2>
              <p className="dds-desc">
                Drag the handle down to dismiss, or flick it — the release velocity
                projects where the sheet lands, not just where you let go.
              </p>
              <button type="button" className="dds-close" onClick={closeSheet}>
                Close
              </button>
            </div>
          </motion.div>
        </div>,
        document.body,
      )}
    </div>
  )
}
