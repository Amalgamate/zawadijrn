-- Duty roster + teacher duty notification support

CREATE TYPE "DutyRosterFrequency" AS ENUM ('DAILY', 'WEEKLY');
CREATE TYPE "DutyNotificationType" AS ENUM ('PREVIOUS_DAY', 'SAME_DAY', 'WEEKLY_SUMMARY');

CREATE TABLE "duty_rosters" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "frequency" "DutyRosterFrequency" NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "reminderEnabled" BOOLEAN NOT NULL DEFAULT true,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "duty_rosters_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "duty_roster_assignments" (
  "id" TEXT NOT NULL,
  "rosterId" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "dutyDate" TIMESTAMP(3) NOT NULL,
  "role" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "duty_roster_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "duty_notification_logs" (
  "id" TEXT NOT NULL,
  "assignmentId" TEXT NOT NULL,
  "type" "DutyNotificationType" NOT NULL,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "duty_notification_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "duty_roster_assignments_rosterId_teacherId_dutyDate_key"
  ON "duty_roster_assignments"("rosterId", "teacherId", "dutyDate");

CREATE UNIQUE INDEX "duty_notification_logs_assignmentId_type_key"
  ON "duty_notification_logs"("assignmentId", "type");

CREATE INDEX "duty_rosters_isActive_frequency_idx"
  ON "duty_rosters"("isActive", "frequency");

CREATE INDEX "duty_rosters_startDate_endDate_idx"
  ON "duty_rosters"("startDate", "endDate");

CREATE INDEX "duty_roster_assignments_teacherId_dutyDate_idx"
  ON "duty_roster_assignments"("teacherId", "dutyDate");

CREATE INDEX "duty_roster_assignments_dutyDate_idx"
  ON "duty_roster_assignments"("dutyDate");

CREATE INDEX "duty_notification_logs_sentAt_idx"
  ON "duty_notification_logs"("sentAt");

ALTER TABLE "duty_rosters"
  ADD CONSTRAINT "duty_rosters_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "duty_roster_assignments"
  ADD CONSTRAINT "duty_roster_assignments_rosterId_fkey"
  FOREIGN KEY ("rosterId") REFERENCES "duty_rosters"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "duty_roster_assignments"
  ADD CONSTRAINT "duty_roster_assignments_teacherId_fkey"
  FOREIGN KEY ("teacherId") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "duty_notification_logs"
  ADD CONSTRAINT "duty_notification_logs_assignmentId_fkey"
  FOREIGN KEY ("assignmentId") REFERENCES "duty_roster_assignments"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
