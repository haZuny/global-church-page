#!/usr/bin/env bash

# Runs only on the Ubuntu production server through its self-hosted GitHub
# Actions runner. Keep secrets in DEPLOY_ENV_FILE, never in Actions secrets.
set -Eeuo pipefail

: "${DEPLOY_REF:?DEPLOY_REF is required}"

DEPLOY_ROOT="${DEPLOY_ROOT:-/home/global/global-church-page}"
DEPLOY_ENV_FILE="${DEPLOY_ENV_FILE:-$DEPLOY_ROOT/.env.production}"
DEPLOY_LOCK_FILE="${DEPLOY_LOCK_FILE:-/tmp/global-church-production-deploy.lock}"
WEB_SERVICE="${WEB_SERVICE:-web}"
CMS_SERVICE="${CMS_SERVICE:-directus}"

exec 9>"$DEPLOY_LOCK_FILE"
if ! flock -n 9; then
  echo "Another production deployment is already running." >&2
  exit 1
fi

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
ROLLBACK_WEB_TAG="rollback-${PREVIOUS_REF}"
ROLLBACK_ARMED=false
SERVICES_CHANGED=false

compose() {
  WEB_IMAGE_TAG="$WEB_IMAGE_TAG" \
    docker compose --env-file "$DEPLOY_ENV_FILE" -f docker-compose.production.yml "$@"
}

collect_build_diagnostics() {
  echo "Collecting Docker build diagnostics before one clean retry..." >&2
  ps -eo pid,ppid,etime,cmd | grep -E '[d]ocker (build|compose)|[n]pm|[n]ode' || true
  df -h "$DEPLOY_ROOT" /var/lib/docker || true
  docker system df || true
  docker buildx ls || true
}

build_web_image() {
  local attempt

  for attempt in 1 2; do
    if [[ "$attempt" == 1 ]]; then
      if compose build --progress plain "$WEB_SERVICE"; then
        return 0
      fi
    else
      echo "Retrying the web image build once without Docker cache..." >&2
      if compose build --progress plain --no-cache "$WEB_SERVICE"; then
        return 0
      fi
    fi

    collect_build_diagnostics
  done

  echo "Web image build failed after one clean retry." >&2
  return 1
}

wait_for_url() {
  local name="$1"
  local url="$2"
  local attempt

  for attempt in {1..18}; do
    if curl --fail --silent --show-error "$url" >/dev/null; then
      echo "Health check passed: $name"
      return 0
    fi

    sleep 5
  done

  echo "Health check failed: $name ($url)" >&2
  return 1
}

rollback() {
  local status=$?

  trap - ERR

  if [[ "$ROLLBACK_ARMED" != true ]]; then
    exit "$status"
  fi

  echo "Deployment failed; restoring $PREVIOUS_REF" >&2
  git checkout --detach "$PREVIOUS_REF"

  if [[ "$SERVICES_CHANGED" == true ]]; then
    WEB_IMAGE_TAG="$ROLLBACK_WEB_TAG"
    compose up -d --no-build "$CMS_SERVICE" "$WEB_SERVICE"
    wait_for_url "rollback web" "http://127.0.0.1:3000/"
    wait_for_url "rollback CMS" "http://127.0.0.1:8055/server/ping"
    wait_for_url "rollback published stories" "http://127.0.0.1:8055/items/stories?limit=1"
  fi

  exit "$status"
}

trap rollback ERR

CURRENT_WEB_CONTAINER_ID="$(docker compose --env-file "$DEPLOY_ENV_FILE" -f docker-compose.production.yml ps -q "$WEB_SERVICE")"
if [[ -z "$CURRENT_WEB_CONTAINER_ID" ]]; then
  echo "No running web container found; refusing an unsafe deployment." >&2
  exit 1
fi

CURRENT_WEB_IMAGE_ID="$(docker inspect --format '{{.Image}}' "$CURRENT_WEB_CONTAINER_ID")"
docker image tag "$CURRENT_WEB_IMAGE_ID" "global-church-page-web:$ROLLBACK_WEB_TAG"

git fetch --no-tags origin "$DEPLOY_REF"
git checkout --detach "$DEPLOY_REF"
ROLLBACK_ARMED=true

WEB_IMAGE_TAG="$DEPLOY_REF"
build_web_image

SERVICES_CHANGED=true
compose up -d --no-build "$CMS_SERVICE" "$WEB_SERVICE"

wait_for_url "web" "http://127.0.0.1:3000/"
wait_for_url "CMS" "http://127.0.0.1:8055/server/ping"
wait_for_url "published stories" "http://127.0.0.1:8055/items/stories?limit=1"

ROLLBACK_ARMED=false
echo "Deployment succeeded: $DEPLOY_REF"
