# Plan: Deha UI Library — Wave 6 (Workflow)
**Date:** 2026-06-06
**Topic:** ui-library-wave-6
**Status:** pending

> Prereq: wave-1 executed. Convert per `apps/web/design-system/CONVERSION-SOP.md` into self-contained React folders, register in `apps/web/src/lib/component-registry.ts`, archive with `scripts/ds-archive.sh <slug>`. React-direct. No raw useEffect in components (canvas/graph interactions and the morphing indicator go in a `<slug>-hook.ts`). Ask before adding states/variants not in the source.

---

## Steps

### Step 1 — Workflow: add elements (workflow-add-elements)
**Skill:** style-transfer
**Model:** claude-sonnet-4-6
**React-gate:** yes
**Touches:** apps/web/src/components/design-system/workflow-add-elements, apps/web/src/lib/component-registry.ts, design-system-archive/workflow-add-elements
**Parallel-with:** none
Passes: false

**Context for subagent:**
Convert `components-workflow-add-elements.html` (right-click canvas menu; tabs use a `data-seg-managed` `.seg`) into `apps/web/src/components/design-system/workflow-add-elements/` per the SOP. Reuse CSS verbatim; context menu + tabs via state/handlers; respect the `data-seg-managed` contract with the shared controls. Register under "Workflow". Archive `scripts/ds-archive.sh workflow-add-elements`.

**Test criteria:**
- Folder + registry entry under "Workflow"; build exits 0; `/components/workflow-add-elements` renders; right-click opens the menu.
- No raw useEffect; archive created; no react-native.

### Step 2 — Workflow: nodes (workflow-nodes)
**Skill:** style-transfer
**Model:** claude-sonnet-4-6
**React-gate:** yes
**Touches:** apps/web/src/components/design-system/workflow-nodes, apps/web/src/lib/component-registry.ts, design-system-archive/workflow-nodes
**Parallel-with:** none
Passes: false

**Context for subagent:**
Convert `components-workflow-nodes.html` (graph editor) into `apps/web/src/components/design-system/workflow-nodes/` per the SOP. Reuse CSS verbatim; node drag/connect via handlers; any rAF in a `workflow-nodes-hook.ts`. Register under "Workflow". Archive `scripts/ds-archive.sh workflow-nodes`.

**Test criteria:**
- Folder + registry entry; build exits 0; `/components/workflow-nodes` renders the node graph.
- No raw useEffect in the folder; archive created; no react-native.

### Step 3 — Workflow: publish (workflow-publish)
**Skill:** style-transfer
**Model:** claude-sonnet-4-6
**React-gate:** yes
**Touches:** apps/web/src/components/design-system/workflow-publish, apps/web/src/lib/component-registry.ts, design-system-archive/workflow-publish
**Parallel-with:** none
Passes: false

**Context for subagent:**
Convert `components-workflow-publish.html` into `apps/web/src/components/design-system/workflow-publish/` per the SOP. Reuse CSS verbatim. Register under "Workflow". Archive `scripts/ds-archive.sh workflow-publish`.

**Test criteria:**
- Folder + registry entry; build exits 0; `/components/workflow-publish` renders matching the prototype.
- No raw useEffect; archive created; no react-native.

### Step 4 — Workflow: template cards (workflow-template-cards)
**Skill:** style-transfer
**Model:** claude-sonnet-4-6
**React-gate:** yes
**Touches:** apps/web/src/components/design-system/workflow-template-cards, apps/web/src/lib/component-registry.ts, design-system-archive/workflow-template-cards
**Parallel-with:** none
Passes: false

**Context for subagent:**
Convert `components-workflow-template-cards.html` into `apps/web/src/components/design-system/workflow-template-cards/` per the SOP. Reuse CSS verbatim. Register under "Workflow". Archive `scripts/ds-archive.sh workflow-template-cards`.

**Test criteria:**
- Folder + registry entry; build exits 0; `/components/workflow-template-cards` renders matching the prototype.
- No raw useEffect; archive created; no react-native.

### Step 5 — Multistep onboarding (multisteps)
**Skill:** style-transfer
**Model:** claude-sonnet-4-6
**React-gate:** yes
**Touches:** apps/web/src/components/design-system/multisteps, apps/web/src/lib/component-registry.ts, design-system-archive/multisteps
**Parallel-with:** none
Passes: false

**Context for subagent:**
Convert `components-multisteps.html` (morphing capsule step indicator) into `apps/web/src/components/design-system/multisteps/` per the SOP. Reuse CSS verbatim; step state via state; the morph animation via a `multisteps-hook.ts` if needed. Register under "Workflow". Archive `scripts/ds-archive.sh multisteps`.

**Test criteria:**
- Folder + registry entry; build exits 0; `/components/multisteps` renders and steps advance with the morphing indicator.
- No raw useEffect in the folder; archive created; no react-native.

### Step 6 — Update memory
**Skill:** none
**Model:** claude-sonnet-4-6
**Touches:** memory/
**Parallel-with:** none
Passes: false

**Context for subagent:**
Record the wave-6 workflow components added and archived. Update MEMORY.md if needed.

**Test criteria:**
- A `memory/` file reflects wave-6 additions; entries match the converted components.
