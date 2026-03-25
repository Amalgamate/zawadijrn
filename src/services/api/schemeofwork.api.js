import { fetchWithAuth, fetchCached } from './core';
import axiosInstance from './axiosConfig';

export const schemeOfWorkAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/schemes-of-work${queryString ? `?${queryString}` : ''}`);
  },
  getById: async (id) => fetchWithAuth(`/schemes-of-work/${id}`),
  create: async (data) =>
    fetchWithAuth('/schemes-of-work', { method: 'POST', body: JSON.stringify(data) }),
  update: async (id, data) =>
    fetchWithAuth(`/schemes-of-work/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateStatus: async (id, status) =>
    fetchWithAuth(`/schemes-of-work/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }),
  review: async (id, data) =>
    fetchWithAuth(`/schemes-of-work/${id}/review`, { method: 'POST', body: JSON.stringify(data) }),
  delete: async (id) =>
    fetchWithAuth(`/schemes-of-work/${id}`, { method: 'DELETE' }),
};
