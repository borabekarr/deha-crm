# Coverage index: security-deps-doctor  (5 items)

Source feedback file: `feedback/2026-08-18-security-deps-doctor.md` (sealed 2026-08-18, denominator 5).

Split into two part-plans on 2026-08-18 after the user directed that every React Doctor finding be fixed, including the non-defect ones ("include all. even if they're not bugs"). That scope does not fit alongside the dependency and security work inside a single eight-step plan, so F1 was given its own part.

| F | Part plan | Status |
|---|---|---|
| F1 | security-deps-doctor-p2 | DONE |
| F2 | security-deps-doctor-p1 | DONE |
| F3 | security-deps-doctor-p1 | DEBT (fix DONE, alert closure gated) |
| F4 | security-deps-doctor-p1 | DONE |
| F5 | security-deps-doctor-p1 | DONE |

## Part 1 outcome (run 2026-08-18, commit `fd48760` on `recover/design-system-work`)

- **F2 — DONE.** Both Socket checks pass on PR #66 against head `fd48760` ("Socket Security: Project
  Report pass", "Socket Security: Pull Request Alerts pass"). Evidence file `debt/socket-triage-2026-08-18.md`
  records the output verbatim. Caveat kept on the record: local per-package scanning covered only 4 of
  21 bumped packages, because the host's Socket token lacks `full-scans:create` (HTTP 403) and per-package
  lookups hit sustained rate limiting (HTTP 429). The passing PR check is the authoritative full-set signal.
- **F3 — DEBT.** The fix is complete and verified: `"nanoid@<3.3.18": "^3.3.18"` in the `overrides:` block
  of `pnpm-workspace.yaml`, lockfile resolves nanoid 3.3.18 only, and the "Scan dependencies" check passes.
  The second half of the user's ask, closing the security alert, is NOT done and could not be done here.
  Dependabot evaluates alerts against the DEFAULT branch; `origin/main` still resolves nanoid 3.3.16 because
  PR #66 is unmerged, so alert #18 remains correctly open. It was deliberately not force-dismissed.
  Debt: `debt/security-deps-doctor-p1-alert18-gated.md`. It closes on its own once #66 merges to `main`.
- **F4 — DONE.** 21 package bumps from PRs #65 and #61 landed in `package.json` / `apps/web/package.json`
  and the regenerated lockfile; typecheck clean. PRs #65 and #61 closed with comments naming PR #66.
  Eight packages resolve slightly newer than proposed because their entries use caret ranges; none crosses
  a major version.
- **F5 — DONE.** `.github/workflows/osv-scanner.yml` moved to
  `google/osv-scanner-action/osv-scanner-action@v2.5.0` (nested action path). PR #64 closed naming PR #66.

`gh pr list --state open --author app/dependabot` returns an empty array: all three Dependabot pull
requests are closed.

## Part 2 outcome (run 2026-08-22)

- **F1 -- DONE.** Scanner version aligned: CI pin and lockfile both resolve `react-doctor@0.9.12`
  (up from 0.5.8). `ignore.files` in `apps/web/doctor.config.json` is used on 0.9.12 without the
  crash that blocked it before. Baseline was 241 errors / 39 warnings; full-scope scan now returns
  0 errors and 0 warnings outside `apps/web/src/components/library/**` and outside
  `design-system/preview` (the six documented preview false positives). Rule families cleared
  across the run: `effect-needs-cleanup`, `dialog-has-accessible-name`, `click-events-have-key-events`,
  `no-static-element-interactions`, `prefer-html-dialog`, `only-export-components`,
  `no-giant-component`, and the `react-hooks`/refs taint family. HIG keyboard patterns adopted:
  role/tabIndex/onKeyDown-onKeyUp parity on custom interactive elements, roving tabindex for
  tabs/listbox/menu/grid via `apps/web/src/lib/keyboard-nav.ts`, native `<dialog>` with
  `showModal()` for `DeleteModal` and `<dialog open>` for popover surfaces, sibling-module
  extraction for 12 oversized components, and removal of the `TaskBoard` giant-component
  suppression once it was split.
- **Exclusion recorded.** The only remaining diagnostics after the fix run are 6 findings inside
  `apps/web/src/components/library/**` (`MobileNavSheet.tsx`: 1 `effect-needs-cleanup` error,
  1 `click-events-have-key-events` warning, 1 `no-static-element-interactions` warning,
  1 `prefer-html-dialog` warning; `use-fit-scale.ts`: 2 `effect-needs-cleanup` errors). These are
  owned by a concurrent "library mobile responsive" session actively editing that directory and
  are explicitly out of scope for this plan; they were verified to be the only non-preview,
  non-`library/**` findings are zero.
- **Visual/lockfile.** `pnpm-lock.yaml` refresh after Step 1's `@use-gesture/react` removal only
  touched that package (18 lines removed). Full visual suite (minus `buttons`/`buyer-brain`) is
  71/71 passed; `buttons` retains its pre-existing pixel drift from the uncommitted Buttons/Pills
  split on this branch (unrelated to this plan) and `buyer-brain` passed. Animation spam suite:
  22 passed / 22 skipped, exit 0.

## Run order

Part 1 first, then part 2, each as its own separate `/execute` session.

Part 1 must land first because it bumps twenty package versions including react, vite and playwright. Running the React Doctor sweep before that bump would mean fixing findings against a dependency set that is about to change, and the newer react-doctor and eslint versions in the bump may themselves alter what gets reported.

Part 1 deliberately does not require React Doctor to be clean in its closeout step, because part 2 has not run at that point.
