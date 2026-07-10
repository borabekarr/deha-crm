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

## STYLING (Deha design system; inline everything)

Put all CSS in a single in-component `<style>` element (rendered once) scoped by a
component-prefixed class (e.g. `.dtw-*`). There is NO external stylesheet in the harness,
so inline the tokens you need. Match these house conventions:

- Font: Montserrat, system-ui fallback (`font-family:'Montserrat',system-ui,sans-serif`).
  Wheel values weight 600-800, tabular-nums, tight letter-spacing (~-0.3px).
- Colors: prefer `oklch()` values (the house standard). A single disciplined accent
  (house green) for the selected-row highlight and the Done button; neutrals subtly
  tinted (never pure gray/black); red only for a destructive nuance if needed.
- Spacing: 4px grid (4 / 8 / 12 / 16 / 24 / 32).
- Sheet surface: rounded top corners ~24-28px, concentric inner radii, soft LAYERED
  shadow, generous padding, a drag-handle pill at top (visual, per iOS convention).
- iOS wheel look: selected row inside a full-width rounded highlight band; rows above and
  below fade + slightly scale/tilt (opacity/transform gradient is enough; no real 3D
  needed); soft top/bottom fade masks over each wheel.
- Icons: material-symbols-outlined only. No emoji icons. One icon family.
- Easing: 150-300ms ease-out; scale(0.96) on press for primary button; focus-visible
  ring; respect `@media (prefers-reduced-motion: reduce)` (kill momentum animation,
  jump-snap instead).
- Dark mode: support BOTH `html.dark` (class convention) AND
  `@media (prefers-color-scheme: dark)`. Sheet + backdrop + text + highlight dark
  variants; accent holds.

## QUALITY BAR

Production-grade, polished, visually distinctive. It will be judged BLIND against another
build of this same brief on a 15-item visual rubric (spacing rhythm, hierarchy, optical
alignment, concentric radii, shadow quality, color discipline, numeric typography, hit
areas, gradient/shadow/icon/placeholder anti-slop, interactive states, dark mode, text
finishing). Correct day-count per month/year (leap years) is expected. Ship your best
single file. Do not write any other files, tests, or explanations; only the one
component file.
