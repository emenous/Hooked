#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

REMOTE_NAME="${HOOKED_GITHUB_REMOTE:-origin}"
REMOTE_URL="$(git remote get-url "$REMOTE_NAME")"

if [[ "$REMOTE_URL" != *"github.com"* ]]; then
  echo "Refusing to push live: ${REMOTE_NAME} does not point at GitHub (${REMOTE_URL})."
  exit 1
fi

BRANCH="$(git branch --show-current)"

if [[ -z "$BRANCH" ]]; then
  echo "Refusing to push live from a detached HEAD. Check out a branch first."
  exit 1
fi

echo "Pushing live to GitHub: ${REMOTE_NAME}/${BRANCH}"
git push "$REMOTE_NAME" "HEAD:${BRANCH}"
echo "Pushed live to ${REMOTE_URL} (${BRANCH})."
