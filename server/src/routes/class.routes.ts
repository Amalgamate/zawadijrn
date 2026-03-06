/**
 * Class Routes
 * Handles class management and enrollment endpoints
 * 
 * @module routes/class.routes
 */

import { Router } from 'express';
import { ClassController } from '../controllers/class.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { requireSchoolContext } from '../middleware/school.middleware';
import { requirePermission, requireRole, auditLog } from '../middleware/permissions.middleware';
import { asyncHandler } from '../utils/async.util';
import { validate } from '../middleware/validation.middleware';
import { rateLimit } from '../middleware/enhanced-rateLimit.middleware';
import { z } from 'zod';

const router = Router();
const classController = new ClassController();

// Validation schemas
const createClassSchema = z.object({
  name: z.string().min(2).max(100),
  grade: z.enum(['Grade1', 'Grade2', 'Grade3', 'Grade4', 'Grade5', 'Grade6']),
  classTeacherId: z.string().min(1).optional(),
  capacity: z.number().int().min(1).max(200).optional()
});

const updateClassSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  classTeacherId: z.string().min(1).optional(),
  capacity: z.number().int().min(1).max(200).optional()
});

/**
 * @route   GET /api/classes
 * @desc    Get all classes
 * @access  SUPER_ADMIN, ADMIN, HEAD_TEACHER, TEACHER
 */
router.get('/', 
  authenticate, 
  requireSchoolContext, 
  requirePermission('VIEW_ALL_LEARNERS'),
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  asyncHandler(classController.getAllClasses.bind(classController))
);

/**
 * @route   GET /api/classes/:id
 * @desc    Get single class with learners
 * @access  SUPER_ADMIN, ADMIN, HEAD_TEACHER, TEACHER
 */
router.get(
  '/:id',
  authenticate,
  requireSchoolContext,
  requirePermission('VIEW_ALL_LEARNERS'),
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  asyncHandler(classController.getClassById.bind(classController))
);

/**
 * @route   POST /api/classes
 * @desc    Create new class
 * @access  SUPER_ADMIN, ADMIN, HEAD_TEACHER
 */
router.post(
  '/',
  authenticate,
  requireSchoolContext,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER']),
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(createClassSchema),
  auditLog('CREATE_CLASS'),
  asyncHandler(classController.createClass.bind(classController))
);

/**
 * @route   PUT /api/classes/:id
 * @desc    Update class
 * @access  SUPER_ADMIN, ADMIN, HEAD_TEACHER
 */
router.put(
  '/:id',
  authenticate,
  requireSchoolContext,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER']),
  auditLog('UPDATE_CLASS'),
  asyncHandler(classController.updateClass.bind(classController))
);

/**
 * @route   POST /api/classes/enroll
 * @desc    Enroll learner in class
 * @access  SUPER_ADMIN, ADMIN, HEAD_TEACHER
 */
router.post(
  '/enroll',
  authenticate,
  requireSchoolContext,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER']),
  auditLog('ENROLL_LEARNER'),
  asyncHandler(classController.enrollLearner.bind(classController))
);

/**
 * @route   POST /api/classes/unenroll
 * @desc    Remove learner from class
 * @access  SUPER_ADMIN, ADMIN, HEAD_TEACHER
 */
router.post(
  '/unenroll',
  authenticate,
  requireSchoolContext,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER']),
  auditLog('UNENROLL_LEARNER'),
  asyncHandler(classController.unenrollLearner.bind(classController))
);

/**
 * @route   GET /api/classes/learner/:learnerId
 * @desc    Get learner's current class
 * @access  SUPER_ADMIN, ADMIN, HEAD_TEACHER, TEACHER, PARENT
 */
router.get('/learner/:learnerId', authenticate, requireSchoolContext, asyncHandler(classController.getLearnerClass.bind(classController)));

/**
 * @route   POST /api/classes/assign-teacher
 * @desc    Assign teacher to class
 * @access  SUPER_ADMIN, ADMIN, HEAD_TEACHER
 */
router.post(
  '/assign-teacher',
  authenticate,
  requireSchoolContext,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'HEAD_OF_CURRICULUM']),
  auditLog('ASSIGN_TEACHER'),
  asyncHandler(classController.assignTeacher.bind(classController))
);

/**
 * @route   POST /api/classes/unassign-teacher
 * @desc    Unassign teacher from class
 * @access  SUPER_ADMIN, ADMIN, HEAD_TEACHER
 */
router.post(
  '/unassign-teacher',
  authenticate,
  requireSchoolContext,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'HEAD_OF_CURRICULUM']),
  auditLog('UNASSIGN_TEACHER'),
  asyncHandler(classController.unassignTeacher.bind(classController))
);

/**
 * @route   GET /api/classes/teacher/:teacherId/workload
 * @desc    Get teacher's workload (all assigned classes)
 * @access  SUPER_ADMIN, ADMIN, HEAD_TEACHER
 */
router.get(
  '/teacher/:teacherId/workload',
  authenticate,
  requireSchoolContext,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'HEAD_OF_CURRICULUM', 'TEACHER']),
  asyncHandler(classController.getTeacherWorkload.bind(classController))
);

/**
 * @route   GET /api/classes/teacher/:teacherId/schedules
 * @desc    Get teacher's subject schedules from ClassSchedule table
 * @access  SUPER_ADMIN, ADMIN, HEAD_TEACHER, HEAD_OF_CURRICULUM, TEACHER (self)
 */
router.get(
  '/teacher/:teacherId/schedules',
  authenticate,
  requireSchoolContext,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'HEAD_OF_CURRICULUM', 'TEACHER']),
  asyncHandler(classController.getTeacherSchedules.bind(classController))
);

/**
 * @route   GET /api/classes/:id/schedules
 * @desc    Get schedules for a specific class
 */
router.get(
  '/:id/schedules',
  authenticate,
  requireSchoolContext,
  asyncHandler(classController.getClassSchedules.bind(classController))
);

/**
 * @route   POST /api/classes/:id/schedules
 * @desc    Add a schedule to a class
 */
router.post(
  '/:id/schedules',
  authenticate,
  requireSchoolContext,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'HEAD_OF_CURRICULUM']),
  asyncHandler(classController.createClassSchedule.bind(classController))
);

/**
 * @route   PUT /api/classes/:id/schedules/:scheduleId
 * @desc    Update a schedule
 */
router.put(
  '/:id/schedules/:scheduleId',
  authenticate,
  requireSchoolContext,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'HEAD_OF_CURRICULUM']),
  asyncHandler(classController.updateClassSchedule.bind(classController))
);

/**
 * @route   DELETE /api/classes/:id/schedules/:scheduleId
 * @desc    Delete a schedule
 */
router.delete(
  '/:id/schedules/:scheduleId',
  authenticate,
  requireSchoolContext,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'HEAD_OF_CURRICULUM']),
  asyncHandler(classController.deleteClassSchedule.bind(classController))
);

export default router;
