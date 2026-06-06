# Plan: Deha UI Library — Wave 2 (Primitives + simple metrics)
**Date:** 2026-06-06
**Topic:** ui-library-wave-2
**Status:** pending

> Prereq: wave-1 executed (library shell, `apps/web/src/lib/component-registry.ts`, `scripts/ds-archive.sh`, `design-system-archive/` all exist). For every component: convert the prototype to a self-contained React folder per `apps/web/design-system/CONVERSION-SOP.md`, register it in the component registry under its category, and archive it with `scripts/ds-archive.sh <slug>`. React-direct, no HTML re-authoring. No raw useEffect in components (extract to a `<slug>-hook.ts` if a timer/listener/animation is needed). Ask before adding states/variants not in the source.

---

## Steps

### Step 1 — Controls (controls)
**Skill:** style-transfer
**Model:** claude-sonnet-4-6
**React-gate:** yes
**Touches:** apps/web/src/components/design-system/controls, apps/web/src/lib/component-registry.ts, design-system-archive/controls
**Parallel-with:** none
Passes: false

**Context for subagent:**
Convert `apps/web/design-system/preview/components-controls.html` (segmented control, toggle switch, slider) into `apps/web/src/components/design-system/controls/` per the SOP. These are the canonical `_controls.css`/`_controls.js` controls — reuse that CSS verbatim and preserve the `.seg`/`.sw-base` class contracts. If the `_controls.js` auto-init is already loaded globally (it is), make the React component compatible with it or encapsulate the behavior in a `controls-hook.ts`. Register under category "Primitives". Archive with `scripts/ds-archive.sh controls`.

**Test criteria:**
- `apps/web/src/components/design-system/controls/` exists; registry has `controls` under "Primitives".
- `pnpm --filter web build` exits 0; `/components/controls` renders the segmented + toggle + slider matching the prototype.
- `grep -rE "useEffect\(" apps/web/src/components/design-system/controls` returns nothing.
- `design-system-archive/controls/` created; no react-native imports.

### Step 2 — FAB (fab)
**Skill:** style-transfer
**Model:** claude-sonnet-4-6
**React-gate:** yes
**Touches:** apps/web/src/components/design-system/fab, apps/web/src/lib/component-registry.ts, design-system-archive/fab
**Parallel-with:** none
Passes: false

**Context for subagent:**
Convert `components-fab.html` (expanding FAB, light/dark) into `apps/web/src/components/design-system/fab/` per the SOP. Reuse the prototype CSS verbatim; preserve the expand interaction via event handlers/state (no raw useEffect). Register under "Primitives". Archive with `scripts/ds-archive.sh fab`.

**Test criteria:**
- Folder + registry entry under "Primitives" present.
- `pnpm --filter web build` exits 0; `/components/fab` renders and the FAB expands on interaction.
- No raw useEffect in the folder; `design-system-archive/fab/` created; no react-native.

### Step 3 — Metric card (metric-card)
**Skill:** style-transfer
**Model:** claude-sonnet-4-6
**React-gate:** yes
**Touches:** apps/web/src/components/design-system/metric-card, apps/web/src/lib/component-registry.ts, design-system-archive/metric-card
**Parallel-with:** none
Passes: false

**Context for subagent:**
Convert `components-metric-card.html` (numeral + delta + sparkline; clicking opens an expanded `.exp-*` overlay) into `apps/web/src/components/design-system/metric-card/` per the SOP. Preserve the expand-overlay interaction with state/event handlers. Reuse CSS verbatim. Register under "Metrics & Charts". Archive with `scripts/ds-archive.sh metric-card`.

**Test criteria:**
- Folder + registry entry under "Metrics & Charts".
- Build exits 0; `/components/metric-card` renders; clicking opens the expanded overlay.
- No raw useEffect; `design-system-archive/metric-card/` created; no react-native.

### Step 4 — Metric circle (metric-circle)
**Skill:** style-transfer
**Model:** claude-sonnet-4-6
**React-gate:** yes
**Touches:** apps/web/src/components/design-system/metric-circle, apps/web/src/lib/component-registry.ts, design-system-archive/metric-circle
**Parallel-with:** none
Passes: false

**Context for subagent:**
Convert `components-metric-circle.html` (circular progress metric) into `apps/web/src/components/design-system/metric-circle/` per the SOP. Reuse the SVG/CSS verbatim. Register under "Metrics & Charts". Archive with `scripts/ds-archive.sh metric-circle`.

**Test criteria:**
- Folder + registry entry under "Metrics & Charts".
- Build exits 0; `/components/metric-circle` renders matching the prototype.
- No raw useEffect; `design-system-archive/metric-circle/` created; no react-native.

### Step 5 — Update memory
**Skill:** none
**Model:** claude-sonnet-4-6
**Touches:** memory/
**Parallel-with:** none
Passes: false

**Context for subagent:**
Record the wave-2 components (controls, fab, metric-card, metric-circle) added to the library and archived. Note any conversion gotchas. Update the `ui-library` memory entry / MEMORY.md pointer if needed.

**Test criteria:**
- A `memory/` file reflects wave-2 additions; entries match the converted components.
