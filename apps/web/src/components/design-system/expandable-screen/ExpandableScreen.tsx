import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './ExpandableScreen.css'

// ---------------------------------------------------------------------------
// Expandable Screen — Deha Design System
// A trigger card morphs (CSS FLIP) into a full-screen overlay: the trigger
// button's measured DOMRect becomes the overlay's `from` geometry, then a
// two-tick flip (mount at `from`, force a reflow, flip to `open` 20ms later)
// lets the top/left/width/height/border-radius transition animate from the
// card's exact on-screen position to 0/0/100vw/100vh. Escape and the close
// button collapse back to the trigger's (re-measured) rect.
//
// Faithful port of
// apps/web/design-system/claude-design/raw/expandable-screen/expandable-screen.html
// — byte-preserved DOM/CSS/timings/behavior per CONVERSION-SOP.md. The
// sibling expandable-screen.jsx is a generic composable
// ExpandableScreen/Trigger/Content/Background API with no baked-in demo
// content (no waitlist copy/markup at all), so it is not pixel-comparable
// to the HTML demo the gate diffs against (CONVERSION-SOP's canonical
// source path is <slug>.html, and the gate script itself only ever reads
// <slug>.html). Its phase state machine (idle/from/open + rect + closing)
// is functionally identical to the HTML's own inline `Component` class, so
// it was read for confirmation only; the hooks state machine below follows
// the .html's own class methods (expand/collapse/renderVals) directly, same
// precedent as BlurCarousel.tsx's jsx-for-confirmation-only note.
//
// No motion tokenization in this pass (plan context: ds-rebuild-w2). Two
// literal values below happened to byte-match existing motion-tokens.css
// tiers exactly, so they route through var(...) as value-identical
// substitution (see FADE_EASE / QUICK_MS / HOVER_MS below); FLIP_EASE has
// no matching token (no cubic-bezier(0.32, 0.72, 0, 1) tier exists) and
// stays a raw literal per CONVERSION-SOP ("never mint tokens, never change
// values") — kept in its own named const, decoupled from the transition
// string it's interpolated into, same as the raw source's own `ease`
// variable.
//
// (plan: debt2-expandable Step 1) Prototype-picker harness (proto/
// ProtoPicker.tsx, proto/variants.css, proto/picker-css.ts) removed: Bora
// chose the main Shared-Element variant, so overlayGeometry's sheet/
// crossfade branches and the picker chrome are gone. main keeps only its
// own FLIP branch.
// ---------------------------------------------------------------------------

import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { tokenMs } from '@/lib/token-ms'
import { ExpandableScreenTrigger } from './ExpandableScreenTrigger'
import { ExpandableScreenOverlayContent } from './ExpandableScreenOverlayContent'

type Phase = 'idle' | 'from' | 'open'

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

// byte-preserved defaults from the raw source's Component.duration() /
// triggerRadius() / contentRadius() (props.animationDuration ?? 0.45 etc).
// The tweaks-panel range/enum editors that let claude.ai/design vary these
// are ambient authoring tooling outside the component, same exclusion as
// BlurCarousel.tsx's `.controls` panel; this port fixes them at their
// documented defaults.
// Raw source: const ease = 'cubic-bezier(0.32, 0.72, 0, 1)'. No token in
// motion-tokens.css matches this curve exactly.
const FLIP_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)'
// Apple standard (house rule): present in 0.4s, no bounce, on the sheet
// curve above (FLIP_EASE); wired to --anim-mult so the global multiplier
// reaches the open leg. Close stays one tier faster on --duration-380.
const OPEN_DUR = 'calc(var(--duration-400) * var(--anim-mult, 1))'
// Raw source's bare `ease` keyword (opacity fades) == motion-tokens.css
// --ease-fade's cubic-bezier(.25, .1, .25, 1) expansion exactly (that
// token's own comment states it is the bare-keyword equivalent).
const FADE_EASE = 'var(--ease-fade)'
// Raw source literal 0.15s == motion-tokens.css --duration-150 exactly.
const QUICK_MS = 'var(--duration-150)'
// Raw source literal 0.2s == motion-tokens.css --duration-200 exactly.
const HOVER_MS = 'var(--duration-200)'
const TRIGGER_RADIUS = '100px'
const CONTENT_RADIUS = '24px'
// Expanded surface breathing room (edge-adjacency fix): a consistent inset
// on all four sides instead of the old flush 0/0/100vw/100vh geometry.
const SCREEN_INSET = '24px'
// The overlay is portaled to document.body, so it leaves .es-demo-root's
// z-index 2147483647 layer; it re-enters at the same top layer (last body
// child wins the tie) instead of the old in-root z-index 50.
const OVERLAY_Z = 2147483647

const SYM_STYLE: CSSProperties = { fontFamily: "'Material Symbols Outlined'" }

// Faster-exits rule (plan: faster-exits-debts step 7): collapse is always a
// programmatic close (no drag path on this component), so it always runs the
// faster --duration-380 tier while the open (expand) leg keeps its
// OPEN_DUR (--duration-400, Apple standard). Reads the token live via the
// shared helper, see lib/token-ms.ts.

// Byte-preserved FLIP: the overlay's box literally becomes the trigger's
// measured rect, then top/left/width/height/border-radius interpolate to
// the inset full-screen geometry.
function overlayGeometry(open: boolean, rect: Rect | null, closing: boolean): { geo: CSSProperties; transition: string } {
  const geo: CSSProperties = open
    ? {
        top: SCREEN_INSET,
        left: SCREEN_INSET,
        width: `calc(100vw - ${SCREEN_INSET} * 2)`,
        height: `calc(100vh - ${SCREEN_INSET} * 2)`,
        borderRadius: CONTENT_RADIUS,
      }
    : rect
      ? { top: `${rect.top}px`, left: `${rect.left}px`, width: `${rect.width}px`, height: `${rect.height}px`, borderRadius: TRIGGER_RADIUS }
      : {}
  const dur = closing ? 'calc(var(--duration-380) * var(--anim-mult, 1))' : OPEN_DUR
  return {
    geo,
    transition: `top ${dur} ${FLIP_EASE}, left ${dur} ${FLIP_EASE}, width ${dur} ${FLIP_EASE}, height ${dur} ${FLIP_EASE}, border-radius ${dur} ${FLIP_EASE}`,
  }
}

export default function ExpandableScreenDemo() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [closing, setClosing] = useState(false)
  const [joined, setJoined] = useState(false)
  const rectRef = useRef<Rect | null>(null)
  const triggerElRef = useRef<HTMLButtonElement | null>(null)
  const overlayElRef = useRef<HTMLDivElement | null>(null)
  const pendingOpenRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  // Latest-value ref read by the root callback ref's window listener below
  // (attached once at mount, never re-subscribed), same "read via ref instead
  // of a dependency-array effect" shape as use-squircle.ts's module registry.
  // Updated only from event-handler callbacks below (never assigned during
  // render) via setPhaseTracked, so react-doctor's no-ref-current-in-render
  // check has nothing to flag.
  const phaseRef = useRef<Phase>(phase)
  const setPhaseTracked = useCallback((next: Phase) => {
    phaseRef.current = next
    setPhase(next)
  }, [])

  const measure = (): Rect | null => {
    const el = triggerElRef.current
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { top: r.top, left: r.left, width: r.width, height: r.height }
  }

  const expand = useCallback(() => {
    const rect = measure()
    if (!rect) return
    rectRef.current = rect
    // Guard a re-fire landing inside a still-running collapse: the pending
    // settle timer would otherwise slam phase back to 'idle' mid-open.
    clearTimeout(timerRef.current)
    document.body.style.overflow = 'hidden'
    setClosing(false)
    setPhaseTracked('from')
    pendingOpenRef.current = true
    // Mirrors raw's componentDidUpdate (force a reflow of the freshly
    // committed 'from' geometry, then flip to 'open' next tick so the
    // top/left/width/height transition has a real starting frame) without a
    // phase-keyed effect: React flushes and paints the 'from' state before a
    // requestAnimationFrame queued from this same event handler runs, so the
    // read below is never stale.
    requestAnimationFrame(() => {
      if (!pendingOpenRef.current) return
      pendingOpenRef.current = false
      const el = overlayElRef.current
      if (el) void el.offsetWidth
      timerRef.current = setTimeout(() => setPhaseTracked('open'), 20)
    })
  }, [])

  const collapse = useCallback(() => {
    // Deliberately NOT re-entrancy-guarded: a second close during the collapse
    // window re-measures and restarts the settle timer, which is what the
    // locked animation-spam contract for this slug exercises (see the scratch
    // report; a `closingRef` early-return regressed that suite).
    const rect = measure()
    if (rect) rectRef.current = rect
    setPhaseTracked('from')
    setClosing(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      document.body.style.overflow = ''
      setPhaseTracked('idle')
      setClosing(false)
      setJoined(false)
    }, tokenMs('--duration-380', 380) + 60)
  }, [])

  // Mount-once Escape listener + body-overflow/timer teardown. `collapse` has
  // an empty dependency array so it never goes stale inside this closure;
  // `phaseRef` (kept current via setPhaseTracked) stands in for the old
  // effect's `phase` dependency so the handler always reads the live phase
  // without re-subscribing on every phase change. useLayoutEffect, not the
  // banned render-phase hook, so react-doctor's effect-needs-cleanup check,
  // which only recognizes addEventListener paired with a returned cleanup
  // inside an actual effect hook, can see the teardown below.
  const rootRef = useRef<HTMLDivElement | null>(null)
  useLayoutEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phaseRef.current === 'open') collapse()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      clearTimeout(timerRef.current)
    }
  }, [collapse])

  const open = phase === 'open'
  const active = phase !== 'idle' && rectRef.current !== null
  const rect = rectRef.current

  const { geo, transition: overlayTransition } = overlayGeometry(open, active ? rect : null, closing)

  const overlayStyle: CSSProperties = active
    ? {
        position: 'fixed',
        zIndex: OVERLAY_Z,
        overflow: 'hidden',
        background: '#10B981',
        backgroundImage:
          'linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px), radial-gradient(ellipse at top right, rgba(255,255,255,0.18) 0%, transparent 55%)',
        backgroundSize: '24px 24px, 24px 24px, 100% 100%',
        boxShadow: '0 10px 40px -10px rgba(16,185,129,0.5), inset 0 1px 0 rgba(255,255,255,0.3)',
        transition: overlayTransition,
        willChange: 'top, left, width, height',
        ...geo,
      }
    : { display: 'none' }

  const contentStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: open ? 1 : 0,
    transform: open ? 'scale(1)' : 'scale(0.97)',
    transition: open
      ? `opacity calc(var(--duration-400) * var(--anim-mult, 1) * 0.7) ${FADE_EASE} calc(var(--duration-400) * var(--anim-mult, 1) * 0.35), transform calc(var(--duration-400) * var(--anim-mult, 1) * 0.7) ${FLIP_EASE} calc(var(--duration-400) * var(--anim-mult, 1) * 0.35)`
      : `opacity calc(var(--duration-380) * var(--anim-mult, 1) * 0.35) ${FADE_EASE}, transform calc(var(--duration-380) * var(--anim-mult, 1) * 0.35) ${FLIP_EASE}`,
    overflowY: open ? 'auto' : 'hidden',
    pointerEvents: open ? 'auto' : 'none',
    willChange: 'opacity, transform',
  }

  const closeBtnStyle: CSSProperties = {
    position: 'absolute',
    top: '24px',
    right: '24px',
    zIndex: 2,
    width: '44px',
    height: '44px',
    borderRadius: '9999px',
    border: '1px solid rgba(255,255,255,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    opacity: open ? 1 : 0,
    transition: `opacity ${QUICK_MS} ${FADE_EASE} ${open ? 'calc(var(--duration-400) * var(--anim-mult, 1) * 0.5)' : '0s'}, background ${HOVER_MS} ${FADE_EASE}`,
  }

  // F36 fix: the trigger's underlying default values are never hidden by
  // JS state (the old `textVisible` flag forced opacity 0 for the entire
  // open+collapse window, only restoring it once the FLIP fully settled —
  // that JS-driven hide, not the visual covering, was why the content read
  // as "gone" instead of merely covered like a popover). The overlay's own
  // z-index and the `.es-scrim` blur are what visually cover the trigger
  // while expanded; this element's own opacity stays 1 throughout, so its
  // computed style and DOM text are always present and never forced out.
  const triggerWrapStyle: CSSProperties = {
    opacity: 1,
    pointerEvents: active ? 'none' : 'auto',
  }

  const submit = () => setJoined(true)
  const submitLabel = joined ? "You're on the list" : 'Join the waitlist'
  const submitIcon = joined ? 'check_circle' : 'mail'

  return (
    <div className="es-demo-root" ref={rootRef}>
      <div
        data-screen-label="Expandable Screen — Desktop"
        style={{
          minHeight: '100vh',
          background: '#FFFFFF',
          backgroundImage: 'var(--bg-section-grid)',
          backgroundSize: '24px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-display)',
          padding: '48px',
        }}
      >
        {/* Trigger card */}
        <ExpandableScreenTrigger wrapStyle={triggerWrapStyle} onExpand={expand} triggerRef={triggerElRef} />

        {/* Morphing overlay — portaled to document.body so no transformed
            ancestor (the gallery reveal wrapper) can re-cage its position:fixed
            containing block. FLIP geometry is unaffected: both the `from` rect
            (getBoundingClientRect, always viewport-relative) and the `open`
            geometry (0/0/100vw/100vh) are viewport-relative in either tree. */}
        {createPortal(
          <>
          {/* Background blur scrim: stays mounted in every state and is
              state-classed ([[mounted-through-exit-css-animations]]), so its
              fade-out plays through the collapse instead of disappearing the
              instant `open` flips. Before the overlay in the portal, so it
              sits above .es-demo-root and below the morphing surface. */}
          <div className="es-scrim" {...(open ? { 'data-open': '' } : null)} />
          <div
            ref={overlayElRef}
            className="es-overlay"
            {...(open ? { 'data-open': '' } : null)}
            {...(joined ? { 'data-joined': '' } : null)}
            style={overlayStyle}
          >
          <button type="button" className="es-close-btn" onClick={collapse} aria-label="Close" style={closeBtnStyle}>
            <span className="material-symbols-outlined" style={{ ...SYM_STYLE, fontSize: '22px', color: '#FFFFFF' }}>
              close
            </span>
          </button>

          <div className="es-content" style={contentStyle}>
            <ExpandableScreenOverlayContent submitLabel={submitLabel} submitIcon={submitIcon} onSubmit={submit} />
          </div>
          </div>
          </>,
          document.body,
        )}
      </div>
    </div>
  )
}
