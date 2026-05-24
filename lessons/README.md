# Lessons (Deha-CRM project)

This directory is the project's append-only library of post-incident lessons. Each file captures one root cause + how-to-apply learning.

## Why this exists

The WHY-rule (`.github/workflows/why-rule.yml`) requires every PR touching bug-prone paths (`apps/web/src/components/ui/`, `apps/web/src/features/`, `packages/`) to do BOTH:

1. Include a line starting with `Root cause:` in the PR description or a commit body.
2. Add or update at least one file in this directory.

The two-part requirement forces every bug fix to answer **why** the bug existed, not just **how** it was fixed. The lesson file becomes a permanent record so the same shape catches itself the next time.

This rule was installed 2026-05-24 as Workstream 3 of the Deha-CRM postmortem (see `~/claude-code-system/.claude/lessons/hallucinated-kill-list-2026-05-24.md` for the prior incident that motivated the broader anti-hallucination system).

## File format

```markdown
---
name: <slug-matching-filename>
description: <one-line summary; shown in the lessons index>
metadata:
  type: lesson
  category: <bug-type | regression | contract-drift | hallucination | a11y | perf | other>
  incident-date: YYYY-MM-DD
verification-command: <bash command that proves this lesson is wired up>
---

# Lesson: <Title>

## What happened
[Plain language. What did the user see; what did the code do wrong.]

## Root cause
[The WHY, not the HOW. The single condition that made the bug possible.]

## How to apply this lesson
- [Bullet 1: concrete, specific guidance for the next person who touches this area.]
- [Bullet 2.]
- [Bullet 3.]

## Integration check
[What proves this lesson is wired up, not just documented. E.g., a test added, a contract updated, a lint rule installed, a comment in the affected file referencing this lesson.]
```

## Bypass

Emergency hotfixes that genuinely cannot wait for a lesson: add the `bypass-why-rule` label to the PR. The bypass is logged in CI output for audit. Use sparingly.

`HUSKY=0 git commit ...` bypasses the local pre-commit warning.

## Related

- `~/claude-code-system/.claude/lessons/` — system-level lessons (hallucination shapes, planning anti-patterns) loaded by `verify-before-claim` and `plan-by-checks` skills at invocation.
- This project's lessons cover product-specific patterns: bugs, regressions, contract drift, debug findings inside Deha-CRM itself.
