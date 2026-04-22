import { fetchWithAuth } from './core';
import axiosInstance from './axiosConfig';

export const aiAPI = {
  generateFeedback: async (learnerId, term, academicYear) =>
    fetchWithAuth(`/ai/feedback/${learnerId}?term=${term}&academicYear=${academicYear}`),
  analyzeRisk: async (learnerId) => fetchWithAuth(`/ai/analyze-risk/${learnerId}`),
  getTrend: async (learnerId) => fetchWithAuth(`/ai/trend/${learnerId}`),
};
