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
import schoolRoutes from './school.routes';
import feeRoutes from './fee.routes';
import bulkRoutes from './bulk';
import cbcRoutes from './cbcRoutes';
import gradingRoutes from './grading.routes';
import configRoutes from './config.routes';
import workflowRoutes from './workflow.routes';
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
import noticeRoutes from './notice.routes';
import pdfRoutes from './pdf.routes';
import biometricRoutes from './biometric.routes';
import idTemplateRoutes from './idTemplate.routes';
import libraryRoutes from './library.routes';
import transportRoutes from './transport.routes';
import lmsRoutes from './lms.routes';
import aiRoutes from './ai.routes';
import onboardingRoutes from './onboarding.routes';
import backupRoutes from './backup.routes';
import schemeOfWorkRoutes from './schemeOfWork.routes';
import pathwayRoutes from './pathway.routes';
import pathwayRecommendationRoutes from './pathwayRecommendation.routes';
import userNotificationRoutes from './userNotification.routes';
import changelogRoutes from './changelog.routes';
import tertiaryRoutes from './tertiary.routes';
import mpesaRoutes from './mpesa.routes';
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
router.use('/onboarding', onboardingRoutes);
router.use('/books', bookRoutes);
router.use('/library', libraryRoutes);
router.use('/schools', schoolRoutes);
router.use('/biometric', biometricRoutes);
router.use('/ai', aiRoutes);
router.use('/mpesa', mpesaRoutes);
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
router.use('/fees', feeRoutes);
router.use('/bulk', bulkRoutes);
router.use('/cbc', cbcRoutes);
router.use('/grading', gradingRoutes);
router.use('/config', configRoutes);
router.use('/learning-areas', learningAreaRoutes);
router.use('/pathways', pathwayRoutes);
router.use('/pathways', pathwayRecommendationRoutes);
router.use('/workflow', workflowRoutes);
router.use('/facility/streams', streamRoutes);
router.use('/broadcasts', broadcastRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/documents', documentRoutes);
router.use('/planner', plannerRoutes);
router.use('/schemes', schemeOfWorkRoutes);
router.use('/backup', backupRoutes);
router.use('/hr', hrRoutes);
router.use('/accounting', accountingRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/subject-assignments', subjectAssignmentRoutes);
router.use('/communication', communicationRoutes);
router.use('/notices', noticeRoutes);
router.use('/pdf', pdfRoutes);
router.use('/id-templates', idTemplateRoutes);
router.use('/transport', transportRoutes);
router.use('/user-notifications', userNotificationRoutes);
router.use('/changelogs', changelogRoutes);
router.use('/lms', lmsRoutes);
router.use('/tertiary', tertiaryRoutes);

export default router;
