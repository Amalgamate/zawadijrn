import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permissions.middleware';
import { biometricController } from '../controllers/biometric.controller';

const router = Router();

/**
 * @route   POST /api/biometric/devices
 * @desc    Register or update a biometric device
 * @access  Private (MANAGE_BIOMETRIC_DEVICES)
 */
router.post(
  '/devices',
  authenticate,
  requirePermission('MANAGE_BIOMETRIC_DEVICES'),
  biometricController.registerDevice
);

/**
 * @route   GET /api/biometric/devices
 * @desc    List all biometric devices
 * @access  Private (MANAGE_BIOMETRIC_DEVICES)
 */
router.get(
  '/devices',
  authenticate,
  requirePermission('MANAGE_BIOMETRIC_DEVICES'),
  biometricController.getDevices
);

/**
 * @route   POST /api/biometric/enroll
 * @desc    Enroll a user/learner biometric credential
 * @access  Private (ENROLL_FINGERPRINTS)
 */
router.post(
  '/enroll',
  authenticate,
  requirePermission('ENROLL_FINGERPRINTS'),
  biometricController.enrollCredential
);

/**
 * @route   POST /api/biometric/log
 * @desc    Webhook for devices to log attendance hits
 * @access  Public (Validated via deviceToken in body)
 */
router.post(
  '/log',
  biometricController.logAttendance
);

/**
 * @route   GET /api/biometric/logs
 * @desc    View biometric attendance logs
 * @access  Private (VIEW_BIOMETRIC_LOGS)
 */
router.get(
  '/logs',
  authenticate,
  requirePermission('VIEW_BIOMETRIC_LOGS'),
  biometricController.getLogs
);

export default router;
