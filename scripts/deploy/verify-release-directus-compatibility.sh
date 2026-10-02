#!/usr/bin/env bash

# Compare the Directus service configuration in the release base with the
# candidate checkout. This is intentionally read-only: it must fail before a
# release PR is merged, rather than during a production deployment.
set -Eeuo pipefail

: "${BASE_REF:?BASE_REF is required}"
: "${DEPLOY_ENV_FILE:?DEPLOY_ENV_FILE is required}"

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SIGNATURE_SCRIPT="$PROJECT_ROOT/scripts/deploy/directus-service-signature.sh"
BASE_COMPOSE_FILE="$(mktemp)"

cleanup() {
  rm -f "$BASE_COMPOSE_FILE"
}
trap cleanup EXIT

git show "${BASE_REF}:docker-compose.production.yml" > "$BASE_COMPOSE_FILE"

base_signature="$(DEPLOY_ENV_FILE="$DEPLOY_ENV_FILE" "$SIGNATURE_SCRIPT" "$BASE_COMPOSE_FILE")"
candidate_signature="$(DEPLOY_ENV_FILE="$DEPLOY_ENV_FILE" "$SIGNATURE_SCRIPT" "$PROJECT_ROOT/docker-compose.production.yml")"

if [[ "$base_signature" != "$candidate_signature" ]]; then
  echo "Directus service configuration differs from ${BASE_REF}." >&2
  echo "Verify the change against a cloned database and use a separately approved Directus deployment before merging this release." >&2
  exit 1
fi

echo "Directus service configuration matches ${BASE_REF}."
