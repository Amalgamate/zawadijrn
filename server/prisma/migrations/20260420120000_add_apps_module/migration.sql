-- ============================================================
-- Apps Module Migration
-- Creates: AppAuditAction enum, apps, school_app_configs, app_audit_logs
-- Safe: all statements use IF NOT EXISTS / DO guards
-- ============================================================

-- 1. Create AppAuditAction enum (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AppAuditAction') THEN
    CREATE TYPE "AppAuditAction" AS ENUM (
      'ACTIVATED',
      'DEACTIVATED',
      'LOCKED',
      'UNLOCKED',
      'SHOWN',
      'HIDDEN'
    );
  END IF;
END $$;

-- 2. Create apps table (seed table — one row per feature module)
CREATE TABLE IF NOT EXISTS "apps" (
    "id"           TEXT         NOT NULL,
    "slug"         VARCHAR(50)  NOT NULL,
    "name"         VARCHAR(100) NOT NULL,
    "description"  TEXT,
    "category"     VARCHAR(50)  NOT NULL,
    "icon"         VARCHAR(10),
    "sortOrder"    INTEGER      NOT NULL DEFAULT 0,
    "dependencies" TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
    "isSystem"     BOOLEAN      NOT NULL DEFAULT false,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "apps_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "apps_slug_key"     ON "apps"("slug");
CREATE INDEX        IF NOT EXISTS "apps_category_idx" ON "apps"("category");
CREATE INDEX        IF NOT EXISTS "apps_slug_idx"     ON "apps"("slug");

-- 3. Create school_app_configs table (per-school on/off state)
CREATE TABLE IF NOT EXISTS "school_app_configs" (
    "id"          TEXT         NOT NULL,
    "schoolId"    TEXT         NOT NULL,
    "appId"       TEXT         NOT NULL,
    "isActive"    BOOLEAN      NOT NULL DEFAULT false,
    "isMandatory" BOOLEAN      NOT NULL DEFAULT false,
    "isVisible"   BOOLEAN      NOT NULL DEFAULT true,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedById" TEXT,

    CONSTRAINT "school_app_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "school_app_configs_schoolId_appId_key" ON "school_app_configs"("schoolId", "appId");
CREATE INDEX        IF NOT EXISTS "school_app_configs_schoolId_idx"        ON "school_app_configs"("schoolId");
CREATE INDEX        IF NOT EXISTS "school_app_configs_appId_idx"           ON "school_app_configs"("appId");

-- Foreign keys for school_app_configs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'school_app_configs_appId_fkey'
  ) THEN
    ALTER TABLE "school_app_configs"
      ADD CONSTRAINT "school_app_configs_appId_fkey"
      FOREIGN KEY ("appId") REFERENCES "apps"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'school_app_configs_updatedById_fkey'
  ) THEN
    ALTER TABLE "school_app_configs"
      ADD CONSTRAINT "school_app_configs_updatedById_fkey"
      FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL;
  END IF;
END $$;

-- 4. Create app_audit_logs table (append-only — no UPDATE/DELETE)
CREATE TABLE IF NOT EXISTS "app_audit_logs" (
    "id"          TEXT             NOT NULL,
    "schoolId"    TEXT             NOT NULL,
    "appId"       TEXT             NOT NULL,
    "action"      "AppAuditAction" NOT NULL,
    "performedBy" TEXT             NOT NULL,
    "roleAtTime"  VARCHAR(30)      NOT NULL,
    "ipAddress"   INET,
    "userAgent"   TEXT,
    "createdAt"   TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "app_audit_logs_schoolId_idx"     ON "app_audit_logs"("schoolId");
CREATE INDEX IF NOT EXISTS "app_audit_logs_appId_idx"         ON "app_audit_logs"("appId");
CREATE INDEX IF NOT EXISTS "app_audit_logs_performedBy_idx"   ON "app_audit_logs"("performedBy");
CREATE INDEX IF NOT EXISTS "app_audit_logs_createdAt_idx"     ON "app_audit_logs"("createdAt");

-- Foreign keys for app_audit_logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'app_audit_logs_appId_fkey'
  ) THEN
    ALTER TABLE "app_audit_logs"
      ADD CONSTRAINT "app_audit_logs_appId_fkey"
      FOREIGN KEY ("appId") REFERENCES "apps"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'app_audit_logs_performedBy_fkey'
  ) THEN
    ALTER TABLE "app_audit_logs"
      ADD CONSTRAINT "app_audit_logs_performedBy_fkey"
      FOREIGN KEY ("performedBy") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END $$;
