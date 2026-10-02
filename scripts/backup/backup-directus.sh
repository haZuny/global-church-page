#!/usr/bin/env bash
set -Eeuo pipefail

# Directus SQLite DB와 uploads를 같은 시점으로 묶어 백업한다.
# 운영 서버에서만 실행한다. 비밀값은 이 스크립트나 로그에 기록하지 않는다.

readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly REPOSITORY_DIR="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
readonly COMPOSE_FILE="${COMPOSE_FILE:-$REPOSITORY_DIR/docker-compose.production.yml}"
readonly ENV_FILE="${ENV_FILE:-$REPOSITORY_DIR/.env.production}"
readonly BACKUP_ROOT="${BACKUP_ROOT:-/home/global/backups/global-church}"
readonly REMOTE_TARGET="${BACKUP_REMOTE_TARGET:-}"
readonly KEEP_DAILY_DAYS="${BACKUP_KEEP_DAILY_DAYS:-14}"
readonly KEEP_WEEKLY_WEEKS="${BACKUP_KEEP_WEEKLY_WEEKS:-8}"
readonly DATABASE_VOLUME="${DATABASE_VOLUME:-global-church-production-database}"
readonly UPLOADS_VOLUME="${UPLOADS_VOLUME:-global-church-production-uploads}"
readonly SNAPSHOT_IMAGE="${BACKUP_SNAPSHOT_IMAGE:-alpine:3.20}"

log() {
  printf '%s backup-directus: %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$*"
}

fail() {
  log "ERROR: $*"
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "required command is unavailable: $1"
}

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

cleanup_snapshot() {
  local exit_code=$?

  if [[ "${directus_was_running:-false}" == "true" ]]; then
    log "starting Directus after snapshot"
    compose up -d directus >/dev/null || log "ERROR: could not restart Directus automatically"
  fi

  if [[ -n "${staging_dir:-}" && -d "$staging_dir" ]]; then
    rm -rf -- "$staging_dir"
  fi

  exit "$exit_code"
}

prune_local_backups() {
  local now_epoch file stamp parsed_stamp age_days week_key
  declare -A kept_weeks=()

  now_epoch="$(date +%s)"
  while IFS= read -r -d '' file; do
    stamp="$(basename "$file" | sed -E 's/^directus-([0-9]{8}T[0-9]{6}Z)\.tar\.gz$/\1/')"
    [[ "$stamp" =~ ^[0-9]{8}T[0-9]{6}Z$ ]] || continue
    parsed_stamp="${stamp:0:4}-${stamp:4:2}-${stamp:6:2} ${stamp:9:2}:${stamp:11:2}:${stamp:13:2} UTC"

    age_days=$(( (now_epoch - $(date -u -d "$parsed_stamp" +%s)) / 86400 ))
    if (( age_days <= KEEP_DAILY_DAYS )); then
      continue
    fi

    week_key="$(date -u -d "$parsed_stamp" +%G-W%V)"
    if (( age_days <= KEEP_WEEKLY_WEEKS * 7 )) && [[ -z "${kept_weeks[$week_key]+x}" ]]; then
      kept_weeks[$week_key]=1
      continue
    fi

    rm -f -- "$file" "${file}.sha256"
    log "pruned local backup $(basename "$file")"
  done < <(find "$BACKUP_ROOT" -maxdepth 1 -type f -name 'directus-*.tar.gz' -print0 | sort -z -r)
}

main() {
  require_command docker
  require_command tar
  require_command sha256sum
  require_command date
  [[ -f "$COMPOSE_FILE" ]] || fail "compose file not found: $COMPOSE_FILE"
  [[ -f "$ENV_FILE" ]] || fail "environment file not found: $ENV_FILE"
  if [[ -n "$REMOTE_TARGET" ]]; then
    require_command rclone
  fi

  mkdir -p "$BACKUP_ROOT"
  staging_dir="$(mktemp -d "$BACKUP_ROOT/.snapshot.XXXXXX")"
  trap cleanup_snapshot EXIT

  directus_was_running=false
  local directus_container
  directus_container="$(compose ps -q directus)"
  [[ -n "$directus_container" ]] || fail "Directus container does not exist"
  if [[ "$(docker inspect -f '{{.State.Running}}' "$directus_container")" == "true" ]]; then
    directus_was_running=true
    log "stopping Directus for a consistent SQLite and uploads snapshot"
    compose stop directus >/dev/null
  fi

  mkdir -p "$staging_dir/database" "$staging_dir/uploads"
  log "copying database volume"
  docker run --rm \
    -v "$DATABASE_VOLUME:/source:ro" \
    -v "$staging_dir/database:/destination" \
    "$SNAPSHOT_IMAGE" sh -ec 'tar -C /source -cf - . | tar -C /destination -xf -'

  log "copying uploads volume"
  docker run --rm \
    -v "$UPLOADS_VOLUME:/source:ro" \
    -v "$staging_dir/uploads:/destination" \
    "$SNAPSHOT_IMAGE" sh -ec 'tar -C /source -cf - . | tar -C /destination -xf -'

  [[ -f "$staging_dir/database/directus.sqlite" ]] || fail "snapshot has no directus.sqlite"
  cat > "$staging_dir/manifest.txt" <<EOF
created_at_utc=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
database_volume=$DATABASE_VOLUME
uploads_volume=$UPLOADS_VOLUME
format=directus-volume-snapshot-v1
EOF

  local backup_name backup_path
  backup_name="directus-$(date -u '+%Y%m%dT%H%M%SZ').tar.gz"
  backup_path="$BACKUP_ROOT/$backup_name"
  log "creating archive $backup_name"
  tar -C "$staging_dir" -czf "$backup_path" database uploads manifest.txt
  tar -tzf "$backup_path" >/dev/null
  sha256sum "$backup_path" > "${backup_path}.sha256"

  if [[ -n "$REMOTE_TARGET" ]]; then
    if ! rclone copyto "$backup_path" "$REMOTE_TARGET/$backup_name"; then
      fail "remote archive upload failed"
    fi
    if ! rclone copyto "${backup_path}.sha256" "$REMOTE_TARGET/${backup_name}.sha256"; then
      fail "remote checksum upload failed"
    fi
  fi

  prune_local_backups
  if [[ -n "$REMOTE_TARGET" ]]; then
    log "SUCCESS: $backup_name uploaded to configured remote backup storage"
  else
    log "SUCCESS: $backup_name stored on the host filesystem only"
  fi
}

main "$@"
