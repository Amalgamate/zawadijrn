/**
 * Library Automation & Reports Controller — Phases 4 & 5
 * Exposes:
 *   POST /api/library/automation/run-all          — manual trigger for all cron jobs
 *   POST /api/library/automation/run/:job         — trigger a single job by name
 *   GET  /api/library/reports/inventory           — full book catalog report
 *   GET  /api/library/reports/categories          — by-category holdings report
 *   GET  /api/library/reports/copy-audit          — copy condition audit
 *   GET  /api/library/reports/circulation         — daily circulation over a date range
 *   GET  /api/library/reports/members             — per-member activity report
 *   GET  /api/library/reports/fines               — overdue fines with aging buckets
 *   GET  /api/library/reports/dashboard           — aggregated dashboard summary
 *
 * @module controllers/libraryAutomation.controller
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/permissions.middleware';
import { libraryAutomationService } from '../services/libraryAutomation.service';
import { libraryReportsService }    from '../services/libraryReports.service';
import { ApiError } from '../utils/error.util';
import { BookStatus, MemberStatus } from '@prisma/client';

export class LibraryAutomationController {

    // =========================================================================
    // Phase 4 — Automation / manual triggers
    // =========================================================================

    /**
     * POST /api/library/automation/run-all
     * Runs every automation job in sequence.  Useful for an admin "Run Now" button.
     */
    async runAllJobs(req: AuthRequest, res: Response) {
        const results = await libraryAutomationService.runAllJobs();

        res.json({
            success: true,
            message: 'All library automation jobs completed',
            data:    results
        });
    }

    /**
     * POST /api/library/automation/run/:job
     * Triggers a single named job.
     * Valid job names: assess-fines | send-reminders | suspend-members | expire-memberships
     */
    async runJob(req: AuthRequest, res: Response) {
        const { job } = req.params;

        let result: unknown;

        switch (job) {
            case 'assess-fines':
                result = await libraryAutomationService.autoAssessLateFines();
                break;
            case 'send-reminders':
                result = await libraryAutomationService.sendOverdueSmsBatch();
                break;
            case 'suspend-members':
                result = await libraryAutomationService.autoSuspendMembersWithFines();
                break;
            case 'expire-memberships':
                result = await libraryAutomationService.autoExpireMemberships();
                break;
            default:
                throw new ApiError(
                    400,
                    `Unknown job "${job}". Valid values: assess-fines | send-reminders | suspend-members | expire-memberships`
                );
        }

        res.json({
            success: true,
            message: `Job "${job}" completed`,
            data:    result
        });
    }


    // =========================================================================
    // Phase 5 — Reports
    // =========================================================================

    /**
     * GET /api/library/reports/inventory
     * Query params: category, status, search
     */
    async getInventoryReport(req: AuthRequest, res: Response) {
        const { category, status, search } = req.query;

        const rows = await libraryReportsService.getInventoryReport({
            category: category as string | undefined,
            status:   status   as BookStatus | undefined,
            search:   search   as string | undefined
        });

        res.json({
            success:    true,
            data:       rows,
            totalBooks: rows.length,
            generatedAt: new Date()
        });
    }

    /**
     * GET /api/library/reports/categories
     */
    async getCategoryReport(req: AuthRequest, res: Response) {
        const rows = await libraryReportsService.getCategoryReport();

        res.json({
            success:     true,
            data:        rows,
            generatedAt: new Date()
        });
    }

    /**
     * GET /api/library/reports/copy-audit
     */
    async getCopyConditionAudit(req: AuthRequest, res: Response) {
        const rows = await libraryReportsService.getCopyConditionAudit();

        res.json({
            success:     true,
            data:        rows,
            generatedAt: new Date()
        });
    }

    /**
     * GET /api/library/reports/circulation
     * Query params: from (ISO date), to (ISO date)
     * Defaults: last 30 days
     */
    async getCirculationReport(req: AuthRequest, res: Response) {
        const { from, to } = req.query;

        const fromDate = from ? new Date(from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const toDate   = to   ? new Date(to   as string) : new Date();

        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
            throw new ApiError(400, 'Invalid date format. Use ISO 8601 (e.g. 2026-01-01)');
        }

        if (fromDate > toDate) {
            throw new ApiError(400, '"from" must be before "to"');
        }

        const rows = await libraryReportsService.getCirculationReport(fromDate, toDate);

        res.json({
            success:     true,
            data:        rows,
            from:        fromDate,
            to:          toDate,
            generatedAt: new Date()
        });
    }

    /**
     * GET /api/library/reports/members
     * Query params: status, search, page, limit
     */
    async getMemberActivityReport(req: AuthRequest, res: Response) {
        const { status, search, page = '1', limit = '50' } = req.query;

        const result = await libraryReportsService.getMemberActivityReport({
            status: status as MemberStatus | undefined,
            search: search as string | undefined,
            page:   parseInt(page  as string),
            limit:  parseInt(limit as string)
        });

        res.json({
            success:     true,
            data:        result.rows,
            total:       result.total,
            generatedAt: new Date()
        });
    }

    /**
     * GET /api/library/reports/fines
     */
    async getOverdueFinesReport(req: AuthRequest, res: Response) {
        const rows = await libraryReportsService.getOverdueFinesReport();

        const totalAmount = rows.reduce((sum, r) => sum + r.fineAmount, 0);

        res.json({
            success:     true,
            data:        rows,
            totalAmount,
            totalCount:  rows.length,
            generatedAt: new Date()
        });
    }

    /**
     * GET /api/library/reports/dashboard
     */
    async getDashboardSummary(req: AuthRequest, res: Response) {
        const summary = await libraryReportsService.getDashboardSummary();

        res.json({
            success:     true,
            data:        summary,
            generatedAt: new Date()
        });
    }
}
