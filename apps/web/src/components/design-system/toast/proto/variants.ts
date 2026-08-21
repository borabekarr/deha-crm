// ── toast main variant config (ds-review-overlays step 6) ──────────────────
// The shipped baseline (formerly one of three prototype directions; snap and
// deck plus the prototype picker were released after Bora reviewed and kept
// "main"). This file now holds only main's timing and gesture config.
//
// WHY CONFIG AND NOT A variants.css: the raw source drives every part of a
// toast from INLINE styles written by vm() (wrap transform + transition,
// surface, pills), and the swipe gesture writes transform/transition/opacity
// straight onto the same node. A CSS variant sheet could only win over those
// with !important, which is exactly what would break the drag and the
// hand-back to the phase machine. So this config parameterises vm() and the
// gesture constants instead; nothing here can outrank the gesture legs.
//
// UNCHANGED: the phase machine (enter → shown → exit → gone), the exitIndex
// freeze, the index-keyed 'gone' placeholders, and the hand-back that
// restores cfg.wrapTransition byte-identically.
export type VariantSlug = 'main'

export interface VariantCfg {
  /** Stack geometry: px of peek per slot behind the front toast, and its cap. */
  peekStep: number
  peekMax: number
  /** Stack geometry: scale removed per slot behind the front toast, and its floor. */
  scaleStep: number
  scaleMin: number
  /** Entrance offset (px, away from the viewport edge) and entrance scale. */
  enterY: number
  enterScale: number
  /** The wrap's transition string; also what the gesture hands back to. */
  wrapTransition: string
  /** Swipe commit thresholds (px of travel / px per ms of velocity). */
  swipeDistance: number
  swipeVelocity: number
  /** JS-timed fling + fade, mirrored to the tokens named in the comments. */
  flingMs: number
  fadeMs: number
  /** Fraction of the drag the toasts BEHIND the dragged one follow (0 = off). */
  parallax: number
  /** Card treatment of the toast surface. */
  surface: 'gridded' | 'flat'
}

export const VARIANTS: Record<VariantSlug, VariantCfg> = {
  // 500ms spring-pop entrance, 10px peek, 4.5%-per-slot scale ladder, gridded
  // semantic surface.
  main: {
    peekStep: 10,
    peekMax: 30,
    scaleStep: 0.045,
    scaleMin: 0.86,
    enterY: 110,
    enterScale: 0.9,
    // Raw-source literals (500/280) kept as-is: this variant IS the baseline.
    wrapTransition: `transform calc(500ms * var(--anim-mult, 1)) var(--ease-spring-pop), opacity calc(280ms * var(--anim-mult, 1)) var(--ease-out)`,
    swipeDistance: 72,
    swipeVelocity: 0.5,
    flingMs: 200, // mirrors --duration-200
    fadeMs: 180, // mirrors --duration-180
    parallax: 0,
    surface: 'gridded',
  },
}

export const VARIANT_SLUGS: VariantSlug[] = ['main']
