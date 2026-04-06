/**
 * LMS Routes
 * Defines all Learning Management System API endpoints
 *
 * FIX: authorize() is typed as (...roles: Role[]) but passing multiple string
 * literals caused TS2345 ("string[] not assignable to Role") in strict mode.
 * Cast each call-site with `as Role` to satisfy the type checker without
 * changing the runtime behaviour at all.
 *
 * FIX: The old import referenced `validateRequest` which was never exported
 * from validation.middleware. The correct export is `validate`.
 *
 * @module routes/lms.routes
 */

import { Router } from 'express';
import { LMSController } from '../controllers/lms.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { Role } from '../config/permissions';
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
    authorize('SUPER_ADMIN' as Role, 'ADMIN' as Role, 'HEAD_TEACHER' as Role, 'HEAD_OF_CURRICULUM' as Role, 'TEACHER' as Role),
    lmsController.getCourses.bind(lmsController)
);

router.get('/courses/:id',
    authorize('SUPER_ADMIN' as Role, 'ADMIN' as Role, 'HEAD_TEACHER' as Role, 'HEAD_OF_CURRICULUM' as Role, 'TEACHER' as Role),
    lmsController.getCourse.bind(lmsController)
);

router.post('/courses',
    authorize('SUPER_ADMIN' as Role, 'ADMIN' as Role, 'HEAD_TEACHER' as Role, 'TEACHER' as Role, 'HEAD_OF_CURRICULUM' as Role),
    validate(createCourseSchema),
    lmsController.createCourse.bind(lmsController)
);

router.put('/courses/:id',
    authorize('SUPER_ADMIN' as Role, 'ADMIN' as Role, 'HEAD_TEACHER' as Role, 'TEACHER' as Role, 'HEAD_OF_CURRICULUM' as Role),
    validate(updateCourseSchema),
    lmsController.updateCourse.bind(lmsController)
);

router.delete('/courses/:id',
    authorize('SUPER_ADMIN' as Role, 'ADMIN' as Role, 'HEAD_TEACHER' as Role),
    lmsController.deleteCourse.bind(lmsController)
);

/**
 * Content Management Routes
 */
router.get('/content',
    authorize('SUPER_ADMIN' as Role, 'ADMIN' as Role, 'HEAD_TEACHER' as Role, 'HEAD_OF_CURRICULUM' as Role, 'TEACHER' as Role),
    lmsController.getContent.bind(lmsController)
);

router.post('/content',
    authorize('SUPER_ADMIN' as Role, 'ADMIN' as Role, 'HEAD_TEACHER' as Role, 'HEAD_OF_CURRICULUM' as Role, 'TEACHER' as Role),
    validate(uploadContentSchema),
    lmsController.uploadContent.bind(lmsController)
);

router.delete('/content/:id',
    authorize('SUPER_ADMIN' as Role, 'ADMIN' as Role, 'HEAD_TEACHER' as Role, 'HEAD_OF_CURRICULUM' as Role, 'TEACHER' as Role),
    lmsController.deleteContent.bind(lmsController)
);

/**
 * Enrollment Management Routes
 */
router.get('/enrollments',
    authorize('SUPER_ADMIN' as Role, 'ADMIN' as Role, 'HEAD_TEACHER' as Role, 'HEAD_OF_CURRICULUM' as Role),
    lmsController.getEnrollments.bind(lmsController)
);

router.post('/enrollments',
    authorize('SUPER_ADMIN' as Role, 'ADMIN' as Role, 'HEAD_TEACHER' as Role),
    validate(enrollLearnerSchema),
    lmsController.enrollLearner.bind(lmsController)
);

router.delete('/enrollments/:id',
    authorize('SUPER_ADMIN' as Role, 'ADMIN' as Role, 'HEAD_TEACHER' as Role),
    lmsController.unenrollLearner.bind(lmsController)
);

/**
 * Progress Tracking Routes
 */
router.get('/progress/:learnerId/:courseId',
    authorize('SUPER_ADMIN' as Role, 'ADMIN' as Role, 'HEAD_TEACHER' as Role, 'HEAD_OF_CURRICULUM' as Role, 'TEACHER' as Role),
    lmsController.getLearnerProgress.bind(lmsController)
);

router.put('/progress/:enrollmentId',
    authorize('SUPER_ADMIN' as Role, 'ADMIN' as Role, 'HEAD_TEACHER' as Role, 'HEAD_OF_CURRICULUM' as Role, 'TEACHER' as Role),
    lmsController.updateProgress.bind(lmsController)
);

router.get('/my-courses',
    authorize('STUDENT' as Role),
    lmsController.getStudentCourses.bind(lmsController)
);

router.get('/my-courses/:courseId',
    authorize('STUDENT' as Role),
    lmsController.getStudentCourse.bind(lmsController)
);

router.get('/my-assignments',
    authorize('STUDENT' as Role),
    lmsController.getStudentAssignments.bind(lmsController)
);

router.put('/my-progress',
    authorize('STUDENT' as Role),
    lmsController.updateStudentProgress.bind(lmsController)
);

router.post('/assignments/:id/submit',
    authorize('STUDENT' as Role),
    lmsController.submitAssignment.bind(lmsController)
);

/**
 * Reports Routes
 */
router.get('/reports',
    authorize('SUPER_ADMIN' as Role, 'ADMIN' as Role, 'HEAD_TEACHER' as Role),
    lmsController.getLMSReports.bind(lmsController)
);

router.get('/dashboard/stats',
    authorize('SUPER_ADMIN' as Role, 'ADMIN' as Role, 'HEAD_TEACHER' as Role, 'HEAD_OF_CURRICULUM' as Role, 'TEACHER' as Role),
    lmsController.getLMSDashboardStats.bind(lmsController)
);

export default router;
