import { fetchWithAuth } from './core';
import axiosInstance from './axiosConfig';

export const inventoryAPI = {
  getCategories: async () => fetchWithAuth('/inventory/categories'),
  createCategory: async (data) =>
    fetchWithAuth('/inventory/categories', { method: 'POST', body: JSON.stringify(data) }),
  getStores: async () => fetchWithAuth('/inventory/stores'),
  createStore: async (data) =>
    fetchWithAuth('/inventory/stores', { method: 'POST', body: JSON.stringify(data) }),
  getItems: async (categoryId) =>
    fetchWithAuth(`/inventory/items${categoryId ? `?categoryId=${categoryId}` : ''}`),
  createItem: async (data) =>
    fetchWithAuth('/inventory/items', { method: 'POST', body: JSON.stringify(data) }),
  getMovements: async () => fetchWithAuth('/inventory/movements'),
  recordMovement: async (data) =>
    fetchWithAuth('/inventory/movements', { method: 'POST', body: JSON.stringify(data) }),
  getRequisitions: async () => fetchWithAuth('/inventory/requisitions'),
  createRequisition: async (data) =>
    fetchWithAuth('/inventory/requisitions', { method: 'POST', body: JSON.stringify(data) }),
  updateRequisitionStatus: async (id, status) =>
    fetchWithAuth(`/inventory/requisitions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  getAssetRegister: async () => fetchWithAuth('/inventory/assets'),
  registerAsset: async (data) =>
    fetchWithAuth('/inventory/assets', { method: 'POST', body: JSON.stringify(data) }),
  assignAsset: async (data) =>
    fetchWithAuth('/inventory/assets/assign', { method: 'POST', body: JSON.stringify(data) }),
};
