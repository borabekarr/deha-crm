# Design System — Component Review Log

Per `CONVERSION-SOP.md`, every converted component is reviewed by Bora over the
SSH tunnel with the Agentation toolbar, then logged here with the outcome.

---

## leads-table — pilot (Step 7 of design-system-pipeline)

- **Source:** `apps/web/design-system/preview/components-leads-table.html` (+ `_leads-table.css`, `_leads-table-data.js`, `_leads-table-render.js`, `_lead-popover.jsx`, `_lead-popover.css`, `_lead-metrics.js`)
- **React port:** `apps/web/src/components/design-system/leads-table/` (`LeadsTable.tsx`, `LeadPopover.tsx`, `leadsData.ts`, `leadMetrics.ts`, `popover-hook.ts`)
- **Route:** `/leads` (linked from the showcase index)
- **Built:** 2026-06-06. Build clean, lint clean, zero raw useEffect in components, no mobile deps. 16 leads ported verbatim.
- **Behaviors ported:** column sort (AI Score / Value / Sentiment / Last Contact), search, three quick filters (hot / high-value / earn-today) + clear + result count, row density toggle, column-config button (toast placeholder, matches source), view-more expansion + pagination footer, CSV export, toast, lead-details popover (schema + tier driven: pulse / behavior / qualification / deep-NLP / risk tiers, all viz primitives, AI tools chat, cold-drop countdown), Esc-close, per-lead reset.
- **Known carry-overs from source (not added/changed):** workspace switcher UI is not in the source popover, so `ws` is fixed to `real_estate`; column-config shows a "coming soon" toast exactly as the prototype does.

### Review status: APPROVED (2026-06-06)

Bora reviewed the leads-table at `http://localhost:5173/leads` over the SSH tunnel with the Agentation toolbar and confirmed it looks correct ("okay looks fine").

- **Annotations received:** none (no design changes requested at this time)
- **Fixes applied:** none
- **Approval:** APPROVED by Bora, 2026-06-06. Pilot closed. Design feedback, if any, will be handled later via the known-issues workflow (`waves/ui-library-known-issues-workflow.md`).

---

## ds-review sweep — motion/craft review batch (2026-08-08)

Merged from `plans/scratch/ds-review/<slug>.md` per-component logs (ds-review-heavy/inputs/expandables/overlays/visuals plans). Full findings, provenance probes, and reward-feel ideas remain in the scratch files; this log carries the fix summary, evidence, and verdict per component.

### animated-header-scroll (ds-review-heavy Step 3)
- **Verdict:** headroom: no. One real fix applied — `will-change: backdrop-filter, background` scoping (was always-on, now scroll-state-scoped) — everything else already met the bar.
- **Evidence:** files touched listed in scratch log; no dedicated screenshots (perf-focused pass).

### buyer-brain (ds-review-heavy Step 1)
- **Verdict:** headroom: yes.
- **Fixes applied:** logged in scratch file (token provenance verified live via `getComputedStyle`); legacy legs untouched (handoff note).
- **Evidence:** `plans/scratch/ds-review/buyer-brain/buyer-brain-{light,dark}[-detail].png`.

### delete-button (ds-review-inputs Step 5)
- **Verdict:** headroom: yes.
- **Fixes applied:** retry-2 code-reviewer fixes — HIGH: two superimposed digits on every countdown tick under reduced motion, fixed; MEDIUM: `PHASE_MORPH_MS` constant vs MIRROR comment vs CSS drift, fixed. Token provenance confirmed live (probe run 2026-08-08). Dark-selector evidence: 4x `[data-theme='dark']`, confirmed NOT blind-converted.
- **Evidence:** `plans/scratch/ds-review/delete-button/delete-button-{light,dark}.png` plus `-{light,dark}-confirming.png`.

### disclosure-group (ds-review-expandables Step 5)
- **Verdict:** Approve (post-fix). Sluggish 600ms clock, dead press transition, and zeroed reduced-motion path all fixed; no feel-breaking regressions remain.
- **Evidence:** `plans/scratch/ds-review/disclosure-group/light-open.png`, `dark-open.png`.

### dropdown (ds-review-overlays Step 1)
- **Verdict:** Approve (post-fix), with one open High-severity item deferred by plan constraint (not fixed this step).
- **Open finding (logged, not fixed):** dark mode is feel-breaking — the 10 `[data-theme='dark']` selectors are dead (probe: `ELEMENTS WITH [data-theme]: 0`; `_darkmode.css:3` sets dark via `html.dark` with no `.dd-*` rules; `dark-open.png` shows a white menu/card on the dark page). Fix (separate step): convert the 10 selectors to `html.dark`, as `Calendar.css:215` already does. Sibling components `delete-button` and `disclosure-group` carry the identical defect.
- **Evidence:** `plans/scratch/ds-review/dropdown/light-open.png`, `dark-open.png`. Probe: `apps/web/tests/scratch/dropdown.probe.spec.ts` (passes).

### expandable-card (2026-08-08, useAutoHeight adoption)
- **Verdict:** reviewed against review-animations' ten standards (per-standard table in scratch log); dark-expanded surface uses inline colour that cannot be overridden from CSS (non-motion observation, out of scope, not fixed).
- **Evidence:** `plans/scratch/ds-review/expandable-card/dark-expanded.png`; reference settle values recorded before the swap.

### expandable-screen (ds-review-expandables Step 3)
- **Primary fix:** FLIP overlay ported to `document.body`. Rect traces at 1280x720 (trigger rect `top 432.7 left 534 w 212 h 47`) confirm the fix; token/mirror-comment provenance verified live via `getComputedStyle`.
- **Evidence:** `plans/scratch/ds-review/expandable-screen/light-open.png`, `dark-open.png`.

### message-dropdown (Step 3, pane-as-card restyle)
- **Verdict:** Approve for the touched legs (hover/press/exit) — no feel-breaking issues. Restyled pane as a house card; colourful buttons + tags wired across all 6 `data-primary` palettes; dark-selector decision: unify on `html.dark`. One PRE-EXISTING typecheck failure noted, not caused by this step.
- **Evidence:** `light-open.png`, `light-open-richgold.png`, `dark-open.png` (morph-freeze proof included).

### otp-input (ds-review-inputs Step 1)
- **Verdict:** headroom: no.
- **Fixes applied:** motion tokenization across every CSS motion leg (value-identical swap); focus-lift feel — glow now blooms with the lift.
- **Dark-selector finding:** live-verified, NOT converted (logged for later).
- **Evidence:** `plans/scratch/ds-review/otp-input/otp-input-light.png`, `otp-input-dark.png`; token-provenance evidence via live `getComputedStyle`.

### picker (ds-review-inputs Step 3)
- **Fixes applied:** F1 idle snap on native `scrollTo({behavior:'smooth'})` couldn't be interrupted (High) — fixed; F2 scroll chaining off wheel ends (Medium) — fixed; F3 closed FAB pill had no press acknowledgement (Medium) — fixed; F4 Today/Now button press symmetric with hover (Low) — fixed; F5 close buttons had no accessible name (Low) — fixed. Retry-3 also fixed reduced motion.
- **Open findings:** logged, not fixed (see scratch file).
- **Evidence:** `plans/scratch/ds-review/picker/picker-light.png`, `picker-dark.png`; gesture measurements + token/mirror-comment provenance from probe test 4.

### pie-chart (ds-review-visuals Step 3)
- **Verdict:** Approve (post-fix). Attempt-2 code-reviewer Medium fix: last-slice seam sliver, fixed.
- **Evidence:** `plans/scratch/ds-review/pie-chart/light.png`, `dark.png`; token provenance via probe PROVENANCE output.

### shimmer (ds-review-visuals Step 5)
- **Fixes landed:** motion-token conversion (item 3); reduced-motion path already correct (no code change needed); sweep performance already compositor-friendly (no fix needed); dark mode `[data-theme='dark']` confirmed firing live, no conversion needed. Attempt-2 code-reviewer Medium fixes also landed.
- **Evidence:** `shimmer-dark.png` confirms dark stage/surface rendering.

### siri-orb (ds-review-visuals Step 1)
- **Fixes landed:** see scratch file (Fixes landed section); remainder verified with no fix needed (visual review of CSS backdrop, alignment, shell canon). Code-reviewer findings from attempt 2 noted, not fixed.
- **Evidence:** `plans/scratch/ds-review/siri-orb/siri-orb-light.png`, `siri-orb-dark.png`.

### toast (ds-review-overlays Step 5)
- **Verdict:** Approve. No feel-breaking regressions remain; entrance, exit, and press are token-resolved and interruptible.
- **Fixes applied:** Part 1 findings fixed (see scratch file); Part 2 verdict tiers logged, not changed.
