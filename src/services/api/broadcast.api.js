import { fetchWithAuth, fetchCached } from './core';
import axiosInstance from './axiosConfig';

export const broadcastAPI = {
  saveCampaign: async (data) =>
    fetchWithAuth('/broadcasts', { method: 'POST', body: JSON.stringify(data) }),
  getHistory: async (limit = 50, offset = 0) =>
    fetchWithAuth(`/broadcasts?limit=${limit}&offset=${offset}`),
  getDetails: async (campaignId) => fetchWithAuth(`/broadcasts/${campaignId}`),
  getStats: async () => fetchWithAuth('/broadcasts/stats'),
  saveDeliveryLog: async (campaignId, data) =>
    fetchWithAuth(`/broadcasts/${campaignId}/delivery-logs`, { method: 'POST', body: JSON.stringify(data) }),
  deleteCampaign: async (campaignId) =>
    fetchWithAuth(`/broadcasts/${campaignId}`, { method: 'DELETE' }),
  sendBulk: async (data) =>
    fetchWithAuth('/broadcasts/send-bulk', { method: 'POST', body: JSON.stringify(data) }),
};
