import { fetchWithAuth, fetchCached } from './core';
import axiosInstance from './axiosConfig';

export const adminAPI = {
  listSchools: async () => fetchWithAuth('/admin/schools'),
  provision: async (data) =>
    fetchWithAuth('/admin/schools/provision', { method: 'POST', body: JSON.stringify(data) }),
  listPlans: async () => fetchWithAuth('/admin/plans'),
  reactivateSchool: async () =>
    fetchWithAuth('/admin/school/reactivate', { method: 'PATCH' }),
  approvePayment: async (payload) =>
    fetchWithAuth('/admin/school/approve-payment', { method: 'PATCH', body: JSON.stringify(payload || {}) }),
  trialMetrics: async () => fetchWithAuth('/admin/trials/metrics'),
  getSchoolModules: async () => fetchWithAuth('/admin/school/modules'),
  setSchoolModule: async (moduleKey, active) =>
    fetchWithAuth(`/admin/school/modules/${moduleKey}`, { method: 'PATCH', body: JSON.stringify({ active }) }),
  switchSchool: async () => fetchWithAuth('/admin/switch-school', { method: 'POST' }),
  getSchoolCommunication: async () => fetchWithAuth('/admin/school/communication'),
  updateSchoolCommunication: async (data) =>
    fetchWithAuth('/admin/school/communication', { method: 'PUT', body: JSON.stringify(data) }),
};
