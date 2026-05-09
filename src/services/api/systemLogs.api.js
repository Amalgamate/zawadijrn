import { fetchWithAuth } from './core';

export const systemLogsAPI = {
  getLogs: async (params = {}) => {
    const search = new URLSearchParams();
    if (params.limit) search.set('limit', String(params.limit));
    const qs = search.toString();
    return fetchWithAuth(`/settings/system-logs${qs ? `?${qs}` : ''}`);
  },
};

