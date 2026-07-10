#!/usr/bin/env bash
# Anchored patch for dept-frontend.md: adds the library-first mandate.
# Authorization: user-approved plan library-first-picker, step 4.
# Idempotent: strips any prior copy of these additions, then re-applies the
# canonical (size-budgeted) text. Anchored on exact current text; a missing or
# non-unique anchor is a hard fail. Keeps the agent file under the prompt-lint
# size limit (10240 bytes for agents).
set -euo pipefail

TARGET="/home/bora/claude-code-system/.claude/agents/dept-frontend.md"

python3 - "$TARGET" <<'PY'
import sys

path = sys.argv[1]
with open(path, "r", encoding="utf-8") as f:
    src = f.read()

# Any earlier draft of each addition, stripped before re-applying the canonical text.
old = [
    " The design system also extends to the project's finished component library at `apps/web/src/components/design-system/**`: those are user-approved, tier-1 reference implementations. Build library-first. Reuse a finished component directly when building in-app, and mine the closest finished components for density, dimensions, and chrome patterns when building standalone. Name every finished component you consulted in the Return Contract.",
    "0. **SEARCH THE COMPONENT LIBRARY FIRST (library-first):** Before any build, search the project's finished component library for a same-pattern component. Read `apps/web/src/lib/component-registry.ts` and list the directory `apps/web/src/components/design-system/`. Reuse or mine the closest match. If none applies, state \"no relevant library component exists\" explicitly before hand-rolling.\n\n",
    " When a visual reference exists (a user-provided export, a screenshot, or a named library sibling), invoke `style-transfer` at PRE-BUILD and run a screenshot-compare loop at VERIFY: render both the reference and your build, compare the screenshots, and iterate until you reach dimensional parity or flag a justified deviation.",
]

# Canonical, size-budgeted additions.
add1 = " It also covers the finished component library at `apps/web/src/components/design-system/**`: tier-1 reference implementations. Build library-first: reuse in-app, or mine the closest for density, dimensions, and chrome when standalone. Name what you consulted in the Return Contract."
add2 = "0. **COMPONENT LIBRARY FIRST (library-first):** Before building, read `apps/web/src/lib/component-registry.ts` and list `apps/web/src/components/design-system/` for a same-pattern component. Reuse or mine the closest; if none applies, state \"no relevant library component exists\" before hand-rolling.\n\n"
add3 = " When a visual reference exists (export, screenshot, or named library sibling), invoke `style-transfer` at PRE-BUILD and run a screenshot-compare loop at VERIFY: render reference and build, compare, iterate until dimensional parity or a flagged deviation."

# Strip any prior copy (old drafts and current canonical) so re-runs are idempotent.
for chunk in old + [add1, add2, add3]:
    src = src.replace(chunk, "")

def apply(text, anchor, replacement, label):
    if anchor not in text:
        sys.exit(f"FAIL [{label}]: anchor not found:\n{anchor!r}")
    if text.count(anchor) != 1:
        sys.exit(f"FAIL [{label}]: anchor not unique ({text.count(anchor)} matches):\n{anchor!r}")
    return text.replace(anchor, replacement, 1)

# Edit 1: extend Knowledge hierarchy #1 to include the finished component library as tier-1.
anchor1 = "Never invent approximations to satisfy a self-contained constraint."
src = apply(src, anchor1, anchor1 + add1, "edit1-library-first-tier1")

# Edit 2: insert a library-first search step at the top of the resource workflow.
anchor2 = "1. **READ THE CATALOG:**"
src = apply(src, anchor2, add2 + anchor2, "edit2-library-first-step")

# Edit 3: add the reference screenshot-compare loop to the VERIFY paragraph.
anchor3 = "A passing grep is not a render."
src = apply(src, anchor3, anchor3 + add3, "edit3-screenshot-compare")

with open(path, "w", encoding="utf-8") as f:
    f.write(src)

nbytes = len(src.encode("utf-8"))
print(f"OK: all three anchored edits applied. file is {nbytes} bytes (agent limit 10240).")
PY
