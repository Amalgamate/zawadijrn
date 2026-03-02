import { Request, Response } from 'express';
import prisma from '../config/database';
import { ApiError } from '../utils/error.util';
import { AuthRequest } from '../middleware/permissions.middleware';

export class DashboardController {
    /**
     * Get metrics for Admin Dashboard
     * GET /api/dashboard/admin
     */
    async getAdminMetrics(req: AuthRequest, res: Response) {
        try {
            const schoolId = req.user?.schoolId;
            if (!schoolId) {
                throw new ApiError(400, 'School ID is required');
            }

            const { filter = 'today' } = req.query;
            const dateFilter = this.getDateFilter(filter as string);
            const prevDateFilter = this.getPreviousDateFilter(filter as string);

            // 1. Basic Counts & Trends
            const [
                studentCount,
                teacherCount,
                classCount,
                prevStudentCount,
                prevTeacherCount
            ] = await Promise.all([
                prisma.learner.count({ where: { schoolId, archived: false } }),
                prisma.user.count({ where: { schoolId, role: 'TEACHER', archived: false } }),
                prisma.class.count({ where: { schoolId, archived: false } }),
                prisma.learner.count({ where: { schoolId, archived: false, createdAt: prevDateFilter } }),
                prisma.user.count({ where: { schoolId, role: 'TEACHER', archived: false, createdAt: prevDateFilter } })
            ]);

            const studentTrend = this.calculateTrend(studentCount, prevStudentCount);
            const teacherTrend = this.calculateTrend(teacherCount, prevTeacherCount);

            // 2. Active Counts
            const activeStudents = await prisma.learner.count({
                where: { schoolId, status: 'ACTIVE', archived: false }
            });
            const activeTeachers = await prisma.user.count({
                where: { schoolId, role: 'TEACHER', status: 'ACTIVE', archived: false }
            });

            // 3. Attendance
            const attendanceSummary = await prisma.attendance.groupBy({
                by: ['status'],
                where: {
                    learner: { schoolId },
                    date: dateFilter
                },
                _count: true
            });

            const attendanceMap: Record<string, number> = {
                PRESENT: 0,
                ABSENT: 0,
                LATE: 0
            };
            attendanceSummary.forEach(item => {
                attendanceMap[item.status] = item._count;
            });

            const avgAttendance = studentCount > 0 ? (attendanceMap.PRESENT / studentCount) * 100 : 0;

            // 4. Students by Grade
            const studentsByGradeData = await prisma.learner.groupBy({
                by: ['grade'],
                where: { schoolId, archived: false },
                _count: true
            });

            const gradeDistribution = studentsByGradeData.map(item => ({
                label: item.grade.replace('_', ' '),
                value: item._count,
                color: this.getGradeColor(item.grade)
            }));

            // 5. Staff Distribution
            const staffByRole = await prisma.user.groupBy({
                by: ['role'],
                where: { schoolId, archived: false },
                _count: true
            });

            const staffDistribution = staffByRole.map(item => ({
                label: item.role.replace('_', ' '),
                value: item._count,
                color: this.getRoleColor(item.role)
            }));

            // 6. Recent Activity (Latest 5 arrivals/admissions/assessments)
            const [latestAdmissions, latestAssessments] = await Promise.all([
                prisma.learner.findMany({
                    where: { schoolId },
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                    select: { firstName: true, lastName: true, admissionNumber: true, grade: true, createdAt: true }
                }),
                prisma.formativeAssessment.findMany({
                    where: { schoolId },
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                    select: { title: true, learningArea: true, learner: { select: { firstName: true, lastName: true } }, createdAt: true }
                })
            ]);

            // 7. Financials (Fee Collected, Fee Pending, Stream Breakdown)
            const feeInvoices = await prisma.feeInvoice.findMany({
                where: { schoolId, archived: false },
                include: { learner: { select: { grade: true } } }
            });

            let feeCollected = 0;
            let feePending = 0;
            const streamBreakdownMap: Record<string, { target: number, collected: number, bal: number }> = {};

            feeInvoices.forEach(inv => {
                const paid = Number(inv.paidAmount) || 0;
                const bal = Number(inv.balance) || 0;
                const target = Number(inv.totalAmount) || 0;

                feeCollected += paid;
                feePending += bal;

                const grade = inv.learner?.grade || 'UNKNOWN';
                if (!streamBreakdownMap[grade]) {
                    streamBreakdownMap[grade] = { target: 0, collected: 0, bal: 0 };
                }
                streamBreakdownMap[grade].target += target;
                streamBreakdownMap[grade].collected += paid;
                streamBreakdownMap[grade].bal += bal;
            });

            const streamBreakdown = Object.entries(streamBreakdownMap).map(([grade, data]) => ({
                name: grade.replace('_', ' '),
                target: data.target,
                collected: data.collected,
                bal: data.bal
            }));

            // 8. Academic Performance (Top Classes & Subject Proficiency)
            const summativeResults = await prisma.summativeResult.findMany({
                where: { schoolId, archived: false },
                include: { test: { select: { grade: true } } }
            });

            const classPerfMap: Record<string, { totalMarks: number, count: number }> = {};
            summativeResults.forEach(res => {
                const grade = res.test?.grade || 'UNKNOWN';
                if (!classPerfMap[grade]) classPerfMap[grade] = { totalMarks: 0, count: 0 };
                classPerfMap[grade].totalMarks += Number(res.percentage || res.marksObtained);
                classPerfMap[grade].count += 1;
            });

            const topPerformingClasses = Object.entries(classPerfMap)
                .map(([grade, data]) => {
                    const avg = data.count > 0 ? (data.totalMarks / data.count) : 0;
                    return {
                        grade: grade.replace('_', ' '),
                        avg: parseFloat(avg.toFixed(1)),
                        label: avg > 80 ? 'Exceeding' : avg > 60 ? 'Meeting' : 'Approaching'
                    };
                })
                .sort((a, b) => b.avg - a.avg)
                .slice(0, 5);

            const subjectProficiencyData = await prisma.formativeAssessment.findMany({
                where: { schoolId, archived: false },
                select: { learningArea: true, overallRating: true }
            });

            const subjPerfMap: Record<string, { ee: number, me: number, be: number, total: number }> = {};
            subjectProficiencyData.forEach(a => {
                const area = a.learningArea;
                if (!subjPerfMap[area]) subjPerfMap[area] = { ee: 0, me: 0, be: 0, total: 0 };
                subjPerfMap[area].total++;
                if (a.overallRating === 'EE') subjPerfMap[area].ee++;
                else if (a.overallRating === 'ME' || a.overallRating === 'AE') subjPerfMap[area].me++;
                else if (a.overallRating === 'BE') subjPerfMap[area].be++;
            });

            const subjectProficiency = Object.entries(subjPerfMap).map(([area, data]) => ({
                area,
                ee: data.total > 0 ? Math.round((data.ee / data.total) * 100) : 0,
                me: data.total > 0 ? Math.round((data.me / data.total) * 100) : 0,
                be: data.total > 0 ? Math.round((data.be / data.total) * 100) : 0
            })).slice(0, 4);

            // 9. Upcoming Events
            const upcomingEventsData = await prisma.event.findMany({
                where: { schoolId, startDate: { gte: new Date() } },
                orderBy: { startDate: 'asc' },
                take: 5,
                include: { creator: { select: { role: true } } }
            });

            const upcomingEvents = upcomingEventsData.map(evt => ({
                title: evt.title,
                date: evt.startDate,
                category: evt.type,
                responsible: evt.creator?.role?.replace('_', ' ') || 'Staff'
            }));

            res.json({
                success: true,
                data: {
                    stats: {
                        totalStudents: studentCount,
                        activeStudents,
                        totalTeachers: teacherCount,
                        activeTeachers,
                        totalClasses: classCount,
                        presentToday: attendanceMap.PRESENT,
                        absentToday: attendanceMap.ABSENT,
                        lateToday: attendanceMap.LATE,
                        avgAttendance: parseFloat(avgAttendance.toFixed(1)),
                        feeCollected,
                        feePending,
                        studentTrend,
                        teacherTrend,
                        totalPendingAssessments: await prisma.formativeAssessment.count({ where: { schoolId, status: 'DRAFT', archived: false } }),
                        performance: { ee: 0, me: 0, ae: 0, be: 0 }
                    },
                    distributions: {
                        studentsByGrade: gradeDistribution,
                        staff: staffDistribution,
                        subjectProficiency
                    },
                    financials: {
                        streamBreakdown
                    },
                    recentActivity: {
                        admissions: latestAdmissions,
                        assessments: latestAssessments
                    },
                    topPerformingClasses,
                    upcomingEvents
                }
            });

        } catch (error: any) {
            console.error('Admin Dashboard Error:', error);
            res.status(500).json({ success: false, error: error.message || 'Failed to fetch dashboard metrics' });
        }
    }

    /**
     * Get metrics for Teacher Dashboard
     * GET /api/dashboard/teacher
     */
    async getTeacherMetrics(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.userId;
            const schoolId = req.user?.schoolId;

            if (!userId || !schoolId) {
                throw new ApiError(400, 'User ID and School ID are required');
            }

            const { filter = 'today' } = req.query;

            // 1. My Classes
            const myClasses = await prisma.class.findMany({
                where: { teacherId: userId, archived: false },
                include: {
                    _count: { select: { enrollments: true } }
                }
            });

            const totalMyStudents = myClasses.reduce((sum, cls) => sum + cls._count.enrollments, 0);

            // 2. Schedule (Simulated from assigned classes)
            const schedule = myClasses.map(cls => ({
                id: cls.id,
                grade: cls.name,
                subject: 'Standard CBC',
                time: '8:00 AM',
                room: cls.room || 'N/A',
                status: 'upcoming'
            }));

            // 3. Pending Tasks (Ungraded assessments)
            const pendingAssessments = await prisma.formativeAssessment.count({
                where: { teacherId: userId, status: 'DRAFT' }
            });

            // 4. Recent Activity (Recent assessments created by this teacher)
            const recentActivityRaw = await prisma.formativeAssessment.findMany({
                where: { teacherId: userId },
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: {
                    id: true,
                    title: true,
                    learningArea: true,
                    createdAt: true
                }
            });

            const recentActivity = recentActivityRaw.map(act => ({
                id: act.id,
                text: `${act.title} created for ${act.learningArea}`,
                time: act.createdAt,
                type: 'assessment'
            }));

            res.json({
                success: true,
                data: {
                    stats: {
                        myStudents: totalMyStudents,
                        myClasses: myClasses.length,
                        pendingTasks: pendingAssessments,
                        messages: 0,
                        analytics: {
                            attendance: 94,
                            graded: pendingAssessments === 0 ? 100 : Math.round(((totalMyStudents - pendingAssessments) / totalMyStudents) * 100),
                            completion: 75,
                            engagement: 90
                        }
                    },
                    schedule,
                    recentActivity
                }
            });

        } catch (error: any) {
            console.error('Teacher Dashboard Error:', error);
            res.status(500).json({ success: false, error: error.message || 'Failed to fetch teacher dashboard metrics' });
        }
    }

    /**
     * Get metrics for Parent Dashboard
     * GET /api/dashboard/parent
     */
    async getParentMetrics(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                throw new ApiError(400, 'User ID is required');
            }

            // 1. Get Children
            const children = await prisma.learner.findMany({
                where: { parentId: userId, archived: false },
                include: {
                    feeInvoices: {
                        where: { archived: false },
                        select: { balance: true, totalAmount: true }
                    },
                    formativeAssessments: {
                        where: { archived: false },
                        orderBy: { createdAt: 'desc' },
                        take: 5
                    },
                    attendances: {
                        where: { archived: false },
                        orderBy: { date: 'desc' },
                        take: 30
                    }
                }
            });

            const processedChildren = children.map(child => {
                const totalBalance = child.feeInvoices.reduce((sum, inv) => sum + (Number(inv.balance) || 0), 0);
                const attendanceRate = child.attendances.length > 0
                    ? (child.attendances.filter(a => a.status === 'PRESENT').length / child.attendances.length) * 100
                    : 100;

                return {
                    id: child.id,
                    name: `${child.firstName} ${child.lastName}`,
                    grade: child.grade.replace('_', ' '),
                    admissionNumber: child.admissionNumber,
                    performanceLevel: 'ME', // Logic to determine overall level could be added here
                    overallPerformance: 'Good',
                    attendanceRate: Math.round(attendanceRate),
                    feeBalance: totalBalance,
                    recentAssessments: child.formativeAssessments.map(a => ({
                        date: a.createdAt,
                        subject: a.learningArea,
                        type: a.type,
                        grade: a.overallRating
                    }))
                };
            });

            res.json({
                success: true,
                data: {
                    children: processedChildren,
                    stats: {
                        totalBalance: processedChildren.reduce((sum, c) => sum + c.feeBalance, 0),
                        avgAttendance: processedChildren.length > 0
                            ? Math.round(processedChildren.reduce((sum, c) => sum + c.attendanceRate, 0) / processedChildren.length)
                            : 100,
                        bulletins: 0 // Fetch from communication service in future
                    }
                }
            });

        } catch (error: any) {
            console.error('Parent Dashboard Error:', error);
            res.status(500).json({ success: false, error: error.message || 'Failed to fetch parent dashboard metrics' });
        }
    }

    private getDateFilter(filter: string) {
        const date = new Date();
        date.setHours(0, 0, 0, 0);

        switch (filter) {
            case 'week':
                const diff = date.getDate() - date.getDay();
                return { gte: new Date(date.setDate(diff)) };
            case 'month':
                return { gte: new Date(date.getFullYear(), date.getMonth(), 1) };
            case 'term':
                // Assuming Jan-Apr, May-Aug, Sep-Dec terms for now
                const month = date.getMonth();
                const termStartMonth = month < 4 ? 0 : month < 8 ? 4 : 8;
                return { gte: new Date(date.getFullYear(), termStartMonth, 1) };
            default: // today
                return date;
        }
    }

    private getPreviousDateFilter(filter: string) {
        const date = new Date();
        date.setHours(0, 0, 0, 0);

        switch (filter) {
            case 'week':
                const weekStart = date.getDate() - date.getDay();
                const prevWeekStart = new Date(date.setDate(weekStart - 7));
                const prevWeekEnd = new Date(date.setDate(weekStart - 1));
                return { gte: prevWeekStart, lte: prevWeekEnd };
            case 'month':
                const prevMonthStart = new Date(date.getFullYear(), date.getMonth() - 1, 1);
                const prevMonthEnd = new Date(date.getFullYear(), date.getMonth(), 0);
                return { gte: prevMonthStart, lte: prevMonthEnd };
            case 'term':
                // Assuming 4-month terms
                const termStart = new Date(date.getFullYear(), Math.floor(date.getMonth() / 4) * 4, 1);
                const prevTermStart = new Date(termStart.getFullYear(), termStart.getMonth() - 4, 1);
                const prevTermEnd = new Date(termStart.getFullYear(), termStart.getMonth(), 0);
                return { gte: prevTermStart, lte: prevTermEnd };
            default: // yesterday
                const yesterday = new Date(date.setDate(date.getDate() - 1));
                const yesterdayEnd = new Date(date.setDate(date.getDate()));
                yesterdayEnd.setMilliseconds(-1);
                return { gte: yesterday, lte: yesterdayEnd };
        }
    }

    private calculateTrend(current: number, previous: number) {
        if (previous === 0) return current > 0 ? '+100%' : '0%';
        const diff = ((current - previous) / previous) * 100;
        return (diff >= 0 ? '+' : '') + diff.toFixed(1) + '%';
    }

    private getGradeColor(grade: string): string {
        const colors: Record<string, string> = {
            'PP1': '#3b82f6',
            'PP2': '#10b981',
            'GRADE_1': '#8b5cf6',
            'GRADE_2': '#f59e0b',
            'GRADE_3': '#ef4444'
        };
        return colors[grade] || '#6b7280';
    }

    private getRoleColor(role: string): string {
        const colors: Record<string, string> = {
            'TEACHER': '#3b82f6',
            'ADMIN': '#8b5cf6',
            'ACCOUNTANT': '#06b6d4'
        };
        return colors[role] || '#6b7280';
    }
}
