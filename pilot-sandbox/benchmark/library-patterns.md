# Library Patterns — datetime-wheel-picker source of truth

Extraction for the library-first build of `datetime-wheel-picker`. Three real
sources feed it: the finished `date-picker/` (wheel mechanics), the finished
`model-selection-sheet/` (bottom-sheet chrome), and the Claude Design export
layout spec (the approved proportions). Every color the export names is mapped
to a canonical token from `apps/web/design-system/design-tokens.json`.

**Verdict up front: the export wins layout, the library wins mechanics.** Where
the two disagree (row height, wheel viewport, band alpha, header shape), take
the export's numbers and drive them through the library's proven scroll/settle
and sheet-enter machinery.

---

## 1. date-picker mechanics (library — the mechanics winner)

Source: `apps/web/src/components/design-system/date-picker/{DatePicker.tsx,DatePicker.css,date-picker-hook.ts}`.

### Wheel column structure
- DOM per wheel: `.dp-wheel[data-unit]` > `.dp-wheel-label` + `.dp-center-pill` (absolute, static) + `.dp-wheel-scroll` (the scroller). Values are appended into the scroller by the hook, not rendered in JSX.
- Each scroller gets a leading and trailing **spacer** of height `PADDING = (VIEWPORT_H - ROW_H)/2` so the first and last real items can center. `makeSpacer()` builds an `aria-hidden` div.
- The selection indicator is a **static absolutely-positioned pill** (`.dp-center-pill`, `z-index:1`) that the transparent scroller (`z-index:2`) reveals through. The pill never moves; values scroll under it. This is the pattern to reuse for the export's selection band.

### Row height and viewport (library values — SUPERSEDED by export)
- Library constants (`date-picker-hook.ts`): `ROW_H = 38`, `VIEWPORT_H = 220`, `PADDING = 91`.
- Library CSS mirrors them: `.dp-item { height: 38px }`, `.dp-wheel-scroll { height: 220px }`, `.dp-center-pill { height: 38px; top: 133px }`.
- **Disagreement with export:** export wants **44px** rows (iOS grid). Keep the library's `VIEWPORT_H = 220px` viewport (they agree there) but change `ROW_H` to `44`, which forces `PADDING = (220 - 44)/2 = 88px` — exactly the export's "88px spacer pads". Recompute the pill `top` from the same formula the CSS comment documents: `margin-top + label-height + gap + (viewport/2) - (row/2)`.

### Fade masks
- Top/bottom fade is done with `.dp-wheel-scroll::before` / `::after` — `position: sticky`, `height: 60px`, `linear-gradient` from `var(--card-bg)` to `transparent`, pulled back over content with negative margins (`margin-bottom:-60px` / `margin-top:-60px`), `pointer-events:none`, `z-index:4`. Reuse verbatim; only swap the gradient endpoint color if the sheet body background differs from `--card-bg`.
- Depth fade is JS, not just gradient: `fadePass()` scales+fades each item by distance from center using `SCALE_TABLE = [1,0.92,0.85,0.78,0.70]` and `OPACITY_TABLE = [1,0.60,0.35,0.15,0.05]`, interpolated between slots. `centerIndex = scrollTop / ROW_H` (the FIX comment: do NOT add PADDING).

### Snap and settle mechanics
- CSS: `.dp-wheel-scroll { scroll-snap-type: y mandatory }`, `.dp-item { scroll-snap-align: center }`.
- `makeSettleHandler(scrollEl, unit)` wires a `scroll` listener that (a) adds `.scrolling`, (b) `requestAnimationFrame`s a `fadePass`, (c) debounces a settle timer at `Math.round(100 * animMult)` ms. On settle it `Math.round(scrollTop / ROW_H)` → `commitValue` → `morphActiveItem`. If `'onscrollend' in window`, a native `scrollend` listener short-circuits the timer.
- **Programmatic positioning defeats mandatory snap** via `snapNoSnap()`: set `scrollSnapType='none'`, set `scrollTop = index*ROW_H`, restore snap next `requestAnimationFrame`. Use this for initial alignment and for cross-wheel clamping.
- **The aligning guard** (`let aligning`) is the load-bearing race fix: it is set `true` before `renderAll()` and during `alignAll()`, and the settle handler returns early while it is true, so an early `scrollend` fired at `scrollTop=0` cannot overwrite the default selection with index-0 values (the "1 January 2000" bug). Reuse this discipline for all five wheels.
- Click-to-select (`wireClickToSelect`): clicking an item `scrollTo({behavior:'smooth'})` + immediate `commitValue` for instant label update.
- `commitValue` does **committed-index reconciliation**: month/year commits call `clampDayToMonth()` which clamps `sel.day` to `daysInMonth` and re-snaps only if needed — no DOM rebuild (day column is static `DAY_VALUES` 1..31, built once).

### Wheel label styling (library — SUPERSEDED by export fonts)
- `.dp-wheel-label`: `font-size:12px; font-weight:900; letter-spacing:0.12em; text-transform:uppercase; color:var(--fg2)`, `height:18px`, `margin-top:20px`. Keep the label chrome; the export's per-wheel value fonts (below) override the item font, not this label.
- `.dp-item`: `font-family: var(--font-display); font-size:15px; font-weight:900; color:var(--fg4)`; `.dp-item.active { color:#fff }` (white over the dark pill). `.dp-wheel-scroll.scrolling .dp-item { transition:none }` freezes transitions mid-scroll to kill the active-highlight flash.

### Hook API surface — functions to REUSE for datetime-wheel-picker-hook.ts
Reuse these by name/shape (extend for five wheels; do not modify the existing file):
- **`pickerRef(el)`** — the exported callback ref that wires everything; mirror it as `datetimePickerRef(el)`.
- **`cleanupPicker(el)`** — teardown via `el.__pickerCleanup`; mirror as `cleanupDatetimePicker(el)`. Both stored-on-element so ref detach/reattach re-tears-down.
- **`formatLabel(d,m,y)`** — exported label formatter; extend to a datetime formatter for the trigger card.
- Internal helpers to copy: **`makeSpacer()`**, **`renderColumn()`**, **`snapTo()` / `snapNoSnap()`**, **`fadePass()`**, **`makeSettleHandler()`**, **`alignAll()` + the `aligning` guard**, **`morphActiveItem()`**, **`wireClickToSelect()`**, **`commitValue()`**, **`clampDayToMonth()`** (extend to also clamp the hour/minute wheels, which need no clamp — they are fixed 0..23 / 0..59), and the **`allTimers` / `allRafs`** cleanup arrays.
- `--anim-mult` read: `parseFloat(getComputedStyle(documentElement).getPropertyValue('--anim-mult')) || 1` keeps JS timers in sync with the CSS slowdown. Reuse verbatim.

---

## 2. model-selection-sheet chrome (library — the sheet-chrome winner)

Source: `apps/web/src/components/design-system/model-selection-sheet/{ModelSelectionSheet.css,ModelSelectionSheet.tsx,model-selection-sheet-hook.ts}`.

### Sheet surface
- `.sheet`: `position:relative; width:344px; border-radius: var(--card-radius); overflow:hidden; background: var(--card-bg); border:1px solid var(--card-border); box-shadow: inset 0 0 0 1px rgba(15,23,42,0.04)`. A block of **local CSS custom properties** at the top of `.sheet` (`--body/--header/--edge/--title/--vendor/--track/--hdr-label` …) is flipped wholesale in the `html.dark .sheet` block — this "flip local vars only" pattern is how dark mode stays one edit. Reuse it: declare the datetime picker's colors as local vars on the sheet root, override them under `html.dark`.
- **Disagreement with export:** export wants sheet width **max-width 430px** and **28px top-corner radius** (a real bottom sheet), vs the library's centered 344px card at `--card-radius`. Take the export dimensions; keep the library's surface tokens, inset hairline, and the dark-var-flip mechanism.

### Scrim / backdrop
- The library sheet renders inside `.shell.sel-shell` (a grey bezel, `padding:9px`) over `.mss-card` (a page-tint background with `radial-gradient(... rgba(16,185,129,0.07) ...)`). It has no modal scrim of its own — it is an inline card.
- **The export supplies the scrim the library lacks:** backdrop `slate-900 at 0.28 alpha with 6px blur`. Build it as a fixed overlay behind the sheet: `background: rgba(15,23,42,0.28); backdrop-filter: blur(6px)`. Note the emerald page-tint `rgba(16,185,129,0.07)` recurs here — same **0.07** band the export uses for selection; consistent brand-tint alpha.

### Drag handle
- Library has no handle (it is not a dragged sheet). The export adds one: **40x4** pill above the header. Build as a centered `.dtw-handle { width:40px; height:4px; border-radius:9999px; background: <track> }`, reusing the sheet's `--track` var (`#E5EAF1` light / `rgba(255,255,255,0.09)` dark) for the fill.

### Header chrome
- Library header `.sh-head`: `display:flex; align-items:center; justify-content:space-between; padding:14px 14px 13px; background:var(--header); border-bottom:1px solid var(--edge)`. Nav buttons are `35x35` circles with `inset` bezel shadow. Center holds `.sh-title` (`font-size:10.5px; font-weight:900; letter-spacing:0.06em; uppercase`) + dot indicators.
- **Disagreement with export:** export wants an **iOS Cancel / title / Done** header, NOT nav-circles + dots and NOT a separate close X. Keep the library's three-column flex geometry and `border-bottom:1px solid var(--edge)`, but replace the circles with text buttons (spec in §3) and drop the dots. The date-picker's separate `.dp-head-close` X is explicitly NOT reused — the export forbids a duplicate close affordance.

### Enter / exit animation variables (reuse the timing discipline)
- **One source of truth** at the top of `.sheet`: `--mss-enter-raw:200ms; --mss-exit-raw:140ms; --mss-ease: cubic-bezier(.22,1,.36,1)`, then `--mss-enter: calc(var(--mss-enter-raw) * var(--anim-mult, 1))` (and exit likewise). Every transition references `var(--mss-enter)` / `var(--mss-exit)`, so one multiplier scales the whole sheet. Reuse this exact structure.
- Entrance is a **progressive enhancement gated on `.intro` + `prefers-reduced-motion: no-preference`**: `@media (prefers-reduced-motion: no-preference) { .sheet.intro { animation: sheetIn ... } }`, `@keyframes sheetIn { 0%{transform:scale(0.85)} 100%{transform:scale(1)} }`. JS removes `.intro` after it plays, so snapshot/PDF/reduced-motion render the populated sheet, never a blank shell. Reuse this pattern for the datetime sheet's enter (the date-picker's `.dp-panel--open` / `--closing` / `--hidden` class trio is the alternative mounted-through-exit model — either works; the sheetIn `.intro` gate is cleaner for a modal).
- date-picker's own enter for reference: `@keyframes dp-panel-enter { translateY(-16px) scale(0.95) → 0/1 }` on `.dp-panel--open` with `cubic-bezier(.34,1.56,.64,1)`; exit is `animation:none` + transition back, `PANEL_EXIT_MS=300` in JS.

### Dark-mode blocks
- Pattern: flip the local var block under `html.dark .sheet` (see above), plus targeted `!important` resets for stubborn inner borders (`html.dark .mss-card .metric` hard-resets border/shadow/outline). The confirm CTA is re-themed light-on-dark, scoped by id (`html.dark #mss-confirmBtn`) to beat the global cascade. Reuse: scope any dark override that must beat a global rule to the component id.

### anim-mult usage
- Every animated property multiplies its raw duration by `var(--anim-mult, 1)` in CSS, and the hook reads the same property to scale JS timers. This is the invariant the token gate and the palette gate both assume. Carry it into every transition/animation in `DatetimeWheelPicker.css`.

---

## 3. Claude Design export layout spec (export — the layout winner, recorded verbatim)

These are the approved proportions. Where they disagree with the library (§1, §2), these win.

- **Wheel rows: 44px** each (iOS grid).
- **Wheels: 220px tall** with **88px spacer pads** top and bottom (= (220 − 44)/2).
- **Fonts (all tabular-nums):** day **21px / 700**; month **15px / 700**; year **17px / 700**; hour and minute **26px / 800**.
- **Selection band:** background emerald at **0.07 alpha**, with **1.5px top and bottom hairlines only** (no side/full border), corner **radius 10px**.
- **Header row:** **Cancel** (15px / 600, slate-500) — then **title** (15px / 800) — then **Done** (15px / 800, emerald). A **40x4 drag handle** sits above the header.
- **Reset-to-today:** a small emerald-tint **pill below the wheels**.
- **Sheet:** **28px** top corner radius; **max-width 430px**.
- **Backdrop:** slate-900 at **0.28 alpha** with **6px blur**.
- **Trigger card:** shows the applied date at **34px / 900** and time at **22px / 700**, plus a confirm-pop badge.

Wheel order: day · month · year, then hour : minute (five wheels total).

---

## 4. Token mapping (every export color → canonical token)

Canonical source: `apps/web/design-system/design-tokens.json`. In-app, prefer the
CSS custom property (available via `_base.css` / `_darkmode.css`); the literal
hex/oklch is the fallback for the standalone preview where those vars are absent.

| Export element | Spec value | Canonical token | Light raw | Dark raw |
|---|---|---|---|---|
| Selection band fill | emerald @ 0.07 alpha | `--brand-primary` / `--semantic-success` @ 0.07 | `rgba(16,185,129,0.07)` (base `#10B981`) | same (0.07 tint reads on dark body) |
| Selection band hairlines | 1.5px top/bottom | `--brand-primary` low-alpha | `rgba(16,185,129,0.30)` | `rgba(16,185,129,0.34)` (matches sheet `--hover-glow` dark) |
| Header title | 15px/800 | `--fg1` (`--slate-900`) | `#0F172A` | `#F1F5F9` |
| Cancel button | 15px/600 slate-500 | `--slate-500` / `--fg3` light | `#64748B` | `#94A3B8` (`--fg3` dark) |
| Done button | 15px/800 emerald | `--brand-primary` | `#10B981` | `#34D399` (`--brand-primary-400`) |
| Drag handle | 40x4 | sheet `--track` | `#E5EAF1` | `rgba(255,255,255,0.09)` |
| Sheet body bg | — | `--card-bg` / `--bg-card-solid` | `#FFFFFF` | `#1E293B` |
| Sheet header bg | — | sheet `--header` | `#F4F7FB` | `#0F172A` |
| Sheet border / edge | — | `--card-border` / sheet `--edge` | `rgba(15,23,42,0.07)` | `rgba(255,255,255,0.07)` |
| Backdrop scrim | slate-900 @ 0.28 + blur 6px | `--slate-900` @ 0.28 | `rgba(15,23,42,0.28)` | `rgba(15,23,42,0.28)` |
| Reset pill | emerald tint | `--brand-primary` @ ~0.10–0.12 + `--brand-primary` text | `rgba(16,185,129,0.10)` / `#10B981` | `rgba(16,185,129,0.14)` / `#34D399` |
| Wheel value text (inactive) | — | `--fg4` | `#94A3B8` | `#64748B` |
| Wheel value text (active, over band) | — | `--fg1` (or `--brand-primary` on the tinted band) | `#0F172A` | `#F1F5F9` |
| Wheel label | 12px/900 uppercase | `--fg2` | `#334155` | `#CBD5E1` |
| Trigger date | 34px/900 | `--fg1` | `#0F172A` | `#F1F5F9` |
| Trigger time | 22px/700 | `--fg2` / `--slate-700` | `#334155` | `#CBD5E1` |
| Trigger confirm badge | pop | `--brand-primary` | `#10B981` | `#10B981` |
| Fonts | display + tabular | `--font-display` (`'Montserrat', system-ui …`) | — | — |
| Sheet radius | 28px | (no exact token; nearest `--radius-2xl` = 24px) → use literal **28px** | — | — |
| Band radius | 10px | (between `--radius-sm` 8px and `--radius-md` 12px) → use literal **10px** | — | — |

Notes: `--anim-mult` (`misc`, raw `1`) drives all durations. The emerald **0.07**
band alpha is a **sanctioned overlay** (`rgba(255,255,255,0.07)` and the brand
0.07 tint appear in the sheet's own `radial-gradient`), so the token-fidelity
gate will accept it. `28px` and `10px` have no exact radius token — use literals
and note the deviation in the build.

---

## Disagreement ledger (export vs library) — export layout wins, library mechanics win

| Dimension | Library | Export | Take |
|---|---|---|---|
| Row height | 38px | **44px** | export |
| Spacer pad | 91px | **88px** | export (falls out of 44px + 220px) |
| Viewport | 220px | 220px | agree |
| Value fonts | uniform 15px/900 | per-wheel 21/15/17/700 + 26/800 | export |
| Selection indicator | solid dark pill `#0f172a` full height | emerald **0.07** fill + 1.5px top/bottom hairlines, radius 10px | export |
| Header | title + X close | Cancel / title / Done, no X | export |
| Sheet width/radius | 344px / `--card-radius` | 430px / **28px** | export |
| Scrim | none (inline card) | slate-900 0.28 + 6px blur | export |
| Scroll/settle, aligning guard, fade pass, morph, cleanup | full working impl | (none) | **library** |
| Enter animation + `--anim-mult` timing discipline | full working impl | (none) | **library** |
| Dark mode via local-var flip | full working impl | (none) | **library** |
