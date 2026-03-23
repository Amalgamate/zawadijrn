-- CreateEnum
CREATE TYPE "SoWStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "schemes_of_work" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "grade" "Grade" NOT NULL,
    "learningArea" TEXT NOT NULL,
    "term" "Term" NOT NULL,
    "academicYear" INTEGER NOT NULL,
    "classId" TEXT,
    "title" TEXT,
    "status" "SoWStatus" NOT NULL DEFAULT 'DRAFT',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "schemes_of_work_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheme_of_work_weeks" (
    "id" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "strand" TEXT,
    "subStrand" TEXT,
    "outcomes" TEXT,
    "inquiryQuestions" TEXT,
    "activities" TEXT,
    "coreCompetencies" TEXT,
    "values" TEXT,
    "pertinentIssues" TEXT,
    "resources" TEXT,
    "assessment" TEXT,
    "remarks" TEXT,

    CONSTRAINT "scheme_of_work_weeks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "schemes_of_work_grade_term_academicYear_idx" ON "schemes_of_work"("grade", "term", "academicYear");
CREATE INDEX "schemes_of_work_teacherId_idx" ON "schemes_of_work"("teacherId");
CREATE INDEX "schemes_of_work_status_idx" ON "schemes_of_work"("status");
CREATE UNIQUE INDEX "schemes_of_work_teacherId_grade_learningArea_term_academic_key" ON "schemes_of_work"("teacherId", "grade", "learningArea", "term", "academicYear");

-- CreateIndex
CREATE INDEX "scheme_of_work_weeks_schemeId_idx" ON "scheme_of_work_weeks"("schemeId");
CREATE UNIQUE INDEX "scheme_of_work_weeks_schemeId_weekNumber_key" ON "scheme_of_work_weeks"("schemeId", "weekNumber");

-- AddForeignKey
ALTER TABLE "schemes_of_work" ADD CONSTRAINT "schemes_of_work_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "scheme_of_work_weeks" ADD CONSTRAINT "scheme_of_work_weeks_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "schemes_of_work"("id") ON DELETE CASCADE ON UPDATE CASCADE;
