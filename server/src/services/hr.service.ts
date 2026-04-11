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

    // ─── Staff Directory ──────────────────────────────────────────────────────

    async getStaffDirectory() {
        return prisma.user.findMany({
            where: {
                role: { notIn: ['PARENT', 'SUPER_ADMIN'] },
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
                shifNumber: true,
                bankName: true,
                bankAccountNumber: true,
                bankAccountName: true,
                basicSalary: true,
                employmentType: true,
                joinedAt: true,
                profilePicture: true,
                subject: true,
                gender: true,
                housingLevyExempt: true,
                staffAllowances: {
                    where: { isActive: true },
                    select: { id: true, type: true, label: true, amount: true }
                },
                staffDeductions: {
                    where: { isActive: true },
                    select: { id: true, type: true, label: true, amount: true, isRecurring: true, totalMonths: true, monthsApplied: true }
                }
            },
            orderBy: { lastName: 'asc' }
        });
    }

    async updateStaffHRDetails(userId: string, details: any) {
        // Validate phone number before saving
        if (details.phone) {
            const phoneStr = String(details.phone).trim();
            const isValidPhone = /^(\+?254|0)[17]\d{8}$/.test(phoneStr.replace(/\s/g, ''));
            if (!isValidPhone && phoneStr.length > 0) {
                // Store as string even if unusual but log warning
                console.warn(`[HR] Non-standard phone for userId ${userId}: ${phoneStr}`);
            }
        }

        return prisma.user.update({
            where: { id: userId },
            data: {
                kraPin: details.kraPin ?? undefined,
                nhifNumber: details.nhifNumber ?? undefined,
                nssfNumber: details.nssfNumber ?? undefined,
                shifNumber: details.shifNumber ?? undefined,
                bankName: details.bankName ?? undefined,
                bankAccountName: details.bankAccountName ?? undefined,
                bankAccountNumber: details.bankAccountNumber ?? undefined,
                basicSalary: details.basicSalary !== undefined ? Number(details.basicSalary) : undefined,
                employmentType: details.employmentType ?? undefined,
                housingLevyExempt: details.housingLevyExempt !== undefined ? Boolean(details.housingLevyExempt) : undefined,
                phone: details.phone !== undefined ? String(details.phone) : undefined,
                joinedAt: details.joinedAt ? new Date(details.joinedAt) : undefined
            }
        });
    }

    // ─── Allowances ───────────────────────────────────────────────────────────

    async getStaffAllowances(userId: string) {
        return prisma.staffAllowance.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' }
        });
    }

    async upsertAllowance(userId: string, data: {
        id?: string;
        type: string;
        label: string;
        amount: number;
        isActive?: boolean;
    }) {
        if (data.id) {
            return prisma.staffAllowance.update({
                where: { id: data.id },
                data: {
                    type: data.type,
                    label: data.label,
                    amount: data.amount,
                    isActive: data.isActive ?? true
                }
            });
        }
        return prisma.staffAllowance.create({
            data: {
                userId,
                type: data.type,
                label: data.label,
                amount: data.amount,
                isActive: data.isActive ?? true
            }
        });
    }

    async deleteAllowance(id: string) {
        return prisma.staffAllowance.delete({ where: { id } });
    }

    // ─── Custom Deductions ────────────────────────────────────────────────────

    async getStaffDeductions(userId: string) {
        return prisma.staffDeduction.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' }
        });
    }

    async upsertDeduction(userId: string, data: {
        id?: string;
        type: string;
        label: string;
        amount: number;
        isRecurring?: boolean;
        totalMonths?: number;
        isActive?: boolean;
    }) {
        if (data.id) {
            return prisma.staffDeduction.update({
                where: { id: data.id },
                data: {
                    type: data.type,
                    label: data.label,
                    amount: data.amount,
                    isRecurring: data.isRecurring ?? true,
                    totalMonths: data.totalMonths ?? 0,
                    isActive: data.isActive ?? true
                }
            });
        }
        return prisma.staffDeduction.create({
            data: {
                userId,
                type: data.type,
                label: data.label,
                amount: data.amount,
                isRecurring: data.isRecurring ?? true,
                totalMonths: data.totalMonths ?? 0,
                monthsApplied: 0,
                isActive: data.isActive ?? true
            }
        });
    }

    async deleteDeduction(id: string) {
        return prisma.staffDeduction.delete({ where: { id } });
    }

    // ─── Leave Management ─────────────────────────────────────────────────────

    async getLeaveTypes() {
        return prisma.leaveType.findMany({ where: { isActive: true } });
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
            where: { status: filters.status || undefined },
            include: {
                user: { select: { firstName: true, lastName: true, role: true } },
                leaveType: true
            },
            orderBy: { createdAt: 'desc' }
        });
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

    // ─── Payroll: core generation logic ──────────────────────────────────────

    /**
     * Build the full pay breakdown for one staff member for a given month.
     * Factors in: basicSalary + active allowances + statutory deductions + custom deductions.
     */
    private async buildPayBreakdown(userId: string, basicSalary: number, housingLevyExempt: boolean) {
        // 1. Fetch active allowances
        const allowances = await prisma.staffAllowance.findMany({
            where: { userId, isActive: true }
        });
        const allowanceTotal = allowances.reduce((sum, a) => sum + Number(a.amount), 0);
        const grossSalary = basicSalary + allowanceTotal;

        // 2. Statutory deductions (calculated on grossSalary per 2024 rules)
        const statutory = TaxCalculator.getBreakdown(grossSalary, { exemptLevy: housingLevyExempt });

        // 3. Fetch active custom deductions
        const customDeductions = await prisma.staffDeduction.findMany({
            where: { userId, isActive: true }
        });
        const customDeductionTotal = customDeductions
            .filter(d => d.totalMonths === 0 || d.monthsApplied < d.totalMonths)
            .reduce((sum, d) => sum + Number(d.amount), 0);

        const totalDeductions = statutory.totalDeductions + customDeductionTotal;
        const netSalary = grossSalary - totalDeductions;

        return {
            basicSalary,
            grossSalary,
            allowancesSnapshot: allowances.map(a => ({
                id: a.id, type: a.type, label: a.label, amount: Number(a.amount)
            })),
            allowanceTotal,
            statutory,
            customDeductions: customDeductions
                .filter(d => d.totalMonths === 0 || d.monthsApplied < d.totalMonths)
                .map(d => ({ id: d.id, type: d.type, label: d.label, amount: Number(d.amount) })),
            customDeductionTotal,
            totalDeductions,
            netSalary
        };
    }

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
                where: { userId_month_year: { userId: member.id, month, year } }
            });
            if (existing) continue;

            const basicSalary = Number(member.basicSalary);
            const pay = await this.buildPayBreakdown(member.id, basicSalary, !!member.housingLevyExempt);

            const record = await prisma.payrollRecord.create({
                data: {
                    userId: member.id,
                    month,
                    year,
                    basicSalary,
                    grossSalary: pay.grossSalary,
                    netSalary: pay.netSalary,
                    allowances: {
                        items: pay.allowancesSnapshot,
                        total: pay.allowanceTotal
                    } as any,
                    deductions: {
                        paye: pay.statutory.paye,
                        nssf: pay.statutory.nssf,
                        shif: pay.statutory.shif,
                        housingLevy: pay.statutory.housingLevy,
                        statutoryTotal: pay.statutory.totalDeductions,
                        customItems: pay.customDeductions,
                        customTotal: pay.customDeductionTotal,
                        totalDeductions: pay.totalDeductions
                    } as any,
                    status: 'DRAFT',
                    generatedBy
                }
            });

            // Increment monthsApplied for bounded custom deductions
            for (const cd of pay.customDeductions) {
                if (cd) {
                    const ded = await prisma.staffDeduction.findUnique({ where: { id: cd.id } });
                    if (ded && ded.totalMonths > 0) {
                        const newApplied = ded.monthsApplied + 1;
                        await prisma.staffDeduction.update({
                            where: { id: cd.id },
                            data: {
                                monthsApplied: newApplied,
                                isActive: newApplied < ded.totalMonths
                            }
                        });
                    }
                }
            }

            payrollRecords.push(record);
        }

        return { count: payrollRecords.length, records: payrollRecords };
    }

    async confirmPayrollRecord(recordId: string) {
        const record = await prisma.payrollRecord.findUnique({
            where: { id: recordId },
            include: { user: true }
        });
        if (!record) throw new Error('Payroll record not found');
        if (record.status !== 'DRAFT') throw new Error('Record is not in DRAFT status');

        const updated = await prisma.payrollRecord.update({
            where: { id: recordId },
            data: { status: 'GENERATED' }
        });

        await accountingService.postPayrollToLedger(updated);
        return updated;
    }

    /**
     * Bulk confirm all DRAFT records for a given month/year.
     * Returns counts of confirmed vs already-processed.
     */
    async bulkConfirmPayroll(month: number, year: number) {
        const drafts = await prisma.payrollRecord.findMany({
            where: { month, year, status: 'DRAFT' }
        });

        let confirmed = 0;
        const errors: string[] = [];

        for (const record of drafts) {
            try {
                const updated = await prisma.payrollRecord.update({
                    where: { id: record.id },
                    data: { status: 'GENERATED' }
                });
                await accountingService.postPayrollToLedger(updated);
                confirmed++;
            } catch (err: any) {
                errors.push(`Record ${record.id}: ${err.message}`);
            }
        }

        return {
            total: drafts.length,
            confirmed,
            errors
        };
    }

    /**
     * Mark a payroll record as PAID with an optional payment reference.
     */
    async markPayrollPaid(recordId: string, paymentReference?: string) {
        const record = await prisma.payrollRecord.findUnique({ where: { id: recordId } });
        if (!record) throw new Error('Payroll record not found');
        if (record.status === 'PAID') throw new Error('Record is already marked as PAID');
        if (record.status === 'VOID') throw new Error('Cannot mark a VOID record as paid');

        return prisma.payrollRecord.update({
            where: { id: recordId },
            data: {
                status: 'PAID',
                paidAt: new Date(),
                paymentReference: paymentReference || null
            }
        });
    }

    /**
     * Bulk mark all GENERATED records for a month as PAID.
     */
    async bulkMarkPaid(month: number, year: number, paymentReference?: string) {
        const generated = await prisma.payrollRecord.findMany({
            where: { month, year, status: 'GENERATED' }
        });

        const updated = await prisma.payrollRecord.updateMany({
            where: { month, year, status: 'GENERATED' },
            data: {
                status: 'PAID',
                paidAt: new Date(),
                paymentReference: paymentReference || null
            }
        });

        return { total: generated.length, paid: updated.count };
    }

    async getPayrollRecords(month: number, year: number) {
        return prisma.payrollRecord.findMany({
            where: { month, year },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        staffId: true,
                        bankName: true,
                        bankAccountNumber: true,
                        bankAccountName: true,
                        kraPin: true,
                        nssfNumber: true,
                        shifNumber: true,
                        role: true
                    }
                }
            },
            orderBy: [{ status: 'asc' }, { user: { lastName: 'asc' } }]
        });
    }

    // ─── Attendance ───────────────────────────────────────────────────────────

    async getDashboardStats(month: number, year: number) {
        const [staffCount, pendingLeaveCount, payrollDraftsCount, payrollGeneratedCount, recentRequests] = await Promise.all([
            prisma.user.count({
                where: { role: { notIn: ['PARENT', 'SUPER_ADMIN'] }, archived: false, status: 'ACTIVE' }
            }),
            prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
            prisma.payrollRecord.count({ where: { month, year, status: 'DRAFT' } }),
            prisma.payrollRecord.count({ where: { month, year, status: 'GENERATED' } }),
            prisma.leaveRequest.findMany({
                where: { status: 'PENDING' },
                include: {
                    user: { select: { firstName: true, lastName: true, role: true } },
                    leaveType: true
                },
                orderBy: { createdAt: 'desc' },
                take: 5
            })
        ]);

        return { staffCount, pendingLeaveCount, payrollDraftsCount, payrollGeneratedCount, recentRequests };
    }

    async getTodayClockIn(userId: string, date = new Date()) {
        const dateOnly = this.toDateOnly(date);
        return prisma.staffAttendanceLog.findUnique({
            where: { userId_date: { userId, date: dateOnly } }
        });
    }

    async clockInStaff(userId: string, payload: any = {}) {
        const timestamp = payload?.timestamp ? new Date(payload.timestamp) : new Date();
        const dateOnly = this.toDateOnly(timestamp);

        const attendance = await prisma.staffAttendanceLog.upsert({
            where: { userId_date: { userId, date: dateOnly } },
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
            select: { id: true, basicSalary: true, housingLevyExempt: true }
        });

        const month = timestamp.getMonth() + 1;
        const year = timestamp.getFullYear();

        let payrollRecord = await prisma.payrollRecord.findUnique({
            where: { userId_month_year: { userId, month, year } }
        });

        let payrollCreated = false;
        if (!payrollRecord && user?.basicSalary && Number(user.basicSalary) > 0) {
            const basicSalary = Number(user.basicSalary);
            const pay = await this.buildPayBreakdown(userId, basicSalary, !!user.housingLevyExempt);

            payrollRecord = await prisma.payrollRecord.create({
                data: {
                    userId,
                    month,
                    year,
                    basicSalary,
                    grossSalary: pay.grossSalary,
                    netSalary: pay.netSalary,
                    allowances: {
                        items: pay.allowancesSnapshot,
                        total: pay.allowanceTotal
                    } as any,
                    deductions: {
                        paye: pay.statutory.paye,
                        nssf: pay.statutory.nssf,
                        shif: pay.statutory.shif,
                        housingLevy: pay.statutory.housingLevy,
                        statutoryTotal: pay.statutory.totalDeductions,
                        customItems: pay.customDeductions,
                        customTotal: pay.customDeductionTotal,
                        totalDeductions: pay.totalDeductions
                    } as any,
                    workedMinutes: 0,
                    workedDays: 0,
                    status: 'DRAFT',
                    generatedBy: userId,
                    notes: 'Auto-created from first staff clock-in for the month'
                }
            });
            payrollCreated = true;
        }

        return { attendance, payroll: payrollRecord, payrollCreated };
    }

    async clockOutStaff(userId: string, payload: any = {}) {
        const timestamp = payload?.timestamp ? new Date(payload.timestamp) : new Date();
        const dateOnly = this.toDateOnly(timestamp);

        const attendance = await prisma.staffAttendanceLog.findUnique({
            where: { userId_date: { userId, date: dateOnly } }
        });

        if (!attendance) throw new Error('No clock-in record found for today');
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
            where: { userId_month_year: { userId, month, year } }
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

        return { attendance: updatedAttendance, payroll: payrollRecord, workedMinutesDelta, workedDaysIncremented: shouldIncrementWorkedDays };
    }

    // ─── Performance ──────────────────────────────────────────────────────────

    async getPerformanceReviews(userId?: string) {
        return prisma.performanceReview.findMany({
            where: { userId: userId || undefined },
            include: {
                user: { select: { firstName: true, lastName: true, role: true, staffId: true } },
                reviewer: { select: { firstName: true, lastName: true } }
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
                user: { select: { firstName: true, lastName: true, phone: true, email: true } },
                reviewer: { select: { firstName: true, lastName: true } }
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
                user: { select: { firstName: true, lastName: true, phone: true, email: true } },
                reviewer: { select: { firstName: true, lastName: true } }
            }
        });
    }
}

export const hrService = new HRService();
