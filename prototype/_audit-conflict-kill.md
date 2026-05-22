# Conflict Kill Audit — tokens.css

Step 21 executor pass. Four conflict categories checked: deprecated inner-shadow literals, `transition: all`, hardcoded control widths, `display: none` on overlays.

---

## Deleted rules

_None._ No rule was fully deleted; all conflicts were resolved by editing in place or kept with justification. There were no rules where the bible fully covered the primitive such that the rule was redundant.

---

## Edited rules

- **`.btn`** (line 123) — `transition: all .15s ease` → `transition: background-color, box-shadow, opacity` each scoped to `var(--duration-fast) var(--ease-out-soft)`. Prevents compositor-layer thrashing on layout/geometry properties.

- **`.input, .textarea, .select`** (line 198) — `transition: all .15s` → `transition: border-color, box-shadow, background-color` each scoped to `var(--duration-fast) var(--ease-out-soft)`. Only the properties that actually change on focus/hover are animated.

- **`.check, .radio`** (line 221) — `transition:all .15s` → `transition: background-color, border-color, box-shadow` each scoped to `var(--duration-fast) var(--ease-out-soft)`. Prevents spurious width/height animation on browser reflow.

- **`.sidebar a`** (line 314) — `transition:all .15s` → `transition: background-color, color` each scoped to `var(--duration-fast) var(--ease-out-soft)`. Sidebar links only change background and text color on hover/active.

- **`.calendar td button`** (line 552) — `transition:all .15s` → `transition: background-color, color` each scoped to `var(--duration-fast) var(--ease-out-soft)`. Calendar date buttons only change background/color; the later override rule at ~line 607 already handles transform+box-shadow with proper scoping.

---

## Kept rules with justification

### `inset 0 1px 2px` — NOT PRESENT
`grep 'inset 0 1px 2px'` returns zero matches. The pattern flagged by the audit rule (top-emitting depth shadow written inline) does not exist in this file. What does exist are:
- `inset 0 1px 0` — top gloss highlight (1 px, zero blur). This is the highlight layer of `--shadow-inner-1` / `--shadow-inner-2`, used inline only in compound `box-shadow` values on structural surfaces (`.navmenu`, `.dialog`, `.sheet`, `.sidebar`, `.calendar`) where no single token covers the full multi-layer stack. Kept as-is; replacing with a token would require a new structural-surface token not defined in the bible.
- `inset 0 -2px 0` — bottom pressure line, same compound stacks as above.
- `inset 0 -2px 5px` / `inset 0 -1px 2px` — pill/badge depth shadows (`.pill-priority`, `.pill-tab`, `.badge.*`). These are pill-specific decorative shadows with no corresponding token. Kept; require new `--shadow-pill-*` tokens to replace (out of scope for this step).

### `display: none` — `.sheet-overlay` (line 330)
`.sheet-overlay { display: none; opacity: 0; transition: opacity ... }` / `.sheet-overlay.is-open { opacity: 1; }`. This is a **modal backdrop**. The initial `display: none` prevents the invisible element from intercepting pointer events and consuming layout space when the sheet is closed. When JS adds `.is-open`, display is expected to be restored (via JS or a companion rule) and opacity animates in. This pattern is the standard display-then-fade and is a **legitimate modal-close state** — exempted per audit brief.

### `display: none` — `.popover` (line 341)
`.popover { display: none; ... }`. The popover is a hover/click-triggered overlay. Ideally this would use `opacity: 0; pointer-events: none` for smooth fade-in. However, the popover has no sibling `.popover.is-open` rule in this file — the show/hide is driven entirely by JS toggling `display`. Replacing `display: none` with opacity here would break existing JS without a paired JS change. **Kept with flag**: this rule is a candidate for opacity-based toggle in a future JS-paired refactor. No change made to avoid breaking the prototype.

### `display: none` — `.menu` (line 726)
`.menu { display: none; position: absolute; z-index: 30; }` / `.menu.is-open { display: block; animation: dropdown-fade-in ... }`. The dropdown uses a JS click-to-open pattern. `display: none` is used because `.menu` is an absolutely positioned detached panel — keeping it in the DOM as `opacity: 0` would still intercept pointer events on underlying content unless `pointer-events: none` was added. The `.menu.is-open` state immediately uses a `dropdown-fade-in` keyframe animation for the opacity entrance. **Kept**: this is a click-triggered overlay where `display: none` prevents pointer-event bleed-through, and the fade is handled via the keyframe — not a raw `display` snap. Acceptable per audit brief exception for click overlays with animation entry.

### Hardcoded control widths — NONE FOUND
All `.btn`, `.input`, `.textarea`, `.select`, `.combo input` width/max-width declarations already use `var(--size-control-max)` or `var(--size-control-height)`. No hardcoded pixel/rem widths on control elements were found.
