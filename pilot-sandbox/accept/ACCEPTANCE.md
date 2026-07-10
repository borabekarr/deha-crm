# Functional Acceptance — dept-frontend rebuild (2026-06-30)

**Verdict: PASS (V6).**

## Dispatch
`dept-frontend` dispatched BY NAME ONLY on "build a Lead Status badge for the Deha CRM". No design
file, no rules, no file names injected by the orchestrator. The only context given was the deployment
target (no-bundler @babel/standalone preview harness, global React), which is legitimate deployment
context, not rule-injection.

## Output
`pilot-sandbox/accept/Component.tsx` → `LeadStatusBadge` (root) + `LeadStatusCard` sub-component.

## Checks
| Criterion | Result |
|---|---|
| File exists + renders (exact-code-path SSR, TS compiler API + react-dom/server) | PASS — `LeadStatusCard` rendered, HTML 2617 chars, `<button>` + `<article>` present |
| No raw `#hex`; oklch / Tailwind v4 semantic tokens | PASS — `bg-primary`, `text-primary`, `bg-muted`, `text-foreground`, `bg-destructive/15`; `oklch()` function values for the amber Qualified hue; zero hex |
| Real `<button>` for actions | PASS — `type="button"` on the action button (2 usages) |
| Zero `useEffect` | PASS — press feedback via pointer handlers + derived `useState`; `const { useState } = React` |
| Render-safe (no `import`/`export`) | PASS — no import/export, single global-React component |

## New-architecture proof
Dispatched by name, the department exercised its operating manual without orchestrator help:
- **Catalog-driven, intent selection:** it consulted its resource catalog and selected the
  task-relevant resources itself (no file names were supplied).
- **Section-level extraction, not whole-file reads:** it extracted the Color System section of
  `references/frontend/design-system.md` (80 of 288 lines) rather than reading the whole reference,
  and pulled the zero-useEffect contract from `porting-prototypes-to-react.md` (2.2 KB).
- **CRM conventions applied unprompted:** oklch-only color, semantic tokens, explicit button type,
  zero useEffect, render-safe output, Montserrat font — none of which the orchestrator injected.

This distinguishes the rebuilt, catalog-driven department from both the generic prototype and the
prior thin-runbook version.

## Debt noted by the department
No `--warning`/`--amber` semantic token exists in the design system; the Qualified status uses an
inline `oklch()` stopgap. A future token would remove the inline style.
