# Zawadi SMS — Architecture

## System Design: Single-Tenant

Zawadi SMS is a **single-school system**. It serves exactly one school installation. There is no concept of tenants, subdomains, branches, plans, subscriptions, or trial periods anywhere in this codebase.

This was an intentional design decision made early in the project. Any code that appears to reference these concepts is either a pass-through stub retained for import compatibility, or should be treated as dead code.

---

## Core Stack

| Layer         | Technology                                      |
|---------------|-------------------------------------------------|
| Frontend      | React 18 + Tailwind CSS                         |
| Backend       | Node.js + Express + TypeScript                  |
| Database      | PostgreSQL (Supabase) via Prisma ORM            |
| Auth          | JWT (access + refresh token rotation)           |
| Cache         | Redis (production) / in-memory (development)    |
| SMS           | Africa's Talking or MobileSasa                  |
| WhatsApp      | whatsapp-web.js (Puppeteer session)             |
| Email         | Resend                                          |
| File Storage  | Cloudinary                                      |
| Payments      | Safaricom Daraja API (M-Pesa STK Push)          |
| Real-time     | Socket.io                                       |

---

## Directory Structure

```
/                         Frontend (React) + root config
/server                   Backend API (Express + TypeScript)
/server/src/controllers   Route handlers
/server/src/services      Business logic
/server/src/middleware     Express middleware
/server/src/routes         Route definitions
/server/src/utils          Shared utilities
/server/prisma             Database schema + migrations
/server/_archive           Archived dev scripts (not deployed)
/_archive                  Archived root-level dev scripts (not deployed)
```

---

## Key Design Decisions

### No Multi-Tenancy
The system has one `School` record. All controllers use `prisma.school.findFirst()` — there is no `schoolId` filtering by tenant. The following files exist only for import compatibility and do nothing:

- `middleware/subdomain.middleware.ts` — pass-through
- `middleware/subdomain-auth.middleware.ts` — pass-through
- `middleware/portalTenant.middleware.ts` — pass-through
- `middleware/subscription.middleware.ts` — pass-through
- `middleware/trial.guard.ts` — pass-through
- `services/subdomain.service.ts` — stub
- `routes/subdomain.routes.ts` — empty router
- `routes/tenant.routes.ts` — empty router
- `routes/schools.routes.ts` — empty router
- `routes/onboarding.routes.ts` — empty router

Do not add logic to these files. Do not re-introduce tenancy concepts.

### Authentication
JWT-based with access tokens (short-lived) and refresh tokens (long-lived). Roles enforced via `requireRole()` and `requirePermission()` middleware. Role hierarchy defined in `src/config/permissions.ts`.

### CBC Assessment Flow
1. Teachers record **Formative** assessments (strand-based rubrics) throughout the term.
2. Teachers record **Summative** results against pre-created tests.
3. System aggregates scores using configurable strategies (simple average, best-N, drop-lowest-N).
4. Reports are generated as PDFs and sent to parents via SMS/WhatsApp.
5. AI pathway prediction (`ai-assistant.service.ts`) is fully rule-based — no external AI API calls.

### Communication
All parent notifications go through `sms.service.ts` or `whatsapp.service.ts`. Channel selection is configurable in `CommunicationConfig`. Audit records are written to `AssessmentSmsAudit` for every send attempt.

### Caching
Dual-strategy: Redis in production (`redis-cache.service.ts`), in-memory fallback in development (`cache.service.ts`). Cache is keyed by domain prefix (e.g. `grading:`, `tests:`) and busted explicitly after writes.

### Database
Single Prisma schema at `server/prisma/schema.prisma`. Migrations are in `server/prisma/migrations/`. Run with `npx prisma migrate deploy` in production.

---

## Environment Variables

Both `/server/.env` and root `/.env` are required. See `.env.example` in each directory for required keys. Never commit `.env` files.

---

## _archive Folders

`/server/_archive` and `/_archive` contain old dev/debug scripts moved out of the active codebase. They are excluded from deployment via `.gitignore` and should not be imported or referenced. They exist only as a recoverable history.

---

## What This System Is Not

- Not a SaaS platform
- Not multi-school
- Not multi-branch
- Not subscription-based
- Not trial-gated
- Not subdomain-routed

If you find yourself writing code that assumes any of the above, stop and re-read this document.

---

*Last updated: March 2026 — Amalgamate*
