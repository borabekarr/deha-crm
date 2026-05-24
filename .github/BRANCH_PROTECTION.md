# Branch Protection Setup — Plain-Language Walkthrough

The WHY-rule GitHub Action only catches bypasses if branch protection on `main` requires it to pass. Without protection, anyone (including you by accident) can push directly to `main` and skip the rule entirely. This is a **one-time setup**. Takes 3 minutes.

## Why this exists

This guard pairs with `.github/workflows/why-rule.yml`. The workflow fails CI when a PR touches bug-prone paths without a `Root cause:` line and a `lessons/` entry. Branch protection turns that CI failure into a hard merge block. Without protection, CI failure is just a red X you can ignore.

A drift check (cycle 2 work) will warn at session-start if protection slips off.

## Steps

1. Go to **https://github.com/borabekarr/deha-crm/settings/branches**

2. Click **"Add branch protection rule"** (or **"Edit"** if a rule for `main` already exists).

3. Branch name pattern: `main`

4. Check these boxes:

   - **Require a pull request before merging**
     - Require approvals: `0` (you're solo; bump to `1` once you add collaborators)
     - Dismiss stale pull request approvals when new commits are pushed (recommended)

   - **Require status checks to pass before merging**
     - Require branches to be up to date before merging (recommended)
     - In the status checks search box, add both of these (they appear once they have run at least once):
       - `Require Root cause + lessons file` (the WHY-rule)
       - `Scan dependencies` (the OSV-Scanner workflow already in place)

   - **Require conversation resolution before merging** (recommended)

   - **Require linear history** (optional but recommended; keeps git log readable)

   - **Do not allow bypassing the above settings** (this is the admin-bypass block; check it)

5. Leave the other boxes unchecked unless you know you want them. In particular, do NOT check "Allow force pushes" or "Allow deletions" for `main`.

6. Click **"Create"** (or **"Save changes"**).

## How to verify it works

1. Open a draft PR that touches `apps/web/src/components/ui/`, `apps/web/src/features/`, or `packages/`.
2. Do NOT include `Root cause:` in the PR description or any commit body.
3. Do NOT add a `lessons/` file.
4. Wait for CI.

Expected: the `Require Root cause + lessons file` check turns red. The "Merge" button is greyed out. If the merge is still possible, branch protection is misconfigured; revisit step 4.

## How to bypass for emergencies

Add the `bypass-why-rule` label to the PR. The bypass is logged in CI output for audit. Use sparingly. The bypass label is also what the cron drift-check (cycle 2) will surface as "audit signal: N PRs bypassed in the last 30 days."

## How to remove protection (don't, normally)

Settings → Branches → click the rule for `main` → "Delete". Document the reason in your runbook. If protection is off, the WHY-rule becomes theater. Either delete the workflow too, or restore protection.

## Why this matters

The 2026-05-24 kill-list incident showed that the orchestrator confidently produces wrong proposals when not gated. The WHY-rule + branch protection is the operational version of Sacred Principle #1 (first-principles debugging) and Principle #10 (self-learning loop). Without both halves, neither principle ships.
