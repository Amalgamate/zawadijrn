/**
 * Role-Specific Dashboard Component
 * Renders different dashboard views based on user role
 */

import React from 'react';
import { usePermissions } from '../../../../hooks/usePermissions';
import { useAuth } from '../../../../hooks/useAuth';
import AdminDashboard from './AdminDashboard';
import HeadTeacherDashboard from './HeadTeacherDashboard';
import TeacherDashboard from './TeacherDashboard';
import ParentDashboard from './ParentDashboard';
import AccountantDashboard from './AccountantDashboard';
import ReceptionistDashboard from './ReceptionistDashboard';
import MobileDashboard from './MobileDashboard';
import StudentDashboard from '../student/StudentDashboard';
import ComingSoon from '../../shared/ComingSoon';
import useMediaQuery from '../../hooks/useMediaQuery';
import { MOBILE_MEDIA_QUERY } from '../../../../constants/breakpoints';

const RoleDashboard = ({ learners, pagination, teachers, user, onNavigate, brandingSettings }) => {
  const { role } = usePermissions();
  const { institutionType } = useAuth();
  const isMobile = useMediaQuery(MOBILE_MEDIA_QUERY);

  // Tertiary: whole module is Coming Soon — must check before mobile branch
  // so mobile tertiary users also see ComingSoon instead of MobileDashboard.
  if (institutionType === 'TERTIARY') {
    return (
      <ComingSoon
        badge="Tertiary"
        title="Tertiary portal"
        description="The tertiary institution module is currently under development and will be available in a future release."
      />
    );
  }

  // Secondary: placeholder until SecondaryAdminDashboard is built.
  // Also checked before the mobile branch for the same reason.
  if (institutionType === 'SECONDARY') {
    if (isMobile) {
      return <MobileDashboard user={user} onNavigate={onNavigate} brandingSettings={brandingSettings} />;
    }
    return (
      <div className="p-6 space-y-4">
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-indigo-50 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-indigo-900">Senior School Dashboard</h1>
              <p className="mt-2 text-sm font-medium text-indigo-900/80">
                This is the Senior School environment. Modules open progressively; anything unfinished shows "Coming Soon".
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-indigo-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-indigo-800">
                  Portal: Senior
                </span>
                <span className="inline-flex items-center rounded-full border border-indigo-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-indigo-800">
                  Role: {String(role || user?.role || 'USER').replaceAll('_', ' ')}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.('learners-list')}
              className="hidden sm:inline-flex items-center px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold uppercase tracking-widest shadow hover:bg-indigo-700"
            >
              View Students
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[
            { title: 'CBC Pathways',     description: 'STEM / Social Sciences / Arts & Sports pathways.',   path: 'sec-pathways',              badge: 'Live'  },
            { title: 'Students',         description: 'Senior School learners (Grade 10–12).',               path: 'learners-list',             badge: 'Ready' },
            { title: 'Learning Areas',   description: 'Manage learning areas for the active context.',       path: 'assess-learning-areas',     badge: 'Ready' },
            { title: 'Assessments',      description: 'Summative and formative assessment flows.',           path: 'assess-summative-assessment',badge: 'Ready' },
            { title: 'Reports',          description: 'Termly report and analytics.',                        path: 'assess-termly-report',      badge: 'Ready' },
            { title: 'Grade Streams',    description: 'Grade 10–12 class streams.',                          path: 'sec-form-groups',           badge: 'Ready' },
          ].map(({ title, description, path, badge }) => (
            <button
              key={path}
              type="button"
              onClick={() => onNavigate?.(path)}
              className="w-full text-left rounded-2xl border border-indigo-200 bg-indigo-50 p-4 shadow-sm transition hover:bg-indigo-100 text-indigo-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-semibold">{title}</div>
                  <div className="mt-1 text-xs font-medium opacity-80">{description}</div>
                </div>
                <span className="shrink-0 inline-flex items-center rounded-full border border-white/40 bg-white/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest">
                  {badge}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Primary CBC — mobile shell or role-based dashboard
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
