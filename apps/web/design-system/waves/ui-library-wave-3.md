# Plan: Deha UI Library — Wave 3 (Charts & rich cards)
**Date:** 2026-06-06
**Topic:** ui-library-wave-3
**Status:** pending

> Prereq: wave-1 executed. For every component: convert per `apps/web/design-system/CONVERSION-SOP.md` into a self-contained React folder, register in `apps/web/src/lib/component-registry.ts`, archive with `scripts/ds-archive.sh <slug>`. React-direct. No raw useEffect in components (charts/animations go in a `<slug>-hook.ts`). Ask before adding states/variants not in the source.

---

## Steps

### Step 1 — Chart (chart)
**Skill:** style-transfer
**Model:** claude-sonnet-4-6
**React-gate:** yes
**Touches:** apps/web/src/components/design-system/chart, apps/web/src/lib/component-registry.ts, design-system-archive/chart
**Parallel-with:** none
Passes: false

**Context for subagent:**
Convert `components-chart.html` (line/area, dual-series, tooltip; emerald gradient strokes) into `apps/web/src/components/design-system/chart/` per the SOP. Reuse the SVG/CSS verbatim. Tooltip/hover via event handlers; any animation loop via a `chart-hook.ts`. Register under "Metrics & Charts". Archive `scripts/ds-archive.sh chart`.

**Test criteria:**
- Folder + registry entry under "Metrics & Charts"; build exits 0; `/components/chart` renders with working tooltip.
- No raw useEffect in the folder; `design-system-archive/chart/` created; no react-native.

### Step 2 — Statistics graph card (statistics-graph-card)
**Skill:** style-transfer
**Model:** claude-sonnet-4-6
**React-gate:** yes
**Touches:** apps/web/src/components/design-system/statistics-graph-card, apps/web/src/lib/component-registry.ts, design-system-archive/statistics-graph-card
**Parallel-with:** none
Passes: false

**Context for subagent:**
Convert `components-statistics-graph-card.html` into `apps/web/src/components/design-system/statistics-graph-card/` per the SOP. Reuse CSS verbatim. Register under "Metrics & Charts". Archive `scripts/ds-archive.sh statistics-graph-card`.

**Test criteria:**
- Folder + registry entry; build exits 0; `/components/statistics-graph-card` renders matching the prototype.
- No raw useEffect; archive created; no react-native.

### Step 3 — Streak card (streak-card)
**Skill:** style-transfer
**Model:** claude-sonnet-4-6
**React-gate:** yes
**Touches:** apps/web/src/components/design-system/streak-card, apps/web/src/lib/component-registry.ts, design-system-archive/streak-card
**Parallel-with:** none
Passes: false

**Context for subagent:**
Convert `components-streak-card.html` (animated, light/dark) into `apps/web/src/components/design-system/streak-card/` per the SOP. Reuse CSS verbatim; any entrance animation via a `streak-card-hook.ts`, not a raw useEffect. Register under "Metrics & Charts". Archive `scripts/ds-archive.sh streak-card`.

**Test criteria:**
- Folder + registry entry; build exits 0; `/components/streak-card` renders (animation plays).
- No raw useEffect in the folder; archive created; no react-native.

### Step 4 — Financial health card (financial-health-card)
**Skill:** style-transfer
**Model:** claude-sonnet-4-6
**React-gate:** yes
**Touches:** apps/web/src/components/design-system/financial-health-card, apps/web/src/lib/component-registry.ts, design-system-archive/financial-health-card
**Parallel-with:** none
Passes: false

**Context for subagent:**
Convert `components-financial-health-card.html` into `apps/web/src/components/design-system/financial-health-card/` per the SOP. Reuse CSS verbatim. Register under "Metrics & Charts". Archive `scripts/ds-archive.sh financial-health-card`.

**Test criteria:**
- Folder + registry entry; build exits 0; `/components/financial-health-card` renders matching the prototype.
- No raw useEffect; archive created; no react-native.

### Step 5 — Hero card (hero-card)
**Skill:** style-transfer
**Model:** claude-sonnet-4-6
**React-gate:** yes
**Touches:** apps/web/src/components/design-system/hero-card, apps/web/src/lib/component-registry.ts, design-system-archive/hero-card
**Parallel-with:** none
Passes: false

**Context for subagent:**
Convert `components-hero-card.html` (emerald CTA hero with sheen + grid texture) into `apps/web/src/components/design-system/hero-card/` per the SOP. Reuse CSS verbatim; preserve the emerald surface treatment. Register under "Sheets & Cards". Archive `scripts/ds-archive.sh hero-card`.

**Test criteria:**
- Folder + registry entry under "Sheets & Cards"; build exits 0; `/components/hero-card` renders matching the prototype.
- No raw useEffect; archive created; no react-native.

### Step 6 — Update memory
**Skill:** none
**Model:** claude-sonnet-4-6
**Touches:** memory/
**Parallel-with:** none
Passes: false

**Context for subagent:**
Record the wave-3 components (chart, statistics-graph-card, streak-card, financial-health-card, hero-card) added and archived. Note gotchas. Update MEMORY.md if needed.

**Test criteria:**
- A `memory/` file reflects wave-3 additions; entries match the converted components.
