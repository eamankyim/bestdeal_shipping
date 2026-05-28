#!/usr/bin/env bash
set -Eeuo pipefail

# Minimal production deploy for BestDeal Shipping.
#
# This script ONLY:
#   - fast-forward pulls the latest production branch
#   - rebuilds/restarts the backend and frontend containers
#   - reconnects the existing host-nginx container to the app network
#   - restarts host-nginx and runs verification curls
#
# This script DOES NOT:
#   - edit, create, source, print, or rewrite .env
#   - change SMTP settings or secrets
#   - edit docker-compose.override.yml or docker-compose.prod.yml
#   - run migrations, seed data, drop data, or otherwise modify the database
#   - edit nginx config or certificates
#   - commit, push, delete files, prune Docker resources, or touch unrelated services

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PRODUCTION_BRANCH="production"
ENV_FILE="${APP_DIR}/.env"
PROD_COMPOSE="${APP_DIR}/docker-compose.prod.yml"
OVERRIDE_COMPOSE="${APP_DIR}/docker-compose.override.yml"
HOST_NGINX_CONTAINER="host-nginx"

cd "${APP_DIR}"

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

require_file() {
  local file_path="$1"
  [ -f "${file_path}" ] || fail "Required server file is missing: ${file_path}"
}

env_value() {
  local key="$1"
  awk -F= -v key="${key}" '
    /^[[:space:]]*#/ { next }
    /^[[:space:]]*$/ { next }
    {
      name=$1
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", name)
      if (name == key) {
        value=substr($0, index($0, "=") + 1)
        sub(/[[:space:]]+#.*$/, "", value)
        gsub(/^[[:space:]]+|[[:space:]]+$/, "", value)
        gsub(/^["'\'']|["'\'']$/, "", value)
        print value
      }
    }
  ' "${ENV_FILE}" | tail -n 1
}

if docker compose version >/dev/null 2>&1; then
  DOCKER_COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  DOCKER_COMPOSE=(docker-compose)
else
  fail "Docker Compose is required"
fi

require_file "${ENV_FILE}"
require_file "${PROD_COMPOSE}"
require_file "${OVERRIDE_COMPOSE}"

current_branch="$(git rev-parse --abbrev-ref HEAD)"
[ "${current_branch}" = "${PRODUCTION_BRANCH}" ] || fail "Run this from the ${PRODUCTION_BRANCH} branch, not ${current_branch}"

git diff --quiet || fail "Tracked working tree changes detected; refusing to deploy"
git diff --cached --quiet || fail "Staged changes detected; refusing to deploy"

BACKEND_PORT="$(env_value BACKEND_PORT)"
BACKEND_PORT="${BACKEND_PORT:-4005}"
FRONTEND_PORT="$(env_value FRONTEND_PORT)"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
export BACKEND_PORT FRONTEND_PORT

echo "Pulling latest ${PRODUCTION_BRANCH} branch..."
git fetch origin "${PRODUCTION_BRANCH}"
git pull --ff-only origin "${PRODUCTION_BRANCH}"

echo "Rebuilding and restarting backend/frontend only..."
"${DOCKER_COMPOSE[@]}" \
  --env-file "${ENV_FILE}" \
  -f "${PROD_COMPOSE}" \
  -f "${OVERRIDE_COMPOSE}" \
  up -d --build --no-deps backend frontend

backend_container="$("${DOCKER_COMPOSE[@]}" --env-file "${ENV_FILE}" -f "${PROD_COMPOSE}" -f "${OVERRIDE_COMPOSE}" ps -q backend)"
[ -n "${backend_container}" ] || fail "Could not find backend container after deploy"

app_network="$(docker inspect --format '{{range $name, $_ := .NetworkSettings.Networks}}{{println $name}}{{end}}' "${backend_container}" | head -n 1)"
[ -n "${app_network}" ] || fail "Could not determine backend Docker network"

docker inspect "${HOST_NGINX_CONTAINER}" >/dev/null 2>&1 || fail "Container ${HOST_NGINX_CONTAINER} not found"

if docker inspect --format '{{range $name, $_ := .NetworkSettings.Networks}}{{println $name}}{{end}}' "${HOST_NGINX_CONTAINER}" | grep -Fxq "${app_network}"; then
  echo "${HOST_NGINX_CONTAINER} is already connected to ${app_network}"
else
  echo "Connecting ${HOST_NGINX_CONTAINER} to ${app_network}..."
  docker network connect "${app_network}" "${HOST_NGINX_CONTAINER}"
fi

echo "Restarting ${HOST_NGINX_CONTAINER}..."
docker restart "${HOST_NGINX_CONTAINER}" >/dev/null

curl_check() {
  local label="$1"
  local url="$2"

  echo "Checking ${label}: ${url}"
  curl --fail --silent --show-error --location --max-time 15 "${url}" >/dev/null
}

echo "Running verification curls..."
curl_check "backend health" "http://127.0.0.1:${BACKEND_PORT}/health"
curl_check "frontend" "http://127.0.0.1:${FRONTEND_PORT}/"
curl_check "host nginx" "http://127.0.0.1/"

echo "Production deploy completed safely."
