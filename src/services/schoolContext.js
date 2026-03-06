/**
 * School Context Module
 * Helpers for reading and writing school/branch context in local storage.
 */

export const getCurrentSchoolId = () => localStorage.getItem('currentSchoolId') || null;

export const getStoredUser = () => {
    try {
        const userStr = localStorage.getItem('user');
        if (userStr) return JSON.parse(userStr);
    } catch (err) {
        console.error('Failed to parse user from localStorage', err);
    }
    return null;
};

export const isSuperAdminUser = () => {
    const user = getStoredUser();
    return user?.role === 'SUPER_ADMIN';
};

export const resolveCurrentSchoolId = () => getCurrentSchoolId();

export const setCurrentSchoolId = (id) => {
    if (id) localStorage.setItem('currentSchoolId', id);
};

export const setBranchId = (id) => {
    if (id) localStorage.setItem('currentBranchId', id);
};

export const clearCurrentSchoolId = () => localStorage.removeItem('currentSchoolId');
export const clearBranchId = () => localStorage.removeItem('currentBranchId');

export const getBranchId = () => localStorage.getItem('currentBranchId') || null;
