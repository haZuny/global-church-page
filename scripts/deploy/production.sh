#!/usr/bin/env bash

# Runs only on the Ubuntu production server through its self-hosted GitHub
# Actions runner. Keep secrets in DEPLOY_ENV_FILE, never in Actions secrets.
set -Eeuo pipefail

: "${DEPLOY_REF:?DEPLOY_REF is required}"

DEPLOY_ROOT="${DEPLOY_ROOT:-/home/global/global-church-page}"
DEPLOY_ENV_FILE="${DEPLOY_ENV_FILE:-$DEPLOY_ROOT/.env.production}"

if [[ ! -d "$DEPLOY_ROOT/.git" ]]; then
  echo "Production checkout not found: $DEPLOY_ROOT" >&2
  exit 1
fi

if [[ ! -f "$DEPLOY_ENV_FILE" ]]; then
  echo "Production environment file not found: $DEPLOY_ENV_FILE" >&2
  exit 1
fi

cd "$DEPLOY_ROOT"

# The fixed production checkout must only contain the ignored environment file.
# Refuse to overwrite unexpected tracked edits made on the server.
git diff --quiet
git diff --cached --quiet

PREVIOUS_REF="$(git rev-parse HEAD)"
ROLLBACK_ARMED=false

rollback() {
  local status=$?

  if [[ "$ROLLBACK_ARMED" != true ]]; then
    exit "$status"
  fi

  echo "Deployment failed; restoring $PREVIOUS_REF" >&2
  git checkout --detach "$PREVIOUS_REF"
  docker compose --env-file "$DEPLOY_ENV_FILE" -f docker-compose.production.yml up -d --build
  exit "$status"
}

trap rollback ERR

git fetch --no-tags origin "$DEPLOY_REF"
git checkout --detach "$DEPLOY_REF"
ROLLBACK_ARMED=true

docker compose --env-file "$DEPLOY_ENV_FILE" -f docker-compose.production.yml up -d --build

for url in http://127.0.0.1:3000 http://127.0.0.1:8055/server/health; do
  for attempt in {1..12}; do
    if curl --fail --silent --show-error "$url" >/dev/null; then
      break
    fi

    if [[ "$attempt" == 12 ]]; then
      echo "Health check failed: $url" >&2
      exit 1
    fi

    sleep 5
  done
done

ROLLBACK_ARMED=false
echo "Deployment succeeded: $DEPLOY_REF"
