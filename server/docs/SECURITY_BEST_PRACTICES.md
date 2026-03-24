# Security Best Practices — Zawadi SMS

This document records the security measures implemented across the Zawadi SMS backend.

---

## 1. Input Validation & Sanitization ✅

Implemented via Zod validation schemas in `src/utils/validation.util.ts` and applied through `src/middleware/validation.middleware.ts`.

- Type-safe, schema-driven validation on all endpoints
- Multi-source validation (body, query, params)
- Protects against invalid/malformed input, XSS, and injection attacks

```typescript
router.post('/login', validate(loginSchema), handler);
router.post('/register', validate(registerSchema), handler);
```

---

## 2. Rate Limiting ✅

Three tiers implemented in `src/middleware/enhanced-rateLimit.middleware.ts`:

- **Standard** — fixed window per endpoint
- **Progressive** — tightens limits on repeated failures (brute-force resistant)
- **Auth-specific** — locked to 5 attempts per 15-minute window on login/register

---

## 3. Response Sanitization ✅

`src/middleware/response-sanitization.middleware.ts` intercepts all JSON responses and:

- Strips stack traces in production
- Escapes HTML in error messages
- Adds `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Content-Security-Policy` headers
- Adds `Strict-Transport-Security` in production
- Adds `Referrer-Policy` and `Permissions-Policy`

---

## 4. Security Logging ✅

`src/utils/security-logging.util.ts` logs structured security events including:

- Auth success / failure
- Authorization denials
- Rate limit hits
- Suspicious activity
- Admin actions
- Password changes

Each entry captures: timestamp, event type, user ID, IP address, risk level, and context.

---

## 5. Environment Validation ✅

`src/config/env-validator.ts` runs at startup and will hard-exit (`process.exit(1)`) if:

- Required variables are missing
- Values fail format checks (URL scheme, secret length, etc.)
- Production env uses HTTP instead of HTTPS

---

## 6. Authentication & Authorization ✅

- JWT access tokens (short-lived) + refresh tokens (long-lived, rotated)
- Role-based access control via `requireRole()` and `requirePermission()` middleware
- Role hierarchy defined in `src/config/permissions.ts`

---

## 7. Password Security ✅

Implemented in `src/utils/password.util.ts`:

- Minimum 8 characters, uppercase + number required for staff
- Simpler policy for parent accounts
- bcrypt with cost factor 11 (≈50–100ms, brute-force resistant without being slow for users)
- Password confirmation validation on reset

---

## 8. CSRF Protection ✅

Token issued via `GET /api/auth/csrf`, validated on sensitive mutation endpoints via `src/middleware/csrf.middleware.ts`.

---

## 9. Helmet Security Headers ✅

`helmet()` applied globally in `src/server.ts`. Removes `X-Powered-By`, sets CSP, prevents MIME sniffing and clickjacking.

---

## 10. CORS ✅

Locked to `FRONTEND_URL` env var in production. Dev additionally allows localhost variants. See `src/server.ts`.

---

## Pending / Recommended (Phase 4)

- **API key management** — generation, rotation, bcrypt storage, per-key rate limiting
- **Field-level encryption** — for PII at rest (parent phone, learner data)
- **Audit log persistence** — write security events to DB for compliance reporting
- **Dependency scanning** — automated `npm audit` in CI pipeline
- **Penetration testing** — OWASP Top 10 assessment before go-live
- **`noImplicitReturns`** — enable in `tsconfig.json` after running `tsc --noEmit` audit (see Fix #4 notes)

---

## Production Deployment Checklist

- [ ] `NODE_ENV=production`
- [ ] HTTPS enforced end-to-end
- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` rotated from defaults
- [ ] `SECURE_COOKIES=true`
- [ ] `RATE_LIMIT_ENABLED=true`
- [ ] `CORS_ORIGIN` restricted to frontend domain only
- [ ] `LOG_LEVEL=error` (not `info` or `debug`)
- [ ] `ENABLE_DEV_ROUTES=false`
- [ ] Database backups configured and tested
- [ ] Error tracking (Sentry DSN) configured
- [ ] `server/.env.production` removed from git tracking + secrets rotated
- [ ] Security headers verified with [securityheaders.com](https://securityheaders.com)

---

*Last updated: March 2026 — Amalgamate*
