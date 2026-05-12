/**
 * institutionContextResolver.middleware.ts
 *
 * Resolves institution context exactly once per request and attaches three
 * canonical fields to req:
 *
 *   req.requestedInstitutionType  — what the client asked for (header), or null
 *   req.resolvedInstitutionType   — the canonical value to use downstream
 *   req.contextSource             — how the value was resolved
 *
 * Precedence contract (highest → lowest):
 *   1. Requested context  — x-institution-type header, if valid
 *   2. Tenant context     — req.school.institutionType, if set and valid
 *   3. Default            — PRIMARY_CBC
 *
 * All downstream code (controllers, guards, queries) must read
 * req.resolvedInstitutionType exclusively. No re-computation elsewhere.
 *
 * Mount this middleware after schoolContextMiddleware so req.school is populated.
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from './permissions.middleware';
import {
  normalizeInstitutionType,
  normalizeInstitutionTypeOrDefault,
  DEFAULT_INSTITUTION_TYPE,
  CanonicalInstitutionType,
} from '../utils/institutionNormalizer';
import logger from '../utils/logger';

export type ContextSource = 'header' | 'tenant' | 'default';

// Augment the Express Request type with the three resolver fields.
declare global {
  namespace Express {
    interface Request {
      contextSource?: ContextSource;
    }
  }
}

export const institutionContextResolver = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void => {
  // ── 1. Requested context (header) ──────────────────────────────────────────
  const headerRaw = req.headers['x-institution-type'];
  const altHeaderRaw = req.headers['x-school-context'] || req.headers['x-context'];
  const queryRaw =
    (req.query?.institutionType as string | undefined) ||
    (req.query?.institution_type as string | undefined) ||
    (req.query?.context as string | undefined);
  const bodyRaw =
    (req.body?.institutionType as string | undefined) ||
    (req.body?.institution_type as string | undefined) ||
    (req.body?.context as string | undefined);
  const headerStr = Array.isArray(headerRaw) ? headerRaw[0] : (headerRaw ?? '');
  const altHeaderStr = Array.isArray(altHeaderRaw) ? altHeaderRaw[0] : (altHeaderRaw ?? '');
  const requested = normalizeInstitutionType(headerStr) ||
    normalizeInstitutionType(altHeaderStr) ||
    normalizeInstitutionType(queryRaw || '') ||
    normalizeInstitutionType(bodyRaw || '');

  req.requestedInstitutionType = requested; // null when absent/invalid

  // ── 2. Tenant context (from schoolContextMiddleware) ───────────────────────
  const tenantRaw  = req.school?.institutionType ?? null;
  const tenantType = normalizeInstitutionType(tenantRaw);

  // ── 3. Resolve with precedence ─────────────────────────────────────────────
  let resolved: CanonicalInstitutionType;
  let source: ContextSource;

  if (requested !== null) {
    resolved = requested;
    source   = 'header';
  } else if (tenantType !== null) {
    resolved = tenantType;
    source   = 'tenant';
  } else {
    resolved = DEFAULT_INSTITUTION_TYPE;
    source   = 'default';
  }

  req.resolvedInstitutionType = resolved;
  req.contextSource           = source;

  logger.debug(
    {
      requestId:   req.requestId,
      requested,
      tenant:      tenantType,
      resolved,
      source,
    },
    '[InstitutionContext] resolved'
  );

  next();
};
