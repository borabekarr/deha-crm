#!/usr/bin/env bash
# Anchored patch: reconcile primary/ring oklch drift in design-system.md against
# apps/web/design-system/design-tokens.json (generated from colors_and_type.css).
#
# TRUE #10B981 = oklch(0.696 0.149 162.5) (manifest-computed).
# Doc light primary was #3BA787 drift; doc dark was Tailwind v4 gamut-widened emerald drift.
# Both --primary and --ring rows, plus the two "Named colors" lines, are corrected.
#
# Every replacement asserts its anchor exists FIRST and fails loudly if missing.
# No blind overwrite. Idempotency: re-runs are safe because anchors vanish after first apply
# (a re-run will report "anchor missing" for already-applied lines, which is expected).
set -euo pipefail

TARGET="/home/bora/claude-code-system/.claude/references/frontend/design-system.md"

if [[ ! -f "$TARGET" ]]; then
  echo "FATAL: target not found: $TARGET" >&2
  exit 1
fi

replace() {
  local old="$1" new="$2" label="$3"
  if ! grep -qF -- "$old" "$TARGET"; then
    echo "FATAL: anchor missing for [$label]:" >&2
    echo "       $old" >&2
    exit 1
  fi
  python3 - "$TARGET" "$old" "$new" <<'PY'
import sys
path, old, new = sys.argv[1], sys.argv[2], sys.argv[3]
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()
count = data.count(old)
if count != 1:
    sys.stderr.write("FATAL: expected exactly 1 occurrence, found %d for:\n  %s\n" % (count, old))
    sys.exit(1)
data = data.replace(old, new)
with open(path, 'w', encoding='utf-8') as f:
    f.write(data)
PY
  echo "OK: applied [$label]"
}

# --- 1. Core-token table: --primary row (light + dark) ---
replace \
'| `--primary` | `0.596 0.145 163.225` | `0.696 0.17 162.48` | Primary actions, CTA buttons, active tabs |' \
'| `--primary` | `0.696 0.149 162.5` | `0.696 0.149 162.5` | Primary actions, CTA buttons, active tabs |' \
'--primary row'

# --- 2. Core-token table: --ring row (light + dark, mirrors --primary) ---
replace \
'| `--ring` | `0.596 0.145 163.225` | `0.696 0.17 162.48` | Focus rings |' \
'| `--ring` | `0.696 0.149 162.5` | `0.696 0.149 162.5` | Focus rings |' \
'--ring row'

# --- 3. Named colors: light primary green ---
replace \
'- Primary green (light): `oklch(0.596 0.145 163.225)` ~= `#3BA787`' \
'- Primary green (light): `oklch(0.696 0.149 162.5)` ~= `#10B981`' \
'named light primary'

# --- 4. Named colors: dark primary green ---
replace \
'- Primary green (dark): `oklch(0.696 0.17 162.48)` ~= `#10B981`' \
'- Primary green (dark): `oklch(0.696 0.149 162.5)` ~= `#10B981`' \
'named dark primary'

# --- 5. Append source-of-truth note under the Section 1 table ---
NOTE='**Value source of truth:** `apps/web/design-system/colors_and_type.css` (mirrored in `design-tokens.json`); this table is a rendered copy, regenerate on token change.'
ANCHOR='- All neutrals must have >=0.01 chroma — pure gray/black are forbidden'
if grep -qF -- "$NOTE" "$TARGET"; then
  echo "OK: source-of-truth note already present, skipping"
elif ! grep -qF -- "$ANCHOR" "$TARGET"; then
  echo "FATAL: anchor missing for source-of-truth note insertion:" >&2
  echo "       $ANCHOR" >&2
  exit 1
else
  python3 - "$TARGET" "$ANCHOR" "$NOTE" <<'PY'
import sys
path, anchor, note = sys.argv[1], sys.argv[2], sys.argv[3]
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()
out = []
inserted = False
for line in lines:
    out.append(line)
    if not inserted and line.rstrip('\n') == anchor:
        out.append('\n')
        out.append(note + '\n')
        inserted = True
if not inserted:
    sys.stderr.write("FATAL: anchor line not matched exactly for note insertion\n")
    sys.exit(1)
with open(path, 'w', encoding='utf-8') as f:
    f.writelines(out)
PY
  echo "OK: appended source-of-truth note"
fi

echo "DONE: all patches applied to $TARGET"
