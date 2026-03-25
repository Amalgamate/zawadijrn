import { fetchWithAuth, fetchCached } from './core';
import axiosInstance from './axiosConfig';

export const noticesAPI = {
  getAll: async (params) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/notices${queryString ? `?${queryString}` : ''}`);
  },
  getById: async (id) => fetchWithAuth(`/notices/${id}`),
  create: async (data) =>
    fetchWithAuth('/notices', { method: 'POST', body: JSON.stringify(data) }),
  update: async (id, data) =>
    fetchWithAuth(`/notices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: async (id) =>
    fetchWithAuth(`/notices/${id}`, { method: 'DELETE' }),
};
