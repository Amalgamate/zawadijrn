# Zawadi SMS — Multi-Curriculum Expansion Plan
## Adding Secondary (8-4-4 / KCSE) & Tertiary (College/University) Support

---

## The Core Concept: Institution Modes

The system already supports **CBC** (Kenya's current curriculum).
We need to add two more modes, each with its own:
- Curriculum structure
- Grading system
- Navigation (sidebar)
- Assessment tools
- Class/Grade naming conventions

| Mode | Who | Grades/Levels | Grading |
|---|---|---|---|
| **CBC** (current) | Primary schools | PP1–Grade 9 | Rubric (EE/ME/AE/BE) |
| **Secondary** (new) | Secondary schools | Form 1–4 | Marks/GPA (KCSE A–E) |
| **Tertiary** (new) | Colleges/Universities | Year 1–4 / Semester | Credit Hours / GPA |

Users belong to **one institution type**. When you log in, you only see your type's UI.

---

## Phase 1 — Foundation (Backend)
**Estimated effort: 1–2 weeks**

### 1.1 Extend the Database Schema

**Add `institutionType` to the `School` model (Prisma):**
```prisma
enum InstitutionType {
  PRIMARY_CBC
  SECONDARY
  TERTIARY
}

model School {
  // ... existing fields
  institutionType InstitutionType @default(PRIMARY_CBC)
}
```

**Add `institutionType` to the `User` model:**
```prisma
model User {
  // ... existing fields
  institutionType InstitutionType @default(PRIMARY_CBC)
  schoolId        String?         // tie user to a specific institution
}
```

**New Secondary-specific models:**
```prisma
enum SecondaryGrade {
  FORM_1
  FORM_2
  FORM_3
  FORM_4
}

model SecondarySubject {
  id        String @id @default(uuid())
  name      String
  code      String @unique
  category  String // Sciences, Humanities, Languages, Technical
  compulsory Boolean @default(false)
  createdAt DateTime @default(now())
}

model KCSEResult {
  id          String @id @default(uuid())
  learnerId   String
  subjectId   String
  examYear    Int
  rawMark     Int
  grade       String // A, A-, B+, B, B-, C+, C, C-, D+, D, D-, E
  points      Int    // 12=A, 11=A-, ... 1=E
  learner     Learner @relation(fields: [...])
  subject     SecondarySubject @relation(fields: [...])
}

model MeanGrade {
  id          String @id @default(uuid())
  learnerId   String
  term        String
  academicYear Int
  totalPoints Int
  meanGrade   String // A–E
  meanScore   Float
  position    Int?
}
```

**New Tertiary-specific models:**
```prisma
enum TertiaryLevel {
  CERTIFICATE
  DIPLOMA
  DEGREE
  POSTGRADUATE
}

model TertiaryUnit {
  id          String @id @default(uuid())
  code        String @unique  // e.g. BIT 101
  name        String
  creditHours Int    @default(3)
  year        Int
  semester    Int
  department  String
}

model UnitEnrollment {
  id        String @id @default(uuid())
  studentId String
  unitId    String
  semester  Int
  year      Int
}

model UnitResult {
  id          String @id @default(uuid())
  studentId   String
  unitId      String
  cats        Float  // Continuous Assessment Tests (30%)
  exam        Float  // Final Exam (70%)
  total       Float
  grade       String // A, B+, B, C+, C, D+, D, E
  gradePoints Float  // GPA points
  semester    Int
  year        Int
}
```

### 1.2 New API Routes
- `GET/POST /api/secondary/subjects`
- `GET/POST /api/secondary/results`
- `GET/POST /api/tertiary/units`
- `GET/POST /api/tertiary/results`
- `GET /api/institution/type` → returns current user's institution type

---

## Phase 2 — Authentication & Isolation
**Estimated effort: 3–5 days**

### 2.1 Seed Dummy Users (immediate)

Create 3 demo accounts with the same role structure but different institution types:

| Email | Password | Type | Role |
|---|---|---|---|
| `admin@cbc-demo.zawadi.co.ke` | `Demo@2024` | PRIMARY_CBC | ADMIN |
| `admin@secondary-demo.zawadi.co.ke` | `Demo@2024` | SECONDARY | ADMIN |
| `teacher@secondary-demo.zawadi.co.ke` | `Demo@2024` | SECONDARY | TEACHER |
| `admin@tertiary-demo.zawadi.co.ke` | `Demo@2024` | TERTIARY | ADMIN |
| `lecturer@tertiary-demo.zawadi.co.ke` | `Demo@2024` | TERTIARY | TEACHER |

### 2.2 Add `institutionType` to JWT payload
When the user logs in, include `institutionType` in the token so:
- The frontend knows what nav to show immediately
- The backend can scope all queries to the right institution

### 2.3 Update `useAuthStore`
```js
// src/store/useAuthStore.js
// Add institutionType to persisted state
setAuth: (user, token) => set({
  user,
  token,
  isAuthenticated: !!user,
  institutionType: user?.institutionType || 'PRIMARY_CBC'
})
```

---

## Phase 3 — Frontend Navigation Isolation
**Estimated effort: 1 week**

This is the KEY requirement: *"when I log in to CBC I will not see the secondary and tertiary items"*

### 3.1 Create Institution-Specific Nav Configs

**New file: `src/config/institutionNav.js`**

```
src/config/
  institutionNav.js      ← maps institutionType → which nav sections to show
  secondaryNav.js        ← nav sections for secondary schools
  tertiaryNav.js         ← nav sections for tertiary institutions
```

**Logic:**
```
institutionType = PRIMARY_CBC  → show existing CBC nav (current Sidebar behaviour)
institutionType = SECONDARY    → show secondary nav (subjects, KCSE results, mean grades)
institutionType = TERTIARY     → show tertiary nav (units, GPA, semesters, CATs)
```

### 3.2 Update `useNavigation.js`

Add institution type check at the top:
```js
export const useNavigation = () => {
  const { can, role } = usePermissions();
  const { user } = useAuth();
  const institutionType = user?.institutionType || 'PRIMARY_CBC';

  // Return completely different nav based on institution type
  if (institutionType === 'SECONDARY') return useSecondaryNavigation({ can, role });
  if (institutionType === 'TERTIARY') return useTertiaryNavigation({ can, role });

  // Default: existing CBC nav (no changes needed)
  return useCBCNavigation({ can, role });
};
```

### 3.3 Secondary Nav Sections

New sections specific to secondary:
- **Academics** — Subjects, Class Lists, Form Groups
- **Assessment** — CATs, Mid-term Exams, End-term Exams, KCSE Mocks
- **Results** — Mark Entry, Mean Grades, Subject Analysis, Class Rankings
- **KCSE Prep** — Past Papers, Predicted Grades
- **Attendance**, **Finance**, **HR**, **Settings** (shared modules — same UI)

### 3.4 Tertiary Nav Sections

New sections specific to tertiary:
- **Academic Programs** — Departments, Courses/Programs, Units
- **Assessment** — CATs (30%), Exams (70%), Grade Sheets
- **Results** — Unit Results, GPA Calculator, Transcripts, Semester Reports
- **Student Affairs** — Hostels, Clubs, Clearance
- **Attendance**, **Finance**, **HR**, **Settings** (shared)

---

## Phase 4 — Secondary School Features
**Estimated effort: 2–3 weeks**

### Pages to Build:
| Page | Description |
|---|---|
| `SecondaryDashboard` | Mean grades overview, KCSE countdown, subject performance |
| `SubjectManagement` | Add/edit secondary subjects with codes |
| `FormGroups` | Form 1–4 class management (replaces CBC grades) |
| `MarkEntry` | Enter raw marks → auto-calculate grade (A–E) and points |
| `MeanGradesPage` | View/print mean grades per student per term |
| `ClassRankingPage` | Rankings by subject, form, stream |
| `KCSEMockResults` | Track mock performance, predict final grades |
| `SubjectAnalysisPage` | Teacher's subject performance analytics |

### Grading Scale (8-4-4 / KCSE):
```
A   → 75–100%  → 12 points
A-  → 70–74%   → 11 points
B+  → 65–69%   → 10 points
B   → 60–64%   → 9 points
B-  → 55–59%   → 8 points
C+  → 50–54%   → 7 points
C   → 45–49%   → 6 points
C-  → 40–44%   → 5 points
D+  → 35–39%   → 4 points
D   → 30–34%   → 3 points
D-  → 25–29%   → 2 points
E   → 0–24%    → 1 point
```

---

## Phase 5 — Tertiary Institution Features
**Estimated effort: 2–3 weeks**

### Pages to Build:
| Page | Description |
|---|---|
| `TertiaryDashboard` | GPA overview, unit pass rates, semester summary |
| `DepartmentManagement` | Departments, programs, academic calendar |
| `UnitManagement` | Unit codes, credit hours, prerequisites |
| `UnitEnrollment` | Enroll students into units per semester |
| `CATEntry` | Enter CAT scores (30% weight) |
| `ExamEntry` | Enter exam scores (70% weight) → auto-total |
| `GradeSheet` | Full grade sheet per unit per semester |
| `GPACalculator` | Cumulative GPA, semester GPA, classification |
| `TranscriptPage` | Generate official-style academic transcripts |
| `SemesterReport` | Student's full semester performance report |

### Grading Scale (standard Kenyan university):
```
A   → 70–100%  → 4.0 points  → First Class
B+  → 60–69%   → 3.5 points  → Upper Second
B   → 50–59%   → 3.0 points  → Lower Second
C+  → 45–49%   → 2.5 points  → Pass
C   → 40–44%   → 2.0 points  → Pass
D   → 35–39%   → 1.0 points  → Fail (Supplementary)
E   → 0–34%    → 0.0 points  → Fail (Retake)
```

---

## Phase 6 — Shared Module Adaptations
**Estimated effort: 1 week**

Some modules are shared across all institution types but need minor label changes:

| Module | CBC Label | Secondary Label | Tertiary Label |
|---|---|---|---|
| Students | Scholars / Learners | Students | Students |
| Teachers | Tutors | Teachers | Lecturers |
| Classes | Classes | Form Groups | Cohorts |
| Terms | Term 1/2/3 | Term 1/2/3 | Semester 1/2 |
| Subjects | Learning Areas | Subjects | Units |
| Grades | PP1–Grade 9 | Form 1–4 | Year 1–4 |
| Reports | Termly Report | End-of-Term Report | Semester Transcript |

Implement via a shared `useInstitutionLabels()` hook:
```js
const { studentLabel, teacherLabel, classLabel } = useInstitutionLabels();
// Returns the right label based on user's institutionType
```

---

## Implementation Order (Recommended)

```
Week 1:  Phase 1 (DB schema + migrations)
Week 2:  Phase 2 (Auth isolation + dummy users) + Phase 3 (Nav isolation)
Week 3:  Phase 4 — Secondary school pages (core: Mark Entry, Mean Grades)
Week 4:  Phase 4 — Secondary school pages (secondary: Rankings, Analysis)
Week 5:  Phase 5 — Tertiary pages (core: Units, GPA, Grade Sheet)
Week 6:  Phase 5 — Tertiary pages (secondary: Transcripts, Reports)
Week 7:  Phase 6 (Shared module adaptations + label hooks)
Week 8:  QA, dummy data seeding, demo environment setup
```

---

## What We Do FIRST (Next Session)

1. **Add `institutionType` enum to Prisma schema**
2. **Create `scripts/seed-demo-users.mjs`** — seeds all 5 dummy users with correct institution types
3. **Update `useNavigation.js`** — branch on institution type (CBC users see zero secondary/tertiary nav)
4. **Create `src/config/secondaryNav.js`** — secondary nav structure
5. **Create `src/config/tertiaryNav.js`** — tertiary nav structure

This gives you working login isolation for all three modes immediately,
then we build the actual pages on top of the isolated foundation.
