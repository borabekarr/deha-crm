---
name: prune-ci-when-removing-an-app
description: When you delete an app from the monorepo, also delete its CI workflows. A workflow scoped to the deleted app's paths keeps triggering on the deletion PR and fails on the first step that cd's into a path that no longer exists.
metadata:
  type: lesson
  category: regression
  incident-date: 2026-06-06
verification-command: |
  test ! -f .github/workflows/mobile-e2e.yml && echo "OK: mobile-e2e workflow removed with the mobile app"
---

# Lesson: Remove an app's CI workflows when you remove the app

## What happened

PR #24 tore down `apps/mobile` to pivot the repo to web-only. The `mobile-e2e`
GitHub Action stayed in `.github/workflows/`. Its `pull_request` trigger was
scoped to `apps/mobile/**` and `packages/**`, so the teardown PR (which deletes
every `apps/mobile/**` path) matched the trigger and the job ran. It failed at
the `Pod install` step:

```
##[error]An error occurred trying to start process '/bin/bash' with working
directory '.../apps/mobile/ios'. No such file or directory
```

The directory the step `cd`'d into had just been deleted by the same PR.

## Root cause

A path-scoped CI workflow outlives the code it tests. Deleting an app removes
its source but not the workflow that builds it, and a `pull_request` workflow
filtered on the deleted paths is *guaranteed* to trigger on the very PR that
removes them, then fail on the first step that assumes those paths exist.

## How to apply this lesson

- When removing an app or package from the monorepo, grep `.github/workflows/`
  for that app's name and path globs and delete or rescope every matching
  workflow in the same PR.
- Treat a workflow whose `paths:` filter and whose `working-directory:`/`cd`
  targets point at deleted code as dead — delete it, do not leave it red.
- After a teardown PR, confirm the remaining required checks are exactly the set
  that still has code to run against (here: `osv-scanner`, `WHY-rule`).
