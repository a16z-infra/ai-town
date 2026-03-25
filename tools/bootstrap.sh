#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok() { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
fail() { echo -e "${RED}❌ $1${NC}"; }

echo "============================================"
echo "  Stanford Town — Bootstrap"
echo "============================================"

# ── Node.js ────────────────────────────────────────
echo ""
echo "[Node.js]"

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

# Install Node 18 (for AI Town)
if nvm ls 18 &>/dev/null; then
  ok "Node 18 already installed"
else
  echo "  Installing Node 18..."
  nvm install 18
  ok "Node 18 installed"
fi

# Install pnpm globally
if command -v pnpm &>/dev/null; then
  ok "pnpm already installed ($(pnpm --version))"
else
  echo "  Installing pnpm..."
  npm install -g pnpm
  ok "pnpm installed"
fi

echo ""
echo "============================================"
echo "  Bootstrap complete!"
echo "  Run: python3 lab/lab.py preflight"
echo "============================================"
