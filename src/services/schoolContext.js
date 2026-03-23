/**
 * School Context Module
 * Helpers for reading and writing school/branch context in local storage.
 */

export const getCurrentSchoolId = () => {
    const user = getStoredUser();
    return localStorage.getItem('currentSchoolId') || user?.schoolId || user?.school?.id || null;
};

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

export const resolveCurrentSchoolId = () => {
    return getCurrentSchoolId();
};

export const setCurrentSchoolId = (id) => {
    if (id) {
        localStorage.setItem('currentSchoolId', id);
    } else {
        localStorage.removeItem('currentSchoolId');
    }
};

export const setBranchId = (id) => {
    if (id) {
        localStorage.setItem('currentBranchId', id);
    } else {
        localStorage.removeItem('currentBranchId');
    }
};

export const clearCurrentSchoolId = () => {
    localStorage.removeItem('currentSchoolId');
};

export const clearBranchId = () => {
    localStorage.removeItem('currentBranchId');
};

export const getBranchId = () => {
    return localStorage.getItem('currentBranchId');
};
