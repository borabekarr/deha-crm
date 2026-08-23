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

/** One global duration/easing rule per recurring interaction family (plan:
 * motion-family-rules), mirroring hover-tokens.css `.hover-standard`. Source
 * of truth is the "Motion family rules" block in motion-tokens.css; this is
 * the human-facing audit trail, not a duplicate definition.
 *
 * Global rule: exit runs one tier faster than enter for open/close pairs
 * (popover, tooltip, accordion, overlay morph, toast). Sliding panel and
 * stagger are excluded from this rule because they are not enter/exit
 * pairs — sliding panel is a live-drag settle and stagger is a per-item
 * DOM-order reveal. */
export interface FamilyRule {
  family: string
  tokens: string
  source: string
  usage: string
  band: string
}

export const FAMILY_RULES: FamilyRule[] = [
  {
    family: 'Popover',
    tokens: '--popover-dur / --popover-exit-dur / --popover-ease',
    source: 'Dropdown.css + MessageDropdown.css (settled curve wins)',
    usage: 'Use .motion-popover for any anchored open/close (menus, comboboxes).',
    band: '200ms open / 150ms close (exit one tier faster).',
  },
  {
    family: 'Tooltip',
    tokens: '--tooltip-dur / --tooltip-exit-dur / --tooltip-ease / --tooltip-transform-ease',
    source: 'WorkflowNodes .wf-tool::after (cleanest monotonic curve)',
    usage: 'Use .motion-tooltip for hover/focus-triggered labels.',
    band: '200ms open / 150ms close (exit one tier faster; recipe defaulted 140ms at component scale).',
  },
  {
    family: 'Sliding panel / drawer',
    tokens: '--panel-settle-dur / --panel-settle-ease',
    source: 'SmoothDrawer.css settle transition (open/close, not live drag)',
    usage: 'Governs the settle only; [data-panel-state] keyframes stay the live-drag primitive.',
    band: 'Fast tier + --ease-out — deviates from a fixed band because live-drag gesture settle is Apple-physics-justified, not a static open/close.',
  },
  {
    family: 'Overlay morph',
    tokens: '--overlay-morph-dur / --overlay-morph-exit-dur / --overlay-morph-ease',
    source: 'MorphSurface.css --ms2-ease/--ms2-morph-dur',
    usage: 'Use .motion-overlay-morph for width/height/border-radius surface morphs.',
    band: '300ms open / 240ms close (exit one tier faster) — MorphSurface itself keeps its local 360ms (--duration-sweep) as a documented dynamic-island-style exception.',
  },
  {
    family: 'Accordion',
    tokens: '--accordion-dur / --accordion-exit-dur / --accordion-ease',
    source: 'DisclosureGroup.css --dg-dur/--dg-ease (easing aliased to house, overshoot dropped)',
    usage: 'Use .motion-accordion for expand/collapse; grid-template-rows stays the documented layout-property exception.',
    band: '380ms open / 260ms close (exit one tier faster), preserved from the recipe rather than compressed to a house band.',
  },
  {
    family: 'Toast',
    tokens: '--toast-dur / --toast-exit-dur / --toast-ease',
    source: 'Toast.css ts-enter keyframe',
    usage: 'Use .motion-toast / .motion-toast.is-exiting (animation-direction: reverse mirrors enter, no second keyframe).',
    band: 'Base tier open (160ms) / 120ms close (exit one tier faster, --duration-fast) — house bands, not a popover/overlay band.',
  },
  {
    family: 'Stagger',
    tokens: '--stagger-item-dur / --stagger-item-ease + --stagger-entrance',
    source: 'AnimatedList.css entry transition + existing --stagger-entrance increment',
    usage: 'Use .motion-stagger-item with --stagger-index set per row for DOM-order reveal.',
    band: '240ms per-item + 100ms DOM-order increment.',
  },
]

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
