import { fetchWithAuth, fetchCached } from './core';
import axiosInstance from './axiosConfig';

export const notificationAPI = {
  sendAssessmentNotification: async (data) =>
    fetchWithAuth('/notifications/assessment-complete', { method: 'POST', body: JSON.stringify(data) }),
  sendBulkAssessmentNotifications: async (data) =>
    fetchWithAuth('/notifications/assessment-complete/bulk', { method: 'POST', body: JSON.stringify(data) }),
  sendCustomMessage: async (data) =>
    fetchWithAuth('/notifications/custom', { method: 'POST', body: JSON.stringify(data) }),
  sendAnnouncement: async (data) =>
    fetchWithAuth('/notifications/announcement', { method: 'POST', body: JSON.stringify(data) }),
  sendAssessmentReportSms: async (data) =>
    fetchWithAuth('/notifications/sms/assessment-report', { method: 'POST', body: JSON.stringify(data) }),
  sendAssessmentReportWhatsApp: async (data) =>
    fetchWithAuth('/notifications/whatsapp/assessment-report', { method: 'POST', body: JSON.stringify(data) }),
  testWhatsApp: async (phoneNumber) =>
    fetchWithAuth('/notifications/test', { method: 'POST', body: JSON.stringify({ phoneNumber }) }),
  getWhatsAppStatus: async () => fetchWithAuth('/notifications/whatsapp/status'),
};
