# Zawadi SMS — Module Audit
## Completeness, Gaps & Improvements
*Generated from full codebase read — March 2026*

---

## How to read this document

Each module is scored **0–100%** based on whether the full
feature surface (schema → backend → frontend → integration) is
functional and consistent. Every gap is accompanied by the exact
file, field, or call that is broken, and a concrete fix.

---

## Module 1 — Summative Assessment
**Score: 85 / 100**

### What works
- Test creation (single + bulk), bulk score entry, Redis cache
  with `deleteByPrefix` cache-bust on every write
- CBC grade calculation (EE1–BE2), position ranking via raw SQL
  window function (fire-and-forget, non-blocking)
- Summative Report PDF: `captureSingleReport` / `captureBulkReports`,
  pathway prediction, broadsheet, SMS/WhatsApp dispatch

### Gaps

**Gap 1 — DB enum mismatch (Critical)**
`SummativeResult.grade` is stored as enum `SummativeGrade { A B C D E }`.
The frontend never uses A–E; it re-derives EE1–BE2 from percentage at
render time, so the stored grade is meaningless junk. Every PDF and
broadsheet recalculates on the fly — historical accuracy is lost if
`totalMarks` changes on the test.

Fix: Add a new `String` column `cbcGrade` to `summative_results`,
write the EE1–BE2 string from the backend (already computed in
`recordSummativeResult`), and mark the old `grade` enum column
as deprecated. Migration is one `ALTER TABLE ADD COLUMN`.

**Gap 2 — `testType` is an unconstrained String**
`SummativeTest.testType` accepts any string. A typo such as
`"MIDTEM"` silently saves and breaks column grouping in the report.

Fix: Add a Postgres `CHECK` constraint or replace with an enum:
`OPENER | MIDTERM | END_TERM | CAT | MONTHLY | WEEKLY | RANDOM`.

**Gap 3 — No grade match validation on result entry**
`recordSummativeResult` does not check that the learner's `grade`
matches `SummativeTest.grade`. A Grade 3 learner can receive results
for a Grade 9 test.

Fix: Add one Prisma query before the upsert:
```ts
const learner = await prisma.learner.findUnique({ where: { id: learnerId }, select: { grade: true } });
if (learner?.grade !== test.grade) throw new ApiError(400, 'Learner grade does not match test grade');
```

**Gap 4 — Bulk PDF blocks main thread for large classes**
`BULK_CONCURRENCY = 3` parallel html2canvas calls still freezes the
tab for 15–20 s on a class of 40+. No abort mechanism.

Fix: Move captures into a `Web Worker` or add an `AbortController`
signal tied to the progress overlay "Cancel" button.

---

## Module 2 — Formative Assessment
**Score: 70 / 100**

### What works
- Entry form, rubric ratings (EE1–BE2), term/year filters,
  bulk upsert with owner-check, audit log

### Gaps

**Gap 1 — AggregationConfig exists but is never used**
Schema has `AggregationConfig` with strategies
`SIMPLE_AVERAGE | BEST_N | DROP_LOWEST | WEIGHTED | MEDIAN`.
No frontend UI to create configs. No backend logic reads them when
computing a learner's formative aggregate.

Fix: Add a settings page `FormativeAggregationSettings.jsx` and a
`calculation.service.ts` function that reads the config per
`(grade, learningArea)` before computing the mean used in
`TermlyReportTemplate`.

**Gap 2 — No lock/unlock UI**
`FormativeAssessment.locked` exists in the schema and
`assessmentController` checks it nowhere.

Fix: Add a "Lock Formative" action on the assessment list and
a guard in `recordFormativeResultsBulk`:
```ts
if (existing?.locked) throw new ApiError(403, 'Assessment is locked');
```

**Gap 3 — No class-wide formative view**
Teachers can only enter assessments learner-by-learner. There is no
grid/spreadsheet entry like the summative bulk entry form.

Fix: Reuse the `SummativeTestForm` grid pattern but bound to
`/api/assessments/formative/bulk`.

---

## Module 3 — Core Competencies & Values
**Score: 60 / 100**

### What works
- `CoreCompetency` and `ValuesAssessment` DB models are correct.
- Entry forms (`CoreCompetenciesAssessment.jsx`, `ValuesAssessment.jsx`)
  save data successfully.

### Gaps

**Gap 1 — Never appear in any report (Critical)**
`/api/reports/termly/:learnerId` joins `summativeResults` and
`formativeAssessments` but does NOT join `coreCompetencies` or
`valuesAssessments`. The termly report template has placeholder
sections that always render blank.

Fix in `reportController.ts → getTermlyReport`:
```ts
coreCompetencies: await prisma.coreCompetency.findFirst({
  where: { learnerId, term, academicYear }
}),
valuesAssessment: await prisma.valuesAssessment.findFirst({
  where: { learnerId, term, academicYear }
}),
```
Then wire the data into `TermlyReportTemplate`.

**Gap 2 — No bulk entry**
Each learner must be assessed individually. For a class of 35
this is 35 separate page loads.

Fix: Add a class-view table where the teacher rates all learners
for each competency in one session, similar to the summative grid.

---

## Module 4 — Termly Report
**Score: 55 / 100**

### What works
- Template renders, PDF download via `generatePDFWithLetterhead`
  works after the `simplePdfGenerator` refactor.

### Gaps

**Gap 1 — Four sections always blank (Critical)**
Core competencies, values, co-curricular activities, and
class teacher comments are never populated. See Module 3 Gap 1.

**Gap 2 — `TermlyReportComment` form is not wired**
`TermlyReportCommentsForm.jsx` is a static form with no `onSubmit`
handler and no API call. Comments entered by the teacher are lost
on navigation.

Fix: Add `POST /api/cbc/comments` (route already exists under
`cbcRoutes.ts`) and wire the form's save button.

**Gap 3 — `nextTermOpens` date never set**
The `TermlyReportComment.nextTermOpens` field is always null.
The report footer shows nothing where it should say
"Next term opens: 7th May 2026".

Fix: Read from `TermConfig` for `term + 1` and populate on
report fetch.

**Gap 4 — Template design inconsistency**
`TermlyReportTemplate.jsx` uses the old corporate maroon theme.
`LearnerReportTemplate` (summative) uses the school's dynamic
`brandColor`. Parents receive two visually inconsistent documents.

Fix: Refactor `TermlyReportTemplate` to use the same header/footer
structure as `LearnerReportTemplate`, reading `brandColor` from
`reportData.brandColor`.

---

## Module 5 — Attendance
**Score: 75 / 100**

### What works
- Daily marking (web + mobile), `PRESENT / ABSENT` recording,
  date-range reports, stats cards, teacher-scoped filtering.

### Gaps

**Gap 1 — Export and Print buttons do nothing**
Both buttons in `AttendanceReports.jsx` render but have no
`onClick` handler. Clicking them does nothing.

Fix:
```jsx
// Print button
onClick={() => pdfPrintWindow('attendance-report-content')}

// Export button — generate CSV from filteredRecords
onClick={() => exportAttendanceCSV(filteredRecords, activeReport)}
```

**Gap 2 — LATE and EXCUSED statuses unused in UI**
Both enum values exist in the DB and schema but the daily
marking form only offers PRESENT / ABSENT toggles. Teachers
cannot mark a learner as late.

Fix: Change the status toggle to a 4-way selector:
`PRESENT | LATE | EXCUSED | ABSENT`.

**Gap 3 — No absence notification**
When a learner is marked ABSENT there is no parent notification.
`AssessmentSmsAudit` tracks assessment messages but attendance
alerts are never sent.

Fix: In `attendance.controller.ts → markAttendance`, after saving
an ABSENT record fire a background SMS:
```ts
if (status === 'ABSENT') {
  SmsService.sendSms(parentPhone, `${learnerName} was absent today.`);
}
```

**Gap 4 — Staff attendance has no UI entry point**
`StaffAttendanceLog` is modelled and `teacherClockIn.js` utility
exists but no page in the sidebar navigates to it.

Fix: Add `hr-attendance` route in `PageRouter.jsx` pointing to a
new `StaffAttendancePage.jsx` that calls
`POST /api/hr/attendance/clock-in`.

---

## Module 6 — Fee Management
**Score: 80 / 100**

### What works
- Invoice creation with auto-structure matching, transport
  filter (backend now honours `includeTransport`), payment
  recording, receipt/invoice PDF, SMS/WhatsApp reminders,
  bulk reminder dispatch, CSV export, email statement.
- `resetInvoices` is correctly guarded: the backend controller
  checks `role !== 'SUPER_ADMIN'` and returns 403.

### Gaps

**Gap 1 — Frontend Reset button has no role check**
`FeeCollectionPage.jsx` renders the "Reset Invoices" button
unconditionally. Any logged-in user sees it. The backend correctly
blocks non-SUPER_ADMIN, but the button should not be visible at all
for non-admins.

Fix:
```jsx
{user?.role === 'SUPER_ADMIN' && (
  <button onClick={handleResetInvoices}>Reset Invoices</button>
)}
```

**Gap 2 — Invoice number sequence is not concurrency-safe**
`invoiceNumber` is generated as:
```ts
const count = await prisma.feeInvoice.count();
const invoiceNumber = `INV-${year}-${String(count + 1).padStart(6, '0')}`;
```
Two simultaneous requests will read the same `count` and produce
duplicate invoice numbers, causing a unique-constraint failure.

Fix: Use a Postgres sequence via `prisma.$executeRaw`:
```sql
SELECT nextval('invoice_seq') AS val
```
or lock the row with `SELECT FOR UPDATE`.

**Gap 3 — `FeeReportsPage.jsx` has no analytics**
The page exists but shows no charts — no collection rate trend,
no per-grade breakdown, no overdue analysis.

Fix: Call `GET /api/fees/stats?academicYear=&term=` (route exists,
`getPaymentStats` is implemented) and render a breakdown chart using
the existing Recharts setup.

**Gap 4 — M-Pesa STK push not implemented**
`mpesaEnabled`, `mpesaPublicKey`, `mpesaSecretKey` are in
`CommunicationConfig` and `PaymentSettings.jsx` lets the admin
configure them, but there is no webhook endpoint or STK push
initiation in `fee.controller.ts`.

Fix: Add `POST /api/fees/mpesa/initiate` and
`POST /api/fees/mpesa/callback` using the IntaSend SDK.

---

## Module 7 — HR Management
**Score: 60 / 100**

### What works
- Staff directory CRUD, leave requests with approval flow,
  payroll record generation (schema + controller),
  performance reviews, staff document upload.

### Gaps

**Gap 1 — All dashboard stats are hardcoded (Critical)**
`HRManager.jsx` sets `pendingPayroll: 1` as a static fixture.
`AccountingManager.jsx` sets `cashOnHand: 1250000` as a static
fixture. Neither makes a live API call.

Fix:
```js
// HRManager
const payroll = await hrAPI.getPayrollSummary({ month, year });
setStats({ ...stats, pendingPayroll: payroll.data.pending });
```

**Gap 2 — Payslip PDF download not implemented**
`PayrollManager.jsx` has a Download button per payslip row but
the `onClick` handler is an empty stub.

Fix: Render each payslip into a hidden DOM container and call
`captureSingleReport('payslip-content', filename)`.

**Gap 3 — Staff clock-in has no navigation entry**
`StaffAttendanceLog` model exists, `teacherClockIn.js` utility
exists, but no page in the sidebar.

Fix: Add `hr-staff-attendance` to `PageRouter.jsx` and a new
`StaffAttendancePage.jsx`.

**Gap 4 — Performance review sends no notification**
When a review is created the reviewed staff member receives no
in-app or SMS notification.

Fix: After `prisma.performanceReview.create`, call
`notificationService.send({ userId: review.userId, message: '...' })`.

---

## Module 8 — Accounting
**Score: 45 / 100**  ← Largest gap in the system

### What works
- DB schema is comprehensive: Chart of Accounts, Journals,
  Journal Entries, Journal Items, Expenses, Vendors,
  Bank Statements, Bank Statement Lines, Fiscal Years.
- UI shell components exist for all sub-modules.
- Fee payments call `accountingService.postFeePaymentToLedger`
  in a background task — this is the only live accounting flow.

### Gaps

**Gap 1 — All dashboard stats are mocked (Critical)**
`AccountingManager.jsx` hardcodes:
```js
cashOnHand: 1250000,
accountsReceivable: 450000,
accountsPayable: 180000,
netProfit: 320000
```
None are fetched from the API.

Fix: Call `accountingAPI.getFinancialSummary()` on mount and
replace the hardcoded values with the response.

**Gap 2 — No double-entry enforcement**
`JournalEntries.jsx` allows saving a journal entry where
total debits ≠ total credits. This violates basic accounting
principles and will produce an incorrect balance sheet.

Fix: Add validation before the POST:
```js
const totalDebit = items.reduce((s, i) => s + i.debit, 0);
const totalCredit = items.reduce((s, i) => s + i.credit, 0);
if (Math.abs(totalDebit - totalCredit) > 0.01) {
  showError('Debits must equal Credits');
  return;
}
```
Also add a DB-level check constraint:
```sql
-- enforced by trigger or application layer, not easily as a CHECK without aggregation
```

**Gap 3 — Bank reconciliation matching not implemented**
`BankReconciliation.jsx` renders a UI but the "Match" button
has no handler. `BankStatementLine.journalItemId` is never
populated from the frontend.

Fix: Add a matching handler that calls
`PUT /api/accounting/reconcile` with `{ lineId, journalItemId }`,
setting `BankStatementLine.status = 'RECONCILED'`.

**Gap 4 — Financial reports are placeholder charts only**
`FinancialReports.jsx` renders static dummy data. No P&L,
no Balance Sheet, no Cash Flow statement is computed.

Fix: Implement these three queries in `accounting.controller.ts`:
- P&L: `SUM(credit) - SUM(debit)` per `REVENUE` and `EXPENSE` accounts
- Balance Sheet: running balance per `ASSET`, `LIABILITY`, `EQUITY`
- Cash Flow: movements on `ASSET_CASH` accounts

**Gap 5 — Fiscal year lifecycle not enforced**
The `FiscalYear` model has `status: OPEN | CLOSED` but no UI
to change it and no backend guard preventing journal entries
from being posted to a closed fiscal year.

Fix: Add `PATCH /api/accounting/fiscal-years/:id/close` and
check `fiscalYear.status !== 'OPEN'` before creating any
`JournalEntry`.

**Gap 6 — Account hierarchy renders flat**
`ChartOfAccounts.jsx` renders a flat list. The `Account.parentId`
relation exists in the schema, creating a tree structure, but the
frontend ignores it.

Fix: Build a recursive tree component or use an indent-based
display where child accounts are visually nested under parents.

---

## Module 9 — Inventory
**Score: 70 / 100**

### What works
- Items, categories, stores, stock movements (IN/OUT/TRANSFER),
  fixed assets, asset assignments, requisitions with approval flow.

### Gaps

**Gap 1 — Stock level computed on every query**
Current stock is derived by summing all `StockMovement` records
on every query. At scale (thousands of movements) this becomes slow.

Fix: Add a `currentStock Decimal` column to `InventoryItem` and
update it atomically on every movement:
```ts
prisma.inventoryItem.update({ where: { id }, data: { currentStock: { increment: qty } } })
```

**Gap 2 — No reorder alert**
`InventoryItem.reorderLevel` exists but nothing compares current
stock to it. No alert is shown when stock drops below the threshold.

Fix: After every `StockMovement OUT`, check:
```ts
if (item.currentStock <= item.reorderLevel) {
  // Trigger notification
}
```

**Gap 3 — Asset return has no UI**
`AssetAssignment.returnedAt` and `conditionOnReturned` fields
exist but `AssetAssignments.jsx` has no "Return" button.

Fix: Add a Return modal that calls
`PATCH /api/inventory/assets/:assetId/return` setting
`returnedAt = now()` and `conditionOnReturned`.

**Gap 4 — Requisition approval sends no notification**
When a `StockRequisition` is approved, the requester receives
no in-app or SMS notification.

Fix: After `prisma.stockRequisition.update({ status: 'APPROVED' })`,
call `notificationService.send({ userId: req.requestedById, ... })`.

---

## Module 10 — Communication
**Score: 75 / 100**

### What works
- SMS via MobileSasa, WhatsApp via UltraMsg, broadcast campaigns
  with delivery logs, bulk assessment report dispatch,
  `AssessmentSmsAudit` tracking per learner/channel/term.

### Gaps

**Gap 1 — Read receipts never updated**
`MessageReceipt.readAt` is never set. The in-app message history
shows all messages as unread permanently.

Fix: Add a `PATCH /api/messages/:id/read` endpoint and call it
when a recipient opens a message.

**Gap 2 — Scheduled messages never sent**
`Message.scheduledFor` field exists and `BroadcastMessagesPage.jsx`
lets users set a schedule, but there is no cron job or queue
processor that fires at the scheduled time.

Fix: Add a `node-cron` job in `server.ts`:
```ts
cron.schedule('* * * * *', async () => {
  const due = await prisma.message.findMany({
    where: { status: 'DRAFT', scheduledFor: { lte: new Date() } }
  });
  for (const msg of due) { await dispatchMessage(msg); }
});
```

**Gap 3 — Birthday SMS has no trigger**
`birthdayEnabled` and `birthdayMessageTemplate` are configured
but no daily cron checks `Learner.dateOfBirth` against today's date.

Fix: Add a daily cron (run at 07:00) that queries:
```ts
WHERE EXTRACT(MONTH FROM dateOfBirth) = current_month
  AND EXTRACT(DAY FROM dateOfBirth) = current_day
  AND status = 'ACTIVE'
```
and sends the configured template.

**Gap 4 — Email used only for OTP**
The Resend email provider is fully configured but the only email
flow is OTP. Fee statements can be emailed (the backend handler
exists in `fee.controller.ts → emailStatement`) but no other
module sends email.

Fix: Wire email into: absence notifications, fee reminders,
payslip delivery, and report card delivery.

---

## Module 11 — Settings
**Score: 80 / 100**

### What works
- School profile, branding (logo/stamp/color), communication
  provider config, academic settings, user management,
  performance scales, subject allocation, backup trigger.

### Gaps

**Gap 1 — Grading scale not used in CBC calculation**
`PerformanceLevelManager.jsx` and `ScalesManagement.jsx` let
admins create `GradingSystem` + `GradingRange` records.
But `SummativeReport.jsx → getCBCGrade()` is a hardcoded
`if/else if` chain that ignores the DB entirely:
```js
if (percentage >= 90) return { grade: 'EE1', ... };
if (percentage >= 75) return { grade: 'EE2', ... };
// ... hardcoded
```
Custom scales set by the school are silently ignored.

Fix: Fetch the active `GradingSystem` for the school on report
load and replace `getCBCGrade()` with a lookup against the fetched
`GradingRange[]` array.

**Gap 2 — Backup is not a real database export**
`BackupSettings.jsx` triggers a backend endpoint that saves the
Prisma schema file, not actual data.

Fix: Implement `pg_dump` via a child process on the backend,
stream the result as a `.sql.gz` file download:
```ts
const dump = spawn('pg_dump', [process.env.DATABASE_URL]);
res.setHeader('Content-Disposition', 'attachment; filename=backup.sql.gz');
dump.stdout.pipe(zlib.createGzip()).pipe(res);
```

**Gap 3 — Subject assignments not enforced**
Teachers are assigned to subjects in `SubjectAllocationPage.jsx`
which creates `SubjectAssignment` records. But
`recordFormativeResultsBulk` and `recordSummativeResultsBulk`
do not check whether `teacherId` has a `SubjectAssignment` for
that `learningArea + grade` combination. Any teacher can enter
scores for any subject.

Fix: Add a pre-check in both bulk result controllers:
```ts
const assignment = await prisma.subjectAssignment.findFirst({
  where: { teacherId, learningAreaId, grade }
});
if (!assignment) throw new ApiError(403, 'Not assigned to this subject');
```

---

## Module 12 — ID Printing
**Score: 40 / 100**

### What works
- `IDPrintingPage.jsx` page exists, `IDCardTemplate` model is
  in schema with all layout fields.

### Gaps

**Gap 1 — No template builder**
`templateDesign` and `templateCSS` are stored as free-text JSON
but there is no visual drag-and-drop editor. Templates can only
be created by editing the DB directly.

Fix: Build a simple `IDTemplateBuilder.jsx` with a live preview
panel. Store the layout as structured JSON:
```json
{ "fields": [{ "key": "name", "x": 40, "y": 30, "fontSize": 14 }] }
```

**Gap 2 — No bulk print**
Only single-card generation is implemented.

Fix: Add a "Print Class IDs" flow that generates all cards for
a selected grade and renders them in a print-optimised grid
(6 cards per A4 page, 2 columns × 3 rows).

**Gap 3 — QR code not rendered**
`IDCardTemplate.showQRCode` exists but the ID card render does
not generate or display a QR code.

Fix: Add `qrcode.react` and render a QR code encoding the
learner's `admissionNumber` when `showQRCode === true`.

---

## Module 13 — Planner / Schemes of Work
**Score: 65 / 100**

### What works
- Scheme creation per teacher/grade/subject/term, week-by-week
  entry with all CBC fields, status workflow
  (DRAFT → SUBMITTED → APPROVED → REJECTED).

### Gaps

**Gap 1 — No PDF export for schemes**
Teachers need to print schemes for submission. No export exists.

Fix: Render the scheme into a printable HTML table and call
`captureSingleReport('scheme-content', filename)`.

**Gap 2 — Calendar does not show term boundaries**
`CalendarView.jsx` renders events from the `Event` model but
term start/end dates from `TermConfig` are not overlaid.

Fix: Fetch `TermConfig` on calendar mount and render a shaded
background region for each term period.

**Gap 3 — Approval sends no notification**
When a `SchemeOfWork` is approved or rejected, the teacher who
submitted it receives no notification.

Fix: After `prisma.schemeOfWork.update({ status })`, call
`notificationService.send({ userId: scheme.teacherId, ... })`.

---

## Module 14 — Dashboard
**Score: 70 / 100**

### What works
- Stats cards (learner count, today's attendance rate,
  fee collection), recent activity feed, quick links.

### Gaps

**Gap 1 — Six separate API calls on every load**
Dashboard fires 6+ independent `useEffect` fetches on mount with
no caching. Each page visit re-fetches everything.

Fix: Create a single `GET /api/dashboard/summary` endpoint that
returns all stats in one query, and cache the result in Redis
for 60 seconds.

**Gap 2 — No role-scoped view**
A teacher sees the same admin dashboard — school-wide stats they
cannot action. They should see only their class attendance and
their assigned subjects' assessment status.

Fix: In `Dashboard.jsx`, branch on `user.role`:
```jsx
if (user.role === 'TEACHER') return <TeacherDashboard />;
return <AdminDashboard />;
```

**Gap 3 — No term progress indicator**
No visual shows how far through the current term the school is.

Fix: Fetch the active `TermConfig` and render a progress bar:
```
Term 1 2026:  ████████████░░░░  68% complete (Day 48 of 70)
```

---

## Module 15 — PDF Generation
**Score: 90 / 100**

### What works
- `simplePdfGenerator.js` fully refactored: `captureSingleReport`,
  `captureBulkReports`, `printWindow`, `buildOnclone` layout fixes,
  all legacy shims, parallel bulk capture with concurrency control.

### Gaps

**Gap 1 — Tall reports clip at 1123 px**
`LearnerReportTemplate` sets both `minHeight: '1123px'` and
`height: '1123px'`. If a learner has 9+ subjects the table
overflows 1123 px. `buildOnclone` sets `height: auto` on the
inner `.report-card`, but the outer wrapper's `height: 1123px`
still clips the canvas.

Fix: In `LearnerReportTemplate`, remove the hard `height`:
```jsx
style={{ width: '794px', minHeight: '1123px', /* height removed */ }}
```
`html2canvas` already reads `el.scrollHeight` in `captureOptions`.

**Gap 2 — No numeric progress bar**
Bulk export shows text messages only (`"Captured 3 of 40 pages…"`).
For 40+ learners the overlay sits motionless for 30 s.

Fix: Pass a `progress` number (0–100) alongside the message and
render a `<div style={{ width: `${progress}%` }}>` progress bar
in the loading overlay.

**Gap 3 — Cloudinary CORS not documented or enforced**
`useCORS: true` silently fails if the Cloudinary bucket has no
`Access-Control-Allow-Origin` header. The logo renders blank in
the PDF with no error shown.

Fix: Add a CORS check on branding load:
```js
const img = new Image(); img.crossOrigin = 'anonymous';
img.onerror = () => showWarning('Logo CORS issue detected. PDF logos may be blank.');
img.src = logoUrl;
```

---

## Module 16 — Authentication & Roles
**Score: 75 / 100**

### What works
- Login, OTP, password reset, JWT refresh, sidebar visibility
  gated by `user.role`.

### Gaps

**Gap 1 — API routes have no role enforcement (Critical)**
`authenticate` middleware verifies the JWT but no route checks
the role beyond that. A teacher with a valid token can call:
- `DELETE /api/assessments/tests/bulk` (archives any test)
- `POST /api/fees/invoices/bulk` (creates invoices for any grade)
- `PUT /api/school` (updates school profile)

Fix: Add a `requireRole(...roles)` middleware and apply it:
```ts
router.delete('/tests/bulk', authenticate, requireRole('ADMIN', 'HEAD_TEACHER', 'SUPER_ADMIN'), ...)
router.put('/school', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), ...)
```

**Gap 2 — Session expiry shows blank screen**
When the JWT expires, Axios returns 401, the auth context clears
the user, and the app redirects to `/auth/login` — but without
any "session expired" message. The login page loads with an empty
form and no context.

Fix: In `axiosInstance` response interceptor:
```js
if (error.response?.status === 401) {
  toast.error('Your session has expired. Please sign in again.');
  navigate('/auth/login');
}
```

**Gap 3 — SUPER_ADMIN shares the ADMIN UI**
`SUPER_ADMIN` has no dedicated panel. Super admin tasks
(school creation, system-wide reset, billing) are either hidden
in regular settings pages or accessible only via direct API calls.

Fix: Add a `SuperAdminPanel.jsx` page gated by
`user.role === 'SUPER_ADMIN'` with school management,
audit logs, and system health views.

---

## Priority Matrix

| # | Priority | Module | Specific Issue | Effort |
|---|---|---|---|---|
| 1 | 🔴 Critical | Auth | No backend role guards on API routes | Medium |
| 2 | 🔴 Critical | Accounting | All stats mocked, no live data | Medium |
| 3 | 🔴 Critical | Termly Report | Core competencies & values always blank | Small |
| 4 | 🔴 Critical | Summative | SummativeGrade enum mismatch with CBC | Small |
| 5 | 🟠 High | Fee | Invoice number sequence race condition | Small |
| 6 | 🟠 High | HR | Payroll stats mocked, payslip PDF missing | Medium |
| 7 | 🟠 High | Attendance | Export/Print buttons unwired | Small |
| 8 | 🟠 High | Settings | getCBCGrade() hardcoded, ignores DB scales | Medium |
| 9 | 🟠 High | PDF | Hard height clips tall reports | Small |
| 10 | 🟡 Medium | Communication | Scheduled broadcasts never fire | Medium |
| 11 | 🟡 Medium | Accounting | No double-entry validation | Small |
| 12 | 🟡 Medium | Accounting | Bank reconciliation not wired | Medium |
| 13 | 🟡 Medium | Inventory | No reorder alerts, no asset return UI | Small |
| 14 | 🟡 Medium | Fee | M-Pesa STK push not implemented | Large |
| 15 | 🟡 Medium | Formative | AggregationConfig never used | Large |
| 16 | 🟢 Low | Dashboard | Role-scoped views missing | Medium |
| 17 | 🟢 Low | Dashboard | 6 API calls on load, no caching | Small |
| 18 | 🟢 Low | Planner | PDF export, term calendar boundaries | Small |
| 19 | 🟢 Low | ID Printing | Template builder, QR code, bulk print | Large |
| 20 | 🟢 Low | Auth | Session expiry message | Small |

---

*Last updated: March 2026 — Full read of schema.prisma, all controllers,
all frontend page components, and service layer.*
