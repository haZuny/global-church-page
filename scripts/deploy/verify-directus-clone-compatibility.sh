#!/usr/bin/env bash

# Run Directus upgrade checks against an isolated copy of a production backup.
# This script never mounts a production volume read-write and always removes
# its temporary container and volumes before returning.
set -Eeuo pipefail

: "${1:?usage: $0 latest|/home/global/backups/global-church/directus-YYYYMMDDTHHMMSSZ.tar.gz}"

if [[ "$1" == "latest" ]]; then
  BACKUP_ARCHIVE="$(find /home/global/backups/global-church -maxdepth 1 -type f -name 'directus-*.tar.gz' -print | sort | tail -n 1)"
else
  BACKUP_ARCHIVE="$1"
fi
readonly BACKUP_ARCHIVE
readonly DEPLOY_ROOT="${DEPLOY_ROOT:-/home/global/global-church-page}"
readonly DEPLOY_ENV_FILE="${DEPLOY_ENV_FILE:-$DEPLOY_ROOT/.env.production}"
readonly DIRECTUS_IMAGE="${DIRECTUS_IMAGE:-directus/directus:12.4.1}"
readonly COMPATIBILITY_PORT="${COMPATIBILITY_PORT:-18055}"
readonly COMPATIBILITY_NAME="global-church-directus-compatibility"
readonly COMPATIBILITY_DATABASE_VOLUME="global-church-directus-compatibility-database"
readonly COMPATIBILITY_UPLOADS_VOLUME="global-church-directus-compatibility-uploads"
readonly COMPATIBILITY_EXTENSIONS_VOLUME="global-church-directus-compatibility-extensions"
readonly PRODUCTION_DATABASE_VOLUME="global-church-production-database"
readonly PRODUCTION_UPLOADS_VOLUME="global-church-production-uploads"
readonly PRODUCTION_EXTENSIONS_VOLUME="global-church-production-extensions"

fail() {
  echo "Directus clone compatibility check failed: $*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null || fail "required command is unavailable: $1"
}

wait_for_url() {
  local name="$1"
  local url="$2"
  local attempt

  for attempt in {1..24}; do
    if curl --fail --silent --show-error "$url" >/dev/null; then
      echo "Passed: $name"
      return 0
    fi
    sleep 5
  done

  fail "timed out waiting for $name"
}

volume_id() {
  docker volume inspect --format '{{.Mountpoint}}' "$1"
}

cleanup() {
  local status=$?

  docker rm -f "$COMPATIBILITY_NAME" >/dev/null 2>&1 || true
  docker volume rm "$COMPATIBILITY_DATABASE_VOLUME" "$COMPATIBILITY_UPLOADS_VOLUME" "$COMPATIBILITY_EXTENSIONS_VOLUME" >/dev/null 2>&1 || true

  if [[ -n "${production_database_before:-}" ]] && [[ "$(volume_id "$PRODUCTION_DATABASE_VOLUME")" != "$production_database_before" ]]; then
    echo "ERROR: production database volume changed unexpectedly" >&2
    status=1
  fi
  if [[ -n "${production_uploads_before:-}" ]] && [[ "$(volume_id "$PRODUCTION_UPLOADS_VOLUME")" != "$production_uploads_before" ]]; then
    echo "ERROR: production uploads volume changed unexpectedly" >&2
    status=1
  fi
  if [[ -n "${production_extensions_before:-}" ]] && [[ "$(volume_id "$PRODUCTION_EXTENSIONS_VOLUME")" != "$production_extensions_before" ]]; then
    echo "ERROR: production extensions volume changed unexpectedly" >&2
    status=1
  fi

  if [[ "$status" -eq 0 ]]; then
    echo "Passed: isolated clone removed and production volumes stayed untouched"
  fi
  exit "$status"
}

[[ "$BACKUP_ARCHIVE" = /home/global/backups/global-church/* ]] || fail "backup archive must be under /home/global/backups/global-church"
[[ -f "$BACKUP_ARCHIVE" ]] || fail "backup archive does not exist"
[[ -f "$DEPLOY_ENV_FILE" ]] || fail "production environment file does not exist"
[[ -f "$DEPLOY_ROOT/docker-compose.production.yml" ]] || fail "production compose file does not exist"

require_command curl
require_command docker
require_command node

backup_directory="$(dirname "$BACKUP_ARCHIVE")"
backup_filename="$(basename "$BACKUP_ARCHIVE")"
tar -tzf "$BACKUP_ARCHIVE" | grep -qx 'database/directus.sqlite' || fail "backup archive has no SQLite database"
tar -tzf "$BACKUP_ARCHIVE" | grep -q '^uploads/' || fail "backup archive has no uploads directory"

production_database_before="$(volume_id "$PRODUCTION_DATABASE_VOLUME")"
production_uploads_before="$(volume_id "$PRODUCTION_UPLOADS_VOLUME")"
production_extensions_before="$(volume_id "$PRODUCTION_EXTENSIONS_VOLUME")"
trap cleanup EXIT

docker rm -f "$COMPATIBILITY_NAME" >/dev/null 2>&1 || true
docker volume rm "$COMPATIBILITY_DATABASE_VOLUME" "$COMPATIBILITY_UPLOADS_VOLUME" "$COMPATIBILITY_EXTENSIONS_VOLUME" >/dev/null 2>&1 || true
docker volume create "$COMPATIBILITY_DATABASE_VOLUME" >/dev/null
docker volume create "$COMPATIBILITY_UPLOADS_VOLUME" >/dev/null
docker volume create "$COMPATIBILITY_EXTENSIONS_VOLUME" >/dev/null

echo "Restoring an isolated Directus copy from $(basename "$BACKUP_ARCHIVE")"
docker run --rm \
  --mount "type=bind,src=$backup_directory,dst=/backup,readonly" \
  --mount "type=volume,src=$COMPATIBILITY_DATABASE_VOLUME,dst=/restore/database" \
  --mount "type=volume,src=$COMPATIBILITY_UPLOADS_VOLUME,dst=/restore/uploads" \
  --env BACKUP_FILENAME="$backup_filename" \
  alpine:3.21 sh -ec '
    tar -xzf "/backup/$BACKUP_FILENAME" -C /tmp
    test -f /tmp/database/directus.sqlite
    test -d /tmp/uploads
    cp -a /tmp/database/. /restore/database/
    cp -a /tmp/uploads/. /restore/uploads/
  '

# Extensions are immutable application files in normal operation. Copying them
# read-only keeps the clone's runtime shape equal to production without pausing it.
docker run --rm \
  --mount "type=volume,src=$PRODUCTION_EXTENSIONS_VOLUME,dst=/source,readonly" \
  --mount "type=volume,src=$COMPATIBILITY_EXTENSIONS_VOLUME,dst=/target" \
  alpine:3.21 sh -ec 'cp -a /source/. /target/'

docker run -d \
  --name "$COMPATIBILITY_NAME" \
  --init \
  --env-file "$DEPLOY_ENV_FILE" \
  --env HOST=0.0.0.0 \
  --env PORT=8055 \
  --env DB_CLIENT=sqlite3 \
  --env DB_FILENAME=/directus/database/directus.sqlite \
  --env STORAGE_LOCATIONS=local \
  --env STORAGE_LOCAL_ROOT=/directus/uploads \
  --env CORS_ENABLED=true \
  --env ROOT_REDIRECT=./admin \
  --env MAX_PAYLOAD_SIZE=100mb \
  --env GRAPHQL_INTROSPECTION=false \
  --env WEBSOCKETS_GRAPHQL_ENABLED=false \
  --publish "127.0.0.1:${COMPATIBILITY_PORT}:8055" \
  --mount "type=volume,src=$COMPATIBILITY_DATABASE_VOLUME,dst=/directus/database" \
  --mount "type=volume,src=$COMPATIBILITY_UPLOADS_VOLUME,dst=/directus/uploads" \
  --mount "type=volume,src=$COMPATIBILITY_EXTENSIONS_VOLUME,dst=/directus/extensions" \
  "$DIRECTUS_IMAGE" >/dev/null

base_url="http://127.0.0.1:${COMPATIBILITY_PORT}"
wait_for_url 'Directus 12.4.1 health endpoint' "$base_url/server/ping"
wait_for_url 'published stories API' "$base_url/items/stories?limit=1"
wait_for_url 'published news API' "$base_url/items/news?limit=1"

# Keep credentials only in the node process environment. Do not print tokens,
# cookies, account data, or the contents of the production environment file.
ADMIN_EMAIL="$(sed -n 's/^ADMIN_EMAIL=//p' "$DEPLOY_ENV_FILE" | head -n 1)" \
ADMIN_PASSWORD="$(sed -n 's/^ADMIN_PASSWORD=//p' "$DEPLOY_ENV_FILE" | head -n 1)" \
BASE_URL="$base_url" node <<'NODE'
const baseUrl = process.env.BASE_URL;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  throw new Error("ADMIN_EMAIL or ADMIN_PASSWORD is unavailable in the production environment file");
}

const login = await fetch(`${baseUrl}/auth/login`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email, password }),
});
if (!login.ok) throw new Error(`administrator login returned HTTP ${login.status}`);

const { data } = await login.json();
const token = data?.access_token;
if (!token) throw new Error("administrator login did not return an access token");

const files = await fetch(`${baseUrl}/files?limit=1&fields=id`, {
  headers: { authorization: `Bearer ${token}` },
});
if (!files.ok) throw new Error(`administrator file listing returned HTTP ${files.status}`);

const fileId = (await files.json()).data?.[0]?.id;
if (!fileId) throw new Error("no uploaded file is available to test public asset delivery");

const asset = await fetch(`${baseUrl}/assets/${fileId}`);
if (!asset.ok) throw new Error(`public asset delivery returned HTTP ${asset.status}`);

console.log("Passed: administrator login and public uploaded-file delivery");
NODE

# The health check plus authenticated and filtered public reads run after
# Directus has completed its automatic SQLite migrations. A migration failure
# leaves the service unavailable or those schema-backed endpoints unusable.
echo "Passed: migrated SQLite clone served authenticated and public requests"
