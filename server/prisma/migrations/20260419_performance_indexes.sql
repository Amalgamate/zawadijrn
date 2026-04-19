-- ============================================================================
-- Performance indexes migration
-- Generated: 2026-04-19
-- Purpose: Fix dashboard 4-minute load times by adding composite indexes
--          on the most-queried (archived, role, status) filter combinations.
--
-- Safe to run on live data: CREATE INDEX CONCURRENTLY does not lock the table.
-- Supabase supports CONCURRENTLY — just run this in the SQL editor.
-- ============================================================================

-- ── users table ──────────────────────────────────────────────────────────────
-- Dashboard fires: count({ role:'TEACHER', archived:false })
-- Dashboard fires: count({ role:'TEACHER', status:'ACTIVE', archived:false })
-- Without composite indexes these are full table scans on every load.

CREATE INDEX CONCURRENTLY IF NOT EXISTS "users_role_archived_idx"
    ON "users" ("role", "archived");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "users_status_archived_idx"
    ON "users" ("status", "archived");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "users_archived_idx"
    ON "users" ("archived");

-- ── fee_invoices table ────────────────────────────────────────────────────────
-- Dashboard: aggregate({ _sum:{paidAmount,balance}, where:{archived:false} })
-- FeeCollection: getAll({ archived:false, status:'PENDING' })
-- TransportFeeManager: getAll({ archived:false, transportBilled:{ gt:0 } })

CREATE INDEX CONCURRENTLY IF NOT EXISTS "fee_invoices_archived_status_idx"
    ON "fee_invoices" ("archived", "status");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "fee_invoices_archived_transport_billed_idx"
    ON "fee_invoices" ("archived", "transport_billed");

-- ── formative_assessments table ───────────────────────────────────────────────
-- Dashboard: count({ status:'DRAFT', archived:false })

CREATE INDEX CONCURRENTLY IF NOT EXISTS "formative_assessments_status_archived_idx"
    ON "formative_assessments" ("status", "archived");

-- ── summative_results table ───────────────────────────────────────────────────
-- Dashboard: groupBy({ testId }, where:{ archived:false })

CREATE INDEX CONCURRENTLY IF NOT EXISTS "summative_results_archived_test_id_idx"
    ON "summative_results" ("archived", "test_id");

-- ── events table ─────────────────────────────────────────────────────────────
-- Dashboard: findMany({ startDate:{ gte:now } })

CREATE INDEX CONCURRENTLY IF NOT EXISTS "events_start_date_idx"
    ON "events" ("start_date");

-- ============================================================================
-- After applying these indexes, run in psql / Supabase SQL editor:
--
--   ANALYZE users;
--   ANALYZE fee_invoices;
--   ANALYZE formative_assessments;
--   ANALYZE summative_results;
--   ANALYZE events;
--
-- ANALYZE updates the planner statistics so PostgreSQL actually uses the
-- new indexes immediately rather than waiting for the autovacuum cycle.
-- ============================================================================
