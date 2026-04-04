import { fetchWithAuth, fetchCached } from './core';
import axiosInstance from './axiosConfig';

export const hrAPI = {
  clockInStaff: async (data = {}) =>
    fetchWithAuth('/hr/attendance/clock-in', { method: 'POST', body: JSON.stringify(data) }),
  clockOutStaff: async (data = {}) =>
    fetchWithAuth('/hr/attendance/clock-out', { method: 'POST', body: JSON.stringify(data) }),
  getTodayClockIn: async () => fetchWithAuth('/hr/attendance/today'),
  getStaffDirectory: async () => fetchWithAuth('/hr/staff'),
  updateStaffHR: async (id, data) =>
    fetchWithAuth(`/hr/staff/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getLeaveTypes: async () => fetchWithAuth('/hr/leave/types'),
  submitLeaveRequest: async (data) =>
    fetchWithAuth('/hr/leave/apply', { method: 'POST', body: JSON.stringify(data) }),
  getLeaveRequests: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/hr/leave/requests?${queryString}`);
  },
  approveLeaveRequest: async (requestId, data) =>
    fetchWithAuth(`/hr/leave/approve/${requestId}`, { method: 'PUT', body: JSON.stringify(data) }),
  generatePayroll: async (data) =>
    fetchWithAuth('/hr/payroll/generate', { method: 'POST', body: JSON.stringify(data) }),
  getPayrollRecords: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/hr/payroll?${queryString}`);
  },
  getPerformanceReviews: async (userId) => {
    const url = userId ? `/hr/performance?userId=${userId}` : '/hr/performance';
    return fetchWithAuth(url);
  },
  createPerformanceReview: async (data) =>
    fetchWithAuth('/hr/performance', { method: 'POST', body: JSON.stringify(data) }),
  updatePerformanceReview: async (id, data) =>
    fetchWithAuth(`/hr/performance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  confirmPayroll: async (id) =>
    fetchWithAuth(`/hr/payroll/confirm/${id}`, { method: 'PUT' }),
  getDashboardStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/hr/dashboard?${queryString}`);
  },
};
