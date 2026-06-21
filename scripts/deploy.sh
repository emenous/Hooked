#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

REMOTE_USER="${HOOKED_DEPLOY_USER:-u289597582}"
REMOTE_HOST="${HOOKED_DEPLOY_HOST:-147.93.42.188}"
REMOTE_PORT="${HOOKED_DEPLOY_PORT:-65002}"
REMOTE_PATH="${HOOKED_DEPLOY_PATH:-domains/prntscrn.dev/public_html/Hooked/}"
SSH_KEY="${HOOKED_DEPLOY_KEY:-$HOME/.ssh/hooked_deploy_ed25519}"

cd "$ROOT_DIR"

rsync -az --delete \
  --exclude ".git/" \
  --exclude ".DS_Store" \
  --exclude ".last-deploy-watch" \
  --exclude "scripts/" \
  --exclude "tools/" \
  --exclude "unity-transfer/" \
  --exclude "Hooked_Unity_Transfer.zip" \
  --exclude "server.out.log" \
  --exclude "server.err.log" \
  -e "ssh -i ${SSH_KEY} -p ${REMOTE_PORT}" \
  ./ "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}"

echo "Deployed to ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}"
