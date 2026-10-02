#!/usr/bin/env bash

# Runs in CI before Node.js is installed. The exported function makes an
# accidental host `node` invocation fail, reproducing the production runner
# constraint that caused release deployment #37025104909 to fail.
set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SIGNATURE_SCRIPT="$PROJECT_ROOT/scripts/deploy/directus-service-signature.sh"

node() {
  echo "The deployment signature check must not require host Node.js." >&2
  return 127
}
export -f node

signature="$(
  DEPLOY_ENV_FILE="$PROJECT_ROOT/.env.production.example" \
    "$SIGNATURE_SCRIPT" "$PROJECT_ROOT/docker-compose.production.yml"
)"

if [[ ! "$signature" =~ ^[[:xdigit:]]{64}$ ]]; then
  echo "Deployment signature smoke test did not return a SHA-256 hash." >&2
  exit 1
fi
