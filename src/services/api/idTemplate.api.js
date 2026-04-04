import { fetchWithAuth } from './core';

export const idTemplateAPI = {
    getAll: async () => fetchWithAuth('/id-templates'),
    getActive: async () => fetchWithAuth('/id-templates/active'),
    getById: async (id) => fetchWithAuth(`/id-templates/${id}`),
    create: async (data) => fetchWithAuth('/id-templates', { method: 'POST', body: JSON.stringify(data) }),
    update: async (id, data) => fetchWithAuth(`/id-templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: async (id) => fetchWithAuth(`/id-templates/${id}`, { method: 'DELETE' })
};
