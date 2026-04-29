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
#   CONSOLE_IMAGE=ghcr.io/amalgamate/zawadi-console:latest
#   CONSOLE_PORT=3100
#   CONSOLE_ENV_FILE=/srv/zawadi/apps/.env.console

SERVER_HOST="${SERVER_HOST:-185.127.16.124}"
SERVER_USER="${SERVER_USER:-deploy}"
APPS_DIR="${APPS_DIR:-/srv/zawadi/apps}"
MAIN_DIR="${MAIN_DIR:-/srv/zawadi/apps/zawadijrn}"
CONSOLE_IMAGE="${CONSOLE_IMAGE:-ghcr.io/amalgamate/zawadi-console:latest}"
CONSOLE_PORT="${CONSOLE_PORT:-3100}"
CONSOLE_ENV_FILE="${CONSOLE_ENV_FILE:-${APPS_DIR}/.env.console}"

echo "[deploy] Host: ${SERVER_USER}@${SERVER_HOST}"
echo "[deploy] Images: ghcr.io/amalgamate/zawadi-frontend:latest, ghcr.io/amalgamate/zawadi-backend:latest, ${CONSOLE_IMAGE}"

ssh "${SERVER_USER}@${SERVER_HOST}" "APPS_DIR='${APPS_DIR}' MAIN_DIR='${MAIN_DIR}' CONSOLE_IMAGE='${CONSOLE_IMAGE}' CONSOLE_PORT='${CONSOLE_PORT}' CONSOLE_ENV_FILE='${CONSOLE_ENV_FILE}' bash -s" <<'REMOTE'
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

deploy_console() {
  echo "[deploy] Platform console: pull image"
  sudo docker pull "${CONSOLE_IMAGE}"

  if ! sudo test -f "${CONSOLE_ENV_FILE}"; then
    echo "[deploy] Missing console environment file: ${CONSOLE_ENV_FILE}" >&2
    echo "[deploy] Create it with CONSOLE_JWT_SECRET and at least one console user before deploying." >&2
    exit 1
  fi

  echo "[deploy] Platform console: recreate container on :${CONSOLE_PORT}"
  sudo docker rm -f zawadi-console >/dev/null 2>&1 || true
  sudo docker run -d \
    --name zawadi-console \
    --restart always \
    --label com.zawadi.service=platform-console \
    --env-file "${CONSOLE_ENV_FILE}" \
    -p "${CONSOLE_PORT}:3100" \
    "${CONSOLE_IMAGE}"
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

site_healthcheck() {
  local port="$1"
  echo "[deploy] Site health check :${port}"
  for attempt in {1..30}; do
    if curl -fsS "http://185.127.16.124:${port}/health" >/dev/null; then
      return 0
    fi
    echo "[deploy] Site health check :${port} waiting (${attempt}/30)"
    sleep 2
  done

  curl -fsS "http://185.127.16.124:${port}/health" >/dev/null
}

deploy_main
deploy_school_stack "schoolb" "${APPS_DIR}/.env.school-b"
deploy_school_stack "schoolc" "${APPS_DIR}/.env.school-c"
deploy_console

echo "[deploy] Container status"
sudo docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'

healthcheck 5000
healthcheck 5001
healthcheck 5002
site_healthcheck "${CONSOLE_PORT}"

echo "[deploy] Done."
REMOTE
