import { fetchWithAuth, fetchCached } from './core';
import axiosInstance from './axiosConfig';

export const accountingAPI = {
  initializeCoA: async () =>
    fetchWithAuth('/accounting/initialize', { method: 'POST', body: JSON.stringify({}) }),
  getAccounts: async () => fetchWithAuth('/accounting/accounts'),
  getBalances: async () => fetchWithAuth('/accounting/balances'),
  getJournals: async () => fetchWithAuth('/accounting/journals'),
  createJournalEntry: async (data) =>
    fetchWithAuth('/accounting/entries', { method: 'POST', body: JSON.stringify(data) }),
  postJournalEntry: async (id) =>
    fetchWithAuth(`/accounting/entries/${id}/post`, { method: 'POST' }),
  getVendors: async () => fetchWithAuth('/accounting/vendors'),
  createVendor: async (data) =>
    fetchWithAuth('/accounting/vendors', { method: 'POST', body: JSON.stringify(data) }),
  recordExpense: async (data) =>
    fetchWithAuth('/accounting/expenses', { method: 'POST', body: JSON.stringify(data) }),
  getBankStatements: async () => fetchWithAuth('/accounting/bank-statements'),
  importBankStatement: async (data) =>
    fetchWithAuth('/accounting/bank-statements/import', { method: 'POST', body: JSON.stringify(data) }),
  reconcileLine: async (data) =>
    fetchWithAuth('/accounting/bank-statements/reconcile', { method: 'POST', body: JSON.stringify(data) }),
  getReport: async (type, startDate, endDate) =>
    fetchWithAuth(`/accounting/reports?type=${type}&startDate=${startDate}&endDate=${endDate}`),
  getTrialBalance: async (startDate, endDate) =>
    fetchWithAuth(`/accounting/reports/trial-balance?startDate=${startDate}&endDate=${endDate}`),
  getDashboardStats: async () => fetchWithAuth('/accounting/dashboard-stats'),
};
