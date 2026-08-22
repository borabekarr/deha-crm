import { useMemo, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
// Same two per-component imports as Toast.tsx / Dropdown.tsx /
// ExpandableScreen.tsx et al: _base.css supplies `.label`, and (via its own
// `@import url('../colors_and_type.css')`, which Vite resolves for a
// component-level import but which does NOT survive global.css's
// Tailwind-processed import chain) the colors_and_type token set this source
// binds inline -- --font-display / --bg-app / --bg-chip / --card-bg /
// --card-border / --card-radius / --pad-card / --shell-bg / --fg1..--fg4 /
// --type-mini / --type-h4 / --tracking-wider / --space-1 / --gap-icon-text /
// --gap-stack. Without it those inline var() references are invalid at
// computed-value time and silently fall back to inherited values.
import '../../../../design-system/preview/_base.css'
// Explicit import of the token source _base.css only pulls in transitively
// (see note above): makes the dependency resolve under Vite dev AND the
// Tailwind-processed global.css chain, instead of relying on _base.css's own
// `@import` surviving both paths.
import '../../../../design-system/colors_and_type.css'
import '../../../../design-system/preview/_darkmode.css'
import './Picker.css'
import { VariantPicker } from './VariantPicker'
import { PickerFace } from './PickerFace'
import { usePickerWheelEngine, type WheelName } from './picker-wheel-engine'

// ---------------------------------------------------------------------------
// Picker — Deha Design System
// Two FAB-expanding wheel pickers side by side: a 58px emerald pill morphs
// into a 328x466 card holding iOS-style 3D scroll wheels (day + month, and
// hour + minute), each with a centered selection bar, depth fade/blur, idle
// snap, and a Today/Now jump button.
//
// Canonical source per CONVERSION-SOP.md:
// apps/web/design-system/claude-design/raw/picker/picker.html — the `<x-dc>` /
// `class Component extends DCLogic` prototype Bora sees on claude.ai/design.
// Everything below is that file's own markup and its Component class's own
// engine (shellStyle/boxStyle/glyphStyle/contentStyle/closeStyle, interp,
// scrollWheelTo, updateWheel, writeOutputs, initWheels, tick), transposed to
// React. Every DOM class name, nesting order, inline style value, duration and
// easing is the raw file's; adaptation is limited to module packaging, TS
// types, and scoping the raw engine's `document.querySelector` lookups to this
// component's own root (the raw page hosts exactly one instance; a route can
// host more).
//
// The sibling Picker.jsx in that same raw dir is a prop-driven single-card API
// (mode="date"|"time", onChange, no baked-in side-by-side demo, badge text
// rendered from React state instead of the `[data-out]` spans, idle snap
// self-driven over 220ms instead of the .html's native smooth scrollTo), so it
// is not pixel-comparable to the .html demo the gate diffs against; it was
// read for confirmation of the wheel math and the morph style tables only, and
// they agree value-for-value with the .html. Same
// jsx-for-confirmation-only precedent as Toast.tsx / AnimatedHeaderScroll.tsx.
//
// Excluded, same as every other `<x-dc>`-format conversion: the raw file's
// `data-props` tweaks-panel schema (darkMode / slowMotion) and the
// `applyGlobalModes()` that consumes it — ambient claude.ai/design authoring
// tooling, not part of the component. Its authored defaults are fixed at the
// literals the raw file ships and its own JS reads back: darkMode false,
// slowMotion false (so no `data-anim-slow` attribute, and the smooth-scroll
// duration multiplier stays 1). `minuteStep` ('1') and `startOpen` (false) are
// genuine component behavior, so they survive as props with those exact
// defaults.
//
// No motion tokenization (ds-rebuild-w3 is a fidelity rebuild): every value
// below is the source literal, except the three easing curves noted at
// SPRING / EASE_STANDARD / EASE_SPRING_SOFT, which the repo's
// motion-token-gate hook requires be written as their byte-identical tokens.
//
// JS-timed motion: the wheels' idle snap and the Today/Now jump run on the raw
// source's own rAF loop with its own hardcoded numbers (140ms idle threshold,
// 140..350ms clamped jump duration, easeOutCubic) — see JS-TIMED MOTION below
// for the mirror-comment trail those constants carry.
// ---------------------------------------------------------------------------

// Easing: four curves appear in the raw source's style tables — the shared
// `const spring = 'cubic-bezier(.34,1.2,.5,1)'`, the two curves spelled inline
// in glyphStyle/contentStyle/closeStyle, and the bare `ease` keyword. All four
// are written below as their value-identical motion tokens instead of those
// literals, because the repo's motion-token-gate hook blocks a literal easing
// inside a transition on write (and only recognizes a `var(--ease-…)` written
// out in the same declaration, so they are spelled inline rather than hoisted
// to constants). motion-tokens.css defines each as EXACTLY the value it
// replaces:
//   cubic-bezier(.34,1.2,.5,1)   -> var(--ease-spring-pop)
//   cubic-bezier(.4,0,.2,1)      -> var(--ease-standard)
//   cubic-bezier(.32,1.32,.5,1)  -> var(--ease-spring-soft)
//   ease                         -> var(--ease-fade)  (cubic-bezier(.25,.1,.25,1),
//                                   the CSS spec's own expansion of the `ease`
//                                   keyword; motion-tokens.css documents it as
//                                   "== bare `ease`")
// Same value-identical-substitution precedent as Toast.tsx / BlurCarousel.css;
// the rendered curves are unchanged.

const p2 = (n: number) => String(n).padStart(2, '0')

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// ---------------------------------------------------------------------------
// Style tables (shellStyle/boxStyle/glyphStyle/contentStyle/closeStyle/
// headerRowStyle/headerColStyle/titleStyle/selectionBarStyle/footerRowStyle)
// live in ./picker-styles.ts, imported below -- kept out of this file so the
// component file only exports its component (react-doctor/
// only-export-components). ITEM_H/SNAP_DUR/reducedMotion/interp/WHEEL_NAMES/
// WheelRuntime moved into ./picker-wheel-engine.ts for the same reason.
// ---------------------------------------------------------------------------
const scrollerStyle: CSSProperties = {
  position: 'absolute', inset: 0, overflowY: 'scroll', scrollbarWidth: 'none',
  // ds-review-inputs step 3 (containment, not a feel value): without this a
  // flick past the first/last row chains the scroll to the route behind the
  // open card and drags the whole page. No visual/timing change.
  overscrollBehavior: 'contain',
  WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 32%, black 68%, transparent 100%)',
  maskImage: 'linear-gradient(to bottom, transparent 0%, black 32%, black 68%, transparent 100%)',
}
const itemStyle: CSSProperties = {
  height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '20px', fontWeight: 600, letterSpacing: '-0.3px', color: 'var(--fg4)',
  cursor: 'pointer', willChange: 'transform, opacity',
}
const spacerStyle: CSSProperties = { height: '132px' }

// ---------------------------------------------------------------------------
// Wheel engine — raw source's interp/scrollWheelTo/updateWheel/writeOutputs/
// initWheels/tick, unchanged apart from being scoped to `root` instead of
// `document`.
//
// JS-TIMED MOTION (mirror-comment convention, per CONVERSION-SOP): none of the
// numbers in this block mirror a motion-tokens.css token — they are the raw
// source's own rAF-loop constants and have no CSS counterpart anywhere in the
// repo, so there is nothing for them to drift out of sync with. They are
// listed here so the trail is explicit:
//   - 140  (ms) idle threshold before a released wheel snaps to the nearest
//          item (`now - s.idle > 140` in tick()).
//   - 0.6 / clamp 140..350 (ms) programmatic jump duration, proportional to
//          the scroll distance (`scrollWheelTo`), times 4 when the raw source's
//          slowMotion tweak sets `data-anim-slow` (excluded default: false).
//          Halved from the original 1.2 / 280..700 per F6 (arrow-slide 2x speed).
//   - easeOutCubic `1 - (1 - p)^3` — the jump's easing, written out because
//          rAF cannot read a CSS easing function.
//   - 0.5  (px) dead zone: a wheel already within half a pixel of its item
//          boundary is left alone instead of re-snapped.
// ---------------------------------------------------------------------------

export interface PickerProps {
  /** Raw source `data-props`: enum '1' | '5' | '15', default '1'. */
  minuteStep?: string | number
  /** Raw source `data-props`: boolean, default false. */
  startOpen?: boolean
}

// ds-review-inputs step 4: prototype variant directions. `main` is the Step 3
// result verbatim; `glass` and `ink` are pure still-treatment deltas in
// variants.css (see the header there). The wheel engine below — rAF goal
// channel, 140ms idle threshold, SNAP_DUR settle, reduced-motion
// short-circuit, Today/Now jump — is shared by all three, unmodified.
const VARIANTS = ['main', 'glass', 'ink'] as const
type VariantId = (typeof VARIANTS)[number]

function PickerBody({ minuteStep = '1', startOpen = false, variant = 'main' }: PickerProps & { variant?: VariantId }) {
  const rootRef = useRef<HTMLDivElement>(null)

  const [openDate, setOpenDate] = useState(!!startOpen)
  const [openTime, setOpenTime] = useState(!!startOpen)

  // Staged-selection commit surface (ds-picker-confirm-flow): scrolling/stepping
  // a wheel only ever moves selRef's draft (existing engine, unchanged). The
  // draft becomes real only on Confirm, which copies it here and drives the
  // trigger label; closing without Confirm reverts the wheels to this ref
  // (or to today if nothing has ever been confirmed) instead of leaving the
  // discarded draft's scroll position sitting in the DOM for next reopen.
  const committedRef = useRef<Partial<Record<WheelName, number>>>({})
  const [dateLabel, setDateLabel] = useState<string | null>(null)
  const [timeLabel, setTimeLabel] = useState<string | null>(null)

  const step = Number(minuteStep ?? 1) || 1

  // Raw source renderVals(): the four lists.
  const days = useMemo(() => Array.from({ length: 31 }, (_, i) => p2(i + 1)), [])
  const months = MONTHS
  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => p2(i)), [])
  const minutes = useMemo(
    () => Array.from({ length: Math.ceil(60 / step) }, (_, i) => p2(i * step)),
    [step],
  )

  const { selRef, scrollWheelTo } = usePickerWheelEngine(rootRef, step, openDate, openTime)

  const jumpToday = (e: MouseEvent) => {
    e.stopPropagation()
    const d = new Date()
    scrollWheelTo('day', d.getDate() - 1, true)
    scrollWheelTo('month', d.getMonth(), true)
  }

  const jumpNow = (e: MouseEvent) => {
    e.stopPropagation()
    const d = new Date()
    scrollWheelTo('hour', d.getHours(), true)
    scrollWheelTo('minute', Math.round(d.getMinutes() / step) % Math.ceil(60 / step), true)
  }

  const stepWheel = (name: WheelName, dir: 1 | -1, count: number) => (e: MouseEvent) => {
    e.stopPropagation()
    const cur = selRef.current[name] ?? 0
    scrollWheelTo(name, Math.max(0, Math.min(count - 1, cur + dir)), true)
  }

  const confirmDate = (e: MouseEvent) => {
    e.stopPropagation()
    const di = selRef.current.day ?? 0
    const mi = selRef.current.month ?? 0
    committedRef.current.day = di
    committedRef.current.month = mi
    setDateLabel(`${days[di]} ${months[mi].slice(0, 3)}`)
    setOpenDate(false)
  }

  const confirmTime = (e: MouseEvent) => {
    e.stopPropagation()
    const hi = selRef.current.hour ?? 0
    const ni = selRef.current.minute ?? 0
    committedRef.current.hour = hi
    committedRef.current.minute = ni
    setTimeLabel(`${hours[hi]}:${minutes[ni]}`)
    setOpenTime(false)
  }

  const closeDate = (e: MouseEvent) => {
    e.stopPropagation()
    const d = new Date()
    scrollWheelTo('day', committedRef.current.day ?? d.getDate() - 1, true)
    scrollWheelTo('month', committedRef.current.month ?? d.getMonth(), true)
    setOpenDate(false)
  }

  const closeTime = (e: MouseEvent) => {
    e.stopPropagation()
    const d = new Date()
    scrollWheelTo('hour', committedRef.current.hour ?? d.getHours(), true)
    scrollWheelTo('minute', committedRef.current.minute ?? Math.round(d.getMinutes() / step) % Math.ceil(60 / step), true)
    setOpenTime(false)
  }

  const wheel = (name: WheelName, items: readonly string[], width: string, numeric: boolean) => (
    <div data-wheel={name} style={{ position: 'relative', width, height: '308px' }}>
      <button type="button" className="pk-arrow pk-arrow-up" aria-label={`${name} up`} onClick={stepWheel(name, -1, items.length)}>
        <span className="material-icons">expand_less</span>
      </button>
      <div data-scroller style={scrollerStyle}>
        <div style={spacerStyle} />
        {items.map((label) => (
          <div
            key={label}
            data-item
            style={numeric ? { ...itemStyle, fontVariantNumeric: 'tabular-nums' } : itemStyle}
          >
            {label}
          </div>
        ))}
        <div style={spacerStyle} />
      </div>
      <button type="button" className="pk-arrow pk-arrow-down" aria-label={`${name} down`} onClick={stepWheel(name, 1, items.length)}>
        <span className="material-icons">expand_more</span>
      </button>
    </div>
  )

  return (
    // `pk-root` is this conversion's only added class (see Picker.css): a
    // scoping hook for the vendored DS pill/button rules, plus the
    // `line-height: normal` that undoes the app route's Tailwind preflight so
    // text rows measure the same as on the preflight-free raw page. Every
    // inline value on this wrapper is the raw source's.
    <div
      ref={rootRef}
      className="pk-root"
      data-variant={variant}
    >
      {/* ============ Day · Month picker (FAB-expanding) ============ */}
      <PickerFace
        screenLabel="Date picker"
        open={openDate}
        onBoxClick={() => { if (!openDate) setOpenDate(true) }}
        triggerAriaLabel="Open date picker"
        onTriggerKeyDown={(e) => {
          if (!openDate && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setOpenDate(true) }
        }}
        triggerIcon="event"
        badgeLabel={dateLabel}
        titleIconColor="#10B981"
        titleIcon="calendar_month"
        titleText="Pick a day"
        closeAriaLabel="Close date picker"
        onClose={closeDate}
        trayStyle={{ gap: '8px' }}
        trayChildren={
          <>
            {wheel('day', days, '96px', true)}
            <div className="pk-sep" />
            {wheel('month', months, '156px', false)}
          </>
        }
        todayBtnIcon="today"
        todayBtnLabel="Today"
        onTodayClick={jumpToday}
        onConfirmClick={confirmDate}
      />

      {/* ============ Hour · Minute picker (FAB-expanding) ============ */}
      <PickerFace
        screenLabel="Time picker"
        open={openTime}
        onBoxClick={() => { if (!openTime) setOpenTime(true) }}
        triggerAriaLabel="Open time picker"
        onTriggerKeyDown={(e) => {
          if (!openTime && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setOpenTime(true) }
        }}
        triggerIcon="schedule"
        badgeLabel={timeLabel}
        titleIconColor="#10B981"
        titleIcon="schedule"
        titleText="Pick a time"
        closeAriaLabel="Close time picker"
        onClose={closeTime}
        trayChildren={
          <>
            {wheel('hour', hours, '112px', true)}
            <div style={{
              position: 'relative', zIndex: 2, alignSelf: 'center',
              fontSize: '20px', fontWeight: 800, color: 'var(--fg2)', padding: '0 2px',
            }}>:</div>
            {wheel('minute', minutes, '112px', true)}
          </>
        }
        todayBtnIcon="schedule"
        todayBtnLabel="Now"
        onTodayClick={jumpNow}
        onConfirmClick={confirmTime}
      />
    </div>
  )
}

/**
 * Prototype harness (ds-review-inputs step 4). The registry renders this
 * default export; the component itself is `PickerBody`, unchanged apart from
 * the `data-variant` attribute it now stamps on `.pk-root`.
 *
 * Keying the body on the variant id re-mounts it on every switch, so the wheel
 * engine re-seeds exactly as it does on a fresh load (PICKER.md: "switching
 * re-mounts the variant"). Selection persists across reload via `?v=N`.
 * No effect is added: the URL write happens in the click handler and the
 * initial read is a lazy useState initializer.
 */
export default function Picker(props: PickerProps) {
  const [index, setIndex] = useState(() => {
    if (typeof window === 'undefined') return 0
    const raw = Number.parseInt(new URLSearchParams(window.location.search).get('v') ?? '', 10)
    return raw >= 1 && raw <= VARIANTS.length ? raw - 1 : 0
  })

  const select = (i: number) => {
    setIndex(i)
    const url = new URL(window.location.href)
    url.searchParams.set('v', String(i + 1))
    window.history.replaceState(null, '', url)
  }

  return (
    <>
      <PickerBody key={VARIANTS[index]} variant={VARIANTS[index]} {...props} />
      <VariantPicker labels={VARIANTS} index={index} onSelect={select} />
    </>
  )
}
