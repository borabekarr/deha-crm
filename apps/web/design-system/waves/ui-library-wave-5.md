# Plan: Deha UI Library — Wave 5 (Sheets & selectors)
**Date:** 2026-06-06
**Topic:** ui-library-wave-5
**Status:** pending

> Prereq: wave-1 executed. Convert per `apps/web/design-system/CONVERSION-SOP.md` into self-contained React folders, register in `apps/web/src/lib/component-registry.ts`, archive with `scripts/ds-archive.sh <slug>`. React-direct. No raw useEffect in components. NOTE: `task-card` is HEAVY (React-UMD + Babel + `_task-popover.jsx`) — port to the app's React, removing CDN/Babel. Ask before adding states/variants not in the source.

---

## Steps

### Step 1 — Task card (task-card) [HEAVY]
**Skill:** style-transfer
**Model:** claude-sonnet-4-6
**React-gate:** yes
**Touches:** apps/web/src/components/design-system/task-card, apps/web/src/lib/component-registry.ts, design-system-archive/task-card
**Parallel-with:** none
Passes: false

**Context for subagent:**
Convert `components-task-card.html` (sheet-driven, "Ask AI"; pulls `_task-popover.jsx`) into `apps/web/src/components/design-system/task-card/` per the SOP. Source uses React-UMD + Babel: re-implement in the app's React (no CDN/Babel). Port the task popover too. Effects (timers/listeners/animation) go in a `task-card-hook.ts`, never a raw useEffect in the component. Reuse CSS verbatim, keep class names. Register under "Sheets & Cards". Archive `scripts/ds-archive.sh task-card`.

**Test criteria:**
- Folder + registry entry under "Sheets & Cards"; build exits 0; `/components/task-card` renders and the sheet/popover opens.
- `grep -rE "useEffect\(" apps/web/src/components/design-system/task-card` returns nothing; no `react.development.js`/`@babel/standalone`.
- `design-system-archive/task-card/` created; no react-native.

### Step 2 — Prize sheet (prize-sheet)
**Skill:** style-transfer
**Model:** claude-sonnet-4-6
**React-gate:** yes
**Touches:** apps/web/src/components/design-system/prize-sheet, apps/web/src/lib/component-registry.ts, design-system-archive/prize-sheet
**Parallel-with:** none
Passes: false

**Context for subagent:**
Convert `components-prize-sheet.html` (mobile bottom sheet + desktop dialog) into `apps/web/src/components/design-system/prize-sheet/` per the SOP. Reuse CSS verbatim; open/close + responsive variant via state/media. Register under "Sheets & Cards". Archive `scripts/ds-archive.sh prize-sheet`.

**Test criteria:**
- Folder + registry entry; build exits 0; `/components/prize-sheet` renders both the sheet and dialog presentations.
- No raw useEffect; archive created; no react-native.

### Step 3 — Model selector (model-selector)
**Skill:** style-transfer
**Model:** claude-sonnet-4-6
**React-gate:** yes
**Touches:** apps/web/src/components/design-system/model-selector, apps/web/src/lib/component-registry.ts, design-system-archive/model-selector
**Parallel-with:** none
Passes: false

**Context for subagent:**
Convert `components-model-selector.html` (dual-list, search) into `apps/web/src/components/design-system/model-selector/` per the SOP. Reuse CSS verbatim; search/selection via derived state + handlers. Register under "Sheets & Cards". Archive `scripts/ds-archive.sh model-selector`.

**Test criteria:**
- Folder + registry entry; build exits 0; `/components/model-selector` renders and search/selection works.
- No raw useEffect; archive created; no react-native.

### Step 4 — Model selection sheet (model-selection-sheet)
**Skill:** style-transfer
**Model:** claude-sonnet-4-6
**React-gate:** yes
**Touches:** apps/web/src/components/design-system/model-selection-sheet, apps/web/src/lib/component-registry.ts, design-system-archive/model-selection-sheet
**Parallel-with:** none
Passes: false

**Context for subagent:**
Convert `components-model-selection-sheet.html` (mobile sheet) into `apps/web/src/components/design-system/model-selection-sheet/` per the SOP. Reuse CSS verbatim. Register under "Sheets & Cards". Archive `scripts/ds-archive.sh model-selection-sheet`.

**Test criteria:**
- Folder + registry entry; build exits 0; `/components/model-selection-sheet` renders matching the prototype.
- No raw useEffect; archive created; no react-native.

### Step 5 — Update memory
**Skill:** none
**Model:** claude-sonnet-4-6
**Touches:** memory/
**Parallel-with:** none
Passes: false

**Context for subagent:**
Record the wave-5 components (task-card, prize-sheet, model-selector, model-selection-sheet) added and archived, including the task-card React-UMD port. Update MEMORY.md if needed.

**Test criteria:**
- A `memory/` file reflects wave-5 additions; entries match the converted components.
