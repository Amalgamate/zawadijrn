import prisma from '../config/database';
import { accountingService } from './accounting.service';

export class HRService {
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
            const netSalary = basicSalary;

            const record = await prisma.payrollRecord.create({
                data: {
                    userId: member.id,
                    month,
                    year,
                    basicSalary,
                    netSalary,
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
                        bankAccountNumber: true
                    }
                }
            }
        });
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
            }
        });
    }
}

export const hrService = new HRService();
