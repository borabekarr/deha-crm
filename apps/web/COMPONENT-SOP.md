# Component Build SOP

Standard operating procedure for authoring and refreshing production UI components in `apps/web`.

See `.claude-ext/references/workflow/visual-gate.md` for the visual gate contract that applies to every step touching `apps/web/src/components/**`.

---

## Claude Design Output Is Sacred

Any file that originated as a Claude Design export is **pixel-locked and animation-locked**. These files must not be altered unless:

1. The user explicitly requests a change, AND
2. The change is reviewed via Agentation, AND
3. The environment variable `DS_DESIGN_EDIT=approved` is set.

This lock is enforced by `.claude-ext/hooks/ds-design-lock.sh` and the visual suite (`pnpm --filter @deha/web test:e2e`). Breaking pixel or animation fidelity without the above three conditions is a blocking violation.

---

## Visual Review Is Mandatory

Any UI change is **not done** until:

1. The component has been rendered in the browser.
2. A screenshot has been shown to the user.
3. `pnpm --filter @deha/web test:e2e` passes green.

These three requirements are the definition of done. There is no exception for "small" changes or "token-only" changes. See `.claude-ext/references/workflow/visual-gate.md` for the step-header convention that plan steps must carry.

---

## Build Path

| Scenario | Command |
|---|---|
| New production component | `/frontend-design` |
| Refresh or rework an existing component | `/redesign-ui` |
| Pre-merge quality gate | `/ux-audit` (required for both paths above) |

Both paths go through visual review before merge. No exceptions.

---

## Hard Rules

**Claude Design output uses whatever it ships with.**
Companion `.css` files, custom CSS properties, hex/hsl/rgb colors, gradients, layered shadows, and bespoke animation are all part of Claude Design output and are kept exactly as exported. Never convert, normalize, or strip them.

**Net-new components may use any styling that serves the design.**
Tailwind `@theme` utilities from `apps/web/src/styles/global.css` are available and convenient, but companion CSS, color literals, gradients, and layered shadows are all permitted. There is no tokens-only mandate, no minimalism mandate, and no forbidden-pattern list.

**Dark mode follows the component.**
Claude Design components define their own dark behavior (the gallery toggles both the `.dark` class and the `data-theme` attribute on `<html>` so that output renders correctly). Do not remove or rewire a component's dark-mode mechanism.

---

## Source Of Truth

Claude Design output is the source of truth for the design system. The components, views, and animations exported from Claude Design and implemented under `apps/web/src/components/design-system/` and `apps/web/design-system/` are canonical. `design-system.md` is a guardrail for net-new work only and never supersedes Claude Design output.

`scripts/ds-archive.sh`, `scripts/ds-restore.sh`, and `scripts/library-snapshot.sh` are archive and recovery tools for Claude Design components. They remain available for that purpose.
