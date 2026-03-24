# Zawadi SMS — Senior Engineering Review
**Date:** March 2026 | **Reviewer:** Senior Engineer Audit  
**Scope:** Full-stack (React 18 frontend + Node/Express/TypeScript backend + Prisma/Supabase)

---

## Executive Summary

The project is well-structured for a school management system of this scale. The architecture is
sound, security fundamentals are in place, and the codebase shows evidence of iterative hardening
(env validation, rate limiting, response sanitisation, CORS lockdown). However there are several
areas where technical debt has accumulated that should be addressed before a wider rollout.

Findings are grouped by priority: **Critical** (fix before go-live), **High** (fix this sprint),
**Medium** (fix next sprint), and **Low** (backlog / nice-to-have).

---

## CRITICAL

### C1 — `.env.production` is tracked in the repository

**Location:** `server/.env.production`, `/.env.production`  
**Risk:** CRITICAL — Database credentials, JWT secrets, encryption keys, and SMS API keys are
exposed to anyone with repo access.

The `.gitignore` correctly lists `.env` and `server/.env`, but `.env.production` is not excluded
and appears to be committed.

**Fix:**
```gitignore
# Add to both .gitignore files
.env.production
server/.env.production
*.env.production
```
Then rotate **all** secrets: JWT_SECRET, JWT_REFRESH_SECRET, ENCRYPTION_KEY, database password,
and any SMS/WhatsApp API keys immediately. These must be treated as compromised.

---

### C2 — WhatsApp session data committed to repo

**Location:** `server/.wwebjs_auth/` (full Chromium profile including cookies, IndexedDB, Login Data)

This directory contains active WhatsApp Web session credentials. It should never be committed.
It is in the server `.gitignore` already but the directory is present and tracked.

**Fix:**
```bash
git rm -r --cached server/.wwebjs_auth/
```
Add to `.gitignore`:
```
server/.wwebjs_auth/
server/.wwebjs_cache/
```

---

### C3 — `50mb` JSON body parser limit is too large

**Location:** `server/src/server.ts` lines `express.json({ limit: '50mb' })`

This allows any unauthenticated request to send a 50 MB JSON body, enabling trivial DoS attacks
against the server. The only legitimate use case for large payloads is photo uploads (base64).

**Fix:** Reduce global limit to `1mb` and apply `10mb` only to the specific upload routes:
```typescript
app.use(express.json({ limit: '1mb' }));
// In learner routes only:
router.post('/:id/photo', express.json({ limit: '10mb' }), uploadPhoto);
```

---

### C4 — Rate limiter is in-memory and does not persist across restarts

**Location:** `server/src/middleware/enhanced-rateLimit.middleware.ts`

The comment in the file correctly identifies this: *"NOTE: This resets on server restart and does
not share state across multi-instance clusters."* Every server restart resets all rate limit
counters. A brute-force attacker can simply wait for/trigger a restart to bypass login rate
limiting entirely.

**Fix:** `redis-cache.service.ts` already exists with Redis support. Wire the rate limiter to use
Redis. Minimum: persist the auth rate limit store to Redis even if everything else stays in memory.

---

## HIGH

### H1 — `auditLog` middleware is a console.log stub — no actual persistence

**Location:** `server/src/middleware/permissions.middleware.ts` (bottom of file)

The `auditLog` middleware is applied to dozens of sensitive operations (SAVE_COMMUNICATION_CONFIG,
SEND_BIRTHDAY_WISHES, DELETE_CONTACT_GROUP, CREATE_CONTACT_GROUP, etc.) but only prints to
stdout. There is no database record, so there is no audit trail.

**Fix:** Implement a proper `AuditLog` Prisma model and write to it:
```typescript
export const auditLog = (action: string) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      await prisma.auditLog.create({
        data: {
          action,
          userId:    req.user?.userId || null,
          userEmail: req.user?.email || null,
          userRole:  req.user?.role || null,
          ipAddress: req.ip || null,
          method:    req.method,
          path:      req.path,
          params:    JSON.stringify(req.params),
        }
      });
    } catch (e) {
      console.error('[AUDIT] Failed to write audit log:', e);
    }
    next();
  };
};
```

---

### H2 — `CBCGradingSystem.jsx` is a 900+ line God Component

**Location:** `src/components/CBCGrading/CBCGradingSystem.jsx`

This file is the entire application router, state manager, and event handler hub. It currently
manages: all page routing, editing state for learners/teachers/parents, all CRUD handlers,
notification state, confirm dialogs, and modal state. This makes it:
- Impossible to unit test
- A merge conflict magnet
- A performance problem (every state change re-renders the entire app)

**Fix:** Extract into 3 focused files:
- `AppRouter.jsx` — switch/case rendering only
- `LearnerHandlers.js` — all learner CRUD callbacks
- `AppState.jsx` — modal/dialog/notification state

This is a 2–3 hour refactor that will pay back immediately in debuggability.

---

### H3 — `api.js` is 1,100+ lines — a single file for the entire API layer

**Location:** `src/services/api.js`

Every frontend service call goes through this one file. It's already been a source of bugs
(the `api.notifications` stub). When two developers edit it simultaneously, conflicts are
guaranteed.

**Fix:** Split by domain, which already exists logically within the file:
```
src/services/
  auth.api.js
  learners.api.js
  assessments.api.js
  notifications.api.js
  communication.api.js
  fees.api.js
  ...
  index.js  ← re-exports the default `api` object
```

---

### H4 — No refresh token rotation — tokens are effectively permanent

**Location:** `server/src/utils/jwt.util.ts`

Access tokens expire in 15 minutes (`JWT_EXPIRES_IN || '15m'`), but refresh tokens expire in 7
days (`JWT_REFRESH_EXPIRES_IN || '7d'`). There is no refresh token rotation or revocation list.
Once a refresh token is issued, it works for 7 full days even if the user logs out or changes
their password.

**Fix:** On each refresh token use, issue a new refresh token and invalidate the old one. Store
used refresh tokens in a Redis set or a `RefreshToken` DB table with a `revokedAt` column.

---

### H5 — Photo data stored as base64 in the database

**Location:** `server/src/controllers/learner.controller.ts` — `photoUrl: photo`  
**Location:** `src/components/CBCGrading/pages/AdmissionsPage.jsx` — base64 string in formData

Storing base64 photos in the DB inflates every learner record by ~100–200 KB, kills query
performance, and will cause the DB to grow uncontrollably as the school scales.

**Fix:** Cloudinary is already installed (`"cloudinary": "^2.9.0"` in server `package.json`) and
a `document.service.ts` exists. Route photo uploads through Cloudinary and store only the URL:
```typescript
// server/src/controllers/learner.controller.ts
if (photo && photo.startsWith('data:image')) {
  const result = await cloudinary.uploader.upload(photo, { folder: 'zawadi/photos' });
  updateData.photoUrl = result.secure_url;
}
```

---

### H6 — Draft auto-save in `AdmissionsPage` leaks edit-mode data into new admissions

**Location:** `src/components/CBCGrading/pages/AdmissionsPage.jsx`

When a user edits an existing learner, the form auto-saves to `localStorage` under the key
`admission-form-draft` every 2 seconds. If they then click "Add New Student", the draft (which
contains the existing learner's `id`) is restored, silently including the `id` in the new
admission form — which can cause the create path to behave unexpectedly.

`handleAddLearner` does `localStorage.removeItem('admission-form-draft')` before navigating, but
there's a 2-second debounce window where the draft may not yet be cleared.

**Fix:** Never store `id` in the localStorage draft. Only persist the draft when `isEdit` is false:
```javascript
useEffect(() => {
  if (isEdit) return; // Never auto-save edit mode to draft
  const isInitial = ...
  ...
}, [formData, initialFormData, isEdit]);
```

---

## MEDIUM

### M1 — Three separate cache implementations in use simultaneously

The project has:
1. `server/src/services/cache.service.ts` — in-memory server cache (used by assessment/grading)
2. `server/src/services/redis-cache.service.ts` — Redis-backed server cache (unused in practice)
3. `server/src/middleware/enhanced-rateLimit.middleware.ts` — its own in-memory store object

These should be unified behind `redis-cache.service.ts` which already has memory fallback.

---

### M2 — Error responses are inconsistent across controllers

Some controllers return `{ success: false, error: "..." }`, others return
`{ success: false, message: "..." }`, others return `{ error: { message: "..." } }`.
The frontend has defensive code scattered everywhere (`response?.message || response?.error`)
trying to handle all three shapes.

**Fix:** Enforce a single shape via the `errorHandler` middleware (which already exists and
produces `{ success: false, error: { message } }`). All controllers should throw `ApiError`
instances instead of manually crafting error responses.

---

### M3 — `_archive/` and `tmp/` directories contain live scripts with DB credentials

**Location:** `server/_archive/`, `server/tmp/`, `server/prisma/` (many seed scripts)

Files like `tmp-fix-user.js`, `tmp-check-user.js`, `wipe_tests_final.js` contain direct Prisma
queries and reference the production database. They should never be in the working directory of a
production deployment.

**Fix:** Move all one-off scripts to a `tools/` directory excluded from the Docker build:
```dockerfile
# Dockerfile
COPY --chown=node:node server/src ./src
COPY --chown=node:node server/prisma/schema.prisma ./prisma/
# Do NOT copy _archive, tmp, scripts/*
```

---

### M4 — `moment` and `date-fns` both included as frontend dependencies

**Location:** `package.json`

`moment` (320 KB minified) and `date-fns` (modular, much smaller) are both in dependencies.
`moment` is officially in maintenance mode and should not be introduced into new projects.

**Fix:** Audit usage of `moment` / `moment-timezone` in the frontend and migrate to `date-fns`
(already installed). Remove `moment` and `moment-timezone` from `package.json`. This alone
reduces the bundle by ~320 KB.

---

### M5 — No database indexes on high-frequency query columns

**Location:** `server/prisma/schema.prisma`

Frequent queries filter on `learner.grade`, `learner.status`, `learner.archived`,
`assessmentSmsAudit.channel`, `assessmentSmsAudit.smsStatus`, `summativeResult.testId`.
Without indexes these become full table scans as the school grows.

**Fix:** Add to `schema.prisma`:
```prisma
model Learner {
  @@index([grade, status, archived])
  @@index([admissionNumber])
}

model AssessmentSmsAudit {
  @@index([channel, smsStatus])
  @@index([sentAt])
  @@index([learnerId])
}

model SummativeResult {
  @@index([testId])
  @@index([learnerId])
}
```

---

### M6 — `react-scripts` listed as a runtime dependency

**Location:** `package.json` — `"react-scripts": "5.0.1"` is in `dependencies`

`react-scripts` (CRA) is a dev tool and should be in `devDependencies`. More importantly, the
project appears to have already migrated to Vite (`vite.config.js` is present, `vite` is in
devDependencies). `react-scripts` is dead weight that should be removed entirely.

**Fix:** Remove `react-scripts` from `package.json`. Confirm that all `npm run build` and test
commands use the Vite equivalents.

---

### M7 — `CBCGradingSystem_handleSaveLearner.js` temp file left in source tree

**Location:** `src/components/CBCGrading/CBCGradingSystem_handleSaveLearner.js`

This is a scratch file from a recent fix session. It should be deleted.

---

## LOW

### L1 — No `.env.example` at the root frontend level

`server/.env.example` exists but there is no `.env.example` at the project root (for Vite env
vars like `VITE_API_URL`). New developers have no reference for what frontend env vars are needed.

---

### L2 — `xlsx` package is flagged for known vulnerabilities

The `xlsx` package (SheetJS CE) has known prototype pollution vulnerabilities (CVE-2023-30533).
It is used on both frontend and backend. Consider migrating to `exceljs` which is actively
maintained and does not have the same issues.

---

### L3 — Test coverage is near zero for controllers

`server/src/__tests__/` exists with 3 spec files, but `server/src/controllers/__tests__/` is
empty. The most business-critical controllers (learner, assessment, fee, notification) have no
unit or integration tests.

**Recommendation:** Prioritise integration tests for:
- `updateLearner` — the bug fixed in this session
- `getAuditLogs` — complex merge/dedupe logic
- `sendAssessmentReportSms` — involves DB write + external SMS call

---

### L4 — Console.log statements scattered throughout production code

A grep across the codebase shows 200+ `console.log` calls in controller and service files that
will appear in production logs. This pollutes log output and can accidentally expose sensitive
data (phone numbers, names) in plain text logs.

**Fix:** Introduce a structured logger (e.g. `pino`) and replace all `console.log/warn/error`
calls. Set log level to `info` in production so debug output is suppressed automatically.

---

### L5 — `otp-debug.log` and `pred.log` committed to the repository

**Location:** `server/otp-debug.log`, `server/pred.log`

These log files contain email addresses and OTP codes from real usage. Add to `.gitignore` and
remove from history.

---

## Summary Table

| ID  | Severity | Area              | Effort | Impact |
|-----|----------|-------------------|--------|--------|
| C1  | CRITICAL | Security          | 30 min | Secrets exposure |
| C2  | CRITICAL | Security          | 15 min | Session hijack |
| C3  | CRITICAL | Security/Stability| 15 min | DoS vector |
| C4  | CRITICAL | Security          | 4 hrs  | Rate limit bypass |
| H1  | HIGH     | Compliance        | 3 hrs  | No audit trail |
| H2  | HIGH     | Maintainability   | 3 hrs  | Untestable code |
| H3  | HIGH     | Maintainability   | 2 hrs  | Merge conflicts |
| H4  | HIGH     | Security          | 4 hrs  | Token reuse |
| H5  | HIGH     | Performance       | 3 hrs  | DB bloat |
| H6  | HIGH     | Bug               | 30 min | Data corruption |
| M1  | MEDIUM   | Architecture      | 2 hrs  | Inconsistency |
| M2  | MEDIUM   | Reliability       | 3 hrs  | Error handling |
| M3  | MEDIUM   | Security          | 1 hr   | Prod exposure |
| M4  | MEDIUM   | Performance       | 1 hr   | Bundle size |
| M5  | MEDIUM   | Performance       | 1 hr   | Query speed |
| M6  | MEDIUM   | Build             | 30 min | Dead dependency |
| M7  | LOW      | Cleanliness       | 5 min  | Clutter |
| L1  | LOW      | DX                | 30 min | Onboarding |
| L2  | LOW      | Security          | 2 hrs  | Known CVE |
| L3  | LOW      | Quality           | ongoing| No safety net |
| L4  | LOW      | Observability     | 4 hrs  | Log hygiene |
| L5  | LOW      | Privacy           | 10 min | PII in logs |

---

## Recommended Sprint Order

**This week (before any new features):**
C1 → C2 → C3 → H6 → M7 → L5

**Next sprint:**
C4 → H4 → H5 → M5 → M3

**Following sprint:**
H1 → H2 → H3 → M1 → M2
