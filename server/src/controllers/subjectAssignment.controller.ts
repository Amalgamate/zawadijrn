/**
 * Subject Assignment Controller
 * Handles assigning teachers to specific subjects/learning areas
 */

import { Response } from 'express';
import prisma from '../config/database';
import { ApiError } from '../utils/error.util';
import { AuthRequest } from '../middleware/permissions.middleware';
import { Grade } from '@prisma/client';

export class SubjectAssignmentController {

    /**
     * Get all subject assignments for a school
     */
    async getAllAssignments(req: AuthRequest, res: Response) {
        const schoolId = req.user?.schoolId;
        const { grade, teacherId, learningAreaId } = req.query;

        const where: any = { schoolId };
        if (grade) where.grade = grade as Grade;
        if (teacherId) where.teacherId = teacherId as string;
        if (learningAreaId) where.learningAreaId = learningAreaId as string;

        const assignments = await prisma.subjectAssignment.findMany({
            where,
            include: {
                teacher: { select: { id: true, firstName: true, lastName: true, staffId: true } },
                learningArea: { select: { id: true, name: true, shortName: true, gradeLevel: true } }
            },
            orderBy: [
                { grade: 'asc' },
                { learningArea: { name: 'asc' } }
            ]
        });

        res.json({ success: true, data: assignments });
    }

    /**
     * Assign a teacher to a subject for a specific grade
     */
    async createAssignment(req: AuthRequest, res: Response) {
        const { teacherId, learningAreaId, grade } = req.body;
        const schoolId = req.user?.schoolId;

        if (!teacherId || !learningAreaId || !grade) {
            throw new ApiError(400, 'Teacher ID, Learning Area ID, and Grade are required');
        }

        // Verify teacher exists and is a teacher
        const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
        if (!teacher || (teacher.role !== 'TEACHER' && teacher.role !== 'HEAD_TEACHER')) {
            throw new ApiError(400, 'Invalid teacher selected');
        }

        // Verify learning area exists
        const learningArea = await prisma.learningArea.findUnique({ where: { id: learningAreaId } });
        if (!learningArea) {
            throw new ApiError(404, 'Learning Area not found');
        }

        // Create or update assignment
        const assignment = await prisma.subjectAssignment.upsert({
            where: {
                teacherId_learningAreaId_grade: {
                    teacherId,
                    learningAreaId,
                    grade: grade as Grade
                }
            },
            update: { active: true },
            create: {
                teacherId,
                learningAreaId,
                grade: grade as Grade,
                schoolId
            }
        });

        res.status(201).json({ success: true, data: assignment });
    }

    /**
     * Remove a subject assignment
     */
    async removeAssignment(req: AuthRequest, res: Response) {
        const { id } = req.params;

        await prisma.subjectAssignment.delete({
            where: { id }
        });

        res.json({ success: true, message: 'Assignment removed successfully' });
    }

    /**
     * Get eligible teachers for a specific learning area in a grade
     */
    async getEligibleTeachers(req: AuthRequest, res: Response) {
        const { learningAreaId, grade } = req.query;
        const schoolId = req.user?.schoolId;

        if (!learningAreaId || !grade) {
            throw new ApiError(400, 'Learning Area ID and Grade are required');
        }

        const assignments = await prisma.subjectAssignment.findMany({
            where: {
                learningAreaId: learningAreaId as string,
                grade: grade as Grade,
                schoolId,
                active: true
            },
            include: {
                teacher: { select: { id: true, firstName: true, lastName: true } }
            }
        });

        const teachers = assignments.map(a => a.teacher);
        res.json({ success: true, data: teachers });
    }
}

export const subjectAssignmentController = new SubjectAssignmentController();
