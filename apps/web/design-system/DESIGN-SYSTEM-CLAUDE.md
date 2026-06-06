# Deha Design System — build & handoff guide

A library of **component previews** in `preview/`, each a standalone HTML file named
`components-*.html` (plus `colors-*`, `type-*`, `spacing-*`, `iconography.html`, etc.).
Every file is ~700px wide, links `_base.css`, and renders one component on a card.

## File map
| File | Role |
|---|---|
| `colors_and_type.css` | **Source of truth for tokens** — brand/slate/semantic colors, type scale, radii, spacing, shadows. Also defines the dark-mode token values (see below). |
| `preview/_base.css` | Shared page scaffold: `.card`, `.row`, `.grid`, `.label`, and the global **`.shell`** bezel. `@import`s `colors_and_type.css`. |
| `preview/_controls.css` + `_controls.js` | **Canonical interactive controls** — segmented radio (sliding pill) + toggle switch. |
| `preview/_darkmode.css` + `_darkmode.js` | Dark mode for "System A" files (see below). |
| `preview/components-*.html` | The components. |

## Design language
- Font **Montserrat** (display) + Material Icons / Material Symbols Outlined for glyphs.
- One brand color: **emerald `#10B981`**. Neutrals are **slate**. Semantics: success=emerald, warning `#EAB308`, danger `#EF4444`, hot `#F97316`.
- Signature surface treatment: soft **glossy inset** highlights (`inset 0 1px 0 rgba(255,255,255,…)`) on light, dark bottom edges, and a faint **7px grid texture** on emerald/solid badges & buttons. Pull exact values from `colors_and_type.css`.

## Dark mode — TWO systems coexist (match the one a file already uses)
- **System A** — class `dark` on `<html>`. A floating Dark/Light pill is injected by `_darkmode.js`; per-component color remaps live in `_darkmode.css` (selectors prefixed `html.dark …`). Wire a file in: link `_darkmode.css` after its `<style>`, add `<script src="_darkmode.js"></script>` before `</body>`.
  Files: controls, pills, model-selector, metric-card, leaderboard, task-card, theme-editor, all workflow-*, ai-caveat, iconography.
- **System B** — attribute `[data-theme="dark"]` on `<html>`, toggled by a bespoke inline `#themeToggle` button; overrides are written inline in each file as `[data-theme="dark"] …`.
  Files: chart, cards, buttons, calendar, ai-message-box. (Check the file — if it has its own `#themeToggle`, it's System B; leave it on that system.)
- Tokens in `colors_and_type.css` are defined for **both** (`:root[data-theme="dark"], .dark { … }`), so any style built on `var(--token)` adapts to either system for free. Prefer tokens for new dark styling.

## Grey component bezel — `.shell` (DEFAULT)
`.shell` (in `_base.css`) is the grey "bezel" a component sits on — token-driven via `--shell-bg` (`#D4DCE8` light / `#020617` dark), so it works in **both** dark systems automatically.

Rule of thumb:
- **Each standalone component gets its OWN shell.** e.g. cards preview = 3 cards → 3 shells; metric preview = 2 metrics → 2 shells.
- **Elements that together form ONE component share a SINGLE shell.** e.g. the two stacked task cards are one "today's tasks" unit → one shell around both.

Markup: `<div class="shell"><div class="…the surface…">…</div></div>` (10px padding, 28px radius). For grid layouts, make the `.shell` the grid item (move any `grid-column` onto the shell).

**Hover zoom:** add `.zoom` to a single-component shell so the grey bezel + inner surface scale up together as one unit on hover (`.shell.zoom`). Do NOT add `.zoom` to a shell that groups multiple elements (e.g. the task-card pair) — grouped shells stay static. When a shell zooms, the inner surface should NOT have its own hover transform (let the shell own the motion).

## Shared interactive controls — use these, never re-roll
Link `_controls.css` + `_controls.js`; both auto-initialise on load.
- **Segmented (radio, 1-of-n):**
  ```html
  <div class="seg"><span class="seg-pill"></span>
    <button class="active">A</button><button>B</button></div>
  ```
  A solid pill **slides** under the active button. Modifiers: `.compact` (tighter), `.fill` (buttons stretch to equal width). If your own script owns the `.active` class (e.g. it also drives a chart), add `data-seg-managed` and the shared script will only reposition the pill after your handler runs. `seg.__segMove()` is exposed for re-renders.
- **Toggle (switch):** `<div class="sw-base sw-on"></div>` / `sw-off`. iOS-style knob with a stretch-on-press; emerald + grid texture when on.
- Source of truth / live reference: `components-controls.html` (also has the slider).

## Notable component dynamics
- **components-leaderboard.html** is a **React** app (pinned React 18 + Babel standalone). Switching Revenue ↔ Growth % re-ranks the rows with a **FLIP** transform animation and **tweens the numbers** (setTimeout-driven so it's robust). The segmented pill is React-driven there (does not use `_controls.js`). Keep class names (`.lb`, `.seg`, `.row.win`, `.avatar`, `.name`, `.rev`) so `_darkmode.css` keeps matching.
- **components-metric-card.html** — clicking a metric opens an expanded overlay (`.exp-*`).
- **components-workflow-add-elements.html** — right-click the canvas opens the menu; tabs use a `data-seg-managed` `.seg`.
- Many surfaces animate via CSS transitions / JS tweens. They run in a normal browser; a static snapshot just shows the resting state.

## Adding a new component (checklist)
1. Start from `_base.css`; wrap the surface in `.shell` (own shell per component; shared shell if multiple pieces are one unit).
2. Use `_controls.css`/`.js` for any segmented or toggle.
3. Build on `var(--token)` colors from `colors_and_type.css`.
4. Wire dark mode (System A unless the file is already System B).
