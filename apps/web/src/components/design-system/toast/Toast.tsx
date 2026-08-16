import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from 'react'
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

interface ToastSpec {
  type: string
  icon: string
  title: string
  message?: string
  duration?: number
  action?: { label: string; icon: string }
  expandText?: string
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
function vm(t: ToastItem, index: number, expanded: boolean, cfg: VariantCfg): ToastVm {
  const top = t.position === 'top'
  const dir = top ? 1 : -1
  const peek = Math.min(index * cfg.peekStep, cfg.peekMax)
  const scale = Math.max(1 - index * cfg.scaleStep, cfg.scaleMin)
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
    op = index > 2 ? 0 : 1
  }

  const semantic = !!COLORS[t.type]
  const color = COLORS[t.type]

  const wrapStyle: CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: top ? '0' : 'auto',
    bottom: top ? 'auto' : '0',
    width: 'min(420px, calc(100vw - 48px))',
    boxSizing: 'border-box',
    pointerEvents: op === 0 ? 'none' : 'auto',
    visibility: hidden ? 'hidden' : 'visible',
    zIndex: 100 - index,
    transform: `translateX(-50%) translateY(${y}px) scale(${sc})`,
    transformOrigin: top ? 'top center' : 'bottom center',
    opacity: op,
    transition: cfg.wrapTransition,
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
    actionStyle: pill(true),
    hasExpand: !!t.expandText,
    expandText: t.expandText || '',
    expandStyle: {
      overflow: 'hidden',
      maxHeight: expanded ? '220px' : '0px',
      opacity: expanded ? 1 : 0,
      transition: `max-height ${ms(300)} var(--ease-out), opacity ${ms(240)} var(--ease-out)`,
    },
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

function ToastStage({ cfg }: { cfg: VariantCfg }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [position, setPosition] = useState<Position>('bottom')

  const seq = useRef(0)
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  // Latest state read by handlers that the raw source reads off `this.state`
  // synchronously (show's position capture, dismissAll's iteration).
  const positionRef = useRef<Position>(position)
  positionRef.current = position
  const toastsRef = useRef<ToastItem[]>(toasts)
  toastsRef.current = toasts

  // Raw source: componentWillUnmount clears every pending timer.
  useEffect(() => {
    const pending = timers.current
    return () => {
      Object.values(pending).forEach(clearTimeout)
    }
  }, [])

  const setPhase = useCallback((id: string, phase: Phase) => {
    setToasts((s) => s.map((t) => (t.id === id ? { ...t, phase } : t)))
  }, [])

  const startExit = useCallback((id: string) => {
    clearTimeout(timers.current[id])
    delete timers.current[id]
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
  }, [])

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

  const show = useCallback(
    (spec: ToastSpec) => {
      const id = 'ts' + ++seq.current
      const toast: ToastItem = {
        id,
        phase: 'enter',
        position: positionRef.current,
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
        timers.current[id] = setTimeout(() => startExit(id), toast.duration * MULT)
      }
    },
    [setPhase, startExit],
  )

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
      const model = vm(t, idx, !!expanded[t.id], cfg)
      model.onPress = () => {
        if (t.expandText) toggleExpand(t.id)
      }
      return model
    })
  }

  const liveCount = String(toasts.filter((t) => t.phase !== 'exit').length)
  const segPillStyle: CSSProperties = { left: position === 'top' ? '3px' : '99px', width: '96px' }
  const dismissAll = () => toastsRef.current.forEach((t) => { if (t.phase !== 'exit') startExit(t.id) })

  // Toast list rendering — one identical block per viewport, exactly as the
  // raw file repeats its `<sc-for>` markup for top and bottom. Rows are keyed
  // by their stable position in the list (not by toast id) because the raw
  // source deliberately relies on index-keyed DOM nodes: a dismissed toast
  // stays in the list as a hidden 'gone' placeholder so live toasts never
  // swap nodes mid-transition (see its own comment in startExit above).
  const renderGroup = (pos: Position) =>
    group(pos).map((t, i) => (
      // eslint-disable-next-line react/no-array-index-key
      <div
        style={t.wrapStyle}
        key={i}
        className="ts-wrap"
        data-ts-base={String(t.wrapStyle.transform)}
        onPointerDown={onSwipeStart(t.key)}
        onPointerMove={onSwipeMove}
        onPointerUp={onSwipeEnd}
        onPointerCancel={onSwipeEnd}
      >
        <div
          className="shell"
          style={{
            padding: '7px',
            borderRadius: '24px',
            boxShadow: '0 10px 30px rgba(15,23,42,0.14), 0 2px 8px rgba(15,23,42,0.08)',
          }}
        >
          <div
            style={t.surfaceStyle}
            onClick={() => {
              if (Math.abs(lastDx.current) > 6) return // a drag is not a tap
              t.onPress()
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-icon-text)', padding: '12px 14px' }}>
              <div style={t.iconBoxStyle}>
                <span className="material-icons" style={{ fontSize: '18px' }}>{t.icon}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1px' }}>
                <span style={t.titleStyle}>{t.title}</span>
                {t.message ? <span style={t.messageStyle}>{t.message}</span> : null}
              </div>
              {t.hasAction ? (
                <button
                  className="ts-pill-btn"
                  style={t.actionStyle}
                  onClick={(e: MouseEvent) => {
                    e.stopPropagation()
                    startExit(t.key)
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '14px' }}>{t.actionIcon}</span>
                  {t.actionLabel}
                </button>
              ) : null}
              <button
                className="ts-close-btn"
                style={t.closeStyle}
                onClick={(e: MouseEvent) => {
                  e.stopPropagation()
                  startExit(t.key)
                }}
              >
                <span className="material-icons" style={{ fontSize: '14px' }}>close</span>
              </button>
            </div>
            {t.hasExpand ? (
              <div style={t.expandStyle}>
                <div style={{ padding: '0 14px 12px 14px', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <div style={t.expandBodyStyle}>{t.expandText}</div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      className="ts-pill-btn"
                      style={t.actionStyle}
                      onClick={(e: MouseEvent) => {
                        e.stopPropagation()
                        startExit(t.key)
                      }}
                    >
                      <span className="material-icons" style={{ fontSize: '14px' }}>close</span>Dismiss
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    ))

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
                className="btn-cta"
                style={{ height: '40px', fontSize: '13px', '--accent': '#10B981', '--ctaglow': 'rgba(16,185,129,0.5)' } as CSSProperties}
                onClick={() => show({ type: 'success', icon: 'check_circle', title: 'Synced data successfully.' })}
              >
                <span className="material-icons" style={{ fontSize: '16px' }}>check_circle</span>Success
              </button>
              <button
                className="btn-cta"
                style={{ height: '40px', fontSize: '13px', '--accent': '#EF4444', '--ctaglow': 'rgba(239,68,68,0.5)' } as CSSProperties}
                onClick={() => show({ type: 'error', icon: 'error', title: 'Failed to load data from server.' })}
              >
                <span className="material-icons" style={{ fontSize: '16px' }}>error</span>Error
              </button>
              <button
                className="btn-cta"
                style={{ height: '40px', fontSize: '13px', '--accent': '#F59E0B', '--ctaglow': 'rgba(245,158,11,0.5)' } as CSSProperties}
                onClick={() => show({ type: 'warning', icon: 'warning', title: 'Deprecation alert for your API usage.' })}
              >
                <span className="material-icons" style={{ fontSize: '16px' }}>warning</span>Warning
              </button>
              <button
                className="btn-cta"
                style={{ height: '40px', fontSize: '13px', '--accent': '#3B82F6', '--ctaglow': 'rgba(59,130,246,0.5)' } as CSSProperties}
                onClick={() => show({ type: 'info', icon: 'info', title: 'A new version 2.4 is available.' })}
              >
                <span className="material-icons" style={{ fontSize: '16px' }}>info</span>Info
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--gap-inline)',
              flexWrap: 'wrap',
            }}
          >
            <div className="pills-seg">
              <div className="pills-seg-pill" style={segPillStyle}></div>
              <button
                className={position === 'top' ? 'active' : ''}
                style={{ width: '96px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                onClick={() => setPosition('top')}
              >
                <span className="material-icons" style={{ fontSize: '14px' }}>vertical_align_top</span>Top
              </button>
              <button
                className={position === 'bottom' ? 'active' : ''}
                style={{ width: '96px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                onClick={() => setPosition('bottom')}
              >
                <span className="material-icons" style={{ fontSize: '14px' }}>vertical_align_bottom</span>Bottom
              </button>
            </div>
            <button className="btn-text" onClick={dismissAll}>
              <span className="material-icons" style={{ fontSize: '18px' }}>clear_all</span>Dismiss all
            </button>
          </div>

          <div style={{ display: 'flex' }}>
            <span className="badge tag"><span className="material-icons">sell</span>toast / stacked</span>
          </div>
        </div>
      </div>

      {/* ============ Top viewport ============ */}
      <div
        style={{ position: 'fixed', left: 0, right: 0, top: '24px', height: 0, zIndex: 9999, pointerEvents: 'none' }}
        data-screen-label="Toast viewport top"
      >
        {renderGroup('top')}
      </div>

      {/* ============ Bottom viewport ============ */}
      <div
        style={{ position: 'fixed', left: 0, right: 0, bottom: '24px', height: 0, zIndex: 9999, pointerEvents: 'none' }}
        data-screen-label="Toast viewport bottom"
      >
        {renderGroup('bottom')}
      </div>

    </div>
  )
}

export default function ToastDemo() {
  return <ToastStage cfg={VARIANTS.main} />
}
