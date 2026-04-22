import { fetchWithAuth } from './core';
import axiosInstance from './axiosConfig';

export const schoolAPI = {
  getAll: async () => fetchWithAuth('/schools'),
  getById: async (id) => fetchWithAuth(`/schools/${id}`),
  create: async (data) =>
    fetchWithAuth('/schools', { method: 'POST', body: JSON.stringify(data) }),
  update: async (id, data) =>
    fetchWithAuth(`/schools/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deactivate: async (id) =>
    fetchWithAuth(`/schools/${id}/deactivate`, { method: 'POST' }),
  delete: async (id) =>
    fetchWithAuth(`/schools/${id}`, { method: 'DELETE' }),
  provision: async (data) =>
    fetchWithAuth('/schools/provision', { method: 'POST', body: JSON.stringify(data) }),
  getAdmissionNumberPreview: async (academicYear) =>
    fetchWithAuth(`/schools/admission-number-preview/${academicYear}`),
};
