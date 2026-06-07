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
# ds-archive.sh <slug>
# Copies a design-system component's React folder and prototype sources into
# design-system-archive/<slug>/ for independent, append-only safe storage.
# Never hand-edit the archive — only this script writes to it.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SLUG="${1:-}"

if [[ -z "$SLUG" ]]; then
  echo "ERROR: usage: ds-archive.sh <slug>" >&2
  exit 1
fi

REACT_SRC="$REPO_ROOT/apps/web/src/components/design-system/$SLUG"
PREVIEW_DIR="$REPO_ROOT/apps/web/design-system/preview"
ARCHIVE_REACT="$REPO_ROOT/design-system-archive/$SLUG/react"
ARCHIVE_SOURCE="$REPO_ROOT/design-system-archive/$SLUG/source"

# Verify the React component folder exists
if [[ ! -d "$REACT_SRC" ]]; then
  echo "ERROR: React component folder not found: $REACT_SRC" >&2
  exit 1
fi

# Archive React folder
mkdir -p "$ARCHIVE_REACT"
cp -rf "$REACT_SRC"/. "$ARCHIVE_REACT/"
echo "Archived React:  $REACT_SRC  ->  $ARCHIVE_REACT"

# Archive prototype HTML
# Resolve source HTML: prefer components-<slug>.html, fall back to <slug>.html
mkdir -p "$ARCHIVE_SOURCE"
HTML_FILE="$PREVIEW_DIR/components-${SLUG}.html"
if [[ ! -f "$HTML_FILE" ]]; then
  HTML_FILE="$PREVIEW_DIR/${SLUG}.html"
fi
if [[ -f "$HTML_FILE" ]]; then
  cp -f "$HTML_FILE" "$ARCHIVE_SOURCE/"
  echo "Archived HTML:   $HTML_FILE  ->  $ARCHIVE_SOURCE/"
else
  echo "WARNING: prototype HTML not found (tried components-${SLUG}.html and ${SLUG}.html) (skipping)" >&2
fi

# Detect and archive linked _* assets referenced in the HTML
if [[ -f "$HTML_FILE" ]]; then
  # Extract all _filename references (filename may include extension)
  LINKED=$(grep -oE '_[a-zA-Z0-9._-]+\.(css|js|jsx|ts|tsx)' "$HTML_FILE" | sort -u || true)
  for ASSET in $LINKED; do
    ASSET_PATH="$PREVIEW_DIR/$ASSET"
    if [[ -f "$ASSET_PATH" ]]; then
      cp -f "$ASSET_PATH" "$ARCHIVE_SOURCE/"
      echo "Archived asset:  $ASSET_PATH  ->  $ARCHIVE_SOURCE/"
    else
      echo "WARNING: linked asset not found: $ASSET_PATH (skipping)" >&2
    fi
  done
fi

echo ""
echo "Archive complete: design-system-archive/$SLUG/"
