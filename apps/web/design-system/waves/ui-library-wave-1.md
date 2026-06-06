# Plan: Deha UI Library (magicui-style) + Component Conversion — Wave 1 + Roadmap
**Date:** 2026-06-06
**Topic:** ui-library-wave-1
**Status:** pending

> On approval ("go") I will, BEFORE you squash-merge: (1) the per-wave plan files already exist (created locally) at `apps/web/design-system/waves/` — a TRACKED path (`debt/` and `plans/` are both gitignored), (2) mark the leads-table review approved in `apps/web/design-system/review-log.md`, (3) update memory, (4) commit + push a new branch `feat/ui-library` (off `feat/design-system`). After you squash-merge, you `/execute apps/web/design-system/waves/ui-library-wave-1.md`.

---

## What these files are (read me first)

One program: **convert the ~45 existing `.html` prototypes into React and host them in a magicui-style UI library website.** It is split into reviewable batches ("waves") so you never review everything at once. All wave files live in `apps/web/design-system/waves/`.

- **wave-1** — build the library site (`/` gallery + `/components/<slug>` + sidebar/search/dark) + the safety/archive system + convert the FIRST batch (foundations + a few primitives). Run this first.
- **wave-2 … wave-7** — convert the REMAINING components batch by batch; each registers into the now-live library as a new subpage. Run in order, review between.
- **known-issues-workflow** — NOT a wave and NOT run now. A reference for the LATER phase: the Agentation-driven loop for fixing an already-shipped component when you flag a problem. Used on-demand after the library exists.

leads-table is already converted and seeds the gallery. The build medium is React-direct (the `.html` already exists, so no HTML re-authoring); HTML-first only for brand-new components with no reference.

---

## Context

The Deha Design System has ~45 prototypes imported at `apps/web/design-system/preview/` and one shipped React conversion (leads-table at `/leads`). Bora wants a single **magicui.design-style UI library website** that showcases every component, each on its own subpage, so he can review them all in one place (live, via the Agentation toolbar). Components are converted one wave at a time; when a wave is approved the library gains those subpages and the work is committed. After all components are in, Bora updates components that have known issues (driven by his Agentation annotations), with the library staying live and growing.

Two hard requirements shape the design. **Source isolation / safety:** a destructive change to the library or to one component must never lose another component (this has happened before — a working-tree wipe). So every component is a self-contained folder that the library only imports, and each approved component is snapshotted into a separate, never-hand-edited archive plus committed to git, with a scripted restore path. **Low front-loading:** since the prototypes already exist as HTML, they convert straight to React (no HTML re-authoring); HTML-first is reserved only for brand-new components with no reference design.

End state of THIS plan (wave 1): the library is the app home (`/`) with a category sidebar, search, and light/dark toggle; `/components/<slug>` renders each live component with a "view source HTML" link; the leads-table plus the foundation/token pages and a first batch of simple primitives are converted, registered, and archived; the safety system (archive + restore + static snapshot) is in place; and the remaining waves exist as ready-to-run plan files in `debt/`.

---

## Decisions locked

- **Build medium:** React-direct for existing prototypes, outsourced sources, and fixes. HTML-first (in Claude Design) ONLY for a brand-new component with no reference. No re-authoring HTML for things that already exist.
- **Library:** lives at `/` (replaces the placeholder index). `/components/$slug` dynamic route. Sidebar grouped by curated categories (all prototypes are annotated `group="Brand"`, so categories are curated from the inventory, not the raw group). Search + light/dark toggle (reuse `_darkmode`). "View source HTML" links to the original `preview/components-<slug>.html`.
- **Component shape:** each component is a self-contained folder `apps/web/src/components/design-system/<slug>/` (own files, own CSS import). The library imports via a registry; editing the library never edits a component folder.
- **Safety:** on approval, `scripts/ds-archive.sh <slug>` copies the component's React folder AND its original `preview/` source into `design-system-archive/<slug>/` (a separate, append-only, never-hand-edited tree) and the change is committed + pushed. `scripts/ds-restore.sh <slug>` restores a component from the archive. `scripts/library-snapshot.sh` runs `vite build` into a durable static `design-system-dist/` that can be served without the dev server. git is the primary safe place; archive + snapshot are belt-and-suspenders.
- **Waves in `debt/`:** `plans/` is gitignored, so all wave plan files live in `debt/ui-library-wave-N.md` (tracked). Authored at "go".
- **Dev access:** reuse the existing `dehaprev` per-port preview + systemd persistence; the library runs as a normal route, previewable on its port.

---

## Verification (confidence: 88)

| ID | Check (what proves it done) | Measurement command |
|---|---|---|
| V1 | Library home at `/` renders a category sidebar + search + light/dark toggle, with leads-table listed | `pnpm --filter web exec vite --port 5180 --strictPort &` then `curl -s -o /dev/null -w "%{http_code}" http://localhost:5180/` = 200 and the index module imports the registry/sidebar |
| V2 | `/components/<slug>` renders the live component + "view source HTML"; unknown slug handled | request `/components/leads-table` returns the leads view; registry has a not-found fallback |
| V3 | Wave-1 components converted, registered, each route renders; build clean; no raw useEffect in components | `pnpm --filter web build` exits 0 ; `grep -rL useEffect` shows components clean ; every wave-1 slug present in the registry |
| V4 | Archive snapshots a component's source to a SEPARATE tree; static snapshot builds | `scripts/ds-archive.sh leads-table` creates `design-system-archive/leads-table/` (react + source) ; `scripts/library-snapshot.sh` produces `design-system-dist/index.html` |
| V5 | Isolation/restore: a component survives a destructive edit | delete a component folder, run `scripts/ds-restore.sh <slug>`, build still exits 0 (restored from archive) ; restore path documented |
| V6 | Memory updated + MEMORY.md pointer | a `memory/` file describes the library + safety system ; `grep -q ui-library MEMORY.md` |

---

## Steps

### Step 1 — Safety + isolation system (archive, restore, static snapshot)
**Skill:** none
**Model:** claude-sonnet-4-6
**Touches:** scripts/ds-archive.sh, scripts/ds-restore.sh, scripts/library-snapshot.sh, scripts/DS-SAFETY.md, design-system-archive/.gitkeep
**Parallel-with:** 2
**Proves:** V4, V5
Passes: false

**Context for subagent:**
Build the source-isolation safety system so a destructive change to the library or one component cannot lose another. Create `design-system-archive/` (a separate, append-only, never-hand-edited tree at repo root; add a `.gitkeep`). Write three scripts and a doc:
- `scripts/ds-archive.sh <slug>` — copy the component's React folder `apps/web/src/components/design-system/<slug>/` into `design-system-archive/<slug>/react/`, and copy its original prototype sources (the matching `apps/web/design-system/preview/components-<slug>.html` plus the `_<slug>*.css/js` and any `_*` assets it links) into `design-system-archive/<slug>/source/`. Overwrite-safe; print what was archived. This is the canonical saved copy; it is written only by this script, never hand-edited.
- `scripts/ds-restore.sh <slug>` — restore `apps/web/src/components/design-system/<slug>/` from `design-system-archive/<slug>/react/`. Refuse if the archive entry is missing.
- `scripts/library-snapshot.sh` — run `pnpm --filter web build` and copy `apps/web/dist/` into a durable `design-system-dist/` (a static snapshot of the whole gallery that can be served by any static server without the dev server). Print the output path and a one-line "serve with" hint.
- `scripts/DS-SAFETY.md` — explain the model: components are self-contained folders the library only imports; git is the primary safe place (commit+push per component); the archive is an independent copy; the static snapshot survives a dev-server crash; the restore procedure. State plainly that the running localhost is just a view and is never the source of truth.
All scripts bash, executable, dependency-light (bash + cp + pnpm). No git commits inside the scripts (the orchestrator commits). Decide whether `design-system-dist/` should be gitignored (it is a build artifact — add it to `.gitignore`) while `design-system-archive/` is tracked (it is the safe copy).

**Test criteria:**
- `scripts/ds-archive.sh leads-table` creates `design-system-archive/leads-table/react/` (with the LeadsTable files) and `design-system-archive/leads-table/source/` (with `components-leads-table.html` + `_leads-table*`/`_lead-popover*` assets).
- `scripts/ds-restore.sh` exists, is executable, and refuses a missing slug with a clear error.
- `scripts/library-snapshot.sh` produces `design-system-dist/index.html` (non-empty) from a clean build.
- `scripts/DS-SAFETY.md` documents the isolation model, the archive, the snapshot, and the restore steps.
- `design-system-archive/` is git-tracked; `design-system-dist/` is gitignored.

### Step 2 — Library shell (home gallery + /components/$slug + nav/search/theme)
**Skill:** none
**Model:** claude-sonnet-4-6
**React-gate:** yes
**Touches:** apps/web/src/routes/index.tsx, apps/web/src/routes/components.$slug.tsx, apps/web/src/components/library/, apps/web/src/lib/component-registry.ts
**Parallel-with:** 1
**Proves:** V1, V2
Passes: false

**Context for subagent:**
Build the magicui.design-style library shell. Create a component registry `apps/web/src/lib/component-registry.ts`: an array of entries `{ slug, name, category, subtitle, viewport, sourceHtml, Component }` where `Component` is a lazy import of the converted React component and `sourceHtml` points at the original `apps/web/design-system/preview/components-<slug>.html`. Seed it with the existing `leads-table` entry. Define a curated CATEGORY order (Foundations, Primitives, Metrics & Charts, Data, Sheets & Cards, Workflow, AI, Misc) since every prototype is annotated `group="Brand"` and needs human-curated grouping.

Make the index route `/` render the gallery home: a left sidebar listing components grouped by category, a search box that filters the list by name/subtitle, and a light/dark toggle (reuse the design-system `_darkmode` mechanism / the `.dark` class on `<html>`). Keep the existing `VITE_PREVIEW_ROUTE` redirect behavior (from dev-preview-ports) intact: if that env is set, still redirect. Otherwise show the gallery.

Create a dynamic route `apps/web/src/routes/components.$slug.tsx` that looks up the slug in the registry and renders the live component in a framed preview area sized to its viewport, with the component name/subtitle header and a "View source HTML" link to its `preview/components-<slug>.html`. Unknown slug shows a clean not-found state. Put shared library UI (sidebar, search, layout, preview frame) under `apps/web/src/components/library/`.

Use the design tokens and `.shell` treatment for the chrome so the library itself looks on-brand. No raw `useEffect` in components (project rule); use router loaders/derived state/event handlers. Fast-Refresh export isolation. Keep `/leads` working (it can stay or redirect to `/components/leads-table`).

**Test criteria:**
- `pnpm --filter web build` exits 0.
- Dev server `/` returns 200 and the index module imports the registry + sidebar; the sidebar lists leads-table under a category.
- `/components/leads-table` renders the live LeadsTable plus a "View source HTML" link to `preview/components-leads-table.html`.
- An unknown slug (e.g. `/components/nope`) renders a not-found state, not a crash.
- `grep -c "useEffect" ` on the new library components and routes is 0.

### Step 3 — Wave 1 conversion (foundations + first primitives) + register + archive
**Skill:** style-transfer
**Model:** claude-sonnet-4-6
**React-gate:** yes
**Touches:** apps/web/src/components/design-system/, apps/web/src/lib/component-registry.ts, design-system-archive/
**Parallel-with:** none
**Proves:** V3, V4
Passes: false

**Context for subagent:**
Convert the WAVE 1 set to React following `apps/web/design-system/CONVERSION-SOP.md` (read it). Wave 1 = the foundation/token pages plus a first batch of simple primitives, chosen because they are low-risk and establish the gallery quickly:
Foundations: `colors-neutrals`, `colors-primary`, `colors-semantic`, `type-scale`, `type-display`, `spacing-scale`, `spacing-radii`, `spacing-shadows`, `iconography`, `brand-logo`, `background-gradient`.
Primitives: `buttons`, `pills`, `cards`.
For each: create a self-contained folder `apps/web/src/components/design-system/<slug>/` with the React component reusing the prototype's CSS verbatim (import the original `preview/_*.css` where one exists, else inline the prototype's `<style>` into a co-located CSS file) and matching the prototype's markup/classes; strip framework wiring; replace any `cn()`/third-party with plain equivalents; no raw useEffect (extract to a `*-hook.ts` if ever needed). Register each in `apps/web/src/lib/component-registry.ts` under the correct curated category. After a component builds and renders, archive it with `scripts/ds-archive.sh <slug>`. Do NOT convert the heavy React-UMD components (leaderboard, task-card) or the larger business/workflow components in this wave; those are later waves. Ask before adding any state/variant not in the source.

**Test criteria:**
- Every wave-1 slug has a folder under `apps/web/src/components/design-system/<slug>/` and a registry entry with the right category.
- `pnpm --filter web build` exits 0 and each wave-1 `/components/<slug>` route renders without console errors.
- `grep -rE "useEffect\(" apps/web/src/components/design-system/<wave-1 dirs>` returns nothing (no raw useEffect in components).
- `design-system-archive/<slug>/` exists for each converted wave-1 component (react + source).
- No `react-native` imports anywhere in the converted folders.

### Step 4 — Update memory
**Skill:** none
**Model:** claude-sonnet-4-6
**Touches:** memory/
**Parallel-with:** none
**Proves:** V6
Passes: false

**Context for subagent:**
Record the UI library + safety system: library at `/` with `/components/$slug`, the registry + curated categories, the source-isolation model (self-contained component folders, `design-system-archive/` separate tracked copy, `ds-archive.sh`/`ds-restore.sh`/`library-snapshot.sh`, `design-system-dist/` static snapshot gitignored), the build-medium policy (React-direct; HTML-first only for greenfield), and the wave roadmap (wave files in `debt/`). Add a `MEMORY.md` pointer. Reflect actual outcomes.

**Test criteria:**
- A `memory/` file describes the UI library, safety/isolation system, and build-medium policy.
- `MEMORY.md` has a `ui-library` pointer line.
- Notes match what was built (registry path, archive scripts, routes).

---

## Wave roadmap (authored into `debt/` at "go")

Each becomes `debt/ui-library-wave-N.md` in /execute format (convert → register in library → archive each; same SOP and verification shape as wave 1). leads-table is already done and seeds the gallery.

- **Wave 2 — Primitives + simple metrics:** `controls`, `fab`, `metric-card`, `metric-circle`.
- **Wave 3 — Charts & rich cards:** `chart`, `statistics-graph-card`, `streak-card`, `financial-health-card`, `hero-card`.
- **Wave 4 — Data & lists:** `leaderboard` (heavy/React-UMD), `pipeline-card`, `news-feed`, `index-bar`, `calendar`, `file-folder`.
- **Wave 5 — Sheets & selectors:** `task-card` (heavy/React-UMD), `prize-sheet`, `model-selector`, `model-selection-sheet`.
- **Wave 6 — Workflow:** `workflow-add-elements`, `workflow-nodes`, `workflow-publish`, `workflow-template-cards`, `multisteps`.
- **Wave 7 — AI & misc:** `ai-caveat`, `ai-memory-card`, `ai-message-box`, `theme-editor`, `todo-list`.
- **Known-issues update workflow** — `debt/ui-library-known-issues-workflow.md`: the repeatable loop for fixing a component flagged by Bora's Agentation review — fix in the live React component, re-archive on approval, library stays live, each finished/fixed component is a subpage. HTML-first only if a from-zero redesign is needed.

After all waves: "all done" → final `scripts/library-snapshot.sh` + archive sweep + commit/tag as the saved gallery.

---

## On "go" (before squash-merge; done by orchestrator, not /execute)

1. Author `debt/ui-library-wave-1.md` (copy of this plan) and `debt/ui-library-wave-2.md` … `wave-7.md` + `debt/ui-library-known-issues-workflow.md`, all in /execute step format.
2. Mark leads-table review **approved** in `apps/web/design-system/review-log.md` (Bora reviewed via Agentation, no changes requested).
3. Update memory (the dev-access + design-system entries already exist; add the library plan intent).
4. `git checkout -b feat/ui-library` off `feat/design-system`; commit the debt plans + review-log + memory-adjacent docs; `git push -u origin feat/ui-library`.

Note: `feat/ui-library` is based on `feat/design-system`, so it includes the leads-table + dev-preview work (PR #24). You can squash-merge `feat/ui-library` to main (superseding PR #24) or merge PR #24 first — your call at merge time.
