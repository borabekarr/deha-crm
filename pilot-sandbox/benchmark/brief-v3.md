TASK: Build ONE self-contained, render-safe React component file, from the ground up:
an iOS-INSPIRED DATE + TIME WHEEL PICKER for the Deha CRM (appointment/viewing booking),
presented as a BOTTOM SHEET / MODAL over a screen, with actionable buttons.

## USER-CONFIRMED REQUIREMENTS (from interview; non-negotiable)

- Time format: 24-hour.
- Container: bottom sheet / modal presented over a dimmed screen (render it OPEN in a
  static preview; a small backdrop "screen" behind it is fine, plus a trigger button that
  re-opens the sheet after Cancel/Done closes it).
- Buttons: Cancel, Done/Confirm, and Reset to today. All three functional: Cancel closes
  without applying, Done applies the picked value to a visible summary on the backdrop
  screen and closes, Reset snaps all wheels back to "today".
- Wheels: FULLY DRAGGABLE and scroll-snapping, iOS style. Pointer-drag with momentum feel,
  wheel/trackpad scroll, and click-on-row-to-center must all land on a snapped row.
- Wheel rows, top section: DAY | MONTH | YEAR (three side-by-side wheels).
- Below it: a TIME picker section — HOUR | MINUTE wheels (24h, minutes in 5-min steps).
- One polished version. No variant props, no theme knobs beyond dark mode.

## OUTPUT CONTRACT (mandatory, non-negotiable)

- Write EXACTLY ONE file to this absolute path (already created, empty):
  {{OUTPUT_PATH}}
- The file is loaded via `ts.transpileModule` with `module: None`, `jsx: React`
  (classic runtime), then injected into a plain `<script>` tag in a browser.
- Therefore:
  - NO `import` and NO `export` statements anywhere. `React` is a GLOBAL
    (React 18.3.1 UMD is already on `window`). Use `React.useState`, `React.useRef`,
    etc., or destructure `const { useState, useRef, useCallback } = React;` at top.
  - The file MUST end by assigning the component to the global:
    `window.DateTimeWheelPicker = <YourRootComponent>;`
  - The root component MUST NOT be named `DateTimeWheelPicker`. Naming it the same as
    the global causes infinite self-recursion in this non-module harness. Name the root
    e.g. `DateTimeWheelPickerRoot`. This is a hard render-safety rule.
  - Do NOT use React-19-only APIs (`use`, `useOptimistic`, `useActionState`,
    ref-as-prop, form `action`). Target the React 18.3 API surface only.
  - NO raw `useEffect` anywhere (house rule + a lint gate forbids it). Wire DOM
    listeners via a callback ref that returns its cleanup. Derive state in the render
    phase, and use event handlers instead of effects.
  - No network calls, no external assets, no CDN links, no `fetch`. Fully offline.
  - Deterministic render: no `Math.random()` and no clock reads at render time.
    Define "today" as a CONSTANT (e.g. `const TODAY = { y: 2026, m: 7, d: 4, hh: 14, mm: 30 }`)
    and use it for the initial selection and the Reset-to-today action.

## RENDER-SAFETY: SCROLL-SETTLE RULE (hard requirement)

Wheel snapping is the classic self-re-arming runaway: a callback-ref + rAF + settle-timer
loop that re-arms on its own scroll corrections storms forever on real displays
(sub-pixel scroll-snap ring). The ONLY convergence guarantee is committed-value
reconciliation: keep a committed lastIndex per wheel; when a settle fires, compare the
landed index against the committed one and BAIL OUT (no further writes, no further rAF)
if they are equal. Never re-arm the settle loop from a correction you yourself issued.
A createElement watchdog (10k calls) and a 60s timeout gate will FAIL the build on any
storm.

## STYLING (Deha design system - LOCKED CANONICAL VALUES)

The Deha design system is the #1 source of truth. The values below are LOCKED: copy them
verbatim, do not re-derive, re-mix, or "improve" them. Colors MUST be expressed as
`oklch()` (the house standard is oklch-first). An automated gate (`token-fidelity-gate`)
samples the rendered pixels and FAILS the build on any color that does not match a
canonical value within `deltaEok 0.02`. So use ONLY the tokens listed here for every
color decision; a stray off-palette gray, blue, or green fails the gate.

Put all CSS in a single in-component `<style>` element (rendered once) scoped by a
component-prefixed class (e.g. `.dtw-*`). There is NO external stylesheet in the harness,
so inline the tokens you need, using these EXACT values.

### Locked color tokens (oklch triplets — `oklch(L C H)`)

Brand / accent (house green — the ONE disciplined accent; selected-row band + Done button):
- `--brand-primary` / `--bg-accent` / `--fg-brand` / `--semantic-success` = `oklch(0.696 0.149 162.5)` (#10B981)
- `--brand-primary-50`  = `oklch(0.979 0.021 166.1)` (#ECFDF5) — success/selection tint bg
- `--brand-primary-100` = `oklch(0.95 0.051 163.1)`  (#D1FAE5)
- `--brand-primary-500` = `oklch(0.696 0.149 162.5)` (#10B981) — same as primary
- `--brand-primary-600` = `oklch(0.596 0.127 163.2)` (#059669) — pressed/darker accent
- `--brand-primary-700` = `oklch(0.508 0.105 165.6)` (#047857)

Slate neutrals (never pure gray/black — these are subtly blue-tinted; use for text + surfaces):
- `--slate-50`  = `oklch(0.984 0.003 247.9)` (#F8FAFC)
- `--slate-100` = `oklch(0.968 0.007 247.9)` (#F1F5F9)
- `--slate-200` = `oklch(0.929 0.013 255.5)` (#E2E8F0) — hairline border (light)
- `--slate-300` = `oklch(0.869 0.02 252.9)`  (#CBD5E1)
- `--slate-400` = `oklch(0.711 0.035 256.8)` (#94A3B8) — muted fg (dark) / faint fg (light)
- `--slate-500` = `oklch(0.554 0.041 257.4)` (#64748B) — secondary fg (light)
- `--slate-600` = `oklch(0.446 0.037 257.3)` (#475569)
- `--slate-700` = `oklch(0.372 0.039 257.3)` (#334155) — primary fg (light) / hairline (dark)
- `--slate-800` = `oklch(0.279 0.037 260)`   (#1E293B) — card surface (dark)
- `--slate-900` = `oklch(0.208 0.04 265.8)`  (#0F172A) — app bg (dark)

Foreground ramp:
- `--fg1` light `oklch(0.208 0.04 265.8)` (#0F172A) / dark `oklch(0.968 0.007 247.9)` (#F1F5F9)
- `--fg2` light `oklch(0.372 0.039 257.3)` (#334155) / dark `oklch(0.869 0.02 252.9)` (#CBD5E1)
- `--fg3` light `oklch(0.554 0.041 257.4)` (#64748B) / dark `oklch(0.711 0.035 256.8)` (#94A3B8)
- `--fg-inverse` = `oklch(1 0 0)` (#FFFFFF) — text on the accent button

Semantic (red only for a destructive nuance; do not overuse):
- `--semantic-danger`  = `oklch(0.637 0.208 25.3)` (#EF4444)
- `--semantic-warning` = `oklch(0.795 0.162 86)`   (#EAB308)
- `--semantic-success` = `oklch(0.696 0.149 162.5)` (#10B981)

### Locked radii scale (concentric — outer sheet largest, nest inward)

`--radius-xs 6px` · `--radius-sm 8px` · `--radius-md 12px` · `--radius-lg 16px` ·
`--radius-xl 20px` · `--radius-2xl 24px` · `--radius-circle / pill 9999px`.
Sheet top corners use `--radius-2xl` (24px); inner cards/bands step down (16 → 12 → 8) so
radii stay visually concentric.

### Locked spacing (4px grid)

`4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48`px (`--space-1`…`--space-12`). No off-grid gaps.

### Locked type scale + weights

- Font: `'Montserrat', system-ui, -apple-system, 'Segoe UI', sans-serif` (`--font-display`).
- Sizes: display-1 36 · display-2 30 · h1 28 · h2 24 · h3 20 · h4 16 · h5 15 ·
  body 14 · body-sm 13 · meta 12 · micro 11 · mini 10 (px).
- Weights: medium 500 · semibold 600 · bold 700 · extrabold 800 · black 900.
- Wheel values: weight 600–800, `font-variant-numeric: tabular-nums`, tight tracking
  (`--tracking-tight -0.02em`, ~-0.3px). Numeric columns MUST be tabular-nums.

### Locked shadow recipes (verbatim — sanctioned house recipes, not slop)

- `--shadow-glass` = `0 4px 6px -1px rgba(0,0,0,0.10), 0 2px 4px -1px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.4)`
- `--shadow-glass-dark` = `0 4px 6px -1px rgba(0,0,0,0.50), 0 2px 4px -1px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.10)`
- `--shadow-glass-sm` = `0 1px 2px 0 rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.40)`
- `--shadow-emerald-glow` = `0 10px 40px -10px rgba(16,185,129,0.50)`
- `--shadow-emerald-glow-sm` = `0 10px 30px -10px rgba(16,185,129,0.50)`
- `--shadow-recessed` = `inset 0 2px 4px 0 rgba(0,0,0,0.06)` (use for wheel wells)

### Locked blur tokens

`--blur-glass 20px` · `--blur-strong 40px` (sheet/card backdrop-filter).

### Surface recipes (copy these house patterns verbatim — sanctioned, NOT slop)

`.card-glass` (the sheet surface + inner cards):
```
background: var(--bg-card);            /* light rgba(255,255,255,0.70) · dark rgba(30,41,59,0.70) */
backdrop-filter: blur(40px);           /* --blur-strong */
-webkit-backdrop-filter: blur(40px);
border: 1px solid var(--border-glass); /* light rgba(255,255,255,0.60) · dark rgba(255,255,255,0.10) */
border-radius: 24px;                   /* --radius-2xl */
box-shadow: var(--shadow-glass);       /* dark: --shadow-glass-dark */
```

`.btn-primary` (the Done/Confirm button — emerald, grid-textured, layered inset stack):
```
display: inline-flex; align-items: center; justify-content: center; gap: 8px;
padding: 12px 20px;
border-radius: 16px;                   /* --radius-lg */
background: oklch(0.696 0.149 162.5);  /* #10B981 emerald */
color: oklch(1 0 0);                   /* #fff */
font-weight: 800;
text-shadow: 0 1px 2px rgba(0,0,0,0.18);
box-shadow:
  var(--shadow-emerald-glow-sm),
  inset 0 1px 0 rgba(255,255,255,0.5),
  inset 0 -2px 0 rgba(0,0,0,0.22),
  inset 0 0 0 1px rgba(255,255,255,0.15);
background-image:                       /* 14px grid texture — sanctioned house pattern */
  linear-gradient(to right,  rgba(255,255,255,0.07) 1px, transparent 1px),
  linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px);
background-size: 14px 14px;
transition: filter 200ms cubic-bezier(.22,1,.36,1), transform 200ms;
```
`.btn-primary:hover { filter: brightness(1.05); }` · `.btn-primary:active { transform: scale(0.96); }`.

Selection-band pattern (the iOS wheel's centered highlight): a full-width rounded band
filled with the accent at LOW alpha over the wheel-value color, bordered with an accent
tint. Use `background: oklch(0.696 0.149 162.5 / 0.10)` (or `--brand-primary-50` in
light) with `border: 1px solid oklch(0.696 0.149 162.5 / 0.35)`, radius `--radius-md`
(12px). The selected numeral sits full-strength; neighbors fade. These grid-texture,
glass, and selection-band recipes are sanctioned house patterns, not slop.

### Dark mode values (support BOTH `html.dark` AND `@media (prefers-color-scheme: dark)`)

- App / backdrop bg: `oklch(0.208 0.04 265.8)` (#0F172A, `--bg-app` dark; `--slate-900`).
- Sheet / card surface: `rgba(30,41,59,0.70)` (`--bg-card` dark; solid form #1E293B =
  `oklch(0.279 0.037 260)`), border `rgba(255,255,255,0.10)` (`--border-glass-dark`),
  shadow `--shadow-glass-dark`.
- Foreground: `--fg1` `oklch(0.968 0.007 247.9)` · `--fg2` `oklch(0.869 0.02 252.9)` ·
  `--fg3` `oklch(0.711 0.035 256.8)`.
- Hairline border (dark): `oklch(0.372 0.039 257.3)` (#334155, `--slate-700`).
- The emerald accent HOLDS across modes (same `oklch(0.696 0.149 162.5)`).

### Icons + motion (unchanged house rules)

- Icons: material-symbols-outlined ONLY. No emoji icons. One icon family.
- Sheet: rounded top corners 24–28px, concentric inner radii, soft LAYERED shadow,
  generous padding, a drag-handle pill at top (visual, per iOS convention).
- iOS wheel look: selected row inside the selection band; rows above/below fade +
  slightly scale/tilt (opacity/transform gradient; no real 3D needed); soft top/bottom
  fade masks over each wheel.
- Easing: 150–300ms ease-out; `scale(0.96)` on press for primary button; focus-visible
  ring; respect `@media (prefers-reduced-motion: reduce)` (kill momentum animation,
  jump-snap instead).

## QUALITY BAR

Production-grade, polished, visually distinctive. It will be judged BLIND against another
build of this same brief on a 15-item visual rubric (spacing rhythm, hierarchy, optical
alignment, concentric radii, shadow quality, color discipline, numeric typography, hit
areas, gradient/shadow/icon/placeholder anti-slop, interactive states, dark mode, text
finishing). Correct day-count per month/year (leap years) is expected. Ship your best
single file. Do not write any other files, tests, or explanations; only the one
component file.
