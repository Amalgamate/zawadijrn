/**
 * requestId.middleware.ts
 *
 * Attaches a short unique request ID to every incoming request.
 * - Written to req.requestId so all downstream middleware and error handlers can reference it.
 * - Echoed in the X-Request-Id response header so clients can correlate logs.
 *
 * Format: req_<16 hex chars> — short enough to include in log lines, unique enough for correlation.
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const id = `req_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  (req as any).requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
};
