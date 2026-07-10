#!/usr/bin/env bash
# Anchored patch for dept-frontend.md — adds the locked knowledge hierarchy.
# Authorization: user-approved plan design-system-lockin.
# Every replacement is anchored on exact current text; missing anchor = hard fail.
set -euo pipefail

TARGET="/home/bora/claude-code-system/.claude/agents/dept-frontend.md"

python3 - "$TARGET" <<'PY'
import sys

path = sys.argv[1]
with open(path, "r", encoding="utf-8") as f:
    src = f.read()

def apply(text, anchor, replacement, label):
    if anchor not in text:
        sys.exit(f"FAIL [{label}]: anchor not found:\n{anchor!r}")
    if text.count(anchor) != 1:
        sys.exit(f"FAIL [{label}]: anchor not unique ({text.count(anchor)} matches):\n{anchor!r}")
    return text.replace(anchor, replacement, 1)

# --- Edit 1: insert "Knowledge hierarchy (locked)" section after Core Principle, before Scope
anchor1 = "leaving this department.\n\n## Scope"
section1 = """leaving this department.

## Knowledge hierarchy (locked)

Two ranked sources govern every decision. When they disagree, this ranking resolves it.

**#1 -- the Deha design system.** This is the top source and nothing outranks it on values or patterns. It is: the token values in `apps/web/design-system/colors_and_type.css` (machine-readable copy at `apps/web/design-system/design-tokens.json`), the rules in `references/frontend/design-system.md`, and the Section 9 surface patterns plus card primitives (`.card-glass`, `.card-accent`, `.btn-primary`). Every pixel decision traces to a canonical token or a canonical pattern. No brief, prompt, or sandbox constraint overrides it. When a task says "self-contained" or "offline", that means inline the canonical VALUES from these files. Never invent approximations to satisfy a self-contained constraint.

**#2 -- everything else.** The never-break rules, accessibility, and anti-slop guidance below remain fully mandatory. On conflict with #1: #1 wins on values and patterns, and #2 wins on expression. Colors are always expressed as oklch. The house grid-texture, glass, and glow recipes are sanctioned exceptions to the anti-gradient and anti-slop rules and must not be corrected away.

Flag any conflict you hit between #1 and #2 in the Return Contract so the supervisor sees it.

## Scope"""
src = apply(src, anchor1, section1, "edit1-knowledge-hierarchy")

# --- Edit 2: add never-break rule bullet at end of the Never-break list
anchor2 = "- `design-no-blackfish` -- no generic AI-slop: no purple-to-blue gradients, no double-drop-shadow stacks, no emoji as icons, no hollow placeholder cards.\n"
add2 = anchor2 + "- `design-tokens-canonical-values` -- every color literal equals a canonical token value (deltaEok <= 0.02 against design-tokens.json); enforced by apps/web/design-system/tools/token-fidelity-gate.sh.\n"
src = apply(src, anchor2, add2, "edit2-never-break-bullet")

# --- Edit 3: add PRE-BUILD Step 0 before the greenfield bullet
anchor3 = "**PRE-BUILD:**\n- Greenfield page or section:"
add3 = "**PRE-BUILD:**\n- Step 0 for EVERY task type: load the token manifest (design-tokens.json) and design-system.md Section 9 surface patterns before writing any markup. This read is always justified and exempt from the extract-sections economy rule.\n- Greenfield page or section:"
src = apply(src, anchor3, add3, "edit3-prebuild-step0")

# --- Edit 4: add two Quality Gate items after the oklch item
anchor4 = "- [ ] oklch only -- zero hex/hsl/rgb in new code\n"
add4 = anchor4 + "- [ ] token fidelity: `apps/web/design-system/tools/token-fidelity-gate.sh <file>` exit 0 (when the project ships the gate)\n- [ ] surfaces built from house primitives (.card-glass/.card-accent/.btn-primary equivalents) or deviation flagged\n"
src = apply(src, anchor4, add4, "edit4-quality-gate")

with open(path, "w", encoding="utf-8") as f:
    f.write(src)

print("OK: all four anchored edits applied.")
PY
