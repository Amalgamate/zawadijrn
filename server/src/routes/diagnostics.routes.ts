import { Router, Request, Response } from 'express';
import { rateLimit } from '../middleware/enhanced-rateLimit.middleware';

const router = Router();

/**
 * Diagnostic endpoint to debug CORS and connection issues from mobile
 * Shows exactly what the client is sending
 */
router.get(
  '/',
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  (_req: Request, res: Response) => {
    const clientInfo = {
      // Request headers
      origin: _req.get('origin') || 'NOT_SET',
      referer: _req.get('referer') || 'NOT_SET',
      userAgent: _req.get('user-agent') || 'NOT_SET',
      host: _req.get('host') || 'NOT_SET',
      
      // Request details
      method: _req.method,
      protocol: _req.protocol,
      hostname: _req.hostname,
      ip: _req.ip,
      
      // Server info
      environment: process.env.NODE_ENV || 'development',
      deployment: process.env.DEPLOYMENT_DOMAIN || 'local',
      timestamp: new Date().toISOString(),
      
      // CORS check result
      corsResult: {
        originSent: _req.get('origin'),
        willAllowByPattern: checkOriginPattern(_req.get('origin') || ''),
      }
    };

    res.json({
      success: true,
      message: 'Diagnostic info from mobile app',
      data: clientInfo
    });
  }
);

/**
 * Mirror the CORS origin checking logic
 */
function checkOriginPattern(origin: string): string {
  if (!origin) return 'NO_ORIGIN_HEADER';
  
  const allowedOrigins = [
    process.env.FRONTEND_URL || '',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ].filter(Boolean);

  if (allowedOrigins.includes(origin)) return 'ALLOWED_IN_LIST';
  if (origin.startsWith('http://localhost:')) return 'ALLOWED_LOCALHOST_PORT';
  if (/^https?:\/\/.*\.localhost(:\d+)?$/.test(origin)) return 'ALLOWED_LOCALHOST_SUBDOMAIN';
  if (origin.startsWith('http://127.')) return 'ALLOWED_LOCALHOST_IP';
  if (origin === 'capacitor://localhost') return 'ALLOWED_CAPACITOR_LOCALHOST';
  if (origin?.startsWith('capacitor://')) return 'ALLOWED_CAPACITOR_PATTERN';
  if (origin === 'file://localhost') return 'ALLOWED_FILE_LOCALHOST';
  if (origin?.startsWith('file://')) return 'ALLOWED_FILE_PATTERN';
  
  return 'NOT_ALLOWED';
}

export default router;
