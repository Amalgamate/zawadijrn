# School ERP — Apps Module

**Location:** `Settings > Apps`
**Version:** 1.0.0
**Last Updated:** 2026-04-20

---

## Overview

The Apps module is a control panel inside Settings that allows school administrators
and super admins to enable or disable feature modules across the ERP. It mirrors the
mental model of Odoo's app management — toggling a switch turns a feature on or off
system-wide for that school.

---

## Role Hierarchy

```
Super Admin
  └── Can toggle any app
  └── Can lock apps as "mandatory" (school admin cannot change)
  └── Can hide apps from school admin view entirely
  └── Has full audit log access

School Admin
  └── Can toggle only unlocked apps
  └── Sees mandatory apps as locked (read-only)
  └── Cannot see restricted/hidden apps
  └── Has limited audit log (their own actions only)

Staff / Teacher
  └── No access to Settings > Apps
```

---

## App States

| State | Icon | Meaning |
|---|---|---|
| Active | Green toggle | Module is enabled and accessible |
| Inactive | Grey toggle | Module is disabled, routes return 403 |
| Mandatory | Lock icon | Forced on by super admin, cannot be toggled |
| Restricted | — | Hidden from school admin entirely |

---

## App Categories

| Category | Apps |
|---|---|
| Core | Student Registry, Academic Year |
| Academics | Timetable, Gradebook, Exams, Attendance, Library, Curriculum |
| Finance | Fee Management, Payroll, Budgeting |
| Communication | SMS & Notifications, Parent Portal, Announcements |
| HR | Staff HR, Transport, Hostel |
| Reports | Analytics, Custom Reports |

---

## Dependency System

Apps can declare dependencies. When you enable an app, its dependencies are
automatically enabled. When you try to disable an app that another active app
depends on, you get a warning prompt listing what will also be disabled.

Example dependency chain:
```
Exams → requires → Timetable, Gradebook
Parent Portal → requires → Student Registry, SMS & Notifications
Fee Management → requires → Student Registry
```

Dependencies are enforced at the API level — not just UI.

---

## Database Schema

### `apps` (seed table — app definitions)

```sql
id            UUID PRIMARY KEY
slug          VARCHAR(50) UNIQUE NOT NULL   -- e.g. "gradebook"
name          VARCHAR(100) NOT NULL
description   TEXT
category      VARCHAR(50)
icon          VARCHAR(10)                   -- emoji or icon name
sort_order    INT DEFAULT 0
dependencies  TEXT[]                        -- array of slugs
is_system     BOOLEAN DEFAULT FALSE         -- hidden from all admins
created_at    TIMESTAMPTZ DEFAULT NOW()
```

### `school_app_configs` (per-school state)

```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
school_id     UUID NOT NULL REFERENCES schools(id)
app_id        UUID NOT NULL REFERENCES apps(id)
is_active     BOOLEAN DEFAULT FALSE
is_mandatory  BOOLEAN DEFAULT FALSE         -- only super admin can set
is_visible    BOOLEAN DEFAULT TRUE          -- only super admin can set
updated_at    TIMESTAMPTZ DEFAULT NOW()
updated_by    UUID REFERENCES users(id)
UNIQUE(school_id, app_id)
```

### `app_audit_logs`

```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
school_id     UUID NOT NULL REFERENCES schools(id)
app_id        UUID NOT NULL REFERENCES apps(id)
action        VARCHAR(20) NOT NULL         -- 'activated' | 'deactivated' | 'locked' | 'unlocked'
performed_by  UUID NOT NULL REFERENCES users(id)
role_at_time  VARCHAR(30) NOT NULL
ip_address    INET
user_agent    TEXT
created_at    TIMESTAMPTZ DEFAULT NOW()
```

---

## API Endpoints

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/settings/apps` | Admin+ | List all apps with current state |
| PATCH | `/api/settings/apps/:slug/toggle` | Admin+ | Enable/disable an app |
| PATCH | `/api/settings/apps/:slug/mandatory` | Super Admin | Lock/unlock mandatory |
| PATCH | `/api/settings/apps/:slug/visibility` | Super Admin | Show/hide from admin |
| GET | `/api/settings/apps/audit` | Super Admin | Full audit log |
| GET | `/api/settings/apps/audit/mine` | Admin | Own actions only |

---

## Route Gating

Every protected route in the ERP checks if its module is active before rendering.
This check happens in the `requireApp` middleware:

```
Request → Auth middleware → requireApp('gradebook') → Route handler
                                    ↓
                         app inactive? → 403 { code: 'APP_DISABLED' }
```

Frontend checks the same state via the `useApps()` hook and hides nav links
for inactive modules to prevent confusion.

---

## Security Hardening Checklist

See `HARDENING.md` for the full process.

Quick summary:
- All toggle actions are server-side — never trust frontend state alone
- Role is re-verified on every request (not cached)
- Mandatory flag can only be changed by super admin, enforced in middleware
- Audit log is append-only (no UPDATE/DELETE on that table)
- Rate limiting on toggle endpoint: max 20 changes per minute per user
- CSRF tokens required on all PATCH requests
- All inputs validated and sanitised before DB queries

---

## Frontend Structure

```
src/
  pages/settings/
    AppsPage.jsx             — page wrapper, lives at /settings/apps
  components/apps/
    AppGrid.jsx              — grid of app cards by category
    AppCard.jsx              — individual card with toggle + lock
    AppDepsModal.jsx         — confirmation modal for dependency warnings
    AppAuditLog.jsx          — audit log table (super admin only)
  hooks/
    useApps.js               — fetch, toggle, mandatory actions + state
    useAppGate.js            — per-route "is this app active?" hook
  middleware/ (backend)
    requireApp.js            — Express middleware for route gating
```

---

## Testing Strategy

| Layer | Tool | Coverage target |
|---|---|---|
| Unit — hooks | Jest + React Testing Library | 90% |
| Unit — backend controller | Jest + Supertest | 90% |
| Integration — DB | Jest + test DB | Critical paths |
| E2E | Playwright | Happy path + role gates |

See `tests/` directory for all test files.

---

## Changelog

| Version | Date | Notes |
|---|---|---|
| 1.0.0 | 2026-04-20 | Initial release |
