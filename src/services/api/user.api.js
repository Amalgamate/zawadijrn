import { fetchWithAuth, fetchCached } from './core';
import axiosInstance from './axiosConfig';

export const userAPI = {
  getAll: async () => fetchWithAuth('/users'),
  getById: async (id) => fetchWithAuth(`/users/${id}`),
  getByRole: async (role, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/users/role/${role}${queryString ? `?${queryString}` : ''}`);
  },
  getStats: async () => fetchWithAuth('/users/stats'),
  create: async (userData) =>
    fetchWithAuth('/users', { method: 'POST', body: JSON.stringify(userData) }),
  update: async (id, userData) =>
    fetchWithAuth(`/users/${id}`, { method: 'PUT', body: JSON.stringify(userData) }),
  archive: async (id) =>
    fetchWithAuth(`/users/${id}/archive`, { method: 'POST' }),
  unarchive: async (id) =>
    fetchWithAuth(`/users/${id}/unarchive`, { method: 'POST' }),
  delete: async (id) =>
    fetchWithAuth(`/users/${id}`, { method: 'DELETE' }),
  resetPassword: async (id, data) =>
    fetchWithAuth(`/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify(data) }),
};
