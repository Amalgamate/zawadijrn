/**
 * Dashboard Page
 * Main dashboard with statistics and overview
 */

import React from 'react';
import {
  Users, GraduationCap, BookOpen, Activity, Calendar, ShieldCheck, Zap, Target
} from 'lucide-react';
import SchoolOnboardingWizard from './onboarding/SchoolOnboardingWizard';
import CompactMetricBanner from './dashboard/CompactMetricBanner';
import DashboardResponsiveWrapper from '../DashboardResponsiveWrapper';
import { useState, useEffect } from 'react';

const Dashboard = ({ learners, teachers }) => {
  const [showOnboarding, setShowOnboarding] = useState(false);

  const activeLearners = learners?.filter(l => l.status === 'Active' || l.status === 'ACTIVE').length || 0;
  const activeTeachers = teachers?.filter(t => t.status === 'Active' || t.status === 'ACTIVE').length || 0;

  useEffect(() => {
    // Show onboarding if no learners exist and not previously dismissed in this session
    const dismissed = sessionStorage.getItem('onboarding_dismissed');
    if (activeLearners === 0 && !dismissed) {
      setShowOnboarding(true);
    }
  }, [activeLearners]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    sessionStorage.setItem('onboarding_dismissed', 'true');
  };

  return (
    <DashboardResponsiveWrapper
      onNavigate={() => { }}
      currentPage="dashboard"
      metrics={{
        activeLearnersValue: activeLearners,
        activeLearnersChange: null,
        assessmentsValue: '-',
        assessmentsChange: null,
        attendanceValue: '-',
        attendanceChange: null
      }}
    >
      <div className="space-y-6">
        {showOnboarding && <SchoolOnboardingWizard onComplete={handleOnboardingComplete} />}
        {/* Compact Metrics Banner */}
        <CompactMetricBanner
          metrics={[
            {
              title: 'Enrollment',
              value: activeLearners,
              subtitle: 'Active Students',
              icon: Users,
              trend: null,
              trendValue: null
            },
            {
              title: 'Faculty',
              value: activeTeachers,
              subtitle: 'Teaching Staff',
              icon: GraduationCap,
              trend: null,
              trendValue: null
            },
            {
              title: 'Units',
              value: '-',
              subtitle: 'Active Learning Areas',
              icon: BookOpen,
              trend: null,
              trendValue: null
            },
            {
              title: 'Performance',
              value: '-',
              subtitle: 'Avg Attendance',
              icon: Activity,
              trend: null,
              trendValue: null
            }
          ]}
          gradientFrom="from-brand-purple"
          gradientVia="via-purple-500"
          gradientTo="to-pink-500"
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Service Console */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Enterprise Service Console</h3>
                <ShieldCheck size={16} className="text-brand-purple" />
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-gray-100 rounded-lg hover:border-brand-purple/20 hover:bg-brand-purple/5 transition-all group cursor-pointer">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-brand-purple/10 text-brand-purple rounded group-hover:bg-brand-purple group-hover:text-white transition-all">
                        <Users size={18} />
                      </div>
                      <h4 className="text-xs font-black text-gray-900 uppercase">Registry Support</h4>
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium">Coordinate student admissions, portfolio updates and academic transitions.</p>
                  </div>

                  <div className="p-4 border border-gray-100 rounded-lg hover:border-brand-teal/20 hover:bg-brand-teal/5 transition-all group cursor-pointer">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-brand-teal/10 text-brand-teal rounded group-hover:bg-brand-teal group-hover:text-white transition-all">
                        <Target size={18} />
                      </div>
                      <h4 className="text-xs font-black text-gray-900 uppercase">Assessment Hub</h4>
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium">Manage CBC formative assessments and end-of-term summative evaluations.</p>
                  </div>

                  <div className="p-4 border border-gray-100 rounded-lg hover:border-amber-500/20 hover:bg-amber-500/5 transition-all group cursor-pointer">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-amber-500/10 text-amber-600 rounded group-hover:bg-amber-500 group-hover:text-white transition-all">
                        <Zap size={18} />
                      </div>
                      <h4 className="text-xs font-black text-gray-900 uppercase">Ops Framework</h4>
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium">Review daily attendance logs, schedule changes and institutional milestones.</p>
                  </div>

                  <div className="p-4 border border-gray-100 rounded-lg hover:border-indigo-500/20 hover:bg-indigo-500/5 transition-all group cursor-pointer">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-indigo-500/10 text-indigo-600 rounded group-hover:bg-indigo-500 group-hover:text-white transition-all">
                        <Calendar size={18} />
                      </div>
                      <h4 className="text-xs font-black text-gray-900 uppercase">Planner</h4>
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium">Access the unified academic calendar and term-based operational roadmaps.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar: Activity Log */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">System Broadcasts</h3>
              </div>
              <div className="divide-y divide-gray-100">
                <div className="px-6 py-8 text-center text-gray-400 text-xs italic">No active broadcasts for your role</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardResponsiveWrapper>
  );
};

export default Dashboard;
