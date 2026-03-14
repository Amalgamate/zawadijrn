-- Rename Event table if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'Event') THEN
        ALTER TABLE "Event" RENAME TO "events";
    END IF;
END $$;

-- Drop ForeignKey Constraints
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_schoolId_fkey";
ALTER TABLE "classes" DROP CONSTRAINT IF EXISTS "classes_schoolId_fkey";
ALTER TABLE "classes" DROP CONSTRAINT IF EXISTS "classes_branchId_fkey";
ALTER TABLE "learners" DROP CONSTRAINT IF EXISTS "learners_schoolId_fkey";
ALTER TABLE "learners" DROP CONSTRAINT IF EXISTS "learners_branchId_fkey";
ALTER TABLE "attendances" DROP CONSTRAINT IF EXISTS "attendances_schoolId_fkey";
ALTER TABLE "formative_assessments" DROP CONSTRAINT IF EXISTS "formative_assessments_schoolId_fkey";
ALTER TABLE "summative_tests" DROP CONSTRAINT IF EXISTS "summative_tests_schoolId_fkey";
ALTER TABLE "term_configs" DROP CONSTRAINT IF EXISTS "term_configs_schoolId_fkey";
ALTER TABLE "aggregation_configs" DROP CONSTRAINT IF EXISTS "aggregation_configs_schoolId_fkey";
ALTER TABLE "change_history" DROP CONSTRAINT IF EXISTS "change_history_schoolId_fkey";
ALTER TABLE "summative_results" DROP CONSTRAINT IF EXISTS "summative_results_schoolId_fkey";
ALTER TABLE "core_competencies" DROP CONSTRAINT IF EXISTS "core_competencies_schoolId_fkey";
ALTER TABLE "values_assessments" DROP CONSTRAINT IF EXISTS "values_assessments_schoolId_fkey";
ALTER TABLE "co_curricular_activities" DROP CONSTRAINT IF EXISTS "co_curricular_activities_schoolId_fkey";
ALTER TABLE "termly_report_comments" DROP CONSTRAINT IF EXISTS "termly_report_comments_schoolId_fkey";
ALTER TABLE "id_card_templates" DROP CONSTRAINT IF EXISTS "id_card_templates_schoolId_fkey";
ALTER TABLE "fee_structures" DROP CONSTRAINT IF EXISTS "fee_structures_schoolId_fkey";
ALTER TABLE "fee_invoices" DROP CONSTRAINT IF EXISTS "fee_invoices_schoolId_fkey";
ALTER TABLE "fee_payments" DROP CONSTRAINT IF EXISTS "fee_payments_schoolId_fkey";
ALTER TABLE "messages" DROP CONSTRAINT IF EXISTS "messages_schoolId_fkey";
ALTER TABLE "broadcast_campaigns" DROP CONSTRAINT IF EXISTS "broadcast_campaigns_schoolId_fkey";
ALTER TABLE "sms_delivery_logs" DROP CONSTRAINT IF EXISTS "sms_delivery_logs_schoolId_fkey";
ALTER TABLE "grading_systems" DROP CONSTRAINT IF EXISTS "grading_systems_schoolId_fkey";
ALTER TABLE "grading_ranges" DROP CONSTRAINT IF EXISTS "grading_ranges_schoolId_fkey";
ALTER TABLE "scale_groups" DROP CONSTRAINT IF EXISTS "scale_groups_schoolId_fkey";
ALTER TABLE "stream_configs" DROP CONSTRAINT IF EXISTS "stream_configs_schoolId_fkey";
ALTER TABLE "communication_configs" DROP CONSTRAINT IF EXISTS "communication_configs_schoolId_fkey";
ALTER TABLE "assessment_sms_audits" DROP CONSTRAINT IF EXISTS "assessment_sms_audits_schoolId_fkey";
ALTER TABLE "learning_areas" DROP CONSTRAINT IF EXISTS "learning_areas_schoolId_fkey";
ALTER TABLE "subject_assignments" DROP CONSTRAINT IF EXISTS "subject_assignments_schoolId_fkey";
ALTER TABLE "support_tickets" DROP CONSTRAINT IF EXISTS "support_tickets_schoolId_fkey";
ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_schoolId_fkey";
ALTER TABLE "books" DROP CONSTRAINT IF EXISTS "books_schoolId_fkey";
ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "events_schoolId_fkey";
ALTER TABLE "contact_groups" DROP CONSTRAINT IF EXISTS "contact_groups_schoolId_fkey";
ALTER TABLE "leave_requests" DROP CONSTRAINT IF EXISTS "leave_requests_schoolId_fkey";
ALTER TABLE "payroll_records" DROP CONSTRAINT IF EXISTS "payroll_records_schoolId_fkey";
ALTER TABLE "staff_attendance_logs" DROP CONSTRAINT IF EXISTS "staff_attendance_logs_schoolId_fkey";
ALTER TABLE "staff_documents" DROP CONSTRAINT IF EXISTS "staff_documents_schoolId_fkey";
ALTER TABLE "performance_reviews" DROP CONSTRAINT IF EXISTS "performance_reviews_schoolId_fkey";
ALTER TABLE "accounts" DROP CONSTRAINT IF EXISTS "accounts_schoolId_fkey";
ALTER TABLE "journals" DROP CONSTRAINT IF EXISTS "journals_schoolId_fkey";
ALTER TABLE "journal_entries" DROP CONSTRAINT IF EXISTS "journal_entries_schoolId_fkey";
ALTER TABLE "expenses" DROP CONSTRAINT IF EXISTS "expenses_schoolId_fkey";
ALTER TABLE "bank_statements" DROP CONSTRAINT IF EXISTS "bank_statements_schoolId_fkey";
ALTER TABLE "inventory_categories" DROP CONSTRAINT IF EXISTS "inventory_categories_schoolId_fkey";
ALTER TABLE "inventory_stores" DROP CONSTRAINT IF EXISTS "inventory_stores_schoolId_fkey";
ALTER TABLE "inventory_items" DROP CONSTRAINT IF EXISTS "inventory_items_schoolId_fkey";
ALTER TABLE "stock_movements" DROP CONSTRAINT IF EXISTS "stock_movements_schoolId_fkey";
ALTER TABLE "stock_requisitions" DROP CONSTRAINT IF EXISTS "stock_requisitions_schoolId_fkey";
ALTER TABLE "fixed_assets" DROP CONSTRAINT IF EXISTS "fixed_assets_schoolId_fkey";

-- Drop SchoolId Columns
ALTER TABLE "users" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "classes" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "classes" DROP COLUMN IF EXISTS "branchId";
ALTER TABLE "learners" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "learners" DROP COLUMN IF EXISTS "branchId";
ALTER TABLE "attendances" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "formative_assessments" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "summative_tests" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "term_configs" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "aggregation_configs" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "change_history" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "summative_results" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "core_competencies" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "values_assessments" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "co_curricular_activities" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "termly_report_comments" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "id_card_templates" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "fee_structures" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "fee_invoices" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "fee_payments" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "messages" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "broadcast_campaigns" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "sms_delivery_logs" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "grading_systems" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "grading_ranges" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "scale_groups" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "stream_configs" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "communication_configs" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "assessment_sms_audits" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "learning_areas" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "subject_assignments" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "support_tickets" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "documents" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "books" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "events" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "contact_groups" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "leave_requests" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "payroll_records" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "staff_attendance_logs" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "staff_documents" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "performance_reviews" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "accounts" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "journals" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "journal_entries" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "expenses" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "bank_statements" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "inventory_categories" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "inventory_stores" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "inventory_items" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "stock_movements" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "stock_requisitions" DROP COLUMN IF EXISTS "schoolId";
ALTER TABLE "fixed_assets" DROP COLUMN IF EXISTS "schoolId";

-- Drop Branches Table
DROP TABLE IF EXISTS "branches";

-- Example: core_competencies
ALTER TABLE "core_competencies" DROP CONSTRAINT IF EXISTS "core_competencies_learnerId_term_academicYear_schoolId_key";
ALTER TABLE "core_competencies" DROP CONSTRAINT IF EXISTS "core_competencies_learnerId_term_academicYear_key";
ALTER TABLE "core_competencies" ADD CONSTRAINT "core_competencies_learnerId_term_academicYear_key" UNIQUE ("learnerId", "term", "academicYear");

-- Example: values_assessments
ALTER TABLE "values_assessments" DROP CONSTRAINT IF EXISTS "values_assessments_learnerId_term_academicYear_schoolId_key";
ALTER TABLE "values_assessments" DROP CONSTRAINT IF EXISTS "values_assessments_learnerId_term_academicYear_key";
ALTER TABLE "values_assessments" ADD CONSTRAINT "values_assessments_learnerId_term_academicYear_key" UNIQUE ("learnerId", "term", "academicYear");

-- Example: termly_report_comments
ALTER TABLE "termly_report_comments" DROP CONSTRAINT IF EXISTS "termly_report_comments_learnerId_term_academicYear_schoolId_key";
ALTER TABLE "termly_report_comments" DROP CONSTRAINT IF EXISTS "termly_report_comments_learnerId_term_academicYear_key";
ALTER TABLE "termly_report_comments" ADD CONSTRAINT "termly_report_comments_learnerId_term_academicYear_key" UNIQUE ("learnerId", "term", "academicYear");

-- Example: formative_assessments
ALTER TABLE "formative_assessments" DROP CONSTRAINT IF EXISTS "formative_assessments_learnerId_term_academicYear_learni_key";
ALTER TABLE "formative_assessments" DROP CONSTRAINT IF EXISTS "formative_assessments_learnerId_term_academicYear_learningArea_type_title_key";
ALTER TABLE "formative_assessments" ADD CONSTRAINT "formative_assessments_learnerId_term_academicYear_learningArea_type_title_key" UNIQUE ("learnerId", "term", "academicYear", "learningArea", "type", "title");

-- Example: classes
ALTER TABLE "classes" DROP CONSTRAINT IF EXISTS "classes_grade_stream_academicYear_term_schoolId_key";
ALTER TABLE "classes" DROP CONSTRAINT IF EXISTS "classes_grade_stream_academicYear_term_key";
ALTER TABLE "classes" ADD CONSTRAINT "classes_grade_stream_academicYear_term_key" UNIQUE ("grade", "stream", "academicYear", "term");

-- Example: summative_results
ALTER TABLE "summative_results" DROP CONSTRAINT IF EXISTS "summative_results_testId_learnerId_schoolId_key";
ALTER TABLE "summative_results" DROP CONSTRAINT IF EXISTS "summative_results_testId_learnerId_key";
ALTER TABLE "summative_results" ADD CONSTRAINT "summative_results_testId_learnerId_key" UNIQUE ("testId", "learnerId");
