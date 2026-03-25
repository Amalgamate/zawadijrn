import { fetchWithAuth, fetchCached } from './core';
import axiosInstance from './axiosConfig';

export const documentsAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/documents${queryString ? `?${queryString}` : ''}`);
  },
  getCategories: async () => fetchWithAuth('/documents/categories'),
  upload: async (formData) =>
    fetchWithAuth('/documents/upload', { method: 'POST', body: formData }),
  uploadMultiple: async (formData) =>
    fetchWithAuth('/documents/upload-multiple', { method: 'POST', body: formData }),
  update: async (id, data) =>
    fetchWithAuth(`/documents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: async (id) =>
    fetchWithAuth(`/documents/${id}`, { method: 'DELETE' }),
};
