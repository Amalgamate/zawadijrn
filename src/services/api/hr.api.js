import { fetchWithAuth } from './core';

export const hrAPI = {
    // ── Attendance ────────────────────────────────────────────────────────────
    clockInStaff: async (data = {}) =>
        fetchWithAuth('/hr/attendance/clock-in', { method: 'POST', body: JSON.stringify(data) }),
    clockOutStaff: async (data = {}) =>
        fetchWithAuth('/hr/attendance/clock-out', { method: 'POST', body: JSON.stringify(data) }),
    getTodayClockIn: async () => fetchWithAuth('/hr/attendance/today'),

    // ── Staff Directory ───────────────────────────────────────────────────────
    getStaffDirectory: async () => fetchWithAuth('/hr/staff'),
    updateStaffHR: async (id, data) =>
        fetchWithAuth(`/hr/staff/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

    // ── Allowances ────────────────────────────────────────────────────────────
    getStaffAllowances: async (userId) => fetchWithAuth(`/hr/allowances/${userId}`),
    upsertAllowance: async (userId, data) =>
        fetchWithAuth(`/hr/allowances/${userId}`, { method: 'POST', body: JSON.stringify(data) }),
    deleteAllowance: async (userId, id) =>
        fetchWithAuth(`/hr/allowances/${userId}/${id}`, { method: 'DELETE' }),

    // ── Custom Deductions ─────────────────────────────────────────────────────
    getStaffDeductions: async (userId) => fetchWithAuth(`/hr/deductions/${userId}`),
    upsertDeduction: async (userId, data) =>
        fetchWithAuth(`/hr/deductions/${userId}`, { method: 'POST', body: JSON.stringify(data) }),
    deleteDeduction: async (userId, id) =>
        fetchWithAuth(`/hr/deductions/${userId}/${id}`, { method: 'DELETE' }),

    // ── Leave ─────────────────────────────────────────────────────────────────
    getLeaveTypes: async () => fetchWithAuth('/hr/leave/types'),
    submitLeaveRequest: async (data) =>
        fetchWithAuth('/hr/leave/apply', { method: 'POST', body: JSON.stringify(data) }),
    getLeaveRequests: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return fetchWithAuth(`/hr/leave/requests?${queryString}`);
    },
    approveLeaveRequest: async (requestId, data) =>
        fetchWithAuth(`/hr/leave/approve/${requestId}`, { method: 'PUT', body: JSON.stringify(data) }),

    // ── Payroll ───────────────────────────────────────────────────────────────
    generatePayroll: async (data) =>
        fetchWithAuth('/hr/payroll/generate', { method: 'POST', body: JSON.stringify(data) }),
    getPayrollRecords: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return fetchWithAuth(`/hr/payroll?${queryString}`);
    },
    confirmPayroll: async (id) =>
        fetchWithAuth(`/hr/payroll/confirm/${id}`, { method: 'PUT' }),
    bulkConfirmPayroll: async (month, year) =>
        fetchWithAuth('/hr/payroll/bulk-confirm', { method: 'POST', body: JSON.stringify({ month, year }) }),
    markPayrollPaid: async (id, paymentReference) =>
        fetchWithAuth(`/hr/payroll/pay/${id}`, { method: 'PUT', body: JSON.stringify({ paymentReference }) }),
    bulkMarkPaid: async (month, year, paymentReference) =>
        fetchWithAuth('/hr/payroll/bulk-pay', { method: 'POST', body: JSON.stringify({ month, year, paymentReference }) }),

    // ── Performance ───────────────────────────────────────────────────────────
    getPerformanceReviews: async (userId) => {
        const url = userId ? `/hr/performance?userId=${userId}` : '/hr/performance';
        return fetchWithAuth(url);
    },
    createPerformanceReview: async (data) =>
        fetchWithAuth('/hr/performance', { method: 'POST', body: JSON.stringify(data) }),
    updatePerformanceReview: async (id, data) =>
        fetchWithAuth(`/hr/performance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

    // ── Dashboard ─────────────────────────────────────────────────────────────
    getDashboardStats: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return fetchWithAuth(`/hr/dashboard?${queryString}`);
    },
};
