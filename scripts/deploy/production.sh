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
CANDIDATE_PORT="${CANDIDATE_PORT:-3001}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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
CANDIDATE_NAME="global-church-web-candidate-${DEPLOY_REF:0:12}"
CANDIDATE_STARTED=false

compose() {
  ENV_FILE="$DEPLOY_ENV_FILE" WEB_IMAGE_TAG="$WEB_IMAGE_TAG" \
    docker compose --env-file "$DEPLOY_ENV_FILE" -f docker-compose.production.yml "$@"
}

directus_service_signature() {
  local compose_file="$1"

  DEPLOY_ENV_FILE="$DEPLOY_ENV_FILE" CMS_SERVICE="$CMS_SERVICE" \
    "$SCRIPT_DIR/directus-service-signature.sh" "$compose_file"
}

remove_candidate() {
  if [[ "$CANDIDATE_STARTED" == true ]]; then
    docker rm -f "$CANDIDATE_NAME" >/dev/null || true
    CANDIDATE_STARTED=false
  fi
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

verify_news_page() {
  local url="$1"
  local body

  if ! body="$(curl --fail --silent --show-error "$url")"; then
    echo "Health check failed: candidate news page ($url)" >&2
    return 1
  fi

  if grep -Fq '주보·소식을 불러오지 못했습니다.' <<<"$body"; then
    echo "Health check failed: candidate news page rendered its content error state ($url)" >&2
    return 1
  fi

  echo "Health check passed: candidate news page"
}

rollback() {
  local status=$?

  trap - ERR
  remove_candidate

  if [[ "$ROLLBACK_ARMED" != true ]]; then
    exit "$status"
  fi

  echo "Deployment failed; restoring $PREVIOUS_REF" >&2
  git checkout --detach "$PREVIOUS_REF"

  if [[ "$SERVICES_CHANGED" == true ]]; then
    WEB_IMAGE_TAG="$ROLLBACK_WEB_TAG"
    compose up -d --no-build "$WEB_SERVICE"
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

CURRENT_NETWORK="$(docker inspect --format '{{range $name, $_ := .NetworkSettings.Networks}}{{$name}}{{end}}' "$CURRENT_WEB_CONTAINER_ID")"
if [[ -z "$CURRENT_NETWORK" ]]; then
  echo "Could not determine the current web container network; refusing an unsafe deployment." >&2
  exit 1
fi

PREVIOUS_COMPOSE_FILE="$(mktemp)"
cleanup_previous_compose_file() {
  rm -f "$PREVIOUS_COMPOSE_FILE"
}
trap cleanup_previous_compose_file EXIT
git show "$PREVIOUS_REF:docker-compose.production.yml" > "$PREVIOUS_COMPOSE_FILE"
PREVIOUS_DIRECTUS_SIGNATURE="$(directus_service_signature "$PREVIOUS_COMPOSE_FILE")"

git fetch --no-tags origin "$DEPLOY_REF"
git checkout --detach "$DEPLOY_REF"
ROLLBACK_ARMED=true

CANDIDATE_DIRECTUS_SIGNATURE="$(directus_service_signature "docker-compose.production.yml")"
if [[ "$PREVIOUS_DIRECTUS_SIGNATURE" != "$CANDIDATE_DIRECTUS_SIGNATURE" ]]; then
  echo "Directus service configuration changed. Refusing a live replacement; verify it against a cloned DB in a separate deployment." >&2
  exit 1
fi

WEB_IMAGE_TAG="$DEPLOY_REF"
build_web_image

docker rm -f "$CANDIDATE_NAME" >/dev/null 2>&1 || true
docker run -d \
  --name "$CANDIDATE_NAME" \
  --network "$CURRENT_NETWORK" \
  --env-file "$DEPLOY_ENV_FILE" \
  --env NODE_ENV=production \
  --env PORT=3000 \
  --env HOSTNAME=0.0.0.0 \
  --env DIRECTUS_URL="http://${CMS_SERVICE}:8055" \
  --publish "127.0.0.1:${CANDIDATE_PORT}:3000" \
  "global-church-page-web:${WEB_IMAGE_TAG}" >/dev/null
CANDIDATE_STARTED=true

wait_for_url "candidate web" "http://127.0.0.1:${CANDIDATE_PORT}/"
wait_for_url "candidate CMS" "http://127.0.0.1:8055/server/ping"
wait_for_url "candidate published stories" "http://127.0.0.1:8055/items/stories?limit=1"
wait_for_url "candidate stories page" "http://127.0.0.1:${CANDIDATE_PORT}/stories"
verify_news_page "http://127.0.0.1:${CANDIDATE_PORT}/news"
docker exec "$CANDIDATE_NAME" node /app/scripts/directus/sync-content-assets.mjs
remove_candidate

SERVICES_CHANGED=true
compose up -d --no-build "$WEB_SERVICE"

wait_for_url "web" "http://127.0.0.1:3000/"
wait_for_url "CMS" "http://127.0.0.1:8055/server/ping"
wait_for_url "published stories" "http://127.0.0.1:8055/items/stories?limit=1"

ROLLBACK_ARMED=false
echo "Deployment succeeded: $DEPLOY_REF"
