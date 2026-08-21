# Feedback: security-deps-doctor
Source: Bora direct request, 1 message, 2026-08-18

- **F1** [apps/web/src/** React sources; .github/workflows/react-doctor.yml]: "plan to fix all react-doctor ... issues"
- **F2** [package.json, apps/web/package.json, pnpm-lock.yaml; Socket GitHub app alerts on PR #66]: "plan to fix all ... socket issues"
- **F3** [pnpm-lock.yaml (nanoid); GitHub Dependabot alert #18, GHSA-2v37-7h3g-55p8]: "after that, check the current main branch's security and vulnerability section. make sure you resolved that issue in that new pr. and then close that security issue."
- **F4** [package.json, apps/web/package.json, pnpm-lock.yaml; Dependabot PRs #65 and #61]: "also, check other 3 open prs that pushed by dependabot. resolve their problems in that new pushed pr too and then close them."
- **F5** [.github/workflows/osv-scanner.yml; Dependabot PR #64]: "also, check other 3 open prs that pushed by dependabot. resolve their problems in that new pushed pr too and then close them."

## Decomposition notes

- The single sentence about the three Dependabot PRs was **split into F4 and F5**. F4 covers the two npm dependency bumps (PR #65's 20-package group and PR #61's `@types/node`), which touch the same three manifest/lockfile paths and are one dependency-resolution operation. F5 covers PR #64, which is a GitHub Actions version bump touching a workflow file, verified differently (workflow run, not lockfile resolution).
- F1 and F2 stay separate despite arriving in one clause: React Doctor findings are source-code defects in `apps/web/src`, Socket alerts are supply-chain findings against dependency manifests. Different files, different fixes, different proof.
- F3 is its own item rather than part of F4 because the Dependabot **alert** (nanoid) and the Dependabot **PRs** are different GitHub surfaces. The alert is closed by shipping the fixed version; the PRs are closed as superseded.

## Denominator

5 items. Sealed on user confirmation before Phase A research begins.
