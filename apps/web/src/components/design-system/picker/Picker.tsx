import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
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
import '../../../../design-system/preview/_darkmode.css'
import './Picker.css'
import { VariantPicker } from './VariantPicker'

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

// Raw source constants (picker.html): `ITEM_H = 44`, `OPEN_W = 328`,
// `OPEN_H = 466`. The 132px spacer divs above/below each wheel's items are
// literals in the raw markup ((7 * 44 - 44) / 2), as is the 308px wheel
// height (7 * 44).
// F7: OPEN_H trimmed 466 -> 453 (13px) to equalize the confirm button's
// vertical gaps -- gap above (tray bottom -> confirm top, driven by
// `--gap-stack`) measured 16px while gap below (confirm bottom -> card
// bottom) measured 29px; shortening the card's bottom by the 13px
// difference brings both to 16px without touching the top gap.
const ITEM_H = 44
const OPEN_W = 328
const OPEN_H = 453

// Raw source: `const t = (ms) => 'calc(' + ms + 'ms * var(--anim-mult, 1))'`.
const t = (ms: number) => `calc(${ms}ms * var(--anim-mult, 1))`

// Idle-snap settle duration for the JS-driven wheel snap (ds-review-inputs
// step 3). MIRROR: --duration-slow (220ms) in src/styles/motion-tokens.css --
// the same 220ms the sibling raw Picker.jsx uses for its self-driven idle snap
// (see header note). rAF cannot read a CSS custom property per frame, so the
// number is duplicated here and this comment is the sync trail.
const SNAP_DUR = 220

// The rAF goal channel writes scrollTop per frame, so the repo-wide
// `@media (prefers-reduced-motion: reduce) { scroll-behavior: auto !important }`
// guard in src/styles/global.css cannot reach it. Every goal-channel entry
// point checks this live (no effect/listener) and jumps instantly instead.
const reducedMotion = () =>
  typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const p2 = (n: number) => String(n).padStart(2, '0')

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// ---------------------------------------------------------------------------
// Style tables — raw source's shellStyle/boxStyle/glyphStyle/contentStyle/
// closeStyle, value-for-value.
// ---------------------------------------------------------------------------

// Bare trigger (no shell) <-> grey shell bezel around the open card
// (_base.css .shell)
const shellStyle = (open: boolean): CSSProperties => ({
  width: 'fit-content',
  borderRadius: '28px',
  padding: open ? '10px' : '0px',
  background: open ? 'var(--shell-bg)' : 'transparent',
  boxShadow: open ? '0 10px 30px rgba(15,23,42,0.12), 0 2px 8px rgba(15,23,42,0.06)' : 'none',
  transition: `padding ${t(500)} var(--ease-spring-pop), background-color ${t(300)} var(--ease-fade), box-shadow ${t(300)} var(--ease-fade)`,
})

// FAB-style morph styles (mirrors _fab.css timings/beziers)
const boxStyle = (open: boolean): CSSProperties => {
  // ds-review-inputs step 3 adds the `transform` leg only: the closed 58px pill
  // had no press acknowledgement at all, so the 500ms morph was the first
  // feedback a tap ever produced. The scale itself lives in Picker.css
  // (.pk-box[data-open="false"]:active), gated to the closed state so an open
  // card never scales. 120ms MIRROR: --duration-fast -- press feedback is the
  // system responding, so it is the fastest tier, well inside the morph.
  // ds-motion-sweep step 3: border-radius used to only animate on the CLOSE
  // direction (440ms leg appended below `common`, "open: radius snaps
  // instantly"), so exit carried one extra transition leg enter never had --
  // exactly the "exit isn't just the enter reversed" defect Bora flagged.
  // Folded into `common` so both directions share the identical duration and
  // property set as width/height.
  //
  // F4 rework: border-radius stayed on --ease-spring-pop (matching
  // width/height) until a live probe showed the computed radius clamping to
  // 0px mid-expand -- the overshoot amplitude that makes width/height read as
  // a "pop" drives an interpolated px radius temporarily past its target,
  // and the browser floors it at 0, producing the "weird corners" defect
  // (a lopsided, near-square silhouette a few frames into the liquid
  // expand). --ease-standard has no overshoot, so radius now shrinks
  // monotonically to var(--card-radius) over the same 500ms window while
  // width/height keep their spring-pop liquid character.
  const common = `width ${t(500)} var(--ease-spring-pop), height ${t(500)} var(--ease-spring-pop), border-radius ${t(500)} var(--ease-standard), background-color ${t(300)} var(--ease-fade), border-color ${t(300)} var(--ease-fade), box-shadow ${t(300)} var(--ease-fade), transform ${t(120)} var(--ease-standard)`
  return {
    position: 'relative', overflow: 'hidden', boxSizing: 'border-box',
    cursor: open ? 'default' : 'pointer',
    // F10: the confirmed pill keeps the SAME footprint as the unconfirmed
    // 58px button (no auto/padding growth) -- the glyph row inside morphs,
    // the box itself never resizes on confirm.
    width: open ? `${OPEN_W}px` : '58px',
    height: open ? `${OPEN_H}px` : '58px',
    borderRadius: open ? 'var(--card-radius)' : '9999px',
    backgroundColor: open ? 'var(--card-bg)' : '#10B981',
    backgroundImage: open
      ? 'none'
      : 'linear-gradient(rgba(255,255,255,0.13) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.13) 1px, transparent 1px)',
    backgroundSize: '9px 9px',
    border: `1px solid ${open ? 'var(--card-border)' : 'transparent'}`,
    boxShadow: open
      ? 'inset 0 1px 0 rgba(255,255,255,0.9), inset 0 0 0 1px rgba(15,23,42,0.04)'
      : '0 14px 34px -8px rgba(16,185,129,0.55), inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -2px 0 rgba(0,0,0,0.22), inset 0 0 0 1px rgba(255,255,255,0.15)',
    transition: common,
    fontFamily: 'var(--font-display)',
  }
}

const glyphStyle = (open: boolean): CSSProperties => ({
  position: 'absolute', inset: '0', display: 'grid', placeItems: 'center',
  color: '#fff', pointerEvents: 'none', zIndex: 2,
  opacity: open ? 0 : 1,
  transform: open ? 'rotate(45deg) scale(0.6)' : 'none',
  transition: `opacity ${t(180)} var(--ease-fade), transform ${t(280)} var(--ease-standard)`,
})

// F4 rework: this "inner shell" (the card content) used to run its own
// 220/320ms fade+slide, delayed 120ms after open, while the "outer shell"
// (boxStyle's pill<->card morph, above) ran a flat 500ms spring-pop with no
// delay -- a live probe confirmed the two computed transition strings shared
// no duration, easing, or delay, which is the "inner + outer shells animate
// independently" defect. Content's opacity/transform now ride the exact
// same t(500) / --ease-spring-pop pair as the box's width/height legs, with
// no delay in either direction, so both shells read as one liquid
// choreography instead of a card that pops open and then, separately,
// fades its contents in afterward.
const contentStyle = (open: boolean): CSSProperties => ({
  position: 'absolute', top: '0', left: '0',
  width: `${OPEN_W}px`, height: `${OPEN_H}px`, boxSizing: 'border-box',
  padding: 'var(--pad-card)', display: 'flex', flexDirection: 'column',
  opacity: open ? 1 : 0,
  transform: open ? 'none' : 'translateY(12px)',
  pointerEvents: open ? 'auto' : 'none',
  transition: `opacity ${t(500)} var(--ease-spring-pop), transform ${t(500)} var(--ease-spring-pop)`,
})

const closeStyle = (open: boolean): CSSProperties => ({
  flexShrink: 0, width: '26px', height: '26px', borderRadius: '50%',
  background: 'rgba(15,23,42,0.07)', border: 'none', cursor: 'pointer',
  display: 'grid', placeItems: 'center', color: 'var(--fg3)',
  opacity: open ? 1 : 0,
  transform: open ? 'scale(1)' : 'scale(0.5)',
  pointerEvents: open ? 'auto' : 'none',
  transition: `opacity ${t(200)} var(--ease-fade) ${open ? t(160) : '0ms'}`
    + `, transform ${t(240)} var(--ease-spring-soft) ${open ? t(160) : '0ms'}`,
})

// Static inline styles lifted verbatim from the raw markup's own
// `style="..."` attributes.
const headerRowStyle: CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 'var(--gap-icon-text)' }
const headerColStyle: CSSProperties = { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }
const titleStyle: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 'var(--gap-icon-text)',
  fontSize: 'var(--type-h4)', fontWeight: 900, letterSpacing: '-0.015em', color: 'var(--fg1)',
}
const selectionBarStyle: CSSProperties = {
  position: 'absolute', left: '10px', right: '10px', top: '50%', height: '44px',
  transform: 'translateY(-50%)', borderRadius: '12px',
  background: 'var(--card-bg)', border: '1px solid var(--card-border)',
  boxShadow: '0 1px 3px rgba(15,23,42,0.08)', pointerEvents: 'none',
}
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
const footerRowStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--gap-stack)',
}

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

const WHEEL_NAMES = ['day', 'month', 'hour', 'minute'] as const
type WheelName = (typeof WHEEL_NAMES)[number]

interface WheelRuntime {
  last: number
  idle: number
  snapped: boolean
  init: number | null
  goal: number | null
  goalFrom?: number
  goalT0?: number
  goalDur?: number
}

// piecewise linear interpolation, clamped
function interp(x: number, xs: number[], ys: number[]): number {
  if (x <= xs[0]) return ys[0]
  for (let i = 1; i < xs.length; i++) {
    if (x <= xs[i]) return ys[i - 1] + (ys[i] - ys[i - 1]) * (x - xs[i - 1]) / (xs[i] - xs[i - 1])
  }
  return ys[ys.length - 1]
}

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
  const wstRef = useRef<Partial<Record<WheelName, WheelRuntime>>>({})
  const selRef = useRef<Partial<Record<WheelName, number>>>({})

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

  const getWheel = useCallback(
    (name: WheelName) => rootRef.current?.querySelector<HTMLElement>(`[data-wheel="${name}"]`) ?? null,
    [],
  )

  const writeOutputs = useCallback(() => {
    const val = (name: WheelName) => {
      const w = getWheel(name)
      if (!w) return ''
      const items = w.querySelectorAll<HTMLElement>('[data-item]')
      const i = selRef.current[name] || 0
      return items[i] ? (items[i].textContent ?? '').trim() : ''
    }
    const dateOut = rootRef.current?.querySelector<HTMLElement>('[data-out="date"]')
    if (dateOut) dateOut.textContent = `${val('day')} ${val('month').slice(0, 3)}`
    const timeOut = rootRef.current?.querySelector<HTMLElement>('[data-out="time"]')
    if (timeOut) timeOut.textContent = `${val('hour')}:${val('minute')}`
  }, [getWheel])

  const updateWheel = useCallback((name: WheelName) => {
    const w = getWheel(name)
    if (!w) return
    const sc = w.querySelector<HTMLElement>('[data-scroller]')
    if (!sc) return
    const items = sc.querySelectorAll<HTMLElement>('[data-item]')
    const st = sc.scrollTop / ITEM_H
    items.forEach((el, i) => {
      const nd = st - i
      const ad = Math.abs(nd)
      const opacity = interp(ad, [0, 0.3, 0.6, 1, 1.5, 2], [1, 0.85, 0.6, 0.35, 0.15, 0.05])
      const scale = interp(ad, [0, 1, 2], [1, 0.96, 0.94])
      const ty = interp(nd, [-3, -2, -1, 0, 1, 2, 3], [15, 10, 5, 0, -5, -10, -15])
      const rx = interp(nd, [-3, -2, -1, 0, 1, 2, 3], [85, 60, 30, 0, -30, -60, -85])
      const blur = interp(ad, [0, 0.6, 1.2, 2], [0, 0.8, 1.5, 2.5])
      el.style.opacity = String(opacity)
      el.style.transform = `perspective(1400px) translateY(${ty}px) rotateX(${rx}deg) scale(${scale})`
      el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : ''
      const sel = ad < 0.5
      el.style.color = sel ? 'var(--fg1)' : ''
      el.style.fontWeight = sel ? '800' : '600'
    })
    const idx = Math.max(0, Math.min(items.length - 1, Math.round(st)))
    if (selRef.current[name] !== idx) {
      selRef.current[name] = idx
      writeOutputs()
    }
  }, [getWheel, writeOutputs])

  // Programmatic scrolls are driven by our own rAF animation in tick()
  // (native smooth scrollTo stalls when it races the idle-snap logic).
  const scrollWheelTo = useCallback((name: WheelName, index: number, smooth: boolean) => {
    const w = getWheel(name)
    if (!w) return
    const sc = w.querySelector<HTMLElement>('[data-scroller]')
    if (!sc) return
    const s = wstRef.current[name]
      || (wstRef.current[name] = { last: -1, idle: 0, snapped: true, init: null, goal: null })
    const target = index * ITEM_H
    // reduced motion: the Today/Now jump (and click-to-item) lands instantly --
    // the rAF goal channel is invisible to the global scroll-behavior guard.
    if (!smooth || reducedMotion()) {
      s.goal = null
      s.init = target // asserted every tick until it sticks
      sc.scrollTop = target
    } else {
      s.init = null
      s.goal = target
      s.goalFrom = sc.scrollTop
      s.goalT0 = performance.now()
      s.goalDur = Math.min(350, Math.max(140, Math.abs(target - sc.scrollTop) * 0.6))
        * (document.documentElement.getAttribute('data-anim-slow') === 'true' ? 4 : 1)
    }
  }, [getWheel])

  const expectedCount = useCallback(
    (name: WheelName) => ({ day: 31, month: 12, hour: 24, minute: Math.ceil(60 / step) })[name],
    [step],
  )

  const initWheels = useCallback(() => {
    const d = new Date()
    const initial: Record<WheelName, number> = {
      day: d.getDate() - 1,
      month: d.getMonth(),
      hour: d.getHours(),
      minute: Math.round(d.getMinutes() / step) % Math.ceil(60 / step),
    }
    let allReady = true
    WHEEL_NAMES.forEach((name) => {
      const w = getWheel(name)
      if (!w) { allReady = false; return }
      const sc = w.querySelector<HTMLElement>('[data-scroller]')
      if (!sc) { allReady = false; return }
      const count = sc.querySelectorAll('[data-item]').length
      if (count < expectedCount(name)) { allReady = false; return }
      if (!sc.dataset.wired) {
        sc.dataset.wired = '1'
        sc.addEventListener('click', (e) => {
          const item = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-item]')
          if (!item) return
          const items = Array.from(sc.querySelectorAll<HTMLElement>('[data-item]'))
          scrollWheelTo(name, items.indexOf(item), true)
        })
        // user input cancels any in-flight programmatic scroll
        const cancel = () => {
          const st2 = wstRef.current[name]
          if (st2) { st2.goal = null; st2.init = null }
        }
        sc.addEventListener('wheel', cancel, { passive: true })
        sc.addEventListener('touchstart', cancel, { passive: true })
        wstRef.current[name] = {
          last: -1, idle: performance.now(), snapped: true,
          init: initial[name] * ITEM_H, goal: null,
        }
        sc.scrollTop = initial[name] * ITEM_H
      }
      updateWheel(name)
    })
    writeOutputs()
    return allReady
  }, [expectedCount, getWheel, scrollWheelTo, updateWheel, writeOutputs, step])

  // Raw source componentDidMount(): poll initWheels() every 80ms until every
  // wheel's items exist, plus the rAF tick loop. componentWillUnmount()
  // clears both.
  useEffect(() => {
    let raf = 0
    const initTimer = window.setInterval(() => {
      if (initWheels()) window.clearInterval(initTimer)
    }, 80)

    const tick = () => {
      const now = performance.now()
      WHEEL_NAMES.forEach((name) => {
        const w = getWheel(name)
        if (!w) return
        const sc = w.querySelector<HTMLElement>('[data-scroller]')
        if (!sc || !sc.dataset.wired) return
        const s = wstRef.current[name]
          || (wstRef.current[name] = { last: -1, idle: now, snapped: false, init: null, goal: null })
        // re-assert initial position until it sticks (layout/React commits can
        // reset it)
        if (s.init != null) {
          if (sc.scrollTop !== s.init) sc.scrollTop = s.init
          if (sc.scrollTop === s.init) s.init = null
          s.idle = now
          s.snapped = true
        }
        // drive programmatic smooth scroll ourselves
        if (s.goal != null) {
          const p = Math.min(1, (now - (s.goalT0 ?? now)) / (s.goalDur || 1))
          const e = 1 - Math.pow(1 - p, 3) // easeOutCubic
          sc.scrollTop = (s.goalFrom ?? 0) + (s.goal - (s.goalFrom ?? 0)) * e
          s.idle = now
          s.snapped = true
          if (p >= 1) s.goal = null
        }
        const st = sc.scrollTop
        if (st !== s.last) {
          s.last = st
          s.idle = now
          s.snapped = false
          updateWheel(name)
        } else if (s.goal == null && s.init == null && !s.snapped && now - s.idle > 140) {
          const max = (sc.querySelectorAll('[data-item]').length - 1) * ITEM_H
          const target = Math.max(0, Math.min(max, Math.round(st / ITEM_H) * ITEM_H))
          s.snapped = true
          // ds-review-inputs step 3: route the idle snap through the SAME rAF
          // goal channel the Today/Now jump already uses, instead of the native
          // `scrollTo({behavior:'smooth'})` it used to call. Three reasons:
          // (a) interruption -- the wired `wheel`/`touchstart` cancel handlers
          //     null `goal`, so a second scroll mid-snap hands control straight
          //     back to the user; a native smooth scroll ignores them and keeps
          //     fighting the finger to its own stale target;
          // (b) one physics -- easeOutCubic settles every wheel movement, so the
          //     snap and the jump no longer feel like two different components;
          // (c) the UA smooth scroll is not --anim-mult / data-anim-slow aware,
          //     so Slow-Down debug mode used to skip right past the snap.
          if (Math.abs(st - target) > 0.5) {
            if (reducedMotion()) {
              // reduced motion: settle instantly. CSS `scroll-behavior: auto
              // !important` used to cover this when the snap was a native
              // scrollTo({behavior:'smooth'}); on the rAF channel we must
              // short-circuit in JS ourselves.
              s.goal = null
              s.last = target
              sc.scrollTop = target
              updateWheel(name)
            } else {
              s.goal = target
              s.goalFrom = st
              s.goalT0 = now
              // MIRROR: --duration-slow (220ms); x4 under the raw source's own
              // slowMotion flag, same expression as scrollWheelTo(). Skipped
              // entirely under prefers-reduced-motion (branch above).
              s.goalDur = SNAP_DUR * (document.documentElement.getAttribute('data-anim-slow') === 'true' ? 4 : 1)
            }
          }
        }
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      window.clearInterval(initTimer)
      cancelAnimationFrame(raf)
    }
  }, [getWheel, initWheels, updateWheel])

  // Raw source componentDidUpdate(): re-run initWheels() after every state
  // change (applyGlobalModes() is the excluded tweaks-panel half).
  useEffect(() => {
    initWheels()
  }, [openDate, openTime, initWheels])

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
        {items.map((label, i) => (
          <div
            key={i}
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
      style={{
        boxSizing: 'border-box', minHeight: '100vh', padding: '40px 24px',
        display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start',
        justifyContent: 'center', fontFamily: 'var(--font-display)', background: 'var(--bg-app)',
      }}
    >
      {/* ============ Day · Month picker (FAB-expanding) ============ */}
      <div style={shellStyle(openDate)} data-screen-label="Date picker">
        <div className="pk-box" data-open={openDate ? 'true' : 'false'} style={boxStyle(openDate)} onClick={() => { if (!openDate) setOpenDate(true) }}>

          {/* F10: single glyph row, always mounted -- the icon span never
              unmounts across the confirm morph, only its size/position (and
              the badge text's opacity/max-width) transition via CSS on
              [data-confirmed]. */}
          <div style={glyphStyle(openDate)}>
            <span className="pk-glyph-row" data-confirmed={dateLabel ? 'true' : 'false'}>
              <span className="material-icons pk-trigger-icon">event</span>
              <span className="pk-trigger-badge">{dateLabel ?? ''}</span>
            </span>
          </div>

          <div style={contentStyle(openDate)}>
            <div style={headerRowStyle}>
              <div style={headerColStyle}>
                <span style={titleStyle}><span className="material-icons" style={{ fontSize: '20px', color: '#10B981' }}>calendar_month</span>Pick a day</span>
              </div>
              <button aria-label="Close date picker" style={closeStyle(openDate)} onClick={closeDate}>
                <span className="material-icons" style={{ fontSize: '15px' }}>close</span>
              </button>
            </div>

            <div className="pk-tray" style={{
              position: 'relative', display: 'flex', gap: '8px', justifyContent: 'center',
              background: 'var(--bg-chip)', borderRadius: '16px', padding: '6px',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)', marginTop: 'var(--gap-stack)',
            }}>
              <div className="pk-bar" style={selectionBarStyle} />

              {wheel('day', days, '96px', true)}

              <div className="pk-sep" />

              {wheel('month', months, '156px', false)}
            </div>

            <div style={footerRowStyle}>
              <button type="button" className="pk-today-btn" onClick={jumpToday}><span className="material-icons btn-mi">today</span>Today</button>
              <button type="button" className="btn-primary" onClick={confirmDate}><span className="material-icons btn-mi">check</span>Confirm</button>
            </div>
          </div>
        </div>
      </div>

      {/* ============ Hour · Minute picker (FAB-expanding) ============ */}
      <div style={shellStyle(openTime)} data-screen-label="Time picker">
        <div className="pk-box" data-open={openTime ? 'true' : 'false'} style={boxStyle(openTime)} onClick={() => { if (!openTime) setOpenTime(true) }}>

          <div style={glyphStyle(openTime)}>
            <span className="pk-glyph-row" data-confirmed={timeLabel ? 'true' : 'false'}>
              <span className="material-icons pk-trigger-icon">schedule</span>
              <span className="pk-trigger-badge">{timeLabel ?? ''}</span>
            </span>
          </div>

          <div style={contentStyle(openTime)}>
            <div style={headerRowStyle}>
              <div style={headerColStyle}>
                <span style={titleStyle}><span className="material-icons" style={{ fontSize: '20px', color: '#10B981' }}>schedule</span>Pick a time</span>
              </div>
              <button aria-label="Close time picker" style={closeStyle(openTime)} onClick={closeTime}>
                <span className="material-icons" style={{ fontSize: '15px' }}>close</span>
              </button>
            </div>

            <div className="pk-tray" style={{
              position: 'relative', display: 'flex', justifyContent: 'center',
              background: 'var(--bg-chip)', borderRadius: '16px', padding: '6px',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)', marginTop: 'var(--gap-stack)',
            }}>
              <div className="pk-bar" style={selectionBarStyle} />

              {wheel('hour', hours, '112px', true)}

              <div style={{
                position: 'relative', zIndex: 2, alignSelf: 'center',
                fontSize: '20px', fontWeight: 800, color: 'var(--fg2)', padding: '0 2px',
              }}>:</div>

              {wheel('minute', minutes, '112px', true)}
            </div>

            <div style={footerRowStyle}>
              <button type="button" className="pk-today-btn" onClick={jumpNow}><span className="material-icons btn-mi">schedule</span>Now</button>
              <button type="button" className="btn-primary" onClick={confirmTime}><span className="material-icons btn-mi">check</span>Confirm</button>
            </div>
          </div>
        </div>
      </div>
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
