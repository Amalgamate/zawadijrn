import axios from 'axios';
import { getPortalSchoolId, isStoredUserSuperAdmin, ensureSchoolId } from './tenantContext';

// Use environment variable for API URL or fall back to automatic discovery for production stability
const getApiBaseUrl = () => {
    // 1. Explicit environment variable (Best for Vercel/Production)
    if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;

    // 2. Automatic discovery if we are in production on a specific domain
    if (window.location.hostname !== 'localhost') {
        // If we're on zawadijrn.vercel.app, and the API is on zawadi-api...run.app
        // we might not be able to "guess" it easily without the env var.
        // But if we are proxying via Nginx or similar, this works.
        return `${window.location.origin}/api`;
    }

    // 3. Local development fallback
    return 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for API calls
axiosInstance.interceptors.request.use(
    async (config) => {
        const token = localStorage.getItem('token');
        const isSuperAdmin = isStoredUserSuperAdmin();
        // Use ensureSchoolId for robust tenant recovery
        const currentSchoolId = isSuperAdmin ? ensureSchoolId() : null;
        const portalSchoolId = getPortalSchoolId();

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        if (isSuperAdmin && currentSchoolId) {
            config.headers['X-School-Id'] = currentSchoolId;
        }

        if (!isSuperAdmin && portalSchoolId) {
            config.headers['X-Portal-School-Id'] = portalSchoolId;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for API calls
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refreshToken');

            if (refreshToken) {
                try {
                    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                        refreshToken,
                    });

                    if (response.status === 200) {
                        const { token, refreshToken: newRefreshToken } = response.data;
                        localStorage.setItem('token', token);
                        localStorage.setItem('refreshToken', newRefreshToken);

                        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                        originalRequest.headers['Authorization'] = `Bearer ${token}`;

                        return axiosInstance(originalRequest);
                    }
                } catch (refreshError) {
                    console.error('Refresh token failed:', refreshError);
                    // Token refresh failed - logout user
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user');
                    localStorage.removeItem('currentSchoolId');
                    window.location.href = '/';
                }
            } else {
                // No refresh token - logout user
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                localStorage.removeItem('currentSchoolId');
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
