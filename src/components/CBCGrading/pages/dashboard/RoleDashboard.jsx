/**
 * Role-Specific Dashboard Component
 * Renders different dashboard views based on user role
 */

import React from 'react';
import { usePermissions } from '../../../../hooks/usePermissions';
import AdminDashboard from './AdminDashboard';
import HeadTeacherDashboard from './HeadTeacherDashboard';
import TeacherDashboard from './TeacherDashboard';
import ParentDashboard from './ParentDashboard';
import AccountantDashboard from './AccountantDashboard';
import ReceptionistDashboard from './ReceptionistDashboard';
import MobileDashboard from './MobileDashboard';
import StudentDashboard from '../student/StudentDashboard';
import useMediaQuery from '../../hooks/useMediaQuery';

const RoleDashboard = ({ learners, pagination, teachers, user, onNavigate, brandingSettings }) => {
  const { role } = usePermissions();
  const isMobile = useMediaQuery('(max-width: 767px)');

  if (isMobile) {
    return <MobileDashboard user={user} onNavigate={onNavigate} brandingSettings={brandingSettings} />;
  }

  // Render dashboard based on user role
  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return <AdminDashboard learners={learners} pagination={pagination} teachers={teachers} user={user} onNavigate={onNavigate} />;

    case 'HEAD_TEACHER':
      return <HeadTeacherDashboard learners={learners} pagination={pagination} teachers={teachers} user={user} onNavigate={onNavigate} />;

    case 'TEACHER':
      return <TeacherDashboard learners={learners} pagination={pagination} teachers={teachers} user={user} onNavigate={onNavigate} />;

    case 'PARENT':
      return <ParentDashboard user={user} onNavigate={onNavigate} />;

    case 'STUDENT':
      return <StudentDashboard user={user} onNavigate={onNavigate} />;

    case 'ACCOUNTANT':
      return <AccountantDashboard learners={learners} pagination={pagination} user={user} onNavigate={onNavigate} />;

    case 'RECEPTIONIST':
      return <ReceptionistDashboard learners={learners} pagination={pagination} user={user} onNavigate={onNavigate} />;

    default:
      return (
        <div className="text-center py-12">
          <p className="text-gray-600">Invalid user role</p>
        </div>
      );
  }
};

export default RoleDashboard;
