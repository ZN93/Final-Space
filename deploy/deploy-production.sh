#!/usr/bin/env bash
set -Eeuo pipefail

umask 077

readonly repository_directory="/opt/final-space"
readonly state_directory="${repository_directory}/.deploy"
readonly backups_directory="${state_directory}/backups"
readonly runtime_compose_file="${state_directory}/docker-compose.prod.yml"
readonly expected_origin_url="https://github.com/ZN93/Final-Space.git"
readonly backend_repository="ghcr.io/zn93/final-space-backend"
readonly frontend_repository="ghcr.io/zn93/final-space-frontend"
readonly backup_retention_count=7

log() {
    printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"
}

fail() {
    log "ERROR: $*" >&2
    exit 1
}

require_command() {
    command -v "$1" >/dev/null || fail "required command not found: $1"
}

check_public_health() {
    local base_url="$1"
    local response=""

    for _ in {1..30}; do
        if response="$(curl --fail --silent --show-error "${base_url}/health" 2>/dev/null)" \
            && [ "$response" = "ok" ]; then
            return 0
        fi

        sleep 2
    done

    return 1
}

prune_old_backups() {
    local backup_path=""
    local resolved_path=""
    local -a expired_backups=()

    mapfile -t expired_backups < <(
        find "$backups_directory" \
            -mindepth 1 \
            -maxdepth 1 \
            -type d \
            -printf '%T@ %p\n' |
            sort --numeric-sort --reverse |
            tail -n "+$((backup_retention_count + 1))" |
            cut -d ' ' -f 2-
    )

    for backup_path in "${expired_backups[@]}"; do
        resolved_path="$(realpath --canonicalize-missing "$backup_path")"

        case "$resolved_path" in
            "${backups_directory}"/*)
                rm -rf -- "$resolved_path"
                ;;
            *)
                fail "refusing to remove an unexpected backup path: $resolved_path"
                ;;
        esac
    done
}

target_revision="${1:-}"

[[ "$target_revision" =~ ^[0-9a-f]{40}$ ]] \
    || fail "the deployment revision must be a full 40-character Git SHA"

for required_command in \
    curl \
    docker \
    find \
    flock \
    git \
    realpath \
    sha256sum
do
    require_command "$required_command"
done

[ -d "${repository_directory}/.git" ] \
    || fail "Git repository not found at ${repository_directory}"

cd "$repository_directory"

[ -f .env ] || fail "production .env file not found"

[ "$(stat -c '%a %U:%G' .env)" = "600 ubuntu:ubuntu" ] \
    || fail "unexpected permissions on .env"

grep -q '^APP_BASE_URL=https://146\.59\.232\.207$' .env \
    || fail "unexpected APP_BASE_URL"

grep -q '^APP_BOOTSTRAP_ENABLED=false$' .env \
    || fail "administrator bootstrap must remain disabled"

if grep -Eq '^APP_BOOTSTRAP_ADMIN_(EMAIL|PASSWORD)=' .env; then
    fail "administrator bootstrap credentials must not be present in .env"
fi

[ "$(git remote get-url origin)" = "$expected_origin_url" ] \
    || fail "unexpected Git origin URL"

git diff --quiet || fail "tracked working tree changes detected"
git diff --cached --quiet || fail "staged working tree changes detected"

install -d -m 0700 "$state_directory" "$backups_directory"

git fetch --quiet --prune origin main
git cat-file -e "${target_revision}^{commit}" \
    || fail "target revision does not exist"

git merge-base --is-ancestor "$target_revision" origin/main \
    || fail "target revision is not part of origin/main"

if [ "${FINALSPACE_DEPLOY_REEXECUTED:-false}" != "true" ]; then
    versioned_script="${state_directory}/deploy-production-${target_revision}.sh"
    temporary_script="$(mktemp "${state_directory}/deploy-production.XXXXXX")"

    git show "${target_revision}:deploy/deploy-production.sh" > "$temporary_script"
    chmod 0700 "$temporary_script"
    mv -f "$temporary_script" "$versioned_script"

    exec env FINALSPACE_DEPLOY_REEXECUTED=true \
        "$versioned_script" "$target_revision"
fi

exec 9>"${state_directory}/deployment.lock"
flock --nonblock 9 || fail "another production deployment is already running"

git fetch --quiet --prune origin main

current_main_revision="$(git rev-parse origin/main)"

if [ "$target_revision" != "$current_main_revision" ]; then
    log "Skipping stale revision ${target_revision}; current main is ${current_main_revision}"
    exit 0
fi

previous_revision="$(git rev-parse HEAD)"
application_base_url="$(sed -n 's/^APP_BASE_URL=//p' .env)"
deployment_timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_directory="${backups_directory}/${deployment_timestamp}-${previous_revision:0:12}-before-${target_revision:0:12}"

base_compose=(
    docker compose
    --env-file .env
    --file docker-compose.yml
)

backend_container_id="$("${base_compose[@]}" ps --quiet backend)"
frontend_container_id="$("${base_compose[@]}" ps --quiet frontend)"

[ -n "$backend_container_id" ] || fail "running backend container not found"
[ -n "$frontend_container_id" ] || fail "running frontend container not found"

backend_image_id="$(docker inspect --format '{{.Image}}' "$backend_container_id")"
frontend_image_id="$(docker inspect --format '{{.Image}}' "$frontend_container_id")"

rollback_backend_image="final-space-backend:rollback-${deployment_timestamp}"
rollback_frontend_image="final-space-frontend:rollback-${deployment_timestamp}"

docker image tag "$backend_image_id" "$rollback_backend_image"
docker image tag "$frontend_image_id" "$rollback_frontend_image"

install -d -m 0700 "$backup_directory"

log "Creating PostgreSQL backup"
"${base_compose[@]}" exec -T postgres sh -eu -c '
    exec pg_dump \
        --username="$POSTGRES_USER" \
        --dbname="$POSTGRES_DB" \
        --format=custom
' > "${backup_directory}/postgres.dump"

log "Creating MongoDB backup"
"${base_compose[@]}" exec -T mongo sh -eu -c '
    exec mongodump \
        --archive \
        --gzip \
        --quiet \
        --username="$MONGO_INITDB_ROOT_USERNAME" \
        --password="$MONGO_INITDB_ROOT_PASSWORD" \
        --authenticationDatabase=admin \
        --db="$MONGO_INITDB_DATABASE"
' > "${backup_directory}/mongo.archive.gz"

sha256sum \
    "${backup_directory}/postgres.dump" \
    "${backup_directory}/mongo.archive.gz" \
    > "${backup_directory}/SHA256SUMS"

temporary_compose_file="$(mktemp "${state_directory}/docker-compose.prod.XXXXXX")"
git show "${target_revision}:docker-compose.prod.yml" > "$temporary_compose_file"
chmod 0600 "$temporary_compose_file"
mv -f "$temporary_compose_file" "$runtime_compose_file"

rollback_needed=true

handle_exit() {
    local status=$?

    trap - EXIT INT TERM

    if [ "$status" -ne 0 ] && [ "$rollback_needed" = "true" ]; then
        log "Deployment failed; restoring revision ${previous_revision}"

        set +e

        git -c advice.detachedHead=false checkout --detach "$previous_revision"

        BACKEND_IMAGE="$rollback_backend_image" \
        FRONTEND_IMAGE="$rollback_frontend_image" \
            docker compose \
                --env-file .env \
                --file docker-compose.yml \
                --file "$runtime_compose_file" \
                up \
                --detach \
                --remove-orphans \
                --no-build \
                --wait \
                --wait-timeout 300

        rollback_status=$?

        if [ "$rollback_status" -eq 0 ] \
            && check_public_health "$application_base_url"; then
            log "Application rollback succeeded"
        else
            log "ERROR: automatic application rollback failed" >&2
        fi

        set -e
    fi

    exit "$status"
}

trap handle_exit EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

log "Checking out production revision ${target_revision}"
git -c advice.detachedHead=false checkout --detach "$target_revision"

target_backend_image="${backend_repository}:${target_revision}"
target_frontend_image="${frontend_repository}:${target_revision}"

production_compose=(
    docker compose
    --env-file .env
    --file docker-compose.yml
    --file "$runtime_compose_file"
)

BACKEND_IMAGE="$target_backend_image" \
FRONTEND_IMAGE="$target_frontend_image" \
    "${production_compose[@]}" config --quiet

log "Pulling immutable application images"
BACKEND_IMAGE="$target_backend_image" \
FRONTEND_IMAGE="$target_frontend_image" \
    "${production_compose[@]}" pull backend frontend

log "Starting production revision ${target_revision}"
BACKEND_IMAGE="$target_backend_image" \
FRONTEND_IMAGE="$target_frontend_image" \
    "${production_compose[@]}" up \
        --detach \
        --remove-orphans \
        --no-build \
        --wait \
        --wait-timeout 300

check_public_health "$application_base_url" \
    || fail "public HTTPS health check failed"

protected_api_status="$(
    curl \
        --silent \
        --show-error \
        --output /dev/null \
        --write-out '%{http_code}' \
        "${application_base_url}/api/missions"
)"

case "$protected_api_status" in
    401|403)
        ;;
    *)
        fail "protected API returned unexpected HTTP status ${protected_api_status}"
        ;;
esac

printf '%s\n' "$target_revision" > "${state_directory}/current-revision.tmp"
mv -f \
    "${state_directory}/current-revision.tmp" \
    "${state_directory}/current-revision"

rollback_needed=false

docker image rm \
    "$rollback_backend_image" \
    "$rollback_frontend_image" \
    >/dev/null 2>&1 || true

prune_old_backups

log "Deployment succeeded for ${target_revision}"
log "Database backup stored at ${backup_directory}"

BACKEND_IMAGE="$target_backend_image" \
FRONTEND_IMAGE="$target_frontend_image" \
    "${production_compose[@]}" ps
