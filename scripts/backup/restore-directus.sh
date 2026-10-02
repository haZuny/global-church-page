#!/usr/bin/env bash
set -Eeuo pipefail

# 사용법: restore-directus.sh /absolute/path/to/directus-...tar.gz --confirm-restore
# 이 스크립트는 운영 CMS DB와 uploads를 백업 시점으로 되돌린다.

readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly REPOSITORY_DIR="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
readonly COMPOSE_FILE="${COMPOSE_FILE:-$REPOSITORY_DIR/docker-compose.production.yml}"
readonly ENV_FILE="${ENV_FILE:-$REPOSITORY_DIR/.env.production}"
readonly DATABASE_VOLUME="${DATABASE_VOLUME:-global-church-production-database}"
readonly UPLOADS_VOLUME="${UPLOADS_VOLUME:-global-church-production-uploads}"
readonly SNAPSHOT_IMAGE="${BACKUP_SNAPSHOT_IMAGE:-alpine:3.20}"

log() {
  printf '%s restore-directus: %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$*"
}

fail() {
  log "ERROR: $*"
  exit 1
}

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

cleanup() {
  local exit_code=$?
  if [[ "${directus_was_running:-false}" == "true" ]]; then
    log "starting Directus after restore"
    compose up -d directus >/dev/null || log "ERROR: could not restart Directus automatically"
  fi
  [[ -n "${staging_dir:-}" && -d "$staging_dir" ]] && rm -rf -- "$staging_dir"
  exit "$exit_code"
}

[[ $# -eq 2 && "$2" == "--confirm-restore" ]] || fail "usage: $0 /absolute/path/to/backup.tar.gz --confirm-restore"
readonly BACKUP_ARCHIVE="$1"
[[ "$BACKUP_ARCHIVE" = /* && -f "$BACKUP_ARCHIVE" ]] || fail "an existing absolute backup archive path is required"
[[ -f "$COMPOSE_FILE" && -f "$ENV_FILE" ]] || fail "production compose or environment file is missing"
command -v docker >/dev/null 2>&1 || fail "docker is unavailable"
command -v tar >/dev/null 2>&1 || fail "tar is unavailable"
command -v sha256sum >/dev/null 2>&1 || fail "sha256sum is unavailable"

if [[ -f "${BACKUP_ARCHIVE}.sha256" ]]; then
  (cd -- "$(dirname -- "$BACKUP_ARCHIVE")" && sha256sum -c "$(basename -- "${BACKUP_ARCHIVE}.sha256")") || fail "backup checksum verification failed"
else
  fail "checksum file is required beside the backup archive"
fi

staging_dir="$(mktemp -d)"
trap cleanup EXIT
tar -xzf "$BACKUP_ARCHIVE" -C "$staging_dir"
[[ -f "$staging_dir/database/directus.sqlite" ]] || fail "backup does not contain database/directus.sqlite"
[[ -d "$staging_dir/uploads" && -f "$staging_dir/manifest.txt" ]] || fail "backup is not a valid Directus snapshot"

directus_was_running=false
directus_container="$(compose ps -q directus)"
[[ -n "$directus_container" ]] || fail "Directus container does not exist"
if [[ "$(docker inspect -f '{{.State.Running}}' "$directus_container")" == "true" ]]; then
  directus_was_running=true
  log "stopping Directus before destructive volume restore"
  compose stop directus >/dev/null
fi

log "restoring database volume"
docker run --rm \
  -v "$DATABASE_VOLUME:/target" \
  -v "$staging_dir/database:/source:ro" \
  "$SNAPSHOT_IMAGE" sh -ec 'find /target -mindepth 1 -maxdepth 1 -exec rm -rf {} +; tar -C /source -cf - . | tar -C /target -xf -; chown -R 1000:1000 /target'

log "restoring uploads volume"
docker run --rm \
  -v "$UPLOADS_VOLUME:/target" \
  -v "$staging_dir/uploads:/source:ro" \
  "$SNAPSHOT_IMAGE" sh -ec 'find /target -mindepth 1 -maxdepth 1 -exec rm -rf {} +; tar -C /source -cf - . | tar -C /target -xf -; chown -R 1000:1000 /target'

log "SUCCESS: data restored; verify Directus health and a file attachment after restart"
