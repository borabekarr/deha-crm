#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# DEPRECATED — HTML-to-React paste pipeline retired
# ---------------------------------------------------------------------------
# The HTML prototype -> paste-to-React workflow is no longer the canonical
# authoring path. Components are now authored Tailwind-native using the
# /frontend-design skill, which produces .tsx files directly without an
# intermediate HTML prototype.
#
# These scripts are kept ONLY to recover archived legacy work stored in
# design-system-archive/. Do not use them for new component development.
# ---------------------------------------------------------------------------
#
# library-snapshot.sh
# Builds the web app and copies the dist output to design-system-dist/ for a
# durable static snapshot. design-system-dist/ is gitignored (build artifact).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_SRC="$REPO_ROOT/apps/web/dist"
SNAPSHOT_DIR="$REPO_ROOT/design-system-dist"

echo "Building apps/web..."
pnpm --filter web build

if [[ ! -d "$DIST_SRC" ]]; then
  echo "ERROR: build output not found at $DIST_SRC" >&2
  exit 1
fi

rm -rf "$SNAPSHOT_DIR"
mkdir -p "$SNAPSHOT_DIR"
cp -r "$DIST_SRC"/. "$SNAPSHOT_DIR/"

echo ""
echo "Snapshot written to: $SNAPSHOT_DIR"
echo "Serve with: npx serve design-system-dist"
