# Control API Plan — Backend

## Objective
Replace the demo control panel behavior with a production-safe backend control API.

## Architecture Direction
- Keep control operations in `platform-console` (or a dedicated ops service), not in tenant school APIs.
- Reason: control operations need host-level privileges (containers, deploy scripts, backups, logs).

## API Design (Phase 1)
Read-only first:
- `GET /api/instances`
- `GET /api/instances/:id`
- `GET /api/instances/:id/health`
- `GET /api/instances/:id/logs`
- `GET /api/storage/summary`
- `GET /api/deployments`
- `GET /api/audit-log`

Actions:
- `POST /api/instances/:id/actions/restart`
- `POST /api/instances/:id/actions/redeploy`
- `POST /api/instances/:id/actions/backup`
- `POST /api/instances/:id/actions/restore`
- `POST /api/instances/:id/actions/stop`
- `POST /api/actions/redeploy-all`
- `POST /api/actions/backup-all`

Pricing/Billing:
- `GET /api/pricing/plans`
- `POST /api/pricing/plans`
- `PATCH /api/pricing/plans/:id`
- `POST /api/instances/:id/billing/assign-plan`

## Security Model
- Auth: JWT cookie already in `platform-console/server.js`.
- Role rules:
  - `super_admin`: read + action access
  - `platform_owner`: read-only
- Action execution:
  - Strict allowlist of operation IDs.
  - No raw shell command passthrough from request input.
  - For destructive operations, require confirmation token/check phrase.

## Data Model Additions
- `instances` registry
  - id, name, domain, ports, compose project/container names, db name, status
- `control_audit_log`
  - id, actor, role, action, target, status, metadata, created_at
- `deploy_events`
  - id, version, scope, status, started_at, completed_at

## Rollout Steps
1. Add read-only endpoints backed by a static registry file or DB table.
2. Wire real health/log reads for one instance.
3. Add audited action runner with allowlisted actions.
4. Enable multi-instance actions (`*-all`) with per-target event logging.
5. Replace demo UI data fetches in `platform-console/app.js` with live API calls.
6. Add integration tests for role enforcement and action audit trail.
