/**
 * LMS Validation Schemas
 * Defines validation rules for LMS API endpoints
 *
 * @module validators/lms.validators
 */

import { z } from 'zod';
import { CourseStatus, ContentType } from '@prisma/client';

/**
 * Course Validation Schemas
 */
export const createCourseSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
    description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
    subject: z.string().min(1, 'Subject is required'),
    grade: z.string().min(1, 'Grade is required'),
    category: z.string().min(1, 'Category is required'),
    status: z.nativeEnum(CourseStatus).optional()
});

export const updateCourseSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters').optional(),
    description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
    subject: z.string().min(1, 'Subject is required').optional(),
    grade: z.string().min(1, 'Grade is required').optional(),
    category: z.string().min(1, 'Category is required').optional(),
    status: z.nativeEnum(CourseStatus).optional()
});

/**
 * Content Validation Schemas
 */
export const uploadContentSchema = z.object({
    courseId: z.string().uuid('Invalid course ID'),
    title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
    description: z.string().max(500, 'Description must be less than 500 characters').optional(),
    type: z.nativeEnum(ContentType),
    url: z.string().url('Invalid URL'),
    duration: z.number().positive('Duration must be positive').optional(),
    fileSize: z.number().positive('File size must be positive').optional(),
    order: z.number().int().positive('Order must be a positive integer').optional()
});

/**
 * Enrollment Validation Schemas
 */
export const enrollLearnerSchema = z.object({
    courseId: z.string().uuid('Invalid course ID'),
    learnerId: z.string().uuid('Invalid learner ID')
});

/**
 * Progress Validation Schemas
 */
export const updateProgressSchema = z.object({
    contentId: z.string().uuid('Invalid content ID'),
    completed: z.boolean().optional(),
    progress: z.number().min(0, 'Progress must be at least 0').max(100, 'Progress cannot exceed 100').optional(),
    timeSpent: z.number().min(0, 'Time spent must be non-negative').optional()
});

/**
 * Reports Validation Schemas
 */
export const getReportsSchema = z.object({
    courseId: z.string().uuid('Invalid course ID').optional(),
    learnerId: z.string().uuid('Invalid learner ID').optional(),
    dateFrom: z.string().datetime('Invalid date format').optional(),
    dateTo: z.string().datetime('Invalid date format').optional(),
    reportType: z.enum(['enrollment', 'progress', 'comprehensive']).optional()
});