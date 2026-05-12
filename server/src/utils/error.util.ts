/**
 * error.util.ts
 *
 * ApiError is the single error class used throughout the server.
 * Extended with optional structured fields so the error handler can emit
 * the RFC-compliant 401/403 schema without each throw site needing to
 * build the full response shape.
 *
 * Fluent builder methods keep throw sites readable:
 *   throw new ApiError(403, 'Access denied')
 *     .withCode('ROLE_FORBIDDEN')
 *     .withRoles(['ADMIN'], ['TEACHER']);
 */

export class ApiError extends Error {
  statusCode:               number;
  isOperational:            boolean;

  // RFC structured fields (all optional — populated by builder methods or guards)
  code?:                    string;
  requiredRoles?:           string[];
  userRoles?:               string[];
  requestedInstitutionType?: string | null;
  resolvedInstitutionType?: string;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode    = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  /** Set the machine-readable denial code (AUTH_REQUIRED, ROLE_FORBIDDEN, etc.) */
  withCode(code: string): this {
    this.code = code;
    return this;
  }

  /** Attach role context — what was required vs what the user has */
  withRoles(required: string[], userRoles: string[]): this {
    this.requiredRoles = required;
    this.userRoles     = userRoles;
    return this;
  }

  /** Attach institution context for INSTITUTION_FORBIDDEN / CONTEXT_MISMATCH payloads */
  withInstitutionContext(
    requested: string | null | undefined,
    resolved:  string
  ): this {
    this.requestedInstitutionType = requested ?? null;
    this.resolvedInstitutionType  = resolved;
    return this;
  }
}
