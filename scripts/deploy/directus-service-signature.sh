#!/usr/bin/env bash

# Prints a stable Directus service configuration hash without requiring a
# Node.js runtime on the host. Docker Compose is already required by every
# production deployment, so use its canonical service hash instead.
set -Eeuo pipefail

: "${DEPLOY_ENV_FILE:?DEPLOY_ENV_FILE is required}"

COMPOSE_FILE="${1:?compose file path is required}"
CMS_SERVICE="${CMS_SERVICE:-directus}"

if ! command -v docker >/dev/null; then
  echo "Docker is required to calculate the Directus service signature." >&2
  exit 1
fi

signature="$(
  ENV_FILE="$DEPLOY_ENV_FILE" WEB_IMAGE_TAG="signature" \
    docker compose --env-file "$DEPLOY_ENV_FILE" -f "$COMPOSE_FILE" \
      config --hash "$CMS_SERVICE" \
    | awk 'NF { print $NF }'
)"

if [[ ! "$signature" =~ ^[[:xdigit:]]{64}$ ]]; then
  echo "Could not calculate a valid Directus service signature." >&2
  exit 1
fi

printf '%s\n' "$signature"
