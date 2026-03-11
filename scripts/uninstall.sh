#!/usr/bin/env bash
set -euo pipefail

# ============================================
# Kokoro VPN — Uninstall
# ============================================

INSTALL_DIR="/opt/kokoro-vpn"

if [ "$EUID" -ne 0 ]; then
  echo "Please run as root: sudo bash uninstall.sh"
  exit 1
fi

echo "==> Stopping Kokoro VPN..."
cd "$INSTALL_DIR" 2>/dev/null && docker compose down -v || true

read -rp "Remove all data and configs? (y/N): " CONFIRM
if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
  rm -rf "$INSTALL_DIR"
  echo "==> Removed $INSTALL_DIR"
else
  echo "==> Kept $INSTALL_DIR (configs preserved)"
fi

echo "==> Kokoro VPN uninstalled."
