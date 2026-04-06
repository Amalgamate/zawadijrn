import { fetchWithAuth } from './core';

export const workflowAPI = {
  submit: async (payload) =>
    fetchWithAuth('/workflow/submit', { method: 'POST', body: JSON.stringify(payload) }),
  bulkSubmit: async (payload) =>
    fetchWithAuth('/workflow/bulk-submit', { method: 'POST', body: JSON.stringify(payload) }),
  approve: async (type, id, payload = {}) =>
    fetchWithAuth(`/workflow/approve/${type}/${id}`, { method: 'POST', body: JSON.stringify(payload) }),
  reject: async (type, id, payload) =>
    fetchWithAuth(`/workflow/reject/${type}/${id}`, { method: 'POST', body: JSON.stringify(payload) }),
  publish: async (type, id, payload = {}) =>
    fetchWithAuth(`/workflow/publish/${type}/${id}`, { method: 'POST', body: JSON.stringify(payload) }),
  getHistory: async (type, id) =>
    fetchWithAuth(`/workflow/history/${type}/${id}`),
  approveBulk: async (payload) =>
    fetchWithAuth('/workflow/bulk-approve', { method: 'POST', body: JSON.stringify(payload) }),
  unlock: async (type, id, payload) =>
    fetchWithAuth(`/workflow/unlock/${type}/${id}`, { method: 'POST', body: JSON.stringify(payload) }),
};
