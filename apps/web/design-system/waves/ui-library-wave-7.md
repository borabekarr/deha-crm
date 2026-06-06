# Plan: Deha UI Library — Wave 7 (AI & misc)
**Date:** 2026-06-06
**Topic:** ui-library-wave-7
**Status:** pending

> Prereq: wave-1 executed. Convert per `apps/web/design-system/CONVERSION-SOP.md` into self-contained React folders, register in `apps/web/src/lib/component-registry.ts`, archive with `scripts/ds-archive.sh <slug>`. React-direct. No raw useEffect in components. Ask before adding states/variants not in the source. This is the final conversion wave; after it, run `scripts/library-snapshot.sh` and the archive sweep, then commit/tag the saved gallery.

---

## Steps

### Step 1 — AI caveat (ai-caveat)
**Skill:** style-transfer
**Model:** claude-sonnet-4-6
**React-gate:** yes
**Touches:** apps/web/src/components/design-system/ai-caveat, apps/web/src/lib/component-registry.ts, design-system-archive/ai-caveat
**Parallel-with:** none
Passes: false

**Context for subagent:**
Convert `components-ai-caveat.html` (warning box) into `apps/web/src/components/design-system/ai-caveat/` per the SOP. Reuse CSS verbatim. Register under "AI". Archive `scripts/ds-archive.sh ai-caveat`.

**Test criteria:**
- Folder + registry entry under "AI"; build exits 0; `/components/ai-caveat` renders matching the prototype.
- No raw useEffect; archive created; no react-native.

### Step 2 — AI memory card (ai-memory-card)
**Skill:** style-transfer
**Model:** claude-sonnet-4-6
**React-gate:** yes
**Touches:** apps/web/src/components/design-system/ai-memory-card, apps/web/src/lib/component-registry.ts, design-system-archive/ai-memory-card
**Parallel-with:** none
Passes: false

**Context for subagent:**
Convert `components-ai-memory-card.html` into `apps/web/src/components/design-system/ai-memory-card/` per the SOP. Reuse CSS verbatim. Register under "AI". Archive `scripts/ds-archive.sh ai-memory-card`.

**Test criteria:**
- Folder + registry entry under "AI"; build exits 0; `/components/ai-memory-card` renders matching the prototype.
- No raw useEffect; archive created; no react-native.

### Step 3 — AI message box (ai-message-box)
**Skill:** style-transfer
**Model:** claude-sonnet-4-6
**React-gate:** yes
**Touches:** apps/web/src/components/design-system/ai-message-box, apps/web/src/lib/component-registry.ts, design-system-archive/ai-message-box
**Parallel-with:** none
Passes: false

**Context for subagent:**
Convert `components-ai-message-box.html` into `apps/web/src/components/design-system/ai-message-box/` per the SOP. Note this file may be System B dark mode (inline `#themeToggle`) — match whatever the file uses. Reuse CSS verbatim. Register under "AI". Archive `scripts/ds-archive.sh ai-message-box`.

**Test criteria:**
- Folder + registry entry under "AI"; build exits 0; `/components/ai-message-box` renders matching the prototype.
- No raw useEffect; archive created; no react-native.

### Step 4 — Theme editor (theme-editor)
**Skill:** style-transfer
**Model:** claude-sonnet-4-6
**React-gate:** yes
**Touches:** apps/web/src/components/design-system/theme-editor, apps/web/src/lib/component-registry.ts, design-system-archive/theme-editor
**Parallel-with:** none
Passes: false

**Context for subagent:**
Convert `components-theme-editor.html` (color picker + live preview) into `apps/web/src/components/design-system/theme-editor/` per the SOP. Reuse CSS verbatim; picker + live preview via state/handlers. Register under "Misc". Archive `scripts/ds-archive.sh theme-editor`.

**Test criteria:**
- Folder + registry entry under "Misc"; build exits 0; `/components/theme-editor` renders and the live preview updates.
- No raw useEffect; archive created; no react-native.

### Step 5 — To-Do list (todo-list)
**Skill:** style-transfer
**Model:** claude-sonnet-4-6
**React-gate:** yes
**Touches:** apps/web/src/components/design-system/todo-list, apps/web/src/lib/component-registry.ts, design-system-archive/todo-list
**Parallel-with:** none
Passes: false

**Context for subagent:**
Convert `components-todo-list.html` (drag-to-complete) into `apps/web/src/components/design-system/todo-list/` per the SOP. Reuse CSS verbatim; drag/complete interaction via handlers; any animation in a `todo-list-hook.ts`. Register under "Misc". Archive `scripts/ds-archive.sh todo-list`.

**Test criteria:**
- Folder + registry entry under "Misc"; build exits 0; `/components/todo-list` renders and drag-to-complete works.
- No raw useEffect in the folder; archive created; no react-native.

### Step 6 — Final snapshot + memory
**Skill:** none
**Model:** claude-sonnet-4-6
**Touches:** memory/, design-system-dist/
**Parallel-with:** none
Passes: false

**Context for subagent:**
All components are now in the library. Run `scripts/library-snapshot.sh` to produce the durable static `design-system-dist/` gallery. Record in memory that the full component set is converted, archived, and snapshotted (the "all done" milestone), and note the gallery is complete. Update MEMORY.md.

**Test criteria:**
- `design-system-dist/index.html` exists (fresh snapshot of the full gallery).
- A `memory/` file records the completed gallery and the all-done milestone.
