import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/error.util';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal server error';

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  // Never expose stack traces in responses (security best practice)
  // Even in development, stack traces should only be in logs
  const isDevMode = process.env.NODE_ENV === 'development' && process.env.DEBUG_ERRORS === 'true';
  
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(isDevMode && { stack: err.stack })
    }
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route not found`
    }
  });
};
