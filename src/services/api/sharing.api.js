import { fetchWithAuth } from './core';
import axiosInstance from './axiosConfig';

export const sharingAPI = {
  shareDocumentWhatsApp: async (documentId, phoneNumber) =>
    fetchWithAuth('/notifications/whatsapp/share-document', {
      method: 'POST',
      body: JSON.stringify({ documentId, phoneNumber }),
    }),
};
