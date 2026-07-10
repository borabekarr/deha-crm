TASK: Build ONE self-contained, render-safe React component file: an iOS-inspired
DATE + TIME wheel picker for the Deha CRM — three date wheels (Day / Month / Year)
with a time picker (Hour / Minute / AM-PM) directly below them.

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
    `window.DateTimePicker = <YourRootComponent>;`
  - The root component MUST NOT be named `DateTimePicker`. Naming it `DateTimePicker`
    and also doing `window.DateTimePicker = DateTimePicker` causes infinite
    self-recursion in this non-module harness (a `<DateTimePicker/>` inside the root
    resolves to the global root). Name the root e.g. `DateTimePickerRoot`. This is a
    hard render-safety rule.
  - Do NOT use React-19-only APIs (`use`, `useOptimistic`, `useActionState`,
    ref-as-prop, form `action`). Target the React 18.3 API surface only.
  - NO raw `useEffect` anywhere (house rule + a lint gate forbids it). Wire DOM
    listeners via a callback ref that returns its cleanup:
    `ref={(el) => { if (el) wire(el); return () => cleanup(el); }}`. Derive state in
    the render phase (compare a stored `prev` value and `setState` during render), and
    use `onScroll` / `scrollend` / `onAnimationEnd` handlers instead of effects.
  - No network calls, no external assets, no CDN links, no `fetch`. Fully offline.
  - Deterministic render: no `Math.random()` / `Date.now()` at render time (a custom
    ESLint rule `no-nondeterministic-render` forbids it). Seed the default selection to
    a CONSTANT date/time (e.g. 14 June 2025, 2:30 PM) — do not read the real clock.

## STYLING (iOS look built on the Deha design system; inline everything)

Put all CSS in a single in-component `<style>` element (rendered once) scoped by a
component-prefixed class (e.g. `.dt-*`). There is NO external stylesheet available in
the harness, so inline the tokens you need. Match these house conventions:

- Font: Montserrat, system-ui fallback (`font-family:'Montserrat',system-ui,sans-serif`).
  Selected/committed values weight 700-900, tight letter-spacing (~-0.3px).
- Colors: hex slate ramp (NOT oklch, NOT raw rgba dumps). Inline these:
  `#F8FAFC #F1F5F9 #E2E8F0 #CBD5E1 #94A3B8 #64748B #475569 #334155 #1E293B #0F172A`.
  Semantic accents: success `#10B981`, warning `#FBBF24`, danger `#EF4444`,
  hot `#F97316`. Use a green (`#10B981` family) for the confirm pill.
- Spacing: 4px grid (4 / 8 / 12 / 16 / 24 / 32).
- Card surface: rounded ~20px radius, 1px slate border, soft shadow, generous padding.
- Easing: entrance/pop use `cubic-bezier(.34,1.56,.64,1)` (house "spring"); moves/exits
  use `cubic-bezier(.22,1,.36,1)`. Respect `@media (prefers-reduced-motion: reduce)`
  by disabling non-essential animation.
- Dark mode: support `@media (prefers-color-scheme: dark)` (the harness iframe honors
  the OS theme). Card surface light + dark variants (light `#FFFFFF`, dark `#1E293B`).

## COMPONENT SPEC — iOS wheel date + time picker

Reference the iOS UIDatePicker wheel: rows scroll vertically, snap to a fixed center
row, rows fade + shrink with distance from center, a translucent selection pill sits
static over the center row.

1. LAYOUT (vertical stack inside one card):
   - A header line showing the composed selection, e.g. "Sat 14 Jun 2025 · 2:30 PM",
     updating live as wheels settle.
   - DATE row: three wheel columns side by side — Day (1-31, clamped to the month),
     Month (full name: January…December, wider column), Year (a sensible range, e.g.
     1950-2035).
   - TIME row (directly below the date row): three wheel columns — Hour (1-12),
     Minute (00-59, zero-padded), AM/PM.
   - A confirm button: a prominent green pill (house `.btn-green` style: hover scale
     1.03, active scale 0.96, focus-visible outline). Clicking it flashes/echoes the
     committed value in the header (no network).

2. WHEEL MECHANICS (hand-rolled; no libraries — no swiper, no framer-motion):
   - Each column is a native vertical scroll container with
     `scroll-snap-type: y mandatory`; each row `height` ~38px with
     `scroll-snap-align: center`. Viewport height ~220px.
   - Top + bottom spacer divs (height = (viewport - row)/2) so the first and last real
     rows can center.
   - Depth effect: as the user scrolls, compute each row's distance from center
     (`centerIndex = scrollTop / ROW_H`) and interpolate scale (~1 → 0.7) and opacity
     (~1 → 0.05) by distance — the classic wheel fade. Recompute on `scroll` via rAF.
   - Settle: on scroll idle (native `scrollend` when available, else a ~100ms settle
     timer) commit `Math.round(scrollTop / ROW_H)` as the selected index and update
     state. Guard against an early settle overwriting the initial default (an
     `aligning` flag that suppresses commits until the first programmatic alignment to
     the default value has finished).
   - Programmatic snap that defeats CSS mandatory snap: temporarily set
     `scrollSnapType='none'`, set `scrollTop`, then restore snap on the next rAF.
   - Click-to-select: clicking a visible row scrolls smoothly to it
     (`scrollTo({top: idx*ROW_H, behavior:'smooth'})`).
   - iOS touch: subtle highlight/tick on the row crossing center; static translucent
     center pill overlay per column (or one spanning the row).

3. DATE CORRECTNESS:
   - Day count follows month + year, including leap-year February (28/29/30/31).
   - Changing Month or Year re-clamps the Day wheel and its selection if out of range
     (e.g. Jan 31 → switch to Feb → clamp to 28/29).

4. QUALITY: production-grade, polished, visually distinctive, and iOS-authentic in
   feel (smooth inertia-style settle, crisp center pill, legible depth fade).

## QUALITY BAR

Production-grade, polished, visually distinctive. It will be judged BLIND against two
other builds of this same brief, on: visual quality, wheel feel / animation, date+time
correctness (leap year, clamping, AM/PM), interactivity, and design-system fidelity.
Ship your best single file. Do not write any other files, tests, or explanations;
only the one component file.
