/**
 * Per-animation usage guides for the Animations Registry page, keyed by the
 * component-registry slug. Plain data module (Fast Refresh boundary — no
 * component exports live here, only exports from AnimationsRegistry.tsx).
 */

export interface AnimationGuide {
  /** One line: when to reach for this animation. */
  when: string
  /** Duration/easing tokens this animation wraps. */
  tokens: string
  /** One do line. */
  doLine: string
  /** One don't line. */
  dontLine: string
}

export const GUIDES: Record<string, AnimationGuide> = {
  'animated-list': {
    when: 'Live/real-time feeds where rows arrive continuously and older rows must age out (activity streams, notifications).',
    tokens: 'Per-row entrance/removal timer at 560ms, wrapped in var(--anim-mult).',
    doLine: 'Do cap maxVisible so the slot model stays a fixed, absolute-positioned stack.',
    dontLine: "Don't reuse it for a static, finite list — the absolute-slot model exists only to absorb continuous churn.",
  },
  'number-flow': {
    when: 'Any numeral that changes value in place — currency, counters, percentages — where a hard cut reads as broken.',
    tokens: '--duration-slow (220ms) / --duration-base (160ms) transform+box-shadow, eased with --ease-out and --ease-spring.',
    doLine: 'Do use DsNumberFlow for the house tabular-nums treatment instead of raw @number-flow/react.',
    dontLine: "Don't drive it from Math.random() in production copy — reserve nondeterministic values for demo/shuffle contexts only.",
  },
  'prize-sheet': {
    when: 'A rewarding, high-stakes claim moment (bonus unlock, milestone) that deserves a dedicated confetti moment — not routine confirmations.',
    tokens: '--duration-560/--duration-expand spring-loose entrance, --duration-sweep fade, all via --ease-spring-loose/--ease-spring-medium/--ease-fade.',
    doLine: 'Do keep it mobile bottom-sheet / desktop dialog responsive — the two surfaces share one claim flow.',
    dontLine: "Don't stack more than one prize sheet trigger on a screen; the claim flow assumes a single focal reward.",
  },
  shimmer: {
    when: 'Content still loading behind a card or list row, as a placeholder that communicates "more is coming" without a blocking spinner.',
    tokens: '--shim-dur (1500ms default) continuous loop, wave via --ease-linear, pulse via --ease-in-out.',
    doLine: 'Do swap it out the moment real content resolves — it is a loading state, not decoration.',
    dontLine: "Don't run it indefinitely with no data fetch behind it; a shimmer with nothing to reveal reads as a stuck UI.",
  },
}
