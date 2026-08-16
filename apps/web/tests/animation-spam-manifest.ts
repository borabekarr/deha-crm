/**
 * Data-only manifest for animation-spam.spec.ts. Plain module, no React
 * imports — must stay Node-importable, same reason the gate test reads
 * component-registry.ts via fs+regex instead of importing it.
 */

/** Fields shared by both target kinds. */
export interface SpamTargetBase {
  slug: string
  /** Selector clicked to open (and, for symmetric toggles, to close too). */
  trigger: string
  /**
   * Set when a target's open button goes `pointer-events: none` while
   * expanded, so closing needs a separate selector than the one that opened
   * it (see pinned-list). Omitted for symmetric toggles (trigger flips both
   * ways there): financial-health-card, status-card.
   */
  closeTrigger?: string
  /**
   * Clicked once (after navigate, and again after reload) to put the component
   * into the state the two-state assertion needs. pinned-list: unpins the
   * second mock-pinned row (Analytics) so the remaining row (Inbox) drives a
   * clean binary toggle of the pinned-count-crosses-zero header instead of
   * staying open no matter what Inbox does. dynamic-calendar: absorbs the
   * hover-preview click race (see that row).
   */
  primerSelector?: string
  /** Rapid-loop click count. Defaults to 8 in the spec. */
  toggles?: number
}

/**
 * Targets whose open/close is driven by the shared `useAutoHeight` hook, so
 * the assertion is a measured-height delta against captured open/closed
 * reference heights.
 */
export interface AutoHeightSpamTarget extends SpamTargetBase {
  kind: 'auto-height'
  /** Element whose measured height the hook animates. */
  expandable: string
  /** useAutoHeight duration passed by the component (ms). */
  durationMs: number
}

/**
 * Targets whose open/close is a plain CSS transition on a property other
 * than measured height (width, flex-basis, opacity, max-height, transform),
 * or whose open surface has a hardcoded size. Instead of a height delta the
 * runner captures the computed value of one CSS property in each state and
 * asserts the post-spam value snaps back to the matching reference.
 *
 * Portal-mounted content is supported: `settleSelector` is resolved against
 * the whole page (never scoped to the component root) and is allowed to be
 * ABSENT from the DOM in the closed state — the runner records absence as
 * its own settle value, so a target that unmounts its open surface still
 * gets a two-state assertion.
 */
export interface ToggleSpamTarget extends SpamTargetBase {
  kind: 'toggle'
  /** Element whose settled CSS state is asserted; may be portal-mounted. */
  settleSelector: string
  /** CSS property read via getComputedStyle to distinguish the two states. */
  settleProperty: string
  /** Longest open/close transition on `settleSelector` (ms) — settle wait. */
  transitionMs: number
}

export type SpamTarget = AutoHeightSpamTarget | ToggleSpamTarget

/**
 * Three-way classification, enforced by the registry coverage gate in
 * animation-spam.spec.ts: EVERY slug the registry marks Finished must appear
 * in exactly one of SPAM_TARGETS (enrolled), WAIVED (animated but not
 * enrollable, needs a reason + date), or STATIC (no animated interaction to
 * spam). The gate derives its population by reading component-registry.ts, so
 * flipping a component to Finished without classifying it FAILS the suite —
 * silent omission is structurally impossible rather than merely discouraged.
 *
 * Entries for not-yet-Finished slugs are allowed in all three lists; the gate
 * only requires coverage in the Finished direction.
 */

/**
 * Slugs deliberately NOT enrolled in SPAM_TARGETS, with the reason and the
 * date the waiver was taken. A waiver is an explicit, dated, typed decision a
 * reviewer can check, not a placeholder.
 */
export interface SpamWaiver {
  slug: string
  reason: string
  /** ISO date the waiver was taken. */
  date: string
}

export const WAIVED: SpamWaiver[] = [
  {
    slug: 'cards',
    reason:
      'Hover/press micro-transitions only (transform+box-shadow on .card-accent / .concentric-demo). No JS state, no trigger that flips two settled states — a click loop leaves the DOM identical to its start.',
    date: '2026-08-08',
  },
  {
    slug: 'ai-caveat',
    reason:
      'Same shape as cards: the only transitions are :hover/:active color+scale on .ai-caveat-link and .ai-action-btn. The banner is a static surface with no open/close state.',
    date: '2026-08-08',
  },
  {
    slug: 'animated-list',
    reason:
      'Push feed on an absolute-slot model: each prepend spawns an ephemeral per-row entrance ref plus a 560ms removal timer, and rows unmount as they age past maxVisible. There is no stable settle element and no two-state toggle to interrupt.',
    date: '2026-08-08',
  },
  {
    slug: 'number-flow',
    reason:
      'The only trigger (.nf-shuffle) sets Math.random() values, so the post-spam state is nondeterministic by construction — no reference value exists to assert a snap-back against.',
    date: '2026-08-08',
  },
  {
    slug: 'ai-message-box',
    reason:
      'Extend-with-AI starts a one-way ~7.7s generating -> exiting -> done -> done-out timer chain, and mbStartGenerating early-returns while .generating is set, so the trigger is self-disabled mid-cycle. Not a click-flips-two-states toggle (same reason as task-board).',
    date: '2026-08-08',
  },
  {
    slug: 'streak-card',
    reason:
      'The four .sc-btn actions mutate streak data forward (mark done, next day, add steps) or replay the mount entrance by re-adding .anim-in; none is a click-flips-two-states toggle, so a spam loop walks the card into a new data state rather than returning it to a reference one.',
    date: '2026-08-08',
  },
  {
    slug: 'buttons',
    reason:
      'Specimen page: everything but the Apply button is hover/press-only micro-interaction (transform+box-shadow, no JS state), and Apply is a one-way default -> is-loading (3000ms) -> is-done (4500ms) -> default timer chain whose runApplyBtn early-returns while either class is set, so the trigger disables itself mid-cycle (same reason as task-board).',
    date: '2026-08-08',
  },
  {
    slug: 'github-calendar',
    reason:
      'Hover-driven only: the single piece of JS state is a tooltip set from onMouseEnter over a heatmap cell and cleared on the grid\'s onMouseLeave. There is no click handler anywhere in the component, so the rapid-click spam loop has no trigger and no two settled states to flip between.',
    date: '2026-08-08',
  },
  {
    slug: 'news-feed',
    reason:
      'The three .nf-btn controls are one-way mode setters (load / skeleton / empty) rather than a click-flips-two-states toggle: load re-adds .anim-in behind a 1900ms self-clearing timer chain, and skeleton/empty just swap is-loading/is-empty classes forward. The prev/next arrows run a timer-sequenced swap (nf-swap-out -> nf-swap-in plus indicator exit/enter classes) with no stable settled pair either.',
    date: '2026-08-08',
  },
  {
    slug: 'task-board',
    reason:
      "SyncFeed's trigger is disabled mid-cycle and drives a ~2s multi-phase async timeline, not a click-flips-two-states toggle. animation-spam.spec.ts covers it with a dedicated bespoke test instead.",
    date: '2026-07-14',
  },
  {
    slug: 'blur-carousel',
    reason:
      'nextBtn/prevBtn drive rail.scrollTo({behavior: "smooth"}) instead of a CSS transition, so there is no fixed transitionMs to settle on: under rapid click-reversal spam the native smooth-scroll animation gets interrupted mid-flight and the rAF listener commits an intermediate transform instead of snapping to the target card (observed: matrix(0.82,0,0,0.82,0) instead of the expected fully-centered matrix(1,0,0,1,0,0) after settle+400ms). See debt/blur-carousel-scroll-interruption.md.',
    date: '2026-08-08',
  },
  {
    slug: 'toast',
    reason:
      "Expandable row is a plain CSS max-height/opacity transition on an inline style object (300ms/240ms, byte-preserved from toast.html's own vm()), and it is not a click-flips-two-states toggle: the trigger pushes a NEW toast each press (up to a live stack), the expandable surface belongs to that toast rather than to a stable page element, and every toast auto-dismisses on its own timer — a rapid-click loop has nothing stable to measure.",
    date: '2026-08-08',
  },
  {
    slug: 'buyer-brain',
    reason:
      "Never calls useAutoHeight: selecting a brain region opens the detail panel through a pure CSS transition on flex-basis/opacity/margin-left (0.42s cubic-bezier(.4,0,.2,1), opacity 0.3s — byte-preserved from buyer-brain.html's .bbq-detail rule) against the fixed 270px basis the source hardcodes. It is also not a click-flips-two-states toggle: clicking a region hit zone only ever SELECTS, and closing is a separate .bbq-back button inside the panel that the opening click never reaches.",
    date: '2026-08-08',
  },
  {
    slug: 'animated-header-scroll',
    reason:
      'Scroll-driven, not click-driven: the only motion is a passive onScroll handler (rAF-coalesced) writing eased progress over COLLAPSE_DIST=92px into CSS custom props on the pinned header. There is no trigger element to click and no useAutoHeight, so the spam runner (which drives a rapid click loop against a trigger) has nothing to interrupt.',
    date: '2026-08-08',
  },
  {
    slug: 'siri-orb',
    reason:
      'Continuous WebGL canvas render: a rAF loop pushes GL uniforms every frame, so the pixels never settle and no computed CSS property distinguishes two states. The click toggle only scales JS uniform multipliers (speed/glow/noise/rotation for listening mode) — no DOM geometry, height, or CSS transition changes, leaving nothing measurable to snap back.',
    date: '2026-08-08',
  },
  {
    slug: 'shimmer',
    reason:
      'No click trigger exists anywhere in the component: ShimmerDemo auto-cycles isLoading via a bare setInterval(2600ms), and the .wave sweep itself is a continuously-looping CSS animation (--shim-dur, default 1500ms) that never settles to a single computed value. Same continuous-loop-never-settles class as siri-orb — there is nothing a click-driven spam loop could interrupt or measure.',
    date: '2026-08-09',
  },
  {
    slug: 'pie-chart',
    reason:
      'Hover-driven only, same shape as github-calendar: pop-out/glow/centroid-tween on a slice and the legend-row highlight both fire from onMouseEnter/onMouseLeave, with zero click handlers on the chart itself (the prototype-picker buttons are scaffold, not the shipped interaction). The one real animated timeline — the 900ms staggered mount sweep — runs once per mount and does not re-arm on any trigger, so there is no click-flips-two-states pair for the spam runner to drive.',
    date: '2026-08-09',
  },
  {
    slug: 'delete-button',
    reason:
      "Attempted real toggle enrollment (kind: 'toggle', trigger '.db', settleProperty 'width') and ran it live: idle and confirming share byte-identical [data-state] CSS (background, box-shadow — DeleteButton.css:114-171), so the pill's measured content width is the ONLY distinguishing property, and it is barely distinguishable by design (idle 'Delete' vs confirming 'Cancel'+digit measured 179px vs 180px, 1px apart) — under the spam loop it settled to 136px, a third value matching neither reference, i.e. no reliable two-state pair for the runner's snap-back assertion.",
    date: '2026-08-09',
  },
  {
    slug: 'otp-input',
    reason:
      "Attempted real toggle enrollment (trigger '.otp-row' focus / closeTrigger '.otp-title' blur, settleProperty 'border-color' on '.otp-cell.active') and ran it live: OtpInputDemo passes autoFocus={true}, so the field is already focused (the 'open' CSS state) on first paint before any click fires, leaving no reachable 'closed' baseline for the runner's initial-state read (closedRef read rgb(16,185,129), identical to the post-click openRef). Focus/blur is real state but not a click-driven two-settled-state pair this harness can prove from a cold load.",
    date: '2026-08-09',
  },
]

export const SPAM_TARGETS: SpamTarget[] = [
  {
    kind: 'auto-height',
    slug: 'pinned-list',
    trigger: '.pl-item:has-text("Inbox") .pl-pin',
    closeTrigger: '.pl-item:has-text("Inbox") .pl-pin',
    primerSelector: '.pl-item:has-text("Analytics") .pl-pin',
    expandable: '.pl-head',
    durationMs: 380,
  },
  { kind: 'auto-height', slug: 'financial-health-card', trigger: '.fhc-info-tab', expandable: '.fhc-info-body', durationMs: 500 },
  { kind: 'auto-height', slug: 'status-card', trigger: '.sc-header', expandable: '.sc-collapse', durationMs: 420 },
  { kind: 'auto-height', slug: 'motion-tabs', trigger: '.mt-tab[data-tab-index="0"]', expandable: '.mt-panels-wrap', durationMs: 320 },
  {
    // Portal-mounted menu: `if (!open) return null` unmounts .dd-menu, so the
    // closed settle value is ABSENT. The scrim covers the trigger while open.
    kind: 'toggle',
    slug: 'dropdown',
    trigger: '.dd-trigger',
    closeTrigger: '.dd-scrim',
    settleSelector: '.dd-menu',
    settleProperty: 'opacity',
    transitionMs: 260,
  },
  {
    // FLIP morph: the overlay animates top/left/width/height off the trigger
    // rect; the close button's opacity is the cleanest two-state read (the
    // overlay itself is display:none when idle, which has no settled geometry).
    kind: 'toggle',
    slug: 'expandable-screen',
    trigger: '.es-demo-root .btn-primary',
    closeTrigger: '.es-close-btn',
    settleSelector: '.es-close-btn',
    settleProperty: 'opacity',
    transitionMs: 510,
  },
  {
    // Spring width morph 320px -> 420px on the card shell itself; the card is
    // its own trigger, so the toggle is symmetric.
    kind: 'toggle',
    slug: 'expandable-card',
    trigger: '.xc-root .shell.zoom',
    settleSelector: '.xc-root .shell.zoom',
    settleProperty: 'width',
    transitionMs: 500,
  },
  {
    // Goo morph timed by --md-dur (560ms at the default data-speed="normal"),
    // with legs delayed up to 0.55x on top of it — hence the padded settle.
    kind: 'toggle',
    slug: 'message-dropdown',
    trigger: '.md-trigger',
    settleSelector: '.md-panel-bg',
    settleProperty: 'width',
    transitionMs: 900,
  },
  {
    // FAB-to-card morph: the box only ever opens on click (raw source guards
    // with `if (!openDate)`), so closing needs the in-card close button — the
    // first <button> inside the Date picker screen.
    kind: 'toggle',
    slug: 'picker',
    trigger: '[data-screen-label="Date picker"] > div',
    closeTrigger: '[data-screen-label="Date picker"] button',
    settleSelector: '[data-screen-label="Date picker"] > div',
    settleProperty: 'width',
    transitionMs: 520,
  },
  {
    // Desktop dialog scope (the page also renders a mobile sheet demo, hence
    // the .ps-desktop prefix on every selector). Closing goes through the
    // panel's own [data-x] button: the dim overlay is inset:0 and the open
    // panel sits over its centre, so a forced click on the overlay would land
    // on the panel instead. Settle read is the overlay's opacity 0 -> 1,
    // timed by --duration-sweep (360ms).
    kind: 'toggle',
    slug: 'prize-sheet',
    trigger: '.ps-desktop .ps-fab',
    closeTrigger: '.ps-desktop [data-x]',
    settleSelector: '.ps-desktop .ps-doverlay',
    settleProperty: 'opacity',
    transitionMs: 360,
  },
  {
    // Real switch: swRef toggles .sw-on/.sw-off on the same element that was
    // clicked, so the toggle is symmetric. background-color is the cleanest
    // two-state read (#CBD5E1 off / #10B981 on); the knob's 280ms left
    // transition is the longest open/close motion, hence the settle wait.
    kind: 'toggle',
    slug: 'controls',
    trigger: '.sw-base',
    settleSelector: '.sw-base',
    settleProperty: 'background-color',
    transitionMs: 280,
  },
  {
    // Impact-score row toggles .pc-why (max-height 0 -> 120px, 340ms). Both
    // selectors resolve on the first card, which the runner clicks via .first().
    kind: 'toggle',
    slug: 'pipeline-card',
    trigger: '.pc-stat-l.toggle',
    settleSelector: '.pc-why',
    settleProperty: 'max-height',
    transitionMs: 340,
  },
  {
    // Island click only ever expands (`if (islandState === 'expanded') return`),
    // so closing goes through the panel's own .dc-close. .dc-layer.active fades
    // in over --duration-slow AFTER a --duration-slow delay, hence the padding.
    // The primer absorbs the hoverThenClick race: entering the island arms a
    // 40ms hover -> 'preview' timer that lands AFTER a synthetic click and
    // clobbers 'expanded', so the first click is spent settling into preview.
    kind: 'toggle',
    slug: 'dynamic-calendar',
    trigger: '.dc-island',
    primerSelector: '.dc-island',
    closeTrigger: '.dc-close',
    settleSelector: '.dc-expanded-layer',
    settleProperty: 'opacity',
    transitionMs: 900,
  },
  {
    // data-editing widens .ie-field 262px -> 318px; the field itself only ever
    // enters edit mode, so closing goes through the in-field cancel button
    // (the save button instead runs a 200ms confirm timer into a 3s badge).
    kind: 'toggle',
    slug: 'inline-edit',
    trigger: '.ie-field',
    closeTrigger: '.ie-cancel',
    settleSelector: '.ie-field',
    settleProperty: 'width',
    transitionMs: 260,
  },
  {
    // FAB-to-panel morph: .fab grows 58px -> 460px tall over --duration-expand
    // (460ms). onFabClick guards with `if (!open)`, so closing uses .fab-close
    // (the veil is also clickable but sits under the open panel).
    kind: 'toggle',
    slug: 'fab',
    trigger: '.fab',
    closeTrigger: '.fab-item',
    settleSelector: '.fab',
    settleProperty: 'height',
    transitionMs: 460,
  },
  {
    // Card click only ever opens the detail overlay; .exp-close closes it.
    // .exp-overlay fades over --duration-slow (220ms) while .exp-outer springs
    // over --duration-sweep (360ms), hence the padded settle wait.
    kind: 'toggle',
    slug: 'metric-card',
    trigger: '.metric',
    closeTrigger: '.exp-close',
    settleSelector: '.exp-overlay',
    settleProperty: 'opacity',
    transitionMs: 400,
  },
  {
    // Step 0 <-> step 1 of the wizard: Continue advances, Back returns, and the
    // capsule indicator's `left` transitions over --duration-560. go() no-ops
    // when the clamped index equals the current one, so the pair is stable.
    kind: 'toggle',
    slug: 'multisteps',
    trigger: '.ms-btn--primary',
    closeTrigger: '.ms-btn--back',
    settleSelector: '.ms-capsule',
    settleProperty: 'width',
    transitionMs: 560,
  },
  {
    // Dock expands 70px -> panel height on .sl-bar (is-expanded, 560ms). The
    // bar's own onClick guards with `if (!expanded)`, so .sl-close closes.
    kind: 'toggle',
    slug: 'stacked-list',
    trigger: '.sl-bar',
    closeTrigger: '.sl-close',
    settleSelector: '.sl-bar',
    settleProperty: 'height',
    transitionMs: 560,
  },
  {
    // grid-template-rows 0fr -> 1fr on .dg-clip, timed by --dg-dur (380ms).
    kind: 'toggle',
    slug: 'disclosure-group',
    trigger: '.dg-trigger',
    settleSelector: '.dg-clip',
    settleProperty: 'grid-template-rows',
    transitionMs: 380,
  },
]

/**
 * Slugs with no animated interaction to spam: reference pages that render
 * swatches, scales, and specimens with no open/close, no trigger, and no
 * transition worth interrupting. Exempt from enrollment, so no reason or date
 * is required — but the gate still asserts each is claimed by exactly one
 * list, so a component that later grows an interaction cannot hide here.
 */
export const STATIC: string[] = [
  'background-gradient',
  // Specimen pages with no trigger and no JS state: metric-circle renders two
  // fixed capsules (cursor:default, one mount-only textPop), pills renders
  // badge rows whose only motion is hover/proximity scale.
  'metric-circle',
  'pills',
  'colors-neutrals',
  'colors-primary',
  'colors-semantic',
  'type-scale',
  'type-display',
  'spacing-scale',
  'spacing-radii',
  'spacing-shadows',
  'iconography',
]
