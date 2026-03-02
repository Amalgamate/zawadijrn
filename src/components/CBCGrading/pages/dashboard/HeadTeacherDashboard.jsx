/**
 * Head Teacher Dashboard - School oversight view
 * Focused on teaching staff management, class performance, and learner progress
 */

import React, { useEffect, useState } from 'react';
import {
  Users,
  GraduationCap,
  BookOpen,
  UserCheck,
  Calendar,
  Award,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Eye,
  RefreshCw,
  Activity,
  TrendingUp,
  Settings,
  BarChart3,
  Zap
} from 'lucide-react';
import { dashboardAPI } from '../../../../services/api';
import CompactMetricBanner from './CompactMetricBanner';
import { Button } from '../../../../components/ui';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui';

const HeadTeacherDashboard = ({ learners = [], teachers = [], user, onNavigate }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState(null);

  const loadMetrics = async () => {
    try {
      setRefreshing(true);
      const response = await dashboardAPI.getAdminMetrics('term');
      if (response.success) {
        setMetrics(response.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard metrics:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const stats = {
    totalLearners: metrics?.stats?.activeStudents || learners.filter(l => l.status === 'ACTIVE').length || 0,
    totalTeachers: metrics?.stats?.activeTeachers || teachers.filter(t => t.status === 'ACTIVE').length || 0,
    presentToday: metrics?.stats?.presentToday || 0,
    totalClasses: metrics?.stats?.totalClasses || 0,
    avgAttendance: metrics?.stats?.avgAttendance ? `${Math.round(metrics.stats.avgAttendance)}%` : '85%',
    studentTrend: metrics?.stats?.studentTrend,
    teacherTrend: metrics?.stats?.teacherTrend
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Banner */}
      <CompactMetricBanner
        metrics={[
          {
            title: 'Active Learners',
            value: stats.totalLearners,
            subtitle: 'Enrolled Students',
            icon: GraduationCap,
            trend: stats.studentTrend?.startsWith('+') ? 'up' : 'down',
            trendValue: stats.studentTrend,
            onClick: () => onNavigate('learners-list')
          },
          {
            title: 'Teaching Staff',
            value: stats.totalTeachers,
            subtitle: 'Active Teachers',
            icon: Users,
            trend: stats.teacherTrend?.startsWith('+') ? 'up' : 'down',
            trendValue: stats.teacherTrend,
            onClick: () => onNavigate('teachers-list')
          },
          {
            title: 'Present Today',
            value: stats.presentToday,
            subtitle: 'Student Attendance',
            icon: UserCheck,
            trend: null,
            trendValue: null,
            onClick: () => onNavigate('attendance-daily')
          },
          {
            title: 'Classes',
            value: stats.totalClasses,
            subtitle: 'Running Streams',
            icon: BookOpen,
            trend: null,
            trendValue: null,
            onClick: () => onNavigate('facilities-classes')
          }
        ]}
        gradientFrom="from-brand-purple"
        gradientVia="via-purple-500"
        gradientTo="to-pink-500"
      />

      {/* Main Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teaching & Learning */}
        <Card className="lg:col-span-2 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-gray-200">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 bg-gradient-to-br from-brand-purple to-pink-500 rounded-lg">
                <BarChart3 size={24} className="text-white" />
              </div>
              Teaching & Learning
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'ASSESSMENT', name: 'View Assessments', desc: 'Monitor student evaluations', icon: BarChart3, color: 'brand-purple', navigate: 'assess-summative-assessment' },
                { title: 'ATTENDANCE', name: 'Daily Records', desc: 'Track attendance patterns', icon: UserCheck, color: 'brand-teal', navigate: 'attendance-daily' },
                { title: 'STUDENTS', name: 'Student List', desc: 'View all enrolled students', icon: Users, color: 'emerald', navigate: 'learners-list' },
                { title: 'STAFF', name: 'Teaching Staff', desc: 'Manage tutors and teachers', icon: GraduationCap, color: 'amber', navigate: 'teachers-list' },
                { title: 'CURRICULUM', name: 'Learning Areas', desc: 'Configure learning units', icon: BookOpen, color: 'indigo', navigate: 'assess-learning-areas' },
                { title: 'FACILITIES', name: 'Manage Classes', desc: 'Configure class streams', icon: Zap, color: 'rose', navigate: 'facilities-classes' },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => onNavigate(item.navigate)}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 group hover:shadow-lg transform hover:scale-105 active:scale-95 bg-gradient-to-br from-white to-gray-50 hover:to-${item.color}/5 border-${item.color === 'brand-purple' ? 'brand-purple/30' : item.color === 'brand-teal' ? 'brand-teal/30' : item.color}/30`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{item.title}</p>
                      <h4 className="text-sm font-black text-gray-900 group-hover:text-brand-purple transition-colors">{item.name}</h4>
                      <p className="text-xs text-gray-600 mt-1">{item.desc}</p>
                    </div>
                    <div className={`p-3 rounded-lg bg-${item.color === 'brand-purple' ? 'brand-purple' : item.color === 'brand-teal' ? 'brand-teal' : item.color}-100 group-hover:scale-110 transition-transform duration-300`}>
                      <item.icon size={20} className={`text-${item.color === 'brand-purple' ? 'brand-purple' : item.color === 'brand-teal' ? 'brand-teal' : item.color}-600`} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-amber-50 border-b border-gray-200">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg">
                <Settings size={20} className="text-white" />
              </div>
              Quick Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            <button
              onClick={() => onNavigate('comm-notices')}
              className="w-full p-4 text-left rounded-xl border-2 border-brand-purple/20 bg-gradient-to-br from-brand-purple/5 to-pink-50 hover:border-brand-purple/50 hover:bg-brand-purple/10 transition-all duration-300 group hover:shadow-md"
            >
              <p className="text-xs font-bold text-brand-purple uppercase tracking-widest">Communications</p>
              <p className="text-sm font-black text-gray-900 mt-1 group-hover:text-brand-purple">Send Notices</p>
            </button>

            <button
              onClick={() => onNavigate('assess-performance-scale')}
              className="w-full p-4 text-left rounded-xl border-2 border-brand-teal/20 bg-gradient-to-br from-brand-teal/5 to-cyan-50 hover:border-brand-teal/50 hover:bg-brand-teal/10 transition-all duration-300 group hover:shadow-md"
            >
              <p className="text-xs font-bold text-brand-teal uppercase tracking-widest">Assessment</p>
              <p className="text-sm font-black text-gray-900 mt-1 group-hover:text-brand-teal">Performance Scale</p>
            </button>

            <div className="pt-4 border-t-2 border-gray-100">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">📊 System Info</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Last Updated</span>
                    <span className="text-sm font-black text-gray-900">{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Your Role</span>
                    <span className="text-sm font-black text-brand-purple">Head Teacher</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Status</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div> Active</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HeadTeacherDashboard;
