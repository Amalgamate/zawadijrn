import { fetchWithAuth, fetchCached } from './core';
import axiosInstance from './axiosConfig';

export const reportAPI = {
  getFormativeReport: async (learnerId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/reports/formative/${learnerId}${queryString ? `?${queryString}` : ''}`);
  },
  getSummativeReport: async (learnerId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/reports/summative/${learnerId}${queryString ? `?${queryString}` : ''}`);
  },
  getTermlyReport: async (learnerId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/reports/termly/${learnerId}${queryString ? `?${queryString}` : ''}`);
  },
  getClassAnalytics: async (classId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/reports/analytics/class/${classId}${queryString ? `?${queryString}` : ''}`);
  },
  getLearnerAnalytics: async (learnerId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/reports/analytics/learner/${learnerId}${queryString ? `?${queryString}` : ''}`);
  },
  generatePdf: async (data) => {
    try {
      const response = await axiosInstance.post('/reports/generate-pdf', data, { responseType: 'blob' });
      const blob = response.data;
      if (blob.size < 100) console.warn('⚠️ PDF Blob is suspiciously small');
      return blob;
    } catch (error) {
      const serverMessage =
        error.response?.data?.message ||
        (error.response?.data && typeof error.response.data === 'string' ? error.response.data : undefined) ||
        error.message ||
        'PDF Generation failed';
      throw new Error(`PDF Generation failed: ${serverMessage}`);
    }
  },
};
