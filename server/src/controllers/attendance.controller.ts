/**
 * Attendance Controller
 * Handles attendance marking and reporting
 * 
 * @module controllers/attendance.controller
 */

import { Response } from 'express';
import prisma from '../config/database';
import { ApiError } from '../utils/error.util';
import { AuthRequest } from '../middleware/permissions.middleware';
import { AttendanceStatus } from '@prisma/client';

export class AttendanceController {
  private async getTeacherAssignedClassIds(userId: string, schoolId?: string): Promise<string[]> {
    const assignedClasses = await prisma.class.findMany({
      where: {
        teacherId: userId,
        active: true,
        archived: false,
        ...(schoolId ? { schoolId } : {}),
      },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    return assignedClasses.map((classItem) => classItem.id);
  }

  private async ensureTeacherClassScope(userId: string, role: string, schoolId?: string): Promise<string[]> {
    if (role !== 'TEACHER') return [];

    const assignedClassIds = await this.getTeacherAssignedClassIds(userId, schoolId);
    if (assignedClassIds.length === 0) {
      throw new ApiError(403, 'You are not assigned as class teacher to any active class');
    }

    return assignedClassIds;
  }

  /**
   * Mark attendance for a single learner
   * Access: SUPER_ADMIN, ADMIN, HEAD_TEACHER, TEACHER
   */
  async markAttendance(req: AuthRequest, res: Response) {
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;
    const currentSchoolId = req.user!.schoolId;
    const { learnerId, date, status, classId, remarks } = req.body;

    if (!learnerId || !date || !status) {
      throw new ApiError(400, 'Missing required fields: learnerId, date, status');
    }

    // Check if learner exists
    const learner = await prisma.learner.findUnique({ where: { id: learnerId } });
    if (!learner) {
      throw new ApiError(404, 'Learner not found');
    }

    // Parse date
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    let resolvedClassId: string | undefined = classId;
    if (currentUserRole === 'TEACHER') {
      const assignedClassIds = await this.ensureTeacherClassScope(currentUserId, currentUserRole, currentSchoolId);

      if (!resolvedClassId) {
        resolvedClassId = assignedClassIds[0];
      }

      if (!assignedClassIds.includes(resolvedClassId)) {
        throw new ApiError(403, 'You can only mark attendance for your assigned class');
      }

      const learnerEnrollment = await prisma.classEnrollment.findFirst({
        where: {
          classId: resolvedClassId,
          learnerId,
          active: true,
        },
        select: { id: true },
      });

      if (!learnerEnrollment) {
        throw new ApiError(403, 'You can only mark attendance for learners in your assigned class');
      }
    }

    // Check if attendance already marked for this date
    const existing = await prisma.attendance.findUnique({
      where: {
        learnerId_date: {
          learnerId,
          date: attendanceDate,
        },
      },
    });

    if (existing) {
      // Update existing attendance
      const updated = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          status: status as AttendanceStatus,
          classId: resolvedClassId || existing.classId,
          remarks,
          markedBy: currentUserId,
          schoolId: currentSchoolId || existing.schoolId || learner.schoolId,
          markedAt: new Date(),
        },
        include: {
          learner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              admissionNumber: true,
            },
          },
        },
      });

      return res.json({
        success: true,
        data: updated,
        message: 'Attendance updated successfully',
      });
    }

    // Create new attendance record
    const attendance = await prisma.attendance.create({
      data: {
        learnerId,
        date: attendanceDate,
        status: status as AttendanceStatus,
        classId: resolvedClassId,
        schoolId: currentSchoolId || learner.schoolId,
        remarks,
        markedBy: currentUserId,
      },
      include: {
        learner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNumber: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      data: attendance,
      message: 'Attendance marked successfully',
    });
  }

  /**
   * Mark attendance for multiple learners (bulk)
   * Access: SUPER_ADMIN, ADMIN, HEAD_TEACHER, TEACHER
   */
  async markBulkAttendance(req: AuthRequest, res: Response) {
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;
    const currentSchoolId = req.user!.schoolId;
    const { attendanceRecords, attendance, date, classId } = req.body;
    const records = Array.isArray(attendanceRecords) ? attendanceRecords : attendance;

    if (!records || !Array.isArray(records) || !date) {
      throw new ApiError(400, 'Missing required fields: attendanceRecords (array), date');
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    let resolvedClassId: string | undefined = classId;
    let teacherClassIds: string[] = [];
    if (currentUserRole === 'TEACHER') {
      teacherClassIds = await this.ensureTeacherClassScope(currentUserId, currentUserRole, currentSchoolId);

      if (!resolvedClassId) {
        resolvedClassId = teacherClassIds[0];
      }

      if (!teacherClassIds.includes(resolvedClassId)) {
        throw new ApiError(403, 'You can only mark attendance for your assigned class');
      }

      const learnerIds = [...new Set(records.map((record: any) => record?.learnerId).filter(Boolean))];
      if (learnerIds.length === 0) {
        throw new ApiError(400, 'No valid learners provided in attendanceRecords');
      }

      const enrolledLearners = await prisma.classEnrollment.findMany({
        where: {
          classId: resolvedClassId,
          active: true,
          learnerId: { in: learnerIds },
        },
        select: { learnerId: true },
      });

      const enrolledSet = new Set(enrolledLearners.map((item) => item.learnerId));
      const invalidLearners = learnerIds.filter((learnerId: string) => !enrolledSet.has(learnerId));

      if (invalidLearners.length > 0) {
        throw new ApiError(403, 'Some learners do not belong to your assigned class');
      }
    }

    const results = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: [] as any[],
    };

    // Process each attendance record
    for (const record of records) {
      try {
        const { learnerId, status, remarks } = record;

        if (!learnerId || !status) {
          results.failed++;
          results.errors.push({ learnerId, error: 'Missing learnerId or status' });
          continue;
        }

        // Check if already exists
        const existing = await prisma.attendance.findUnique({
          where: {
            learnerId_date: {
              learnerId,
              date: attendanceDate,
            },
          },
        });

        if (existing) {
          // Update
          await prisma.attendance.update({
            where: { id: existing.id },
            data: {
              status: status as AttendanceStatus,
              classId: resolvedClassId || existing.classId,
              remarks,
              schoolId: currentSchoolId || existing.schoolId,
              markedBy: currentUserId,
              markedAt: new Date(),
            },
          });
          results.updated++;
        } else {
          // Create
          await prisma.attendance.create({
            data: {
              learnerId,
              date: attendanceDate,
              status: status as AttendanceStatus,
              classId: resolvedClassId,
              schoolId: currentSchoolId,
              remarks,
              markedBy: currentUserId,
            },
          });
          results.created++;
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push({ learnerId: record.learnerId, error: error.message });
      }
    }

    res.json({
      success: true,
      data: results,
      message: `Attendance marked: ${results.created} created, ${results.updated} updated, ${results.failed} failed`,
    });
  }

  /**
   * Get attendance records
   * Access: SUPER_ADMIN, ADMIN, HEAD_TEACHER, TEACHER
   */
  async getAttendance(req: AuthRequest, res: Response) {
    const { date, startDate, endDate, learnerId, classId, status } = req.query;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;
    const currentSchoolId = req.user!.schoolId;

    const whereClause: any = {};

    if (currentSchoolId) {
      whereClause.schoolId = currentSchoolId;
    }

    if (currentUserRole === 'TEACHER') {
      const assignedClassIds = await this.ensureTeacherClassScope(currentUserId, currentUserRole, currentSchoolId);
      const requestedClassId = typeof classId === 'string' ? classId : undefined;

      if (requestedClassId && !assignedClassIds.includes(requestedClassId)) {
        throw new ApiError(403, 'You can only view attendance for your assigned class');
      }

      whereClause.classId = requestedClassId || { in: assignedClassIds };
    }

    if (date) {
      const queryDate = new Date(date as string);
      queryDate.setHours(0, 0, 0, 0);
      whereClause.date = queryDate;
    }

    if (startDate && endDate) {
      const start = new Date(startDate as string);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      whereClause.date = {
        gte: start,
        lte: end,
      };
    }

    if (learnerId) whereClause.learnerId = learnerId;
    if (classId && currentUserRole !== 'TEACHER') whereClause.classId = classId;
    if (status) whereClause.status = status as AttendanceStatus;

    const attendance = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        learner: {
          select: {
            id: true,
            admissionNumber: true,
            firstName: true,
            lastName: true,
            grade: true,
            stream: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { date: 'desc' },
        { learner: { lastName: 'asc' } },
      ],
    });

    res.json({
      success: true,
      data: attendance,
      count: attendance.length,
    });
  }

  /**
   * Get attendance statistics
   * Access: SUPER_ADMIN, ADMIN, HEAD_TEACHER, TEACHER
   */
  async getAttendanceStats(req: AuthRequest, res: Response) {
    const { startDate, endDate, classId, learnerId } = req.query;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;
    const currentSchoolId = req.user!.schoolId;

    const whereClause: any = {};

    if (currentSchoolId) {
      whereClause.schoolId = currentSchoolId;
    }

    if (currentUserRole === 'TEACHER') {
      const assignedClassIds = await this.ensureTeacherClassScope(currentUserId, currentUserRole, currentSchoolId);
      const requestedClassId = typeof classId === 'string' ? classId : undefined;

      if (requestedClassId && !assignedClassIds.includes(requestedClassId)) {
        throw new ApiError(403, 'You can only view attendance stats for your assigned class');
      }

      whereClause.classId = requestedClassId || { in: assignedClassIds };
    }

    if (startDate && endDate) {
      const start = new Date(startDate as string);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      whereClause.date = {
        gte: start,
        lte: end,
      };
    }

    if (classId && currentUserRole !== 'TEACHER') whereClause.classId = classId;
    if (learnerId) whereClause.learnerId = learnerId;

    // Get counts by status
    const statusCounts = await prisma.attendance.groupBy({
      by: ['status'],
      where: whereClause,
      _count: true,
    });

    // Get total unique days with attendance
    const uniqueDates = await prisma.attendance.findMany({
      where: whereClause,
      select: { date: true },
      distinct: ['date'],
    });

    // Get total unique learners
    const uniqueLearners = await prisma.attendance.findMany({
      where: whereClause,
      select: { learnerId: true },
      distinct: ['learnerId'],
    });

    // Calculate attendance rate
    const presentCount = statusCounts.find(s => s.status === 'PRESENT')?._count || 0;
    const totalCount = statusCounts.reduce((sum, item) => sum + item._count, 0);

    const stats = {
      totalRecords: totalCount,
      totalDays: uniqueDates.length,
      totalLearners: uniqueLearners.length,
      byStatus: statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      attendanceRate: totalCount > 0
        ? Math.round((presentCount / totalCount) * 100)
        : 0,
    };

    res.json({
      success: true,
      data: stats,
    });
  }

  /**
   * Get learner attendance summary
   * Access: SUPER_ADMIN, ADMIN, HEAD_TEACHER, TEACHER, PARENT (own children)
   */
  async getLearnerAttendanceSummary(req: AuthRequest, res: Response) {
    const { learnerId } = req.params;
    const { startDate, endDate } = req.query;

    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    // Check permissions
    if (currentUserRole === 'PARENT') {
      const learner = await prisma.learner.findUnique({
        where: { id: learnerId },
      });
      if (!learner || learner.parentId !== currentUserId) {
        throw new ApiError(403, 'You can only access your own children\'s attendance');
      }
    }

    if (currentUserRole === 'TEACHER') {
      const learnerEnrollment = await prisma.classEnrollment.findFirst({
        where: {
          learnerId,
          active: true,
          class: {
            teacherId: currentUserId,
            ...(req.user?.schoolId ? { schoolId: req.user.schoolId } : {}),
          },
        },
        select: { id: true },
      });

      if (!learnerEnrollment) {
        throw new ApiError(403, 'You can only access attendance for learners in your assigned class');
      }
    }

    const whereClause: any = { learnerId };

    if (startDate && endDate) {
      const start = new Date(startDate as string);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      whereClause.date = {
        gte: start,
        lte: end,
      };
    }

    // Get all attendance records
    const records = await prisma.attendance.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
    });

    // Calculate summary
    const summary = {
      total: records.length,
      present: records.filter(r => r.status === 'PRESENT').length,
      absent: records.filter(r => r.status === 'ABSENT').length,
      late: records.filter(r => r.status === 'LATE').length,
      excused: records.filter(r => r.status === 'EXCUSED').length,
      sick: records.filter(r => r.status === 'SICK').length,
      attendanceRate: 0,
    };

    summary.attendanceRate = summary.total > 0
      ? Math.round((summary.present / summary.total) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        summary,
        records,
      },
    });
  }

  /**
   * Get daily attendance report for a class
   * Access: SUPER_ADMIN, ADMIN, HEAD_TEACHER, TEACHER
   */
  async getDailyClassAttendance(req: AuthRequest, res: Response) {
    const { classId, date } = req.query;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;
    const currentSchoolId = req.user!.schoolId;

    if (!classId || !date) {
      throw new ApiError(400, 'Missing required parameters: classId, date');
    }

    // Fetch class details to verify access and get grade/stream for learner matching
    const classObj = currentUserRole === 'TEACHER'
      ? await prisma.class.findFirst({
        where: {
          id: classId as string,
          teacherId: currentUserId,
          active: true,
          archived: false,
          ...(currentSchoolId ? { schoolId: currentSchoolId } : {}),
        }
      })
      : await prisma.class.findFirst({
        where: {
          id: classId as string,
          ...(currentSchoolId ? { schoolId: currentSchoolId } : {}),
        }
      });

    if (!classObj) {
      if (currentUserRole === 'TEACHER') {
        throw new ApiError(403, 'You can only access your assigned class attendance register');
      }
      throw new ApiError(404, 'Class not found');
    }

    const queryDate = new Date(date as string);
    queryDate.setHours(0, 0, 0, 0);

    // Get learners: either explicitly enrolled OR matching grade & stream
    const learners = await prisma.learner.findMany({
      where: {
        status: 'ACTIVE',
        enrollments: {
          some: { classId: classId as string, active: true }
        }
      },
      select: {
        id: true,
        admissionNumber: true,
        firstName: true,
        lastName: true,
        gender: true,
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });

    // Get attendance for this date
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        classId: classId as string,
        date: queryDate,
        ...(currentSchoolId ? { schoolId: currentSchoolId } : {}),
      },
    });

    // Create map of learner attendance
    const attendanceMap = attendanceRecords.reduce((acc, record) => {
      acc[record.learnerId] = record;
      return acc;
    }, {} as Record<string, any>);

    // Combine learner list with attendance
    const report = learners.map(learner => ({
      ...learner,
      attendance: attendanceMap[learner.id] || null,
    }));

    res.json({
      success: true,
      data: {
        date: queryDate,
        classId,
        totalLearners: learners.length,
        marked: attendanceRecords.length,
        unmarked: learners.length - attendanceRecords.length,
        learners: report,
      },
    });
  }
}
