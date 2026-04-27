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
import { MOBILE_MEDIA_QUERY } from '../../../../constants/breakpoints';

const Tile = ({ title, description, onClick, badge, tone = 'indigo' }) => {
  const toneClasses = tone === 'emerald'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
    : tone === 'slate'
      ? 'border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100'
      : 'border-indigo-200 bg-indigo-50 text-indigo-900 hover:bg-indigo-100';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-2xl border p-4 shadow-sm transition ${toneClasses}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold">{title}</div>
          <div className="mt-1 text-xs font-medium opacity-80">{description}</div>
        </div>
        {badge ? (
          <span className="shrink-0 inline-flex items-center rounded-full border border-white/40 bg-white/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest">
            {badge}
          </span>
        ) : null}
      </div>
    </button>
  );
};

const RoleDashboard = ({ learners, pagination, teachers, user, onNavigate, brandingSettings }) => {
  const { role } = usePermissions();
  const isMobile = useMediaQuery(MOBILE_MEDIA_QUERY);

  // Senior School / Secondary placeholder portal.
  // This keeps the Junior (PRIMARY_CBC) dashboard unchanged while giving SS users
  // a distinct landing view even before SS pages are fully implemented.
  if (user?.institutionType === 'SECONDARY') {
    return (
      <div className="p-6 space-y-4">
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-indigo-50 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-indigo-900">Senior School Dashboard</h1>
              <p className="mt-2 text-sm font-medium text-indigo-900/80">
                This is the Senior School environment. Modules will open progressively; anything unfinished will clearly show “Coming Soon”.
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
          <Tile
            title="CBC Pathways"
            description="View STEM / Social Sciences / Arts & Sports plus category min/max rules."
            badge="Live"
            onClick={() => onNavigate?.('sec-pathways')}
          />
          <Tile
            title="Students"
            description="Browse Senior School learners (Grade 10–12) and open profiles."
            badge="Ready"
            tone="emerald"
            onClick={() => onNavigate?.('learners-list')}
          />
          <Tile
            title="Learning Areas"
            description="Manage learning areas for the active institution type."
            badge="Ready"
            tone="emerald"
            onClick={() => onNavigate?.('assess-learning-areas')}
          />
          <Tile
            title="Assessments"
            description="Summative and formative assessment flows (CBC 8-level grading supported)."
            badge="Ready"
            tone="emerald"
            onClick={() => onNavigate?.('assess-summative-assessment')}
          />
          <Tile
            title="Reports"
            description="Termly report and analytics using learningAreaId joins where available."
            badge="Ready"
            tone="emerald"
            onClick={() => onNavigate?.('assess-termly-report')}
          />
          <Tile
            title="Secondary Placeholders"
            description="Legacy secondary pages kept as placeholders while SS CBC screens replace them."
            badge="Coming soon"
            tone="slate"
            onClick={() => onNavigate?.('sec-subjects')}
          />
        </div>
      </div>
    );
  }

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
