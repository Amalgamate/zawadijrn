import { Router, Request, Response } from 'express';
import { rateLimit } from '../middleware/enhanced-rateLimit.middleware';

const router = Router();

/**
 * @route   GET /health
 * @desc    Server health check
 * @access  Public
 */
router.get(
  '/',
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  (_req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Health check passed',
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      }
    });
  }
);

export default router;
