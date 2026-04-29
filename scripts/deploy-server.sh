#!/usr/bin/env bash
set -euo pipefail

# Deploy the latest published GHCR images to all live Zawadi instances.
# Usage:
#   bash scripts/deploy-server.sh
# Optional env:
#   SERVER_HOST=185.127.16.124
#   SERVER_USER=deploy
#   APPS_DIR=/srv/zawadi/apps
#   MAIN_DIR=/srv/zawadi/apps/zawadijrn

SERVER_HOST="${SERVER_HOST:-185.127.16.124}"
SERVER_USER="${SERVER_USER:-deploy}"
APPS_DIR="${APPS_DIR:-/srv/zawadi/apps}"
MAIN_DIR="${MAIN_DIR:-/srv/zawadi/apps/zawadijrn}"

echo "[deploy] Host: ${SERVER_USER}@${SERVER_HOST}"
echo "[deploy] Images: ghcr.io/amalgamate/zawadi-frontend:latest, ghcr.io/amalgamate/zawadi-backend:latest"

ssh "${SERVER_USER}@${SERVER_HOST}" "APPS_DIR='${APPS_DIR}' MAIN_DIR='${MAIN_DIR}' bash -s" <<'REMOTE'
set -euo pipefail

deploy_main() {
  echo "[deploy] Main instance: pull images"
  cd "${MAIN_DIR}"
  sudo docker compose pull backend frontend

  echo "[deploy] Main instance: sync database schema"
  sudo docker compose run -T --rm backend npx prisma db push --skip-generate < /dev/null

  echo "[deploy] Main instance: recreate app containers"
  sudo docker compose up -d --pull always --force-recreate backend frontend
}

deploy_school_stack() {
  local project="$1"
  local env_file="$2"

  echo "[deploy] ${project}: pull images"
  cd "${APPS_DIR}"
  sudo docker compose --env-file "${env_file}" -p "${project}" -f docker-compose.stack.yml pull backend frontend

  echo "[deploy] ${project}: sync database schema"
  sudo docker compose --env-file "${env_file}" -p "${project}" -f docker-compose.stack.yml run -T --rm backend npx prisma db push --skip-generate < /dev/null

  echo "[deploy] ${project}: recreate app containers"
  sudo docker compose --env-file "${env_file}" -p "${project}" -f docker-compose.stack.yml up -d --pull always --force-recreate backend frontend
}

healthcheck() {
  local port="$1"
  echo "[deploy] Health check :${port}"
  for attempt in {1..30}; do
    if curl -fsS "http://185.127.16.124:${port}/api/health" >/dev/null; then
      return 0
    fi
    echo "[deploy] Health check :${port} waiting (${attempt}/30)"
    sleep 2
  done

  curl -fsS "http://185.127.16.124:${port}/api/health" >/dev/null
}

deploy_main
deploy_school_stack "schoolb" "${APPS_DIR}/.env.school-b"
deploy_school_stack "schoolc" "${APPS_DIR}/.env.school-c"

echo "[deploy] Container status"
sudo docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'

healthcheck 5000
healthcheck 5001
healthcheck 5002

echo "[deploy] Done."
REMOTE
