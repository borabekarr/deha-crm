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

## Definition of Done (per component)

- Renders in the browser matching the static HTML prototype visually and behaviorally.
- All original states and variants are present; none were added without explicit approval.
- No mobile dependencies remain in the component or its imports.
- `pnpm --filter web build` exits 0 with no type errors.
- React-doctor health gate passes for the component file.
- Bora approved the component via Agentation annotation, and the outcome is recorded in `review-log.md`.
