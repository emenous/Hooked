#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_SCRIPT="${ROOT_DIR}/scripts/deploy.sh"
STAMP_FILE="${ROOT_DIR}/.last-deploy-watch"

touch "$STAMP_FILE"
echo "Watching Hooked for changes. Press Ctrl+C to stop."
echo "Deploy target can be overridden with HOOKED_DEPLOY_USER/HOST/PORT/PATH."

"$DEPLOY_SCRIPT"
touch "$STAMP_FILE"

while true; do
  if find "$ROOT_DIR/index.html" "$ROOT_DIR/src" -type f -newer "$STAMP_FILE" | grep -q .; then
    echo "Change detected. Deploying..."
    "$DEPLOY_SCRIPT"
    touch "$STAMP_FILE"
  fi
  sleep 2
done
