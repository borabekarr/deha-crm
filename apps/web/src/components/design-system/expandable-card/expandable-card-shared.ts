// Non-component style helpers and constants shared between ExpandableCard.tsx
// and its sibling card render components (MeetingCard.tsx / TaskCard.tsx /
// WeatherCard.tsx), split out so ExpandableCard.tsx's default export stays
// the only component export in its file (react-doctor/only-export-components
// -- value exports alongside a component defeat Fast Refresh). Values,
// ordering and comments are unchanged from ExpandableCard.tsx.
import type { CSSProperties } from 'react'
import type { MouseEvent } from 'react'

// Raw source Component defaults (data-props schema): animationDuration 0.5s.
export const DURATION_S = 0.5
// Same 0.5s leg, in the ms unit useAutoHeight's `duration` option takes; the
// hook multiplies it by --anim-mult itself, so the height leg is now
// anim-mult compliant where the hand-rolled inline transition was not.
export const DURATION_MS = DURATION_S * 1000
// The raw source's own custom-property reference, passed through verbatim —
// value-identical substitution, nothing minted (see header note).
export const HEIGHT_EASING = 'var(--ease-spring)'
export const CARD_WIDTH_COLLAPSED = 320
export const CARD_WIDTH_EXPANDED = 420
// (expandDirection 'both' ? 320 : 420) - 56, fixed since expandDirection is
// pinned at its 'both' default (see header comment above).
export const INNER_WIDTH = CARD_WIDTH_EXPANDED - 56
// hoverToExpand tweaks-panel default: false.
export const HOVER_TO_EXPAND = false

export const ATTENDEES = [
  { i: 'AK', bg: '#10B981' },
  { i: 'MJ', bg: '#0F172A' },
  { i: 'SL', bg: '#F59E0B' },
  { i: 'RD', bg: '#64748B' },
]
export const CONDITIONS = [
  { icon: 'humidity_percentage', value: '45%', label: 'Humidity' },
  { icon: 'air', value: '8 mph', label: 'Wind' },
  { icon: 'rainy', value: '0%', label: 'Precip' },
]
export const FORECAST = [
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
export const VARIANTS = [
  { id: 'main', label: 'Main' },
  { id: 'brisk', label: 'Brisk' },
  { id: 'cascade', label: 'Cascade' },
] as const
export type VariantId = (typeof VARIANTS)[number]['id']

type VariantMotion = {
  heightMs: (open: boolean) => number
  heightEasing: string
  width: string
  chevron: string
  inner: (open: boolean) => CSSProperties
}

export const MOTION: Record<VariantId, VariantMotion> = {
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

export function cardStyle(open: boolean, v: VariantId): CSSProperties {
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

export function innerStyle(open: boolean, v: VariantId): CSSProperties {
  return { width: `${INNER_WIDTH}px`, ...MOTION[v].inner(open) }
}

export function chevStyle(open: boolean, v: VariantId): CSSProperties {
  return {
    fontSize: '20px',
    color: '#94A3B8',
    transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
    transition: MOTION[v].chevron,
  }
}

export const stop = (e: MouseEvent) => e.stopPropagation()
