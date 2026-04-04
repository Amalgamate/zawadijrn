import { fetchWithAuth } from './core';

export const biometricAPI = {
  /**
   * Device Management
   */
  getDevices: () => fetchWithAuth('/biometric/devices'),
  
  registerDevice: (data) => fetchWithAuth('/biometric/devices', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  updateDevice: (id, data) => fetchWithAuth(`/biometric/devices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  
  deleteDevice: (id) => fetchWithAuth(`/biometric/devices/${id}`, {
    method: 'DELETE'
  }),

  /**
   * Enrollment
   */
  getEnrollmentStatus: (type, id) => fetchWithAuth(`/biometric/enroll/${type}/${id}`),
  
  enrollFingerprint: (data) => fetchWithAuth('/biometric/enroll', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  /**
   * Attendance Logs
   */
  getLogs: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/biometric/logs${queryString ? `?${queryString}` : ''}`);
  },
  
  processLog: (logId) => fetchWithAuth(`/biometric/logs/${logId}/process`, {
    method: 'POST'
  }),
};

export default biometricAPI;
