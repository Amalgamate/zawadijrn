import { useState, useEffect, useCallback } from 'react';
import { appsApi } from '../services/api/apps.api';
import { useAuth } from './useAuth';

export const useApps = (schoolId) => {
  const { user, updateUser } = useAuth();
  const [apps, setApps]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [toggling, setToggling] = useState({}); // slug -> bool

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const syncAuthApps = useCallback((nextApps) => {
    if (!user || !Array.isArray(nextApps)) return;

    const activeApps = nextApps
      .filter(app => app.isActive)
      .map(app => app.slug)
      .sort();
    const currentActiveApps = [...(user?.activeApps || [])].sort();

    if (
      activeApps.length === currentActiveApps.length &&
      activeApps.every((slug, index) => slug === currentActiveApps[index])
    ) {
      return;
    }

    updateUser({ activeApps });
  }, [updateUser, user]);

  const fetchApps = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await appsApi.list(schoolId);
      const nextApps = res.data.data || [];
      setApps(nextApps);
      syncAuthApps(nextApps);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load apps');
    } finally {
      setLoading(false);
    }
  }, [schoolId, syncAuthApps]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  /** Toggle isActive — optimistic update */
  const toggle = useCallback(async (slug) => {
    if (!schoolId) return;
    setToggling(t => ({ ...t, [slug]: true }));

    // Optimistic
    setApps(prev => {
      const nextApps = prev.map(a =>
        a.slug === slug ? { ...a, isActive: !a.isActive } : a
      );
      syncAuthApps(nextApps);
      return nextApps;
    });

    try {
      const res = await appsApi.toggle(slug, schoolId);
      // Reconcile with server truth
      setApps(prev => {
        const nextApps = prev.map(a =>
          a.slug === slug ? { ...a, isActive: res.data.data.isActive } : a
        );
        syncAuthApps(nextApps);
        return nextApps;
      });
    } catch (err) {
      // Revert optimistic update
      setApps(prev => {
        const nextApps = prev.map(a =>
          a.slug === slug ? { ...a, isActive: !a.isActive } : a
        );
        syncAuthApps(nextApps);
        return nextApps;
      });
      throw err;
    } finally {
      setToggling(t => ({ ...t, [slug]: false }));
    }
  }, [schoolId, syncAuthApps]);

  /** Set mandatory (SUPER_ADMIN only) */
  const setMandatory = useCallback(async (slug, isMandatory) => {
    if (!schoolId || !isSuperAdmin) return;
    await appsApi.setMandatory(slug, schoolId, isMandatory);
    setApps(prev => prev.map(a =>
      a.slug === slug ? { ...a, isMandatory } : a
    ));
  }, [schoolId, isSuperAdmin]);

  /** Set visibility (SUPER_ADMIN only) */
  const setVisibility = useCallback(async (slug, isVisible) => {
    if (!schoolId || !isSuperAdmin) return;
    await appsApi.setVisibility(slug, schoolId, isVisible);
    setApps(prev => prev.map(a =>
      a.slug === slug ? { ...a, isVisible } : a
    ));
  }, [schoolId, isSuperAdmin]);

  /** Group apps by category */
  const appsByCategory = apps.reduce((acc, app) => {
    if (!acc[app.category]) acc[app.category] = [];
    acc[app.category].push(app);
    return acc;
  }, {});

  const categories = Object.keys(appsByCategory).sort();

  return {
    apps,
    appsByCategory,
    categories,
    loading,
    error,
    toggling,
    isSuperAdmin,
    toggle,
    setMandatory,
    setVisibility,
    refresh: fetchApps,
  };
};
