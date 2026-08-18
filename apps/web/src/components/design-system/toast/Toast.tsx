import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { useAutoHeight } from '@/lib/hooks/use-auto-height'
import { VARIANTS, type VariantCfg } from './proto/variants'
// Same two per-component imports as Dropdown.tsx / ExpandableScreen.tsx /
// ExpandableCard.tsx et al: _base.css supplies `.shell` / `.shell.zoom` /
// `.label`, and (via its own `@import url('../colors_and_type.css')`, which
// Vite resolves for a component-level import but which does NOT survive
// global.css's Tailwind-processed import chain) the colors_and_type token set
// this source binds inline — --type-mini / --type-h4 / --fg1 / --fg4 /
// --bg-app / --bg-chip / --tracking-wider. Without it those inline var()
// references are invalid at computed-value time and silently fall back to
// inherited values.
import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './Toast.css'

// ---------------------------------------------------------------------------
// Toast — Deha Design System
// A demo trigger card (semantic + recipe buttons, top/bottom position
// segment, dismiss-all) driving two fixed toast viewports: stacked toasts
// that peek behind the front one, spring in and out, and optionally expand
// on press.
//
// Canonical source per CONVERSION-SOP.md:
// apps/web/design-system/claude-design/raw/toast/toast.html — the `<x-dc>` /
// `class Component extends DCLogic` prototype Bora sees on claude.ai/design.
// Everything below is that file's own markup and its Component class's own
// state machine (show/setPhase/startExit/toggleExpand/vm/group/renderVals),
// transposed to React. Every DOM class name, nesting order, inline style
// value, duration and easing is the raw file's; adaptation is limited to
// module packaging, TS types, and the two `style-hover=`/`style-active=`
// attributes the `<x-dc>` DSL declares inline and React cannot (moved to
// .ts-pill-btn / .ts-close-btn in Toast.css, values unchanged).
//
// The sibling `Toast (1).jsx` in that same raw dir is a generic
// provider/hook toast API (ToastProvider + useToast, no baked-in demo card,
// no top/bottom segment, no expandable recipe), so it is not
// pixel-comparable to the .html demo the gate diffs against; it was read for
// confirmation of the stacking math only. Same jsx-for-confirmation-only
// precedent as ExpandableCard.tsx / BlurCarousel.tsx / ExpandableScreen.tsx.
//
// Excluded, same as every other `<x-dc>`-format conversion: the raw file's
// `data-props` tweaks-panel schema (darkMode / slowMotion / duration) and
// the `applyModes()` that consumes it — ambient claude.ai/design authoring
// tooling, not part of the component. Its authored defaults are fixed at
// the literals the raw file ships and its own JS reads back: slowMotion
// false (so `mult()` === 1) and duration 3500.
//
// No motion tokenization (ds-rebuild-w3 is a fidelity rebuild): every value
// below is the source literal, except the one spring curve noted at
// SPRING_EASE, which the repo's motion-token-gate hook requires be written
// as its byte-identical token.
// ---------------------------------------------------------------------------

// Raw source: `const spring = 'cubic-bezier(.34,1.2,.5,1)'`. Written as the
// value-identical motion token instead of that literal — motion-tokens.css
// defines --ease-spring-pop as exactly cubic-bezier(.34, 1.2, .5, 1), and the
// repo's motion-token-gate hook blocks a literal cubic-bezier inside a
// transition on write. Same value-identical-substitution precedent as
// BlurCarousel.css; the rendered curve is unchanged.
// It, the wrap's resting transition and the swipe-commit thresholds live in
// proto/variants.ts as the "main" variant config (ds-review-overlays step 6);
// "main" carries the same values this file shipped with.

// Raw source: `mult() { return this.props.slowMotion ? 4 : 1 }` with
// slowMotion's tweaks-panel default of false.
const MULT = 1

// Raw source: `duration: this.props.duration ?? 3500` (the tweaks-panel
// range's default).
const DEFAULT_DURATION = 3500

// Raw source: `COLORS = { ... }`.
const COLORS: Record<string, string> = {
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  notification: '#6366F1',
}

// F12: per-glyph optical-center nudges (transform only, no size change).
// Each Material Icons glyph carries different visual weight, so the offset
// is judged per glyph rather than applied uniformly.
const ICON_OPTICAL_NUDGE: Record<string, string> = {
  check_circle: 'translate(0.5px, -0.5px)',
  error: 'translate(0.5px, -0.5px)',
  warning: 'translate(0, -0.5px)',
  info: 'translate(0.5px, 0)',
  notifications: 'translate(0.5px, -0.5px)',
  delete: 'translate(0.5px, -0.5px)',
}

// Expand choreography mirrored byte-for-byte from ExpandableCard.tsx's
// "main" variant (DURATION_S 0.5 / HEIGHT_EASING var(--ease-spring), the
// inner reveal's opacity+translateY legs and delays) so the expandable
// toast expands and collapses on the identical curve as the expandable
// card, per this step's brief.
const EXPAND_DURATION_S = 0.5
const EXPAND_DURATION_MS = EXPAND_DURATION_S * 1000
const EXPAND_HEIGHT_EASING = 'var(--ease-spring)'
function expandInnerStyle(open: boolean): CSSProperties {
  return {
    opacity: open ? 1 : 0,
    transform: open ? 'translateY(0)' : 'translateY(14px)',
    transition:
      `opacity ${EXPAND_DURATION_S * 0.7}s var(--ease-out) ${open ? EXPAND_DURATION_S * 0.25 : 0}s, ` +
      `transform ${EXPAND_DURATION_S}s var(--ease-spring) ${open ? EXPAND_DURATION_S * 0.2 : 0}s`,
  }
}

// Raw source: `const ms = (n) => 'calc(' + n + 'ms * var(--anim-mult, 1))'`.
const ms = (n: number) => `calc(${n}ms * var(--anim-mult, 1))`

// The wrap's resting transition (hoisted so the swipe hand-back restores the
// exact string React last wrote, see onSwipeEnd) and the swipe-commit
// thresholds come from cfg.wrapTransition / cfg.swipeDistance /
// cfg.swipeVelocity / cfg.flingMs / cfg.fadeMs in proto/variants.ts. Every
// JS-timed value there mirrors a motion-tokens.css duration by name.

type Phase = 'enter' | 'shown' | 'exit' | 'gone'
type Position = 'top' | 'bottom'

export interface ToastSpec {
  type: string
  icon: string
  title: string
  message?: string
  duration?: number
  action?: { label: string; icon: string; onAction?: () => void }
  expandText?: string
}

// Imperative handle exposed by ToastStage so an external host (e.g. the
// sprint-planner substitution step) can drive toasts without owning the
// stage's internal show()/state -- the module previously had no cross-host
// API, only ToastDemo's own button handlers calling its local `show`.
export interface ToastStageHandle {
  show: (spec: ToastSpec) => void
}

// Toast-with-undo variant: same main toast look, an Undo action pill in
// place of (or beside) the close button. Stable export name -- the
// sprint-planner substitution step imports this to build its own undo
// toasts against this module's ToastSpec shape.
export function withUndo(spec: Omit<ToastSpec, 'action'>): ToastSpec {
  return { ...spec, action: { label: 'Undo', icon: 'undo' } }
}

interface ToastItem extends ToastSpec {
  id: string
  phase: Phase
  position: Position
  duration: number
  /** Stack slot frozen at exit time so the toast leaves from its own slot. */
  exitIndex?: number
}

interface ToastVm {
  key: string
  icon: string
  title: string
  message: string
  wrapStyle: CSSProperties
  surfaceStyle: CSSProperties
  iconBoxStyle: CSSProperties
  closeStyle: CSSProperties
  titleStyle: CSSProperties
  messageStyle: CSSProperties
  hasAction: boolean
  actionLabel: string
  actionIcon: string
  actionOnAction?: () => void
  actionStyle: CSSProperties
  hasExpand: boolean
  expandText: string
  expandStyle: CSSProperties
  expandBodyStyle: CSSProperties
  onPress: () => void
}

// ---------------------------------------------------------------------------
// Per-toast view-model — the raw source's `vm(t, index)`, value for value.
// ---------------------------------------------------------------------------
function vm(t: ToastItem, index: number, expanded: boolean, cfg: VariantCfg, fanned: boolean): ToastVm {
  const top = t.position === 'top'
  const dir = top ? 1 : -1
  // Hover deck fan-out: each slot gets its own full row instead of a
  // shallow peek so every stacked toast is separately visible, per this
  // step's brief. FAN_STEP is a generous card-height estimate; the reveal
  // still rides cfg.wrapTransition (the same token-driven transition used
  // at rest), so the fan-in/out is that transition's stagger, not a new one.
  const FAN_STEP = 84
  const peek = fanned ? index * FAN_STEP : Math.min(index * cfg.peekStep, cfg.peekMax)
  const scale = fanned ? 1 : Math.max(1 - index * cfg.scaleStep, cfg.scaleMin)
  let y: number
  let sc: number
  let op: number
  let hidden = false
  if (t.phase === 'enter') {
    y = -dir * cfg.enterY
    sc = cfg.enterScale
    op = 0
  } else if (t.phase === 'exit') {
    y = dir * peek - dir * 44
    sc = 0.92
    op = 0
  } else if (t.phase === 'gone') {
    y = dir * peek - dir * 44
    sc = 0.92
    op = 0
    hidden = true
  } else {
    y = dir * peek
    sc = scale
    op = fanned || index <= 2 ? 1 : 0
  }

  const semantic = !!COLORS[t.type]
  const color = COLORS[t.type]

  const wrapStyle: CSSProperties = {
    position: 'absolute',
    right: 0,
    left: 'auto',
    top: top ? '0' : 'auto',
    bottom: top ? 'auto' : '0',
    width: 'min(420px, calc(100vw - 48px))',
    boxSizing: 'border-box',
    pointerEvents: op === 0 ? 'none' : 'auto',
    visibility: hidden ? 'hidden' : 'visible',
    zIndex: 100 - index,
    transform: `translateY(${y}px) scale(${sc})`,
    transformOrigin: top ? 'top right' : 'bottom right',
    opacity: op,
    transition: cfg.wrapTransition,
    transitionDelay: fanned ? `calc(${index} * var(--stagger-entrance))` : '0ms',
    willChange: 'transform, opacity',
  }

  // Deck's flat treatment: the gridded highlight and the inset bevel come off,
  // the radius widens, and depth moves to a single soft drop shadow — the
  // stack no longer signals depth through scale, so the card carries it.
  const flat = cfg.surface === 'flat'
  const surfaceStyle: CSSProperties = flat
    ? {
        borderRadius: '22px',
        overflow: 'hidden',
        cursor: t.expandText ? 'pointer' : 'default',
        background: semantic ? color : 'var(--card-bg)',
        color: semantic ? '#fff' : undefined,
        border: semantic ? 'none' : '1px solid var(--card-border)',
        boxShadow: '0 10px 26px rgba(15,23,42,0.16), 0 2px 6px rgba(15,23,42,0.08)',
      }
    : semantic
    ? {
        borderRadius: '17px',
        overflow: 'hidden',
        cursor: t.expandText ? 'pointer' : 'default',
        backgroundColor: color,
        color: '#fff',
        textShadow: '0 1px 2px rgba(0,0,0,0.22)',
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.10) 1px, transparent 1px)',
        backgroundSize: '9px 9px',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -2px 0 rgba(0,0,0,0.22), inset 0 0 0 1px rgba(255,255,255,0.15)',
      }
    : {
        borderRadius: '17px',
        overflow: 'hidden',
        cursor: t.expandText ? 'pointer' : 'default',
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1px rgba(15,23,42,0.04)',
      }

  const iconBoxStyle: CSSProperties = {
    flex: 'none',
    width: '34px',
    height: '34px',
    borderRadius: '9999px',
    display: 'grid',
    placeItems: 'center',
    background: semantic ? 'rgba(255,255,255,0.2)' : '#10B981',
    color: '#fff',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1.5px 0 rgba(0,0,0,0.18)',
  }

  const pill = (filled: boolean): CSSProperties => ({
    flex: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font-display)',
    fontSize: '12px',
    fontWeight: 800,
    padding: '6px 12px',
    borderRadius: '9999px',
    background: semantic ? 'rgba(255,255,255,0.22)' : filled ? '#10B981' : 'var(--bg-chip)',
    color: semantic || filled ? '#fff' : 'var(--fg2)',
    textShadow: semantic || filled ? '0 1px 2px rgba(0,0,0,0.22)' : 'none',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1.5px 0 rgba(0,0,0,0.12)',
    // Press/release legs moved to .ts-pill-btn / .ts-close-btn in Toast.css so
    // the :active rule can shorten them (inline styles outrank class rules);
    // the raw source's unspecified `filter` easing defaulted to UA `ease`,
    // which ramps in on a press.
  })

  const closeStyle: CSSProperties = {
    flex: 'none',
    width: '26px',
    height: '26px',
    borderRadius: '9999px',
    border: 'none',
    display: 'grid',
    placeItems: 'center',
    cursor: 'pointer',
    background: semantic ? 'rgba(255,255,255,0.18)' : 'var(--bg-chip)',
    color: semantic ? '#fff' : 'var(--fg4)',
    // Press/release legs moved to .ts-pill-btn / .ts-close-btn in Toast.css so
    // the :active rule can shorten them (inline styles outrank class rules);
    // the raw source's unspecified `filter` easing defaulted to UA `ease`,
    // which ramps in on a press.
  }

  return {
    key: t.id,
    icon: t.icon,
    title: t.title,
    message: t.message || '',
    wrapStyle,
    surfaceStyle,
    iconBoxStyle,
    closeStyle,
    titleStyle: { fontSize: '13px', fontWeight: 800, color: semantic ? '#fff' : 'var(--fg1)', lineHeight: 1.35 },
    messageStyle: {
      fontSize: '12px',
      fontWeight: 600,
      color: semantic ? 'rgba(255,255,255,0.82)' : 'var(--fg4)',
      lineHeight: 1.4,
    },
    hasAction: !!t.action,
    actionLabel: t.action ? t.action.label : '',
    actionIcon: t.action ? t.action.icon : '',
    actionOnAction: t.action?.onAction,
    actionStyle: pill(true),
    hasExpand: !!t.expandText,
    expandText: t.expandText || '',
    // Height leg now owned by useAutoHeight in ToastCard (mirrors
    // ExpandableCard's `.xc-content` pattern); this only carries the inner
    // reveal's opacity+translateY choreography.
    expandStyle: expandInnerStyle(expanded),
    expandBodyStyle: {
      fontSize: '12px',
      fontWeight: 600,
      lineHeight: 1.5,
      color: semantic ? 'rgba(255,255,255,0.85)' : 'var(--fg2)',
      background: semantic ? 'rgba(0,0,0,0.12)' : 'var(--bg-chip)',
      borderRadius: '12px',
      padding: '10px 12px',
    },
    onPress: () => {},
  }
}

// One stacked toast's card. Owns the expand region's height via
// useAutoHeight (duration/easing mirrored from ExpandableCard's main
// variant), so mount stays permanent through collapse -- only visibility
// changes -- per the mounted-through-exit-css-animations lesson.
function ToastCard({
  t,
  isExpanded,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPress,
  onDismiss,
}: {
  t: ToastVm
  isExpanded: boolean
  onPointerDown: (e: PointerEvent<HTMLElement>) => void
  onPointerMove: (e: PointerEvent<HTMLElement>) => void
  onPointerUp: (e: PointerEvent<HTMLElement>) => void
  onPress: () => void
  onDismiss: () => void
}) {
  const { ref } = useAutoHeight<HTMLDivElement>({
    open: isExpanded,
    duration: EXPAND_DURATION_MS,
    easing: EXPAND_HEIGHT_EASING,
  })
  return (
    <div
      style={t.wrapStyle}
      className="ts-wrap"
      data-ts-base={String(t.wrapStyle.transform)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      // onPointerDown below calls el.setPointerCapture on this element, which
      // per spec retargets the resulting synthetic click's dispatch path to
      // this captured element -- a click listener on any descendant (e.g.
      // the surfaceStyle div) never receives it. The tap handler has to live
      // here, on the capturing element itself, for the browser to deliver it.
      onClick={onPress}
    >
      <div className="shell" style={{ padding: '7px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(15,23,42,0.14), 0 2px 8px rgba(15,23,42,0.08)' }}>
        <div style={t.surfaceStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-icon-text)', padding: '12px 14px' }}>
            <div style={t.iconBoxStyle}>
              <span className="material-icons" style={{ fontSize: '18px', display: 'inline-block', transform: ICON_OPTICAL_NUDGE[t.icon] || 'none' }}>{t.icon}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <span style={t.titleStyle}>{t.title}</span>
              {t.message ? <span style={t.messageStyle}>{t.message}</span> : null}
            </div>
            {t.hasAction ? (
              <button
                type="button"
                className="ts-pill-btn"
                style={t.actionStyle}
                onClick={(e: MouseEvent) => {
                  e.stopPropagation()
                  t.actionOnAction?.()
                  onDismiss()
                }}
              >
                <span className="material-icons" style={{ fontSize: '14px' }}>{t.actionIcon}</span>
                {t.actionLabel}
              </button>
            ) : null}
            <button
              type="button"
              className="ts-close-btn"
              style={t.closeStyle}
              onClick={(e: MouseEvent) => {
                e.stopPropagation()
                onDismiss()
              }}
            >
              <span className="material-icons" style={{ fontSize: '14px' }}>close</span>
            </button>
          </div>
          {t.hasExpand ? (
            <div className="ts-content" ref={ref}>
              <div style={t.expandStyle}>
                <div style={{ padding: '0 14px 12px 14px', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <div style={t.expandBodyStyle}>{t.expandText}</div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="ts-pill-btn"
                      style={t.actionStyle}
                      onClick={(e: MouseEvent) => {
                        e.stopPropagation()
                        onDismiss()
                      }}
                    >
                      <span className="material-icons" style={{ fontSize: '14px' }}>close</span>Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// F13: sprint-planner-core substitution needs the viewport stack to escape a
// transformed ancestor (fixed-position-portals-under-transformed-ancestors
// lesson) and dock below-right of a host card instead of the viewport
// corner. Both new props default to undefined/unset, which reproduces the
// toast page's own behavior byte-for-byte -- no default-path change.
// F14: hideCard skips the in-tree demo/trigger card (.ts-root and its
// contents) entirely, leaving only the portaled viewports + imperative
// show()/handle API -- default unset reproduces the toast page byte-for-byte.
export const ToastStage = forwardRef<ToastStageHandle, { cfg: VariantCfg; portalTarget?: Element | null; anchorRef?: React.RefObject<HTMLElement | null>; hideCard?: boolean }>(function ToastStage({ cfg, portalTarget, anchorRef, hideCard }, forwardedRef) {
  const [toasts, setToastsState] = useState<ToastItem[]>([])
  // Anchor rect (in viewport coords) of the host card the stack should dock
  // below-right of. Re-measured on resize/scroll/size-change so it never
  // goes stale; null (default) leaves the viewports at the page corners,
  // exactly like the toast page.
  const [anchor, setAnchor] = useState<{ right: number; below: number } | null>(null)
  useEffect(() => {
    const el = anchorRef?.current
    if (!el) { setAnchor(null); return }
    const measure = () => {
      const r = el.getBoundingClientRect()
      setAnchor({ right: window.innerWidth - r.right, below: r.bottom })
    }
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
      ro.disconnect()
    }
  }, [anchorRef])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  // Deck fan-out/freeze state per corner, driven by hover on the viewport.
  const [fanned, setFanned] = useState<Record<Position, boolean>>({ top: false, bottom: false })

  const seq = useRef(0)
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  // Mirrors `toasts` for dismissAll's synchronous read of the live list.
  // Written from inside the setState updater (dispatch time), never during
  // render, so this stays clear of react-hooks/refs without a useEffect.
  const toastsRef = useRef<ToastItem[]>([])
  const setToasts = useCallback((updater: ToastItem[] | ((prev: ToastItem[]) => ToastItem[])) => {
    setToastsState((prev) => {
      const next = typeof updater === 'function' ? (updater as (prev: ToastItem[]) => ToastItem[])(prev) : updater
      toastsRef.current = next
      return next
    })
  }, [])
  // Dismissal-timer pause/resume bookkeeping: startedAt is the wall-clock
  // moment the currently-armed timer began, remainingMs is what's left on it.
  // pauseGroup freezes by re-deriving remaining from elapsed time and
  // clearing the timer; resumeGroup re-arms from remaining, never restarting
  // from the full duration.
  const startedAt = useRef<Record<string, number>>({})
  const remainingMs = useRef<Record<string, number>>({})

  // Raw source: componentWillUnmount clears every pending timer.
  useEffect(() => {
    const pending = timers.current
    return () => {
      Object.values(pending).forEach(clearTimeout)
    }
  }, [])

  const setPhase = useCallback((id: string, phase: Phase) => {
    setToasts((s) => s.map((t) => (t.id === id ? { ...t, phase } : t)))
  }, [setToasts])

  const startExit = useCallback((id: string) => {
    clearTimeout(timers.current[id])
    delete timers.current[id]
    delete startedAt.current[id]
    delete remainingMs.current[id]
    // freeze the toast's stack index so it exits from its current slot
    setToasts((s) => {
      const live = s.filter((t) => t.phase === 'enter' || t.phase === 'shown')
      const pos = (s.find((t) => t.id === id) || ({} as ToastItem)).position
      const liveP = live.filter((t) => t.position === pos)
      const idx = liveP.length - 1 - liveP.findIndex((t) => t.id === id)
      return s.map((t) => (t.id === id ? { ...t, phase: 'exit' as Phase, exitIndex: Math.max(idx, 0) } : t))
    })
    timers.current['x' + id] = setTimeout(() => {
      delete timers.current['x' + id]
      // DOM nodes are index-keyed: keep dismissed toasts as hidden 'gone'
      // placeholders so live toasts never swap nodes; purge when all gone.
      setExpanded((e) => {
        const next = { ...e }
        delete next[id]
        return next
      })
      setToasts((s) => {
        let next = s.map((t) => (t.id === id ? { ...t, phase: 'gone' as Phase } : t))
        if (next.every((t) => t.phase === 'gone')) next = []
        return next
      })
    }, 320 * MULT)
  }, [setToasts])

  // Hover-freeze: pause/resume every live dismissal timer in one corner's
  // deck, accumulating elapsed time instead of restarting the countdown.
  const pauseGroup = useCallback((pos: Position) => {
    setFanned((f) => ({ ...f, [pos]: true }))
    toastsRef.current.forEach((t) => {
      if (t.position !== pos || (t.phase !== 'enter' && t.phase !== 'shown')) return
      const timer = timers.current[t.id]
      if (!timer) return
      clearTimeout(timer)
      delete timers.current[t.id]
      const started = startedAt.current[t.id]
      if (started != null) {
        const elapsed = Date.now() - started
        remainingMs.current[t.id] = Math.max((remainingMs.current[t.id] ?? 0) - elapsed, 0)
      }
    })
  }, [])

  const resumeGroup = useCallback(
    (pos: Position) => {
      setFanned((f) => ({ ...f, [pos]: false }))
      toastsRef.current.forEach((t) => {
        if (t.position !== pos || (t.phase !== 'enter' && t.phase !== 'shown')) return
        const remaining = remainingMs.current[t.id]
        if (remaining == null) return
        startedAt.current[t.id] = Date.now()
        timers.current[t.id] = setTimeout(() => startExit(t.id), remaining)
      })
    },
    [startExit],
  )

  // ---- swipe-to-dismiss --------------------------------------------------
  // Gesture motion is written straight onto the node (no per-frame React
  // state): the drag tracks the pointer 1:1, can be re-grabbed mid-fling, and
  // the phase machine is only handed control at commit time. `data-ts-base`
  // carries the stack transform this drag is offsetting.
  // `behind` is the deck variant's peek-parallax set: the wraps stacked behind
  // the dragged one, collected once at pointerdown so the move handler stays a
  // straight write. Empty for every variant with parallax: 0.
  const drag = useRef<{ id: string; el: HTMLElement; x0: number; t0: number; dx: number; behind: HTMLElement[] } | null>(null)
  const lastDx = useRef(0)

  const resetBehind = (behind: HTMLElement[]) => {
    behind.forEach((b) => {
      b.style.transition = cfg.wrapTransition
      b.style.transform = b.dataset.tsBase || ''
    })
  }

  const onSwipeStart = (id: string) => (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    // Pointer capture retargets the resulting click's dispatch path to the
    // captured element, so a click starting on a button descendant (Undo,
    // close) would never reach the button's own onClick. Leave those to
    // native click dispatch -- no swipe/capture, no drag tracking.
    if ((e.target as HTMLElement).closest('button')) return
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    el.style.transition = 'none' // hand the current frame to the finger
    // Caught mid-fling: kill the pending hand-back before it dismisses a toast
    // the user just took back, and snap the node under the finger, opaque.
    if (timers.current['s' + id]) {
      clearTimeout(timers.current['s' + id])
      delete timers.current['s' + id]
      el.style.transform = el.dataset.tsBase || ''
      el.style.opacity = '1'
    }
    const behind = cfg.parallax
      ? Array.from(el.parentElement?.querySelectorAll<HTMLElement>('.ts-wrap') || []).filter(
          (b) => b !== el && b.style.visibility !== 'hidden',
        )
      : []
    behind.forEach((b) => {
      b.style.transition = 'none'
    })
    drag.current = { id, el, x0: e.clientX, t0: e.timeStamp, dx: 0, behind }
    lastDx.current = 0
  }

  const onSwipeMove = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current
    if (!d) return
    d.dx = e.clientX - d.x0
    lastDx.current = d.dx
    d.el.style.transform = `${d.el.dataset.tsBase} translateX(${d.dx}px)`
    d.el.style.opacity = String(Math.max(1 - Math.abs(d.dx) / 260, 0.15))
    // Peek-parallax: the deck follows the finger at a fraction, so the stack
    // reads as one connected object instead of a card sliding off a backdrop.
    d.behind.forEach((b) => {
      b.style.transform = `${b.dataset.tsBase} translateX(${d.dx * cfg.parallax}px)`
    })
  }

  const onSwipeEnd = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current
    if (!d) return
    drag.current = null
    if (d.el.hasPointerCapture(e.pointerId)) d.el.releasePointerCapture(e.pointerId)
    const v = d.dx / Math.max(e.timeStamp - d.t0, 1)
    resetBehind(d.behind)
    if (Math.abs(d.dx) > cfg.swipeDistance || Math.abs(v) > cfg.swipeVelocity) {
      // Velocity handoff: keep flinging along the drag axis, then let the
      // phase machine run its exit under an already-invisible node.
      d.el.style.transition = `transform ${ms(cfg.flingMs)} var(--ease-out), opacity ${ms(cfg.fadeMs)} var(--ease-out)`
      d.el.style.transform = `${d.el.dataset.tsBase} translateX(${Math.sign(d.dx) * 480}px)`
      d.el.style.opacity = '0'
      const { id, el } = d
      timers.current['s' + id] = setTimeout(() => {
        delete timers.current['s' + id]
        el.style.transition = cfg.wrapTransition // restore React's exact string
        startExit(id)
      }, cfg.fadeMs)
    } else {
      // Under threshold: settle back on the same curve the stack uses (in
      // Snap that curve overshoots the slot positionally, never in scale).
      d.el.style.transition = cfg.wrapTransition
      d.el.style.transform = d.el.dataset.tsBase || ''
      d.el.style.opacity = '1'
    }
  }

  // Corner routing: a notification-type toast always mounts top-right,
  // every other kind mounts bottom-right (per this step's brief -- no
  // longer an operator-facing toggle).
  const show = useCallback(
    (spec: ToastSpec) => {
      const id = 'ts' + ++seq.current
      const toast: ToastItem = {
        id,
        phase: 'enter',
        position: spec.type === 'notification' ? 'top' : 'bottom',
        duration: DEFAULT_DURATION,
        ...spec,
      }
      setToasts((s) => s.concat([toast]))
      // enter → shown after first paint so the transition runs
      timers.current['e' + id] = setTimeout(() => {
        delete timers.current['e' + id]
        setPhase(id, 'shown')
      }, 40)
      if (toast.duration > 0) {
        const durMs = toast.duration * MULT
        startedAt.current[id] = Date.now()
        remainingMs.current[id] = durMs
        timers.current[id] = setTimeout(() => startExit(id), durMs)
      }
    },
    [setPhase, startExit, setToasts],
  )

  useImperativeHandle(forwardedRef, () => ({ show }), [show])

  const toggleExpand = useCallback((id: string) => {
    setExpanded((e) => {
      const next = { ...e }
      if (next[id]) {
        delete next[id]
      } else {
        next[id] = true
      }
      return next
    })
    // sticky while reading: pause auto-dismiss on expand
    clearTimeout(timers.current[id])
    delete timers.current[id]
    delete startedAt.current[id]
    delete remainingMs.current[id]
  }, [])

  // Raw source: `group(pos)` — index over LIVE toasts only, so remaining
  // toasts re-stack fluently; exiting toasts keep their frozen slot, 'gone'
  // ones are hidden.
  const group = (pos: Position): ToastVm[] => {
    const list = toasts.filter((t) => t.position === pos)
    const live = list.filter((t) => t.phase === 'enter' || t.phase === 'shown')
    return list.map((t) => {
      let idx: number
      if (t.phase === 'exit') idx = t.exitIndex || 0
      else if (t.phase === 'gone') idx = 0
      else idx = live.length - 1 - live.indexOf(t)
      const model = vm(t, idx, !!expanded[t.id], cfg, fanned[pos])
      model.onPress = () => {
        if (t.expandText) toggleExpand(t.id)
      }
      return model
    })
  }

  const liveCount = String(toasts.filter((t) => t.phase !== 'exit').length)
  const dismissAll = () => toastsRef.current.forEach((t) => { if (t.phase !== 'exit') startExit(t.id) })

  // Toast list rendering — one identical block per viewport, exactly as the
  // raw file repeats its `<sc-for>` markup for top and bottom. Rows are keyed
  // by their stable position in the list (not by toast id) because the raw
  // source deliberately relies on index-keyed DOM nodes: a dismissed toast
  // stays in the list as a hidden 'gone' placeholder so live toasts never
  // swap nodes mid-transition (see its own comment in startExit above).
  const renderGroup = (pos: Position) =>
    group(pos).map((t, i) => (
      <ToastCard
        // eslint-disable-next-line react/no-array-index-key
        key={i}
        t={t}
        isExpanded={!!expanded[t.key]}
        onPointerDown={onSwipeStart(t.key)}
        onPointerMove={onSwipeMove}
        onPointerUp={onSwipeEnd}
        onPress={() => {
          if (Math.abs(lastDx.current) > 6) return // a drag is not a tap
          t.onPress()
        }}
        onDismiss={() => startExit(t.key)}
      />
    ))

  // Below-right anchor: same right offset (from the host card's right edge
  // instead of the viewport's) for both viewports, both docked just below
  // the card's bottom edge -- collapses the two page-corner mounts to one
  // point per the interview's singular "below-right edge" anchor. Per-toast
  // stacking math (peek/scale/dir in vm()) is completely untouched.
  const anchoredRight = anchor ? `${anchor.right + 24}px` : '24px'
  const anchoredTop = anchor ? `${anchor.below + 12}px` : '24px'

  const viewports = (
    <>
      {/* ============ Top viewport (notification kind) ============ */}
      <div
        style={{ position: 'fixed', right: anchoredRight, left: 'auto', top: anchoredTop, bottom: 'auto', height: 0, zIndex: 9999, pointerEvents: 'none' }}
        data-screen-label="Toast viewport top"
        onMouseEnter={() => pauseGroup('top')}
        onMouseLeave={() => resumeGroup('top')}
      >
        {renderGroup('top')}
      </div>

      {/* ============ Bottom viewport (every other kind) ============ */}
      <div
        style={{ position: 'fixed', right: anchoredRight, left: 'auto', top: anchor ? anchoredTop : 'auto', bottom: anchor ? 'auto' : '24px', height: 0, zIndex: 9999, pointerEvents: 'none' }}
        data-screen-label="Toast viewport bottom"
        onMouseEnter={() => pauseGroup('bottom')}
        onMouseLeave={() => resumeGroup('bottom')}
      >
        {renderGroup('bottom')}
      </div>
    </>
  )

  if (hideCard) {
    return portalTarget ? createPortal(viewports, portalTarget) : viewports
  }

  return (
    <div
      className="ts-root"
      style={{
        boxSizing: 'border-box',
        minHeight: '100vh',
        padding: '40px 24px',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        fontFamily: 'var(--font-display)',
        background: 'var(--bg-app)',
      }}
      data-screen-label="Toast demo"
    >

      {/* ============ Demo / trigger card ============ */}
      <div
        className="shell zoom"
        style={{ animation: 'ts-enter calc(220ms * var(--anim-mult, 1)) var(--ease-out) both', cursor: 'default' }}
      >
        <div
          className="card-inner"
          style={{
            width: '460px',
            maxWidth: 'calc(100vw - 88px)',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--gap-stack)',
          }}
        >

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--gap-icon-text)' }}>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span
                className="label"
                style={{
                  fontSize: 'var(--type-mini)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--tracking-wider)',
                  color: 'var(--fg4)',
                }}
              >
                Feedback
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--gap-icon-text)',
                  fontSize: 'var(--type-h4)',
                  fontWeight: 900,
                  letterSpacing: '-0.015em',
                  color: 'var(--fg1)',
                }}
              >
                <span className="material-icons" style={{ fontSize: '20px', color: '#10B981' }}>notifications</span>Toasts
              </span>
            </div>
            <span className="badge gci" style={{ fontVariantNumeric: 'tabular-nums' }}>
              <span className="material-icons" style={{ fontSize: '12px' }}>layers</span>
              <span>{liveCount}</span>
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <span
              className="label"
              style={{
                fontSize: 'var(--type-mini)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-wider)',
                color: 'var(--fg4)',
              }}
            >
              Semantic
            </span>
            <div style={{ display: 'flex', gap: 'var(--gap-inline)', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-cta"
                style={{ height: '40px', fontSize: '13px', '--accent': '#10B981', '--ctaglow': 'rgba(16,185,129,0.5)' } as CSSProperties}
                onClick={() => show({ type: 'success', icon: 'check_circle', title: 'Synced data successfully.' })}
              >
                <span className="material-icons" style={{ fontSize: '16px' }}>check_circle</span>Success
              </button>
              <button
                type="button"
                className="btn-cta"
                style={{ height: '40px', fontSize: '13px', '--accent': '#EF4444', '--ctaglow': 'rgba(239,68,68,0.5)' } as CSSProperties}
                onClick={() => show({ type: 'error', icon: 'error', title: 'Failed to load data from server.' })}
              >
                <span className="material-icons" style={{ fontSize: '16px' }}>error</span>Error
              </button>
              <button
                type="button"
                className="btn-cta"
                style={{ height: '40px', fontSize: '13px', '--accent': '#F59E0B', '--ctaglow': 'rgba(245,158,11,0.5)' } as CSSProperties}
                onClick={() => show({ type: 'warning', icon: 'warning', title: 'Deprecation alert for your API usage.' })}
              >
                <span className="material-icons" style={{ fontSize: '16px' }}>warning</span>Warning
              </button>
              <button
                type="button"
                className="btn-cta"
                style={{ height: '40px', fontSize: '13px', '--accent': '#3B82F6', '--ctaglow': 'rgba(59,130,246,0.5)' } as CSSProperties}
                onClick={() => show({ type: 'info', icon: 'info', title: 'A new version 2.4 is available.' })}
              >
                <span className="material-icons" style={{ fontSize: '16px' }}>info</span>Info
              </button>
              <button
                type="button"
                className="btn-cta"
                style={{ height: '40px', fontSize: '13px', '--accent': COLORS.notification, '--ctaglow': 'rgba(99,102,241,0.5)' } as CSSProperties}
                onClick={() => show({ type: 'notification', icon: 'notifications', title: 'New comment on your task.', expandText: 'Priya left a comment: "Can we bump the due date to Friday?"' })}
              >
                <span className="material-icons" style={{ fontSize: '16px' }}>notifications</span>Notification
              </button>
              <button
                type="button"
                className="btn-cta"
                style={{ height: '40px', fontSize: '13px', '--accent': '#0F172A', '--ctaglow': 'rgba(15,23,42,0.5)' } as CSSProperties}
                onClick={() => show(withUndo({ type: 'success', icon: 'delete', title: 'Item deleted.' }))}
              >
                <span className="material-icons" style={{ fontSize: '16px' }}>undo</span>Undo demo
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--gap-inline)' }}>
            <button type="button" className="btn-text" onClick={dismissAll}>
              <span className="material-icons" style={{ fontSize: '18px' }}>clear_all</span>Dismiss all
            </button>
          </div>

          <div style={{ display: 'flex' }}>
            <span className="badge tag"><span className="material-icons">sell</span>toast / stacked</span>
          </div>
        </div>
      </div>

      {portalTarget ? createPortal(viewports, portalTarget) : viewports}
    </div>
  )
})

export default function ToastDemo() {
  return <ToastStage cfg={VARIANTS.main} />
}
