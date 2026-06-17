// Mirrors the CSS --space-* / --gap-* tokens in
// apps/web/design-system/preview/_shared-feedback.css.
// Use these constants for JS-positioned elements (getBoundingClientRect offsets,
// inline style gaps, drag handlers) that cannot read CSS custom properties cheaply.

/** 4 px base ladder — matches --space-1 through --space-8. */
export const SPACE = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 32,
  8: 40,
} as const

/** Named use-case gaps — matches --gap-icon-text, --pad-card, --gap-stack, --gap-inline. */
export const GAP = {
  iconText: 8,
  card: 16,
  stack: 12,
  inline: 8,
} as const
