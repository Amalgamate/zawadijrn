import { API_BASE_URL, clearApiCache, fetchWithAuth } from './api/core';

import { authAPI } from './api/auth.api';
import { onboardingAPI } from './api/onboarding.api';
import { dashboardAPI } from './api/dashboard.api';
import { configAPI } from './api/config.api';
import { communicationAPI } from './api/communication.api';
import { broadcastAPI } from './api/broadcast.api';
import { userAPI } from './api/user.api';
import { schoolAPI } from './api/school.api';
import { facilityAPI } from './api/facility.api';
import { teacherAPI } from './api/teacher.api';
import { parentAPI } from './api/parent.api';
import { learnerAPI } from './api/learner.api';
import { subjectAssignmentAPI } from './api/subjectassignment.api';
import { classAPI } from './api/class.api';
import { attendanceAPI } from './api/attendance.api';
import { assessmentAPI } from './api/assessment.api';
import { feeAPI } from './api/fee.api';
import { notificationAPI } from './api/notification.api';
import { reportAPI } from './api/report.api';
import { healthAPI } from './api/health.api';
import { cbcAPI } from './api/cbc.api';
import { workflowAPI } from './api/workflow.api';
import { gradingAPI } from './api/grading.api';
import { adminAPI } from './api/admin.api';
import { documentsAPI } from './api/documents.api';
import { bookAPI } from './api/book.api';
import { sharingAPI } from './api/sharing.api';
import { hrAPI } from './api/hr.api';
import { accountingAPI } from './api/accounting.api';
import { inventoryAPI } from './api/inventory.api';
import { noticesAPI } from './api/notices.api';
import { aiAPI } from './api/ai.api';
import { schemeOfWorkAPI } from './api/schemeofwork.api';

import { plannerAPI } from './api/planner.api';

export { API_BASE_URL, clearApiCache };

export { authAPI };
export { onboardingAPI };
export { dashboardAPI };
export { configAPI };
export { communicationAPI };
export { broadcastAPI };
export { userAPI };
export { schoolAPI };
export { facilityAPI };
export { teacherAPI };
export { parentAPI };
export { learnerAPI };
export { subjectAssignmentAPI };
export { classAPI };
export { attendanceAPI };
export { assessmentAPI };
export { feeAPI };
export { notificationAPI };
export { reportAPI };
export { healthAPI };
export { cbcAPI };
export { workflowAPI };
export { gradingAPI };
export { adminAPI };
export { documentsAPI };
export { bookAPI };
export { sharingAPI };
export { hrAPI };
export { accountingAPI };
export { inventoryAPI };
export { noticesAPI };
export { aiAPI };
export { schemeOfWorkAPI };
export { plannerAPI as planner };

const api = {
  auth: authAPI,
  onboarding: onboardingAPI,
  dashboard: dashboardAPI,
  config: configAPI,
  ...configAPI,
  communication: communicationAPI,
  broadcasts: broadcastAPI,
  users: userAPI,
  school: schoolAPI,
  facility: facilityAPI,
  teachers: teacherAPI,
  parents: parentAPI,
  learners: learnerAPI,
  subjectAssignments: subjectAssignmentAPI,
  classes: classAPI,
  attendance: attendanceAPI,
  assessments: assessmentAPI,
  fees: feeAPI,
  notifications: {
    ...notificationAPI,
    getAuditLogs: async (params = {}) => {
      // Strip undefined / null / empty string values so they don't appear in the query
      Object.keys(params).forEach(key => {
        if (params[key] === undefined || params[key] === null || params[key] === '') {
          delete params[key];
        }
      });
      const queryString = new URLSearchParams(params).toString();
      return fetchWithAuth(`/notifications/audit-logs${queryString ? `?${queryString}` : ''}`);
    },
  },
  reports: reportAPI,
  health: healthAPI,
  cbc: cbcAPI,
  workflow: workflowAPI,
  grading: gradingAPI,
  admin: adminAPI,
  documents: documentsAPI,
  books: bookAPI,
  sharing: sharingAPI,
  hr: hrAPI,
  accounting: accountingAPI,
  inventory: inventoryAPI,
  notices: noticesAPI,
  ai: aiAPI,
  schemesOfWork: schemeOfWorkAPI,
  planner: plannerAPI
};

export default api;
