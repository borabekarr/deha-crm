/**
 * Data-only manifest for animation-spam.spec.ts. Plain module, no React
 * imports — must stay Node-importable, same reason the gate test reads
 * component-registry.ts via fs+regex instead of importing it.
 */

export interface SpamTarget {
  slug: string
  /** Selector clicked to open (and, for symmetric toggles, to close too). */
  trigger: string
  /**
   * Set when a target's open button goes `pointer-events: none` while
   * expanded, so closing needs a separate selector than the one that opened
   * it (see pinned-list). Omitted for symmetric toggles (trigger flips both
   * ways there): financial-health-card, status-card, motion-tabs.
   */
  closeTrigger?: string
  /**
   * pinned-list only: clicked once (after navigate, and again after reload)
   * to unpin the second mock-pinned row (Analytics) so the remaining row
   * (Inbox) drives a clean binary toggle of the pinned-count-crosses-zero
   * header instead of staying open no matter what Inbox does.
   */
  primerSelector?: string
  /** Element whose measured height the hook animates. */
  expandable: string
  /** useAutoHeight duration passed by the component (ms). */
  durationMs: number
  /** Rapid-loop click count. Defaults to 8 in the spec. */
  toggles?: number
}

// task-board's SyncFeed is NOT listed: its trigger is disabled mid-cycle and
// drives a ~2s multi-phase async timeline, not a click-flips-two-states
// toggle. animation-spam.spec.ts covers it with a dedicated test instead.
export const SPAM_TARGETS: SpamTarget[] = [
  {
    slug: 'pinned-list',
    trigger: '.pl-item:has-text("Inbox") .pl-pin',
    closeTrigger: '.pl-item:has-text("Inbox") .pl-pin',
    primerSelector: '.pl-item:has-text("Analytics") .pl-pin',
    expandable: '.pl-head',
    durationMs: 380,
  },
  { slug: 'financial-health-card', trigger: '.fhc-info-tab', expandable: '.fhc-info-body', durationMs: 500 },
  { slug: 'status-card', trigger: '.sc-header', expandable: '.sc-collapse', durationMs: 420 },
  { slug: 'motion-tabs', trigger: '.mt-tab[data-tab-index="0"]', expandable: '.mt-panels-wrap', durationMs: 320 },
]

// Finished-status slugs with an expandable interaction, per component-
// registry.ts. financial-health-card is the first to flip to Finished; the
// gate test asserts membership implies manifest coverage, which it has here.
export const EXPANDABLE_FINISHED_SLUGS: string[] = ['financial-health-card']
