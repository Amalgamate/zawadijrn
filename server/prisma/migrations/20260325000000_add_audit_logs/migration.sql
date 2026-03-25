-- CreateTable: audit_logs
-- Implements H1 from engineering review: persistent audit trail for sensitive operations.
-- The auditLog middleware now writes to this table instead of console.log.

CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id"        TEXT NOT NULL,
    "action"    TEXT NOT NULL,
    "userId"    TEXT,
    "userEmail" TEXT,
    "userRole"  TEXT,
    "ipAddress" TEXT,
    "method"    TEXT NOT NULL,
    "path"      TEXT NOT NULL,
    "params"    TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "audit_logs_userId_idx"    ON "audit_logs"("userId");
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx"    ON "audit_logs"("action");
CREATE INDEX IF NOT EXISTS "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
