# Plan: Deha UI Library — Wave 4 (Data & lists)
**Date:** 2026-06-06
**Topic:** ui-library-wave-4
**Status:** pending

> Prereq: wave-1 executed. Convert per `apps/web/design-system/CONVERSION-SOP.md` into self-contained React folders, register in `apps/web/src/lib/component-registry.ts`, archive with `scripts/ds-archive.sh <slug>`. React-direct. No raw useEffect in components. NOTE: `leaderboard` is a HEAVY component — its prototype ships React 18 UMD + Babel standalone; port it to the app's React (remove all CDN/Babel/UMD), keeping its FLIP re-rank animation and number tweening, and preserve the `.lb`/`.seg`/`.row.win`/`.avatar`/`.name`/`.rev` class names so `_darkmode.css` keeps matching. Ask before adding states/variants not in the source.

---

## Steps

### Step 1 — Leaderboard (leaderboard) [HEAVY]
**Skill:** style-transfer
**Model:** claude-sonnet-4-6
**React-gate:** yes
**Touches:** apps/web/src/components/design-system/leaderboard, apps/web/src/lib/component-registry.ts, design-system-archive/leaderboard
**Parallel-with:** none
Passes: false

**Context for subagent:**
Convert `components-leaderboard.html` into `apps/web/src/components/design-system/leaderboard/` per the SOP. Source is a React-UMD + Babel app: re-implement in the app's React (no CDN, no Babel). Preserve the Revenue<->Growth% segmented switch, the FLIP transform re-rank animation, and the number tweening (encapsulate timers/animation in a `leaderboard-hook.ts`, never a raw useEffect in the component). Reuse the prototype CSS verbatim and keep class names. Register under "Data". Archive `scripts/ds-archive.sh leaderboard`.

**Test criteria:**
- Folder + registry entry under "Data"; build exits 0; `/components/leaderboard` renders and switching Revenue/Growth re-ranks rows with animation.
- `grep -rE "useEffect\(" apps/web/src/components/design-system/leaderboard` returns nothing (effects only in `*-hook.ts`).
- No react-native / no `react.development.js` / no `@babel/standalone` references; `design-system-archive/leaderboard/` created.

### Step 2 — Pipeline card (pipeline-card)
**Skill:** style-transfer
**Model:** claude-sonnet-4-6
**React-gate:** yes
**Touches:** apps/web/src/components/design-system/pipeline-card, apps/web/src/lib/component-registry.ts, design-system-archive/pipeline-card
**Parallel-with:** none
Passes: false

**Context for subagent:**
Convert `components-pipeline-card.html` (4 AI signal types, inverted popover; uses `_pipeline-card.css`) into `apps/web/src/components/design-system/pipeline-card/` per the SOP. Reuse `_pipeline-card.css` verbatim. Popover open/close via state/event handlers. Register under "Data". Archive `scripts/ds-archive.sh pipeline-card`.

**Test criteria:**
- Folder + registry entry under "Data"; build exits 0; `/components/pipeline-card` renders; the inverted popover opens.
- No raw useEffect; archive created; no react-native.

### Step 3 — News feed (news-feed)
**Skill:** style-transfer
**Model:** claude-sonnet-4-6
**React-gate:** yes
**Touches:** apps/web/src/components/design-system/news-feed, apps/web/src/lib/component-registry.ts, design-system-archive/news-feed
**Parallel-with:** none
Passes: false

**Context for subagent:**
Convert `components-news-feed.html` into `apps/web/src/components/design-system/news-feed/` per the SOP. Reuse CSS verbatim. Register under "Data". Archive `scripts/ds-archive.sh news-feed`.

**Test criteria:**
- Folder + registry entry under "Data"; build exits 0; `/components/news-feed` renders matching the prototype.
- No raw useEffect; archive created; no react-native.

### Step 4 — Index bar (index-bar)
**Skill:** style-transfer
**Model:** claude-sonnet-4-6
**React-gate:** yes
**Touches:** apps/web/src/components/design-system/index-bar, apps/web/src/lib/component-registry.ts, design-system-archive/index-bar
**Parallel-with:** none
Passes: false

**Context for subagent:**
Convert `components-index-bar.html` (alphabetic filter) into `apps/web/src/components/design-system/index-bar/` per the SOP. Reuse CSS verbatim; filtering via derived state/event handlers. Register under "Data". Archive `scripts/ds-archive.sh index-bar`.

**Test criteria:**
- Folder + registry entry under "Data"; build exits 0; `/components/index-bar` renders and the alphabetic filter works.
- No raw useEffect; archive created; no react-native.

### Step 5 — Calendar (calendar)
**Skill:** style-transfer
**Model:** claude-sonnet-4-6
**React-gate:** yes
**Touches:** apps/web/src/components/design-system/calendar, apps/web/src/lib/component-registry.ts, design-system-archive/calendar
**Parallel-with:** none
Passes: false

**Context for subagent:**
Convert `components-calendar.html` into `apps/web/src/components/design-system/calendar/` per the SOP. Reuse CSS verbatim; month nav / selection via state. Register under "Data". Archive `scripts/ds-archive.sh calendar`.

**Test criteria:**
- Folder + registry entry under "Data"; build exits 0; `/components/calendar` renders matching the prototype.
- No raw useEffect; archive created; no react-native.

### Step 6 — File / folder (file-folder)
**Skill:** style-transfer
**Model:** claude-sonnet-4-6
**React-gate:** yes
**Touches:** apps/web/src/components/design-system/file-folder, apps/web/src/lib/component-registry.ts, design-system-archive/file-folder
**Parallel-with:** none
Passes: false

**Context for subagent:**
Convert `components-file-folder.html` into `apps/web/src/components/design-system/file-folder/` per the SOP. Reuse CSS verbatim. Register under "Data". Archive `scripts/ds-archive.sh file-folder`.

**Test criteria:**
- Folder + registry entry under "Data"; build exits 0; `/components/file-folder` renders matching the prototype.
- No raw useEffect; archive created; no react-native.

### Step 7 — Update memory
**Skill:** none
**Model:** claude-sonnet-4-6
**Touches:** memory/
**Parallel-with:** none
Passes: false

**Context for subagent:**
Record the wave-4 components (leaderboard, pipeline-card, news-feed, index-bar, calendar, file-folder) added and archived, including the leaderboard React-UMD port. Update MEMORY.md if needed.

**Test criteria:**
- A `memory/` file reflects wave-4 additions; entries match the converted components.
