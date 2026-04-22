/**
 * useAppGate — thin hook that answers "is this app active for the current school?"
 *
 * It reads from the useApps hook (which owns the fetched state) and returns a
 * simple boolean. Use it inside any component or page that should respect the
 * Apps module toggle without re-fetching anything.
 *
 * Usage:
 *   const isGradebookActive = useAppGate('gradebook');
 *   if (!isGradebookActive) return <AppDisabledBanner app="Gradebook" />;
 *
 * Note: Super admins always get `true` — they configure apps and must never be
 * locked out of any module.
 */

import { useMemo } from 'react';
import { useApps } from './useApps';
import { useAuth } from './useAuth';

/**
 * @param {string} slug - The app slug to check (e.g. 'gradebook', 'library')
 * @param {string} [schoolId] - Optional schoolId override; uses auth context if omitted
 * @returns {boolean} - true if the app is active (or caller is SUPER_ADMIN)
 */
export const useAppGate = (slug, schoolId) => {
  const { user } = useAuth();

  // Derive schoolId from user if not explicitly passed
  const resolvedSchoolId = schoolId ?? user?.schoolId;

  const { apps, loading } = useApps(resolvedSchoolId);

  return useMemo(() => {
    // Super admins are never blocked
    if (user?.role === 'SUPER_ADMIN') return true;

    // While loading, optimistically allow (prevents flash of "disabled" on first render)
    if (loading) return true;

    const app = apps.find(a => a.slug === slug);
    return app?.isActive ?? false;
  }, [user?.role, loading, apps, slug]);
};
