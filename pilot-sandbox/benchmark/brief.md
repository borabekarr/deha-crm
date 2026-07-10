TASK: Build ONE self-contained, render-safe React component file, from the ground up:
a DAY PICKER WITH TIME SLOTS for the Deha CRM (appointment/viewing booking) — pick a
day from a horizontal week strip, then pick an available time slot from a grid, with a
confirm action.

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
    `window.DayPickerSlot = <YourRootComponent>;`
  - The root component MUST NOT be named `DayPickerSlot`. Naming it `DayPickerSlot` and
    also doing `window.DayPickerSlot = DayPickerSlot` causes infinite self-recursion in
    this non-module harness (a `<DayPickerSlot/>` inside the root resolves to the global
    root). Name the root e.g. `DayPickerSlotRoot`. This is a hard render-safety rule.
  - Do NOT use React-19-only APIs (`use`, `useOptimistic`, `useActionState`,
    ref-as-prop, form `action`). Target the React 18.3 API surface only.
  - NO raw `useEffect` anywhere (house rule + a lint gate forbids it). Wire DOM
    listeners via a callback ref that returns its cleanup. Derive state in the render
    phase (compare a stored `prev` value and `setState` during render), and use
    event handlers instead of effects.
  - No network calls, no external assets, no CDN links, no `fetch`. Fully offline.
  - Deterministic render: no `Math.random()` / `Date.now()` at render time. Seed all
    content to CONSTANT values (a fixed task, fixed due date) — do not read the clock.

## STYLING (Deha design system; inline everything)

Put all CSS in a single in-component `<style>` element (rendered once) scoped by a
component-prefixed class (e.g. `.dps-*`). There is NO external stylesheet in the harness,
so inline the tokens you need. Match these house conventions:

- Font: Montserrat, system-ui fallback (`font-family:'Montserrat',system-ui,sans-serif`).
  Metric/KPI values weight 700-900, tight letter-spacing (~-0.3px), tabular-nums.
- Colors: prefer `oklch()` values (the house standard). A single disciplined accent per
  card; neutrals must be subtly tinted (never pure gray/black). Semantic accents: a green
  for success/primary, amber for warning, red for danger.
- Spacing: 4px grid (4 / 8 / 12 / 16 / 24 / 32).
- Card surface: rounded ~20-24px radius, concentric inner radii, soft LAYERED shadow (not
  a single hard border), generous padding.
- Icons: material-symbols-outlined only. No emoji icons. One icon family.
- Easing: 150-300ms ease-out; scale(0.96) on press for the primary button; focus-visible
  ring. Respect `@media (prefers-reduced-motion: reduce)`.
- Dark mode: support BOTH `html.dark` (class convention) AND
  `@media (prefers-color-scheme: dark)`. Card + text + border dark variants; accent holds.

## COMPONENT SPEC — Day Picker with Time Slots

1. LAYOUT (single card/panel):
   - Header: a clear title (e.g. "Book a viewing") and the current month/context line.
   - Day strip: one horizontal row of 7 days (weekday label + day number), one selected,
     today subtly marked, at least one disabled/unavailable day. Selection is pressable
     with a visible selected state.
   - Slot grid: time slots for the selected day (e.g. 09:00-17:30, 30 min steps) laid out
     as a grid of pills/buttons; mix of available, selected (one), and disabled (booked)
     slots. Changing the day changes which slots are disabled (seeded, deterministic).
   - Footer: a summary line of the chosen day + slot, and a primary confirm button
     (prominent, pressable) plus a subtle secondary action.

2. QUALITY: production-grade, polished, visually distinctive. Clear hierarchy, concentric
   radii, layered shadow depth, disciplined color, comfortable hit areas (>=44px), tabular
   numerals for times, real hover/focus/active states, first-class dark mode.

## QUALITY BAR

Production-grade, polished, visually distinctive. It will be judged BLIND against another
build of this same brief on a 15-item visual rubric (spacing rhythm, hierarchy, optical
alignment, concentric radii, shadow quality, color discipline, numeric typography, hit
areas, gradient/shadow/icon/placeholder anti-slop, interactive states, dark mode, text
finishing). Ship your best single file. Do not write any other files, tests, or
explanations; only the one component file.
