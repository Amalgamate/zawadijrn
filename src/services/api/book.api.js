import { fetchWithAuth, fetchCached } from './core';
import axiosInstance from './axiosConfig';

export const bookAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/books${queryString ? `?${queryString}` : ''}`);
  },
  create: async (data) =>
    fetchWithAuth('/books', { method: 'POST', body: JSON.stringify(data) }),
  update: async (id, data) =>
    fetchWithAuth(`/books/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  assign: async (id, userId) =>
    fetchWithAuth(`/books/${id}/assign`, { method: 'POST', body: JSON.stringify({ userId }) }),
  return: async (id) =>
    fetchWithAuth(`/books/${id}/return`, { method: 'POST' }),
  delete: async (id) =>
    fetchWithAuth(`/books/${id}`, { method: 'DELETE' }),
};
