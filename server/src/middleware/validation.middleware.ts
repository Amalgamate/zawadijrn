/**
 * Request Validation Middleware
 * Validates request body, query, and params against Zod schemas
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from '../utils/error.util';
import { logInvalidInput } from '../utils/security-logging.util';

export type ValidationSource = 'body' | 'query' | 'params';

/**
 * Create a validation middleware
 */
export const validate = (
  schema: ZodSchema,
  source: ValidationSource = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToValidate = getDataFromSource(req, source);
      
      const validated = schema.parse(dataToValidate);
      
      // Replace the source data with validated data
      setDataInSource(req, source, validated);
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message
        }));

        // Log security event
        const userId = (req as any).user?.userId;
        messages.forEach((msg) => {
          logInvalidInput(req, userId, msg.field, msg.message);
        });

        return next(
          new ApiError(
            400,
            'Validation failed',
            true
          )
        );
      }
      next(error);
    }
  };
};

/**
 * Extract data from request based on source
 */
function getDataFromSource(req: Request, source: ValidationSource): any {
  switch (source) {
    case 'body':
      return req.body;
    case 'query':
      return req.query;
    case 'params':
      return req.params;
    default:
      return req.body;
  }
}

/**
 * Set validated data back to request
 */
function setDataInSource(req: Request, source: ValidationSource, data: any): void {
  switch (source) {
    case 'body':
      req.body = data;
      break;
    case 'query':
      req.query = data;
      break;
    case 'params':
      req.params = data;
      break;
  }
}

/**
 * Multi-validation middleware (validate multiple sources)
 */
export const validateMultiple = (
  validations: Array<{ schema: ZodSchema; source: ValidationSource }>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      for (const { schema, source } of validations) {
        const dataToValidate = getDataFromSource(req, source);
        const validated = schema.parse(dataToValidate);
        setDataInSource(req, source, validated);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message
        }));

        const userId = (req as any).user?.userId;
        messages.forEach((msg) => {
          logInvalidInput(req, userId, msg.field, msg.message);
        });

        return next(
          new ApiError(
            400,
            'Validation failed',
            true
          )
        );
      }
      next(error);
    }
  };
};
