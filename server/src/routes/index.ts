import { Router } from 'express';
import healthRoutes from './health.routes';
import diagnosticsRoutes from './diagnostics.routes';
import migrationRoutes from './migration.routes';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import learnerRoutes from './learner.routes';
import classRoutes from './class.routes';
import attendanceRoutes from './attendance.routes';
import notificationRoutes from './notification.routes';
import assessmentRoutes from './assessmentRoutes';
import reportRoutes from './reportRoutes';
import biometricRoutes from './biometric.routes';
import schoolRoutes from './school.routes';
import feeRoutes from './fee.routes';
import bulkRoutes from './bulk';
import cbcRoutes from './cbcRoutes';
import gradingRoutes from './grading.routes';
import configRoutes from './config.routes';
// workflowRoutes disabled — approval flow removed
// import workflowRoutes from './workflow.routes';
import communicationRoutes from './communication.routes';
import adminRoutes from './admin.routes';
import learningAreaRoutes from './learningArea.routes';
import dashboardRoutes from './dashboard.routes';
import bookRoutes from './book.routes';
import supportRoutes from './support.routes';
import documentRoutes from './document.routes';
import plannerRoutes from './planner.routes';
import broadcastRoutes from './broadcast.routes';
import streamRoutes from './stream.routes';
import hrRoutes from './hr.routes';
import accountingRoutes from './accounting.routes';
import inventoryRoutes from './inventory.routes';
import subjectAssignmentRoutes from './subjectAssignment.routes';
import schemeOfWorkRoutes from './schemeOfWork.routes';
import noticeRoutes from './notice.routes';
import aiRoutes from './ai.routes';
import backupRoutes from './backup.routes';
import { issueCsrfToken } from '../middleware/csrf.middleware';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// ============================================
// PUBLIC ROUTES
// ============================================
router.use('/health', healthRoutes);
router.use('/diagnostics', diagnosticsRoutes);
router.use('/migrations', migrationRoutes);
router.use('/auth', authRoutes);
router.use('/books', bookRoutes);
router.use('/schools', schoolRoutes); // PUBLIC (internally partial)
router.get('/auth/csrf', issueCsrfToken);

// ============================================
// PROTECTED ROUTES
// ============================================
router.use(authenticate);

router.use('/admin', adminRoutes);
router.use('/support', supportRoutes);
router.use('/users', userRoutes);
router.use('/learners', learnerRoutes);
router.use('/classes', classRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/notifications', notificationRoutes);
router.use('/assessments', assessmentRoutes);
router.use('/reports', reportRoutes);
router.use('/biometric', biometricRoutes);
router.use('/fees', feeRoutes);
router.use('/bulk', bulkRoutes);
router.use('/cbc', cbcRoutes);
router.use('/grading', gradingRoutes);
router.use('/config', configRoutes);
router.use('/learning-areas', learningAreaRoutes);
// router.use('/workflow', workflowRoutes); // disabled — approval flow removed
router.use('/facility/streams', streamRoutes);
router.use('/broadcasts', broadcastRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/documents', documentRoutes);
router.use('/planner', plannerRoutes);
router.use('/hr', hrRoutes);
router.use('/accounting', accountingRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/subject-assignments', subjectAssignmentRoutes);
router.use('/schemes-of-work', schemeOfWorkRoutes);
router.use('/communication', communicationRoutes);
router.use('/notices', noticeRoutes);
router.use('/ai', aiRoutes);
router.use('/backup', backupRoutes);

export default router;
