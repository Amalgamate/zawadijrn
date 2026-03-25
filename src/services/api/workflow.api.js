import { fetchWithAuth, fetchCached } from './core';
import axiosInstance from './axiosConfig';

export const workflowAPI = {
  submit: async () => ({ success: true }),
  bulkSubmit: async () => ({ success: true }),
  approve: async () => ({ success: true }),
  reject: async () => ({ success: true }),
  publish: async () => ({ success: true }),
  getHistory: async () => ({ success: true, data: [] }),
  approveBulk: async () => ({ success: true, message: 'Auto-approved' }),
  unlock: async () => ({ success: true }),
};
