/**
 * Response Sanitization Middleware
 * Prevents sensitive information leakage in API responses
 */

import { Request, Response, NextFunction } from 'express';
import { escapeHtml } from '../utils/sanitization.util';

/**
 * Middleware to sanitize API responses
 * Prevents XSS and information leakage
 */
export const sanitizeResponse = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Store original json method
  const originalJson = res.json;

  // Override json method to sanitize response
  res.json = function (data: any) {
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Sanitize error responses
    if (data && !data.success && data.error) {
      // Remove sensitive information from error messages
      data.error = sanitizeErrorResponse(data.error, isDevelopment);
    }

    // Set security headers to prevent XSS
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Content-Security-Policy', "default-src 'self'");

    // Call original json method
    return originalJson.call(this, data);
  };

  next();
};

/**
 * Sanitize error response to prevent information leakage
 */
function sanitizeErrorResponse(
  error: any,
  isDevelopment: boolean
): Record<string, any> {
  const sanitized: Record<string, any> = {};

  // Always include message
  if (error.message) {
    sanitized.message = escapeHtml(typeof error.message === 'string' 
      ? error.message 
      : String(error.message));
  }

  // Include error code if present
  if (error.code) {
    sanitized.code = escapeHtml(String(error.code));
  }

  // Only include stack trace in development
  if (isDevelopment && error.stack) {
    sanitized.stack = escapeHtml(String(error.stack));
  }

  // Include validation details if present (safe to expose)
  if (error.details && Array.isArray(error.details)) {
    sanitized.details = error.details.map((detail: any) => {
      if (typeof detail === 'string') {
        return escapeHtml(detail);
      }
      return detail;
    });
  }

  // Filter out sensitive internal details
  const sensitivePatterns = ['password', 'token', 'secret', 'key', 'database', 'sql'];
  for (const [key, value] of Object.entries(error)) {
    if (!key.toLowerCase().includes('msg') &&
        !key.toLowerCase().includes('message') &&
        !key.toLowerCase().includes('code') &&
        !key.toLowerCase().includes('details') &&
        !sensitivePatterns.some((pattern) => key.toLowerCase().includes(pattern))) {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Middleware to prevent sensitive data in response headers
 */
export const hideSensitiveHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Remove server identification headers
  res.removeHeader('server');
  res.removeHeader('x-powered-by');
  res.removeHeader('x-aspnet-version');

  // Add security headers
  res.setHeader('Server', 'SecureServer/1.0');

  next();
};

/**
 * Middleware to sanitize outgoing cookies
 */
export const secureCookies = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.setHeader(
    'Set-Cookie',
    (res.getHeader('Set-Cookie') as string[])?.map((cookie) => {
      let secureCookie = cookie;

      // Add Secure flag (only in production)
      if (!isDevelopment && !secureCookie.includes('Secure')) {
        secureCookie += '; Secure';
      }

      // Add HttpOnly flag if not present
      if (!secureCookie.includes('HttpOnly')) {
        secureCookie += '; HttpOnly';
      }

      // Add SameSite if not present
      if (!secureCookie.includes('SameSite')) {
        secureCookie += '; SameSite=Strict';
      }

      return secureCookie;
    }) || []
  );

  next();
};

/**
 * Middleware to prevent MIME type sniffing
 */
export const preventMimeSniffing = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
};

/**
 * Middleware to add security-related response headers
 */
export const securityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  );

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Strict Transport Security (in production)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Feature Policy / Permissions Policy
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );

  next();
};
