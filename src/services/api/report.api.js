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
      
      // Check if response is actually a PDF or error text
      const contentType = response.headers['content-type'] || '';
      if (contentType.includes('text/plain')) {
        const errorText = await blob.text();
        throw new Error(`Backend error: ${errorText}`);
      }
      
      if (blob.size < 100) console.warn('⚠️ PDF Blob is suspiciously small:', blob.size, 'bytes');
      return blob;
    } catch (error) {
      let errorMsg = error.message || 'PDF Generation failed';
      
      // Try to extract better error message
      if (error.response?.data) {
        try {
          if (typeof error.response.data === 'string') {
            errorMsg = error.response.data;
          } else if (error.response.data.message) {
            errorMsg = error.response.data.message;
          }
        } catch (e) {
          // fallback to default
        }
      }
      
      throw new Error(`PDF Generation failed: ${errorMsg}`);
    }
  },
};
