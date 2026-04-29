#!/usr/bin/env bash
set -euo pipefail

# One-command deploy for Kamatera host
# Usage:
#   bash scripts/deploy-server.sh
# Optional env:
#   SERVER_HOST=185.127.16.124
#   SERVER_USER=deploy
#   APP_DIR=/srv/zawadi/apps/zawadijrn
#   SCHOOLB_ENV=/srv/zawadi/apps/.env.school-b

SERVER_HOST="${SERVER_HOST:-185.127.16.124}"
SERVER_USER="${SERVER_USER:-deploy}"
APP_DIR="${APP_DIR:-/srv/zawadi/apps/zawadijrn}"
SCHOOLB_ENV="${SCHOOLB_ENV:-/srv/zawadi/apps/.env.school-b}"

echo "[deploy] Host: ${SERVER_USER}@${SERVER_HOST}"
echo "[deploy] App dir: ${APP_DIR}"

ssh "${SERVER_USER}@${SERVER_HOST}" "bash -lc '
  set -euo pipefail
  cd \"${APP_DIR}\"

  echo \"[deploy] Pulling latest main...\"
  git fetch origin main
  git checkout main
  git pull --ff-only origin main

  echo \"[deploy] Building and restarting school A...\"
  sudo docker compose build backend frontend
  sudo docker compose up -d backend frontend

  echo \"[deploy] Restarting school B with latest images...\"
  cd /srv/zawadi/apps
  sudo docker compose --project-name schoolb --env-file \"${SCHOOLB_ENV}\" -f docker-compose.stack.yml up -d backend frontend

  echo \"[deploy] Status school A\"
  cd \"${APP_DIR}\"
  sudo docker compose ps

  echo \"[deploy] Status school B\"
  cd /srv/zawadi/apps
  sudo docker compose --project-name schoolb --env-file \"${SCHOOLB_ENV}\" -f docker-compose.stack.yml ps

  echo \"[deploy] Health checks\"
  curl -fsS http://185.127.16.124:5000/api/health >/dev/null
  curl -fsS http://185.127.16.124:5001/api/health >/dev/null
  echo \"[deploy] Done.\"
'"
