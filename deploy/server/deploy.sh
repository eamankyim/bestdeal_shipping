#!/usr/bin/env bash
# BestDeal deploy, installed on the server as /opt/bestdeal/bin/deploy.
#
# GitHub Actions pipes a tar of backend/, frontend/ and deploy/ into it over SSH, with a key
# that can run nothing but this script (see deploy/README.md). By hand on the server:
#   /opt/bestdeal/bin/deploy <commit>  < app.tar   deploy that code
#   /opt/bestdeal/bin/deploy rollback              go back to the release before the current one
#   /opt/bestdeal/bin/deploy status                show releases and containers
#
# A deploy builds the new release, backs up the database, updates its tables with
# `prisma db push` (which refuses any change that would delete data), then swaps the
# containers. If any step fails, the release that was running keeps running.
set -Eeuo pipefail
umask 027

BASE=/opt/bestdeal
ENV_FILE="$BASE/.env"
RELEASES="$BASE/releases"
KEEP=5
MAX_UPLOAD_BYTES=300000000

log() { printf '%s  %s\n' "$(date -u +%H:%M:%S)" "$*"; }
fail() { log "ERROR: $*" >&2; exit 1; }

compose() {
  local dir="$1"; shift
  docker compose -p bestdeal --env-file "$ENV_FILE" -f "$dir/deploy/compose.yml" "$@"
}

current_tag() {
  if [ -L "$BASE/current" ]; then basename "$(readlink -f "$BASE/current")"; else echo "nothing yet"; fi
}

# Releases that went live (deploy() marks them); failed ones are never rolled back to
live_releases() {
  local r
  for r in $(ls -1 "$RELEASES" | sort); do [ -f "$RELEASES/$r/DEPLOYED" ] && echo "$r"; done
  return 0
}

prune_releases() {
  local keep_list old
  keep_list="$(live_releases | tail -n "$KEEP")"
  for old in $(ls -1 "$RELEASES" | sort); do
    grep -qx "$old" <<<"$keep_list" && continue
    [ "$old" = "$(current_tag)" ] && continue
    log "removing old release $old"
    docker image rm "bestdeal-backend:$old" "bestdeal-web:$old" >/dev/null 2>&1 || true
    rm -rf -- "${RELEASES:?}/$old"
  done
  docker image prune -f >/dev/null
  docker builder prune -f --filter until=168h >/dev/null
}

deploy() {
  local commit="$1"
  [[ "$commit" =~ ^[0-9a-f]{7,40}$ ]] || fail "expected a commit id, got '$commit'"
  [ -f "$ENV_FILE" ] || fail "$ENV_FILE is missing"

  local tag dir
  tag="$(date -u +%Y%m%d-%H%M%S)-${commit:0:7}"
  dir="$RELEASES/$tag"
  mkdir -p "$dir"
  trap 'log "deploy of $tag failed; still running: $(current_tag)"' ERR

  log "receiving code for $commit"
  # World-readable files: the app runs as a non-root user inside its image
  (umask 022; head -c "$MAX_UPLOAD_BYTES" | tar -x -C "$dir" --no-same-owner --no-same-permissions)
  for need in backend/package.json frontend/package.json deploy/compose.yml; do
    [ -f "$dir/$need" ] || fail "upload is missing $need"
  done
  printf '%s\n' "$commit" > "$dir/COMMIT"

  export RELEASE_TAG="$tag"
  log "building $tag"
  compose "$dir" build --pull

  log "starting the database"
  compose "$dir" up -d --wait db

  log "backing up the database"
  "$BASE/bin/backup" "before-$tag"

  log "updating database tables"
  compose "$dir" run --rm --no-deps -T backend npx prisma db push --skip-generate

  log "switching to $tag"
  compose "$dir" up -d --remove-orphans --wait --wait-timeout 180
  ln -sfn "$dir" "$BASE/current"
  date -u +%FT%TZ > "$dir/DEPLOYED"
  trap - ERR

  prune_releases
  log "deployed $tag"
}

rollback() {
  local now previous
  now="$(current_tag)"
  previous="$(live_releases | awk -v now="$now" '$0 < now' | tail -n 1)"
  [ -n "$previous" ] || fail "no earlier release to go back to"
  log "rolling back from $now to $previous (database tables are left as they are)"
  export RELEASE_TAG="$previous"
  docker image inspect "bestdeal-backend:$previous" >/dev/null 2>&1 || compose "$RELEASES/$previous" build
  compose "$RELEASES/$previous" up -d --remove-orphans --wait --wait-timeout 180
  ln -sfn "$RELEASES/$previous" "$BASE/current"
  log "now running $previous"
}

status() {
  echo "current: $(current_tag)"
  echo "releases that went live:"; live_releases | sed 's/^/  /'
  docker ps --filter label=com.docker.compose.project=bestdeal --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'
}

exec 9>"$BASE/deploy.lock"
flock -n 9 || fail "another deploy is running"
mkdir -p "$RELEASES"

# Over SSH the forced command passes what the caller asked for in SSH_ORIGINAL_COMMAND
read -r -a args <<<"${SSH_ORIGINAL_COMMAND:-$*}"
case "${args[0]:-}" in
  rollback) rollback ;;
  status) status ;;
  "") fail "usage: deploy <commit> | rollback | status" ;;
  *) deploy "${args[0]}" ;;
esac
