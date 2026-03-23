/**
 * School Context Module
 * Helpers for reading and writing school/branch context in local storage.
 */

export const getCurrentSchoolId = () => null;

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

export const resolveCurrentSchoolId = () => null;

export const setCurrentSchoolId = (id) => { };
export const setBranchId = (id) => { };

export const clearCurrentSchoolId = () => { };
export const clearBranchId = () => { };

export const getBranchId = () => null;
