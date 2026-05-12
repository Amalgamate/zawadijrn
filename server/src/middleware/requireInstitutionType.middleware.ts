/**
 * requireInstitutionType.middleware.ts
 *
 * Guard that gates a route to one or more canonical institution types.
 * Reads req.resolvedInstitutionType set by institutionContextResolver — never
 * re-computes institution type from headers or req.school directly.
 *
 * Denials are routed through next(ApiError) so the global error handler
 * emits the RFC-compliant payload (code, requestId, resolved/requested types).
 *
 * Mount institutionContextResolver before any route using this guard.
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from './permissions.middleware';
import { ApiError } from '../utils/error.util';
import { CanonicalInstitutionType } from '../utils/institutionNormalizer';

export const requireInstitutionType = (
  allowed: CanonicalInstitutionType | CanonicalInstitutionType[]
) => {
  const allowedSet = new Set(Array.isArray(allowed) ? allowed : [allowed]);

  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    const resolved = req.resolvedInstitutionType ?? '';

    if (allowedSet.has(resolved as CanonicalInstitutionType)) {
      next();
      return;
    }

    next(
      new ApiError(
        403,
        `This endpoint is only available for ${[...allowedSet].join(' / ')} institutions.`
      )
        .withCode('INSTITUTION_FORBIDDEN')
        .withInstitutionContext(
          req.requestedInstitutionType ?? null,
          resolved
        )
    );
  };
};
