import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './ExpandableScreen.css'
import './variants.css'

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
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { VariantPicker } from './VariantPicker'

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
const DURATION_S = 0.45
// Raw source: const ease = 'cubic-bezier(0.32, 0.72, 0, 1)'. No token in
// motion-tokens.css matches this curve exactly.
const FLIP_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)'
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
// Mirror comments for the JS-timed legs derived from DURATION_S (the FLIP math
// has to stay arithmetic in JS, so the CSS token is named rather than
// substituted): 0.45s FLIP -- no exact motion-tokens.css tier (between
// --duration-420 and --duration-560); 0.315s content reveal (DURATION_S*0.7)
// and 0.1575s content hide (DURATION_S*0.35) -- no tiers; 0.18s trigger
// re-reveal (DURATION_S*0.4) == --duration-180 exactly; 0.225s close-button
// delay (DURATION_S*0.5) -- no tier.
// The overlay is portaled to document.body, so it leaves .es-demo-root's
// z-index 2147483647 layer; it re-enters at the same top layer (last body
// child wins the tie) instead of the old in-root z-index 50.
const OVERLAY_Z = 2147483647

const SYM_STYLE: CSSProperties = { fontFamily: "'Material Symbols Outlined'" }

// ── Prototype variants (ds-review-expandables Step 4) ─────────────────────
// Harness only. `main` is the untouched Step 3 result and the cherry-pick
// baseline. Every variant keeps the portal, the FLIP mechanics and every JS
// timer byte-identical (the LOCKED animation-spam contract for this slug
// depends on the open/close re-arm timing, and DURATION_S drives it); they
// diverge on surface chrome and on content choreography only, expressed here
// and in variants.css. No new useEffect in this component: the picker's own
// listeners live in the harness file VariantPicker.tsx.
const VARIANTS = [
  { id: 'main', label: 'Main' },
  { id: 'studio', label: 'Studio' },
  { id: 'parallax', label: 'Parallax' },
] as const
type VariantId = (typeof VARIANTS)[number]['id']

// Expanded-screen surface treatment. `main` carries no delta at all.
const CHROME: Record<VariantId, CSSProperties> = {
  main: {},
  studio: {
    background: '#0B1220',
    backgroundImage:
      'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px), radial-gradient(ellipse at top right, rgba(16,185,129,0.28) 0%, transparent 60%)',
    boxShadow: '0 24px 60px -20px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.12)',
  },
  parallax: {},
}
// Closed-state content transform. Parallax has the content trail the surface
// (~8px, Step 3 finding 8) instead of only scaling with it.
const CONTENT_FROM: Record<VariantId, string> = {
  main: 'scale(0.97)',
  studio: 'scale(0.97)',
  parallax: 'translateY(8px) scale(0.985)',
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
  const [variantIndex, setVariantIndex] = useState(() => {
    const raw = Number.parseInt(new URLSearchParams(window.location.search).get('v') ?? '', 10)
    return raw >= 1 && raw <= VARIANTS.length ? raw - 1 : 0
  })
  const variant = VARIANTS[variantIndex].id
  const selectVariant = useCallback((i: number) => {
    setVariantIndex(i)
    const url = new URL(window.location.href)
    url.searchParams.set('v', String(i + 1))
    window.history.replaceState(null, '', url)
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
    setPhase('from')
    pendingOpenRef.current = true
  }, [])

  const collapse = useCallback(() => {
    // Deliberately NOT re-entrancy-guarded: a second close during the collapse
    // window re-measures and restarts the settle timer, which is what the
    // locked animation-spam contract for this slug exercises (see the scratch
    // report; a `closingRef` early-return regressed that suite).
    const rect = measure()
    if (rect) rectRef.current = rect
    setPhase('from')
    setClosing(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      document.body.style.overflow = ''
      setPhase('idle')
      setJoined(false)
      setClosing(false)
    }, DURATION_S * 1000 + 60)
  }, [])

  // Mirrors raw's componentDidUpdate: after 'from' commits on an opening
  // pass (not while closing), force a reflow so the `from` geometry is
  // painted, then flip to 'open' on the next tick so the top/left/width/
  // height transition has a committed starting frame to animate from.
  useEffect(() => {
    if (pendingOpenRef.current && phase === 'from' && !closing) {
      pendingOpenRef.current = false
      const el = overlayElRef.current
      if (el) void el.offsetWidth
      const t = setTimeout(() => setPhase('open'), 20)
      return () => clearTimeout(t)
    }
  }, [phase, closing])

  // Escape closes, mirrors raw's componentDidMount/componentWillUnmount.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phase === 'open') collapse()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, collapse])

  useEffect(() => {
    return () => {
      document.body.style.overflow = ''
      clearTimeout(timerRef.current)
    }
  }, [])

  const open = phase === 'open'
  const active = phase !== 'idle' && rectRef.current !== null
  const rect = rectRef.current

  const geo: CSSProperties = open
    ? { top: '0px', left: '0px', width: '100vw', height: '100vh', borderRadius: CONTENT_RADIUS }
    : active && rect
      ? { top: `${rect.top}px`, left: `${rect.left}px`, width: `${rect.width}px`, height: `${rect.height}px`, borderRadius: TRIGGER_RADIUS }
      : {}

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
        transition: `top ${DURATION_S}s ${FLIP_EASE}, left ${DURATION_S}s ${FLIP_EASE}, width ${DURATION_S}s ${FLIP_EASE}, height ${DURATION_S}s ${FLIP_EASE}, border-radius ${DURATION_S}s ${FLIP_EASE}`,
        willChange: 'top, left, width, height',
        ...CHROME[variant],
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
    transform: open ? 'scale(1)' : CONTENT_FROM[variant],
    transition: open
      ? `opacity ${DURATION_S * 0.7}s ${FADE_EASE} ${DURATION_S * 0.35}s, transform ${DURATION_S * 0.7}s ${FLIP_EASE} ${DURATION_S * 0.35}s`
      : `opacity ${DURATION_S * 0.35}s ${FADE_EASE}, transform ${DURATION_S * 0.35}s ${FLIP_EASE}`,
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
    transition: `opacity ${QUICK_MS} ${FADE_EASE} ${open ? DURATION_S * 0.5 : 0}s, background ${HOVER_MS} ${FADE_EASE}`,
  }

  const triggerWrapStyle: CSSProperties = {
    opacity: active && !closing ? 0 : 1,
    transition: closing
      ? `opacity ${DURATION_S * 0.4}s ${FADE_EASE} ${DURATION_S * 0.5}s`
      : `opacity ${QUICK_MS} ${FADE_EASE}`,
    pointerEvents: active ? 'none' : 'auto',
  }

  const submit = () => setJoined(true)
  const submitLabel = joined ? "You're on the list" : 'Join the waitlist'
  const submitIcon = joined ? 'check_circle' : 'mail'

  return (
    <div className="es-demo-root">
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
        <div style={triggerWrapStyle}>
          <div
            className="card-glass"
            style={{
              maxWidth: '620px',
              padding: '48px 56px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '16px',
            }}
          >
            <span className="pill pill--success" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <span className="material-symbols-outlined" style={{ ...SYM_STYLE, fontSize: '14px' }}>
                bolt
              </span>
              Early access
            </span>
            <h1
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '36px',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                color: '#0F172A',
                lineHeight: 1.15,
                margin: 0,
              }}
            >
              <span className="material-symbols-outlined" style={{ ...SYM_STYLE, fontSize: '34px', color: '#10B981' }}>
                rocket_launch
              </span>
              Join the waitlist
            </h1>
            <p style={{ fontSize: '15px', fontWeight: 500, color: '#64748B', lineHeight: 1.6, margin: 0, maxWidth: '460px' }}>
              Be among the first to experience our next-generation platform. Get early access to exclusive
              features and help shape the future of productivity.
            </p>
            <button
              className="btn-primary"
              onClick={expand}
              ref={triggerElRef}
              style={{ marginTop: '8px', padding: '14px 28px', borderRadius: '100px', fontSize: '15px' }}
            >
              Get early access
              <span className="material-symbols-outlined" style={{ ...SYM_STYLE, fontSize: '18px' }}>
                arrow_forward
              </span>
            </button>
          </div>
        </div>

        {/* Morphing overlay — portaled to document.body so no transformed
            ancestor (the gallery reveal wrapper) can re-cage its position:fixed
            containing block. FLIP geometry is unaffected: both the `from` rect
            (getBoundingClientRect, always viewport-relative) and the `open`
            geometry (0/0/100vw/100vh) are viewport-relative in either tree. */}
        {createPortal(
          <>
          {/* Studio's dimming scrim: stays mounted in every variant and is
              state-classed (mounted-through-exit lesson), display:none outside
              Studio. Before the overlay in the portal, so it sits above
              .es-demo-root and below the morphing surface. */}
          <div className="es-scrim" data-variant={variant} {...(open ? { 'data-open': '' } : null)} />
          <div
            ref={overlayElRef}
            className="es-overlay"
            data-variant={variant}
            {...(open ? { 'data-open': '' } : null)}
            {...(joined ? { 'data-joined': '' } : null)}
            style={overlayStyle}
          >
          <button className="es-close-btn" onClick={collapse} aria-label="Close" style={closeBtnStyle}>
            <span className="material-symbols-outlined" style={{ ...SYM_STYLE, fontSize: '22px', color: '#FFFFFF' }}>
              close
            </span>
          </button>

          <div className="es-content" style={contentStyle}>
            <div
              style={{
                width: '100%',
                maxWidth: '560px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '20px',
                padding: '48px',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '16px',
                  background: 'rgba(6,78,59,0.45)',
                  border: '1px solid rgba(255,255,255,0.45)',
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  textShadow: '0 1px 2px rgba(0,0,0,0.25)',
                }}
              >
                <span className="material-symbols-outlined" style={{ ...SYM_STYLE, fontSize: '14px' }}>
                  local_fire_department
                </span>
                Limited spots
              </span>
              <h2
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  fontSize: '44px',
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                  color: '#FFFFFF',
                  lineHeight: 1.1,
                  margin: 0,
                  textShadow: '0 2px 4px rgba(0,0,0,0.28)',
                }}
              >
                <span className="material-symbols-outlined" style={{ ...SYM_STYLE, fontSize: '40px' }}>
                  rocket_launch
                </span>
                You're almost in
              </h2>
              <p
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  lineHeight: 1.6,
                  margin: 0,
                  maxWidth: '440px',
                  textShadow: '0 1px 2px rgba(0,0,0,0.22)',
                }}
              >
                Leave your details and we'll send your invite as soon as your spot opens up.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                    borderRadius: '16px',
                    background: 'rgba(6,78,59,0.4)',
                    border: '1px solid rgba(255,255,255,0.35)',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#FFFFFF',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ ...SYM_STYLE, fontSize: '14px' }}>
                    verified
                  </span>
                  Priority invite
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                    borderRadius: '16px',
                    background: 'rgba(6,78,59,0.4)',
                    border: '1px solid rgba(255,255,255,0.35)',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#FFFFFF',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ ...SYM_STYLE, fontSize: '14px' }}>
                    science
                  </span>
                  Beta features
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                    borderRadius: '16px',
                    background: 'rgba(6,78,59,0.4)',
                    border: '1px solid rgba(255,255,255,0.35)',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#FFFFFF',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ ...SYM_STYLE, fontSize: '14px' }}>
                    sell
                  </span>
                  Founder pricing
                </span>
              </div>

              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                <input
                  type="text"
                  placeholder="Full name"
                  className="es-input"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '15px 20px',
                    borderRadius: '16px',
                    color: '#FFFFFF',
                    fontFamily: 'var(--font-display)',
                    fontSize: '15px',
                    fontWeight: 500,
                    outline: 'none',
                  }}
                />
                <input
                  type="email"
                  placeholder="Work email"
                  className="es-input"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '15px 20px',
                    borderRadius: '16px',
                    color: '#FFFFFF',
                    fontFamily: 'var(--font-display)',
                    fontSize: '15px',
                    fontWeight: 500,
                    outline: 'none',
                  }}
                />
                <button
                  onClick={submit}
                  className="es-submit-btn"
                  style={{
                    width: '100%',
                    padding: '15px 20px',
                    borderRadius: '16px',
                    border: 'none',
                    color: '#047857',
                    fontFamily: 'var(--font-display)',
                    fontSize: '15px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ ...SYM_STYLE, fontSize: '18px' }}>
                    {submitIcon}
                  </span>
                  {submitLabel}
                </button>
              </div>

              <p
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  margin: 0,
                  textShadow: '0 1px 2px rgba(0,0,0,0.22)',
                }}
              >
                <span className="material-symbols-outlined" style={{ ...SYM_STYLE, fontSize: '14px' }}>
                  lock
                </span>
                No spam. Unsubscribe anytime.
              </p>
            </div>
          </div>
          </div>
          {/* Picker last in the portal: same z as the overlay, later in the
              DOM, so variants stay switchable while the screen is expanded. */}
          <VariantPicker
            labels={VARIANTS.map((v) => v.label)}
            index={variantIndex}
            onSelect={selectVariant}
          />
          </>,
          document.body,
        )}
      </div>
    </div>
  )
}
