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
  // generatePdf & generateScreenshot removed — PDF generation is now 100% frontend.
  // Use simplePdfGenerator.js (captureSingleReport / captureBulkReports) instead.
  // Keeping this stub so any accidental import doesn't crash at runtime.
  generatePdf: async () => { throw new Error('PDF generation is frontend-only. Use simplePdfGenerator.js'); },
  generateScreenshot: async () => { throw new Error('Screenshot is frontend-only. Use simplePdfGenerator.js'); },
};
