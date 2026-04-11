import prisma from '../config/database';
import { accountingService } from './accounting.service';
import { TaxCalculator } from '../utils/tax.calculator';

export class HRService {
    private toDateOnly(dateValue: Date) {
        const date = new Date(dateValue);
        date.setHours(0, 0, 0, 0);
        return date;
    }

    private toWorkedMinutes(clockInAt: Date, clockOutAt: Date) {
        const ms = new Date(clockOutAt).getTime() - new Date(clockInAt).getTime();
        return Math.max(0, Math.floor(ms / 60000));
    }

    /**
     * Get all staff members for a school with HR details
     */
    async getStaffDirectory() {
        return prisma.user.findMany({
            where: {
                role: {
                    notIn: ['PARENT', 'SUPER_ADMIN']
                },
                archived: false
            },
            select: {
                id: true,
                firstName: true,
                middleName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                staffId: true,
                kraPin: true,
                nhifNumber: true,
                nssfNumber: true,
                // shifNumber removed: column doesn't exist in production database
                bankName: true,
                bankAccountNumber: true,
                basicSalary: true,
                employmentType: true,
                joinedAt: true,
                profilePicture: true,
                subject: true,
                gender: true
            },
            orderBy: {
                lastName: 'asc'
            }
        });
    }

    /**
     * Update staff HR and banking details
     */
    async updateStaffHRDetails(userId: string, details: any) {
        return prisma.user.update({
            where: { id: userId },
            data: {
                kraPin: details.kraPin,
                nhifNumber: details.nhifNumber,
                nssfNumber: details.nssfNumber,
                // shifNumber removed: column doesn't exist in production database
                bankName: details.bankName,
                bankAccountName: details.bankAccountName,
                bankAccountNumber: details.bankAccountNumber,
                basicSalary: details.basicSalary,
                employmentType: details.employmentType,
                joinedAt: details.joinedAt ? new Date(details.joinedAt) : undefined
            }
        });
    }

    /**
     * Leave Management
     */
    async getLeaveTypes() {
        return prisma.leaveType.findMany({
            where: { isActive: true }
        });
    }

    async submitLeaveRequest(userId: string, data: any) {
        return prisma.leaveRequest.create({
            data: {
                userId,
                leaveTypeId: data.leaveTypeId,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                reason: data.reason,
                status: 'PENDING'
            }
        });
    }

    async getLeaveRequests(filters: any = {}) {
        return prisma.leaveRequest.findMany({
            where: {
                status: filters.status || undefined
            },
            include: {
                user: {
                    select: { firstName: true, lastName: true, role: true }
                },
                leaveType: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getDashboardStats(month: number, year: number) {
        const [staffCount, pendingLeaveCount, payrollDraftsCount, payrollGeneratedCount, recentRequests] = await Promise.all([
            prisma.user.count({
                where: {
                    role: { notIn: ['PARENT', 'SUPER_ADMIN'] },
                    archived: false,
                    status: 'ACTIVE'
                }
            }),
            prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
            prisma.payrollRecord.count({ where: { month, year, status: 'DRAFT' } }),
            prisma.payrollRecord.count({ where: { month, year, status: 'GENERATED' } }),
            prisma.leaveRequest.findMany({
                where: { status: 'PENDING' },
                include: {
                    user: {
                        select: { firstName: true, lastName: true, role: true }
                    },
                    leaveType: true
                },
                orderBy: { createdAt: 'desc' },
                take: 5
            })
        ]);

        return {
            staffCount,
            pendingLeaveCount,
            payrollDraftsCount,
            payrollGeneratedCount,
            recentRequests
        };
    }

    async approveLeaveRequest(requestId: string, approvedById: string, approved: boolean, rejectionReason?: string) {
        return prisma.leaveRequest.update({
            where: { id: requestId },
            data: {
                status: approved ? 'APPROVED' : 'REJECTED',
                approvedById: approved ? approvedById : null,
                approvedAt: approved ? new Date() : null,
                rejectionReason: approved ? null : rejectionReason
            }
        });
    }

    /**
     * Payroll Management
     */
    async generateMonthlyPayroll(month: number, year: number, generatedBy: string) {
        const staff = await prisma.user.findMany({
            where: {
                role: { notIn: ['PARENT', 'SUPER_ADMIN'] },
                archived: false,
                status: 'ACTIVE',
                basicSalary: { gt: 0 }
            }
        });

        const payrollRecords = [];

        for (const member of staff) {
            const existing = await prisma.payrollRecord.findUnique({
                where: {
                    userId_month_year: {
                        userId: member.id,
                        month,
                        year
                    }
                }
            });

            if (existing) continue;

            const basicSalary = Number(member.basicSalary);
            
            // Calculate Statutory Deductions
            const taxBreakdown = TaxCalculator.getBreakdown(basicSalary, {
                exemptLevy: !!member.housingLevyExempt
            });

            const record = await prisma.payrollRecord.create({
                data: {
                    userId: member.id,
                    month,
                    year,
                    basicSalary,
                    netSalary: taxBreakdown.netSalary,
                    deductions: taxBreakdown as any,
                    status: 'DRAFT',
                    generatedBy
                }
            });

            payrollRecords.push(record);
        }

        return {
            count: payrollRecords.length,
            records: payrollRecords
        };
    }

    async confirmPayrollRecord(recordId: string) {
        const record = await prisma.payrollRecord.findUnique({
            where: { id: recordId },
            include: { user: true }
        });

        if (!record) throw new Error('Payroll record not found');
        if (record.status !== 'DRAFT') throw new Error('Record already confirmed');

        const updated = await prisma.payrollRecord.update({
            where: { id: recordId },
            data: { status: 'GENERATED' }
        });

        await accountingService.postPayrollToLedger(updated);

        return updated;
    }

    async getPayrollRecords(month: number, year: number) {
        return prisma.payrollRecord.findMany({
            where: {
                month,
                year
            },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        staffId: true,
                        bankName: true,
                        bankAccountNumber: true,
                        kraPin: true,
                        nssfNumber: true,
                        // shifNumber removed: column doesn't exist in production database
                    }
                }
            }
        });
    }

    async getTodayClockIn(userId: string, date = new Date()) {
        const dateOnly = this.toDateOnly(date);
        return prisma.staffAttendanceLog.findUnique({
            where: {
                userId_date: {
                    userId,
                    date: dateOnly
                }
            }
        });
    }

    async clockInStaff(userId: string, payload: any = {}) {
        const timestamp = payload?.timestamp ? new Date(payload.timestamp) : new Date();
        const dateOnly = this.toDateOnly(timestamp);

        const attendance = await prisma.staffAttendanceLog.upsert({
            where: {
                userId_date: {
                    userId,
                    date: dateOnly
                }
            },
            update: {
                clockInAt: timestamp,
                source: payload?.source || 'web',
                metadata: payload?.metadata || null
            },
            create: {
                userId,
                date: dateOnly,
                clockInAt: timestamp,
                source: payload?.source || 'web',
                metadata: payload?.metadata || null
            }
        });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                basicSalary: true,
                housingLevyExempt: true
            }
        });

        const month = timestamp.getMonth() + 1;
        const year = timestamp.getFullYear();

        let payrollRecord = await prisma.payrollRecord.findUnique({
            where: {
                userId_month_year: {
                    userId,
                    month,
                    year
                }
            }
        });

        let payrollCreated = false;
        if (!payrollRecord && user?.basicSalary && Number(user.basicSalary) > 0) {
            const basicSalary = Number(user.basicSalary);
            
            // Use same tax calculation for auto-created record
            const taxBreakdown = TaxCalculator.getBreakdown(basicSalary, {
                exemptLevy: !!user.housingLevyExempt
            });

            payrollRecord = await prisma.payrollRecord.create({
                data: {
                    userId,
                    month,
                    year,
                    basicSalary,
                    netSalary: taxBreakdown.netSalary,
                    deductions: taxBreakdown as any,
                    workedMinutes: 0,
                    workedDays: 0,
                    status: 'DRAFT',
                    generatedBy: userId,
                    notes: 'Auto-created from first staff clock-in for the month'
                }
            });
            payrollCreated = true;
        }

        return {
            attendance,
            payroll: payrollRecord,
            payrollCreated
        };
    }

    async clockOutStaff(userId: string, payload: any = {}) {
        const timestamp = payload?.timestamp ? new Date(payload.timestamp) : new Date();
        const dateOnly = this.toDateOnly(timestamp);

        const attendance = await prisma.staffAttendanceLog.findUnique({
            where: {
                userId_date: {
                    userId,
                    date: dateOnly
                }
            }
        });

        if (!attendance) {
            throw new Error('No clock-in record found for today');
        }

        if (timestamp.getTime() < new Date(attendance.clockInAt).getTime()) {
            throw new Error('Clock-out time cannot be earlier than clock-in time');
        }

        const previousWorkedMinutes = attendance.clockOutAt
            ? this.toWorkedMinutes(attendance.clockInAt, attendance.clockOutAt)
            : 0;

        const nextWorkedMinutes = this.toWorkedMinutes(attendance.clockInAt, timestamp);
        const workedMinutesDelta = nextWorkedMinutes - previousWorkedMinutes;
        const shouldIncrementWorkedDays = !attendance.clockOutAt && nextWorkedMinutes > 0;

        const updatedAttendance = await prisma.staffAttendanceLog.update({
            where: { id: attendance.id },
            data: {
                clockOutAt: timestamp,
                source: payload?.source || attendance.source || 'web',
                metadata: payload?.metadata || attendance.metadata || null
            }
        });

        const month = timestamp.getMonth() + 1;
        const year = timestamp.getFullYear();

        let payrollRecord = await prisma.payrollRecord.findUnique({
            where: {
                userId_month_year: {
                    userId,
                    month,
                    year
                }
            }
        });

        if (payrollRecord) {
            payrollRecord = await prisma.payrollRecord.update({
                where: { id: payrollRecord.id },
                data: {
                    workedMinutes: { increment: workedMinutesDelta },
                    workedDays: shouldIncrementWorkedDays ? { increment: 1 } : undefined
                }
            });
        }

        return {
            attendance: updatedAttendance,
            payroll: payrollRecord,
            workedMinutesDelta,
            workedDaysIncremented: shouldIncrementWorkedDays
        };
    }

    /**
     * Performance Management
     */
    async getPerformanceReviews(userId?: string) {
        return prisma.performanceReview.findMany({
            where: {
                userId: userId || undefined
            },
            include: {
                user: {
                    select: { firstName: true, lastName: true, role: true, staffId: true }
                },
                reviewer: {
                    select: { firstName: true, lastName: true }
                }
            },
            orderBy: { reviewDate: 'desc' }
        });
    }

    async createPerformanceReview(data: any) {
        return prisma.performanceReview.create({
            data: {
                userId: data.userId,
                reviewerId: data.reviewerId,
                reviewDate: new Date(data.reviewDate || new Date()),
                periodStart: new Date(data.periodStart),
                periodEnd: new Date(data.periodEnd),
                technicalRating: data.technicalRating,
                behavioralRating: data.behavioralRating,
                collaborationRating: data.collaborationRating,
                overallRating: data.overallRating,
                comments: data.comments,
                goals: data.goals || [],
                status: data.status || 'COMPLETED'
            },
            include: {
                user: {
                    select: { firstName: true, lastName: true, phone: true, email: true }
                },
                reviewer: {
                    select: { firstName: true, lastName: true }
                }
            }
        });
    }

    async updatePerformanceReview(id: string, data: any) {
        return prisma.performanceReview.update({
            where: { id },
            data: {
                technicalRating: data.technicalRating,
                behavioralRating: data.behavioralRating,
                collaborationRating: data.collaborationRating,
                overallRating: data.overallRating,
                comments: data.comments,
                goals: data.goals,
                status: data.status
            },
            include: {
                user: {
                    select: { firstName: true, lastName: true, phone: true, email: true }
                },
                reviewer: {
                    select: { firstName: true, lastName: true }
                }
            }
        });
    }
}

export const hrService = new HRService();
