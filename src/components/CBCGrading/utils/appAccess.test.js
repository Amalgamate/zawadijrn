import { describe, expect, it } from 'vitest';
import { getRequiredAppForPage, hasAppAccess, hasPageAccess } from './appAccess';

describe('appAccess', () => {
  it('maps guarded pages to the correct app slug', () => {
    expect(getRequiredAppForPage('planner-calendar')).toBe('planner');
    expect(getRequiredAppForPage('planner-timetable')).toBe('timetable');
    expect(getRequiredAppForPage('assess-summative-report')).toBe('exams');
    expect(getRequiredAppForPage('inventory-items')).toBe('inventory');
  });

  it('treats unknown pages as unrestricted', () => {
    expect(getRequiredAppForPage('dashboard')).toBeNull();
    expect(hasPageAccess({ role: 'ADMIN', activeApps: [] }, 'dashboard')).toBe(true);
  });

  it('allows super admins through every app gate', () => {
    expect(hasAppAccess({ role: 'SUPER_ADMIN', activeApps: [] }, 'inventory')).toBe(true);
    expect(hasPageAccess({ role: 'SUPER_ADMIN', activeApps: [] }, 'inventory-items')).toBe(true);
  });

  it('blocks disabled module pages for non-super-admin users', () => {
    const user = { role: 'ADMIN', activeApps: ['student-registry', 'attendance'] };
    expect(hasPageAccess(user, 'learners-list')).toBe(true);
    expect(hasPageAccess(user, 'attendance-daily')).toBe(true);
    expect(hasPageAccess(user, 'inventory-items')).toBe(false);
    expect(hasPageAccess(user, 'assess-summative-report')).toBe(false);
  });
});
