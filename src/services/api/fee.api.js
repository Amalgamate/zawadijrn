import { fetchWithAuth, fetchCached, API_BASE_URL } from './core';
import axiosInstance from './axiosConfig';

export const feeAPI = {
  getAllFeeStructures: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchWithAuth(`/fees/structures${query ? `?${query}` : ''}`);
  },
  createFeeStructure: async (data) =>
    fetchWithAuth('/fees/structures', { method: 'POST', body: JSON.stringify(data) }),
  updateFeeStructure: async (id, data) =>
    fetchWithAuth(`/fees/structures/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFeeStructure: async (id) =>
    fetchWithAuth(`/fees/structures/${id}`, { method: 'DELETE' }),
  getAllInvoices: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchWithAuth(`/fees/invoices${query ? `?${query}` : ''}`);
  },
  getLearnerInvoices: async (learnerId) => fetchWithAuth(`/fees/invoices/learner/${learnerId}`),
  createInvoice: async (data) =>
    fetchWithAuth('/fees/invoices', { method: 'POST', body: JSON.stringify(data) }),
  bulkGenerateInvoices: async (data) =>
    fetchWithAuth('/fees/invoices/bulk', { method: 'POST', body: JSON.stringify(data) }),
  recordPayment: async (data) =>
    fetchWithAuth('/fees/payments', { method: 'POST', body: JSON.stringify(data) }),
  getAllFeeTypes: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchWithAuth(`/fees/types${query ? `?${query}` : ''}`);
  },
  seedDefaultFeeTypes: async () =>
    fetchWithAuth('/fees/types/seed/defaults', { method: 'POST' }),
  seedDefaultFeeStructures: async (academicYear) =>
    fetchWithAuth('/fees/types/seed/structures', {
      method: 'POST',
      body: JSON.stringify(academicYear ? { academicYear } : {}),
    }),
  getPaymentStats: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchWithAuth(`/fees/stats${query ? `?${query}` : ''}`);
  },
  exportInvoices: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    const response = await fetch(`${API_BASE_URL}/fees/invoices/export${query ? `?${query}` : ''}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to export invoices');
    return response.blob();
  },
  resetInvoices: async () => fetchWithAuth('/fees/invoices/reset', { method: 'DELETE' }),
  sendReminder: async (id, data) =>
    fetchWithAuth(`/fees/invoices/${id}/remind`, { method: 'POST', body: JSON.stringify(data) }),
  bulkSendReminders: async (data) =>
    fetchWithAuth('/fees/invoices/remind/bulk', { method: 'POST', body: JSON.stringify(data) }),
  emailStatement: async (learnerId, data) =>
    fetchWithAuth(`/fees/invoices/learner/${learnerId}/email`, { method: 'POST', body: JSON.stringify(data) }),
};
