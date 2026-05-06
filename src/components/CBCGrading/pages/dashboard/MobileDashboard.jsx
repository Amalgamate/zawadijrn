import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  ClipboardCheck,
  BookOpen,
  Calendar,
  Star,
  Library,
  Activity,
  Globe,
  UserPlus2,
  Wallet,
  BriefcaseBusiness,
  List,
  Bus,
  MessageSquare,
  Settings,
  FileText,
} from 'lucide-react';
import { dashboardAPI } from '../../../../services/api';
import { useNavigation } from '../../hooks/useNavigation';

const quickActions = [
  { id: 'attendance-daily', title: 'Attendance', sub: 'Mark today', icon: ClipboardCheck, color: 'bg-emerald-600' },
  { id: 'assess-summative-assessment', title: 'Grades', sub: '3 pending', icon: FileText, color: 'bg-sky-600' },
  { id: 'comm-messages', title: 'Messages', sub: '2 unread', icon: MessageSquare, color: 'bg-violet-600' },
  { id: 'assess-summary-report', title: 'Reports', sub: 'Term 2', icon: List, color: 'bg-amber-600' },
];

const iconMap = {
  learners: { icon: Users, color: 'bg-slate-700' },
  attendance: { icon: ClipboardCheck, color: 'bg-emerald-600' },
  assessment: { icon: BookOpen, color: 'bg-sky-600' },
  planner: { icon: Calendar, color: 'bg-indigo-600' },
  timetable: { icon: Calendar, color: 'bg-violet-600' },
  library: { icon: Library, color: 'bg-cyan-600' },
  'learning-hub': { icon: Activity, color: 'bg-teal-600' },
  lms: { icon: Globe, color: 'bg-fuchsia-600' },
  teachers: { icon: UserPlus2, color: 'bg-orange-600' },
  finance: { icon: Wallet, color: 'bg-lime-600' },
  hr: { icon: BriefcaseBusiness, color: 'bg-amber-600' },
  inventory: { icon: List, color: 'bg-slate-700' },
  transport: { icon: Bus, color: 'bg-sky-600' },
  communications: { icon: MessageSquare, color: 'bg-violet-600' },
  settings: { icon: Settings, color: 'bg-rose-600' },
};

const metricCard = (label, value, dot) => (
  <div className="min-w-[110px] rounded-2xl border border-[#ebebeb] bg-[#fafaf8] px-3 py-3">
    <div className={`w-1.5 h-1.5 rounded-full mb-2 ${dot}`} />
    <div className="text-[34px] leading-none tracking-[-0.04em] font-semibold text-[#1a1a18]">{value}</div>
    <div className="text-[9px] mt-1 uppercase tracking-[0.08em] text-[#aaa] font-medium">{label}</div>
  </div>
);

const ModuleCard = ({ title, icon: Icon, color, onClick }) => (
  <button onClick={onClick} className="bg-white border border-[#ebebeb] rounded-[16px] p-3 min-h-[108px] flex flex-col items-center justify-center gap-2 active:scale-[0.97]">
    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
      <Icon size={18} className="text-white" />
    </div>
    <span className="text-[10px] text-[#555] font-medium text-center leading-tight">{title}</span>
  </button>
);

const MobileDashboard = ({ onNavigate, user }) => {
  const { schoolSections, backOfficeSections, communicationSection, systemAdminSections, lmsSection } = useNavigation();
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = user?.role === 'TEACHER'
          ? await dashboardAPI.getTeacherMetrics()
          : await dashboardAPI.getAdminMetrics('term');
        if (res?.success) setMetrics(res.data);
      } catch (_e) {
        setMetrics(null);
      }
    })();
  }, [user?.role]);

  const metricValues = useMemo(() => {
    const stats = metrics?.stats || {};
    return {
      present: stats.presentToday ?? stats.myStudents ?? 0,
      revenue: `KES ${Math.round((stats.feeCollected || 0) / 1000)}k`,
      pending: `KES ${Math.round((stats.feePending || 0) / 1000)}k`,
      growth: stats.studentTrend || '+0%',
    };
  }, [metrics]);

  const resolvePath = (section) => {
    if (!section?.items?.length) return section?.id || 'dashboard';
    const flat = section.items.find(i => i?.path) || section.items.find(i => i?.items?.[0]?.path)?.items?.[0];
    return flat?.path || section.id || 'dashboard';
  };

  const instructional = [...(schoolSections || []), ...(lmsSection ? [lmsSection] : [])].slice(0, 9);
  const management = [...(backOfficeSections || []), ...(communicationSection ? [communicationSection] : []), ...(systemAdminSections || [])].slice(0, 6);

  return (
    <div className="bg-[#fafaf8] min-h-full pb-6">
      <div className="bg-white px-5 py-4 border-b border-[#f0f0ec]">
        <div className="text-[12px] text-[#aaa]">Good morning,</div>
        <div className="text-[26px] leading-tight tracking-[-0.03em] font-semibold text-[#1a1a18]">
          {user?.firstName || user?.name?.split(' ')[0] || 'Member'}
        </div>
      </div>

      <div className="bg-white border-b border-[#f0f0ec] px-5 py-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {metricCard('Present', metricValues.present, 'bg-green-500')}
          {metricCard('Revenue', metricValues.revenue, 'bg-amber-500')}
          {metricCard('Pending', metricValues.pending, 'bg-red-500')}
          {metricCard('Growth', metricValues.growth, 'bg-blue-500')}
        </div>
      </div>

      <div className="px-5 pt-5">
        <div className="text-[10px] uppercase tracking-[0.1em] text-[#bbb] mb-3 font-medium">Quick Actions</div>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((qa) => (
            <button key={qa.id} onClick={() => onNavigate(qa.id)} className="bg-white border border-[#ebebeb] rounded-2xl p-3 flex items-center gap-3 active:scale-[0.98]">
              <div className={`w-9 h-9 rounded-xl ${qa.color} flex items-center justify-center`}>
                <qa.icon size={16} className="text-white" />
              </div>
              <div className="text-left">
                <div className="text-[11px] font-semibold text-[#1a1a18]">{qa.title}</div>
                <div className="text-[9px] text-[#aaa]">{qa.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-5">
        <div className="text-[10px] uppercase tracking-[0.1em] text-[#bbb] mb-3 font-medium">Instructional</div>
        <div className="grid grid-cols-3 gap-2">
          {instructional.map((s) => {
            const m = iconMap[s.id] || { icon: Star, color: 'bg-slate-700' };
            return (
              <ModuleCard
                key={s.id}
                title={s.label}
                icon={m.icon}
                color={m.color}
                onClick={() => onNavigate(resolvePath(s))}
              />
            );
          })}
        </div>
      </div>

      <div className="px-5 pt-6">
        <div className="text-[10px] uppercase tracking-[0.1em] text-[#bbb] mb-3 font-medium">Management</div>
        <div className="grid grid-cols-3 gap-2">
          {management.map((s) => {
            const m = iconMap[s.id] || { icon: Star, color: 'bg-slate-700' };
            return (
              <ModuleCard
                key={s.id}
                title={s.label}
                icon={m.icon}
                color={m.color}
                onClick={() => onNavigate(resolvePath(s))}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MobileDashboard;
