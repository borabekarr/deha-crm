# Deha Design System: HTML to React Conversion SOP

The Deha design system is authored in Claude Design as static `preview/components-*.html` prototypes. This SOP converts each prototype into a working web React component re-skinned to the Deha tokens while preserving the original structure and behavior.

## Canonical Paths

| Purpose | Path |
|---|---|
| Source HTML prototypes (imported from Claude Design) | `apps/web/design-system/preview/components-*.html` |
| Source stylesheets | `apps/web/design-system/colors_and_type.css`, `_base.css`, `_controls.css`, `_darkmode.css` |
| Source scripts | `apps/web/design-system/_controls.js`, `_darkmode.js` |
| Converted React components | `apps/web/src/components/design-system/` |
| Showcase route registration | `apps/web/src/routes/` (index or showcase route) |
| Review log | `apps/web/design-system/review-log.md` |

---

## Conversion Checklist (follow in order)

1. **Read the source.** Open `preview/components-[name].html` and every CSS file it links. Understand the structure, all interactive states, and the behavior before writing any code.

2. **Preserve structure and logic.** Keep the interaction model intact. Strip framework wiring (imports, providers, router). Replace `cn()`, utility helpers, and third-party UI dependencies with plain equivalents (native CSS classes, direct DOM logic, or minimal React state).

3. **Redesign mobile-origin sources for web.** If the source was built with React Native or any mobile-specific dependency, redesign it for the web context rather than porting it. Remove ALL mobile dependencies -- no React Native, Expo, Reanimated, or related packages.

4. **Re-skin with Deha tokens only.** Apply colors and typography strictly from `colors_and_type.css` (Montserrat typeface, emerald `#10B981`, slate neutrals, semantic color variables). Do not invent colors outside the token set.

5. **Apply Deha surface treatment and shell bezels.** Add glossy inset highlights, dark bottom edges, and the 7px grid texture on emerald or solid-fill elements. Wrap each component in a `.shell` bezel: one shell per standalone component; one shared shell when several pieces form a single unit. Add the `.zoom` class only to single-component shells.

6. **Reuse canonical controls.** Use the segmented control and toggle from `_controls.css` / `_controls.js` wherever the source's own controls overlap with those patterns. Do not duplicate control styles.

7. **Wire dark mode correctly.** Use System A (`_darkmode.css` + `_darkmode.js`) by default. Switch to System B only when the component file warrants it. Match whatever approach is appropriate for the prototype.

8. **Use Material Symbols Outlined for all glyphs.** For real assets (photos, illustrations), use placeholder elements. Do not add hand-drawn SVG imagery.

9. **Register in the showcase route.** Import and render the converted component in the showcase route under `apps/web/src/routes/` so it appears in the browser during review.

10. **Run the review loop.**
    - Start the dev server on the VPS: `pnpm --filter web dev` (port 5173).
    - The reviewer opens it via SSH tunnel: `ssh -L 5173:localhost:5173 <user>@<vps>`, then navigates to `http://localhost:5173`.
    - The reviewer annotates issues using the Agentation toolbar.
    - Iterate on the conversion until Bora approves.
    - Record the outcome (component name, date, approval status, notes) in `apps/web/design-system/review-log.md`.

---

## RULE: Ask Before Adding

**Ask Bora before adding any content, states, or variants that were not present in the original source HTML.** This includes extra breakpoints, additional color variants, new interaction states, or supplementary UI copy.

---

## Design lock during conversion

Creating new converted components writes files under `apps/web/design-system/` and `apps/web/src/components/design-system/`. The `ds-design-lock` hook blocks writes to both paths by default to prevent accidental drift from the approved Claude Design source.

Before running an authorized wave `/execute` that creates new ports, disable the lock:

```bash
scripts/ds-lock.sh off
```

After the wave completes and the component is approved, restore the lock:

```bash
scripts/ds-lock.sh on
```

The full protocol, including bypass options and the scope of what is guarded, is documented at `.claude-ext/references/frontend/design-lock-protocol.md` (slug: `design-lock-protocol`).

**Caution:** This SOP file itself lives under `apps/web/design-system/`, so editing it also requires the `DS_DESIGN_EDIT=approved` bypass to be active in `.claude/settings.local.json`.

---

## Card backgrounds and color semantics (added 2026-06-11)

This rule was introduced during a task-card feedback pass on 2026-06-11. It applies to new or newly-converted components going forward. Existing components are not to be retrofitted as part of this change.

New card designs must follow three constraints:

- **Flat backgrounds only.** Gradient fills on card surfaces are banned. Use a solid token color (typically `--shell-bg` or a neutral from `colors_and_type.css`).
- **Green is reserved for genuine success semantics.** Neutral sections, tints, and decorative fills must default to grey, not green. The emerald `#10B981` token signals positive/success state and must not appear as a general-purpose background or accent.
- **Reuse canonical patterns instead of bespoke treatments.** Prefer `.badge.success` for success chips, `.badge.col-tag` for task-board column tags (both in `Pills.css`), and the `--shell-bg` grey inner-card tray (the `MetricCard` `.exp-outer` to `.exp-card` nesting pattern) instead of inventing new gradient or green treatments per component.

---

## Surface external-line treatment (added 2026-06-11)

All card, shell, popover, and nested-card surfaces carry a neutral hairline border (#E2E8F0 light / #334155 dark) plus a brighter top-rim (border-top-color rgba(255,255,255,0.85) light / rgba(255,255,255,0.22) dark), defined ONCE globally in apps/web/design-system/preview/_surfaces.css (imported last in src/styles/global.css).

The rule uses only border + border-top-color (additive, never box-shadow, so existing shadows survive) with literal hex (design tokens are not reliable on the /components preview routes). border-top-color carries !important so component border shorthands cannot reset the top-rim.

New or newly-converted components must ADD their outer-shell and card/popover surface classes to the grouped selector lists in _surfaces.css rather than reimplementing per component.

Excluded surfaces: the preview page stage .card and .frame, the permanently-dark .nf-card, the prize-sheet phone chrome (.ps-device/.sheet), and the leaderboard .lb-outer/.lb/.row (the reference, which keeps its own border).

---

## Definition of Done (per component)

- Renders in the browser matching the static HTML prototype visually and behaviorally.
- All original states and variants are present; none were added without explicit approval.
- No mobile dependencies remain in the component or its imports.
- `pnpm --filter web build` exits 0 with no type errors.
- React-doctor health gate passes for the component file.
- Bora approved the component via Agentation annotation, and the outcome is recorded in `review-log.md`.
