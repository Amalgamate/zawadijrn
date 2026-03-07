import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { hrService } from '../services/hr.service';
import { ApiError } from '../utils/error.util';

export class HRController {
    async clockIn(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.userId;
            const schoolId = req.user?.schoolId;
            if (!userId) throw new ApiError(401, 'Unauthorized');

            const result = await hrService.clockInStaff(userId, schoolId, req.body || {});
            res.status(201).json({ success: true, message: 'Clock-in recorded', data: result });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({ success: false, message: error.message });
        }
    }

    async getTodayClockIn(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) throw new ApiError(401, 'Unauthorized');

            const data = await hrService.getTodayClockIn(userId);
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({ success: false, message: error.message });
        }
    }

    async clockOut(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.userId;
            const schoolId = req.user?.schoolId;
            if (!userId) throw new ApiError(401, 'Unauthorized');

            const result = await hrService.clockOutStaff(userId, schoolId, req.body || {});
            res.status(200).json({ success: true, message: 'Clock-out recorded', data: result });
        } catch (error: any) {
            const message = error?.message || 'Failed to clock out';
            const statusCode = error?.statusCode
                || (message.includes('No clock-in record') || message.includes('earlier than clock-in') ? 400 : 500);
            res.status(statusCode).json({ success: false, message });
        }
    }

    /**
     * Staff Directory
     */
    async getStaffDirectory(req: AuthRequest, res: Response) {
        try {
            const staff = await hrService.getStaffDirectory();
            res.json({ success: true, data: staff });
        } catch (error: any) {
            console.error('[HR Controller] Error fetching staff:', error);
            res.status(error.statusCode || 500).json({ success: false, message: error.message });
        }
    }

    async updateStaffHR(req: AuthRequest, res: Response) {
        try {
            const { userId } = req.params;
            const details = req.body;

            const updated = await hrService.updateStaffHRDetails(userId, details);
            res.json({ success: true, message: 'Staff HR details updated', data: updated });
        } catch (error: any) {
            console.error('[HR Controller] Error updating staff HR:', error);
            res.status(error.statusCode || 500).json({ success: false, message: error.message });
        }
    }

    /**
     * Leave Management
     */
    async getLeaveTypes(req: AuthRequest, res: Response) {
        try {
            const types = await hrService.getLeaveTypes();
            res.json({ success: true, data: types });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async submitLeave(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.userId;
            const data = req.body;
            if (!userId) throw new ApiError(401, 'Unauthorized');

            const request = await hrService.submitLeaveRequest(userId, data);
            res.status(201).json({ success: true, message: 'Leave request submitted', data: request });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({ success: false, message: error.message });
        }
    }

    async getLeaveRequests(req: AuthRequest, res: Response) {
        try {
            const requests = await hrService.getLeaveRequests(req.query);
            res.json({ success: true, data: requests });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async approveLeave(req: AuthRequest, res: Response) {
        try {
            const { requestId } = req.params;
            const { approved, rejectionReason } = req.body;
            const approvedBy = req.user?.userId;

            if (!approvedBy) throw new ApiError(401, 'Unauthorized');

            const updated = await hrService.approveLeaveRequest(requestId, approvedBy, approved, rejectionReason);
            res.json({ success: true, message: `Leave ${approved ? 'approved' : 'rejected'}`, data: updated });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({ success: false, message: error.message });
        }
    }

    /**
     * Payroll Management
     */
    async generatePayroll(req: AuthRequest, res: Response) {
        try {
            const { month, year } = req.body;
            const generatedBy = req.user?.userId;

            if (!generatedBy) throw new ApiError(401, 'Unauthorized');

            const result = await hrService.generateMonthlyPayroll(Number(month), Number(year), generatedBy);
            res.json({ success: true, message: 'Payroll generation complete', data: result });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({ success: false, message: error.message });
        }
    }

    async getPayroll(req: AuthRequest, res: Response) {
        try {
            const { month, year } = req.query;
            const records = await hrService.getPayrollRecords(Number(month), Number(year));
            res.json({ success: true, data: records });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async confirmPayroll(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const confirmed = await hrService.confirmPayrollRecord(id);
            res.json({ success: true, message: 'Payroll record confirmed and posted to ledger', data: confirmed });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({ success: false, message: error.message });
        }
    }

    /**
     * Performance Management
     */
    async getPerformance(req: AuthRequest, res: Response) {
        try {
            const { userId } = req.query;
            const reviews = await hrService.getPerformanceReviews(userId as string);
            res.json({ success: true, data: reviews });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async createPerformance(req: AuthRequest, res: Response) {
        try {
            const reviewerId = req.user?.userId;
            const data = req.body;
            if (!reviewerId) throw new ApiError(401, 'Unauthorized');

            const review = await hrService.createPerformanceReview({ ...data, reviewerId });
            res.status(201).json({ success: true, message: 'Performance review created', data: review });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({ success: false, message: error.message });
        }
    }

    async updatePerformance(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const data = req.body;

            const updated = await hrService.updatePerformanceReview(id, data);
            res.json({ success: true, message: 'Performance review updated', data: updated });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({ success: false, message: error.message });
        }
    }
}

export const hrController = new HRController();
