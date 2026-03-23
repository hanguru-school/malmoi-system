#!/usr/bin/env bash
# Compatibility wrapper. Preferred entrypoint: deploy/deploy-prod.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "${SCRIPT_DIR}/deploy-prod.sh" "$@"
