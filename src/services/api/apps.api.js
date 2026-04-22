import axiosInstance from './axiosConfig';

const BASE = '/settings/apps';

export const appsApi = {
  /** Fetch all apps with current state for a school */
  list: (schoolId) =>
    axiosInstance.get(BASE, { params: { schoolId } }),

  /** Toggle isActive for an app */
  toggle: (slug, schoolId) =>
    axiosInstance.patch(`${BASE}/${slug}/toggle`, { schoolId }),

  /** Set mandatory flag (SUPER_ADMIN only) */
  setMandatory: (slug, schoolId, isMandatory) =>
    axiosInstance.patch(`${BASE}/${slug}/mandatory`, { schoolId, isMandatory }),

  /** Set visibility flag (SUPER_ADMIN only) */
  setVisibility: (slug, schoolId, isVisible) =>
    axiosInstance.patch(`${BASE}/${slug}/visibility`, { schoolId, isVisible }),

  /** Full audit log (SUPER_ADMIN only) */
  getAuditLog: (schoolId) =>
    axiosInstance.get(`${BASE}/audit`, { params: { schoolId } }),

  /** Own-actions audit log */
  getMyAuditLog: (schoolId) =>
    axiosInstance.get(`${BASE}/audit/mine`, { params: { schoolId } }),
};
