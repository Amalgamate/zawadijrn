import { fetchWithAuth, fetchCached } from './core';
import axiosInstance from './axiosConfig';

export const cbcAPI = {
  saveCompetencies: async (data) =>
    fetchWithAuth('/cbc/competencies', { method: 'POST', body: JSON.stringify(data) }),
  getCompetencies: async (learnerId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/cbc/competencies/${learnerId}${queryString ? `?${queryString}` : ''}`);
  },
  saveValues: async (data) =>
    fetchWithAuth('/cbc/values', { method: 'POST', body: JSON.stringify(data) }),
  getValues: async (learnerId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/cbc/values/${learnerId}${queryString ? `?${queryString}` : ''}`);
  },
  createCoCurricular: async (data) =>
    fetchWithAuth('/cbc/cocurricular', { method: 'POST', body: JSON.stringify(data) }),
  getCoCurricular: async (learnerId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/cbc/cocurricular/${learnerId}${queryString ? `?${queryString}` : ''}`);
  },
  updateCoCurricular: async (id, data) =>
    fetchWithAuth(`/cbc/cocurricular/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCoCurricular: async (id) =>
    fetchWithAuth(`/cbc/cocurricular/${id}`, { method: 'DELETE' }),
  saveComments: async (data) =>
    fetchWithAuth('/cbc/comments', { method: 'POST', body: JSON.stringify(data) }),
  getComments: async (learnerId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/cbc/comments/${learnerId}${queryString ? `?${queryString}` : ''}`);
  },
};
