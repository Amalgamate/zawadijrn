import React, { useState, useEffect } from 'react';
import { useNavigation } from '../../hooks/useNavigation';
import { useInstitutionLabels } from '../../../../hooks/useInstitutionLabels';
import { dashboardAPI } from '../../../../services/api';
import { cn } from '../../../../utils/cn';
import { 
    ChevronRight, 
    Zap, 
    Users, 
    BookOpen, 
    Wallet, 
    Activity, 
    ClipboardCheck,
    AlertCircle,
    TrendingUp,
    Search
} from 'lucide-react';

const PulseStatCard = ({ label, value, icon: Icon, color, loading }) => (
    <div className="flex-shrink-0 w-[140px] p-4 rounded-3xl bg-white border border-gray-100 shadow-sm flex flex-col gap-2">
        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-white", color)}>
            <Icon size={18} />
        </div>
        <div>
            {loading ? (
                <div className="h-5 w-16 bg-gray-100 animate-pulse rounded-md mb-1" />
            ) : (
                <p className="text-lg font-black text-gray-900 leading-none">{value}</p>
            )}
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">{label}</p>
        </div>
    </div>
);

const MobileDashboard = ({ onNavigate, brandingSettings, user }) => {
    const { 
        schoolSections, 
        backOfficeSections, 
        communicationSection,
        docsCenterSection,
        systemAdminSections,
        lmsSection
    } = useNavigation();
    const labels = useInstitutionLabels();
    const [metrics, setMetrics] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                setLoadingStats(true);
                let response;
                if (user?.role === 'TEACHER') {
                    response = await dashboardAPI.getTeacherMetrics();
                } else {
                    response = await dashboardAPI.getAdminMetrics('term');
                }
                if (response.success) {
                    setMetrics(response.data);
                }
            } catch (error) {
                console.error('Failed to load mobile pulse metrics:', error);
            } finally {
                setLoadingStats(false);
            }
        };
        fetchMetrics();
    }, [user?.role]);

    // ── Metrics Derivation ────────────────────────────────────────────────
    const getPulseStats = () => {
        if (user?.role === 'TEACHER') {
            return [
                { label: 'My Scholars', value: metrics?.stats?.myStudents || '0', icon: Users, color: 'bg-emerald-500' },
                { label: 'Classes Today', value: metrics?.schedule?.length || '0', icon: BookOpen, color: 'bg-blue-500' },
                { label: 'To Grade', value: metrics?.stats?.pendingTasks || '0', icon: ClipboardCheck, color: 'bg-rose-500' },
            ];
        }
        
        // Admin / Staff Default
        const stats = metrics?.stats || {};
        return [
            { label: 'Prescence', value: `${stats.presentToday || 0}`, icon: Users, color: 'bg-emerald-500' },
            { label: 'Revenue', value: `K ${Math.round((stats.feeCollected || 0) / 1000)}k`, icon: Wallet, color: 'bg-brand-purple' },
            { label: 'Risk Fees', value: `K ${Math.round((stats.feePending || 0) / 1000)}k`, icon: AlertCircle, color: 'bg-rose-500' },
            { label: 'Growth', value: stats.studentTrend || '+0%', icon: TrendingUp, color: 'bg-blue-500' },
        ];
    };

    const pulseStats = getPulseStats();

    // ── Menu Helper ───────────────────────────────────────────────────────
    const getFirstValidPath = (section) => {
        if (!section.items || section.items.length === 0) return section.id;
        for (const item of section.items) {
            if (item.type === 'group') {
                const p = (item.items || []).find(sub => !sub.comingSoon && sub.path)?.path;
                if (p) return p;
            } else if (!item.comingSoon && item.path) {
                return item.path;
            }
        }
        return section.id;
    };

    const colorMap = {
        'communications': 'bg-blue-600',
        'planner':        'bg-indigo-600',
        'learners':       'bg-emerald-600',
        'teachers':      'bg-violet-600',
        'parents':       'bg-fuchsia-600',
        'assessment':    'bg-rose-600',
        'learning-hub':  'bg-cyan-600',
        'lms':           'bg-purple-600',
        'attendance':    'bg-teal-600',
        'docs-center':   'bg-slate-700',
        'hr':            'bg-teal-600',
        'library':       'bg-orange-600',
        'transport':     'bg-sky-600',
        'finance':       'bg-green-600',
        'inventory':     'bg-red-600',
    };

    const renderMenuButton = (section) => {
        const path = getFirstValidPath(section);
        const iconBg = colorMap[section.id] || 'bg-[var(--brand-purple)]';
        
        return (
            <button
                key={section.id}
                onClick={() => onNavigate(path)}
                className="flex flex-col items-center gap-2 group outline-none"
            >
                <div className={cn(
                    "w-[72px] h-[72px] rounded-3xl flex items-center justify-center text-white transition-all duration-300",
                    "shadow-lg active:scale-95 group-hover:shadow-xl",
                    iconBg
                )}>
                    <section.icon size={28} strokeWidth={2.2} />
                </div>
                <span className="text-[11px] font-black text-gray-800 text-center leading-tight">
                    {section.label}
                </span>
            </button>
        );
    };

    return (
        <div className="pb-32 animate-in fade-in slide-in-from-bottom-5 duration-700 max-w-lg mx-auto px-1">
            {/* ── Premium Welcome Hero ────────────────────────────────────────── */}
            <div className="relative mb-8 p-8 rounded-[2.5rem] bg-[var(--brand-purple)] text-white shadow-2xl shadow-purple-200 overflow-hidden group">
                <div className="absolute right-0 top-0 w-48 h-48 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/20 transition-all duration-700" />
                <div className="absolute left-0 bottom-0 w-40 h-40 bg-brand-teal/20 rounded-full -ml-20 -mb-20 blur-3xl" />
                
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-white/20">
                            {user?.role?.replace('_', ' ')}
                        </span>
                        <div className="h-[2px] w-8 bg-brand-teal rounded-full" />
                    </div>
                    <h2 className="text-4xl font-black tracking-tighter leading-[0.9] mb-3">
                        {user?.name?.split(' ')[0] || 'Member'}
                    </h2>
                    <p className="text-sm font-bold text-white/70 tracking-tight">
                        <span className="text-white">{brandingSettings?.schoolName || 'ZAWADI JUNIOR ACADEMY'}</span> Performance Hub
                    </p>
                </div>
            </div>

            {/* ── Daily Pulse Stats Strip ────────────────────────────────────── */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-4 px-3">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-amber-50 text-amber-500 rounded-lg">
                            <Zap size={14} fill="currentColor" />
                        </div>
                        <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em]">Daily Pulse</h3>
                    </div>
                    {loadingStats && <div className="h-1 w-12 bg-gray-100 animate-pulse rounded-full" />}
                </div>
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide px-3 snap-x">
                    {pulseStats.map((stat, i) => (
                        <PulseStatCard key={i} {...stat} loading={loadingStats} />
                    ))}
                    <div className="flex-shrink-0 w-2 h-4" /> {/* Spacer */}
                </div>
            </div>

            {/* ── Main Menu Grid ────────────────────────────────────────────── */}
            <div className="space-y-12 px-2">
                <section>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-px flex-1 bg-gray-100" />
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Instructional</h4>
                        <div className="h-px flex-1 bg-gray-100" />
                    </div>
                    <div className="grid grid-cols-3 gap-y-10 gap-x-2">
                        {schoolSections.map(renderMenuButton)}
                        {lmsSection && renderMenuButton(lmsSection)}
                    </div>
                </section>

                {backOfficeSections.length > 0 && (
                    <section>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-px flex-1 bg-gray-100" />
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Management</h4>
                            <div className="h-px flex-1 bg-gray-100" />
                        </div>
                        <div className="grid grid-cols-3 gap-y-10 gap-x-2">
                            {backOfficeSections.map(renderMenuButton)}
                        </div>
                    </section>
                )}

                <section>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-px flex-1 bg-gray-100" />
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Utilities</h4>
                        <div className="h-px flex-1 bg-gray-100" />
                    </div>
                    <div className="grid grid-cols-3 gap-y-10 gap-x-2">
                        {communicationSection && renderMenuButton(communicationSection)}
                        {docsCenterSection   && renderMenuButton(docsCenterSection)}
                        {systemAdminSections.map(renderMenuButton)}
                    </div>
                </section>
            </div>

            {/* ── Footer Link ───────────────────────────────────────────────── */}
            <div className="mt-12 mb-8">
                <button 
                    onClick={() => onNavigate('dashboard')}
                    className="w-full p-5 bg-gray-50/50 backdrop-blur-sm border border-gray-100 rounded-[2rem] flex items-center justify-between group active:scale-95 transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[var(--brand-purple)] shadow-sm group-hover:rotate-[-90deg] transition-transform">
                            <LayoutGrid size={22} />
                        </div>
                        <div className="text-left">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">Switch View</p>
                            <p className="text-sm font-black text-gray-900 tracking-tight">Desktop-Grade Analytics</p>
                        </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-300 group-hover:text-[var(--brand-purple)] group-hover:translate-x-1 transition-all" />
                </button>
            </div>
        </div>
    );
};

export default MobileDashboard;
