# Portainer Multi-School Deployment (Independent Stacks)

This pattern gives full independence per institution while still reusing one server.

## Architecture
- One stack per institution.
- One Postgres per institution.
- One backend per institution.
- One frontend per institution.
- One isolated Docker network per institution (via stack scoping).
- Separate env values and secrets per institution.

## What to share
- Docker host (VM).
- Docker images (same app release tag).
- Reverse proxy service (Nginx Proxy Manager / Traefik).
- Monitoring/logging services.

## What not to share
- Database container/data.
- Upload/storage volumes.
- JWT secrets and API keys.
- Redis/cache state (unless fully isolated).

## File usage
- Stack file: `deploy/portainer/docker-compose.stack.yml`
- Env template: `deploy/portainer/.env.school.template`

## Deploy first school on IP + ports (3000/5000)
1. In Portainer, create a new stack: `zawadi-school-a`.
2. Paste `docker-compose.stack.yml` into the stack editor.
3. In environment variables, add all vars from `.env.school.template`.
4. Set:
   - `FRONTEND_PORT=3000`
   - `BACKEND_PORT=5000`
   - `FRONTEND_URL=http://<SERVER_IP>:3000`
   - `API_URL=http://<SERVER_IP>:5000/api`
   - `CORS_ORIGIN=http://<SERVER_IP>:3000`
5. Deploy stack.
6. Test:
   - `http://<SERVER_IP>:3000`
   - `http://<SERVER_IP>:5000/api/health` (or your health endpoint)

## Deploy second school (example 3001/5001)
1. Create stack `zawadi-school-b`.
2. Use same compose file.
3. Change at minimum:
   - `FRONTEND_PORT=3001`
   - `BACKEND_PORT=5001`
   - `DB_NAME=zawadi_school_b`
   - `DB_PASSWORD`, `JWT_SECRET`, `JWT_REFRESH_SECRET`
   - `FRONTEND_URL=http://<SERVER_IP>:3001`
   - `API_URL=http://<SERVER_IP>:5001/api`
   - `CORS_ORIGIN=http://<SERVER_IP>:3001`
4. Deploy stack.

## Firewall
Open only the ports you expose publicly.
- Example:
  - `3000/tcp`, `5000/tcp` for school A
  - `3001/tcp`, `5001/tcp` for school B

## Recommended next step (production hardening)
- Move from direct ports to domains through Nginx Proxy Manager.
- Keep backend ports private and expose only 80/443 publicly.
- Add nightly backups per school database volume.
