#!/usr/bin/env bash
set -euo pipefail

cat <<'MESSAGE'
watch-deploy is disabled.

FTP/Hostinger uploads are paused. To push live, commit your changes and run:

  scripts/deploy.sh

That script only pushes the current branch to the GitHub remote.
MESSAGE

exit 1
