#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UNIT_SRC="$REPO_ROOT/infra/systemd/deha-preview@.service"
SYSTEMD_USER_DIR="$HOME/.config/systemd/user"
DEHA_ENV_DIR="$HOME/.config/deha-preview"

echo "==> Installing Deha preview service..."

# 1. Ensure directories exist
mkdir -p "$SYSTEMD_USER_DIR"
mkdir -p "$DEHA_ENV_DIR"

# 2. Copy unit file (idempotent: cp over existing is safe)
cp "$UNIT_SRC" "$SYSTEMD_USER_DIR/deha-preview@.service"
echo "    Copied unit: $SYSTEMD_USER_DIR/deha-preview@.service"

# 3. Reload systemd user daemon
systemctl --user daemon-reload
echo "    daemon-reload: OK"

# 4. Enable linger so user services survive logout
if loginctl enable-linger bora 2>/dev/null; then
    echo "    linger: enabled"
else
    echo "Run this once: sudo loginctl enable-linger bora"
fi

echo ""
echo "==> Done. To start a preview on port 5174:"
echo "    systemctl --user enable --now deha-preview@5174"
echo "    systemctl --user status deha-preview@5174"
