-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'HEAD_OF_CURRICULUM', 'TEACHER', 'PARENT', 'ACCOUNTANT', 'RECEPTIONIST', 'LIBRARIAN', 'NURSE', 'SECURITY', 'DRIVER', 'COOK', 'CLEANER', 'GROUNDSKEEPER', 'IT_SUPPORT', 'STUDENT');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "Grade" AS ENUM ('CRECHE', 'RECEPTION', 'TRANSITION', 'PLAYGROUP', 'PP1', 'PP2', 'GRADE_1', 'GRADE_2', 'GRADE_3', 'GRADE_4', 'GRADE_5', 'GRADE_6', 'GRADE_7', 'GRADE_8', 'GRADE_9', 'GRADE_10', 'GRADE_11', 'GRADE_12');

-- CreateEnum
CREATE TYPE "LearnerStatus" AS ENUM ('ACTIVE', 'TRANSFERRED_OUT', 'GRADUATED', 'DROPPED_OUT', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "Term" AS ENUM ('TERM_1', 'TERM_2', 'TERM_3');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'SICK');

-- CreateEnum
CREATE TYPE "FormativeAssessmentType" AS ENUM ('OPENER', 'WEEKLY', 'MONTHLY', 'CAT', 'MID_TERM', 'ASSIGNMENT', 'PROJECT', 'PRACTICAL', 'QUIZ', 'OBSERVATION', 'ORAL', 'EXAM', 'OTHER');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'PUBLISHED', 'LOCKED');

-- CreateEnum
CREATE TYPE "AggregationStrategy" AS ENUM ('SIMPLE_AVERAGE', 'BEST_N', 'DROP_LOWEST_N', 'WEIGHTED_AVERAGE', 'MEDIAN');

-- CreateEnum
CREATE TYPE "CurriculumType" AS ENUM ('CBC_ONLY', 'EXAM_ONLY', 'CBC_AND_EXAM', 'IGCSE', 'CAMBRIDGE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AssessmentMode" AS ENUM ('FORMATIVE_ONLY', 'SUMMATIVE_ONLY', 'MIXED');

-- CreateEnum
CREATE TYPE "AdmissionFormatType" AS ENUM ('NO_BRANCH', 'BRANCH_PREFIX_START', 'BRANCH_PREFIX_MIDDLE', 'BRANCH_PREFIX_END');

-- CreateEnum
CREATE TYPE "RubricRating" AS ENUM ('EE', 'ME', 'AE', 'BE');

-- CreateEnum
CREATE TYPE "DetailedRubricRating" AS ENUM ('EE1', 'EE2', 'ME1', 'ME2', 'AE1', 'AE2', 'BE1', 'BE2');

-- CreateEnum
CREATE TYPE "SummativeGrade" AS ENUM ('A', 'B', 'C', 'D', 'E');

-- CreateEnum
CREATE TYPE "TestStatus" AS ENUM ('PASS', 'FAIL');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'DRAFT');

-- CreateEnum
CREATE TYPE "IDCardType" AS ENUM ('STUDENT', 'STAFF', 'VISITOR', 'TEMPORARY');

-- CreateEnum
CREATE TYPE "FeeCategory" AS ENUM ('ACADEMIC', 'BOARDING', 'TRANSPORT', 'EXTRA_CURRICULAR', 'ADMINISTRATIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERPAID', 'WAIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'MPESA', 'BANK_TRANSFER', 'CHEQUE', 'CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('EMAIL', 'WHATSAPP', 'SMS', 'IN_APP');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('DRAFT', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED');

-- CreateEnum
CREATE TYPE "RecipientType" AS ENUM ('INDIVIDUAL', 'CLASS', 'GRADE', 'ALL_PARENTS', 'ALL_TEACHERS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "CommunicationChannel" AS ENUM ('SMS', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('GENERAL', 'ACADEMIC', 'SPORTS', 'MEETING', 'HOLIDAY', 'EXAM');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('DRAFT', 'GENERATED', 'PAID', 'VOID');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSET_RECEIVABLE', 'ASSET_CASH', 'ASSET_NON_CURRENT', 'LIABILITY_PAYABLE', 'LIABILITY_CURRENT', 'LIABILITY_NON_CURRENT', 'EQUITY', 'REVENUE', 'EXPENSE', 'EXPENSE_DEPRECIATION');

-- CreateEnum
CREATE TYPE "JournalType" AS ENUM ('SALES', 'PURCHASE', 'CASH', 'BANK', 'GENERAL');

-- CreateEnum
CREATE TYPE "InventoryItemType" AS ENUM ('CONSUMABLE', 'ASSET');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "RequisitionStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'FULFILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AssetCondition" AS ENUM ('NEW', 'GOOD', 'FAIR', 'POOR', 'BROKEN', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "schoolId" TEXT,
    "branchId" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'TEACHER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,
    "emailVerificationToken" TEXT,
    "emailVerificationSentAt" TIMESTAMP(3),
    "phoneVerificationCode" TEXT,
    "phoneVerificationSentAt" TIMESTAMP(3),
    "staffId" TEXT,
    "idCardPhoto" TEXT,
    "idCardIssued" TIMESTAMP(3),
    "idCardExpiry" TIMESTAMP(3),
    "lastLogin" TIMESTAMP(3),
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "passwordResetToken" TEXT,
    "passwordResetExpiry" TIMESTAMP(3),
    "profilePicture" TEXT,
    "kraPin" TEXT,
    "nhifNumber" TEXT,
    "nssfNumber" TEXT,
    "bankName" TEXT,
    "bankAccountName" TEXT,
    "bankAccountNumber" TEXT,
    "basicSalary" DECIMAL(10,2),
    "employmentType" TEXT DEFAULT 'PERMANENT',
    "joinedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "subject" TEXT,
    "gender" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "registrationNo" TEXT,
    "address" TEXT,
    "county" TEXT,
    "subCounty" TEXT,
    "ward" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "principalName" TEXT,
    "principalPhone" TEXT,
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "stampUrl" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "schoolType" TEXT,
    "motto" TEXT,
    "vision" TEXT,
    "mission" TEXT,
    "brandColor" TEXT,
    "welcomeTitle" TEXT,
    "welcomeMessage" TEXT,
    "admissionFormatType" "AdmissionFormatType" NOT NULL DEFAULT 'BRANCH_PREFIX_START',
    "branchSeparator" TEXT NOT NULL DEFAULT '-',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "curriculumType" "CurriculumType" NOT NULL DEFAULT 'CBC_AND_EXAM',
    "assessmentMode" "AssessmentMode" NOT NULL DEFAULT 'MIXED',
    "customGradingScale" JSONB,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT,
    "name" TEXT,
    "code" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_sequences" (
    "id" TEXT NOT NULL,
    "academicYear" INTEGER NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,

    CONSTRAINT "admission_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_sequences" (
    "id" TEXT NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,

    CONSTRAINT "staff_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "streams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "streams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "classCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grade" "Grade" NOT NULL,
    "stream" TEXT,
    "teacherId" TEXT,
    "schoolId" TEXT,
    "branchId" TEXT,
    "academicYear" INTEGER NOT NULL DEFAULT 2025,
    "term" "Term" NOT NULL DEFAULT 'TERM_1',
    "capacity" INTEGER NOT NULL DEFAULT 40,
    "room" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_schedules" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "room" TEXT,
    "teacherId" TEXT,
    "schoolId" TEXT,
    "branchId" TEXT,
    "semester" TEXT,
    "academicYear" INTEGER NOT NULL DEFAULT 2025,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "learningAreaId" TEXT,

    CONSTRAINT "class_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_facilities" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "facilityName" TEXT NOT NULL,
    "facilityType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "condition" TEXT NOT NULL DEFAULT 'FUNCTIONAL',
    "maintenanceRequired" BOOLEAN NOT NULL DEFAULT false,
    "lastMaintenance" TIMESTAMP(3),
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_facilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_enrollments" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "schoolId" TEXT,
    "branchId" TEXT,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,

    CONSTRAINT "class_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learners" (
    "id" TEXT NOT NULL,
    "admissionNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" "Gender" NOT NULL,
    "photoUrl" TEXT,
    "photoPublicId" TEXT,
    "schoolId" TEXT,
    "branchId" TEXT,
    "grade" "Grade" NOT NULL,
    "stream" TEXT,
    "parentId" TEXT,
    "guardianName" TEXT,
    "guardianPhone" TEXT,
    "guardianEmail" TEXT,
    "medicalConditions" TEXT,
    "allergies" TEXT,
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "bloodGroup" TEXT,
    "address" TEXT,
    "county" TEXT,
    "subCounty" TEXT,
    "status" "LearnerStatus" NOT NULL DEFAULT 'ACTIVE',
    "admissionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitDate" TIMESTAMP(3),
    "exitReason" TEXT,
    "previousSchool" TEXT,
    "religion" TEXT,
    "specialNeeds" TEXT,
    "idCardIssued" TIMESTAMP(3),
    "idCardExpiry" TIMESTAMP(3),
    "idCardNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,
    "fatherName" TEXT,
    "fatherPhone" TEXT,
    "fatherEmail" TEXT,
    "fatherDeceased" BOOLEAN NOT NULL DEFAULT false,
    "motherName" TEXT,
    "motherPhone" TEXT,
    "motherEmail" TEXT,
    "motherDeceased" BOOLEAN NOT NULL DEFAULT false,
    "guardianRelation" TEXT,
    "primaryContactType" TEXT,
    "primaryContactName" TEXT,
    "primaryContactPhone" TEXT,
    "primaryContactEmail" TEXT,

    CONSTRAINT "learners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "classId" TEXT,
    "schoolId" TEXT,
    "branchId" TEXT,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "remarks" TEXT,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "markedBy" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formative_assessments" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "schoolId" TEXT,
    "branchId" TEXT,
    "term" "Term" NOT NULL DEFAULT 'TERM_1',
    "academicYear" INTEGER NOT NULL DEFAULT 2026,
    "learningArea" TEXT NOT NULL,
    "strand" TEXT,
    "subStrand" TEXT,
    "overallRating" "RubricRating" NOT NULL,
    "detailedRating" "DetailedRubricRating",
    "points" INTEGER,
    "percentage" DOUBLE PRECISION,
    "exceedingCount" INTEGER NOT NULL DEFAULT 0,
    "meetingCount" INTEGER NOT NULL DEFAULT 0,
    "approachingCount" INTEGER NOT NULL DEFAULT 0,
    "belowCount" INTEGER NOT NULL DEFAULT 0,
    "strengths" TEXT,
    "areasImprovement" TEXT,
    "remarks" TEXT,
    "recommendations" TEXT,
    "teacherId" TEXT NOT NULL,
    "type" "FormativeAssessmentType" NOT NULL DEFAULT 'OPENER',
    "status" "AssessmentStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT,
    "date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "maxScore" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "formative_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "summative_tests" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "learningArea" TEXT NOT NULL,
    "schoolId" TEXT,
    "branchId" TEXT,
    "term" "Term" NOT NULL DEFAULT 'TERM_1',
    "academicYear" INTEGER NOT NULL DEFAULT 2026,
    "grade" "Grade" NOT NULL,
    "testDate" DATE NOT NULL,
    "totalMarks" INTEGER NOT NULL,
    "passMarks" INTEGER NOT NULL,
    "duration" INTEGER,
    "description" TEXT,
    "instructions" TEXT,
    "createdBy" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'DRAFT',
    "curriculum" "CurriculumType" NOT NULL DEFAULT 'CBC_AND_EXAM',
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "statusHistory" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "submittedBy" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "scaleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,
    "testType" TEXT,

    CONSTRAINT "summative_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "term_configs" (
    "id" TEXT NOT NULL,
    "academicYear" INTEGER NOT NULL,
    "term" "Term" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "formativeWeight" DOUBLE PRECISION NOT NULL DEFAULT 30.0,
    "summativeWeight" DOUBLE PRECISION NOT NULL DEFAULT 70.0,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,
    "schoolId" TEXT,

    CONSTRAINT "term_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aggregation_configs" (
    "id" TEXT NOT NULL,
    "grade" "Grade",
    "learningArea" TEXT,
    "type" "FormativeAssessmentType" NOT NULL,
    "strategy" "AggregationStrategy" NOT NULL DEFAULT 'SIMPLE_AVERAGE',
    "nValue" INTEGER,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,
    "schoolId" TEXT,

    CONSTRAINT "aggregation_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "change_history" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "field" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "schoolId" TEXT,

    CONSTRAINT "change_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "summative_results" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "schoolId" TEXT,
    "branchId" TEXT,
    "marksObtained" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "grade" "SummativeGrade" NOT NULL,
    "status" "TestStatus" NOT NULL,
    "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'DRAFT',
    "position" INTEGER,
    "outOf" INTEGER,
    "remarks" TEXT,
    "teacherComment" TEXT,
    "recordedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,

    CONSTRAINT "summative_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "summative_result_history" (
    "id" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "field" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedBy" TEXT NOT NULL,
    "changeTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,

    CONSTRAINT "summative_result_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core_competencies" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "schoolId" TEXT,
    "branchId" TEXT,
    "term" "Term" NOT NULL,
    "academicYear" INTEGER NOT NULL,
    "communication" "DetailedRubricRating" NOT NULL,
    "communicationComment" TEXT,
    "criticalThinking" "DetailedRubricRating" NOT NULL,
    "criticalThinkingComment" TEXT,
    "creativity" "DetailedRubricRating" NOT NULL,
    "creativityComment" TEXT,
    "collaboration" "DetailedRubricRating" NOT NULL,
    "collaborationComment" TEXT,
    "citizenship" "DetailedRubricRating" NOT NULL,
    "citizenshipComment" TEXT,
    "learningToLearn" "DetailedRubricRating" NOT NULL,
    "learningToLearnComment" TEXT,
    "assessedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,

    CONSTRAINT "core_competencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "values_assessments" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "schoolId" TEXT,
    "branchId" TEXT,
    "term" "Term" NOT NULL,
    "academicYear" INTEGER NOT NULL,
    "love" "DetailedRubricRating" NOT NULL,
    "responsibility" "DetailedRubricRating" NOT NULL,
    "respect" "DetailedRubricRating" NOT NULL,
    "unity" "DetailedRubricRating" NOT NULL,
    "peace" "DetailedRubricRating" NOT NULL,
    "patriotism" "DetailedRubricRating" NOT NULL,
    "integrity" "DetailedRubricRating" NOT NULL,
    "comment" TEXT,
    "assessedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,

    CONSTRAINT "values_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "co_curricular_activities" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "schoolId" TEXT,
    "branchId" TEXT,
    "term" "Term" NOT NULL,
    "academicYear" INTEGER NOT NULL,
    "activityName" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "performance" "DetailedRubricRating" NOT NULL,
    "achievements" TEXT,
    "remarks" TEXT,
    "recordedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,

    CONSTRAINT "co_curricular_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "termly_report_comments" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "schoolId" TEXT,
    "branchId" TEXT,
    "term" "Term" NOT NULL,
    "academicYear" INTEGER NOT NULL,
    "classTeacherComment" TEXT NOT NULL,
    "classTeacherName" TEXT NOT NULL,
    "classTeacherSignature" TEXT,
    "classTeacherDate" TIMESTAMP(3) NOT NULL,
    "headTeacherComment" TEXT,
    "headTeacherName" TEXT,
    "headTeacherSignature" TEXT,
    "headTeacherDate" TIMESTAMP(3),
    "parentComment" TEXT,
    "parentSignature" TEXT,
    "parentDate" TIMESTAMP(3),
    "nextTermOpens" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,

    CONSTRAINT "termly_report_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "id_card_templates" (
    "id" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "templateType" "IDCardType" NOT NULL,
    "templateDesign" TEXT NOT NULL,
    "templateCSS" TEXT,
    "layoutConfig" JSONB,
    "width" INTEGER NOT NULL DEFAULT 320,
    "height" INTEGER NOT NULL DEFAULT 204,
    "orientation" TEXT NOT NULL DEFAULT 'horizontal',
    "showPhoto" BOOLEAN NOT NULL DEFAULT true,
    "showBarcode" BOOLEAN NOT NULL DEFAULT true,
    "showQRCode" BOOLEAN NOT NULL DEFAULT false,
    "schoolLogo" TEXT,
    "backgroundColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "textColor" TEXT NOT NULL DEFAULT '#000000',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,

    CONSTRAINT "id_card_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "FeeCategory" NOT NULL DEFAULT 'ACADEMIC',
    "schoolId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_structures" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "schoolId" TEXT,
    "branchId" TEXT,
    "grade" "Grade" NOT NULL,
    "term" "Term" NOT NULL,
    "academicYear" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "mandatory" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,

    CONSTRAINT "fee_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_structure_items" (
    "id" TEXT NOT NULL,
    "feeStructureId" TEXT NOT NULL,
    "feeTypeId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "mandatory" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_structure_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_invoices" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "feeStructureId" TEXT NOT NULL,
    "schoolId" TEXT,
    "branchId" TEXT,
    "term" "Term" NOT NULL,
    "academicYear" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(10,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "issuedBy" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,

    CONSTRAINT "fee_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_payments" (
    "id" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referenceNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,

    CONSTRAINT "fee_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderType" "UserRole" NOT NULL,
    "recipientType" "RecipientType" NOT NULL,
    "recipientIds" TEXT[],
    "schoolId" TEXT,
    "branchId" TEXT,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "messageType" "MessageType" NOT NULL DEFAULT 'IN_APP',
    "scheduledFor" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "status" "MessageStatus" NOT NULL DEFAULT 'DRAFT',
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_receipts" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "schoolId" TEXT,
    "branchId" TEXT,
    "recipientEmail" TEXT,
    "recipientPhone" TEXT,
    "status" "MessageStatus" NOT NULL DEFAULT 'SENT',
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broadcast_campaigns" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "schoolId" TEXT,
    "branchId" TEXT,
    "messagePreview" TEXT NOT NULL,
    "messageTemplate" TEXT NOT NULL,
    "totalRecipients" INTEGER NOT NULL,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "recipientSource" TEXT NOT NULL,
    "messageChannel" TEXT NOT NULL DEFAULT 'SMS',
    "status" "MessageStatus" NOT NULL DEFAULT 'SENT',
    "sentAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broadcast_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broadcast_recipients" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "schoolId" TEXT,
    "branchId" TEXT,
    "recipientPhone" TEXT NOT NULL,
    "recipientName" TEXT,
    "status" "MessageStatus" NOT NULL DEFAULT 'SENT',
    "messageId" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broadcast_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_delivery_logs" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "schoolId" TEXT,
    "branchId" TEXT,
    "recipientPhone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "messageLength" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT,
    "status" "DeliveryStatus" NOT NULL,
    "statusCode" TEXT,
    "errorDetails" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_delivery_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scale_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,

    CONSTRAINT "scale_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grading_systems" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "scaleGroupId" TEXT,
    "grade" "Grade",
    "learningArea" TEXT,
    "schoolId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grading_systems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grading_ranges" (
    "id" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "minPercentage" DOUBLE PRECISION NOT NULL,
    "maxPercentage" DOUBLE PRECISION NOT NULL,
    "summativeGrade" "SummativeGrade",
    "rubricRating" "DetailedRubricRating",
    "points" INTEGER,
    "color" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,

    CONSTRAINT "grading_ranges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stream_configs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,

    CONSTRAINT "stream_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_configs" (
    "id" TEXT NOT NULL,
    "smsProvider" TEXT DEFAULT 'mobilesasa',
    "smsApiKey" TEXT,
    "smsBaseUrl" TEXT DEFAULT 'https://api.mobilesasa.com',
    "smsSenderId" TEXT,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "hasApiKey" BOOLEAN NOT NULL DEFAULT false,
    "smsCustomName" TEXT,
    "smsCustomBaseUrl" TEXT,
    "smsCustomAuthHeader" TEXT,
    "smsCustomToken" TEXT,
    "emailProvider" TEXT DEFAULT 'resend',
    "emailApiKey" TEXT,
    "emailFrom" TEXT,
    "emailFromName" TEXT,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mpesaProvider" TEXT DEFAULT 'intasend',
    "mpesaPublicKey" TEXT,
    "mpesaSecretKey" TEXT,
    "mpesaBusinessNo" TEXT,
    "mpesaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "birthdayEnabled" BOOLEAN NOT NULL DEFAULT false,
    "birthdayMessageTemplate" TEXT DEFAULT 'Happy Birthday {learnerName}! Best wishes from {schoolName}.',
    "emailTemplates" JSONB,
    "smsUsername" TEXT,
    "schoolId" TEXT,

    CONSTRAINT "communication_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_sms_audits" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "assessmentId" TEXT,
    "assessmentType" TEXT NOT NULL,
    "parentId" TEXT,
    "parentPhone" TEXT NOT NULL,
    "parentName" TEXT,
    "learnerName" TEXT NOT NULL,
    "learnerGrade" TEXT NOT NULL,
    "competencyName" TEXT,
    "achievementLevel" TEXT,
    "subStrand" TEXT,
    "templateType" TEXT NOT NULL,
    "messageContent" TEXT NOT NULL,
    "smsMessageId" TEXT,
    "reportLink" TEXT,
    "smsStatus" TEXT NOT NULL DEFAULT 'SENT',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "sentByUserId" TEXT,
    "cooldownExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "academicYear" INTEGER,
    "channel" "CommunicationChannel" NOT NULL DEFAULT 'SMS',
    "term" TEXT,
    "whatsappMessageId" TEXT,

    CONSTRAINT "assessment_sms_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_areas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "gradeLevel" TEXT NOT NULL,
    "schoolId" TEXT,
    "branchId" TEXT,
    "icon" TEXT NOT NULL DEFAULT '📚',
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_assignments" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "learningAreaId" TEXT NOT NULL,
    "grade" "Grade" NOT NULL,
    "schoolId" TEXT,
    "branchId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subject_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "userId" TEXT,
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "guestEmail" TEXT,
    "guestName" TEXT,
    "schoolId" TEXT,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_messages" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "senderId" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT,
    "type" TEXT NOT NULL,
    "size" INTEGER,
    "category" TEXT NOT NULL DEFAULT 'general',
    "schoolId" TEXT,
    "branchId" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "books" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "isbn" TEXT,
    "category" TEXT,
    "schoolId" TEXT,
    "branchId" TEXT,
    "assignedToId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "returnDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "type" "EventType" NOT NULL DEFAULT 'GENERAL',
    "location" TEXT,
    "googleEventId" TEXT,
    "meetingLink" TEXT,
    "creatorId" TEXT NOT NULL,
    "schoolId" TEXT,
    "branchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "schoolId" TEXT,
    "branchId" TEXT,
    "createdById" TEXT NOT NULL,
    "recipients" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "maxDays" INTEGER NOT NULL DEFAULT 21,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "schoolId" TEXT,
    "branchId" TEXT,
    "basicSalary" DECIMAL(10,2) NOT NULL,
    "allowances" JSONB,
    "deductions" JSONB,
    "netSalary" DECIMAL(10,2) NOT NULL,
    "status" "PayrollStatus" NOT NULL DEFAULT 'DRAFT',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedBy" TEXT,
    "paidAt" TIMESTAMP(3),
    "reference" TEXT,
    "notes" TEXT,

    CONSTRAINT "payroll_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_documents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "schoolId" TEXT,
    "branchId" TEXT,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'CONTRACT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_reviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "schoolId" TEXT,
    "branchId" TEXT,
    "reviewDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "technicalRating" INTEGER NOT NULL DEFAULT 3,
    "behavioralRating" INTEGER NOT NULL DEFAULT 3,
    "collaborationRating" INTEGER NOT NULL DEFAULT 3,
    "overallRating" DECIMAL(3,2) NOT NULL,
    "comments" TEXT,
    "goals" JSONB,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "performance_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "schoolId" TEXT,
    "branchId" TEXT,
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journals" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "JournalType" NOT NULL,
    "schoolId" TEXT,
    "branchId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT,
    "journalId" TEXT NOT NULL,
    "schoolId" TEXT,
    "branchId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_items" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "debit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_years" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiscal_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "schoolId" TEXT,
    "branchId" TEXT,
    "contact" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(15,2) NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "schoolId" TEXT,
    "branchId" TEXT,
    "vendorId" TEXT,
    "accountId" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PAID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_statements" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "dateRange" TEXT,
    "schoolId" TEXT,
    "branchId" TEXT,
    "startingBalance" DECIMAL(15,2) NOT NULL,
    "endingBalance" DECIMAL(15,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_statements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_statement_lines" (
    "id" TEXT NOT NULL,
    "statementId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UNRECONCILED',
    "journalItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_statement_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_stores" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "location" TEXT,
    "schoolId" TEXT,
    "branchId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "description" TEXT,
    "categoryId" TEXT,
    "schoolId" TEXT,
    "branchId" TEXT,
    "type" "InventoryItemType" NOT NULL DEFAULT 'CONSUMABLE',
    "unitOfMeasure" TEXT NOT NULL DEFAULT 'PCS',
    "reorderLevel" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "schoolId" TEXT,
    "branchId" TEXT,
    "fromStoreId" TEXT,
    "toStoreId" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "reference" TEXT,
    "description" TEXT,
    "performedById" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_requisitions" (
    "id" TEXT NOT NULL,
    "requisitionNo" TEXT NOT NULL,
    "schoolId" TEXT,
    "branchId" TEXT,
    "requestedById" TEXT NOT NULL,
    "department" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" "RequisitionStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "requiredDate" TIMESTAMP(3),
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_requisitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_requisition_items" (
    "id" TEXT NOT NULL,
    "requisitionId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "fulfilledQty" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "stock_requisition_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fixed_assets" (
    "id" TEXT NOT NULL,
    "assetCode" TEXT NOT NULL,
    "itemId" TEXT,
    "schoolId" TEXT,
    "branchId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "serialNumber" TEXT,
    "model" TEXT,
    "manufacturer" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "purchaseCost" DECIMAL(15,2),
    "warrantyExpiry" TIMESTAMP(3),
    "condition" "AssetCondition" NOT NULL DEFAULT 'NEW',
    "location" TEXT,
    "currentStoreId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fixed_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_assignments" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "assignedToClassId" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedReturn" TIMESTAMP(3),
    "returnedAt" TIMESTAMP(3),
    "conditionOnAssigned" "AssetCondition" NOT NULL,
    "conditionOnReturned" "AssetCondition",
    "notes" TEXT,

    CONSTRAINT "asset_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_staffId_key" ON "users"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "schools_name_key" ON "schools"("name");

-- CreateIndex
CREATE UNIQUE INDEX "schools_registrationNo_key" ON "schools"("registrationNo");

-- CreateIndex
CREATE INDEX "schools_county_idx" ON "schools"("county");

-- CreateIndex
CREATE INDEX "branches_schoolId_idx" ON "branches"("schoolId");

-- CreateIndex
CREATE INDEX "admission_sequences_academicYear_idx" ON "admission_sequences"("academicYear");

-- CreateIndex
CREATE UNIQUE INDEX "admission_sequences_academicYear_key" ON "admission_sequences"("academicYear");

-- CreateIndex
CREATE UNIQUE INDEX "streams_name_key" ON "streams"("name");

-- CreateIndex
CREATE INDEX "streams_name_idx" ON "streams"("name");

-- CreateIndex
CREATE UNIQUE INDEX "classes_classCode_key" ON "classes"("classCode");

-- CreateIndex
CREATE INDEX "classes_teacherId_idx" ON "classes"("teacherId");

-- CreateIndex
CREATE INDEX "classes_grade_stream_idx" ON "classes"("grade", "stream");

-- CreateIndex
CREATE INDEX "classes_schoolId_idx" ON "classes"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "classes_grade_stream_academicYear_term_key" ON "classes"("grade", "stream", "academicYear", "term");

-- CreateIndex
CREATE INDEX "class_schedules_classId_idx" ON "class_schedules"("classId");

-- CreateIndex
CREATE INDEX "class_schedules_day_idx" ON "class_schedules"("day");

-- CreateIndex
CREATE INDEX "class_schedules_schoolId_idx" ON "class_schedules"("schoolId");

-- CreateIndex
CREATE INDEX "class_schedules_subject_idx" ON "class_schedules"("subject");

-- CreateIndex
CREATE INDEX "class_facilities_classId_idx" ON "class_facilities"("classId");

-- CreateIndex
CREATE INDEX "class_facilities_facilityType_idx" ON "class_facilities"("facilityType");

-- CreateIndex
CREATE INDEX "class_facilities_condition_idx" ON "class_facilities"("condition");

-- CreateIndex
CREATE INDEX "class_enrollments_classId_idx" ON "class_enrollments"("classId");

-- CreateIndex
CREATE INDEX "class_enrollments_learnerId_idx" ON "class_enrollments"("learnerId");

-- CreateIndex
CREATE INDEX "class_enrollments_learnerId_active_idx" ON "class_enrollments"("learnerId", "active");

-- CreateIndex
CREATE INDEX "class_enrollments_classId_active_idx" ON "class_enrollments"("classId", "active");

-- CreateIndex
CREATE INDEX "class_enrollments_schoolId_idx" ON "class_enrollments"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "class_enrollments_classId_learnerId_key" ON "class_enrollments"("classId", "learnerId");

-- CreateIndex
CREATE UNIQUE INDEX "learners_admissionNumber_key" ON "learners"("admissionNumber");

-- CreateIndex
CREATE INDEX "learners_admissionNumber_idx" ON "learners"("admissionNumber");

-- CreateIndex
CREATE INDEX "learners_parentId_idx" ON "learners"("parentId");

-- CreateIndex
CREATE INDEX "learners_primaryContactType_idx" ON "learners"("primaryContactType");

-- CreateIndex
CREATE INDEX "learners_grade_stream_idx" ON "learners"("grade", "stream");

-- CreateIndex
CREATE INDEX "learners_status_idx" ON "learners"("status");

-- CreateIndex
CREATE INDEX "learners_lastName_firstName_idx" ON "learners"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "learners_schoolId_idx" ON "learners"("schoolId");

-- CreateIndex
CREATE INDEX "attendances_date_idx" ON "attendances"("date");

-- CreateIndex
CREATE INDEX "attendances_learnerId_idx" ON "attendances"("learnerId");

-- CreateIndex
CREATE INDEX "attendances_classId_idx" ON "attendances"("classId");

-- CreateIndex
CREATE INDEX "attendances_status_idx" ON "attendances"("status");

-- CreateIndex
CREATE INDEX "attendances_schoolId_idx" ON "attendances"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_learnerId_date_key" ON "attendances"("learnerId", "date");

-- CreateIndex
CREATE INDEX "formative_assessments_learnerId_idx" ON "formative_assessments"("learnerId");

-- CreateIndex
CREATE INDEX "formative_assessments_teacherId_idx" ON "formative_assessments"("teacherId");

-- CreateIndex
CREATE INDEX "formative_assessments_term_academicYear_idx" ON "formative_assessments"("term", "academicYear");

-- CreateIndex
CREATE INDEX "formative_assessments_learningArea_idx" ON "formative_assessments"("learningArea");

-- CreateIndex
CREATE INDEX "formative_assessments_learnerId_learningArea_term_academicY_idx" ON "formative_assessments"("learnerId", "learningArea", "term", "academicYear");

-- CreateIndex
CREATE INDEX "formative_assessments_schoolId_idx" ON "formative_assessments"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "formative_assessments_learnerId_term_academicYear_learningA_key" ON "formative_assessments"("learnerId", "term", "academicYear", "learningArea", "type", "title");

-- CreateIndex
CREATE INDEX "summative_tests_testType_idx" ON "summative_tests"("testType");

-- CreateIndex
CREATE INDEX "summative_tests_grade_learningArea_term_idx" ON "summative_tests"("grade", "learningArea", "term");

-- CreateIndex
CREATE INDEX "summative_tests_grade_term_academicYear_idx" ON "summative_tests"("grade", "term", "academicYear");

-- CreateIndex
CREATE INDEX "summative_tests_schoolId_idx" ON "summative_tests"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "term_configs_academicYear_term_key" ON "term_configs"("academicYear", "term");

-- CreateIndex
CREATE INDEX "change_history_entityType_entityId_idx" ON "change_history"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "summative_results_moderationStatus_idx" ON "summative_results"("moderationStatus");

-- CreateIndex
CREATE INDEX "summative_results_testId_idx" ON "summative_results"("testId");

-- CreateIndex
CREATE INDEX "summative_results_learnerId_idx" ON "summative_results"("learnerId");

-- CreateIndex
CREATE INDEX "summative_results_grade_idx" ON "summative_results"("grade");

-- CreateIndex
CREATE INDEX "summative_results_status_idx" ON "summative_results"("status");

-- CreateIndex
CREATE INDEX "summative_results_testId_grade_marksObtained_idx" ON "summative_results"("testId", "grade", "marksObtained");

-- CreateIndex
CREATE INDEX "summative_results_schoolId_idx" ON "summative_results"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "summative_results_testId_learnerId_key" ON "summative_results"("testId", "learnerId");

-- CreateIndex
CREATE INDEX "summative_result_history_resultId_idx" ON "summative_result_history"("resultId");

-- CreateIndex
CREATE INDEX "summative_result_history_changedBy_idx" ON "summative_result_history"("changedBy");

-- CreateIndex
CREATE INDEX "summative_result_history_changeTimestamp_idx" ON "summative_result_history"("changeTimestamp");

-- CreateIndex
CREATE INDEX "core_competencies_learnerId_idx" ON "core_competencies"("learnerId");

-- CreateIndex
CREATE INDEX "core_competencies_term_academicYear_idx" ON "core_competencies"("term", "academicYear");

-- CreateIndex
CREATE INDEX "core_competencies_schoolId_idx" ON "core_competencies"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "core_competencies_schoolId_learnerId_term_academicYear_key" ON "core_competencies"("schoolId", "learnerId", "term", "academicYear");

-- CreateIndex
CREATE INDEX "values_assessments_learnerId_idx" ON "values_assessments"("learnerId");

-- CreateIndex
CREATE INDEX "values_assessments_term_academicYear_idx" ON "values_assessments"("term", "academicYear");

-- CreateIndex
CREATE INDEX "values_assessments_schoolId_idx" ON "values_assessments"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "values_assessments_schoolId_learnerId_term_academicYear_key" ON "values_assessments"("schoolId", "learnerId", "term", "academicYear");

-- CreateIndex
CREATE INDEX "co_curricular_activities_learnerId_idx" ON "co_curricular_activities"("learnerId");

-- CreateIndex
CREATE INDEX "co_curricular_activities_term_academicYear_idx" ON "co_curricular_activities"("term", "academicYear");

-- CreateIndex
CREATE INDEX "co_curricular_activities_activityType_idx" ON "co_curricular_activities"("activityType");

-- CreateIndex
CREATE INDEX "co_curricular_activities_schoolId_idx" ON "co_curricular_activities"("schoolId");

-- CreateIndex
CREATE INDEX "termly_report_comments_learnerId_idx" ON "termly_report_comments"("learnerId");

-- CreateIndex
CREATE INDEX "termly_report_comments_term_academicYear_idx" ON "termly_report_comments"("term", "academicYear");

-- CreateIndex
CREATE UNIQUE INDEX "termly_report_comments_schoolId_learnerId_term_academicYear_key" ON "termly_report_comments"("schoolId", "learnerId", "term", "academicYear");

-- CreateIndex
CREATE UNIQUE INDEX "id_card_templates_templateName_key" ON "id_card_templates"("templateName");

-- CreateIndex
CREATE UNIQUE INDEX "fee_types_code_key" ON "fee_types"("code");

-- CreateIndex
CREATE INDEX "fee_structures_academicYear_idx" ON "fee_structures"("academicYear");

-- CreateIndex
CREATE INDEX "fee_structures_schoolId_idx" ON "fee_structures"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "fee_structures_schoolId_grade_term_academicYear_key" ON "fee_structures"("schoolId", "grade", "term", "academicYear");

-- CreateIndex
CREATE INDEX "fee_structure_items_feeStructureId_idx" ON "fee_structure_items"("feeStructureId");

-- CreateIndex
CREATE INDEX "fee_structure_items_feeTypeId_idx" ON "fee_structure_items"("feeTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "fee_invoices_invoiceNumber_key" ON "fee_invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "fee_invoices_learnerId_idx" ON "fee_invoices"("learnerId");

-- CreateIndex
CREATE INDEX "fee_invoices_term_academicYear_idx" ON "fee_invoices"("term", "academicYear");

-- CreateIndex
CREATE INDEX "fee_invoices_status_idx" ON "fee_invoices"("status");

-- CreateIndex
CREATE INDEX "fee_invoices_dueDate_idx" ON "fee_invoices"("dueDate");

-- CreateIndex
CREATE INDEX "fee_invoices_schoolId_idx" ON "fee_invoices"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "fee_payments_receiptNumber_key" ON "fee_payments"("receiptNumber");

-- CreateIndex
CREATE INDEX "fee_payments_invoiceId_idx" ON "fee_payments"("invoiceId");

-- CreateIndex
CREATE INDEX "fee_payments_paymentDate_idx" ON "fee_payments"("paymentDate");

-- CreateIndex
CREATE INDEX "fee_payments_paymentMethod_idx" ON "fee_payments"("paymentMethod");

-- CreateIndex
CREATE INDEX "messages_senderId_idx" ON "messages"("senderId");

-- CreateIndex
CREATE INDEX "messages_status_idx" ON "messages"("status");

-- CreateIndex
CREATE INDEX "messages_messageType_idx" ON "messages"("messageType");

-- CreateIndex
CREATE INDEX "messages_scheduledFor_idx" ON "messages"("scheduledFor");

-- CreateIndex
CREATE INDEX "messages_schoolId_idx" ON "messages"("schoolId");

-- CreateIndex
CREATE INDEX "message_receipts_messageId_idx" ON "message_receipts"("messageId");

-- CreateIndex
CREATE INDEX "message_receipts_recipientId_idx" ON "message_receipts"("recipientId");

-- CreateIndex
CREATE INDEX "message_receipts_status_idx" ON "message_receipts"("status");

-- CreateIndex
CREATE INDEX "message_receipts_schoolId_idx" ON "message_receipts"("schoolId");

-- CreateIndex
CREATE INDEX "broadcast_campaigns_senderId_idx" ON "broadcast_campaigns"("senderId");

-- CreateIndex
CREATE INDEX "broadcast_campaigns_status_idx" ON "broadcast_campaigns"("status");

-- CreateIndex
CREATE INDEX "broadcast_campaigns_sentAt_idx" ON "broadcast_campaigns"("sentAt");

-- CreateIndex
CREATE INDEX "broadcast_campaigns_schoolId_idx" ON "broadcast_campaigns"("schoolId");

-- CreateIndex
CREATE INDEX "broadcast_recipients_campaignId_idx" ON "broadcast_recipients"("campaignId");

-- CreateIndex
CREATE INDEX "broadcast_recipients_status_idx" ON "broadcast_recipients"("status");

-- CreateIndex
CREATE INDEX "broadcast_recipients_recipientPhone_idx" ON "broadcast_recipients"("recipientPhone");

-- CreateIndex
CREATE INDEX "broadcast_recipients_schoolId_idx" ON "broadcast_recipients"("schoolId");

-- CreateIndex
CREATE INDEX "sms_delivery_logs_campaignId_idx" ON "sms_delivery_logs"("campaignId");

-- CreateIndex
CREATE INDEX "sms_delivery_logs_status_idx" ON "sms_delivery_logs"("status");

-- CreateIndex
CREATE INDEX "sms_delivery_logs_sentAt_idx" ON "sms_delivery_logs"("sentAt");

-- CreateIndex
CREATE INDEX "sms_delivery_logs_schoolId_idx" ON "sms_delivery_logs"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "scale_groups_name_key" ON "scale_groups"("name");

-- CreateIndex
CREATE INDEX "grading_systems_scaleGroupId_idx" ON "grading_systems"("scaleGroupId");

-- CreateIndex
CREATE INDEX "grading_systems_grade_idx" ON "grading_systems"("grade");

-- CreateIndex
CREATE INDEX "grading_ranges_systemId_idx" ON "grading_ranges"("systemId");

-- CreateIndex
CREATE UNIQUE INDEX "stream_configs_name_key" ON "stream_configs"("name");

-- CreateIndex
CREATE INDEX "assessment_sms_audits_learnerId_idx" ON "assessment_sms_audits"("learnerId");

-- CreateIndex
CREATE INDEX "assessment_sms_audits_parentPhone_idx" ON "assessment_sms_audits"("parentPhone");

-- CreateIndex
CREATE INDEX "assessment_sms_audits_sentAt_idx" ON "assessment_sms_audits"("sentAt");

-- CreateIndex
CREATE INDEX "assessment_sms_audits_smsStatus_idx" ON "assessment_sms_audits"("smsStatus");

-- CreateIndex
CREATE INDEX "assessment_sms_audits_term_academicYear_idx" ON "assessment_sms_audits"("term", "academicYear");

-- CreateIndex
CREATE INDEX "learning_areas_gradeLevel_idx" ON "learning_areas"("gradeLevel");

-- CreateIndex
CREATE INDEX "learning_areas_schoolId_idx" ON "learning_areas"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "learning_areas_name_gradeLevel_key" ON "learning_areas"("name", "gradeLevel");

-- CreateIndex
CREATE INDEX "subject_assignments_teacherId_idx" ON "subject_assignments"("teacherId");

-- CreateIndex
CREATE INDEX "subject_assignments_learningAreaId_idx" ON "subject_assignments"("learningAreaId");

-- CreateIndex
CREATE INDEX "subject_assignments_grade_idx" ON "subject_assignments"("grade");

-- CreateIndex
CREATE INDEX "subject_assignments_schoolId_idx" ON "subject_assignments"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "subject_assignments_teacherId_learningAreaId_grade_key" ON "subject_assignments"("teacherId", "learningAreaId", "grade");

-- CreateIndex
CREATE INDEX "support_tickets_userId_idx" ON "support_tickets"("userId");

-- CreateIndex
CREATE INDEX "support_tickets_status_idx" ON "support_tickets"("status");

-- CreateIndex
CREATE INDEX "support_messages_ticketId_idx" ON "support_messages"("ticketId");

-- CreateIndex
CREATE INDEX "support_messages_senderId_idx" ON "support_messages"("senderId");

-- CreateIndex
CREATE INDEX "documents_category_idx" ON "documents"("category");

-- CreateIndex
CREATE INDEX "documents_schoolId_idx" ON "documents"("schoolId");

-- CreateIndex
CREATE INDEX "books_assignedToId_idx" ON "books"("assignedToId");

-- CreateIndex
CREATE INDEX "books_schoolId_idx" ON "books"("schoolId");

-- CreateIndex
CREATE INDEX "books_status_idx" ON "books"("status");

-- CreateIndex
CREATE INDEX "Event_schoolId_idx" ON "Event"("schoolId");

-- CreateIndex
CREATE INDEX "contact_groups_createdById_idx" ON "contact_groups"("createdById");

-- CreateIndex
CREATE INDEX "contact_groups_schoolId_idx" ON "contact_groups"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "leave_types_name_key" ON "leave_types"("name");

-- CreateIndex
CREATE INDEX "leave_requests_userId_idx" ON "leave_requests"("userId");

-- CreateIndex
CREATE INDEX "leave_requests_leaveTypeId_idx" ON "leave_requests"("leaveTypeId");

-- CreateIndex
CREATE INDEX "leave_requests_status_idx" ON "leave_requests"("status");

-- CreateIndex
CREATE INDEX "payroll_records_userId_idx" ON "payroll_records"("userId");

-- CreateIndex
CREATE INDEX "payroll_records_month_year_idx" ON "payroll_records"("month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_records_userId_month_year_key" ON "payroll_records"("userId", "month", "year");

-- CreateIndex
CREATE INDEX "staff_documents_userId_idx" ON "staff_documents"("userId");

-- CreateIndex
CREATE INDEX "staff_documents_schoolId_idx" ON "staff_documents"("schoolId");

-- CreateIndex
CREATE INDEX "performance_reviews_userId_idx" ON "performance_reviews"("userId");

-- CreateIndex
CREATE INDEX "performance_reviews_reviewerId_idx" ON "performance_reviews"("reviewerId");

-- CreateIndex
CREATE INDEX "performance_reviews_schoolId_idx" ON "performance_reviews"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_code_key" ON "accounts"("code");

-- CreateIndex
CREATE INDEX "accounts_schoolId_idx" ON "accounts"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "journals_code_key" ON "journals"("code");

-- CreateIndex
CREATE INDEX "journals_schoolId_idx" ON "journals"("schoolId");

-- CreateIndex
CREATE INDEX "journal_entries_journalId_idx" ON "journal_entries"("journalId");

-- CreateIndex
CREATE INDEX "journal_entries_date_idx" ON "journal_entries"("date");

-- CreateIndex
CREATE INDEX "journal_entries_schoolId_idx" ON "journal_entries"("schoolId");

-- CreateIndex
CREATE INDEX "journal_items_entryId_idx" ON "journal_items"("entryId");

-- CreateIndex
CREATE INDEX "journal_items_accountId_idx" ON "journal_items"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_years_name_key" ON "fiscal_years"("name");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_name_key" ON "vendors"("name");

-- CreateIndex
CREATE INDEX "vendors_schoolId_idx" ON "vendors"("schoolId");

-- CreateIndex
CREATE INDEX "expenses_vendorId_idx" ON "expenses"("vendorId");

-- CreateIndex
CREATE INDEX "expenses_accountId_idx" ON "expenses"("accountId");

-- CreateIndex
CREATE INDEX "expenses_schoolId_idx" ON "expenses"("schoolId");

-- CreateIndex
CREATE INDEX "bank_statements_schoolId_idx" ON "bank_statements"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "bank_statement_lines_journalItemId_key" ON "bank_statement_lines"("journalItemId");

-- CreateIndex
CREATE INDEX "bank_statement_lines_statementId_idx" ON "bank_statement_lines"("statementId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_categories_name_key" ON "inventory_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_stores_name_key" ON "inventory_stores"("name");

-- CreateIndex
CREATE INDEX "inventory_stores_schoolId_idx" ON "inventory_stores"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_name_key" ON "inventory_items"("name");

-- CreateIndex
CREATE INDEX "inventory_items_sku_idx" ON "inventory_items"("sku");

-- CreateIndex
CREATE INDEX "inventory_items_schoolId_idx" ON "inventory_items"("schoolId");

-- CreateIndex
CREATE INDEX "stock_movements_itemId_idx" ON "stock_movements"("itemId");

-- CreateIndex
CREATE INDEX "stock_movements_fromStoreId_idx" ON "stock_movements"("fromStoreId");

-- CreateIndex
CREATE INDEX "stock_movements_toStoreId_idx" ON "stock_movements"("toStoreId");

-- CreateIndex
CREATE INDEX "stock_movements_date_idx" ON "stock_movements"("date");

-- CreateIndex
CREATE INDEX "stock_movements_schoolId_idx" ON "stock_movements"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "stock_requisitions_requisitionNo_key" ON "stock_requisitions"("requisitionNo");

-- CreateIndex
CREATE INDEX "stock_requisitions_status_idx" ON "stock_requisitions"("status");

-- CreateIndex
CREATE INDEX "stock_requisitions_schoolId_idx" ON "stock_requisitions"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "fixed_assets_assetCode_key" ON "fixed_assets"("assetCode");

-- CreateIndex
CREATE INDEX "fixed_assets_assetCode_idx" ON "fixed_assets"("assetCode");

-- CreateIndex
CREATE INDEX "fixed_assets_schoolId_idx" ON "fixed_assets"("schoolId");

-- CreateIndex
CREATE INDEX "asset_assignments_assetId_idx" ON "asset_assignments"("assetId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_learningAreaId_fkey" FOREIGN KEY ("learningAreaId") REFERENCES "learning_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_facilities" ADD CONSTRAINT "class_facilities_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_enrollments" ADD CONSTRAINT "class_enrollments_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_enrollments" ADD CONSTRAINT "class_enrollments_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_enrollments" ADD CONSTRAINT "class_enrollments_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learners" ADD CONSTRAINT "learners_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learners" ADD CONSTRAINT "learners_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_markedBy_fkey" FOREIGN KEY ("markedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formative_assessments" ADD CONSTRAINT "formative_assessments_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formative_assessments" ADD CONSTRAINT "formative_assessments_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formative_assessments" ADD CONSTRAINT "formative_assessments_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "summative_tests" ADD CONSTRAINT "summative_tests_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "summative_tests" ADD CONSTRAINT "summative_tests_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "summative_tests" ADD CONSTRAINT "summative_tests_scaleId_fkey" FOREIGN KEY ("scaleId") REFERENCES "grading_systems"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "summative_tests" ADD CONSTRAINT "summative_tests_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "summative_tests" ADD CONSTRAINT "summative_tests_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "term_configs" ADD CONSTRAINT "term_configs_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "term_configs" ADD CONSTRAINT "term_configs_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aggregation_configs" ADD CONSTRAINT "aggregation_configs_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aggregation_configs" ADD CONSTRAINT "aggregation_configs_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_history" ADD CONSTRAINT "change_history_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_history" ADD CONSTRAINT "change_history_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "summative_results" ADD CONSTRAINT "summative_results_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "summative_results" ADD CONSTRAINT "summative_results_recordedBy_fkey" FOREIGN KEY ("recordedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "summative_results" ADD CONSTRAINT "summative_results_testId_fkey" FOREIGN KEY ("testId") REFERENCES "summative_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "summative_results" ADD CONSTRAINT "summative_results_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "summative_result_history" ADD CONSTRAINT "summative_result_history_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "summative_result_history" ADD CONSTRAINT "summative_result_history_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "summative_results"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_competencies" ADD CONSTRAINT "core_competencies_assessedBy_fkey" FOREIGN KEY ("assessedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_competencies" ADD CONSTRAINT "core_competencies_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core_competencies" ADD CONSTRAINT "core_competencies_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "values_assessments" ADD CONSTRAINT "values_assessments_assessedBy_fkey" FOREIGN KEY ("assessedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "values_assessments" ADD CONSTRAINT "values_assessments_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "values_assessments" ADD CONSTRAINT "values_assessments_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "co_curricular_activities" ADD CONSTRAINT "co_curricular_activities_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "co_curricular_activities" ADD CONSTRAINT "co_curricular_activities_recordedBy_fkey" FOREIGN KEY ("recordedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "co_curricular_activities" ADD CONSTRAINT "co_curricular_activities_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "termly_report_comments" ADD CONSTRAINT "termly_report_comments_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "termly_report_comments" ADD CONSTRAINT "termly_report_comments_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_types" ADD CONSTRAINT "fee_types_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_structure_items" ADD CONSTRAINT "fee_structure_items_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "fee_structures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_structure_items" ADD CONSTRAINT "fee_structure_items_feeTypeId_fkey" FOREIGN KEY ("feeTypeId") REFERENCES "fee_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_invoices" ADD CONSTRAINT "fee_invoices_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "fee_structures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_invoices" ADD CONSTRAINT "fee_invoices_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_invoices" ADD CONSTRAINT "fee_invoices_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "fee_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_recordedBy_fkey" FOREIGN KEY ("recordedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_receipts" ADD CONSTRAINT "message_receipts_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_receipts" ADD CONSTRAINT "message_receipts_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broadcast_campaigns" ADD CONSTRAINT "broadcast_campaigns_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broadcast_recipients" ADD CONSTRAINT "broadcast_recipients_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "broadcast_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broadcast_recipients" ADD CONSTRAINT "broadcast_recipients_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_delivery_logs" ADD CONSTRAINT "sms_delivery_logs_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "broadcast_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_delivery_logs" ADD CONSTRAINT "sms_delivery_logs_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grading_systems" ADD CONSTRAINT "grading_systems_scaleGroupId_fkey" FOREIGN KEY ("scaleGroupId") REFERENCES "scale_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grading_systems" ADD CONSTRAINT "grading_systems_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grading_ranges" ADD CONSTRAINT "grading_ranges_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "grading_systems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_configs" ADD CONSTRAINT "communication_configs_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_sms_audits" ADD CONSTRAINT "assessment_sms_audits_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_areas" ADD CONSTRAINT "learning_areas_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_assignments" ADD CONSTRAINT "subject_assignments_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_assignments" ADD CONSTRAINT "subject_assignments_learningAreaId_fkey" FOREIGN KEY ("learningAreaId") REFERENCES "learning_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_assignments" ADD CONSTRAINT "subject_assignments_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "books" ADD CONSTRAINT "books_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "books" ADD CONSTRAINT "books_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_groups" ADD CONSTRAINT "contact_groups_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_groups" ADD CONSTRAINT "contact_groups_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "leave_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_records" ADD CONSTRAINT "payroll_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_records" ADD CONSTRAINT "payroll_records_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_documents" ADD CONSTRAINT "staff_documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_documents" ADD CONSTRAINT "staff_documents_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journals" ADD CONSTRAINT "journals_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "journals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_items" ADD CONSTRAINT "journal_items_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_items" ADD CONSTRAINT "journal_items_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_statements" ADD CONSTRAINT "bank_statements_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_statements" ADD CONSTRAINT "bank_statements_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_statement_lines" ADD CONSTRAINT "bank_statement_lines_statementId_fkey" FOREIGN KEY ("statementId") REFERENCES "bank_statements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_statement_lines" ADD CONSTRAINT "bank_statement_lines_journalItemId_fkey" FOREIGN KEY ("journalItemId") REFERENCES "journal_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_categories" ADD CONSTRAINT "inventory_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "inventory_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_stores" ADD CONSTRAINT "inventory_stores_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "inventory_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_fromStoreId_fkey" FOREIGN KEY ("fromStoreId") REFERENCES "inventory_stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_toStoreId_fkey" FOREIGN KEY ("toStoreId") REFERENCES "inventory_stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_requisitions" ADD CONSTRAINT "stock_requisitions_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_requisitions" ADD CONSTRAINT "stock_requisitions_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_requisitions" ADD CONSTRAINT "stock_requisitions_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_requisition_items" ADD CONSTRAINT "stock_requisition_items_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "stock_requisitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_requisition_items" ADD CONSTRAINT "stock_requisition_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_currentStoreId_fkey" FOREIGN KEY ("currentStoreId") REFERENCES "inventory_stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_assignments" ADD CONSTRAINT "asset_assignments_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "fixed_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_assignments" ADD CONSTRAINT "asset_assignments_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_assignments" ADD CONSTRAINT "asset_assignments_assignedToClassId_fkey" FOREIGN KEY ("assignedToClassId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
