/**
 * Async Handler Utility
 * Wraps async route handlers to catch errors and pass to error middleware
 * 
 * @module utils/async.util
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Type for async route handler functions
 */
type AsyncFunction = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

/**
 * Wraps an async function to catch any errors and pass them to next()
 * This eliminates the need for try-catch blocks in every controller
 * 
 * @param fn - Async function to wrap
 * @returns Wrapped function that catches errors
 * 
 * @example
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await User.find();
 *   res.json(users);
 * }));
 */
export const asyncHandler = (fn: AsyncFunction) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
