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
  /**
   * Generate a true vector PDF via the Puppeteer backend.
   * @param {Object} data - { html: string, options?: object }
   * @returns {Promise<Blob>} PDF blob ready for download or URL.createObjectURL
   */
  generatePdf: async (data) => {
    const { html, options = {} } = data || {};
    if (!html) throw new Error('generatePdf: html is required');

    const response = await axiosInstance.post('/pdf/generate', { html, options }, {
      responseType: 'blob',
      timeout: 60_000, // 60 s — Puppeteer can be slow on first boot
      headers: { 'Content-Type': 'application/json' },
    });

    // axiosInstance returns response.data directly as a Blob
    return response.data instanceof Blob
      ? response.data
      : new Blob([response.data], { type: 'application/pdf' });
  },

  generateScreenshot: async (data) => {
    const { html, options = {} } = data || {};
    if (!html) throw new Error('generateScreenshot: html is required');

    const response = await axiosInstance.post('/pdf/screenshot', { html, options }, {
      responseType: 'blob',
      timeout: 60_000,
      headers: { 'Content-Type': 'application/json' },
    });

    return response.data instanceof Blob
      ? response.data
      : new Blob([response.data], { type: 'image/jpeg' });
  },
};
