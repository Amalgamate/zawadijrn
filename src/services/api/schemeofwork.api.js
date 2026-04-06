import { fetchWithAuth, fetchCached } from './core';
import axiosInstance from './axiosConfig';

export const schemeOfWorkAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/schemes${queryString ? `?${queryString}` : ''}`);
  },
  getById: async (id) => fetchWithAuth(`/schemes/${id}`),
  create: async (data) =>
    fetchWithAuth('/schemes', { method: 'POST', body: JSON.stringify(data) }),
  update: async (id, data) =>
    fetchWithAuth(`/schemes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateStatus: async (id, status) =>
    fetchWithAuth(`/schemes/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }),
  review: async (id, data) =>
    fetchWithAuth(`/schemes/${id}/review`, { method: 'POST', body: JSON.stringify(data) }),
  delete: async (id) =>
    fetchWithAuth(`/schemes/${id}`, { method: 'DELETE' }),
};
