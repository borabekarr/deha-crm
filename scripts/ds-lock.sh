#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SETTINGS="$ROOT/.claude/settings.local.json"

usage() {
  echo "Usage: ds-lock.sh <on|off|--with <cmd> [args...]>" >&2
  echo "  off        — bypass ACTIVE  (inserts DS_DESIGN_EDIT=approved)" >&2
  echo "  on         — lock RESTORED  (removes DS_DESIGN_EDIT)" >&2
  echo "  --with cmd — bypass for <cmd>'s duration, re-locks on exit (trap-guaranteed, even on failure)" >&2
  exit 1
}

lock_off() {
  python3 - "$SETTINGS" <<'PYEOF'
import json, sys

path = sys.argv[1]
with open(path) as f:
    data = json.load(f)

env = data.setdefault("env", {})
if env.get("DS_DESIGN_EDIT") == "approved":
    print("LOCK OFF (bypass active) [no change]")
    sys.exit(0)

env["DS_DESIGN_EDIT"] = "approved"
with open(path, "w") as f:
    json.dump(data, f, indent=2)
    f.write("\n")
print("LOCK OFF (bypass active)")
PYEOF
}

lock_on() {
  python3 - "$SETTINGS" <<'PYEOF'
import json, sys

path = sys.argv[1]
with open(path) as f:
    data = json.load(f)

env = data.get("env", {})
if "DS_DESIGN_EDIT" not in env:
    print("LOCK ON [no change]")
    sys.exit(0)

del env["DS_DESIGN_EDIT"]
# Remove env key entirely if now empty
if not env:
    data.pop("env", None)

with open(path, "w") as f:
    json.dump(data, f, indent=2)
    f.write("\n")
print("LOCK ON")
PYEOF
}

[[ $# -ge 1 ]] || usage
CMD="$1"

# Create file if missing
if [[ ! -f "$SETTINGS" ]]; then
  echo '{}' > "$SETTINGS"
fi

if [[ "$CMD" == "--with" ]]; then
  shift
  [[ $# -ge 1 ]] || usage
  lock_off
  trap 'lock_on' EXIT
  status=0
  set +e
  bash -c "$*"
  status=$?
  set -e
  exit "$status"
fi

[[ "$CMD" == "on" || "$CMD" == "off" ]] || usage

case "$CMD" in
  off) lock_off ;;
  on) lock_on ;;
esac
