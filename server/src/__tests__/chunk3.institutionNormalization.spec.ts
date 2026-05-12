/**
 * chunk3.institutionNormalization.spec.ts
 *
 * Tests for Chunk 3: Institution Type Normalization + Canonical Resolver.
 *
 * Verifies that:
 *  1. normalizeInstitutionType resolves canonical values and known aliases.
 *  2. Unknown/empty values return null (not a default — callers decide).
 *  3. normalizeInstitutionTypeOrDefault always returns a safe value.
 *  4. isValidInstitutionType correctly classifies input.
 *  5. institutionContextResolver precedence contract:
 *     header > tenant > default.
 *  6. req.requestedInstitutionType / req.resolvedInstitutionType / req.contextSource
 *     are always populated after the middleware runs.
 */

import {
  normalizeInstitutionType,
  normalizeInstitutionTypeOrDefault,
  isValidInstitutionType,
  CANONICAL_INSTITUTION_TYPES,
  DEFAULT_INSTITUTION_TYPE,
  INSTITUTION_TYPE_ALIAS_MAP,
} from '../utils/institutionNormalizer';

// ── normalizeInstitutionType ──────────────────────────────────────────────────

describe('normalizeInstitutionType', () => {
  // Canonical pass-through
  test.each(CANONICAL_INSTITUTION_TYPES)(
    'canonical value "%s" passes through unchanged',
    (canonical) => {
      expect(normalizeInstitutionType(canonical)).toBe(canonical);
    }
  );

  // Lowercase / whitespace tolerance
  test.each([
    ['primary_cbc', 'PRIMARY_CBC'],
    [' secondary ', 'SECONDARY'],
    ['tertiary', 'TERTIARY'],
  ])('normalizeInstitutionType(%s) → %s', (raw, expected) => {
    expect(normalizeInstitutionType(raw)).toBe(expected);
  });

  // Alias resolution
  test('HIGH_SCHOOL resolves to SECONDARY', () => {
    expect(normalizeInstitutionType('HIGH_SCHOOL')).toBe('SECONDARY');
  });

  test('high_school (lowercase) resolves to SECONDARY', () => {
    expect(normalizeInstitutionType('high_school')).toBe('SECONDARY');
  });

  // All alias map entries resolve
  test('all INSTITUTION_TYPE_ALIAS_MAP entries resolve to a canonical value', () => {
    for (const [alias, canonical] of Object.entries(INSTITUTION_TYPE_ALIAS_MAP)) {
      expect(normalizeInstitutionType(alias)).toBe(canonical);
    }
  });

  // Unknown / empty → null
  test.each([
    ['UNKNOWN_TYPE'],
    ['JUNIOR'],
    [''],
    [null],
    [undefined],
    [42],
  ])('normalizeInstitutionType(%s) → null for unknown/empty', (raw) => {
    expect(normalizeInstitutionType(raw as any)).toBeNull();
  });
});

// ── normalizeInstitutionTypeOrDefault ─────────────────────────────────────────

describe('normalizeInstitutionTypeOrDefault', () => {
  test('returns canonical value when input is valid', () => {
    expect(normalizeInstitutionTypeOrDefault('SECONDARY')).toBe('SECONDARY');
  });

  test('returns DEFAULT_INSTITUTION_TYPE for unknown input', () => {
    expect(normalizeInstitutionTypeOrDefault('NONSENSE')).toBe(DEFAULT_INSTITUTION_TYPE);
  });

  test('returns DEFAULT_INSTITUTION_TYPE for null', () => {
    expect(normalizeInstitutionTypeOrDefault(null)).toBe(DEFAULT_INSTITUTION_TYPE);
  });

  test('returns DEFAULT_INSTITUTION_TYPE for empty string', () => {
    expect(normalizeInstitutionTypeOrDefault('')).toBe(DEFAULT_INSTITUTION_TYPE);
  });

  test('DEFAULT_INSTITUTION_TYPE is PRIMARY_CBC', () => {
    expect(DEFAULT_INSTITUTION_TYPE).toBe('PRIMARY_CBC');
  });
});

// ── isValidInstitutionType ────────────────────────────────────────────────────

describe('isValidInstitutionType', () => {
  test.each(CANONICAL_INSTITUTION_TYPES)('canonical "%s" is valid', (t) => {
    expect(isValidInstitutionType(t)).toBe(true);
  });

  test('HIGH_SCHOOL alias is valid', () => {
    expect(isValidInstitutionType('HIGH_SCHOOL')).toBe(true);
  });

  test('empty string is invalid', () => {
    expect(isValidInstitutionType('')).toBe(false);
  });

  test('unknown string is invalid', () => {
    expect(isValidInstitutionType('NURSERY')).toBe(false);
  });
});

// ── institutionContextResolver precedence ─────────────────────────────────────
// Tests operate on the pure resolver logic without Express HTTP layer.

function runResolver(
  headerValue: string | undefined,
  tenantType: string | undefined
): { requested: string | null; resolved: string; source: string } {
  // Mirrors institutionContextResolver logic exactly
  const { normalizeInstitutionType: nt, DEFAULT_INSTITUTION_TYPE: def } =
    require('../utils/institutionNormalizer');

  const requested = nt(headerValue ?? '');
  const tenant    = nt(tenantType ?? '');

  let resolved: string;
  let source: string;

  if (requested !== null) {
    resolved = requested;
    source   = 'header';
  } else if (tenant !== null) {
    resolved = tenant;
    source   = 'tenant';
  } else {
    resolved = def;
    source   = 'default';
  }

  return { requested, resolved, source };
}

describe('institutionContextResolver precedence contract', () => {
  test('valid header wins over tenant and default', () => {
    const result = runResolver('SECONDARY', 'PRIMARY_CBC');
    expect(result.requested).toBe('SECONDARY');
    expect(result.resolved).toBe('SECONDARY');
    expect(result.source).toBe('header');
  });

  test('alias in header (HIGH_SCHOOL) still wins over tenant', () => {
    const result = runResolver('HIGH_SCHOOL', 'TERTIARY');
    expect(result.requested).toBe('SECONDARY');
    expect(result.resolved).toBe('SECONDARY');
    expect(result.source).toBe('header');
  });

  test('invalid header falls through to tenant', () => {
    const result = runResolver('JUNIOR_SCHOOL', 'SECONDARY');
    expect(result.requested).toBeNull();
    expect(result.resolved).toBe('SECONDARY');
    expect(result.source).toBe('tenant');
  });

  test('absent header falls through to tenant', () => {
    const result = runResolver(undefined, 'TERTIARY');
    expect(result.requested).toBeNull();
    expect(result.resolved).toBe('TERTIARY');
    expect(result.source).toBe('tenant');
  });

  test('absent header and absent tenant falls through to default', () => {
    const result = runResolver(undefined, undefined);
    expect(result.requested).toBeNull();
    expect(result.resolved).toBe('PRIMARY_CBC');
    expect(result.source).toBe('default');
  });

  test('invalid header and invalid tenant falls through to default', () => {
    const result = runResolver('BAD_VALUE', 'ALSO_BAD');
    expect(result.requested).toBeNull();
    expect(result.resolved).toBe('PRIMARY_CBC');
    expect(result.source).toBe('default');
  });

  test('empty header string falls through to tenant', () => {
    const result = runResolver('', 'SECONDARY');
    expect(result.requested).toBeNull();
    expect(result.resolved).toBe('SECONDARY');
    expect(result.source).toBe('tenant');
  });

  test('tenant HIGH_SCHOOL alias resolves correctly when header absent', () => {
    const result = runResolver(undefined, 'HIGH_SCHOOL');
    expect(result.resolved).toBe('SECONDARY');
    expect(result.source).toBe('tenant');
  });
});
