import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './ExpandableCard.css'

// ---------------------------------------------------------------------------
// Expandable Card — Deha Design System
// Three cards (Meeting / Task / Weather) sit on `.shell.zoom` bezels; a click
// (or Enter/Space) springs each card's width from 320px to 420px and reveals
// a measured-height content region beneath the always-visible header.
//
// Canonical source per CONVERSION-SOP.md: expandable-card.html — the demo
// Bora sees on claude.ai/design (three named, populated cards). The sibling
// expandable-card.jsx is a generic composable Expandable/ExpandableTrigger/
// ExpandableCard/ExpandableContent API with no baked-in demo data at all (no
// "Design Sync" / "Mobile app redesign" / "Today's Weather" content, same
// gap class as BlurCarousel.tsx / ExpandableScreen.tsx's own jsx-sibling
// notes), so it is not pixel-comparable to the HTML demo the gate diffs
// against. Its Expandable/ExpandableContent hooks state machine (isExpanded/
// measured height/opacity+transform reveal with a delayed second phase) is
// functionally identical to the HTML's own Component class (open[]/
// heights[]/cardStyle/contentStyle/innerStyle), so it was read for
// confirmation only; the state machine below follows the .html's own class
// methods (toggle/cardStyle/contentStyle/innerStyle/chevStyle) directly,
// same precedent as BlurCarousel.tsx / ExpandableScreen.tsx's
// jsx-for-confirmation-only note.
//
// hoverToExpand / expandDirection / animationDuration / slowMotion /
// darkMode are the raw source's tweaks-panel props (data-dc-script's
// data-props schema) — ambient claude.ai/design authoring tooling outside
// the component itself, same exclusion as every other <x-dc>-format
// conversion in this repo (ExpandableScreen.tsx's triggerRadius/
// contentRadius/animationDuration, Dropdown's positioning props). This port
// fixes them at their documented defaults: animationDuration 0.5s,
// expandDirection 'both' (so the vertical-only branch never taken — width
// always alternates 320/420, inner content width is always a constant
// 420-56=364px), hoverToExpand false (enter/leave handlers wired but
// permanently inert, same as raw's own `hover()` guard).
//
// `--ease-spring` / `--ease-out` / `--anim-mult` below are not tokenized —
// the raw source's own Component class already writes these as CSS custom
// property references (`var(--ease-spring)` etc, not literal cubic-beziers),
// and the project's own design-system/preview/_shared-feedback.css already
// canonically defines --ease-spring / --ease-out with the exact values the
// raw source's cousin expandable-card.jsx hardcodes for confirmation
// (cubic-bezier(.34,1.56,.64,1) / cubic-bezier(.22,1,.36,1)), loaded ahead
// of every component via src/styles/global.css. Byte-preserving the raw
// source's own `var(--ease-spring)` literal is therefore simultaneously the
// value-identical token substitution CONVERSION-SOP's later tokenization
// pass would otherwise require — nothing left to do in a separate pass.
// ---------------------------------------------------------------------------

import { useCallback, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from 'react'
import { useAutoHeight } from '@/lib/hooks/use-auto-height'
import { VariantPicker } from './VariantPicker'
import './variants.css'

type OpenState = [boolean, boolean, boolean]

// Raw source Component defaults (data-props schema): animationDuration 0.5s.
const DURATION_S = 0.5
// Same 0.5s leg, in the ms unit useAutoHeight's `duration` option takes; the
// hook multiplies it by --anim-mult itself, so the height leg is now
// anim-mult compliant where the hand-rolled inline transition was not.
const DURATION_MS = DURATION_S * 1000
// The raw source's own custom-property reference, passed through verbatim —
// value-identical substitution, nothing minted (see header note).
const HEIGHT_EASING = 'var(--ease-spring)'
const CARD_WIDTH_COLLAPSED = 320
const CARD_WIDTH_EXPANDED = 420
// (expandDirection 'both' ? 320 : 420) - 56, fixed since expandDirection is
// pinned at its 'both' default (see header comment above).
const INNER_WIDTH = CARD_WIDTH_EXPANDED - 56
// hoverToExpand tweaks-panel default: false.
const HOVER_TO_EXPAND = false

const ATTENDEES = [
  { i: 'AK', bg: '#10B981' },
  { i: 'MJ', bg: '#0F172A' },
  { i: 'SL', bg: '#F59E0B' },
  { i: 'RD', bg: '#64748B' },
]
const CONDITIONS = [
  { icon: 'humidity_percentage', value: '45%', label: 'Humidity' },
  { icon: 'air', value: '8 mph', label: 'Wind' },
  { icon: 'rainy', value: '0%', label: 'Precip' },
]
const FORECAST = [
  { day: 'Mon', temp: '70°', pct: '55%' },
  { day: 'Tue', temp: '71°', pct: '62%' },
  { day: 'Wed', temp: '72°', pct: '70%' },
  { day: 'Thu', temp: '73°', pct: '78%' },
  { day: 'Fri', temp: '74°', pct: '86%' },
]

// ── Prototype variants (ds-review-expandables Step 2) ────────────────────
// Three directions behind the picker; `main` (index 0, the cherry-pick
// baseline) reproduces the Step 1 result exactly — every one of its motion
// legs below is the pre-existing string, unchanged. The other two diverge on
// a named axis and reuse the same expand/collapse states, so no new motion is
// introduced; only durations/easings/reveal shape differ.
//   brisk   — personality: no spring anywhere, flat chrome, closes faster
//             than it opens (asymmetric, per review finding #9).
//   cascade — content reveal: rows arrive one after another instead of as one
//             translated block; card lifts on a drop shadow only.
// Duration mirrors: 500/0.5s = the raw source's animationDuration default;
// 420 = var(--duration-420); 280 = var(--duration-280); 200 = var(--duration-200).
const VARIANTS = [
  { id: 'main', label: 'Main' },
  { id: 'brisk', label: 'Brisk' },
  { id: 'cascade', label: 'Cascade' },
] as const
type VariantId = (typeof VARIANTS)[number]['id']

type VariantMotion = {
  heightMs: (open: boolean) => number
  heightEasing: string
  width: string
  chevron: string
  inner: (open: boolean) => CSSProperties
}

const MOTION: Record<VariantId, VariantMotion> = {
  main: {
    heightMs: () => DURATION_MS,
    heightEasing: HEIGHT_EASING,
    width: `width ${DURATION_S}s var(--ease-spring)`,
    chevron: `transform ${DURATION_S}s var(--ease-spring)`,
    inner: (open) => ({
      opacity: open ? 1 : 0,
      transform: open ? 'translateY(0)' : 'translateY(14px)',
      transition:
        `opacity ${DURATION_S * 0.7}s var(--ease-out) ${open ? DURATION_S * 0.25 : 0}s, ` +
        `transform ${DURATION_S}s var(--ease-spring) ${open ? DURATION_S * 0.2 : 0}s`,
    }),
  },
  brisk: {
    heightMs: (open) => (open ? 280 : 200),
    heightEasing: 'var(--ease-out)',
    width: `width calc(var(--duration-280) * var(--anim-mult, 1)) var(--ease-out)`,
    chevron: `transform calc(var(--duration-200) * var(--anim-mult, 1)) var(--ease-out)`,
    inner: (open) => ({
      opacity: open ? 1 : 0,
      transition: `opacity calc(var(--duration-150) * var(--anim-mult, 1)) var(--ease-out)`,
    }),
  },
  cascade: {
    heightMs: (open) => (open ? DURATION_MS : 420),
    heightEasing: HEIGHT_EASING,
    width: `width ${DURATION_S}s var(--ease-spring)`,
    chevron: `transform calc(var(--duration-320) * var(--anim-mult, 1)) var(--ease-spring)`,
    // The rows carry the reveal (variants.css); the wrapper stays neutral.
    inner: () => ({ opacity: 1 }),
  },
}

function cardStyle(open: boolean, v: VariantId): CSSProperties {
  return {
    width: `${open ? CARD_WIDTH_EXPANDED : CARD_WIDTH_COLLAPSED}px`,
    boxSizing: 'border-box',
    alignSelf: 'flex-start',
    // Isolation fix: each card sits in its own fixed-width grid column
    // (xc-root below), so it must not stretch to fill that column while
    // collapsed -- otherwise it would render at 420px regardless of `open`.
    justifySelf: 'start',
    transition:
      `${MOTION[v].width}, ` +
      `transform calc(220ms * var(--anim-mult, 1)) var(--ease-out), ` +
      `box-shadow calc(220ms * var(--anim-mult, 1)) var(--ease-out)`,
  }
}

// The content wrapper's height leg is owned by useAutoHeight (imperative
// inline height/overflow/transition writes); `.xc-content` in the stylesheet
// only supplies the pre-effect resting state (height 0 / overflow hidden) so
// there is no first-paint flash of open content.

function innerStyle(open: boolean, v: VariantId): CSSProperties {
  return { width: `${INNER_WIDTH}px`, ...MOTION[v].inner(open) }
}

function chevStyle(open: boolean, v: VariantId): CSSProperties {
  return {
    fontSize: '20px',
    color: '#94A3B8',
    transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
    transition: MOTION[v].chevron,
  }
}

export default function ExpandableCardDemo() {
  const [open, setOpen] = useState<OpenState>([false, false, false])

  // Picker selection, persisted across reload via `?v=N` (falls back to 1 =
  // main). Read lazily and written in the click handler, so no effect is added
  // to the component itself; the picker's own listeners live in VariantPicker.
  const [variantIndex, setVariantIndex] = useState(() => {
    const raw = Number.parseInt(new URLSearchParams(window.location.search).get('v') ?? '', 10)
    return raw >= 1 && raw <= VARIANTS.length ? raw - 1 : 0
  })
  const variant = VARIANTS[variantIndex].id
  const selectVariant = useCallback((i: number) => {
    setVariantIndex(i)
    setOpen([false, false, false])
    const url = new URL(window.location.href)
    url.searchParams.set('v', String(i + 1))
    window.history.replaceState(null, '', url)
  }, [])

  // House hook replaces raw's componentDidMount `this._measure` +
  // resize/fonts re-measure entirely: it measures the live scrollHeight at
  // toggle time, re-measures from the *rendered* height when interrupted
  // mid-animation, resolves back to `auto` (so late font/content growth
  // tracks itself via its ResizeObserver) and honours --anim-mult and
  // prefers-reduced-motion. Three fixed cards => three fixed hook calls.
  // Per-variant duration/easing; `main` resolves to the same 500ms /
  // var(--ease-spring) pair Step 1 shipped.
  const hookOpts = (i: number) => ({
    open: open[i],
    duration: MOTION[variant].heightMs(open[i]),
    easing: MOTION[variant].heightEasing,
  })
  const autoHeights = [
    useAutoHeight<HTMLDivElement>(hookOpts(0)),
    useAutoHeight<HTMLDivElement>(hookOpts(1)),
    useAutoHeight<HTMLDivElement>(hookOpts(2)),
  ]

  const setCardOpen = useCallback((i: number, v: boolean) => {
    setOpen((prev) => {
      if (prev[i] === v) return prev
      const next = [...prev] as OpenState
      next[i] = v
      return next
    })
  }, [])

  const toggle = useCallback((i: number) => {
    setOpen((prev) => {
      const next = [...prev] as OpenState
      next[i] = !next[i]
      return next
    })
  }, [])

  const keyHandler = (i: number) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggle(i)
    }
  }
  const handleEnter = (i: number) => () => {
    if (HOVER_TO_EXPAND) setCardOpen(i, true)
  }
  const handleLeave = (i: number) => () => {
    if (HOVER_TO_EXPAND) setCardOpen(i, false)
  }
  const stop = (e: MouseEvent) => e.stopPropagation()

  return (
    <div
      data-screen-label="Expandable Card"
      className="xc-root"
      data-variant={variant}
      style={{
        minHeight: '100vh',
        boxSizing: 'border-box',
        background: '#FFFFFF',
        backgroundImage:
          'radial-gradient(ellipse at top right, rgba(16,185,129,0.08) 0%, rgba(248,250,252,1) 50%, #FFFFFF 100%)',
        fontFamily: 'var(--font-display)',
        // Isolation fix: a flex row with justifyContent:'center' re-centers
        // (and so shifts) every sibling whenever any one card's width
        // changes. Fixed-width grid columns give each card its own
        // reserved footprint at the card's largest (expanded) size, so a
        // card growing inside its own column never moves its neighbors --
        // the "promote to its own layer" isolation the plan calls for,
        // expressed as layout containment rather than a portal.
        display: 'grid',
        gridTemplateColumns: `repeat(3, ${CARD_WIDTH_EXPANDED}px)`,
        alignItems: 'start',
        justifyContent: 'center',
        gap: '28px',
        padding: '72px 48px',
      }}
    >
      {/* ── Card 1 · Meeting ─────────────────────────────── */}
      <div
        className="shell zoom"
        role="button"
        tabIndex={0}
        aria-label="Toggle expand"
        onClick={() => toggle(0)}
        onKeyDown={keyHandler(0)}
        onMouseEnter={handleEnter(0)}
        onMouseLeave={handleLeave(0)}
        data-open={open[0]}
        style={cardStyle(open[0], variant)}
      >
        <div className="card-inner" style={{ overflow: 'hidden', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <span className="badge time">
              <span className="msym" style={{ fontSize: '12px' }}>
                schedule
              </span>
              In 15 mins
            </span>
            <span className="msym" style={chevStyle(open[0], variant)}>
              expand_more
            </span>
          </div>
          <h3
            className="xc-title"
            style={{ margin: '14px 0 4px', fontSize: '17px', fontWeight: 900, letterSpacing: '-0.01em', color: '#0F172A' }}
          >
            Design Sync
          </h3>
          <div
            className="xc-meta"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#64748B' }}
          >
            <span className="msym" style={{ fontSize: '15px', color: '#94A3B8' }}>
              calendar_today
            </span>
            1:30PM <span style={{ color: '#94A3B8' }}>→</span> 2:30PM
          </div>

          <div className="xc-content" ref={autoHeights[0].ref}>
            <div style={innerStyle(open[0], variant)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '18px' }}>
                <div style={{ display: 'flex' }}>
                  {ATTENDEES.map((a) => (
                    <span
                      key={a.i}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: a.bg,
                        color: '#fff',
                        display: 'inline-grid',
                        placeItems: 'center',
                        fontSize: '11px',
                        fontWeight: 900,
                        border: '2px solid #fff',
                        marginLeft: '-6px',
                        boxShadow: 'inset 0 -1.5px 0 rgba(0,0,0,0.18)',
                        textShadow: '0 1px 2px rgba(0,0,0,0.25)',
                      }}
                    >
                      {a.i}
                    </span>
                  ))}
                </div>
                <span className="badge tag">
                  <span className="material-icons msym">videocam</span>
                  Zoom
                </span>
              </div>
              <p
                className="xc-meta"
                style={{ margin: '14px 0 0', fontSize: '12.5px', fontWeight: 600, color: '#64748B', lineHeight: 1.55 }}
              >
                Weekly sync on the expandable card system — review spring motion, collapsed sizes and the reveal stagger.
              </p>
              <button className="btn-green" onClick={stop} style={{ width: '100%', marginTop: '16px', justifyContent: 'center' }}>
                <span className="msym" style={{ fontSize: '16px' }}>
                  videocam
                </span>
                Join meeting
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Card 2 · Task ────────────────────────────────── */}
      <div
        className="shell zoom"
        role="button"
        tabIndex={0}
        aria-label="Toggle expand"
        onClick={() => toggle(1)}
        onKeyDown={keyHandler(1)}
        onMouseEnter={handleEnter(1)}
        onMouseLeave={handleLeave(1)}
        data-open={open[1]}
        style={cardStyle(open[1], variant)}
      >
        <div className="card-inner" style={{ overflow: 'hidden', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <span className="badge col-tag progress">
              <span className="material-icons msym" style={{ fontSize: '13px' }}>
                bolt
              </span>
              In progress<span className="count">4</span>
            </span>
            <span className="msym" style={chevStyle(open[1], variant)}>
              expand_more
            </span>
          </div>
          <h3
            className="xc-title"
            style={{ margin: '14px 0 4px', fontSize: '17px', fontWeight: 900, letterSpacing: '-0.01em', color: '#0F172A' }}
          >
            Mobile app redesign
          </h3>
          <div
            className="xc-meta"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#64748B' }}
          >
            <span className="msym" style={{ fontSize: '15px', color: '#94A3B8' }}>
              flag
            </span>
            Due Friday · Sprint 12
          </div>

          <div className="xc-content" ref={autoHeights[1].ref}>
            <div style={innerStyle(open[1], variant)}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '18px',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#64748B',
                }}
              >
                <span style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Progress</span>
                <span style={{ color: '#10B981' }}>68%</span>
              </div>
              <div
                className="xc-track"
                style={{
                  height: '8px',
                  borderRadius: '9999px',
                  background: '#F1F5F9',
                  marginTop: '6px',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.08)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: '68%',
                    height: '100%',
                    borderRadius: '9999px',
                    background: '#10B981',
                    backgroundImage:
                      'linear-gradient(rgba(255,255,255,0.13) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.13) 1px, transparent 1px)',
                    backgroundSize: '7px 7px',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.15)',
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '14px' }}>
                <span className="badge tag">
                  <span className="material-icons msym">palette</span>
                  Design
                </span>
                <span className="badge tag">
                  <span className="material-icons msym">phone_iphone</span>
                  iOS
                </span>
                <span className="badge tag">
                  <span className="material-icons msym">search</span>
                  Research
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px' }}>
                <button className="btn-task" onClick={stop} style={{ '--fbtn': '#0F172A' } as CSSProperties}>
                  <span className="material-icons msym" style={{ fontSize: '14px' }}>
                    dashboard
                  </span>
                  Open board
                </button>
                <button className="btn-discuss" onClick={stop}>
                  <span className="msym" style={{ fontSize: '15px' }}>
                    forum
                  </span>
                  Discuss
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Card 3 · Weather ─────────────────────────────── */}
      <div
        className="shell zoom"
        role="button"
        tabIndex={0}
        aria-label="Toggle expand"
        onClick={() => toggle(2)}
        onKeyDown={keyHandler(2)}
        onMouseEnter={handleEnter(2)}
        onMouseLeave={handleLeave(2)}
        data-open={open[2]}
        style={cardStyle(open[2], variant)}
      >
        <div className="card-inner" style={{ overflow: 'hidden', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <span className="badge gci">
              <span className="material-icons msym" style={{ fontSize: '12px' }}>
                sunny
              </span>
              Sunny
            </span>
            <span className="msym" style={chevStyle(open[2], variant)}>
              expand_more
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px', marginTop: '14px' }}>
            <h3 className="xc-title" style={{ margin: 0, fontSize: '17px', fontWeight: 900, letterSpacing: '-0.01em', color: '#0F172A' }}>
              Today&apos;s Weather
            </h3>
            <span className="xc-title" style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>
              72°F
            </span>
          </div>
          <div
            className="xc-meta"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#64748B',
              marginTop: '4px',
            }}
          >
            <span className="msym" style={{ fontSize: '15px', color: '#F59E0B' }}>
              thermostat
            </span>
            Feels like 75°F · High 78° / Low 65°
          </div>

          <div className="xc-content" ref={autoHeights[2].ref}>
            <div style={innerStyle(open[2], variant)}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', paddingTop: '18px' }}>
                {CONDITIONS.map((c) => (
                  <div
                    key={c.label}
                    className="xc-tile"
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '14px',
                      padding: '10px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span className="msym" style={{ fontSize: '17px', color: '#10B981' }}>
                      {c.icon}
                    </span>
                    <span className="xc-tile-v" style={{ fontSize: '14px', fontWeight: 900, color: '#0F172A' }}>
                      {c.value}
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8' }}>
                      {c.label}
                    </span>
                  </div>
                ))}
              </div>
              <span className="pills-label" style={{ marginTop: '16px' }}>
                5-day forecast
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {FORECAST.map((d) => (
                  <div key={d.day} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <span className="xc-day" style={{ fontSize: '12px', fontWeight: 800, color: '#334155', width: '34px' }}>
                      {d.day}
                    </span>
                    <div
                      className="xc-track"
                      style={{
                        flex: 1,
                        height: '5px',
                        borderRadius: '9999px',
                        background: '#F1F5F9',
                        overflow: 'hidden',
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)',
                      }}
                    >
                      <div style={{ width: d.pct, height: '100%', borderRadius: '9999px', background: '#10B981' }} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', width: '34px', textAlign: 'right' }}>{d.temp}</span>
                  </div>
                ))}
              </div>
              <div
                className="xc-meta"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  marginTop: '14px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#94A3B8',
                }}
              >
                <span className="msym" style={{ fontSize: '13px' }}>
                  update
                </span>
                Last updated: 5 minutes ago
              </div>
            </div>
          </div>
        </div>
      </div>

      <VariantPicker
        labels={VARIANTS.map((v) => v.label)}
        index={variantIndex}
        onSelect={selectVariant}
      />
    </div>
  )
}
