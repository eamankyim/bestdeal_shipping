#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Update the repo-root .env file with SMTP settings for docker-compose.prod.yml.

Usage:
  ./update-smtp-env.sh

Optional environment variables:
  ENV_FILE          Path to env file to update (default: .env)
  SMTP_HOST         SMTP server host (default: smtp.gmail.com)
  SMTP_PORT         SMTP server port (default: 587)
  SMTP_SECURE       Use TLS immediately: true/false (default: false)
  SMTP_USER         SMTP username/email address
  SMTP_PASSWORD     SMTP app password. If omitted in a terminal, you will be prompted.
  SMTP_FROM_NAME    Sender display name (default: BestDeal Shipping)
  SMTP_FROM         Sender email address (default: SMTP_USER)

Examples:
  ./update-smtp-env.sh
  SMTP_USER='you@example.com' ./update-smtp-env.sh
  SMTP_PASSWORD='app-password' SMTP_USER='you@example.com' ./update-smtp-env.sh

Notes:
  - This updates the repo-root .env file, not backend/.env.
  - A timestamped backup is created before editing.
  - Do not commit .env or any SMTP password to git.
USAGE
}

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  usage
  exit 0
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "Error: python3 is required. Install it with: sudo apt-get update && sudo apt-get install -y python3" >&2
  exit 1
fi

ENV_FILE="${ENV_FILE:-.env}"

if [ -z "${SMTP_HOST:-}" ]; then
  SMTP_HOST="smtp.gmail.com"
fi

if [ -z "${SMTP_PORT:-}" ]; then
  SMTP_PORT="587"
fi

if [ -z "${SMTP_SECURE:-}" ]; then
  SMTP_SECURE="false"
fi

if [ -z "${SMTP_FROM_NAME:-}" ]; then
  SMTP_FROM_NAME="BestDeal Shipping"
fi

if [ -z "${SMTP_USER:-}" ]; then
  if [ -t 0 ]; then
    read -rp "SMTP username/email: " SMTP_USER
  else
    echo "Error: SMTP_USER is required in non-interactive mode." >&2
    usage >&2
    exit 1
  fi
fi

if [ -z "${SMTP_USER}" ]; then
  echo "Error: SMTP_USER cannot be empty." >&2
  exit 1
fi

if [ -z "${SMTP_PASSWORD:-}" ]; then
  if [ -t 0 ]; then
    read -rsp "SMTP app password: " SMTP_PASSWORD
    printf '\n'
  else
    echo "Error: SMTP_PASSWORD is required in non-interactive mode." >&2
    usage >&2
    exit 1
  fi
fi

if [ -z "${SMTP_PASSWORD}" ]; then
  echo "Error: SMTP_PASSWORD cannot be empty." >&2
  exit 1
fi

if [ -z "${SMTP_FROM:-}" ]; then
  SMTP_FROM="${SMTP_USER}"
fi

export ENV_FILE SMTP_HOST SMTP_PORT SMTP_SECURE SMTP_USER SMTP_PASSWORD SMTP_FROM_NAME SMTP_FROM

python3 <<'PY'
import datetime
import os
import pathlib
import re
import shutil
import stat
import sys

env_path = pathlib.Path(os.environ["ENV_FILE"])
keys = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_SECURE",
    "SMTP_USER",
    "SMTP_PASSWORD",
    "SMTP_FROM_NAME",
    "SMTP_FROM",
]
values = {key: os.environ[key] for key in keys}

if env_path.exists() and env_path.is_dir():
    print(f"Error: {env_path} is a directory.", file=sys.stderr)
    sys.exit(1)

if env_path.exists():
    timestamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_path = env_path.with_name(f"{env_path.name}.backup-{timestamp}")
    shutil.copy2(env_path, backup_path)
    try:
        current_mode = stat.S_IMODE(env_path.stat().st_mode)
        os.chmod(backup_path, current_mode)
    except OSError:
        pass
    text = env_path.read_text()
else:
    backup_path = None
    text = ""

def quote_env_value(value: str) -> str:
    if value == "":
        return '""'
    if re.search(r'[\s#"\'$`\\]', value):
        escaped = (
            value.replace("\\", "\\\\")
            .replace('"', '\\"')
            .replace("$", "\\$")
            .replace("`", "\\`")
        )
        return f'"{escaped}"'
    return value

lines = text.splitlines(keepends=True)
seen = set()
updated = []
key_pattern = re.compile(r"^([A-Za-z_][A-Za-z0-9_]*)\s*=")

for line in lines:
    line_ending = "\n" if line.endswith("\n") else ""
    body = line[:-1] if line_ending else line
    match = key_pattern.match(body)
    if match and match.group(1) in values:
        key = match.group(1)
        updated.append(f"{key}={quote_env_value(values[key])}{line_ending}")
        seen.add(key)
    else:
        updated.append(line)

missing = [key for key in keys if key not in seen]
if missing:
    if updated and not updated[-1].endswith("\n"):
        updated[-1] += "\n"
    if updated and any(line.strip() for line in updated):
        updated.append("\n")
    updated.append("# SMTP settings used by docker-compose.prod.yml\n")
    for key in missing:
        updated.append(f"{key}={quote_env_value(values[key])}\n")

new_text = "".join(updated)
env_path.write_text(new_text)

if backup_path:
    print(f"Updated {env_path} and created backup {backup_path}")
else:
    print(f"Created {env_path}; no backup was needed because the file did not exist")
PY

echo "Done. Rebuild/restart the backend so Docker picks up the updated SMTP values."
