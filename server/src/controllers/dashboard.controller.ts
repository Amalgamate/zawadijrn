import { Request, Response } from 'express';
import prisma from '../config/database';
import { ApiError } from '../utils/error.util';
import { AuthRequest } from '../middleware/permissions.middleware';
import { redisCacheService } from '../services/redis-cache.service';

// ─── TTL constants ────────────────────────────────────────────────────────────
const ADMIN_CACHE_TTL  = 120; // 2 minutes — stats don't need real-time precision
const TEACHER_CACHE_TTL = 60; // 1 minute
const PARENT_CACHE_TTL  = 60; // 1 minute

export class DashboardController {
    /**
     * Get metrics for Admin Dashboard
     * GET /api/dashboard/admin
     */
    async getAdminMetrics(req: AuthRequest, res: Response) {
        try {
            const { filter = 'today' } = req.query;
            const cacheKey = `dashboard:admin:${filter}`;

            // ── Serve from cache if fresh ──────────────────────────────────────
            const cached = await redisCacheService.get<any>(cacheKey);
            if (cached) {
                return res.json({ success: true, data: cached, _cached: true });
            }

            const dateFilter = this.getDateFilter(filter as string);
            const prevDateFilter = this.getPreviousDateFilter(filter as string);

            // ── 1. All cheap count queries in one Promise.all ─────────────────
            const [
                studentCount,
                teacherCount,
                classCount,
                prevStudentCount,
                prevTeacherCount,
                activeStudents,
                activeTeachers,
                attendanceSummary,
                studentsByGradeData,
                staffByRole,
                latestAdmissions,
                latestFormative,
                latestSummative,
                upcomingEventsData,
                pendingDraftCount,
                genderDistribution,
            ] = await Promise.all([
                prisma.learner.count({ where: { archived: false } }),
                prisma.user.count({ where: { role: 'TEACHER', archived: false } }),
                prisma.class.count({ where: { archived: false } }),
                prisma.learner.count({ where: { archived: false, createdAt: prevDateFilter } }),
                prisma.user.count({ where: { role: 'TEACHER', archived: false, createdAt: prevDateFilter } }),
                prisma.learner.count({ where: { status: 'ACTIVE', archived: false } }),
                prisma.user.count({ where: { role: 'TEACHER', status: 'ACTIVE', archived: false } }),
                prisma.attendance.groupBy({ by: ['status'], where: { date: dateFilter }, _count: true }),
                prisma.learner.groupBy({ by: ['grade'], where: { archived: false }, _count: true }),
                prisma.user.groupBy({ by: ['role'], where: { archived: false }, _count: true }),
                prisma.learner.findMany({
                    orderBy: { createdAt: 'desc' }, take: 5,
                    select: { firstName: true, lastName: true, admissionNumber: true, grade: true, createdAt: true }
                }),
                prisma.formativeAssessment.findMany({
                    orderBy: { createdAt: 'desc' }, take: 5,
                    select: { title: true, learningArea: true, learner: { select: { firstName: true, lastName: true } }, createdAt: true }
                }),
                prisma.summativeResult.findMany({
                   orderBy: { createdAt: 'desc' }, take: 5,
                   select: { marksObtained: true, test: { select: { title: true, learningArea: true } }, learner: { select: { firstName: true, lastName: true } }, createdAt: true }
                }),
                (async () => {
                    try {
                        return await prisma.event.findMany({
                            where: { startDate: { gte: new Date() } }, orderBy: { startDate: 'asc' }, take: 5,
                            include: { creator: { select: { role: true } } }
                        });
                    } catch (error: any) {
                        // Temporary safety for live DBs still on legacy events column naming.
                        if (error?.code === 'P2022' && String(error?.message || '').includes('events.allDay')) {
                            console.warn('[Dashboard] events.allDay missing in DB, returning empty upcoming events until migration applies.');
                            return [];
                        }
                        throw error;
                    }
                })(),
                prisma.formativeAssessment.count({ where: { status: 'DRAFT', archived: false } }),
                prisma.learner.groupBy({ by: ['gender'], where: { archived: false }, _count: true }),
            ]);

            // ── 1.5 Calculate Assessed Classes & Missed Exams ──────────────
            const latestTest = await prisma.summativeTest.findFirst({
                where: { archived: false, academicYear: 2026, term: 'TERM_1' }, // Hardcoded for current context per requirements
                orderBy: { createdAt: 'desc' },
                select: { testType: true, term: true, academicYear: true }
            });

            let totalMissedExams = 0;
            let currentTestSeries = 'CURRENT SERIES';
            let unAssessedBreakdown: any[] = [];

            if (latestTest && latestTest.testType) {
                currentTestSeries = `${latestTest.testType} ${latestTest.term}`.replace('_', ' ');
                const testsInSeries = await prisma.summativeTest.findMany({
                    where: { 
                        testType: latestTest.testType, 
                        term: latestTest.term, 
                        academicYear: latestTest.academicYear, 
                        archived: false 
                    },
                    select: { id: true, grade: true }
                });

                if (testsInSeries.length > 0) {
                    const testIds = testsInSeries.map(t => t.id);
                    const grades = [...new Set(testsInSeries.map(t => t.grade))];
                    
                    // Find students in these grades who have NO results for ANY test in this series
                    const studentsAffected = await prisma.learner.findMany({
                        where: {
                            status: 'ACTIVE',
                            archived: false,
                            grade: { in: grades as any }
                        },
                        select: { id: true, grade: true }
                    });

                    const studentsWithSomeResults = await prisma.summativeResult.findMany({
                        where: {
                            testId: { in: testIds },
                            archived: false
                        },
                        select: { learnerId: true },
                        distinct: ['learnerId']
                    });

                    const resultsSet = new Set(studentsWithSomeResults.map(r => r.learnerId));
                    totalMissedExams = studentsAffected.filter(s => !resultsSet.has(s.id)).length;

                    // Group by grade for the detailed view
                    unAssessedBreakdown = grades.map(grade => {
                        const studentsInGrade = studentsAffected.filter(s => s.grade === grade);
                        const unAssessedInGrade = studentsInGrade.filter(s => !resultsSet.has(s.id)).length;
                        return {
                            grade: (grade as string).replace('_', ' '),
                            total: studentsInGrade.length,
                            unAssessed: unAssessedInGrade,
                            assessed: studentsInGrade.length - unAssessedInGrade
                        };
                    }).filter(b => b.total > 0);
                }
            }

            const assessedGradesStreams = await prisma.learner.findMany({
                where: {
                    archived: false,
                    OR: [
                        { summativeResults: { some: { archived: false } } },
                        { formativeAssessments: { some: { archived: false } } }
                    ]
                },
                select: { grade: true, stream: true },
                distinct: ['grade', 'stream']
            });

            const assessedClassCount = assessedGradesStreams.length > 0
                ? await prisma.class.count({
                    where: {
                        archived: false,
                        OR: assessedGradesStreams.map(gs => ({
                            grade: gs.grade,
                            stream: gs.stream
                        }))
                    }
                })
                : 0;

            // Combine both formative and summative for "latest assessments" activity
            const latestAssessments = [...latestFormative.map(f => ({ ...f, type: 'FORMATIVE' })), ...latestSummative.map(s => ({ title: s.test.title, learningArea: s.test.learningArea, learner: s.learner, createdAt: s.createdAt, type: 'SUMMATIVE' }))]
                .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5);

            // ── 2. Financial summary — use aggregates, NOT a full table scan ──
            const [feeAgg, feeByGrade, summativeByGrade, subjectRatings] = await Promise.all([
                // Total collected + balance using DB aggregates (no row fetch)
                prisma.feeInvoice.aggregate({
                    where: { archived: false },
                    _sum: { paidAmount: true, balance: true },
                }),
                // Per-feeStructure breakdown — only what we need
                prisma.feeInvoice.groupBy({
                    by: ['feeStructureId'],
                    where: { archived: false },
                    _sum: { totalAmount: true, paidAmount: true, balance: true },
                }),
                // Summative averages per grade
                prisma.summativeResult.groupBy({
                    by: ['testId'],
                    where: { archived: false },
                    _avg: { percentage: true },
                    _count: true,
                }),
                // Formative rating distribution
                prisma.formativeAssessment.groupBy({
                    by: ['learningArea', 'overallRating'],
                    where: { archived: false },
                    _count: true,
                }),
            ]);

            // ── Resolve feeStructureId → name for stream breakdown ─────────────
            const feeStructureIds = feeByGrade.map(r => r.feeStructureId);
            const feeStructures = feeStructureIds.length
                ? await prisma.feeStructure.findMany({
                    where: { id: { in: feeStructureIds } },
                    select: { id: true, name: true, grade: true },
                  })
                : [];
            const feeStructureMap = new Map(feeStructures.map(fs => [fs.id, fs]));

            const streamBreakdown = feeByGrade
                .map(row => {
                    const fs = feeStructureMap.get(row.feeStructureId);
                    if (!fs) return null;
                    const target    = Number(row._sum.totalAmount || 0);
                    const collected = Number(row._sum.paidAmount  || 0);
                    const bal       = Number(row._sum.balance     || 0);
                    return {
                        name:      fs.name || fs.grade?.replace('_', ' ') || 'General',
                        target,
                        collected,
                        bal,
                    };
                })
                .filter(Boolean)
                .sort((a: any, b: any) => b.bal - a.bal); // highest risk first

            // ── Derive top performing classes (from groupBy, no full scan) ────
            const testIds = summativeByGrade.map(r => r.testId);
            const testGrades = testIds.length
                ? await prisma.summativeTest.findMany({
                    where: { id: { in: testIds } },
                    select: { id: true, grade: true },
                  })
                : [];
            const gradeMap = new Map(testGrades.map(t => [t.id, t.grade]));

            const classPerfMap: Record<string, { total: number; count: number }> = {};
            summativeByGrade.forEach(r => {
                const grade = gradeMap.get(r.testId) || 'UNKNOWN';
                if (!classPerfMap[grade]) classPerfMap[grade] = { total: 0, count: 0 };
                classPerfMap[grade].total += (r._avg.percentage || 0) * r._count;
                classPerfMap[grade].count += r._count;
            });

            const topPerformingClasses = Object.entries(classPerfMap)
                .map(([grade, d]) => {
                    const avg = d.count > 0 ? d.total / d.count : 0;
                    return { grade: grade.replace('_', ' '), avg: parseFloat(avg.toFixed(1)), label: avg > 80 ? 'Exceeding' : avg > 60 ? 'Meeting' : 'Approaching' };
                })
                .sort((a, b) => b.avg - a.avg)
                .slice(0, 5);

            // ── Subject proficiency from groupBy ──────────────────────────────
            const subjPerfMap: Record<string, { ee: number; me: number; be: number; total: number }> = {};
            subjectRatings.forEach(r => {
                const area = r.learningArea;
                if (!subjPerfMap[area]) subjPerfMap[area] = { ee: 0, me: 0, be: 0, total: 0 };
                subjPerfMap[area].total += r._count;
                if (r.overallRating === 'EE') subjPerfMap[area].ee += r._count;
                else if (r.overallRating === 'ME' || r.overallRating === 'AE') subjPerfMap[area].me += r._count;
                else if (r.overallRating === 'BE') subjPerfMap[area].be += r._count;
            });
            const subjectProficiency = Object.entries(subjPerfMap)
                .map(([area, d]) => ({
                    area,
                    ee: d.total > 0 ? Math.round((d.ee / d.total) * 100) : 0,
                    me: d.total > 0 ? Math.round((d.me / d.total) * 100) : 0,
                    be: d.total > 0 ? Math.round((d.be / d.total) * 100) : 0,
                }))
                .slice(0, 4);

            // ── Attendance map ────────────────────────────────────────────────
            const attendanceMap: Record<string, number> = { PRESENT: 0, ABSENT: 0, LATE: 0 };
            attendanceSummary.forEach(item => { attendanceMap[item.status] = item._count; });
            const avgAttendance = studentCount > 0 ? (attendanceMap.PRESENT / studentCount) * 100 : 0;

            // ── Distributions ─────────────────────────────────────────────────
            const gradeDistribution = studentsByGradeData.map(item => ({
                label: item.grade.replace('_', ' '), value: item._count, color: this.getGradeColor(item.grade),
            }));
            const staffDistribution = staffByRole.map(item => ({
                label: item.role.replace('_', ' '), value: item._count, color: this.getRoleColor(item.role),
            }));

            // ── Financials ────────────────────────────────────────────────────
            const feeCollected = Number(feeAgg._sum.paidAmount || 0);
            const feePending   = Number(feeAgg._sum.balance   || 0);

            const upcomingEvents = upcomingEventsData.map(evt => ({
                title: evt.title, date: evt.startDate, category: evt.type,
                responsible: evt.creator?.role?.replace('_', ' ') || 'Staff',
            }));

            const payload = {
                stats: {
                    totalStudents: studentCount, activeStudents,
                    totalTeachers: teacherCount, activeTeachers,
                    totalClasses: classCount,
                    totalAssessedClasses: assessedClassCount,
                    totalMissedExams,
                    currentTestSeries,
                    presentToday: attendanceMap.PRESENT, absentToday: attendanceMap.ABSENT, lateToday: attendanceMap.LATE,
                    avgAttendance: parseFloat(avgAttendance.toFixed(1)),
                    feeCollected, feePending,
                    studentTrend: this.calculateTrend(studentCount, prevStudentCount),
                    teacherTrend: this.calculateTrend(teacherCount, prevTeacherCount),
                    males: genderDistribution.find((g: any) => g.gender === 'MALE')?._count || 0,
                    females: genderDistribution.find((g: any) => g.gender === 'FEMALE')?._count || 0,
                    totalPendingAssessments: pendingDraftCount,
                    performance: { ee: 0, me: 0, ae: 0, be: 0 },
                },
                unAssessedBreakdown,
                distributions: { studentsByGrade: gradeDistribution, staff: staffDistribution, subjectProficiency },
                financials: { streamBreakdown },
                recentActivity: { admissions: latestAdmissions, assessments: latestAssessments },
                topPerformingClasses,
                upcomingEvents,
            };

            await redisCacheService.set(cacheKey, payload, ADMIN_CACHE_TTL);
            res.json({ success: true, data: payload });

        } catch (error: any) {
            console.error('Admin Dashboard Error:', error);
            throw new ApiError(500, error.message || 'Failed to fetch dashboard metrics');
        }
    }

    /**
     * Get metrics for Teacher Dashboard
     * GET /api/dashboard/teacher
     */
    async getTeacherMetrics(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) throw new ApiError(400, 'User ID is required');

            const cacheKey = `dashboard:teacher:${userId}`;
            const cached = await redisCacheService.get<any>(cacheKey);
            if (cached) return res.json({ success: true, data: cached, _cached: true });

            const [myClasses, pendingAssessments, recentActivityRaw] = await Promise.all([
                prisma.class.findMany({
                    where: { teacherId: userId, archived: false },
                    include: { _count: { select: { enrollments: true } } },
                }),
                prisma.formativeAssessment.count({ where: { teacherId: userId, status: 'DRAFT' } }),
                prisma.formativeAssessment.findMany({
                    where: { teacherId: userId },
                    orderBy: { createdAt: 'desc' }, take: 10,
                    select: { id: true, title: true, learningArea: true, createdAt: true },
                }),
            ]);

            const totalMyStudents = myClasses.reduce((sum, cls) => sum + cls._count.enrollments, 0);
            const schedule = myClasses.map(cls => ({
                id: cls.id, grade: cls.name, subject: 'Standard CBC',
                time: '8:00 AM', room: cls.room || 'N/A', status: 'upcoming',
            }));
            const recentActivity = recentActivityRaw.map(act => ({
                id: act.id, text: `${act.title} created for ${act.learningArea}`, time: act.createdAt, type: 'assessment',
            }));

            const payload = {
                stats: {
                    myStudents: totalMyStudents, myClasses: myClasses.length,
                    pendingTasks: pendingAssessments, messages: 0,
                    analytics: {
                        attendance: 94,
                        graded: pendingAssessments === 0 ? 100 : Math.round(((totalMyStudents - pendingAssessments) / totalMyStudents) * 100),
                        completion: 75, engagement: 90,
                    },
                },
                schedule, recentActivity,
            };

            await redisCacheService.set(cacheKey, payload, TEACHER_CACHE_TTL);
            res.json({ success: true, data: payload });

        } catch (error: any) {
            console.error('Teacher Dashboard Error:', error);
            throw new ApiError(500, error.message || 'Failed to fetch teacher dashboard metrics');
        }
    }

    /**
     * Get metrics for Parent Dashboard
     * GET /api/dashboard/parent
     */
    async getParentMetrics(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) throw new ApiError(400, 'User ID is required');

            const cacheKey = `dashboard:parent:${userId}`;
            const cached = await redisCacheService.get<any>(cacheKey);
            if (cached) return res.json({ success: true, data: cached, _cached: true });

            const children = await prisma.learner.findMany({
                where: { parentId: userId, archived: false },
                include: {
                    feeInvoices: {
                        where: { archived: false },
                        select: { balance: true, totalAmount: true },
                    },
                    formativeAssessments: {
                        where: { archived: false },
                        orderBy: { createdAt: 'desc' }, take: 5,
                    },
                    attendances: {
                        where: { archived: false },
                        orderBy: { date: 'desc' }, take: 30,
                    },
                },
            });

            const processedChildren = children.map(child => {
                const totalBalance = child.feeInvoices.reduce((sum, inv) => sum + (Number(inv.balance) || 0), 0);
                const attendanceRate = child.attendances.length > 0
                    ? (child.attendances.filter(a => a.status === 'PRESENT').length / child.attendances.length) * 100
                    : 100;
                return {
                    id: child.id, name: `${child.firstName} ${child.lastName}`,
                    grade: child.grade.replace('_', ' '), admissionNumber: child.admissionNumber,
                    performanceLevel: 'ME', overallPerformance: 'Good',
                    attendanceRate: Math.round(attendanceRate), feeBalance: totalBalance,
                    recentAssessments: child.formativeAssessments.map(a => ({
                        date: a.createdAt, subject: a.learningArea, type: a.type, grade: a.overallRating,
                    })),
                };
            });

            const payload = {
                children: processedChildren,
                stats: {
                    totalBalance: processedChildren.reduce((sum, c) => sum + c.feeBalance, 0),
                    avgAttendance: processedChildren.length > 0
                        ? Math.round(processedChildren.reduce((sum, c) => sum + c.attendanceRate, 0) / processedChildren.length)
                        : 100,
                    bulletins: 0,
                },
            };

            await redisCacheService.set(cacheKey, payload, PARENT_CACHE_TTL);
            res.json({ success: true, data: payload });

        } catch (error: any) {
            console.error('Parent Dashboard Error:', error);
            throw new ApiError(500, error.message || 'Failed to fetch parent dashboard metrics');
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private getDateFilter(filter: string) {
        const date = new Date(); date.setHours(0, 0, 0, 0);
        switch (filter) {
            case 'week': { const diff = date.getDate() - date.getDay(); return { gte: new Date(date.setDate(diff)) }; }
            case 'month': return { gte: new Date(date.getFullYear(), date.getMonth(), 1) };
            case 'term': { const m = date.getMonth(); const s = m < 4 ? 0 : m < 8 ? 4 : 8; return { gte: new Date(date.getFullYear(), s, 1) }; }
            default: return date;
        }
    }

    private getPreviousDateFilter(filter: string) {
        const date = new Date(); date.setHours(0, 0, 0, 0);
        switch (filter) {
            case 'week': { const ws = date.getDate() - date.getDay(); return { gte: new Date(date.setDate(ws - 7)), lte: new Date(date.setDate(ws - 1)) }; }
            case 'month': return { gte: new Date(date.getFullYear(), date.getMonth() - 1, 1), lte: new Date(date.getFullYear(), date.getMonth(), 0) };
            case 'term': { const ts = new Date(date.getFullYear(), Math.floor(date.getMonth() / 4) * 4, 1); return { gte: new Date(ts.getFullYear(), ts.getMonth() - 4, 1), lte: new Date(ts.getFullYear(), ts.getMonth(), 0) }; }
            default: { const y = new Date(date.setDate(date.getDate() - 1)); const ye = new Date(date.setDate(date.getDate())); ye.setMilliseconds(-1); return { gte: y, lte: ye }; }
        }
    }

    private calculateTrend(current: number, previous: number) {
        if (previous === 0) return current > 0 ? '+100%' : '0%';
        const diff = ((current - previous) / previous) * 100;
        return (diff >= 0 ? '+' : '') + diff.toFixed(1) + '%';
    }

    private getGradeColor(grade: string): string {
        const colors: Record<string, string> = { PP1: '#3b82f6', PP2: '#10b981', GRADE_1: '#8b5cf6', GRADE_2: '#f59e0b', GRADE_3: '#ef4444' };
        return colors[grade] || '#6b7280';
    }

    private getRoleColor(role: string): string {
        const colors: Record<string, string> = { TEACHER: '#3b82f6', ADMIN: '#8b5cf6', ACCOUNTANT: '#06b6d4' };
        return colors[role] || '#6b7280';
    }
}
