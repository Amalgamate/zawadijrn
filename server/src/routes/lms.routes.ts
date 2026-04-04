/**
 * LMS Routes
 * Defines all Learning Management System API endpoints
 *
 * @module routes/lms.routes
 */

import { Router } from 'express';
import { LMSController } from '../controllers/lms.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
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
    authorize('SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'HEAD_OF_CURRICULUM', 'TEACHER'),
    lmsController.getCourses.bind(lmsController)
);

router.get('/courses/:id',
    authorize('SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'HEAD_OF_CURRICULUM', 'TEACHER'),
    lmsController.getCourse.bind(lmsController)
);

router.post('/courses',
    authorize('SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'TEACHER', 'HEAD_OF_CURRICULUM'),
    validate(createCourseSchema),
    lmsController.createCourse.bind(lmsController)
);

router.put('/courses/:id',
    authorize('SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'TEACHER', 'HEAD_OF_CURRICULUM'),
    validate(updateCourseSchema),
    lmsController.updateCourse.bind(lmsController)
);

router.delete('/courses/:id',
    authorize('SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER'),
    lmsController.deleteCourse.bind(lmsController)
);

/**
 * Content Management Routes
 */
router.get('/content',
    authorize('SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'HEAD_OF_CURRICULUM', 'TEACHER'),
    lmsController.getContent.bind(lmsController)
);

router.post('/content',
    authorize('SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'HEAD_OF_CURRICULUM', 'TEACHER'),
    validate(uploadContentSchema),
    lmsController.uploadContent.bind(lmsController)
);

router.delete('/content/:id',
    authorize('SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'HEAD_OF_CURRICULUM', 'TEACHER'),
    lmsController.deleteContent.bind(lmsController)
);

/**
 * Enrollment Management Routes
 */
router.get('/enrollments',
    authorize('SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'HEAD_OF_CURRICULUM'),
    lmsController.getEnrollments.bind(lmsController)
);

router.post('/enrollments',
    authorize('SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER'),
    validate(enrollLearnerSchema),
    lmsController.enrollLearner.bind(lmsController)
);

router.delete('/enrollments/:id',
    authorize('SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER'),
    lmsController.unenrollLearner.bind(lmsController)
);

/**
 * Progress Tracking Routes
 */
router.get('/progress/:learnerId/:courseId',
    authorize('SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'HEAD_OF_CURRICULUM', 'TEACHER'),
    lmsController.getLearnerProgress.bind(lmsController)
);

router.put('/progress/:enrollmentId',
    authorize('SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'HEAD_OF_CURRICULUM', 'TEACHER'),
    lmsController.updateProgress.bind(lmsController)
);

router.get('/my-courses',
    authorize('STUDENT'),
    lmsController.getStudentCourses.bind(lmsController)
);

router.get('/my-courses/:courseId',
    authorize('STUDENT'),
    lmsController.getStudentCourse.bind(lmsController)
);

router.get('/my-assignments',
    authorize('STUDENT'),
    lmsController.getStudentAssignments.bind(lmsController)
);

router.put('/my-progress',
    authorize('STUDENT'),
    lmsController.updateStudentProgress.bind(lmsController)
);

router.post('/assignments/:id/submit',
    authorize('STUDENT'),
    lmsController.submitAssignment.bind(lmsController)
);

/**
 * Reports Routes
 */
router.get('/reports',
    authorize('SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER'),
    lmsController.getLMSReports.bind(lmsController)
);

router.get('/dashboard/stats',
    authorize('SUPER_ADMIN', 'ADMIN', 'HEAD_TEACHER', 'HEAD_OF_CURRICULUM', 'TEACHER'),
    lmsController.getLMSDashboardStats.bind(lmsController)
);

export default router;