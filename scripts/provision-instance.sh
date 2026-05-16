#!/usr/bin/env bash
set -euo pipefail

# Provision one school stack from JSON payload.
# Payload keys:
#   name, domain, type, fePort, bePort, db, requestedBy
# Example:
#   ./provision-instance.sh '{"name":"School D","domain":"schoold.elimucrown.co.ke","fePort":3003,"bePort":5003,"db":"trends_core_school_d","requestedBy":"admin@elimucrown.co.ke"}'

PAYLOAD_JSON="${1:-}"
if [[ -z "${PAYLOAD_JSON}" ]]; then
  echo "missing payload json" >&2
  exit 2
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required for payload parsing" >&2
  exit 2
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker cli is required on runtime host" >&2
  exit 2
fi

if ! command -v openssl >/dev/null 2>&1; then
  echo "openssl is required for secret generation" >&2
  exit 2
fi

# Directory/layout defaults align with deploy-server.sh conventions.
APPS_DIR="${APPS_DIR:-/srv/zawadi/apps}"
STACK_COMPOSE_FILE="${STACK_COMPOSE_FILE:-${APPS_DIR}/docker-compose.stack.yml}"
ENV_DIR="${ENV_DIR:-${APPS_DIR}/env}"
FRONTEND_IMAGE="${FRONTEND_IMAGE:-ghcr.io/amalgamate/zawadi-frontend:latest}"
BACKEND_IMAGE="${BACKEND_IMAGE:-ghcr.io/amalgamate/zawadi-backend:latest}"
DEFAULT_HOST_IP="${DEFAULT_HOST_IP:-185.127.16.124}"

mkdir -p "${ENV_DIR}"

# Parse and sanitize payload via jq.
mapfile -t PARSED < <(printf '%s' "${PAYLOAD_JSON}" | jq -r '
  def clean: (tostring | gsub("^\\s+|\\s+$"; ""));
  def slug:
    clean
    | ascii_downcase
    | gsub("[^a-z0-9]+"; "-")
    | gsub("^-+|-+$"; "");

  . as $p
  | ($p.name // "" | clean) as $name
  | if $name == "" then error("name is required") else . end
  | ($name | slug) as $slug
  | if $slug == "" then error("name produced empty slug") else . end
  | ($p.domain // "" | clean) as $domain
  | ($p.requestedBy // "" | clean) as $requestedBy
  | ($p.type // "" | clean) as $type
  | ($p.db // "" | clean) as $dbName
  | [
      $name,
      $slug,
      (if $domain == "" then "\($slug).elimucrown.co.ke" else $domain end),
      (if $requestedBy == "" then "console" else $requestedBy end),
      (if $type == "" then "PRIMARY_CBC" else $type end),
      (if $dbName == "" then "zawadi_\($slug|gsub("-"; "_"))" else $dbName end),
      ((($p.fePort // 0) | tonumber? // 0) | tostring),
      ((($p.bePort // 0) | tonumber? // 0) | tostring)
    ][]
')

if [[ "${#PARSED[@]}" -lt 8 ]]; then
  echo "invalid json payload" >&2
  exit 2
fi

SCHOOL_NAME="${PARSED[0]}"
SCHOOL_SLUG="${PARSED[1]}"
SCHOOL_DOMAIN="${PARSED[2]}"
REQUESTED_BY="${PARSED[3]}"
SCHOOL_TYPE="${PARSED[4]}"
DB_NAME="${PARSED[5]}"
REQ_FE_PORT="${PARSED[6]}"
REQ_BE_PORT="${PARSED[7]}"

PROJECT_NAME="zawadi-${SCHOOL_SLUG}"
ENV_FILE="${ENV_DIR}/.${PROJECT_NAME}.env"

if [[ ! -f "${STACK_COMPOSE_FILE}" ]]; then
  echo "stack compose file not found: ${STACK_COMPOSE_FILE}" >&2
  exit 2
fi

if [[ -f "${ENV_FILE}" ]]; then
  echo "env file already exists for ${PROJECT_NAME}: ${ENV_FILE}" >&2
  exit 3
fi

port_in_use() {
  local p="$1"
  docker ps --format '{{.Ports}}' | grep -E "(^|[ ,:])${p}->|:${p}-" >/dev/null 2>&1
}

next_free_port() {
  local start="$1"
  local p="$start"
  while port_in_use "$p"; do
    p=$((p+1))
    if [[ "$p" -gt 65000 ]]; then
      echo "no free port found above ${start}" >&2
      exit 4
    fi
  done
  echo "$p"
}

if [[ "${REQ_FE_PORT}" =~ ^[0-9]+$ ]] && [[ "${REQ_FE_PORT}" -gt 0 ]]; then
  FE_PORT="${REQ_FE_PORT}"
else
  FE_PORT="$(next_free_port 3000)"
fi

if [[ "${REQ_BE_PORT}" =~ ^[0-9]+$ ]] && [[ "${REQ_BE_PORT}" -gt 0 ]]; then
  BE_PORT="${REQ_BE_PORT}"
else
  BE_PORT="$(next_free_port 5000)"
fi

if [[ "${FE_PORT}" == "${BE_PORT}" ]]; then
  BE_PORT="$(next_free_port $((BE_PORT+1)))"
fi

if port_in_use "${FE_PORT}"; then
  echo "frontend port already in use: ${FE_PORT}" >&2
  exit 4
fi
if port_in_use "${BE_PORT}"; then
  echo "backend port already in use: ${BE_PORT}" >&2
  exit 4
fi

DB_USER="zawadi"
DB_PASSWORD="$(openssl rand -hex 16)"
JWT_SECRET="$(openssl rand -hex 32)"
JWT_REFRESH_SECRET="$(openssl rand -hex 32)"
ENCRYPTION_KEY="$(openssl rand -hex 32)"

FRONTEND_URL="http://${DEFAULT_HOST_IP}:${FE_PORT}"
API_URL="http://${DEFAULT_HOST_IP}:${BE_PORT}/api"
CORS_ORIGIN="${FRONTEND_URL}"

cat > "${ENV_FILE}" <<EOF
SCHOOL_CODE=${SCHOOL_SLUG}
FRONTEND_IMAGE=${FRONTEND_IMAGE}
BACKEND_IMAGE=${BACKEND_IMAGE}
FRONTEND_PORT=${FE_PORT}
BACKEND_PORT=${BE_PORT}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}
SUPER_ADMIN_EMAIL=admin@trendscore.app
SUPER_ADMIN_PASSWORD=Admin@123!
CREATE_EXTRA_DEMO_USERS=false
DEMO_USER_PASSWORD=Demo@123!
FRONTEND_URL=${FRONTEND_URL}
API_URL=${API_URL}
CORS_ORIGIN=${CORS_ORIGIN}
HTTPS_ONLY=false
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@example.com
EOF

echo "[provision] env file created: ${ENV_FILE}"

pushd "${APPS_DIR}" >/dev/null

echo "[provision] creating/updating stack ${PROJECT_NAME}"
docker compose --env-file "${ENV_FILE}" -p "${PROJECT_NAME}" -f "${STACK_COMPOSE_FILE}" up -d db backend frontend

echo "[provision] applying prisma schema"
docker compose --env-file "${ENV_FILE}" -p "${PROJECT_NAME}" -f "${STACK_COMPOSE_FILE}" run -T --rm backend npx prisma db push --skip-generate < /dev/null

echo "[provision] restarting app containers"
docker compose --env-file "${ENV_FILE}" -p "${PROJECT_NAME}" -f "${STACK_COMPOSE_FILE}" up -d --force-recreate backend frontend

popd >/dev/null

# Health checks
check_url() {
  local url="$1"
  local label="$2"
  local n
  for n in {1..30}; do
    if curl -fsS "${url}" >/dev/null 2>&1; then
      echo "[provision] ${label} ok: ${url}"
      return 0
    fi
    sleep 2
  done
  echo "[provision] ${label} failed: ${url}" >&2
  return 1
}

check_url "http://${DEFAULT_HOST_IP}:${BE_PORT}/api/health" "backend health"
check_url "http://${DEFAULT_HOST_IP}:${FE_PORT}/" "frontend health"

RESULT_JSON=$(jq -n \
  --arg projectName "${PROJECT_NAME}" \
  --arg envFile "${ENV_FILE}" \
  --arg schoolName "${SCHOOL_NAME}" \
  --arg domain "${SCHOOL_DOMAIN}" \
  --arg institutionType "${SCHOOL_TYPE}" \
  --argjson frontendPort "${FE_PORT}" \
  --argjson backendPort "${BE_PORT}" \
  --arg dbName "${DB_NAME}" \
  --arg requestedBy "${REQUESTED_BY}" \
  '{ok:true, projectName:$projectName, envFile:$envFile, schoolName:$schoolName, domain:$domain, institutionType:$institutionType, frontendPort:$frontendPort, backendPort:$backendPort, dbName:$dbName, requestedBy:$requestedBy}')

echo "${RESULT_JSON}"
