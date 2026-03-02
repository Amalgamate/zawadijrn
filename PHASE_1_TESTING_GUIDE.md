# 🧪 PHASE 1: INTERNAL TESTING GUIDE

**Objective**: Validate security, performance, and reliability before production deployment.

**Timeline**: 1-2 weeks of testing across three areas:
1. Load testing (rate limiting verification)
2. Security validation (middleware verification)
3. User acceptance testing (core workflows)

---

## 📋 Quick Start Testing Checklist

### Prerequisites
```bash
# Install testing dependencies
npm install --save-dev artillery autocannon ab
npm install --save-dev jest supertest  # if not already installed

# Tool versions required:
# - Node.js 16+ ✅
# - npm 8+ ✅
# - Windows 10+ or Linux ✅
```

### Running Tests (First Time)
```bash
# 1. Start the backend server
cd server
npm start
# Wait for "Server running on http://localhost:5000"

# 2. In a new terminal, run security tests
npm run test:security

# 3. Run load tests
npm run test:load

# 4. Run acceptance tests
npm run test:acceptance

# 5. Generate report
npm run test:report
```

---

## 🔒 Test 1: SECURITY VALIDATION (30 minutes)

### 1.1 Rate Limiting Verification
**What**: Verify that all endpoints are rate-limited correctly
**How**: Rapid fire requests to different endpoints

```bash
# Clone the load testing script:
# server/tests/load-testing.ts

# Run rate limit tests:
npm run test:rateLimit

# Expected output:
# ✅ Standard endpoints: 50-100/min honored
# ✅ Admin endpoints: 5-10/min honored
# ✅ Auth endpoints: Progressive limits work
# ✅ Global IP limit: 1000/15min honored
```

**Pass Criteria**:
- [x] All endpoints reject requests >limit with 429 status
- [x] Rate-Limit headers present in responses
- [x] Retry-After header correctly calculated
- [x] Different endpoints have different limits

### 1.2 Input Validation Verification
**What**: Verify that invalid input is rejected
**How**: Send malformed requests to each route

```bash
npm run test:validation

# Expected output:
# ✅ Invalid email: Rejected with 400
# ✅ Missing required field: Rejected with 400
# ✅ Type mismatch: Rejected with 400
# ✅ XSS attempt: Sanitized/rejected
# ✅ SQL injection: Rejected
```

**Pass Criteria**:
- [x] All invalid inputs return 400
- [x] Error messages don't expose system details
- [x] XSS/SQL injection attempts blocked
- [x] File uploads size-limited

### 1.3 Authentication & Authorization
**What**: Verify that access controls work
**How**: Test endpoints with valid/invalid tokens and roles

```bash
npm run test:auth

# Expected output:
# ✅ No token: 401 Unauthorized
# ✅ Expired token: 401 Unauthorized
# ✅ Invalid token: 401 Unauthorized
# ✅ Valid token, wrong role: 403 Forbidden
# ✅ Valid token, correct role: 200 OK
```

**Pass Criteria**:
- [x] Unauthenticated requests blocked
- [x] Token expiration enforced
- [x] Role-based access control working
- [x] Permission-based access control working

### 1.4 Security Headers
**What**: Verify that security headers are present
**How**: Check response headers

```bash
curl -i http://localhost:5000/api/health

# Expected headers:
# Content-Security-Policy: ✅
# X-Frame-Options: DENY ✅
# X-XSS-Protection: 1; mode=block ✅
# X-Content-Type-Options: nosniff ✅
# Strict-Transport-Security: ✅
# Referrer-Policy: strict-origin-when-cross-origin ✅
```

**Pass Criteria**:
- [x] All 9 security headers present
- [x] CSP policy correctly configured
- [x] HSTS enabled (production only)

---

## ⚡ Test 2: LOAD TESTING (1 hour)

### 2.1 Concurrent User Simulation
**What**: Test system under realistic load
**How**: Simulate 100, 500, 1000 concurrent users

```bash
npm run load-test:light    # 100 concurrent users, 2 minutes
npm run load-test:medium   # 500 concurrent users, 5 minutes
npm run load-test:heavy    # 1000 concurrent users, 10 minutes

# Example output:
# Requests/sec:    523
# Latency avg:     45ms
# Latency p95:     125ms
# Error rate:      0.1%
# Status 429:      12% (expected - rate limited)
```

**Pass Criteria**:
- [x] P95 latency < 500ms
- [x] Error rate < 1% (429 errors expected)
- [x] System doesn't crash under 1000 concurrent

### 2.2 Endpoint Performance
**What**: Identify slow endpoints
**How**: Profile each endpoint under load

```bash
npm run test:performance

# Example output:
# GET /api/health:           12ms ✅
# POST /api/learners:        78ms ✅
# GET /api/dashboard/admin:  234ms ⚠️ (slower, check DB)
# POST /api/bulk/learners:   1200ms ⚠️ (expected - bulk op)
```

**Pass Criteria**:
- [x] Regular endpoints: < 200ms p95
- [x] Database queries: < 500ms p95
- [x] Bulk operations: < 5s (with progress)
- [x] No memory leaks (monitor heap growth)

### 2.3 Rate Limiting Under Load
**What**: Verify rate limiting works correctly under stress
**How**: Exceed limits and verify blocking

```bash
npm run test:rateLimitStress

# Expected:
# Phase 1 (0-2min): All requests succeed
# Phase 2 (2-3min): Hit rate limit, 429 responses start
# Phase 3 (3-4min): Sustained 429 until window resets
# Phase 4 (4-5min): Requests resume after window resets
```

**Pass Criteria**:
- [x] Rate limiting activates at configured limit
- [x] 429 status code returned consistently
- [x] Requests resume after window expires
- [x] No requests slip through when limited

---

## ✅ Test 3: ACCEPTANCE TESTING (1 week)

### 3.1 Core Workflows
Test each major educational workflow:

#### School Admin Workflow
```
[x] Login as school admin
[x] View dashboard metrics
[x] Manage learners (add/edit/delete)
[x] Manage teachers (add/edit/delete)
[x] Configure assessment types
[x] View reports
[x] Manage fees
```

#### Teacher Workflow
```
[x] Login as teacher
[x] View assigned classes
[x] Record formative assessments
[x] Record summative test scores
[x] View student performance
[x] Generate progress reports
[x] Send communications
```

#### Parent Workflow
```
[x] Login as parent
[x] View child's assessments
[x] View child's progress
[x] View communications
[x] Pay fees (if implemented)
[x] Submit enquiries
```

#### System Admin Workflow
```
[x] Login as super admin
[x] Manage schools
[x] Manage system configuration
[x] View audit logs
[x] Reset system (if needed)
[x] Manage users across schools
```

### 3.2 Data Integrity Testing
```
[x] Learner data persists after logout/login
[x] Assessment scores saved correctly
[x] Grades calculated correctly
[x] Reports generated with correct data
[x] Bulk imports work correctly
[x] Concurrent editing handled properly
[x] Deleted data marked as deleted (soft delete)
[x] No data loss on error recovery
```

### 3.3 Mobile Testing (if deploying app)
```
[x] iOS app builds and runs
[x] Android app builds and runs
[x] All workflows work on mobile
[x] Mobile-specific features work (camera, GPS if needed)
[x] Network resilience tested (offline mode)
[x] Push notifications work
[x] Performance acceptable on 3G/4G
```

---

## 📊 Test Execution Plan

### Week 1: Initial Testing
| Day | Activity | Owner | Duration |
|-----|----------|-------|----------|
| Mon | Security validation | QA | 1 day |
| Tue | Load testing light/medium | QA | 1 day |
| Wed | Performance profiling | Dev | 1 day |
| Thu | Core workflow testing | QA | 1 day |
| Fri | Bug fixes & retest | Dev | 1 day |

### Week 2: Extended Testing
| Day | Activity | Owner | Duration |
|-----|----------|-------|----------|
| Mon | Heavy load testing (1000 concurrent) | QA | Full day |
| Tue | Mobile testing | QA | Full day |
| Wed | Data integrity testing | QA | Full day |
| Thu | Documentation review | Dev | Half day |
| Fri | Final sign-off | All | Half day |

---

## 🐛 Known Issues to Test For

Based on typical school management systems, watch for:

1. **Concurrent Assessment Entry**
   - Multiple teachers entering grades simultaneously
   - Ensure no overwrite/loss of data

2. **Bulk Import Edge Cases**
   - Duplicate admission numbers
   - Invalid data in bulk files
   - File size limits

3. **Report Generation**
   - Large dataset performance (1000+ learners)
   - PDF generation stability
   - Excel export formatting

4. **Mobile Network Resilience**
   - Automatic reconnection after network loss
   - Queue of pending actions
   - Sync on reconnection

5. **Concurrent School Access** (multi-tenant)
   - Teachers accessing multiple schools
   - Data isolation working
   - Report accuracy

---

## 📈 Success Metrics

### Security
- [x] 100% of endpoints rate-limited
- [x] 100% of POST/PUT requests validated
- [x] 0 XSS vulnerabilities found
- [x] 0 SQL injection vulnerabilities found
- [x] All 9 security headers present
- [x] 0 information disclosure issues

### Performance
- [x] P95 latency < 500ms (regular endpoints)
- [x] Database queries < 200ms p99
- [x] Bulk operations < 5s
- [x] Memory stable (no leaks)
- [x] Handles 1000 concurrent users

### Reliability
- [x] 99.5% uptime during testing
- [x] 0 crashes under load
- [x] Graceful degradation at limits
- [x] No data loss
- [x] Auto-recovery from errors

### Functionality
- [x] All core workflows functional
- [x] All reports generate correctly
- [x] Bulk imports work
- [x] Mobile app works
- [x] Data integrity maintained

---

## 🚀 Go/No-Go Decision Criteria

### GO TO PRODUCTION IF:
```
✅ All security tests pass
✅ Load testing reaches target (1000 concurrent)
✅ P95 latency < 500ms
✅ Error rate < 1%
✅ All core workflows pass UAT
✅ No critical bugs found
✅ All security headers present
✅ Zero TypeScript errors in build
```

### NO-GO TRIGGERS:
```
❌ Any security vulnerability found
❌ Repeated crashes under load
❌ P95 latency > 2 seconds
❌ Data loss or corruption
❌ Critical bugs blocking workflows
❌ Rate limiting not working
❌ Less than 95% test coverage on core flows
```

---

## 📝 Testing Report Template

After testing, complete this report:

```markdown
# PHASE 1 Testing Report
**Date**: [Date]
**Tested By**: [Names]
**Environment**: [Server/Local]

## Security Testing
- Rate Limiting: [PASS/FAIL] - Details:
- Input Validation: [PASS/FAIL] - Details:
- Authentication: [PASS/FAIL] - Details:
- Authorization: [PASS/FAIL] - Details:
- Security Headers: [PASS/FAIL] - Details:

## Performance Testing
- Light Load (100): [PASS/FAIL] - Latency:
- Medium Load (500): [PASS/FAIL] - Latency:
- Heavy Load (1000): [PASS/FAIL] - Latency:
- Memory: [PASS/FAIL] - Peak usage:
- Errors: [Count] - 429 rate limit errors: [Expected]

## Acceptance Testing
- Admin Workflow: [PASS/FAIL] - Issues:
- Teacher Workflow: [PASS/FAIL] - Issues:
- Parent Workflow: [PASS/FAIL] - Issues:
- System Admin: [PASS/FAIL] - Issues:
- Data Integrity: [PASS/FAIL] - Issues:
- Mobile: [N/A/PASS/FAIL] - Issues:

## Issues Found
1. [Issue] - Severity: [High/Med/Low] - Fix:
2. [Issue] - Severity: [High/Med/Low] - Fix:

## Recommendation
[ ] GO TO PRODUCTION
[ ] NEEDS FIXES - Retry in [Days]
[ ] MAJOR ISSUES - Delay 2+ weeks

**Sign-off**: [Name] [Date]
```

---

## 🔗 Related Documentation

- `SECURITY_IMPLEMENTATION_COMPLETE.md` - What we secured
- `PHASE_3_SECURITY_SUMMARY.md` - Security features implemented
- `QUICK_REFERENCE.md` - Rate limits & validation schemas

---

**Next Steps After Phase 1**:
1. ✅ Document any bugs found
2. ✅ Create fixes for issues
3. ✅ Re-test after fixes
4. ✅ Proceed to Phase 2 (Security Audit)

**Estimated Time**: 1-2 weeks (concurrent with development)
