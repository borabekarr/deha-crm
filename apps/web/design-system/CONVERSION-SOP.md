# Deha Design System: HTML to React Conversion SOP

This SOP converts a Claude Design HTML prototype into a working web React component. The pipeline is byte-preservation first: the converted component must be pixel-identical to its source, with adaptation limited to what the React/TS stack requires.

## Canonical Paths

| Purpose | Path |
|---|---|
| Source HTML prototypes (deha-claude-design-htmls clone) | `apps/web/design-system/claude-design/raw/<slug>/<slug>.html` |
| Source stylesheets | `apps/web/design-system/colors_and_type.css`, `_base.css`, `_controls.css`, `_darkmode.css` |
| Source scripts | `apps/web/design-system/_controls.js`, `_darkmode.js` |
| Converted React components | `apps/web/src/components/design-system/` |
| Component registry | `apps/web/src/lib/component-registry.ts` |
| Pixel gate | `scripts/ds-pixel-gate.sh` |
| Review log | `apps/web/design-system/review-log.md` |

---

## RULE: Sources come only from claude-design/raw/

The only valid source for a conversion is `apps/web/design-system/claude-design/raw/<slug>/<slug>.html`, the deha-claude-design-htmls clone. Read it verbatim. Refresh it only by `git pull` inside that clone, never by hand-editing or replacing individual files.

`apps/web/design-system/preview/incoming/` pre-adapted copies are banned as a source. Copying a file into `preview/incoming/` and adjusting it before conversion is not a valid step in this SOP under any circumstance. This exact practice caused the 2026-08-07 reset, where components ported from pre-adapted copies drifted from their source and had to be deleted and rebuilt from raw HTML.

If `preview/incoming/` or any similar pre-adapted staging copy exists on disk, treat it as stale and do not read from it. Always re-read `claude-design/raw/<slug>/<slug>.html` directly.

---

## RULE: Byte-preservation

Stack adaptation may change these things only:

1. Module packaging (splitting a static HTML file into a React component, imports, exports).
2. TS types (adding props, interfaces, type annotations required by TypeScript).
3. Icon-font imports (wiring Material Symbols Outlined the React way instead of a raw `<link>` or `<span>`).
4. Value-identical motion-token substitution (spelling changes only, see the tokenization rule below).
5. Removal of page packaging, replaced by an embedded shell (see the packaging rule below).

Everything else is byte-preserved from the source, unchanged:

- Every DOM class name.
- DOM hierarchy (element nesting and order).
- Every CSS value (colors, spacing, sizes, radii).
- Every duration.
- Every easing curve.
- Every color, including exact hex/rgb values.

If the source uses a class name, keep that exact class name. If the source nests three divs, keep three divs in that order. Do not rename, restructure, simplify, or "clean up" anything from the raw HTML during this stage. Any deviation from the source is a conversion bug, not a design decision.

---

## RULE: Pixel gate is a hard precondition for registry entry

Before adding a component to `apps/web/src/lib/component-registry.ts`, the pixel gate must pass:

```bash
bash scripts/ds-pixel-gate.sh <slug>
```

Run the gate against the default state first. Then run it again for every interactive state the source defines, using the `PIXEL_GATE_INTERACTION_SELECTOR` env var to target the interaction:

```bash
PIXEL_GATE_INTERACTION_SELECTOR="<css selector>" bash scripts/ds-pixel-gate.sh <slug>
```

A component with a failing or unrun gate does not get a registry entry. No exceptions. If the gate fails, fix the conversion until it matches the source, not the other way around.

---

## RULE: Motion tokenization happens during conversion writes, as value-identical substitution

Write duration and easing values as motion tokens (`apps/web/src/styles/motion-tokens.css`) in the same edit that creates the file. The `motion-token-gate` hook enforces this at write time: a raw literal is rejected as it is written, so there is no later tokenization pass. Every substitution carries a comment recording the source value:

```css
transition: transform var(--duration-300) var(--ease-out-quad); /* raw: 300ms cubic-bezier(0.25,0.46,0.45,0.94) -> token */
```

The substitution is value-identical. A token stands in for the exact value it replaces, never a nearby token value. Preference order when no exact token exists:

1. **Value-identical `calc()` composition of existing tokens.** Example: a raw `450ms` written as `calc(var(--duration-300) + var(--duration-150))`.
2. **Named constant in the TSX** for JS-timed motion, following the `FLIP_EASE` / `SPRING_EASE` precedent, with the mirror comment described below.
3. **Raw literal**, only where the gate permits it.

Never mint a new token mid-conversion. Never set `MOTION_GATE=skip`: it disables the guard for the entire write, not for one line.

The pixel gate therefore always runs against substituted files. VALUE preservation is the invariant, not spelling: `var(--duration-300)` resolving to `300ms` satisfies byte-preservation of the source's `300ms`. If a substitution shifts a rendered value, the substitution is wrong, and the fix is a value-identical replacement, not a gate bypass.

---

## RULE: Design lock discipline

Creating or editing files under `apps/web/design-system/` and `apps/web/src/components/design-system/` writes to design-locked paths. The `ds-design-lock` hook blocks these writes by default.

The lock stays on at all times outside a sanctioned conversion run. Only the orchestrator toggles the lock, and only around that run:

```bash
scripts/ds-lock.sh off   # orchestrator only, immediately before a sanctioned run
scripts/ds-lock.sh on    # orchestrator only, immediately after the run completes
```

No individual executor or reviewer disables the lock on their own. If a write is blocked and you are not the orchestrator running a sanctioned conversion, do not bypass the lock; report the block instead.

The full protocol, including bypass options and the scope of what is guarded, is documented at `.claude-ext/references/frontend/design-lock-protocol.md` (slug: `design-lock-protocol`).

**Caution:** This SOP file itself lives under `apps/web/design-system/`, so editing it also requires the `DS_DESIGN_EDIT=approved` bypass to be active in `.claude/settings.local.json`.

---

## RULE: JS-timed motion follows the mirror-comment convention

Motion driven by `requestAnimationFrame` or the Web Animations API cannot read CSS custom properties directly. When a component's JS-timed motion depends on a value defined in `motion-tokens.css`, hardcode the resolved value in the JS and add a comment stating which CSS token it mirrors and why the duplication exists.

Follow the precedent in `apps/web/src/lib/motion-spring.ts`, which hardcodes a value with a comment noting it mirrors `--ease-spring-open` in `motion-tokens.css`. Any new JS-timed motion must use the same convention: hardcode, then comment the mirrored token name and source file. Do not let JS-timed motion silently drift out of sync with its CSS counterpart with no comment trail.

---

## RULE: Strip page packaging

A raw source is a page, not a component. Full-viewport sizing, `position: fixed; inset: 0`, stage wrappers, and black or otherwise absolute backgrounds are page scaffolding that exists to display the component in isolation. Scaffolding does not port.

The port packages the component into an embedded shell that fits the library grid, using house tokens for the shell surface: `var(--card-bg)` for the card face, `var(--shell-bg)` for the inner tray. Sizing follows the surrounding library cards.

Exemption boundary, stated precisely:

- **Inner component** (the markup, classes, values, and motion that the source defines as the component itself): byte-preserved, exempt from house rules.
- **Wrapper chrome** (the shell the port adds to embed that component in the library): not Claude Design output, so every house rule applies, including `_surfaces.css` surface treatment, squircle corners, and the flat-background and color-semantics rules above.

Where the boundary is ambiguous, ask Bora before writing. Do not resolve it by porting the page scaffolding verbatim.

---

## Conversion Checklist (follow in order)

0. **Step 0: classify the raw source.** Grep the raw HTML for the DSL marker before writing anything:

   ```bash
   grep -c '<x-dc' apps/web/design-system/claude-design/raw/<slug>/<slug>.html
   ```

   Zero matches means plain HTML: convert normally. Any match means the source is authored in Claude Design's `<x-dc>` / DCLogic DSL, and it renders in the pixel gate only through the shim at `apps/web/tests/fixtures/pixel-gate/dc-support-shim.js`. A DSL source may be converted only when every DSL feature it uses appears in the shim's supported-feature list, proven by `apps/web/tests/dc-shim-contract.spec.ts`. A feature outside that contract is a hard stop: extend the shim, add its contract test, land both, then convert. Never improvise shim behavior inside a gate run.

1. **Read the source.** Open `apps/web/design-system/claude-design/raw/<slug>/<slug>.html` and every CSS file it links. Understand the structure, all interactive states, and the behavior before writing any code.

2. **Preserve structure and logic, tokenize motion as you write.** Keep the interaction model intact. Write every duration and easing as a motion token in the same edit, per "RULE: Motion tokenization happens during conversion writes". Strip page packaging per that rule. Strip framework wiring (imports, providers, router) as part of module packaging. Replace `cn()`, utility helpers, and third-party UI dependencies with plain equivalents (native CSS classes, direct DOM logic, or minimal React state), without changing class names, DOM hierarchy, or CSS values.

3. **Redesign mobile-origin sources for web.** If the source was built with React Native or any mobile-specific dependency, redesign it for the web context rather than porting it. Remove ALL mobile dependencies -- no React Native, Expo, Reanimated, or related packages.

4. **Wire icon-font imports.** Wire Material Symbols Outlined the React way. This is the one glyph-related change permitted by the byte-preservation rule; do not otherwise substitute icons.

5. **Register in the showcase route.** Import and render the converted component in the showcase route under `apps/web/src/routes/` so it appears in the browser during review.

6. **Run the pixel gate.** See "RULE: Pixel gate is a hard precondition for registry entry" above. Do not proceed until it is green for the default state and every interactive state.

7. **Add the component-registry entry.** Only once the gate is green.

8. **Verify tokenization, do not defer it.** Motion is already tokenized from step 2. Confirm no raw duration or easing literal survives outside what the gate permits, and confirm each substitution carries its `raw: X -> token` comment. If a substitution changed a value, fix it value-identically and re-run the pixel gate.

9. **Run the review loop.**
   - Start the dev server on the VPS: `pnpm --filter web dev` (port 5173).
   - The reviewer opens it via SSH tunnel: `ssh -L 5173:localhost:5173 <user>@<vps>`, then navigates to `http://localhost:5173`.
   - The reviewer annotates issues using the Agentation toolbar.
   - Iterate on the conversion until Bora approves.
   - Record the outcome (component name, date, approval status, notes) in `apps/web/design-system/review-log.md`.

---

## RULE: Ask Before Adding

**Ask Bora before adding any content, states, or variants that were not present in the original source HTML.** This includes extra breakpoints, additional color variants, new interaction states, or supplementary UI copy.

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

- Source was read only from `apps/web/design-system/claude-design/raw/<slug>/<slug>.html`, never from a `preview/incoming/` or other pre-adapted copy.
- Every DOM class name, hierarchy, CSS value, duration, easing, and color is byte-preserved from the source; only module packaging, TS types, and icon-font imports were adapted.
- The pixel gate (`bash scripts/ds-pixel-gate.sh <slug>`, default plus every interactive state) is green, and it was green before the component-registry entry was added.
- The raw source was classified (step 0); if DSL-authored, every DSL feature it uses is covered by the dc-shim contract test.
- Motion tokenization happened during the conversion writes, was value-identical, and each substitution carries its `raw: X -> token` comment. No new token was minted and `MOTION_GATE=skip` was never used.
- Page packaging (full-viewport, stage, absolute background) was stripped, and the added wrapper chrome follows house tokens and house surface rules.
- Any JS-timed motion (rAF/WAAPI) follows the mirror-comment convention from `apps/web/src/lib/motion-spring.ts`.
- All original states and variants are present; none were added without explicit approval.
- No mobile dependencies remain in the component or its imports.
- `pnpm --filter web build` exits 0 with no type errors.
- React-doctor health gate passes for the component file.
- Bora approved the component via Agentation annotation, and the outcome is recorded in `review-log.md`.
</content>
