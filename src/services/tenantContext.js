/**
 * Tenant Context Module
 * These functions parse local storage to locate tenant/school information.
 */

export const getPortalSchoolId = () => localStorage.getItem('currentSchoolId') || null;
export const getAdminSchoolId = () => localStorage.getItem('currentSchoolId') || null;

export const getStoredUser = () => {
    try {
        const userStr = localStorage.getItem('user');
        if (userStr) return JSON.parse(userStr);
    } catch (err) {
        console.error('Failed to parse user from localStorage', err);
    }
    return null;
};

export const isStoredUserSuperAdmin = () => {
    const user = getStoredUser();
    return user?.role === 'SUPER_ADMIN';
};

export const ensureSchoolId = () => getAdminSchoolId();

export const setAdminSchoolId = (id) => {
    if (id) localStorage.setItem('currentSchoolId', id);
};

export const setBranchId = (id) => {
    if (id) localStorage.setItem('currentBranchId', id);
};

export const clearAdminSchoolId = () => localStorage.removeItem('currentSchoolId');
export const clearBranchId = () => localStorage.removeItem('currentBranchId');
export const clearPortalSchoolId = () => localStorage.removeItem('currentSchoolId');
export const setPortalSchoolId = (id) => setAdminSchoolId(id);

export const getBranchId = () => localStorage.getItem('currentBranchId') || null;
