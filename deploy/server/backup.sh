#!/usr/bin/env bash
# BestDeal database backup, installed on the server as /opt/bestdeal/bin/backup.
# Runs nightly from /etc/cron.d/bestdeal and before every deploy.
#   /opt/bestdeal/bin/backup [label]
# Restore: see deploy/README.md.
set -Eeuo pipefail
umask 077

DIR=/opt/bestdeal/backups
label="${1:-nightly}"
[[ "$label" =~ ^[A-Za-z0-9._-]+$ ]] || { echo "bad label" >&2; exit 1; }
mkdir -p "$DIR"

file="$DIR/bestdeal-$(date -u +%Y%m%d-%H%M%S)-$label.dump"
docker exec bestdeal-db pg_dump -U bestdeal -d bestdeal --format=custom > "$file.part"
mv "$file.part" "$file"
echo "backup saved: $file ($(du -h "$file" | cut -f1))"

# Nightly backups are kept for 30 days, the ones taken before a deploy for 14
find "$DIR" -name 'bestdeal-*-nightly.dump' -mtime +30 -delete
find "$DIR" -name 'bestdeal-*-before-*.dump' -mtime +14 -delete
