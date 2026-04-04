/*
  Warnings:

  - The values [CRECHE,RECEPTION,TRANSITION,GRADE_10,GRADE_11,GRADE_12] on the enum `Grade` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `branchId` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `attendances` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `bank_statements` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `books` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `broadcast_campaigns` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `broadcast_recipients` table. All the data in the column will be lost.
  - You are about to drop the column `schoolId` on the `broadcast_recipients` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `class_enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `schoolId` on the `class_enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `class_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `schoolId` on the `class_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `co_curricular_activities` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `contact_groups` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `core_competencies` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `fee_invoices` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `fee_structures` table. All the data in the column will be lost.
  - You are about to drop the column `schoolId` on the `fee_types` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `fixed_assets` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `formative_assessments` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `inventory_items` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `inventory_stores` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `journal_entries` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `journals` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `learning_areas` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `message_receipts` table. All the data in the column will be lost.
  - You are about to drop the column `schoolId` on the `message_receipts` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `schoolId` on the `notices` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `payroll_records` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `performance_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `sms_delivery_logs` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `staff_documents` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `stock_movements` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `stock_requisitions` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `subject_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `summative_results` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `summative_tests` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `termly_report_comments` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `values_assessments` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `schoolId` on the `vendors` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[grade,term,academicYear]` on the table `fee_structures` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[grade,learningArea,term,academicYear,testType]` on the table `summative_tests` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[academicYear,term]` on the table `term_configs` will be added. If there are existing duplicate values, this will fail.
  - Made the column `whatsappEnabled` on table `communication_configs` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Grade_new" AS ENUM ('PLAYGROUP', 'PP1', 'PP2', 'GRADE_1', 'GRADE_2', 'GRADE_3', 'GRADE_4', 'GRADE_5', 'GRADE_6', 'GRADE_7', 'GRADE_8', 'GRADE_9');
ALTER TABLE "classes" ALTER COLUMN "grade" TYPE "Grade_new" USING ("grade"::text::"Grade_new");
ALTER TABLE "learners" ALTER COLUMN "grade" TYPE "Grade_new" USING ("grade"::text::"Grade_new");
ALTER TABLE "summative_tests" ALTER COLUMN "grade" TYPE "Grade_new" USING ("grade"::text::"Grade_new");
ALTER TABLE "aggregation_configs" ALTER COLUMN "grade" TYPE "Grade_new" USING ("grade"::text::"Grade_new");
ALTER TABLE "fee_structures" ALTER COLUMN "grade" TYPE "Grade_new" USING ("grade"::text::"Grade_new");
ALTER TABLE "grading_systems" ALTER COLUMN "grade" TYPE "Grade_new" USING ("grade"::text::"Grade_new");
ALTER TABLE "subject_assignments" ALTER COLUMN "grade" TYPE "Grade_new" USING ("grade"::text::"Grade_new");
ALTER TABLE "schemes_of_work" ALTER COLUMN "grade" TYPE "Grade_new" USING ("grade"::text::"Grade_new");
ALTER TYPE "Grade" RENAME TO "Grade_old";
ALTER TYPE "Grade_new" RENAME TO "Grade";
DROP TYPE "Grade_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "broadcast_recipients" DROP CONSTRAINT "broadcast_recipients_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "class_enrollments" DROP CONSTRAINT "class_enrollments_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "class_schedules" DROP CONSTRAINT "class_schedules_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "fee_types" DROP CONSTRAINT "fee_types_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "message_receipts" DROP CONSTRAINT "message_receipts_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "notices" DROP CONSTRAINT "notices_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "vendors" DROP CONSTRAINT "vendors_schoolId_fkey";

-- DropIndex
DROP INDEX "audit_logs_createdAt_idx";

-- DropIndex
DROP INDEX "broadcast_recipients_schoolId_idx";

-- DropIndex
DROP INDEX "class_enrollments_schoolId_idx";

-- DropIndex
DROP INDEX "class_schedules_schoolId_idx";

-- DropIndex
DROP INDEX "events_creatorId_idx";

-- DropIndex
DROP INDEX "events_startDate_endDate_idx";

-- DropIndex
DROP INDEX "message_receipts_schoolId_idx";

-- DropIndex
DROP INDEX "notices_schoolId_archived_idx";

-- DropIndex
DROP INDEX "notices_schoolId_status_publishedAt_idx";

-- DropIndex
DROP INDEX "vendors_schoolId_idx";

-- AlterTable
ALTER TABLE "accounts" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "attendances" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "bank_statements" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "books" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "broadcast_campaigns" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "broadcast_recipients" DROP COLUMN "branchId",
DROP COLUMN "schoolId";

-- AlterTable
ALTER TABLE "class_enrollments" DROP COLUMN "branchId",
DROP COLUMN "schoolId";

-- AlterTable
ALTER TABLE "class_schedules" DROP COLUMN "branchId",
DROP COLUMN "schoolId";

-- AlterTable
ALTER TABLE "co_curricular_activities" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "communication_configs" ALTER COLUMN "whatsappEnabled" SET NOT NULL;

-- AlterTable
ALTER TABLE "contact_groups" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "core_competencies" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "documents" DROP COLUMN "branchId";

-- AlterTable (idempotent: rename pkey only if old name still exists)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Event_pkey' AND table_name = 'events'
  ) THEN
    ALTER TABLE "events" RENAME CONSTRAINT "Event_pkey" TO "events_pkey";
  END IF;
END $$;
ALTER TABLE "events" DROP COLUMN IF EXISTS "branchId";

-- AlterTable
ALTER TABLE "expenses" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "fee_invoices" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "fee_structures" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "fee_types" DROP COLUMN "schoolId";

-- AlterTable
ALTER TABLE "fixed_assets" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "formative_assessments" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "inventory_items" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "inventory_stores" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "journal_entries" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "journals" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "learning_areas" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "message_receipts" DROP COLUMN "branchId",
DROP COLUMN "schoolId";

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "notices" DROP COLUMN "schoolId";

-- AlterTable
ALTER TABLE "payroll_records" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "performance_reviews" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "sms_delivery_logs" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "staff_documents" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "stock_movements" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "stock_requisitions" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "subject_assignments" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "summative_results" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "summative_tests" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "termly_report_comments" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "values_assessments" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "vendors" DROP COLUMN "branchId",
DROP COLUMN "schoolId";

-- CreateTable
CREATE TABLE "biometric_devices" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'TERMINAL',
    "location" TEXT,
    "ipAddress" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OFFLINE',
    "lastSeen" TIMESTAMP(3),
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "biometric_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "biometric_credentials" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "learnerId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'FINGERPRINT',
    "template" TEXT NOT NULL,
    "fingerIndex" INTEGER,
    "quality" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "biometric_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "biometric_logs" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "personType" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'IN',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,

    CONSTRAINT "biometric_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "biometric_devices_deviceId_key" ON "biometric_devices"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "biometric_devices_token_key" ON "biometric_devices"("token");

-- CreateIndex
CREATE INDEX "biometric_credentials_userId_idx" ON "biometric_credentials"("userId");

-- CreateIndex
CREATE INDEX "biometric_credentials_learnerId_idx" ON "biometric_credentials"("learnerId");

-- CreateIndex
CREATE INDEX "biometric_logs_deviceId_idx" ON "biometric_logs"("deviceId");

-- CreateIndex
CREATE INDEX "biometric_logs_status_idx" ON "biometric_logs"("status");

-- CreateIndex
CREATE INDEX "biometric_logs_timestamp_idx" ON "biometric_logs"("timestamp");

-- CreateIndex
CREATE INDEX "assessment_sms_audits_channel_smsStatus_idx" ON "assessment_sms_audits"("channel", "smsStatus");

-- CreateIndex
CREATE UNIQUE INDEX "fee_structures_grade_term_academicYear_key" ON "fee_structures"("grade", "term", "academicYear");

-- CreateIndex
CREATE INDEX "learners_grade_status_archived_idx" ON "learners"("grade", "status", "archived");

-- CreateIndex
CREATE INDEX "notices_status_publishedAt_idx" ON "notices"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "notices_archived_idx" ON "notices"("archived");

-- CreateIndex
CREATE UNIQUE INDEX "summative_tests_grade_learningArea_term_academicYear_testTy_key" ON "summative_tests"("grade", "learningArea", "term", "academicYear", "testType");

-- CreateIndex
CREATE UNIQUE INDEX "term_configs_academicYear_term_key" ON "term_configs"("academicYear", "term");

-- RenameForeignKey (idempotent)
DO $$ BEGIN
  -- Old name exists AND new name already exists = duplicate; drop the old one
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Event_creatorId_fkey' AND table_name = 'events'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'events_creatorId_fkey' AND table_name = 'events'
  ) THEN
    ALTER TABLE "events" DROP CONSTRAINT "Event_creatorId_fkey";
  -- Old name exists but new does not = safe to rename
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Event_creatorId_fkey' AND table_name = 'events'
  ) THEN
    ALTER TABLE "events" RENAME CONSTRAINT "Event_creatorId_fkey" TO "events_creatorId_fkey";
  END IF;
END $$;

-- AddForeignKey (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'biometric_credentials_userId_fkey'
  ) THEN
    ALTER TABLE "biometric_credentials" ADD CONSTRAINT "biometric_credentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'biometric_credentials_learnerId_fkey'
  ) THEN
    ALTER TABLE "biometric_credentials" ADD CONSTRAINT "biometric_credentials_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'biometric_logs_deviceId_fkey'
  ) THEN
    ALTER TABLE "biometric_logs" ADD CONSTRAINT "biometric_logs_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "biometric_devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- RenameIndex (idempotent)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'schemes_of_work_teacherId_grade_learningArea_term_academic_key'
  ) THEN
    ALTER INDEX "schemes_of_work_teacherId_grade_learningArea_term_academic_key"
      RENAME TO "schemes_of_work_teacherId_grade_learningArea_term_academicY_key";
  END IF;
END $$;
