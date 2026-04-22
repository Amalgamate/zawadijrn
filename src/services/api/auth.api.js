import { fetchWithAuth } from './core';
import axiosInstance from './axiosConfig';

export const authAPI = {
  login: async (credentials) => {
    try {
      const response = await axiosInstance.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        const data = error.response?.data;
        let msg = data.message || data.error;
        if (!msg) msg = `HTTP ${error.response.status}`;
        if (typeof msg === 'object') msg = JSON.stringify(msg);
        throw new Error(msg);
      }
      throw error;
    }
  },

  schoolPublic: async () => {
    const response = await axiosInstance.get('/schools/public/branding');
    return response.data;
  },

  register: async (userData) => {
    const response = await axiosInstance.post('/auth/register', userData);
    return response.data;
  },

  checkAvailability: async (data) => {
    const response = await axiosInstance.post('/auth/check-availability', data);
    return response.data;
  },

  me: async () => fetchWithAuth('/auth/me'),

  getSeededUsers: async () => {
    try {
      const response = await axiosInstance.get('/auth/seeded-users');
      return response.data;
    } catch {
      return { users: [] };
    }
  },

  resetPassword: async (token, password) =>
    fetchWithAuth('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),

  sendOTP: async (data) => {
    try {
      const response = await axiosInstance.post('/auth/otp/send', data);
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        const d = error.response?.data;
        let msg = d.message || d.error;
        if (!msg) msg = `HTTP ${error.response.status}`;
        if (typeof msg === 'object') msg = JSON.stringify(msg);
        throw new Error(msg);
      }
      throw error;
    }
  },

  verifyOTP: async (data) => {
    try {
      const response = await axiosInstance.post('/auth/otp/verify', data);
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        const d = error.response?.data;
        let msg = d.message || d.error;
        if (!msg) msg = `HTTP ${error.response.status}`;
        if (typeof msg === 'object') msg = JSON.stringify(msg);
        throw new Error(msg);
      }
      throw error;
    }
  },

  getCsrf: async () => {
    const response = await axiosInstance.get('/auth/csrf');
    return response.data;
  },
};
