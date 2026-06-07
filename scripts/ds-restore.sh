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
# ds-restore.sh <slug>
# Restores apps/web/src/components/design-system/<slug>/ from the archive.
# Exits non-zero with a clear error if the archive entry is missing.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SLUG="${1:-}"

if [[ -z "$SLUG" ]]; then
  echo "ERROR: usage: ds-restore.sh <slug>" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Confirmation gate — this script overwrites live component files.
# Set DS_RESTORE_FORCE=1 to skip the prompt in non-interactive pipelines.
# ---------------------------------------------------------------------------
if [[ "${DS_RESTORE_FORCE:-0}" != "1" ]]; then
  echo "" >&2
  echo "WARNING: ds-restore.sh is deprecated." >&2
  echo "  The HTML-to-React paste pipeline is retired. New components are authored" >&2
  echo "  Tailwind-native via /frontend-design. This script restores legacy archived" >&2
  echo "  work and will OVERWRITE apps/web/src/components/design-system/$SLUG/." >&2
  echo "" >&2
  printf "  Type 'yes' to proceed: " >&2
  read -r _CONFIRM
  if [[ "$_CONFIRM" != "yes" ]]; then
    echo "Aborted." >&2
    exit 1
  fi
fi

ARCHIVE_REACT="$REPO_ROOT/design-system-archive/$SLUG/react"
RESTORE_TARGET="$REPO_ROOT/apps/web/src/components/design-system/$SLUG"

if [[ ! -d "$ARCHIVE_REACT" ]]; then
  echo "ERROR: archive entry not found: $ARCHIVE_REACT" >&2
  echo "       Run 'scripts/ds-archive.sh $SLUG' first to create an archive entry." >&2
  exit 1
fi

mkdir -p "$RESTORE_TARGET"
cp -rf "$ARCHIVE_REACT"/. "$RESTORE_TARGET/"
echo "Restored: $ARCHIVE_REACT  ->  $RESTORE_TARGET"
echo ""
echo "Restore complete. Verify the component renders correctly before committing."
