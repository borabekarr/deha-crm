#!/usr/bin/env bash
# Lite verification for a UI-library component update.
# Typecheck always; screenshots only for the named component,
# single spec, single browser project (no reduced-motion double-run).
# Usage: scripts/test-lite.sh [ComponentGrepPattern]
set -euo pipefail
cd "$(dirname "$0")/../apps/web"
pnpm typecheck
if [ $# -ge 1 ]; then
  npx --no playwright test tests/design-system.spec.ts --project=default --grep "$1"
fi
