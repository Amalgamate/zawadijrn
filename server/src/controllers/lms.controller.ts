/**
 * LMS Controller
 * Handles all Learning Management System endpoints
 *
 * @module controllers/lms.controller
 */

import { Request, Response } from 'express';
import { LMSService } from '../services/lms.service';
import { ApiError } from '../utils/error.util';
import { AuthRequest } from '../middleware/auth.middleware';

const lmsService = new LMSService();

export class LMSController {
    /**
     * Course Management Endpoints
     */

    async getCourses(req: AuthRequest, res: Response) {
        try {
            const filters = {
                search: req.query.search as string,
                category: req.query.category as string,
                status: req.query.status as string,
                grade: req.query.grade as string,
                subject: req.query.subject as string,
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 20
            };

            const result = await lmsService.getCourses(filters);
            res.json({
                success: true,
                data: result.courses,
                pagination: result.pagination
            });
        } catch (error) {
            throw new ApiError(500, 'Failed to fetch courses');
        }
    }

    async getCourse(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const course = await lmsService.getCourse(id);

            if (!course) {
                throw new ApiError(404, 'Course not found');
            }

            res.json({
                success: true,
                data: course
            });
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(500, 'Failed to fetch course');
        }
    }

    async createCourse(req: AuthRequest, res: Response) {
        try {
            const courseData = {
                ...req.body,
                createdById: req.user!.userId
            };

            const course = await lmsService.createCourse(courseData);
            res.status(201).json({
                success: true,
                data: course,
                message: 'Course created successfully'
            });
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(500, 'Failed to create course');
        }
    }

    async updateCourse(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const course = await lmsService.updateCourse(id, req.body);

            res.json({
                success: true,
                data: course,
                message: 'Course updated successfully'
            });
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(500, 'Failed to update course');
        }
    }

    async deleteCourse(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            await lmsService.deleteCourse(id);

            res.json({
                success: true,
                message: 'Course deleted successfully'
            });
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(500, 'Failed to delete course');
        }
    }

    /**
     * Content Management Endpoints
     */

    async getContent(req: AuthRequest, res: Response) {
        try {
            const filters = {
                courseId: req.query.courseId as string,
                type: req.query.type as string,
                search: req.query.search as string,
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 20
            };

            const result = await lmsService.getContent(filters);
            res.json({
                success: true,
                data: result.content,
                pagination: result.pagination
            });
        } catch (error) {
            throw new ApiError(500, 'Failed to fetch content');
        }
    }

    async uploadContent(req: AuthRequest, res: Response) {
        try {
            const contentData = {
                ...req.body,
                uploadedById: req.user!.userId
            };

            const content = await lmsService.uploadContent(contentData);
            res.status(201).json({
                success: true,
                data: content,
                message: 'Content uploaded successfully'
            });
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(500, 'Failed to upload content');
        }
    }

    async deleteContent(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            await lmsService.deleteContent(id);

            res.json({
                success: true,
                message: 'Content deleted successfully'
            });
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(500, 'Failed to delete content');
        }
    }

    /**
     * Enrollment Management Endpoints
     */

    async getEnrollments(req: AuthRequest, res: Response) {
        try {
            const filters = {
                courseId: req.query.courseId as string,
                learnerId: req.query.learnerId as string,
                status: req.query.status as string,
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 20
            };

            const result = await lmsService.getEnrollments(filters);
            res.json({
                success: true,
                data: result.enrollments,
                pagination: result.pagination
            });
        } catch (error) {
            throw new ApiError(500, 'Failed to fetch enrollments');
        }
    }

    async enrollLearner(req: AuthRequest, res: Response) {
        try {
            const enrollmentData = {
                ...req.body,
                enrolledById: req.user!.userId
            };

            const enrollment = await lmsService.enrollLearner(enrollmentData);
            res.status(201).json({
                success: true,
                data: enrollment,
                message: 'Learner enrolled successfully'
            });
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(500, 'Failed to enroll learner');
        }
    }

    async unenrollLearner(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            await lmsService.unenrollLearner(id);

            res.json({
                success: true,
                message: 'Learner unenrolled successfully'
            });
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(500, 'Failed to unenroll learner');
        }
    }

    /**
     * Progress Tracking Endpoints
     */

    async getLearnerProgress(req: AuthRequest, res: Response) {
        try {
            const { learnerId, courseId } = req.params;
            const progress = await lmsService.getLearnerProgress(learnerId, courseId);

            res.json({
                success: true,
                data: progress
            });
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(500, 'Failed to fetch learner progress');
        }
    }

    async updateProgress(req: AuthRequest, res: Response) {
        try {
            const { enrollmentId } = req.params;
            const progressData = req.body;

            const progress = await lmsService.updateProgress(enrollmentId, progressData);
            res.json({
                success: true,
                data: progress,
                message: 'Progress updated successfully'
            });
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(500, 'Failed to update progress');
        }
    }

    async getStudentCourses(req: AuthRequest, res: Response) {
        try {
            const courses = await lmsService.getStudentCourses(req.user!.userId);
            res.json({
                success: true,
                data: courses
            });
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(500, 'Failed to fetch student courses');
        }
    }

    async getStudentCourse(req: AuthRequest, res: Response) {
        try {
            const { courseId } = req.params;
            const course = await lmsService.getStudentCourse(req.user!.userId, courseId);
            res.json({
                success: true,
                data: course
            });
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(500, 'Failed to fetch student course details');
        }
    }

    async getStudentAssignments(req: AuthRequest, res: Response) {
        try {
            const assignments = await lmsService.getStudentAssignments(req.user!.userId);
            res.json({
                success: true,
                data: assignments
            });
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(500, 'Failed to fetch student assignments');
        }
    }

    async updateStudentProgress(req: AuthRequest, res: Response) {
        try {
            const { enrollmentId, contentItemId, completed, progress, timeSpent } = req.body;
            const updatedProgress = await lmsService.updateStudentProgress(req.user!.userId, enrollmentId, {
                contentId: contentItemId,
                completed,
                progress,
                timeSpent
            });
            res.json({
                success: true,
                data: updatedProgress,
                message: 'Progress updated successfully'
            });
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(500, 'Failed to update student progress');
        }
    }

    async submitAssignment(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const result = await lmsService.submitStudentAssignment(req.user!.userId, id);
            res.json({
                success: true,
                data: result,
                message: 'Assignment submitted successfully'
            });
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(500, 'Failed to submit assignment');
        }
    }

    /**
     * Reports Endpoints
     */

    async getLMSReports(req: AuthRequest, res: Response) {
        try {
            const filters = {
                courseId: req.query.courseId as string,
                learnerId: req.query.learnerId as string,
                dateFrom: req.query.dateFrom as string,
                dateTo: req.query.dateTo as string,
                reportType: req.query.reportType as string
            };

            const reports = await lmsService.getLMSReports(filters);
            res.json({
                success: true,
                data: reports
            });
        } catch (error) {
            throw new ApiError(500, 'Failed to generate reports');
        }
    }

    async getLMSDashboardStats(req: AuthRequest, res: Response) {
        try {
            const stats = await lmsService.getLMSDashboardStats();
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            throw new ApiError(500, 'Failed to fetch LMS dashboard stats');
        }
    }
}