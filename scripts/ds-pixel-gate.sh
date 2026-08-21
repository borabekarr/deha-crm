#!/usr/bin/env bash
# ds-pixel-gate.sh — mandatory design-system fidelity gate.
#
# Diffs a raw Claude-design source HTML file against the built React
# component preview at pixel level (Playwright's own screenshot comparison,
# maxDiffPixelRatio 0.001 — antialiasing tolerance only).
#
# Usage:
#   scripts/ds-pixel-gate.sh <slug>       # gate design-system/claude-design/raw/<slug>/<slug>.html
#                                          #   against /components/<slug>
#   scripts/ds-pixel-gate.sh --self-test  # sanity-check the diff mechanism itself
#
# Optional (real-gate mode only): PIXEL_GATE_INTERACTION_SELECTOR=<css selector>
# captures a second before/after pair for an interactive open/expanded/pressed state.
# PIXEL_GATE_INTERACTION_WAIT_MS=<ms> (default 150) sets the post-click settle
# time before that capture — raise it to at least the component's full settle
# time for deep JS-timed transitions (e.g. delete-button = 1000).
#
# Optional (real-gate mode only): PIXEL_GATE_TARGET=<css selector> scopes both
# the baseline and diff screenshots to a single element instead of the full
# page — needed because the React route renders the component inside gallery
# chrome, which can push it below the fold at the gate viewport. Passed
# through unchanged (no logic change in this script; consumed by the spec).
# PIXEL_GATE_VIEWPORT=<WxH> (default 1280x900, only applies with
# PIXEL_GATE_TARGET set) sizes the element-scoped viewport — the default
# gate viewport is too small to fit wider components alongside gallery
# chrome.
#
# ALWAYS runs via `npx playwright` — RTK filters `playwright --list` to 0,
# so a bare `playwright` invocation silently no-ops.
set -euo pipefail
cd "$(dirname "$0")/../apps/web"

if [ "${1:-}" = "--self-test" ]; then
  echo "== ds-pixel-gate --self-test =="
  PIXEL_GATE_SELFTEST=1 npx --no playwright test tests/pixel-parity.spec.ts --project=default --grep "self-test"
  echo "== ds-pixel-gate --self-test: OK (identical pair PASSed, shifted pair FAILed as expected) =="
  exit 0
fi

slug="${1:?Usage: ds-pixel-gate.sh <slug>|--self-test}"
raw_html="design-system/claude-design/raw/${slug}/${slug}.html"

if [ ! -f "$raw_html" ]; then
  echo "error: raw source HTML not found at apps/web/${raw_html}" >&2
  exit 1
fi

echo "== ds-pixel-gate: ${slug} =="
PIXEL_GATE_SLUG="$slug" npx --no playwright test tests/pixel-parity.spec.ts --project=default --grep "pixel-parity"
