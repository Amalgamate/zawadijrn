import { fetchWithAuth, fetchCached } from './core';
import axiosInstance from './axiosConfig';

export const healthAPI = {
  check: async () => {
    try {
      const response = await axiosInstance.get('/health');
      return response.data;
    } catch {
      throw new Error('Backend server is not reachable');
    }
  },
};
