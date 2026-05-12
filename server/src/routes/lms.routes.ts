/**
 * LMS Routes
 * Defines all Learning Management System API endpoints
 *
 * Guard contract:
 * - authenticate at router level
 * - requireRole([...]) per route for consistent structured auth errors
 *
 * FIX: The old import referenced `validateRequest` which was never exported
 * from validation.middleware. The correct export is `validate`.
 *
 * @module routes/lms.routes
 */

import { Router } from 'express';
import { LMSController } from '../controllers/lms.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/permissions.middleware';
import { validate } from '../middleware/validation.middleware';
import {
    createCourseSchema,
    updateCourseSchema,
    uploadContentSchema,
    enrollLearnerSchema
} from '../validators/lms.validators';

const router = Router();
const lmsController = new LMSController();

// Apply authentication to all LMS routes
router.use(authenticate);

/**
 * Course Management Routes
 */
router.get('/courses',
    requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'HEAD_OF_CURRICULUM', 'TEACHER']),
    lmsController.getCourses.bind(lmsController)
);

router.get('/courses/:id',
    requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'HEAD_OF_CURRICULUM', 'TEACHER']),
    lmsController.getCourse.bind(lmsController)
);

router.post('/courses',
    requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'TEACHER', 'HEAD_OF_CURRICULUM']),
    validate(createCourseSchema),
    lmsController.createCourse.bind(lmsController)
);

router.put('/courses/:id',
    requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'TEACHER', 'HEAD_OF_CURRICULUM']),
    validate(updateCourseSchema),
    lmsController.updateCourse.bind(lmsController)
);

router.delete('/courses/:id',
    requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER']),
    lmsController.deleteCourse.bind(lmsController)
);

/**
 * Content Management Routes
 */
router.get('/content',
    requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'HEAD_OF_CURRICULUM', 'TEACHER']),
    lmsController.getContent.bind(lmsController)
);

router.post('/content',
    requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'HEAD_OF_CURRICULUM', 'TEACHER']),
    validate(uploadContentSchema),
    lmsController.uploadContent.bind(lmsController)
);

router.delete('/content/:id',
    requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'HEAD_OF_CURRICULUM', 'TEACHER']),
    lmsController.deleteContent.bind(lmsController)
);

/**
 * Enrollment Management Routes
 */
router.get('/enrollments',
    requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'HEAD_OF_CURRICULUM']),
    lmsController.getEnrollments.bind(lmsController)
);

router.post('/enrollments',
    requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER']),
    validate(enrollLearnerSchema),
    lmsController.enrollLearner.bind(lmsController)
);

router.delete('/enrollments/:id',
    requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER']),
    lmsController.unenrollLearner.bind(lmsController)
);

/**
 * Progress Tracking Routes
 */
router.get('/progress/:learnerId/:courseId',
    requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'HEAD_OF_CURRICULUM', 'TEACHER']),
    lmsController.getLearnerProgress.bind(lmsController)
);

router.put('/progress/:enrollmentId',
    requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'HEAD_OF_CURRICULUM', 'TEACHER']),
    lmsController.updateProgress.bind(lmsController)
);

router.get('/my-courses',
    requireRole(['STUDENT']),
    lmsController.getStudentCourses.bind(lmsController)
);

router.get('/my-courses/:courseId',
    requireRole(['STUDENT']),
    lmsController.getStudentCourse.bind(lmsController)
);

router.get('/my-assignments',
    requireRole(['STUDENT']),
    lmsController.getStudentAssignments.bind(lmsController)
);

router.put('/my-progress',
    requireRole(['STUDENT']),
    lmsController.updateStudentProgress.bind(lmsController)
);

router.post('/assignments/:id/submit',
    requireRole(['STUDENT']),
    lmsController.submitAssignment.bind(lmsController)
);

/**
 * Reports Routes
 */
router.get('/reports',
    requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER']),
    lmsController.getLMSReports.bind(lmsController)
);

router.get('/dashboard/stats',
    requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'HEAD_OF_CURRICULUM', 'TEACHER']),
    lmsController.getLMSDashboardStats.bind(lmsController)
);

export default router;

