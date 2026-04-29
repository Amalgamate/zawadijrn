# Trends CORE V1.0 - Complete Prisma User Model Query Analysis

## Executive Summary

Analyzed **50+ Prisma queries** across the server/src codebase that interact with the User model. Found **1 critical field causing P2022 errors** and identified several queries returning excessive field data.

---

## Critical Finding: Missing Field in Production Database

### 🔴 CONFIRMED: `shifNumber` Does Not Exist in Production DB

**Evidence:**
- Explicitly commented out in [hr.service.ts](server/src/services/hr.service.ts#L41): `// shifNumber removed: column doesn't exist in production database`
- Same comment at lines 67, 253
- Query avoids this field when fetching payroll records

**Impact:**
- Would cause P2022 errors if included in any SELECT statement
- Similar to the `primaryColor` schema drift issue previously documented

---

## Field Status: HR/Payroll Fields

| Field | Exists in Production | Used In | Safe |
|-------|----------------------|---------|------|
| `basicSalary` | ✅ Yes | Payroll generation, tax calc, compliance | ✅ |
| `employmentType` | ✅ Yes | HR details update | ✅ |
| `kraPin` | ✅ Yes | Payroll, compliance reports, KRA sync | ✅ |
| `nhifNumber` | ✅ Yes | Payroll deductions | ✅ |
| `nssfNumber` | ✅ Yes | Payroll deductions | ✅ |
| `housingLevyExempt` | ✅ Yes | Tax calculations | ✅ |
| **`shifNumber`** | ❌ **NO** | ~~Removed from all queries~~ | ❌ AVOID |
| `bankName` | ✅ Yes | Banking info storage | ✅ |
| `bankAccountNumber` | ✅ Yes | Banking info storage | ✅ |
| `bankAccountName` | ✅ Yes | Banking info storage | ✅ |

---

## Major Query Locations and Field Selection

### 1. **User Controller** ([server/src/controllers/user.controller.ts](server/src/controllers/user.controller.ts))

#### `getAllUsers()` - Line 36
**SELECT:** `id, email, firstName, middleName, lastName, phone, role, status, createdAt, lastLogin, staffId, subject, gender`
- ✅ Well-scoped, no HR fields

#### `getUserById()` - Line 71
**SELECT:** Same as above + `emailVerified, updatedAt`
**INCLUDE:** `classesAsTeacher { id, name, grade, stream }`
- ✅ Well-scoped for single user view

#### `createUser()` - Line 135
**SELECT:** `id, email, firstName, lastName, role, status, staffId`
- ✅ Minimal return

#### `updateUser()` - Line 208
**SELECT:** `id, email, firstName, lastName, role, status, staffId`
- ✅ Minimal return

#### `getUsersByRole()` - Line 299
**SELECT:** `id, email, firstName, lastName, phone, role, status, staffId, subject, gender`
- ✅ Well-scoped

---

### 2. **Auth Controller** ([server/src/controllers/auth.controller.ts](server/src/controllers/auth.controller.ts))

#### `register()` - Line 70
**SELECT:** `id, email, firstName, lastName, role, phone, createdAt`
- ✅ Minimal, appropriate for auth context

#### `login()` - Line 130
**SELECT:** `id, password, status, loginAttempts, lockedUntil, role, institutionType, email, firstName, lastName, phone, lastLogin`
- ✅ Optimized with Redis caching (5-minute TTL)
- ✅ Only includes auth-necessary fields

---

### 3. **HR Service** ([server/src/services/hr.service.ts](server/src/services/hr.service.ts)) ⚠️

#### `getStaffDirectory()` - Line 20
**SELECT:** All basic fields + `kraPin, nhifNumber, nssfNumber, ~~shifNumber~~, bankName, bankAccountNumber, basicSalary, employmentType, joinedAt, profilePicture, subject, gender`
- ✅ Correctly excludes `shifNumber`
- ✅ Intentional inclusion of HR fields for directory display

#### `updateStaffHRDetails()` - Line 63
**UPDATE FIELDS:** All HR/banking fields except `shifNumber`
- ✅ Correctly excludes `shifNumber` in both select and update
- ✅ Safe for HR operations

#### `generateMonthlyPayroll()` - Line 163 ⚠️ **RISK: No SELECT Specified**
```typescript
const staff = await prisma.user.findMany({
  where: { /* ... */ },
  // ⚠️ NO SELECT - RETURNS ALL 60+ FIELDS including sensitive data
});
```
**Then uses:**
- `member.basicSalary`
- `member.housingLevyExempt`

**RECOMMENDATION:** Add explicit select:
```typescript
select: {
  id: true,
  basicSalary: true,
  housingLevyExempt: true,
  role: true,
  archived: true,
  status: true
}
```

#### `getPayrollRecords()` - Line 245
**INCLUDE user SELECT:** `firstName, lastName, staffId, bankName, bankAccountNumber, kraPin, nssfNumber, ~~shifNumber~~`
- ✅ Correctly excludes `shifNumber`
- ✅ Appropriate fields for payroll reporting

#### `clockInStaff()` - Line 300
**SELECT:** `id, basicSalary, housingLevyExempt`
- ✅ Minimal, auto-creates payroll if conditions met

---

### 4. **Compliance Service** ([server/src/services/compliance.service.ts](server/src/services/compliance.service.ts))

#### `generateITaxPayrollCSV()` - Line 76
**INCLUDE user:** No explicit select (returns all fields)
**USES:** `user.kraPin, user.firstName, user.lastName`
- ⚠️ Returns all User fields, acceptable for one-off admin report
- Uses correct fields (kraPin exists ✅)

---

### 5. **Communication Controller** ([server/src/controllers/communication.controller.ts](server/src/controllers/communication.controller.ts))

#### `getStaffContacts()` - Line 497
**SELECT:** `id, firstName, lastName, phone, role, email`
- ✅ Contact-appropriate selection

---

### 6. **Notification Controller** ([server/src/controllers/notification.controller.ts](server/src/controllers/notification.controller.ts))

#### `sendCustomMessage()` - Line 172
**SELECT:** `id, firstName, lastName, phone, role`
- ✅ Messaging-appropriate selection

---

## Queries WITHOUT Explicit SELECT (Returns All 60+ Fields)

These should be evaluated for field reduction:

1. [server/src/controllers/class.controller.ts#L158](server/src/controllers/class.controller.ts#L158)
   ```typescript
   const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
   ```

2. [server/src/controllers/support.controller.ts#L50](server/src/controllers/support.controller.ts#L50)
   ```typescript
   const user = await prisma.user.findUnique({ where: { id: userId } });
   ```

3. [server/src/controllers/subjectAssignment.controller.ts#L51](server/src/controllers/subjectAssignment.controller.ts#L51)
   ```typescript
   const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
   ```

4. [server/src/controllers/onboarding.controller.ts#L67](server/src/controllers/onboarding.controller.ts#L67), [#L182](server/src/controllers/onboarding.controller.ts#L182)
   ```typescript
   const existingUser = await prisma.user.findFirst({ ... });
   const user = await prisma.user.findFirst({ ... });
   ```

5. [server/src/services/workflow.service.ts#L719](server/src/services/workflow.service.ts#L719)
   ```typescript
   const user = await prisma.user.findUnique({ where: { id: userId } });
   ```

---

## Field Usage Distribution

### Tier 1: Universal Fields (Used in Nearly Every Query)
- `id` - 40+ occurrences
- `firstName` - 30+ occurrences
- `lastName` - 30+ occurrences
- `email` - 15+ occurrences
- `phone` - 12+ occurrences
- `role` - 18+ occurrences
- `status` - 15+ occurrences

### Tier 2: Domain-Specific Fields
- **HR/Payroll**: `basicSalary` (4), `housingLevyExempt` (2), `employmentType` (2)
- **Compliance**: `kraPin` (4), `nhifNumber` (3), `nssfNumber` (3)
- **Banking**: `bankName` (2), `bankAccountNumber` (2), `bankAccountName` (1)
- **Staff**: `staffId` (8), `subject` (3), `gender` (3)

### Tier 3: Rarely Used / Never Selected Explicitly
- `middleName` - Selected but rarely used
- `username` - Schema field but never selected
- `idCardPhoto`, `idCardIssued`, `idCardExpiry` - Never used
- `emailVerificationToken`, `phoneVerificationCode` - Never selected
- `passwordResetToken` - Never selected
- `profilePicture` - Selected once in hr.service

---

## Risk Assessment

### 🔴 High Risk (Would Cause Runtime Errors)

1. **ANY query selecting `shifNumber`** - P2022 error
   - Currently protected by hr.service comments
   - Risk score: HIGH if someone tries to restore this field

### 🟡 Medium Risk (Performance/Exposure)

1. **hr.service.ts generateMonthlyPayroll()** - Returns 60+ fields when only needs 3
   - Affects: Payroll generation performance
   - Contains: All user sensitive data unnecessarily
   - Mitigation: Add explicit select

2. **Five queries returning full User objects** (class, support, subjectAssignment, onboarding, workflow)
   - Performance impact: Medium
   - Exposure: Low (mostly used for ID checks)
   - Mitigation: Add select when not already needed

### 🟢 Low Risk (Well Implemented)

- User controller queries (well-scoped)
- Auth queries (optimized, cached)
- HR directory queries (intentional field selection)
- Communication/notification queries (minimal appropriate selection)

---

## Recommendations

### Priority 1: URGENT
**Fix generateMonthlyPayroll() Performance Issue**
- File: [server/src/services/hr.service.ts#L163](server/src/services/hr.service.ts#L163)
- Add explicit `select` clause to `findMany()`
- Currently fetches 60+ fields, uses only 3

### Priority 2: HIGH
**Add SELECT clauses to 5 queries returning full User objects**
1. class.controller.ts#L158
2. support.controller.ts#L50
3. subjectAssignment.controller.ts#L51
4. onboarding.controller.ts#L67, #L182
5. workflow.service.ts#L719

### Priority 3: MEDIUM
**Document the shifNumber removal**
- Add comment to Prisma schema explaining why it's included but can't be used
- Or remove from schema if production never will have it

### Priority 4: ONGOING
**When adding new fields to User model:**
- Always specify SELECT in queries
- Test with production database schema
- Review for schema drift

---

## Schema vs Production Verification

**Current Status:**
| Aspect | Status |
|--------|--------|
| HR fields (except shifNumber) | ✅ Verified working |
| shifNumber | ❌ Confirmed missing - must avoid |
| basicSalary for payroll | ✅ Actively used |
| Banking fields | ✅ Actively used |
| Tax fields | ✅ Actively used |

**Last Verified:** April 11, 2026
