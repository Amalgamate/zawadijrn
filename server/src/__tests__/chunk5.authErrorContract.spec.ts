/**
 * chunk5.authErrorContract.spec.ts
 *
 * Tests for Chunk 5: Structured Auth/Error Contract Completion.
 *
 * Verifies:
 *  1. All denial codes are representable with correct HTTP status.
 *  2. errorHandler emits RFC payload: success, code, message, requestId.
 *  3. ROLE_FORBIDDEN includes requiredRoles + userRoles.
 *  4. INSTITUTION_FORBIDDEN includes requested + resolved institution type.
 *  5. CONTEXT_MISMATCH is a distinct code carrying institution context.
 *  6. Guards never call res.status() directly — all denials via next(ApiError).
 *  7. requestId always appears in the error response.
 *  8. Fields absent from ApiError are omitted from the response (no undefined leaks).
 */

import { ApiError } from '../utils/error.util';
import { errorHandler } from '../middleware/error.middleware';
import type { Request, Response, NextFunction } from 'express';

// ── Test helpers ──────────────────────────────────────────────────────────────

function makeReq(overrides: Record<string, any> = {}): Request {
  return {
    method: 'GET',
    originalUrl: '/api/test',
    headers: {},
    ip: '127.0.0.1',
    requestId: 'req_test_001',
    ...overrides,
  } as unknown as Request;
}

function makeRes() {
  let capturedBody: any;
  let capturedStatus = 200;
  const json = jest.fn((body: any) => { capturedBody = body; return res; });
  const status = jest.fn((code: number) => { capturedStatus = code; return res; });
  const setHeader = jest.fn();
  const res = { json, status, setHeader } as unknown as Response;
  return { res, body: () => capturedBody, httpStatus: () => capturedStatus };
}

const noop: NextFunction = jest.fn();

// ── Code → status mapping ─────────────────────────────────────────────────────

describe('ApiError – code / statusCode contract', () => {
  const cases: Array<[string, number]> = [
    ['AUTH_REQUIRED',        401],
    ['INVALID_TOKEN',        401],
    ['TOKEN_EXPIRED',        401],
    ['ROLE_FORBIDDEN',       403],
    ['INSTITUTION_FORBIDDEN',403],
    ['CONTEXT_MISMATCH',     403],
    ['ACCESS_DENIED',        403],
  ];

  test.each(cases)('code "%s" → HTTP %d', (code, status) => {
    const err = new ApiError(status, 'test').withCode(code);
    expect(err.statusCode).toBe(status);
    expect(err.code).toBe(code);
  });
});

// ── errorHandler payload shape ────────────────────────────────────────────────

describe('errorHandler – RFC payload', () => {
  test('basic ApiError emits { success, code, message, requestId }', () => {
    const { res, body, httpStatus } = makeRes();
    errorHandler(
      new ApiError(401, 'Authentication required').withCode('AUTH_REQUIRED'),
      makeReq(), res, noop
    );
    expect(httpStatus()).toBe(401);
    expect(body()).toMatchObject({
      success:   false,
      code:      'AUTH_REQUIRED',
      message:   'Authentication required',
      requestId: 'req_test_001',
    });
  });

  test('ROLE_FORBIDDEN includes requiredRoles and userRoles', () => {
    const { res, body } = makeRes();
    errorHandler(
      new ApiError(403, 'Access denied')
        .withCode('ROLE_FORBIDDEN')
        .withRoles(['ADMIN', 'SUPER_ADMIN'], ['TEACHER']),
      makeReq(), res, noop
    );
    expect(body().requiredRoles).toEqual(['ADMIN', 'SUPER_ADMIN']);
    expect(body().userRoles).toEqual(['TEACHER']);
  });

  test('INSTITUTION_FORBIDDEN includes requested + resolved types', () => {
    const { res, body } = makeRes();
    errorHandler(
      new ApiError(403, 'Wrong institution')
        .withCode('INSTITUTION_FORBIDDEN')
        .withInstitutionContext('SECONDARY', 'PRIMARY_CBC'),
      makeReq(), res, noop
    );
    expect(body().requestedInstitutionType).toBe('SECONDARY');
    expect(body().resolvedInstitutionType).toBe('PRIMARY_CBC');
  });

  test('null requestedInstitutionType is present in body (not omitted)', () => {
    const { res, body } = makeRes();
    errorHandler(
      new ApiError(403, 'Wrong institution')
        .withCode('INSTITUTION_FORBIDDEN')
        .withInstitutionContext(null, 'PRIMARY_CBC'),
      makeReq(), res, noop
    );
    expect(body()).toHaveProperty('requestedInstitutionType');
    expect(body().requestedInstitutionType).toBeNull();
  });

  test('CONTEXT_MISMATCH carries institution context', () => {
    const { res, body } = makeRes();
    errorHandler(
      new ApiError(403, 'Context mismatch')
        .withCode('CONTEXT_MISMATCH')
        .withInstitutionContext('SECONDARY', 'PRIMARY_CBC'),
      makeReq(), res, noop
    );
    expect(body().code).toBe('CONTEXT_MISMATCH');
    expect(body().requestedInstitutionType).toBe('SECONDARY');
  });

  test('fields absent from ApiError are not present in body', () => {
    const { res, body } = makeRes();
    errorHandler(
      new ApiError(403, 'Access denied').withCode('ACCESS_DENIED'),
      makeReq(), res, noop
    );
    expect(body()).not.toHaveProperty('requiredRoles');
    expect(body()).not.toHaveProperty('userRoles');
    expect(body()).not.toHaveProperty('requestedInstitutionType');
    expect(body()).not.toHaveProperty('resolvedInstitutionType');
  });

  test('requestId is present even when absent from req', () => {
    const { res, body } = makeRes();
    const req = makeReq();
    delete (req as any).requestId;
    errorHandler(new ApiError(401, 'Auth required').withCode('AUTH_REQUIRED'), req, res, noop);
    expect(body()).toHaveProperty('requestId');
  });

  test('5xx uses INTERNAL_ERROR and does not leak stack in body', () => {
    const { res, body, httpStatus } = makeRes();
    errorHandler(new ApiError(500, 'DB unavailable'), makeReq(), res, noop);
    expect(httpStatus()).toBe(500);
    expect(body().code).toBe('INTERNAL_ERROR');
    expect(body()).not.toHaveProperty('stack');
  });

  test('non-ApiError defaults to 500 INTERNAL_ERROR', () => {
    const { res, body, httpStatus } = makeRes();
    errorHandler(new Error('crash'), makeReq(), res, noop);
    expect(httpStatus()).toBe(500);
    expect(body().code).toBe('INTERNAL_ERROR');
  });

  test('JsonWebTokenError → 401 INVALID_TOKEN', () => {
    const { res, body, httpStatus } = makeRes();
    const err = Object.assign(new Error('jwt malformed'), { name: 'JsonWebTokenError' });
    errorHandler(err, makeReq(), res, noop);
    expect(httpStatus()).toBe(401);
    expect(body().code).toBe('INVALID_TOKEN');
  });

  test('TokenExpiredError → 401 TOKEN_EXPIRED', () => {
    const { res, body, httpStatus } = makeRes();
    const err = Object.assign(new Error('jwt expired'), { name: 'TokenExpiredError' });
    errorHandler(err, makeReq(), res, noop);
    expect(httpStatus()).toBe(401);
    expect(body().code).toBe('TOKEN_EXPIRED');
  });
});

// ── Guard pipeline: never touches res directly ────────────────────────────────

import { requireRole, requirePermission, requireAnyPermission } from '../middleware/permissions.middleware';
import { requireInstitutionType } from '../middleware/requireInstitutionType.middleware';
import type { AuthRequest } from '../middleware/permissions.middleware';

function makeAuthReq(overrides: Record<string, any> = {}): AuthRequest {
  return {
    method: 'GET',
    originalUrl: '/api/test',
    headers: {},
    requestId: 'req_guard_test',
    ...overrides,
  } as unknown as AuthRequest;
}

function makeMockRes() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  return { status, json } as unknown as Response;
}

describe('Guard denials: res is never touched, only next(ApiError)', () => {
  test('requireRole: denial via next(ApiError), res untouched', () => {
    const next = jest.fn();
    const res  = makeMockRes();
    requireRole(['ADMIN'])(
      makeAuthReq({ user: { role: 'PARENT', roles: ['PARENT'] } }) as any,
      res, next
    );
    expect(res.status).not.toHaveBeenCalled();
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe('ROLE_FORBIDDEN');
  });

  test('requireRole: no-user path → 401 AUTH_REQUIRED', () => {
    const next = jest.fn();
    const res  = makeMockRes();
    requireRole(['ADMIN'])(makeAuthReq() as any, res, next);
    expect(res.status).not.toHaveBeenCalled();
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('AUTH_REQUIRED');
  });

  test('requirePermission: denial via next(ApiError), res untouched', () => {
    const next = jest.fn();
    const res  = makeMockRes();
    requirePermission('DELETE_USER')(
      makeAuthReq({ user: { role: 'PARENT', roles: ['PARENT'] } }) as any,
      res, next
    );
    expect(res.status).not.toHaveBeenCalled();
    expect((next as jest.Mock).mock.calls[0][0]).toBeInstanceOf(ApiError);
  });

  test('requireAnyPermission: denial via next(ApiError), res untouched', () => {
    const next = jest.fn();
    const res  = makeMockRes();
    requireAnyPermission(['SYSTEM_SETTINGS', 'GRADING_SYSTEM'])(
      makeAuthReq({ user: { role: 'PARENT', roles: ['PARENT'] } }) as any,
      res, next
    );
    expect(res.status).not.toHaveBeenCalled();
    expect((next as jest.Mock).mock.calls[0][0]).toBeInstanceOf(ApiError);
  });

  test('requireInstitutionType: denial via next(ApiError), res untouched', () => {
    const next = jest.fn();
    const res  = makeMockRes();
    requireInstitutionType('SECONDARY')(
      makeAuthReq({ resolvedInstitutionType: 'PRIMARY_CBC', requestedInstitutionType: null }) as any,
      res, next
    );
    expect(res.status).not.toHaveBeenCalled();
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe('INSTITUTION_FORBIDDEN');
  });
});
