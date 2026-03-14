/**
 * Enhanced Rate Limiting Middleware
 * Implements progressive rate limiting for sensitive endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { logRateLimitExceeded } from '../utils/security-logging.util';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
    failedAttempts?: number;
  };
}

/**
 * In-memory store for rate limiting. 
 * NOTE: This resets on server restart and does not share state across multi-instance clusters.
 * TODO: Move to Redis for distributed rate limiting in production.
 */
const store: RateLimitStore = {};

/**
 * Get client identifier (IP address)
 */
const getClientId = (req: Request): string => {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    'unknown'
  );
};

/**
 * Standard rate limiter middleware
 */
export const rateLimit = (config: RateLimitConfig) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = getClientId(req);
    const key = `${clientId}:${req.path}`;
    const now = Date.now();

    // Initialize or get existing entry
    let entry = store[key];
    if (!entry || now > entry.resetAt) {
      entry = {
        count: 0,
        resetAt: now + config.windowMs,
        failedAttempts: 0
      };
    }

    entry.count++;
    store[key] = entry;

    // Set rate limit headers
    res.setHeader('RateLimit-Limit', config.maxRequests);
    res.setHeader('RateLimit-Remaining', Math.max(0, config.maxRequests - entry.count));
    res.setHeader('RateLimit-Reset', new Date(entry.resetAt).toISOString());

    if (entry.count > config.maxRequests) {
      logRateLimitExceeded(req, req.path, config.maxRequests, config.windowMs);
      
      return res.status(429).json({
        success: false,
        error: {
          message: config.message || 'Too many requests. Please try again later.'
        }
      });
    }

    next();
  };
};

/**
 * Progressive rate limiter that increases restrictions on repeated failures
 */
export const progressiveRateLimit = (config: RateLimitConfig) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = getClientId(req);
    const key = `${clientId}:${req.path}`;
    const now = Date.now();

    // Initialize or get existing entry
    let entry = store[key];
    if (!entry || now > entry.resetAt) {
      entry = {
        count: 0,
        resetAt: now + config.windowMs,
        failedAttempts: 0
      };
    }

    entry.count++;

    // Calculate dynamic limits based on failed attempts
    const failureMultiplier = Math.min(entry.failedAttempts || 0, 5);
    const adjustedLimit = Math.max(1, config.maxRequests / (1 + failureMultiplier));

    store[key] = entry;

    // Set rate limit headers
    res.setHeader('RateLimit-Limit', adjustedLimit);
    res.setHeader('RateLimit-Remaining', Math.max(0, adjustedLimit - entry.count));
    res.setHeader('RateLimit-Reset', new Date(entry.resetAt).toISOString());

    if (entry.count > adjustedLimit) {
      logRateLimitExceeded(req, req.path, adjustedLimit, config.windowMs);
      
      // Increase delay on subsequent requests
      const delay = Math.min(10000, 1000 * Math.pow(2, failureMultiplier));
      
      return res.status(429).json({
        success: false,
        error: {
          message: `Too many requests. Please try again after ${Math.ceil(delay / 1000)} seconds.`,
          retryAfter: Math.ceil(delay / 1000)
        },
        headers: {
          'Retry-After': Math.ceil(delay / 1000)
        }
      });
    }

    next();
  };
};

/**
 * IP-based rate limiter (for entire IP, not per endpoint)
 */
export const ipRateLimit = (config: RateLimitConfig) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = getClientId(req);
    const key = `ip:${clientId}`;
    const now = Date.now();

    let entry = store[key];
    if (!entry || now > entry.resetAt) {
      entry = {
        count: 0,
        resetAt: now + config.windowMs
      };
    }

    entry.count++;
    store[key] = entry;

    res.setHeader('RateLimit-Limit', config.maxRequests);
    res.setHeader('RateLimit-Remaining', Math.max(0, config.maxRequests - entry.count));
    res.setHeader('RateLimit-Reset', new Date(entry.resetAt).toISOString());

    if (entry.count > config.maxRequests) {
      logRateLimitExceeded(req, 'global', config.maxRequests, config.windowMs);
      
      return res.status(429).json({
        success: false,
        error: {
          message: config.message || 'Too many requests from this IP. Please try again later.'
        }
      });
    }

    next();
  };
};

/**
 * Authentication rate limiter (specifically for login/register attempts)
 */
export const authRateLimit = (
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = getClientId(req);
    const identifier = req.body?.email || req.body?.username || clientId;
    const key = `auth:${clientId}:${identifier}`;
    const now = Date.now();

    let entry = store[key];
    if (!entry || now > entry.resetAt) {
      entry = {
        count: 0,
        resetAt: now + windowMs,
        failedAttempts: 0
      };
    }

    entry.count++;

    res.setHeader('RateLimit-Limit', maxAttempts);
    res.setHeader('RateLimit-Remaining', Math.max(0, maxAttempts - entry.count));
    res.setHeader('RateLimit-Reset', new Date(entry.resetAt).toISOString());

    if (entry.count > maxAttempts) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      
      logRateLimitExceeded(req, `${req.path} (${identifier})`, maxAttempts, windowMs);

      return res.status(429).json({
        success: false,
        error: {
          message: `Too many authentication attempts. Please try again in ${retryAfter} seconds.`,
          retryAfter
        }
      });
    }

    store[key] = entry;
    next();
  };
};

/**
 * Track failed authentication attempts
 */
export const recordAuthFailure = (email: string, clientId: string): void => {
  const key = `auth:${clientId}:${email}`;
  const entry = store[key];
  
  if (entry) {
    entry.failedAttempts = (entry.failedAttempts || 0) + 1;
  }
};

/**
 * Clear rate limit for specific key (e.g., after successful auth)
 */
export const clearRateLimit = (clientId: string, identifier: string, type: string = 'auth'): void => {
  const key = `${type}:${clientId}:${identifier}`;
  delete store[key];
};

/**
 * Cleanup old entries periodically to prevent memory leaks
 */
export const cleanupRateLimitStore = (): void => {
  const now = Date.now();
  let cleaned = 0;

  for (const key in store) {
    if (store[key].resetAt < now) {
      delete store[key];
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`🧹 Rate limit store cleanup: removed ${cleaned} expired entries`);
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
