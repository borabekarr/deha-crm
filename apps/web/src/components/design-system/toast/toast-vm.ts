// Non-component view-model logic shared between Toast.tsx, ToastCard.tsx and
// ToastDemoCard.tsx, split out so Toast.tsx's default export stays the only
// component export in its file (react-doctor/only-export-components -- value
// exports alongside a component defeat Fast Refresh). Values, ordering and
// comments are unchanged from Toast.tsx.
import type { CSSProperties } from 'react'
import type { VariantCfg } from './variants'

// Raw source: `mult() { return this.props.slowMotion ? 4 : 1 }` with
// slowMotion's tweaks-panel default of false.
export const MULT = 1

// Faster-exits rule (plan: faster-exits-rule step 6): reads --toast-exit-dur
// live via the shared helper, see lib/token-ms.ts.

// Raw source: `duration: this.props.duration ?? 3500` (the tweaks-panel
// range's default).
export const DEFAULT_DURATION = 3500

// Raw source: `COLORS = { ... }`.
export const COLORS: Record<string, string> = {
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  notification: '#6366F1',
}

// F11 (plan: ui-library-debt-p3 step 2): the per-glyph optical-center nudge
// map that used to live here was removed on purpose. Bora asked for exact
// geometric centring rather than optical centring, so the glyph box is now
// centred with no transform offset -- do not reintroduce a nudge map here.

// Expand choreography mirrored byte-for-byte from ExpandableCard.tsx's
// "main" variant (DURATION_S 0.5 / HEIGHT_EASING var(--ease-spring), the
// inner reveal's opacity+translateY legs and delays) so the expandable
// toast expands and collapses on the identical curve as the expandable
// card, per this step's brief.
const EXPAND_DURATION_S = 0.5
export const EXPAND_DURATION_MS = EXPAND_DURATION_S * 1000
export const EXPAND_HEIGHT_EASING = 'var(--ease-spring)'
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
export const ms = (n: number) => `calc(${n}ms * var(--anim-mult, 1))`

// The wrap's resting transition (hoisted so the swipe hand-back restores the
// exact string React last wrote, see onSwipeEnd) and the swipe-commit
// thresholds come from cfg.wrapTransition / cfg.swipeDistance /
// cfg.swipeVelocity / cfg.flingMs / cfg.fadeMs in variants.ts. Every
// JS-timed value there mirrors a motion-tokens.css duration by name.

export type Phase = 'enter' | 'shown' | 'exit' | 'gone'
export type Position = 'top' | 'bottom'

export interface ToastSpec {
  type: string
  icon: string
  title: string
  message?: string
  duration?: number
  action?: { label: string; icon: string; onAction?: () => void }
  expandText?: string
  // F14: optional per-instance accent/surface override (e.g. priority-tag
  // colors from a consumer like the sprint planner). Undefined reproduces
  // the byte-identical default toast; caller values must be oklch or CSS
  // custom properties, never raw hex. `color` tints the surface panel
  // (same layer COLORS[t.type] already drives below), `surface` tints the
  // icon chip's background layer. This is the only override field — no
  // variant/flag family.
  accent?: { color: string; surface: string }
}

export interface ToastItem extends ToastSpec {
  id: string
  phase: Phase
  position: Position
  duration: number
  /** Stack slot frozen at exit time so the toast leaves from its own slot. */
  exitIndex?: number
}

export interface ToastVm {
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
export function vm(t: ToastItem, index: number, expanded: boolean, cfg: VariantCfg, fanned: boolean): ToastVm {
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

  // F14: accent override wins only when explicitly passed on this toast's
  // spec; default path (t.accent undefined) reproduces `semantic`/`color`
  // exactly as before -- no mutation of COLORS or VARIANTS.
  const semantic = !!t.accent || !!COLORS[t.type]
  const color = t.accent?.color ?? COLORS[t.type]

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
    transition: t.phase === 'exit' ? cfg.wrapTransitionExit : cfg.wrapTransition,
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
        backgroundImage: 'var(--grid-texture-image)',
        backgroundSize: 'var(--grid-texture-size)',
        boxShadow:
          'inset 0 -2px 5px rgba(0,0,0,0.14), inset 0 -1px 0 rgba(255,255,255,0.15)',
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
    background: t.accent?.surface ?? (semantic ? 'rgba(255,255,255,0.2)' : '#10B981'),
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
