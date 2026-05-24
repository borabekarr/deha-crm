---
name: socket-seroval-false-positive
description: Socket.dev flags seroval (deep transitive via TanStack Router) as 90% likely obfuscated code. False positive — seroval is a legitimate serialization library whose codegen output pattern-matches as obfuscation. ACCEPTED as acceptable risk; not actionable on our side.
metadata:
  type: lesson
  category: supply-chain
  incident-date: 2026-05-24
verification-command: gh pr view 15 --json statusCheckRollup --jq '.statusCheckRollup[] | select(.name == "Socket Security: Pull Request Alerts")'
---

# Lesson: seroval Socket alert is a false positive — accept it

## What happened

Socket.dev posted a Supply Chain Security comment on PR #15 (WHY-rule + Husky branch) flagging:

> **Obfuscated code:** npm `seroval` is 90.0% likely obfuscated
> **Confidence:** 0.90
> **From:** `pnpm-lock.yaml → @tanstack/router-devtools@1.167.0 → @tanstack/react-router@1.170.6 → @tanstack/router-plugin@1.168.9 → seroval@1.5.4`

The alert dependency chain is **four hops deep** from a direct dependency. `seroval` is not something this repo pulls in directly.

## Root cause

`seroval` is a legitimate serialization library authored by [@lxsmnsyc](https://github.com/lxsmnsyc), widely used in the SolidJS and TanStack ecosystems. Its public source code is openly hosted on GitHub. The library uses heavy code generation as part of its serialization strategy.

Socket's "obfuscated code" heuristic pattern-matches on **the shape of generated code** (short identifiers, dense expressions, minimal whitespace) and produces a high-confidence false positive on libraries that legitimately emit codegen output. This is a known limitation of the heuristic, not a sign of malicious obfuscation.

Removing `seroval` would require removing TanStack Router from the web app, which is load-bearing.

## How to apply this lesson

- When a Socket WARN names `seroval` (any version in the 1.5.x range or near it), do not re-investigate. Reference this lesson and accept.
- When triaging any Socket "obfuscated code" alert: check whether the package is a known codegen library. If yes, the alert is highly likely a false positive. Confirm by reading the package's public source on GitHub for two minutes before accepting.
- The right action is **suppress + document**, not remediate, when:
  1. The package is a deep transitive (more than 2 hops from a direct dep), AND
  2. The package author is a known good actor with public source, AND
  3. The alert class is a known false-positive pattern (codegen → "obfuscation" is one).
- The right action is **investigate and remove** when any of those three conditions fails.

## Resolution applied to PR #15

1. Posted `@SocketSecurity ignore npm/seroval@1.5.4` as a PR comment to suppress this scan.
2. Owner action queued: update Socket Dashboard triage state for `seroval` to "acceptable risk" so future PRs do not re-surface the same alert.
3. This lesson file persists the call so re-triage is unnecessary next time.

## Integration check

- File exists at `/home/bora/deha-crm/lessons/socket-seroval-false-positive.md`.
- PR #15 contains the suppression comment after this commit lands.
- (Owner action) Socket Dashboard triage state is updated to "acceptable risk" for `seroval@*`.
- Future PRs that bring in `seroval` (any 1.5.x version) do not re-surface the WARN.

Until the owner-action row is complete, the lesson is partially integrated; the bot suppression alone is per-PR, not project-wide.
