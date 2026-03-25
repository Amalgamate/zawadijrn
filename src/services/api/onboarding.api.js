import { fetchWithAuth, fetchCached } from './core';
import axiosInstance from './axiosConfig';
import { authAPI } from './auth.api';

export const onboardingAPI = {
  registerFull: async (data) => {
    const { token: csrfToken } = await authAPI.getCsrf();
    const response = await axiosInstance.post('/onboarding/register-full', data, {
      headers: { 'X-CSRF-Token': csrfToken },
    });
    return response.data;
  },
};
