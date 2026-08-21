# Coverage index: security-deps-doctor  (5 items)

Source feedback file: `feedback/2026-08-18-security-deps-doctor.md` (sealed 2026-08-18, denominator 5).

Split into two part-plans on 2026-08-18 after the user directed that every React Doctor finding be fixed, including the non-defect ones ("include all. even if they're not bugs"). That scope does not fit alongside the dependency and security work inside a single eight-step plan, so F1 was given its own part.

| F | Part plan | Status |
|---|---|---|
| F1 | security-deps-doctor-p2 | PENDING (part 2 not yet run) |
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

## Run order

Part 1 first, then part 2, each as its own separate `/execute` session.

Part 1 must land first because it bumps twenty package versions including react, vite and playwright. Running the React Doctor sweep before that bump would mean fixing findings against a dependency set that is about to change, and the newer react-doctor and eslint versions in the bump may themselves alter what gets reported.

Part 1 deliberately does not require React Doctor to be clean in its closeout step, because part 2 has not run at that point.
