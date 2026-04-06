/*
  Warnings:

  - You are about to drop the column `assignedAt` on the `books` table. All the data in the column will be lost.
  - You are about to drop the column `assignedToId` on the `books` table. All the data in the column will be lost.
  - You are about to drop the column `returnDate` on the `books` table. All the data in the column will be lost.
  - The `status` column on the `books` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `grade` column on the `grading_systems` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[isbn]` on the table `books` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `grade` on the `subject_assignments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/

-- Step 1: Create Enums (Idempotent)
DO $$ BEGIN
    CREATE TYPE "BookStatus" AS ENUM ('AVAILABLE', 'LIMITED', 'OUT_OF_STOCK', 'DISCARDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "BookCondition" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "CopyStatus" AS ENUM ('AVAILABLE', 'BORROWED', 'RESERVED', 'LOST', 'DAMAGED', 'DISCARDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "MemberType" AS ENUM ('STUDENT', 'TEACHER', 'STAFF', 'EXTERNAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'EXPIRED', 'TERMINATED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "LoanStatus" AS ENUM ('ACTIVE', 'RETURNED', 'OVERDUE', 'LOST', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "FineReason" AS ENUM ('OVERDUE', 'DAMAGED', 'LOST');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "FineStatus" AS ENUM ('UNPAID', 'PAID', 'WAIVED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "ContentType" AS ENUM ('VIDEO', 'AUDIO', 'PDF', 'DOCUMENT', 'LINK', 'QUIZ', 'ASSIGNMENT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'COMPLETED', 'DROPPED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Alter FeeCategory (Idempotent)
DO $$ BEGIN
    ALTER TYPE "FeeCategory" ADD VALUE 'LIBRARY';
EXCEPTION WHEN others THEN null; END $$;

-- Step 2: Safe Alter existing tables (Idempotent)

-- books
DO $$ BEGIN
    ALTER TABLE "books" DROP CONSTRAINT "books_assignedToId_fkey";
EXCEPTION WHEN others THEN null; END $$;

DROP INDEX IF EXISTS "books_assignedToId_idx";
DROP INDEX IF EXISTS "books_status_idx";

DO $$ BEGIN
    -- These might fail if already dropped/added
    ALTER TABLE "books" DROP COLUMN IF EXISTS "assignedAt";
    ALTER TABLE "books" DROP COLUMN IF EXISTS "assignedToId";
    ALTER TABLE "books" DROP COLUMN IF EXISTS "returnDate";
    
    ALTER TABLE "books" ADD COLUMN IF NOT EXISTS "availableCopies" INTEGER NOT NULL DEFAULT 1;
    ALTER TABLE "books" ADD COLUMN IF NOT EXISTS "coverImage" TEXT;
    ALTER TABLE "books" ADD COLUMN IF NOT EXISTS "description" TEXT;
    ALTER TABLE "books" ADD COLUMN IF NOT EXISTS "edition" TEXT;
    ALTER TABLE "books" ADD COLUMN IF NOT EXISTS "language" TEXT DEFAULT 'English';
    ALTER TABLE "books" ADD COLUMN IF NOT EXISTS "pages" INTEGER;
    ALTER TABLE "books" ADD COLUMN IF NOT EXISTS "publicationYear" INTEGER;
    ALTER TABLE "books" ADD COLUMN IF NOT EXISTS "publisher" TEXT;
    ALTER TABLE "books" ADD COLUMN IF NOT EXISTS "totalCopies" INTEGER NOT NULL DEFAULT 1;
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    -- Special handling for dropping and recreating status with enum
    ALTER TABLE "books" DROP COLUMN IF EXISTS "status";
    ALTER TABLE "books" ADD COLUMN "status" "BookStatus" NOT NULL DEFAULT 'AVAILABLE';
EXCEPTION WHEN others THEN null; END $$;

-- grading_systems
DO $$ BEGIN
    ALTER TABLE "grading_systems" DROP COLUMN IF EXISTS "grade";
    ALTER TABLE "grading_systems" ADD COLUMN "grade" TEXT;
EXCEPTION WHEN others THEN null; END $$;

-- subject_assignments
DO $$ BEGIN
    ALTER TABLE "subject_assignments" DROP COLUMN IF EXISTS "grade";
    ALTER TABLE "subject_assignments" ADD COLUMN "grade" TEXT NOT NULL;
EXCEPTION WHEN others THEN null; END $$;

-- Safe DROP TYPE
DO $$ BEGIN
    DROP TYPE "SummativeGrade";
EXCEPTION WHEN others THEN null; END $$;

-- Step 3: Create Tables (IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS "book_copies" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "copyNumber" TEXT NOT NULL,
    "condition" "BookCondition" NOT NULL DEFAULT 'GOOD',
    "status" "CopyStatus" NOT NULL DEFAULT 'AVAILABLE',
    "location" TEXT,
    "barcode" TEXT,
    "acquiredAt" TIMESTAMP(3),
    "acquiredFrom" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_copies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "library_members" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "memberNumber" TEXT NOT NULL,
    "membershipType" "MemberType" NOT NULL DEFAULT 'STUDENT',
    "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "maxBooks" INTEGER NOT NULL DEFAULT 3,
    "maxDays" INTEGER NOT NULL DEFAULT 14,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "learnerId" TEXT,

    CONSTRAINT "library_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "book_loans" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "bookCopyId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "loanedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "returnedAt" TIMESTAMP(3),
    "status" "LoanStatus" NOT NULL DEFAULT 'ACTIVE',
    "renewedCount" INTEGER NOT NULL DEFAULT 0,
    "maxRenewals" INTEGER NOT NULL DEFAULT 2,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_loans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "fines" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" "FineReason" NOT NULL,
    "status" "FineStatus" NOT NULL DEFAULT 'UNPAID',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "waivedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "invoiceId" TEXT,

    CONSTRAINT "fines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "transport_vehicles" (
    "id" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "driverName" TEXT NOT NULL,
    "driverPhone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "transport_vehicles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "transport_routes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "vehicleId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "transport_routes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "transport_assignments" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "passengerId" TEXT NOT NULL,
    "passengerType" TEXT NOT NULL DEFAULT 'LEARNER',
    "pickupPoint" TEXT,
    "dropoffPoint" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "transport_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "lms_courses" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "lms_courses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "lms_content" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "ContentType" NOT NULL,
    "url" TEXT NOT NULL,
    "duration" INTEGER,
    "fileSize" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 1,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "lms_content_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "lms_enrollments" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "enrolledById" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unenrolledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "lms_enrollments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "lms_progress" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lms_progress_pkey" PRIMARY KEY ("id")
);

-- Step 4: Safe Unique Indexes (IF NOT EXISTS)
CREATE UNIQUE INDEX IF NOT EXISTS "book_copies_copyNumber_key" ON "book_copies"("copyNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "book_copies_barcode_key" ON "book_copies"("barcode");
CREATE INDEX IF NOT EXISTS "book_copies_bookId_idx" ON "book_copies"("bookId");
CREATE INDEX IF NOT EXISTS "book_copies_status_idx" ON "book_copies"("status");
CREATE INDEX IF NOT EXISTS "book_copies_barcode_idx" ON "book_copies"("barcode");
CREATE UNIQUE INDEX IF NOT EXISTS "library_members_userId_key" ON "library_members"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "library_members_memberNumber_key" ON "library_members"("memberNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "library_members_learnerId_key" ON "library_members"("learnerId");
CREATE INDEX IF NOT EXISTS "library_members_userId_idx" ON "library_members"("userId");
CREATE INDEX IF NOT EXISTS "library_members_learnerId_idx" ON "library_members"("learnerId");
CREATE INDEX IF NOT EXISTS "library_members_memberNumber_idx" ON "library_members"("memberNumber");
CREATE INDEX IF NOT EXISTS "library_members_status_idx" ON "library_members"("status");
CREATE INDEX IF NOT EXISTS "book_loans_bookId_idx" ON "book_loans"("bookId");
CREATE INDEX IF NOT EXISTS "book_loans_bookCopyId_idx" ON "book_loans"("bookCopyId");
CREATE INDEX IF NOT EXISTS "book_loans_memberId_idx" ON "book_loans"("memberId");
CREATE INDEX IF NOT EXISTS "book_loans_status_idx" ON "book_loans"("status");
CREATE INDEX IF NOT EXISTS "book_loans_dueDate_idx" ON "book_loans"("dueDate");
CREATE INDEX IF NOT EXISTS "fines_loanId_idx" ON "fines"("loanId");
CREATE INDEX IF NOT EXISTS "fines_memberId_idx" ON "fines"("memberId");
CREATE INDEX IF NOT EXISTS "fines_status_idx" ON "fines"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "transport_vehicles_registrationNumber_key" ON "transport_vehicles"("registrationNumber");
CREATE INDEX IF NOT EXISTS "transport_routes_vehicleId_idx" ON "transport_routes"("vehicleId");
CREATE INDEX IF NOT EXISTS "transport_assignments_routeId_idx" ON "transport_assignments"("routeId");
CREATE INDEX IF NOT EXISTS "transport_assignments_passengerId_idx" ON "transport_assignments"("passengerId");
CREATE INDEX IF NOT EXISTS "lms_courses_createdById_idx" ON "lms_courses"("createdById");
CREATE INDEX IF NOT EXISTS "lms_courses_subject_idx" ON "lms_courses"("subject");
CREATE INDEX IF NOT EXISTS "lms_courses_grade_idx" ON "lms_courses"("grade");
CREATE INDEX IF NOT EXISTS "lms_courses_status_idx" ON "lms_courses"("status");
CREATE INDEX IF NOT EXISTS "lms_content_courseId_idx" ON "lms_content"("courseId");
CREATE INDEX IF NOT EXISTS "lms_content_uploadedById_idx" ON "lms_content"("uploadedById");
CREATE INDEX IF NOT EXISTS "lms_content_type_idx" ON "lms_content"("type");
CREATE INDEX IF NOT EXISTS "lms_enrollments_courseId_idx" ON "lms_enrollments"("courseId");
CREATE INDEX IF NOT EXISTS "lms_enrollments_learnerId_idx" ON "lms_enrollments"("learnerId");
CREATE INDEX IF NOT EXISTS "lms_enrollments_enrolledById_idx" ON "lms_enrollments"("enrolledById");
CREATE INDEX IF NOT EXISTS "lms_enrollments_status_idx" ON "lms_enrollments"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "lms_enrollments_courseId_learnerId_key" ON "lms_enrollments"("courseId", "learnerId");
CREATE INDEX IF NOT EXISTS "lms_progress_enrollmentId_idx" ON "lms_progress"("enrollmentId");
CREATE INDEX IF NOT EXISTS "lms_progress_contentId_idx" ON "lms_progress"("contentId");
CREATE UNIQUE INDEX IF NOT EXISTS "lms_progress_enrollmentId_contentId_key" ON "lms_progress"("enrollmentId", "contentId");
CREATE UNIQUE INDEX IF NOT EXISTS "books_isbn_key" ON "books"("isbn");
CREATE INDEX IF NOT EXISTS "books_title_idx" ON "books"("title");
CREATE INDEX IF NOT EXISTS "books_author_idx" ON "books"("author");
CREATE INDEX IF NOT EXISTS "books_isbn_idx" ON "books"("isbn");
CREATE INDEX IF NOT EXISTS "books_category_idx" ON "books"("category");
CREATE INDEX IF NOT EXISTS "grading_systems_grade_idx" ON "grading_systems"("grade");
CREATE INDEX IF NOT EXISTS "subject_assignments_grade_idx" ON "subject_assignments"("grade");
CREATE UNIQUE INDEX IF NOT EXISTS "subject_assignments_teacherId_learningAreaId_grade_key" ON "subject_assignments"("teacherId", "learningAreaId", "grade");

-- Step 5: Safe Foreign Keys (Wrappers)
DO $$ BEGIN
    ALTER TABLE "book_copies" ADD CONSTRAINT "book_copies_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "library_members" ADD CONSTRAINT "library_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "library_members" ADD CONSTRAINT "library_members_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "learners"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "book_loans" ADD CONSTRAINT "book_loans_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "book_loans" ADD CONSTRAINT "book_loans_bookCopyId_fkey" FOREIGN KEY ("bookCopyId") REFERENCES "book_copies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "book_loans" ADD CONSTRAINT "book_loans_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "library_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "fines" ADD CONSTRAINT "fines_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "book_loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "fines" ADD CONSTRAINT "fines_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "library_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "fines" ADD CONSTRAINT "fines_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "fee_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "fines" ADD CONSTRAINT "fines_waivedById_fkey" FOREIGN KEY ("waivedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "transport_routes" ADD CONSTRAINT "transport_routes_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "transport_vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "transport_assignments" ADD CONSTRAINT "transport_assignments_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "transport_routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "lms_courses" ADD CONSTRAINT "lms_courses_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "lms_content" ADD CONSTRAINT "lms_content_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "lms_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "lms_content" ADD CONSTRAINT "lms_content_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "lms_enrollments" ADD CONSTRAINT "lms_enrollments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "lms_courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "lms_enrollments" ADD CONSTRAINT "lms_enrollments_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "learners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "lms_enrollments" ADD CONSTRAINT "lms_enrollments_enrolledById_fkey" FOREIGN KEY ("enrolledById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "lms_progress" ADD CONSTRAINT "lms_progress_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "lms_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "lms_progress" ADD CONSTRAINT "lms_progress_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "lms_content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN others THEN null; END $$;
