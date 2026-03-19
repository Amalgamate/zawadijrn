import axios from 'axios';

// Use environment variable for API URL or fall back to automatic discovery for production stability
const getApiBaseUrl = () => {
    if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
    if (window.location.hostname !== 'localhost') return `${window.location.origin}/api`;
    return 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        // Signal that we accept gzip — axios decompresses automatically in browser
        'Accept-Encoding': 'gzip, deflate, br',
    },
    // Fail fast instead of hanging indefinitely
    timeout: 30_000,
    // Keep-Alive so the TCP connection is reused across requests (major win)
    // Note: in browsers this is handled by the browser itself; this is for Node.js SSR use
});

// ── Request interceptor ───────────────────────────────────────────────────────
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) config.headers['Authorization'] = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Response interceptor ──────────────────────────────────────────────────────
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refreshToken');

            if (refreshToken) {
                try {
                    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
                    if (response.status === 200) {
                        const { token, refreshToken: newRefreshToken } = response.data;
                        localStorage.setItem('token', token);
                        localStorage.setItem('refreshToken', newRefreshToken);
                        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                        originalRequest.headers['Authorization'] = `Bearer ${token}`;
                        return axiosInstance(originalRequest);
                    }
                } catch (_refreshError) {
                    _clearAuth();
                }
            } else {
                _clearAuth();
            }
        }
        return Promise.reject(error);
    }
);

function _clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    if (!window.location.pathname.includes('/login')) {
        window.location.href = '/';
    }
}

export default axiosInstance;
