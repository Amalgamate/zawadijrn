import { fetchWithAuth, fetchCached } from './core';
import axiosInstance from './axiosConfig';

export const dashboardAPI = {
  getAdminMetrics: async (filter = 'today') =>
    fetchWithAuth(`/dashboard/admin?filter=${filter}`),
  getTeacherMetrics: async (filter = 'today') =>
    fetchWithAuth(`/dashboard/teacher?filter=${filter}`),
  getParentMetrics: async () =>
    fetchWithAuth('/dashboard/parent'),
};
