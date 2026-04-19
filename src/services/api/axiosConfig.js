import axios from 'axios';

// Use environment variable for API URL or fall back to automatic discovery for production stability
const getApiBaseUrl = () => {
    // 1. Check for explicit environment variables (Vite standard)
    const viteApiUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
    if (viteApiUrl) return viteApiUrl;

    // 2. Capacitor / native shell (no dev server port)
    const isNative =
        window.location.protocol === 'capacitor:' ||
        (window.location.hostname === 'localhost' && window.location.port === '');

    // 3. Deployed web app: same-origin /api (reverse proxy)
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && !isNative) {
        return `${window.location.origin}/api`;
    }

    if (isNative) {
        return 'https://zawadijrn.onrender.com/api';
    }

    // 4. Local Vite dev (port 3000): talk to API on 5000 unless .env overrides (see .env.example)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000/api';
    }

    return 'https://zawadijrn.onrender.com/api';
};

export const API_BASE_URL = getApiBaseUrl();

export const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {},
    withCredentials: true,
    // Fail fast instead of hanging indefinitely
    timeout: 60_000,
    // Keep-Alive so the TCP connection is reused across requests (major win)
    // Note: in browsers this is handled by the browser itself; this is for Node.js SSR use
});

// ── Request interceptor ───────────────────────────────────────────────────────
axiosInstance.interceptors.request.use(
    (config) => {
        // Preference for cookies (withCredentials: true), 
        // but allow Bearer fallback for mobile/capacitor clients
        const token = localStorage.getItem('token');
        if (token && token !== '__cookie__') {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Refresh Queue Mechanism ───────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// ── Response interceptor ──────────────────────────────────────────────────────
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            // If the failure was on the refresh or login endpoint itself, don't attempt refresh
            if (originalRequest.url.includes('/auth/refresh') || originalRequest.url.includes('/auth/login')) {
                _clearAuth();
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise(function(resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return axiosInstance(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            // When using cookies, the browser handles sending the refreshToken automatically 
            // the withCredentials: true ensures it is sent. 
            // We still pass it as a body if available for compatibility.
            const refreshToken = localStorage.getItem('refreshToken');

            try {
                // withCredentials is inherited from axiosInstance settings
                const response = await axiosInstance.post(`/auth/refresh`, { refreshToken });
                if (response.status === 200) {
                    // If the server rotated cookies, the browser already has them.
                    // If the server also returned body tokens (legacy/mobile), update them.
                    const { token, refreshToken: newRefreshToken } = response.data || {};
                    if (token) localStorage.setItem('token', token);
                    if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
                    
                    processQueue(null, token);
                    isRefreshing = false;
                    return axiosInstance(originalRequest);
                }
            } catch (_refreshError) {
                processQueue(_refreshError, null);
                isRefreshing = false;
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
        // Signal the login page to show a session-expired message.
        // sessionStorage is cleared when the tab closes, so this won't
        // linger across future intentional logins.
        sessionStorage.setItem('session_expired', '1');
        window.location.href = '/';
    }
}

export default axiosInstance;
